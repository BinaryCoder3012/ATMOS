# Contributing to A.T.M.O.S

Welcome! We are excited to build **A.T.M.O.S** (Autonomous Telemetry & Mobile Offline Sync) together. To keep development smooth, fast, and organized, here is a quick summary of how to contribute:

---

## 🛠️ Local Development Setup

1. **Clone the Repository:**
   ```sh
   git clone https://github.com/BinaryCoder3012/ATMOS.git
   cd ATMOS/DataLake3FaceAuth
   ```
2. **Install Dependencies:**
   ```sh
   npm install
   ```
3. **Environment Setup:** Ensure your local environment variables (`ANDROID_HOME`, `JAVA_HOME`) are pointing to your Android SDK and JDK paths.

---

## 🌿 Branching & Commits

* **Branches:** Always create a feature or bugfix branch for your work (e.g., `feat/liveness-checks` or `fix/camera-crash`). Do not push directly to the `main` branch.
* **Commit Messages:** Write clear, descriptive commits. We recommend standard formats like `feat(auth): ...` or `fix(camera): ...` to keep the history clean.

---

## 💎 Code Quality

* **Formatting:** Run `npm run lint` before committing to format the codebase and check for style issues.
* **Types:** Use TypeScript properly. Avoid using `any` to keep type safety strong across all components.

---

## 🚀 Submission Process

1. Keep your branch updated with `main`.
2. Push your branch to the remote repository.
3. Open a Pull Request (PR) against `main`, and provide a quick description of the changes you made.
