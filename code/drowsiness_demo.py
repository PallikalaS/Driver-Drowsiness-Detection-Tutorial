"""
Driver drowsiness demo: Eye Aspect Ratio, PERCLOS, and yawn detection from a webcam.

Companion code for "Detecting Driver Drowsiness with Computer Vision", Section 11.

Requirements:  Python 3.9 or newer
               pip install opencv-python mediapipe numpy
Run:           python drowsiness_demo.py
Keys:          Esc = quit,  C = recalibrate

On the first run the script downloads MediaPipe's face landmark model (about 4 MB)
and saves it next to this file.
"""
import os
import time
import urllib.request
from collections import deque

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision

# ---------------------------------------------------------------- landmarks
# MediaPipe face landmark indices, ordered p1..p6 as in the EAR formula (Section 3)
RIGHT_EYE = [33, 160, 158, 133, 153, 144]
LEFT_EYE = [362, 385, 387, 263, 373, 380]
MOUTH = [61, 81, 311, 291, 402, 178]          # mouth corners and inner lips (Section 4)

# ---------------------------------------------------------------- settings
CALIBRATION_SECONDS = 5.0   # time to measure this driver's normal open-eye EAR
EAR_RATIO = 0.75            # eyes "closed" below 75% of the driver's baseline (Section 10)
CLOSED_SECONDS = 0.5        # eyes closed this long -> wake-up alarm (Section 3)
MAR_THRESHOLD = 0.6         # mouth opening that counts toward a yawn (Section 4)
YAWN_SECONDS = 1.5          # opening must last this long to count as a yawn
YAWN_WINDOW = 600.0         # count yawns over the last 10 minutes
YAWN_WARN = 3               # yawns in the window -> "take a break"
PERCLOS_WINDOW = 60.0       # seconds of history for PERCLOS (Section 3)
PERCLOS_WARN = 15.0         # percent -> "take a break"

MODEL_URL = ("https://storage.googleapis.com/mediapipe-models/face_landmarker/"
             "face_landmarker/float16/1/face_landmarker.task")
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "face_landmarker.task")

GREEN, ORANGE, RED, WHITE = (80, 200, 120), (0, 165, 255), (60, 60, 230), (255, 255, 255)


def aspect_ratio(pts):
    """EAR / MAR: (|p2-p6| + |p3-p5|) / (2 * |p1-p4|) for six points p1..p6."""
    p1, p2, p3, p4, p5, p6 = pts
    vertical = np.linalg.norm(p2 - p6) + np.linalg.norm(p3 - p5)
    horizontal = np.linalg.norm(p1 - p4)
    return vertical / (2.0 * horizontal) if horizontal > 0 else 0.0


def load_landmarker():
    if not os.path.exists(MODEL_PATH):
        print("Downloading the face landmark model...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    options = vision.FaceLandmarkerOptions(
        base_options=mp_tasks.BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=vision.RunningMode.VIDEO,
        num_faces=1,
    )
    return vision.FaceLandmarker.create_from_options(options)


def draw_text(frame, text, y, color=WHITE, scale=0.6):
    cv2.putText(frame, text, (12, y), cv2.FONT_HERSHEY_SIMPLEX, scale, (0, 0, 0), 4, cv2.LINE_AA)
    cv2.putText(frame, text, (12, y), cv2.FONT_HERSHEY_SIMPLEX, scale, color, 1, cv2.LINE_AA)


def main():
    landmarker = load_landmarker()
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise SystemExit("Could not open the webcam.")

    t0 = time.time()                 # clock for MediaPipe timestamps (must only increase)
    calib_start = t0                 # clock for calibration (restarts on C)
    calib_values, baseline = [], None
    closed_since = mouth_open_since = None
    eye_history = deque()          # (time, eyes at least 80% closed?) for PERCLOS
    yawn_times = deque()
    last_beep = 0.0

    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frame = cv2.flip(frame, 1)                       # mirror view feels natural
        h, w = frame.shape[:2]
        now = time.time()

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)     # MediaPipe expects RGB
        image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = landmarker.detect_for_video(image, int((now - t0) * 1000))

        status, color = "No face detected", ORANGE
        if result.face_landmarks:
            lm = result.face_landmarks[0]

            def points(ids):                             # normalized -> pixel coordinates
                return np.array([(lm[i].x * w, lm[i].y * h) for i in ids])

            ear = (aspect_ratio(points(RIGHT_EYE)) + aspect_ratio(points(LEFT_EYE))) / 2.0
            mar = aspect_ratio(points(MOUTH))
            for x, y in np.vstack([points(RIGHT_EYE), points(LEFT_EYE)]):
                cv2.circle(frame, (int(x), int(y)), 2, GREEN, -1)

            if baseline is None:
                # ---- calibration: record this driver's normal open-eye EAR
                calib_values.append(ear)
                remaining = CALIBRATION_SECONDS - (now - calib_start)
                status = f"Calibrating: look ahead, eyes open ({max(remaining, 0):.0f}s)"
                if remaining <= 0 and len(calib_values) >= 10:
                    baseline = float(np.median(calib_values))   # median ignores blinks
            else:
                threshold = EAR_RATIO * baseline

                # ---- long eye closure (consecutive time below threshold)
                if ear < threshold:
                    closed_since = closed_since or now
                else:
                    closed_since = None
                closed_for = now - closed_since if closed_since else 0.0

                # ---- PERCLOS (P80): share of recent frames with eyes >= 80% closed
                eye_history.append((now, ear <= 0.2 * baseline))
                while eye_history and now - eye_history[0][0] > PERCLOS_WINDOW:
                    eye_history.popleft()
                perclos = 100.0 * sum(c for _, c in eye_history) / len(eye_history)
                perclos_ready = now - eye_history[0][0] > 10.0   # need 10 s of history

                # ---- yawns: mouth wide open for long enough
                if mar > MAR_THRESHOLD:
                    mouth_open_since = mouth_open_since or now
                else:
                    if mouth_open_since and now - mouth_open_since >= YAWN_SECONDS:
                        yawn_times.append(now)
                    mouth_open_since = None
                while yawn_times and now - yawn_times[0] > YAWN_WINDOW:
                    yawn_times.popleft()

                # ---- graded decision (Section 10)
                if closed_for >= CLOSED_SECONDS:
                    status, color = f"WAKE UP! Eyes closed {closed_for:.1f}s", RED
                    if now - last_beep > 0.5:
                        print("\a", end="", flush=True)        # terminal bell
                        last_beep = now
                elif (perclos_ready and perclos >= PERCLOS_WARN) or len(yawn_times) >= YAWN_WARN:
                    status, color = "Drowsiness building: take a break", ORANGE
                else:
                    status, color = "Alert", GREEN

                draw_text(frame, f"EAR {ear:.3f}  (threshold {threshold:.3f}, baseline {baseline:.3f})", h - 64)
                draw_text(frame, f"PERCLOS {perclos:.1f}%" + ("" if perclos_ready else " (warming up)"), h - 40)
                draw_text(frame, f"MAR {mar:.2f}   yawns in last 10 min: {len(yawn_times)}", h - 16)

        cv2.rectangle(frame, (0, 0), (w, 44), (30, 30, 30), -1)
        draw_text(frame, status, 30, color, 0.8)
        cv2.imshow("Driver drowsiness demo (Esc to quit, C to recalibrate)", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == 27:                                     # Esc
            break
        if key in (ord("c"), ord("C")):                   # recalibrate
            calib_start, calib_values, baseline = now, [], None
            closed_since = mouth_open_since = None
            eye_history.clear()
            yawn_times.clear()

    cap.release()
    cv2.destroyAllWindows()
    landmarker.close()


if __name__ == "__main__":
    main()
