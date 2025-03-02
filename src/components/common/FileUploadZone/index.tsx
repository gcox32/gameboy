import { useState } from 'react';
import { FileIcon, Loader } from 'lucide-react';
import styles from './styles.module.css';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  error?: string | null;
  label?: string;
}

export default function FileUploadZone({
  onFileSelect,
  accept = '.gb,.gbc',
  error,
  label = 'Click to select ROM file'
}: FileUploadZoneProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsProcessing(true);
      try {
        setFileName(file.name);
        onFileSelect(file);
      } catch (error) {
        console.error('File processing error:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    input.click();
  };

  return (
    <div className={styles.container}>
      <div 
        className={styles.uploadArea}
        onClick={handleClick}
      >
        {fileName ? (
          <div className={styles.fileInfo}>
            <FileIcon className={styles.icon} />
            <span>{fileName}</span>
            <div className={styles.overlay}>
              <span>Click to replace file</span>
            </div>
          </div>
        ) : (
          <div className={styles.placeholder}>
            {isProcessing ? (
              <>
                <Loader className={styles.loadingIcon} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FileIcon className={styles.icon} />
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