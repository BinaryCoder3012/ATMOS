import os
import argparse
import glob
import random
import subprocess
import torch
import numpy as np
from PIL import Image

# Add the workspace path so we can import modules
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.mobilefacenet import MobileFaceNet

def export_pipeline(checkpoint_path, dataset_dir, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    onnx_path = os.path.join(output_dir, 'mobilefacenet.onnx')
    tf_saved_model_dir = os.path.join(output_dir, 'mobilefacenet_tf')
    tflite_output_path = os.path.join(output_dir, 'mobilefacenet_int8.tflite')
    
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    
    # 1. Load trained PyTorch checkpoint
    print(f"Loading checkpoint from {checkpoint_path}...")
    checkpoint = torch.load(checkpoint_path, map_location=device)
    embedding_size = checkpoint.get('embedding_size', 128)
    
    model = MobileFaceNet(embedding_size=embedding_size)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    
    # 2. Export to ONNX (NCHW layout)
    print("Exporting PyTorch model to ONNX...")
    dummy_input = torch.randn(1, 3, 112, 112, device='cpu')
    torch.onnx.export(
        model.to('cpu'),
        dummy_input,
        onnx_path,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}},
        opset_version=12
    )
    print(f"ONNX model saved to {onnx_path}")
    
    # 3. Convert ONNX to TF SavedModel with NHWC layout conversion
    # We use `onnx2tf` which is the industry standard for converting ONNX layout correctly to NHWC
    print("Converting ONNX layout to TensorFlow SavedModel (NHWC)...")
    try:
        # Run onnx2tf command
        # This translates NCHW input [1, 3, 112, 112] to NHWC input [1, 112, 112, 3] and cleans up transpose layers
        subprocess.run([
            "onnx2tf",
            "-i", onnx_path,
            "-o", tf_saved_model_dir,
            "-nonc"  # Keep input/output name mapping clean
        ], check=True)
        print(f"TensorFlow SavedModel created at {tf_saved_model_dir}")
    except Exception as e:
        print(f"Error running onnx2tf: {e}")
        print("\n[BLOCKER DIAGNOSIS] Make sure you have installed the required python packages:")
        print("    pip install onnx2tf onnx tensorflow-cpu sglib\n")
        sys.exit(1)
        
    # 4. TFLite INT8 Quantization using Representative Calibration Dataset
    print("Compiling TFLite model with INT8 quantization...")
    import tensorflow as tf
    
    # Locate validation images to use as calibration data.
    val_dir = os.path.join(dataset_dir, 'validation')
    if not os.path.exists(val_dir):
        val_dir = os.path.join(dataset_dir, 'val')

    validation_images = glob.glob(os.path.join(val_dir, '**', '*.jpg'), recursive=True)
    validation_images += glob.glob(os.path.join(val_dir, '**', '*.png'), recursive=True)
    
    if len(validation_images) == 0:
        print(f"Warning: No calibration images found in {val_dir}. Using random calibration data.")
        
    def representative_data_gen():
        # Select 100 random images for calibration
        num_calib = min(100, len(validation_images))
        if num_calib > 0:
            calib_paths = random.sample(validation_images, num_calib)
            for img_path in calib_paths:
                try:
                    img = Image.open(img_path).convert('RGB')
                    img = img.resize((112, 112))
                    img_array = np.array(img).astype(np.float32)
                    
                    # Normalize to [-1.0, 1.0] matching preprocessor normalization
                    img_array = (img_array - 127.5) / 128.0
                    
                    # Add batch dimension [1, 112, 112, 3]
                    img_array = np.expand_dims(img_array, axis=0)
                    yield [img_array]
                except Exception as e:
                    print(f"Error preprocessing image {img_path}: {e}")
                    continue
        else:
            # Fallback random generator
            for _ in range(100):
                yield [np.random.uniform(-1.0, 1.0, (1, 112, 112, 3)).astype(np.float32)]
                
    # Initialize TensorFlow Lite Converter
    converter = tf.lite.TFLiteConverter.from_saved_model(tf_saved_model_dir)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.representative_dataset = representative_data_gen
    
    # Enforce FULL integer quantization
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
    # Keep input/output as float32 in TFLite wrapper so React Native code can pass float inputs/outputs directly,
    # but run actual inference operations internally using INT8 execution.
    converter.inference_input_type = tf.float32
    converter.inference_output_type = tf.float32
    
    print("Converting and quantizing to TFLite (INT8)...")
    try:
        tflite_model = converter.convert()
        with open(tflite_output_path, 'wb') as f:
            f.write(tflite_model)
        print(f"\n================ EXPORT SUCCESS ================")
        print(f"Quantized TFLite model: {tflite_output_path}")
        print(f"Model size: {os.path.getsize(tflite_output_path) / (1024*1024):.2f} MB")
        print("================================================\n")
    except Exception as e:
        print(f"Error during TFLite conversion: {e}")
        sys.exit(1)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Export PyTorch MobileFaceNet checkpoint to quantized TFLite.")
    parser.add_argument('--checkpoint', type=str, default='ml/training/best_mobilefacenet.pth', help='Path to best PyTorch model checkpoint (.pth)')
    parser.add_argument('--dataset_dir', type=str, default='ml/datasets/indian_face_dataset', help='Path to dataset directory')
    parser.add_argument('--output_dir', type=str, default='ml/exports', help='Directory to save output files')
    
    args = parser.parse_args()
    
    checkpoint_path = os.path.abspath(args.checkpoint)
    dataset_path = os.path.abspath(args.dataset_dir)
    output_path = os.path.abspath(args.output_dir)
    
    if not os.path.exists(checkpoint_path):
        print(f"Error: Checkpoint file '{checkpoint_path}' does not exist. Train the model first.")
        sys.exit(1)
        
    export_pipeline(
        checkpoint_path=checkpoint_path,
        dataset_dir=dataset_path,
        output_dir=output_path
    )
