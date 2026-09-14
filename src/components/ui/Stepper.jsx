import { wizardSteps } from "../../data/navigation";

// `currentKey` = key of the step being shown.
// Completed steps show a checkmark, the current step is highlighted,
// and upcoming steps remain muted.
export default function Stepper({ currentKey }) {
  const currentIndex = wizardSteps.findIndex(
    (s) => s.key === currentKey
  );

  return (
    <div className="relative w-full">
      {/* Connecting line */}
      <div
        className="absolute left-[8%] right-[8%] top-3 h-[1.5px] bg-border"
        aria-hidden="true"
      />

      {/* Steps */}
      <div className="relative z-10 grid w-full grid-cols-6">
        {wizardSteps.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={step.key}
              className="flex min-w-0 justify-center"
            >
              <div className="flex items-center gap-2 bg-white px-1">
                {/* Number / check circle */}
                <div
                  className={[
                    "flex size-6 shrink-0 items-center justify-center rounded-full",
                    "border-[1.5px] text-[11px] font-semibold",
                    "transition-colors duration-200",

                    isDone && "border-teal bg-teal text-white",
                    isCurrent && "border-teal text-teal",
                    !isDone &&
                      !isCurrent &&
                      "border-border text-body",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {isDone ? "✓" : index + 1}
                </div>

                {/* Label */}
                <span
                  className={[
                    "whitespace-nowrap text-[12px]",
                    isCurrent
                      ? "font-medium text-navy"
                      : "text-body",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}