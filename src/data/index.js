import { BossConfig } from './bosses.js';
import { EnemyConfig } from './enemies.js';
import { EventRoomConfig } from './events.js';
import { ExperimentConfig } from './experiments.js';
import { LiveOpsConfig } from './liveOps.js';
import { SnakeHeadConfig } from './snakeHeads.js';
import { TalentNodeConfig } from './talents.js';
import { RarityTable, UpgradeConfig } from './upgrades.js';
import { WaveConfig } from './waves.js';

const GAME_CONTENT = {
  SnakeHeadConfig,
  UpgradeConfig,
  EnemyConfig,
  BossConfig,
  WaveConfig,
  EventRoomConfig,
  TalentNodeConfig,
  LiveOpsConfig,
  ExperimentConfig,
  RarityTable,
};

export {
  BossConfig,
  EnemyConfig,
  EventRoomConfig,
  ExperimentConfig,
  GAME_CONTENT,
  LiveOpsConfig,
  RarityTable,
  SnakeHeadConfig,
  TalentNodeConfig,
  UpgradeConfig,
  WaveConfig,
};
