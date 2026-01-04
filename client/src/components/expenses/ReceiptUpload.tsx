import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ReceiptData {
  url: string;
  key: string;
}

interface ReceiptUploadProps {
  value: ReceiptData | null;
  onChange: (receipt: ReceiptData | null) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

export default function ReceiptUpload({ value, onChange, disabled }: ReceiptUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadMutation = trpc.expenses.uploadReceipt.useMutation();

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please upload an image (JPG, PNG, GIF, WebP) or PDF.");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 5MB.");
      return false;
    }

    return true;
  };

  const handleFileChange = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(",")[1]; // Remove data:image/jpeg;base64, prefix

        try {
          const result = await uploadMutation.mutateAsync({
            fileData: base64Data,
            fileName: file.name,
            contentType: file.type,
          });

          onChange({ url: result.url, key: result.key });
          toast.success("Receipt uploaded successfully");
        } catch (error) {
          console.error("Upload error:", error);
          toast.error("Failed to upload receipt");
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File processing error:", error);
      toast.error("Failed to process file");
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileType = (url: string): "image" | "pdf" => {
    return url.toLowerCase().endsWith(".pdf") ? "pdf" : "image";
  };

  const getFileName = (url: string): string => {
    return url.split("/").pop() || "receipt";
  };

  if (value) {
    const fileType = getFileType(value.url);
    const fileName = getFileName(value.url);

    return (
      <div className="space-y-2">
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-start gap-4">
            {fileType === "image" ? (
              <div className="relative w-24 h-24 flex-shrink-0">
                <img
                  src={value.url}
                  alt="Receipt"
                  className="w-full h-full object-cover rounded"
                />
              </div>
            ) : (
              <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center bg-background border rounded">
                <FileText className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {fileType === "pdf" ? "PDF Document" : "Image"}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(value.url, "_blank")}
                >
                  View Full Size
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={disabled}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-border"}
          ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50"}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading receipt...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drop receipt here or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Images (JPG, PNG, GIF, WebP) or PDF, max 5MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
