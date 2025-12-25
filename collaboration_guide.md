# Collaboration Guide for CISA MCQ Project

The project is now hosted at: **[https://github.com/nw48mbvhh9-cyber/CISA-MCQ](https://github.com/nw48mbvhh9-cyber/CISA-MCQ)**

To allow others to work on this code, follow these steps:

## 1. Invite Team Members
1.  Go to your repository settings: [Settings > Collaborators](https://github.com/nw48mbvhh9-cyber/CISA-MCQ/settings/access)
2.  Click **"Add people"**.
3.  Enter their GitHub username or email address and select them.
4.  They will receive an email invitation to accept.

## 2. Share the Setup Instructions
Send the following instructions to your new team members so they can get the code:

---
**How to join the project:**

1.  **Install Git**: [Download here](https://git-scm.com/downloads) if you don't have it.
2.  **Open Terminal/Command Prompt** (or Git Bash) in the folder where you keep your projects.
3.  **Clone the repository**:
    ```bash
    git clone https://github.com/nw48mbvhh9-cyber/CISA-MCQ.git
    cd CISA-MCQ
    ```
4.  **Install Dependencies** (if needed):
    ```bash
    npm install  # for Backend/Frontend if applicable
    pip install -r requirements.txt # for Python backend
    ```
---

## 3. Your Daily Workflow (To avoid outdated code)
To ensure you are always working on the latest version, run this **every time** before you start working:

```bash
git pull origin main
```

If you see usage of `git push`, remember to `git pull` first!
