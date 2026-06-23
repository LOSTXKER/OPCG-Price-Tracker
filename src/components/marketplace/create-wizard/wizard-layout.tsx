"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { t, type TranslationKey } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

const STEPS = [
  { key: "card", labelKey: "mktWizardStepCard" },
  { key: "pricing", labelKey: "mktWizardStepPricing" },
  { key: "shipping", labelKey: "mktWizardStepShipping" },
  { key: "preview", labelKey: "mktWizardStepPreview" },
] as const satisfies ReadonlyArray<{ key: string; labelKey: TranslationKey }>;

export type WizardStep = (typeof STEPS)[number]["key"];

interface WizardLayoutProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
  completedSteps: Set<WizardStep>;
  children: React.ReactNode;
}

export function WizardLayout({
  currentStep,
  onStepClick,
  completedSteps,
  children,
}: WizardLayoutProps) {
  const lang = useUIStore((s) => s.language);
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 sm:gap-2">
        {STEPS.map((step, i) => {
          const isCompleted = completedSteps.has(step.key);
          const isCurrent = step.key === currentStep;
          const canClick = isCompleted || i <= currentIdx;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onStepClick(step.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors sm:gap-2 sm:px-3 sm:py-2",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted && !isCurrent && "text-primary hover:bg-primary/10",
                  !isCurrent && !isCompleted && "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border-2 text-xs font-bold",
                    isCurrent && "border-primary-foreground",
                    isCompleted && !isCurrent && "border-primary bg-primary text-primary-foreground",
                    !isCurrent && !isCompleted && "border-muted-foreground/30"
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="size-3.5" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="hidden sm:inline">{t(lang, step.labelKey)}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1 rounded-full",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* Step content */}
      <div>{children}</div>
    </div>
  );
}

export { STEPS };
