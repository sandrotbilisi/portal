'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Folder } from '../../types';
import { formatFileSize, getFileIcon, isImageFile, isVideoFile, isDocumentFile } from '../../utils';

interface DraggableFileItemProps {
  folder: Folder;
  viewMode: 'grid' | 'list';
  onFileClick: (folder: Folder) => void;
  onRename: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
}

export const DraggableFileItem: React.FC<DraggableFileItemProps> = ({
  folder,
  viewMode,
  onFileClick,
  onRename,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = () => {
    onFileClick(folder);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const menu = e.currentTarget.nextElementSibling;
    if (menu) {
      menu.classList.toggle('hidden');
    }
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRename(folder);
    const menu = e.currentTarget.closest('.absolute');
    if (menu) menu.classList.add('hidden');
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(folder);
    const menu = e.currentTarget.closest('.absolute');
    if (menu) menu.classList.add('hidden');
  };

  const isClickable =
    folder.type === 'folder' ||
    isImageFile(folder.name) ||
    folder.type === 'youtube' ||
    folder.name.toLowerCase().endsWith('.pdf') ||
    isVideoFile(folder.name) ||
    isDocumentFile(folder.name);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={`group relative bg-gray-700/30 backdrop-blur-md border border-gray-600/20 rounded-xl p-4 hover:bg-gray-600/40 hover:border-gray-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
        isClickable ? 'cursor-pointer' : 'cursor-default'
      } ${viewMode === 'list' ? 'flex items-center justify-between' : 'text-center'}`}
    >
      {/* Drag Handle Icon */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2 bg-gray-600/50 hover:bg-gray-500/50 rounded-lg transition-colors duration-200">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>
      </div>

      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-600/10 to-slate-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className={`relative z-10 ${viewMode === 'list' ? 'flex items-center space-x-4 flex-1' : ''}`}>
        <div className={`${viewMode === 'list' ? '' : 'mb-3'}`}>
          <div className="text-4xl flex justify-center transform group-hover:scale-110 transition-transform duration-300">
            {folder.type === 'youtube' ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <img
                  src={folder.thumbnail}
                  alt={folder.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>

                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                {/* YouTube badge */}
                <div className="absolute top-1 left-1 w-5 h-5 bg-red-600 rounded flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
              </div>
            ) : (
              getFileIcon(folder.type, folder.name)
            )}
          </div>
        </div>

        <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
          <h3 className="font-semibold text-white group-hover:text-gray-200 transition-colors duration-300 truncate">
            {folder.type === 'youtube' ? folder.title : folder.name}
          </h3>
          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
            {folder.type === 'folder' ? 'Folder' : folder.type === 'youtube' ? 'YouTube Video' : folder.type}
          </p>
        </div>
      </div>

      <div
        className={`relative z-10 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300 ${
          viewMode === 'list' ? 'text-right' : 'mt-3'
        }`}
      >
        <p className="font-medium">{formatFileSize(folder.size)}</p>
        <p className="text-xs">{new Date(folder.modified).toLocaleDateString()}</p>
      </div>

      {/* Action menu (appear on hover) */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button
            onClick={handleMenuClick}
            className="p-2 bg-gray-600/50 hover:bg-gray-500/50 rounded-lg transition-colors duration-200"
            title="More actions"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl hidden z-30">
            <div className="py-1">
              <button
                onClick={handleRenameClick}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Rename</span>
              </button>
              <button
                onClick={handleDeleteClick}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

