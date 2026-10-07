// Single source of truth for brand identity across the app's UI — the
// display name shown on auth screens/loading screen/PDF reports, and the
// support WhatsApp number behind the floating button and the farmer
// dashboard's "Support" action. Change these two values to rebrand.
//
// i18n strings that mention the brand interpolate it via `t(key, { brandName:
// BRAND_NAME })` rather than hardcoding it into the translated value — see
// i18n/locales/*/translations.json's "{{brandName}}" placeholders.
//
// Deliberately NOT covered here (native/build identifiers, not UI text —
// changing these after release breaks existing installs, deep links, or the
// Play Store listing): app.json's `name`/`slug`/`scheme`/`android.package`,
// and the policy page URLs in constants/policies.ts (those point at an
// already-deployed, separately hosted site whose URL slug won't move just
// because this constant changes).
export const BRAND_NAME = "Sanjeevni Dairy";
export const SUPPORT_WHATSAPP_NUMBER = "918892293899";
