import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClearanceFormProvider } from "./context/ClearanceFormContext";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import StudentDashboard from "./pages/student/StudentDashboard";
import PersonalInfoStep from "./pages/student/steps/PersonalInfoStep";
import OfficeDocumentsStep from "./pages/student/steps/OfficeDocumentsStep";
import ReviewStep from "./pages/student/steps/ReviewStep";
import ClearanceProgress from "./pages/student/ClearanceProgress";
import CorrectionFeedback from "./pages/student/CorrectionFeedback";

export default function App() {
  return (
    <BrowserRouter>
      <ClearanceFormProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* NEW: the real home screen after login */}
          <Route path="/dashboard" element={<StudentDashboard />} />

          <Route path="/clearance/personal" element={<PersonalInfoStep />} />
          <Route path="/clearance/office/:officeKey" element={<OfficeDocumentsStep />} />
          <Route path="/clearance/review" element={<ReviewStep />} />

          <Route path="/clearance/progress" element={<ClearanceProgress />} />
          <Route path="/clearance/feedback" element={<CorrectionFeedback />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ClearanceFormProvider>
    </BrowserRouter>
  );
}