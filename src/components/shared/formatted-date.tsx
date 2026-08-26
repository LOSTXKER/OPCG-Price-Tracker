"use client";

import { useUIStore } from "@/stores/ui-store";
import { getLocale, type Language } from "@/lib/i18n";

interface FormattedDateProps {
  date: Date | string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
  language?: Language;
}

export function FormattedDate({
  date,
  options,
  className,
  language,
}: FormattedDateProps) {
  const storedLanguage = useUIStore((s) => s.language);
  const lang = language ?? storedLanguage;
  const locale = getLocale(lang);
  const d = date instanceof Date ? date : new Date(date);
  const formatted = d.toLocaleDateString(locale, options);
  return <span className={className}>{formatted}</span>;
}
