export const RARITY_TABLE = [
  { rarity: 'common', weight: 60 },
  { rarity: 'rare', weight: 28 },
  { rarity: 'epic', weight: 10 },
  { rarity: 'legendary', weight: 2 },
];

export const UPGRADE_POOL = [
  {
    id: 'fork_shot',
    name: '分裂射击',
    rarity: 'common',
    tags: ['attack', 'lightning'],
    effect: '主攻击额外发射两枚低伤害分裂弹。',
  },
  {
    id: 'venom_gland',
    name: '毒液腺体',
    rarity: 'rare',
    tags: ['attack', 'poison'],
    effect: '命中叠加中毒，5 层触发爆发。',
  },
  {
    id: 'giant_segment',
    name: '巨化节段',
    rarity: 'epic',
    tags: ['body', 'tank'],
    effect: '蛇身变粗并提高碰撞伤害与最大生命。',
  },
  {
    id: 'phoenix_skin',
    name: '涅槃鳞甲',
    rarity: 'legendary',
    tags: ['mechanic', 'survival'],
    effect: '首次死亡时原地复活并回复 50% 生命。',
  },
];

export const ARCHETYPE_GUIDE = {
  titan: ['giant_segment'],
  venom: ['venom_gland'],
  chain: ['fork_shot'],
};

export const META_TALENTS = [
  { id: 'base_hp', maxLevel: 20, effectPerLevel: '+2% base hp' },
  { id: 'base_attack', maxLevel: 20, effectPerLevel: '+2% base attack' },
  { id: 'energy_gain', maxLevel: 15, effectPerLevel: '+3% energy gain' },
];
