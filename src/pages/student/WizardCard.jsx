import { Navigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Stepper from "../../components/ui/Stepper";
import { useClearanceForm } from "../../context/ClearanceFormContext";

export default function WizardCard({ stepKey, title, description, children, className = "" }) {
  const { application, hasLoaded } = useClearanceForm();

  // A student has one clearance request at a time — once it exists the
  // wizard is closed and they follow it on the progress screen instead
  if (hasLoaded && application) {
    return <Navigate to="/clearance/progress" replace />;
  }

  return (
    <Card className={["w-[660px]", className].join(" ")}>
      <Stepper currentKey={stepKey} />
      <h2 className="text-[17px] font-semibold text-navy">{title}</h2>
      {description && <p className="max-w-[600px] text-[13px] text-body">{description}</p>}
      {children}
    </Card>
  );
}
