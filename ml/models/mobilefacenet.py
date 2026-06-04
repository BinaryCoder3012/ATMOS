import math
import torch
import torch.nn as nn
import torch.nn.functional as F

class Conv_block(nn.Module):
    def __init__(self, in_c, out_c, kernel=(1, 1), stride=(1, 1), padding=(0, 0), groups=1):
        super(Conv_block, self).__init__()
        self.conv = nn.Conv2d(in_c, out_channels=out_c, kernel_size=kernel, groups=groups, stride=stride, padding=padding, bias=False)
        self.bn = nn.BatchNorm2d(out_c)
        self.prelu = nn.PReLU(out_c)
        
    def forward(self, x):
        return self.prelu(self.bn(self.conv(x)))

class Linear_block(nn.Module):
    def __init__(self, in_c, out_c, kernel=(1, 1), stride=(1, 1), padding=(0, 0), groups=1):
        super(Linear_block, self).__init__()
        self.conv = nn.Conv2d(in_c, out_channels=out_c, kernel_size=kernel, groups=groups, stride=stride, padding=padding, bias=False)
        self.bn = nn.BatchNorm2d(out_c)
        
    def forward(self, x):
        return self.bn(self.conv(x))

class Depthwise_conv_block(nn.Module):
    def __init__(self, in_c, out_c, kernel=(1, 1), stride=(1, 1), padding=(0, 0), groups=1):
        super(Depthwise_conv_block, self).__init__()
        self.conv = nn.Conv2d(in_c, out_channels=out_c, kernel_size=kernel, groups=groups, stride=stride, padding=padding, bias=False)
        self.bn = nn.BatchNorm2d(out_c)
        self.prelu = nn.PReLU(out_c)
        
    def forward(self, x):
        return self.prelu(self.bn(self.conv(x)))

class Bottleneck(nn.Module):
    def __init__(self, in_c, out_c, stride, expansion):
        super(Bottleneck, self).__init__()
        self.connect = stride == 1 and in_c == out_c
        mid_c = in_c * expansion
        
        self.conv = nn.Sequential(
            Conv_block(in_c, mid_c, kernel=(1, 1)),
            Depthwise_conv_block(mid_c, mid_c, kernel=(3, 3), stride=stride, padding=(1, 1), groups=mid_c),
            Linear_block(mid_c, out_c, kernel=(1, 1))
        )
        
    def forward(self, x):
        if self.connect:
            return x + self.conv(x)
        else:
            return self.conv(x)

class MobileFaceNet(nn.Module):
    def __init__(self, embedding_size=128):
        super(MobileFaceNet, self).__init__()
        self.conv1 = Conv_block(3, 64, kernel=(3, 3), stride=(2, 2), padding=(1, 1))
        self.conv2_dw = Conv_block(64, 64, kernel=(3, 3), stride=(1, 1), padding=(1, 1), groups=64)
        
        # Bottleneck sequences matching paper parameters
        self.conv_3 = self._make_layer(64, 64, n=5, stride=2, expansion=2)
        self.conv_4 = self._make_layer(64, 128, n=1, stride=2, expansion=4)
        self.conv_5 = self._make_layer(128, 128, n=6, stride=1, expansion=2)
        self.conv_6 = self._make_layer(128, 128, n=1, stride=2, expansion=4)
        self.conv_7 = self._make_layer(128, 128, n=2, stride=1, expansion=2)
        
        self.conv_8 = Conv_block(128, 512, kernel=(1, 1))
        # Global Depthwise Convolution (GDConv)
        self.gdconv = Linear_block(512, 512, kernel=(7, 7), groups=512)
        
        # Embedding projection
        self.linear = nn.Linear(512, embedding_size)
        self.bn = nn.BatchNorm1d(embedding_size)
        
    def _make_layer(self, in_c, out_c, n, stride, expansion):
        layers = []
        layers.append(Bottleneck(in_c, out_c, stride, expansion))
        for _ in range(1, n):
            layers.append(Bottleneck(out_c, out_c, 1, expansion))
        return nn.Sequential(*layers)
        
    def forward(self, x):
        x = self.conv1(x)
        x = self.conv2_dw(x)
        x = self.conv_3(x)
        x = self.conv_4(x)
        x = self.conv_5(x)
        x = self.conv_6(x)
        x = self.conv_7(x)
        x = self.conv_8(x)
        x = self.gdconv(x)
        x = x.view(x.size(0), -1)
        x = self.linear(x)
        x = self.bn(x)
        return x

class ArcMarginProduct(nn.Module):
    """
    ArcFace (Additive Angular Margin Loss) layer.
    Forces representations of the same class to be closer and different classes to be further apart.
    """
    def __init__(self, in_features, out_features, s=30.0, m=0.50, easy_margin=False):
        super(ArcMarginProduct, self).__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.s = s
        self.m = m
        self.weight = nn.Parameter(torch.FloatTensor(out_features, in_features))
        nn.init.xavier_uniform_(self.weight)

        self.easy_margin = easy_margin
        self.cos_m = math.cos(m)
        self.sin_m = math.sin(m)
        self.th = math.cos(math.pi - m)
        self.mm = math.sin(math.pi - m) * m

    def forward(self, input, label):
        # cos(theta) & phi(theta)
        cosine = F.linear(F.normalize(input), F.normalize(self.weight))
        sine = torch.sqrt(1.0 - torch.pow(cosine, 2)).clamp(0, 1)
        phi = cosine * self.cos_m - sine * self.sin_m
        
        if self.easy_margin:
            phi = torch.where(cosine > 0, phi, cosine)
        else:
            phi = torch.where(cosine > self.th, phi, cosine - self.mm)
            
        one_hot = torch.zeros(cosine.size(), device=input.device)
        one_hot.scatter_(1, label.view(-1, 1).long(), 1)
        
        output = (one_hot * phi) + ((1.0 - one_hot) * cosine)
        output *= self.s
        return output
