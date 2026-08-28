# EVA v3.12.0

Fecha de publicación: 2026-08-28

Esta versión consolida la publicación pública y auditable de EVA — Evaluador de Ciclovías Proyectadas, herramienta de apoyo a la decisión desarrollada por la División de Infraestructura y Transportes del Gobierno Regional Metropolitano de Santiago.

## Identificación de la versión

- Motor: `3.12.0`
- Datos: `2026.08`
- Procesamiento de datos: `2026.08-comunas-oficiales`
- Metodología: `2.3.0`
- Compilación de referencia: `2026-08-07`
- Licencia del software: Apache License 2.0

## Alcance funcional

EVA permite evaluar y priorizar secuencialmente carteras de infraestructura ciclable considerando efectos de red, criterios multicriterio, accesibilidad, conectividad, equidad territorial, seguridad vial, intermodalidad, factibilidad, costos y generación potencial de viajes.

La versión incorpora:

- priorización secuencial con reevaluación de la cartera después de cada incorporación;
- escenarios de política pública y sensibilidad de ponderaciones;
- sensibilidad paramétrica;
- análisis de contribución por criterio y explicabilidad del puntaje;
- control de calidad de datos;
- trazabilidad de versiones, configuración y procedencia;
- exportaciones reproducibles;
- comparación de proyectos y carteras;
- modelo de elección modal Logit para estimación de ciclistas inducidos;
- análisis de conectividad fractal y continuidad de red.

## Datos y cartera

La versión pública trabaja sobre una cartera de 133 proyectos de ciclovías proyectadas y una red ciclable existente de aproximadamente 940 km, junto con capas territoriales y de movilidad procesadas para la Región Metropolitana de Santiago.

Las condiciones de reutilización de las capas se documentan separadamente en `docs/LICENCIAS_DATOS.md`.

## Aplicación institucional

EVA se utiliza como apoyo al proceso de priorización secuencial de la Red Metropolitana de Ciclovías. Los primeros 19 proyectos de la secuencia ya han dado origen, según el estado de cada iniciativa, a procesos de elaboración de términos de referencia, licitación, levantamientos topográficos y desarrollo de diseños. La priorización continuará reevaluándose a medida que avance la red y cambie su estado base.

## Validación y contraste externo

El desarrollo ha incorporado revisión técnica académica, validación computacional y contraste con organizaciones de la sociedad civil vinculadas a la movilidad que participan de la Mesa Santiago Pedaleable. El detalle se encuentra en `docs/VALIDACION.md`.

## Publicación y reproducibilidad

El repositorio publica código fuente, datos procesados y documentación navegable. El proceso de publicación verifica la identidad de los componentes mediante huellas SHA-256 y retira configuraciones sensibles propias del despliegue institucional.

Para citar esta versión, utilice el archivo `CITATION.cff` del repositorio.
