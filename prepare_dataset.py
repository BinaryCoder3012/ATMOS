#UPDATE THIS DEPENDING ON DATASET + IF RUNNING LOCALLY/COLAB
import os
import shutil
import random

SOURCE = r"imfdb_raw/IMFDB FR dataset/IMFDB FR dataset"
OUTPUT = r"dataset"
SPLIT = 0.8
MIN_IMAGES = 5

random.seed(42)

train_count = 0
val_count = 0
skipped = 0

for person in os.listdir(SOURCE):
    person_path = os.path.join(SOURCE, person)
    if not os.path.isdir(person_path):
        continue

    images = [f for f in os.listdir(person_path)
              if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

    if len(images) < MIN_IMAGES:
        skipped += 1
        continue

    random.shuffle(images)
    split_idx = int(len(images) * SPLIT)
    train_imgs = images[:split_idx]
    val_imgs = images[split_idx:]

    for img in train_imgs:
        dst_dir = os.path.join(OUTPUT, "train", person)
        os.makedirs(dst_dir, exist_ok=True)
        shutil.copy(os.path.join(person_path, img), os.path.join(dst_dir, img))
        train_count += 1

    for img in val_imgs:
        dst_dir = os.path.join(OUTPUT, "val", person)
        os.makedirs(dst_dir, exist_ok=True)
        shutil.copy(os.path.join(person_path, img), os.path.join(dst_dir, img))
        val_count += 1

print(f"Done. Train: {train_count} images | Val: {val_count} images | Skipped (too few images): {skipped} identities")
