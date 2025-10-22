# Analytics Page ARIA Labels - Quick Reference

## All Icon-Only and Interactive Buttons with ARIA Labels

### 1. Activity Selector Dropdown
**Button Type:** Dropdown trigger button
**Visual Content:** Activity name (or "All activities") + ChevronDown icon
**ARIA Label:** `"Select activity to filter analytics"`
**Additional ARIA Attributes:**
- `aria-expanded={true|false}`
- `aria-haspopup="listbox"`

**Dropdown Container:**
- `role="listbox"`

**Dropdown Options:**
- **"All" option**
  - `role="option"`
  - `aria-selected={true|false}`

- **Activity options** (for each activity)
  - `role="option"`
  - `aria-selected={true|false}`
  - `aria-label="Filter by {activity.name}"`

---

### 2. Chart Type Selector Dropdown
**Button Type:** Dropdown trigger button with icon
**Visual Content:** Chart type icon (bar/line chart) + "Bar" or "Line" text + ChevronDown icon
**ARIA Label:** `"Select chart type for analytics visualization"`
**Additional ARIA Attributes:**
- `aria-expanded={true|false}`
- `aria-haspopup="listbox"`

**Dropdown Container:**
- `role="listbox"`

**Dropdown Options:**
- **"Bar" option**
  - `role="option"`
  - `aria-selected={true|false}`
  - `aria-label="Display charts as bar charts"`

- **"Line" option**
  - `role="option"`
  - `aria-selected={true|false}`
  - `aria-label="Display charts as line charts"`

---

### 3. Time Period Selection Buttons
**Container:**
- `role="group"`
- `aria-label="Time period selection"`

**Individual Buttons:**

| Visual Text | ARIA Label | aria-pressed |
|------------|-----------|--------------|
| 7D | "Last 7 days" | {true\|false} |
| 2W | "Last 2 weeks" | {true\|false} |
| 4W | "Last 4 weeks" | {true\|false} |
| 3M | "Last 3 months" | {true\|false} |
| 1Y | "Last 1 year" | {true\|false} |

---

## Total Interactive Elements Enhanced

| Element Type | Count | ARIA Attributes Added |
|-------------|-------|----------------------|
| Dropdown trigger buttons | 2 | aria-label, aria-expanded, aria-haspopup |
| Dropdown containers | 2 | role="listbox" |
| Dropdown option buttons | 2+ (dynamic) | role="option", aria-selected, aria-label (for activities) |
| Time period buttons | 5 | aria-label, aria-pressed |
| Button group containers | 1 | role="group", aria-label |

**Total buttons with ARIA labels: 11+ buttons** (2 dropdown triggers + 2+ dropdown options for each dropdown + 5 time period buttons)

---

## Screen Reader Announcements (Expected)

### Activity Selector Button
**Announcement:** "Select activity to filter analytics, button, collapsed/expanded, has popup listbox"

### Chart Type Selector Button
**Announcement:** "Select chart type for analytics visualization, button, collapsed/expanded, has popup listbox"

### Time Period Button (example: 7D)
**Announcement:** "Last 7 days, button, pressed/not pressed"

### Activity Dropdown Option (example)
**Announcement:** "Filter by Test Project, option, selected/not selected"

### Chart Type Dropdown Option
**Announcement:** "Display charts as bar charts, option, selected/not selected"

---

## Accessibility Pattern Used

### Dropdown Pattern
- Trigger button with `aria-haspopup="listbox"` and `aria-expanded`
- Dropdown container with `role="listbox"`
- Options with `role="option"` and `aria-selected`

### Toggle Button Pattern
- Time period buttons use `aria-pressed` to indicate selected state
- Grouped in `role="group"` for related controls

### Best Practices
✅ All labels are descriptive and action-oriented
✅ States are properly communicated (expanded, selected, pressed)
✅ Abbreviations are expanded for clarity
✅ Context is provided for each control's purpose

---

## Visual Appearance

**Important:** All ARIA additions are programmatic only - no visual changes to the UI.
- Same button styles
- Same icons
- Same text
- Same layouts
- Same colors

The improvements are entirely for assistive technology users.
