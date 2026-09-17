import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClearanceFormProvider } from "./context/ClearanceFormContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import OfficerLogin from "./pages/auth/OfficerLogin";
import AdminLogin from "./pages/auth/AdminLogin";
import StudentDashboard from "./pages/student/StudentDashboard";
import PersonalInfoStep from "./pages/student/steps/PersonalInfoStep";
import OfficeDocumentsStep from "./pages/student/steps/OfficeDocumentsStep";
import ReviewStep from "./pages/student/steps/ReviewStep";
import ClearanceProgress from "./pages/student/ClearanceProgress";
import CorrectionFeedback from "./pages/student/CorrectionFeedback";
import OfficerDashboard from "./pages/officer/Dashboard";
import PendingRequests from "./pages/officer/PendingRequests";
import RequestReview from "./pages/officer/RequestReview";
import ProcessingHistory from "./pages/officer/ProcessingHistory";
import RequestReviewIndex from "./pages/officer/RequestReviewIndex";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClearanceFormProvider>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Officer / Admin portals — reached via the role menu on the
              landing page's "Log in" button */}
          <Route path="/officer/login" element={<OfficerLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* NEW: the real home screen after login */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />

          <Route path="/clearance/personal" element={<ProtectedRoute allowedRoles={["student"]}><PersonalInfoStep /></ProtectedRoute>} />
          <Route path="/clearance/office/:officeKey" element={<ProtectedRoute allowedRoles={["student"]}><OfficeDocumentsStep /></ProtectedRoute>} />
          <Route path="/clearance/review" element={<ProtectedRoute allowedRoles={["student"]}><ReviewStep /></ProtectedRoute>} />
          <Route path="/clearance/progress" element={<ProtectedRoute allowedRoles={["student"]}><ClearanceProgress /></ProtectedRoute>} />
          <Route path="/clearance/feedback" element={<ProtectedRoute allowedRoles={["student"]}><CorrectionFeedback /></ProtectedRoute>} />
          <Route path="/officer/dashboard" element={<ProtectedRoute allowedRoles={["officer"]}><OfficerDashboard /></ProtectedRoute>} />
          <Route path="/officer/queue" element={<ProtectedRoute allowedRoles={["officer"]}><PendingRequests /></ProtectedRoute>} />
          <Route path="/officer/request/:id" element={<ProtectedRoute allowedRoles={["officer"]}><RequestReview /></ProtectedRoute>} />
          <Route path="/officer/request" element={<ProtectedRoute allowedRoles={["officer"]}><RequestReviewIndex /></ProtectedRoute>} />
          <Route path="/officer/history" element={<ProtectedRoute allowedRoles={["officer"]}><ProcessingHistory /></ProtectedRoute>} />

          {/* unknown routes now land on the landing page, not login */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ClearanceFormProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}