import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClearanceFormProvider } from "./context/ClearanceFormContext";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import PersonalInfoStep from "./pages/student/steps/PersonalInfoStep";
import AcademicInfoStep from "./pages/student/steps/AcademicInfoStep";
import ClearanceDetailsStep from "./pages/student/steps/ClearanceDetailsStep";
import DocumentsStep from "./pages/student/steps/DocumentsStep";
import ReviewStep from "./pages/student/steps/ReviewStep";
import ClearanceProgress from "./pages/student/ClearanceProgress";
import CorrectionFeedback from "./pages/student/CorrectionFeedback";

export default function App() {
  return (
    <BrowserRouter>
      <ClearanceFormProvider>
        <Routes>
          {/* "/" now shows the landing page instead of redirecting straight
              to login — visitors get context before being asked to sign in */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          <Route path="/clearance/personal" element={<PersonalInfoStep />} />
          <Route path="/clearance/academic" element={<AcademicInfoStep />} />
          <Route path="/clearance/details" element={<ClearanceDetailsStep />} />
          <Route path="/clearance/documents" element={<DocumentsStep />} />
          <Route path="/clearance/review" element={<ReviewStep />} />

          <Route path="/clearance/progress" element={<ClearanceProgress />} />
          <Route path="/clearance/feedback" element={<CorrectionFeedback />} />

          {/* unknown routes now land on the landing page, not login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ClearanceFormProvider>
    </BrowserRouter>
  );
}