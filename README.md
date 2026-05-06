# App Cambio BCV

App Android para comparar formas de pago en Venezuela usando tasas BCV, paralelo/USDT, euro y una tasa manual de USD efectivo.

## Estructura

- `mobile/`: app Expo React Native.
- `supabase/`: migraciones y Edge Functions cuando se conecte Supabase.
- `docs/`: diseno y plan de implementacion.

## Desarrollo movil

```powershell
Set-Location mobile
npm install
npm run start
```

Antes de conectar Supabase, crea `mobile/.env` usando `mobile/.env.example` como guia.
