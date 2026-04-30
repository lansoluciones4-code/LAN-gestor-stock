# Code Refactoring Skill - Slash Commands Reference

**Last Updated:** October 30, 2025
**Command Set:** Streamlined (3 essential commands)

---

## 🎯 Available Commands

### 1. `/start-watcher`

**Purpose:** Start background file watcher for real-time monitoring

**What it does:**

- Starts `file-watcher.js` process in background
- Auto-detects `src/` directory in your project
- Monitors JavaScript/TypeScript (.js, .jsx, .ts, .tsx) and Python (.py) files
- Shows initial scan results (critical/alert/warning files)
- Creates PID file for process management

**When to use:**

- At start of coding session
- When you want real-time alerts as you edit files
- After cloning a new repository

**Output shows:**

- Number of files being monitored
- Critical files (>300 lines)
- Alert files (200-300 lines)
- Warning files (150-200 lines)
- Process ID (PID)

**Example:**

```
/start-watcher

✓ File watcher started successfully!
  PID: 68280
  Watching: C:\Workspace\your-project\src

  Found:
  - 23 CRITICAL files
  - 21 ALERT files
  - 16 WARNING files
```

---

### 2. `/stop-watcher`

**Purpose:** Stop the background file watcher

**What it does:**

- Stops the running `file-watcher.js` process
- Removes PID file
- Stops real-time monitoring
- Preserves existing alerts in `watcher-alerts.json`

**When to use:**

- End of coding session
- When you want to disable real-time monitoring
- When troubleshooting watcher issues

**Note:** Alerts already created remain accessible. The skill can still check for them manually.

**Example:**

```
/stop-watcher

✓ File watcher stopped successfully.
  Process terminated: PID 68280
```

---

### 3. `/scan-code-size`

**Purpose:** One-time scan for oversized files (doesn't start background monitoring)

**What it does:**

- Runs a quick scan of your codebase
- Identifies files exceeding size thresholds
- Generates a detailed report
- Saves report to `code-size-report-[timestamp].txt`
- Does NOT start background monitoring

**When to use:**

- Quick audit of a new codebase
- Before starting a refactoring initiative
- When you want a snapshot without continuous monitoring
- Checking status before a release

**Difference from `/start-watcher`:**

- `/scan-code-size` = One-time report, then exits
- `/start-watcher` = Continuous monitoring with real-time alerts

**Example:**

```
/scan-code-size

🔍 Scanning for oversized files...

📊 Summary:
   🛑 Critical (>300 lines): 23 files
   🚨 Alert (200-300 lines): 21 files
   ⚠️  Warning (150-200 lines): 16 files

Top 5 largest files:
1. app/ai-lab/rag-playground/page.tsx - 2,456 lines
2. data/knowledge-base/project.ts - 1,163 lines
3. data/knowledge-base/skill.ts - 745 lines
4. components/projects/ProjectDetail.tsx - 628 lines
5. app/ai-lab/page.tsx - 547 lines

📄 Full report saved to: code-size-report-20251030-095959.txt
```

---

## 🔄 Typical Workflows

### Workflow 1: Start of Day (Continuous Monitoring)

```
1. /start-watcher
2. Code normally
3. Claude alerts you when editing large files
4. Ask Claude to help refactor when alerted
5. /stop-watcher (end of day)
```

### Workflow 2: Quick Audit (No Monitoring)

```
1. /scan-code-size
2. Review the report
3. Ask Claude: "Help me refactor [filename]"
4. Continue working without watcher
```

### Workflow 3: Troubleshooting

```
1. /stop-watcher (if watcher seems stuck)
2. /start-watcher (restart fresh)
3. Check alerts appear when editing files
```

---

## 🤖 How Alerts Work (Automatic)

**You DON'T need slash commands to see alerts!**

When you interact with Claude, the skill **automatically**:

1. Checks `watcher-alerts.json` for unread alerts
2. Displays alerts in chat before responding
3. Asks if you want help refactoring

**Example automatic alert:**

```
You: "Add a new feature to the dashboard"

Claude:
⚡ Refactor Alert!

I noticed you recently edited components/Dashboard.tsx (450 lines - CRITICAL)
This file grew by 60 lines and is 150 lines over the recommended limit.

Would you like me to help refactor it before adding the new feature?
```

---

## 📋 Quick Command Reference

| Command           | When to Use                             | Background Process?      |
| ----------------- | --------------------------------------- | ------------------------ |
| `/start-watcher`  | Start of session, want real-time alerts | ✅ Yes (stays running)   |
| `/stop-watcher`   | End of session, disable monitoring      | ❌ No (stops process)    |
| `/scan-code-size` | Quick audit, one-time report            | ❌ No (runs once, exits) |

---

## 💡 Pro Tips

### Tip 1: Auto-Start on Claude Code Launch

The watcher is configured to auto-start when Claude Code launches via the `SessionStart` hook. You don't need to manually run `/start-watcher` every time!

### Tip 2: Alerts Persist

Even if you stop the watcher, alerts already created are saved. Claude can still check and display them.

### Tip 3: Manual Checks Without Commands

Just ask Claude to invoke the `code-refactoring` skill, and it will check for alerts automatically. No slash commands needed!

### Tip 4: Scan Before Big Refactor

Before starting a major refactoring initiative:

```
/scan-code-size
```

Then ask: "Show me a prioritized refactoring roadmap for the critical files"

---

## 🔧 Under the Hood

**What each command actually runs:**

### `/start-watcher`

```bash
node ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/start-watcher-interactive.js
```

### `/stop-watcher`

```bash
bash ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/stop-watcher.sh
```

### `/scan-code-size`

```bash
# Runs file-watcher.js with 10-second timeout (scan only, doesn't stay running)
timeout 10 node "...\file-watcher.js" "$WATCH_DIR" 2>&1 | tee "$REPORT_FILE"
```

---

## 📁 Files Created by Commands

| Command           | Files Created                                           | Location                 |
| ----------------- | ------------------------------------------------------- | ------------------------ |
| `/start-watcher`  | `watcher.pid`<br>`watcher.log`<br>`watcher-alerts.json` | `~/.claude/.../scripts/` |
| `/stop-watcher`   | (removes `watcher.pid`)                                 | -                        |
| `/scan-code-size` | `code-size-report-[timestamp].txt`                      | Current directory        |

---

## ❓ FAQ

**Q: Do I need to run `/start-watcher` every time I open Claude Code?**
A: No! The `SessionStart` hook auto-starts the watcher when Claude Code launches.

**Q: How do I know if the watcher is running?**
A: Run `/start-watcher` - it will tell you if it's already running or start it if not.

**Q: Can I see alerts without slash commands?**
A: Yes! Just interact with Claude normally. The skill auto-checks for alerts.

**Q: What if I want to work without alerts?**
A: Run `/stop-watcher` to disable monitoring. The skill can still check file sizes manually when needed.

**Q: What's the difference between scan and watcher?**
A:

- `/scan-code-size` = One-time snapshot report
- `/start-watcher` = Continuous real-time monitoring

**Q: Can I use both scan and watcher?**
A: Yes! They serve different purposes. Scan for audits, watcher for ongoing monitoring.

---

## 🎯 Command Decision Tree

```
Need alerts while coding?
├─ YES → /start-watcher
│   └─ Done for today? → /stop-watcher
│
└─ NO → Just need a quick audit?
    ├─ YES → /scan-code-size
    └─ NO → Just ask Claude for help
              (skill checks manually)
```

---

**Commands are tools, not requirements.** The skill works with or without them. Use what fits your workflow!
