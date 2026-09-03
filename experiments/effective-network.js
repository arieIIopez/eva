/* ============================================================
   EVA · Paper experiments · effective network state
   ------------------------------------------------------------
   The operational ENGINE filters the existing network by user profile
   before building connectivity and accessibility. Scientific runners must
   expose the same G0 to every experimental module (ENGINE, FRACTAL,
   DEMANDA_MODAL and component diagnostics), otherwise one iteration can
   mix different network states.

   This helper is the shared experimental source of truth for the effective
   existing network used by every paper runner. Changes here must rerun any
   experiment whose outcomes depend on the network state.

   This helper is experimental only: it does not change the public app.
============================================================ */
(function () {
  "use strict";

  const HIGH_STRESS = new Set(["piloto", "zona30", "otro"]);
  const norm = v => String(v == null ? "" : v).trim().toLowerCase();

  function effectiveExisting(existingFC, params) {
    const raw = existingFC || { type: "FeatureCollection", features: [] };
    const profile = (params && params.perfil) || "general";
    if (profile === "experto") {
      return { type: "FeatureCollection", features: [...(raw.features || [])] };
    }
    return {
      type: "FeatureCollection",
      features: (raw.features || []).filter(f => !HIGH_STRESS.has(norm(f && f.properties && f.properties.tipoNorm))),
    };
  }

  function apply(params) {
    if (!window.__EVA_EXISTING_RAW_EXPERIMENT) {
      window.__EVA_EXISTING_RAW_EXPERIMENT = window.existingFC;
    }
    const raw = window.__EVA_EXISTING_RAW_EXPERIMENT || { type: "FeatureCollection", features: [] };
    const effective = effectiveExisting(raw, params || {});
    window.existingFC = effective;
    window.EVA_EXPERIMENT_NETWORK = {
      profile: (params && params.perfil) || "general",
      raw_count: (raw.features || []).length,
      effective_count: (effective.features || []).length,
      excluded_count: (raw.features || []).length - (effective.features || []).length,
      excluded_types: ["piloto", "zona30", "otro"],
      definition: "Matches ENGINE.run profile filter before scientific evaluation",
    };
    console.log(`[paper-network] perfil ${window.EVA_EXPERIMENT_NETWORK.profile}: ${window.EVA_EXPERIMENT_NETWORK.effective_count}/${window.EVA_EXPERIMENT_NETWORK.raw_count} ejes efectivos (${window.EVA_EXPERIMENT_NETWORK.excluded_count} excluidos)`);
    return effective;
  }

  window.EVA_EXPERIMENT_NETWORK_API = { effectiveExisting, apply };
})();
