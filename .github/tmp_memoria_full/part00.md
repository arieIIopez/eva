# EVA — Evaluador de Ciclovías Proyectadas

## Memoria técnica, metodológica y científica

**Gobierno Regional Metropolitano de Santiago — División de Infraestructura y Transportes**  
**Release pública:** v3.12.1  
**Motor de cálculo:** v3.12.0  
**Datos:** 2026.08  
**Procesamiento:** 2026.08-comunas-oficiales  
**Metodología:** v2.3.0  
**Fecha de esta memoria:** 28 de agosto de 2026  
**DOI de la versión:** 10.5281/zenodo.22145509

**Autoría institucional:** Gobierno Regional Metropolitano de Santiago  
**Desarrollo técnico:** Ariel López y Gabriela Bastías, División de Infraestructura y Transportes

> **EVA no automatiza la decisión pública. Automatiza una parte sustantiva de la complejidad de cálculo necesaria para que una decisión de inversión pueda ser comparada, discutida, modificada y reevaluada sobre una base común de evidencia.**

---

## Contenido

1. Resumen ejecutivo
2. Problema de decisión y formulación científica
3. Arquitectura del sistema
4. Inventario de datos de la versión 2026.08
5. Modelo de accesibilidad y viabilidad OD
6. Evaluación marginal de un proyecto
7. Parámetros activos de la versión vigente
8. Sistema multicriterio
9. Catálogo científico de criterios
10. Modelo de elección modal y ciclistas inducidos
11. Índice de conectividad dendrítica
12. Escenarios de política pública
13. Priorización secuencial
14. Sensibilidad, robustez y comparación de carteras
15. Control de calidad
16. Reproducibilidad y trazabilidad
17. Validación: alcances diferenciados
18. Aplicación institucional y gobernanza de decisión
19. Limitaciones científicas y técnicas
20. Agenda de investigación y mejora
21. Catálogo compacto de ecuaciones
22. Matriz de trazabilidad entre metodología y código
23. Observaciones de coherencia detectadas
24. Referencias
25. Citación de EVA
26. Conclusiones

---

## Nota de actualización y alcance

Esta memoria describe el comportamiento de la versión pública de EVA correspondiente al release v3.12.1, cuyo motor de cálculo es v3.12.0 y cuya metodología se identifica como v2.3.0. Sustituye, para efectos de descripción técnica vigente, a la memoria de junio de 2026 asociada a EVA v3.5.0, datos 2026.06 y metodología v1.7.0. La memoria anterior debe conservarse como registro histórico de evolución, pero no debe utilizarse como fuente de verdad para parámetros, criterios o funcionalidades actuales.

La actualización es necesaria porque la plataforma incorporó, entre otras capacidades, un modelo de elección modal para estimar ciclistas inducidos, un índice de conectividad dendrítica basado en distancia topológica a una red raíz, nuevos criterios de intermodalidad, factibilidad y parques, perfiles de usuario, umbrales de calidad de la red, límites comunales oficiales, análisis de carteras, controles adicionales de calidad, nuevas exportaciones y una ampliación del conjunto de escenarios de política pública.

Esta memoria se construyó contrastando tres niveles de evidencia: (i) el código fuente publicado de EVA, que se considera fuente primaria para describir el comportamiento computacional; (ii) la documentación metodológica incorporada en la interfaz y las memorias precedentes; y (iii) literatura científica y técnica utilizada para contextualizar las decisiones de modelación. Cuando existe una discrepancia entre un texto histórico y la implementación vigente, este documento privilegia el código ejecutable y explicita la diferencia.

No se presenta EVA como un modelo causal que determine cuál ciclovía “debe” construirse. Se presenta como un **sistema de apoyo a decisiones de cartera**, diseñado para hacer explícitos criterios, supuestos y consecuencias de distintas configuraciones de política pública.

---

# 1. Resumen ejecutivo

EVA es un sistema de apoyo a la decisión pública desarrollado por la División de Infraestructura y Transportes del Gobierno Regional Metropolitano de Santiago para evaluar y priorizar carteras de infraestructura ciclable como componentes de una red dinámica. Su pregunta central no es únicamente *qué proyecto tiene mejores atributos*, sino **qué proyecto conviene incorporar en cada etapa cuando la construcción de un arco modifica la conectividad, accesibilidad y valor marginal de los proyectos restantes**.

La aplicación actual trabaja con una cartera de 133 proyectos que representa aproximadamente 824 km de infraestructura proyectada. La red base publicada contiene 601 ejes y aproximadamente 940 km de infraestructura ciclable existente. La evaluación combina información censal y territorial, flujos origen-destino laborales, educación superior, siniestralidad ciclista, red de transporte público, parques y áreas verdes, prioridades institucionales y atributos de factibilidad. El sistema incorpora 16 dimensiones en su esquema de evaluación, de las cuales 15 son ponderables en el score ordinario y una —Monumentos Nacionales— opera como criterio contextual con peso neutro por defecto.

EVA distingue tres operaciones diferentes. Primero, **evalúa marginalmente** cada proyecto contra el estado vigente de la red. Segundo, **construye rankings multicriterio** bajo diferentes ponderaciones. Tercero, ejecuta un **solver secuencial greedy**, incorporando el proyecto mejor evaluado en cada iteración y reevaluando luego toda la cartera sobre la nueva red. Esto último es esencial: el valor de un proyecto no es constante en el tiempo.

La versión vigente incorpora además dos desarrollos metodológicos que merecen tratamiento científico específico. El primero es un modelo Logit binario, estimado en Biogeme, que aproxima la variación en la probabilidad de utilizar bicicleta para viajes al trabajo y permite estimar ciclistas inducidos por nueva infraestructura. El segundo es un **índice de conectividad dendrítica**, operacionalizado como distancia topológica mínima a una red raíz mediante búsqueda en anchura (BFS), con atenuación geométrica y actualización incremental a medida que se incorporan proyectos.

El sistema mantiene mecanismos de auditabilidad: versionamiento de motor, datos, procesamiento y metodología; hashes deterministas de datos y configuración; exportación de parámetros y ponderaciones; control de calidad; explicabilidad de la composición del score; sensibilidad a pesos y parámetros; y código fuente publicado bajo Apache License 2.0. La versión v3.12.1 se encuentra archivada en Zenodo con DOI `10.5281/zenodo.22145509`.

La aplicación institucional no se limita a un prototipo. EVA fue aplicado sobre la cartera completa de 133 proyectos y se han definido los primeros 19 proyectos de una priorización secuencial cuyo orden restante seguirá reevaluándose conforme evolucione la red. Sobre esos primeros proyectos se han iniciado, según el estado de cada iniciativa, procesos de términos de referencia, licitación, levantamientos topográficos y diseños. La metodología ha sido objeto de revisión técnica externa y la herramienta, sus criterios y su aplicación han sido presentados, discutidos y validados con organizaciones de la sociedad civil vinculadas a la movilidad en la Mesa Santiago Caminable y Pedaleable.

---

# 2. Problema de decisión y formulación científica

## 2.1 De una lista de proyectos a un problema de red

Una cartera de infraestructura suele presentarse administrativamente como un conjunto de proyectos independientes. Para una red de movilidad esa representación es incompleta. Si un arco nuevo conecta dos subredes previamente separadas, modifica la cantidad de orígenes y destinos alcanzables, el beneficio de proyectos vecinos y la utilidad marginal de obras posteriores. Por ello, la función de valor de un proyecto depende del estado de la red al momento de evaluarlo.

Sea una red ciclable efectiva en la iteración $t$:

$$
G_t=(V_t,E_t)
$$

y una cartera de proyectos candidatos $\mathcal{P}_t$. La evaluación de un proyecto $p$ no se expresa como una constante $U(p)$, sino como una función dependiente del estado:

$$
U_t(p)=U(p\mid G_t,\Theta,W,D)
$$

donde $\Theta$ representa parámetros metodológicos, $W$ las ponderaciones de política pública y $D$ los datos vigentes.

Una vez incorporado un proyecto seleccionado $p_t^*$:

$$
G_{t+1}=G_t\cup p_t^*
$$

por lo que, en general:

$$
U_{t+1}(q)\neq U_t(q), \qquad q\in\mathcal{P}_{t+1}.
$$

Esta dependencia es el fundamento del solver secuencial de EVA.

## 2.2 Decisión multicriterio y carácter normativo

La priorización no puede reducirse a una sola variable sin imponer implícitamente una política. Maximizar demanda, cerrar brechas territoriales, mejorar seguridad vial, conectar Metro, reducir costo o expandir continuidad son objetivos legítimos pero no equivalentes. EVA hace visibles esas elecciones mediante ponderaciones explícitas.

La literatura de análisis multicriterio aplicada a transporte muestra precisamente que distintas partes interesadas pueden asignar importancias diferentes a objetivos cuantitativos y cualitativos. EVA adopta una suma ponderada por su transparencia y facilidad de deliberación, no porque suponga que exista un conjunto de pesos “científicamente correcto”. En este sentido, los datos son empíricos; **los pesos son normativos**.

## 2.3 Accesibilidad como relación origen-red-destino

EVA no define accesibilidad únicamente por proximidad a una ciclovía. Una persona puede vivir a pocos metros de infraestructura y, sin embargo, no disponer de una subred que le permita alcanzar su destino. El sistema combina proximidad de origen, continuidad de la red y servicio del destino. Esta aproximación se alinea con la literatura que entiende accesibilidad como potencial de alcanzar oportunidades espacialmente distribuidas y advierte que la elección de indicadores contiene decisiones normativas (Geurs y van Wee, 2004; Páez, Scott y Morency, 2012).

## 2.4 Conectividad, estrés y crecimiento de redes

La conectividad 