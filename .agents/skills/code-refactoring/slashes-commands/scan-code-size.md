---
description: Scan code for oversized files and save report (doesn't start background monitoring)
---

Run a one-time scan of your code to find oversized files. Results are saved to a report file and shown to you.

This is useful when you just want to see what needs refactoring without starting the background watcher.

```bash
# Auto-detect src directory
WATCH_DIR="."
if [ -d "./src" ]; then
  WATCH_DIR="./src"
elif [ -d "../src" ]; then
  WATCH_DIR="../src"
fi

REPORT_FILE="code-size-report-$(date +%Y%m%d-%H%M%S).txt"

echo "🔍 Scanning $WATCH_DIR for oversized files..."
echo ""

# Run scan and save to file, also show summary
timeout 10 node ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/file-watcher.js "$WATCH_DIR" 2>&1 | tee "$REPORT_FILE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Scan complete!"
echo "📄 Full report saved to: $REPORT_FILE"
echo ""

# Show summary counts
CRITICAL=$(grep -c "🛑" "$REPORT_FILE" 2>/dev/null || echo "0")
ALERT=$(grep -c "🚨" "$REPORT_FILE" 2>/dev/null || echo "0")
WARNING=$(grep -c "⚠️" "$REPORT_FILE" 2>/dev/null || echo "0")

echo "📊 Summary:"
echo "   🛑 Critical (>300 lines): $CRITICAL files"
echo "   🚨 Alert (200-300 lines): $ALERT files"
echo "   ⚠️  Warning (150-200 lines): $WARNING files"
echo ""
echo "Would you like help refactoring any of these files?"
```
