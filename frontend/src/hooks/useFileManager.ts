import { useState, useEffect } from 'react';
import axios from 'axios';
import { Folder, FileManagerState } from '../types';
import { buildApiUrl, API_BASE_URL, buildCompanyApiUrl } from '../utils';

export const useFileManager = (companyId: string) => {
  const [state, setState] = useState<FileManagerState>({
    folders: [],
    loading: true,
    error: null,
    searchTerm: '',
    viewMode: 'grid',
    currentPath: '',
    pathHistory: []
  });


  const fetchFolders = async (path?: string) => {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      setState(prev => ({ ...prev, loading: true, error: null }));
      const url = buildCompanyApiUrl(companyId, 'folders', path);
      const response = await axios.get(url);
      
      if (response.data.success) {
        setState(prev => ({ ...prev, folders: response.data.data }));
      } else {
        setState(prev => ({ 
          ...prev, 
          error: response.data.message || 'Failed to fetch folders' 
        }));
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
      setState(prev => ({ ...prev, error: 'Failed to connect to server' }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const uploadFiles = async (files: FileList, onProgress?: (progress: number) => void) => {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderPath', state.currentPath);

        const response = await axios.post(buildCompanyApiUrl(companyId, 'files'), formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
            onProgress?.(progress);
          },
        });

        if (!response.data.success) {
          throw new Error(response.data.message || 'Upload failed');
        }
      }

      // Refresh the folder contents after successful upload
      await fetchFolders(state.currentPath);
      return { success: true };
    } catch (err) {
      console.error('Upload error:', err);
      setState(prev => ({ ...prev, error: 'Failed to upload files' }));
      return { success: false, error: 'Failed to upload files' };
    }
  };

  const createFolder = async (folderName: string) => {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      const response = await axios.post(buildCompanyApiUrl(companyId, 'folders'), {
        folderName: folderName.trim(),
        folderPath: state.currentPath
      });

      if (response.data.success) {
        await fetchFolders(state.currentPath);
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to create folder' };
      }
    } catch (err: any) {
      console.error('Create folder error:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Failed to create folder' 
      };
    }
  };

  const renameItem = async (item: Folder, newName: string) => {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      const filePath = state.currentPath ? `${state.currentPath}/${item.name}` : item.name;
      const response = await axios.put(buildCompanyApiUrl(companyId, 'files', filePath), {
        newName: newName.trim()
      });

      if (response.data.success) {
        await fetchFolders(state.currentPath);
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to rename item' };
      }
    } catch (err: any) {
      console.error('Rename error:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Failed to rename item' 
      };
    }
  };

  const deleteItem = async (item: Folder) => {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      const filePath = state.currentPath ? `${state.currentPath}/${item.name}` : item.name;
      const response = await axios.delete(buildCompanyApiUrl(companyId, 'files', filePath));

      if (response.data.success) {
        await fetchFolders(state.currentPath);
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete item' };
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Failed to delete item' 
      };
    }
  };

  const addYouTubeVideo = async (url: string, title: string) => {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      const response = await fetch(buildCompanyApiUrl(companyId, 'youtube'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim(),
          folderPath: state.currentPath
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add YouTube video');
      }

      await fetchFolders(state.currentPath);
      return { success: true };
    } catch (error) {
      console.error('Error adding YouTube video:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add YouTube video' 
      };
    }
  };

  const navigateToFolder = (folderName: string) => {
    const newPath = state.currentPath ? `${state.currentPath}/${folderName}` : folderName;
    setState(prev => ({
      ...prev,
      currentPath: newPath,
      pathHistory: [...prev.pathHistory, prev.currentPath]
    }));
  };

  const navigateBack = () => {
    if (state.pathHistory.length > 0) {
      const newPath = state.pathHistory[state.pathHistory.length - 1];
      setState(prev => ({
        ...prev,
        currentPath: newPath,
        pathHistory: prev.pathHistory.slice(0, -1)
      }));
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    const newPath = state.pathHistory[index] || "";
    setState(prev => ({
      ...prev,
      currentPath: newPath,
      pathHistory: prev.pathHistory.slice(0, index)
    }));
  };

  const goToRoot = () => {
    setState(prev => ({
      ...prev,
      currentPath: "",
      pathHistory: []
    }));
  };

  const updateSearchTerm = (term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }));
  };

  const updateViewMode = (mode: 'grid' | 'list') => {
    setState(prev => ({ ...prev, viewMode: mode }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  // Fetch folders when currentPath or companyId changes
  useEffect(() => {
    if (companyId) {
      fetchFolders(state.currentPath);
    }
  }, [state.currentPath, companyId]);

  return {
    ...state,
    fetchFolders,
    uploadFiles,
    createFolder,
    renameItem,
    deleteItem,
    addYouTubeVideo,
    navigateToFolder,
    navigateBack,
    navigateToBreadcrumb,
    goToRoot,
    updateSearchTerm,
    updateViewMode,
    setError
  };
};
