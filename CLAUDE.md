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

[app/customer/[id].tsx](app/customer/[id].tsx) is a standalone route outside any group — the Admin drill-down reached from the eye icon on `customers.tsx`.

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

### Payment `code` semantics

Payments use a `code` field with two values: `"Paid"` (money the dairy pays to farmers) and `"Recieve"` (money the dairy receives from buyers — this is the actual backend spelling, not a typo to casually "fix"). Farmer wallet screens always query `code: "Paid"`; Buyer wallet screens always query `code: "Recieve"`; Admin's Payments screen toggles between both.

### Wallet top-up (UPI)

[components/buyer/AddAmountModal.tsx](components/buyer/AddAmountModal.tsx) has two top-up paths, chosen by `Platform.OS`: Android calls the backend's `initiate-sdk` endpoint and drives `react-native-phonepe-pg` (`PhonePePaymentSDK.init` + `.startTransaction`) so the OS-level UPI app chooser opens natively; everywhere else (iOS) calls `initiate` and opens PhonePe's hosted checkout page via `expo-web-browser`. Both paths converge on the same `/wallet/upi-topup/:merchantOrderId/reverify` call afterward — neither the browser-close signal nor the native SDK's transaction result is ever treated as proof of payment, only `/reverify` (or the webhook, backend-side) is authoritative. `react-native-phonepe-pg` is a native module with no Expo config plugin of its own, so [plugins/withPhonePeAndroidMaven.js](plugins/withPhonePeAndroidMaven.js) patches the Android Maven repo into `android/build.gradle` at prebuild time, and the app needs `expo-dev-client` (an EAS dev-client build) to test it — it does not run in Expo Go. See `doc/payment-plan.md` Phase 5 in the backend repo for the server side and the design rationale (Android-only, why the SDK order flow rather than a hand-rolled `upi://` link).

### Brand identity (name + support WhatsApp number)

[constants/brand.ts](constants/brand.ts) is the single source of truth for the display brand name (`BRAND_NAME`) and support WhatsApp number (`SUPPORT_WHATSAPP_NUMBER`) — never hardcode "Sita Dairy" or the phone number inline. Translation strings that mention the brand hold a `{{brandName}}` placeholder (e.g. `auth.sita_dairy`, `common.whatsapp_help_message`) rather than the literal name, so every `t(...)` call site for one of those keys must pass `{ brandName: BRAND_NAME }` — grep the locale JSON files for `{{brandName}}` to find them all if you add a new one. `utils/pdf.ts`'s report footer and `components/Loading.tsx`'s splash text aren't i18n-driven at all and just reference `BRAND_NAME` directly.

Deliberately **not** wired to this constant (native/build identifiers, not UI text — changing them post-release breaks installs, deep links, or store listings): `app.json`'s `name`/`slug`/`scheme`/`android.package`, and the policy page URLs in `constants/policies.ts` (those point at an already-deployed, separately hosted site whose URL won't move just because the constant changes).

### Admin editing another customer

[app/customer/[id].tsx](app/customer/[id].tsx) (the admin's customer drill-down screen) has two header actions — an edit-pencil and a key icon — opening [components/admin/users/EditCustomerModal.tsx](components/admin/users/EditCustomerModal.tsx) and [components/admin/users/ResetPasswordModal.tsx](components/admin/users/ResetPasswordModal.tsx) respectively. `EditCustomerModal` deliberately only exposes a narrow field set (name, mobile, father's name, address, dairy name, collection center) — not wallet balance, role, or status, which already have their own dedicated UI (role checkboxes in `customers.tsx`, the active/negative-balance toggles and "Set Location" button already in `[id].tsx`, and `BuyerRateConfigModal` for morning/evening milk quantity and rate). Both new modals hit `PUT /user/update` and `PUT /user/admin-reset-password` respectively with `userId` set to the target customer, not the caller — see `sita-dairy-backend`'s CLAUDE.md ("Profile updates: self-editable vs. admin-only fields") for the authorization split this relies on and the security fix that went with it. If you add another admin-editable field, add it to the backend's `ADMIN_ONLY_FIELDS` list too, or the update will silently no-op.

### Customer/user lists: dropdown vs. paginated directory

[hooks/useCustomer.ts](hooks/useCustomer.ts) (`useCustomers()`) is the single hook for fetching farmers/buyers/users, and it deliberately sources from two different backend endpoints depending on what the caller is:

- `activeOnly: true` → `POST /general/dropdown` — the **full, unpaginated list of active users** of a role. Use this for any picker/filter UI where the user selects one entry from an in-memory list: [components/common/UserModal.tsx](components/common/UserModal.tsx) (the shared farmer/buyer picker used by `MilkBuy.tsx`/`MilkSale.tsx`), and the inline "filter records/payments/orders by user" modals in `milkBuyRecords.tsx`/`milkSaleRecords.tsx`/`payments.tsx`/`transactions.tsx`/`orderHistory.tsx`. `UserModal`'s search box filters this in-memory list client-side — there's nothing to paginate, so don't add a `search` param to the dropdown call.
- `activeOnly` omitted/false → `GET /user/all-customers` — the customer **directory**, which includes inactive users too. This is the only mode that supports `search` and `pageSize` (opt-in — pass `pageSize` to get `hasMore`/`loadingMore`/`loadMore()`/`totalCount` back for infinite-scroll UI). [app/(admin)/customers.tsx](app/(admin)/customers.tsx) is the only screen using `pageSize` today (debounced server-side search + `onEndReached`). [app/(admin)/rearrange.tsx](app/(admin)/rearrange.tsx) intentionally stays on the plain (no-`pageSize`) directory fetch — drag-to-reorder needs the *complete* role roster in one shot, not a partial page, and it also needs inactive users included (unlike the dropdown).

When adding a new "select a user" UI, use `activeOnly: true`, not the directory fetch — that's the mistake this hook's two-mode split exists to prevent.

### Milk records pagination and export

[components/admin/milkRecords/milkBuyRecords.tsx](components/admin/milkRecords/milkBuyRecords.tsx) and [milkSaleRecords.tsx](components/admin/milkRecords/milkSaleRecords.tsx) paginate their on-screen list (20/page, infinite scroll via `onEndReached`) against the backend's opt-in `page`/`limit` params on `/milk/get`/`/milk/sell`. The free-text search box in these screens (`searchQuery`) only searches whatever pages are currently loaded, not the full filtered date range — scrolling further extends what it can find. This is a deliberate tradeoff (the alternative is real server-side full-text search across formatted dates and numeric fields, a separate feature).

The PDF export button (in `RecordsHeader`, [components/common/HeaderVarients.tsx](components/common/HeaderVarients.tsx)) needs the **complete** filtered result, not just loaded pages — exporting a partially-scrolled list would silently produce an incomplete report. Each records screen exposes a `registerExportHandler` prop that hands the parent ([app/(admin)/record.tsx](app/(admin)/record.tsx)) a `fetchAllForExport()` function (same filters, no `page`/`limit`, so the backend returns everything in one shot); `record.tsx` stores it in a ref and `RecordsHeader` calls it on export tap. If you add a third records-like screen with export, follow this same handler-registration pattern rather than lifting the paginated `allEntries` state itself.

The farmer's own records ([app/(tabs)/records.tsx](app/(tabs)/records.tsx)) and buyer's own records ([app/(buyer)/records.tsx](app/(buyer)/records.tsx)) use the same paginated-list pattern but have no export button, so there's no fetch-all counterpart there — their `RenderSummary` totals are page-scoped (sum of loaded rows only), same convention as the wallet statement screens' totals.

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

## Screen-level reference

[doc/existing.md](doc/existing.md) inventories every currently implemented screen by role, including which API endpoints and shared components each one uses, plus known dead/placeholder code (e.g. the Admin dashboard's commented-out inventory section, `app/customer/[id].tsx`'s hardcoded "Quick Stats"/"Recent Activity"). Check it before touching a screen you haven't worked in before — it reflects current behavior, not a spec.
