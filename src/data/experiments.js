const ExperimentConfig = [
  {
    id: 'tutorial_pacing',
    description: '调整 30 秒内引导文案强度和爽点提示方式。',
    variants: [
      {
        id: 'guided_chain',
        weight: 70,
        values: {
          recommendArchetype: 'chain',
          calloutStyle: 'explicit',
        },
      },
      {
        id: 'minimal_text',
        weight: 30,
        values: {
          recommendArchetype: 'economy',
          calloutStyle: 'minimal',
        },
      },
    ],
  },
  {
    id: 'revive_offer_copy',
    description: '测试复活广告文案是强调继续闯关还是双倍收益。',
    variants: [
      {
        id: 'continue_run',
        weight: 60,
        values: {
          primaryCopy: '继续本局，冲击首领',
        },
      },
      {
        id: 'protect_streak',
        weight: 40,
        values: {
          primaryCopy: '保住连胜，领双倍结算',
        },
      },
    ],
  },
  {
    id: 'post_win_prompt',
    description: '测试结算页先展示排行榜还是订阅提醒。',
    variants: [
      {
        id: 'rank_first',
        weight: 50,
        values: {
          settlementFocus: 'rank',
        },
      },
      {
        id: 'subscribe_first',
        weight: 50,
        values: {
          settlementFocus: 'subscribe',
        },
      },
    ],
  },
];

export { ExperimentConfig };
