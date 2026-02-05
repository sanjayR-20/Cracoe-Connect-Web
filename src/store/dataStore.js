import { create } from 'zustand';
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

const initialUsers = [];

const initialTasks = [];

const initialAnnouncements = [];

const initialSchedule = [];

const initialMessages = [];

const initialMeetings = [];

const isSupabaseConfigured = () => {
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
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

  setSupabaseError: (message) => {
    set({ supabaseError: message });
  },

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

      let users = usersRes.data || [];
      let tasks = (tasksRes.data || []).map(deserializeTask);
      const announcements = (announcementsRes.data || []).map(deserializeAnnouncement);
      const schedule = (scheduleRes.data || []).map(deserializeSchedule);
      const messages = (messagesRes.data || []).map(deserializeMessage);
      const meetings = (meetingsRes.data || []).map(deserializeMeeting);

      const pavithUser = users.find((u) => u.username === 'pavith');
      if (pavithUser) {
        users = users.filter((u) => u.id !== pavithUser.id);
        tasks = tasks.map((task) => ({
          ...task,
          assignedToId: task.assignedToId.filter((id) => id !== pavithUser.id),
        }));
        if (isSupabaseConfigured()) {
          await supabase.from('users').delete().eq('id', pavithUser.id);
          const tasksToUpdate = tasks.filter((task) => task.assignedToId.length > 0);
          await Promise.all(
            tasksToUpdate.map((task) =>
              supabase.from('tasks').update({ assigned_to_id: task.assignedToId }).eq('id', task.id)
            )
          );
        }
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
    return;
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

  canManageData: () => {
    const user = get().getCurrentUser();
    const role = user?.designation;
    return ['CEO', 'COO', 'CTO', 'CFO', 'Manager'].includes(role);
  },

  // Task operations
  createTask: (title, description, priority, deadline, assignedTo) => {
    const now = Date.now();
    const newTasks = assignedTo.map((userId) => ({
      id: `task_${now}_${userId}_${Math.random()}`,
      title,
      description,
      priority,
      deadline,
      status: 'Pending',
      assignedToId: [userId],
      createdBy: get().currentUserId,
    }));

    set((state) => ({
      tasks: [...state.tasks, ...newTasks],
    }));

    if (isSupabaseConfigured()) {
      supabase
        .from('tasks')
        .insert(newTasks.map(serializeTask))
        .then(({ error }) => error && set({ supabaseError: error.message }));
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
      supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .then(({ error }) => error && set({ supabaseError: error.message }));
    }

    const task = get().tasks.find((t) => t.id === taskId);
    task?.assignedToId.forEach((userId) => {
      sendNotification('Task Status Updated', `${task.title} is now ${newStatus}`);
    });
  },

  deleteTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    }));

    if (isSupabaseConfigured()) {
      supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .then(({ error }) => error && set({ supabaseError: error.message }));
    }
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
      supabase
        .from('announcements')
        .insert(serializeAnnouncement(newAnnouncement))
        .then(({ error }) => error && set({ supabaseError: error.message }));
    }
  },

  deleteAnnouncement: (announcementId) => {
    set((state) => ({
      announcements: state.announcements.filter((item) => item.id !== announcementId),
    }));

    if (isSupabaseConfigured()) {
      supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId)
        .then(({ error }) => error && set({ supabaseError: error.message }));
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
      supabase
        .from('schedule_items')
        .insert(serializeSchedule(newItem))
        .then(({ error }) => error && set({ supabaseError: error.message }));
    }
  },

  deleteScheduleItem: (scheduleId) => {
    set((state) => ({
      schedule: state.schedule.filter((item) => item.id !== scheduleId),
    }));

    if (isSupabaseConfigured()) {
      supabase
        .from('schedule_items')
        .delete()
        .eq('id', scheduleId)
        .then(({ error }) => error && set({ supabaseError: error.message }));
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
      supabase
        .from('messages')
        .insert(serializeMessage(newMessage))
        .then(({ error }) => error && set({ supabaseError: error.message }));
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
      supabase
        .from('messages')
        .insert(serializeMessage(newMessage))
        .then(({ error }) => error && set({ supabaseError: error.message }));
    }
  },

  deleteMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    }));

    if (isSupabaseConfigured()) {
      supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .then(({ error }) => error && set({ supabaseError: error.message }));
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
      supabase
        .from('meetings')
        .insert(serializeMeeting(newMeeting))
        .then(({ error }) => error && set({ supabaseError: error.message }));
    }
  },

  deleteMeeting: (meetingId) => {
    set((state) => ({
      meetings: state.meetings.filter((meeting) => meeting.id !== meetingId),
    }));

    if (isSupabaseConfigured()) {
      supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)
        .then(({ error }) => error && set({ supabaseError: error.message }));
    }
  },

  updateMeetingMinutes: (meetingId, minutes) => {
    set((state) => ({
      meetings: state.meetings.map((meeting) =>
        meeting.id === meetingId ? { ...meeting, minutes } : meeting
      ),
    }));

    if (isSupabaseConfigured()) {
      supabase
        .from('meetings')
        .update({ minutes })
        .eq('id', meetingId)
        .then(({ error }) => error && set({ supabaseError: error.message }));
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
        supabase
          .from('users')
          .update({ permissions: user.permissions })
          .eq('id', userId)
          .then(({ error }) => error && set({ supabaseError: error.message }));
      }
    }
  },

  addUser: (user) => {
    set((state) => ({
      users: [...state.users, user],
    }));

    if (isSupabaseConfigured()) {
      supabase
        .from('users')
        .insert(serializeUser(user))
        .then(({ error }) => error && set({ supabaseError: error.message }));
    }
  },

  removeUser: (userId) => {
    set((state) => {
      const users = state.users.filter((u) => u.id !== userId);
      const tasks = state.tasks
        .map((task) => ({
          ...task,
          assignedToId: task.assignedToId.filter((id) => id !== userId),
        }))
        .filter((task) => task.assignedToId.length > 0);
      const meetings = state.meetings.map((meeting) => ({
        ...meeting,
        attendees: meeting.attendees.filter((id) => id !== userId),
      }));
      const messages = state.messages.filter((msg) => msg.fromId !== userId);
      return { users, tasks, meetings, messages };
    });

    if (isSupabaseConfigured()) {
      supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .then(({ error }) => error && set({ supabaseError: error.message }));
      supabase
        .from('messages')
        .delete()
        .eq('from_id', userId)
        .then(({ error }) => error && set({ supabaseError: error.message }));
      const tasksToUpdate = get().tasks.filter((task) => task.assignedToId.includes(userId));
      tasksToUpdate.forEach((task) => {
        const updated = task.assignedToId.filter((id) => id !== userId);
        supabase
          .from('tasks')
          .update({ assigned_to_id: updated })
          .eq('id', task.id)
          .then(({ error }) => error && set({ supabaseError: error.message }));
      });
      const meetingsToUpdate = get().meetings.filter((meeting) => meeting.attendees.includes(userId));
      meetingsToUpdate.forEach((meeting) => {
        const updated = meeting.attendees.filter((id) => id !== userId);
        supabase
          .from('meetings')
          .update({ attendees: updated })
          .eq('id', meeting.id)
          .then(({ error }) => error && set({ supabaseError: error.message }));
      });
    }
  },
}));
