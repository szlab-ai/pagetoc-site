# Device frames

真实机身贴图，不是画的。来自 **Facebook (Meta) Design — Devices**：
<https://design.facebook.com/toolsandresources/devices/>

取自 fastlane 的 `frameit-frames` 发布点（`fastlane frameit download_frames`
用的是同一份）：<https://fastlane.github.io/frameit-frames/latest/>

- `Apple iPhone 16 Black.png` —— 屏幕区 1179×2556，偏移 +90+90
- `Apple iPad Pro (12.9-inch) (4th generation) Space Gray Landscape.png` ——
  官方素材只有竖版，这张是 `magick -rotate 90` 转出来的；屏幕区 2732×2048，偏移 +96+96
- `Apple MacBook Air Space Gray.png` —— 屏幕区 2560×1600，偏移 +373+123

偏移与屏幕尺寸来自同一发布点的 `offsets.json`，`scripts/capture.mjs` 里的
`DEVICES` 就是照抄这几个数。换机型的话，去 `files.json` 找文件名、去
`offsets.json` 找偏移，两处一起改。

`offsets.json` **没有**开孔圆角，而截图是直角的 —— 不裁一下，四个角会从机身圆弧
外面戳出来。`DEVICES[*].screenRadius`（iPhone 170 / iPad 38 / MacBook 0）是从帧图
自己的 alpha 通道量出来的：把屏幕区导成灰度 alpha，逐行找第一个全透明像素，再拟合
成圆。换机型时这个数也要重量一次。

## 授权声明

原文来自 `fastlane frameit` 下载时打印的免责声明：

> All used device frames are available via Facebook Design.
> While Facebook has redrawn and shares these assets for the benefit of the
> design community, Facebook does not own any of the underlying product or user
> interface designs. By accessing these assets, you agree to obtain all
> necessary permissions from the underlying rights holders and/or adhere to any
> applicable brand use guidelines.

也就是：素材本身可自由使用，但**苹果的品牌与产品图使用规范仍然适用**。这里的用法
（在自家产品站上，用苹果设备外形展示自家 App）正是这类素材的常规用途；如果哪天要
把这些图用到别处，先对一次 Apple Marketing Guidelines。
