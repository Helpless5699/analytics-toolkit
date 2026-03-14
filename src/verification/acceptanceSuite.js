import { pathToFileURL } from 'node:url';
import { createSnakeSurvivorApp } from '../app/createSnakeSurvivorApp.js';
import { SimulationClock } from '../core/SimulationClock.js';
import { assert, validateContentRegistry } from '../core/validators.js';
import { GAME_CONTENT, LiveOpsConfig } from '../data/index.js';
import { MockDouyinPlatformBridge } from '../services/PlatformBridge.js';

async function runAcceptanceSuite() {
  validateContentRegistry(GAME_CONTENT);

  const app = await createSnakeSurvivorApp({
    phase: 'vertical_slice',
    profileId: 'acceptance-player',
    seed: 'acceptance-suite',
  });
  const demo = await app.runVerticalSliceDemo();
  const summary = demo.run.summary;
  const verticalSlice = GAME_CONTENT.LiveOpsConfig.contentPhases.vertical_slice;
  const activeEnemies = GAME_CONTENT.EnemyConfig.filter((enemy) => verticalSlice.enemyIds.includes(enemy.id));
  const normalEnemyCount = activeEnemies.filter((enemy) => enemy.tier === 'normal').length;
  const eliteEnemyCount = activeEnemies.filter((enemy) => enemy.tier === 'elite').length;

  assert(verticalSlice.snakeHeadIds.length === 1, 'Vertical slice must expose exactly 1 snake head');
  assert(verticalSlice.upgradeIds.length === 12, 'Vertical slice must expose 12 upgrades');
  assert(normalEnemyCount === 6, 'Vertical slice must expose 6 normal enemies');
  assert(eliteEnemyCount === 1, 'Vertical slice must expose 1 elite enemy');
  assert(verticalSlice.bossIds.length === 1, 'Vertical slice must expose 1 boss');
  assert(summary.timeToControlSeconds <= 3, 'Control should be established within 3 seconds');
  assert(summary.tutorialCompletedAt !== null && summary.tutorialCompletedAt <= 30, 'Tutorial should complete within 30 seconds');
  assert(summary.firstUpgradeAt !== null && summary.firstUpgradeAt <= 45, 'First upgrade should happen within 45 seconds');
  assert(summary.secondsElapsed >= 300 && summary.secondsElapsed <= 420, 'Run length should land in the 5-7 minute band');

  const adClock = new SimulationClock(0);
  const adBridge = new MockDouyinPlatformBridge({
    clock: () => adClock.now(),
    liveOpsConfig: LiveOpsConfig,
  });
  const tooEarlyInterstitial = await adBridge.showInterstitial('lobby');
  adClock.advanceSeconds(16);
  const firstInterstitial = await adBridge.showInterstitial('lobby');
  adClock.advanceSeconds(10);
  const blockedInterstitial = await adBridge.showInterstitial('settlement');
  adClock.advanceSeconds(21);
  const secondInterstitial = await adBridge.showInterstitial('settlement');

  assert(!tooEarlyInterstitial.shown && tooEarlyInterstitial.reason === 'launch_delay_guard', 'Interstitial must be blocked during launch guard');
  assert(firstInterstitial.shown, 'Interstitial should be allowed after 15 seconds outside the run');
  assert(!blockedInterstitial.shown && blockedInterstitial.reason === 'interval_guard', 'Interstitial should respect 30 second interval');
  assert(secondInterstitial.shown, 'Interstitial should be allowed again after cooldown');

  console.log('[Acceptance] Summary');
  console.log(JSON.stringify({
    phase: app.phase,
    growthGoals: app.remoteConfig.getGrowthGoals(),
    summary,
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runAcceptanceSuite().catch((error) => {
    console.error('[Acceptance failure]', error);
    process.exitCode = 1;
  });
}

export { runAcceptanceSuite };
