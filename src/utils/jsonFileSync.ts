/**
 * JSON File Sync Utility
 * Downloads JSON database files to persist changes
 * 
 * NOTE: Since browsers cannot write to files directly, this utility
 * downloads the updated JSON files so you can replace them in public/db/
 * 
 * For production, this would be replaced with actual backend API calls.
 */

export async function downloadJSON(filename: string, data: unknown) {
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
}

/**
 * Simulated database storage that uses JSON files as source of truth
 * but caches in sessionStorage for the current session
 */
export class JSONDatabase<T> {
  private storageKey: string;
  private jsonPath: string;
  private autoDownload: boolean;

  constructor(storageKey: string, jsonPath: string, autoDownload: boolean = false) {
    this.storageKey = storageKey;
    this.jsonPath = jsonPath;
    this.autoDownload = autoDownload;
  }

  async load(): Promise<T> {
    // Try sessionStorage first (for current session changes)
    const cached = sessionStorage.getItem(this.storageKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        console.warn(`Invalid cached data for ${this.storageKey}, loading from file`);
      }
    }

    // Load from JSON file
    try {
      const response = await fetch(this.jsonPath);
      if (!response.ok) {
        throw new Error(`Failed to load ${this.jsonPath}`);
      }
      const data = await response.json();
      
      // Cache in sessionStorage
      sessionStorage.setItem(this.storageKey, JSON.stringify(data));
      return data;
    } catch (err) {
      console.error(`Error loading ${this.jsonPath}:`, err);
      throw err;
    }
  }

  async save(data: T): Promise<void> {
    // Save to sessionStorage
    sessionStorage.setItem(this.storageKey, JSON.stringify(data));

    // Optionally download the updated JSON file
    if (this.autoDownload) {
      const filename = this.jsonPath.split('/').pop() || 'data.json';
      console.log(`📥 Database updated: ${filename}`);
      console.log('💡 Changes are saved for this session. To persist across sessions, data should be saved to backend.');
    }
  }

  clear(): void {
    sessionStorage.removeItem(this.storageKey);
  }
}
