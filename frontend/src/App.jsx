import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MemberDetailPage from "./pages/MemberDetailPage";
import TasksPage from "./pages/TasksPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import TaskFormPage from "./pages/TaskFormPage";
import ChangeRequestsPage from "./pages/ChangeRequestsPage";
import UsersPage from "./pages/UsersPage";
import TeamsPage from "./pages/TeamsPage";
import InvitationsPage from "./pages/InvitationsPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import MyTasksPage from "./pages/MyTasksPage";
import CalendarPage from "./pages/CalendarPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/members/:memberId" element={<MemberDetailPage />} />
              <Route path="/tasks/:taskId" element={<TaskDetailPage />} />

              {/* Member only */}
              <Route element={<ProtectedRoute roles={["Member"]} />}>
                <Route path="/tasks/my" element={<MyTasksPage />} />
              </Route>

              {/* Leader + Admin */}
              <Route
                element={<ProtectedRoute roles={["TeamLeader", "Admin"]} />}
              >
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/tasks/new" element={<TaskFormPage />} />
                <Route path="/tasks/:taskId/edit" element={<TaskFormPage />} />
                <Route
                  path="/change-requests"
                  element={<ChangeRequestsPage />}
                />
              </Route>

              {/* Admin only */}
              <Route element={<ProtectedRoute roles={["Admin"]} />}>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/invitations" element={<InvitationsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
