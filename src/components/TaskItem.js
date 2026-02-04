import React from 'react';
import { useDataStore } from '../store/dataStore';
import '../styles/TaskItem.css';
import { Play, CheckCircle, Clock } from 'lucide-react';

export default function TaskItem({ task }) {
  const updateTaskStatus = useDataStore((state) => state.updateTaskStatus);
  const currentUserId = useDataStore((state) => state.currentUserId);
  const canEditAllTasks = useDataStore((state) => state.canEditAllTasks);

  const canEdit = canEditAllTasks() || task.assignedToId.includes(currentUserId);

  const handleStatusChange = (newStatus) => {
    updateTaskStatus(task.id, newStatus);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return '#ef4444';
      case 'High':
        return '#f97316';
      case 'Medium':
        return '#eab308';
      case 'Low':
        return '#22c55e';
      default:
        return '#666';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return '#22c55e';
      case 'In Progress':
        return '#3b82f6';
      case 'Pending':
        return '#f59e0b';
      default:
        return '#666';
    }
  };

  return (
    <div className="task-item">
      <div className="task-header">
        <div className="task-title-section">
          <h4>{task.title}</h4>
          <p className="task-description">{task.description}</p>
        </div>
        <div className="task-badges">
          <span className="priority-badge" style={{ borderColor: getPriorityColor(task.priority) }}>
            {task.priority}
          </span>
          <span className="status-badge" style={{ backgroundColor: getStatusColor(task.status) }}>
            {task.status}
          </span>
        </div>
      </div>

      <div className="task-meta">
        <div className="meta-item">
          <Clock size={14} />
          <span>Deadline: {task.deadline}</span>
        </div>
        <div className="meta-item">
          <span>Assigned to: {task.assignedToId.length} person(s)</span>
        </div>
      </div>

      {canEdit && (
        <div className="task-actions">
          {task.status !== 'In Progress' && (
            <button
              className="action-btn start"
              onClick={() => handleStatusChange('In Progress')}
              title="Start Task"
            >
              <Play size={16} />
              Start
            </button>
          )}
          {task.status !== 'Completed' && (
            <button
              className="action-btn complete"
              onClick={() => handleStatusChange('Completed')}
              title="Complete Task"
            >
              <CheckCircle size={16} />
              Complete
            </button>
          )}
          {task.status === 'Completed' && (
            <button
              className="action-btn reset"
              onClick={() => handleStatusChange('Pending')}
              title="Reset to Pending"
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
