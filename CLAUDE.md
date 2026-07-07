# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Sita Dairy" — an Expo (React Native) app for managing a dairy business: milk collection entries, farmer/buyer payments, rate charts, and product sales. Uses Expo Router (file-based routing) with three role-gated app sections.

## Commands

```bash
npm run start        # expo start — Metro bundler, scan QR or press a/i/w
npm run android       # expo start --android
npm run ios           # expo start --ios
npm run web           # expo start --web
npm run lint          # expo lint (eslint-config-expo flat config)
npm run eas-apk        # eas build --platform android --profile preview
npm run eas-aab        # eas build --platform android --profile production
npm run eas-ipa        # eas build --platform ios --profile production
npm run reset-project  # moves starter code to app-example/ and resets app/ (do not run unless asked)
```

There is no test runner configured in this repo. There is no `tsc` script — run `npx tsc --noEmit` directly if you need to type-check.

## Architecture

### Routing: three role-gated route groups

Navigation is Expo Router file-based routing under [app/](app/), with `typedRoutes` enabled. [app/index.tsx](app/index.tsx) reads `useAuth()` and redirects based on `user.role`:

- `Admin` → [app/(admin)/](app/(admin)/) — dairy owner/operator view (dashboard, customers, milk entry, payments, rate chart, rearrange, products, settings)
- `Farmer` → [app/(tabs)/](app/(tabs)/) — farmer view (dashboard, payments, products, records, view rates)
- `Buyer` / `User` → [app/(buyer)/](app/(buyer)/) — buyer view (products, payments, records)
- Unauthenticated → [app/(auth)/](app/(auth)/) (login/signup)

Each role group's `_layout.tsx` is an `expo-router/drawer` Drawer and is itself the access guard: it reads `useAuth()`, and if `user.role` doesn't match the group, it redirects (e.g. `(tabs)/_layout.tsx` redirects Buyers/Admins to their own group) or bounces to `/+not-found`. When adding a screen to a role group, register it both as a file under that group's folder and as an entry in that layout's `screens` array (drawer label/icon). There is no centralized route guard — the redirect logic is duplicated per group, so keep new groups consistent with the existing pattern.

[app/_layout.tsx](app/_layout.tsx) is the root: sets up `SafeAreaProvider`, `GestureHandlerRootView`, `I18nextProvider`, `AuthProvider`, and a root `Stack` listing the four groups plus `+not-found`. It also holds the splash-screen gating (`SplashScreen.preventAutoHideAsync()` + a fixed 2s delay before hiding).

### Auth

[context/AuthContext.tsx](context/AuthContext.tsx) (`useAuth()`) owns `user`, `isLoading`, and `signIn`/`signUp`/`signOut`. The user object and JWT are persisted separately in `AsyncStorage` under the `"user"` and `"token"` keys (token is stored as a JSON-stringified string, so consumers must `JSON.parse` it back out — see the pattern in [hooks/useCustomer.ts](hooks/useCustomer.ts) and [utils/services.ts](utils/services.ts)). There is no token refresh; `signOut` just clears both keys and redirects to `/login`.

`context/AppContext.tsx` is a separate, loosely-typed (`any`) context for ad hoc user data — distinct from `AuthContext` and not consistently used.

### API layer

[constants/api.ts](constants/api.ts) exports a flat `api` object of full endpoint URLs, built from `BASE_URL` (`Constants.expoConfig.extra.apiUrl` in [app.json](app.json)). There is no shared fetch client/axios instance — screens and hooks call `fetch` directly, manually attaching `Authorization: Bearer <token>` read from `AsyncStorage`. [utils/services.ts](utils/services.ts) has a generic `fetchData` helper for GET/mutation calls with loading/refreshing state wiring, but many screens still inline their own `fetch` logic instead of using it — follow whichever pattern the surrounding file already uses rather than mixing both.

Feedback to the user on API calls goes through `react-native-toast-message` (`Toast.show(...)`), not `Alert`, except in a few older code paths in `utils/services.ts`.

### Domain types

[constants/types.ts](constants/types.ts) is the single source of truth for domain shapes (`User`, `Customer`, `Farmer`, `MilkEntry`/`MilkRecord`/`MilkCollection`, `PaymentRequest`, `Transaction`, `AdminDashboardData`, `FarmerDashboardData`, `RateChartRow`, etc.) and shared enums (`ShiftType`, `MilkType`, `PaymentType`, `PaymentMethod`). Check here first before adding ad hoc inline types — most dashboard/record/payment shapes already exist.

### i18n

[i18n/index.ts](i18n/index.ts) configures `i18next` with three locales in [i18n/locales/](i18n/locales/) (`en-US`, `hi-IN`, `bh-IN`), defaulting to device locale via `expo-localization` and persisting the chosen language in `AsyncStorage` (`LANGUAGE_KEY` from `constants/types.ts`). All user-facing strings should go through `useTranslation()`'s `t(...)`, keyed into the existing `translations.json` namespaces (e.g. `navigation.*`, `auth.*`, `common.*`) — add new keys to all three locale files together.

### Components

- [components/common/](components/common/) — cross-role UI (drawer, header variants, modals, avatar, profile, chips, icon registry in `Icon.tsx`).
- [components/admin/](components/admin/) — Admin-only screens' building blocks, further split by feature (`milkEntry/`, `milkRecords/`, `payment/`, `rateChart/`, `users/`, `dashboard/`).
- [components/forms/EntryForm.tsx](components/forms/EntryForm.tsx), [components/customer/Summary.tsx](components/customer/Summary.tsx), [components/auth/AuthTemplate.tsx](components/auth/AuthTemplate.tsx) — shared form/template components used across role groups.

Styling is plain React Native `StyleSheet`, no Nativewind/Tamagui despite the comment in [constants/Colors.ts](constants/Colors.ts) mentioning those as alternatives — this project doesn't use them.

### Utils

- [utils/pdf.ts](utils/pdf.ts) — builds and shares PDF reports (`expo-print` + `expo-sharing`).
- [utils/excelUtils.ts](utils/excelUtils.ts) — Excel export helpers.
- [utils/helper.ts](utils/helper.ts) — misc formatting/calculation helpers.
- [utils/services.ts](utils/services.ts) — generic authenticated-fetch helper (see API layer above).

## Path aliases

`@/*` maps to the repo root (see [tsconfig.json](tsconfig.json)), e.g. `@/context/AuthContext`, `@/constants/types`. Use this alias instead of relative `../../` imports, matching the rest of the codebase.
