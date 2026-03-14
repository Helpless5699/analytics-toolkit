const BossConfig = [
  {
    id: 'titan_worm',
    name: '深渊泰坦蠕虫',
    releasePhase: 'vertical_slice',
    hp: 2400,
    phases: [
      {
        threshold: 1,
        skills: ['ram', 'spawn_larva'],
        callout: 'P1 强调走位与小怪处理。',
      },
      {
        threshold: 0.5,
        skills: ['laser_sweep', 'acid_pool'],
        callout: 'P2 增加持续危险区，要求控场和爆发并存。',
      },
    ],
    reward: { gold: 120, relics: 1, rankScore: 3500 },
  },
  {
    id: 'storm_hydra',
    name: '风暴九头蛇',
    releasePhase: 'beta',
    hp: 3100,
    phases: [
      {
        threshold: 1,
        skills: ['fork_bolt', 'tail_chain'],
        callout: '多头轮番吐电，压缩安全走位空间。',
      },
      {
        threshold: 0.45,
        skills: ['arena_shock', 'clone_head'],
        callout: '进入狂暴状态，强调瞬时位移。',
      },
    ],
    reward: { gold: 160, relics: 1, rankScore: 4200 },
  },
  {
    id: 'plague_mother',
    name: '疫巢母体',
    releasePhase: 'beta',
    hp: 3200,
    phases: [
      {
        threshold: 1,
        skills: ['spore_ring', 'brood_wave'],
        callout: '大量召唤物逼迫玩家切换优先级。',
      },
      {
        threshold: 0.4,
        skills: ['nest_explode', 'toxin_rain'],
        callout: '地面读条更密集，强调识别危险区。',
      },
    ],
    reward: { gold: 170, relics: 2, rankScore: 4500 },
  },
];

export { BossConfig };
