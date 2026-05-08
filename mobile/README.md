# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Probar en telefono (Android/iOS)

### Opcion rapida con Expo Go

1. En `mobile/`, instala dependencias:

   ```bash
   npm install
   ```

2. Inicia el servidor:

   ```bash
   npx expo start
   ```

3. Instala **Expo Go** en tu telefono.
4. Escanea el QR desde la terminal o desde el navegador que abre Expo.

> Recomendacion: usa la misma red Wi‑Fi en PC y telefono. Si no funciona LAN, en Expo cambia a `tunnel`.

### Opcion con build interna (mas parecido a produccion)

```bash
npx eas login
npx eas build --platform android --profile preview
```

Al finalizar, Expo te da un enlace para instalar el APK en el telefono.

## Si quieres que yo lo actualice en tu Expo.dev

Si deseas que lo haga yo directamente, necesito:

- Que ejecutes `npx eas login` en tu maquina (o compartas un token de Expo temporal).
- Confirmar el `owner/slug` del proyecto en Expo.
- Confirmar si quieres build `preview` (APK) o `production` (AAB).

Con eso puedo dejarte el comando exacto y el flujo para publicar cada cambio.


## Si estas solo con el telefono (sin PC)

Si hoy no tienes acceso a tu PC, **yo no puedo entrar directamente a tu cuenta de Expo.dev** ni disparar builds desde aqui sin credenciales tuyas.

Lo que si puedes validar desde el telefono:

- Si ya existe un build `preview` reciente, abre el link de install que te dio EAS y revisa la fecha/version del APK.
- Si no hay build nuevo, los cambios locales del repo **no** se reflejan automaticamente en ese APK hasta correr un nuevo `eas build`.

En resumen: los cambios que hicimos en codigo solo aparecen en tu APK cuando se genera una build nueva.

## Como generar un token de Expo (cuando tengas PC)

1. Inicia sesion:

```bash
npx expo login
```

2. Crea token (recomendado: temporal y con nombre):

```bash
npx expo token:create
```

3. Copia el token (empieza con `expo_...`).
4. Compartelo de forma segura y luego revocalo cuando terminemos.

Para revocar tokens:

```bash
npx expo token:list
npx expo token:revoke <token-id>
```

## Datos minimos para que yo te guie/publicar rapido

- `EXPO_TOKEN` (temporal).
- `owner/slug` del proyecto.
- Perfil de build: `preview` (APK) o `production` (AAB).

Con eso te doy los comandos exactos para publicar y verificar si el APK ya incluye estos cambios.


## Flujo recomendado: GitHub -> PC -> Expo

Sí, ese es el mejor flujo para evitar confusiones de versiones.

1. **Subir cambios a GitHub** (ya listos en este repo).
2. En tu PC (donde ya tienes Expo/EAS logueado), actualizar repo:

```bash
git checkout <tu-rama>
git pull
```

3. Entrar a `mobile/` e instalar dependencias si hace falta:

```bash
npm install
```

4. Verificar rápido en local:

```bash
npx expo start
```

5. Generar nuevo APK preview con tus credenciales ya logueadas:

```bash
npx eas build --platform android --profile preview
```

6. Instalar el nuevo APK desde el link de EAS y confirmar cambios.

### Nota importante

Si no ejecutas un build nuevo, el APK anterior **no** incluirá estos cambios aunque estén en GitHub.
