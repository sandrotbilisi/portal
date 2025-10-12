'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableFileItem } from './DraggableFileItem';
import { Folder } from '../../types';

interface DraggableFileListProps {
  folders: Folder[];
  viewMode: 'grid' | 'list';
  onFileClick: (folder: Folder) => void;
  onRename: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
  onReorder: (newOrder: Folder[]) => void;
  onPermissions?: (folder: Folder) => void;
  isAdmin?: boolean;
}

export const DraggableFileList: React.FC<DraggableFileListProps> = ({
  folders,
  viewMode,
  onFileClick,
  onRename,
  onDelete,
  onReorder,
  onPermissions,
  isAdmin = false,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = folders.findIndex((f) => f.name === active.id);
      const newIndex = folders.findIndex((f) => f.name === over.id);

      const newOrder = arrayMove(folders, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={folders.map((f) => f.name)}
        strategy={viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-2'
          }
        >
          {folders.map((folder) => (
            <DraggableFileItem
              key={folder.name}
              folder={folder}
              viewMode={viewMode}
              onFileClick={onFileClick}
              onRename={onRename}
              onDelete={onDelete}
              onPermissions={onPermissions}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

