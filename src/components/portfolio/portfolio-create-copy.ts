import type { PortfolioCreateCopy } from "./portfolio-create-dialog"
import { t, type Language } from "@/lib/i18n"

/** Localized copy shared by every portfolio creation entry point. */
export function getPortfolioCreateCopy(
  lang: Language,
  submitLabel = t(lang, "createPortfolio"),
): PortfolioCreateCopy {
  return {
    nameLabel: t(lang, "portfolioNameLabel"),
    namePlaceholder: t(lang, "portfolioName"),
    visibilityLabel: t(lang, "choosePortfolioPrivacy"),
    publicLabel: t(lang, "portfolioPublic"),
    publicDescription: t(lang, "portfolioPublicDesc"),
    privateLabel: t(lang, "portfolioPrivate"),
    privateDescription: t(lang, "portfolioPrivateDesc"),
    submitLabel,
    submittingLabel: t(lang, "loading"),
    cancelLabel: t(lang, "cancel"),
    genericError: t(lang, "createPortfolioFailed"),
    nameRequiredError: t(lang, "portfolioNameRequired"),
    visibilityRequiredError: t(lang, "privacyRequired"),
  }
}
