function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

class MockDouyinPlatformBridge {
  constructor({
    clock = () => Date.now(),
    liveOpsConfig,
    launchSource = 'direct',
    initialProfile = null,
  } = {}) {
    this.clock = clock;
    this.launchSource = launchSource;
    this.adPolicy = liveOpsConfig.adPolicy;
    this.appLaunchTimestamp = this.clock();
    this.lastInterstitialTimestamp = null;
    this.profileStore = new Map();
    this.rankings = new Map();
    this.operationLog = [];

    if (initialProfile) {
      this.profileStore.set(initialProfile.id, cloneValue(initialProfile));
    }
  }

  async loadProfile(profileId) {
    const profile = this.profileStore.get(profileId);
    this.operationLog.push({ type: 'load_profile', profileId });
    return profile ? cloneValue(profile) : null;
  }

  async saveProfile(profile) {
    this.profileStore.set(profile.id, cloneValue(profile));
    this.operationLog.push({ type: 'save_profile', profileId: profile.id });
    return cloneValue(profile);
  }

  async submitRank({ boardId, playerId, playerName, score }) {
    const board = this.rankings.get(boardId) ?? [];
    const existing = board.find((entry) => entry.playerId === playerId);
    if (existing) {
      existing.score = Math.max(existing.score, score);
      existing.playerName = playerName;
    } else {
      board.push({ playerId, playerName, score });
    }

    board.sort((left, right) => right.score - left.score);
    this.rankings.set(boardId, board);
    this.operationLog.push({ type: 'submit_rank', boardId, playerId, score });
    return { accepted: true, boardId, score };
  }

  async readRank({ boardId, limit = 20 }) {
    const board = this.rankings.get(boardId) ?? [];
    const topEntries = board.slice(0, limit).map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    this.operationLog.push({ type: 'read_rank', boardId, limit });
    return topEntries;
  }

  async requestSubscribeMessage({ templateId, scene }) {
    this.operationLog.push({ type: 'request_subscribe', templateId, scene });
    return { granted: true, templateId, scene };
  }

  async openSidebarRevisitCampaign({ campaignId, scene }) {
    this.operationLog.push({ type: 'open_sidebar_campaign', campaignId, scene });
    return { registered: true, campaignId, scene };
  }

  async showRewardedAd(scene) {
    const allowed = this.adPolicy.rewardedScenes.includes(scene);
    const result = {
      shown: allowed,
      scene,
      reason: allowed ? 'ok' : 'scene_not_allowed',
    };

    this.operationLog.push({ type: 'show_rewarded_ad', ...result });
    return result;
  }

  async showInterstitial(scene) {
    const now = this.clock();
    const sinceLaunchSeconds = (now - this.appLaunchTimestamp) / 1000;
    const sinceLastInterstitialSeconds = this.lastInterstitialTimestamp === null
      ? Number.POSITIVE_INFINITY
      : (now - this.lastInterstitialTimestamp) / 1000;

    let reason = 'ok';
    let shown = true;

    if (!this.adPolicy.interstitialScenes.includes(scene)) {
      shown = false;
      reason = 'scene_not_allowed';
    } else if (sinceLaunchSeconds < this.adPolicy.minLaunchDelaySeconds) {
      shown = false;
      reason = 'launch_delay_guard';
    } else if (sinceLastInterstitialSeconds < this.adPolicy.minInterstitialIntervalSeconds) {
      shown = false;
      reason = 'interval_guard';
    }

    if (shown) {
      this.lastInterstitialTimestamp = now;
    }

    const result = { shown, scene, reason };
    this.operationLog.push({ type: 'show_interstitial', ...result });
    return result;
  }

  getOperationLog() {
    return [...this.operationLog];
  }
}

export { MockDouyinPlatformBridge };
