import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FormBuilder from "./FormBuilder";
import PublicForm from "./PublicForm";
import UserFeedback from "./pages/UserFeedback";
import Analytics from "./pages/Analytics";
import EventAdminDashboard from "./pages/EventAdminDashboard";
import EventFeedbackHub from "./pages/EventFeedbackHub";
import EventPublicFeedback from "./pages/EventPublicFeedback";
import EventAnalyticsDashboard from "./pages/EventAnalyticsDashboard";
import CreateFormRedirect from "./pages/CreateFormRedirect";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/public/:id" element={<PublicForm />} />
        <Route path="/form/:id/public" element={<PublicForm />} />
        <Route path="/feedback" element={<UserFeedback />} />
        <Route path="/event/:publicLink" element={<EventPublicFeedback />} />
        <Route
          path="/events/feedback"
          element={(
            <ProtectedRoute>
              <EventFeedbackHub />
            </ProtectedRoute>
          )}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/analytics"
          element={(
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/analytics/:id"
          element={(
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/forms/create"
          element={(
            <ProtectedRoute>
              <CreateFormRedirect />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/events/analytics"
          element={(
            <ProtectedRoute>
              <EventAnalyticsDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/form/:id"
          element={(
            <ProtectedRoute>
              <FormBuilder />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/"
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/events/admin"
          element={(
            <ProtectedRoute>
              <EventAdminDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/legacy/forms"
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </BrowserRouter>
  );
}
