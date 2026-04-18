import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function loadJson(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  return JSON.parse(readFileSync(url, "utf-8"));
}

export function buildChunks() {
  const chunks = [];

  const elements = loadJson("./energy-elements.json").energy_elements;
  for (const [key, val] of Object.entries(elements)) {
    const label = key.replace("_", "(") + ")";
    chunks.push({
      id: `element-${key}`,
      source: "energy-elements.json",
      category: "energy_element",
      text: [
        `${label}的核心特质：${val.core_trait}。`,
        `过旺症状：${val.excess_symptoms.join("、")}。`,
        `不足症状：${val.lacking_symptoms.join("、")}。`,
        `现代隐喻：${val.modern_metaphor}`,
      ].join(""),
    });
  }

  const prescriptions = loadJson("./crystal-prescriptions.json").crystal_prescriptions;
  for (const [key, val] of Object.entries(prescriptions)) {
    const element = key.replace("need_", "");
    chunks.push({
      id: `prescription-${element}`,
      source: "crystal-prescriptions.json",
      category: "crystal_prescription",
      text: `缺${element}时推荐晶石：${val.crystals.join("、")}。疗愈逻辑：${val.healing_logic}`,
    });
  }

  const geo = loadJson("./geographic-energy-weights.json").geographic_energy_weights;
  for (const [key, val] of Object.entries(geo)) {
    const label = key.replace("_", "(") + ")";
    let text = `${label}地区包括：${val.regions.join("、")}。潜在能量：${val.latent_energy}`;
    if (val.healing_adjustment) {
      text += `疗愈调整：${val.healing_adjustment}`;
    }
    chunks.push({
      id: `geo-${key}`,
      source: "geographic-energy-weights.json",
      category: "geographic_energy",
      text,
    });
  }

  return chunks;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const chunks = buildChunks();
  console.log(`Built ${chunks.length} chunks:\n`);
  for (const c of chunks) {
    console.log(`[${c.id}] (${c.category})`);
    console.log(`  ${c.text.slice(0, 80)}…\n`);
  }
}
