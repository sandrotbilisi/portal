// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Company Configuration
export const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID;
export const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME;
export const COMPANY_LOGO = process.env.NEXT_PUBLIC_COMPANY_LOGO;

// Company Context Utilities
export const getCompanyContext = () => {
  return {
    companyId: COMPANY_ID,
    companyName: COMPANY_NAME,
    companyLogo: COMPANY_LOGO,
  };
};

// Company Validation Utility
export const hasCompanyContext = (): boolean => {
  return !!COMPANY_ID && COMPANY_ID.trim() !== '';
};

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

// File icon mapping (emoji fallback for user side)
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

// Company-aware file URL builder
export const buildCompanyFileUrl = (companyId: string, filePath: string): string => {
  if (!companyId || companyId.trim() === '') {
    throw new Error('Company ID is required');
  }
  return `${API_BASE_URL}/uploads/${companyId}/${filePath}`;
};

// Company-aware API URL builder
export const buildCompanyApiUrl = (companyId: string, endpoint: string, path?: string): string => {
  if (!companyId || companyId.trim() === '') {
    throw new Error('Company ID is required');
  }
  const baseUrl = `${API_BASE_URL}/companies/${companyId}/${endpoint}`;
  return path ? `${baseUrl}/${path}` : baseUrl;
};

// Get active company ID (from localStorage or environment variable)
export const getActiveCompanyId = (): string | null => {
  if (typeof window !== 'undefined') {
    const storedCompanyId = localStorage.getItem('selectedCompanyId');
    if (storedCompanyId) {
      return storedCompanyId;
    }
  }
  return COMPANY_ID || null;
};

// Get company name from companies array
export const getCompanyName = (companyId: string, companies: { id: string; name: string }[]): string => {
  const company = companies.find(c => c.id === companyId);
  return company ? company.name : companyId;
};
