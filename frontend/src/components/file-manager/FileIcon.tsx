import React from 'react';

interface FileIconProps {
  type: string;
  name: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ type, name }) => {
  const ext = name.split('.').pop()?.toLowerCase();
  
  // Folder icon
  if (type === 'folder') {
    return (
      <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.097.903 2 2 2h16c1.097 0 2-.903 2-2V8c0-1.11-.9-2-2-2h-8l-2-2z" />
      </svg>
    );
  }
  
  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')) {
    return (
      <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  
  // Video files
  if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'].includes(ext || '')) {
    return (
      <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  }
  
  // Audio files
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext || '')) {
    return (
      <svg className="w-12 h-12 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    );
  }
  
  // PDF files
  if (ext === 'pdf') {
    return (
      <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-3h8v-2H8v2zm0-4h8v-2H8v2zm0-4h5V7H8v2z"/>
      </svg>
    );
  }
  
  // Word documents
  if (['doc', 'docx'].includes(ext || '')) {
    return (
      <svg className="w-12 h-12 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 11h-2v2h2v2H9v-2H7v-2h2v-2H7V9h2V7h2v2h2v2h-2v2zm4-6h-5V3.5L17 7z"/>
      </svg>
    );
  }
  
  // Excel spreadsheets
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return (
      <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 15H9v-2h4v2zm0-4H9v-2h4v2zm0-4H9V7h4v2zm4-1h-5V3.5L17 8z"/>
      </svg>
    );
  }
  
  // PowerPoint presentations
  if (['ppt', 'pptx'].includes(ext || '')) {
    return (
      <svg className="w-12 h-12 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-2 11H9v4H7v-8h5c1.7 0 3 1.3 3 3s-1.3 3-3 3zm0-2c.6 0 1-.4 1-1s-.4-1-1-1H9v2h3zm5-4h-5V3.5L17 7z"/>
      </svg>
    );
  }
  
  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
    return (
      <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      </svg>
    );
  }
  
  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'].includes(ext || '')) {
    return (
      <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    );
  }
  
  // CSS files
  if (ext === 'css') {
    return (
      <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm1.8 18H14l-2-6.8L10 20H8.2L6.8 13h1.9l.7 4.4L11.1 13h1.8l1.7 4.4.7-4.4h1.9L15.8 20zM13 9V3.5L18.5 9H13z"/>
      </svg>
    );
  }
  
  // HTML files
  if (['html', 'htm'].includes(ext || '')) {
    return (
      <svg className="w-12 h-12 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm1 14h-2v2h-2v-2H9v-2h2v-2h2v2h2v2zm0-6H9V8h6v2zm4-3h-5V3.5L19 7z"/>
      </svg>
    );
  }
  
  // JSON files
  if (ext === 'json') {
    return (
      <svg className="w-12 h-12 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M5 3h2v2H5v5c0 1.1-.9 2-2 2 1.1 0 2 .9 2 2v5h2v2H5c-1.1 0-2-.9-2-2v-5c0-.6-.4-1-1-1v-2c.6 0 1-.4 1-1V5c0-1.1.9-2 2-2zm14 0c1.1 0 2 .9 2 2v5c0 .6.4 1 1 1v2c-.6 0-1 .4-1 1v5c0 1.1-.9 2-2 2h-2v-2h2v-5c0-1.1.9-2 2-2-1.1 0-2-.9-2-2V5h-2V3h2z"/>
      </svg>
    );
  }
  
  // Text files
  if (['txt', 'md', 'log'].includes(ext || '')) {
    return (
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  
  // Default file icon
  return (
    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
};

