# GLASS AHA — The Art of Almost Seeing / V3

一个冷蓝色、可触摸的模糊实验。玻璃舞台负责被观看，外围交互控件负责让观看本身变得可玩。三幕：等雨停 / 没寄出的信 / 末班车的窗。

## Interactions

- 擦开 / 凝雾，支持鼠标拖动、单指移动、长按笔触扩散、双击涟漪、双指捏合笔触缩放；笔触、力度、回雾与弥散可调。
- `←` / `→` 切换章节；`B` 切换笔触；`+` / `−` 调整大小；`R` 完整观看；`Esc` 重新起雾。
- 外围 UI：液态控制坞、控件状态回弹、滑杆反馈、章节卡片、手势帮助与 About 浮层；移动端自动重排。

## Architecture

- `src/main.js` — **保留原 V2 玻璃交互引擎**，独立 WebGL2 Shader + Canvas2D 降级。
- `src/liquid-ui.js` — **V3 新增 UI optics**：一张共享全屏蓝色背景 Canvas → 按 DOM `getBoundingClientRect()` 对每个重点控件截取局部纹理 → 共用 GLSL 光学算法，计算圆角遮罩、全表面折射、缓慢扰动、非对称边缘高光 → 在各控件独立 Canvas 中合成，DOM 仍负责文本、焦点和点击。
- `liquid-ui.css` — **V3 新增 UI 外形、反馈和响应式设计**；`style.css` 保留 V2 基础。
- `index.html` — 重新构建外围信息架构，显著增加了玻璃舞台的视觉权重。

## Run

本项目无 npm 依赖。在项目根目录执行 `python3 -m http.server 5173`，然后浏览 `http://localhost:5173`。可直接部署为 GitHub Pages / Vercel 静态站。

`?no-optics` 可关闭外围光学层。浏览器不支持 WebGL2 或开启系统降低透明度时，控件会回退为仍然可读、可点击的轻量玻璃样式；`prefers-reduced-motion` 限制动画刷新。Shader 属于设计性光学模拟，不是物理精确的路径追踪。

## QA status

已通过桌面及 390px 手机断点的 DOM 布局检查和交互事件测试；目标页面没有脚本异常。测试沙盒禁止实际 GPU 上下文，因此 **WebGL2 UI Shader 尚未完成真实设备上的渲染/性能验收**；不要将降级截图当作 WebGL2 最终效果。建议在桌面 Chrome/Safari 与 iOS/Android 上验收 GPU 内存、帧率、上下文恢复、透明度偏好和多个控件的边缘采样。

## Credit

灵感来自 [Johnlzx/glass-garden](https://github.com/Johnlzx/glass-garden) 的玻璃材质研究；不包含其原始图片或代码。外围光学设计依据用户提供的《液态玻璃_技术方案_v3_whereyanlands.pdf》的架构原则独立实现。
