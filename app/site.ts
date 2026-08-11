export const SITE_NAME = "Sunday Ki Cutting — डीलक्स सैलून";
export const SITE_TAGLINE = "Interactive 90s Indian Nostalgia Experience";
export const SITE_DESCRIPTION =
  "Step back into the 90s with Sunday Ki Cutting (डीलक्स सैलून). An interactive Indian retro barbershop experience with live radio stations (Hindi, Bhojpuri, Punjabi, Haryanvi, Telugu), rain & 90s nostalgia soundscapes.";

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;

  const preview = process.env.VERCEL_URL;
  if (preview) return `https://${preview}`;

  return "http://localhost:3000";
}
