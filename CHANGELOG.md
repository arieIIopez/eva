# Historial de cambios

Este archivo documenta la evolución de las versiones públicas de EVA.

EVA mantiene versionamiento separado para motor, datos, procesamiento y metodología. La versión pública del repositorio puede incorporar revisiones de documentación, publicación o citación sin modificar el motor de cálculo; cuando esto ocurra se indicará expresamente.

## [No publicado]

### Desarrollo hacia motor 3.13.0 / metodología 2.4.0

- La raíz del criterio de conectividad dendrítica deja de estar fijada internamente a Alameda y pasa a ser un parámetro seleccionable por el usuario.
- Alameda se conserva como escenario predeterminado para mantener comparabilidad con las corridas históricas.
- El usuario puede seleccionar cualquier eje de la red existente como semilla de crecimiento y decidir si la raíz se expande al componente construido conectado.
- Se parametrizan explícitamente la tolerancia dendrítica `τ` y el factor de atenuación `α` en la configuración de raíz.
- La configuración de raíz se incorpora a la firma reproducible de la corrida (`config_hash`).
- El solver secuencial recalcula en cada iteración tanto el criterio dendrítico como el modelo de ciclistas inducidos, de modo que ambos sean efectivamente dependientes del estado de la red dentro de la secuencia completa.
- La salida del solver registra grado y score dendrítico de cada proyecto elegido y la configuración de raíz utilizada.
- Esta evolución está orientada a análisis de sensibilidad de trayectorias topológicas y a la formulación metodológica general de priorización secuencial de intervenciones en redes.
- Datos y procesamiento permanecen en `2026.08` y `2026.08-comunas-oficiales`, respectivamente.

Estos cambios permanecen en desarrollo en `main` y todavía no constituyen una nueva versión archivada en Zenodo.

## [3.12.1] — 2026-08-28

### Publicación y citación

- Release de mantenimiento destinada a consolidar el archivado permanente y la citación académica mediante la integración GitHub–Zenodo.
- DOI de la versión: `10.5281/zenodo.22145509`.
- Actualización de `CITATION.cff` a la versión pública `3.12.1`, incorporando DOI y afiliación institucional del equipo responsable.
- Incorporación del **Gobierno Regional Metropolitano de Santiago** como autor institucional principal, seguido por Ariel López y Gabriela Bastías como autores personales del software.
- La **División de Infraestructura y Transportes** se mantiene como afiliación institucional de los autores personales y unidad responsable del desarrollo.
- Actualización de la referencia recomendada en `README.md` para reflejar el orden de autoría **GORE RM → López → Bastías**.
- No introduce cambios en el motor de cálculo, los datos, el procesamiento ni la metodología respecto de la versión 3.12.0.
- Publicación de `docs/MEMORIA_TECNICA_CIENTIFICA.md`, nueva memoria técnica, metodológica y científica alineada con el código vigente.
- Publicación de `docs/METODO_DENDRITICO.md`, formulación científica del índice de conectividad dendrítica por distancia topológica a una red raíz.
- Incorporación de un workflow reproducible para generar el PDF `docs/EVA_Memoria_Tecnica_Metodologica_Cientifica_v3.12.1.pdf` desde la fuente Markdown.

### Componentes técnicos de referencia

- Motor: `3.12.0`
- Datos: `2026.08`
- Procesamiento de datos: `2026.08-comunas-oficiales`
- Metodología: `2.3.0`

## [3.12.0] — 2026-08-28

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
