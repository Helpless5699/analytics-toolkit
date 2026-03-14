# Snake Survivor: 抖音小游戏首发架构骨架

这是一个面向**抖音小游戏（ByteDance Mini Game）**的蛇式幸存者首发架构仓库。当前实现不再只是单文件原型，而是把 `W1-4` 垂直切片和后续 `Alpha / Beta / Launch` 所需的数据契约、平台桥接、埋点、远程配置、广告约束一起落成了可演练的运行时骨架。

核心目标：
- 3 秒可控，30 秒出现第一次爽点，45 秒内触发首次三选一。
- 单局压缩到 5~7 分钟，更贴近抖音小游戏的秒开和复访节奏。
- 提前铺好好友排行榜、侧边栏复访、订阅消息、广告频控、灰度实验这些上线必备能力。

## 当前实现

- `src/app/createSnakeSurvivorApp.js`：应用装配层，负责启动遥测、远程配置、平台桥接和本地演示。
- `src/data/`：首发数据契约，包含 `SnakeHeadConfig / UpgradeConfig / EnemyConfig / BossConfig / WaveConfig / EventRoomConfig / TalentNodeConfig / LiveOpsConfig / ExperimentConfig`。
- `src/services/`：平台桥接、用户档案、埋点、实验和远程开关。
- `src/systems/`：局内运行时，包括波次推进、强化三选一和 5 分钟首发垂直切片流程。
- `src/verification/acceptanceSuite.js`：验收脚本，校验内容规模、节奏门槛和插屏广告频控。
- `src/content/`：保留为早期数值种子参考，不再作为正式运行时入口。

## 快速开始

```bash
npm run demo
npm run acceptance
```

> 当前环境里没有安装 `node`，所以我这次提交无法在本机直接跑通脚本，但代码结构已经按 ESM 入口组织好了。

## 首发垂直切片范围

- 1 张激活地图：`season0_scrapyard`
- 1 个激活蛇头：`starter_viper`
- 12 个激活强化
- 6 个普通敌人 + 1 个精英敌人
- 1 个激活 Boss：`titan_worm`
- 30 秒极简引导、失败原因埋点、排行榜提交
- 复活广告、结算双倍、周常和侧边栏回流已经以功能开关形式预埋，等 Alpha/Beta 打开

## 后续扩展位

- `LiveOpsConfig.contentPhases` 已经预埋 `vertical_slice / alpha / beta / launch` 四个阶段。
- `RemoteConfigService` 已支持灰度功能开关和实验分桶。
- `MockDouyinPlatformBridge` 已实现 `load/save profile`、排行榜、订阅、侧边栏复访、激励广告和插屏广告频控的统一接口，后续接入真实抖音小游戏 API 时只需要替换桥接层。
