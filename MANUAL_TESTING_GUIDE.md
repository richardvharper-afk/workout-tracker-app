# Manual Testing Guide - PR Mechanism Fixes

## 🎯 Quick Test Scenarios

Test these scenarios in your browser at http://localhost:3000/ to verify the fixes work correctly.

---

## Test 1: New PR Detection & Tooltip

### Setup
1. Navigate to a saved exercise with historical data (e.g., Bench Press from previous week)
2. Note the previous max load (e.g., 135 lbs)

### Steps
1. Navigate to current week's Bench Press
2. Enter a **higher** load (e.g., 140 lbs)
3. Enter set data (e.g., set1: 8, set2: 7, set3: 7)

### Expected Results
- ✅ "New PR!" badge appears with **animated pulsing** effect
- ✅ Badge has **glowing amber shadow**
- ✅ Hover over badge shows tooltip: `"New PR! Previous: 135 lbs (Week 12, Day 1) • +5"`
- ✅ Cursor changes to help cursor (?) on hover

---

## Test 2: Tied PR Detection & Tooltip

### Setup
1. Same as Test 1

### Steps
1. Enter the **same** load as previous max (e.g., 135 lbs)
2. Enter set data

### Expected Results
- ✅ "PR" badge appears (**static**, no animation)
- ✅ Hover over badge shows tooltip: `"Tied PR: 135 lbs (Week 12, Day 1)"`
- ✅ No glowing effect (unlike New PR)

---

## Test 3: Same Week Exercise Independence

### Setup
1. Week 4, Monday (Day 1) - Complete and save Bench Press with new PR (140 lbs)
2. Verify badge shows "New PR!"

### Steps
1. Navigate to Week 4, Wednesday (Day 2) - Squats
2. Check if you can still see Monday's Bench Press in stats/history

### Expected Results
- ✅ Monday's Bench Press PR is **still visible** in stats
- ✅ Wednesday's Squats comparison **does not exclude** Monday's data
- ✅ If you had a previous Squat PR, it shows correctly (not affected by Monday's Bench PR)

**Before Fix (Bug):**
- ❌ Monday's Bench Press would be excluded from all Week 4 comparisons
- ❌ Stats would be incomplete for same week

---

## Test 4: Load Parsing - Standard Formats

### Test Various Load Formats

| Input | Expected Parse | Badge Result |
|-------|---------------|--------------|
| `135` | 135 | ✅ PR badge if matches/exceeds |
| `135 lbs` | 135 | ✅ Same |
| `135.5` | 135.5 | ✅ Preserves decimal |
| `20.5 kg` | 20.5 | ✅ Removes unit, keeps decimal |
| `60 kg` | 60 | ✅ Standard format |

### Steps
1. Enter each format above in the "Load" field
2. Enter set data
3. Check if PR badge appears correctly

### Expected Results
- ✅ All formats parse correctly
- ✅ Decimals are preserved (before: lost)
- ✅ Units are stripped automatically

---

## Test 5: Load Parsing - Edge Cases

### Test Invalid or Unusual Formats

| Input | Expected Behavior | What to Check |
|-------|------------------|---------------|
| `Heavy` | No crash, returns null | No PR badge shown, no error |
| `BW+10` | Extracts 10 | For bodyweight exercises |
| `10 x 2.5` | Extracts 10 (first number) | Dev console shows warning |
| `` (empty) | Returns null | No PR badge |
| `Random text` | Returns null | No crash, dev warning |

### Steps
1. **Open Browser Console** (F12 → Console tab)
2. Make sure you're in **development mode** (npm run dev)
3. Enter each format above
4. Watch console for warnings

### Expected Results
- ✅ No crashes or errors
- ✅ Console shows warnings like:
  ```
  [parseLoad] Unable to parse load string: "Heavy"
  [parseLoad] Unable to parse load string: "Random text"
  ```
- ✅ PR badge doesn't show for unparseable loads
- ✅ User can continue working (graceful degradation)

---

## Test 6: Bodyweight Exercises

### Setup
1. Go to Profile page
2. Set bodyweight to **70 kg**
3. Find a bodyweight exercise (e.g., Pull-ups, Dips)

### Test A: New PR with Added Weight

**Steps:**
1. Previous PR: BW+5 (effective = 75 kg)
2. Current: Enter `BW+10` in Load field
3. Enter set data

**Expected Results:**
- ✅ Effective load calculated as 70 + 10 = **80 kg**
- ✅ "New PR!" badge appears
- ✅ Tooltip shows: `"New PR! Previous: BW+5 (Week X, Day Y) • +5"`

### Test B: False PR Prevention (No Sets Entered)

**Steps:**
1. Navigate to bodyweight exercise
2. Enter `BW+10` in Load field
3. **Do NOT enter any set data** (leave set1-set5 empty)

**Expected Results:**
- ✅ **No PR badge shown** (prevents false PRs on unsaved exercises)
- ✅ After entering set data → badge appears

---

## Test 7: Tooltip Hovering

### Steps
1. Find an exercise with a PR badge ("New PR!" or "PR")
2. Hover mouse over the badge
3. Wait 1 second for tooltip to appear
4. Move mouse away

### Expected Results
- ✅ Tooltip appears after brief delay
- ✅ Tooltip contains:
  - Previous load value
  - Week number
  - Day number
  - Improvement amount (for New PRs only)
- ✅ Tooltip disappears when mouse moves away
- ✅ Cursor shows help icon (?) when hovering

---

## Test 8: No Historical Data (First Time Exercise)

### Setup
1. Add a brand new exercise you've never done before
2. Enter load and sets

### Expected Results
- ✅ **No PR badge shown** (no historical data to compare against)
- ✅ After saving and returning next week → first badge will appear

---

## 🐛 Known Issues to Watch For

### Issue 1: Bodyweight = 0
**If bodyweight is not set:**
- Bodyweight exercises should show **no PR badge** when effective load = 0
- Check console for any errors

### Issue 2: Same Exercise Twice Same Day
**If you have duplicate exercises in same day:**
- Should compare against **all other instances** except itself
- Badge should appear correctly

---

## 📊 Visual Checklist

### PR Badge Appearance

**"New PR!" Badge:**
```
┌─────────────┐
│  New PR!    │  ← Animated pulsing
└─────────────┘
  ↑ Amber glow effect
  ↑ cursor: help on hover
```

**"PR" Badge (Tied):**
```
┌─────────────┐
│     PR      │  ← Static, no animation
└─────────────┘
  ↑ Amber background
  ↑ cursor: help on hover
```

---

## 🎨 Tooltip Examples

### New PR Tooltip
```
┌──────────────────────────────────────────┐
│ New PR! Previous: 135 lbs                │
│ (Week 12, Day 1) • +5                    │
└──────────────────────────────────────────┘
```

### Tied PR Tooltip
```
┌──────────────────────────────────────────┐
│ Tied PR: 135 lbs (Week 12, Day 1)       │
└──────────────────────────────────────────┘
```

---

## ✅ Final Validation

After completing all tests above, verify:

- [ ] No browser console errors
- [ ] No crashes or frozen UI
- [ ] PR badges appear correctly in all scenarios
- [ ] Tooltips display properly with historical context
- [ ] Load parsing handles all edge cases gracefully
- [ ] Development warnings appear for invalid loads
- [ ] Bodyweight exercises calculate correctly
- [ ] Same-week exercises don't interfere with each other

---

## 📝 Reporting Issues

If you find any bugs:

1. **Note the scenario** (which test failed)
2. **Check browser console** for errors/warnings
3. **Screenshot the issue** if visual
4. **Note the data:**
   - Exercise name
   - Week/Day
   - Load entered
   - Previous PR value
   - Expected vs Actual behavior

---

## 🚀 Next Steps After Testing

Once manual testing confirms everything works:

1. **Commit changes** to git
2. **Deploy to Vercel** (if production-ready)
3. **Monitor for issues** in real usage
4. **Consider Option B** (major PR overhaul) for future enhancement

