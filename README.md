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
- **Login Page**: Secure authentication with dummy credentials (tushar@wobot.ai / password123)
- **Session Persistence**: Auth state stored in localStorage, survives page refreshes
- **Protected Routes**: Secure pages requiring authentication
- **Route Preservation**: Redirects to intended page after login

### Dashboard Features
- **Personalized Greeting**: Welcome message with user's name, profile avatar, and user type (Platform/Partner)
- **Collapsible Sidebar**: Icon-only navigation with hover tooltips
  - Home, Pilots, Alerts, Users, Customers, Assets, Settings, Logout
- **Pilot Management**: 
  - View recent pilots with progress tracking
  - Clickable pilot cards with hover effects
  - Status badges (Active, In Progress, Issues, Completed)
  - Progress bars with color-coded visualization
- **Stats Overview**: Quick metrics showing total, active, in-progress, and completed pilots
- **New Pilot Button**: Quick access to create new onboarding experiences

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
- **Nanoid 5.0.9** - Unique ID generation
- **Clsx 2.1.1** - Conditional className utility

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx          # Route guard for authenticated pages
│   ├── builder/
│   │   └── ConfigForm.tsx              # Form with toggles & fields
│   ├── dashboard/
│   │   └── PilotCard.tsx               # Pilot card with status & progress
│   ├── layout/
│   │   ├── DashboardLayout.tsx         # Main dashboard wrapper
│   │   ├── Header.tsx                  # Dashboard header with greeting
│   │   └── Sidebar.tsx                 # Collapsible navigation sidebar
│   ├── preview/
│   │   ├── BrowserFrame.tsx            # Browser chrome UI
│   │   └── WelcomePagePreview.tsx      # Live customer view preview
│   └── shared/
│       ├── Button.tsx                  # Reusable button with variants (danger variant added)
│       ├── Input.tsx                   # Styled input component (icon support added)
│       └── Toggle.tsx                  # iOS-style toggle switch
├── contexts/
│   ├── AuthContext.tsx                 # Authentication state management
│   └── OnboardingBuilderContext.tsx    # Onboarding config state
├── pages/
│   ├── LoginPage.tsx                   # Authentication page
│   ├── DashboardPage.tsx               # Main dashboard with pilots
│   ├── PilotDetailsPage.tsx            # Pilot detail view (placeholder)
│   ├── LinkGeneratorPage.tsx           # User onboarding builder
│   ├── CustomerWelcomePage.tsx         # Public customer welcome page
│   ├── CameraDetailsPage.tsx           # Camera configuration page
│   └── SetupPage.tsx                   # Setup completion page
├── routes/
│   └── index.tsx                       # React Router configuration
├── types/
│   ├── auth.ts                         # Authentication types
│   ├── pilot.ts                        # Pilot types & mock data
│   ├── camera.ts                       # Camera configuration types
│   └── onboarding.ts                   # Onboarding config types
├── utils/
│   ├── auth.ts                         # Auth helpers & validation
│   ├── db.ts                           # Pilot database CRUD operations
│   ├── userDb.ts                       # User database CRUD operations
│   ├── customerDb.ts                   # Customer database CRUD operations
│   └── linkGenerator.ts                # Clipboard helper utilities
├── index.css                           # Tailwind imports & custom styles
└── App.tsx                             # Root component with providers
public/
└── db/
    ├── background-presets.json         # 8 Unsplash background images
    ├── pilots.json                     # Pilot database (JSON storage)
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

### OnboardingConfig
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

### Key Design Decisions
- `pilotName`: Always required and visible (core identity)
- `customerBusinessDetails`: Always visible, used for AI image generation only (NOT shown in preview)
- `brandColor`: Defaults to #3b82f6 if toggled off
- `backgroundImage`: Falls back to gradient if toggled off or fails to load
- All toggles default to `true` (show all fields initially)

### User & Customer Types

#### User
```typescript
{
  id: string;              // Unique identifier
  email: string;           // Required - Email address
  name: string;            // Required - Full name
  role: 'admin' | 'user';  // System role for permissions
  userType: 'Platform' | 'Partner';  // Business relationship type
  avatar?: string;         // Optional - Avatar URL
  createdAt: string;       // ISO timestamp
}
```

#### Customer
```typescript
{
  id: string;              // Unique identifier
  name: string;            // Required - Full name
  email: string;           // Required - Email address
  phone?: string;          // Optional - Phone number
  company?: string;        // Optional - Company name
  title?: string;          // Optional - Job title
  timezone?: string;       // Optional - Timezone (e.g., CST, PST)
  createdAt: string;       // ISO timestamp
}
```

## 🚀 Getting Started

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
   - Use credentials: `tushar@wobot.ai` / `password123`
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

### Database Storage Strategy

```typescript
// JSON-based database with localStorage simulation
// Database schema in public/db/pilots.json
{
  "pilots": PilotRecord[],
  "metadata": {
    "version": "1.0",
    "lastUpdated": string,
    "totalPilots": number
  }
}

// PilotRecord extends OnboardingConfig
interface PilotRecord extends OnboardingConfig {
  id: string;              // nanoid(10)
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
  createdBy: string;       // User email
  status: 'active' | 'in-progress' | 'issues' | 'completed';
}

// CRUD Operations
createPilot(config, userEmail) => PilotRecord
getPilotById(id) => PilotRecord | null
getAllPilots() => PilotRecord[]
updatePilot(id, updates) => PilotRecord | null
deletePilot(id) => boolean
getPilotsByUser(userEmail) => PilotRecord[]
generatePilotLink(id) => string  // "/welcome/{id}"
```

**Storage Mechanism**:
- Initial data loaded from `/db/pilots.json`
- All operations persist to `localStorage` (simulating backend)
- Uses nanoid for unique ID generation (10 chars)
- Tracks creator via user email for access control

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

**LinkGeneratorPage.tsx**
- Split-screen layout (60% form, 40% preview)
- Shows shareable link with copy button
- Renders ConfigForm and WelcomePagePreview
- Route: `/`

**CustomerWelcomePage.tsx**
- Full-screen immersive welcome experience
- Parses config from URL hash
- Loading state with spinner
- Error state for invalid/expired links
- Route: `/welcome#config`

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

### Shared Components

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
- `createPilot(config, userEmail)`: Creates new pilot record with unique ID
- `getPilotById(id)`: Retrieves pilot by ID from database
- `getAllPilots()`: Gets all pilots from database
- `updatePilot(id, updates)`: Updates existing pilot record
- `deletePilot(id)`: Removes pilot from database
- `getPilotsByUser(userEmail)`: Filters pilots by creator
- `generatePilotLink(id)`: Creates shareable URL `/welcome/{id}`

**userDb.ts** (User Database)
- `createUser(userData)`: Creates new user with unique ID and timestamp
- `getUserByEmail(email)`: Retrieves user by email address
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
- **Dummy Auth**: Email/password validation in frontend (tushar@wobot.ai)
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

1. **Complete Dashboard Pages**
   - Implement `/pilots` list view (currently redirects to dashboard)
   - Build `/alerts`, `/assets`, `/settings` pages
   - Add PilotDetailsPage with full information and timeline
   - Implement pilot editing and deletion
   - ✅ User management (list, create, view, update, delete) - COMPLETED
   - ✅ Customer management (list, create, view, update, delete) - COMPLETED

2. **Backend Integration**
   - Replace dummy auth with real API authentication
   - JWT token validation and refresh
   - API endpoints for pilot CRUD operations
   - Real-time pilot status updates
   - User management and permissions

3. **Enhanced Pilot Management**
   - Advanced filtering and search
   - Bulk operations (export, archive)
   - Activity logs and audit trail
   - Team collaboration features
   - Document uploads and sharing

4. **Implement AI Image Generation**
   - Use `customerBusinessDetails` field
   - Integrate with Stable Diffusion or DALL-E API
   - Generate on form submission
   - Cache generated images

5. **Customer Onboarding Flow**
   - Complete camera details page workflow
   - Multi-step form validation
   - Progress indicator across steps
   - Email notifications to users
   - Analytics and conversion tracking

6. **Production Readiness**
   - Add comprehensive error boundaries
   - Implement loading states for async operations
   - Session timeout and re-authentication
   - Rate limiting and security headers
   - Analytics integration (Google Analytics, Mixpanel)

## 📊 Current Implementation Status

### ✅ Completed Features
- Authentication system with session persistence
- Dashboard with pilot overview and stats
- Pilot list with status tracking and progress bars
- User management system (CRUD operations)
- Customer management system (CRUD operations)
- Link generator for onboarding experiences
- Customer welcome page with customization
- Camera details and setup pages
- Protected routes and route guards
- Responsive sidebar navigation
- Toast notifications
- Form validation
- Delete confirmation modals
- Search and filter functionality
- Real-time preview for link generator

### 🚧 In Progress
- Pilot details page enhancement
- Activity tracking for users and customers
- Advanced analytics dashboard

### 📋 Planned Features
- Alerts and notifications system
- Digital asset management
- User settings and preferences
- Email notifications
- Export functionality
- Bulk operations
- Advanced reporting

---

**Built with ❤️ by Wobot AI** | OnboardEase v3.0 (with User & Customer Management)

