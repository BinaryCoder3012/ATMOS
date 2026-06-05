# A.T.M.O.S (Autonomous Telemetry & Mobile Offline Sync)
> **Offline-First Facial Authentication & Telemetry Sync System**
>
> 🚀 Built for **Hackathon 7.0** • 🔒 Secured by On-Device ML • 📶 100% Offline-First Architecture

---

## 👁️ Project Overview

**A.T.M.O.S** (Autonomous Telemetry & Mobile Offline Sync) is a state-of-the-art, high-performance **React Native** application designed to perform high-security facial authentication and liveness validation in zero-connectivity field environments. By performing deep learning inference entirely on-device, **A.T.M.O.S** ensures field personnel can log attendance, verify identity, and record telemetry data with absolute data sovereignty and lightning-fast speed.

All telemetry and logs are stored locally using high-performance **MMKV** storage and automatically synchronized to a centralized database (DataLake 3.0 API) once a network connection is successfully re-established.

---

## ✨ Key Features

*   **🔒 On-Device Facial Inference:** Performs local neural network inference in `<150ms` using optimized quantized TensorFlow Lite (TFLite) models.
*   **👁️ Active 3D Liveness Detection:** Employs real-time facial landmark tracking to detect dynamic micro-expressions (blink detection, smile checks) to prevent spoofing/photo attacks.
*   **📶 Resilient Mobile Offline Sync:** Uses an offline-first transactional queue built on MMKV, ensuring complete operational autonomy in remote locations without network access.
*   **⚡ Zero-Latency Camera Stream:** Leverages low-latency frame processors via `react-native-vision-camera` and `react-native-worklets-core` for seamless frame-by-frame analysis.
*   **📋 Comprehensive Telemetry Audit logs:** Locally buffers telemetry snapshots containing authentication scores, device battery/network health, geolocation parameters, and network status logs.
*   **🎨 Premium Glassmorphic UI:** Features a high-fidelity dark-mode interface with smooth animations, dynamic visual guides, and real-time state simulators.

---

## 🛠️ Technology Stack

| Component | Technology / Library | Description |
| :--- | :--- | :--- |
| **Core Framework** | React Native 0.85.3 (React 19.2.3) | Next-generation hybrid mobile engine |
| **Native Bridge** | Nitro Modules | Ultra-fast JSI communication layers |
| **ML Inference** | `react-native-fast-tflite@3.0.1` | Direct JSI binding for TensorFlow Lite models |
| **Camera Interface** | `react-native-vision-camera@4.7.3` | High-fps frame capture & native camera api |
| **Worklets** | `react-native-worklets-core@1.6.3` | Multi-threaded JS execution for frame analysis |
| **State & Anim** | `react-native-reanimated@4.4.0` | 60 FPS UI/UX animations and gestures |
| **Local Cache** | `react-native-mmkv@4.3.1` | Ultra-fast local key-value store |
| **Type Safety** | TypeScript 5.8.3 | Strict compiler checks and interface safety |

---

## 🤖 Neural Network Models

**A.T.M.O.S** relies on two carefully-pruned, quantized models loaded dynamically on first launch:

1.  **Face Landmark Predictor (`face_landmark.tflite`):**
    *   **Input Resolution:** $256 \times 256$ pixels (RGB)
    *   **Output:** Coordinates for 468 3D facial landmarks.
    *   **Purpose:** Tracks eye aspect ratio (EAR) for blink liveness detection and mouth coordinates for smile liveness verification.
2.  **Face Embedding Extractor (`mobilefacenet_int8.tflite`):**
    *   **Input Resolution:** $112 \times 112$ pixels (RGB)
    *   **Output:** 128-dimensional floating-point vector (face embedding).
    *   **Purpose:** Computes similarity scores using Cosine Similarity against cached baseline employee templates.

---

## 📁 Repository Directory Structure

```
c:\Users\laksh\Desktop\ATMOS\DataLake3FaceAuth
├── android/                   # Native Android application configuration & source code
├── ios/                       # Native iOS application configuration & source code
├── models/                    # Baseline TFLite model storage
├── src/
│   ├── assets/                # Local fonts, vectors, static images
│   ├── components/            # Reusable UI controls (CustomButtons, CameraViewers)
│   ├── hooks/                 # Custom React hooks (useOfflineSync, useLiveness)
│   ├── ml/                    # FaceMesh and Embedding JSI wrappers
│   ├── screens/               # Screen definitions:
│   │   ├── SplashScreen.tsx   # Loading and Model Validation screen
│   │   ├── HomeScreen.tsx     # Dashboard & System State Overview
│   │   ├── AuthenticateScreen.tsx # Live/Simulated Face Auth pipeline
│   │   ├── RegisterEmployeeScreen.tsx # Multi-pose Employee Registration
│   │   ├── AttendanceLogScreen.tsx # Offline telemetry audit log viewer
│   │   └── SettingsScreen.tsx # API gateway config & MMKV database wipes
│   └── storage/               # Global state management using MMKV keys
├── ui-preview.html            # Complete, high-fidelity interactive browser simulator
└── package.json               # JavaScript dependencies and scripts
```

---

## ⚙️ Development Environment Setup

### Prerequisites

*   **Node.js:** `v22.11.0` or higher (tested on `v24.15.0`)
*   **Android SDK:** Build Tools version `34.0.0` or `35.0.0`
*   **JDK/JBR:** Java 17 (recommended to use the JDK bundled in Android Studio)

### Environment Variables

Before launching the app, duplicate `.env.example` to `.env` and adjust variables accordingly:

```env
API_BASE_URL=https://api.atmos.dev/v3
AUTHENTICATION_THRESHOLD=0.85
SYNC_INTERVAL_MS=30000
LIVENESS_DETECTION_ENABLED=true
LOCAL_ENCRYPTION_KEY=atmos_secret_3.0_key
```

### Windows & Android Development Setup

On Windows machines, environment variables must be precisely configured to locate dependencies correctly. Set these variables in PowerShell or your System Environment settings:

```powershell
# Set Android SDK Location
$env:ANDROID_HOME="C:\Users\laksh\AppData\Local\Android\Sdk"

# Set Android Studio's bundled JDK/JBR path (Mandatory for Gradle)
$env:JAVA_HOME="C:\Program Files\Android\Android Studio1\jbr"

# Append platform tools and JBR binary folders to System Path
$env:Path+=";C:\Program Files\Android\Android Studio1\jbr\bin;$env:ANDROID_HOME\platform-tools"
```

---

## 🚀 Running the Project

Follow these steps to run the application on a local emulator or connected device:

### 1. Install Dependencies
```sh
npm install
```

### 2. Launch the Metro Bundler
Start the development server with a clean cache to avoid JSI linking issues:
```sh
npm start -- --reset-cache
```

### 3. Build & Deploy the App
Start your emulator (e.g., Pixel 8 via Android Studio Device Manager) and deploy in a separate command terminal with the required Java context:

```powershell
# Ensure Java environment is loaded in the terminal tab
$env:JAVA_HOME="C:\Program Files\Android\Android Studio1\jbr"

# Run Android build
npm run android
```

---

## 🧪 Simulation & Preview (Browser Preview)

For testing and rapid UI review without booting up a heavy Android Emulator, a high-fidelity **interactive HTML/JS preview** is included. It simulates the camera pipeline, TFLite inferences, and sync workflows.

*   To open the simulator, double-click or view [ui-preview.html](file:///c:/Users/laksh/Desktop/ATMOS/DataLake3FaceAuth/ui-preview.html) in your browser.
*   **Features:** Live toggle, smile/blink simulation controls, real-time logs dashboard, and mock server telemetry synchronization.

---

## 🤝 Contribution Guidelines

This repository is built to support contributions from multiple engineers. If you are submitting changes:

1.  **Read the Contribution Guide:** See [CONTRIBUTING.md](file:///c:/Users/laksh/Desktop/ATMOS/DataLake3FaceAuth/CONTRIBUTING.md) for details on commit conventions and branching.
2.  **Linting & Style:** Ensure your changes adhere to rules defined in `.prettierrc.js` and `.eslintrc.js`. Run `npm run lint` before committing.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](file:///c:/Users/laksh/Desktop/ATMOS/DataLake3FaceAuth/LICENSE) file for details.
