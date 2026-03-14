const TELEMETRY_EVENT_NAMES = new Set([
  'app_launch',
  'run_start',
  'tutorial_complete',
  'first_upgrade',
  'death_reason',
  'revive_offer_show/accept',
  'settlement_double_accept',
  'rank_open/share',
  'sidebar_entry',
  'subscribe_accept',
  'day_n_return',
]);

class TelemetryService {
  constructor({ eventBus = null, sink = null } = {}) {
    this.eventBus = eventBus;
    this.sink = sink ?? ((entry) => console.log(`[Telemetry] ${entry.name}`, entry.payload));
    this.entries = [];
  }

  track(name, payload = {}) {
    if (!TELEMETRY_EVENT_NAMES.has(name)) {
      throw new Error(`Unsupported telemetry event: ${name}`);
    }

    const entry = {
      name,
      payload,
      recordedAt: new Date().toISOString(),
    };

    this.entries.push(entry);
    this.sink(entry);
    this.eventBus?.emit(`telemetry:${name}`, entry);
    return entry;
  }

  getEvents() {
    return [...this.entries];
  }
}

export { TELEMETRY_EVENT_NAMES, TelemetryService };
