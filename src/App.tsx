import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/Dashboard";
import FacultyPage from "./pages/FacultyPage";
import UserManagementPage from "./pages/UserManagementPage";
import SettingsPage from "./pages/SettingsPage";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DepartmentPage from "./pages/DepartmentPage";
import PositionPage from "./pages/PositionPage";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken && location.pathname !== "/") {
      navigate("/");
    }
  }, [navigate, location]);

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* These are nested routes that will render inside the MainLayout via the Outlet */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/faculty" element={<FacultyPage />} />
          <Route path="/departments" element={<DepartmentPage />} />
          <Route path="/positions" element={<PositionPage />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
