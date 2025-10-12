// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// File type detection
export const isImageFile = (fileName: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'ico'];
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? imageExtensions.includes(ext) : false;
};

export const isVideoFile = (fileName: string): boolean => {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'flv', 'm4v'];
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? videoExtensions.includes(ext) : false;
};

export const isDocumentFile = (fileName: string): boolean => {
  const documentExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? documentExtensions.includes(ext) : false;
};

// Document type detection
export const getDocumentType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'doc':
    case 'docx':
      return 'Word Document';
    case 'xls':
    case 'xlsx':
      return 'Excel Spreadsheet';
    case 'ppt':
    case 'pptx':
      return 'PowerPoint Presentation';
    default:
      return 'Document';
  }
};

// File icon mapping
export const getFileIcon = (type: string, name: string) => {
  if (type === 'folder') return '📁';
  
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return '🖼️';
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'mkv':
      return '🎬';
    case 'mp3':
    case 'wav':
    case 'flac':
      return '🎵';
    case 'pdf':
      return '📕';

    case 'doc':
    case 'docx':
      return '📝';
    case 'zip':
    case 'rar':
    case '7z':
      return '🗜️';
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return '⚡';
    case 'css':
      return '🎨';
    case 'html':
      return '🌐';
    default:
      return '📄';
  }
};

// Path utilities
export const buildPath = (currentPath: string, folderName: string): string => {
  return currentPath ? `${currentPath}/${folderName}` : folderName;
};

export const getBreadcrumbs = (currentPath: string): string[] => {
  return currentPath.split('/').filter(Boolean);
};

// Validation utilities
export const validateFolderName = (name: string): string | null => {
  if (!name.trim()) {
    return 'Folder name cannot be empty';
  }
  
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    return 'Folder name contains invalid characters';
  }
  
  return null;
};

// URL building utilities
export const buildApiUrl = (endpoint: string, path?: string): string => {
  const baseUrl = `${API_BASE_URL}/${endpoint}`;
  return path ? `${baseUrl}/${path}` : baseUrl;
};

export const buildFileUrl = (filePath: string): string => {
  return `${API_BASE_URL}/uploads/${filePath}`;
};
