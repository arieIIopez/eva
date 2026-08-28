# Historial de cambios

Este archivo documenta la evolución de las versiones públicas de EVA.

EVA mantiene versionamiento separado para motor, datos, procesamiento y metodología. La versión del motor se utiliza como referencia principal de la aplicación, mientras que las demás versiones permiten reproducir el contexto exacto de cada corrida.

## [No publicado]

- Próximas mejoras metodológicas, funcionales y de datos serán documentadas aquí antes de una nueva versión pública estable.

## [3.12.0] — 2026-08-07

### Estado de versión

- Motor: `3.12.0`
- Datos: `2026.08`
- Procesamiento de datos: `2026.08-comunas-oficiales`
- Metodología: `2.3.0`

### Capacidades incluidas

- Priorización secuencial de proyectos, reevaluando la cartera a medida que cambia la red.
- Evaluación multicriterio con criterios técnicos, territoriales, sociales y de política pública.
- Escenarios de ponderación y análisis de sensibilidad.
- Análisis de conectividad y efectos de red.
- Modelo Logit binario estimado con Biogeme para ciclistas inducidos.
- Controles de calidad de datos y advertencias metodológicas.
- Comparación de proyectos y carteras.
- Exportaciones reproducibles con versiones, parámetros, ponderaciones y huellas de configuración.
- Publicación navegable de código fuente y capas procesadas.
- Verificación automatizada de componentes mediante SHA-256 antes de su publicación en GitHub.

### Publicación abierta

El software se publica bajo Apache License 2.0. Las condiciones aplicables a datos y activos de terceros se documentan separadamente en `docs/LICENCIAS_DATOS.md`.

## Criterio de versionamiento

Una nueva versión pública deberá actualizar, cuando corresponda:

1. la versión del motor;
2. la versión de datos;
3. la versión de procesamiento;
4. la versión metodológica;
5. `CITATION.cff`;
6. este `CHANGELOG.md`; y
7. la documentación afectada por el cambio.
