import os
import torch
from torch.utils.data import DataLoader, Subset, WeightedRandomSampler
from torchvision import datasets, transforms

# Custom Dataset Wrapper to apply transforms to subsets
class TransformedSubset(torch.utils.data.Dataset):
    def __init__(self, subset, transform=None):
        self.subset = subset
        self.transform = transform
        
    def __getitem__(self, index):
        x, y = self.subset[index]
        if self.transform:
            x = self.transform(x)
        return x, y
        
    def __len__(self):
        return len(self.subset)

def get_dataloaders(dataset_dir, batch_size=64, num_workers=4, balanced_train=True):
    """
    Creates PyTorch DataLoaders for training and validation.
    
    If the dataset_dir contains 'train' and 'val' subfolders, it loads them directly.
    Otherwise, it dynamically splits the dataset in an 80-20 stratified split.
    """
    # MobileFaceNet expects 112x112 inputs.
    # Normalization: pixel = (pixel - 127.5) / 128.0.
    # Since torchvision ToTensor() scales pixels to [0.0, 1.0], we use:
    # mean = 127.5 / 255.0 = 0.5
    # std = 128.0 / 255.0 = 0.50196078
    mean = [0.5, 0.5, 0.5]
    std = [128.0 / 255.0, 128.0 / 255.0, 128.0 / 255.0]

    train_transform = transforms.Compose([
        transforms.Resize((112, 112)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.4, contrast=0.4, saturation=0.3, hue=0.1),
        transforms.RandomGrayscale(p=0.05),
        transforms.RandomAdjustSharpness(sharpness_factor=2, p=0.3),
        transforms.ToTensor(),
        transforms.Normalize(mean=mean, std=std)
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((112, 112)),
        transforms.ToTensor(),
        transforms.Normalize(mean=mean, std=std)
    ])

    # Check for pre-split dataset folders
    train_dir = os.path.join(dataset_dir, 'train')
    val_dir = os.path.join(dataset_dir, 'val')
    
    if not os.path.exists(val_dir):
        val_dir = os.path.join(dataset_dir, 'validation')
    if not os.path.exists(val_dir):
        val_dir = os.path.join(dataset_dir, 'test')

    if os.path.exists(train_dir) and os.path.exists(val_dir):
        # Case 1: Dataset is pre-split
        train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
        val_dataset = datasets.ImageFolder(val_dir, transform=val_transform)
        num_classes = len(train_dataset.classes)
    else:
        # Case 2: Single directory dataset. We split dynamically using stratified random split.
        full_dataset = datasets.ImageFolder(dataset_dir)
        num_classes = len(full_dataset.classes)
        
        targets = full_dataset.targets
        
        # Group indices by class label
        class_indices = {}
        for idx, target in enumerate(targets):
            if target not in class_indices:
                class_indices[target] = []
            class_indices[target].append(idx)
            
        train_indices = []
        val_indices = []
        
        # Split 80% train, 20% validation for each class
        for class_id, indices in class_indices.items():
            n_samples = len(indices)
            if n_samples >= 2:
                n_val = max(1, int(n_samples * 0.2))
                shuffled_indices = torch.randperm(n_samples).tolist()
                
                class_val_indices = [indices[i] for i in shuffled_indices[:n_val]]
                class_train_indices = [indices[i] for i in shuffled_indices[n_val:]]
                
                train_indices.extend(class_train_indices)
                val_indices.extend(class_val_indices)
            else:
                train_indices.extend(indices)
                
        base_train_subset = Subset(full_dataset, train_indices)
        base_val_subset = Subset(full_dataset, val_indices)
        
        train_dataset = TransformedSubset(base_train_subset, train_transform)
        val_dataset = TransformedSubset(base_val_subset, val_transform)

    # Set up balanced identity sampler if requested
    sampler = None
    if balanced_train and len(train_dataset) > 0:
        if isinstance(train_dataset, datasets.ImageFolder):
            train_targets = train_dataset.targets
        else:
            train_targets = [full_dataset.targets[i] for i in train_indices]
            
        # Count samples per class to calculate weights
        class_counts = {}
        for target in train_targets:
            class_counts[target] = class_counts.get(target, 0) + 1
            
        class_weights = {class_id: 1.0 / count for class_id, count in class_counts.items()}
        sample_weights = [class_weights[target] for target in train_targets]
        
        sampler = WeightedRandomSampler(
            weights=sample_weights,
            num_samples=len(sample_weights),
            replacement=True
        )

    # DataLoaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=(sampler is None),
        sampler=sampler,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available()
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available()
    )
    
    return train_loader, val_loader, num_classes
