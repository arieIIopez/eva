# Contribuir a EVA

Gracias por el interés en EVA — Evaluador de Ciclovías Proyectadas.

EVA es una herramienta pública de apoyo a la decisión. Las contribuciones son bienvenidas cuando ayudan a mejorar su funcionamiento, documentación, calidad de datos, reproducibilidad o capacidad de adaptación por otras instituciones.

## Formas de contribuir

Puede colaborar mediante:

- reporte de errores de funcionamiento;
- observaciones sobre datos o metodología;
- propuestas de nuevas funcionalidades;
- mejoras de documentación;
- experiencias de adaptación en otras instituciones o territorios;
- propuestas de pruebas, validaciones o indicadores adicionales.

Use las plantillas de Issues disponibles en GitHub para describir el caso con el mayor detalle posible.

## Cambios metodológicos

Los cambios que afecten criterios, ecuaciones, parámetros, modelos, normalizaciones, análisis de sensibilidad o reglas de priorización deben incluir:

1. descripción precisa del problema que se busca resolver;
2. fundamento técnico o bibliográfico cuando corresponda;
3. efecto esperado sobre los resultados;
4. pruebas que permitan comparar el comportamiento anterior y el propuesto; y
5. actualización de la documentación y versionamiento afectados.

EVA hace explícitos sus supuestos y límites. Una mejora metodológica no debe introducir reglas implícitas que dificulten auditar por qué cambia un resultado.

## Cambios de datos

Toda actualización de datos debe indicar:

- fuente;
- fecha o período de referencia;
- cobertura territorial;
- transformaciones realizadas;
- sistema de referencia espacial, cuando corresponda;
- condiciones de uso o licencia de la fuente; y
- posibles efectos sobre comparabilidad con versiones anteriores.

Consulte `docs/DATOS.md` y `docs/LICENCIAS_DATOS.md`.

## Relación con el despliegue institucional

Este repositorio es una publicación verificable del despliegue institucional de EVA. El workflow de sincronización valida componentes mediante huellas SHA-256 y retira configuraciones propias del entorno institucional antes de publicar.

Por esta razón, una modificación propuesta directamente sobre `src/` o `data/` no implica que el cambio pase automáticamente a producción. Los cambios funcionales aceptados deben ser revisados e integrados en la fuente institucional y, posteriormente, reflejados en el proceso de publicación y sus huellas de verificación.

## Seguridad

No publique credenciales, tokens, claves, datos personales ni información sensible en Issues, Pull Requests o commits. Consulte `SECURITY.md` para reportes de seguridad.

## Licencia

Al contribuir código al proyecto, usted acepta que su contribución pueda distribuirse bajo Apache License 2.0, de acuerdo con la licencia del repositorio.

La licencia del software no modifica las licencias o derechos aplicables a datos, cartografías, marcas o activos de terceros.

## Naturaleza de las contribuciones

La aceptación de una contribución en el repositorio no implica por sí sola que sus resultados constituyan una decisión oficial del Gobierno Regional Metropolitano de Santiago. EVA es una herramienta de apoyo a la decisión y sus resultados deben interpretarse conforme a su documentación metodológica y al proceso institucional correspondiente.
