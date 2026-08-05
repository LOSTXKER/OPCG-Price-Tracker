import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { DirectCampaign } from "./direct-campaigns"
import { DirectSponsorCreative } from "./direct-sponsor-creative"
import { GoogleAdMockup } from "./google-ad-mockup"
import { AD_INVENTORY } from "./inventory"

const CAMPAIGN = {
  advertiser: "Test Card Shop",
  headline: {
    TH: "แคมเปญทดสอบ",
    EN: "Test campaign",
    JP: "テストキャンペーン",
  },
  body: {
    TH: "รายละเอียดทดสอบ",
    EN: "Test details",
    JP: "テスト詳細",
  },
  cta: {
    TH: "ดูรายละเอียด",
    EN: "Learn more",
    JP: "詳細を見る",
  },
  href: "https://example.com/campaign",
} satisfies DirectCampaign

describe("Google mock creative", () => {
  it("renders an empty labelled slot without any sample ad creative", () => {
    const markup = renderToStaticMarkup(
      <GoogleAdMockup
        definition={AD_INVENTORY["global-bottom-anchor"]}
        lang="TH"
      />,
    )

    expect(markup).toContain('data-ad-kind="GOOGLE_MOCK"')
    expect(markup).toContain('data-ad-zone="global-bottom-anchor"')
    expect(markup).toContain("Google Ads · Mockup")
    expect(markup).toContain("จำลองหน้าตาเท่านั้น")
    expect(markup).not.toContain("อุปกรณ์การ์ดพรีเมียม ลด 20%")
    expect(markup).not.toContain("Card Harbor")
    expect(markup).not.toContain("google-mock-card-accessories-v1.jpg")
    expect(markup).not.toMatch(/<img\b/i)
    expect(markup).not.toMatch(/<a\b/i)
    expect(markup).not.toMatch(/<script\b/i)
    expect(markup).not.toMatch(/<iframe\b/i)
    expect(markup).not.toContain("adsbygoogle")
    expect(markup).not.toContain("googlesyndication")
  })
})

describe("Direct Sponsor creative", () => {
  const definition = AD_INVENTORY["global-bottom-anchor"]

  it("labels and discloses a real external campaign", () => {
    const markup = renderToStaticMarkup(
      <DirectSponsorCreative
        definition={definition}
        campaign={CAMPAIGN}
        lang="EN"
      />,
    )

    expect(markup).toContain('data-ad-kind="DIRECT"')
    expect(markup).toContain('data-direct-status="ACTIVE"')
    expect(markup).toContain("Sponsored · Test Card Shop")
    expect(markup).toContain('target="_blank"')
    expect(markup).toContain('rel="sponsored noopener noreferrer"')
    expect(markup).not.toContain("Google Ads")
    expect(markup).not.toContain("พื้นที่ Direct Sponsor")
    expect(markup).not.toContain('href="/contact"')
  })

  it("uses the exact same placement frame as the Google fallback", () => {
    const googleMarkup = renderToStaticMarkup(
      <GoogleAdMockup definition={definition} lang="TH" />,
    )
    const directMarkup = renderToStaticMarkup(
      <DirectSponsorCreative
        definition={definition}
        campaign={CAMPAIGN}
        lang="TH"
      />,
    )

    for (const marker of [
      'data-ad-size="320 × 64|728 × 90"',
      "h-16",
      "sm:h-[90px]",
      "max-w-[320px]",
      "sm:max-w-[728px]",
    ]) {
      expect(googleMarkup).toContain(marker)
      expect(directMarkup).toContain(marker)
    }
  })

  it("keeps the chart-rail Direct replacement in the Google rectangle frame", () => {
    const rectangleDefinition = AD_INVENTORY["card-detail-chart-rail"]
    const googleMarkup = renderToStaticMarkup(
      <GoogleAdMockup definition={rectangleDefinition} lang="TH" />,
    )
    const directMarkup = renderToStaticMarkup(
      <DirectSponsorCreative
        definition={rectangleDefinition}
        campaign={CAMPAIGN}
        lang="TH"
      />,
    )

    for (const marker of [
      'data-ad-size="300 × 250|336 × 280"',
      "h-[250px]",
      "sm:h-[280px]",
      "max-w-[300px]",
      "sm:max-w-[336px]",
    ]) {
      expect(googleMarkup).toContain(marker)
      expect(directMarkup).toContain(marker)
    }
  })
})
