```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClearanceFormProvider } from "./context/ClearanceFormContext";

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
import ProcessingHistory from "./pages/officer/processingHistory";
import RequestReviewIndex from "./pages/officer/RequestReviewIndex";

export default function App() {
  return (
    <BrowserRouter>
      <ClearanceFormProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Officer / Admin portals — reached via the role menu on the
              landing page's "Log in" button */}
          <Route path="/officer/login" element={<OfficerLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Student dashboard after login */}
          <Route path="/dashboard" element={<StudentDashboard />} />

          <Route path="/clearance/personal" element={<PersonalInfoStep />} />
          <Route path="/clearance/office/:officeKey" element={<OfficeDocumentsStep />} />
          <Route path="/clearance/review" element={<ReviewStep />} />
          <Route path="/officer/dashboard" element={<OfficerDashboard />} />
          <Route path="/clearance/progress" element={<ClearanceProgress />} />
          <Route path="/clearance/feedback" element={<CorrectionFeedback />} />
          <Route path="/officer/queue" element={<PendingRequests />} />
          <Route path="/officer/request/:id" element={<RequestReview />} />
          <Route path="/officer/request" element={<RequestReviewIndex />} />
          <Route path="/officer/history" element={<ProcessingHistory />} />

          {/* unknown routes now land on the landing page, not login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ClearanceFormProvider>
    </BrowserRouter>
  );
}
```
