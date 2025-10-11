'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react';

interface SessionTask {
  id: string;
  text: string;
  completed: boolean;
}

interface SessionTasksProps {
  onTasksChange?: (tasks: SessionTask[]) => void;
}

export const SessionTasks: React.FC<SessionTasksProps> = ({ onTasksChange }) => {
  const [tasks, setTasks] = useState<SessionTask[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [inputValue, setInputValue] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newTask: SessionTask = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      completed: false,
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setInputValue('');
    onTasksChange?.(updatedTasks);
  };

  const handleToggleTask = (id: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    onTasksChange?.(updatedTasks);
  };

  const handleDeleteTask = (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    onTasksChange?.(updatedTasks);
  };

  return (
    <div className="w-full">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-3"
      >
        {isVisible ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">
          Session Tasks {tasks.length > 0 && `(${tasks.length})`}
        </span>
      </button>

      {/* Task Input and List */}
      {isVisible && (
        <div className="space-y-3">
          {/* Input */}
          <form onSubmit={handleAddTask} className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Add a task for this session..."
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] text-sm placeholder:text-gray-400"
            />
            {inputValue.trim() && (
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#007AFF] hover:text-[#0051D5]"
              >
                <Check className="w-5 h-5" />
              </button>
            )}
          </form>

          {/* Task List */}
          {tasks.length > 0 && (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 group"
                >
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      task.completed
                        ? 'bg-[#007AFF] border-[#007AFF]'
                        : 'border-gray-300 hover:border-[#007AFF]'
                    }`}
                  >
                    {task.completed && (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      task.completed
                        ? 'text-gray-400 line-through'
                        : 'text-gray-900'
                    }`}
                  >
                    {task.text}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
