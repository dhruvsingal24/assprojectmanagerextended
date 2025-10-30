import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TaskItem from '../components/TaskItem';
import { projectsApi, tasksApi } from '../services/api';
import type { ProjectDetail } from '../types';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', dueDate: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    if (!id) return;
    
    try {
      const response = await projectsApi.getById(parseInt(id));
      setProject(response.data);
    } catch (error) {
      console.error('Failed to load project', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTask = async () => {
    if (!validate() || !id) return;

    setCreating(true);
    try {
      await tasksApi.create(parseInt(id), {
        title: formData.title,
        dueDate: formData.dueDate || undefined,
      });
      setShowModal(false);
      setFormData({ title: '', dueDate: '' });
      setErrors({});
      await loadProject();
    } catch (error) {
      console.error('Failed to create task', error);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleTask = async (taskId: number, isCompleted: boolean) => {
    try {
      await tasksApi.update(taskId, { isCompleted });
      await loadProject();
    } catch (error) {
      console.error('Failed to update task', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await tasksApi.delete(taskId);
      await loadProject();
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '2rem' }}>Project not found</div>
      </Layout>
    );
  }

  const completedTasks = project.tasks.filter(t => t.isCompleted).length;
  const totalTasks = project.tasks.length;

  return (
    <Layout>
      <div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          ← Back to Dashboard
        </button>

        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{project.title}</h2>
          {project.description && (
            <p style={{ color: '#666', marginBottom: '1rem' }}>{project.description}</p>
          )}
          <div style={{ fontSize: '0.9rem', color: '#999' }}>
            Created: {new Date(project.createdAt).toLocaleDateString()} • 
            {' '}{completedTasks} of {totalTasks} tasks completed
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Tasks</h3>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            + Add Task
          </button>
        </div>

        {project.tasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <p style={{ fontSize: '1.1rem', color: '#666' }}>
              No tasks yet. Add your first task!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {project.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}

        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
              <h3 style={{ marginTop: 0 }}>Add New Task</h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.title ? '#f44336' : '#ddd'}`,
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter task title"
                />
                {errors.title && (
                  <span style={{ color: '#f44336', fontSize: '0.85rem' }}>{errors.title}</span>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ title: '', dueDate: '' });
                    setErrors({});
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#f5f5f5',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={creating}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: creating ? '#ccc' : '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: 500
                  }}
                >
                  {creating ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProjectDetails;