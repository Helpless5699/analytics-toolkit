class WaveDirector {
  constructor(waveConfig) {
    this.waveConfig = waveConfig;
  }

  getEntriesAt(second) {
    return this.waveConfig.schedule.filter((entry) => entry.time === second);
  }

  getDifficultyMultiplier(second, powerScore) {
    const timeCurve = 1 + second / 200;
    const playerCorrection = 1 + Math.max(0, powerScore - 1) * 0.12;
    return Number((timeCurve * playerCorrection).toFixed(2));
  }
}

export { WaveDirector };
