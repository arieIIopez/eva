# EVA — Evaluador de Ciclovías Proyectadas

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22145509.svg)](https://doi.org/10.5281/zenodo.22145509)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![EVA](https://img.shields.io/badge/EVA-3.12.1-informational.svg)](CHANGELOG.md)
[![Datos](https://img.shields.io/badge/datos-2026.08-informational.svg)](docs/DATOS.md)
[![Metodología](https://img.shields.io/badge/metodolog%C3%ADa-2.3.0-informational.svg)](docs/VALIDACION.md)
[![Publicación verificada](https://github.com/arieIIopez/eva/actions/workflows/sync-public-source.yml/badge.svg)](https://github.com/arieIIopez/eva/actions/workflows/sync-public-source.yml)

**EVA** es una herramienta de apoyo a la decisión desarrollada internamente por la **División de Infraestructura y Transportes del Gobierno Regional Metropolitano de Santiago (GORE RM)** para evaluar y priorizar carteras de infraestructura ciclable como componentes de una red y no como proyectos aislados.

La herramienta nace de un problema operativo de planificación: cuando una red contiene decenas o cientos de proyectos, el orden de ejecución modifica el beneficio de los proyectos siguientes. EVA permite evaluar esa interdependencia, combinar criterios técnicos, territoriales, sociales y de política pública, modificar ponderaciones y recalcular escenarios de forma interactiva.

> **EVA no busca sustituir la decisión pública. Automatiza los cálculos necesarios para que diferentes alternativas puedan ser evaluadas, comparadas y deliberadas utilizando una base común de evidencia.**

## Estado de aplicación

EVA se aplica actualmente a una cartera de **133 proyectos** de la Red Metropolitana de Ciclovías mediante una lógica de **priorización secuencial**: cada proyecto incorporado modifica el estado de la red y, con ello, el valor relativo de los proyectos restantes.

A la fecha se han definido los **primeros 19 proyectos de la secuencia**. La priorización continuará sobre los proyectos restantes a medida que avance la red. Sobre estos primeros proyectos ya se han iniciado, según el estado de cada iniciativa, procesos de **elaboración de términos de referencia, licitación, levantamientos topográficos y diseños**.

El detalle de esta aplicación se documenta en [`docs/IMPACTO.md`](docs/IMPACTO.md).

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

Aplicación EVA: https://ditdatos.gobiernosantiago.cl/evaluador

## Equipo responsable

EVA fue desarrollado internamente por un equipo de la **División de Infraestructura y Transportes del Gobierno Regional Metropolitano de Santiago**, responsable de su estructura metodológica, desarrollo, integración de datos, evaluación y evolución funcional:

- **Ariel López** — ingeniería de transportes, modelación, metodología y desarrollo. [@arieIIopez](https://github.com/arieIIopez)
- **Gabriela Bastías** — geografía, análisis territorial, integración de datos y desarrollo. [@gcbastias](https://github.com/gcbastias)

## Validación y contraste externo

La aplicación de EVA no se ha limitado al ámbito interno. Su metodología y funcionamiento han sido sometidos a **revisión técnica externa desde el ámbito académico**, mientras que sus criterios, aplicación y alcance fueron **presentados, discutidos y validados con organizaciones de la sociedad civil** vinculadas a la movilidad que participan de la Mesa Santiago Pedaleable / Santiago Caminable y Pedaleable.

Estas instancias cumplen funciones diferentes y complementarias: la revisión académica aporta escrutinio metodológico; la sociedad civil aporta conocimiento territorial, pertinencia y contraste sobre la aplicación; y el uso institucional permite verificar su utilidad operacional.

El alcance de cada instancia se explica en [`docs/VALIDACION.md`](docs/VALIDACION.md).

## Referencias públicas y difusión

EVA ha sido presentado y discutido públicamente en instancias de ciudad inteligente, movilidad y participación social. Algunas referencias públicas son:

- **Gobierno de Santiago — Smart City Expo Santiago 2026:** presentación pública de EVA como plataforma para apoyar la priorización de ciclovías.  
  https://www.facebook.com/Gobierno.Santiago/posts/en-smart-city-expo-santiago-expo-santiago-2026-presentamos-eva-la-plataforma-de-/1060331616363665/

- **Gobierno de Santiago — Mesa Santiago Caminable y Pedaleable:** presentación de EVA ante organizaciones de la sociedad civil, especialistas y actores vinculados a movilidad.  
  https://www.gobiernosantiago.cl/2026/08/13/gobierno-de-santiago-realiza-la-tercera-mesa-participativa-santiago-caminable-y-pedaleable/

- **Revista Pedalea — “¿Qué construir primero? EVA: la herramienta que pone orden al rompecabezas de 820 km”:** artículo sobre el problema de priorización de la Red Metropolitana de Ciclovías, las fuentes de información utilizadas y el funcionamiento de EVA.  
  https://revistapedalea.com/que-construir-primero-eva-la-herramienta-que-pone-orden-al-rompecabezas-de-820-km/

## Código y datos publicados

El código fuente se encuentra disponible directamente y puede revisarse archivo por archivo en `src/`. Las capas procesadas utilizadas por la versión publicada se encuentran en `data/`, mientras que los recursos gráficos necesarios para la interfaz están en `assets/`.

```text
.
├── CITATION.cff                        # metadatos de citación del software
├── CHANGELOG.md                        # historial y estado de versiones públicas
├── CONTRIBUTING.md                     # guía para colaborar
├── LICENSE                             # Apache License 2.0 para el software
├── NOTICE                              # autoría institucional y exclusiones
├── SECURITY.md                         # política de reporte de seguridad
├── index.html                          # punto de entrada de la aplicación
├── src/                                # motor, interfaz, metodología y análisis
├── data/                               # capas procesadas utilizadas por EVA
├── assets/                             # recursos gráficos institucionales
├── docs/                               # datos, validación, impacto y replicabilidad
└── .github/
    ├── ISSUE_TEMPLATE/                 # formularios para errores, método y mejoras
    └── workflows/
        └── sync-public-source.yml      # extracción, verificación y auditoría de publicación
```

El directorio de trabajo `uploads/` no se publica: contiene fuentes originales, archivos intermedios e insumos de desarrollo que no son necesarios para auditar ni reutilizar la herramienta.

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/MEMORIA_TECNICA_CIENTIFICA.md`](docs/MEMORIA_TECNICA_CIENTIFICA.md) | **Memoria técnica, metodológica y científica vigente de EVA v3.12.1** |
| [`docs/EVA_Memoria_Tecnica_Metodologica_Cientifica_v3.12.1.pdf`](docs/EVA_Memoria_Tecnica_Metodologica_Cientifica_v3.12.1.pdf) | Versión PDF de la memoria científica, generada reproduciblemente desde el Markdown |
| [`docs/METODO_DENDRITICO.md`](docs/METODO_DENDRITICO.md) | Formulación científica detallada del índice de conectividad dendrítica |
| [`docs/DATOS.md`](docs/DATOS.md) | Capas procesadas, estructura y procedencia |
| [`docs/LICENCIAS_DATOS.md`](docs/LICENCIAS_DATOS.md) | Condiciones de uso y licencias de datos |
| [`docs/VALIDACION.md`](docs/VALIDACION.md) | Verificación computacional, revisión académica, validación social y aplicación institucional |
| [`docs/IMPACTO.md`](docs/IMPACTO.md) | Impacto sobre el proceso de planificación y estado de aplicación |
| [`docs/REPLICABILIDAD.md`](docs/REPLICABILIDAD.md) | Principios para adaptar EVA a otros territorios e instituciones |
| [`SECURITY.md`](SECURITY.md) | Política pública de seguridad y reporte de vulnerabilidades |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Cómo reportar errores, proponer cambios y contribuir |
| [`CHANGELOG.md`](CHANGELOG.md) | Evolución de las versiones públicas |

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

EVA mantiene versionamiento de motor, datos, procesamiento y metodología, y genera información de procedencia asociada a las corridas y exportaciones. La documentación metodológica incorporada en la aplicación explicita ecuaciones, parámetros, supuestos, limitaciones y criterios de evaluación.

La versión pública actual corresponde a **release 3.12.1**, con **motor 3.12.0**, **datos 2026.08** y **metodología 2.3.0**. Consulte [`CHANGELOG.md`](CHANGELOG.md) para el historial de versiones.

EVA es una herramienta de apoyo a la priorización relativa y **no reemplaza** la evaluación social de inversiones ni la ingeniería de detalle de cada proyecto.

## Replicabilidad

La arquitectura fue concebida para facilitar su adaptación por otros gobiernos regionales, municipalidades y organismos públicos que necesiten evaluar carteras territoriales multicriterio. El aspecto transferible no es el ranking particular de Santiago, sino el método para convertir una cartera territorial compleja en escenarios comparables, recalculables y trazables.

Una guía conceptual para su adaptación se encuentra en [`docs/REPLICABILIDAD.md`](docs/REPLICABILIDAD.md).

Las contribuciones, observaciones metodológicas y experiencias de adaptación pueden proponerse mediante los formularios de Issues descritos en [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Cómo citar EVA

La versión `v3.12.1` se encuentra archivada en **Zenodo** y cuenta con un DOI persistente. Para reproducibilidad, se recomienda citar la versión específica utilizada:

> Gobierno Regional Metropolitano de Santiago, López, A., & Bastías, G. (2026). *EVA — Evaluador de Ciclovías Proyectadas* (Version v3.12.1) [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.22145509

**DOI de esta versión:** [`10.5281/zenodo.22145509`](https://doi.org/10.5281/zenodo.22145509)

`CITATION.cff` reconoce al **Gobierno Regional Metropolitano de Santiago** como primer autor institucional, seguido por **Ariel López** y **Gabriela Bastías** como autores personales del software. La **División de Infraestructura y Transportes** se mantiene como unidad de afiliación institucional de ambos autores personales y como unidad responsable del desarrollo dentro del GORE RM.

El repositorio incluye [`CITATION.cff`](CITATION.cff), por lo que GitHub puede generar automáticamente una referencia desde la opción **“Cite this repository”**.

## Licencia

El **software desarrollado para EVA** se distribuye bajo **Apache License 2.0**. Esto permite su uso, estudio, modificación y redistribución conforme a los términos de la licencia, favoreciendo su adaptación por otras instituciones.

Consulte [`LICENSE`](LICENSE) para el texto completo y [`NOTICE`](NOTICE) para la atribución institucional y el alcance respecto de marcas y otros activos.

La licencia Apache 2.0 **no relicencia automáticamente los datos ni los activos de terceros** incluidos o referenciados por el proyecto. Los logos, emblemas, marcas y demás elementos de identidad institucional del Gobierno Regional Metropolitano de Santiago están excluidos de la licencia de software. Para datos y cartografías, consulte [`docs/LICENCIAS_DATOS.md`](docs/LICENCIAS_DATOS.md).

**Copyright 2026 Gobierno Regional Metropolitano de Santiago.**

## Autoría institucional

**Gobierno Regional Metropolitano de Santiago**  
**División de Infraestructura y Transportes**

Desarrollo interno por el equipo responsable de EVA: **Ariel López y Gabriela Bastías**.