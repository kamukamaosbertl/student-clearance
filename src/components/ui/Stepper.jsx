import { wizardSteps } from "../../data/navigation";

// `currentKey` = key of the step being shown. Steps before it render a
// teal checkmark, the current step renders its teal-outlined number, and
// steps after it render a muted numbered circle - mirrors the
// not-started / done state pattern from the Figma frames.
export default function Stepper({ currentKey }) {
  const currentIndex = wizardSteps.findIndex((s) => s.key === currentKey);

  return (
    <div className="flex items-center">
      {wizardSteps.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={[
                  "flex size-6 items-center justify-center rounded-full border-[1.5px] text-[11px] font-semibold",
                  "transition-colors duration-200", // eases into the "done" checkmark state instead of snapping
                  isDone && "border-teal bg-teal text-white",
                  isCurrent && "border-teal text-teal",
                  !isDone && !isCurrent && "border-border text-body",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {isDone ? "✓" : index + 1}
              </div>
              <span
                className={[
                  "text-[12px]",
                  isCurrent ? "font-medium text-navy" : "text-body",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
            {index < wizardSteps.length - 1 && <div className="mx-2 h-[1.5px] w-[50px] bg-border" />}
          </div>
        );
      })}
    </div>
  );
}