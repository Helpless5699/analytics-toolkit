import { EventBus } from '../core/EventBus.js';
import { SimulationClock } from '../core/SimulationClock.js';
import { validateContentRegistry } from '../core/validators.js';
import { GAME_CONTENT, LiveOpsConfig } from '../data/index.js';
import { MockDouyinPlatformBridge } from '../services/PlatformBridge.js';
import { ProfileService } from '../services/ProfileService.js';
import { RemoteConfigService } from '../services/RemoteConfigService.js';
import { TelemetryService } from '../services/TelemetryService.js';
import { RunSession } from '../systems/RunSession.js';

class SnakeSurvivorApp {
  constructor({
    phase = 'vertical_slice',
    profileId = 'guest',
    seed = 'season0',
    launchSource = 'direct',
    initialProfile = null,
  } = {}) {
    validateContentRegistry(GAME_CONTENT);

    this.phase = phase;
    this.profileId = profileId;
    this.seed = seed;
    this.launchSource = launchSource;

    this.clock = new SimulationClock(Date.UTC(2026, 2, 14, 0, 0, 0));
    this.eventBus = new EventBus();
    this.telemetry = new TelemetryService({ eventBus: this.eventBus });
    this.remoteConfig = new RemoteConfigService({
      phase,
      profileId,
      liveOpsConfig: LiveOpsConfig,
      experimentConfig: GAME_CONTENT.ExperimentConfig,
    });
    this.platformBridge = new MockDouyinPlatformBridge({
      clock: () => this.clock.now(),
      liveOpsConfig: LiveOpsConfig,
      launchSource,
      initialProfile,
    });
    this.profileService = new ProfileService({
      platformBridge: this.platformBridge,
      telemetry: this.telemetry,
      remoteConfig: this.remoteConfig,
      clock: () => this.clock.now(),
    });
    this.profile = null;
  }

  async bootstrap() {
    this.telemetry.track('app_launch', {
      phase: this.phase,
      launchSource: this.launchSource,
      growthGoals: this.remoteConfig.getGrowthGoals(),
    });

    this.profile = await this.profileService.loadOrCreate(this.profileId);
    if (this.launchSource === 'sidebar') {
      this.telemetry.track('sidebar_entry', {
        source: this.launchSource,
        campaignId: 'season0_return',
      });
    }

    return this;
  }

  async runVerticalSliceDemo({ snakeHeadId = 'starter_viper', waveId = 'season0_scrapyard' } = {}) {
    if (!this.profile) {
      await this.bootstrap();
    }

    const run = new RunSession({
      content: GAME_CONTENT,
      phase: this.phase,
      eventBus: this.eventBus,
      telemetry: this.telemetry,
      remoteConfig: this.remoteConfig,
      platformBridge: this.platformBridge,
      clock: this.clock,
      profile: this.profile,
      seed: this.seed,
    });

    const runResult = await run.play({ snakeHeadId, waveId });
    this.profile = await this.profileService.recordRunSettlement(this.profile, runResult.summary);

    return {
      profile: this.profile,
      run: runResult,
      telemetry: this.telemetry.getEvents(),
      platformLog: this.platformBridge.getOperationLog(),
    };
  }
}

async function createSnakeSurvivorApp(options = {}) {
  const app = new SnakeSurvivorApp(options);
  await app.bootstrap();
  return app;
}

export { SnakeSurvivorApp, createSnakeSurvivorApp };
