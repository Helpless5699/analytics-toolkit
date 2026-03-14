export const ENEMY_LIBRARY = {
  slime: {
    id: 'slime',
    name: '粘液虫',
    hp: 30,
    speed: 0.9,
    attack: 6,
    behavior: 'chase',
    drop: { energy: 10, food: 1 },
  },
  bomber: {
    id: 'bomber',
    name: '爆裂甲虫',
    hp: 45,
    speed: 1.1,
    attack: 12,
    behavior: 'suicide',
    drop: { energy: 14, food: 1 },
  },
  spitter: {
    id: 'spitter',
    name: '毒液喷射体',
    hp: 40,
    speed: 0.8,
    attack: 8,
    behavior: 'ranged',
    drop: { energy: 12, food: 1 },
  },
};

export const ITEM_LIBRARY = {
  apple_core: {
    id: 'apple_core',
    name: '高能果核',
    type: 'food',
    effect: { heal: 10, growth: 1, energy: 15 },
  },
  plasma_orb: {
    id: 'plasma_orb',
    name: '等离子球',
    type: 'resource',
    effect: { energy: 40 },
  },
  shell_chip: {
    id: 'shell_chip',
    name: '甲壳碎片',
    type: 'buff',
    effect: { armor: 2, duration: 15 },
  },
};

export const BOSS_LIBRARY = {
  titan_worm: {
    id: 'titan_worm',
    name: '深渊泰坦蠕虫',
    phases: [
      { hpRate: 1, skillSet: ['ram', 'spawn_larva'] },
      { hpRate: 0.5, skillSet: ['laser_sweep', 'acid_pool'] },
    ],
    reward: { gold: 100, relic: 1 },
  },
};
