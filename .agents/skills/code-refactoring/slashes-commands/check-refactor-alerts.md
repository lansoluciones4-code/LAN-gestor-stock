---
description: Check file watcher alerts for oversized files needing refactoring
---

Check for unread alerts from the background file watcher that monitors code file sizes in real-time.

**When to use this:**

- You want to see if any files you recently edited exceeded size thresholds
- You want to check alerts before starting a work session
- The watcher has been running and you want to catch up on alerts

```bash
node ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/check-alerts.js
```

**After running the script:**

1. **If there are unread alerts**, show them to the user:

```
🚨 File Watcher Alerts

You have [X] unread alerts:

1. 🛑 CRITICAL: path/to/Component.tsx (450 lines)
   Last edited: 2025-10-30 10:23:45 AM
   Threshold exceeded: 300 lines
   Growth: +45 lines since last check

2. 🚨 ALERT: path/to/service.py (280 lines)
   Last edited: 2025-10-30 10:45:12 AM
   Threshold exceeded: 200 lines
   Growth: +22 lines since last check

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Would you like help refactoring any of these files?

Options:
1. **Refactor NOW** - I'll help you break down these files step-by-step
2. **Review DETAILS** - Show me refactoring recommendations for each file
3. **Dismiss** - Mark as read, I'll handle them later
```

2. **If NO alerts**, confirm:

```
✅ No unread refactoring alerts

Your watched files are either:
- Within size thresholds
- Haven't been edited since last check
- Watcher isn't running (use /start-watcher to start monitoring)
```

**Wait for user response:**

- If "1" or "now" or "refactor": Invoke the code-refactoring skill to help refactor the critical files
- If "2" or "review" or "details": Show detailed refactoring plans for each alerted file
- If "3" or "dismiss" or "later": Mark all alerts as read and continue

**Important Notes:**

- Alerts are created when you EDIT files that exceed thresholds
- The file watcher must be running to generate alerts (use `/start-watcher`)
- Alerts persist until you check them or mark them as read
- Critical files (>300 lines) should be prioritized for refactoring
