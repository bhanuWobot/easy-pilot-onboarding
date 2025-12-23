export type AssetCategory = 'contract' | 'diagram' | 'photo' | 'report' | 'other';

export interface Asset {
  id: string;
  pilotId: string;
  title: string; // Mandatory title for the asset
  fileName: string;
  fileType: string; // MIME type
  fileSize: number;
  fileUrl: string; // Base64 encoded
  category: AssetCategory;
  description?: string;
  tags?: string[];
  remarks?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export function getAssetCategoryIcon(category: AssetCategory): string {
  const icons: Record<AssetCategory, string> = {
    contract: '📄',
    diagram: '📊',
    photo: '📷',
    report: '📈',
    other: '📎',
  };
  return icons[category];
}

export function getAssetCategoryColor(category: AssetCategory): string {
  const colors: Record<AssetCategory, string> = {
    contract: 'bg-purple-100 text-purple-800 border-purple-200',
    diagram: 'bg-blue-100 text-blue-800 border-blue-200',
    photo: 'bg-green-100 text-green-800 border-green-200',
    report: 'bg-orange-100 text-orange-800 border-orange-200',
    other: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[category];
}
