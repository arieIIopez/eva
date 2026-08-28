# Datos

EVA opera sobre capas geoespaciales y tabulares versionadas. Esta publicación incluye las **capas procesadas utilizadas por la versión pública de EVA**, de modo que su estructura pueda ser inspeccionada y la aplicación pueda ser reproducida sin depender de los archivos de trabajo originales.

## Capas incluidas

Las capas se publican directamente en `data/` en formatos JSON o GeoJSON:

- `proyectos_pmc.geojson`: cartera de proyectos candidatos.
- `ciclovias_existentes.geojson`: red ciclable base.
- `od_hex.geojson`: unidades territoriales con población y vectores origen-destino.
- `od_comunas.json`: diccionario de comunas y variables agregadas.
- `educacion_superior.geojson`: sedes y matrícula de educación superior.
- `siniestros.geojson`: siniestralidad ciclista georreferenciada.
- `monumentos.geojson`: puntos de contexto patrimonial.
- `ferias.geojson`: ferias y persas.
- `metro.geojson`: estaciones de Metro.
- `paraderos_bus.json`: paraderos de buses.
- `otras_carteras.geojson`: otras carteras territoriales comparables.
- `parques.geojson`: parques y áreas verdes.
- `manzanas_por_hex.json`: relación entre manzanas censales y hexágonos de análisis.
- `variables_modelo_hex.json`: variables territoriales utilizadas por el modelo de elección modal.
- `comunas_rm.geojson`: límites comunales de la Región Metropolitana.

Los contratos de lectura, índices y transformaciones que utiliza la aplicación pueden revisarse directamente en `src/data.jsx`.

## Datos procesados y fuentes originales

La publicación de una capa procesada no sustituye la documentación de su fuente original. EVA integra y transforma información proveniente de distintas instituciones y procesos públicos; por ello, una reutilización debe revisar por separado la fuente, fecha, licencia, nivel de agregación y condiciones de actualización de cada insumo.

El directorio `uploads/` del entorno de desarrollo **no forma parte de esta distribución pública**. Contiene fuentes originales, archivos intermedios e insumos de trabajo que no son necesarios para revisar el funcionamiento del sistema y que pueden estar sujetos a condiciones de distribución diferentes de las capas procesadas.

## Trazabilidad

EVA mantiene versiones separadas para motor, datos, procesamiento y metodología. Las exportaciones del sistema incorporan información de procedencia y configuración para facilitar la reproducción de una corrida.

La publicación en GitHub incorpora además una verificación previa mediante huellas SHA-256: los componentes extraídos del despliegue público solo se incorporan al repositorio cuando coinciden con la versión fuente previamente revisada.

## Principios para reutilizar los datos

- verificar la procedencia y condiciones de uso de cada fuente;
- mantener identificadores y versiones que permitan trazabilidad;
- documentar transformaciones relevantes;
- no publicar capas restringidas, credenciales ni información personal;
- distinguir datos observados, proxies y resultados modelados;
- volver a validar los supuestos metodológicos cuando EVA se adapte a otro territorio.

Una institución que reutilice EVA puede reemplazar estas capas por sus propios datos siempre que adapte los contratos esperados por `src/data.jsx` y documente las modificaciones realizadas.
