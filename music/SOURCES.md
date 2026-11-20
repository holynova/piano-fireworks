# 曲库与谱源

曲库自带 AAC 立体声音频和逐音的起始时间、MIDI 音高、力度。播放、切曲和定位均可离线使用。引入的乐谱采用各来源标明的公有领域版本。原始 MIDI 以及 Mutopia 作品的可编辑 LilyPond 谱源保存在 `scores/`。

| 曲目 | 本次演奏速度（四分音符 / 分） | 乐谱及排谱者 |
| --- | ---: | --- |
| 莫扎特《土耳其进行曲》，K.331 第三乐章 | 126 | Rune Zedeler、Chris Sawer，[Mutopia 108](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=108) |
| 贝多芬《致爱丽丝》，WoO 59 | 72 | Stelios Samelis，[Mutopia 931](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=931) |
| 萨蒂《第一号吉姆诺佩迪》 | 60 | Evin Robertson，[Mutopia 37](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=37) |
| 巴达捷夫斯卡《少女的祈祷》，Op. 4 | 约 83 起，自由速度 | Michael Bednarek 自制并释入公有领域的 [Wikimedia Commons MIDI](https://commons.wikimedia.org/wiki/File:A_Maiden%27s_Prayer.mid) |
| 德彪西《月光》，《贝加莫组曲》第三曲 | 60 起，随段落变化 | Keith OHara 据 Fromont 1905 年版排谱，[Mutopia 1778](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1778) |
| 巴赫《C 大调前奏曲》，BWV 846 | 80 | Tobias Erbsland，[Mutopia 5](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=5) |
| 《夜空练习曲》 | 120 | 本项目原创，乐谱见 `../src/score.py` |
| 《绿袖子》，英格兰传统民谣 | 108 | Aaron Fontaine 排谱，本版使用尼龙弦吉他，[Mutopia 109](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=109) |
| 巴赫《第一大提琴组曲 · 前奏曲》，BWV 1007 | 80 | Andreas Scherer 维护的 1916 年 Schirmer 版，大提琴独奏，MIDI 取自谱源包中的 `bwv1007.mid`，[Mutopia 517](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=517) |
| 乔普林《演艺人》 | 84 | Chris Sawer 据 1902 年版排谱，采用已展开反复的谱面，本版改用马林巴，[Mutopia 263](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=263) |

古典乐曲依照纸谱反复记号展开演奏，轮次采用各自的第一、第二结尾。《土耳其进行曲》采用适合演出的 126 BPM。莫扎特和贝多芬的预览 MIDI 采用单一触键力度，本版依照乐句、重拍和左右手重新配力度。萨蒂沿用谱源 MIDI 的力度。曲末保留琴弦衰减声。

《少女的祈祷》沿用 MIDI 演奏的力度和变速，并将 CC64 踏板释放时刻计入延音，去掉开头的静默预备拍。《月光》依据谱中的 rubato、Un poco mosso、En animant、Calmato 和 morendo 等标记重新编排各段速度和触键。《C 大调前奏曲》按四分音符 80 BPM 演奏，并给分解和弦加入乐句力度。

音乐由 macOS 自带的 General MIDI 音色库渲染。钢琴沿用原音色，三首新增曲分别使用尼龙弦吉他、大提琴和马林巴音色。每个音符的起点按 48 kHz 对齐到音频采样，同一份事件表写入 `tracks.js`，供网页在当前播放时间取用。古典曲目的起始留白为 100 毫秒，谱面休止另计，原创曲保留原有 150 毫秒引子；这些偏移已含在事件时间中。

## 重建

在项目根目录运行 `uv run music/build.py`。需要 macOS 的 Swift 编译器、AVFoundation 与 FFmpeg。构建脚本从本地 MIDI 读取，复用 `src/piano.swift`，重新生成曲库中的 M4A 文件、离线导出音频副本和 `music/tracks.js`。播放网页无需这些开发工具。

更多可编辑的古典乐谱见 [Mutopia 项目源码库](https://github.com/MutopiaProject/MutopiaProject)。
