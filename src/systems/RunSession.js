import { createSeededRng } from '../core/createRng.js';
import { assert, indexById } from '../core/validators.js';
import { UpgradeDraftSystem } from './UpgradeDraftSystem.js';
import { WaveDirector } from './WaveDirector.js';

class RunSession {
  constructor({
    content,
    phase,
    eventBus,
    telemetry,
    remoteConfig,
    platformBridge,
    clock,
    profile,
    seed,
  }) {
    this.content = content;
    this.phase = phase;
    this.eventBus = eventBus;
    this.telemetry = telemetry;
    this.remoteConfig = remoteConfig;
    this.platformBridge = platformBridge;
    this.clock = clock;
    this.profile = profile;
    this.rng = createSeededRng(seed);

    this.snakeHeadById = indexById(content.SnakeHeadConfig, 'SnakeHeadConfig');
    this.upgradeById = indexById(content.UpgradeConfig, 'UpgradeConfig');
    this.enemyById = indexById(content.EnemyConfig, 'EnemyConfig');
    this.bossById = indexById(content.BossConfig, 'BossConfig');
    this.waveById = indexById(content.WaveConfig, 'WaveConfig');
    this.eventRoomById = indexById(content.EventRoomConfig, 'EventRoomConfig');
    this.talentById = indexById(content.TalentNodeConfig, 'TalentNodeConfig');

    this.activeContent = remoteConfig.getActiveContent(phase);
    this.upgradeSystem = new UpgradeDraftSystem({
      upgrades: content.UpgradeConfig,
      rng: this.rng,
    });
    this.state = null;
    this.waveDirector = null;
    this.preferredArchetype = remoteConfig.getExperimentVariant('tutorial_pacing')?.values.recommendArchetype ?? 'chain';
  }

  createPlayerState(snakeHeadId) {
    const snakeHead = this.snakeHeadById.get(snakeHeadId);
    assert(snakeHead, `Missing snake head: ${snakeHeadId}`);

    const baseStats = { ...snakeHead.baseStats };
    const playerState = {
      snakeHeadId: snakeHead.id,
      snakeHeadName: snakeHead.name,
      archetype: snakeHead.archetype,
      hp: baseStats.hp,
      maxHp: baseStats.hp,
      damage: baseStats.damage,
      speed: baseStats.speed,
      armor: baseStats.armor,
      length: baseStats.length,
      autoPickupRadius: baseStats.autoPickupRadius,
      energyGainMultiplier: baseStats.energyGainMultiplier,
      goldGainMultiplier: baseStats.goldGainMultiplier,
      gold: 0,
      energy: 0,
      build: [],
      selectedUpgradeCount: 0,
      reviveCharges: 0,
      powerScore: 1,
      firstPickupHandled: false,
      nextUpgradeThreshold: this.upgradeSystem.getThreshold(0),
    };

    this.applyTalents(playerState);

    for (const starterUpgradeId of snakeHead.starterUpgradeIds) {
      const starterUpgrade = this.upgradeById.get(starterUpgradeId);
      if (starterUpgrade) {
        this.upgradeSystem.applyUpgrade(playerState, starterUpgrade, {
          countsTowardsThreshold: false,
        });
      }
    }

    return playerState;
  }

  applyTalents(playerState) {
    for (const [talentId, level] of Object.entries(this.profile.metaProgress.talents)) {
      const talent = this.talentById.get(talentId);
      if (!talent || level <= 0) continue;

      const bonus = talent.effectPerLevel;
      playerState.maxHp *= 1 + (bonus.maxHpPct ?? 0) * level;
      playerState.hp = playerState.maxHp;
      playerState.damage *= 1 + (bonus.damagePct ?? 0) * level;
      playerState.energyGainMultiplier *= 1 + (bonus.energyGainPct ?? 0) * level;
      playerState.goldGainMultiplier *= 1 + (bonus.goldGainPct ?? 0) * level;
      playerState.autoPickupRadius += (bonus.autoPickupRadiusFlat ?? 0) * level;
    }
  }

  async play({ snakeHeadId, waveId }) {
    assert(this.activeContent.snakeHeadIds.includes(snakeHeadId), `Snake head ${snakeHeadId} is not active in ${this.phase}`);
    assert(this.activeContent.waveIds.includes(waveId), `Wave ${waveId} is not active in ${this.phase}`);

    const waveConfig = this.waveById.get(waveId);
    this.waveDirector = new WaveDirector(waveConfig);
    this.state = {
      snakeHeadId,
      waveId,
      secondsElapsed: 0,
      timeToControlSeconds: 3,
      tutorialCompletedAt: null,
      firstUpgradeAt: null,
      thirtySecondSpikeSeen: false,
      reviveUsed: false,
      deathReason: null,
      finalBossId: null,
      completed: false,
      outcome: 'in_progress',
      rankEntries: [],
      rewardGold: 0,
      rewardRelics: 0,
      score: 0,
      notes: [],
      killBreakdown: {},
      eventsVisited: [],
    };
    this.player = this.createPlayerState(snakeHeadId);

    this.telemetry.track('run_start', {
      snakeHeadId,
      waveId,
      tutorialVariant: this.remoteConfig.getExperimentVariant('tutorial_pacing')?.id,
    });
    this.eventBus.emit('run:start', { snakeHeadId, waveId });

    for (const entry of this.waveDirector.getEntriesAt(0)) {
      await this.resolveTimelineEntry(entry);
    }

    for (let second = 1; second <= waveConfig.targetSessionSeconds; second += 1) {
      this.clock.advanceSeconds(1);
      await this.tick(second, waveConfig);
      if (this.state.completed) {
        break;
      }
    }

    if (!this.state.completed) {
      await this.finishRun('victory', waveConfig.bossId);
    }

    return {
      summary: {
        ...this.state,
        build: [...this.player.build],
        playerPowerScore: Number(this.player.powerScore.toFixed(2)),
        rewardGold: this.state.rewardGold,
        rewardRelics: this.state.rewardRelics,
        secondsElapsed: this.state.secondsElapsed,
      },
      profileSnapshot: this.profile,
    };
  }

  async tick(second, waveConfig) {
    this.state.secondsElapsed = second;

    if (second === 30) {
      this.state.tutorialCompletedAt = second;
      this.state.thirtySecondSpikeSeen = true;
      this.telemetry.track('tutorial_complete', {
        second,
        calloutStyle: this.remoteConfig.getExperimentVariant('tutorial_pacing')?.values.calloutStyle,
      });
    }

    for (const entry of this.waveDirector.getEntriesAt(second)) {
      await this.resolveTimelineEntry(entry);
      if (this.state.completed) {
        return;
      }
    }

    this.grantAmbientEconomy(second);
    await this.ensureUpgradeWindow(second, waveConfig.firstUpgradeGuaranteeAt);

    if (second === 255 && !this.state.reviveUsed && this.remoteConfig.isEnabled('feature.revive-offer')) {
      await this.triggerReviveWindow('void_husk_beam');
    }
  }

  async resolveTimelineEntry(entry) {
    switch (entry.type) {
      case 'tutorial_callout':
        this.state.notes.push(entry.message);
        break;
      case 'spawn':
      case 'elite':
        this.resolveSpawn(entry);
        break;
      case 'guarantee_upgrade':
        this.player.energy = Math.max(this.player.energy, this.player.nextUpgradeThreshold);
        break;
      case 'event_room':
        this.resolveEventRoom(entry.roomId);
        break;
      case 'boss':
        await this.resolveBoss(entry.bossId);
        break;
      default:
        this.state.notes.push(`Unhandled timeline entry: ${entry.type}`);
        break;
    }
  }

  resolveSpawn(entry) {
    const enemy = this.enemyById.get(entry.enemyId);
    if (!enemy) return;

    const count = entry.count ?? 1;
    const energyGain = count * enemy.energyReward * this.player.energyGainMultiplier;
    const goldGain = count * enemy.goldReward * this.player.goldGainMultiplier;

    this.player.energy += Math.round(energyGain);
    this.player.gold += Math.round(goldGain);
    this.player.length += count >= 10 ? 1 : 0;
    this.player.powerScore += count * (enemy.tier === 'elite' ? 0.02 : 0.01);

    this.state.killBreakdown[enemy.id] = (this.state.killBreakdown[enemy.id] ?? 0) + count;
    if (!this.player.firstPickupHandled) {
      this.player.firstPickupHandled = true;
      this.player.energy += this.snakeHeadById.get(this.player.snakeHeadId)?.passive.effect.bonusEnergyOnFirstPickup ?? 0;
    }
  }

  resolveEventRoom(roomId) {
    const room = this.eventRoomById.get(roomId);
    if (!room) return;

    this.state.eventsVisited.push(roomId);

    if (room.id === 'mystery_shop' && this.player.gold >= room.priceGold) {
      this.player.gold -= room.priceGold;
      this.player.energy += 30;
    } else if (room.id === 'risk_altar') {
      this.player.hp = Math.max(1, this.player.hp - this.player.maxHp * room.priceHpPct);
      this.player.energy += 60;
    } else if (room.id === 'trial_gate') {
      this.player.gold += room.rewardGold;
      this.player.energy += room.rewardEnergy;
    }
  }

  async resolveBoss(bossId) {
    const boss = this.bossById.get(bossId);
    if (!boss) return;

    this.state.finalBossId = boss.id;
    this.player.gold += boss.reward.gold;
    this.state.rewardRelics += boss.reward.relics;
    this.state.score += boss.reward.rankScore;
    await this.finishRun('victory', boss.id);
  }

  grantAmbientEconomy(second) {
    if (second % 12 === 0) {
      this.player.energy += Math.round(8 * this.player.energyGainMultiplier);
    }

    if (second % 25 === 0) {
      this.player.gold += Math.round(4 * this.player.goldGainMultiplier);
    }

    this.state.score += Math.round(this.waveDirector.getDifficultyMultiplier(second, this.player.powerScore) * 10);
  }

  async ensureUpgradeWindow(second, guaranteeAt) {
    if (second >= guaranteeAt && !this.state.firstUpgradeAt) {
      this.player.energy = Math.max(this.player.energy, this.player.nextUpgradeThreshold);
    }

    while (this.upgradeSystem.canDraft(this.player)) {
      const threshold = this.player.nextUpgradeThreshold;
      const choices = this.upgradeSystem.rollChoices({
        activeUpgradeIds: this.activeContent.upgradeIds,
        ownedUpgradeIds: this.player.build,
        preferredArchetype: this.preferredArchetype,
      });
      const selected = this.selectUpgrade(choices);
      if (!selected) break;

      this.player.energy -= threshold;
      this.upgradeSystem.applyUpgrade(this.player, selected);

      if (!this.state.firstUpgradeAt) {
        this.state.firstUpgradeAt = second;
        this.telemetry.track('first_upgrade', {
          second,
          upgradeId: selected.id,
        });
      }

      this.state.notes.push(`Upgrade selected: ${selected.id}`);
    }
  }

  selectUpgrade(choices) {
    if (!choices.length) return null;

    const preferred = choices.find((upgrade) => upgrade.archetype === this.preferredArchetype);
    if (preferred) return preferred;

    const economyFallback = choices.find((upgrade) => upgrade.archetype === 'economy');
    return economyFallback ?? choices[0];
  }

  async triggerReviveWindow(reason) {
    this.state.deathReason = reason;
    this.telemetry.track('death_reason', {
      second: this.state.secondsElapsed,
      reason,
    });
    this.telemetry.track('revive_offer_show/accept', {
      action: 'show',
      second: this.state.secondsElapsed,
      reason,
    });

    const reviveAd = await this.platformBridge.showRewardedAd('revive_offer');
    if (reviveAd.shown) {
      this.telemetry.track('revive_offer_show/accept', {
        action: 'accept',
        second: this.state.secondsElapsed,
        reason,
      });
      this.state.reviveUsed = true;
      const reviveHealthPct = 0.5 + ((this.profile.metaProgress.talents.revive_fuel ?? 0) * 0.05);
      this.player.hp = Math.min(this.player.maxHp, this.player.maxHp * reviveHealthPct);
      return;
    }

    await this.finishRun('defeat', reason);
  }

  async finishRun(outcome, endReason) {
    if (this.state.completed) return;

    this.state.completed = true;
    this.state.outcome = outcome;
    this.state.endReason = endReason;
    this.state.rewardGold += Math.round(this.player.gold);
    this.state.score += Math.round(this.player.powerScore * 1000);

    await this.platformBridge.submitRank({
      boardId: 'season0_score',
      playerId: this.profile.id,
      playerName: this.profile.playerName,
      score: this.state.score,
    });
    this.state.rankEntries = await this.platformBridge.readRank({
      boardId: 'season0_score',
      limit: 10,
    });
    this.telemetry.track('rank_open/share', {
      action: 'open',
      boardId: 'season0_score',
      rank: this.state.rankEntries.find((entry) => entry.playerId === this.profile.id)?.rank ?? null,
    });

    if (this.remoteConfig.isEnabled('feature.subscribe-reminder') && outcome === 'victory') {
      const subscription = await this.platformBridge.requestSubscribeMessage({
        templateId: 'season_reset_notice',
        scene: 'post_boss_clear',
      });
      if (subscription.granted) {
        this.telemetry.track('subscribe_accept', {
          templateId: subscription.templateId,
        });
      }
    }

    if (this.remoteConfig.isEnabled('feature.sidebar-revisit')) {
      await this.platformBridge.openSidebarRevisitCampaign({
        campaignId: 'season0_return',
        scene: 'post_settlement',
      });
    }

    if (this.remoteConfig.isEnabled('feature.settlement-double')) {
      const doubleReward = await this.platformBridge.showRewardedAd('settlement_double');
      if (doubleReward.shown) {
        this.state.rewardGold *= 2;
        this.telemetry.track('settlement_double_accept', {
          scene: 'settlement_double',
        });
      }
    }

    await this.platformBridge.showInterstitial('settlement');
  }
}

export { RunSession };
