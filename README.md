# EVA — Evaluador de Ciclovías Proyectadas

**EVA** es una herramienta de apoyo a la decisión desarrollada internamente por la **División de Infraestructura y Transportes del Gobierno Regional Metropolitano de Santiago (GORE RM)** para evaluar y priorizar carteras de infraestructura ciclable como componentes de una red y no como proyectos aislados.

La herramienta nace de un problema operativo de planificación: cuando una red contiene decenas o cientos de proyectos, el orden de ejecución modifica el beneficio de los proyectos siguientes. EVA permite evaluar esa interdependencia, combinar criterios técnicos, territoriales, sociales y de política pública, modificar ponderaciones y recalcular escenarios de forma interactiva.

> EVA no busca sustituir la decisión pública. Automatiza los cálculos necesarios para que diferentes alternativas puedan ser evaluadas, comparadas y deliberadas utilizando una base común de evidencia.

## Qué permite hacer

- Evaluar una cartera completa de ciclovías respecto de la red existente.
- Aplicar un modelo multicriterio con ponderaciones ajustables.
- Recalcular resultados al modificar criterios, parámetros o proyectos incorporados a la red.
- Ejecutar una priorización secuencial que reevalúa la cartera después de cada incorporación.
- Explorar escenarios y sensibilidad de la priorización.
- Analizar conectividad, accesibilidad, equidad territorial, seguridad vial, intermodalidad y otros atributos.
- Incorporar un modelo de elección modal logit para estimar ciclistas inducidos.
- Comparar proyectos y carteras.
- Ejecutar controles de calidad de datos.
- Exportar resultados con información de procedencia, versiones y configuración para favorecer la reproducibilidad.

## Contexto institucional

EVA forma parte del ecosistema de herramientas **DITDATOS**, desarrollado por la División de Infraestructura y Transportes para fortalecer capacidades internas de planificación y diseño de movilidad mediante datos, análisis geoespacial y herramientas digitales.

Sitio institucional: https://ditdatos.gobiernosantiago.cl/

## Estructura del repositorio

```text
.
├── index.html              # aplicación web
├── src/                    # interfaz, motor, metodología y análisis
├── data/                   # capas procesadas utilizadas por la aplicación
├── assets/                 # recursos gráficos institucionales
├── screenshots/            # capturas de referencia
└── docs/                   # documentación para reutilización
```

## Ejecución local

La versión fuente utiliza archivos estáticos y puede servirse con cualquier servidor HTTP local. Por ejemplo:

```bash
python -m http.server 8000
```

Luego abrir `http://localhost:8000`.

### Cartografía Mapbox

Por seguridad, este repositorio **no publica un token Mapbox**. Antes de iniciar la aplicación debe definirse un token público autorizado:

```html
<script>
  window.EVA_MAPBOX_TOKEN = "TU_TOKEN_PUBLICO_MAPBOX";
</script>
```

Ese bloque puede incorporarse antes de cargar los scripts de EVA. En despliegues institucionales el token debe restringirse por dominio y a los permisos mínimos necesarios.

## Datos y reproducibilidad

Las capas incluidas en `data/` corresponden a insumos procesados utilizados por la versión publicada. EVA mantiene versionamiento de motor, datos y metodología, y genera información de procedencia asociada a las corridas y exportaciones.

La documentación metodológica disponible dentro de la propia aplicación describe ecuaciones, supuestos, parámetros y limitaciones. EVA es una herramienta de apoyo a la priorización relativa y **no reemplaza** la evaluación social de inversiones ni la ingeniería de detalle de cada proyecto.

## Reutilización

La arquitectura fue concebida para facilitar su adaptación por otros gobiernos regionales, municipalidades y organismos públicos que necesiten evaluar carteras territoriales multicriterio. La publicación del código busca favorecer auditoría, aprendizaje y transferencia institucional.

La licencia de reutilización del código será formalizada por el Gobierno Regional Metropolitano de Santiago. Hasta que exista un archivo `LICENSE`, la publicación del código no debe interpretarse como una concesión automática de derechos más allá de los establecidos por la legislación aplicable.

## Autoría institucional

**Gobierno Regional Metropolitano de Santiago**  
División de Infraestructura y Transportes

Desarrollo interno por el equipo de planificación y análisis territorial de la División.
