function createDefaultProfile(profileId, timestampMs) {
  return {
    id: profileId,
    playerName: '游客蛇',
    lastActiveAt: timestampMs,
    currencies: {
      gold: 0,
      relics: 0,
    },
    metaProgress: {
      unlockedSnakeHeads: ['starter_viper'],
      unlockedWaves: ['season0_scrapyard'],
      talents: {},
    },
    stats: {
      totalRuns: 0,
      totalWins: 0,
      bestScore: 0,
      highestWaveSeconds: 0,
    },
    preferences: {
      controlScheme: 'virtual_joystick',
      assistTurn: true,
    },
  };
}

function getDayGap(previousTimestamp, currentTimestamp) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((currentTimestamp - previousTimestamp) / msPerDay);
}

class ProfileService {
  constructor({ platformBridge, telemetry, remoteConfig, clock }) {
    this.platformBridge = platformBridge;
    this.telemetry = telemetry;
    this.remoteConfig = remoteConfig;
    this.clock = clock;
  }

  async loadOrCreate(profileId) {
    const existing = await this.platformBridge.loadProfile(profileId);
    const now = this.clock();

    if (!existing) {
      const created = createDefaultProfile(profileId, now);
      await this.platformBridge.saveProfile(created);
      return created;
    }

    const dayGap = getDayGap(existing.lastActiveAt, now);
    if (dayGap > 0) {
      this.telemetry.track('day_n_return', {
        profileId,
        dayGap,
      });
    }

    existing.lastActiveAt = now;
    await this.platformBridge.saveProfile(existing);
    return existing;
  }

  async recordRunSettlement(profile, summary) {
    profile.lastActiveAt = this.clock();
    profile.currencies.gold += summary.rewardGold;
    profile.currencies.relics += summary.rewardRelics;
    profile.stats.totalRuns += 1;
    profile.stats.totalWins += summary.outcome === 'victory' ? 1 : 0;
    profile.stats.bestScore = Math.max(profile.stats.bestScore, summary.score);
    profile.stats.highestWaveSeconds = Math.max(profile.stats.highestWaveSeconds, summary.secondsElapsed);
    profile.lastRun = summary;

    await this.platformBridge.saveProfile(profile);
    return profile;
  }
}

export { ProfileService, createDefaultProfile };
