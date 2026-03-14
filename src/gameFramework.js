import { ENEMY_LIBRARY, ITEM_LIBRARY, BOSS_LIBRARY } from './content/entities.js';
import { UPGRADE_POOL, RARITY_TABLE } from './content/progression.js';

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(handler);
  }

  emit(event, payload) {
    for (const handler of this.listeners.get(event) ?? []) {
      handler(payload);
    }
  }
}

class SnakePlayer {
  constructor() {
    this.hp = 100;
    this.energy = 0;
    this.length = 4;
    this.level = 1;
    this.build = [];
  }

  eat(item) {
    this.energy += item.effect.energy ?? 0;
    this.hp = Math.min(100 + this.length * 10, this.hp + (item.effect.heal ?? 0));
    this.length += item.effect.growth ?? 0;
  }

  applyUpgrade(upgrade) {
    this.build.push(upgrade.id);
  }
}

class UpgradeSystem {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.energyThreshold = 100;
  }

  canRoll(player) {
    return player.energy >= this.energyThreshold;
  }

  rollChoices() {
    const sample = [...UPGRADE_POOL].sort(() => this.rng() - 0.5);
    return sample.slice(0, 3);
  }

  consumeEnergy(player) {
    player.energy -= this.energyThreshold;
    this.energyThreshold = Math.floor(this.energyThreshold * 1.35);
  }
}

class WaveDirector {
  constructor() {
    this.wave = 1;
    this.elapsed = 0;
  }

  nextSecond() {
    this.elapsed += 1;
    if (this.elapsed % 60 === 0) this.wave += 1;
  }

  shouldSpawnBoss() {
    return this.wave > 0 && this.wave % 5 === 0;
  }
}

class GameCore {
  constructor() {
    this.bus = new EventBus();
    this.player = new SnakePlayer();
    this.upgrades = new UpgradeSystem();
    this.waveDirector = new WaveDirector();
    this.running = false;
  }

  bootstrap() {
    console.log('[Bootstrap] 初始化抖音小游戏框架...');
    console.log('[Config] enemy=', Object.keys(ENEMY_LIBRARY));
    console.log('[Config] items=', Object.keys(ITEM_LIBRARY));
    console.log('[Config] boss=', Object.keys(BOSS_LIBRARY));
    console.log('[Config] rarities=', RARITY_TABLE.map((r) => `${r.rarity}:${r.weight}`).join(', '));

    this.bus.on('pickup:item', (itemId) => {
      const item = ITEM_LIBRARY[itemId];
      if (!item) return;
      this.player.eat(item);
      console.log(`[Pickup] ${item.name}, energy=${this.player.energy}, length=${this.player.length}`);
      this.checkUpgradeRoll();
    });
  }

  checkUpgradeRoll() {
    if (!this.upgrades.canRoll(this.player)) return;
    const choices = this.upgrades.rollChoices();
    const selected = choices[0];
    this.player.applyUpgrade(selected);
    this.upgrades.consumeEnergy(this.player);
    console.log(`[Upgrade] 触发强化三选一，自动选择: ${selected.name}`);
  }

  tick() {
    this.waveDirector.nextSecond();
    if (this.waveDirector.shouldSpawnBoss()) {
      console.log(`[Wave ${this.waveDirector.wave}] Boss 即将出现: ${BOSS_LIBRARY.titan_worm.name}`);
    }
  }

  runDemo() {
    this.running = true;
    this.bootstrap();

    const scriptItems = ['apple_core', 'plasma_orb', 'apple_core', 'shell_chip', 'plasma_orb'];
    for (let i = 0; i < 180; i += 1) {
      if (i % 15 === 0) {
        this.bus.emit('pickup:item', scriptItems[(i / 15) % scriptItems.length]);
      }
      this.tick();
    }

    console.log('[Result] build=', this.player.build);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  new GameCore().runDemo();
}

export { GameCore };
