const TalentNodeConfig = [
  {
    id: 'base_hp',
    name: '基础生命',
    releasePhase: 'alpha',
    maxLevel: 20,
    effectPerLevel: { maxHpPct: 0.02 },
  },
  {
    id: 'base_attack',
    name: '基础伤害',
    releasePhase: 'alpha',
    maxLevel: 20,
    effectPerLevel: { damagePct: 0.02 },
  },
  {
    id: 'energy_gain',
    name: '能量吸收',
    releasePhase: 'alpha',
    maxLevel: 15,
    effectPerLevel: { energyGainPct: 0.03 },
  },
  {
    id: 'salvage_income',
    name: '拾荒收益',
    releasePhase: 'alpha',
    maxLevel: 15,
    effectPerLevel: { goldGainPct: 0.03 },
  },
  {
    id: 'pickup_radius',
    name: '磁吸回路',
    releasePhase: 'alpha',
    maxLevel: 10,
    effectPerLevel: { autoPickupRadiusFlat: 0.08 },
  },
  {
    id: 'boss_bounty',
    name: '首领赏金',
    releasePhase: 'beta',
    maxLevel: 10,
    effectPerLevel: { bossGoldPct: 0.05 },
  },
  {
    id: 'revive_fuel',
    name: '续命燃料',
    releasePhase: 'beta',
    maxLevel: 5,
    effectPerLevel: { reviveHealthPct: 0.05 },
  },
  {
    id: 'weekly_focus',
    name: '周常洞察',
    releasePhase: 'beta',
    maxLevel: 5,
    effectPerLevel: { weeklyChallengeRewardPct: 0.08 },
  },
];

export { TalentNodeConfig };
