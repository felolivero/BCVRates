# Calculadora de Cambio Android - Diseno

## Contexto

El proyecto es una app Android para compradores en Venezuela que necesitan comparar opciones de pago al momento de comprar. Algunos comercios pueden dar un precio para pagos en divisas, otro precio para pagos en bolivares a tasa BCV, otro para USDT/paralelo, y a veces precios asociados al euro. La app ayuda al comprador a decidir que metodo de pago le cuesta menos en terminos reales.

La app se construira desde el inicio como una app Android orientada a APK/AAB usando React Native y Expo. La primera version no requerira cuentas de usuario.

## Objetivos

- Mostrar tasas actuales para USD BCV/oficial, USD paralelo/USDT, EUR oficial y EUR paralelo cuando este disponible.
- Permitir que el usuario mantenga una tasa manual de USD efectivo, porque esa tasa es local y volatil.
- Convertir entre USD, Bs y EUR usando la tasa correspondiente.
- Comparar varias condiciones de pago ofrecidas por un comercio y recomendar la opcion mas conveniente.
- Funcionar correctamente con datos vencidos o sin conexion usando cache local.
- Usar Supabase como capa central de cache/control de tasas y DolarApi como fuente externa.

## Fuera Del Alcance De La V1

- Cuentas de usuario o login.
- Historial personal de compras sincronizado en la nube.
- Funciones pagas o suscripciones.
- Version para iOS.
- Base de datos compleja de comercios, escaneo de recibos u OCR automatico.

## Arquitectura

El sistema tiene tres capas:

1. App movil:
   - React Native + Expo.
   - Salida Android APK/AAB.
   - Almacenamiento local para tasas en cache, tasa manual de efectivo y preferencias simples.
   - Pantallas principales de calculadora y tasas.

2. Supabase:
   - Guarda las tasas actuales.
   - Guarda un historico basico de tasas.
   - Provee una Edge Function llamada `refresh-rates` para consultar DolarApi y actualizar el cache de tasas.
   - Expone lectura publica segura para tasas con Row Level Security activado.
   - No guarda datos especificos de usuarios en V1.

3. DolarApi:
   - Fuente externa de tasas de cambio.
   - Endpoints actuales de USD: `/v1/dolares/oficial` y `/v1/dolares/paralelo`.
   - Endpoint actual de EUR: `/v1/euros`, que devuelve euro oficial y euro paralelo.
   - Existen endpoints historicos, pero no se muestran en la interfaz de la V1.

La app lee primero las tasas desde Supabase. Supabase se actualiza mediante la Edge Function `refresh-rates`, que puede ser llamada de forma segura desde la app porque las claves privilegiadas se mantienen del lado servidor. Si Supabase no esta disponible, la app usa las tasas guardadas en cache local. Si no existe cache, la calculadora permite calculos que dependan solo de entradas manuales y marca claramente que las tasas automaticas no estan disponibles.

## Modelo De Tasas

Cada registro de tasa debe incluir:

- `code`: identificador estable, por ejemplo `usd_bcv`, `usd_parallel`, `eur_bcv`, `eur_parallel`.
- `base_currency`: `USD` o `EUR`.
- `quote_currency`: `VES`.
- `value`: bolivares por unidad de la moneda base.
- `source`: por ejemplo `dolarapi`.
- `source_name`: etiqueta visible para el usuario.
- `source_updated_at`: fecha/hora reportada por la fuente externa.
- `fetched_at`: fecha/hora en que Supabase actualizo la tasa.

La tasa manual de USD efectivo es local del dispositivo:

- `cash_usd_rate`: bolivares por USD efectivo.
- `updated_at`: fecha/hora local del ultimo cambio hecho por el usuario.

## Pantallas

### Calculadora

La calculadora usa un flujo hibrido.

El usuario empieza con un monto:

- `20 USD`
- `15000 Bs`
- `18 EUR`

Luego el usuario elige como interpretar ese monto:

- USD divisas.
- Bs a BCV.
- Bs a paralelo/USDT.
- EUR.
- USD efectivo usando la tasa manual.

El usuario puede agregar condiciones de pago adicionales ofrecidas por el comercio:

- Precio en divisas.
- Precio en Bs a BCV.
- Precio en Bs a paralelo/USDT.
- Precio en EUR.
- Precio usando tasa manual de USD efectivo.

El resultado ordena todas las condiciones de pago desde la mas barata hasta la mas cara y muestra:

- Mejor opcion de pago.
- Costo equivalente en USD.
- Costo equivalente en Bs.
- Diferencia contra la mejor opcion en Bs.
- Diferencia contra la mejor opcion en porcentaje.
- Advertencia cuando una opcion esta materialmente inflada frente a la opcion mas barata.

### Tasas

La pantalla de tasas muestra:

- USD oficial/BCV.
- USD paralelo/USDT.
- EUR oficial.
- EUR paralelo si esta disponible.
- Tasa manual de USD efectivo.
- Fecha/hora de ultima actualizacion de las tasas automaticas.
- Fecha/hora de ultima edicion de la tasa manual de efectivo.
- Accion para refrescar.
- Indicador claro cuando se estan usando datos en cache o vencidos.

La tasa manual de efectivo se puede editar desde esta pantalla porque probablemente el usuario la ajustara antes de calcular.

### Ajustes

Ajustes incluye:

- Edicion de tasa manual de USD efectivo, tambien accesible desde Tasas.
- Moneda preferida para mostrar resumenes de resultados.
- Informacion de la fuente de tasas.
- Limpiar cache local.
- Nota legal/referencial: las tasas son informativas y deben verificarse antes de pagar.

## Reglas De Calculo

La app normaliza cada opcion a un costo equivalente comun en VES y USD.

Para montos ingresados en USD:

- USD divisas: el equivalente en USD es el monto ingresado; el equivalente en VES depende de la tasa seleccionada para comparacion/visualizacion.
- USD efectivo: VES es igual al monto en USD multiplicado por la tasa manual de efectivo.

Para montos ingresados en VES:

- Bs a BCV: el equivalente en USD es VES dividido entre la tasa USD BCV.
- Bs a paralelo/USDT: el equivalente en USD es VES dividido entre la tasa USD paralelo.
- Bs a tasa manual de efectivo: el equivalente en USD es VES dividido entre la tasa manual de efectivo.

Para montos ingresados en EUR:

- El equivalente en VES es el monto en EUR multiplicado por la tasa EUR seleccionada.
- El equivalente en USD puede derivarse comparando ese valor en VES contra la tasa USD relevante para visualizacion.

Para ordenar la comparacion:

- La opcion mas barata es la que tenga el menor costo equivalente en VES.
- Las diferencias se calculan contra el costo equivalente en VES de la mejor opcion.
- La diferencia porcentual es `(costo_opcion - costo_mejor_opcion) / costo_mejor_opcion * 100`.

El manejo de decimales debe aceptar coma y punto decimal.

## Actualizacion De Datos Y Modo Offline

Al iniciar normalmente:

1. Cargar tasas en cache local de inmediato si existen.
2. Consultar tasas actuales desde Supabase.
3. Actualizar la interfaz y el cache local si Supabase devuelve tasas validas.
4. Mostrar las fechas de actualizacion de las fuentes.

Al refrescar manualmente:

1. Llamar la Edge Function `refresh-rates` de Supabase.
2. Consultar las tasas actuales desde Supabase cuando termine el refresco.
3. Si el refresco funciona, actualizar el cache local.
4. Si el refresco falla, mantener los datos actuales y mostrar un error no bloqueante.

Estados de falla:

- Si DolarApi falla: Supabase conserva las ultimas tasas validas.
- Si Supabase falla: la app usa cache local.
- Si no hay cache local: la app marca las tasas automaticas como no disponibles y permite calculos que solo necesiten datos manuales.
- Si las tasas estan vencidas: la app muestra un indicador claro de datos vencidos.

## Seguridad En Supabase

La V1 usa lectura publica solamente para datos de tasas no sensibles.

Requisitos:

- Activar RLS en las tablas publicas.
- Permitir lectura anonima solo en tablas/vistas de tasas que sean seguras de exponer.
- No exponer claves `service_role` dentro de la app.
- Usar solo claves publicas del cliente en la configuracion movil.
- Mantener cualquier mecanismo privilegiado de refresco fuera del cliente movil.
- La Edge Function `refresh-rates` puede ser invocable publicamente, pero todas las escrituras privilegiadas a la base de datos deben permanecer del lado servidor.

## Estrategia De Pruebas

Pruebas de calculo principales:

- USD a Bs usando BCV.
- Bs a USD usando BCV.
- USD a Bs usando paralelo/USDT.
- Bs a USD usando paralelo/USDT.
- Conversiones con EUR.
- Conversiones con tasa manual de USD efectivo.
- Ordenamiento de varias condiciones de pago.
- Calculo de diferencias y porcentajes.

Pruebas de entrada:

- Valores vacios.
- Valores negativos.
- Valores en cero.
- Separador decimal con coma.
- Separador decimal con punto.
- Texto invalido.

Pruebas de estado:

- Tasas frescas desde Supabase.
- Tasas en cache cuando no hay conexion.
- Advertencia de tasas vencidas.
- Tasas automaticas faltantes.
- Persistencia de la tasa manual de efectivo.

## Decisiones De Implementacion

- La V1 usa una Edge Function de Supabase llamada `refresh-rates` para consultar DolarApi y actualizar la base de datos.
- La V1 usa los endpoints de DolarApi `/v1/dolares/oficial`, `/v1/dolares/paralelo` y `/v1/euros`.
- La V1 guarda historico de tasas en Supabase para uso futuro, pero no muestra graficos historicos en la interfaz.

## Referencias

- Documentacion de DolarApi Venezuela: `https://dolarapi.com/docs/venezuela/`
- Endpoint DolarApi USD oficial: `https://ve.dolarapi.com/v1/dolares/oficial`
- Endpoint DolarApi USD paralelo: `https://ve.dolarapi.com/v1/dolares/paralelo`
- Documentacion del endpoint DolarApi EUR: `https://dolarapi.com/docs/venezuela/operations/get-euros`

## Direccion Aprobada

La direccion aprobada para la V1 es:

- App Android primero.
- React Native + Expo.
- Supabase como cache central de tasas y almacenamiento historico.
- DolarApi como fuente externa.
- Sin login en V1.
- Flujo hibrido de calculadora.
- Pantalla dedicada de Tasas.
- Tasa manual de USD efectivo local del dispositivo.
