// The five states a plot can be in, and what they look like.
//
// Keep the thresholds identical to stageOf() in tools/tick.mjs: the tick
// decides, the viewer draws, and a disagreement about what 0.4 means shows up
// as a house that is half built and has no scaffolding.

export function stageOf(plot) {
  if (plot.progress >= 1) return 'dedicated';
  if (plot.progress <= 0) return plot.active ? 'yard' : 'bare';
  if (plot.progress < 0.35) return 'yard';
  if (plot.progress < 0.85) return 'scaffold';
  return 'fitting';
}

// His work, coloured. models/ and blender are stone, docs are timber,
// src/scripts/tools are glass — see materialFor() in tools/tick.mjs.
export const MATERIAL_COLOR = {
  stone: 0x9aa3a9,
  timber: 0x8a6338,
  glass: 0x79b6c4,
};

export const ROLE_COLOR = {
  mason: 0xb5651d,
  carter: 0x3f6b52,
  lamplighter: 0xc9a227,
  chronicler: 0x4a5a7a,
};

export const STAGE_LABEL = {
  bare: 'open plot',
  yard: 'staked out',
  scaffold: 'under scaffolding',
  fitting: 'being fitted out',
  dedicated: 'dedicated',
};
