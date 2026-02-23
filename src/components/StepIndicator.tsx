interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-start justify-center gap-0">
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;

        return (
          <div key={step.label} className="flex items-start">
            {/* Circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[0.75rem] font-semibold transition-colors duration-200 ${
                  isCompleted || isActive
                    ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]'
                    : 'bg-[var(--border-primary)] text-[var(--text-tertiary)]'
                }`}
              >
                {isCompleted ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="2.5 7 5.5 10 11.5 4" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`mt-1.5 text-[0.75rem] ${
                  isActive
                    ? 'font-medium text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)]'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {i < steps.length - 1 && (
              <div
                className={`mt-4 h-0.5 w-16 transition-colors duration-200 ${
                  i < currentStep
                    ? 'bg-[var(--accent-primary)]'
                    : 'bg-[var(--border-primary)]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
