import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import '../styles/CreateTask.css';
import { ArrowLeft, Plus, X } from 'lucide-react';

export default function CreateTaskScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState('');

  const users = useDataStore((state) => state.users);
  const createTask = useDataStore((state) => state.createTask);
  const canManageTasks = useDataStore((state) => state.canManageTasks);
  const getCurrentUser = useDataStore((state) => state.getCurrentUser);

  const currentUser = getCurrentUser();

  useEffect(() => {
    const assignee = searchParams.get('assignee');
    if (assignee) {
      setSelectedUsers((prev) => (prev.includes(assignee) ? prev : [...prev, assignee]));
    }
  }, [searchParams]);

  if (!canManageTasks()) {
    return (
      <div className="create-task-container">
        <div className="access-denied">
          <p>You don't have permission to create tasks</p>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length - 1) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.filter((u) => u.id !== currentUser.id).map((u) => u.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Please select at least one team member');
      return;
    }

    if (!deadline) {
      setError('Deadline is required');
      return;
    }

    createTask(title, description, priority, deadline, selectedUsers);
    alert('Task created successfully and assigned to selected team members');
    navigate('/dashboard');
  };

  return (
    <div className="create-task-container">
      <header className="task-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} /> Back
        </button>
        <h1>Create New Task</h1>
      </header>

      <form onSubmit={handleSubmit} className="create-task-form">
        <div className="form-group">
          <label htmlFor="title">Task Title *</label>
          <input
            id="title"
            type="text"
            placeholder="Enter task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            placeholder="Enter task description"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="priority">Priority *</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="deadline">Deadline *</label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Assign to Team Members *</label>
          <button
            type="button"
            className="btn-select-all"
            onClick={handleSelectAll}
          >
            {selectedUsers.length === users.length - 1 ? 'Deselect All' : 'Select All'}
          </button>

          <div className="assignees-grid">
            {users
              .filter((u) => u.id !== currentUser.id)
              .map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className={`assignee-chip ${selectedUsers.includes(user.id) ? 'selected' : ''}`}
                  onClick={() => handleSelectUser(user.id)}
                >
                  <span className="avatar">{user.name.charAt(0)}</span>
                  <span className="name">{user.name}</span>
                  {selectedUsers.includes(user.id) && <X size={16} />}
                </button>
              ))}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/dashboard')}>
            Cancel
          </button>
          <button type="submit" className="btn-create">
            <Plus size={18} />
            Create Task
          </button>
        </div>
      </form>
    </div>
  );
}
