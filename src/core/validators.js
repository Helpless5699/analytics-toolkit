const REQUIRED_TABLES = [
  'SnakeHeadConfig',
  'UpgradeConfig',
  'EnemyConfig',
  'BossConfig',
  'WaveConfig',
  'EventRoomConfig',
  'TalentNodeConfig',
  'LiveOpsConfig',
  'ExperimentConfig',
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function indexById(records, label) {
  const map = new Map();

  for (const record of records) {
    assert(record?.id, `${label} record is missing id`);
    assert(!map.has(record.id), `${label} has duplicate id: ${record.id}`);
    map.set(record.id, record);
  }

  return map;
}

function validateContentRegistry(content) {
  for (const tableName of REQUIRED_TABLES) {
    assert(tableName in content, `Missing content table: ${tableName}`);
  }

  const registries = [
    ['SnakeHeadConfig', content.SnakeHeadConfig],
    ['UpgradeConfig', content.UpgradeConfig],
    ['EnemyConfig', content.EnemyConfig],
    ['BossConfig', content.BossConfig],
    ['WaveConfig', content.WaveConfig],
    ['EventRoomConfig', content.EventRoomConfig],
    ['TalentNodeConfig', content.TalentNodeConfig],
    ['ExperimentConfig', content.ExperimentConfig],
  ];

  for (const [label, records] of registries) {
    assert(Array.isArray(records), `${label} must be an array`);
    indexById(records, label);
  }

  const liveOps = content.LiveOpsConfig;
  assert(liveOps?.adPolicy, 'LiveOpsConfig.adPolicy is required');
  assert(liveOps?.contentPhases, 'LiveOpsConfig.contentPhases is required');
  assert(Array.isArray(liveOps?.remoteFlags), 'LiveOpsConfig.remoteFlags must be an array');

  const contentIndices = {
    snakeHeadIds: indexById(content.SnakeHeadConfig, 'SnakeHeadConfig'),
    upgradeIds: indexById(content.UpgradeConfig, 'UpgradeConfig'),
    enemyIds: indexById(content.EnemyConfig, 'EnemyConfig'),
    bossIds: indexById(content.BossConfig, 'BossConfig'),
    waveIds: indexById(content.WaveConfig, 'WaveConfig'),
    eventRoomIds: indexById(content.EventRoomConfig, 'EventRoomConfig'),
    talentNodeIds: indexById(content.TalentNodeConfig, 'TalentNodeConfig'),
  };

  for (const [phaseName, phaseConfig] of Object.entries(liveOps.contentPhases)) {
    for (const [bucketName, ids] of Object.entries(phaseConfig)) {
      assert(Array.isArray(ids), `LiveOpsConfig.contentPhases.${phaseName}.${bucketName} must be an array`);
      for (const id of ids) {
        assert(contentIndices[bucketName]?.has(id), `LiveOpsConfig ${phaseName}.${bucketName} references missing id: ${id}`);
      }
    }
  }

  return true;
}

function getPhaseOrder(phase) {
  const order = ['vertical_slice', 'alpha', 'beta', 'launch'];
  return order.indexOf(phase);
}

export { assert, getPhaseOrder, indexById, validateContentRegistry };
