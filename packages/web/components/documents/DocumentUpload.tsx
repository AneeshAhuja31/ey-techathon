"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileText, FileSpreadsheet, File, Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocumentStore, Document } from "@/store/documentStore";

interface DocumentUploadProps {
  className?: string;
  compact?: boolean;
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-4 h-4 text-red-500" />,
  docx: <FileText className="w-4 h-4 text-blue-500" />,
  doc: <FileText className="w-4 h-4 text-blue-500" />,
  xlsx: <FileSpreadsheet className="w-4 h-4 text-emerald-500" />,
  xls: <FileSpreadsheet className="w-4 h-4 text-emerald-500" />,
  txt: <File className="w-4 h-4 text-gray-500" />,
};

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return FILE_ICONS[ext] || <File className="w-4 h-4 text-gray-400" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentItem({ doc, onDelete }: { doc: Document; onDelete: (id: string) => void }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-background-secondary rounded-lg group">
      {getFileIcon(doc.filename)}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{doc.originalFilename}</p>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>{formatFileSize(doc.fileSize)}</span>
          {doc.status === "processing" && (
            <span className="flex items-center gap-1 text-amber-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing...
            </span>
          )}
          {doc.status === "ready" && (
            <span className="flex items-center gap-1 text-emerald-600">
              <Check className="w-3 h-3" />
              {doc.chunkCount} chunks
            </span>
          )}
          {doc.status === "failed" && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle className="w-3 h-3" />
              Failed
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(doc.id)}
        className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-background-card transition-all"
        title="Remove document"
      >
        <X className="w-4 h-4 text-text-muted hover:text-red-400" />
      </button>
    </div>
  );
}

export function DocumentUpload({ className, compact = false }: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    documents,
    isUploading,
    uploadProgress,
    error,
    uploadDocument,
    deleteDocument,
    clearError
  } = useDocumentStore();

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Only PDF files supported for now
    const file = files[0];
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      await uploadDocument(file);
    }
  }, [uploadDocument]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {/* Compact upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {documents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-background-secondary rounded-md text-xs"
                title={doc.originalFilename}
              >
                {getFileIcon(doc.filename)}
                <span className="max-w-[80px] truncate text-text-primary">
                  {doc.originalFilename}
                </span>
                {doc.status === "processing" && (
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                )}
                {doc.status === "ready" && (
                  <Check className="w-3 h-3 text-emerald-600" />
                )}
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="p-0.5 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {isUploading && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Loader2 className="w-3 h-3 animate-spin" />
            Uploading... {uploadProgress}%
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drag and drop area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
          isDragging
            ? "border-accent-cyan bg-accent-cyan/10"
            : "border-border-default hover:border-accent-cyan/50 hover:bg-background-card/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <Upload className={cn(
          "w-8 h-8 mx-auto mb-2",
          isDragging ? "text-accent-cyan" : "text-text-muted"
        )} />

        <p className="text-sm text-text-primary mb-1">
          {isDragging ? "Drop file here" : "Drag & drop a company document"}
        </p>
        <p className="text-xs text-text-muted">
          PDF files supported
        </p>
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Uploading...</span>
            <span className="text-accent-cyan">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-background-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-cyan to-accent-green transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 flex-1">{error}</p>
          <button onClick={clearError} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Document list */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Uploaded Documents ({documents.length})
          </h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {documents.map((doc) => (
              <DocumentItem key={doc.id} doc={doc} onDelete={deleteDocument} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline upload button for chat input
export function UploadButton({ onClick }: { onClick: () => void }) {
  const { documents, isUploading } = useDocumentStore();

  return (
    <button
      onClick={onClick}
      disabled={isUploading}
      className={cn(
        "relative w-10 h-10 flex items-center justify-center rounded-xl transition-colors",
        "bg-background-card hover:bg-background-secondary border border-border-default",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
      title="Upload company documents"
    >
      {isUploading ? (
        <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
      ) : (
        <Upload className="w-5 h-5 text-text-muted" />
      )}
      {documents.length > 0 && !isUploading && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-cyan rounded-full text-[10px] font-medium text-white flex items-center justify-center">
          {documents.length}
        </span>
      )}
    </button>
  );
}
