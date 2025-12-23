/**
 * Database Export Utility
 * Helper functions to export sessionStorage data to JSON files
 * 
 * Usage in browser console:
 * 
 * import { exportAllDatabases } from './utils/exportDb';
 * exportAllDatabases();
 * 
 * Or export individual databases:
 * exportDatabase('pilots_db', 'pilots.json');
 */

/**
 * Download data as JSON file
 */
function downloadJSON(filename: string, data: unknown) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log(`✅ Downloaded: ${filename}`);
}

/**
 * Export a single database from sessionStorage
 */
export function exportDatabase(storageKey: string, filename: string) {
  const data = sessionStorage.getItem(storageKey);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      downloadJSON(filename, parsed);
    } catch (error) {
      console.error(`Failed to export ${storageKey}:`, error);
    }
  } else {
    console.warn(`No data found for ${storageKey}`);
  }
}

/**
 * Export all databases from sessionStorage
 */
export function exportAllDatabases() {
  const databases = [
    { key: 'pilots_db', file: 'pilots.json' },
    { key: 'cameras_db', file: 'cameras.json' },
    { key: 'assets_db', file: 'assets.json' },
    { key: 'objectives_db', file: 'objectives.json' },
    { key: 'remarks_db', file: 'remarks.json' },
    { key: 'users_db', file: 'users.json' },
    { key: 'customers_db', file: 'customers.json' },
    { key: 'pilot_locations_db', file: 'locations.json' },
    { key: 'pilot_contacts', file: 'contacts.json' },
  ];

  console.log('📦 Exporting all databases...');
  
  databases.forEach(({ key, file }) => {
    exportDatabase(key, file);
  });
  
  console.log('✅ Export complete! Check your downloads folder.');
}

/**
 * Print all database contents to console (for debugging)
 */
export function printAllDatabases() {
  const databases = [
    'pilots_db',
    'cameras_db',
    'assets_db',
    'objectives_db',
    'remarks_db',
    'users_db',
    'customers_db',
    'pilot_locations_db',
    'pilot_contacts',
  ];

  console.log('📊 Current Database Contents:\n');
  
  databases.forEach(key => {
    const data = sessionStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log(`\n${key}:`);
        console.log(parsed);
      } catch (error) {
        console.error(`Failed to parse ${key}:`, error);
      }
    } else {
      console.log(`\n${key}: (empty)`);
    }
  });
}

/**
 * Clear all databases (useful for testing)
 */
export function clearAllDatabases() {
  const databases = [
    'pilots_db',
    'cameras_db',
    'assets_db',
    'objectives_db',
    'remarks_db',
    'users_db',
    'customers_db',
    'pilot_locations_db',
    'pilot_contacts',
  ];

  databases.forEach(key => {
    sessionStorage.removeItem(key);
  });
  
  console.log('🗑️ All databases cleared from sessionStorage');
  console.log('💡 Refresh the page to reload from JSON files');
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    exportAllDatabases: typeof exportAllDatabases;
    exportDatabase: typeof exportDatabase;
    printAllDatabases: typeof printAllDatabases;
    clearAllDatabases: typeof clearAllDatabases;
  }
}

// Make functions available in browser console for debugging
if (typeof window !== 'undefined') {
  window.exportAllDatabases = exportAllDatabases;
  window.exportDatabase = exportDatabase;
  window.printAllDatabases = printAllDatabases;
  window.clearAllDatabases = clearAllDatabases;
}
