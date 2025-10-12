"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DraggableFileList } from "../../components/file-manager/DraggableFileList";
import { PermissionsModal } from "../../components/modals/PermissionsModal";

// API Configuration - Change this to easily switch between environments
// Examples:
// Development: "http://localhost:3000"
// Production: "https://your-api-domain.com"
// Staging: "https://staging-api.your-domain.com"
const API_BASE_URL = "https://home-server.tail7b1d07.ts.net";

interface Folder {
  name: string;
  type: string;
  size: number;
  created: string;
  modified: string;
  // Optional fields for YouTube JSON files
  title?: string;
  thumbnail?: string;
  id?: string;
  url?: string;
}

export default function Home() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<Folder | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Folder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [isAddingYouTube, setIsAddingYouTube] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<string | null>(null);
  const [isVideoFileModalOpen, setIsVideoFileModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [documentType, setDocumentType] = useState<string>('');
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [permissionsFolder, setPermissionsFolder] = useState<Folder | null>(null);

  // Configure axios to send cookies
  axios.defaults.withCredentials = true;

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const url = currentPath ? `${API_BASE_URL}/folders/${currentPath}` : `${API_BASE_URL}/folders`;
      const response = await axios.get(url);
      if (response.data.success) {
        setFolders(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch folders');
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [currentPath]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string, name: string) => {
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
        return (
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            <div className="absolute text-xs font-bold text-white" style={{fontSize: '8px', marginTop: '8px'}}>PDF</div>
          </div>
        );
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

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFolderClick = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setPathHistory([...pathHistory, currentPath]);
    setCurrentPath(newPath);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = pathHistory[index] || "";
    setCurrentPath(newPath);
    setPathHistory(pathHistory.slice(0, index));
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
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'ico'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext ? imageExtensions.includes(ext) : false;
  };

  const handleFileClick = (folder: Folder) => {
    if (folder.type === 'folder') {
      handleFolderClick(folder.name);
    } else if (isImageFile(folder.name)) {
      const imagePath = currentPath ? `${currentPath}/${folder.name}` : folder.name;
      setSelectedImage(`${API_BASE_URL}/uploads/${imagePath}`);
      setIsImageModalOpen(true);
    } else if (folder.name.endsWith('.json') && folder.type === 'youtube') {
      // Handle YouTube video files
      openVideoModal(folder);
    } else if (folder.name.toLowerCase().endsWith('.pdf')) {
      // Handle PDF files
      openPdfModal(folder.name);
    } else if (isVideoFile(folder.name)) {
      // Handle video files
      openVideoFileModal(folder.name);
    } else if (isDocumentFile(folder.name)) {
      // Handle document files (Word, Excel, PowerPoint)
      openDocumentModal(folder.name);
    }
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
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
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload files');
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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    // Validate folder name (no special characters)
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(newFolderName)) {
      setError('Folder name contains invalid characters');
      return;
    }

    setIsCreatingFolder(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/folders`, {
        folderName: newFolderName.trim(),
        folderPath: currentPath
      });

      if (response.data.success) {
        // Refresh the folder contents
        await fetchFolders();
        
        setIsCreateFolderModalOpen(false);
        setNewFolderName("");
      } else {
        setError(response.data.message || 'Failed to create folder');
      }
    } catch (err: any) {
      console.error('Create folder error:', err);
      setError(err.response?.data?.message || 'Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const openCreateFolderModal = () => {
    setIsCreateFolderModalOpen(true);
    setNewFolderName("");
    setError(null);
  };

  const closeCreateFolderModal = () => {
    setIsCreateFolderModalOpen(false);
    setNewFolderName("");
    setError(null);
  };

  const handleRename = async () => {
    if (!renameItem || !newItemName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    // For YouTube videos, we don't need to validate special characters (it's just the title)
    // For regular files, validate new name (no special characters)
    if (renameItem.type !== 'youtube') {
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(newItemName)) {
        setError('Name contains invalid characters');
        return;
      }
    }

    setIsRenaming(true);
    setError(null);

    try {
      const filePath = currentPath ? `${currentPath}/${renameItem.name}` : renameItem.name;
      
      // For YouTube videos, we update the JSON content instead of renaming the file
      if (renameItem.type === 'youtube') {
        const response = await axios.put(`${API_BASE_URL}/files/${filePath}`, {
          updateYouTubeTitle: true,
          newTitle: newItemName.trim()
        });

        if (response.data.success) {
          await fetchFolders();
          setIsRenameModalOpen(false);
          setRenameItem(null);
          setNewItemName("");
        } else {
          setError(response.data.message || 'Failed to update video title');
        }
      } else {
        // Regular file/folder rename
        const response = await axios.put(`${API_BASE_URL}/files/${filePath}`, {
          newName: newItemName.trim()
        });

        if (response.data.success) {
          await fetchFolders();
          setIsRenameModalOpen(false);
          setRenameItem(null);
          setNewItemName("");
        } else {
          setError(response.data.message || 'Failed to rename item');
        }
      }
    } catch (err: any) {
      console.error('Rename error:', err);
      setError(err.response?.data?.message || 'Failed to rename item');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    setIsDeleting(true);
    setError(null);

    try {
      const filePath = currentPath ? `${currentPath}/${deleteItem.name}` : deleteItem.name;
      const response = await axios.delete(`${API_BASE_URL}/files/${filePath}`);

      if (response.data.success) {
        // Refresh the folder contents
        await fetchFolders();
        
        setIsDeleteModalOpen(false);
        setDeleteItem(null);
      } else {
        setError(response.data.message || 'Failed to delete item');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  const openRenameModal = (item: Folder) => {
    setRenameItem(item);
    // For YouTube videos, set the title as the default value, not the filename
    if (item.type === 'youtube' && item.title) {
      setNewItemName(item.title);
    } else {
      setNewItemName(item.name);
    }
    setIsRenameModalOpen(true);
    setError(null);
  };

  const closeRenameModal = () => {
    setIsRenameModalOpen(false);
    setRenameItem(null);
    setNewItemName("");
    setError(null);
  };

  const openDeleteModal = (item: Folder) => {
    setDeleteItem(item);
    setIsDeleteModalOpen(true);
    setError(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteItem(null);
    setError(null);
  };

  const openYouTubeModal = () => {
    setIsYouTubeModalOpen(true);
    setYoutubeUrl('');
    setYoutubeTitle('');
    setError(null);
  };

  const closeYouTubeModal = () => {
    setIsYouTubeModalOpen(false);
    setYoutubeUrl('');
    setYoutubeTitle('');
    setError(null);
  };

  const handleAddYouTube = async () => {
    if (!youtubeUrl.trim() || !youtubeTitle.trim()) {
      setError('Please provide both URL and title');
      return;
    }

    try {
      setIsAddingYouTube(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          title: youtubeTitle.trim(),
          folderPath: currentPath
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add YouTube video');
      }

      closeYouTubeModal();
      fetchFolders(); // Refresh the folder list
    } catch (error) {
      console.error('Error adding YouTube video:', error);
      setError(error instanceof Error ? error.message : 'Failed to add YouTube video');
    } finally {
      setIsAddingYouTube(false);
    }
  };

  const openVideoModal = (video: any) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
    setIsVideoModalOpen(false);
  };

  const openPdfModal = (fileName: string) => {
    const pdfPath = currentPath ? `${currentPath}/${fileName}` : fileName;
    setSelectedPdf(`${API_BASE_URL}/uploads/${pdfPath}`);
    setIsPdfModalOpen(true);
  };

  const closePdfModal = () => {
    setSelectedPdf(null);
    setIsPdfModalOpen(false);
  };

  const openVideoFileModal = (fileName: string) => {
    const videoPath = currentPath ? `${currentPath}/${fileName}` : fileName;
    setSelectedVideoFile(`${API_BASE_URL}/uploads/${videoPath}`);
    setIsVideoFileModalOpen(true);
  };

  const closeVideoFileModal = () => {
    setSelectedVideoFile(null);
    setIsVideoFileModalOpen(false);
  };

  const isVideoFile = (fileName: string) => {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'flv', 'm4v'];
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

  const openDocumentModal = (fileName: string) => {
    const docPath = currentPath ? `${currentPath}/${fileName}` : fileName;
    const fullUrl = `${API_BASE_URL}/uploads/${docPath}`;
    setSelectedDocument(fullUrl);
    setDocumentType(getDocumentType(fileName));
    setIsDocumentModalOpen(true);
  };

  const closeDocumentModal = () => {
    setSelectedDocument(null);
    setDocumentType('');
    setIsDocumentModalOpen(false);
  };

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Check if click is outside any dropdown menu
      if (!target.closest('.z-20') && !target.closest('.z-30')) {
        // Close all dropdown menus
        const menus = document.querySelectorAll('.z-30');
        menus.forEach(menu => {
          if (!menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
          }
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
      router.replace('/login');
    } catch {}
  };

  const handleReorder = async (newOrder: Folder[]) => {
    // Update local state immediately for smooth UX
    setFolders(newOrder);

    // Send new order to backend
    try {
      const fileNames = newOrder.map(f => f.name);
      await axios.post(`${API_BASE_URL}/folders/order`, {
        folderPath: currentPath,
        order: fileNames
      });
    } catch (err) {
      console.error('Error saving file order:', err);
      setError('Failed to save file order');
      // Revert to original order on error
      await fetchFolders();
    }
  };

  const openPermissionsModal = (folder: Folder) => {
    setPermissionsFolder(folder);
    setIsPermissionsModalOpen(true);
  };

  const closePermissionsModal = () => {
    setIsPermissionsModalOpen(false);
    setPermissionsFolder(null);
    // Refresh folders to reflect permission changes
    fetchFolders();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-700 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-slate-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-300 to-slate-300 bg-clip-text text-transparent">
                  Exmony
                </h1>
                <p className="text-gray-500 text-sm font-medium">File Manager</p>
              </div>
            </div>
            <div className="flex-1"></div>
            {/* Auth actions */}
            <div className="flex items-center gap-3">
              {/* Inbox Button */}
              <button
                onClick={() => router.push('/admin/inbox')}
                className="relative p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                title="Inbox"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
              </button>
              
              {/* Profile Button */}
              <button
                onClick={() => router.push('/admin/profile')}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                title="Profile"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              
              <button
                onClick={() => router.push('/admin/branches')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
              >Branches</button>
              <button
                onClick={() => router.push('/admin/users')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
              >Users</button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
              >Logout</button>
            </div>
          </div>
          <p className="text-gray-400 text-lg">Professional file organization and management</p>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => {
                setCurrentPath("");
                setPathHistory([]);
              }}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Home
            </button>
            {getBreadcrumbs().map((part, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-gray-500">/</span>
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {part}
                </button>
              </div>
            ))}
            {currentPath && (
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={goBack}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 backdrop-blur-md border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
            />
          </div>

          {/* Upload and View Controls */}
          <div className="flex items-center gap-3">
            {/* Root Folder Permissions Button - Only show when in root */}
            {!currentPath && (
              <button
                onClick={() => {
                  setPermissionsFolder({ name: 'Root Directory', type: 'folder', size: 0, created: '', modified: '' });
                  setIsPermissionsModalOpen(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                title="Configure root folder permissions"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Root Permissions</span>
              </button>
            )}
            {/* New Folder Button */}
            <button
              onClick={openCreateFolderModal}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>New Folder</span>
            </button>
            <button
              onClick={openYouTubeModal}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>Add YouTube</span>
            </button>

            {/* Upload Button */}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Upload</span>
            </button>

            {/* View Toggle */}
            <div className="flex bg-gray-800/50 backdrop-blur-md border border-gray-600/30 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-gray-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-gray-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-600/20 rounded-2xl p-6 shadow-2xl">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block relative">
                <div className="w-16 h-16 border-4 border-gray-600 border-t-gray-400 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-slate-400 rounded-full animate-spin" style={{animationDelay: '0.1s'}}></div>
              </div>
              <p className="mt-4 text-gray-300 text-lg">Loading your files...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 backdrop-blur-md border border-red-700/50 text-red-200 px-6 py-4 rounded-xl mb-6">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {!loading && !error && (
            <div>
              {filteredFolders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📂</div>
                  <p className="text-gray-300 text-xl mb-2">No files found</p>
                  <p className="text-gray-400">
                    {searchTerm ? 'Try adjusting your search terms' : 'Upload some files to get started'}
                  </p>
                </div>
              ) : (
                <DraggableFileList
                  folders={filteredFolders}
                  viewMode={viewMode}
                  onFileClick={handleFileClick}
                  onRename={openRenameModal}
                  onDelete={openDeleteModal}
                  onReorder={handleReorder}
                  onPermissions={openPermissionsModal}
                  isAdmin={true}
                />
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        {!loading && !error && folders.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-800/30 backdrop-blur-md border border-gray-600/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{folders.length}</div>
              <div className="text-sm text-gray-400">Total Items</div>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-md border border-gray-600/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {folders.filter(f => f.type === 'folder').length}
              </div>
              <div className="text-sm text-gray-400">Folders</div>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-md border border-gray-600/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {formatFileSize(folders.reduce((acc, f) => acc + f.size, 0))}
              </div>
              <div className="text-sm text-gray-400">Total Size</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-700/30">
          <div className="flex flex-col sm:flex-row items-center justify-between text-gray-500 text-sm">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <div className="w-6 h-6 bg-gradient-to-br from-gray-600 to-gray-800 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">A</span>
              </div>
              <span>Powered by <span className="text-gray-400 font-medium">Apegres</span></span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Professional File Management</span>
              <span>•</span>
              <span>Secure & Reliable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create Folder Modal */}
      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative bg-gray-800/90 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            {/* Close button */}
            <button
              onClick={closeCreateFolderModal}
              className="absolute top-4 right-4 p-2 bg-gray-700/80 hover:bg-gray-600/80 rounded-full transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div className="text-4xl">📁</div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Create New Folder</h2>
              <p className="text-gray-400">
                {currentPath ? `Creating in: ${currentPath}` : 'Creating in root directory'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
                  onKeyPress={(e) => {
                    if ((e as React.KeyboardEvent<HTMLInputElement>).key === 'Enter') {
                      handleCreateFolder();
                    }
                  }}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Avoid special characters: &lt; &gt; : " / \ | ? *
                </p>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700/50 text-red-200 px-4 py-3 rounded-xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={closeCreateFolderModal}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                  disabled={isCreatingFolder}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isCreatingFolder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {isRenameModalOpen && renameItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative bg-gray-800/90 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            {/* Close button */}
            <button
              onClick={closeRenameModal}
              className="absolute top-4 right-4 p-2 bg-gray-700/80 hover:bg-gray-600/80 rounded-full transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
      </div>
                <div className="text-4xl">
                  {renameItem.type === 'folder' ? '📁' : getFileIcon(renameItem.type, renameItem.name)}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {renameItem.type === 'youtube' ? 'Edit Video Title' : `Rename ${renameItem.type === 'folder' ? 'Folder' : 'File'}`}
              </h2>
              <p className="text-gray-400">
                {currentPath ? `In: ${currentPath}` : 'In root directory'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {renameItem.type === 'youtube' ? 'Current Title' : 'Current Name'}
                </label>
                <div className="px-4 py-3 bg-gray-700/30 border border-gray-600/30 rounded-xl text-gray-300">
                  {renameItem.type === 'youtube' && renameItem.title ? renameItem.title : renameItem.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {renameItem.type === 'youtube' ? 'New Title' : 'New Name'}
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={renameItem.type === 'youtube' ? 'Enter new title...' : 'Enter new name...'}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
                  onKeyPress={(e) => {
                    if ((e as React.KeyboardEvent<HTMLInputElement>).key === 'Enter') {
                      handleRename();
                    }
                  }}
                  autoFocus
                />
                {renameItem.type !== 'youtube' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Avoid special characters: &lt; &gt; : " / \ | ? *
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700/50 text-red-200 px-4 py-3 rounded-xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={closeRenameModal}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                  disabled={isRenaming}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRename}
                  disabled={isRenaming || !newItemName.trim() || (renameItem.type === 'youtube' ? newItemName === renameItem.title : newItemName === renameItem.name)}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isRenaming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{renameItem.type === 'youtube' ? 'Updating...' : 'Renaming...'}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>{renameItem.type === 'youtube' ? 'Update' : 'Rename'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative bg-gray-800/90 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            {/* Close button */}
            <button
              onClick={closeDeleteModal}
              className="absolute top-4 right-4 p-2 bg-gray-700/80 hover:bg-gray-600/80 rounded-full transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div className="text-4xl">🗑️</div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Delete {deleteItem.type === 'folder' ? 'Folder' : 'File'}</h2>
              <p className="text-gray-400">
                Are you sure you want to delete this {deleteItem.type}?
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-700/30 border border-gray-600/30 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {deleteItem.type === 'folder' ? '📁' : getFileIcon(deleteItem.type, deleteItem.name)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{deleteItem.name}</p>
                    <p className="text-gray-400 text-sm">
                      {deleteItem.type === 'folder' ? 'Folder' : deleteItem.type} • {formatFileSize(deleteItem.size)}
                    </p>
                  </div>
                </div>
              </div>

              {deleteItem.type === 'folder' && (
                <div className="bg-yellow-900/20 border border-yellow-700/30 text-yellow-200 px-4 py-3 rounded-xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm">This will delete the folder and all its contents permanently.</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-900/30 border border-red-700/50 text-red-200 px-4 py-3 rounded-xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
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
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div className="text-4xl">📤</div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Upload Files</h2>
              <p className="text-gray-400">
                {currentPath ? `Uploading to: ${currentPath}` : 'Uploading to root directory'}
              </p>
            </div>

            {/* Drag & Drop Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-gray-400 bg-gray-700/30'
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
                      className="bg-gray-400 h-2 rounded-full transition-all duration-300"
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
                  <label className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl cursor-pointer transition-colors duration-200">
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

            {/* Upload Tips */}
            {!isUploading && (
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Drag & drop</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Multiple files</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Auto refresh</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            {/* Close button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-full transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image container */}
            <div className="relative max-w-full max-h-full">
              <img
                src={selectedImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  console.error('Failed to load image:', selectedImage);
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            {/* Image info overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-gray-800/80 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white text-sm truncate">
                {selectedImage.split('/').pop()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* YouTube Video Input Modal */}
      {isYouTubeModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <h2 className="text-xl font-semibold text-white">Add YouTube Video</h2>
              </div>
              <button
                onClick={closeYouTubeModal}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Video Title
                </label>
                <input
                  type="text"
                  value={youtubeTitle}
                  onChange={(e) => setYoutubeTitle(e.target.value)}
                  placeholder="Enter video title..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={closeYouTubeModal}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddYouTube}
                  disabled={isAddingYouTube}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isAddingYouTube ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Video</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* YouTube Video Player Modal */}
      {isVideoModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-4xl mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">{selectedVideo.title}</h2>
              <button
                onClick={closeVideoModal}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <a
                  href={selectedVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>Watch on YouTube</span>
                </a>
              </div>
              <div className="text-sm text-gray-400">
                Added: {new Date(selectedVideo.created).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {isPdfModalOpen && selectedPdf && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-6xl mx-4 shadow-2xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">PDF Viewer</h2>
              <button
                onClick={closePdfModal}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 bg-white rounded-lg overflow-hidden">
              <iframe
                src={selectedPdf}
                className="w-full h-full"
                title="PDF Viewer"
                style={{ border: 'none' }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <a
                  href={selectedPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  <span>Open in New Tab</span>
                </a>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedPdf;
                    link.download = selectedPdf.split('/').pop() || 'document.pdf';
                    link.click();
                  }}
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download</span>
                </button>
              </div>
              <div className="text-sm text-gray-400">
                {selectedPdf.split('/').pop()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video File Player Modal */}
      {isVideoFileModalOpen && selectedVideoFile && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-6xl mx-4 shadow-2xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Video Player</h2>
              <button
                onClick={closeVideoFileModal}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              >
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <a
                  href={selectedVideoFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Open in New Tab</span>
                </a>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedVideoFile;
                    link.download = selectedVideoFile.split('/').pop() || 'video.mp4';
                    link.click();
                  }}
                  className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download</span>
                </button>
              </div>
              <div className="text-sm text-gray-400">
                {selectedVideoFile.split('/').pop()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {isDocumentModalOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-6xl mx-4 shadow-2xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">{documentType} Viewer</h2>
              <button
                onClick={closeDocumentModal}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 bg-white rounded-lg overflow-hidden">
            <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedDocument)}`}
    // src={`https://unpkg.com/excel-viewer@1.0.0/dist/index.html?file=${encodeURIComponent(selectedDocument)}`}
    className="w-full h-full"
    title="Excel Viewer"
    style={{ border: 'none' }}
  />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <a
                  href={selectedDocument}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  <span>Open in New Tab</span>
                </a>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedDocument;
                    link.download = selectedDocument.split('/').pop() || 'document';
                    link.click();
                  }}
                  className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download</span>
                </button>
              </div>
              <div className="text-sm text-gray-400">
                {selectedDocument.split('/').pop()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {permissionsFolder && (
        <PermissionsModal
          isOpen={isPermissionsModalOpen}
          onClose={closePermissionsModal}
          folderPath={
            permissionsFolder.name === 'Root Directory' 
              ? '' 
              : currentPath 
                ? `${currentPath}/${permissionsFolder.name}` 
                : permissionsFolder.name
          }
          folderName={permissionsFolder.name}
        />
      )}
    </div>
  );
}
