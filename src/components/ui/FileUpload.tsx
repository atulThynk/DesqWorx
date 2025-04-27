import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import Button from './Button';

interface FileUploadProps {
  label?: string;
  error?: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  error,
  onFileSelect,
  accept = 'image/*,.pdf',
  maxSize = 5 * 1024 * 1024, // 5MB default
}) => {
  const [fileName, setFileName] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      setFileError(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      return;
    }

    setFileName(file.name);
    setFileError('');
    onFileSelect(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="mt-1 flex items-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="sr-only"
          accept={accept}
        />
        <Button
          type="button"
          onClick={triggerFileInput}
          variant="outline"
          className="mr-2"
        >
          <Upload className="w-4 h-4 mr-2" />
          Browse
        </Button>
        <span className="text-sm text-gray-500 truncate max-w-xs">
          {fileName || 'No file selected'}
        </span>
      </div>
      {(error || fileError) && (
        <p className="mt-1 text-sm text-red-600">{error || fileError}</p>
      )}
    </div>
  );
};

export default FileUpload;