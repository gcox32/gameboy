import { useState } from 'react';
import { ImageIcon, Loader } from 'lucide-react';
import { uploadData } from 'aws-amplify/storage';
import styles from './styles.module.css';

interface ImageUploadProps {
  value?: string;
  onChange: (file: File) => void;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  preview?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  label = "Click to add image",
  accept = "image/*",
  maxSize = 5,
  preview = true
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(value || null);

  const handleImageClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File size must be less than ${maxSize}MB`);
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        // Create preview if enabled
        if (preview) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        }

        onChange(file);
      } catch (error) {
        console.error('Image upload error:', error);
        setError('Failed to process image');
        setImagePreview(value || null);
      } finally {
        setIsUploading(false);
      }
    };

    input.click();
  };

  return (
    <div className={styles.container}>
      <div 
        className={styles.uploadArea}
        onClick={handleImageClick}
      >
        {imagePreview ? (
          <div className={styles.preview}>
            <img src={imagePreview} alt="Preview" />
            <div className={styles.overlay}>
              <span>Click to replace image</span>
            </div>
          </div>
        ) : (
          <div className={styles.placeholder}>
            {isUploading ? (
              <>
                <Loader className={styles.loadingIcon} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <ImageIcon className={styles.icon} />
                <span>{label}</span>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
} 