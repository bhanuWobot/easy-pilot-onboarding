import { nanoid } from 'nanoid';
import type { Asset } from '../types/asset';
import { createRemark } from './remarkDb';

interface AssetDatabase {
  assets: Asset[];
  metadata: {
    version: string;
    lastUpdated: string;
    totalAssets: number;
  };
}

const ASSETS_DB_KEY = 'assets_db';

async function loadAssetsDatabase(): Promise<AssetDatabase> {
  try {
    const response = await fetch('/db/assets.json');
    if (!response.ok) {
      throw new Error('Failed to load assets database');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading assets from file:', error);
    return {
      assets: [],
      metadata: {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        totalAssets: 0,
      },
    };
  }
}

async function getAssetsDatabase(): Promise<AssetDatabase> {
  const stored = sessionStorage.getItem(ASSETS_DB_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const db = await loadAssetsDatabase();
  saveAssetsDatabase(db);
  return db;
}

function saveAssetsDatabase(db: AssetDatabase): void {
  db.metadata.lastUpdated = new Date().toISOString();
  db.metadata.totalAssets = db.assets.length;
  sessionStorage.setItem(ASSETS_DB_KEY, JSON.stringify(db));
}

export async function createAsset(assetData: Omit<Asset, 'id' | 'uploadedAt'>): Promise<Asset> {
  const db = await getAssetsDatabase();

  // Validate that title is provided
  if (!assetData.title || assetData.title.trim() === "") {
    throw new Error("Asset title is required");
  }

  const newAsset: Asset = {
    ...assetData,
    id: nanoid(10),
    uploadedAt: new Date().toISOString(),
  };

  db.assets.push(newAsset);
  saveAssetsDatabase(db);

  // Create activity log
  await createRemark({
    pilotId: assetData.pilotId,
    text: `Uploaded ${assetData.category}: "${assetData.title}" (${assetData.fileName})`,
    type: "activity",
    isSystem: true,
    relatedTo: {
      type: "asset",
      id: newAsset.id,
      name: assetData.title,
    },
    createdBy: assetData.uploadedBy,
  });

  return newAsset;
}

export async function getAssetsByPilot(pilotId: string): Promise<Asset[]> {
  const db = await getAssetsDatabase();
  return db.assets.filter(a => a.pilotId === pilotId);
}

export async function getAssetById(id: string): Promise<Asset | null> {
  const db = await getAssetsDatabase();
  return db.assets.find(a => a.id === id) || null;
}

export async function updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | null> {
  const db = await getAssetsDatabase();
  const index = db.assets.findIndex(a => a.id === id);
  
  if (index === -1) return null;
  
  db.assets[index] = {
    ...db.assets[index],
    ...updates,
  };
  
  saveAssetsDatabase(db);
  return db.assets[index];
}

export async function deleteAsset(id: string, userId: string): Promise<boolean> {
  const db = await getAssetsDatabase();
  const asset = db.assets.find(a => a.id === id);
  
  if (!asset) return false;
  
  db.assets = db.assets.filter(a => a.id !== id);
  saveAssetsDatabase(db);
  
  // Create activity log
  await createRemark({
    pilotId: asset.pilotId,
    text: `Deleted asset: "${asset.fileName}"`,
    type: 'activity',
    isSystem: true,
    createdBy: userId,
  });
  
  return true;
}
