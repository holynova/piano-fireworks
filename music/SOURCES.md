# 曲库与谱源

曲库自带 AAC 立体声音频和逐音的起始时间、MIDI 音高、力度。播放、切曲和定位均可离线使用。各版本的来源与许可列于下表。原始 MIDI 以及 Mutopia 作品的可编辑 LilyPond 谱源保存在 `scores/`。

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

### 新增钢琴曲

以下二十首按所列出版文件的 MIDI 顺序演奏。保留源文件的速度变化与踏板信息，对只有一种力度的谱面按音区和乐句调整触键，重新渲染钢琴并生成烟花时间表。表中注明 CC BY 或 CC BY-SA 的曲目，其改编音轨和逐音数据按对应的同一许可提供。

| 曲目 | 排谱者 / 维护者 | 版本 | 许可 |
| --- | --- | --- | --- |
| 贝多芬《月光奏鸣曲》第一乐章，Op. 27 No. 2 | Stewart Holmes | [Mutopia 276](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=276)，取第一乐章 | [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5/) |
| 肖邦《降 E 大调夜曲》，Op. 9 No. 2 | Renato Biolcati Rinaldi | [Mutopia 1590](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1590) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| 莫扎特《C 大调奏鸣曲》第一乐章，K. 545 | Alejandro Sierra | [Mutopia 998](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=998) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| 舒曼《童年情景》之《异国和异国人民》，Op. 15 No. 1 | Ying-Chun Liu | [Mutopia 354](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=354) | 公有领域 |
| 肖邦《小狗圆舞曲》，Op. 64 No. 1 | Magnus Lewis-Smith | [Mutopia 483](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=483) | 公有领域 |
| 贝多芬《悲怆奏鸣曲》第二乐章，Op. 13 | Chris Sawer | [Mutopia 295](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=295) | 公有领域 |
| 巴赫《第一首二部创意曲》，BWV 772 | Jeff Covey | [Mutopia 40](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=40) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| 肖邦《幻想即兴曲》，Op. 66 | Guy D. Lederfein | [Mutopia 1693](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1693) | 公有领域 |
| 肖邦《E 小调前奏曲》，Op. 28 No. 4 | Roland Goretzki | [Mutopia 921](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=921) | 公有领域 |
| 乔普林《枫叶拉格》 | Chris Sawer | [Mutopia 23](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=23) | 公有领域 |
| 德彪西《第一号阿拉伯风格曲》，L. 66 No. 1 | Keith OHara | [Mutopia 1777](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1777) | 公有领域 |
| 肖邦《雨滴前奏曲》，Op. 28 No. 15 | Magnus Lewis-Smith | [Mutopia 471](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=471) | 公有领域 |
| 格里格《山魔王的宫殿》，Op. 46 No. 4 · 钢琴版 | Coyau | [Mutopia 1888](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1888) | 公有领域 |
| 李斯特《第三号安慰曲》，S. 172 No. 3 | Ryan Prince | [Mutopia 1647](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1647) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| 门德尔松《威尼斯船歌》，Op. 30 No. 6 | Ryan Prince | [Mutopia 1741](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1741) | 公有领域 |
| 拉赫玛尼诺夫《升 C 小调前奏曲》，Op. 3 No. 2 | Petro Kostandy | [Mutopia 2033](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2033) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 舒伯特《降 G 大调即兴曲》，D. 899 No. 3 | Ph. Raynaud | [Mutopia 1193](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1193) | 公有领域 |
| 萨蒂《第一号玄秘曲》，Gnossienne No. 1 | Knute Snortum | [Mutopia 2035](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2035) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| 比才《卡门序曲》，钢琴版 | Alex O'S | [Mutopia 635](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=635) | [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5/) |
| 佩措尔德《G 大调小步舞曲》，BWV Anh. 114 | Allen Garvin | [Mutopia 75](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=75) | 公有领域 |

### 演奏处理

原有曲库中，《土耳其进行曲》《致爱丽丝》和《第一号吉姆诺佩迪》依照纸谱反复记号展开演奏，轮次采用各自的第一、第二结尾。《土耳其进行曲》采用适合演出的 126 BPM。莫扎特和贝多芬的预览 MIDI 采用单一触键力度，本版依照乐句、重拍和左右手重新配力度。萨蒂沿用谱源 MIDI 的力度。曲末保留琴弦衰减声。

《少女的祈祷》沿用 MIDI 演奏的力度和变速，并将 CC64 踏板释放时刻计入延音，去掉开头的静默预备拍。《月光》依据谱中的 rubato、Un poco mosso、En animant、Calmato 和 morendo 等标记重新编排各段速度和触键。《C 大调前奏曲》按四分音符 80 BPM 演奏，并给分解和弦加入乐句力度。

音乐由 macOS 自带的 General MIDI 音色库渲染。钢琴沿用原音色，三首新增曲分别使用尼龙弦吉他、大提琴和马林巴音色。每个音符的起点按 48 kHz 对齐到音频采样，同一份事件表写入 `tracks.js`，供网页在当前播放时间取用。古典曲目的起始留白为 100 毫秒，谱面休止另计，原创曲保留原有 150 毫秒引子；这些偏移已含在事件时间中。

## 重建

在项目根目录运行 `uv run music/build.py`。需要 macOS 的 Swift 编译器、AVFoundation 与 FFmpeg。构建脚本从本地 MIDI 读取，复用 `src/piano.swift`，重新生成曲库中的 M4A 文件、离线导出音频副本和 `music/tracks.js`。播放网页无需这些开发工具。

更多可编辑的古典乐谱见 [Mutopia 项目源码库](https://github.com/MutopiaProject/MutopiaProject)。
