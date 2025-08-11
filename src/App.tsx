// App.tsx
import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/Dashboard";
import FacultyPage from "./pages/FacultyPage";
import UserManagementPage from "./pages/UserManagementPage";
import SettingsPage from "./pages/SettingsPage";
import DepartmentPage from "./pages/DepartmentPage";
import PositionPage from "./pages/PositionPage";
import ContractPage from "./pages/ContractPage";
import ProtectedRoute from "./context/ProtectedRoute.tsx";
import { ROLES } from "./types/auth";

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
          {/* Public routes accessible to all authenticated users */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route 
            path="/faculty" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.Admin, ROLES.Teaching, ROLES.NonTeaching]}>
                <FacultyPage />
              </ProtectedRoute>
            } 
          />

          {/* Admin-only routes */}
          <Route 
            path="/departments" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.Admin]}>
                <DepartmentPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/positions" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.Admin]}>
                <PositionPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.Admin]}>
                <UserManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/contracts" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.Admin]}>
                <ContractPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.Admin]}>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;