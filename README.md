# EVA — Evaluador de Ciclovías Proyectadas

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

**EVA** es una herramienta de apoyo a la decisión desarrollada internamente por la **División de Infraestructura y Transportes del Gobierno Regional Metropolitano de Santiago (GORE RM)** para evaluar y priorizar carteras de infraestructura ciclable como componentes de una red y no como proyectos aislados.

La herramienta nace de un problema operativo de planificación: cuando una red contiene decenas o cientos de proyectos, el orden de ejecución modifica el beneficio de los proyectos siguientes. EVA permite evaluar esa interdependencia, combinar criterios técnicos, territoriales, sociales y de política pública, modificar ponderaciones y recalcular escenarios de forma interactiva.

> **EVA no busca sustituir la decisión pública. Automatiza los cálculos necesarios para que diferentes alternativas puedan ser evaluadas, comparadas y deliberadas utilizando una base común de evidencia.**

## Qué permite hacer

- Evaluar una cartera completa de ciclovías respecto de la red existente.
- Aplicar un modelo multicriterio con ponderaciones ajustables.
- Recalcular resultados al modificar criterios, parámetros o proyectos incorporados a la red.
- Ejecutar una priorización secuencial que reevalúa la cartera después de cada incorporación.
- Explorar escenarios y sensibilidad de la priorización.
- Analizar conectividad, accesibilidad, equidad territorial, seguridad vial, intermodalidad y otros atributos.
- Incorporar un modelo de elección modal Logit para estimar ciclistas inducidos.
- Comparar proyectos y carteras.
- Ejecutar controles de calidad de datos.
- Exportar resultados con información de procedencia, versiones y configuración para favorecer la reproducibilidad.

## Contexto institucional

EVA forma parte del ecosistema de herramientas **DITDATOS**, desarrollado por la División de Infraestructura y Transportes para fortalecer capacidades internas de planificación y diseño de movilidad mediante datos, análisis geoespacial y herramientas digitales.

Sitio institucional: https://ditdatos.gobiernosantiago.cl/

## Equipo responsable

EVA fue desarrollado internamente por un equipo de la **División de Infraestructura y Transportes del Gobierno Regional Metropolitano de Santiago**, responsable de su estructura metodológica, desarrollo, integración de datos, evaluación y evolución funcional:

- **Ariel López** — ingeniería de transportes, modelación, metodología y desarrollo.
- **Gabriela Bastías** — geografía, análisis territorial, integración de datos y desarrollo. GitHub: [@gcbastias](https://github.com/gcbastias)

## Referencias públicas y difusión

EVA ha sido presentado y discutido públicamente en instancias de ciudad inteligente, movilidad y participación social. Algunas referencias públicas son:

- **Gobierno de Santiago — Smart City Expo Santiago 2026:** presentación pública de EVA como plataforma para apoyar la priorización de ciclovías.  
  https://www.facebook.com/Gobierno.Santiago/posts/en-smart-city-expo-santiago-expo-santiago-2026-presentamos-eva-la-plataforma-de-/1060331616363665/

- **Mesa participativa Santiago Caminable y Pedaleable:** presentación de EVA a representantes de la sociedad civil y actores vinculados a movilidad.  
  https://www.extranoticias.cl/mesa-participativa-aborda-avances-de-la-red-metropolitana-de-ciclovias-en-santiago/

- **Revista Pedalea — “¿Qué construir primero? EVA: la herramienta que pone orden al rompecabezas de 820 km”:** artículo sobre el problema de priorización de la Red Metropolitana de Ciclovías, las fuentes de información utilizadas y el funcionamiento de EVA.  
  https://revistapedalea.com/que-construir-primero-eva-la-herramienta-que-pone-orden-al-rompecabezas-de-820-km/

## Código y datos publicados

El código fuente se encuentra disponible directamente y puede revisarse archivo por archivo en `src/`. Las capas procesadas utilizadas por la versión publicada se encuentran en `data/`, mientras que los recursos gráficos necesarios para la interfaz están en `assets/`.

```text
.
├── LICENSE                            # Apache License 2.0 para el software
├── NOTICE                             # autoría institucional y exclusiones
├── index.html                         # punto de entrada de la aplicación
├── src/                               # motor, interfaz, metodología y análisis
├── data/                              # capas procesadas utilizadas por EVA
├── assets/                            # recursos gráficos institucionales
├── docs/                              # documentación de datos y replicabilidad
└── .github/workflows/
    └── sync-public-source.yml         # extracción, verificación y auditoría de publicación
```

El directorio de trabajo `uploads/` no se publica: contiene fuentes originales, archivos intermedios e insumos de desarrollo que no son necesarios para auditar ni reutilizar la herramienta.

## Trazabilidad de esta publicación

La versión navegable del repositorio se genera a partir del despliegue público de EVA en DITDATOS. El workflow de publicación extrae únicamente componentes cuyos bytes coinciden con huellas **SHA-256 previamente verificadas** contra el paquete fuente revisado antes de su publicación.

Antes de incorporar los archivos al repositorio, el proceso automático:

1. verifica la identidad de los componentes mediante SHA-256;
2. retira credenciales y configuraciones propias del despliegue institucional;
3. comprueba que no queden tokens de cartografía embebidos;
4. valida la estructura JSON/GeoJSON de las capas procesadas; y
5. publica el código, datos y recursos en directorios navegables.

Esta cadena permite que la publicación sea revisable y reproducible sin exponer insumos internos innecesarios.

## Ejecución local

Clonar o descargar el repositorio y servir su directorio raíz mediante un servidor HTTP local. Por ejemplo:

```bash
python -m http.server 8000
```

Luego abrir:

```text
http://localhost:8000
```

### Cartografía Mapbox

Por seguridad, el repositorio **no publica un token Mapbox**. Para utilizar la visualización cartográfica debe definirse un token público autorizado mediante `window.EVA_MAPBOX_TOKEN` en el entorno de despliegue. En servicios institucionales el token debe restringirse por dominio y a los permisos mínimos necesarios.

## Datos y reproducibilidad

EVA mantiene versionamiento de motor, datos y metodología, y genera información de procedencia asociada a las corridas y exportaciones. La documentación metodológica incorporada en la aplicación explicita ecuaciones, parámetros, supuestos, limitaciones y criterios de evaluación.

La estructura y gobernanza de las capas publicadas se describen en [`docs/DATOS.md`](docs/DATOS.md). El alcance de las licencias y condiciones de reutilización de los datos se documenta en [`docs/LICENCIAS_DATOS.md`](docs/LICENCIAS_DATOS.md).

EVA es una herramienta de apoyo a la priorización relativa y **no reemplaza** la evaluación social de inversiones ni la ingeniería de detalle de cada proyecto.

## Replicabilidad

La arquitectura fue concebida para facilitar su adaptación por otros gobiernos regionales, municipalidades y organismos públicos que necesiten evaluar carteras territoriales multicriterio. El aspecto transferible no es el ranking particular de Santiago, sino el método para convertir una cartera territorial compleja en escenarios comparables, recalculables y trazables.

Una guía conceptual para su adaptación se encuentra en [`docs/REPLICABILIDAD.md`](docs/REPLICABILIDAD.md).

## Licencia

El **software desarrollado para EVA** se distribuye bajo **Apache License 2.0**. Esto permite su uso, estudio, modificación y redistribución conforme a los términos de la licencia, favoreciendo su adaptación por otras instituciones.

Consulte [`LICENSE`](LICENSE) para el texto completo y [`NOTICE`](NOTICE) para la atribución institucional y el alcance respecto de marcas y otros activos.

La licencia Apache 2.0 **no relicencia automáticamente los datos ni los activos de terceros** incluidos o referenciados por el proyecto. Los logos, emblemas, marcas y demás elementos de identidad institucional del Gobierno Regional Metropolitano de Santiago están excluidos de la licencia de software. Para datos y cartografías, consulte [`docs/LICENCIAS_DATOS.md`](docs/LICENCIAS_DATOS.md).

**Copyright 2026 Gobierno Regional Metropolitano de Santiago.**

## Autoría institucional

**Gobierno Regional Metropolitano de Santiago**  
**División de Infraestructura y Transportes**

Desarrollo interno por el equipo responsable de EVA: **Ariel López y Gabriela Bastías**.
