import { useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

interface ScheduleTask {
  title: string;
  estimatedHours: number;
  dueDate?: string;
  dependencies: string[];
}

interface ScheduleWarning {
  task: string;
  message: string;
  severity: string;
}

interface ScheduleMetrics {
  totalTasks: number;
  totalEstimatedHours: number;
  criticalPathLength: number;
  estimatedCompletionDate: string;
}

interface ScheduleResponse {
  recommendedOrder: string[];
  warnings: ScheduleWarning[];
  metrics: ScheduleMetrics;
}

const Scheduler: React.FC = () => {
  const [tasks, setTasks] = useState<ScheduleTask[]>([
    { title: '', estimatedHours: 1, dueDate: '', dependencies: [] }
  ]);
  const [response, setResponse] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addTask = () => {
    setTasks([...tasks, { title: '', estimatedHours: 1, dueDate: '', dependencies: [] }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: keyof ScheduleTask, value: any) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
  };

  const toggleDependency = (taskIndex: number, depTitle: string) => {
    const task = tasks[taskIndex];
    const deps = task.dependencies.includes(depTitle)
      ? task.dependencies.filter(d => d !== depTitle)
      : [...task.dependencies, depTitle];
    updateTask(taskIndex, 'dependencies', deps);
  };

  const loadExample = () => {
    setTasks([
      { title: 'Design API', estimatedHours: 5, dueDate: '2025-10-25', dependencies: [] },
      { title: 'Implement Backend', estimatedHours: 12, dueDate: '2025-10-28', dependencies: ['Design API'] },
      { title: 'Build Frontend', estimatedHours: 10, dueDate: '2025-10-30', dependencies: ['Design API'] },
      { title: 'End-to-End Test', estimatedHours: 8, dueDate: '2025-10-31', dependencies: ['Implement Backend', 'Build Frontend'] }
    ]);
    setResponse(null);
    setError('');
  };

  const generateSchedule = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const result = await api.post<ScheduleResponse>('/v1/projects/1/schedule', { tasks });
      setResponse(result.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate schedule');
      if (err.response?.data?.warnings) {
        setResponse(err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>🗓️ Smart Scheduler</h2>
          <button
            onClick={loadExample}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            Load Example
          </button>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginTop: 0 }}>Define Tasks</h3>
          
          {tasks.map((task, index) => (
            <div key={index} style={{
              backgroundColor: '#f9f9f9',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0 }}>Task {index + 1}</h4>
                {tasks.length > 1 && (
                  <button
                    onClick={() => removeTask(index)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => updateTask(index, 'title', e.target.value)}
                    placeholder="Enter task title"
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

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                    Hours *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={task.estimatedHours}
                    onChange={(e) => updateTask(index, 'estimatedHours', parseInt(e.target.value) || 1)}
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

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={task.dueDate}
                    onChange={(e) => updateTask(index, 'dueDate', e.target.value)}
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
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  Dependencies (select tasks this depends on)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {tasks.map((t, i) => i !== index && t.title && (
                    <label key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: 'white',
                      border: task.dependencies.includes(t.title) ? '2px solid #1976d2' : '1px solid #ddd',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        checked={task.dependencies.includes(t.title)}
                        onChange={() => toggleDependency(index, t.title)}
                        style={{ cursor: 'pointer' }}
                      />
                      {t.title}
                    </label>
                  ))}
                  {tasks.filter((t, i) => i !== index && t.title).length === 0 && (
                    <span style={{ color: '#999', fontSize: '0.9rem' }}>
                      No other tasks available. Add more tasks first.
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={addTask}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#f5f5f5',
                border: '2px dashed #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                color: '#666'
              }}
            >
              + Add Another Task
            </button>
            <button
              onClick={generateSchedule}
              disabled={loading || tasks.some(t => !t.title)}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: loading ? '#ccc' : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {loading ? 'Generating...' : '🚀 Generate Schedule'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid #ef9a9a'
          }}>
            ❌ {error}
          </div>
        )}

        {response && (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ marginTop: 0 }}>📊 Schedule Results</h3>

            {response.recommendedOrder.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#4caf50' }}>✅ Recommended Order:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {response.recommendedOrder.map((task, index) => (
                    <div key={index} style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#e3f2fd',
                      border: '2px solid #1976d2',
                      borderRadius: '8px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem'
                      }}>
                        {index + 1}
                      </span>
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {response.warnings.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h4>⚠️ Warnings:</h4>
                {response.warnings.map((warning, index) => (
                  <div key={index} style={{
                    padding: '1rem',
                    backgroundColor: warning.severity === 'Error' ? '#ffebee' : '#fff3e0',
                    border: `1px solid ${warning.severity === 'Error' ? '#f44336' : '#ff9800'}`,
                    borderRadius: '4px',
                    marginBottom: '0.5rem'
                  }}>
                    <strong>{warning.severity === 'Error' ? '❌' : '⚠️'} {warning.task}:</strong> {warning.message}
                  </div>
                ))}
              </div>
            )}

            {response.metrics.totalTasks > 0 && (
              <div>
                <h4>📈 Project Metrics:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>
                      {response.metrics.totalTasks}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Tasks</div>
                  </div>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4caf50' }}>
                      {response.metrics.totalEstimatedHours}h
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Hours</div>
                  </div>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff9800' }}>
                      {response.metrics.criticalPathLength}h
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Critical Path</div>
                  </div>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#9c27b0' }}>
                      {new Date(response.metrics.estimatedCompletionDate).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Est. Completion</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Scheduler;