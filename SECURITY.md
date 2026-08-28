# Política de seguridad

La seguridad del repositorio público de EVA se basa en minimizar la exposición de credenciales, configuraciones institucionales y datos que no son necesarios para auditar o reutilizar la herramienta.

## Versiones cubiertas

La política se aplica a la versión pública vigente de la rama `main` y a los componentes publicados mediante el workflow de sincronización del repositorio.

## Cómo reportar una vulnerabilidad

Si detecta un problema de seguridad que **no contiene información sensible**, puede abrir un Issue indicando claramente que se trata de un reporte de seguridad.

Si el reporte incluye o podría revelar credenciales, tokens, claves, configuraciones internas, datos personales u otra información sensible, **no publique los detalles en un Issue, Pull Request o comentario público**. Utilice los canales institucionales oficiales del Gobierno Regional Metropolitano de Santiago e indique que el reporte corresponde al proyecto EVA.

## Credenciales y servicios externos

El repositorio no debe contener tokens privados ni secretos de despliegue. En particular, la visualización cartográfica debe recibir el token autorizado de Mapbox desde el entorno de despliegue mediante `window.EVA_MAPBOX_TOKEN` y no desde el código fuente publicado.

Los tokens públicos utilizados en entornos institucionales deben restringirse por dominio y a los permisos mínimos necesarios.

## Datos

No deben incorporarse al repositorio público bases con datos personales, secretos, credenciales, información restringida o archivos cuya licencia no permita su publicación.

Las fuentes y condiciones de reutilización de las capas publicadas se documentan en `docs/DATOS.md` y `docs/LICENCIAS_DATOS.md`.

## Proceso de publicación

El workflow de publicación verifica la identidad de los componentes mediante SHA-256, retira configuraciones propias del despliegue institucional, comprueba la ausencia de tokens cartográficos embebidos y valida la estructura de las capas procesadas antes de incorporarlas al repositorio.

Para detalles complementarios consulte `docs/SEGURIDAD.md`.
