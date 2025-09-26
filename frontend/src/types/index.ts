export interface Folder {
  name: string;
  type: string;
  size: number;
  created: string;
  modified: string;
  thumbnail?: string;
  title?: string;
  url?: string;
  id?: string;
}

export interface UploadProgress {
  progress: number;
  isUploading: boolean;
}

export interface FileManagerState {
  folders: Folder[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  viewMode: 'grid' | 'list';
  currentPath: string;
  pathHistory: string[];
}

export interface ModalState {
  isImageModalOpen: boolean;
  isUploadModalOpen: boolean;
  isCreateFolderModalOpen: boolean;
  isRenameModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isYouTubeModalOpen: boolean;
  isVideoModalOpen: boolean;
  isPdfModalOpen: boolean;
  isVideoFileModalOpen: boolean;
  isDocumentModalOpen: boolean;
}

export interface SelectedItems {
  selectedImage: string | null;
  selectedVideo: any | null;
  selectedPdf: string | null;
  selectedVideoFile: string | null;
  selectedDocument: string | null;
  renameItem: Folder | null;
  deleteItem: Folder | null;
  documentType: string;
}

export interface FormData {
  newFolderName: string;
  newItemName: string;
  youtubeUrl: string;
  youtubeTitle: string;
}

export interface LoadingStates {
  isUploading: boolean;
  isCreatingFolder: boolean;
  isRenaming: boolean;
  isDeleting: boolean;
  isAddingYouTube: boolean;
}
