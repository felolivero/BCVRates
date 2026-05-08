# App Cambio BCV

App Android para comparar formas de pago en Venezuela usando BCV, USDT (Binance), euro oficial y una tasa manual de USD efectivo.

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


## UX

- Propuesta de flujo intuitivo: `docs/superpowers/specs/2026-05-06-flujo-intuitivo-propuesta.md`.


## Flujo para publicarlo en GitHub

Si los cambios están solo en tu rama local, todavía falta publicarlos.

1. Verifica remoto:

```bash
git remote -v
```

2. Si no hay remoto, agrega tu repo:

```bash
git remote add origin <url-de-tu-repo>
```

3. Sube la rama actual:

```bash
git push -u origin <tu-rama>
```

4. Abre PR en GitHub desde esa rama hacia `main` (o la rama objetivo).
