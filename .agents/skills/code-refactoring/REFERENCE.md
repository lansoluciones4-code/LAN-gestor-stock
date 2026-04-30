# Code Refactoring Reference Guide

**Detailed patterns and examples for language-specific refactoring.**

---

## Table of Contents

1. [JavaScript/TypeScript/React Patterns](#javascripttypescriptreact-patterns)
2. [Python Patterns](#python-patterns)
3. [General Patterns (Any Language)](#general-patterns-any-language)
4. [Performance Considerations](#performance-considerations)
5. [Common Anti-Patterns](#common-anti-patterns)

---

## JavaScript/TypeScript/React Patterns

### Pattern 1: Data Extraction

**When to use:** 5+ data items, arrays >20 lines, config objects

**Before (Bad):**

```typescript
// UserProfile.tsx (280 lines)
const UserProfile = () => {
  const badges = [
    { id: 1, name: "Expert", icon: "🏆", description: "Completed 100 tasks" },
    { id: 2, name: "Leader", icon: "👑", description: "Led 10 projects" },
    // ... 15 more items (80 lines)
  ];

  return <div>{/* component logic */}</div>
}
```

**After (Good):**

```typescript
// data/user-profile-data.tsx (if contains JSX) or .ts
export const badges = [
  { id: 1, name: "Expert", icon: "🏆", description: "Completed 100 tasks" },
  { id: 2, name: "Leader", icon: "👑", description: "Led 10 projects" },
  // ... all items
];

// UserProfile.tsx (200 lines)
import { badges } from '@/data/user-profile-data';

const UserProfile = () => {
  return <div>{/* component logic */}</div>
}
```

### Pattern 2: Sub-Component Extraction

**When to use:** Distinct UI sections, modal/dialog, complex list items

**Before (Bad):**

```typescript
// Dashboard.tsx (350 lines)
const Dashboard = () => {
  return (
    <div>
      <Header />
      {/* 100 lines of chart logic */}
      <div className="chart">
        {/* Complex chart rendering */}
      </div>
      {showModal && (
        <div className="modal">
          {/* 80 lines of modal logic */}
        </div>
      )}
      <Footer />
    </div>
  )
}
```

**After (Good):**

```typescript
// Dashboard.tsx (150 lines)
import { DashboardChart } from './DashboardChart';
import { DashboardModal } from './DashboardModal';

const Dashboard = () => {
  return (
    <div>
      <Header />
      <DashboardChart />
      {showModal && <DashboardModal />}
      <Footer />
    </div>
  )
}

// DashboardChart.tsx (100 lines)
export const DashboardChart = () => { /* chart logic */ }

// DashboardModal.tsx (80 lines)
export const DashboardModal = () => { /* modal logic */ }
```

### Pattern 3: Custom Hook Extraction

**When to use:** 4+ useState, complex logic, reusable state management

**Before (Bad):**

```typescript
// UserForm.tsx (300 lines)
const UserForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});

  // 50 lines of validation logic
  const validateForm = () => { /* ... */ };

  // 40 lines of submit logic
  const handleSubmit = async () => { /* ... */ };

  return <form>{/* form JSX */}</form>
}
```

**After (Good):**

```typescript
// hooks/useUserForm.ts (100 lines)
export const useUserForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => { /* validation logic */ };
  const handleSubmit = async () => { /* submit logic */ };
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return { formData, errors, handleSubmit, handleChange, validateForm };
}

// UserForm.tsx (150 lines)
import { useUserForm } from '@/hooks/useUserForm';

const UserForm = () => {
  const { formData, errors, handleSubmit, handleChange } = useUserForm();
  return <form>{/* form JSX */}</form>
}
```

### Pattern 4: Feature Directory Structure

**When to use:** Component will be >200 lines even after basic extraction

**Structure:**

```
features/MyFeature/
├── index.tsx              # Main export (<50 lines)
├── MyFeature.tsx          # Main component (<200 lines)
├── MyFeatureModal.tsx     # Modal logic (<150 lines)
├── useMyFeature.ts        # Business logic hook (<100 lines)
├── myFeature.types.ts     # TypeScript interfaces
└── myFeature.data.tsx     # Static data/config (.tsx if has JSX)
```

**Example:**

```typescript
// features/Analytics/index.tsx
export { Analytics } from './Analytics';
export { useAnalytics } from './useAnalytics';
export type { AnalyticsProps } from './analytics.types';

// features/Analytics/Analytics.tsx
import { useAnalytics } from './useAnalytics';
import { AnalyticsChart } from './AnalyticsChart';
import { analyticsConfig } from './analytics.data';

export const Analytics = () => {
  const { data, loading } = useAnalytics();

  if (loading) return <Loading />;

  return (
    <div>
      <AnalyticsChart data={data} config={analyticsConfig} />
    </div>
  );
};
```

### Performance Rules for React

**ALWAYS use React.memo() for:**

- Components with Framer Motion animations
- List item components
- Modal/Dialog components
- Components that receive props but don't change often

```typescript
// ✅ CORRECT: Memoized component
export const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>
});

// Also memoize expensive computations
const processedData = useMemo(() => expensiveOperation(data), [data]);

// Memoize callbacks to prevent child re-renders
const handleClick = useCallback((id) => { /* handle */ }, []);
```

### Import Pattern Rules

```typescript
// ✅ CORRECT: No file extension in imports
import { data } from '@/data/component-data';

// ❌ WRONG: Don't include extension
import { data } from '@/data/component-data.tsx';
```

---

## Python Patterns

### Pattern 1: Class Splitting

**When to use:** Class >300 lines, multiple responsibilities, too many methods

**Before (Bad):**

```python
# analytics.py (450 lines)
class Analytics:
    def __init__(self):
        # 50 lines of initialization
        pass

    def fetch_data(self):
        # 80 lines of data fetching
        pass

    def process_data(self):
        # 100 lines of data processing
        pass

    def generate_chart(self):
        # 80 lines of chart generation
        pass

    def export_results(self):
        # 60 lines of export logic
        pass

    # ... 10 more methods
```

**After (Good):**

```python
# analytics/fetcher.py (100 lines)
class AnalyticsFetcher:
    def fetch_data(self):
        # Data fetching logic
        pass

# analytics/processor.py (120 lines)
class AnalyticsProcessor:
    def process_data(self, data):
        # Data processing logic
        pass

# analytics/visualizer.py (100 lines)
class AnalyticsVisualizer:
    def generate_chart(self, processed_data):
        # Chart generation logic
        pass

# analytics/exporter.py (80 lines)
class AnalyticsExporter:
    def export_results(self, data, format='json'):
        # Export logic
        pass

# analytics/analytics.py (150 lines) - Orchestrator
from .fetcher import AnalyticsFetcher
from .processor import AnalyticsProcessor
from .visualizer import AnalyticsVisualizer
from .exporter import AnalyticsExporter

class Analytics:
    """Main analytics orchestrator."""

    def __init__(self):
        self.fetcher = AnalyticsFetcher()
        self.processor = AnalyticsProcessor()
        self.visualizer = AnalyticsVisualizer()
        self.exporter = AnalyticsExporter()

    def run_analysis(self):
        data = self.fetcher.fetch_data()
        processed = self.processor.process_data(data)
        chart = self.visualizer.generate_chart(processed)
        return self.exporter.export_results(chart)
```

### Pattern 2: Function Extraction

**When to use:** Function >50 lines, multiple responsibilities, complex logic

**Before (Bad):**

```python
# report_generator.py
def generate_report(data):
    """Generate comprehensive report."""
    # 20 lines of data validation
    if not data:
        raise ValueError("No data")
    # validate all fields...

    # 30 lines of data transformation
    transformed = []
    for item in data:
        # complex transformation logic
        pass

    # 40 lines of formatting
    formatted = ""
    for item in transformed:
        # complex formatting
        pass

    # 30 lines of output generation
    output = create_output(formatted)
    # ... more logic

    return output  # 120 lines total!
```

**After (Good):**

```python
# report_generator.py (main orchestrator)
def generate_report(data):
    """Generate comprehensive report."""
    validated_data = validate_report_data(data)
    transformed_data = transform_report_data(validated_data)
    formatted_report = format_report_data(transformed_data)
    return create_report_output(formatted_report)

# report_validator.py
def validate_report_data(data):
    """Validate input data for reporting."""
    if not data:
        raise ValueError("No data provided")
    # validation logic
    return data

# report_transformer.py
def transform_report_data(data):
    """Transform data for reporting format."""
    # transformation logic
    return transformed

# report_formatter.py
def format_report_data(data):
    """Format data for output."""
    # formatting logic
    return formatted

# report_output.py
def create_report_output(formatted_data):
    """Create final report output."""
    # output generation
    return output
```

### Pattern 3: Configuration Extraction

**When to use:** 5+ config variables, magic numbers, environment settings

**Before (Bad):**

```python
# database_manager.py (300 lines)
class DatabaseManager:
    def __init__(self):
        self.host = "localhost"
        self.port = 5432
        self.database = "mydb"
        self.pool_size = 20
        self.timeout = 30
        self.retry_attempts = 3
        self.retry_delay = 5
        # ... 20 more config variables

    def connect(self):
        # connection logic using config
        pass
```

**After (Good):**

```python
# database_config.py
DATABASE_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'mydb',
    'pool_size': 20,
    'timeout': 30,
    'retry_attempts': 3,
    'retry_delay': 5,
    # ... all config variables
}

# Or use dataclass for better type hints
from dataclasses import dataclass

@dataclass
class DatabaseConfig:
    host: str = "localhost"
    port: int = 5432
    database: str = "mydb"
    pool_size: int = 20
    timeout: int = 30
    retry_attempts: int = 3
    retry_delay: int = 5

# database_manager.py (200 lines)
from database_config import DATABASE_CONFIG

class DatabaseManager:
    def __init__(self, config=None):
        self.config = config or DATABASE_CONFIG

    def connect(self):
        # connection logic using self.config
        pass
```

### Pattern 4: Module Splitting into Package

**When to use:** Module >400 lines, multiple distinct areas, growing complexity

**Before (Bad):**

```python
# user_service.py (500 lines)
class UserService:
    # 100 lines of authentication methods
    # 100 lines of user CRUD methods
    # 100 lines of permission methods
    # 100 lines of notification methods
    # 100 lines of analytics methods
```

**After (Good):**

```python
# user_service/
# ├── __init__.py
# ├── auth.py
# ├── crud.py
# ├── permissions.py
# ├── notifications.py
# └── analytics.py

# user_service/__init__.py
from .auth import UserAuth
from .crud import UserCRUD
from .permissions import UserPermissions
from .notifications import UserNotifications
from .analytics import UserAnalytics

class UserService:
    """Main user service orchestrator."""

    def __init__(self):
        self.auth = UserAuth()
        self.crud = UserCRUD()
        self.permissions = UserPermissions()
        self.notifications = UserNotifications()
        self.analytics = UserAnalytics()

# user_service/auth.py (100 lines)
class UserAuth:
    # Authentication methods
    pass

# user_service/crud.py (100 lines)
class UserCRUD:
    # CRUD operations
    pass

# ... other modules
```

### Pattern 5: Using Composition Instead of Inheritance

**When to use:** Deep inheritance hierarchies, class getting too large

**Before (Bad):**

```python
# Base class keeps growing (200 lines)
class BaseService:
    # 50 lines of database methods
    # 50 lines of caching methods
    # 50 lines of logging methods
    # 50 lines of validation methods

# Subclass also large (150 lines)
class UserService(BaseService):
    # Inherits 200 lines + adds 150 lines = 350 lines total behavior
```

**After (Good):**

```python
# Use composition with focused classes
class DatabaseMixin:
    # 50 lines of database methods
    pass

class CacheMixin:
    # 50 lines of caching methods
    pass

class LoggerMixin:
    # 50 lines of logging methods
    pass

class Validator:
    # 50 lines of validation methods
    pass

class UserService:
    """User service using composition."""

    def __init__(self):
        self.db = DatabaseMixin()
        self.cache = CacheMixin()
        self.logger = LoggerMixin()
        self.validator = Validator()

    # Only user-specific logic here (100 lines)
```

---

## General Patterns (Any Language)

### Pattern 1: Extract Repeated Logic

**Universal principle across all languages**

**Before (Bad):**

```
// Multiple files with duplicate validation
if (input.length < 3 || input.length > 50) {
    error = "Invalid length"
}
// Same logic repeated 10 times
```

**After (Good):**

```
// Create shared utility/helper
function validateLength(input, min=3, max=50) {
    if (input.length < min || input.length > max) {
        return "Invalid length"
    }
    return null
}

// Use everywhere
const error = validateLength(input)
```

### Pattern 2: Replace Complex Conditionals

**Use dispatch tables, strategy pattern, or polymorphism**

**Before (Bad):**

```
if (type === 'A') {
    // 20 lines
} else if (type === 'B') {
    // 20 lines
} else if (type === 'C') {
    // 20 lines
} else if (type === 'D') {
    // 20 lines
}
// 80+ lines of nested conditionals
```

**After (Good - JavaScript/TypeScript):**

```typescript
const handlers = {
  A: handleTypeA,
  B: handleTypeB,
  C: handleTypeC,
  D: handleTypeD,
};

const result = handlers[type]?.() ?? handleDefault();
```

**After (Good - Python):**

```python
handlers = {
    'A': handle_type_a,
    'B': handle_type_b,
    'C': handle_type_c,
    'D': handle_type_d
}

result = handlers.get(type, handle_default)()
```

### Pattern 3: Simplify Nested Logic

**Reduce nesting depth by using early returns and guard clauses**

**Before (Bad):**

```
function process(data) {
    if (data) {
        if (data.isValid) {
            if (data.hasPermission) {
                if (data.isActive) {
                    // Deep nesting - hard to read
                    return processData(data);
                }
            }
        }
    }
    return null;
}
```

**After (Good):**

```
function process(data) {
    if (!data) return null;
    if (!data.isValid) return null;
    if (!data.hasPermission) return null;
    if (!data.isActive) return null;

    return processData(data);  // Clear main path
}
```

---

## Performance Considerations

### JavaScript/TypeScript

1. **Use memoization** for expensive computations
2. **Lazy load** large components with dynamic imports
3. **Code split** at route boundaries
4. **Debounce/throttle** user input handlers
5. **Virtual scrolling** for long lists

### Python

1. **Use generators** for large data processing
2. **Cache results** with functools.lru_cache
3. **Use list comprehensions** instead of loops when appropriate
4. **Profile before optimizing** (don't guess)
5. **Consider asyncio** for I/O-bound operations

---

## Common Anti-Patterns

### JavaScript/TypeScript Anti-Patterns

❌ **God Component** - One component does everything
❌ **Prop Drilling** - Passing props through many layers
❌ **Inline Functions** - Creating new functions on every render
❌ **Missing Keys** - Not using keys in lists
❌ **Unused State** - useState for values that don't trigger re-render

### Python Anti-Patterns

❌ **God Class** - One class does everything
❌ **Circular Imports** - Modules importing each other
❌ **Mutable Default Arguments** - `def func(list=[])`
❌ **Bare Except** - Catching all exceptions without handling
❌ **Not Using Context Managers** - Manual resource management

---

## File Naming Conventions

### JavaScript/TypeScript

- **Files:** kebab-case (`user-service.ts`)
- **Components:** PascalCase (`UserProfile.tsx`)
- **Hooks:** camelCase with 'use' prefix (`useUserProfile.ts`)
- **Data files:** kebab-case with `-data` suffix (`user-profile-data.tsx`)

### Python

- **Files:** snake_case (`user_service.py`)
- **Classes:** PascalCase (`UserService`)
- **Functions:** snake_case (`get_user_data`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Modules:** snake_case (`user_analytics`)

---

## Additional Resources

For templates and checklists, see: `FORMS.md`

For quick file size checks: `scripts/check-size.sh`

---

## EXECUTION PHASE - Detailed Procedures

**Note:** This section contains the detailed execution workflow. For the high-level overview, see SKILL.md.

### Phase 1: Preparation

```bash
# 1. Create backup commit (safety first!)
git add [target-file]
git commit -m "backup: before refactoring [filename]"

# 2. Verify starting state
npm run lint        # Must pass before starting
npm run type-check  # Must pass before starting
npm run test        # Must pass before starting
```

**If any check fails:**

```
❌ "Cannot start refactoring - tests/lint failing.
    Please fix these issues first, then I can proceed."
[Stop execution]
```

### Phase 2: Incremental Refactoring

**Execute each refactoring step one at a time:**

```markdown
### Step 1/3: Extract Data File

Creating: [new-data-file]

- Moving [X] lines of data/config
- Updating imports in [original-file]

_Executes using Write and Edit tools_

✅ Created [new-data-file]
✅ Updated [original-file]

Verifying...
✅ Lint passes
✅ Type check passes
✅ Tests pass (or prompt user to run)

Committing...
git add [new-data-file] [original-file]
git commit -m "refactor([filename]): extract data to separate file"

**Status:** Step 1/3 complete ✅
**Lines reduced:** [X] lines
**File now:** [X] lines
```

**Repeat for each step:**

- Extract → Verify → Commit
- Extract → Verify → Commit
- Extract → Verify → Commit

### Phase 3: Final Verification

```bash
# Run full test suite
npm run lint
npm run type-check
npm run test
npm run build  # If applicable

# If all pass:
✅ "Refactoring complete!"
   - [filename]: [old-size] → [new-size] lines
   - Created: [list of new files]
   - All tests passing
   - [X] commits made

   "Ready to proceed with your original request: [user's request]"

# If any fail:
❌ "Refactoring verification failed at: [step]"
   "Rolling back changes..."
   [Execute rollback - see below]
```

### Rollback Procedure

**If refactoring fails at any step:**

```bash
# Count commits made during refactoring
COMMITS_MADE=[number of refactor commits]

# Rollback all refactoring commits
git reset --hard HEAD~${COMMITS_MADE}

# Verify rollback successful
git log -1  # Should show "backup: before refactoring"
```

**Report to user:**

```
❌ Refactoring failed at step [X]: [error message]

Rollback complete ✅
- File restored to original state
- All refactoring commits removed
- You're back at the backup commit

Options:
1. Fix the issue and try again
2. Proceed with edit (file stays large)
3. Manual refactoring (I can provide detailed instructions)

What would you like to do?
```

### Safety Measures Checklist

#### Before Execution:

- [ ] User gave explicit "Yes" approval
- [ ] Starting state is clean (lint/type-check/test pass)
- [ ] Backup commit created
- [ ] Git working directory is clean (no uncommitted changes)

#### During Execution:

- [ ] Each step is atomic (one logical change)
- [ ] Each step is verified (lint/type-check/test)
- [ ] Each step is committed (can rollback to any point)
- [ ] Stop immediately if any verification fails

#### After Execution:

- [ ] Full test suite passes
- [ ] Build succeeds (if applicable)
- [ ] All imports/references updated correctly
- [ ] Documentation updated if needed

#### Rollback Triggers:

- ❌ Lint fails after any step
- ❌ Type check fails after any step
- ❌ Tests fail after any step
- ❌ Build fails after refactoring
- ❌ User requests cancellation mid-execution

### Execution Examples

#### Example 1: Successful Execution

```
User: "Add analytics to Dashboard.tsx"

AI: *Checks file size: 290 lines*
AI: *Auto-invokes code-refactoring skill*

Skill: "⚠️ Dashboard.tsx is 290 lines. Refactoring recommended.

Plan:
1. Extract dashboard-data.tsx (60 lines)
2. Extract DashboardModal.tsx (80 lines)
3. Extract useDashboard.ts (50 lines)
Result: Main file → 150 lines

Execute refactoring now? [Yes/No/Later/Review]"

User: "Yes"

Skill: "Creating backup commit..."
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

       "Refactoring complete! ✅
       Dashboard.tsx: 290 → 150 lines

       Now adding analytics feature..."
```

#### Example 2: User Chooses "Later"

```
User: "Add feature to UserProfile.tsx"

AI: "⚠️ UserProfile.tsx is 320 lines. Refactoring recommended.

     Execute now? [Yes/No/Later/Review]"

User: "Later"

AI: "Saving refactoring plan to refactoring-plan-UserProfile.md...
     ✅ Plan saved

     Continuing with your feature (file will grow larger)...
     ⚠️ Reminder: Run refactoring before next major edit"
```

#### Example 3: Rollback After Failure

```
User: "Yes, execute refactoring"

Skill: "Step 1/3: Extracting data..."
       ✅ Created user-data.tsx
       ✅ Committed

       "Step 2/3: Extracting modal..."
       ✅ Created UserModal.tsx
       ❌ Tests failed: UserProfile.test.tsx failing

       "Rolling back refactoring..."
       ✅ Reverted 2 commits
       ✅ Back to original state

       Issue: Tests expect old structure

       Options:
       1. Update tests and retry
       2. Skip refactoring

       What would you like?"
```

---

## CODEBASE AUDIT MODE - Detailed Procedures

**Note:** This section contains detailed audit procedures. For overview, see SKILL.md.

### When to Use Audit Mode

**Use this mode when:**

- User asks to "audit the codebase" or "find large files"
- User mentions "technical debt" or "existing problems"
- User says "scan for refactoring opportunities"
- Starting work on a legacy/inherited codebase
- Before major refactoring initiative
- Quarterly codebase health checks

### Audit Workflow

#### Step 1: Scan for Oversized Files

```bash
# Scan by file type
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -20
find src -name "*.py" | xargs wc -l | sort -rn | head -20

# Or use the helper script
bash ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/check-size.sh src/ '*.tsx'
bash ~/.claude/plugins/marketplaces/custom-skills/code-refactoring/scripts/analyze-codebase.sh src/
```

#### Step 2: Categorize Issues

Group files by severity:

- 🛑 **CRITICAL** (>300 lines): Immediate attention needed
- 🚨 **HIGH** (200-300 lines): Should refactor soon
- ⚠️ **MEDIUM** (150-200 lines): Monitor before changes
- ✅ **GOOD** (<150 lines): Healthy size

#### Step 3: Prioritize Refactoring

Use this prioritization matrix:

| File   | Size      | Change Frequency | Business Impact   | Priority |
| ------ | --------- | ---------------- | ----------------- | -------- |
| File A | 450 lines | High (weekly)    | Critical feature  | P0       |
| File B | 380 lines | Medium (monthly) | Important feature | P1       |
| File C | 320 lines | Low (rare)       | Minor feature     | P2       |

**Priority Formula:**

```
Priority Score = (Size / 100) + (Change Frequency × 2) + (Business Impact × 3)

P0 (Critical): Score ≥ 10 - Fix within 1 week
P1 (High): Score 7-9 - Fix within 1 month
P2 (Medium): Score 4-6 - Fix within quarter
P3 (Low): Score <4 - Fix when convenient
```

#### Step 4: Create Refactoring Roadmap

```markdown
## Codebase Refactoring Roadmap

### Sprint 1 (Week 1-2): Critical Files (P0)

- [ ] analytics.tsx (450 lines) - 8 hours
- [ ] dashboard.py (420 lines) - 6 hours

### Sprint 2 (Week 3-4): High Priority (P1)

- [ ] user-service.tsx (380 lines) - 5 hours
- [ ] report-generator.py (350 lines) - 4 hours

### Sprint 3 (Month 2): Medium Priority (P2)

- [ ] settings.tsx (320 lines) - 3 hours
- [ ] data-processor.py (290 lines) - 3 hours

### Total Estimated Time: 29 hours over 2 months
```

#### Step 5: Execute Incrementally

- ✅ Refactor one file per sprint
- ✅ Test thoroughly after each refactor
- ✅ Monitor for regressions
- ✅ Update documentation
- ✅ Track progress

### Audit Report Template

**When user requests codebase audit, provide this report:**

```markdown
## Code Refactoring Audit Report

**Date:** [Current Date]
**Codebase:** [Project Name]
**Files Scanned:** [X] files
**Languages:** [JavaScript/TypeScript/Python/etc]

---

### Summary Statistics

| Metric                             | Count         |
| ---------------------------------- | ------------- |
| 🛑 Critical files (>300 lines)     | [X] files     |
| 🚨 High priority (200-300 lines)   | [X] files     |
| ⚠️ Medium priority (150-200 lines) | [X] files     |
| ✅ Healthy files (<150 lines)      | [X] files     |
| **Total files needing attention**  | **[X] files** |

---

### Top 10 Files Needing Refactoring

| Rank | File    | Lines | Type   | Last Changed | Priority |
| ---- | ------- | ----- | ------ | ------------ | -------- |
| 1    | [file1] | 450   | React  | 2 days ago   | P0       |
| 2    | [file2] | 420   | Python | 1 week ago   | P0       |
| 3    | [file3] | 380   | React  | 2 weeks ago  | P1       |
| ...  | ...     | ...   | ...    | ...          | ...      |

---

### Refactoring Recommendations by Priority

#### 🛑 P0 - Critical (Fix within 1 week)

1. **[file1.tsx]** (450 lines)
   - Issues: Too many hooks (6+), large data arrays
   - Recommendations: Extract custom hook, data file, sub-components
   - Estimated time: 8 hours
   - Impact: High - frequently changed file

2. **[file2.py]** (420 lines)
   - Issues: God class, too many methods (15+)
   - Recommendations: Split into 3 focused classes
   - Estimated time: 6 hours
   - Impact: High - critical business logic

#### 🚨 P1 - High Priority (Fix within 1 month)

[Continue for P1 files...]

#### ⚠️ P2 - Medium Priority (Fix within quarter)

[Continue for P2 files...]

---

### Recommended Approach

**Phase 1 (Weeks 1-2): Critical Files**

- Focus on P0 files only
- Estimated time: [X] hours
- Expected outcome: [X] files under 200 lines

**Phase 2 (Weeks 3-6): High Priority Files**

- Address P1 files
- Estimated time: [X] hours
- Expected outcome: [X] files refactored

**Phase 3 (Months 2-3): Medium Priority Files**

- Tackle P2 files opportunistically
- Refactor when making other changes
- Estimated time: [X] hours

**Total Estimated Time:** [X] hours over [X] months

---

### Long-Term Maintenance

**To prevent new technical debt:**

- ✅ Auto-invoke this skill before editing files
- ✅ Monitor file sizes during creation
- ✅ Quarterly codebase audits
- ✅ Enforce size limits in code review

---

### Next Steps

1. Review and approve refactoring roadmap
2. Schedule P0 files for upcoming sprint
3. Set up monitoring for file sizes
4. Establish code review guidelines

---

**Report Generated By:** Code Refactoring Skill
**Review Date:** [Date]
```

### Batch Analysis Commands

**Quick audit commands:**

```bash
# Count all oversized React components
find src -name "*.tsx" -exec wc -l {} \; | awk '$1 > 200' | wc -l

# List all Python modules over 300 lines
find . -name "*.py" -exec wc -l {} \; | awk '$1 > 300' | sort -rn

# Get average file size by type
find src -name "*.tsx" -exec wc -l {} \; | awk '{sum+=$1; count++} END {print "Average:", sum/count}'

# Find files changed recently that are oversized (high risk)
find src -name "*.tsx" -mtime -7 -exec wc -l {} \; | awk '$1 > 200'
```

### Integration with Existing Workflow

**When conducting audit, also:**

1. Check git history for frequently changed large files (higher priority)
2. Look for duplicate code patterns across files
3. Identify missing tests in large files
4. Note files with complex cyclomatic complexity

---

## ⛔ WHEN NOT TO REFACTOR

**Based on industry best practices and Martin Fowler's "Refactoring"**

**CRITICAL:** Knowing when to skip refactoring is as important as knowing when to refactor. The following situations indicate you should **NOT** refactor:

### 1. No Test Coverage

**Situation:** Code has little or no automated tests

**Why Skip:**

- Refactoring without tests = Breaking code blindly
- No way to verify functionality unchanged
- High risk of introducing bugs

**What to Do Instead:**

1. Write tests first (characterization tests)
2. Get to >70% coverage
3. THEN refactor safely

**Exception:** If adding tests is impractical, document current behavior thoroughly and proceed with extreme caution.

---

### 2. Frozen/Maintenance-Only Code

**Situation:** Code will never change again or is in maintenance-only mode

**Why Skip:**

- No ROI - refactoring yields zero business value
- Risk of breaking stable code
- Wastes time that could be spent on active features

**What to Do Instead:**

- Leave it alone
- Document known issues
- Only fix critical bugs

**Example:** Legacy system being replaced in 6 months - don't refactor it.

---

### 3. During Production Incidents

**Situation:** System is down or experiencing critical issues

**Why Skip:**

- Time-critical situation
- Refactoring adds risk
- Focus should be on restoration

**What to Do Instead:**

1. Fix the incident (quick and dirty if needed)
2. Restore service
3. Add incident fix to refactoring backlog
4. Refactor later when stable

---

### 4. Tight Deadlines / Concurrent Work

**Situation:** Sprint deadline in 2 days, or multiple developers working on same file

**Why Skip:**

- Refactoring takes time
- Blocks other work
- Merge conflicts
- Pressure leads to mistakes

**What to Do Instead:**

- Schedule refactoring for next sprint
- Create technical debt ticket
- Prioritize delivery now, refactor later
- Use feature flags if must deploy

**Exception:** If refactoring makes feature implementation faster, do quick prep refactoring.

---

### 5. Large Changes All at Once

**Situation:** Planning to refactor entire module/package in one go

**Why Skip:**

- High risk of breaking everything
- Blocks all development
- Hard to review
- Can't roll back partially

**What to Do Instead:**

- Break into small incremental refactorings
- One class/file at a time
- Commit after each step
- Spread over multiple sprints

**Rule:** If refactoring takes >1 day, it's too large.

---

### 6. Learning New Codebase

**Situation:** First week on new project, trying to understand code

**Why Skip:**

- Don't understand domain yet
- Might break important (but ugly-looking) code
- Could be misunderstanding the "right" design

**What to Do Instead:**

1. Read code first (weeks/months)
2. Ask questions about why it's structured this way
3. Make small, safe changes
4. Propose refactoring after you understand

**Timeline:** Wait 2-4 weeks before major refactoring.

---

### 7. No Clear Improvement

**Situation:** Code works fine, you just want it "prettier"

**Why Skip:**

- Perfectionism trap
- No measurable benefit
- Risk introduction of bugs
- Code is never 100% perfect

**What to Do Instead:**

- Define specific improvement goal (faster? more testable? easier to extend?)
- If no clear goal, skip it
- Move on to impactful work

**Quote:** "Good enough is good enough" - focus on value

---

### 8. Deep Architectural Problems

**Situation:** Core architecture is wrong, refactoring won't fix it

**Why Skip:**

- Refactoring treats symptoms, not cause
- Need architectural redesign instead
- Wastes effort on wrong solution

**What to Do Instead:**

- Document architectural issues
- Plan rewrite or major redesign
- Get buy-in from stakeholders
- Don't band-aid with refactoring

**Example:** Monolith needs to be microservices - refactoring classes won't help.

---

### 9. Third-Party / Generated Code

**Situation:** Code you don't control (vendor libraries, code generators)

**Why Skip:**

- Changes will be overwritten
- Not your responsibility
- Breaks support/warranties

**What to Do Instead:**

- Wrapper pattern around third-party code
- Adapter pattern for generated code
- Submit fixes upstream
- Document workarounds

---

### 10. Missing Business Context

**Situation:** Code seems wrong but you don't know the business rules

**Why Skip:**

- What looks like a bug might be a feature
- Could break compliance/regulatory requirements
- Might affect revenue

**What to Do Instead:**

1. Ask product owner / domain expert
2. Understand WHY code is this way
3. Get approval before changing
4. Document business rules

**Example:** "Why is this discount calculated weirdly?" → Turns out it's tax law requirement.

---

## 🚨 Risk Mitigation When You MUST Refactor in "Skip" Situations

Sometimes you have no choice. Here's how to reduce risk:

### Emergency Refactoring Checklist

**If you must refactor when tests are missing:**

- [ ] Document current behavior in detail
- [ ] Get pair programming partner
- [ ] Make smallest possible changes
- [ ] Manual testing after each tiny step
- [ ] Have rollback plan ready

**If you must refactor under tight deadline:**

- [ ] Get stakeholder approval for deadline extension
- [ ] Use feature flags to hide incomplete work
- [ ] Time-box refactoring (max 2 hours)
- [ ] If not done in time-box, revert and defer

**If you must refactor during concurrent work:**

- [ ] Communicate with team
- [ ] Lock file or use branches
- [ ] Coordinate merge timing
- [ ] Pair program if possible

---

## 📊 Decision Matrix: Should I Refactor?

| Factor                | Refactor Now        | Defer                    | Skip Entirely        |
| --------------------- | ------------------- | ------------------------ | -------------------- |
| **Test coverage**     | >70%                | 40-70% (add tests first) | <40% (risky)         |
| **Code activity**     | Changed weekly      | Changed monthly          | Rarely/never changed |
| **Business value**    | Enables features    | Improves quality         | No benefit           |
| **Deadline pressure** | None                | 1-2 weeks away           | <1 week              |
| **Understanding**     | Fully understand    | Mostly understand        | Learning codebase    |
| **Team availability** | Available           | Partially available      | All busy             |
| **Risk level**        | Low (small changes) | Medium (need planning)   | High (deep changes)  |

**Green zone (3+ "Refactor Now"):** Go ahead!
**Yellow zone (Mixed):** Defer to better time
**Red zone (3+ "Skip"):** Don't refactor

---

## 💡 Alternatives to Refactoring

When you can't refactor, consider these alternatives:

### 1. Strangler Fig Pattern

- Build new system alongside old
- Gradually migrate functionality
- Retire old code piece by piece

### 2. Facade Pattern

- Create clean interface around ugly code
- Isolate mess behind boundary
- New code uses facade, old code untouched

### 3. Documentation

- Can't fix code? Document it
- Explain why it's complex
- Warn future developers

### 4. Feature Flags

- Hide refactored code behind flag
- Test in production safely
- Roll back instantly if issues

### 5. Technical Debt Register

- Document what needs refactoring
- Prioritize by business impact
- Schedule for future sprints

---

## 🎯 The Pragmatic Approach

**Remember:**

- Code doesn't need to be perfect
- Refactoring has costs (time, risk)
- Focus on value, not aesthetics
- Sometimes "leave it alone" is the right answer

**Quote from Martin Fowler:**

> "Refactoring isn't a goal in itself. The goal is to deliver software faster with less pain. If refactoring doesn't help with that, don't do it."

---

## TDD INTEGRATION: Red-Green-Refactor Workflow

**Test-Driven Development (TDD) provides the safest refactoring workflow.**

### The Red-Green-Refactor Cycle

```
    ┌──────────────┐
    │     RED      │  Write failing test
    │  (Test fail) │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │    GREEN     │  Write minimum code to pass
    │  (Test pass) │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   REFACTOR   │  Improve code while tests green
    │ (Tests stay  │  ← THIS IS WHERE OUR SKILL HELPS
    │    green)    │
    └──────┬───────┘
           │
           │
           └─────────► Repeat
```

### Phase 1: RED - Write Failing Test

**Purpose:** Define what success looks like BEFORE writing code

**Steps:**

1. Write test for new behavior
2. Run test → should fail (red)
3. Verify test failure is for RIGHT reason

**Example (JavaScript/Jest):**

```javascript
// RED: Test fails because calculateDiscount doesn't exist yet
describe('User', () => {
  it('should apply loyalty discount for eligible users', () => {
    const user = new User({
      orders: 15,
      totalSpent: 2000,
      membershipYears: 3,
    });

    const discountedPrice = user.applyLoyaltyDiscount(100);

    expect(discountedPrice).toBe(80); // Expecting 20% discount
  });
});

// Run test → FAILS (good!)
```

---

### Phase 2: GREEN - Make Test Pass (Minimum Code)

**Purpose:** Get to working code as fast as possible

**Steps:**

1. Write minimum code to pass test
2. Don't worry about elegance yet
3. Run test → should pass (green)

**Example:**

```javascript
// GREEN: Minimum code to pass (not pretty, but works!)
class User {
  constructor(data) {
    this.orders = data.orders;
    this.totalSpent = data.totalSpent;
    this.membershipYears = data.membershipYears;
  }

  applyLoyaltyDiscount(price) {
    // Hardcoded for now - just make test pass!
    if (this.orders > 10 && this.totalSpent > 1000 && this.membershipYears > 2) {
      return price * 0.8;
    }
    return price;
  }
}

// Run test → PASSES (good!)
```

---

### Phase 3: REFACTOR - Improve Code (Keep Tests Green)

**Purpose:** Make code maintainable while preserving behavior

**🎯 THIS IS WHERE OUR CODE-REFACTORING SKILL OPERATES**

**Steps:**

1. Code works (tests green)
2. Now make it clean
3. Run tests after EACH tiny change
4. Tests must stay green throughout

**Example:**

```javascript
// REFACTOR: Extract magic numbers and improve readability
class User {
  static LOYALTY_THRESHOLDS = {
    minOrders: 10,
    minSpent: 1000,
    minYears: 2,
    discountRate: 0.2,
  };

  constructor(data) {
    this.orders = data.orders;
    this.totalSpent = data.totalSpent;
    this.membershipYears = data.membershipYears;
  }

  isEligibleForLoyaltyDiscount() {
    const thresholds = User.LOYALTY_THRESHOLDS;
    return this.orders > thresholds.minOrders && this.totalSpent > thresholds.minSpent && this.membershipYears > thresholds.minYears;
  }

  applyLoyaltyDiscount(price) {
    if (this.isEligibleForLoyaltyDiscount()) {
      return price * (1 - User.LOYALTY_THRESHOLDS.discountRate);
    }
    return price;
  }
}

// Run tests → STILL PASSES (good!)
```

**Further refactoring:**

```javascript
// Extract discount logic to separate class
class LoyaltyDiscount {
  static THRESHOLDS = {
    minOrders: 10,
    minSpent: 1000,
    minYears: 2,
    discountRate: 0.2,
  };

  constructor(user) {
    this.user = user;
  }

  isEligible() {
    return this.user.orders > LoyaltyDiscount.THRESHOLDS.minOrders && this.user.totalSpent > LoyaltyDiscount.THRESHOLDS.minSpent && this.user.membershipYears > LoyaltyDiscount.THRESHOLDS.minYears;
  }

  apply(price) {
    if (this.isEligible()) {
      return price * (1 - LoyaltyDiscount.THRESHOLDS.discountRate);
    }
    return price;
  }
}

class User {
  // ... constructor ...

  applyLoyaltyDiscount(price) {
    const discount = new LoyaltyDiscount(this);
    return discount.apply(price);
  }
}

// Run tests → STILL PASSES (good!)
// Now loyalty logic is isolated and testable independently
```

---

### Integration with Our Refactoring Skill

**Our skill enhances the TDD workflow:**

#### During RED Phase:

- Skill is dormant - focus on writing test

#### During GREEN Phase:

- Skill is dormant - focus on passing test quickly
- Code might get messy - that's OK!

#### During REFACTOR Phase:

- **Skill activates!**
- Checks file size
- Suggests extractions
- Executes refactoring with tests green
- Each refactoring step → run tests
- If tests fail → automatic rollback

**Workflow integration:**

```
User: "Add loyalty discount feature" (TDD approach)

Phase 1 - RED:
→ Write failing test
→ Verify failure

Phase 2 - GREEN:
→ Write minimum code
→ Tests pass

Phase 3 - REFACTOR:
→ AI checks User.ts file size
→ Skill auto-invokes: "User.ts is 180 lines, recommend extracting LoyaltyDiscount class"
→ User approves
→ Skill executes extraction
→ Skill runs tests after extraction
→ Tests still pass ✅
→ Refactoring complete

→ User continues with next feature (another RED-GREEN-REFACTOR cycle)
```

---

### TDD Benefits for Refactoring

**1. Safety Net:**

- Tests verify refactoring doesn't break functionality
- Instant feedback on every change
- Confidence to make bold improvements

**2. Better Design:**

- TDD forces you to think about API before implementation
- Leads to more testable code
- Refactoring is easier with good tests

**3. Regression Prevention:**

- Tests catch bugs immediately
- No "it worked yesterday" mysteries
- Refactoring becomes low-risk

**4. Documentation:**

- Tests show how code is meant to be used
- Living documentation that can't get outdated
- Examples for future developers

---

### Refactoring Without TDD (Higher Risk)

If you inherit code without tests:

**Step 1: Write Characterization Tests**

```javascript
// Document current behavior (even if buggy!)
it('should return 0 for negative prices (current behavior)', () => {
  // This might be a bug, but test it first!
  expect(calculateDiscount(-100)).toBe(0);
});
```

**Step 2: Get to acceptable coverage**

- Aim for 70%+ before refactoring
- Focus on critical paths first
- Use code coverage tools

**Step 3: NOW refactor safely**

- With tests in place, proceed as normal
- Use our skill's execution phase
- Tests prevent regressions

---

### Quick Reference: TDD + Refactoring Skill

| TDD Phase            | Skill Status | Action                                  |
| -------------------- | ------------ | --------------------------------------- |
| RED (failing test)   | Inactive     | Write test                              |
| GREEN (minimum code) | Inactive     | Pass test quickly                       |
| REFACTOR             | **Active**   | Skill suggests and executes refactoring |
| Next cycle           | Reset        | Repeat RED-GREEN-REFACTOR               |

**Remember:** In TDD, refactoring is BUILT INTO the workflow. It's not a separate activity you do "later" - it's phase 3 of every cycle!

---

## Additional TDD Resources

- **Kent Beck:** _Test-Driven Development: By Example_
- **Martin Fowler:** _Refactoring_ (assumes TDD workflow)
- **Robert Martin:** _Clean Code_ (TDD chapters)

---

**Integration Note:** Our code-refactoring skill is designed to work seamlessly with TDD. The skill's incremental execution with testing after each step mirrors the TDD philosophy of keeping tests green throughout.
