const RARITY_WEIGHT = {
  common: 1,
  rare: 0.65,
  epic: 0.35,
  legendary: 0.12,
};

const UPGRADE_THRESHOLDS = [100, 160, 240, 340, 460, 610, 790];

class UpgradeDraftSystem {
  constructor({ upgrades, rng = Math.random }) {
    this.upgrades = upgrades;
    this.rng = rng;
  }

  getThreshold(upgradeCount) {
    if (upgradeCount < UPGRADE_THRESHOLDS.length) {
      return UPGRADE_THRESHOLDS[upgradeCount];
    }

    const last = UPGRADE_THRESHOLDS.at(-1);
    return last + (upgradeCount - UPGRADE_THRESHOLDS.length + 1) * 180;
  }

  canDraft(playerState) {
    return playerState.energy >= playerState.nextUpgradeThreshold;
  }

  rollChoices({ activeUpgradeIds, ownedUpgradeIds, preferredArchetype }) {
    const owned = new Set(ownedUpgradeIds);
    const pool = this.upgrades
      .filter((upgrade) => activeUpgradeIds.includes(upgrade.id) && !owned.has(upgrade.id))
      .map((upgrade) => ({
        upgrade,
        weight: this.getRollWeight(upgrade, ownedUpgradeIds, preferredArchetype),
      }));

    const workingPool = [...pool];
    const choices = [];

    while (workingPool.length > 0 && choices.length < 3) {
      const totalWeight = workingPool.reduce((sum, entry) => sum + entry.weight, 0);
      let cursor = this.rng() * totalWeight;
      let selectedIndex = 0;

      for (let index = 0; index < workingPool.length; index += 1) {
        cursor -= workingPool[index].weight;
        if (cursor <= 0) {
          selectedIndex = index;
          break;
        }
      }

      const [selected] = workingPool.splice(selectedIndex, 1);
      choices.push(selected.upgrade);
    }

    return choices;
  }

  getRollWeight(upgrade, ownedUpgradeIds, preferredArchetype) {
    let weight = (upgrade.weight ?? 1) * (RARITY_WEIGHT[upgrade.rarity] ?? 0.1);

    if (preferredArchetype && upgrade.archetype === preferredArchetype) {
      weight *= 1.2;
    }

    const ownedMatches = ownedUpgradeIds
      .map((upgradeId) => this.upgrades.find((entry) => entry.id === upgradeId))
      .filter(Boolean)
      .filter((ownedUpgrade) => ownedUpgrade.archetype === upgrade.archetype).length;

    weight *= 1 + ownedMatches * 0.18;
    return weight;
  }

  applyUpgrade(playerState, upgrade, { countsTowardsThreshold = true } = {}) {
    const modifiers = upgrade.modifiers ?? {};

    playerState.build.push(upgrade.id);
    if (countsTowardsThreshold) {
      playerState.selectedUpgradeCount += 1;
    }
    playerState.damage *= 1 + (modifiers.damagePct ?? 0);
    playerState.speed *= 1 + (modifiers.speedPct ?? 0);
    playerState.maxHp *= 1 + (modifiers.maxHpPct ?? 0);
    playerState.hp = Math.min(playerState.maxHp, playerState.hp + playerState.maxHp * 0.1);
    playerState.armor += modifiers.armorFlat ?? 0;
    playerState.length += modifiers.lengthFlat ?? 0;
    playerState.autoPickupRadius += modifiers.autoPickupRadiusFlat ?? 0;
    playerState.energyGainMultiplier *= 1 + (modifiers.energyGainPct ?? 0);
    playerState.goldGainMultiplier *= 1 + (modifiers.goldGainPct ?? 0);
    playerState.reviveCharges += modifiers.reviveChargesFlat ?? 0;
    playerState.powerScore += modifiers.powerScore ?? 0.12;
    playerState.nextUpgradeThreshold = this.getThreshold(playerState.selectedUpgradeCount);
  }
}

export { UpgradeDraftSystem };
