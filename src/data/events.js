const EventRoomConfig = [
  {
    id: 'mystery_shop',
    name: '神秘商店',
    releasePhase: 'alpha',
    summary: '花费金币购买一次定向强化或资源包。',
    priceGold: 40,
    rewardUpgradePool: ['salvage_radar', 'ram_plating', 'coil_overclock'],
  },
  {
    id: 'risk_altar',
    name: '风险祭坛',
    releasePhase: 'alpha',
    summary: '支付当前 15% 生命，换取更高品质的强化。',
    priceHpPct: 0.15,
    rewardUpgradePool: ['giant_segment', 'toxin_bloom', 'drift_nozzle'],
  },
  {
    id: 'trial_gate',
    name: '试炼门',
    releasePhase: 'beta',
    summary: '限时清怪成功后获得金币、能量和高阶强化权重。',
    rewardGold: 60,
    rewardEnergy: 70,
  },
];

export { EventRoomConfig };
