'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Task, UpdateTaskData, BulkTaskUpdate } from '@/types';
import { TaskItem } from './TaskItem';
import { TaskInput } from './TaskInput';

interface TaskListProps {
  tasks: Task[];
  projectId: string;
  status: 'active' | 'completed' | 'archived';
  onUpdateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onCreateTask: (data: { name: string; projectId: string }) => Promise<void>;
  onBulkUpdateTasks: (update: BulkTaskUpdate) => Promise<void>;
  isLoading?: boolean;
  showBulkActions?: boolean;
  selectedTaskIds?: string[];
  onToggleTaskSelection?: (taskId: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  projectId,
  status,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
  onBulkUpdateTasks,
  isLoading = false,
  showBulkActions = false,
  selectedTaskIds = [],
  onToggleTaskSelection,
}) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filteredTasks = tasks.filter(task => task.status === status);
  const selectedTasks = filteredTasks.filter(task => selectedTaskIds.includes(task.id));

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.index === destination.index) return;

    // Create new order array
    const newTasks = Array.from(filteredTasks);
    const [reorderedTask] = newTasks.splice(source.index, 1);
    newTasks.splice(destination.index, 0, reorderedTask);

    // Update order for all tasks
    try {
      for (let i = 0; i < newTasks.length; i++) {
        await onUpdateTask(newTasks[i].id, { order: i });
      }
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
    }
  };

  const handleBulkComplete = async () => {
    if (selectedTasks.length === 0) return;
    
    try {
      await onBulkUpdateTasks({
        taskIds: selectedTasks.map(task => task.id),
        status: 'completed',
      });
    } catch (error) {
      console.error('Failed to bulk complete tasks:', error);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedTasks.length === 0) return;
    
    try {
      await onBulkUpdateTasks({
        taskIds: selectedTasks.map(task => task.id),
        status: 'archived',
      });
    } catch (error) {
      console.error('Failed to bulk archive tasks:', error);
    }
  };

  const handleCreateTask = async (data: { name: string; projectId: string }) => {
    try {
      setIsCreating(true);
      await onCreateTask(data);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (taskId: string) => {
    setEditingTaskId(taskId);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  const handleSaveEdit = async (name: string) => {
    if (editingTaskId) {
      try {
        await onUpdateTask(editingTaskId, { name });
        setEditingTaskId(null);
      } catch (error) {
        console.error('Failed to update task name:', error);
      }
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'active':
        return 'Active Tasks';
      case 'completed':
        return 'Completed Tasks';
      case 'archived':
        return 'Archived Tasks';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return '⭕';
      case 'completed':
        return '✅';
      case 'archived':
        return '📦';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <h3 className="text-lg font-semibold text-gray-900">
            {getStatusLabel()} ({filteredTasks.length})
          </h3>
        </div>
        
        {showBulkActions && selectedTasks.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedTasks.length} selected
            </span>
            {status === 'active' && (
              <button
                onClick={handleBulkComplete}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
              >
                Complete All
              </button>
            )}
            {status === 'completed' && (
              <button
                onClick={handleBulkArchive}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
              >
                Archive All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add new task input */}
      {status === 'active' && (
        <TaskInput
          projectId={projectId}
          onCreateTask={handleCreateTask}
          isLoading={isCreating}
          placeholder="Add a new task..."
        />
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">{getStatusIcon()}</div>
          <p>No {status} tasks yet</p>
          {status === 'active' && (
            <p className="text-sm mt-1">Add a task above to get started</p>
          )}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={`tasks-${status}`} isDropDisabled={status !== 'active'}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-2 ${
                  snapshot.isDraggingOver ? 'bg-orange-50 rounded-lg p-2' : ''
                }`}
              >
                {filteredTasks
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={index}
                      isDragDisabled={status !== 'active'}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <TaskItem
                            task={task}
                            onUpdateTask={onUpdateTask}
                            onDeleteTask={onDeleteTask}
                            isSelected={selectedTaskIds.includes(task.id)}
                            onToggleSelect={onToggleTaskSelection}
                            showCheckbox={showBulkActions}
                            isEditing={editingTaskId === task.id}
                            onStartEdit={() => handleStartEdit(task.id)}
                            onCancelEdit={handleCancelEdit}
                            onSaveEdit={handleSaveEdit}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
};
