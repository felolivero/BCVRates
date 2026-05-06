# Propuesta de flujo más intuitivo para BCV Rates

## Problema observado

El flujo actual obliga al usuario a ir agregando opciones de pago de forma incremental y cambiando entre tipos de tasa. Aunque funciona para usuarios avanzados, puede generar fricción para personas con poca experiencia tecnológica.

## Objetivo UX

Reducir decisiones tempranas y guiar al usuario en 3 pasos claros:

1. **¿Qué te ofreció la tienda?**
2. **Ingresa todos los montos en una sola pantalla**
3. **Recibe una recomendación automática (más barato -> más caro)**

## Propuesta: flujo "Asistente" + modo "Avanzado"

### 1) Pantalla inicial con CTA único

- Botón principal: **"Comparar una compra"**.
- Texto corto: "Ingresa los precios que te dio la tienda y te digo cuál conviene más".
- Botón secundario pequeño: "Editar tasas".

Esto evita que el usuario piense primero en tasas y se enfoque en su objetivo real: decidir cómo pagar.

### 2) Paso 1 del asistente: detectar opciones ofrecidas

Checklist simple con switches:

- [ ] Me dieron precio en Divisas (USD efectivo)
- [ ] Me dieron precio en bolívares BCV
- [ ] Me dieron precio en bolívares USDT (Binance)
- [ ] Me dieron precio en EUR

El usuario marca solo lo que aplica en su compra.

### 3) Paso 2: formulario dinámico de una sola vista

Se muestran únicamente los campos que marcó en el paso anterior.

Ejemplo:
- Divisas (USD efectivo): `20`
- Bs BCV: `15000`
- Bs USDT (Binance): `17000`

Con esto no necesita "agregar" manualmente opción por opción; ve todo junto y entiende mejor la comparación.

### 4) Paso 3: resultado con lenguaje directo

Tarjeta principal:
- **"Te conviene pagar en: Divisas (USD efectivo)"**
- "Ahorras 1.250 Bs (8,2%) vs la siguiente opción"

Debajo:
- ranking de alternativas (2da, 3ra, etc.)
- badge visual: "Más caro" / "Intermedio" / "Mejor"


### 5) Opción adicional: "¿Y si vendo mis dólares/USDT?"

Después de mostrar la mejor forma de pago, agregar un bloque opcional de simulación:

- CTA: **"Averigua cuánto sería si vendes tus divisas o USDT"**
- Selector: `Divisas` o `USDT (Binance)`
- Monto base: toma el monto en USD de la opción elegida o permite editarlo

Reglas de cálculo de la simulación:

- Si selecciona **Divisas**: usar **tasa manual** configurada por el usuario.
- Si selecciona **USDT (Binance)**: usar la tasa automática de USDT disponible en Tasas.
- Resultado mostrar:
  - "Recibirías aprox: X Bs"
  - "Diferencia vs pagar directo: Y Bs"

Esto ayuda a decisiones reales del día a día: pagar en moneda extranjera o vender primero y pagar en bolívares.

### 6) Modo avanzado opcional

Para usuarios expertos:
- activar "Modo avanzado" en Ajustes
- permite edición completa de cada opción y criterios de visualización

Así mantienes potencia sin complicar el flujo base.

## Mejoras de microcopy recomendadas

- Reemplazar "Agregar opción" por **"Otro precio que te dieron"**.
- Reemplazar "USD efectivo" por **"Dólar en efectivo (tasa manual)"**.
- Mensajes de error concretos: "Escribe un monto, por ejemplo 15000".

- Renombrar términos en toda la app:
  - **Divisas** = USD efectivo.
  - **USDT (Binance)** = opcion de pago P2P.

## Estados vacíos y ayudas

- Si no hay tasas actualizadas: mostrar banner no bloqueante "Usando última tasa guardada".
- Ayuda junto a "USDT (Binance)": "Opcion para pagos P2P".
- Botón "Ver ejemplo" que precarga un caso real (20 USD, 15000 Bs, 17000 Bs).

## Implementación incremental sugerida

1. Mantener lógica de cálculo actual (ya probada) y solo cambiar entrada/UX.
2. Crear nuevo componente `ComparisonWizard` en `mobile/src/components/`.
3. Reutilizar `calculator.ts` para calcular ranking final.
4. Agregar módulo de simulación `sellScenario` (divisas/manual vs USDT/tasa automática).
5. Dejar el flujo actual detrás de un toggle interno mientras se valida usabilidad.

## Métricas de validación

- Tiempo hasta primer resultado (objetivo: < 30s).
- Porcentaje de usuarios que completa comparación sin ayuda.
- Reducción de errores de entrada de montos.

## Decisión recomendada

Adoptar el **flujo asistido por pasos como predeterminado** y mantener el flujo actual como modo avanzado. Esta combinación mejora adopción para usuarios no técnicos sin perder flexibilidad para usuarios expertos.
