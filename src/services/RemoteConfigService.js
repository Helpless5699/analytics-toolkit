import { getPhaseOrder } from '../core/validators.js';
import { pickWeighted } from '../core/createRng.js';

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

class RemoteConfigService {
  constructor({ phase, profileId, liveOpsConfig, experimentConfig }) {
    this.phase = phase;
    this.profileId = profileId;
    this.liveOpsConfig = liveOpsConfig;
    this.experimentConfig = experimentConfig;
  }

  getGrowthGoals() {
    return this.liveOpsConfig.growthGoals;
  }

  getActiveContent(phase = this.phase) {
    return this.liveOpsConfig.contentPhases[phase];
  }

  isEnabled(flagId) {
    const flag = this.liveOpsConfig.remoteFlags.find((entry) => entry.id === flagId);
    if (!flag) return false;
    return getPhaseOrder(this.phase) >= getPhaseOrder(flag.releasePhase) && Boolean(flag.defaultValue);
  }

  getExperimentVariant(experimentId) {
    const experiment = this.experimentConfig.find((entry) => entry.id === experimentId);
    if (!experiment) return null;

    const rngValue = (hashString(`${this.profileId}:${experimentId}`) % 10000) / 10000;
    const scaledPool = experiment.variants.map((variant) => ({
      value: variant,
      weight: variant.weight,
    }));
    const selected = pickWeighted(scaledPool, () => rngValue);
    return selected ?? experiment.variants[0];
  }
}

export { RemoteConfigService };
