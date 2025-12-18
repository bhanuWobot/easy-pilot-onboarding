import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function FileUploadZone({
  onFilesSelected,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  children,
}: FileUploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesSelected(acceptedFiles);
    }
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-all duration-200
        ${isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      {children || (
        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          {isDragActive ? (
            <p className="text-blue-600 font-medium">Drop files here...</p>
          ) : (
            <>
              <p className="text-gray-700 font-medium">
                Drag & drop files here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                {multiple ? 'Multiple files supported' : 'Single file only'} • Max {maxSize / (1024 * 1024)}MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
