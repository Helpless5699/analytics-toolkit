# Snake Survivor: 抖音 2D 肉鸽爽游框架

这是一个面向**抖音小游戏（ByteDance Mini Game）**的 2D 肉鸽框架项目。

核心玩法：
- 玩家操控贪吃蛇，在有限战局中生存并成长。
- 通过吞噬道具与生物积累能量，触发随机强化三选一。
- 逐步构建流派（高速连击 / 巨蛇碾压 / 毒爆控制 / 召唤协同等），挑战更高波次与 Boss。

## 项目结构

- `docs/game-design.md`：完整设计文档（系统、数值、商业化、技术、版本规划）。
- `src/gameFramework.js`：小游戏主循环 + 核心子系统骨架。
- `src/content/entities.js`：生物、道具、Boss 等内容定义。
- `src/content/progression.js`：强化卡池、流派、局外成长定义。

## 快速开始

```bash
node src/gameFramework.js
```

> 当前仓库定位为“可执行设计框架”，用于快速搭建抖音小游戏原型。
