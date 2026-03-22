import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import EmployeeCard from '../components/EmployeeCard';
import '../styles/Dashboard.css';
import {
  buildMeetingJoinLink,
  extractUrlsFromText,
  getMeetingRoomCode,
  getMeetingStartsAt,
  getMeetingTiming,
} from '../lib/meetingUtils';
import {
  LogOut,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Send,
  Plus,
  Video,
  Megaphone,
  Copy,
} from 'lucide-react';

export default function DashboardScreen() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  const [messageText, setMessageText] = useState('');
  const [shareType, setShareType] = useState('task');
  const [shareItemId, setShareItemId] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingAttendees, setMeetingAttendees] = useState([]);
  const [shareMeetingToChat, setShareMeetingToChat] = useState(true);
  const [shareMeetingToAnnouncements, setShareMeetingToAnnouncements] = useState(true);
  const [meetingAnnouncementNote, setMeetingAnnouncementNote] = useState('');
  const [meetingError, setMeetingError] = useState('');
  const [copiedMeetingKey, setCopiedMeetingKey] = useState('');
  const [timeNow, setTimeNow] = useState(Date.now());
  const messagesEndRef = useRef(null);

  const currentUserId = useDataStore((state) => state.currentUserId);
  const getCurrentUser = useDataStore((state) => state.getCurrentUser);
  const getUser = useDataStore((state) => state.getUser);
  const getTaskStatistics = useDataStore((state) => state.getTaskStatistics);
  const searchAll = useDataStore((state) => state.searchAll);
  const searchResults = useDataStore((state) => state.searchResults);
  const logout = useDataStore((state) => state.logout);
  const users = useDataStore((state) => state.users);
  const tasks = useDataStore((state) => state.tasks);
  const announcements = useDataStore((state) => state.announcements);
  const schedule = useDataStore((state) => state.schedule);
  const messages = useDataStore((state) => state.messages);
  const meetings = useDataStore((state) => state.meetings);
  const sendMessage = useDataStore((state) => state.sendMessage);
  const sendSharedMessage = useDataStore((state) => state.sendSharedMessage);
  const addAnnouncement = useDataStore((state) => state.addAnnouncement);
  const canAnnounce = useDataStore((state) => state.canAnnounce);
  const canSchedule = useDataStore((state) => state.canSchedule);
  const addMeeting = useDataStore((state) => state.addMeeting);
  const supabaseReady = useDataStore((state) => state.supabaseReady);
  const supabaseError = useDataStore((state) => state.supabaseError);
  const supabaseLoading = useDataStore((state) => state.supabaseLoading);
  const canManageData = useDataStore((state) => state.canManageData);
  const deleteAnnouncement = useDataStore((state) => state.deleteAnnouncement);
  const deleteScheduleItem = useDataStore((state) => state.deleteScheduleItem);
  const deleteMeeting = useDataStore((state) => state.deleteMeeting);
  const deleteMessage = useDataStore((state) => state.deleteMessage);

  const systemMessageTypes = new Set([
    'meeting_host',
    'meeting_lobby',
    'meeting_request',
    'meeting_approved',
    'meeting_denied',
    'meeting_recording',
  ]);
  const visibleMessages = messages.filter((msg) => !systemMessageTypes.has(msg.type));

  const currentUser = getCurrentUser();
  const stats = getTaskStatistics();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [activeTab, messages.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeNow(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchAll(query);
  };

  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage(messageText);
      setMessageText('');
    }
  };

  const handleShare = () => {
    if (!shareItemId) {
      alert('Select an item to share');
      return;
    }
    const item = availableShareItems.find((i) => i.id === shareItemId);
    if (!item) {
      alert('Invalid selection');
      return;
    }
    sendSharedMessage(shareType, item.payload);
    setShareItemId('');
  };

  const handleToggleAttendee = (userId) => {
    setMeetingAttendees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateMeeting = () => {
    setMeetingError('');
    if (!meetingTitle.trim()) {
      setMeetingError('Meeting title is required');
      return;
    }
    if (!meetingDate) {
      setMeetingError('Meeting date is required');
      return;
    }
    if (!meetingTime) {
      setMeetingError('Meeting time is required');
      return;
    }
    if (meetingAttendees.length === 0) {
      setMeetingError('Select at least one attendee');
      return;
    }

    const scheduledStart = new Date(`${meetingDate}T${meetingTime}`);
    if (Number.isNaN(scheduledStart.getTime())) {
      setMeetingError('Please choose a valid date and time');
      return;
    }

    if (scheduledStart.getTime() < Date.now() - 60000) {
      setMeetingError('Meeting time must be now or in the future');
      return;
    }

    addMeeting(meetingTitle, meetingDate, meetingTime, meetingAttendees, {
      shareToMessages: shareMeetingToChat,
      shareToAnnouncements: canAnnounce() && shareMeetingToAnnouncements,
      announcementTitle: `Meeting: ${meetingTitle.trim()}`,
      announcementMessage: meetingAnnouncementNote.trim(),
    });

    setMeetingTitle('');
    setMeetingDate('');
    setMeetingTime('');
    setMeetingAttendees([]);
    setMeetingAnnouncementNote('');
    setShareMeetingToChat(true);
    setShareMeetingToAnnouncements(true);
  };

  const handleAnnouncement = () => {
    const title = prompt('Announcement Title:');
    if (title) {
      const message = prompt('Announcement Message:');
      if (message) {
        addAnnouncement(title, message);
        alert('Announcement sent to all team members');
      }
    }
  };

  const chartData = useMemo(() => {
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    const seriesA = [12, 19, 15, 22, 28, 18, 25, 30, 22, 15, 18, 20];
    const seriesB = [8, 15, 12, 18, 20, 14, 20, 25, 18, 12, 15, 16];
    return { months, seriesA, seriesB };
  }, []);

  const availableShareItems = useMemo(() => {
    const items = [];
    if (shareType === 'task') {
      tasks.forEach(task => {
        items.push({
          id: task.id,
          label: task.title,
          payload: task
        });
      });
    } else if (shareType === 'schedule') {
      schedule.forEach(item => {
        items.push({
          id: item.id,
          label: item.title,
          payload: item
        });
      });
    } else if (shareType === 'meeting') {
      meetings.forEach(meeting => {
        const startsAt = getMeetingStartsAt(meeting);
        const roomId = getMeetingRoomCode(meeting);
        items.push({
          id: meeting.id,
          label: startsAt
            ? `${meeting.title} (${new Date(startsAt).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })})`
            : meeting.title,
          payload: {
            ...meeting,
            roomId,
            startsAt,
            joinLink: buildMeetingJoinLink({
              ...meeting,
              roomId,
              startsAt,
            }),
          }
        });
      });
    }
    return items;
  }, [shareType, tasks, schedule, meetings]);

  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((firstMeeting, secondMeeting) => {
      const firstStartsAt = getMeetingStartsAt(firstMeeting);
      const secondStartsAt = getMeetingStartsAt(secondMeeting);
      const firstTime = firstStartsAt ? new Date(firstStartsAt).getTime() : 0;
      const secondTime = secondStartsAt ? new Date(secondStartsAt).getTime() : 0;
      return firstTime - secondTime;
    });
  }, [meetings]);

  const getMeetingPath = useCallback((meetingLike) => {
    const roomId = getMeetingRoomCode(meetingLike);
    if (!roomId) {
      return '';
    }
    const params = new URLSearchParams();
    params.set('room', roomId);
    const startsAt = getMeetingStartsAt(meetingLike);
    if (startsAt) {
      params.set('start', startsAt);
    }
    if (meetingLike?.id) {
      params.set('meeting', meetingLike.id);
    }
    if (meetingLike?.title) {
      params.set('title', meetingLike.title);
    }
    return `/video-meet?${params.toString()}`;
  }, []);

  const getMeetingDisplayMeta = useCallback(
    (meetingLike) => {
      const startsAt = getMeetingStartsAt(meetingLike);
      const timing = getMeetingTiming(startsAt, timeNow);
      const roomId = getMeetingRoomCode(meetingLike);
      const joinLink = buildMeetingJoinLink({
        ...meetingLike,
        roomId,
        startsAt,
      });
      return {
        startsAt,
        timing,
        roomId,
        joinLink,
        scheduledLabel: startsAt
          ? new Date(startsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
          : `${meetingLike?.date || ''} ${meetingLike?.time || ''}`.trim(),
      };
    },
    [timeNow]
  );

  const handleJoinMeeting = useCallback(
    (meetingLike) => {
      const path = getMeetingPath(meetingLike);
      if (!path) {
        return;
      }
      navigate(path);
    },
    [getMeetingPath, navigate]
  );

  const handleCopyMeetingLink = useCallback(async (meetingLike, copyKey) => {
    const joinLink = buildMeetingJoinLink(meetingLike);
    if (!joinLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopiedMeetingKey(copyKey);
      setTimeout(() => {
        setCopiedMeetingKey((current) => (current === copyKey ? '' : current));
      }, 1800);
    } catch (error) {
      alert('Unable to copy the meeting link.');
    }
  }, []);

  const renderTextWithLinks = useCallback((text) => {
    if (!text) {
      return '';
    }

    const urls = extractUrlsFromText(text);
    if (urls.length === 0) {
      return text;
    }

    return text.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
      if (/^https?:\/\//i.test(part)) {
        return (
          <a key={`url-${index}-${part}`} href={part} target="_blank" rel="noreferrer">
            {part}
          </a>
        );
      }
      return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
    });
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-left">
            <div className="logo">
              <img src="/logo.png" alt="Cracoe Connect" className="logo-img" />
            </div>
            <div className="header-title">
              <h1>Dashboard</h1>
            </div>
          </div>
          
          <div className="header-center">
            <nav className="main-nav">
              <button
                className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`nav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setActiveTab('tasks')}
              >
                Tasks
              </button>
              <button
                className={`nav-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('leaderboard')}
              >
                Leaderboard
              </button>
              <button
                className={`nav-btn ${activeTab === 'messaging' ? 'active' : ''}`}
                onClick={() => setActiveTab('messaging')}
              >
                Messages
              </button>
              <button
                className={`nav-btn ${activeTab === 'schedule' ? 'active' : ''}`}
                onClick={() => setActiveTab('schedule')}
              >
                Schedule
              </button>
              {canAnnounce() && (
                <button
                  className={`nav-btn ${activeTab === 'announcements' ? 'active' : ''}`}
                  onClick={() => setActiveTab('announcements')}
                >
                  Announcements
                </button>
              )}
            </nav>
          </div>

          <div className="header-right">
            <div className="user-profile" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
              <div className="profile-avatar">
                {currentUser?.profilePhoto ? (
                  <img src={currentUser.profilePhoto} alt={currentUser.name} className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder">
                    {currentUser?.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="profile-info">
                <span className="profile-name">{currentUser?.name}</span>
                <span className="profile-role">{currentUser?.designation}</span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="content-area">
          {(supabaseLoading || supabaseError || !supabaseReady) && (
            <div className="supabase-status">
              {supabaseLoading && <span>Syncing with Supabase...</span>}
              {!supabaseLoading && supabaseError && (
                <span className="error">Supabase error: {supabaseError}</span>
              )}
              {!supabaseLoading && !supabaseError && !supabaseReady && (
                <span>Supabase not connected. Check env vars and schema.</span>
              )}
            </div>
          )}
          {/* Search Bar */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search employees, tasks, announcements..."
              className="search-input"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {/* Search Results */}
          {searchQuery && searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results ({searchResults.length})</h3>
              <div className="results-grid">
                {searchResults.map((result, idx) => (
                  <div key={idx} className="result-item">
                    <span className="result-type">{result.type}</span>
                    <span className="result-text">
                      {result.type === 'employee'
                        ? `${result.data.name} - ${result.data.designation}`
                        : result.type === 'task'
                        ? result.data.title
                        : result.type === 'announcement'
                        ? result.data.title
                        : result.type === 'schedule'
                        ? result.data.title
                        : result.type === 'message'
                        ? result.data.message.substring(0, 30)
                        : result.data.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-section">
              {/* Statistics */}
              <div className="statistics-grid">
                <div className="stat-card">
                  <div className="stat-icon completed">
                    <CheckCircle size={24} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Completed</p>
                    <p className="stat-value">{stats.completed}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon pending">
                    <Clock size={24} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Pending</p>
                    <p className="stat-value">{stats.pending}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon inprogress">
                    <AlertCircle size={24} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">In Progress</p>
                    <p className="stat-value">{stats.inProgress}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon total">
                    <Users size={24} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Total Tasks</p>
                    <p className="stat-value">{stats.total}</p>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="chart-container">
                <h3>Task Trend (12 Months)</h3>
                <svg viewBox="0 0 900 300" className="task-chart">
                  <defs>
                    <linearGradient id="gradientA" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" />
                      <stop offset="100%" stopColor="rgba(99, 102, 241, 0.01)" />
                    </linearGradient>
                    <linearGradient id="gradientB" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(168, 85, 247, 0.3)" />
                      <stop offset="100%" stopColor="rgba(168, 85, 247, 0.01)" />
                    </linearGradient>
                  </defs>

                  {/* Grid */}
                  {[1, 2, 3, 4].map((i) => (
                    <line
                      key={`grid-${i}`}
                      x1="50"
                      y1={50 + i * 50}
                      x2="850"
                      y2={50 + i * 50}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Y-axis */}
                  <line x1="50" y1="30" x2="50" y2="270" stroke="#333" strokeWidth="2" />
                  {/* X-axis */}
                  <line x1="50" y1="270" x2="850" y2="270" stroke="#333" strokeWidth="2" />

                  {/* Y-axis labels */}
                  {[0, 10, 20, 30].map((val, i) => (
                    <text key={`ylabel-${i}`} x="35" y={270 - i * 80 + 5} fontSize="12" fill="#666">
                      {val}
                    </text>
                  ))}

                  {/* X-axis labels */}
                  {chartData.months.map((month, i) => (
                    <text
                      key={`xlabel-${i}`}
                      x={50 + (i * 800) / 11}
                      y="290"
                      fontSize="12"
                      fill="#666"
                      textAnchor="middle"
                    >
                      {month}
                    </text>
                  ))}

                  {/* Series A path */}
                  <path
                    d={`M ${50 + 0} ${270 - (chartData.seriesA[0] * 240) / 30} ${chartData.seriesA
                      .map((val, i) => `L ${50 + (i * 800) / 11} ${270 - (val * 240) / 30}`)
                      .join(' ')}`}
                    stroke="#6366f1"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d={`M ${50 + 0} ${270 - (chartData.seriesA[0] * 240) / 30} ${chartData.seriesA
                      .map((val, i) => `L ${50 + (i * 800) / 11} ${270 - (val * 240) / 30}`)
                      .join(' ')} L 850 270 L 50 270 Z`}
                    fill="url(#gradientA)"
                  />

                  {/* Series B path */}
                  <path
                    d={`M ${50 + 0} ${270 - (chartData.seriesB[0] * 240) / 30} ${chartData.seriesB
                      .map((val, i) => `L ${50 + (i * 800) / 11} ${270 - (val * 240) / 30}`)
                      .join(' ')}`}
                    stroke="#a855f7"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d={`M ${50 + 0} ${270 - (chartData.seriesB[0] * 240) / 30} ${chartData.seriesB
                      .map((val, i) => `L ${50 + (i * 800) / 11} ${270 - (val * 240) / 30}`)
                      .join(' ')} L 850 270 L 50 270 Z`}
                    fill="url(#gradientB)"
                  />

                  {/* Legend */}
                  <circle cx="680" cy="20" r="4" fill="#6366f1" />
                  <text x="695" y="25" fontSize="12" fill="#333">
                    Assigned Tasks
                  </text>
                  <circle cx="680" cy="45" r="4" fill="#a855f7" />
                  <text x="695" y="50" fontSize="12" fill="#333">
                    Completed Tasks
                  </text>
                </svg>
              </div>

              {/* Recent Meetings */}
              <div className="meetings-section">
                <h3>Upcoming Meetings</h3>
                <div className="meetings-list">
                  {sortedMeetings.map((meeting) => {
                    const meta = getMeetingDisplayMeta(meeting);
                    return (
                      <div key={meeting.id} className="meeting-item">
                        <div className="meeting-icon">
                          <Calendar size={20} />
                        </div>
                        <div className="meeting-details">
                          <h4>{meeting.title}</h4>
                          <p>{meta.scheduledLabel}</p>
                          {meta.roomId && <p className="meeting-room-code">Room code: {meta.roomId}</p>}
                          {meta.timing.label && (
                            <div className={`meeting-status-pill ${meta.timing.status}`}>
                              {meta.timing.label}
                            </div>
                          )}
                          {meeting.minutes && (
                            <p className="meeting-minutes">Minutes: {meeting.minutes.substring(0, 50)}...</p>
                          )}
                          <div className="meeting-action-row">
                            <button className="btn-secondary compact" onClick={() => handleJoinMeeting(meeting)}>
                              Join
                            </button>
                            <button
                              className="btn-secondary compact"
                              onClick={() => handleCopyMeetingLink(meeting, meeting.id)}
                            >
                              {copiedMeetingKey === meeting.id ? 'Copied' : 'Copy link'}
                            </button>
                          </div>
                        </div>
                        {canManageData() && (
                          <button className="delete-btn" onClick={() => deleteMeeting(meeting.id)}>
                            Delete
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Announcements Section */}
              <div className="announcements-section">
                <div className="section-header">
                  <h3 className="announcements-title">
                    <Megaphone size={20} className="announcement-icon" />
                    Announcements
                  </h3>
                  {canAnnounce() && (
                    <button onClick={handleAnnouncement} className="new-announcement-btn">
                      + New
                    </button>
                  )}
                </div>
                <div className="announcements-list">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="announcement-item">
                      <div className="announcement-content">
                        <div className="announcement-header">
                          <h4 className="announcement-title">{ann.title}</h4>
                          {canManageData() && (
                            <button onClick={() => deleteAnnouncement(ann.id)} className="delete-btn">
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="announcement-message">{renderTextWithLinks(ann.message)}</p>
                        <small className="announcement-timestamp">
                          {new Date(ann.timestamp || ann.created_at).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tasks Tab (Employee cards) */}
          {activeTab === 'tasks' && (
            <div className="employees-section">
              <div className="employees-grid">
                {users.map((user) => (
                  <EmployeeCard
                    key={user.id}
                    employee={user}
                    onViewDetails={() => navigate(`/employee/${user.id}`)}
                    onAssignTask={() => navigate(`/create-task?assignee=${user.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="leaderboard-section">
              <h2>Team Leaderboard</h2>
              <p className="leaderboard-subtitle">Points earned by completing tasks</p>
              <div className="leaderboard-list">
                {users
                  .filter((user) => !['CEO', 'COO'].includes(user.designation))
                  .slice()
                  .sort((a, b) => (b.points || 0) - (a.points || 0))
                  .map((user, index) => (
                    <div key={user.id} className="leaderboard-item">
                      <div className="rank">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </div>
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt={user.name} className="user-avatar-img" />
                      ) : (
                        <div className="user-avatar">{user.name.charAt(0)}</div>
                      )}
                      <div className="user-details">
                        <h4>{user.name}</h4>
                        <p>{user.designation}</p>
                      </div>
                      <div className="points">
                        <span className="points-value">{user.points || 0}</span>
                        <span className="points-label">points</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Messaging Tab */}
          {activeTab === 'messaging' && (
            <div className="messaging-section">
              <div className="messaging-container">
                <div className="chat-area">
                  <div className="chat-header">
                    <h2>Team Chat Room</h2>
                    <span className="chat-subtitle">Everyone can talk here</span>
                    <div className="chat-share-controls">
                      <select
                        value={shareType}
                        onChange={(e) => {
                          setShareType(e.target.value);
                          setShareItemId('');
                        }}
                      >
                        <option value="task">Share Task</option>
                        <option value="schedule">Share Schedule</option>
                        <option value="meeting">Share Meeting</option>
                      </select>
                      <select
                        value={shareItemId}
                        onChange={(e) => setShareItemId(e.target.value)}
                      >
                        <option value="">Select an item</option>
                        {availableShareItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <button className="share-btn" onClick={handleShare}>
                        Share
                      </button>
                    </div>
                  </div>
                  <div className="messages-display" ref={messagesEndRef}>
                    {visibleMessages.map((msg) => {
                      const sender = getUser(msg.fromId);
                      const meetingMeta =
                        msg.type === 'meeting' && msg.payload
                          ? getMeetingDisplayMeta(msg.payload)
                          : null;
                      return (
                        <div
                          key={msg.id}
                          className={`message ${msg.fromId === currentUserId ? 'sent' : 'received'}`}
                        >
                          <div className="message-sender">
                            {sender?.name || 'Unknown'} • {sender?.designation || 'Team'}
                          </div>
                          {msg.type === 'task' && (
                            <div className="message-card">
                              <div className="card-title">Task Shared</div>
                              <div className="card-content">
                                <h4>{msg.payload?.title}</h4>
                                <p>{msg.payload?.description}</p>
                                <div className="card-meta">
                                  <span>Priority: {msg.payload?.priority}</span>
                                  <span>Deadline: {msg.payload?.deadline}</span>
                                  <span>Status: {msg.payload?.status}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {msg.type === 'schedule' && (
                            <div className="message-card">
                              <div className="card-title">Schedule Shared</div>
                              <div className="card-content">
                                <h4>{msg.payload?.title}</h4>
                                <div className="card-meta">
                                  <span>Time: {msg.payload?.time}</span>
                                  <span>Type: {msg.payload?.type}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {msg.type === 'meeting' && (
                            <div className="message-card">
                              <div className="card-title">Meeting Shared</div>
                              <div className="card-content">
                                <h4>{msg.payload?.title}</h4>
                                <div className="card-meta">
                                  <span>
                                    Scheduled:{' '}
                                    {meetingMeta?.scheduledLabel || `${msg.payload?.date || ''} ${msg.payload?.time || ''}`}
                                  </span>
                                  {meetingMeta?.roomId && <span>Room: {meetingMeta.roomId}</span>}
                                  {meetingMeta?.timing?.label && <span>{meetingMeta.timing.label}</span>}
                                </div>
                                {msg.payload?.minutes && (
                                  <p className="card-minutes">Minutes: {msg.payload?.minutes}</p>
                                )}
                                <div className="meeting-action-row message-actions">
                                  <button
                                    className="btn-secondary compact"
                                    onClick={() => handleJoinMeeting(msg.payload)}
                                  >
                                    Join
                                  </button>
                                  <button
                                    className="btn-secondary compact"
                                    onClick={() =>
                                      handleCopyMeetingLink(
                                        {
                                          ...msg.payload,
                                          joinLink: meetingMeta?.joinLink || msg.payload?.joinLink,
                                        },
                                        `message_${msg.id}`
                                      )
                                    }
                                  >
                                    {copiedMeetingKey === `message_${msg.id}` ? (
                                      'Copied'
                                    ) : (
                                      <>
                                        <Copy size={14} />
                                        Copy link
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          {(!msg.type || msg.type === 'text') && <p>{msg.message}</p>}
                          <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                          {canManageData() && (
                            <button
                              className="delete-btn compact"
                              onClick={() => deleteMessage(msg.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="message-input-area">
                    <input
                      type="text"
                      placeholder="Type your message to everyone..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button onClick={handleSendMessage}>
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="schedule-section">
              <h3>Today's Schedule</h3>
              <div className="schedule-list">
                {schedule.map((item) => (
                  <div key={item.id} className="schedule-item">
                    <div className="schedule-time">{item.time}</div>
                    <div className="schedule-content">
                      <h4>{item.title}</h4>
                      <p>{item.type}</p>
                    </div>
                    {canManageData() && (
                      <button
                        className="delete-btn"
                        onClick={() => deleteScheduleItem(item.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="meeting-creator">
                <div className="section-header">
                  <h3>Create Meeting</h3>
                  <div className="meeting-actions">
                    <button className="btn-secondary" onClick={() => navigate('/video-meet')}>
                      <Video size={18} />
                      Launch video meet
                    </button>
                    {!canSchedule() && <span className="access-note">Only leadership can schedule</span>}
                  </div>
                </div>

                {canSchedule() ? (
                  <div className="meeting-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          value={meetingTitle}
                          onChange={(e) => setMeetingTitle(e.target.value)}
                          placeholder="Team Sync"
                        />
                      </div>
                      <div className="form-group">
                        <label>Date</label>
                        <input
                          type="date"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Time</label>
                        <input
                          type="time"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Attendees</label>
                      <div className="attendees-grid">
                        {users.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            className={`attendee-chip ${meetingAttendees.includes(user.id) ? 'selected' : ''}`}
                            onClick={() => handleToggleAttendee(user.id)}
                          >
                            <span className="avatar">{user.name.charAt(0)}</span>
                            <span className="name">{user.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="meeting-share-options">
                      <label className="share-option">
                        <input
                          type="checkbox"
                          checked={shareMeetingToChat}
                          onChange={(event) => setShareMeetingToChat(event.target.checked)}
                        />
                        <span>Share this meeting in team messages</span>
                      </label>
                      {canAnnounce() && (
                        <label className="share-option">
                          <input
                            type="checkbox"
                            checked={shareMeetingToAnnouncements}
                            onChange={(event) => setShareMeetingToAnnouncements(event.target.checked)}
                          />
                          <span>Post this meeting in announcements</span>
                        </label>
                      )}
                    </div>

                    {canAnnounce() && shareMeetingToAnnouncements && (
                      <div className="form-group">
                        <label>Announcement note (optional)</label>
                        <textarea
                          value={meetingAnnouncementNote}
                          onChange={(event) => setMeetingAnnouncementNote(event.target.value)}
                          placeholder="Example: Please join 5 minutes early for updates."
                          rows={3}
                        />
                      </div>
                    )}

                    {meetingError && <div className="error-message">{meetingError}</div>}

                    <button className="btn-primary" onClick={handleCreateMeeting}>
                      Create and Share Meeting
                    </button>
                  </div>
                ) : (
                  <div className="access-denied-inline">You don't have permission to create meetings.</div>
                )}
              </div>
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && canAnnounce() && (
            <div className="announcements-management">
              <button className="btn-primary" onClick={handleAnnouncement}>
                <Plus size={20} />
                Create Announcement
              </button>
              <div className="announcements-list">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="announcement-card">
                    <h4>{announcement.title}</h4>
                    <p>{renderTextWithLinks(announcement.message)}</p>
                    <small>{new Date(announcement.timestamp).toLocaleString()}</small>
                    {canManageData() && (
                      <button
                        className="delete-btn"
                        onClick={() => deleteAnnouncement(announcement.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          className="btn-create-task"
          onClick={() => navigate('/create-task')}
          title="Create New Task"
        >
          <Plus size={24} />
        </button>

        {['CEO', 'CTO'].includes(currentUser?.designation) && (
          <button
            className="btn-admin"
            onClick={() => navigate('/admin')}
            title="Admin Panel"
          >
            ⚙️
          </button>
        )}
      </div>
    </div>
  );
}
