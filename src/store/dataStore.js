import create from 'zustand';
import { supabase } from '../lib/supabaseClient';

// Notification helper for web
const sendNotification = (title, message) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: '👔',
    });
  }
};

const initialUsers = [
  {
    id: 'user_1',
    username: 'sharvesh',
    password: 'sharvesh123',
    name: 'Sharvesh S',
    designation: 'CEO',
    email: 'sharvesh@cracoeconnect.com',
    permissions: {
      canAssignTasks: true,
      canViewAdmin: true,
      canManageTeam: true,
      canViewAllTasks: true,
      canEditAllTasks: true,
      canAnnounce: true,
      canSchedule: true,
      canViewMeetingMinutes: true,
      canManageMeetingMinutes: true,
    },
  },
  {
    id: 'user_2',
    username: 'sivadharana',
    password: 'sivadharana123',
    name: 'Sivadharana',
    designation: 'COO',
    email: 'sivadharana@cracoeconnect.com',
    permissions: {
      canAssignTasks: true,
      canViewAdmin: false,
      canManageTeam: true,
      canViewAllTasks: true,
      canEditAllTasks: true,
      canAnnounce: true,
      canSchedule: true,
      canViewMeetingMinutes: true,
      canManageMeetingMinutes: true,
    },
  },
  {
    id: 'user_3',
    username: 'shridharshini',
    password: 'shridharshini123',
    name: 'Shri Dharshini',
    designation: 'CTO',
    email: 'shridharshini@cracoeconnect.com',
    permissions: {
      canAssignTasks: true,
      canViewAdmin: false,
      canManageTeam: true,
      canViewAllTasks: true,
      canEditAllTasks: true,
      canAnnounce: true,
      canSchedule: true,
      canViewMeetingMinutes: true,
      canManageMeetingMinutes: true,
    },
  },
  {
    id: 'user_4',
    username: 'pavith',
    password: 'pavith123',
    name: 'Pavith',
    designation: 'Marketing Lead',
    email: 'pavith@cracoeconnect.com',
    permissions: {
      canAssignTasks: true,
      canViewAdmin: false,
      canManageTeam: true,
      canViewAllTasks: true,
      canEditAllTasks: false,
      canAnnounce: true,
      canSchedule: true,
      canViewMeetingMinutes: false,
      canManageMeetingMinutes: false,
    },
  },
  {
    id: 'user_5',
    username: 'sanjay',
    password: 'sanjay123',
    name: 'Sanjay R',
    designation: 'CFO',
    email: 'sanjay@cracoeconnect.com',
    permissions: {
      canAssignTasks: true,
      canViewAdmin: false,
      canManageTeam: true,
      canViewAllTasks: true,
      canEditAllTasks: true,
      canAnnounce: true,
      canSchedule: true,
      canViewMeetingMinutes: true,
      canManageMeetingMinutes: true,
    },
  },
  {
    id: 'user_6',
    username: 'sakthivel',
    password: 'sakthivel123',
    name: 'Sakthivel',
    designation: 'Manager',
    email: 'sakthivel@cracoeconnect.com',
    permissions: {
      canAssignTasks: true,
      canViewAdmin: false,
      canManageTeam: true,
      canViewAllTasks: true,
      canEditAllTasks: false,
      canAnnounce: true,
      canSchedule: true,
      canViewMeetingMinutes: false,
      canManageMeetingMinutes: false,
    },
  },
  {
    id: 'user_7',
    username: 'shanmugavel',
    password: 'shanmugavel123',
    name: 'Shanmugavel',
    designation: 'Developer',
    email: 'shanmugavel@cracoeconnect.com',
    permissions: {
      canAssignTasks: false,
      canViewAdmin: false,
      canManageTeam: false,
      canViewAllTasks: false,
      canEditAllTasks: false,
      canAnnounce: false,
      canSchedule: false,
      canViewMeetingMinutes: false,
      canManageMeetingMinutes: false,
    },
  },
  {
    id: 'user_8',
    username: 'shreevardhann',
    password: 'shreevardhann123',
    name: 'Shree Vardhann',
    designation: 'Developer',
    email: 'shreevardhann@cracoeconnect.com',
    permissions: {
      canAssignTasks: false,
      canViewAdmin: false,
      canManageTeam: false,
      canViewAllTasks: false,
      canEditAllTasks: false,
      canAnnounce: false,
      canSchedule: false,
      canViewMeetingMinutes: false,
      canManageMeetingMinutes: false,
    },
  },
  {
    id: 'user_9',
    username: 'shalini',
    password: 'shalini123',
    name: 'Shalini',
    designation: 'Developer',
    email: 'shalini@cracoeconnect.com',
    permissions: {
      canAssignTasks: false,
      canViewAdmin: false,
      canManageTeam: false,
      canViewAllTasks: false,
      canEditAllTasks: false,
      canAnnounce: false,
      canSchedule: false,
      canViewMeetingMinutes: false,
      canManageMeetingMinutes: false,
    },
  },
  {
    id: 'user_10',
    username: 'sreejith',
    password: 'sreejith123',
    name: 'Sreejith',
    designation: 'Manager',
    email: 'sreejith@cracoeconnect.com',
    permissions: {
      canAssignTasks: true,
      canViewAdmin: false,
      canManageTeam: true,
      canViewAllTasks: true,
      canEditAllTasks: false,
      canAnnounce: true,
      canSchedule: true,
      canViewMeetingMinutes: false,
      canManageMeetingMinutes: false,
    },
  },
  {
    id: 'user_11',
    username: 'sujithra',
    password: 'sujithra123',
    name: 'Sujithra',
    designation: 'Developer',
    email: 'sujithra@cracoeconnect.com',
    permissions: {
      canAssignTasks: false,
      canViewAdmin: false,
      canManageTeam: false,
      canViewAllTasks: false,
      canEditAllTasks: false,
      canAnnounce: false,
      canSchedule: false,
      canViewMeetingMinutes: false,
      canManageMeetingMinutes: false,
    },
  },
];

const initialTasks = [
  {
    id: 'task_1',
    title: 'Design Landing Page',
    description: 'Create modern landing page design',
    priority: 'High',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'In Progress',
    assignedToId: ['user_4'],
    createdBy: 'user_1',
  },
  {
    id: 'task_2',
    title: 'Fix Login Bug',
    description: 'Debug authentication flow',
    priority: 'Critical',
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Pending',
    assignedToId: ['user_7', 'user_8'],
    createdBy: 'user_3',
  },
  {
    id: 'task_3',
    title: 'Database Migration',
    description: 'Migrate user data to new database',
    priority: 'High',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Completed',
    assignedToId: ['user_3'],
    createdBy: 'user_1',
  },
];

const initialAnnouncements = [
  {
    id: 'announcement_1',
    title: 'Welcome to Cracoe Connect',
    message: 'New team collaboration platform launched',
    createdBy: 'user_1',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'announcement_2',
    title: 'Q1 Planning Meeting',
    message: 'All hands meeting scheduled for next Friday',
    createdBy: 'user_5',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

const initialSchedule = [
  {
    id: 'schedule_1',
    title: 'Team Standup',
    time: '09:30 AM',
    type: 'Meeting',
  },
  {
    id: 'schedule_2',
    title: 'Project Review',
    time: '02:00 PM',
    type: 'Meeting',
  },
];

const initialMessages = [
  {
    id: 'message_1',
    fromId: 'user_1',
    type: 'text',
    message: 'Welcome everyone! Use this channel for team-wide updates.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'message_2',
    fromId: 'user_3',
    type: 'text',
    message: 'Noted. I will post the technical proposal summary here shortly.',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

const initialMeetings = [
  {
    id: 'meeting_1',
    title: 'Q1 Strategic Planning',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    attendees: ['user_1', 'user_2', 'user_3', 'user_5'],
    minutes: 'Discussed quarterly goals and roadmap. Allocated budget for new projects.',
  },
  {
    id: 'meeting_2',
    title: 'Tech Stack Review',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '02:00 PM',
    attendees: ['user_3', 'user_7', 'user_8', 'user_9'],
    minutes: '',
  },
];

const isSupabaseConfigured = () => {
  return Boolean(process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY);
};

const serializeUser = (user) => ({
  id: user.id,
  username: user.username,
  password: user.password,
  name: user.name,
  designation: user.designation,
  email: user.email,
  permissions: user.permissions,
});

const serializeTask = (task) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  priority: task.priority,
  deadline: task.deadline,
  status: task.status,
  assigned_to_id: task.assignedToId,
  created_by: task.createdBy,
});

const deserializeTask = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  priority: row.priority,
  deadline: row.deadline,
  status: row.status,
  assignedToId: row.assigned_to_id || [],
  createdBy: row.created_by,
});

const serializeAnnouncement = (announcement) => ({
  id: announcement.id,
  title: announcement.title,
  message: announcement.message,
  created_by: announcement.createdBy,
  timestamp: announcement.timestamp,
});

const deserializeAnnouncement = (row) => ({
  id: row.id,
  title: row.title,
  message: row.message,
  createdBy: row.created_by,
  timestamp: row.timestamp,
});

const serializeSchedule = (item) => ({
  id: item.id,
  title: item.title,
  time: item.time,
  type: item.type,
});

const deserializeSchedule = (row) => ({
  id: row.id,
  title: row.title,
  time: row.time,
  type: row.type,
});

const serializeMessage = (message) => ({
  id: message.id,
  from_id: message.fromId,
  type: message.type || 'text',
  message: message.message || null,
  payload: message.payload || null,
  timestamp: message.timestamp,
});

const deserializeMessage = (row) => ({
  id: row.id,
  fromId: row.from_id,
  type: row.type || 'text',
  message: row.message || '',
  payload: row.payload || null,
  timestamp: row.timestamp,
});

const serializeMeeting = (meeting) => ({
  id: meeting.id,
  title: meeting.title,
  date: meeting.date,
  time: meeting.time,
  attendees: meeting.attendees,
  minutes: meeting.minutes,
});

const deserializeMeeting = (row) => ({
  id: row.id,
  title: row.title,
  date: row.date,
  time: row.time,
  attendees: row.attendees || [],
  minutes: row.minutes || '',
});

export const useDataStore = create((set, get) => ({
  currentUserId: null,
  users: initialUsers,
  tasks: initialTasks,
  announcements: initialAnnouncements,
  schedule: initialSchedule,
  messages: initialMessages,
  meetings: initialMeetings,
  searchResults: [],
  supabaseReady: false,
  supabaseError: null,
  supabaseLoading: false,

  initializeFromSupabase: async () => {
    if (!isSupabaseConfigured()) {
      set({ supabaseReady: false });
      return;
    }

    set({ supabaseLoading: true, supabaseError: null });

    try {
      const [usersRes, tasksRes, announcementsRes, scheduleRes, messagesRes, meetingsRes] =
        await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('tasks').select('*'),
          supabase.from('announcements').select('*'),
          supabase.from('schedule_items').select('*'),
          supabase.from('messages').select('*'),
          supabase.from('meetings').select('*'),
        ]);

      const hasSchemaErrors =
        usersRes.error || tasksRes.error || announcementsRes.error || scheduleRes.error || messagesRes.error || meetingsRes.error;

      if (hasSchemaErrors) {
        throw new Error(
          usersRes.error?.message ||
            tasksRes.error?.message ||
            announcementsRes.error?.message ||
            scheduleRes.error?.message ||
            messagesRes.error?.message ||
            meetingsRes.error?.message ||
            'Supabase schema error'
        );
      }

      const users = usersRes.data || [];
      const tasks = (tasksRes.data || []).map(deserializeTask);
      const announcements = (announcementsRes.data || []).map(deserializeAnnouncement);
      const schedule = (scheduleRes.data || []).map(deserializeSchedule);
      const messages = (messagesRes.data || []).map(deserializeMessage);
      const meetings = (meetingsRes.data || []).map(deserializeMeeting);

      if (users.length === 0) {
        await get().seedSupabase();
        return;
      }

      set({
        users,
        tasks,
        announcements,
        schedule,
        messages,
        meetings,
        supabaseReady: true,
        supabaseLoading: false,
      });
    } catch (error) {
      set({
        supabaseError: error?.message || 'Supabase connection failed',
        supabaseReady: false,
        supabaseLoading: false,
      });
    }
  },

  seedSupabase: async () => {
    if (!isSupabaseConfigured()) return;

    try {
      await Promise.all([
        supabase.from('users').insert(initialUsers.map(serializeUser)),
        supabase.from('tasks').insert(initialTasks.map(serializeTask)),
        supabase.from('announcements').insert(initialAnnouncements.map(serializeAnnouncement)),
        supabase.from('schedule_items').insert(initialSchedule.map(serializeSchedule)),
        supabase.from('messages').insert(initialMessages.map(serializeMessage)),
        supabase.from('meetings').insert(initialMeetings.map(serializeMeeting)),
      ]);

      set({
        users: initialUsers,
        tasks: initialTasks,
        announcements: initialAnnouncements,
        schedule: initialSchedule,
        messages: initialMessages,
        meetings: initialMeetings,
        supabaseReady: true,
        supabaseLoading: false,
      });
    } catch (error) {
      set({
        supabaseError: error?.message || 'Supabase seed failed',
        supabaseReady: false,
        supabaseLoading: false,
      });
    }
  },

  // Authentication
  authenticate: (username, password) => {
    const user = get().users.find(
      (u) => u.username === username.toLowerCase() && u.password === password
    );
    if (user) {
      set({ currentUserId: user.id });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ currentUserId: null, searchResults: [] });
  },

  // User getters
  getCurrentUser: () => {
    const users = get().users;
    const id = get().currentUserId;
    return users.find((u) => u.id === id);
  },

  getUser: (id) => {
    return get().users.find((u) => u.id === id);
  },

  // Permissions
  canManageTasks: () => {
    const user = get().getCurrentUser();
    return user?.permissions?.canAssignTasks ?? false;
  },

  canViewAdmin: () => {
    const user = get().getCurrentUser();
    return user?.designation === 'CEO';
  },

  canViewAllTasks: () => {
    const user = get().getCurrentUser();
    return user?.permissions?.canViewAllTasks ?? false;
  },

  canEditAllTasks: () => {
    const user = get().getCurrentUser();
    return user?.permissions?.canEditAllTasks ?? false;
  },

  canAnnounce: () => {
    const user = get().getCurrentUser();
    return user?.permissions?.canAnnounce ?? false;
  },

  canSchedule: () => {
    const user = get().getCurrentUser();
    return user?.permissions?.canSchedule ?? false;
  },

  canViewMeetingMinutes: () => {
    const user = get().getCurrentUser();
    return user?.permissions?.canViewMeetingMinutes ?? false;
  },

  canManageMeetingMinutes: () => {
    const user = get().getCurrentUser();
    return user?.permissions?.canManageMeetingMinutes ?? false;
  },

  // Task operations
  createTask: (title, description, priority, deadline, assignedTo) => {
    const newTask = {
      id: `task_${Date.now()}_${Math.random()}`,
      title,
      description,
      priority,
      deadline,
      status: 'Pending',
      assignedToId: assignedTo,
      createdBy: get().currentUserId,
    };

    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));

    if (isSupabaseConfigured()) {
      supabase.from('tasks').insert(serializeTask(newTask));
    }

    assignedTo.forEach((userId) => {
      sendNotification('New Task Assigned', `You have been assigned: ${title}`);
    });
  },

  updateTaskStatus: (taskId, newStatus) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ),
    }));

    if (isSupabaseConfigured()) {
      supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    }

    const task = get().tasks.find((t) => t.id === taskId);
    task?.assignedToId.forEach((userId) => {
      sendNotification('Task Status Updated', `${task.title} is now ${newStatus}`);
    });
  },

  getTasksForUser: (userId) => {
    return get().tasks.filter((task) => task.assignedToId.includes(userId));
  },

  getTaskStatistics: () => {
    const tasks = get().tasks;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const pending = tasks.filter((t) => t.status === 'Pending').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    return { completed, pending, inProgress, total: tasks.length };
  },

  // Announcements
  addAnnouncement: (title, message) => {
    const newAnnouncement = {
      id: `announcement_${Date.now()}`,
      title,
      message,
      createdBy: get().currentUserId,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      announcements: [...state.announcements, newAnnouncement],
    }));

    if (isSupabaseConfigured()) {
      supabase.from('announcements').insert(serializeAnnouncement(newAnnouncement));
    }
  },

  // Schedule
  addScheduleItem: (title, time, type) => {
    const newItem = {
      id: `schedule_${Date.now()}`,
      title,
      time,
      type,
    };
    set((state) => ({
      schedule: [...state.schedule, newItem],
    }));

    if (isSupabaseConfigured()) {
      supabase.from('schedule_items').insert(serializeSchedule(newItem));
    }
  },

  // Messages
  sendMessage: (message) => {
    const newMessage = {
      id: `message_${Date.now()}`,
      fromId: get().currentUserId,
      type: 'text',
      message,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));

    if (isSupabaseConfigured()) {
      supabase.from('messages').insert(serializeMessage(newMessage));
    }
  },

  sendSharedMessage: (type, payload) => {
    const newMessage = {
      id: `message_${Date.now()}`,
      fromId: get().currentUserId,
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));

    if (isSupabaseConfigured()) {
      supabase.from('messages').insert(serializeMessage(newMessage));
    }
  },

  // Meetings
  addMeeting: (title, date, time, attendees) => {
    const newMeeting = {
      id: `meeting_${Date.now()}`,
      title,
      date,
      time,
      attendees,
      minutes: '',
    };
    set((state) => ({
      meetings: [...state.meetings, newMeeting],
    }));

    if (isSupabaseConfigured()) {
      supabase.from('meetings').insert(serializeMeeting(newMeeting));
    }
  },

  updateMeetingMinutes: (meetingId, minutes) => {
    set((state) => ({
      meetings: state.meetings.map((meeting) =>
        meeting.id === meetingId ? { ...meeting, minutes } : meeting
      ),
    }));

    if (isSupabaseConfigured()) {
      supabase.from('meetings').update({ minutes }).eq('id', meetingId);
    }
  },

  // Search across all data types
  searchAll: (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = [];

    // Search employees
    get().users.forEach((user) => {
      if (
        user.name.toLowerCase().includes(lowerQuery) ||
        user.designation.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ type: 'employee', data: user });
      }
    });

    // Search tasks
    get().tasks.forEach((task) => {
      if (
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ type: 'task', data: task });
      }
    });

    // Search announcements
    get().announcements.forEach((announcement) => {
      if (
        announcement.title.toLowerCase().includes(lowerQuery) ||
        announcement.message.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ type: 'announcement', data: announcement });
      }
    });

    // Search schedule
    get().schedule.forEach((item) => {
      if (item.title.toLowerCase().includes(lowerQuery)) {
        results.push({ type: 'schedule', data: item });
      }
    });

    // Search messages
    get().messages.forEach((message) => {
      if (message.type === 'text' && message.message.toLowerCase().includes(lowerQuery)) {
        results.push({ type: 'message', data: message });
        return;
      }

      const payloadText =
        message.type === 'task'
          ? `${message.payload?.title || ''} ${message.payload?.description || ''}`
          : message.type === 'schedule'
          ? `${message.payload?.title || ''} ${message.payload?.type || ''}`
          : message.type === 'meeting'
          ? `${message.payload?.title || ''} ${message.payload?.minutes || ''}`
          : '';

      if (payloadText.toLowerCase().includes(lowerQuery)) {
        results.push({ type: 'message', data: message });
      }
    });

    // Search meetings
    get().meetings.forEach((meeting) => {
      if (meeting.title.toLowerCase().includes(lowerQuery)) {
        results.push({ type: 'meeting', data: meeting });
      }
    });

    set({ searchResults: results });
  },

  updateUserPermission: (userId, permission, value) => {
    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId
          ? {
              ...user,
              permissions: { ...user.permissions, [permission]: value },
            }
          : user
      ),
    }));

    if (isSupabaseConfigured()) {
      const user = get().users.find((u) => u.id === userId);
      if (user) {
        supabase.from('users').update({ permissions: user.permissions }).eq('id', userId);
      }
    }
  },
}));
