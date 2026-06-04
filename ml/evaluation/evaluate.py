import os
import argparse
import random
import torch
import numpy as np
import torch.nn.functional as F

# Add the workspace path so we can import modules
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.mobilefacenet import MobileFaceNet
from datasets.preprocess import get_dataloaders

def evaluate_verification(checkpoint_path, dataset_dir, num_pairs=5000, device='cuda'):
    print(f"Loading checkpoint from {checkpoint_path}...")
    checkpoint = torch.load(checkpoint_path, map_location=device)
    
    embedding_size = checkpoint.get('embedding_size', 128)
    
    # Initialize model
    model = MobileFaceNet(embedding_size=embedding_size).to(device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    print("Model loaded successfully.")
    
    # Load val loader
    _, val_loader, _ = get_dataloaders(dataset_dir, batch_size=32, num_workers=2)
    
    # Extract all embeddings and labels
    print("Extracting validation embeddings...")
    all_embeddings = []
    all_labels = []
    
    with torch.no_grad():
        for inputs, targets in val_loader:
            inputs = inputs.to(device)
            # Forward pass to get 128-d embedding
            embeddings = model(inputs)
            # L2 normalize embeddings for cosine similarity evaluation
            embeddings = F.normalize(embeddings, p=2, dim=1)
            
            all_embeddings.append(embeddings.cpu().numpy())
            all_labels.extend(targets.numpy())
            
    all_embeddings = np.concatenate(all_embeddings, axis=0)
    all_labels = np.array(all_labels)
    
    num_samples = len(all_labels)
    print(f"Extracted {num_samples} embeddings across {len(np.unique(all_labels))} classes.")
    
    # Generate verification pairs (Same-person / Different-person)
    print("Generating validation pairs...")
    same_pairs = []
    diff_pairs = []
    
    # Group indices by class label
    class_indices = {}
    for idx, label in enumerate(all_labels):
        if label not in class_indices:
            class_indices[label] = []
        class_indices[label].append(idx)
        
    classes = list(class_indices.keys())
    
    # 1. Generate Genuine Pairs (Same identity)
    for label, indices in class_indices.items():
        if len(indices) < 2:
            continue
        # Generate pairs of indices within the same identity
        for i in range(len(indices)):
            for j in range(i + 1, len(indices)):
                same_pairs.append((indices[i], indices[j]))
                
    # 2. Generate Impostor Pairs (Different identity)
    # Pick random indices of different classes
    while len(diff_pairs) < len(same_pairs):
        idx1 = random.randint(0, num_samples - 1)
        idx2 = random.randint(0, num_samples - 1)
        if all_labels[idx1] != all_labels[idx2]:
            diff_pairs.append((idx1, idx2))
            
    # Sample a subset of pairs if there are too many
    max_pairs = min(num_pairs, len(same_pairs))
    same_pairs = random.sample(same_pairs, max_pairs)
    diff_pairs = random.sample(diff_pairs, max_pairs)
    
    print(f"Testing on {max_pairs} genuine pairs and {max_pairs} impostor pairs (Total: {max_pairs * 2} pairs)")
    
    # Calculate Cosine Similarities for all pairs
    similarities = []
    labels = []  # 1 for same, 0 for different
    
    # Genuine similarities
    for idx1, idx2 in same_pairs:
        emb1 = all_embeddings[idx1]
        emb2 = all_embeddings[idx2]
        # Cosine similarity of L2-normalized vectors is just dot product
        sim = np.dot(emb1, emb2)
        similarities.append(sim)
        labels.append(1)
        
    # Impostor similarities
    for idx1, idx2 in diff_pairs:
        emb1 = all_embeddings[idx1]
        emb2 = all_embeddings[idx2]
        sim = np.dot(emb1, emb2)
        similarities.append(sim)
        labels.append(0)
        
    similarities = np.array(similarities)
    labels = np.array(labels)
    
    # Search for optimal threshold
    best_acc = 0.0
    best_threshold = 0.0
    
    thresholds = np.arange(-1.0, 1.0, 0.01)
    for threshold in thresholds:
        predictions = (similarities >= threshold).astype(int)
        acc = np.mean(predictions == labels)
        if acc > best_acc:
            best_acc = acc
            best_threshold = threshold
            
    # Evaluate FAR and FRR at the best threshold
    predictions = (similarities >= best_threshold).astype(int)
    
    # Genuine pairs: indices where labels == 1
    # False Rejection Rate (FRR) = (predictions == 0 & labels == 1) / total labels == 1
    frr = np.sum((predictions == 0) & (labels == 1)) / np.sum(labels == 1)
    
    # Impostor pairs: indices where labels == 0
    # False Acceptance Rate (FAR) = (predictions == 1 & labels == 0) / total labels == 0
    far = np.sum((predictions == 1) & (labels == 0)) / np.sum(labels == 0)
    
    print("\n================ EVALUATION SUMMARY ================")
    print(f"Optimal Cosine Similarity Threshold: {best_threshold:.4f}")
    print(f"Best Verification Accuracy:          {best_acc * 100.0:.2f}%")
    print(f"False Acceptance Rate (FAR):        {far * 100.0:.2f}%")
    print(f"False Rejection Rate (FRR):         {frr * 100.0:.2f}%")
    print("====================================================\n")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Evaluate face verification performance.")
    parser.add_argument('--checkpoint', type=str, default='ml/training/best_mobilefacenet.pth', help='Path to trained checkpoint (.pth)')
    parser.add_argument('--dataset_dir', type=str, default='ml/datasets/indian_face_dataset', help='Path to dataset directory')
    parser.add_argument('--num_pairs', type=int, default=5000, help='Max verification pairs to sample')
    
    args = parser.parse_args()
    
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    
    checkpoint_path = os.path.abspath(args.checkpoint)
    dataset_path = os.path.abspath(args.dataset_dir)
    
    if not os.path.exists(checkpoint_path):
        print(f"Error: Checkpoint file '{checkpoint_path}' does not exist. Run training first.")
        sys.exit(1)
        
    evaluate_verification(
        checkpoint_path=checkpoint_path,
        dataset_dir=dataset_path,
        num_pairs=args.num_pairs,
        device=device
    )
