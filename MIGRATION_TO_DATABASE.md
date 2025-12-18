# Migration from Base64 URLs to Database Storage

## Overview

The OnboardEase platform has been migrated from a stateless base64 URL encoding approach to a stateful database-backed storage system. This enables proper data persistence, management, and tracking of pilot onboarding configurations.

## What Changed

### Before (Base64 URL Approach)
- Configuration encoded in URL hash: `/welcome#base64encodeddata`
- No persistence beyond the URL
- No tracking of who created pilots
- No ability to list or manage pilots
- Large, unwieldy URLs

### After (Database Approach)
- Configuration stored in JSON database with unique IDs
- URLs use clean pilot IDs: `/welcome/abc123xyz`
- Pilot records track creator, timestamps, and status
- Full CRUD operations available
- Manageable, shareable links

## Files Created

### 1. Database Schema (`public/db/pilots.json`)
```json
{
  "pilots": [],
  "metadata": {
    "version": "1.0",
    "lastUpdated": "2025-12-18T00:00:00.000Z",
    "totalPilots": 0
  }
}
```

### 2. Database Utilities (`src/utils/db.ts`)

**PilotRecord Interface**:
```typescript
interface PilotRecord extends OnboardingConfig {
  id: string;              // nanoid(10) - unique identifier
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
  createdBy: string;       // User email who created it
  status: 'active' | 'in-progress' | 'issues' | 'completed';
}
```

**CRUD Functions**:
- `createPilot(config, userEmail)` - Creates new pilot with unique ID
- `getPilotById(id)` - Retrieves pilot by ID
- `getAllPilots()` - Gets all pilots
- `updatePilot(id, updates)` - Updates pilot
- `deletePilot(id)` - Removes pilot
- `getPilotsByUser(userEmail)` - Filters by creator
- `generatePilotLink(id)` - Creates shareable URL

**Storage Mechanism**:
- Reads initial data from `/db/pilots.json`
- All operations persist to `localStorage` (simulating backend)
- Uses nanoid library for ID generation

## Files Modified

### 1. LinkGeneratorPage.tsx
**Before**:
```typescript
const handleGenerateLink = () => {
  const link = generateShareableLink(state.config);
  setShareableLink(link);
};
```

**After**:
```typescript
const handleGenerateLink = async () => {
  const pilot = await createPilot(onboardingState.config, authState.user.email);
  const link = generatePilotLink(pilot.id);
  setShareableLink(link);
};
```

### 2. CustomerWelcomePage.tsx
**Before**:
```typescript
useEffect(() => {
  const parsedConfig = parseConfigFromHash();
  setConfig(parsedConfig);
}, []);
```

**After**:
```typescript
const { id } = useParams<{ id: string }>();

useEffect(() => {
  async function loadPilot() {
    const pilot = await getPilotById(id);
    setConfig(pilot);
  }
  loadPilot();
}, [id]);
```

### 3. CameraDetailsPage.tsx
**Before**:
```typescript
useEffect(() => {
  const parsedConfig = parseConfigFromHash();
  setConfig(parsedConfig);
}, []);

// Navigation
navigate('/setup' + window.location.hash);
```

**After**:
```typescript
const { id } = useParams<{ id: string }>();

useEffect(() => {
  async function loadPilot() {
    const pilot = await getPilotById(id);
    setConfig(pilot);
  }
  loadPilot();
}, [id]);

// Navigation
navigate(`/setup/${id}`);
```

### 4. SetupPage.tsx
**Before**:
```typescript
useEffect(() => {
  const parsedConfig = parseConfigFromHash();
  setConfig(parsedConfig);
}, []);
```

**After**:
```typescript
const { id } = useParams<{ id: string }>();

useEffect(() => {
  async function loadPilot() {
    const pilot = await getPilotById(id);
    setConfig(pilot);
  }
  loadPilot();
}, [id]);
```

### 5. routes/index.tsx
**Before**:
```typescript
{
  path: '/welcome',
  element: <CustomerWelcomePage />,
}
```

**After**:
```typescript
{
  path: '/welcome/:id',
  element: <CustomerWelcomePage />,
}
```

All customer-facing routes now accept `:id` parameter.

### 6. README.md
Updated documentation to reflect:
- Database storage strategy
- PilotRecord schema
- CRUD operation functions
- New URL format (`/welcome/{id}`)
- Database utilities section

## Benefits of Database Approach

### 1. **Data Persistence**
- Pilots stored independently of URLs
- Configuration survives link sharing
- No data loss from URL manipulation

### 2. **Management Capabilities**
- List all pilots in dashboard
- Filter by creator
- Update pilot status
- Delete old pilots

### 3. **Tracking & Analytics**
- Know who created each pilot
- Track creation and update times
- Monitor pilot status progression
- Enable future analytics

### 4. **Cleaner URLs**
- Short, memorable IDs
- More professional appearance
- Easier to share verbally
- No URL length limitations

### 5. **Security**
- Creator tracking via user email
- Ability to implement access control
- Audit trail of changes
- Status management

## URL Format Changes

| Type | Before | After |
|------|--------|-------|
| Welcome | `/welcome#base64data` | `/welcome/abc123xyz` |
| Camera Details | `/camera-details#base64data` | `/camera-details/abc123xyz` |
| Setup | `/setup#base64data` | `/setup/abc123xyz` |

## Testing the Migration

### 1. Create a Pilot
1. Login at http://localhost:5173/login
2. Click "New Pilot" button
3. Fill in configuration fields
4. Click "Generate Shareable Link"
5. Verify link format: `/welcome/{10-char-id}`

### 2. Share with Customer
1. Copy generated link
2. Open in incognito/new browser
3. Verify pilot loads correctly
4. Click "Get Started"
5. Verify ID passes to `/camera-details/{id}`
6. Complete flow to `/setup/{id}`

### 3. Check Database
```javascript
// In browser console
const db = localStorage.getItem('pilots_db');
console.log(JSON.parse(db));
```

Should show:
```json
{
  "pilots": [
    {
      "id": "abc123xyz",
      "pilotName": "...",
      "createdBy": "tushar@wobot.ai",
      "createdAt": "2025-01-...",
      "status": "active"
    }
  ],
  "metadata": {...}
}
```

## Future Enhancements

### Short-term
- [ ] Integrate dashboard to display actual pilots from database
- [ ] Add edit pilot functionality
- [ ] Implement pilot status updates
- [ ] Add delete pilot confirmation

### Medium-term
- [ ] Real backend API integration
- [ ] Database migration to PostgreSQL/MongoDB
- [ ] User-based access control
- [ ] Pilot analytics dashboard

### Long-term
- [ ] Multi-tenant support
- [ ] Advanced filtering and search
- [ ] Pilot templates
- [ ] Export pilot data

## Backward Compatibility

⚠️ **Breaking Change**: Old base64 URL links will no longer work.

**Migration Path**:
1. No automatic migration possible (stateless → stateful)
2. Users must regenerate links using new system
3. Inform existing customers of link expiration
4. Provide new links generated from database

## Technical Notes

### localStorage Structure
```javascript
// Key: 'pilots_db'
// Value: DatabaseSchema JSON string
{
  pilots: PilotRecord[],
  metadata: {
    version: "1.0",
    lastUpdated: ISO_TIMESTAMP,
    totalPilots: NUMBER
  }
}
```

### ID Generation
- Library: `nanoid`
- Length: 10 characters
- Alphabet: URL-safe characters (A-Za-z0-9_-)
- Collision probability: ~1% after 3.5M IDs

### Error Handling
All customer-facing pages handle missing pilots:
1. Check if ID exists in URL params
2. Attempt to load from database
3. Show error toast if not found
4. Redirect to home page

## Dependencies

No new dependencies added. Existing `nanoid` package used for ID generation.

## Rollout Checklist

- [x] Create database schema and utilities
- [x] Update LinkGeneratorPage to save to database
- [x] Update routing to support `:id` parameters
- [x] Update CustomerWelcomePage to load by ID
- [x] Update CameraDetailsPage to load by ID
- [x] Update SetupPage to load by ID
- [x] Update README documentation
- [x] Test complete flow
- [ ] Update dashboard to use real database
- [ ] Add pilot management UI
- [ ] Implement status updates
- [ ] Add analytics tracking

## Support

For questions or issues with the database migration, contact the development team.

---

**Migration Date**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete
