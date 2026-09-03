/* ============================================================
   EVA · Escenarios de ponderación predefinidos + explicación de score
   ------------------------------------------------------------
   Criterios (16): poblacion, costoOD, oportunidades, equidad,
   continuidad, demanda, ciclistas, fractal, estudiantes,
   prioridadGore, costoInv, seguridad, monumentos, intermodal,
   factibilidad, parques.

   REVISIÓN TRANSVERSAL: los escenarios se crearon en distintas etapas
   de la plataforma, por lo que los más antiguos dejaban en 0 criterios
   que aún no existían (seguridad, parques, factibilidad, ciclistas
   inducidos, conectividad fractal) — omisión histórica, no una decisión
   metodológica. Todos los escenarios se homologaron sobre un PISO DE
   CONTEXTO común (todo criterio presente con peso bajo pero no nulo),
   sobre el cual se eleva el foco temático de cada escenario. Excepción:
   «Ponderación RMC» conserva los pesos entregados por la contraparte.
   «monumentos» permanece en 0 en todos: es un criterio informativo,
   excluido del total en evaExplainScore.

   NOTA DE COMPATIBILIDAD: `costoOD` es un identificador histórico. En el
   motor vigente representa tasa de habilitación OD discretizada, no costo
   generalizado de viaje. Se conserva la clave para no romper escenarios.
============================================================ */

window.EVA_SCENARIOS = [
  {
    key: "ponderacion_rmc",
    nombre: "Ponderación RMC",
    desc: "Escenario de ponderación multicriterio provisto para la revisión RMC: equilibra población marginal, ciclistas inducidos y prioridad GORE con atractor de parques y continuidad de red.",
    weights: { poblacion: 28, costoOD: 18, oportunidades: 14, equidad: 18, continuidad: 19, demanda: 13, ciclistas: 28, fractal: 30, estudiantes: 12, prioridadGore: 24, costoInv: 15, seguridad: 5, monumentos: 0, intermodal: 9, factibilidad: 15, parques: 20 },
  },
  {
    key: "balanceado",
    nombre: "Balanceado",
    desc: "Reparto equilibrado entre cobertura poblacional, demanda, equidad, continuidad de red e intermodalidad bici-metro. Escenario por defecto del sistema.",
    weights: { poblacion: 14, costoOD: 10, oportunidades: 6, equidad: 12, continuidad: 12, demanda: 12, ciclistas: 10, fractal: 6, estudiantes: 5, prioridadGore: 10, costoInv: 6, seguridad: 5, monumentos: 0, intermodal: 8, factibilidad: 8, parques: 6 },
  },
  {
    key: "equidad",
    nombre: "Equidad territorial",
    desc: "Prioriza proyectos que benefician comunas con menor cobertura ciclable y mayor prioridad de inversión regional. Útil para cierre de brechas.",
    weights: { poblacion: 16, costoOD: 8, oportunidades: 6, equidad: 40, continuidad: 10, demanda: 10, ciclistas: 8, fractal: 6, estudiantes: 5, prioridadGore: 22, costoInv: 6, seguridad: 5, monumentos: 0, intermodal: 5, factibilidad: 5, parques: 4 },
  },
  {
    key: "demanda",
    nombre: "Demanda potencial",
    desc: "Prioriza viajes OD habilitados y corredores que conectan pares origen-destino de alto flujo laboral.",
    weights: { poblacion: 14, costoOD: 22, oportunidades: 6, equidad: 10, continuidad: 10, demanda: 35, ciclistas: 14, fractal: 6, estudiantes: 5, prioridadGore: 8, costoInv: 6, seguridad: 5, monumentos: 0, intermodal: 5, factibilidad: 5, parques: 4 },
  },
  {
    key: "ciclistas_biogeme",
    nombre: "Ciclistas inducidos (Biogeme)",
    desc: "Prioriza los nuevos ciclistas diarios estimados por el modelo de elección modal «ciclo_todo_chile 41» (logit binario bici vs. no-bici estimado con Biogeme sobre 117.072 manzanas censales): concentra el peso en el ΔP(bici) que cada proyecto induce vía km de ciclovía a 500 m del origen. Se acompaña de demanda OD habilitada y continuidad de red para consolidar corredores donde el cambio modal es alcanzable.",
    weights: { poblacion: 12, costoOD: 8, oportunidades: 6, equidad: 10, continuidad: 12, demanda: 16, ciclistas: 45, fractal: 6, estudiantes: 5, prioridadGore: 8, costoInv: 6, seguridad: 5, monumentos: 0, intermodal: 8, factibilidad: 5, parques: 4 },
  },
  {
    key: "fractal_alameda",
    nombre: "Red dendrítica Alameda (fractal)",
    desc: "Hace crecer la red como afluentes de un río cuya raíz es la Avenida Alameda (ciclovía existente + tramo 3 proyectado): máxima prioridad a los ejes que tocan o se aproximan (≤100 m) a la Alameda, prioridad media a los que tocan a esos, y así sucesivamente con atenuación geométrica (Score = 100 · 0.5^(grado−1); aislados = 0). Es INCREMENTAL: cada eje priorizado se funde con la raíz y sus vecinos suben de orden en el siguiente recálculo. Se acompaña de continuidad y demanda para desempatar dentro de cada orden.",
    weights: { poblacion: 12, costoOD: 8, oportunidades: 6, equidad: 10, continuidad: 18, demanda: 12, ciclistas: 10, fractal: 45, estudiantes: 5, prioridadGore: 8, costoInv: 6, seguridad: 5, monumentos: 0, intermodal: 5, factibilidad: 5, parques: 4 },
  },
  {
    key: "continuidad",
    nombre: "Continuidad de red",
    desc: "Prioriza proyectos que conectan subredes hoy inconexas, consolidando un sistema continuo por sobre tramos aislados.",
    weights: { poblacion: 12, costoOD: 12, oportunidades: 6, equidad: 10, continuidad: 40, demanda: 14, ciclistas: 8, fractal: 14, estudiantes: 5, prioridadGore: 8, costoInv: 6, seguridad: 5, monumentos: 0, intermodal: 5, factibilidad: 5, parques: 4 },
  },
  {
    key: "eficiencia",
    nombre: "Eficiencia presupuestaria",
    desc: "Favorece simultáneamente proyectos con alto beneficio, menor costo proxy y mayor factibilidad espacial aproximada por el número de pistas. No calcula una razón beneficio/costo. Útil para explorar carteras con restricción presupuestaria.",
    weights: { poblacion: 18, costoOD: 8, oportunidades: 6, equidad: 10, continuidad: 10, demanda: 12, ciclistas: 8, fractal: 6, estudiantes: 5, prioridadGore: 8, costoInv: 35, seguridad: 5, monumentos: 0, intermodal: 5, factibilidad: 20, parques: 4 },
  },
  {
    key: "educacion",
    nombre: "Educación superior",
    desc: "Pondera fuertemente la generación de viajes estudiantiles y el acceso a sedes de educación superior cercanas.",
    weights: { poblacion: 14, costoOD: 8, oportunidades: 6, equidad: 10, continuidad: 10, demanda: 12, ciclistas: 8, fractal: 6, estudiantes: 40, prioridadGore: 8, costoInv: 6, seguridad: 5, monumentos: 0, intermodal: 8, factibilidad: 5, parques: 4 },
  },
  {
    key: "integracion",
    nombre: "Integración metropolitana",
    desc: "Combina demanda OD intercomunal, continuidad de red, intermodalidad con Metro y prioridad regional para priorizar conectividad entre comunas.",
    weights: { poblacion: 12, costoOD: 20, oportunidades: 6, equidad: 14, continuidad: 25, demanda: 18, ciclistas: 8, fractal: 10, estudiantes: 5, prioridadGore: 18, costoInv: 6, seguridad: 5, monumentos: 0, intermodal: 15, factibilidad: 5, parques: 4 },
  },
  {
    key: "seguridad",
    nombre: "Seguridad vial",
    desc: "Prioriza proyectos que intervienen corredores con alta siniestralidad ciclista PREVENIBLE (CONASET 2020–2024): cada siniestro se pondera por severidad, por su tratabilidad con infraestructura segregada (un choque por alcance en tramo recto cuenta más que uno por ebriedad en un cruce) y por cercanía a la traza. Acompaña la seguridad con continuidad de red, equidad y cobertura poblacional.",
    weights: { poblacion: 14, costoOD: 8, oportunidades: 6, equidad: 12, continuidad: 14, demanda: 10, ciclistas: 8, fractal: 6, estudiantes: 5, prioridadGore: 8, costoInv: 6, seguridad: 35, monumentos: 0, intermodal: 5, factibilidad: 5, parques: 4 },
  },
  {
    key: "intermodal",
    nombre: "Intermodalidad bici-metro",
    desc: "Prioriza ejes que conectan estaciones de Metro, potenciando el viaje combinado bicicleta+metro (primer/último kilómetro). Acompaña la intermodalidad con demanda OD, continuidad de red y cobertura poblacional.",
    weights: { poblacion: 12, costoOD: 12, oportunidades: 6, equidad: 10, continuidad: 14, demanda: 14, ciclistas: 8, fractal: 6, estudiantes: 5, prioridadGore: 8, costoInv: 6, seguridad: 5, monumentos: 0, intermodal: 35, factibilidad: 5, parques: 4 },
  },
];

window.EVA_SCENARIO_MAP = Object.fromEntries(window.EVA_SCENARIOS.map(s => [s.key, s]));

/* ------------------------------------------------------------
   Explicación legible del score de un proyecto.
   Recibe el proyecto enriquecido (con .norm y métricas brutas),
   los pesos efectivos y el ranking. Devuelve objeto estructurado
   + texto, para ficha y exportación.
------------------------------------------------------------ */
window.evaExplainScore = function (p, weights, ranking) {
  const labels = {
    poblacion: "población marginal",
    costoOD: "tasa de habilitación OD",
    oportunidades: "hexes beneficiados",
    equidad: "equidad territorial",
    continuidad: "continuidad de red",
    demanda: "volumen de demanda OD habilitada",
    ciclistas: "ciclistas inducidos (logit Biogeme)",
    fractal: "conectividad fractal (red dendrítica Alameda)",
    estudiantes: "generación estudiantil",
    prioridadGore: "prioridad de inversión GORE",
    seguridad: "siniestralidad prevenible intervenida",
    intermodal: "intermodalidad bici-metro",
    factibilidad: "factibilidad espacial (proxy: número de pistas)",
    parques: "atractor de parques (por tamaño)",
    costoInv: "eficiencia de costo (inverso normalizado)",
  };
  const totalW = (Object.values(weights).reduce((a, b) => a + b, 0) - (weights.monumentos || 0)) || 1;
  // aporte de cada criterio al score = w_i * norm_i / totalW
  const contribs = Object.keys(labels).map(k => {
    const w = weights[k] || 0;
    const norm = (p.norm && p.norm[k] != null) ? p.norm[k] : 0;
    return { k, label: labels[k], w, norm: +norm.toFixed(3), aporte: (w * norm) / totalW };
  }).sort((a, b) => b.aporte - a.aporte);

  const sumAporte = contribs.reduce((a, c) => a + c.aporte, 0) || 1;
  const fortalezas = contribs.filter(c => c.w > 0 && c.norm >= 0.6).slice(0, 3);
  const debilidades = contribs.filter(c => c.w > 0 && c.norm <= 0.3).slice(-3).reverse();

  // criterio dominante y si depende fuertemente de uno solo
  const top = contribs[0];
  const dominante = top && (top.aporte / sumAporte) > 0.45;

  const frases = [];
  if (p.componentesUnidos > 0) frases.push(`conecta ${p.componentesUnidos} subred${p.componentesUnidos > 1 ? "es" : ""} hoy separada${p.componentesUnidos > 1 ? "s" : ""}`);
  if ((p.demandaHabilitada || 0) > 0) frases.push(`habilita ${Math.round(p.demandaHabilitada).toLocaleString("es-CL")} viajes OD/día`);
  if ((p.poblacion || 0) > 0) frases.push(`beneficia ${(p.poblacion).toLocaleString("es-CL")} personas de forma marginal`);

  let texto = `${p.nombre} ocupa la posición ${p.rank != null ? p.rank : "—"} del ranking. `;
  if (frases.length) texto += `Su prioridad se explica porque ${frases.join(", ")}. `;
  if (top) texto += `El criterio que más aporta a su puntaje es ${top.label} (${(top.aporte / sumAporte * 100).toFixed(0)}% del score). `;
  if (dominante) texto += `Su posición depende fuertemente de un solo criterio: si baja el peso de ${top.label}, su ranking puede caer. `;
  if (debilidades.length) texto += `Su desempeño es más débil en ${debilidades.map(d => d.label).join(" y ")}.`;

  return {
    score_total: +(p.score || 0).toFixed(4),
    posicion: p.rank,
    dominante_en: top ? top.k : null,
    depende_de_un_criterio: !!dominante,
    aportes: contribs.map(c => ({ criterio: c.k, peso: c.w, normalizado: c.norm, aporte_score: +c.aporte.toFixed(4), pct_score: +(c.aporte / sumAporte * 100).toFixed(1) })),
    fortalezas: fortalezas.map(f => f.label),
    debilidades: debilidades.map(d => d.label),
    explicacion: texto.trim(),
  };
};
