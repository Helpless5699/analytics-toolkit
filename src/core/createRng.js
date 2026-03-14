function hashSeed(seedInput) {
  const seed = String(seedInput);
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRng(seedInput = 'snake-survivor') {
  let state = hashSeed(seedInput) || 1;

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pickWeighted(pool, rng = Math.random) {
  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = rng() * totalWeight;

  for (const entry of pool) {
    cursor -= entry.weight;
    if (cursor <= 0) {
      return entry.value;
    }
  }

  return pool.at(-1)?.value ?? null;
}

export { createSeededRng, pickWeighted };
