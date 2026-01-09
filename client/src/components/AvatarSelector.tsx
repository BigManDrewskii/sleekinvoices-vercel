import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Avatar from 'boring-avatars';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Shuffle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const AVATAR_STYLES = ['beam', 'marble', 'pixel', 'sunset', 'ring', 'bauhaus'] as const;
const COLORS = ['#5f6fff', '#764ba2', '#667eea', '#10b981', '#f59e0b'];

interface AvatarSelectorProps {
  currentAvatarUrl?: string | null;
  currentAvatarType?: 'initials' | 'boring' | 'upload' | null;
  userName: string;
  userEmail: string;
  onSelect: (avatarUrl: string | null, avatarType: 'initials' | 'boring' | 'upload') => void;
  onUpload: (file: File) => Promise<string>; // Returns uploaded URL
}

export function AvatarSelector({
  currentAvatarUrl,
  currentAvatarType,
  userName,
  userEmail,
  onSelect,
  onUpload,
}: AvatarSelectorProps) {
  const [selectedType, setSelectedType] = useState<'initials' | 'boring' | 'upload'>(
    currentAvatarType || 'initials'
  );
  const [selectedStyle, setSelectedStyle] = useState('beam');
  const [uploadedFile, setUploadedFile] = useState<string | null>(currentAvatarUrl || null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);

    try {
      const uploadedUrl = await onUpload(file);
      setUploadedFile(uploadedUrl);
      setSelectedType('upload');
      onSelect(uploadedUrl, 'upload');
    } catch (error) {
      console.error('Avatar upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, [onUpload, onSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const handleBoringAvatarSelect = (style: string, seed: string) => {
    setSelectedStyle(style);
    setSelectedType('boring');
    // Store both style and seed in format: "style:seed"
    onSelect(`${style}:${seed}`, 'boring');
  };

  const handleInitialsSelect = () => {
    setSelectedType('initials');
    onSelect(null, 'initials');
  };

  const getInitials = () => {
    if (userName) {
      const nameParts = userName.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return userName.substring(0, 2).toUpperCase();
    }
    return userEmail?.substring(0, 2).toUpperCase() || 'U';
  };

  const handleGenerateAvatar = () => {
    // Generate random style and seed for true randomness
    const randomStyle = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
    const randomSeed = Math.random().toString(36).substring(2, 15);
    handleBoringAvatarSelect(randomStyle, randomSeed);
  };

  const currentAvatar = () => {
    if (selectedType === 'upload' && uploadedFile) {
      return <img src={uploadedFile} alt="Avatar" className="h-full w-full object-cover" />;
    }
    if (selectedType === 'boring') {
      // Parse avatarUrl to get style and seed
      const [style, seed] = (currentAvatarUrl || `${selectedStyle}:${userEmail || userName}`).split(':');
      return (
        <Avatar
          size={96}
          name={seed || userEmail || userName}
          variant={style as any}
          colors={COLORS}
        />
      );
    }
    return (
      <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-3xl">
        {getInitials()}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Current Avatar Preview */}
      <div className="flex-shrink-0">
        <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border bg-background">
          {currentAvatar()}
        </div>
      </div>

      {/* Avatar Options */}
      <div className="flex-1 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedType === 'initials' ? 'default' : 'outline'}
            onClick={handleInitialsSelect}
          >
            Use Initials
          </Button>

          <Button
            size="sm"
            variant={selectedType === 'boring' ? 'default' : 'outline'}
            onClick={handleGenerateAvatar}
            className="gap-2"
          >
            <Shuffle className="h-4 w-4" />
            Generate Avatar
          </Button>

          <div
            {...getRootProps()}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
              "h-9 px-3 cursor-pointer",
              selectedType === 'upload'
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : selectedType === 'upload' ? 'Change Photo' : 'Upload Photo'}
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          {selectedType === 'initials' && <p>Using your initials: {getInitials()}</p>}
          {selectedType === 'boring' && (
            <p>
              Generated avatar - Click "Generate Avatar" again for a different style
            </p>
          )}
          {selectedType === 'upload' && <p>Custom photo (PNG, JPG, WEBP up to 5MB)</p>}
        </div>
      </div>
    </div>
  );
}
