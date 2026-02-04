import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import TaskItem from '../components/TaskItem';
import '../styles/EmployeeDetail.css';
import { ArrowLeft, Mail, Briefcase } from 'lucide-react';

export default function EmployeeDetailScreen() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const getUser = useDataStore((state) => state.getUser);
  const getTasksForUser = useDataStore((state) => state.getTasksForUser);

  const employee = getUser(employeeId);
  const employeeTasks = getTasksForUser(employeeId);

  if (!employee) {
    return (
      <div className="employee-detail-container">
        <p>Employee not found</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="employee-detail-container">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} /> Back
        </button>
      </header>

      <div className="detail-content">
        <div className="employee-header">
          <div className="employee-avatar">{employee.name.charAt(0)}</div>
          <div className="employee-info">
            <h1>{employee.name}</h1>
            <p className="designation">{employee.designation}</p>
            <div className="contact-info">
              <div className="info-item">
                <Mail size={16} />
                <span>{employee.email}</span>
              </div>
              <div className="info-item">
                <Briefcase size={16} />
                <span>{employee.designation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Display */}
        <div className="permissions-section">
          <h3>Permissions</h3>
          <div className="permissions-grid">
            {Object.entries(employee.permissions).map(([key, value]) => (
              <div key={key} className="permission-item">
                <span className="permission-name">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                <span className={`permission-value ${value ? 'allowed' : 'denied'}`}>
                  {value ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Section */}
        <div className="tasks-section">
          <h3>Assigned Tasks ({employeeTasks.length})</h3>
          {employeeTasks.length === 0 ? (
            <p className="no-tasks">No tasks assigned</p>
          ) : (
            <div className="tasks-list">
              {employeeTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
