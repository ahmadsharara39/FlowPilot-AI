import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingScreen } from "./components/Spinner";
import DashboardLayout from "./layouts/DashboardLayout";

// Lazy-load pages so each route ships its own chunk (keeps the initial bundle
// small — the dashboard's charting lib only loads when that route is visited).
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const WorkflowsPage = lazy(() => import("./pages/WorkflowsPage"));
const WorkflowNewPage = lazy(() => import("./pages/WorkflowNewPage"));
const WorkflowDetailPage = lazy(() => import("./pages/WorkflowDetailPage"));
const ExecutionsPage = lazy(() => import("./pages/ExecutionsPage"));
const ExecutionDetailPage = lazy(() => import("./pages/ExecutionDetailPage"));
const ConnectorsPage = lazy(() => import("./pages/ConnectorsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
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
    </Suspense>
  );
}
