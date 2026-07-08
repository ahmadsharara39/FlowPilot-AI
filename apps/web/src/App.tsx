import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import WorkflowsPage from "./pages/WorkflowsPage";
import WorkflowNewPage from "./pages/WorkflowNewPage";
import WorkflowDetailPage from "./pages/WorkflowDetailPage";
import ExecutionsPage from "./pages/ExecutionsPage";
import ExecutionDetailPage from "./pages/ExecutionDetailPage";
import ConnectorsPage from "./pages/ConnectorsPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/workflows/new" element={<WorkflowNewPage />} />
          <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
          <Route path="/executions" element={<ExecutionsPage />} />
          <Route path="/executions/:id" element={<ExecutionDetailPage />} />
          <Route path="/connectors" element={<ConnectorsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
