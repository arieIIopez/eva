# Control final de pre-envío EDTR — EVA y trayectorias de implementación

Fecha: 2026-09-01

## Manuscrito vivo

Google Doc: `EDTR - Evaluación de trayectorias de implementación en redes de transporte - Método EVA`

ID: `1d4W7EdCoJDnU1rHB7Z4Y9wy-cU4JnjcaswqS5RtZUIs`

Título del manuscrito:

**EVALUACIÓN DE TRAYECTORIAS DE IMPLEMENTACIÓN EN REDES DE TRANSPORTE: MÉTODO EVA PARA LA SECUENCIACIÓN DEPENDIENTE DEL ESTADO**

## Estado de pre-submission

Se completó una revisión editorial, bibliográfica, metodológica y visual contra la plantilla vigente de Revista Estudios de Transporte (EDTR).

Resultado final renderizado:

- **17 páginas**;
- límite EDTR: 20 páginas;
- márgenes verificados: superior 2,49 cm, inferior 2,49 cm, izquierdo 3,00 cm, derecho 2,01 cm;
- resumen español: **188 palabras**;
- abstract inglés: **175 palabras**;
- palabras clave: **6**;
- referencias: **31**;
- sin comentarios en el DOCX;
- sin control de cambios pendiente (`w:ins=0`, `w:del=0`);
- revisión visual completa de las 17 páginas sin clipping, solapamientos ni tablas partidas de manera anómala.

## Correcciones editoriales finales

- Se eliminó un salto de página que generaba una página casi vacía antes de la Figura 1.
- Se compactó la Tabla 4 para mantenerla completa en una página y eliminar la página casi vacía que quedaba antes de la Figura 2.
- Los párrafos de `7.7 Limitaciones` se normalizaron a texto regular; habían heredado negrita del encabezado.
- Se reemplazó `Network Design Problem` en prosa por `problema de diseño de redes (NDP)`.
- Se corrigió la traducción de `low-stress network connectivity` como **conectividad de bajo estrés**.
- Se homogeneizó en español el uso de `ordenamiento` en vez de `ranking` cuando no corresponde conservar la expresión técnica Top-10/Top-30.
- El valor con `δ=0,95` se denomina **valor con descuento por etapa**, no descuento temporal/social, porque EVA determina orden pero no asigna duraciones de obra.

## Estado del arte reforzado

Se incorporó explícitamente la literatura de crecimiento y conectividad de redes ciclables para evitar que la aplicación empírica aparezca desconectada de su literatura sectorial:

- Lowry, Furth y Hadden-Loh (2016): priorización por conectividad de bajo estrés;
- Natera Orozco et al. (2020): estrategias de crecimiento óptimo de redes ciclables;
- Szell et al. (2022): crecimiento de redes urbanas de bicicletas;
- Derrible y Kennedy (2011): teoría de grafos y ciencia de redes aplicada a transporte público.

La novedad del artículo permanece acotada correctamente: EVA no se presenta como el primer método secuencial ni como el primero en reconocer interdependencias, sino como un método trazable para **evaluar trayectorias de implementación de una cartera ya formulada**, reconstruyendo atributos dependientes de `G_t` y diagnosticando interacciones dirigidas que pueden cambiar con el estado.

## Auditoría bibliográfica

La bibliografía se reformateó al estilo EDTR (autores unidos con `y`, año entre paréntesis, revista/volumen/páginas o número de artículo, sin URLs DOI sistemáticas).

Se detectaron y corrigieron tres errores bibliográficos concretos:

- Chen et al. (2025): `151(7)`, artículo `04025049`;
- Chow et al. (2011): `45(8)`, pp. `765-778`;
- Li et al. (2022): `12(10)`, artículo `5268`.

La referencia del software EVA conserva el DOI de Zenodo: `10.5281/zenodo.22145509`.

Se verificó por búsqueda automática que las 31 referencias poseen una mención autor-año compatible en el cuerpo del manuscrito. No quedaron referencias huérfanas detectadas.

## Precauciones metodológicas incorporadas

El manuscrito declara expresamente que:

1. EVA utiliza una heurística voraz y **no garantiza óptimo global**.
2. El experimento controlado compara EVA con el ordenamiento estático, no con todas las permutaciones posibles.
3. `V(π)` es un **índice decisional multicriterio**, no bienestar social monetario.
4. `δ` es descuento por etapa, no tasa social ni calendario temporal.
5. La corrida adaptativa de 30 intervenciones no mantiene un presupuesto común ni el mismo conjunto final; sus diferencias de costo y puntuación son descriptivas y no una prueba de costo-efectividad.
6. Una interacción negativa `I_t(i,j)<0` no significa eliminar automáticamente `j`; indica pérdida de contribución marginal relativa bajo ese estado y obliga a reevaluarlo.
7. Las condiciones exógenas se mantienen constantes para aislar dependencia del estado de red.
8. La validación empírica es ciclable; la transferibilidad a metro, ferrocarril, vialidad u otras redes es **arquitectónica** y requiere nuevas aplicaciones sectoriales.

## Evidencia central preservada

### Experimento controlado — mismo plan final

Mismos 30 proyectos, mismo costo `21.079 MCLP`, mismo estado final `119` componentes:

- valor EVA acumulado: `13,6681 -> 14,0389` (`+2,71%`);
- valor con descuento por etapa: `7,6399 -> 8,0593` (`+5,49%`);
- reducción integrada de componentes: `362 -> 422` (`+16,57%`);
- componentes medios: `128,93 -> 126,93`.

Este sigue siendo el resultado causalmente más limpio del paper: al fijar cartera, costo y estado final, la diferencia observada es atribuible a la trayectoria de implementación.

### Cartera adaptativa

En el horizonte de 30 intervenciones:

- 11 proyectos entran respecto del Top-30 inicial y 11 salen;
- C067: posición inicial 57 -> paso 6;
- C089: posición inicial 85 -> paso 25;
- I14: posición inicial 2 -> no entra en los primeros 30 adaptativos.

La comparación se mantiene deliberadamente como evidencia descriptiva de una política adaptativa.

### Interacciones dependientes del estado

- 3.255 interacciones dirigidas observadas;
- 421 positivas;
- 179 negativas;
- 2.655 nulas bajo la precisión utilizada.

Ejemplo principal:

- C049 inicialmente: score 0,329 / posición 48;
- después de I26 San Pablo: 0,561 / posición 4;
- después de I11 José Joaquín Pérez: 0,302 / posición 64.

Esto sustenta representar la interacción como `I_t(i,j)` y no como un coeficiente bilateral fijo.

## Archivos reproducibles

- Experimento RMC+C/I: `results/paper-experiments/2026-09-01-rmc-eligible/`
- Experimento de trayectorias: `results/paper-plan-trajectory/`
- Resultados detallados: `docs/paper/PLAN_TRAJECTORY_RESULTS_2026-09-01.md`
- Giro conceptual del manuscrito: `docs/paper/MANUSCRIPT_TRAJECTORY_PIVOT_2026-09-01.md`

## Pendientes exclusivamente administrativos

El manuscrito queda científicamente y editorialmente en estado de pre-envío. Antes de cargarlo al sistema editorial sólo deben confirmarse, según corresponda:

- metadatos definitivos de autores y afiliaciones;
- declaración de financiamiento;
- declaración de conflictos de interés;
- contribuciones de autoría si el sistema las solicita;
- archivos/figuras separados si la plataforma editorial los exige durante la carga.
