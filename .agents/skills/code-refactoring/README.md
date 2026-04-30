# Code Refactoring Skill

**A comprehensive, language-agnostic refactoring skill for Claude Code that proactively prevents code complexity.**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](CHANGELOG.md) [![License](https://img.shields.io/badge/license-CC%20BY%204.0-green.svg)](https://creativecommons.org/licenses/by/4.0/)

---

## ⚡ TL;DR - Quick Summary

**What:** AI-powered code complexity prevention with real-time monitoring
**How:** Background file watcher + intelligent path-based thresholds + auto-execution
**When:** Automatically triggers before editing large files (>200 lines)
**Languages:** JavaScript/TypeScript/React, Python, and general patterns
**Install:** `cd ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts && npm install`

**🚀 Get started in 2 minutes:** [Jump to Quick Start](#-quick-start)

---

## 📋 What This Skill Does

This skill helps you maintain clean, maintainable code by:

1. **Proactively monitoring** file sizes before you edit them
2. **Alerting you during creation** when files are getting too large
3. **Suggesting refactoring plans** after reading large files
4. **Detecting complexity patterns** automatically (data extraction, hook extraction, class splitting, etc.)
5. **Supporting multiple languages** (JavaScript/TypeScript/React, Python, and general patterns)
6. **✨ EXECUTING refactoring automatically** (NEW!) - with your approval, step-by-step with rollback support

---

## 🎯 Key Features

### Automatic Triggering

The skill automatically invokes when:

- You're about to edit a file >200 lines
- A file reaches 150 lines during creation
- You read a file >300 lines
- Complexity patterns are detected (4+ hooks, large classes, nested logic)

### 🎯 Path-Based Thresholds (NEW in v2.0!)

Context-aware file size limits based on file purpose:

- **Pages** (`page.tsx`): 300/500/800 lines - Educational content allowed
- **Data files** (`data/**/*.tsx`): 250/400/600 lines - Mostly static content
- **Components** (`components/**/*.tsx`): 150/200/300 lines - Standard threshold
- **Utilities** (`lib/**/*.ts`, `utils/**/*.ts`): 100/150/200 lines - Strict (should be small)
- **API routes** (`api/**/*.ts`): 100/150/250 lines - Thin controller preferred

### Multi-Language Support

- **JavaScript/TypeScript/React**: Component splitting, hook extraction, data files
- **Python**: Class/module splitting, function extraction, configuration management
- **General**: Universal patterns that work across all languages

### Progressive Alerts

- **150-200 lines**: ⚠️ Warning - consider extraction
- **200-300 lines**: 🚨 Alert - should refactor before adding more
- **300+ lines**: 🛑 Critical - must refactor before proceeding

### Real-Time Background Monitoring

- File watcher runs continuously in background
- Desktop notifications for threshold violations
- Automatic alert checking in Claude Code chat
- Cross-platform support (Windows/macOS/Linux)

### Automated Execution with Safety

- Step-by-step refactoring with your approval
- Incremental git commits after each step
- Automatic testing (lint, type-check, tests)
- Rollback on any failure
- Backup commit for safety

---

## 🌍 Global Skill - Works Across ALL Projects

**This is a GLOBAL skill, not a project-level skill:**

- ✅ **Install once** in `~/.claude/plugins/marketplaces/custom-skills/code-refactoring/`
- ✅ **Works across all your projects** automatically
- ✅ **Monitors any codebase** you're working on
- ✅ **Slash commands** (optional) are copied to individual projects as needed

**You do NOT need to:**

- ❌ Install this skill in every project
- ❌ Copy the skill folder to your project directory
- ❌ Configure it per project (unless using optional auto-start feature)

**Typical setup:**

1. Install skill ONCE to `~/.claude/plugins/marketplaces/custom-skills/` (global)
2. (Optional) Copy slash commands to any project where you want quick access
3. The skill automatically works in ALL projects when invoked by Claude

**Visual representation:**

```
~/.claude/plugins/marketplaces/custom-skills/code-refactoring/  ← GLOBAL (install once)
    ├── SKILL.md                    ← Used by ALL projects
    ├── scripts/                    ← Used by ALL projects
    └── slashes-commands/           ← Source files (copy to projects)

/your-project-1/.claude/commands/   ← PROJECT-LEVEL (optional)
    ├── start-watcher.md            ← Copied from global skill
    └── stop-watcher.md             ← Points to global scripts

/your-project-2/.claude/commands/   ← PROJECT-LEVEL (optional)
    ├── start-watcher.md            ← Copied from global skill
    └── scan-code-size.md           ← Points to global scripts

Both projects use the SAME global skill!
```

---

## 🚀 Quick Start

### Installation (One-Time Global Setup)

**This is a GLOBAL skill - install it ONCE and use across ALL projects:**

**1. Install the skill to your global Claude plugins directory**

The skill should be installed at:

```
~/.claude/plugins/marketplaces/custom-skills/code-refactoring/
```

**2. Install Node.js dependencies** (required for file watcher):

```bash
# Navigate to scripts directory (GLOBAL location)
cd ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts

# Install dependencies once (downloads ~6 MB to scripts/node_modules/)
npm install
```

**What happens:**

- npm reads `scripts/package.json` to see what packages are needed
- Downloads `node-notifier` and its dependencies
- Creates `scripts/node_modules/` folder (~6 MB) in the GLOBAL skill location
- You'll see: `added 9 packages` when complete

**3. (Optional) Install slash commands to specific projects**

Slash commands are PROJECT-LEVEL shortcuts:

```bash
# In each project where you want slash commands:
cd /path/to/your-project

# Copy slash commands to project
cp ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/slashes-commands/*.md .claude/commands/
```

**Now the skill works in ALL projects, and slash commands work in projects where you installed them!**

**Why node_modules isn't in the repository:**

- Too large (6 MB) to include in git
- You generate it locally with `npm install`
- Standard practice for all Node.js projects

**That's it!** The skill will now work with all features enabled.

---

## ✅ Verify Installation (2-Minute Test)

**Test that everything is working correctly:**

### Quick Verification Test

**Step 1: Test the skill auto-invokes**

Open Claude Code and create a test file:

```bash
# Create a large test file (300 lines)
for i in {1..300}; do echo "// Line $i" >> test-large-file.js; done
```

Ask Claude to edit it:

```
"Add a comment to test-large-file.js"
```

**Expected Result:**

- ✅ Claude should invoke the code-refactoring skill
- ✅ You should see: "🛑 test-large-file.js is 300 lines"
- ✅ Skill suggests refactoring before editing

**Step 2: Test slash commands (if installed)**

```bash
/start-watcher
```

**Expected Result:**

- ✅ Shows scan results for your current directory
- ✅ Asks if you want to refactor now or later
- ✅ No errors about missing scripts or dependencies

**Step 3: Verify file watcher**

Edit a large file and save it.

**Expected Result:**

- ✅ Desktop notification appears: "File exceeds size threshold"
- ✅ Check alerts: `/check-refactor-alerts` shows the alert

**If all tests pass:** ✅ Installation successful!

**If any test fails:** See "Common Issues" section below.

---

## 💻 Platform Support

**This skill works on all major platforms:**

| Platform    | Supported | Script Type  | Notes                                        |
| ----------- | --------- | ------------ | -------------------------------------------- |
| **Windows** | ✅ Yes    | `.bat` files | Native batch scripts, double-click supported |
| **macOS**   | ✅ Yes    | `.sh` files  | Bash shell scripts, requires `chmod +x`      |
| **Linux**   | ✅ Yes    | `.sh` files  | Bash shell scripts, requires `chmod +x`      |
| **WSL**     | ✅ Yes    | `.sh` files  | Windows Subsystem for Linux                  |
| **Node.js** | ✅ Yes    | `.js` files  | Universal (works on any OS with Node.js)     |

**Installation requirements:**

- **All platforms:** Claude Code installed
- **For file watcher features:** Node.js v14+ (see installation steps below)

**Cleanup unused platform files:**

Users can safely delete platform-specific files they don't need:

```bash
# Windows users can delete Unix/Linux files:
rm scripts/*.sh

# macOS/Linux users can delete Windows files:
rm scripts/*.bat

# Keep these files (required):
# - scripts/*.js (Node.js - works everywhere)
# - scripts/package.json
# - scripts/package-lock.json
```

**Note:** The `.js` (Node.js) scripts work on all platforms, so `.bat` and `.sh` files are optional convenience wrappers for command-line use.

**Important:** If you delete platform files:

- Most slash commands use `.js` files and will continue working
- `/stop-watcher` slash command references both `.bat` and `.sh` - you may need to manually run the correct one for your platform if you delete files
- Alternatively, keep all files (they're small) or use `node scripts/*.js` directly

**Installation steps:**

<details>
<summary><b>📦 Step 1: Install Node.js Dependencies (Required for File Watcher)</b></summary>

The file watcher requires Node.js packages to be installed:

**Windows:**

```batch
cd %USERPROFILE%\.claude\plugins\marketplaces\custom-skills\code-refactoring\scripts
npm install
```

**macOS/Linux:**

```bash
cd ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts
npm install
```

**What this does:**

- Downloads `node-notifier` package (for desktop notifications)
- Creates `scripts/node_modules/` folder (~6 MB) in the same directory as `package.json`
- Installs 9 total packages (node-notifier + its dependencies)
- Enables background file watcher features

**Where the files go:**

```
scripts/
├── package.json        ← Already in repository (tells npm what to install)
├── package-lock.json   ← Already in repository (locks exact versions)
└── node_modules/       ← CREATED HERE by npm install (~6 MB)
    ├── node-notifier/
    ├── growly/
    └── [7 other packages]
```

**Important notes:**

- ✅ `node_modules/` is **not** included in this repository (too large - 6 MB)
- ✅ You create it locally by running `npm install`
- ✅ The `.gitignore` file prevents it from being committed to git
- ✅ **You only need to do this once** - packages remain installed unless you delete `scripts/node_modules/`
- ✅ Every user installs their own local copy (standard Node.js practice)

</details>

---

**Quick start by platform:**

<details>
<summary><b>🪟 Windows Users</b></summary>

Use `.bat` files:

```batch
# Start file watcher
C:\Users\YourName\.claude\plugins\marketplaces\custom-skills\code-refactoring\scripts\start-watcher.bat

# Stop file watcher
C:\Users\YourName\.claude\plugins\marketplaces\custom-skills\code-refactoring\scripts\stop-watcher.bat

# Check file sizes
C:\Users\YourName\.claude\plugins\marketplaces\custom-skills\code-refactoring\scripts\check-size.sh "src\components\*.tsx"
```

Or use slash commands in Claude Code:

```
/start-watcher
/stop-watcher
/scan-code-size
```

</details>

<details>
<summary><b>🍎 macOS / 🐧 Linux Users</b></summary>

**First time setup** (make scripts executable):

```bash
cd ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts
chmod +x *.sh
```

**Then use `.sh` files:**

```bash
# Start file watcher
~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/start-watcher.sh

# Stop file watcher
~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/stop-watcher.sh

# Check file sizes
~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/check-size.sh src/components/*.tsx
```

Or use slash commands in Claude Code:

```
/start-watcher
/stop-watcher
/scan-code-size
```

</details>

<details>
<summary><b>🌐 Universal (Node.js)</b></summary>

If you have Node.js installed, these work on **any platform**:

```bash
# Auto-start (universal)
node ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/auto-start-watcher.js

# Interactive start
node ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/start-watcher-interactive.js

# Check alerts
node ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/check-alerts.js
```

</details>

---

## 📁 Skill Structure

<details>
<summary><b>Click to expand file structure details</b></summary>

```
code-refactoring/
├── SKILL.md           # Main instructions for Claude (auto-loaded, ~6.5k tokens)
├── REFERENCE.md       # Detailed patterns and examples (loaded on demand)
├── FORMS.md           # Templates and checklists (loaded on demand)
├── README.md          # This file (documentation)
├── scripts/           # Helper utilities & file watcher (cross-platform)
│   ├── *.js files                 # Required - Node.js scripts (work everywhere)
│   │   ├── file-watcher.js        # Background file monitoring
│   │   ├── check-alerts.js        # Alert checking utility
│   │   ├── start-watcher-interactive.js  # Interactive watcher startup
│   │   └── auto-start-watcher.js  # Auto-start helper
│   ├── *.bat files                # Optional - Windows convenience scripts
│   │   ├── auto-start-watcher.bat
│   │   ├── start-watcher.bat
│   │   └── stop-watcher.bat
│   ├── *.sh files                 # Optional - Unix/Linux/macOS convenience scripts
│   │   ├── auto-start-watcher.sh
│   │   ├── start-watcher.sh
│   │   ├── stop-watcher.sh
│   │   ├── check-size.sh
│   │   └── analyze-codebase.sh
│   ├── package.json               # ✅ In repo - Lists dependencies (59 bytes)
│   ├── package-lock.json          # ✅ In repo - Locks versions (3.5 KB)
│   └── node_modules/              # ❌ NOT in repo - You create with npm install (~6 MB)
├── slashes-commands/  # Slash commands for quick access
│   ├── README.md                  # Installation guide
│   ├── start-watcher.md           # Core: Start background monitoring
│   ├── stop-watcher.md            # Core: Stop watcher
│   ├── scan-code-size.md          # Core: One-time scan
│   └── check-refactor-alerts.md   # Optional: Manual alert check
└── resources/         # Supporting materials
    ├── README.md                                  # Resources guide
    ├── AUTHORITATIVE_SOURCES_COMPARISON.md        # Validation vs Fowler/Beck
    ├── code-smells-catalog.md                     # Fowler's 21 code smells
    ├── examples/                                   # Before/after code examples
    │   ├── bad/                                   # Real-world "bad" code
    │   └── good/                                  # Refactored "good" versions
    └── diagrams/
        └── decision-flowchart.md                  # 8 Mermaid diagrams
```

**What each file contains:**

- **SKILL.md**: Core workflow - when to refactor, size guidelines, execution phase (optimized for fast auto-invoke at ~6.5k tokens)
- **REFERENCE.md**: Before/After examples (JS/TS/React, Python), TDD integration, "When NOT to Refactor", execution procedures, audit mode
- **FORMS.md**: Ready-to-use templates - prioritization frameworks, roadmaps, checklists, execution plans, verification
- **scripts/**: File watcher system with cross-platform scripts (.bat for Windows, .sh for Unix/Linux/macOS, .js for Node.js)
  - `node_modules/` folder is **NOT** in repository - created locally via `npm install`
- **slashes-commands/**: Quick-access slash commands (3 core + 1 optional) with installation guide
- **resources/**: Code smells catalog (21 smells), decision flowcharts (8 diagrams), authoritative sources comparison, examples

</details>

---

## 🔄 Update Instructions

**To update to a new version:**

```bash
# Navigate to skill directory
cd ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/

# Pull latest changes (if installed via git)
git pull

# Update Node.js dependencies (if package.json changed)
cd scripts/
npm install

# Done! Restart Claude Code to use the new version
```

**Note:** Your slash commands in projects are just copies - update them if command syntax changed:

```bash
# In your project
cp ~/.claude/plugins/.../slashes-commands/*.md .claude/commands/
```

---

## 🗑️ Uninstall Instructions

**To completely remove the skill:**

```bash
# 1. Stop any running watchers
bash ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/stop-watcher.sh

# 2. Remove the skill directory
rm -rf ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/

# 3. Remove slash commands from projects (optional)
# In each project:
rm .claude/commands/start-watcher.md
rm .claude/commands/stop-watcher.md
rm .claude/commands/scan-code-size.md
rm .claude/commands/check-refactor-alerts.md

# 4. (Optional) Remove auto-start hook from settings.json
# Edit ~/.claude/settings.json and remove the SessionStart hook
```

**That's it!** The skill is completely removed.

---

## 🚀 How to Use

### Automatic Invocation (Preferred)

**⚡ Set It and Forget It!**

The skill triggers **automatically** and monitors **constantly**. Just work normally and Claude will:

1. Check file sizes before editing
2. Alert you during file creation
3. Suggest refactoring after reading large files
4. Detect complexity patterns

**You don't need to ask Claude to check file sizes** - the background watcher is always monitoring your `/src` directory and the skill is always aware of your code size.

**Example:**

```
You: "Add analytics to Dashboard.tsx"
Claude: *Checks file size first*
Claude: *Sees 280 lines*
Claude: *Auto-invokes code-refactoring skill*
Skill: "🚨 Dashboard.tsx is 280 lines. Refactoring recommended.

       Plan:
       1. Extract dashboard-data.tsx (60 lines)
       2. Extract DashboardModal.tsx (80 lines)
       3. Extract useDashboard.ts (50 lines)
       Result: Main file → 150 lines

       Execute refactoring now? [Yes/No/Later/Review]"

You: "Yes"

Skill: *Creates backup commit*
       *Executes refactoring step-by-step*
       *Tests after each step*
       *Commits each step*
       "✅ Refactoring complete! Dashboard.tsx now 150 lines.
        Now adding analytics..."
```

### Manual Check (Optional)

You can also manually check file sizes:

```bash
# Check single file
bash ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/check-size.sh src/components/Dashboard.tsx

# Check directory
bash ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/check-size.sh src/components '*.tsx'

# Check Python files
bash ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/check-size.sh src/services '*.py'
```

---

## 🔔 Real-Time File Watcher & Alert System

**NEW in v1.1:** Background file watcher with real-time alerts in Claude Code Chat!

### What It Does

The file watcher runs in the background and:

- Monitors all code files in your `/src` directory (`.js`, `.jsx`, `.ts`, `.tsx`, `.py`)
- **Constantly checks file sizes** - The skill is ALWAYS aware of your code size
- Detects when you edit files that exceed size thresholds
- Creates alerts when files grow significantly (50+ lines)
- Displays alerts automatically in Claude Code Chat
- Integrates seamlessly with the refactoring workflow

**⚡ Key Point:** The watcher is **constantly monitoring**. You don't need to ask Claude to check file sizes - the skill already knows!

### Why Only `/src` Directory?

The watcher focuses on `/src` because:

- ✅ **Source code matters** - This is where your application logic lives
- ✅ **Excludes noise** - Ignores generated files, dependencies, build artifacts
- ✅ **Better performance** - Monitoring thousands of `node_modules` files would slow things down
- ✅ **Relevant alerts** - You care about code you write, not vendor code

### How It Works

```
1. Watcher runs in background (auto-starts with Claude Code)
   ↓
2. You edit a large file (e.g., 450 lines)
   ↓
3. Watcher detects the change and writes alert to JSON
   ↓
4. Next time you interact with Claude...
   ↓
5. Claude automatically checks for alerts
   ↓
6. Alert appears in chat:
   "⚡ Refactor Alert! You edited Dashboard.tsx (450 lines - CRITICAL)
    Would you like help refactoring it now?"
   ↓
7. You choose: Refactor NOW or LATER
```

### Auto-Start on Claude Code Launch

The watcher is configured to **automatically start** when you launch Claude Code via the `SessionStart` hook. **No manual action required!**

**⚡ Important:** The skill only needs to be **invoked once** (happens automatically). After that, the background watcher handles everything.

### How to Manually Check for Alerts

If you haven't seen alerts in a while and want to check manually:

**Option 1: Ask Claude directly** (Easiest)

```
Just ask: "Any refactoring alerts?"
```

Claude will automatically check the background watcher and show you any pending alerts.

**Option 2: Invoke the skill manually**

```
Just talk to Claude normally - the skill auto-checks alerts when invoked
```

**You don't need to do anything special** - the skill is constantly aware of your file sizes through the background watcher!

---

## 🎯 Path-Based Thresholds (NEW in v2.0!)

**The watcher now uses intelligent, context-aware thresholds based on file location!**

### What This Means

Instead of treating all files the same, the watcher now understands that different file types have different acceptable sizes:

**Pages Can Be Larger:**

- `page.tsx` files: 300/500/800 lines
- **Why?** Educational content, demos, and tutorial pages often contain lots of text and examples

**Data Files Get Special Treatment:**

- `data/**/*.tsx` files: 250/400/600 lines
- **Why?** Mostly static content, configuration, and data structures

**Components Stay Standard:**

- `components/**/*.tsx` files: 150/200/300 lines
- **Why?** UI components should stay focused and reusable

**Utilities Must Be Small:**

- `lib/**/*.ts` & `utils/**/*.ts`: 100/150/200 lines
- **Why?** Logic and utility files should be **strict** - complex logic needs to stay small and testable

**API Routes Stay Thin:**

- `api/**/*.ts` files: 100/150/250 lines
- **Why?** Thin controllers are preferred - business logic should be in services

### Example: Before vs After v2.0

**Before v2.0 (Extension-based only):**

```
app/rag-playground/page.tsx (1,246 lines)
→ CRITICAL ❌ (>300 lines for .tsx files)
→ False positive! This is an educational demo page with lots of content
```

**After v2.0 (Path-based intelligence):**

```
app/rag-playground/page.tsx (1,246 lines)
→ ALERT ⚠️ (>500, <800 for page.tsx files) [path-based (Page component)]
→ More reasonable! Still suggests cleanup but acknowledges it's a page
```

**Similarly for utilities:**

```
utils/helper.ts (250 lines)
→ CRITICAL 🛑 (>200 for utilities) [path-based (Utility/logic file)]
→ Correctly strict! Utilities should be small and focused
```

### How It Works

1. **Path matching first**: Checks if file matches any path patterns (most specific)
2. **Fallback to extension**: If no path match, uses extension-based thresholds (like v1.x)
3. **Transparent**: Shows which threshold was applied in alert messages

### Customizing Path Patterns

Want to add your own path patterns? Edit `scripts/file-watcher.js`:

```javascript
pathBased: [
  {
    pattern: /\/migrations\/.*\.ts$/i,
    warning: 400,
    alert: 600,
    critical: 1000,
    reason: 'Database migration (can be large)',
  },
  // Add your custom patterns here
];
```

---

## 🎮 Slash Commands (3 Core + 1 Optional)

### `/start-watcher`

**Start background file monitoring**

```bash
/start-watcher
```

**What it does:**

- Starts real-time file monitoring
- Shows initial scan results (critical/alert/warning files)
- Creates PID file for process management
- Runs continuously until stopped

**When to use:**

- Manually start if watcher isn't auto-started
- Restart after stopping
- Troubleshooting

**Output example:**

```
✓ File watcher started successfully!
  PID: 68280
  Watching: /path/to/your/project/src

  Found:
  - 23 CRITICAL files (>300 lines)
  - 21 ALERT files (200-300 lines)
  - 16 WARNING files (150-200 lines)
```

---

### `/stop-watcher`

**Stop background file monitoring**

```bash
/stop-watcher
```

**What it does:**

- Stops the running file watcher process
- Removes PID file
- Preserves existing alerts (can still be checked later)

**When to use:**

- End of coding session
- Disable monitoring temporarily
- Troubleshooting

---

### `/scan-code-size`

**One-time codebase scan (no background monitoring)**

```bash
/scan-code-size
```

**What it does:**

- Performs quick one-time scan
- Generates detailed report
- Saves to `code-size-report-[timestamp].txt`
- **Does NOT start background monitoring**

**When to use:**

- Quick audit of new codebase
- Pre-release checks
- Planning refactoring initiatives
- When you want a report without continuous monitoring

**Output example:**

```
📊 Scan Results:
   🛑 Critical: 23 files
   🚨 Alert: 21 files
   ⚠️  Warning: 16 files

Top 5 Largest:
1. app/ai-lab/rag-playground/page.tsx - 2,456 lines
2. data/knowledge-base/project.ts - 1,163 lines
3. data/knowledge-base/skill.ts - 745 lines

📄 Full report: code-size-report-20251030-095959.txt
```

---

### `/check-refactor-alerts` (Optional)

**Manually check file watcher alerts**

```bash
/check-refactor-alerts
```

**What it does:**

- Reads unread alerts from background file watcher
- Shows files that exceeded thresholds since last check
- Offers refactoring options (now/review/dismiss)

**When to use:**

- Manually check accumulated alerts
- Catch up on alerts before starting work session

**⚠️ Note: This command is OPTIONAL**

- The code-refactoring skill automatically checks alerts when invoked
- The `/start-watcher` command also checks alerts automatically
- Only install this if you want explicit manual control over alert checking

**Output example:**

```
🚨 File Watcher Alerts

You have 2 unread alerts:

1. 🛑 CRITICAL: Dashboard.tsx (450 lines)
   Last edited: 2025-10-30 10:23:45 AM
   Threshold: 300 lines exceeded
   Growth: +45 lines

Would you like help refactoring these files?
Options: Refactor NOW | Review DETAILS | Dismiss
```

For full installation instructions, see [`slashes-commands/README.md`](slashes-commands/README.md)

---

## 🔄 Typical Workflows

### Workflow 1: Continuous Monitoring (Recommended) ⭐

**The "Set and Forget" Approach**

```
1. Claude Code launches → Watcher auto-starts (ONCE)
2. You code normally - no action needed
3. Skill constantly monitors in background
4. Claude alerts you automatically when you edit large files
5. Ask: "Help me refactor [filename]" when you see an alert
6. End of day: /stop-watcher (optional)
```

**⚡ Key Point:** After the initial auto-start, you don't need to trigger anything. The skill is **always watching** and **always aware** of your file sizes.

**Want to check manually?** Just ask Claude: "Any refactoring alerts?"

### Workflow 2: Quick Audit Without Monitoring

```
1. /scan-code-size
2. Review report
3. Ask: "Help me refactor the top 3 critical files"
4. Continue without watcher
```

**When to use:** One-time codebase audits, new projects, pre-release checks.

### Workflow 3: Manual Skill Invocation

```
1. Open large file
2. Ask Claude: "Check if this file needs refactoring"
3. Skill checks size and patterns
4. Suggests refactoring if needed
```

**When to use:** Spot-checking specific files, testing the skill.

---

## ❓ Frequently Asked Questions

<details>
<summary><b>Why isn't node_modules in the repository?</b></summary>

**Answer:** The `node_modules/` folder contains 6 MB of downloaded packages - too large to include in git. Instead:

- We include `package.json` (59 bytes) - tells npm what to install
- We include `package-lock.json` (3.5 KB) - locks exact versions
- You run `npm install` to create `node_modules/` locally
- This is standard practice for all Node.js projects

**Result:** Clean repository (no bloat), users get identical packages.

</details>

<details>
<summary><b>Where exactly does node_modules get created?</b></summary>

**Answer:** In the same directory as `package.json`:

```
scripts/
├── package.json         ← This file tells npm what to install
└── node_modules/        ← Created here when you run npm install
```

When you run:

```bash
cd scripts/          # ← Go to this directory FIRST
npm install          # ← Creates node_modules HERE
```

</details>

<details>
<summary><b>Do I need to run npm install every time I use the skill?</b></summary>

**Answer:** **No!** You only run `npm install` **once** after cloning the repository. The `node_modules/` folder stays there permanently unless you delete it.

**Timeline:**

- First time: Clone repo → Run `npm install` → Use skill forever
- Later sessions: Just use the skill (packages already installed)
</details>

<details>
<summary><b>What if I accidentally delete node_modules?</b></summary>

**Answer:** No problem! Just run `npm install` again:

```bash
cd ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts
npm install
```

It will recreate the exact same packages (thanks to `package-lock.json`).

</details>

<details>
<summary><b>Can I delete node_modules to save space?</b></summary>

**Answer:** Yes, you can delete it anytime:

```bash
rm -rf scripts/node_modules/    # Frees 6 MB
```

**But:** The file watcher won't work until you reinstall:

```bash
cd scripts/
npm install                      # Restore functionality
```

**Recommendation:** Keep it installed (6 MB is small on modern systems).

</details>

---

## 📋 For More Details

- **Slash Commands Installation:** See [`slashes-commands/README.md`](slashes-commands/README.md) for installation guide and usage
- **Slash Commands Reference:** See `COMMANDS_REFERENCE.md` for detailed command documentation
- **Advanced Auto-Start:** See "Advanced Configuration" section below for optional automatic startup

## ✨ Execution Phase (NEW!)

**The skill can now EXECUTE refactoring, not just suggest it!**

### How It Works

1. **Detection** - Skill detects large file or complexity issue
2. **Analysis** - Creates refactoring plan
3. **Approval** - Asks for your explicit approval with 4 options:
   - ✅ **Yes** - Execute now (recommended)
   - ❌ **No** - Skip refactoring (risky)
   - ⏰ **Later** - Save plan for later
   - 📋 **Review** - Show detailed steps first

4. **Execution** - If approved:
   - Creates backup commit
   - Executes step-by-step
   - Tests after each step
   - Commits each step
   - Can rollback if anything fails

5. **Continue** - Proceeds with your original request

### Safety Features

✅ **Always asks for approval** - Never refactors automatically
✅ **Incremental commits** - Each step is a separate commit
✅ **Testing after each step** - Lint, type-check, tests
✅ **Automatic rollback** - If any step fails, reverts all changes
✅ **Backup commit** - Can always get back to starting state

### Example Execution

```
User: "Add feature to Dashboard.tsx"

Skill: "⚠️ Dashboard.tsx is 280 lines.

       Refactoring plan:
       1. Extract data → dashboard-data.tsx (60 lines)
       2. Extract modal → DashboardModal.tsx (80 lines)
       3. Extract hook → useDashboard.ts (50 lines)

       Execute now? [Yes/No/Later/Review]"

User: "Yes"

Skill: "Creating backup..."
       ✅ Backup created

       "Step 1/3: Extracting data..."
       ✅ Created dashboard-data.tsx
       ✅ Updated Dashboard.tsx
       ✅ Tests pass
       ✅ Committed

       "Step 2/3: Extracting modal..."
       ✅ Created DashboardModal.tsx
       ✅ Updated Dashboard.tsx
       ✅ Tests pass
       ✅ Committed

       "Step 3/3: Extracting hook..."
       ✅ Created useDashboard.ts
       ✅ Updated Dashboard.tsx
       ✅ Tests pass
       ✅ Committed

       "✅ Refactoring complete!
       Dashboard.tsx: 280 → 150 lines

       Now adding your feature..."
```

### When Execution Fails

If any step fails (tests, lint, etc.):

```
Skill: "❌ Step 2 failed: Tests failing

       Rolling back..."
       ✅ Reverted all changes
       ✅ Back to backup commit

       Options:
       1. Fix tests and retry
       2. Skip refactoring (proceed with edit)
       3. Manual refactoring

       What would you like?"
```

---

## 📚 Documentation

### Main Instructions (SKILL.md)

Contains the core skill logic:

- When to auto-invoke
- Size thresholds by language
- Pattern detection rules
- Refactoring analysis template
- **Execution phase workflow** (NEW!)
- Safety measures and rollback procedures

**Token size:** ~6,500 tokens (loaded when skill triggers)

### Detailed Reference (REFERENCE.md)

Language-specific patterns and examples:

- JavaScript/TypeScript/React patterns (data extraction, sub-components, custom hooks)
- Python patterns (class splitting, function extraction, config management)
- General patterns (duplicate code, conditionals, nested logic)
- **When NOT to Refactor** (10 critical situations to avoid - NEW!)
- **TDD Integration** (Red-Green-Refactor workflow - NEW!)
- **Execution procedures** (detailed step-by-step)
- Codebase audit mode procedures
- Performance considerations
- Anti-patterns to avoid

**Token size:** ~40,000 tokens (loaded on demand only when needed)

### Templates & Checklists (FORMS.md)

Ready-to-use templates:

- Refactoring analysis template
- Pre-refactoring checklist
- Execution plan
- Post-refactoring verification
- Language-specific checklists

**Token size:** ~3,500 tokens (loaded on demand via bash)

---

## 🎓 Supported Patterns

### Code Smell Detection (NEW!)

**Based on Martin Fowler's "Refactoring" and Refactoring.guru:**

- ✅ **21 Code Smells** across 5 categories (Bloaters, OO Abusers, Change Preventers, Dispensables, Couplers)
- ✅ Automatic detection via pattern matching
- ✅ Detailed catalog in `resources/code-smells-catalog.md`

**Examples:**

- Long Method (>50 lines), Large Class (>300 lines)
- Primitive Obsession, Long Parameter List, Data Clumps
- Switch Statements, Feature Envy, Message Chains
- Duplicate Code, Dead Code, Speculative Generality

### JavaScript/TypeScript/React

- ✅ Data extraction to separate files
- ✅ Sub-component creation
- ✅ Custom hook extraction
- ✅ Feature directory structure
- ✅ React.memo() optimization

### Python

- ✅ Class splitting and composition
- ✅ Function extraction
- ✅ Configuration extraction
- ✅ Module to package conversion
- ✅ Using mixins/composition

### Universal (Any Language)

- ✅ Extract repeated logic
- ✅ Replace complex conditionals
- ✅ Simplify nested logic
- ✅ Data/config separation
- ✅ Single responsibility principle

### TDD Integration (NEW!)

**Red-Green-Refactor workflow:**

- ✅ Skill activates during REFACTOR phase (phase 3 of TDD cycle)
- ✅ Tests kept green throughout refactoring
- ✅ Automatic rollback if tests fail
- ✅ Characterization tests for legacy code
- ✅ Complete workflow in `REFERENCE.md`

---

## 💡 Example Workflows

### Workflow 1: Before Editing Large File

```
User: "Update the analytics component"

AI: *Checks file size: 290 lines*
AI: *Auto-invokes code-refactoring skill*

Skill Analysis:
🚨 analytics.tsx is 290 lines

Recommendations:
1. Extract analytics-data.tsx (60 lines of config)
2. Create AnalyticsChart.tsx (80 lines)
3. Extract useAnalytics.ts hook (50 lines)
Result: Main file reduced to 150 lines

Proceed with refactoring first? [YES/NO]
```

### Workflow 2: During File Creation

```
AI: *Creating new Dashboard.tsx*
AI: *Reaches 150 lines*
AI: *Auto-invokes code-refactoring skill*

Skill:
⚠️ Dashboard.tsx reached 150 lines during creation.

Current structure:
- 60 lines: Chart rendering
- 40 lines: Data fetching
- 30 lines: Modal
- 20 lines: Layout

Recommendations:
1. Extract chart → DashboardChart.tsx
2. Extract modal → DashboardModal.tsx
3. Extract hook → useDashboard.ts

Continue with extraction before finishing?
```

### Workflow 3: After Reading Complex File

```
User: "What does this analytics.py file do?"

AI: *Reads analytics.py*
AI: *Sees 450 lines*
AI: *Auto-invokes code-refactoring skill*

Skill:
🛑 analytics.py is 450 lines (150 over limit)

Refactor plan:
1. Split into AnalyticsFetcher (100 lines)
2. Create AnalyticsProcessor (120 lines)
3. Create AnalyticsVisualizer (100 lines)
4. Keep Analytics as orchestrator (130 lines)

Should I explain the file AND provide refactoring plan?
```

---

## 🔧 Customization

### Adjusting Size Thresholds

**The default thresholds (150/200/300 lines) work for most projects, but you can customize them for your team's preferences.**

#### Why You Might Adjust Thresholds

**Stricter (smaller files):**

- Microservices architecture (prefer 100/150/200)
- Junior developer team (easier to understand)
- High-churn codebase (smaller = easier to change)
- Functional programming style (smaller functions/modules)

**Looser (larger files):**

- Mature, stable codebase (250/350/500)
- Senior developer team (can handle complexity)
- Rapid prototyping phase (optimize later)
- Specific file types (e.g., config files, tests)

#### How to Change Thresholds

**Step 1:** Edit `SKILL.md` in your skill directory:

```bash
# Open SKILL.md for editing
code ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/SKILL.md
```

**Step 2:** Find and modify the size guidelines section:

```markdown
## 📏 File Size Guidelines (Language-Specific)

### JavaScript/TypeScript/React Components

- **100-200 lines**: ✅ Perfect for most components # Change these numbers
- **200-300 lines**: ⚠️ Good for complex components # to your preference
- **300+ lines**: 🛑 MUST split into sub-components

### Python Modules

- **150-250 lines**: ✅ Good module size
- **250-400 lines**: ⚠️ Consider splitting
- **400+ lines**: 🛑 Split into multiple modules
```

**Step 3:** Also update the auto-invoke bash commands to match:

```bash
# Find this section in SKILL.md:
# If result:
# 150-200 lines → ⚠️ WARN: Getting large
# 200-300 lines → 🚨 ALERT: Should split
# 300+ lines   → 🛑 STOP: Must refactor

# Update to your thresholds
```

**Step 4:** Update the analyze-codebase.sh script to match:

```bash
# Edit the script
nano ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/analyze-codebase.sh

# Find and change:
MIN_LINES=150    # Change to your warning threshold

# And update the categorization logic around line 40:
if [ $lines -gt 300 ]; then    # Change to your critical threshold
    ((CRITICAL_COUNT++))
elif [ $lines -gt 200 ]; then  # Change to your high threshold
    ((HIGH_COUNT++))
elif [ $lines -gt 150 ]; then  # Change to your medium threshold
```

#### Example: Stricter Thresholds for Microservices

```markdown
### Microservices Configuration (Stricter)

### JavaScript/TypeScript/React Components

- **75-150 lines**: ✅ Perfect size for microservices
- **150-200 lines**: ⚠️ Getting large, consider splitting
- **200+ lines**: 🛑 Too large for microservice architecture

### Python Modules

- **100-200 lines**: ✅ Good module size
- **200-300 lines**: ⚠️ Consider splitting
- **300+ lines**: 🛑 Definitely split
```

#### Example: Looser Thresholds for Rapid Prototyping

```markdown
### Prototype Mode (Looser - Optimize Later)

### JavaScript/TypeScript/React Components

- **150-250 lines**: ✅ OK for prototyping
- **250-400 lines**: ⚠️ Consider refactoring before production
- **400+ lines**: 🛑 Must refactor before merging to main

### Python Modules

- **200-350 lines**: ✅ Acceptable for prototypes
- **350-500 lines**: ⚠️ Getting unwieldy
- **500+ lines**: 🛑 Too large, hard to understand
```

#### Quick Threshold Presets

**Copy-paste one of these into SKILL.md:**

<details>
<summary><b>Preset 1: Strict (Microservices/Junior Team)</b></summary>

```markdown
- **75-150 lines**: ✅ Good
- **150-200 lines**: ⚠️ Warning
- **200+ lines**: 🛑 Critical
```

</details>

<details>
<summary><b>Preset 2: Default (Balanced)</b></summary>

```markdown
- **100-200 lines**: ✅ Good
- **200-300 lines**: ⚠️ Warning
- **300+ lines**: 🛑 Critical
```

</details>

<details>
<summary><b>Preset 3: Relaxed (Stable/Senior Team)</b></summary>

```markdown
- **150-300 lines**: ✅ Good
- **300-400 lines**: ⚠️ Warning
- **400+ lines**: 🛑 Critical
```

</details>

<details>
<summary><b>Preset 4: Very Relaxed (Prototyping)</b></summary>

```markdown
- **200-400 lines**: ✅ Good
- **400-600 lines**: ⚠️ Warning
- **600+ lines**: 🛑 Critical
```

</details>

---

### Per-Language Thresholds

You can also set **different thresholds for different languages**:

```markdown
## 📏 File Size Guidelines (Per-Language)

### JavaScript/TypeScript/React (Strict)

- **100-200 lines**: ✅ Good
- **200-300 lines**: ⚠️ Warning
- **300+ lines**: 🛑 Critical

### Python (Moderate)

- **150-250 lines**: ✅ Good
- **250-400 lines**: ⚠️ Warning
- **400+ lines**: 🛑 Critical

### Configuration Files (Relaxed)

- **200-400 lines**: ✅ Good
- **400-600 lines**: ⚠️ Warning
- **600+ lines**: 🛑 Critical
```

---

### Adding New Language Support

1. Add language-specific patterns to `REFERENCE.md`
2. Add triggers to `SKILL.md` Pattern Detection section
3. Add checklist to `FORMS.md` Language-Specific Checklists
4. Set appropriate size thresholds for the language

### Adding New Patterns

1. Document pattern in `REFERENCE.md`
2. Add auto-detection trigger in `SKILL.md`
3. Create template in `FORMS.md` if needed

---

## 🎯 Success Metrics

**This skill is successful if:**

1. ✅ You never discover 500-line files "by accident"
2. ✅ AI alerts you BEFORE adding to large files
3. ✅ Refactoring happens incrementally, not in "big bang" rewrites
4. ✅ Code stays maintainable as project grows
5. ✅ Less time spent on "emergency refactors"

---

## 📊 Typical Results

**Before using this skill:**

- Discover 400+ line components after they're already complex
- Spend hours on "emergency refactors"
- Break functionality during rushed refactoring
- Accumulate technical debt

**After using this skill:**

- Get alerted at 150-200 lines
- Refactor incrementally in 15-30 minute sessions
- Maintain functionality throughout refactoring
- Prevent technical debt accumulation

---

## 🤝 Contributing

This skill is part of a personal skills collection but can be shared!

**To improve this skill:**

1. Add new language patterns to `REFERENCE.md`
2. Add new templates to `FORMS.md`
3. Enhance auto-detection in `SKILL.md`
4. Share your improvements!

---

## 📝 Version History

**v2.0.0** (Current - October 31, 2025) 🎯

- ✨ **NEW: Path-Based Thresholds** - Major intelligence upgrade!
  - File watcher now uses context-aware thresholds based on file location
  - `page.tsx` files: 300/500/800 lines (educational content allowed)
  - `data/**/*.tsx`: 250/400/600 lines (mostly static content)
  - `components/**/*.tsx`: 150/200/300 lines (standard threshold)
  - `lib/**/*.ts` & `utils/**/*.ts`: 100/150/200 lines (strict - should be small)
  - `api/**/*.ts`: 100/150/250 lines (thin controller preferred)
  - Falls back to extension-based thresholds for unmatched files
- ✅ **Solves false positives** - RAG Playground pages no longer incorrectly flagged
- ✅ **Context-aware** - Logic files held to stricter standards than UI files
- ✅ **Transparent** - Alert messages show why thresholds were applied
- ✅ **Fast** - Simple pattern matching, no parsing overhead (80% solution, 20% effort)
- 🔄 **No migration needed** - Automatic detection, backward compatible

**v1.1.1** (October 30, 2025)

- 🚀 **OPTIMIZATION:** Refactored for skill-builder compliance
- 📉 Reduced SKILL.md from 903 → 413 lines (54% reduction)
- 📉 Reduced token count from ~22,500 → ~6,500 (71% reduction)
- 📚 Moved detailed procedures to REFERENCE.md (progressive disclosure)
- ⚡ Significantly improved auto-invoke performance
- 🎯 Maintained all functionality while optimizing structure
- 📖 **NEW RESOURCES:**
  - ✨ Code Smells Catalog (Fowler's 21 smells with examples)
  - ✨ "When NOT to Refactor" section (10 critical situations)
  - ✨ TDD Integration (Red-Green-Refactor workflow)
  - ✨ Visual Decision Flowcharts (8 Mermaid diagrams)
  - ✨ Authoritative Sources Comparison (vs Fowler, Beck, Refactoring.guru)
- 🏆 **100% coverage** against industry best practices

**v1.1.0** (October 30, 2025)

- ✨ **NEW:** Execution phase with user approval
- ✨ **NEW:** Step-by-step automated refactoring
- ✨ **NEW:** Incremental commits with rollback support
- ✨ **NEW:** Automatic testing after each step
- ✨ **NEW:** Safety measures and backup commits
- Enhanced documentation with execution examples

**v1.0.0** (October 30, 2025)

- Initial release
- JavaScript/TypeScript/React support
- Python support
- General pattern support
- Proactive monitoring
- Auto-detection triggers
- Comprehensive templates

---

## ⚙️ Advanced Configuration (Optional)

### Auto-Start File Watcher on Claude Code Launch

**Most users should use slash commands (`/start-watcher`)** - this advanced option is for power users who want "set it and forget it" automation.

<details>
<summary><b>📌 What This Does</b></summary>

Instead of manually typing `/start-watcher` each time, the file watcher automatically starts when you launch Claude Code.

**Pros:**

- ✅ Never forget to start monitoring
- ✅ Always protected from size violations
- ✅ Zero manual intervention

**Cons:**

- ⚠️ Requires manual file editing (one-time setup)
- ⚠️ Runs on every Claude Code session (might not want that for all projects)
- ⚠️ Less control than slash commands
</details>

<details>
<summary><b>🔧 Setup Instructions (5 minutes)</b></summary>

**Step 1: Locate your Claude Code settings file**

**Windows:** `C:\Users\YourUsername\.claude\settings.json`
**macOS/Linux:** `~/.claude/settings.json`

If the file doesn't exist, create it with `{}` inside.

**Step 2: Add SessionStart hook**

Add this to `settings.json`:

**Windows:**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node C:\\Users\\YourUsername\\.claude\\plugins\\marketplaces\\custom-skills\\code-refactoring\\scripts\\auto-start-watcher.js"
          }
        ]
      }
    ]
  }
}
```

**macOS/Linux:**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/auto-start-watcher.js"
          }
        ]
      }
    ]
  }
}
```

**⚠️ Important:** Replace `YourUsername` with your actual username.

**Step 3: Verify it works**

1. Save `settings.json`
2. Restart Claude Code
3. Check if watcher started:

**Windows:** `type %USERPROFILE%\.claude\plugins\marketplaces\custom-skills\code-refactoring\scripts\watcher.log`
**macOS/Linux:** `cat ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/watcher.log`

You should see log entries showing the watcher started.

**Step 4 (Optional): Customize monitored directory**

By default, the watcher auto-detects your `src/` directory. To watch a specific directory:

Add the directory path to the command:

```json
"command": "node ~/.claude/plugins/.../auto-start-watcher.js \"/path/to/your/src\""
```

</details>

<details>
<summary><b>🛑 How to Disable Auto-Start</b></summary>

To disable automatic startup, remove or comment out the hooks section in `settings.json`:

```json
{
  // "hooks": {
  //   "SessionStart": [ ... ]
  // }
}
```

You can still use `/start-watcher` manually anytime.

</details>

<details>
<summary><b>❓ Troubleshooting Auto-Start</b></summary>

**Watcher not starting automatically?**

1. **Check hook is configured:**

   ```bash
   # Windows
   type %USERPROFILE%\.claude\settings.json | findstr "SessionStart"

   # macOS/Linux
   cat ~/.claude/settings.json | grep "SessionStart"
   ```

2. **Check Node.js is installed:**

   ```bash
   node --version  # Should be v14 or higher
   ```

3. **Check npm dependencies installed:**

   ```bash
   cd ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts
   npm install
   ```

4. **Manually test the auto-start script:**

   ```bash
   # Windows
   node %USERPROFILE%\.claude\plugins\...\auto-start-watcher.js

   # macOS/Linux
   node ~/.claude/plugins/.../auto-start-watcher.js
   ```

   Should start silently with no output.

**Still not working?** Just use `/start-watcher` slash command instead - it's simpler!

</details>

---

## ❓ Common Issues & Solutions

### Installation & Setup Issues

<details>
<summary><b>❌ "npm: command not found" or "node: command not found"</b></summary>

**Problem:** Node.js is not installed or not in PATH.

**Solution:**

1. Install Node.js v14 or higher: https://nodejs.org/
2. Verify installation: `node --version` and `npm --version`
3. Restart your terminal/Claude Code
4. Try `npm install` again

**Windows specific:** Make sure to check "Add to PATH" during Node.js installation.

</details>

<details>
<summary><b>❌ "Permission denied" when running scripts</b></summary>

**Problem:** Scripts don't have execute permissions (macOS/Linux).

**Solution:**

```bash
# Make scripts executable
chmod +x ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/*.sh

# Or individual script
chmod +x ~/.claude/plugins/.../scripts/start-watcher.sh
```

**Windows:** This shouldn't happen. If it does, right-click script → Properties → Unblock.

</details>

<details>
<summary><b>❌ Slash commands not found: "/start-watcher: command not found"</b></summary>

**Problem:** Slash commands not installed in your project.

**Solution:**

```bash
# Copy slash commands to your project
cd /path/to/your-project
cp ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/slashes-commands/*.md .claude/commands/

# Verify
ls .claude/commands/
```

**Remember:** Slash commands are project-level, not global. You need to copy them to each project where you want them.

</details>

<details>
<summary><b>❌ "Cannot find module 'node-notifier'" error</b></summary>

**Problem:** Node.js dependencies not installed.

**Solution:**

```bash
# Navigate to scripts directory
cd ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts

# Install dependencies
npm install

# Verify
ls node_modules/  # Should see node-notifier folder
```

</details>

<details>
<summary><b>❌ File watcher not detecting changes / No notifications</b></summary>

**Problem:** Watcher might have crashed or not started properly.

**Solution:**

```bash
# 1. Stop any existing watcher
bash ~/.claude/plugins/.../scripts/stop-watcher.sh

# 2. Check the log for errors
cat ~/.claude/plugins/.../scripts/watcher.log

# 3. Restart the watcher
/start-watcher

# 4. Verify it's running
ps aux | grep file-watcher.js
```

**Alternative:** Use `/scan-code-size` for one-time scans without background monitoring.

</details>

<details>
<summary><b>❌ "EACCES: permission denied" when installing npm packages</b></summary>

**Problem:** Don't have write permissions to npm global directory.

**Solution (Option 1 - Recommended):**

```bash
# Use npm's built-in fix
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Add to shell config (~/.bashrc or ~/.zshrc)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
```

**Solution (Option 2 - If inside skill directory):**

```bash
# You shouldn't need sudo for this since it's in your home directory
# If you do, check ownership:
ls -la ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/

# Fix ownership if needed:
sudo chown -R $USER:$USER ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/
```

</details>

<details>
<summary><b>❌ Skill not auto-invoking when editing large files</b></summary>

**Problem:** Skill might not be properly registered or Claude Code needs restart.

**Solution:**

1. Verify skill location: `ls ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/SKILL.md`
2. Restart Claude Code completely
3. Try with a test file:

   ```bash
   # Create 300-line test file
   for i in {1..300}; do echo "// Line $i" >> test.js; done

   # Ask Claude to edit it
   "Add a comment to test.js"
   ```

4. If still not working, manually invoke: "Use the code-refactoring skill to analyze test.js"
</details>

<details>
<summary><b>❌ Windows: "bash: command not found" when running slash commands</b></summary>

**Problem:** Git Bash or WSL not installed.

**Solution (Option 1 - Install Git Bash):**

1. Install Git for Windows: https://git-scm.com/download/win
2. Git Bash is included
3. Claude Code will use it automatically

**Solution (Option 2 - Use .bat scripts directly):**

```bash
# Instead of slash commands, run batch files directly
C:\Users\YourUsername\.claude\plugins\...\scripts\start-watcher.bat
```

**Solution (Option 3 - Use WSL):**

1. Install WSL: `wsl --install`
2. Claude Code can use WSL bash
</details>

### Usage Issues

<details>
<summary><b>⚠️ Too many notifications / Watcher is annoying</b></summary>

**Problem:** Watcher alerting on files you don't want monitored.

**Solution (Option 1 - Use selective monitoring):**

```bash
# Start watcher with specific directory
/start-watcher
# Then specify: "Only monitor src/components/"
```

**Solution (Option 2 - Stop watcher):**

```bash
# Stop background monitoring
/stop-watcher

# Use one-time scans instead
/scan-code-size
```

**Solution (Option 3 - Adjust thresholds):**
Edit `SKILL.md` in the skill directory to increase size thresholds.

</details>

<details>
<summary><b>⚠️ Multiple watchers running (duplicate notifications)</b></summary>

**Problem:** Auto-start hook + manual start = 2 watchers.

**Solution:**

```bash
# Kill all file-watcher processes
pkill -f file-watcher.js

# Or use stop script (stops all instances)
bash ~/.claude/plugins/.../scripts/stop-watcher.sh

# Start fresh
/start-watcher
```

**Prevention:** If using auto-start hook, don't also run `/start-watcher` manually.

</details>

<details>
<summary><b>⚠️ Watcher using too much CPU/memory</b></summary>

**Problem:** Monitoring too many files or directory is too large.

**Solution:**

```bash
# Stop watcher
/stop-watcher

# Use more specific monitoring
# Instead of watching entire project, watch specific folder:
/start-watcher
# Then: "Monitor only src/components/"

# Or use one-time scans instead of background monitoring
/scan-code-size
```

</details>

### Still Having Issues?

**Check the logs:**

```bash
# Watcher logs
cat ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/watcher.log

# Alert data
cat ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/watcher-alerts.json
```

**Report an issue:**

- GitHub Issues: https://github.com/mgbotoe/claude-code-share/issues
- Include: OS, Node.js version, error messages, relevant logs

---

## 🔗 Related Skills

Works well with:

- `ui-ux-audit` - Ensures UI components stay maintainable
- `technical-writing` - Documents refactored structure
- `qa-testing` - Tests refactored code

---

## 📧 Questions?

This skill was created using the `skill-builder` skill for Claude Code.

**Created by:** Madina Gbotoe
**Portfolio:** [https://madinagbotoe.com/](https://madinagbotoe.com/)
**GitHub:** [https://github.com/mgbotoe](https://github.com/mgbotoe)
**Date:** October 30, 2025
**Installation Location:** `~/.claude/plugins/marketplaces/custom-skills/code-refactoring/` (GLOBAL - works across all projects)

**License:** Creative Commons Attribution 4.0 International (CC BY 4.0)

- Attribution required when sharing or modifying
- Free to use in personal and commercial projects
- See SKILL.md header for full license details

**To test the skill:**

```
Try asking Claude to edit a large file and watch it check the size first!
```

---

## Remember

**Prevention > Cure**

This skill prevents complexity problems by catching them early, not after they've become painful to fix.

**The goal:** Never again discover an oversized, complex file by accident. 🎯
