# Customer Onboarding Platform (OnboardEase)

A modern, interactive web application for creating customizable customer onboarding experiences for Wobot AI's video management system. The platform features authentication, a comprehensive dashboard for managing pilots, and enables users to generate personalized onboarding links with AI-powered background images and real-time preview.

## 🎯 Overview

This platform provides a complete onboarding solution where:
1. **Authenticated Users** log in to access the dashboard and manage pilots
2. **Users** use a link generator to create customized onboarding experiences
3. **Customers** receive shareable links with personalized welcome pages
4. **AI Integration** generates contextual background images based on company details

## ✨ Features

### Authentication & Dashboard
- **Login Page**: Secure authentication with dummy credentials (john@wobot.ai / password123)
- **Session Persistence**: Auth state stored in localStorage, survives page refreshes
- **Protected Routes**: Secure pages requiring authentication
- **Route Preservation**: Redirects to intended page after login

### Dashboard Features
- **Personalized Greeting**: Welcome message with user's name, profile avatar, and user type (Platform/Partner)
- **Global Search Bar**: Microsoft Teams-style search with `Cmd/Ctrl + K` shortcut
  - Instant search across all data types (300ms debounce)
  - Search pilots, objectives, cameras, assets, users, and locations
  - Grouped results by category with result counts
  - Keyboard navigation (↑ ↓ to navigate, Enter to select, Esc to close)
  - Direct navigation to relevant pages
  - Rich result display with icons, metadata, and visual feedback
- **Collapsible Sidebar**: Icon-only navigation with hover tooltips
  - Home, Pilots, Alerts, Users, Customers, Logout
  - (Assets and Settings temporarily hidden)
- **Pilot Overview**: 
  - View recent 4 pilots assigned to the user (admin sees all)
  - Clickable pilot cards navigating to pilot details
  - Status badges (Draft, Active, In Progress, Issues, Completed, On Hold)
  - Progress bars with color-coded visualization
  - Delete functionality with confirmation modal
- **Stats Overview**: Quick metrics showing total, active, draft, and completed pilots
- **New Pilot Button**: Quick access to create new onboarding experiences

### Pilot Management System
- **Pilot List Page**: Comprehensive view of all pilots with advanced features
  - Search by pilot name
  - Filter by status using interactive stat cards (All, Active, Draft, Completed)
  - Filter by assigned users (admin sees all, users see assigned)
  - Grid layout with detailed pilot cards
  - Delete functionality with confirmation
  - Real-time stats calculation
- **Pilot Details Page**: Full pilot information hub with tabbed interface
  - **Overview Tab**: 
    - Pilot metadata (customer, created date, assigned users)
    - **Date Management**: Start date and expected end date with inline editing
      - Display formatted dates (e.g., "January 20, 2026")
      - Edit button opens modal for updating both dates
      - Expected end date is optional
      - Changes tracked in activity timeline
    - Progress tracking with objectives summary
    - Cameras summary with status breakdown
    - Assets summary with category breakdown
    - Delete pilot functionality
  - **Cameras Tab**: 
    - Create new cameras with drag-and-drop frame upload
    - Upload multiple frames per camera
    - Set primary frame for each camera (visual badge)
    - Edit camera names and comments inline
    - Update camera status (Pending, Installed, Active, Inactive, Issue)
    - Delete individual cameras with confirmation
    - Preview camera frames in grid layout
  - **Assets Tab**: 
    - Upload assets with drag-and-drop or click
    - Categorize assets (Document, Image, Video, Contract, Report, Other)
    - Visual preview for all asset types
    - Download assets with automatic activity logging
    - Delete assets with confirmation and activity logging
    - Grid layout with category badges
  - **Objectives Tab**: 
    - Create and track objectives with descriptions
    - Status tracking (Not Started, In Progress, Completed, Blocked)
    - Priority levels (Low, Medium, High, Critical)
    - Due date management
    - Assigned user selection
    - Progress indicators
  - **Objective Details Page**: Comprehensive objective configuration
    - Use Case section for objective description and business context
    - Success Criteria section with target percentage and description
      - Edit mode: Grid layout with percentage input (1-100%) and description field
      - Display mode: Circular SVG progress indicator with green gradient
      - Activity tracking for all success criteria updates
    - **ROI Configuration section with interactive canvas**
      - **Step 1: Location Selection** - Choose location from available options
      - **Step 2: Camera Selection & ROI Drawing**
        - Camera selector with thumbnail previews
        - Interactive HTML5 canvas for drawing ROI shapes
        - **ROI Profile System**: Create color-coded profiles for different detection types
          - Profile chips with show/all/hide controls
          - Profile deletion with confirmation
          - Maximum 10 profiles per camera
        - **Drawing Tools**: Rectangle, Circle, Polygon, Line, Arrow
        - **Selection Tool**: Click shapes to select, move, resize, or delete
        - **Figma-Style Comments**: Click any shape in Select mode to add comments
          - Fixed-position comment panel appears near clicked shape
          - Real-time comment threads with user avatars
          - Enter key support for quick commenting
          - Comment count badge on panel header
          - Auto-load comments when panel opens
          - Activity logging for all comments
          - Database persistence with localStorage
        - Color picker for shape customization
        - Undo functionality for last drawn shape
        - Unsaved changes tracking with save/discard options
        - Multiple frames per camera with frame switcher
      - Save configuration with validation
    - **Checklist System**: Track objective tasks with comments
      - Regular checklist items with completion tracking
      - AI-generated checklist recommendations
      - Expandable comment threads on each item
      - User avatars and timestamps
      - Activity logging integration
  - **Activity Tab**: 
    - Chronological activity feed
    - User names displayed (not just emails)
    - Activity types (objective created, asset uploaded, asset deleted, success criteria updated, ROI comments, checklist updates, pilot comments, etc.)
    - Timestamp with relative time display
  - **Comments Tab**: Team conversation and collaboration
    - **Sticky comment input** at bottom for easy access
    - Threaded conversations with reply functionality
    - Real-time comment threads with user avatars (gradient-based)
    - Relative timestamps (e.g., "2h ago", "Just now")
    - Different avatar colors for main comments vs replies
    - Inline reply with expand/collapse
    - Enter key support (Cmd/Ctrl + Enter to send)
    - Activity logging for all comments and replies
    - Database persistence with localStorage (26 sample comments across all pilots)
    - Comments grouped by conversation threads
    - No results state with helpful messaging
- **Pilot Creation**: Multi-step wizard with customer selection and configuration
- **Pilot Deletion**: Cascade delete with confirmation (removes all related cameras, assets, objectives, remarks)
- **Status Management**: Support for draft, active, in-progress, completed, on-hold, issues
- **Database Storage**: Persistent storage with localStorage-based JSON database

### User Management System
- **User List Page**: Browse all platform and partner users with advanced filtering
  - Search by name or email
  - Filter by role (Admin/User)
  - Filter by user type (Platform/Partner)
  - Sortable table with actions (Edit/Delete)
- **User Details Page**: View complete user profile with all information
  - Profile header with avatar initials
  - All user fields displayed (name, email, role, userType, avatar, created date)
  - Edit and delete actions with confirmation
  - Recent activity section (placeholder)
- **User Form Page**: Create new users or edit existing ones
  - Form validation (name and email required)
  - Role selection (Admin/User)
  - User type selection (Platform/Partner)
  - Optional avatar URL field
  - Real-time error display
- **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- **Database Storage**: JSON-based with localStorage persistence

### Customer Management System
- **Customer List Page**: Browse all customers with search functionality
  - Search by name, email, or company
  - Displays customer info with company and contact details
  - Sortable table with actions (Edit/Delete)
- **Customer Details Page**: View complete customer profile
  - Profile header with avatar initials
  - All customer fields (name, email, phone, company, title, timezone)
  - Edit and delete actions with confirmation
  - Recent activity section (placeholder)
- **Customer Form Page**: Create new customers or edit existing ones
  - Form validation (name and email required)
  - Optional fields: phone, company, title, timezone
  - Real-time error display
  - Based on attached contact info (Graham Staniforth example)
- **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- **Database Storage**: JSON-based with localStorage persistence

### Link Generator Page (User-Side)
- **Split-Screen Interface**: 60/40 layout with form builder and live preview
- **Toggleable Fields**: Show/hide optional fields with smooth iOS-style toggles
- **Real-time Preview**: See exact customer view instantly in browser frame
- **Shareable Links**: Generate ID-based URLs with database storage
- **Persistent State**: Auto-saves to localStorage (survives page refreshes)
- **AI Image Context**: Customer business details field for AI background generation
- **Background Presets**: 8 curated Unsplash images to choose from
- **Brand Customization**: Custom brand colors for buttons and accents

### Customer Welcome Page
- **Full-Screen Immersive Design**: Not modal-based, fills entire viewport
- **Dynamic Backgrounds**: Image with gradient overlay or solid gradient fallback
- **Animated Content**: Staggered fade-in animations for all elements
- **Responsive Layout**: Logo → Welcome → Message → Contact → CTA → Footer
- **Error Handling**: Graceful fallbacks for invalid links or missing images
- **Brand Theming**: Uses customer's brand color throughout

## 🛠️ Tech Stack

- **React 18.3.1** - UI library with hooks
- **TypeScript 5.6.2** - Type safety with strict mode + verbatimModuleSyntax
- **Tailwind CSS 4.1.18** - Utility-first CSS (v4 with CSS-based config)
- **Vite 7.3.0** - Lightning-fast build tool with HMR
- **React Router DOM 7.1.1** - Client-side routing
- **Framer Motion 12.0.3** - Smooth animations and transitions
- **React Hot Toast 2.4.1** - Toast notifications
- **Nanoid 5.0.9** - Unique ID generation (10-character IDs)
- **Clsx 2.1.1** - Conditional className utility
- **React Dropzone 14.3.5** - Drag-and-drop file upload

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx          # Route guard for authenticated pages
│   ├── builder/
│   │   └── ConfigForm.tsx              # Form with toggles & fields
│   ├── camera/
│   │   ├── CameraCountSelector.tsx     # Camera count selection component
│   │   ├── ChoiceCard.tsx              # Choice card for camera count
│   │   ├── FrameUploader.tsx           # Frame upload component
│   │   └── LocationInput.tsx           # Location input component
│   ├── dashboard/
│   │   └── PilotCard.tsx               # Pilot card with status, progress & delete
│   ├── layout/
│   │   ├── DashboardLayout.tsx         # Main dashboard wrapper
│   │   ├── Header.tsx                  # Dashboard header with greeting & global search
│   │   ├── GlobalSearch.tsx            # Microsoft Teams-style global search modal
│   │   └── Sidebar.tsx                 # Collapsible navigation sidebar
│   ├── preview/
│   │   ├── BrowserFrame.tsx            # Browser chrome UI
│   │   └── WelcomePagePreview.tsx      # Live customer view preview
│   └── shared/
│       ├── Button.tsx                  # Reusable button with variants (danger variant)
│       ├── Input.tsx                   # Styled input component (with icon support)
│       ├── Toggle.tsx                  # iOS-style toggle switch
│       ├── FileUploadZone.tsx          # Drag-drop file upload component
│       └── ImagePreview.tsx            # Image preview with primary frame selection
├── contexts/
│   ├── AuthContext.tsx                 # Authentication state management
│   └── OnboardingBuilderContext.tsx    # Onboarding config state
├── pages/
│   ├── LoginPage.tsx                   # Authentication page
│   ├── DashboardPage.tsx               # Main dashboard with recent pilots
│   ├── PilotsPage.tsx                  # Comprehensive pilots list with search & filter
│   ├── PilotDetailsPage.tsx            # Pilot detail view with cameras/assets/objectives/activity tabs
│   ├── CreatePilotPage.tsx             # Create new pilot wizard
│   ├── LinkGeneratorPage.tsx           # User onboarding builder
│   ├── CustomerWelcomePage.tsx         # Public customer welcome page
│   ├── CameraDetailsPage.tsx           # Camera configuration page
│   ├── SetupPage.tsx                   # Setup completion page
│   ├── UsersPage.tsx                   # User list page
│   ├── UserDetailsPage.tsx             # User detail view
│   ├── UserFormPage.tsx                # User create/edit form
│   ├── CustomersPage.tsx               # Customer list page
│   ├── CustomerDetailsPage.tsx         # Customer detail view
│   └── CustomerFormPage.tsx            # Customer create/edit form
├── routes/
│   └── index.tsx                       # React Router configuration
├── types/
│   ├── auth.ts                         # Authentication types
│   ├── pilot.ts                        # Pilot types with status helpers
│   ├── pilotComment.ts                 # Pilot comment types with reply support
│   ├── camera.ts                       # Camera & frame types
│   ├── customer.ts                     # Customer types
│   └── onboarding.ts                   # Onboarding config & pilot record types
├── utils/
│   ├── auth.ts                         # Auth helpers & validation
│   ├── db.ts                           # Pilot database CRUD operations (with getAllPilots)
│   ├── userDb.ts                       # User database CRUD operations
│   ├── customerDb.ts                   # Customer database CRUD operations
│   ├── cameraDb.ts                     # Camera database CRUD operations (with getAllCameras)
│   ├── assetDb.ts                      # Asset database CRUD operations (with getAllAssets)
│   ├── objectiveDb.ts                  # Objective database CRUD operations (with getAllObjectives)
│   ├── locationDb.ts                   # Location database CRUD operations (with getAllLocations)
│   ├── pilotCommentDb.ts               # Pilot comment database with threading support
│   └── linkGenerator.ts                # Clipboard helper utilities
├── index.css                           # Tailwind imports & custom styles
└── App.tsx                             # Root component with providers
public/
└── db/
    ├── background-presets.json         # 8 Unsplash background images
    ├── pilots.json                     # Pilot database (JSON storage)
    ├── pilot_comments.json             # Pilot comments database (26 sample comments)
    ├── users.json                      # User database (JSON storage)
    └── customers.json                  # Customer database (JSON storage)
```

## 🎨 Design System

### Color Philosophy
- **Primary Brand Color**: User-customizable (default: #3b82f6)
- **Background Gradients**: `from-indigo-50 via-purple-50 to-pink-50`
- **Text Hierarchy**: 
  - Dark mode (with image): White text with shadows
  - Light mode (no image): Gray-900 to Gray-600
- **Overlays**: Black gradients with varying opacity (30% → 70%)

### Typography Scale
- **Hero Text**: 7xl-8xl (Welcome heading)
- **Company Name**: 3xl-4xl
- **Welcome Message**: xl-2xl
- **Body Text**: base-lg
- **Helper Text**: xs-sm

### Layout Patterns
- **Full-Screen Pages**: `min-h-screen flex flex-col`
- **Centering**: `flex items-center justify-center`
- **Spacing**: Space-y utilities (6, 8, 10) for vertical rhythm
- **Max Widths**: 5xl for content, 3xl for messages
- **Responsive**: Mobile-first with md: breakpoints

### Animation Timing
```typescript
// Staggered entrance animations
Logo:     delay: 0.1s, duration: 0.7s
Welcome:  delay: 0.2s, duration: 0.7s
Message:  delay: 0.4s, duration: 0.6s
Contact:  delay: 0.6s, duration: 0.6s
CTA:      delay: 0.8s, duration: 0.6s
Footer:   delay: 1.0s
```

## 📋 Type Definitions

### Core Types

#### OnboardingConfig
```typescript
{
  pilotName: string;              // Required, always visible
  contactPerson: string;          // Optional, toggleable
  customerBusinessDetails: string;  // Required, not toggleable (AI context only)
  brandColor: string;             // Optional, toggleable (hex color)
  welcomeMessage: string;         // Optional, toggleable
  backgroundImage: string;        // Optional, toggleable (URL)
  fieldToggles: {
    contactPerson: boolean;
    welcomeMessage: boolean;
    backgroundImage: boolean;
    brandColor: boolean;
  }
}
```

#### PilotRecord
```typescript
{
  id: string;                        // Unique 10-character ID
  pilotName: string;                 // Pilot name
  customerName: string;              // Customer associated
  status: 'draft' | 'active' | 'in-progress' | 'completed' | 'on-hold' | 'issues';
  progress: number;                  // 0-100 percentage
  startDate: string;                 // Pilot start date (ISO format)
  expectedEndDate?: string;          // Expected pilot completion date (ISO format, optional)
  createdBy: string;                 // Email of creator
  createdAt: string;                 // ISO timestamp
  lastModified: string;              // ISO timestamp
  assignedUserIds: string[];         // Array of user IDs
  assignedUsers?: string[];          // Array of user emails (backward compatibility)
  config: OnboardingConfig;          // Full onboarding configuration
}
```

#### Camera
```typescript
{
  id: string;                        // Unique 10-character ID
  pilotId: string;                   // Associated pilot ID
  name: string;                      // Camera name (e.g., "Camera 1")
  status: 'pending' | 'installed' | 'active' | 'inactive' | 'issue';
  frames: StoredCameraFrame[];       // Array of uploaded frames
  primaryFrameId?: string;           // ID of primary frame
  comments?: string;                 // Optional notes/description
  createdAt: string;                 // ISO timestamp
  createdBy: string;                 // Email of creator
}
```

#### StoredCameraFrame
```typescript
{
  id: string;                        // Unique 10-character ID
  data: string;                      // Base64-encoded image data
  fileName: string;                  // Original file name
  fileType: string;                  // MIME type (e.g., "image/jpeg")
  uploadedAt: string;                // ISO timestamp
}
```

#### Asset
```typescript
{
  id: string;                        // Unique 10-character ID
  pilotId: string;                   // Associated pilot ID
  category: 'document' | 'image' | 'video' | 'contract' | 'report' | 'other';
  fileName: string;                  // File name
  fileType: string;                  // MIME type
  fileSize: number;                  // Size in bytes
  data: string;                      // Base64-encoded file data
  uploadedBy: string;                // Email of uploader
  uploadedAt: string;                // ISO timestamp
}
```

#### SuccessCriteria
```typescript
{
  targetPercentage: number;          // Target success percentage (0-100)
  description: string;               // Description of success criteria
}
```

#### Objective
```typescript
{
  id: string;                        // Unique 10-character ID
  pilotId: string;                   // Associated pilot ID
  title: string;                     // Objective title
  description: string;               // Detailed description
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;               // User ID of assignee
  dueDate?: string;                  // ISO date string
  successCriteria?: SuccessCriteria; // Optional success criteria
  useCase?: string;                  // Business use case description
  locations?: string[];              // Array of location names
  createdBy: string;                 // Email of creator
  createdAt: string;                 // ISO timestamp
}
```

#### Remark (Activity)
```typescript
{
  id: string;                        // Unique 10-character ID
  pilotId: string;                   // Associated pilot ID
  type: 'objective-created' | 'objective-updated' | 'asset-uploaded' | 'asset-deleted' | 'camera-added' | 'camera-updated' | 'general';
  content: string;                   // Activity description
  createdBy: string;                 // Email of creator
  createdAt: string;                 // ISO timestamp
  metadata?: Record<string, any>;    // Additional context data
}
```

#### User
```typescript
{
  id: string;                        // Unique identifier
  email: string;                     // Required - Email address
  name: string;                      // Required - Full name
  role: 'admin' | 'user';            // System role for permissions
  userType: 'Platform' | 'Partner';  // Business relationship type
  avatar?: string;                   // Optional - Avatar URL
  createdAt: string;                 // ISO timestamp
}
```

#### Customer
```typescript
{
  id: string;                        // Unique identifier
  name: string;                      // Required - Full name
  email: string;                     // Required - Email address
  phone?: string;                    // Optional - Phone number
  company?: string;                  // Optional - Company name
  title?: string;                    // Optional - Job title
  timezone?: string;                 // Optional - Timezone (e.g., CST, PST)
  createdAt: string;                 // ISO timestamp
}
```

### Type Helper Functions

#### Pilot Status Helpers
```typescript
// Get badge color for status
getStatusBadgeStyle(status: PilotStatus): string

// Get display text for status
getStatusDisplayText(status: PilotStatus): string
```

## � Database Structure

The application uses **localStorage** for client-side data persistence. All data is stored as JSON with the following structure:

### Storage Keys

- `pilots_db` - Pilot records
- `cameras_db` - Camera records with frames
- `assets_db` - Uploaded asset files
- `objectives_db` - Pilot objectives
- `remarks_db` - Activity feed entries
- `users_db` - User accounts
- `customers_db` - Customer records
- `onboarding-builder-config` - Current onboarding config (session state)
- `auth-user` - Current authenticated user
- `auth-token` - Authentication token

### Database Schemas

#### pilots_db
```json
[
  {
    "id": "abc123xyz0",
    "pilotName": "Acme Corp Setup",
    "customerName": "john@acme.com",
    "status": "active",
    "progress": 45,
    "createdBy": "tushar@wobot.ai",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastModified": "2024-01-15T14:20:00Z",
    "assignedUserIds": ["user123"],
    "config": { /* OnboardingConfig */ }
  }
]
```

#### cameras_db
```json
[
  {
    "id": "cam123xyz0",
    "pilotId": "abc123xyz0",
    "name": "Camera 1",
    "status": "installed",
    "comments": "Main entrance camera",
    "primaryFrameId": "frame12345",
    "frames": [
      {
        "id": "frame12345",
        "data": "data:image/jpeg;base64,...",
        "fileName": "entrance.jpg",
        "fileType": "image/jpeg",
        "uploadedAt": "2024-01-15T11:00:00Z"
      }
    ],
    "createdAt": "2024-01-15T10:45:00Z",
    "createdBy": "tushar@wobot.ai"
  }
]
```

#### assets_db
```json
[
  {
    "id": "asset12345",
    "pilotId": "abc123xyz0",
    "category": "contract",
    "fileName": "service-agreement.pdf",
    "fileType": "application/pdf",
    "fileSize": 245760,
    "data": "data:application/pdf;base64,...",
    "uploadedBy": "tushar@wobot.ai",
    "uploadedAt": "2024-01-15T12:00:00Z"
  }
]
```

#### objectives_db
```json
[
  {
    "id": "obj123xyz0",
    "pilotId": "abc123xyz0",
    "title": "Complete camera installation",
    "description": "Install all 5 cameras at designated locations",
    "status": "in-progress",
    "priority": "high",
    "assignedTo": "user123",
    "dueDate": "2024-01-20",
    "successCriteria": {
      "targetPercentage": 95,
      "description": "Accuracy in camera detection and zone monitoring"
    },
    "useCase": "Monitor customer wait times and queue management at checkout counters",
    "locations": ["Main Entrance", "Checkout Area", "Parking Lot"],
    "createdBy": "tushar@wobot.ai",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### remarks_db
```json
[
  {
    "id": "rem123xyz0",
    "pilotId": "abc123xyz0",
    "type": "asset-uploaded",
    "content": "Uploaded contract: service-agreement.pdf",
    "createdBy": "tushar@wobot.ai",
    "createdAt": "2024-01-15T12:00:00Z",
    "metadata": { "assetId": "asset12345" }
  }
]
```

#### users_db
```json
[
  {
    "id": "user123",
    "email": "john@wobot.ai",
    "name": "John",
    "role": "admin",
    "userType": "Platform",
    "avatar": "https://...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### customers_db
```json
[
  {
    "id": "cust123",
    "name": "John Doe",
    "email": "john@acme.com",
    "phone": "+1-555-0100",
    "company": "Acme Corp",
    "title": "CTO",
    "timezone": "PST",
    "createdAt": "2024-01-10T00:00:00Z"
  }
]
```

### Data Relationships

```
Pilot (1) ──> (N) Cameras
Pilot (1) ──> (N) Assets
Pilot (1) ──> (N) Objectives
Pilot (1) ──> (N) Remarks (Activity)
Pilot (N) ──> (1) Customer (by email)
Pilot (N) ──> (N) Users (by assignedUserIds)
Camera (1) ──> (N) StoredCameraFrames (embedded)
```

### Database Operations

All database utilities follow consistent patterns:

- **Create**: Generate unique ID with `nanoid(10)`, add timestamp, return new record
- **Read**: Filter by ID or pilotId, return single record or array
- **Update**: Merge updates with existing record, update lastModified
- **Delete**: Remove by ID, cascade delete related records for pilots

## �🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Server runs at: **http://localhost:5173**

## 💡 Usage Guide

### For Users - Authentication & Dashboard

1. **Login**:
   - Navigate to http://localhost:5173/ (auto-redirects to /login)
   - Use credentials: `john@wobot.ai` / `password123`
   - Session persists in localStorage

2. **Dashboard**:
   - View recent pilots with progress tracking
   - Check stats: Total, Active, In Progress, Completed
   - Click pilot cards to view details (placeholder page)
   - Use sidebar navigation (hover for labels)

3. **Create New Pilot**:
   - Click "New Pilot" button (top-right)
   - Redirects to `/onboard/new` (Link Generator)

### For Users - Link Generator

1. **Navigate to** `/onboard/new` (or click "New Pilot" from dashboard)
2. **Fill Required Fields**:
   - **Pilot/Company Name**: Customer's company name (always visible)
   - **Customer Business Details**: Description for AI background generation (always visible, not shown in preview)
3. **Toggle Optional Fields** (all enabled by default):
   - **Contact Person**: User's representative name
   - **Brand Color**: Custom hex color for buttons/accents
   - **Welcome Message**: Custom greeting text
   - **Background Image**: Choose from 8 Unsplash presets
4. **Preview in Real-Time**: Right panel shows exact customer view
5. **Generate Link**: Auto-generates on any change
6. **Copy & Share**: Click copy icon to share with customers

### For Customers (Welcome Page)

1. **Receive Link**: User shares URL like `http://localhost:5173/welcome/abc123xyz`
2. **Open Link**: Pilot data loads from database, view personalized experience
3. **Click "Get Started"**: Proceeds to onboarding flow with pilot ID preserved

## 🔧 Implementation Details

### Authentication System

```typescript
// AuthContext with useReducer
const AuthContext = {
  state: { user, token, isAuthenticated, isLoading },
  dispatch: (action: AuthAction) => void
}

// Actions
- LOGIN_SUCCESS: Store user and token
- LOGOUT: Clear auth data and redirect
- RESTORE_SESSION: Load from localStorage on mount
- SET_LOADING: Update loading state

// Protected Routes
- Wrap pages with <ProtectedRoute>
- Saves intended route for post-login redirect
- Shows loading spinner during auth check
```

### State Management Pattern

```typescript
// OnboardingBuilderContext with useReducer
const OnboardingBuilderContext = {
  state: { config: OnboardingConfig },
  dispatch: (action: Action) => void
}

// Actions
- UPDATE_CONFIG: Update any config field
- TOGGLE_FIELD: Show/hide optional fields
- LOAD_CONFIG: Load from localStorage
- RESET_CONFIG: Reset to defaults

// Auto-saves to localStorage on every change
```

### Database Utilities

#### Pilot Database (db.ts)
```typescript
// CRUD operations for pilots
createPilot(config: OnboardingConfig, userEmail: string): Promise<PilotRecord>
getPilotById(id: string): Promise<PilotRecord | null>
getAllPilots(): Promise<PilotRecord[]>
updatePilot(id: string, updates: Partial<PilotRecord>): Promise<void>
deletePilot(id: string): Promise<void>  // Cascade deletes cameras, assets, objectives, remarks
getPilotsByUser(userEmail: string): Promise<PilotRecord[]>
generatePilotLink(id: string): string
```

#### Camera Database (cameraDb.ts)
```typescript
// CRUD operations for cameras
createCamera(pilotId: string, name: string, userEmail: string): Promise<Camera>
getCamerasByPilot(pilotId: string): Promise<Camera[]>
getCameraById(cameraId: string): Promise<Camera | null>
updateCamera(cameraId: string, updates: Partial<Camera>): Promise<void>
deleteCamera(cameraId: string): Promise<void>

// Frame management
addFrameToCamera(cameraId: string, frame: File): Promise<StoredCameraFrame>
removeFrameFromCamera(cameraId: string, frameId: string): Promise<void>
setPrimaryFrame(cameraId: string, frameId: string): Promise<void>
```

#### Asset Database (assetDb.ts)
```typescript
// CRUD operations for assets with activity logging
createAsset(
  pilotId: string,
  file: File,
  category: AssetCategory,
  userEmail: string
): Promise<Asset>
getAssetsByPilot(pilotId: string): Promise<Asset[]>
getAssetById(assetId: string): Promise<Asset | null>
updateAsset(assetId: string, updates: Partial<Asset>): Promise<void>
deleteAsset(assetId: string, userEmail: string): Promise<void>  // Logs activity
downloadAsset(assetId: string, userEmail: string): Promise<void>  // Logs activity
```

#### Objective Database (objectiveDb.ts)
```typescript
// CRUD operations for objectives
createObjective(pilotId: string, data: CreateObjectiveData, userEmail: string): Promise<Objective>
getObjectivesByPilot(pilotId: string): Promise<Objective[]>
getObjectiveById(objectiveId: string): Promise<Objective | null>
updateObjective(objectiveId: string, updates: Partial<Objective>): Promise<void>
deleteObjective(objectiveId: string): Promise<void>
```

#### Remarks Database (remarkDb.ts)
```typescript
// Activity feed operations
createRemark(
  pilotId: string,
  type: RemarkType,
  content: string,
  userEmail: string,
  metadata?: Record<string, any>
): Promise<Remark>
getRemarksByPilot(pilotId: string): Promise<Remark[]>
deleteRemarksByPilot(pilotId: string): Promise<void>
```

#### User Database (userDb.ts)
```typescript
// CRUD operations for users
createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User>
getUserByEmail(email: string): Promise<User | null>
getUserById(id: string): Promise<User | null>
getAllUsers(): Promise<User[]>
updateUser(id: string, updates: Partial<User>): Promise<void>
deleteUser(id: string): Promise<void>
```

#### Customer Database (customerDb.ts)
```typescript
// CRUD operations for customers
createCustomer(customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>
getCustomerByEmail(email: string): Promise<Customer | null>
getCustomerById(id: string): Promise<Customer | null>
getAllCustomers(): Promise<Customer[]>
updateCustomer(id: string, updates: Partial<Customer>): Promise<void>
deleteCustomer(id: string): Promise<void>
```

### File Upload & Preview Components

#### FileUploadZone.tsx
```typescript
// Drag-and-drop file upload component using react-dropzone
<FileUploadZone
  accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}  // File type restrictions
  multiple={true}                                     // Allow multiple files
  maxSize={10 * 1024 * 1024}                         // Max 10MB per file
  onFilesSelected={(files: File[]) => void}          // Callback with selected files
>
  {/* Optional: Custom content inside drop zone */}
</FileUploadZone>
```

#### ImagePreview.tsx
```typescript
// Image preview with primary frame selection
<ImagePreview
  src="data:image/jpeg;base64,..."       // Image source (URL or base64)
  fileName="camera-frame.jpg"             // Display file name
  isPrimary={false}                       // Show primary badge
  onSetPrimary={() => void}               // Set as primary callback
  onRemove={() => void}                   // Remove image callback
/>
```

### Tailwind CSS v4 Configuration

**IMPORTANT**: Tailwind v4 uses CSS-based configuration, NOT JavaScript files.

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  /* Custom animations */
  --animate-fade-in: fade-in 0.5s ease-out;
  --animate-slide-in: slide-in 0.5s ease-out;
  --animate-scale-in: scale-in 0.3s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* ... more keyframes ... */
```

```javascript
// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

**DO NOT** create `tailwind.config.js` - it's incompatible with v4.

### TypeScript Configuration

```json
// tsconfig.json - Key settings
{
  "compilerOptions": {
    "verbatimModuleSyntax": true,  // IMPORTANT: Use "import type" for types
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Always use**: `import type { Type } from './file'` for type-only imports.

### Component Patterns

#### Form Field with Toggle
```tsx
<div className="space-y-2">
  <Toggle
    enabled={config.fieldToggles.fieldName}
    onChange={() => handleToggle('fieldName')}
    label="Field Label"
  />
  <AnimatePresence>
    {config.fieldToggles.fieldName && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Field content */}
      </motion.div>
    )}
  </AnimatePresence>
</div>
```

#### Full-Screen Layout Pattern
```tsx
<div className="relative w-full min-h-screen overflow-hidden">
  {/* Background layer */}
  <div className="absolute inset-0">...</div>
  
  {/* Content layer */}
  <div className="relative z-10 flex flex-col min-h-screen">
    <div className="flex-shrink-0">{/* Header */}</div>
    <div className="flex-1">{/* Main content */}</div>
    <div className="flex-shrink-0">{/* Footer */}</div>
  </div>
</div>
```

#### Dynamic Styling Based on Background
```tsx
const hasBackground = fieldToggles.backgroundImage && backgroundImage;
const themeColor = (fieldToggles.brandColor && brandColor) || '#3b82f6';

<h1 style={{
  color: hasBackground ? '#ffffff' : themeColor,
  textShadow: hasBackground ? '0 4px 30px rgba(0,0,0,0.5)' : 'none'
}}>
  Welcome
</h1>
```

## 🎯 File Responsibilities

### Core Pages

## 🎯 File Responsibilities

### Core Pages

**DashboardPage.tsx**
- Main dashboard showing recent 4 pilots (admin sees all, users see assigned)
- Stats cards with filtering (Total, Active, Draft, Completed)
- Pilot cards with progress bars and delete functionality
- "New Pilot" button for quick pilot creation
- Route: `/dashboard`

**PilotsPage.tsx**
- Comprehensive pilots list with search and filtering
- Interactive stats cards for status filtering (All, Active, Draft, Completed)
- Search by pilot name with real-time filtering
- Grid layout with detailed pilot cards
- Delete functionality with confirmation modal
- Route: `/pilots`

**PilotDetailsPage.tsx**
- Tabbed interface: Overview, Cameras, Assets, Objectives, Activity
- **Overview Tab**: Pilot metadata with editable dates (start date and expected end date), progress, cameras/assets summaries, delete pilot
- **Cameras Tab**: CRUD for cameras, frame upload, primary frame selection, status management
- **Assets Tab**: Asset upload with categories, preview, download, delete, move to camera frames
- **Objectives Tab**: Objective list with cards showing success criteria badges, priority, and status
- **Activity Tab**: Beautiful timeline with chronological feed showing user avatars, activity emojis, relative time, and precise timestamps
- Route: `/pilots/:id`

**ObjectiveDetailsPage.tsx**
- Comprehensive objective configuration page with three main sections
- **Use Case Section**: Describe the business objective and context
- **Success Criteria Section**: Define measurable success with percentage target
  - Edit mode: Number input (1-100%) + description text field
  - Display mode: Circular progress indicator + gradient card
  - Auto-saves and triggers activity logging
- **ROI Configuration Section**: Technical setup with 2 steps
  - Step 1: Location Selection - Choose from available pilot locations
  - Step 2: Camera & ROI Drawing - Interactive HTML5 canvas with advanced features
    - Camera selector with thumbnail previews
    - **ROI Profile System**: Create and manage color-coded detection profiles
    - **Drawing Tools**: Rectangle, Circle, Polygon, Line, Arrow with color picker
    - **Select Tool**: Click, move, resize, and delete shapes
    - **Figma-Style Commenting**: 
      - Click any shape in Select mode to open comment panel
      - Fixed-position panel with viewport-aware positioning
      - Real-time threaded comments with user avatars
      - Comment count badge and empty states
      - Enter key support for quick commenting
      - Automatic activity logging to pilot timeline
    - Undo last shape, unsaved changes tracking
    - Multiple camera frames with frame switcher
- **Checklist Section**: Task management with regular and AI-suggested checklists
  - Create, complete, and delete checklist items
  - **Compact Comment System**: Each checklist item supports threaded comments
    - Click comment icon to expand inline comment thread  
    - Real-time comment addition with user avatars and timestamps
    - Comment count badge on items with comments
    - Comments logged to activity feed and visible in pilot activity tab
  - Separate sections for Regular and AI Checklists with different styling
  - Database-backed with persistence via localStorage
- Smooth animations with Framer Motion (staggered section appearance, expand/collapse comments)
- Route: `/objectives/:id`

**CreatePilotPage.tsx**
- Multi-step wizard for creating new pilots
- Customer selection and pilot configuration
- Start date and expected end date fields
- Location management with multiple locations support
- Contact association and asset upload
- Route: `/pilots/new`

**LinkGeneratorPage.tsx**
- Split-screen layout (60% form, 40% preview)
- Shows shareable link with copy button
- Renders ConfigForm and WelcomePagePreview
- Route: `/onboard/new`

**CustomerWelcomePage.tsx**
- Full-screen immersive welcome experience
- Parses config from URL hash or loads from database by ID
- Loading state with spinner
- Error state for invalid/expired links
- Route: `/welcome/:id` or `/welcome#config`

**UsersPage.tsx**
- User list with search and role filtering
- Admin-only access
- Create, edit, delete users
- Route: `/users`

**CustomersPage.tsx**
- Customer list with search functionality
- Create, edit, delete customers
- Route: `/customers`

### Components

**ConfigForm.tsx**
- All form fields and toggles
- Loads background presets from JSON
- Dispatches UPDATE_CONFIG and TOGGLE_FIELD actions
- Auto-triggers link generation

**WelcomePagePreview.tsx**
- Embedded in BrowserFrame
- Mirrors CustomerWelcomePage exactly
- Shows live preview of customer experience
- Uses same styling logic as CustomerWelcomePage

**BrowserFrame.tsx**
- Decorative browser chrome UI
- URL bar, control buttons (non-functional)
- Wraps preview content

**PilotCard.tsx**
- Clickable card showing pilot summary
- Status badge with color coding
- Progress bar visualization
- Delete button with confirmation
- Supports both Pilot and PilotRecord types
- Accepts onDelete callback for parent refresh

### Shared Components

**FileUploadZone.tsx**
- Drag-and-drop file upload using react-dropzone
- Customizable file type restrictions
- File size validation
- Multiple file support
- Visual feedback for drag state

**ImagePreview.tsx**
- Image preview with primary frame badge
- Hover actions: Set as Primary, Remove
- Displays file name
- Responsive grid layout

### Objective Components

**ROICanvas.tsx**
- Interactive HTML5 canvas for drawing regions of interest (ROI)
- Click-to-draw rectangle creation with visual feedback
- ROI manipulation: Move, resize (future), delete
- Inline name editing for each ROI
- Canvas scales to fit uploaded frame while maintaining aspect ratio
- Hover states and selection highlighting

**ROIProfileModal.tsx**
- Modal for selecting ROI profile templates
- Pre-defined profiles: Person, Vehicle, Zone Violation, Crowd, Object, Face, License Plate
- Each profile has icon, description, and typical use cases
- Applies selected profile to current objective

**ROIProfileChips.tsx**
- Compact chip display of selected ROI profiles
- Shows profile icon and name
- Remove profile functionality
- Animated appearance with Framer Motion

**ROIToolbar.tsx**
- Action toolbar for ROI canvas
- Buttons: Add ROI, Select ROI Profile, Clear All ROIs
- Confirmation dialog for destructive actions
- Consistent styling with primary/secondary button variants

**LocationInput.tsx**
- Multi-select dropdown for location selection
- Add new locations on-the-fly
- Remove selected locations with click
- Animated chips for selected items

**FrameUploader.tsx**
- Frame upload component with drag-and-drop
- Image preview with replace functionality
- Remove uploaded frame action
- Base64 encoding for storage

**Input.tsx**
```tsx
<Input 
  label="Label" 
  placeholder="..." 
  value={value} 
  onChange={handler}
  type="text|color|email|tel|url|..."
  required={boolean}
  error={string}
  icon={ReactNode}  // Optional icon for search inputs
/>
```

**Toggle.tsx**
```tsx
<Toggle 
  enabled={boolean} 
  onChange={handler} 
  label="Field Name"
/>
```

**Button.tsx**
```tsx
<Button 
  variant="primary|secondary|outline|danger"
  onClick={handler}
>
  Button Text
</Button>
```

### Utilities

**db.ts** (Pilot Database)
- `createPilot(config, userEmail)`: Creates new pilot record with unique ID and metadata
- `getPilotById(id)`: Retrieves pilot by ID from database
- `getAllPilots()`: Gets all pilots from database
- `updatePilot(id, updates)`: Updates existing pilot record with lastModified timestamp
- `deletePilot(id)`: Removes pilot and cascade deletes all related cameras, assets, objectives, remarks
- `getPilotsByUser(userEmail)`: Filters pilots by creator email
- `generatePilotLink(id)`: Creates shareable URL `/welcome/{id}`

**cameraDb.ts** (Camera Database)
- `createCamera(pilotId, name, userEmail)`: Creates new camera with unique ID
- `getCamerasByPilot(pilotId)`: Gets all cameras for a specific pilot
- `getCameraById(cameraId)`: Retrieves single camera by ID
- `updateCamera(cameraId, updates)`: Updates camera properties (name, status, comments)
- `deleteCamera(cameraId)`: Removes camera from database
- `addFrameToCamera(cameraId, frame)`: Uploads and stores frame as base64
- `removeFrameFromCamera(cameraId, frameId)`: Deletes specific frame
- `setPrimaryFrame(cameraId, frameId)`: Sets primary frame for camera

**assetDb.ts** (Asset Database)
- `createAsset(pilotId, file, category, userEmail)`: Uploads asset with base64 encoding and activity logging
- `getAssetsByPilot(pilotId)`: Gets all assets for a specific pilot
- `getAssetById(assetId)`: Retrieves single asset by ID
- `updateAsset(assetId, updates)`: Updates asset properties
- `deleteAsset(assetId, userEmail)`: Removes asset and logs deletion activity
- `downloadAsset(assetId, userEmail)`: Triggers browser download and logs activity

**objectiveDb.ts** (Objective Database)
- `createObjective(pilotId, data, userEmail)`: Creates new objective with status tracking
- `getObjectivesByPilot(pilotId)`: Gets all objectives for a specific pilot
- `getObjectiveById(objectiveId)`: Retrieves single objective by ID
- `updateObjective(objectiveId, updates)`: Updates objective properties with activity tracking for success criteria changes
- `deleteObjective(objectiveId)`: Removes objective from database

**Success Criteria Activity Tracking**: When success criteria is updated, an automatic activity log is created with format: "Updated success criteria for [objective] to [percentage]% - [description]"

**remarkDb.ts** (Activity/Remarks Database)
- `createRemark(pilotId, type, content, userEmail, metadata)`: Logs activity with metadata
- `getRemarksByPilot(pilotId)`: Gets chronological activity feed for pilot
- `deleteRemarksByPilot(pilotId)`: Removes all remarks for a pilot (cascade delete)

**userDb.ts** (User Database)
- `createUser(userData)`: Creates new user with unique ID and timestamp
- `getUserByEmail(email)`: Retrieves user by email address
- `getUserById(id)`: Retrieves user by unique ID
- `getAllUsers()`: Gets all users from database
- `updateUser(id, updates)`: Updates existing user record
- `deleteUser(id)`: Removes user from database

**customerDb.ts** (Customer Database)
- `createCustomer(customerData)`: Creates new customer with unique ID and timestamp
- `getCustomerByEmail(email)`: Retrieves customer by email address
- `getAllCustomers()`: Gets all customers from database
- `updateCustomer(id, updates)`: Updates existing customer record
- `deleteCustomer(id)`: Removes customer from database

**linkGenerator.ts**
- `copyToClipboard(text)`: Copies with toast notification

### Context

**OnboardingBuilderContext.tsx**
- Global state with useReducer
- localStorage sync on every action
- Initial load from localStorage or defaults
- Provides `state` and `dispatch` to all components

## 🎨 Background Presets

8 curated Unsplash images in `/public/db/background-presets.json`:

```json
{
  "presets": [
    {
      "id": "modern-office",
      "name": "Modern Office",
      "imageUrl": "https://images.unsplash.com/...",
      "thumbnail": "https://images.unsplash.com/..."
    },
    // ... 7 more presets
  ]
}
```

Categories: Office, Workspace, Nature, Abstract, Urban, Technology

## 🚧 Future Pages (To Be Implemented)

1. **Review Page** - Confirm details before submission
2. **Success Page** - Completion confirmation
3. **Alerts Page** - Notifications and alerts management
4. **Assets Page** - Digital asset management
5. **Settings Page** - User preferences and system configuration

## 📝 Development Guidelines

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/routes/index.tsx`
3. Use existing design patterns (full-screen layout, animations)
4. Match color scheme and typography scale
5. Add to router in `App.tsx`

### Styling Conventions

- Use Tailwind utility classes (avoid custom CSS)
- Follow spacing scale: 2, 4, 6, 8, 10, 12, 16
- Responsive breakpoints: sm, md, lg, xl
- Colors: gray-50 to gray-900, brand colors via inline styles
- Shadows: sm, md, lg, xl, 2xl
- Transitions: `transition-all duration-200` or `duration-300`

### Animation Guidelines

- Use Framer Motion for all animations
- Stagger delays: 0.1s increments
- Duration: 0.2s for toggles, 0.5-0.7s for page loads
- Types: fade-in, slide-in, scale
- Use `AnimatePresence` for mount/unmount animations

### State Management

- Use Context API for global state
- `useReducer` for complex state logic
- localStorage for persistence
- Keep config in single source of truth
- Dispatch actions, never mutate state directly
   - Contact person details
   - "Get Started" button

## 🎨 Customization

### Background Presets

Edit `public/db/background-presets.json` to add/modify background images:

```json
{
  "presets": [
    {
      "id": "unique-id",
      "name": "Display Name",
      "imageUrl": "https://...",
      "thumbnail": "https://..."
    }
  ]
}
```

### Theme Colors

Modify `tailwind.config.js` to customize the color palette and animations.

### Form Fields

Add new fields in `src/types/onboarding.ts` and update the form in `src/components/builder/ConfigForm.tsx`.

## 🔧 Configuration Files

- **tailwind.config.js** - Tailwind CSS configuration with custom animations
- **postcss.config.js** - PostCSS configuration for Tailwind
- **tsconfig.json** - TypeScript configuration
- **vite.config.ts** - Vite build configuration

## � Troubleshooting

### Tailwind Styles Not Working
- Ensure you're using Tailwind v4 syntax (CSS-based, not JS config)
- Check `postcss.config.js` uses `@tailwindcss/postcss`
- Verify `src/index.css` has `@import "tailwindcss"`
- Never create `tailwind.config.js` with v4

### TypeScript Import Errors
- Use `import type { Type }` for type-only imports
- Due to `verbatimModuleSyntax` in tsconfig.json
- Regular imports for values: `import { Component }`

### LocalStorage Not Persisting
- Check browser privacy settings
- Clear localStorage: `localStorage.clear()` in console
- State saves on every UPDATE_CONFIG action

### Background Images Not Loading
- Images use Unsplash URLs (require internet)
- Check CORS headers if using custom images
- Images have `onError` handlers for graceful fallback
- Falls back to gradient if image fails

### Dev Server Not Starting
- Clear node_modules: `rm -rf node_modules && npm install`
- Check port 5173 isn't in use
- Restart with `npm run dev`

## 🔐 Environment Variables

Currently none required (frontend-only app). For future backend integration:

```env
VITE_API_URL=https://api.example.com
VITE_AI_IMAGE_API_KEY=your_api_key
```

Access in code: `import.meta.env.VITE_API_URL`

## 🚢 Deployment

### Build for Production

```bash
npm run build        # Creates dist/ folder
npm run preview      # Test production build locally
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

### Deploy to Netlify

```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Deploy to GitHub Pages

```bash
npm run build
# Deploy dist/ folder to gh-pages branch
```

**Note**: Update base URL in `vite.config.ts` if deploying to subdirectory.

## 📚 Key Learnings & Decisions

### Authentication Architecture
- **Dummy Auth**: Email/password validation in frontend (john@wobot.ai)
- **localStorage**: Persists user and token across sessions
- **Route Guards**: ProtectedRoute component wraps authenticated pages
- **Route Preservation**: Saves intended destination, redirects after login
- **Auto-restore**: Checks localStorage on app mount to restore session

### Dashboard Design
- **Always-Collapsed Sidebar**: Icon-only navigation saves screen space
- **Hover Tooltips**: Labels appear on right-side hover with Framer Motion
- **Dual Status Indicators**: Color-coded badges + percentage progress bars
- **Clickable Cards**: Navigate to pilot details with hover effects
- **Responsive Stats**: Grid layout adapts from 1 to 4 columns

### Routing Strategy
- **Root Redirect**: `/` checks auth state → `/dashboard` or `/login`
- **Protected Routes**: Dashboard, pilots, settings require authentication
- **Public Routes**: Customer-facing pages remain accessible
- **Link Generator**: Moved from `/` to `/onboard/new` (protected)

### Why Hash-Based URLs?
- No backend required for MVP
- Self-contained, shareable links
- Works with static hosting
- Config embedded in URL itself

### Why Context API over Redux?
- Simpler for single-form state
- Built-in React solution
- Less boilerplate
- Sufficient for current scale
- Dual contexts: Auth + Onboarding

### Why Tailwind v4?
- Latest features (CSS-based config)
- Better performance
- Native cascade layers
- Improved IntelliSense

### Why Framer Motion?
- Best-in-class React animations
- Declarative API
- Layout animations
- AnimatePresence for mount/unmount
- Smooth sidebar tooltips and card hovers

### Design Philosophy
- **Minimal & Clean**: No clutter, focus on content
- **Immersive Experience**: Full-screen, not modal-based
- **AI-Ready**: Customer business details field for future AI integration
- **Progressive Enhancement**: Works without JS (base content)
- **Mobile-First**: Responsive from smallest screens

### Data Flow Architecture
- **Single Source of Truth**: All data stored in localStorage with unique keys
- **Cascade Deletes**: Deleting a pilot removes all cameras, assets, objectives, and remarks
- **Activity Logging**: Asset operations automatically create activity entries
- **User Lookup**: Activity feed joins remarks with users to display names
- **Base64 Encoding**: Images and files stored as base64 for localStorage compatibility
- **Optimistic Updates**: UI updates immediately, localStorage syncs in background
- **Type Safety**: Full TypeScript coverage with optional chaining for undefined safety

### File Upload Strategy
- **react-dropzone**: Drag-and-drop with file type and size validation
- **Base64 Encoding**: Convert files to base64 for localStorage storage
- **Preview Generation**: Images previewed directly from base64 data URLs
- **Download Handling**: Convert base64 back to Blob for browser downloads
- **Activity Tracking**: Upload and download events logged automatically

## 📝 Code Style Guide

### Naming Conventions
- **Components**: PascalCase (`WelcomePagePreview.tsx`)
- **Utilities**: camelCase (`linkGenerator.ts`)
- **Types**: PascalCase (`OnboardingConfig`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_CONFIG`)
- **CSS Classes**: kebab-case in HTML, but use Tailwind utilities

### File Organization
```
ComponentName.tsx
├── Imports (React, libraries, local)
├── Types/Interfaces (if component-specific)
├── Component function
├── Hooks (useState, useEffect, etc.)
├── Handlers (handle*, on*)
├── Render logic
└── Export
```

### Import Order
1. React & React libraries
2. Third-party libraries
3. Local utilities
4. Local components
5. Types (with `import type`)
6. Styles/assets

### Comments
- Use JSDoc for functions
- Inline comments for complex logic
- Section comments for major blocks
- No obvious comments

```typescript
/**
 * Creates a new pilot record in the database
 * @param config - Onboarding configuration object
 * @param userEmail - Email of the creating user
 * @returns PilotRecord with unique ID and metadata
 */
export async function createPilot(
  config: OnboardingConfig, 
  userEmail: string
): Promise<PilotRecord> {
  // ... implementation
}
```

## 🧪 Testing (Future)

Recommended testing setup:
- **Vitest**: Unit tests
- **React Testing Library**: Component tests
- **Playwright**: E2E tests
- **MSW**: API mocking

```bash
# Install testing dependencies (not yet added)
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test
npm install -D msw
```

## 📦 Package Scripts

```json
{
  "dev": "vite",                    // Start dev server
  "build": "tsc -b && vite build",  // Type check + build
  "preview": "vite preview",        // Preview production build
  "lint": "eslint .",              // Run ESLint
  "format": "prettier --write ."   // Format code (if added)
}
```

## 🎯 Next Steps for Development

1. **Backend Integration**
   - Replace dummy auth with real API authentication
   - JWT token validation and refresh
   - API endpoints for all CRUD operations
   - Real-time updates with WebSockets
   - Cloud storage for camera frames and assets
   - Database migration from localStorage to PostgreSQL/MongoDB

2. **Enhanced Pilot Management**
   - ✅ Camera management with frame uploads - COMPLETED
   - ✅ Asset management with categorization - COMPLETED
   - ✅ Objectives tracking - COMPLETED
   - ✅ Activity feed with user names - COMPLETED
   - ✅ Pilot deletion with cascade - COMPLETED
   - Advanced filtering and search
   - Bulk operations (export, archive)
   - Team collaboration features
   - Email notifications for status changes

3. **Implement AI Image Generation**
   - Use `customerBusinessDetails` field
   - Integrate with Stable Diffusion or DALL-E API
   - Generate contextual background images
   - Cache generated images in cloud storage

4. **Customer Onboarding Flow**
   - Complete camera details page workflow
   - Multi-step form validation
   - Progress indicator across steps
   - Email notifications to customers
   - Analytics and conversion tracking

5. **Production Readiness**
   - Add comprehensive error boundaries
   - Implement loading states for all async operations
   - Session timeout and re-authentication
   - Rate limiting and security headers
   - Analytics integration (Google Analytics, Mixpanel)
   - Performance optimization (code splitting, lazy loading)
   - SEO optimization for public pages

6. **Testing & Quality Assurance**
   - Unit tests with Vitest
   - Component tests with React Testing Library
   - E2E tests with Playwright
   - Accessibility audits (WCAG 2.1)
   - Performance audits (Lighthouse)

## 📊 Current Implementation Status

### ✅ Completed Features

#### Authentication & Access Control
- ✅ Login/logout with dummy authentication
- ✅ Session persistence with localStorage
- ✅ Protected routes and route guards
- ✅ Role-based access (Admin/User)
- ✅ User type distinction (Platform/Partner)

#### Pilot Management
- ✅ Dashboard with recent pilots overview
- ✅ Pilot list page with search and filtering
- ✅ Pilot details page with tabbed interface
- ✅ Pilot creation wizard
- ✅ Pilot deletion with cascade (removes all related data)
- ✅ Status tracking (Draft, Active, In Progress, Completed, On Hold, Issues)
- ✅ Progress tracking with visual indicators
- ✅ User assignment filtering

#### Camera Management
- ✅ Create cameras for each pilot
- ✅ Upload multiple frames per camera (drag-and-drop)
- ✅ Set primary frame with visual badge
- ✅ Edit camera names and comments inline
- ✅ Update camera status (Pending, Installed, Active, Inactive, Issue)
- ✅ Delete cameras with confirmation
- ✅ Frame preview in grid layout
- ✅ Base64 image storage

#### Asset Management
- ✅ Upload assets with drag-and-drop
- ✅ Categorize assets (Document, Image, Video, Contract, Report, Other)
- ✅ Visual preview for all file types
- ✅ Download assets with activity logging
- ✅ Delete assets with confirmation and logging
- ✅ Grid layout with category badges
- ✅ Base64 file storage

#### Objectives & Activity
- ✅ Create and track objectives
- ✅ Status tracking (Not Started, In Progress, Completed, Blocked)
- ✅ Priority levels (Low, Medium, High, Critical)
- ✅ Due date management
- ✅ Assigned user selection
- ✅ Activity feed with chronological display
- ✅ User names displayed in activity (not just emails)
- ✅ Automated activity logging for asset operations
- ✅ Success Criteria feature with percentage targets and descriptions
  - ✅ Edit mode with number input (1-100%) and text field
  - ✅ Display mode with circular SVG progress indicator with green gradient
  - ✅ Activity tracking for success criteria updates
  - ✅ Success criteria badges on objective cards in pilot details
- ✅ ROI Configuration with interactive canvas
  - ✅ Multi-step configuration (Location Selection → Camera & ROI Drawing)
  - ✅ Camera selector with thumbnail previews
  - ✅ HTML5 canvas-based drawing system
  - ✅ ROI Profile System with color-coded profiles (max 10 per camera)
  - ✅ Drawing tools: Rectangle, Circle, Polygon, Line, Arrow
  - ✅ Select tool for moving, resizing, and deleting shapes
  - ✅ Color picker for shape customization
  - ✅ Undo functionality for last drawn shape
  - ✅ Multiple frames per camera with frame switcher
  - ✅ Unsaved changes tracking with save/discard options
  - ✅ **Figma-Style Comment System for ROI Shapes**
    - ✅ Click any shape in Select mode to open comment panel
    - ✅ Fixed-position panel with smart viewport positioning
    - ✅ Real-time comment threads with user avatars (gradient circles)
    - ✅ Comment count badge on panel header
    - ✅ Enter key support for quick commenting
    - ✅ Auto-load comments when panel opens (lazy loading)
    - ✅ Activity logging integration (comments appear in pilot timeline)
    - ✅ Database persistence via localStorage (17 sample comments)
    - ✅ Empty state with icon and call-to-action
    - ✅ Close panel on shape deselect or tool change
- ✅ **Checklist System with Comments**
  - ✅ Regular and AI-generated checklist items
  - ✅ Expandable inline comment threads on each item
  - ✅ Comment count badges
  - ✅ User avatars and timestamps
  - ✅ Activity logging for all comments
  - ✅ Database persistence (49 checklists, 22 comments across all pilots)
- ✅ Use Case section for business context description
- ✅ Section reorganization for optimal UX flow (Use Case → Success Criteria → ROI Configuration)

#### User Management
- ✅ User list with search and filtering
- ✅ Create, edit, delete users (admin only)
- ✅ Role selection (Admin/User)
- ✅ User type selection (Platform/Partner)
- ✅ User details page

#### Customer Management
- ✅ Customer list with search
- ✅ Create, edit, delete customers
- ✅ Customer details page
- ✅ Form validation

#### UI/UX Features
- ✅ Always-collapsed sidebar with hover tooltips
- ✅ Temporarily hidden Assets and Settings navigation items
- ✅ Toast notifications for all actions
- ✅ Confirmation modals for destructive actions
- ✅ Loading states and error handling
- ✅ Responsive design (mobile-first)
- ✅ Framer Motion animations with staggered section appearances
- ✅ Real-time preview for link generator
- ✅ **Global Search Bar** (Microsoft Teams-style)
  - ✅ Cmd/Ctrl+K keyboard shortcut to open
  - ✅ Searches across 6 entity types (Pilots, Objectives, Cameras, Assets, Users, Locations)
  - ✅ Debounced search with 300ms delay
  - ✅ Grouped results by type with result counts
  - ✅ Keyboard navigation (↑↓ arrows, Enter to select, Escape to close)
  - ✅ Smart navigation to relevant pages with query params
  - ✅ Loading and empty states
- ✅ **Pilot-Level Comments System**
  - ✅ Threaded conversation system with reply functionality
  - ✅ Sticky bottom input for chat-like UX
  - ✅ Comment count badges on tab headers
  - ✅ User avatars (gradient circles with initials)
  - ✅ Timestamps with relative formatting
  - ✅ Activity timeline integration
  - ✅ Database persistence via localStorage
  - ✅ 26 sample comments across different pilots
- ✅ File upload with react-dropzone
- ✅ Search functionality across all list views
- ✅ Button alignment fixes (flex items-center for icons and text)
- ✅ Circular progress indicators with green gradients
- ✅ Interactive canvas with click-to-draw functionality
- ✅ Inline editing for ROI names
- ✅ Multi-select dropdowns with chip display

### 🚧 In Progress
- Advanced analytics dashboard
- Bulk operations for pilots

### 📋 Planned Features
- Alerts and notifications system
- User settings and preferences
- Email notifications
- Export functionality (PDF, CSV)
- Advanced reporting and analytics
- Real-time collaboration features

---

**Built with ❤️ by Wobot AI** | OnboardEase v4.0 (Full Pilot Management Suite)

