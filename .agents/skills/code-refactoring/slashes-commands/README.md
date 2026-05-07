# Code Refactoring Slash Commands

**Quick-access commands for the code-refactoring skill.**

These slash commands provide instant access to file watching, scanning, and alert checking functionality.

---

## 💻 Cross-Platform Compatibility

These slash commands work on **all platforms** (Windows, macOS, Linux). The underlying scripts automatically detect your operating system:

- **Windows:** Uses `.bat` batch scripts
- **macOS/Linux:** Uses `.sh` shell scripts
- **Universal:** Some scripts use Node.js (works everywhere)

**You don't need to worry about which script to use** - the slash commands handle this automatically!

---

## 📦 Installation

### Important: Global Skill vs Project-Level Slash Commands

**The code-refactoring skill is GLOBAL:**

- ✅ Installed ONCE in `~/.claude/plugins/marketplaces/custom-skills/code-refactoring/` (global)
- ✅ Works across ALL your projects automatically
- ❌ Do NOT copy the skill folder to individual projects

**Slash commands are PROJECT-LEVEL:**

- ✅ Copied to individual projects in `.claude/commands/` (per-project)
- ✅ Each project can choose which commands to install
- ✅ Commands point to the GLOBAL skill location

**Prerequisites:**

- Skill installed in `~/.claude/plugins/marketplaces/custom-skills/code-refactoring/` (global)
- Node.js dependencies installed: `cd ~/.claude/plugins/.../scripts && npm install`
- If skill installed elsewhere, edit the script paths in the command files

Copy these command files to your project's `.claude/commands/` directory:

### Core Commands (Recommended)

```bash
# Copy core commands to your project
cp slashes-commands/start-watcher.md .claude/commands/
cp slashes-commands/stop-watcher.md .claude/commands/
cp slashes-commands/scan-code-size.md .claude/commands/
```

**Note:** These commands use `~/.claude/plugins/marketplaces/custom-skills/code-refactoring/` as the skill location. This works cross-platform with Claude Code's Bash tool (Git Bash on Windows, native bash on macOS/Linux).

### Optional Commands

```bash
# Optional: Check alerts manually (skill auto-checks alerts when invoked)
cp slashes-commands/check-refactor-alerts.md .claude/commands/
```

**Note:** `/check-refactor-alerts` is **optional** because:

- The code-refactoring skill automatically checks alerts when invoked
- The `/start-watcher` command also checks alerts automatically
- You only need this if you want to manually check alerts outside the skill workflow

---

## 📋 Available Commands

### `/start-watcher`

**Purpose:** Start background file watcher to monitor code file sizes in real-time

**What it does:**

- Auto-detects your `src/` directory
- Scans all code files and shows initial report
- Starts background monitoring
- Alerts you when editing files that exceed size thresholds
- Offers to help refactor problematic files immediately or later

**Use when:** Starting a coding session where you want automatic refactoring alerts

---

### `/stop-watcher`

**Purpose:** Stop the background file watcher

**What it does:**

- Stops the background file watcher process
- Cross-platform (works on Windows, Mac, Linux)

**Use when:** Done coding and want to stop background monitoring

---

### `/scan-code-size`

**Purpose:** One-time scan for oversized files (no background monitoring)

**What it does:**

- Scans your codebase for files exceeding size thresholds
- Saves detailed report with timestamp
- Shows summary of critical/alert/warning files
- Does NOT start background watcher

**Use when:**

- You want a quick assessment without background monitoring
- Auditing legacy/inherited codebase
- Planning a refactoring sprint

---

### `/check-refactor-alerts` (Optional)

**Purpose:** Manually check file watcher alerts

**What it does:**

- Reads unread alerts from background watcher
- Shows files that exceeded thresholds since last check
- Offers refactoring options

**Use when:**

- You want to manually check alerts outside the skill workflow
- Catching up on alerts before starting work

**Note:** This is **optional** because the code-refactoring skill and `/start-watcher` automatically check alerts.

---

## 🔄 Typical Workflow

### Option 1: Background Monitoring (Recommended)

```
1. /start-watcher          → Start monitoring
2. [Edit code normally]    → Watcher alerts if files get too large
3. [See alert in chat]     → Choose to refactor now or later
4. /stop-watcher           → Stop when done
```

### Option 2: One-Time Scan

```
1. /scan-code-size         → Get report of current state
2. [Review report]         → See what needs refactoring
3. [Ask for help]          → "Help me refactor Component.tsx"
```

### Option 3: Manual Alert Checking (If installed)

```
1. /start-watcher          → Start monitoring
2. [Edit code for a while] → Watcher runs in background
3. /check-refactor-alerts  → Check accumulated alerts
4. [Choose action]         → Refactor now/review/dismiss
```

---

## 📂 File Structure

```
slashes-commands/
├── README.md                      # This file
├── start-watcher.md              # Core: Start background watcher
├── stop-watcher.md               # Core: Stop watcher
├── scan-code-size.md             # Core: One-time scan
└── check-refactor-alerts.md      # Optional: Manual alert check
```

---

## 🎯 Installation Recommendations

**Install these 3 core commands:**

- ✅ `/start-watcher` - Essential for background monitoring
- ✅ `/stop-watcher` - Essential to stop monitoring
- ✅ `/scan-code-size` - Useful for quick audits

**Optionally install:**

- ⚠️ `/check-refactor-alerts` - Only if you want manual alert checking
  - Skill auto-checks alerts, so this is redundant for most workflows
  - Useful if you prefer explicit control over alert checking

---

## 🔗 Related Resources

- **[SKILL.md](../SKILL.md)** - Main code-refactoring skill documentation
- **[REFERENCE.md](../REFERENCE.md)** - Detailed refactoring patterns and procedures
- **[FORMS.md](../FORMS.md)** - Templates and checklists
- **[scripts/](../scripts/)** - Background scripts used by these commands

---

## 🙏 Attribution

**Created by:** Madina Gbotoe
**Portfolio:** [https://madinagbotoe.com/](https://madinagbotoe.com/)
**GitHub:** [https://github.com/mgbotoe/claude-code-share](https://github.com/mgbotoe/claude-code-share)
**License:** Creative Commons Attribution 4.0 International (CC BY 4.0)

---

**Last Updated:** October 30, 2025
**Commands:** 4 (3 core + 1 optional)
