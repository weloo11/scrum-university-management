import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { LoginPage, RegisterPage } from "./pages/AuthPages.jsx";
import RoomsPage from "./pages/RoomsPage.jsx";
import MyBookingsPage from "./pages/MyBookingsPage.jsx";
import AdminBookingsPage from "./pages/AdminBookingsPage.jsx";
import AdminIssuesPage from "./pages/AdminIssuesPage.jsx";
import AdminRecordsPage from "./pages/AdminRecordsPage.jsx";
import StudentDashboardPage from "./pages/StudentDashboardPage.jsx";
import AdminTranscriptsPage from "./pages/AdminTranscriptsPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import { AdminApplicationsPage, ApplicationPage, StatusCheckPage } from "./pages/AdmissionsPages.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";
import { AdminOperationsPage, StaffPortalPage, StudentAcademicPage, TeachingToolsPage } from "./pages/SprintDashboards.jsx";

const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-slate-600">Loading session...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "user") return <Navigate to="/apply" replace />;
  if (user.role === "student") return <Navigate to="/student/academics" replace />;
  if (user.role === "admin") return <Navigate to="/admin/operations" replace />;
  if (["professor", "TA"].includes(user.role)) return <Navigate to="/teaching" replace />;
  if (user.role === "staff") return <Navigate to="/staff" replace />;
  return <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute roles={["user"]} />}>
          <Route path="/apply" element={<ApplicationPage />} />
          <Route path="/status" element={<StatusCheckPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={["student", "admin"]} />}>
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={["student"]} />}>
          <Route path="/student" element={<StudentDashboardPage />} />
          <Route path="/student/academics" element={<StudentAcademicPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={["professor", "TA"]} />}>
          <Route path="/teaching" element={<TeachingToolsPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={["professor", "TA", "staff"]} />}>
          <Route path="/staff" element={<StaffPortalPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={["student", "professor", "TA", "staff", "admin"]} />}>
          <Route path="/community" element={<CommunityPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/admin/operations" element={<AdminOperationsPage />} />
          <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          <Route path="/admin/issues" element={<AdminIssuesPage />} />
          <Route path="/admin/records" element={<AdminRecordsPage />} />
          <Route path="/admin/applications" element={<AdminApplicationsPage />} />
          <Route path="/admin/transcripts" element={<AdminTranscriptsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
