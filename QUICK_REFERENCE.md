# Quick Reference Guide - Database Operations

## Browser Console Commands

After starting the app, you can use these commands in the browser console:

### Export All Data to JSON Files

```javascript
exportAllDatabases()
```

Downloads all database files to your Downloads folder. You can then replace the files in `public/db/` to persist changes.

### Export Single Database

```javascript
exportDatabase('pilots_db', 'pilots.json')
exportDatabase('cameras_db', 'cameras.json')
exportDatabase('users_db', 'users.json')
// etc.
```

### View Current Data

```javascript
printAllDatabases()
```

Prints all database contents to console for debugging.

### Clear All Data (Reset)

```javascript
clearAllDatabases()
```

Clears sessionStorage. Refresh page to reload from JSON files.

## Workflow for Persisting Changes

1. **Make changes in the app** (create pilots, add cameras, etc.)
2. **Open browser console** (F12 or Right-click → Inspect)
3. **Run**: `exportAllDatabases()`
4. **Download** the JSON files
5. **Replace** files in `public/db/` with downloaded versions
6. **Commit** to git

## Current Data

### Pilot Data (pilots.json)

```json
{
  "pilots": [
    {
      "name": "Altitude Trampoline Park 101",
      "company": "Altitude Trampoline Park",
      "contactEmail": "owner@altitude.com",
      "location": "USA",
      "locationName": "San fransisco",
      "cameraCount": "22",
      "status": "active",
      "customerId": "1",
      "assignedUserIds": ["1"],
      "createdBy": "john@wobot.ai",
      "id": "daUENwF-6Q"
    }
  ]
}
```

### Location Data (locations.json)

```json
{
  "locations": [
    {
      "id": "zJTyMxtNIH",
      "name": "San fransisco",
      "cityRegion": "USA",
      "cameraCount": "22",
      "status": "active"
    }
  ]
}
```

## Login Credentials

- **Email**: `john@wobot.ai`
- **Password**: `password123`

## File Locations

- **Database JSON files**: `public/db/*.json`
- **Database utilities**: `src/utils/*Db.ts`
- **Export utility**: `src/utils/exportDb.ts`
- **Pilot Details Page**: `src/pages/PilotDetailsPage.tsx`

## Key Features

### Overview Tab Improvements

✅ Beautiful gradient cards with color coding:
- 🔵 **Blue** - Pilot Information
- 🟣 **Purple** - Team Members
- 🟢 **Green** - Objectives
- 🟠 **Orange** - Cameras  
- 🔵 **Cyan** - Assets

✅ Comprehensive pilot information display
✅ Enhanced empty states with call-to-action
✅ User avatars and role badges
✅ "View All" navigation links
✅ Icon headers for each section

### Database Architecture

- **Source of Truth**: JSON files in `public/db/`
- **Runtime Cache**: sessionStorage (current tab only)
- **Auth**: localStorage (persists across sessions)
- **Console Logging**: ✅ indicators when databases update

## Next Steps

1. ✅ Test the new Overview tab UI
2. ✅ Create some test data (objectives, cameras, assets)
3. ✅ Use console commands to export data
4. ✅ Replace JSON files in `public/db/`
5. 🔜 Implement backend API for true persistence

## Common Issues

### Q: My changes disappeared after closing the browser
**A**: That's expected! sessionStorage is cleared when you close the tab. Use `exportAllDatabases()` to save changes to JSON files.

### Q: Changes don't show in a new tab
**A**: Correct! sessionStorage is per-tab. Each tab has its own data until you implement a backend.

### Q: How do I share data with my team?
**A**: Export databases, commit JSON files to git, and your team can pull the changes.

### Q: When should I implement a backend?
**A**: When you need:
- Multi-device access
- Real-time collaboration
- Data security
- Production deployment

## Development Tips

1. **Keep JSON files in git** - They're your source of truth
2. **Export regularly** - Don't lose your work
3. **Use console commands** - They're your friends
4. **Test in incognito** - Verify JSON file loading works
5. **Document changes** - Update JSON files with meaningful data

## Questions?

Check `DATABASE_MIGRATION.md` for detailed migration information.
