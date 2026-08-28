# Datos

EVA fue desarrollado para operar sobre capas geoespaciales y tabulares versionadas. El código fuente público conserva los nombres y contratos de datos que utiliza la aplicación.

## Nota sobre esta publicación

Esta publicación incluye las capas procesadas que utiliza la versión distribuida de EVA. Para reducir el peso del repositorio, se almacenan comprimidas como `*.gz` y la aplicación las descomprime en el navegador mediante `DecompressionStream`.

Una implementación nueva puede reemplazar estas capas por sus propios datos, manteniendo los esquemas esperados por `src/data.jsx`. Toda reutilización debe revisar por separado el origen, licencia, actualización y gobernanza de los datos que incorpore.

## Capas esperadas por la versión actual

- `proyectos_pmc.geojson.gz`: cartera de proyectos candidatos.
- `ciclovias_existentes.geojson.gz`: red ciclable base.
- `od_hex.geojson.gz`: unidades territoriales con población y vectores OD.
- `od_comunas.json.gz`: diccionario de comunas y variables agregadas.
- `educacion_superior.geojson.gz`: sedes y matrícula de educación superior.
- `siniestros.geojson.gz`: siniestralidad ciclista georreferenciada.
- `monumentos.geojson.gz`: puntos de contexto patrimonial.
- `ferias.geojson.gz`: ferias y persas.
- `metro.geojson.gz`: estaciones de Metro.
- `paraderos_bus.json.gz`: paraderos de buses.
- `otras_carteras.geojson.gz`: otras carteras territoriales comparables.
- `parques.geojson.gz`: parques y áreas verdes.
- `manzanas_por_hex.json.gz`: relación manzana–hexágono.
- `variables_modelo_hex.json.gz`: variables territoriales del modelo de elección modal.
- `comunas_rm.geojson.gz`: límites comunales.

## Principios de publicación

- utilizar datos públicos o derivados destinados a análisis institucional;
- mantener identificadores y versiones que permitan trazabilidad;
- no publicar capas restringidas ni credenciales;
- documentar transformaciones relevantes;
- distinguir datos observados, proxies y resultados modelados.

El directorio `uploads/` del entorno de desarrollo **no forma parte de esta distribución pública** porque contiene insumos de trabajo, archivos intermedios y fuentes originales que no son necesarios para auditar el código de EVA.
