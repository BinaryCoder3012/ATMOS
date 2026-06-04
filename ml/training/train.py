import os
import argparse
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingLR

# Add the workspace path so we can import modules
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.mobilefacenet import MobileFaceNet, ArcMarginProduct
from datasets.preprocess import get_dataloaders

def train_model(
    dataset_dir,
    pretrained_checkpoint=None,
    epochs=20,
    batch_size=64,
    lr=0.001,
    embedding_size=128,
    device='cuda',
    weight_decay=1e-4,
    arcface_margin=0.35,
    checkpoint_dir=None,
    save_latest=True,
    save_optimizer=False,
    balanced_sampling=True,
    num_workers=4
):
    print(f"Using device: {device}")
    
    # 1. Load data loaders
    print("Loading datasets...")
    train_loader, val_loader, num_classes = get_dataloaders(
        dataset_dir,
        batch_size=batch_size,
        num_workers=num_workers,
        balanced_train=balanced_sampling
    )
    print(f"Dataset loaded. Number of identities (classes): {num_classes}")
    print(f"Training samples: {len(train_loader.dataset)}, Validation samples: {len(val_loader.dataset)}")
    if balanced_sampling:
        print("Balanced identity sampling enabled for training.")

    # 2. Instantiate Model and ArcFace Layer
    model = MobileFaceNet(embedding_size=embedding_size).to(device)
    metric_fc = ArcMarginProduct(in_features=embedding_size, out_features=num_classes, s=30.0, m=arcface_margin).to(device)

    # Load pretrained checkpoint if provided
    if pretrained_checkpoint and os.path.exists(pretrained_checkpoint):
        print(f"Loading pretrained weights from {pretrained_checkpoint}")
        checkpoint = torch.load(pretrained_checkpoint, map_location=device, weights_only=False)
        model.load_state_dict(checkpoint['model_state_dict'])
        print(f"Loaded checkpoint from epoch {checkpoint.get('epoch', '?')} with embedding size {checkpoint.get('embedding_size', '?')}")
    else:
        print("No pretrained checkpoint found, training from scratch.")
    
    # 3. Loss, Optimizer and Scheduler
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW([
        {'params': model.parameters()},
        {'params': metric_fc.parameters()}
    ], lr=lr, weight_decay=weight_decay)
    
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs)

    best_acc = 0.0
    
    # Directory to save checkpoints
    if checkpoint_dir is None:
        checkpoint_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(checkpoint_dir, exist_ok=True)
    print(f"Checkpoints will be written to: {checkpoint_dir}")
    
    # 4. Training Loop
    for epoch in range(1, epochs + 1):
        model.train()
        metric_fc.train()
        train_loss = 0.0
        correct = 0
        total = 0
        current_lr = scheduler.get_last_lr()[0]
        print(f"Epoch [{epoch}/{epochs}] LR: {current_lr:.6f}")
        
        for batch_idx, (inputs, targets) in enumerate(train_loader):
            inputs, targets = inputs.to(device), targets.to(device)
            
            optimizer.zero_grad()
            
            # Extract 128-d embeddings
            embeddings = model(inputs)
            # Pass through ArcFace to get classification logits
            outputs = metric_fc(embeddings, targets)
            
            loss = criterion(outputs, targets)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(list(model.parameters()) + list(metric_fc.parameters()), max_norm=5.0)
            optimizer.step()
            
            train_loss += loss.item() * targets.size(0)
            classification_outputs = F.linear(
                F.normalize(embeddings),
                F.normalize(metric_fc.weight)
            ) * metric_fc.s
            _, predicted = classification_outputs.max(1)
            total += targets.size(0)
            correct += predicted.eq(targets).sum().item()
            
            if (batch_idx + 1) % 10 == 0 or (batch_idx + 1) == len(train_loader):
                print(f"Epoch [{epoch}/{epochs}] Batch [{batch_idx+1}/{len(train_loader)}] "
                      f"Loss: {loss.item():.4f} | Train Acc: {100.0 * correct / total:.2f}%")
                
        train_loss /= len(train_loader.dataset)
        train_acc = 100.0 * correct / total
        
        # 5. Validation Loop
        model.eval()
        metric_fc.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs, targets = inputs.to(device), targets.to(device)
                
                embeddings = model(inputs)
                outputs = metric_fc(embeddings, targets)
                
                loss = criterion(outputs, targets)
                val_loss += loss.item() * targets.size(0)
                
                classification_outputs = F.linear(
                    F.normalize(embeddings),
                    F.normalize(metric_fc.weight)
                ) * metric_fc.s
                _, predicted = classification_outputs.max(1)
                val_total += targets.size(0)
                val_correct += predicted.eq(targets).sum().item()
                
        val_loss /= len(val_loader.dataset)
        val_acc = 100.0 * val_correct / val_total
        
        scheduler.step()
        
        print(f"--- Epoch {epoch} Summary: Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}% | "
              f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}% ---")
        
        if val_acc > best_acc:
            best_acc = val_acc
            best_checkpoint_path = os.path.join(checkpoint_dir, 'best_mobilefacenet.pth')
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'num_classes': num_classes,
                'embedding_size': embedding_size
            }, best_checkpoint_path)
            print(f"==> Saved new best model checkpoint to {best_checkpoint_path} with Val Acc: {best_acc:.2f}%")

        # Save checkpoints. latest_checkpoint.pth is overwritten instead of accumulating per-epoch files.
        latest_state = {
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'metric_fc_state_dict': metric_fc.state_dict(),
            'num_classes': num_classes,
            'embedding_size': embedding_size,
            'best_acc': best_acc
        }
        if save_optimizer:
            latest_state['optimizer_state_dict'] = optimizer.state_dict()
            latest_state['scheduler_state_dict'] = scheduler.state_dict()

        if save_latest:
            checkpoint_path = os.path.join(checkpoint_dir, 'latest_checkpoint.pth')
            torch.save(latest_state, checkpoint_path)

    print(f"Training completed! Best Validation Accuracy: {best_acc:.2f}%")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Train MobileFaceNet on custom dataset.")
    parser.add_argument('--dataset_dir', type=str, default='ml/datasets/indian_face_dataset', help='Path to dataset directory')
    parser.add_argument('--epochs', type=int, default=20, help='Number of epochs to train')
    parser.add_argument('--batch_size', type=int, default=64, help='Batch size for training')
    parser.add_argument('--lr', type=float, default=0.001, help='Learning rate')
    parser.add_argument('--embedding_size', type=int, default=128, help='Output embedding size')
    parser.add_argument('--weight_decay', type=float, default=1e-4, help='AdamW weight decay')
    parser.add_argument('--arcface_margin', type=float, default=0.35, help='ArcFace angular margin')
    parser.add_argument('--checkpoint_dir', type=str, default=None, help='Directory for checkpoint files')
    parser.add_argument('--pretrained_checkpoint', type=str, default=None, help='Path to pretrained checkpoint for fine-tuning')
    parser.add_argument('--num_workers', type=int, default=4, help='DataLoader worker processes')
    parser.add_argument('--no_balanced_sampling', action='store_true', help='Disable balanced identity sampling')
    parser.add_argument('--no_save_latest', action='store_true', help='Only save best_mobilefacenet.pth')
    parser.add_argument('--save_optimizer', action='store_true', help='Include optimizer/scheduler state in latest checkpoint')
    
    args = parser.parse_args()
    
    # Run training
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    
    # Resolve relative path if needed
    dataset_path = os.path.abspath(args.dataset_dir)
    
    train_model(
        dataset_dir=dataset_path,
        pretrained_checkpoint=args.pretrained_checkpoint,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        embedding_size=args.embedding_size,
        device=device,
        weight_decay=args.weight_decay,
        arcface_margin=args.arcface_margin,
        checkpoint_dir=os.path.abspath(args.checkpoint_dir) if args.checkpoint_dir else None,
        save_latest=not args.no_save_latest,
        save_optimizer=args.save_optimizer,
        balanced_sampling=not args.no_balanced_sampling,
        num_workers=args.num_workers
    )
