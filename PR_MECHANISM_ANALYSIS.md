# Personal Record (PR) Mechanism - Current Implementation Analysis

## Overview
The PR detection system identifies when a user lifts their maximum load for a specific exercise, tracking both tied PRs and new PRs that exceed previous records.

---

## 📁 Files Involved

### Core Logic
1. **`src/lib/utils/stats.ts`**
   - Function: `getPersonalRecords(workouts, bodyweightKg)` (lines 229-261)
   - Returns: `Map<exerciseName, { maxLoad: string, maxLoadNum: number }>`

2. **`src/components/workout/ExerciseCarousel.tsx`**
   - Lines 93-127: PR calculation logic
   - Lines 379-388: PR badge rendering

### Data Types
3. **`src/types/workout.ts`**
   - `Workout` interface (lines 2-32)
   - Includes `isBodyweight`, `load`, `set1-set5`, `lastSaved`

---

## 🔍 How It Works Currently

### Step 1: Calculate Historical Personal Records

**Function:** `getPersonalRecords(workouts, bodyweightKg)`  
**Location:** `src/lib/utils/stats.ts:229-261`

```typescript
export function getPersonalRecords(
  workouts: Workout[], 
  bodyweightKg?: number
): Map<string, { maxLoad: string; maxLoadNum: number }>
```

**Algorithm:**
1. **Filters:** Only considers workouts with `lastSaved === true`
2. **Loops** through all historical workouts
3. **For each workout:**
   
   **If `isBodyweight === true`:**
   - Extract bodyweight (from localStorage or parameter)
   - Parse added load from `load` string (e.g., "BW+20" → 20)
   - `effectiveLoad = bodyweight + addedLoad`
   - `displayLoad = added > 0 ? "BW+${added}" : "BW"`
   - Skip if effectiveLoad === 0
   
   **If `isBodyweight === false`:**
   - Extract numeric load from `load` string (e.g., "135 lbs" → 135)
   - `effectiveLoad = parsedNumber`
   - `displayLoad = w.load` (original string)
   - Skip if no numeric match or load === 0

4. **Tracks maximum:** For each exercise, keeps the highest `effectiveLoad` seen
5. **Returns:** Map of `exerciseName → { maxLoad: displayString, maxLoadNum: effectiveNumber }`

**Example Output:**
```javascript
Map {
  "Bench Press" => { maxLoad: "135 lbs", maxLoadNum: 135 },
  "Pull-ups" => { maxLoad: "BW+20", maxLoadNum: 90 }, // if bodyweight is 70kg
  "Squats" => { maxLoad: "225 lbs", maxLoadNum: 225 }
}
```

---

### Step 2: Compare Current Exercise Against Records

**Function:** `prInfo` calculation (useMemo)  
**Location:** `ExerciseCarousel.tsx:100-127`

**Algorithm:**

1. **Get historical record** for current exercise from the Map
2. **If no record exists:** return `null`

3. **Calculate current exercise load:**

   **If `isBodyweight === true`:**
   - Check if ANY set data exists (`set1-set5` not all null/undefined)
   - **If no set data:** return `{ isPR: false, isNewPR: false }` ← **This prevents false PRs on unsaved exercises**
   - Get bodyweight from localStorage
   - Parse added load from current `load` field
   - `currentNum = bodyweight + addedLoad`
   - If currentNum === 0: return `{ isPR: false, isNewPR: false }`
   
   **If `isBodyweight === false`:**
   - If `load` is empty: return `{ isPR: false, isNewPR: false }`
   - Parse numeric load from `load` string
   - If parse fails or isNaN: return `{ isPR: false, isNewPR: false }`
   - `currentNum = parsedLoad`

4. **Determine PR status:**
   ```typescript
   const isNewPR = currentNum > record.maxLoadNum  // Exceeded previous max
   const isPR = currentNum >= record.maxLoadNum    // Tied or exceeded
   return { isPR, isNewPR, maxLoad: record.maxLoad }
   ```

**Return Object:**
```typescript
{
  isPR: boolean,      // true if current >= historical max
  isNewPR: boolean,   // true if current > historical max
  maxLoad: string     // display string of historical max
}
```

---

### Step 3: Display PR Badge

**Location:** `ExerciseCarousel.tsx:379-388`

**Two badge states:**

1. **New PR (Animated):**
   ```tsx
   {prInfo?.isNewPR && (
     <span className="px-2 py-0.5 rounded text-xs font-bold 
                      bg-amber-500/20 text-amber-400 
                      animate-pulse 
                      shadow-[0_0_8px_rgba(245,158,11,0.4)]">
       New PR!
     </span>
   )}
   ```
   - Shown when `currentLoad > historicalMax`
   - Animated pulsing effect
   - Glowing shadow

2. **Tied PR (Static):**
   ```tsx
   {prInfo?.isPR && !prInfo.isNewPR && (
     <span className="px-2 py-0.5 rounded text-xs font-bold 
                      bg-amber-500/20 text-amber-400">
       PR
     </span>
   )}
   ```
   - Shown when `currentLoad === historicalMax`
   - Static badge (no animation)

---

## 🔧 Key Implementation Details

### 1. Historical Comparison Exclusion
**Location:** `ExerciseCarousel.tsx:95-96`

```typescript
const personalRecords = useMemo(
  () => getPersonalRecords(workouts.filter(w => w.week !== currentWeek), bodyweightKg),
  [workouts, currentWeek, bodyweightKg]
)
```

**Why:** Excludes the current week from historical calculations to avoid comparing an exercise against itself.

### 2. False PR Prevention
**Location:** `ExerciseCarousel.tsx:106-110`

```typescript
// Only show PR badge once sets have been recorded
const hasSetData = [currentExercise.set1, currentExercise.set2, 
                    currentExercise.set3, currentExercise.set4, 
                    currentExercise.set5].some(s => s != null)
if (!hasSetData) return { isPR: false, isNewPR: false, maxLoad: record.maxLoad }
```

**Why:** Prevents PR badge from showing on unsaved bodyweight exercises where the load might match the historical max but no work has been performed.

### 3. Bodyweight Exercise Handling
**Special Case:** For bodyweight exercises (`isBodyweight === true`):
- Total load = User's bodyweight + added weight
- Bodyweight stored in `localStorage.getItem('userBodyweightKg')`
- Added weight parsed from `load` field (e.g., "BW+10" → 10)
- If bodyweight is 0 or undefined, treats as 0 (potential issue!)

---

## ⚠️ Current Issues & Limitations

### Issue 1: Bodyweight Exercises Show False PRs on Page Load
**Problem:** When bodyweight is undefined/0, the comparison logic may still show PR badge incorrectly.

**Example:**
- User has bodyweight = 70kg
- Historical PR: Pull-ups with BW+10 (effectiveLoad = 80)
- User clears bodyweight setting (now undefined)
- Current exercise: Pull-ups with BW+10
- `currentNum = 0 + 10 = 10`
- `isPR = 10 >= 80` → **false** (correct)
- But if logic changes or edge case occurs, could show incorrect badge

### Issue 2: Load String Parsing Is Fragile
**Problem:** Uses regex `load.match(/[\d.]+/)` which only gets the first number.

**Example:**
- "10 x 2.5 lbs" → extracts "10", ignores "2.5"
- "Add 2.5 lbs" → extracts "2.5" correctly
- "Heavy" → no match → returns null

### Issue 3: No Historical Context Shown
**Problem:** User sees "PR" badge but doesn't know what their previous PR was.

**Example:**
- Badge says "New PR!" but user doesn't know if they went from 100→105 or 100→200

### Issue 4: Week Exclusion May Be Too Broad
**Problem:** Excludes entire current week, not just current exercise.

**Scenario:**
- User does Bench Press on Monday (Week 4, Day 1) → PR
- User does Squats on Wednesday (Week 4, Day 2)
- Squats comparison excludes ALL Week 4 data, including Monday's Bench Press PR

**Better:** Should exclude only the specific exercise being compared, not the entire week.

### Issue 5: No PR History Tracking
**Problem:** Only tracks the single maximum load ever lifted.

**Missing:**
- When was the PR achieved?
- What was the rep count at that load?
- Historical progression over time

### Issue 6: Tied PR vs New PR Logic Issue
**Problem:** When `currentNum === record.maxLoadNum`, shows "PR" badge (tied), but if saved, the next time user views this exercise, it won't show as PR anymore since it's now in the historical data and will be compared against itself.

**Scenario:**
1. User lifts 135 lbs (new PR, badge shows "New PR!")
2. User saves
3. Next week, user lifts 135 lbs again
4. Badge shows "PR" (tied)
5. User saves
6. User goes back to view that exercise → **no badge shown** because now both 135 lb lifts are in history and it's comparing against itself

---

## 🎯 Potential Improvements

### 1. **Add PR History Panel**
Show a mini timeline or list of previous PRs:
```
Previous PRs:
• 135 lbs - Week 12, Day 1 (Feb 15)
• 130 lbs - Week 10, Day 1 (Feb 1)
• 125 lbs - Week 8, Day 1 (Jan 18)
```

### 2. **Show PR Difference**
```tsx
<span>New PR! +5 lbs from 130 lbs</span>
```

### 3. **Fix Bodyweight Default Handling**
```typescript
const bw = bodyweightKg ?? 0
// Should be:
if (!bodyweightKg && w.isBodyweight) return // skip or warn
```

### 4. **Improve Load Parsing**
Use more sophisticated parsing or require structured data:
```typescript
// Instead of free-form "135 lbs", store:
{ value: 135, unit: 'lbs' }
```

### 5. **Exclude Only Current Exercise, Not Entire Week**
```typescript
const personalRecords = useMemo(
  () => getPersonalRecords(
    workouts.filter(w => !(w.week === currentWeek && w.exercise === currentExercise.exercise)),
    bodyweightKg
  ),
  [workouts, currentWeek, currentExercise, bodyweightKg]
)
```

### 6. **Track Rep Count at PR Load**
Expand the record structure:
```typescript
{
  maxLoad: string,
  maxLoadNum: number,
  repsAtMaxLoad: number,    // NEW
  weekAchieved: number,      // NEW
  dateAchieved: string       // NEW
}
```

### 7. **Add E1RM (Estimated 1 Rep Max) Calculation**
Use formulas like Brzycki or Epley to estimate max strength:
```typescript
E1RM = weight × (1 + reps / 30)
```
This allows comparing PRs at different rep ranges.

---

## 📊 Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│ 1. HISTORICAL DATA COLLECTION                               │
│    workouts.filter(w => w.lastSaved)                        │
│    └─> For each exercise: find max effectiveLoad           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. EXCLUDE CURRENT WEEK                                     │
│    workouts.filter(w => w.week !== currentWeek)             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. BUILD RECORDS MAP                                        │
│    Map<exerciseName, { maxLoad, maxLoadNum }>              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. COMPARE CURRENT EXERCISE                                 │
│    currentLoad >= historicalMax → isPR = true               │
│    currentLoad > historicalMax → isNewPR = true             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. RENDER BADGE                                             │
│    isNewPR → "New PR!" (animated)                           │
│    isPR && !isNewPR → "PR" (static)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Cases

### Test Case 1: First Time Exercise
- **Setup:** No historical data for "Bench Press"
- **Current:** 135 lbs
- **Expected:** No badge (no record to compare against)
- **Actual:** ✅ `prInfo === null`

### Test Case 2: New PR
- **Setup:** Historical max = 135 lbs
- **Current:** 140 lbs
- **Expected:** "New PR!" badge
- **Actual:** ✅ `isNewPR = true, isPR = true`

### Test Case 3: Tied PR
- **Setup:** Historical max = 135 lbs
- **Current:** 135 lbs
- **Expected:** "PR" badge
- **Actual:** ✅ `isNewPR = false, isPR = true`

### Test Case 4: Below PR
- **Setup:** Historical max = 135 lbs
- **Current:** 130 lbs
- **Expected:** No badge
- **Actual:** ✅ `isNewPR = false, isPR = false`

### Test Case 5: Bodyweight Exercise (No Sets Recorded)
- **Setup:** Historical max = BW+10 (80 kg effective)
- **Current:** BW+10 load entered, but no set1-set5 data
- **Expected:** No badge
- **Actual:** ✅ Returns `{ isPR: false, isNewPR: false }`

### Test Case 6: Bodyweight Exercise (Sets Recorded)
- **Setup:** Historical max = BW+10 (70+10=80 kg)
- **Current:** BW+15 (70+15=85 kg), with set data
- **Expected:** "New PR!" badge
- **Actual:** ✅ `currentNum=85 > 80 → isNewPR=true`

---

## 📝 Summary

**What Works:**
✅ Correctly identifies new PRs (exceeding previous max)  
✅ Correctly identifies tied PRs (matching previous max)  
✅ Prevents false PRs on unsaved bodyweight exercises  
✅ Handles both bodyweight and weighted exercises  
✅ Excludes current week from historical comparison  

**What Needs Improvement:**
❌ No historical context shown to user  
❌ Week-level exclusion is too broad  
❌ Load parsing is fragile (regex-based)  
❌ No rep count or date tracking for PRs  
❌ No E1RM calculation for different rep ranges  
❌ Bodyweight exercises vulnerable to undefined bodyweight edge cases  
❌ PR detection resets when exercise is saved and revisited  

---

## 🚀 Next Steps

1. **Decide on improvement priorities** (which issues to fix first)
2. **Design new PR data structure** (add date, reps, week)
3. **Create PR history UI component** (show progression)
4. **Refactor comparison logic** (exercise-level exclusion)
5. **Add E1RM calculations** (optional but powerful)
6. **Write comprehensive tests** (cover edge cases)

