# 花火琴房 · Piano Fireworks

[观演厅 / Live](https://piano-fireworks.xiaosang.cc/) · [GitHub](https://github.com/holynova/piano-fireworks)

十首器乐曲，一座可以自己编排的烟花观演厅。爆点跟随谱面起音，右侧可换景、巡镜，或对比两组亮度与节奏设置。导出的 MP4 带曲目信息、项目二维码和网址。

![观演厅演出画面](assets/screenshot.png)

<img src="assets/qr.png" alt="扫码打开花火琴房" width="136">

An interactive concert hall for ten instrumental pieces. Fireworks follow the score, from plucked guitar to solo cello and marimba. Change the scenery or tune the show while listening. Export a 720p MP4 with the original audio, track title and a scannable project link.

直接打开 `index.html` 可离线播放；重建音轨和编排说明见[曲库来源](music/SOURCES.md)和[播放器手册](docs/player-guide.md)。

Open `index.html` locally, or run `python3 -m http.server 8080`. To publish from the main branch, install the locked tools with `npm ci`, then run `npm run deploy`.
