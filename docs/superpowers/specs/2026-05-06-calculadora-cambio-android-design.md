# Calculadora de Cambio Android - Design

## Context

The project is an Android app for Venezuelan shoppers who need to compare payment options at checkout. Stores may quote one price for foreign currency payments, another price for bolivar payments at BCV, another for USDT/paralelo, and sometimes prices tied to euros. The app helps the buyer decide which payment method is cheapest in real terms.

The app will be built as an APK/AAB-first Android app using React Native and Expo. The first version will not require user accounts.

## Goals

- Show current exchange rates for USD BCV/oficial, USD paralelo/USDT, EUR oficial, and EUR paralelo when available.
- Let users maintain a manual cash USD rate because cash exchange rates are local and volatile.
- Convert between USD, Bs, and EUR using the relevant rate.
- Compare multiple store payment conditions and recommend the cheapest option.
- Work gracefully with stale data or no connection by using local cache.
- Use Supabase as the central cache/control layer for rates and DolarApi as the external rate source.

## Non-Goals For V1

- User accounts or login.
- Personal purchase history synced to the cloud.
- Paid features or subscriptions.
- iOS release.
- Complex merchant database, receipt scanning, or automatic OCR.

## Architecture

The system has three layers:

1. Mobile app:
   - React Native + Expo.
   - Android APK/AAB output.
   - Local storage for cached rates, the manual cash rate, and simple preferences.
   - Main calculator and rates screens.

2. Supabase:
   - Stores current rates.
   - Stores a basic historical record of rates.
   - Provides an Edge Function named `refresh-rates` to fetch DolarApi and update the rates cache.
   - Exposes public read access for rates with Row Level Security enabled.
   - Does not store user-specific data in V1.

3. DolarApi:
   - External source for exchange rates.
   - Current USD endpoints: `/v1/dolares/oficial` and `/v1/dolares/paralelo`.
   - Current EUR endpoint: `/v1/euros`, which returns official and parallel euro rates.
   - Historical endpoints exist but are not shown in the V1 UI.

The app reads rates from Supabase first. Supabase is refreshed through the `refresh-rates` Edge Function, which is safe to call from the app because privileged keys remain server-side. If Supabase is unavailable, the app uses local cached rates. If no cache exists, the calculator still allows manual cash-rate calculations and clearly marks automatic rates as unavailable.

## Rate Model

Each rate record should include:

- `code`: stable identifier such as `usd_bcv`, `usd_parallel`, `eur_bcv`, `eur_parallel`.
- `base_currency`: `USD` or `EUR`.
- `quote_currency`: `VES`.
- `value`: bolivars per base currency unit.
- `source`: for example `dolarapi`.
- `source_name`: user-facing label.
- `source_updated_at`: timestamp reported by the upstream source.
- `fetched_at`: timestamp when Supabase refreshed the rate.

The manual cash USD rate is local to the device:

- `cash_usd_rate`: bolivars per USD cash.
- `updated_at`: local timestamp of the last user change.

## Screens

### Calculator

The calculator uses a hybrid flow.

The user starts with one amount:

- `20 USD`
- `15000 Bs`
- `18 EUR`

The user then chooses how to interpret that amount:

- USD divisas.
- Bs at BCV.
- Bs at paralelo/USDT.
- EUR.
- USD cash using the manual cash rate.

The user may add additional payment conditions from the store:

- Price in divisas.
- Price in Bs at BCV.
- Price in Bs at paralelo/USDT.
- Price in EUR.
- Price using the manual cash USD rate.

The result ranks all payment conditions from cheapest to most expensive and shows:

- Best payment option.
- Equivalent cost in USD.
- Equivalent cost in Bs.
- Difference against the best option in Bs.
- Difference against the best option as a percentage.
- Warning when an option is materially inflated compared with the cheapest option.

### Rates

The rates screen shows:

- USD oficial/BCV.
- USD paralelo/USDT.
- EUR oficial.
- EUR paralelo if available.
- Manual USD cash rate.
- Last update time for automatic rates.
- Manual cash rate last edit time.
- Refresh action.
- Clear indicator when cached/stale data is being used.

The manual cash rate can be edited from this screen because it is likely to change before calculating.

### Settings

Settings include:

- Manual USD cash rate editing, also reachable from Rates.
- Preferred display currency for result summaries.
- Rate source information.
- Clear local cache.
- Legal/reference note: rates are informational and should be verified before paying.

## Calculation Rules

The app normalizes every option to a common equivalent cost in VES and USD.

For amounts entered in USD:

- Divisas USD: equivalent USD is the entered amount; VES depends on the selected comparison/display rate.
- USD cash: VES equals USD amount multiplied by the manual cash rate.

For amounts entered in VES:

- Bs at BCV: equivalent USD equals VES divided by USD BCV rate.
- Bs at paralelo/USDT: equivalent USD equals VES divided by USD paralelo rate.
- Bs at manual cash: equivalent USD equals VES divided by the manual cash rate.

For amounts entered in EUR:

- Equivalent VES equals EUR amount multiplied by the selected EUR rate.
- Equivalent USD can be derived by comparing the VES value against the relevant USD rate for display.

For comparison ranking:

- The cheapest option is the one with the lowest equivalent VES cost.
- Differences are calculated against the cheapest equivalent VES cost.
- Percent difference equals `(option_cost - best_cost) / best_cost * 100`.

Decimal handling must accept comma and dot decimal separators.

## Data Refresh And Offline Behavior

Normal app start:

1. Load local cached rates immediately if present.
2. Fetch current rates from Supabase.
3. Update UI and local cache if Supabase returns valid rates.
4. Show source update times.

Manual refresh:

1. Call the Supabase `refresh-rates` Edge Function.
2. Fetch current rates from Supabase after the refresh completes.
3. If refresh succeeds, update local cache.
4. If refresh fails, keep current data and show a non-blocking error.

Failure states:

- DolarApi failure: Supabase keeps the last valid rates.
- Supabase failure: app uses local cache.
- No local cache: app marks automatic rates unavailable and allows calculations that only need manual input.
- Stale rates: app displays a clear stale-data indicator.

## Supabase Security

V1 uses public read access only for non-sensitive rates data.

Requirements:

- Enable RLS on public tables.
- Allow anonymous read access only to rates tables/views that are safe to expose.
- Do not expose service-role keys in the app.
- Use only public client keys in mobile app configuration.
- Keep any privileged refresh mechanism outside the mobile client.
- The `refresh-rates` Edge Function may be public-callable, but it must keep all privileged database writes server-side.

## Testing Strategy

Core calculation tests:

- USD to Bs using BCV.
- Bs to USD using BCV.
- USD to Bs using paralelo/USDT.
- Bs to USD using paralelo/USDT.
- EUR conversions.
- Manual USD cash rate conversions.
- Ranking multiple payment conditions.
- Difference and percentage calculations.

Input tests:

- Empty values.
- Negative values.
- Zero values.
- Comma decimal separator.
- Dot decimal separator.
- Invalid text.

State tests:

- Fresh rates from Supabase.
- Cached rates when offline.
- Stale rates warning.
- Missing automatic rates.
- Manual cash rate update persistence.

## Implementation Decisions

- V1 uses a Supabase Edge Function named `refresh-rates` for DolarApi fetching and database updates.
- V1 uses DolarApi endpoints `/v1/dolares/oficial`, `/v1/dolares/paralelo`, and `/v1/euros`.
- V1 stores historical rates in Supabase for future use but does not show historical charts in the UI.

## References

- DolarApi Venezuela docs: `https://dolarapi.com/docs/venezuela/`
- DolarApi USD oficial endpoint: `https://ve.dolarapi.com/v1/dolares/oficial`
- DolarApi USD paralelo endpoint: `https://ve.dolarapi.com/v1/dolares/paralelo`
- DolarApi EUR endpoint docs: `https://dolarapi.com/docs/venezuela/operations/get-euros`

## Approved Direction

The approved V1 direction is:

- Android app first.
- React Native + Expo.
- Supabase as central rates cache and historical store.
- DolarApi as upstream source.
- No login in V1.
- Hybrid calculator flow.
- Dedicated Rates screen.
- Manual device-local USD cash rate.
