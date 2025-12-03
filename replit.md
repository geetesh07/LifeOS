# LifeFlow - Life Management PWA

## Overview

LifeFlow is a comprehensive Progressive Web Application for personal life management, combining productivity tracking, habit formation, time management, and personal journaling in a single unified platform. The application follows a workspace-based organizational model where users can create separate workspaces for different life areas (work, personal, fitness, education, etc.), each containing its own projects, tasks, habits, notes, and time tracking data.

Built as a full-stack TypeScript application, LifeFlow uses a modern React frontend with server-side rendering capabilities and a PostgreSQL database backend. The design philosophy emphasizes clean, information-dense interfaces inspired by productivity tools like Linear and Notion, with a focus on clarity and efficiency over decoration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and data fetching
- shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- Tailwind CSS for utility-first styling with custom design tokens
- Vite as the build tool and development server

**Component Structure:**
- Page-level components in `/client/src/pages/` for each major feature (Dashboard, Tasks, Calendar, Time Tracker, Habits, Diary, Notes, Reports, Projects, Clients, Settings)
- Reusable UI components in `/client/src/components/ui/` following shadcn/ui patterns
- Application-level components (AppSidebar, WorkspaceSwitcher, ThemeToggle) for core navigation and settings

**State Management Strategy:**
- Server state managed through React Query with aggressive caching (`staleTime: Infinity`)
- Workspace context (`WorkspaceProvider`) manages the current workspace selection across the application
- Theme context (`ThemeProvider`) handles light/dark/system theme preferences with localStorage persistence
- Local component state for UI interactions and forms

**Design System:**
- Custom Tailwind configuration with extended color palette using HSL values for theme consistency
- Typography system using Inter font family for UI elements and JetBrains Mono for monospaced content
- Consistent spacing primitives (2, 4, 6, 8, 12, 16) enforced through design guidelines
- Responsive layouts with desktop sidebar navigation (280px fixed width) and mobile bottom navigation

### Backend Architecture

**Technology Stack:**
- Node.js with Express server framework
- TypeScript for type safety across the stack
- Drizzle ORM for database operations with type-safe query building
- Neon serverless PostgreSQL with WebSocket support for connection pooling

**API Design:**
- RESTful API endpoints organized by resource type (workspaces, clients, projects, tasks, time entries, habits, diary entries, notes, events)
- Centralized route registration in `/server/routes.ts`
- Consistent response patterns with proper HTTP status codes
- Request validation using Zod schemas derived from Drizzle table definitions

**Server Structure:**
- Storage abstraction layer (`/server/storage.ts`) implementing IStorage interface for database operations
- Separate database connection management (`/server/db.ts`) using connection pooling
- Static file serving for production builds with SPA fallback routing
- Development mode integration with Vite's middleware for HMR support

### Data Storage Solutions

**Database Schema:**
- PostgreSQL database with Drizzle ORM providing type-safe schema definitions
- Workspace-centric data model where most entities reference a workspace via foreign key
- Cascading deletes configured to maintain referential integrity when workspaces are removed

**Core Entities:**
- **Workspaces**: Top-level organizational containers with customizable name, color, and icon
- **Clients**: Customer/client records associated with workspaces for project management
- **Projects**: Work containers linked to clients with budget tracking and deadline management
- **Tasks**: Action items with priority levels, status tracking, due dates, and project associations
- **TimeEntries**: Time tracking records linked to tasks and projects with start/end timestamps
- **Habits**: Recurring goals with frequency settings and streak tracking
- **HabitCompletions**: Daily completion records for habit tracking
- **DiaryEntries**: Personal journal entries with mood tracking and date association
- **Notes**: Free-form text notes with optional pinning and color coding
- **Events**: Calendar events with date, time, location, and recurrence support
- **UserSettings**: Application preferences and configuration

**Data Relationships:**
- One-to-many relationships from workspaces to most entities (projects, tasks, habits, etc.)
- Projects can optionally reference clients
- Tasks can reference both projects and workspaces
- Time entries reference both tasks and projects for flexible tracking
- Habit completions reference habits with date-based completion tracking

### External Dependencies

**UI Component Libraries:**
- Radix UI primitives (@radix-ui/*) for accessible, unstyled component foundations including Dialog, Dropdown Menu, Select, Accordion, Tooltip, Popover, and 20+ other components
- class-variance-authority for component variant management
- cmdk for command palette functionality
- embla-carousel-react for carousel components
- react-day-picker for calendar date picking
- recharts for data visualization in reports

**Database and ORM:**
- @neondatabase/serverless for PostgreSQL connections with WebSocket support
- drizzle-orm for type-safe database queries and migrations
- drizzle-zod for schema validation integration
- connect-pg-simple for session storage (configured but not actively used)

**Utilities:**
- date-fns for date manipulation and formatting
- zod for runtime type validation and schema definition
- nanoid for unique ID generation
- clsx and tailwind-merge for dynamic class name composition

**Development Tools:**
- Vite plugins for development experience (@replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner)
- esbuild for server-side bundling in production builds
- drizzle-kit for database migrations and schema management

**Build Process:**
- Two-stage build: Vite builds client assets, esbuild bundles server code
- Selective server dependency bundling to reduce cold start times (allowlist in build script)
- Static asset generation to `/dist/public` with server bundle to `/dist/index.cjs`