# Contributing to A.T.M.O.S

Welcome! We are thrilled that you are interested in contributing to **A.T.M.O.S** (Autonomous Telemetry & Mobile Offline Sync). As a multi-contributor project, maintaining code quality, consistent styling, and a clean Git history is essential for our velocity.

Please take a few moments to review these guidelines before getting started.

---

## 🛠️ Local Development Setup

To make sure your environment matches the active development baseline:

1.  **Clone the Repository:**
    ```sh
    git clone https://github.com/BinaryCoder3012/ATMOS.git
    cd ATMOS/DataLake3FaceAuth
    ```
2.  **Install Node Modules:**
    ```sh
    npm install
    ```
3.  **Configure System Environment Variables:**
    *   **On Windows (PowerShell):**
        ```powershell
        $env:ANDROID_HOME="C:\Users\laksh\AppData\Local\Android\Sdk"
        $env:JAVA_HOME="C:\Program Files\Android\Android Studio1\jbr"
        $env:Path+=";C:\Program Files\Android\Android Studio1\jbr\bin;$env:ANDROID_HOME\platform-tools"
        ```
    *   **On macOS/Linux:**
        ```sh
        export ANDROID_HOME=$HOME/Library/Android/sdk
        export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
        export PATH=$PATH:$ANDROID_HOME/platform-tools:$JAVA_HOME/bin
        ```

---

## 🌿 Git Branching Strategy

We use a feature branch workflow. All direct developments must occur on isolated feature branches before merging:

*   **Main Branch (`main`):** Production-ready, stable builds. Never push directly to `main`.
*   **Feature Branches (`feat/...` or `feature/...`):** New feature implementations.
*   **Bugfix Branches (`fix/...` or `bugfix/...`):** Resolves native or JS-level compilation/runtime bugs.
*   **Docs Branches (`docs/...`):** Changes to project documentation, setup manuals, or markdown files.

---

## 📝 Commit Message Guidelines

We follow **Conventional Commits** specifications. Commit messages must be formatted as:

```
<type>(<scope>): <short summary description>

[Optional longer body explanation]
```

### Commit Types

*   `feat`: A new feature (e.g. `feat(auth): add smile liveness gesture validation`)
*   `fix`: A bug fix (e.g. `fix(camera): resolve vision-camera native crash on resume`)
*   `docs`: Documentation updates (e.g. `docs(readme): add contributor setup instructions`)
*   `style`: Code styling adjustments (whitespace, formatting, semi-colons)
*   `refactor`: Code changes that neither fix a bug nor add a feature
*   `test`: Adding or modifying automated test suites
*   `chore`: Package maintenance, configuration edits, or build process adjustments

---

## 💎 Code Quality & Formatting

*   **Linting:** We enforce standard code configurations through ESLint. Check code formatting prior to committing by running:
    ```sh
    npm run lint
    ```
*   **Prettier:** Auto-format code using `.prettierrc.js` settings to avoid merge conflicts from varying IDE settings.
*   **TypeScript:** All newly created components or files MUST have appropriate TypeScript interfaces and type definitions. Avoid using `any` type definitions.

---

## 🚀 Submission Process

1.  Create your development branch: `git checkout -b feat/my-new-feature`
2.  Implement your changes and run local verification tests.
3.  Format and lint your code: `npm run lint`
4.  Commit your work using conventional commit messages: `git commit -m "feat(telemetry): append location coords to local MMKV buffer"`
5.  Push changes to your fork or remote branch: `git push origin feat/my-new-feature`
6.  Open a **Pull Request (PR)** against the `main` branch. Provide a comprehensive summary of modifications and a screenshot/walkthrough if there are UI-level updates.
