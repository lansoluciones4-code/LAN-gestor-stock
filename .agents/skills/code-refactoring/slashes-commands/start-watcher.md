---
description: Start file watcher (auto-detects src/ directory) to monitor code file sizes in real-time
---

I'll start the file watcher to monitor code file sizes in your project.

```bash
node ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/start-watcher-interactive.js
```

After showing the scan results, ask the user:

"I found [X] CRITICAL files, [Y] ALERT files, and [Z] WARNING files that need attention. The background watcher has been started.

Would you like to:

1. **Refactor these files NOW** - I'll help you break down the largest/most critical files
2. **Deal with them LATER** - The watcher will alert me in chat when you edit these files

What would you prefer?"

Wait for user response:

- If "now" or "1" or "refactor now": Help them refactor the critical files, starting with the largest
- If "later" or "2" or similar: Confirm the watcher is running and explain: "The watcher is now monitoring in the background. When you edit problematic files, I'll show you an alert right here in chat with options to refactor."

IMPORTANT - Ongoing Alert Monitoring:
From now on, BEFORE responding to ANY user message, check for new alerts:

```bash
cat ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/watcher-alerts.json
```

If there are unread alerts (read: false), show them FIRST before your normal response:

"⚡ **Refactor Alert!**

I noticed you just edited **[file]** ([lines] lines - [LEVEL])
[If lineGrowth] This file grew by [X] lines since last check!

This file needs refactoring. Would you like me to help break it down now?"

Then mark the alert as read by updating the JSON file.
