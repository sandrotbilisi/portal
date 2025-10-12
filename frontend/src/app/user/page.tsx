"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface MeResponse {
  username: string;
  role: "admin" | "user";
  name: string;
  lastname: string;
  personalNumber: string;
  branchId: string;
  branchName: string;
  branchLocation: string;
}

interface FolderPermissions {
  canView: boolean;
  canUpload: boolean;
  canDelete: boolean;
  canRename: boolean;
}

interface Folder {
  name: string;
  type: string;
  size: number;
  created: string;
  modified: string;
  title?: string;
  thumbnail?: string;
  id?: string;
  url?: string;
  permissions?: FolderPermissions;
  uploadedBy?: string | null;
  uploadedAt?: string | null;
}

export default function UserDashboard() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<string | null>(null);
  const [isVideoFileModalOpen, setIsVideoFileModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [documentType, setDocumentType] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [canUpload, setCanUpload] = useState(true); // Will be updated based on permissions

  axios.defaults.withCredentials = true;

  useEffect(() => {
    const getMe = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/me`);
        if (res.data?.data) {
          setMe(res.data.data);
        }
      } catch (err) {
        console.error('Failed to get user info:', err);
      }
    };
    getMe();
  }, []);

  const fetchFolders = async (retries = 1) => {
    try {
      setLoading(true);
      const url = currentPath ? `${API_BASE_URL}/folders/${currentPath}` : `${API_BASE_URL}/folders`;
      const response = await axios.get(url, {
        timeout: 10000 // 10 second timeout
      });
      if (response.data.success) {
        setFolders(response.data.data);
        setError(null); // Clear any previous errors
        
        // Check upload permission for current folder
        if (response.data.currentFolderPermissions) {
          // User has permission data, use it
          setCanUpload(response.data.currentFolderPermissions.canUpload);
        } else {
          // No restrictions (admin or no permissions set), allow upload
          setCanUpload(true);
        }
      } else {
        setError(response.data.message || 'Failed to fetch files');
      }
    } catch (err: any) {
      console.error('Error fetching files:', err);
      
      // Retry once on network error
      if (retries > 0 && (err.code === 'ECONNABORTED' || err.message === 'Network Error')) {
        console.log('Retrying folder fetch...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchFolders(retries - 1);
      }
      
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [currentPath]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
      router.replace('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string, name: string) => {
    if (type === 'folder') {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    }
    
    // Check for YouTube videos
    if (type === 'youtube' && name.endsWith('.json')) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    }
    
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return (
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'mkv':
        return (
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'pdf':
        return (
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        );
      case 'doc':
      case 'docx':
      case 'xls':
      case 'xlsx':
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const handleFolderClick = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setPathHistory([...pathHistory, currentPath]);
    setCurrentPath(newPath);
  };

  const goBack = () => {
    if (pathHistory.length > 0) {
      const newPath = pathHistory[pathHistory.length - 1];
      setCurrentPath(newPath);
      setPathHistory(pathHistory.slice(0, -1));
    }
  };

  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    return parts;
  };

  const isImageFile = (fileName: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext ? imageExtensions.includes(ext) : false;
  };

  const isVideoFile = (fileName: string) => {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext ? videoExtensions.includes(ext) : false;
  };

  const isDocumentFile = (fileName: string) => {
    const documentExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext ? documentExtensions.includes(ext) : false;
  };

  const getDocumentType = (fileName: string) => {
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

  const handleFileClick = (folder: Folder) => {
    if (folder.type === 'folder') {
      handleFolderClick(folder.name);
    } else if (isImageFile(folder.name)) {
      const imagePath = currentPath ? `${currentPath}/${folder.name}` : folder.name;
      setSelectedImage(`${API_BASE_URL}/uploads/${imagePath}`);
      setIsImageModalOpen(true);
    } else if (folder.name.endsWith('.json') && folder.type === 'youtube') {
      setSelectedVideo(folder);
      setIsVideoModalOpen(true);
    } else if (folder.name.toLowerCase().endsWith('.pdf')) {
      const pdfPath = currentPath ? `${currentPath}/${folder.name}` : folder.name;
      setSelectedPdf(`${API_BASE_URL}/uploads/${pdfPath}`);
      setIsPdfModalOpen(true);
    } else if (isVideoFile(folder.name)) {
      const videoPath = currentPath ? `${currentPath}/${folder.name}` : folder.name;
      setSelectedVideoFile(`${API_BASE_URL}/uploads/${videoPath}`);
      setIsVideoFileModalOpen(true);
    } else if (isDocumentFile(folder.name)) {
      const docPath = currentPath ? `${currentPath}/${folder.name}` : folder.name;
      setSelectedDocument(`${API_BASE_URL}/uploads/${docPath}`);
      setDocumentType(getDocumentType(folder.name));
      setIsDocumentModalOpen(true);
    }
  };

  const handleDownload = (folder: Folder) => {
    const filePath = currentPath ? `${currentPath}/${folder.name}` : folder.name;
    const downloadUrl = `${API_BASE_URL}/uploads/${filePath}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = folder.name;
    link.click();
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderPath', currentPath);

        const response = await axios.post(`${API_BASE_URL}/files`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
            setUploadProgress(progress);
          },
        });

        if (!response.data.success) {
          throw new Error(response.data.message || 'Upload failed');
        }
      }

      // Refresh the folder contents after successful upload
      await fetchFolders();

      setIsUploadModalOpen(false);
      setUploadProgress(0);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-700 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-slate-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
              <div>
              <h1 className="text-3xl font-semibold text-white">
                Welcome, {me?.username || 'User'}
                </h1>
              <p className="text-gray-400 mt-1">{getCurrentDateTime()}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/user/inbox')}
                className="relative p-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                title="Inbox"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">2</span>
              </button>
              
              <button
                onClick={() => router.push('/user/profile')}
                className="p-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                title="Profile"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200 font-medium"
              >
                Logout
              </button>
            </div>
          </div>



          
            

            
          </div>

        {/* Breadcrumb Navigation */}
        {currentPath && (
          <div className="mb-6 flex items-center space-x-3">
            <button
              onClick={goBack}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back</span>
            </button>
            <div className="flex items-center space-x-2 text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="font-medium">{getBreadcrumbs().join(' / ')}</span>
            </div>
          </div>
        )}

        {/* Search Bar and Upload Button */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="relative flex-1 max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-800/50 backdrop-blur-md border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
            />
          </div>
          
          {/* Upload Button - Only show if user has upload permission */}
          {canUpload && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
              title="Upload files"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Upload</span>
            </button>
          )}
        </div>

        {/* Files Grid */}
        <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-600/20 rounded-2xl shadow-2xl min-h-[500px]">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Files & Folders</h2>
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block relative">
                  <div className="w-16 h-16 border-4 border-gray-600 border-t-gray-400 rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-300">Loading files...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-gray-300 text-lg">{error}</p>
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className="text-center py-20">
                <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p className="text-white text-lg font-medium mb-2">No files found</p>
                <p className="text-gray-400">
                  {searchTerm ? 'Try adjusting your search terms' : 'This folder is empty'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredFolders.map((folder, index) => (
                  <div
                    key={index}
                    className="group bg-gray-700/30 hover:bg-gray-700/50 backdrop-blur-md border border-gray-600/30 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-xl"
                  >
                    <div className="flex flex-col items-center space-y-3">
                      {/* Icon / Thumbnail */}
                      <div onClick={() => handleFileClick(folder)} className="flex items-center justify-center w-full">
                        {folder.type === 'youtube' && folder.thumbnail ? (
                          <div className="w-full aspect-video rounded-lg overflow-hidden relative group-hover:ring-2 group-hover:ring-red-500 transition-all duration-200">
                            <img 
                              src={folder.thumbnail} 
                              alt={folder.title || folder.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-all duration-200">
                              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-800/50 rounded-lg flex items-center justify-center group-hover:bg-gray-800/70 transition-colors duration-200">
                            {getFileIcon(folder.type, folder.name)}
                          </div>
                        )}
                      </div>

                      {/* File Name */}
                      <div className="w-full text-center">
                        <p className="text-white font-medium text-sm line-clamp-2 mb-1">
                          {folder.type === 'youtube' && folder.title ? folder.title : folder.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {folder.type === 'folder' ? 'Folder' : folder.type === 'youtube' ? 'YouTube Video' : formatFileSize(folder.size)}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(folder.uploadedAt || folder.created).toLocaleString()}
                        </p>
                        {folder.uploadedBy && (
                          <p className="text-gray-500 text-xs mt-0.5">
                            By: {folder.uploadedBy}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      {folder.type !== 'folder' && (
                        <>
                          {folder.type === 'youtube' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileClick(folder);
                              }}
                              className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2"
                              title="Watch Video"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                              <span>Watch</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(folder);
                              }}
                              className="w-full py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2"
                              title="Download"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Download</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-3 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* PDF Modal */}
      {isPdfModalOpen && selectedPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-6xl mx-4 shadow-2xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">PDF Viewer</h2>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-xl transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 bg-white rounded-lg overflow-hidden">
              <iframe
                src={selectedPdf}
                className="w-full h-full"
                title="PDF Viewer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Video File Modal */}
      {isVideoFileModalOpen && selectedVideoFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-6xl mx-4 shadow-2xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Video Player</h2>
              <button
                onClick={() => setIsVideoFileModalOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-xl transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 bg-black rounded-lg overflow-hidden">
              <video
                src={selectedVideoFile}
                controls
                className="w-full h-full"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
              </div>
      )}

      {/* Document Modal */}
      {isDocumentModalOpen && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-6xl mx-4 shadow-2xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">{documentType} Viewer</h2>
              <button
                onClick={() => setIsDocumentModalOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-xl transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 bg-white rounded-lg overflow-hidden">
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedDocument)}`}
                className="w-full h-full"
                title="Document Viewer"
              />
            </div>
          </div>
        </div>
      )}

      {/* YouTube Video Modal */}
      {isVideoModalOpen && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-4xl mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">{selectedVideo.title}</h2>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-xl transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={selectedVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative bg-gray-800/90 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-gray-700/80 hover:bg-gray-600/80 rounded-full transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="text-4xl mb-4">📤</div>
              <h2 className="text-2xl font-bold text-white mb-2">Upload Files</h2>
              <p className="text-gray-400">
                {currentPath ? `Uploading to: ${currentPath}` : 'Uploading to root directory'}
              </p>
            </div>

            {/* Drag & Drop Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-blue-400 bg-blue-900/20'
                  : 'border-gray-600 bg-gray-700/10'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <div className="text-4xl">📤</div>
                  <p className="text-white text-lg">Uploading files...</p>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-400">{uploadProgress}% complete</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-6xl">📁</div>
                  <div>
                    <p className="text-white text-lg mb-2">
                      {dragActive ? 'Drop files here' : 'Drag & drop files here'}
                    </p>
                    <p className="text-gray-400 text-sm">or</p>
                  </div>
                  <label className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Choose Files</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </label>
                  <p className="text-gray-500 text-xs">
                    Supports all file types • Multiple files allowed
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 bg-red-900/30 border border-red-700/50 text-red-200 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
