"use client";

import { useUIStore } from "@/stores/ui-store";
import { getLocale } from "@/lib/i18n";

interface FormattedDateProps {
  date: Date | string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
}

export function FormattedDate({ date, options, className }: FormattedDateProps) {
  const lang = useUIStore((s) => s.language);
  const locale = getLocale(lang);
  const d = date instanceof Date ? date : new Date(date);
  const formatted = d.toLocaleDateString(locale, options);
  return <span className={className}>{formatted}</span>;
}
