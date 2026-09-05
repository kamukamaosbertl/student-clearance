import Card from "../../components/ui/Card";
import Stepper from "../../components/ui/Stepper";

export default function WizardCard({ stepKey, title, description, children, className = "" }) {
  return (
    <Card className={["w-[660px]", className].join(" ")}>
      <Stepper currentKey={stepKey} />
      <h2 className="text-[17px] font-semibold text-navy">{title}</h2>
      {description && <p className="max-w-[600px] text-[13px] text-body">{description}</p>}
      {children}
    </Card>
  );
}
