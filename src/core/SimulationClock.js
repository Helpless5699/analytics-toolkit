class SimulationClock {
  constructor(initialTimestampMs = 0) {
    this.timestampMs = initialTimestampMs;
  }

  now() {
    return this.timestampMs;
  }

  advanceSeconds(seconds) {
    this.timestampMs += seconds * 1000;
  }
}

export { SimulationClock };
