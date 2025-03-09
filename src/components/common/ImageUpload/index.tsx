import { useState } from 'react';
import { ImageIcon, Loader } from 'lucide-react';
import Image from 'next/image';
import styles from './styles.module.css';

interface PresetImage {
  id: string;
  url: string;
  label: string;
}

interface ImageUploadProps {
  value?: string;
  onChange: (file: File | string) => void;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  preview?: boolean;
  presetImages?: PresetImage[];
}

export function ImageUpload({
  value,
  onChange,
  label = "Click to add image",
  accept = "image/*",
  maxSize = 5,
  preview = true,
  presetImages = []
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(value || null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

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
      setSelectedPreset(null);

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

  const handlePresetSelect = (preset: PresetImage) => {
    setSelectedPreset(preset.id);
    setImagePreview(preset.url);
    setError(null);
    onChange(preset.url);
  };

  return (
    <div className={styles.container}>
      <div className={styles.uploadSection}>
        <div 
          className={styles.uploadArea}
          onClick={handleImageClick}
        >
          {imagePreview ? (
            <div className={styles.preview}>
              <Image src={imagePreview} alt="Preview" width={220} height={220} />
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

      {presetImages.length > 0 && (
        <div className={styles.presetImages}>
          <p className={styles.presetLabel}>Or choose from preset images:</p>
          <div className={styles.presetGrid}>
            {presetImages.map((preset) => (
              <div
                key={preset.id}
                className={`${styles.presetItem} ${selectedPreset === preset.id ? styles.selected : ''}`}
                onClick={() => handlePresetSelect(preset)}
              >
                <Image src={preset.url} alt={preset.label} width={220} height={220} />
                <span>{preset.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 