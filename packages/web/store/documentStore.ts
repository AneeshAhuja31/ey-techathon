import { create } from "zustand";
import { documentsApi } from "@/lib/api";

export interface Document {
  id: string;
  filename: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  chunkCount: number;
  status: "processing" | "ready" | "failed";
  error?: string;
  createdAt: string;
}

interface DocumentState {
  documents: Document[];
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;

  // Actions
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  refreshDocument: (docId: string) => Promise<void>;
  clearError: () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  isUploading: false,
  uploadProgress: 0,
  error: null,

  fetchDocuments: async () => {
    try {
      const response = await documentsApi.list();
      const docs = response.data.map((doc: Record<string, unknown>) => ({
        id: doc.id as string,
        filename: doc.filename as string,
        originalFilename: doc.original_filename as string,
        fileType: doc.file_type as string,
        fileSize: doc.file_size as number,
        chunkCount: doc.chunk_count as number,
        status: doc.status as "processing" | "ready" | "failed",
        error: doc.error as string | undefined,
        createdAt: doc.created_at as string,
      }));
      set({ documents: docs, error: null });
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      set({ error: "Failed to load documents" });
    }
  },

  uploadDocument: async (file: File) => {
    set({ isUploading: true, uploadProgress: 0, error: null });

    try {
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        set((state) => ({
          uploadProgress: Math.min(state.uploadProgress + 10, 90),
        }));
      }, 200);

      const response = await documentsApi.upload(file);

      clearInterval(progressInterval);
      set({ uploadProgress: 100 });

      // Add the new document to the list
      const newDoc: Document = {
        id: response.data.id,
        filename: response.data.filename,
        originalFilename: file.name,
        fileType: response.data.file_type,
        fileSize: response.data.file_size,
        chunkCount: 0,
        status: "processing",
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        documents: [newDoc, ...state.documents],
        isUploading: false,
        uploadProgress: 0,
      }));

      // Poll for document status updates
      const pollStatus = async () => {
        try {
          const statusResponse = await documentsApi.get(newDoc.id);
          const doc = statusResponse.data;

          set((state) => ({
            documents: state.documents.map((d) =>
              d.id === newDoc.id
                ? {
                    ...d,
                    status: doc.status,
                    chunkCount: doc.chunk_count,
                    error: doc.error,
                  }
                : d
            ),
          }));

          // Continue polling if still processing
          if (doc.status === "processing") {
            setTimeout(pollStatus, 2000);
          }
        } catch (e) {
          console.error("Error polling document status:", e);
        }
      };

      // Start polling after a short delay
      setTimeout(pollStatus, 1000);
    } catch (error) {
      console.error("Upload failed:", error);
      set({
        isUploading: false,
        uploadProgress: 0,
        error: "Upload failed. Please try again.",
      });
    }
  },

  deleteDocument: async (docId: string) => {
    try {
      await documentsApi.delete(docId);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== docId),
        error: null,
      }));
    } catch (error) {
      console.error("Delete failed:", error);
      set({ error: "Failed to delete document" });
    }
  },

  refreshDocument: async (docId: string) => {
    try {
      const response = await documentsApi.get(docId);
      const doc = response.data;

      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === docId
            ? {
                ...d,
                status: doc.status,
                chunkCount: doc.chunk_count,
                error: doc.error,
              }
            : d
        ),
      }));
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  },

  clearError: () => set({ error: null }),
}));
