import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import PaymentsPage from './pages/PaymentsPage';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import ExpensesPage from './pages/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import RemindersPage from './pages/RemindersPage';
import MassMessagingPage from './pages/MassMessagingPage';
import GroupsPage from './pages/GroupsPage';
import PayrollPage from './pages/PayrollPage';
import AuditLogsPage from './pages/AuditLogsPage';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorManagementPage from './pages/InstructorManagementPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentLoginPage from './pages/StudentLoginPage';
import MentorDashboardPage from './pages/MentorDashboardPage';

import { useEffect } from 'react';
import signalRService from './services/SignalRService';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAdmin, isSales, isAccountant, isInstructor, isMentor, isCoordinator, isStudent } = useAuth();
  const location = useLocation();
  
  if (!user) {
    if (location.pathname.startsWith('/student')) {
      return <Navigate to="/student-login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  const isPureInstructor = isInstructor && !isAdmin && !isSales && !isAccountant && !isMentor && !isCoordinator;
  const isPureMentor = isMentor && !isAdmin && !isSales && !isAccountant && !isInstructor && !isCoordinator;

  // Students can ONLY access /student-portal
  if (isStudent && location.pathname !== '/student-portal') {
    return <Navigate to="/student-portal" replace />;
  }

  // Pure instructors can ONLY access /instructor
  if (isPureInstructor && location.pathname !== '/instructor') {
    return <Navigate to="/instructor" replace />;
  }

  // Pure mentors can ONLY access /mentor
  if (isPureMentor && location.pathname !== '/mentor') {
    return <Navigate to="/mentor" replace />;
  }
  
  if (requiredRole === 'Admin' && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'AdminCoordinator' && !isAdmin && !isCoordinator) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'NoCoordinator' && isCoordinator) {
    return <Navigate to="/instructor-mgmt" replace />;
  }

  if (requiredRole === 'AdminAccountant' && !isAdmin && !isAccountant) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'Accountant' && !isAdmin && !isAccountant) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'Student' && !isStudent) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'Mentor' && !isMentor) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppContent = () => {
  const { user, isAdmin, isAccountant, isStudent } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/student-login';

  useEffect(() => {
    if (user && (isAdmin || isAccountant)) {
      signalRService.startConnection((notification) => {
        toast.info(notification.message, {
          icon: notification.type === 'PaymentMade' ? '💰' : '👤',
          autoClose: 5000
        });
      });
    }

    return () => {
      signalRService.stopConnection();
    };
  }, [user, isAdmin, isAccountant]);

  return (
    <div className="App" dir="rtl">
      {user && !isLoginPage && !isStudent && <Navbar />}
      <div className={isLoginPage ? "" : "container-premium page-wrapper"}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/student-login" element={<StudentLoginPage />} />
          
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="AdminAccountant">
              <AdminDashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/employees" element={
            <ProtectedRoute requiredRole="AdminCoordinator">
              <EmployeeManagementPage />
            </ProtectedRoute>
          } />

          <Route path="/instructor-mgmt" element={
            <ProtectedRoute requiredRole="AdminCoordinator">
              <InstructorManagementPage />
            </ProtectedRoute>
          } />

          <Route path="/expenses" element={
            <ProtectedRoute requiredRole="Accountant">
              <ExpensesPage />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute requiredRole="Accountant">
              <ReportsPage />
            </ProtectedRoute>
          } />

          <Route path="/payroll" element={
            <ProtectedRoute requiredRole="Accountant">
              <PayrollPage />
            </ProtectedRoute>
          } />

          <Route path="/audit-logs" element={
            <ProtectedRoute requiredRole="AdminAccountant">
              <AuditLogsPage />
            </ProtectedRoute>
          } />

          <Route path="/reminders" element={
            <ProtectedRoute>
              <RemindersPage />
            </ProtectedRoute>
          } />

          <Route path="/mass-message" element={
            <ProtectedRoute>
              <MassMessagingPage />
            </ProtectedRoute>
          } />
          
          <Route path="/student-portal" element={
            <ProtectedRoute requiredRole="Student">
              <StudentDashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/mentor" element={
            <ProtectedRoute requiredRole="Mentor">
              <MentorDashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/" element={
            <ProtectedRoute requiredRole="NoCoordinator">
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/students" element={
            <ProtectedRoute requiredRole="NoCoordinator">
              <StudentsPage />
            </ProtectedRoute>
          } />
          <Route path="/subscriptions" element={
            <ProtectedRoute>
              <SubscriptionsPage />
            </ProtectedRoute>
          } />
          <Route path="/groups" element={
            <ProtectedRoute>
              <GroupsPage />
            </ProtectedRoute>
          } />
          <Route path="/instructor" element={
            <ProtectedRoute>
              <InstructorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/payments" element={
            <ProtectedRoute>
              <PaymentsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
      <ToastContainer position="bottom-left" rtl={true} />
    </div>
  );
};

function App() {
  return (
    <AppContent />
  );
}

export default App;
