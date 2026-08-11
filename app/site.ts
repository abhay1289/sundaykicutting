export const SITE_NAME = "डीलक्स सैलून";
export const SITE_TAGLINE = "हिन्दी · भोजपुरी · हरियाणवी · पंजाबी · తెలుగు";
export const SITE_DESCRIPTION =
  "डीलक्स सैलून रेडियो — हिन्दी, भोजपुरी, हरियाणवी, पंजाबी और तेलुगु गाने एक ही प्लेटफ़ॉर्म पर, लाइव बोलों और सैलून अम्बिएंस के साथ।";

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;

  const preview = process.env.VERCEL_URL;
  if (preview) return `https://${preview}`;

  return "http://localhost:3000";
}
