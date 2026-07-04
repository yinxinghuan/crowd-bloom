# Technical

## 1. 技术栈

- React 18 + TypeScript + Vite，构建 `base: './'`，样式使用 Less。
- 渲染方式是 DOM/CSS：公共花、花瓣、萤火虫和反馈动画全部由 CSS transform、keyframes 和普通 `<img>` 完成。
- 平台能力来自 `src/shared/runtime` 和 `src/shared/save`：读取当前用户资料、保存个人花瓣 archive、读取其他用户最新存档、打开 Aigram 个人主页。
- `AW.PROFILE.EDIT` 通过本地 `callAvatarEditor()` 发送系统 UI 消息，用于打开平台头像编辑/生成页。
- 声音使用 Web Audio API 合成，不依赖音频文件。

## 2. 目录结构

- `src/main.tsx`：入口文件，导入自动生成的 `game-id.ts` 后挂载 React。
- `src/game-id.ts`：由 `scripts/sync-game-ids.py` 生成，绑定 `window.__GAME_UUID__`。
- `src/App.tsx` / `src/App.less`：应用壳和全局 reset；非 Aigram 环境默认进入评审页，`?play=1` 可进入真实空环境。
- `src/CrowdBloom/CrowdBloom.tsx`：主 UI，渲染公共花、可点击头像花瓣、主按钮和头像缺失 sheet。
- `src/CrowdBloom/CrowdBloom.less`：完整视觉系统、布局和动画。
- `src/CrowdBloom/ReviewPage.tsx` / `ReviewPage.less`：线上评审页，静态展示 ready、missing-avatar、planted、community 四个状态，解释花瓣含义和迁移 zip。
- `src/CrowdBloom/hooks/useCrowdBloom.ts`：当前用户资料、存档 mirror、社区花瓣读取、plant 行为、头像编辑系统调用。
- `src/CrowdBloom/i18n/index.ts`：zh/en 轻量 i18n，所有用户可见文案走 `t()`。
- `src/CrowdBloom/utils/sounds.ts`：Web Audio 合成音效。
- `src/CrowdBloom/types.ts`：画布尺寸、花瓣颜色、存档和资料类型。
- `src/shared/runtime`：Aigram bridge、用户资料 API、系统 profile 打开能力。
- `src/shared/save`：平台 save/data 与本地 localStorage 同步 hook。
- `public/img/aigram.svg` 和 `public/poster.svg`：水印与封面图。

## 3. 核心模块

- 状态管理：`useCrowdBloom()` 持有 `mode`、当前 `profile`、`mirror` 存档、`community` 花瓣、冷却时间和响应式 scale。
- 评审模式：`App.tsx` 检查 `isInAigram` 和 URL 参数；非 Aigram 且未带 `?play=1` 时渲染 `ReviewPage`，避免线上预览因缺少平台头像数据而只看到无语义 demo 花瓣。
- 主循环/动画：没有 JS 物理循环；公共花慢速旋转、花瓣 bob、当前用户 halo、萤火虫和 `+1` 反馈全部由 CSS keyframes 驱动。
- 屏幕适配：`FIELD_W=390`、`FIELD_H=680`，根据 `window.innerWidth/innerHeight` 计算 scale，stage 保持 24px 圆角裁剪。
- 存档：`useGameSave<BloomSave>('crowd-bloom')` 只用于初始读取和写入；代码用本地 `mirror` seeded once 作为 source of truth，避免 `savedData` stale overwrite。
- 社区墙/公共物件：`refreshCommunity()` 调 `/note/aigram/ai/game/get/data/list`，遍历每个用户 save 的全部 `petals`，按 `createdAt` 降序取最新 50 个；本地 mirror 花瓣 optimistic merge 后按 `petal.id` dedupe。
- 头像资料：当前用户和社区作者均通过 `/note/telegram/user/get/info/by/telegram_id` 读取 `name` 和 `head_url`；其他用户的头像花瓣可点击打开 profile，自己的花瓣只显示高亮。
- 头像缺失：如果当前用户没有 `head_url`，主按钮打开 avatar-missing sheet；`Generate avatar / 去生成头像` 调用 `AW.PROFILE.EDIT`，离开 Aigram 环境时按钮禁用并展示提示。
- 输入：游戏主动作使用 `onPointerDown`；社区作者 chip 在滚动 strip 内使用 `onClick` 并 `stopPropagation()`；键盘 `Space`/`Enter` 触发主动作。
- 音频：首次 pointer 交互 `resumeAudio()`；点击、成功种下、缺头像和打开系统页分别触发合成音效，失败静默。
- 多语言：`localStorage.game_locale` 可强制 `zh`/`en`，否则根据 `navigator.language` 自动判断。

## 4. 扩展点

- 改玩法数值：编辑 `src/CrowdBloom/hooks/useCrowdBloom.ts` 的 `MAX_OWN_PETALS`、`MAX_VISIBLE_PETALS`、`COOLDOWN_MS`、`makePetal()`。
- 改花瓣布局：编辑 `src/CrowdBloom/CrowdBloom.tsx` 的 `RING_RADIUS` 和 `src/CrowdBloom/types.ts` 的 `PETAL_COLORS`。
- 改视觉主题：编辑 `src/CrowdBloom/CrowdBloom.less` 的背景、花瓣、核心、按钮和 sheet 样式。
- 改评审页：编辑 `src/CrowdBloom/ReviewPage.tsx` 和 `ReviewPage.less`，不影响 Aigram 内真实游戏逻辑。
- 改文案：编辑 `src/CrowdBloom/i18n/index.ts`，保持 zh/en 键一致。
- 改音效：编辑 `src/CrowdBloom/utils/sounds.ts` 的频率、波形、时长和 gain。
- 改头像生成入口：编辑 `callAvatarEditor()`，当前发送 `AW.PROFILE.EDIT`；如果平台以后提供专门头像生成路径，只需替换此函数。
- 加通知或更强社交动作：在 `useCrowdBloom.ts` 成功 plant 后接入 `useGameEvent()` 或 notify config，并在技术文档补充事件名和数据所有权。
- 发布元数据：编辑 `meta.json`、`games/games.json` 和 `public/poster.svg`。
