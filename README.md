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

## Distribución pública del código

El paquete público saneado del código fuente está disponible en:

`dist/eva-code-public.zip`

El paquete contiene la aplicación, estilos y código del motor y de la interfaz. Antes de publicarlo se retiraron credenciales de despliegue, contactos asociados a capas restringidas e insumos internos que no son necesarios para auditar o reutilizar la herramienta.

El directorio de trabajo `uploads/` no se publica: contiene fuentes originales, archivos intermedios e insumos de desarrollo. La estructura y gobernanza de las capas utilizadas por EVA se documentan en `docs/DATOS.md`.

## Ejecución local

1. Descargar y descomprimir `dist/eva-code-public.zip`.
2. Incorporar las capas de datos compatibles con los contratos descritos en `docs/DATOS.md`.
3. Configurar un token público de Mapbox autorizado mediante `window.EVA_MAPBOX_TOKEN` si se desea utilizar la visualización cartográfica.
4. Servir la carpeta con un servidor HTTP local, por ejemplo:

```bash
python -m http.server 8000
```

Luego abrir `http://localhost:8000`.

### Cartografía Mapbox

Por seguridad, este repositorio **no publica un token Mapbox**. En despliegues institucionales el token debe restringirse por dominio y a los permisos mínimos necesarios.

## Datos y reproducibilidad

EVA mantiene versionamiento de motor, datos y metodología, y genera información de procedencia asociada a las corridas y exportaciones. La documentación metodológica disponible dentro de la propia aplicación describe ecuaciones, supuestos, parámetros y limitaciones.

EVA es una herramienta de apoyo a la priorización relativa y **no reemplaza** la evaluación social de inversiones ni la ingeniería de detalle de cada proyecto.

## Reutilización

La arquitectura fue concebida para facilitar su adaptación por otros gobiernos regionales, municipalidades y organismos públicos que necesiten evaluar carteras territoriales multicriterio. El aspecto transferible no es el ranking particular de Santiago, sino el método para convertir una cartera territorial compleja en escenarios comparables, recalculables y trazables.

La licencia de reutilización del código será formalizada por el Gobierno Regional Metropolitano de Santiago. Hasta que exista un archivo `LICENSE`, la publicación del código no debe interpretarse como una concesión automática de derechos más allá de los establecidos por la legislación aplicable.

## Autoría institucional

**Gobierno Regional Metropolitano de Santiago**  
División de Infraestructura y Transportes

Desarrollo interno por el equipo de planificación y análisis territorial de la División.
