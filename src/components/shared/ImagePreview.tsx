interface ImagePreviewProps {
  src: string;
  alt: string;
  onRemove?: () => void;
  isPrimary?: boolean;
  onSetPrimary?: () => void;
  className?: string;
}

export function ImagePreview({
  src,
  alt,
  onRemove,
  isPrimary,
  onSetPrimary,
  className = '',
}: ImagePreviewProps) {
  return (
    <div className={`relative group ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-48 object-cover rounded-lg ${
          isPrimary ? 'ring-2 ring-blue-500' : ''
        }`}
      />
      
      {/* Badge overlay */}
      {isPrimary && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
          Primary
        </div>
      )}
      
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onSetPrimary && !isPrimary && (
          <button
            onClick={onSetPrimary}
            className="bg-white text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-100 shadow"
          >
            Set Primary
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 shadow"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
