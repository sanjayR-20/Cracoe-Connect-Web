# Cracoe Connect - Web Application

A complete web-based task management system for team collaboration and productivity.

## Features

✅ **Authentication & Security**
- Secure login with 11 team member credentials
- Role-based access control (CEO, COO, CTO, CFO, Managers, Developers)
- Password-protected accounts

✅ **Task Management**
- Create and assign tasks to multiple team members
- Track task status (Pending, In Progress, Completed)
- Set priority levels and deadlines
- Real-time task notifications

✅ **Dashboard**
- Overview of all tasks with statistics
- 12-month task trend visualization
- Upcoming meetings display
- Team announcements

✅ **Employee Management**
- View all team members with detailed profiles
- Employee task statistics
- Role and permission management
- Contact information

✅ **Messaging System**
- Direct messaging between team members
- Message history preservation
- Real-time message delivery

✅ **Meetings Management**
- Schedule and manage team meetings
- Record meeting minutes
- Access-controlled minutes viewing

✅ **Admin Panel** (CEO only)
- Manage team permissions
- Control feature access for each role
- System-wide permission settings

✅ **Search Functionality**
- Global search across employees, tasks, announcements, and more
- Real-time search results

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Navigate to the web directory:**
```bash
cd web
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm start
```

The application will open at `http://localhost:3000`

## Demo Credentials

### CEO
- Username: `sharvesh`
- Password: `sharvesh123`

### COO
- Username: `sivadharana`
- Password: `sivadharana123`

### CTO
- Username: `shridharshini`
- Password: `shridharshini123`

### CFO
- Username: `sanjay`
- Password: `sanjay123`

### Marketing Lead
- Username: `pavith`
- Password: `pavith123`

### Managers
- Username: `sakthivel` / Password: `sakthivel123`
- Username: `sreejith` / Password: `sreejith123`

### Developers
- Username: `shanmugavel` / Password: `shanmugavel123`
- Username: `shreevardhann` / Password: `shreevardhann123`
- Username: `shalini` / Password: `shalini123`
- Username: `sujithra` / Password: `sujithra123`

## Project Structure

```
web/
├── public/
│   └── index.html
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── EmployeeDetailScreen.js
│   │   ├── CreateTaskScreen.js
│   │   └── AdminPanelScreen.js
│   ├── components/
│   │   ├── EmployeeCard.js
│   │   └── TaskItem.js
│   ├── store/
│   │   └── dataStore.js (Zustand store)
│   ├── styles/
│   │   ├── index.css
│   │   ├── Auth.css
│   │   ├── Dashboard.css
│   │   ├── EmployeeCard.css
│   │   ├── TaskItem.css
│   │   ├── EmployeeDetail.css
│   │   ├── CreateTask.css
│   │   └── AdminPanel.css
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Technology Stack

- **Frontend Framework:** React 18
- **Routing:** React Router v6
- **State Management:** Zustand
- **UI Components:** Lucide React Icons
- **Styling:** CSS3 with responsive design
- **Build Tool:** Create React App

## Available Scripts

### Development
```bash
npm start
```
Runs the app in development mode.

### Production Build
```bash
npm build
```
Builds the app for production to the `build` folder.

### Testing
```bash
npm test
```
Launches the test runner.

## Role-Based Permissions

### CEO
- ✅ Create and assign tasks
- ✅ Edit all tasks
- ✅ View all tasks
- ✅ Manage team permissions
- ✅ Access admin panel
- ✅ Announce to team
- ✅ Schedule meetings
- ✅ Manage meeting minutes

### COO / CFO / CTO
- ✅ Create and assign tasks
- ✅ Edit all tasks
- ✅ View all tasks
- ✅ Announce to team
- ✅ Schedule meetings
- ✅ View and manage meeting minutes
- ❌ No admin panel access

### Managers
- ✅ Create and assign tasks
- ✅ View all tasks
- ✅ Announce to team
- ✅ Schedule meetings
- ❌ Cannot edit all tasks
- ❌ Cannot view meeting minutes

### Developers
- ✅ View assigned tasks only
- ✅ Edit their own tasks
- ✅ Participate in meetings
- ❌ Cannot create tasks
- ❌ Cannot announce
- ❌ Cannot schedule
- ❌ Cannot view meeting minutes

## Key Features Explanation

### Task Management
- Only CEO, COO, CTO, CFO, and Managers can create and assign tasks
- Developers can only manage their own assigned tasks
- All task status changes trigger notifications

### Search System
- Global search across 8 data types: employees, tasks, announcements, schedule, messages, projects, clients, and meetings
- Real-time search results

### Notifications
- Browser-based notifications for task assignments
- Task status change notifications
- Permission-based notification delivery

### Dashboard Analytics
- Task completion statistics with visual cards
- 12-month trend visualization showing task assignments and completions
- Real-time metrics update

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Responsive Design

The application is fully responsive and optimized for:
- Desktop (1920px and above)
- Tablet (768px - 1024px)
- Mobile (320px - 767px)

## Performance

- Optimized component rendering
- Lazy loading of routes
- Efficient state management with Zustand
- CSS animations and transitions

## Future Enhancements

- Backend API integration with Supabase
- Real-time database synchronization
- Email notifications
- File attachments for tasks
- Project templates
- Team analytics and reporting

## License

This project is proprietary and confidential.

## Support

For issues and feature requests, please contact the development team.
