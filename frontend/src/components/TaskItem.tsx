import { useState } from 'react';
import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: number, isCompleted: boolean) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsDeleting(true);
      try {
        await onDelete(task.id);
      } catch (error) {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      opacity: isDeleting ? 0.5 : 1
    }}>
      <input
        type="checkbox"
        checked={task.isCompleted}
        onChange={(e) => onToggle(task.id, e.target.checked)}
        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
        disabled={isDeleting}
      />
      <div style={{ flex: 1 }}>
        <div style={{
          textDecoration: task.isCompleted ? 'line-through' : 'none',
          color: task.isCompleted ? '#999' : '#333',
          fontWeight: 500
        }}>
          {task.title}
        </div>
        {task.dueDate && (
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
            📅 Due: {formatDate(task.dueDate)}
          </div>
        )}
      </div>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isDeleting ? 'not-allowed' : 'pointer',
          fontSize: '0.85rem'
        }}
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
};

export default TaskItem;