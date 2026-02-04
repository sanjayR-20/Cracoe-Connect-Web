import React from 'react';
import { useDataStore } from '../store/dataStore';
import '../styles/EmployeeCard.css';
import { Mail } from 'lucide-react';

export default function EmployeeCard({ employee, onViewDetails, onAssignTask }) {
  const getTasksForUser = useDataStore((state) => state.getTasksForUser);
  const tasks = getTasksForUser(employee.id);

  const displayTasks = tasks.slice(0, 3);

  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;

  return (
    <div className="employee-card">
      <div className="card-header">
        <div className="avatar">{employee.name.charAt(0)}</div>
        <div className="designation-badge">{employee.designation}</div>
      </div>

      <div className="card-content">
        <h3>{employee.name}</h3>
        <div className="contact-info">
          <div className="info-item">
            <Mail size={14} />
            <span>{employee.email}</span>
          </div>
        </div>

        <div className="task-stats">
          <div className="stat">
            <span className="label">Total</span>
            <span className="value">{tasks.length}</span>
          </div>
          <div className="stat">
            <span className="label">Completed</span>
            <span className="value completed">{completedTasks}</span>
          </div>
          <div className="stat">
            <span className="label">In Progress</span>
            <span className="value inprogress">{inProgressTasks}</span>
          </div>
          <div className="stat">
            <span className="label">Pending</span>
            <span className="value pending">{pendingTasks}</span>
          </div>
        </div>

        <div className="task-preview">
          <p className="preview-title">Assigned Tasks</p>
          {displayTasks.length === 0 ? (
            <p className="preview-empty">No tasks assigned</p>
          ) : (
            <ul>
              {displayTasks.map((task) => (
                <li key={task.id}>{task.title}</li>
              ))}
            </ul>
          )}
          {tasks.length > displayTasks.length && (
            <span className="preview-more">+{tasks.length - displayTasks.length} more</span>
          )}
        </div>
      </div>

      <div className="card-actions">
        <button className="view-details-btn" onClick={onViewDetails}>
          View Details →
        </button>
        <button className="assign-task-btn" onClick={onAssignTask}>
          Assign Task
        </button>
      </div>
    </div>
  );
}
