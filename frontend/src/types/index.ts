export interface FolderPermissions {
  canView: boolean;
  canUpload: boolean;
  canDelete: boolean;
  canRename: boolean;
}

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
  permissions?: FolderPermissions;
  uploadedBy?: string | null;
  uploadedAt?: string | null;
}

export interface RoleRestrictions {
  [role: string]: {
    view?: boolean;
    upload?: boolean;
    delete?: boolean;
    rename?: boolean;
  };
}

export interface BranchRestrictions {
  [branchId: string]: {
    view?: boolean;
    upload?: boolean;
    delete?: boolean;
    rename?: boolean;
  };
}

export interface Permission {
  id: string;
  folderPath: string;
  roleRestrictions: RoleRestrictions;
  branchRestrictions: BranchRestrictions;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface Company {
  id: string;
  name: string;
  identificationNumber: string;
  logo: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  role: "systemAdmin" | "admin" | "user";
  name: string;
  lastname: string;
  personalNumber: string;
  branchIds: string[];
  branches: Branch[];
  branchNames: string;
  companyIds: string[];
  companies: Company[];
  companyNames: string;
  // Backward compatibility
  branchId?: string;
  branchName?: string;
}

export interface MeResponse {
  username: string;
  role: "systemAdmin" | "admin" | "user";
  name: string;
  lastname: string;
  personalNumber: string;
  branchIds: string[];
  branches: Branch[];
  companyIds: string[];
  companies: Company[];
  // Backward compatibility
  branchId?: string;
  branchName?: string;
  branchLocation?: string;
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
