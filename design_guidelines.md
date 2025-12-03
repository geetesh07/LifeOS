# Design Guidelines: Life Management PWA

## Design Approach
**System-Based Approach** drawing inspiration from **Linear** (clean productivity focus) and **Notion** (versatile workspace management), prioritizing clarity, efficiency, and information density while maintaining visual motivation.

**Core Principles:**
- Information clarity over decoration
- Purposeful spacing for dense content
- Consistent patterns for rapid learning
- Visual hierarchy through typography and layout
- Motivational without distraction

---

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts CDN) - exceptional clarity for UI and data
- Monospace: JetBrains Mono - for time tracking, stats, code-like elements

**Type Scale:**
- Hero/Dashboard Greeting: text-4xl font-bold (36px)
- Section Headers: text-2xl font-semibold (24px)
- Card Titles/Workspace Names: text-lg font-semibold (18px)
- Body/Tasks/Notes: text-base (16px)
- Secondary Info/Metadata: text-sm (14px)
- Labels/Badges: text-xs font-medium (12px)

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16** consistently
- Component padding: p-4 to p-6
- Section spacing: gap-6 to gap-8
- Card margins: space-y-4
- Dense lists: space-y-2

**Container Strategy:**
- Desktop: Fixed sidebar (280px width) + fluid main content area
- Mobile: Bottom tab navigation + full-width content
- Max content width: max-w-7xl for dashboards, max-w-4xl for focused views
- Grid systems: 2-4 columns on desktop, single column mobile

---

## Core Components

### Navigation Architecture
**Desktop:** Persistent left sidebar with workspace switcher at top, primary navigation items (Dashboard, Tasks, Calendar, Time Tracker, Habits, Diary, Notes, Reports), collapsible for focus mode

**Mobile:** Bottom tab bar with 5 primary items (Dashboard, Tasks, Calendar, Time, More), top header with workspace dropdown

**Workspace Switcher:** Dropdown showing all workspaces with color indicators, quick-add button, active workspace prominently displayed

### Dashboard Layout
**Hero Section:** 
- Daily motivational quote (text-2xl italic) with subtle gradient background treatment
- Today's date, current workspace, quick stats row (tasks due, time tracked today, habit streak)

**Widget Grid:** 
- 3-column on desktop (upcoming tasks, recent time entries, habit check-ins)
- Stack on mobile
- Each widget card with clear header, scrollable content area, "View All" action

### Task Management
**Kanban Board:**
- Horizontal scrollable columns (To Do, In Progress, Done, Custom)
- Task cards with drag handles, priority indicators (colored left border), due date badges
- Column headers with task count, add button

**List View:**
- Grouped by priority/project/due date with collapsible sections
- Checkbox, task title, metadata row (project, time estimate, due date)
- Multi-select for bulk actions

**Task Detail Modal:**
- Full-screen on mobile, centered overlay on desktop (max-w-2xl)
- Title, description editor, priority dropdown, due date picker, time estimate, project selector, color picker, subtasks list, comments section

### Calendar View
**Layout:** Week view default, toggle to month/day
- Time slots on left, days across top
- Event blocks with project color coding
- Google Calendar events visually distinguished (opacity or border style)
- Drag to create, click to edit

### Time Tracking
**Active Timer Card:** 
- Large digital display (text-5xl monospace)
- Project selector, task selector, start/stop/pause controls
- Recent entries list below

**Reports View:**
- Date range selector, workspace filter
- Visual breakdown: pie chart for project distribution, bar chart for daily totals
- Detailed table with sortable columns (project, task, duration, date)

### Habit Tracker
**Grid Layout:** 
- Habit cards in 2-3 column grid
- Each card shows habit name, current streak number (large, bold), completion calendar (7-day mini grid)
- Check-in button, progress bar for monthly completion rate

### Daily Diary
**Journal Entry:**
- Date navigation at top
- Rich text editor with markdown support
- Mood selector (emoji or scale)
- Auto-save indicator

**Entry List:** 
- Chronological cards with date, mood indicator, preview text, full-screen read mode

### Notes System
**Layout:** 
- Two-pane on desktop (note list left, editor right, ~30/70 split)
- Full-screen editor on mobile
- Tags displayed as badges, workspace indicator

---

## Component Specifications

**Cards:** Rounded corners (rounded-lg), subtle elevation, padding p-6, clear header section with title and action button

**Buttons:**
- Primary: Solid fill, rounded-md, px-4 py-2, font-medium
- Secondary: Outline style
- Icon buttons: Square touch target (min 44x44px), rounded-md
- Blurred backgrounds when over images

**Form Inputs:**
- Text fields: border-2, rounded-md, px-3 py-2, focus ring
- Dropdowns: Native select styling enhanced
- Date/time pickers: Inline calendar component
- Consistent height (h-10 for standard inputs)

**Badges/Labels:**
- Rounded-full, px-3 py-1, text-xs, for priority, tags, status
- Color-coded by category

**Modals/Overlays:**
- Backdrop with opacity-75
- Content centered, rounded-lg, max-width constraints
- Close button (X icon) top-right
- Slide-up animation on mobile, fade-in on desktop

**Icons:**
- Use **Heroicons** (outline for most UI, solid for emphasis)
- 20px (w-5 h-5) for inline icons, 24px (w-6 h-6) for standalone

---

## Responsive Strategy

**Breakpoints:**
- Mobile: base (< 768px)
- Desktop: md: (≥ 768px)

**Adaptive Patterns:**
- Sidebar → Bottom navigation
- Multi-column grids → Single column stacks
- Side-by-side forms → Vertical stacks
- Horizontal scrolling for Kanban on mobile
- Touch-friendly targets (min 44x44px)

---

## PWA Considerations
- Offline-first UI states with clear indicators ("Offline Mode" banner)
- Loading skeletons for async data
- Pull-to-refresh on mobile
- Install prompt integration

---

## Visual Rhythm
- Consistent card spacing (gap-6)
- Section dividers only when necessary
- Generous padding within interactive areas
- Tight spacing for related items (space-y-2)
- Breathing room around primary actions

This design balances density with clarity, creating a professional productivity tool that motivates daily use while handling complex information architecture across multiple contexts.