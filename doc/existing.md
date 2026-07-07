# Existing Modules & Screens

This document inventories every screen currently implemented in the app, organized by role. It describes what each screen does, which API endpoints it calls, and which shared components it depends on. It reflects the code as it stands today — not a design spec.

Roles: **Admin** (`app/(admin)/`), **Farmer** (`app/(tabs)/`), **Buyer** (`app/(buyer)/`), plus the shared **Auth** flow (`app/(auth)/`) and a few standalone screens.

API endpoints referenced below are defined in [constants/api.ts](../constants/api.ts):
`login`, `signup` (`/user/create`), `dashboard`, `changePosition`, `milkEntry` (`/milk/create`), `updateMilkEntry`, `milkSales` (`/milk/sell`), `getUser` (`/user/getSingleCustomerDetail`), `updateUser`, `getRecords` (`/milk/get`), `getAllCustomers` (`/user/all-customers`), `deleteRecord`, `deleteAccount`, `changeRole`, `getProducts` / `createProduct` / `updateProduct` / `deleteProduct`, `createPayment` (`/payment/add-payment`), `getPaymentsReport`, `resetPayments`, `rateChart`.

---

## Admin — `app/(admin)/`

Drawer-based section, guarded in [`_layout.tsx`](<../app/(admin)/_layout.tsx>) — only `user.role === "Admin"` can enter; anyone else is redirected.

### Dashboard — `index.tsx`

Landing screen for the dairy owner/operator.

- Fetches `GET dashboard` on focus, pull-to-refresh.
- Three stat cards (`BorderedDashboardCard`): total users, today's collection (L), monthly collection (L) — link to `/customers` and `/record`.
- Quick Actions grid: All Users, Milk Entry, Payments, Reports → `/customers`, `/milkEntry`, `/payments`, `/record`.
- "Recent Entries" list (`TransactionItem`, `components/admin/dashboard/EntryCard.tsx`) showing `dashboardData.lastFiveEntries`.
- Header includes a language-switcher modal (`LanguageChange`).
- An "Inventory Summary" section exists in code but is currently commented out.

### Customers / User Management — `customers.tsx`

Directory of all users with role management.

- Uses the `useCustomers` hook (role filter: All / User / Farmer / Buyer) against `getAllCustomers`.
- Client-side search (name, mobile, dairy name, id) and role-filter chips via `UsersHeader`.
- Each customer row shows avatar, verified badge, id, mobile, dairy name, and three `RoleCheckBox` toggles (User/Farmer/Buyer). Changes are staged locally (`modifiedCustomers`) and bulk-saved with `POST changeRole` (`{ users: JSON.stringify(updates) }`). A sticky "N modified" bar exposes Cancel (with confirm) / Save.
- Row actions: edit icon opens `BuyerRateConfigModal` (sets a buyer's morning/evening milk qty + rate via `PUT updateUser`); eye icon opens `/customer/[id]`.
- Header exposes `CreateUserModal` to create a new user (`POST signup` with name/mobile/role, no password).

### Milk Entry — `milkEntry.tsx`

Toggle screen (`MilkEntryHeader`) with no API calls of its own; switches between:

- **`MilkBuy.tsx` (`MilkBuyEntry`)** — records milk bought from farmers. Loads the rate chart (`GET rateChart`) and auto-computes `rate` from fat/SNF (tolerant fat match ±0.05, SNF bucketed into 8.0–8.5 ranges). Farmer picker excludes farmers who already have an entry for the selected date/shift. Submits `POST milkEntry` (create) or `PUT milkEntry/:id` (edit). Renders `EntryForm` + `ListShow` (today's entries) + `UserModal`.
- **`MilkSale.tsx` (`MilkSaleEntry`)** — records milk sold to buyers; rate is entered manually (no chart lookup). Buyer picker is filtered to buyers with `morningMilk`/`eveningMilk` configured for the current shift and excludes buyers already entered today. Submits `POST`/`PUT milkSales`. Milk-type toggle (Cow/Buffalo) auto-swaps weight between morning/evening quantities when the shift is toggled.

### Payments — `payments.tsx`

Admin's payment ledger, with **Paid** (to farmers) / **Received** (from buyers) tabs.

- `POST getPaymentsReport` with `{code, date, userId}` filters, refetched on tab/date/user change and screen focus (filters reset to today on focus).
- Filter chips: pick a specific user (`UserModal`, sourced from `useCustomers`) and a date (`DateTimePicker`).
- List items show counterparty avatar, name, id, date, amount, status/type/method/transactionId.
- "+" button opens `PaymentForm` (`components/admin/payment/paymentForm.tsx`) which posts `POST createPayment` with `{userId, date, code, amount}` — `code` is derived from role (`Farmer` → `"Paid"`, else → `"Recieve"`).

### Products — `products.tsx`

CRUD catalog of dairy products sold to buyers.

- `GET getProducts` on mount/refresh; client-side search by title.
- Slide-in animated drawer to add/edit a product: title, price, description, `isFeatured` checkbox, thumbnail (via `expo-image-picker`); submits multipart form data to `POST createProduct` or `PUT updateProduct/:id`.
- Delete via confirm modal → `DELETE deleteProduct/:id`.

### Profile — `profile.tsx`

`GET getUser` on load, result fed into `AuthContext.updateUser`; renders shared `ProfileHeader` + profile component with an edit toggle.

### Rate Chart — `rateChartScreen.tsx`

Editable Fat% (rows) × SNF 8.0–8.5 (columns) rate matrix.

- `GET rateChart` on focus.
- Rendered via `EditableRateChart` (scrollable grid); tapping a cell or column header opens `RateModal` to edit the value/column label, marking rows/cells as edited locally.
- "Save" sends only edited rows via `PUT rateChart`.
- Add/remove row and add/remove column logic exists in code (currently commented out in the UI), with guardrails preventing removal of the first/last column or the last remaining row.

### Rearrange Users — `rearrange.tsx`

Drag-and-drop reordering of customers within a role (defaults to Farmer, filterable) using `DraggableFlatList`, sorted by `positionNo`.

- Edit-mode toggle enables long-press dragging.
- "Save Order" → `POST changePosition` with `{users: [{userId, positionNo}]}`.
- "Reset Order" reverts to the last-fetched order (with confirmation).

### Records / Reports — `record.tsx`

Toggle screen (`RecordsHeader`) with no direct API calls; switches between:

- **`milkBuyRecords.tsx` (`MilkBuyRecords`)** — buy-side records with search, farmer/date/date-range/shift filters, `RenderSummary` stats, two-column `DataCard` grid. Inline edit (via `EntryForm` in a `ModalWrapper` → `PUT updateMilkEntry/:id`) and delete (→ `DELETE deleteRecord/:id`).
- **`milkSaleRecords.tsx` (`MilkSaleRecords`)** — sell-side records (`GET milkSales` with filters), buyer picker instead of farmer, delete only (no inline edit form).

### Settings — `settings.tsx`

Shared `SettingsComponent` wired to `handleSignOut` (`AuthContext.signOut`, redirect to login) and `handleDeleteAccount` (`DELETE deleteAccount`, clears storage, signs out, redirects). Includes local (non-persisted) notification/email-update toggles.

---

## Farmer — `app/(tabs)/`

Drawer-based section for the `Farmer` role; other roles are redirected out in [`_layout.tsx`](<../app/(tabs)/_layout.tsx>) (Buyer/User → `(buyer)`, Admin → `(admin)`).

### Dashboard — `index.tsx`

- `GET dashboard`, pull-to-refresh.
- `Summary` component (`components/customer/Summary.tsx`): Today's Collection (L), Today's Earning (₹), Monthly Collection (L), Monthly Earning (₹).
- Gradient "Milk Quality Metrics" card (today's Fat% / SNF%).
- "Recent Entry" list of `lastFiveEntries` (date, weight, fat, snf, rate, price, shift badge).
- Quick Actions grid → `/products`, `/viewRates`, `/payment`, `/records`.
- Floating support button opens a pre-filled WhatsApp (`wa.me`) message.

### Payments / Wallet — `payment.tsx`

- `POST getPaymentsReport` with `{code: "Paid", date}` — money paid **to** the farmer.
- Gradient balance card ("Total Money Earned"), date filter (`DateTimePicker`), scrollable transaction list (green "Received" icon, `+amount`).
- Custom animated `CustomAlert` for error states. Refetches on focus/date change; pull-to-refresh.

### Products — `products.tsx`

Read-only catalog (same shape as Buyer's): `GET getProducts`, favorites persisted locally to AsyncStorage (`favorites` key, heart toggle), "Buy on WhatsApp" deep link pre-filled with product title/price.

### Profile — `profile.tsx`

Same pattern as Admin profile: `GET getUser` → `AuthContext.updateUser` → shared profile UI.

### Milk Records — `records.tsx`

Farmer's own collection history.

- Defaults to the last 7 days (excluding today); `GET getRecords?startDate&endDate&shift`.
- Client-side search (name, date, shift, weight, snf, rate, price, fat).
- Date-range picker (`react-native-calendars` `Calendar` modal, custom range highlighting) plus `ShiftModal` (Morning/Evening/All).
- `RenderSummary` bar (entries / amount / weight) and a two-column `DataCard` grid — read-only here since edit/delete on `DataCard` only render for `role === "Admin"`.

### Settings — `settings.tsx`

Same sign-out / delete-account pattern as Admin Settings.

### View Rates — `viewRates.tsx`

Read-only Fat/SNF rate table (`GET rateChart` on mount) — same row/column layout as the admin rate chart but rendered with plain, non-editable cells.

---

## Buyer — `app/(buyer)/`

Drawer-based section for `Buyer`/`User` roles ([`_layout.tsx`](<../app/(buyer)/_layout.tsx>)).

### Product Catalog — `index.tsx`

Same as Farmer's Products screen: `GET getProducts`, local favorites, "Buy on WhatsApp" deep link, pull-to-refresh, retry state on empty/error.

### Settings — `Settings.tsx`

Same sign-out / delete-account pattern as the other Settings screens.

### Payments / Wallet — `payment.tsx`

Mirror of the Farmer wallet screen, but `POST getPaymentsReport` with `{code: "Recieve", date}` — money the buyer paid to the dairy. Transaction list shows a red "trending-down" icon labeled "Paid" with `-amount`.

### Profile — `profile.tsx`

Same profile pattern (`GET getUser` → `AuthContext.updateUser`).

### Milk Subscription Records — `records.tsx`

Buyer's view of milk sold to them. `GET getRecords?...&userId=<self>&entryType=Sell` — explicitly scoped to the logged-in buyer's id (unlike the Farmer records screen, which relies on the backend to scope by the authenticated farmer). Same date-range/shift filtering, search, `RenderSummary`, and read-only `DataCard` grid. Screen title uses "Milk Subscription" wording.

---

## Auth — `app/(auth)/`

Unauthenticated stack ([`_layout.tsx`](<../app/(auth)/_layout.tsx>)), both screens wrapped in the shared `AuthTemplate` (gradient background, logo, language switcher that auto-opens on first launch if no language preference is stored).

### Login — `login.tsx`

Mobile + password. Normalizes mobile input (strips non-digits, `+91` prefix), validates against `^[6-9]\d{9}$`. Calls `AuthContext.signIn(mobile, password)`; on success routes to `/(admin)` if the returned role is `Admin`, otherwise `/(tabs)`. Password visibility toggle, inline error text, loading state on submit.

### Sign Up — `signup.tsx`

Name + mobile only (no password field on this screen). Validates name (letters/spaces) and the same Indian mobile format, with granular field-level error messages. Calls `AuthContext.signUp(name, mobile)`; routes based on returned role, same as login.

---

## Other Screens

### Customer Detail — `app/customer/[id].tsx`

Admin drill-down reached from the eye icon on `customers.tsx`. `GET getUser?userId=<id>` (redirects to `/login` if no token). Shows: gradient profile card (photo, name, father's name, mobile, verified badge, role badge), quick actions (Call/`tel:`, Message/`sms:`, plus non-functional Milk Records/Payment buttons), two wallet cards (Balance = `walletAmount`, Withdrawn/Paid = `totalWithdrawnAmount`, label depends on role), an Account Information card (id, address, joined/updated dates). **Note:** the "Quick Stats" (Total Milk, Avg Fat, Avg SNF, Avg Rate) and "Recent Activity" sections currently render hardcoded placeholder data, not live API data. Pull-to-refresh re-fetches the user record.

### Not Found — `app/+not-found.tsx`

Standard Expo Router 404 fallback with a link back to `/`. Also used as the redirect target for role-guard failures in the drawer layouts.

---

## Shared Components Used Across Screens

- **`components/common/UserRecordsCards.tsx` (`UserCard`)** — row entry card (avatar, name, date, SNF/Fat/Rate, shift badge, weight, price); used inside `ListShow` for today's buy/sale entries.
- **`components/common/RenderSummary.tsx`** — gradient stat strip (entries count, total amount, total weight); used by all four records screens (admin buy/sale, farmer, buyer).
- **`components/admin/milkRecords/DataCard.tsx`** — record card whose Edit/Delete icons only render for `role === "Admin"`, letting the same component serve as read-only in Farmer/Buyer records screens.
- **`components/admin/milkRecords/ShiftModal.tsx`** — All/Morning/Evening picker modal used across records screens.
- **`components/admin/users/RoleCheckBox.tsx`** — pill checkbox with selected/modified/removable states; used in Customers, `CreateUserModal`, `BuyerRateConfigModal`, `PaymentForm`.
- **`components/forms/EntryForm.tsx`** — shared milk-buy entry form (date/shift/milk-type toggles, farmer selector, weight/fat/snf, computed rate, total); used for both creating entries (`MilkBuyEntry`) and editing existing ones (`milkBuyRecords`). Note: it does not compute the rate itself — chart-based rate lookup only happens in `MilkBuyEntry`'s creation flow.
- **`components/customer/Summary.tsx`** — Farmer dashboard's 2×2 summary grid.
- **`components/auth/AuthTemplate.tsx`** — shared gradient wrapper for Login/Signup with the language-switcher modal.
- **`components/admin/CustomerCard.tsx`** and **`components/admin/rateChart.tsx`** appear to be legacy/alternate versions (a gradient customer card and an inline-`TextInput` rate chart) not referenced by the current screens — `customers.tsx` and `rateChartScreen.tsx` use their own/other implementations instead.

---

## Cross-Cutting Business Logic Notes

- **Role-based landing**: `app/index.tsx` redirects by `user.role` — `Admin` → `(admin)`, `Farmer` → `(tabs)`, `Buyer`/`User` → `(buyer)`. Each drawer layout re-validates the role and redirects/bounces to `+not-found` if it doesn't match, since there's no centralized route guard.
- **Rate auto-calculation**: only the admin's Milk Buy flow derives rate from the Fat/SNF chart automatically; Milk Sale entry and the Farmer's View Rates screen are informational/manual only.
- **Admin-only mutation gating**: `DataCard`'s edit/delete controls are gated on `role === "Admin"` inside the component itself, rather than via per-screen conditionals — this is how the same card is reused read-only for Farmer/Buyer.
- **Buyer subscription config**: a buyer's `morningMilk` / `eveningMilk` / `milkRate` are set only by the Admin (`BuyerRateConfigModal`), and drive both eligibility in `MilkSaleEntry`'s buyer picker and the auto-filled weight when the shift is toggled.
- **Payment `code` semantics**: `"Paid"` = money the dairy pays to farmers; `"Recieve"` (backend spelling, not a typo to fix casually) = money the dairy receives from buyers. Farmer wallet always queries `"Paid"`; Buyer wallet always queries `"Recieve"`; Admin Payments toggles between both.
- **Position-based ordering**: farmers/customers carry a `positionNo` used for list ordering, editable only via Admin's Rearrange screen (`changePosition`).
