import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClearanceFormProvider } from "./context/ClearanceFormContext";
import { AuthProvider } from "./context/AuthContext";
import RequireAuth from "./components/Requireauth";

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
import RequestReview from "./pages/officer/Requestreview";
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

            {/* Student — protected */}
            <Route
              path="/dashboard"
              element={
                <RequireAuth role="student">
                  <StudentDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/clearance/personal"
              element={
                <RequireAuth role="student">
                  <PersonalInfoStep />
                </RequireAuth>
              }
            />
            <Route
              path="/clearance/office/:officeKey"
              element={
                <RequireAuth role="student">
                  <OfficeDocumentsStep />
                </RequireAuth>
              }
            />
            <Route
              path="/clearance/review"
              element={
                <RequireAuth role="student">
                  <ReviewStep />
                </RequireAuth>
              }
            />
            <Route
              path="/clearance/progress"
              element={
                <RequireAuth role="student">
                  <ClearanceProgress />
                </RequireAuth>
              }
            />
            <Route
              path="/clearance/feedback"
              element={
                <RequireAuth role="student">
                  <CorrectionFeedback />
                </RequireAuth>
              }
            />

            {/* Officer — protected */}
            <Route
              path="/officer/dashboard"
              element={
                <RequireAuth role="officer">
                  <OfficerDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/officer/queue"
              element={
                <RequireAuth role="officer">
                  <PendingRequests />
                </RequireAuth>
              }
            />
            <Route
              path="/officer/request/:id"
              element={
                <RequireAuth role="officer">
                  <RequestReview />
                </RequireAuth>
              }
            />
            <Route
              path="/officer/request"
              element={
                <RequireAuth role="officer">
                  <RequestReviewIndex />
                </RequireAuth>
              }
            />
            <Route
              path="/officer/history"
              element={
                <RequireAuth role="officer">
                  <ProcessingHistory />
                </RequireAuth>
              }
            />

            {/* unknown routes now land on the landing page, not login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ClearanceFormProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}