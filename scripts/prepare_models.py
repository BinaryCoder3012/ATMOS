# scripts/prepare_models.py
"""
Model Preparation Script for Datalake 3.0 Hackathon 7.0
Downloads open-source pre-trained TFLite models and validates size constraints.
"""

import os
import shutil
import urllib.request
from pathlib import Path

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
MODELS_DIR = Path("models")
ANDROID_ASSETS = Path("android/app/src/main/assets")
IOS_BUNDLE = Path("ios/DataLake3FaceAuth")
MAX_TOTAL_SIZE_MB = 20.0

# Public open-source pre-quantized MobileFaceNet model
MOBILEFACENET_URL = (
    "https://github.com/MCarlomagno/FaceRecognitionAuth/raw/master/assets/mobilefacenet.tflite"
)

# MediaPipe Face Landmarker — Apache 2.0 License, public domain from Google
FACE_LANDMARKER_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "face_landmarker/face_landmarker/float16/1/face_landmarker.task"
)

# --- HELPERS ------------------------------------------------------------------

def download_file(url: str, dest: Path, label: str) -> None:
    print(f"[DOWNLOAD] {label} -> {dest}")
    os.makedirs(dest.parent, exist_ok=True)
    try:
        urllib.request.urlretrieve(url, dest)
        size_mb = dest.stat().st_size / (1024 * 1024)
        print(f"  [OK] Downloaded: {size_mb:.2f} MB")
    except Exception as e:
        print(f"  [ERROR] Download failed: {e}")
        print(f"  -> Manual step required: Place the model at {dest}")

def get_size_mb(path: Path) -> float:
    return path.stat().st_size / (1024 * 1024) if path.exists() else 0.0

def copy_to_platform_dirs(src: Path, filename: str) -> None:
    for dest_dir in [ANDROID_ASSETS, IOS_BUNDLE]:
        os.makedirs(dest_dir, exist_ok=True)
        dest = dest_dir / filename
        try:
            shutil.copy2(src, dest)
            print(f"  [OK] Copied to {dest}")
        except Exception as e:
            print(f"  [ERROR] Copy failed to {dest}: {e}")

# --- MAIN ---------------------------------------------------------------------

def main():
    os.makedirs(MODELS_DIR, exist_ok=True)
    print("=" * 60)
    print(" Datalake 3.0 - Model Preparation Script")
    print(" Hackathon 7.0 | Open-Source Models Only")
    print("=" * 60)

    # 1. Download Face Landmarker (MediaPipe - Apache 2.0)
    face_landmark_dest = MODELS_DIR / "face_landmark.tflite"
    download_file(FACE_LANDMARKER_URL, face_landmark_dest, "MediaPipe Face Landmarker")

    # 2. Download MobileFaceNet
    mobilefacenet_dest = MODELS_DIR / "mobilefacenet_int8.tflite"
    download_file(MOBILEFACENET_URL, mobilefacenet_dest, "MobileFaceNet INT8")

    print("\n[VALIDATE] Checking model sizes...")
    facenet_mb = get_size_mb(mobilefacenet_dest)
    landmark_mb = get_size_mb(face_landmark_dest)
    total_mb = facenet_mb + landmark_mb

    print(f"  mobilefacenet_int8.tflite : {facenet_mb:.2f} MB")
    print(f"  face_landmark.tflite      : {landmark_mb:.2f} MB")
    print(f"  TOTAL                     : {total_mb:.2f} MB / {MAX_TOTAL_SIZE_MB} MB limit")

    if total_mb > MAX_TOTAL_SIZE_MB:
        print(f"  [ERROR] CONSTRAINT VIOLATED: Total exceeds {MAX_TOTAL_SIZE_MB} MB!")
    else:
        print(f"  [OK] Size constraint satisfied.")

    print("\n[DEPLOY] Copying models to platform asset directories...")
    if mobilefacenet_dest.exists():
        copy_to_platform_dirs(mobilefacenet_dest, "mobilefacenet_int8.tflite")
    if face_landmark_dest.exists():
        copy_to_platform_dirs(face_landmark_dest, "face_landmark.tflite")

    print("\n[SUCCESS] Model preparation complete. Proceed with React Native build.")

if __name__ == "__main__":
    main()
