# Seguridad y despliegue

## Credenciales

El repositorio público no incorpora credenciales privadas ni tokens de acceso. En particular, el token público de Mapbox se obtiene en tiempo de ejecución desde `window.EVA_MAPBOX_TOKEN`.

En producción institucional cualquier token público debe restringirse por dominio y permisos mínimos.

## Datos

Antes de incorporar una nueva capa al repositorio público debe verificarse su licencia, procedencia, nivel de agregación y ausencia de información personal o de uso restringido.
