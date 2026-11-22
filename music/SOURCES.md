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

### 千本樱、甩葱歌与货郎

| 曲目 | 演奏版本 |
| --- | --- |
| 千本樱 · 冰上演奏 | 黒うさP 作曲，十五的月亮廿九圆冰面实演。截取原视频 0:07.20 至 1:02.75，削减风噪。烟花跟随录音中检测到的滑音起点，力度取自起音能量，键盘按共鸣频率降低两个八度显示。144 BPM 仅用于段落编排。录音未标注开放转载许可。[原作](https://whiteflame.jp/10th-senbonzakura/) · [冰块演奏](https://www.bilibili.com/video/BV1FV411b7Qf/) |
| 甩葱歌（Ievan Polkka） | 芬兰传统旋律，按 AABB 展开，配手风琴低音与反拍和弦。[Redbird 记谱](https://thesession.org/tunes/418#setting418) |
| 货郎（Korobeiniki） | 俄罗斯传统旋律，改编为方波合成器演奏，加入原创低音伴奏。[SturdyPete 记谱](https://thesession.org/tunes/13747#setting24502) |

两首舞曲的改编 MIDI 在 `scores/`。《千本樱》使用本地录音 `senbonzakura.m4a` 作母带，重建时从母带提取起音，保留原演奏的速度变化。

### 小军鼓独奏

《列队》（112 BPM）、《错步》（100 BPM）和《潮汐滚奏》（84 BPM）为本项目原创，鼓谱见 `src/snare.py`。音色采用 Sam Gossner、Simon Dalzell 录制的 VSCO 2 Community Edition 小军鼓，保留响弦，使用四档力度、每档两条交替采样。轻击、单击、重音和每一次滚奏击打都从同一份鼓谱生成音频与烟花。[采样文件（Snare2-HitSN）](https://github.com/sgossner/VSCO-2-CE/tree/440300901dfe9275fd84e0b7763af1f8443ae62e/Percussion) · [CC0 许可](https://github.com/sgossner/VSCO-2-CE/blob/440300901dfe9275fd84e0b7763af1f8443ae62e/LICENSE)

### 《致爱丽丝 · 冰上主题》

旋律取自本曲已有的 [Mutopia 931 右手声部](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=931)，节选开头主题，移入冰块的共鸣音区。冰面滑奏录音来自十五的月亮廿九圆的[《千本冰》](https://www.bilibili.com/video/BV1FV411b7Qf/)和[《冰农》](https://www.bilibili.com/video/BV12u411D738/)。视频页未列出开放采样许可。

单次滑音片段保存在 `src/ice-slides.wav`，按 `src/ice.py` 中的来源、毫秒区间和共鸣频率排列。剪辑时衰减低频风噪，在边界做短淡入淡出。渲染时以最接近目标音高的片段轻微变速，保留摩擦起音，按同一份起音时间表触发烟花。

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

《钟》（李斯特《帕格尼尼大练习曲》S.141 第 3 首，升 G 小调）保留排谱中的变速和力度，重新渲染钢琴音轨，烟花沿用同一份起音表。MusicNotesDir 将所用 MusicXML 标为公有领域。项目同时保留可编辑的 MusicXML 和该版本生成的 MIDI。[谱源与 MIDI](https://musicnotesdir.com/piece/liszt-la-campanella-grandes-etudes-de-paganini-no-3-franz-liszt/) · [MuseTrainer 乐谱文件](https://github.com/musetrainer/library/blob/master/scores/La_Campanella_-_Grandes_Etudes_de_Paganini_No._3_-_Franz_Liszt.mxl)

### 名家演绎曲目与钢琴名曲

以下七首使用公开乐谱重新渲染钢琴。《圣母颂》将原谱的小提琴旋律与钢琴伴奏合并为钢琴音轨。

| 作品 | 谱源 |
| --- | --- |
| 舒曼《梦幻曲》 | Ying-Chun Liu 排谱，公有领域。[Mutopia 504](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=504) |
| 巴赫／古诺《圣母颂》 | Yann Leprince 排谱，公有领域。[Mutopia 2167](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2167) |
| 里姆斯基－科萨科夫《野蜂飞舞》 | MuseTrainer 排谱，MusicNotesDir 将版本列为公有领域。[乐谱与 MIDI](https://musicnotesdir.com/piece/domain-flight-of-the-bumblebee/) |
| 肖邦《革命练习曲》 | Roland Goretzki 排谱，公有领域。[Mutopia 743](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=743) |
| 帕赫贝尔《D 大调卡农》 | MuseTrainer 排谱，MusicNotesDir 将版本列为公有领域。[乐谱与 MIDI](https://musicnotesdir.com/piece/domain-canon-in-d/) |
| 李斯特《爱之梦 · 第三首》 | MuseTrainer 排谱，MusicNotesDir 将版本列为公有领域。[乐谱与 MIDI](https://musicnotesdir.com/piece/domain-liebestraum-no-3-in-a-major/) |
| 勃拉姆斯《匈牙利舞曲 · 第五号》 | MuseTrainer 排谱，MusicNotesDir 将版本列为公有领域。[乐谱与 MIDI](https://musicnotesdir.com/piece/domain-hungarian-dance-no-5-in-g-minor/) |

克莱德曼曾录制《圣母颂》与《梦幻曲》，马克西姆的《The Piano Player》收录了《野蜂飞舞》与《革命练习曲》。曲目面板中的原版试听由 Apple Music 播放。[克莱德曼专辑曲目](https://music.apple.com/us/album/les-musiques-de-lamour/1646630190) · [马克西姆专辑曲目](https://music.apple.com/us/album/the-piano-player/695999850)

### 中国曲目与室内合奏

九首民歌取自 Helmut Schaffrath 主持编录的 [Essen / EsAC 民歌库](https://www.esac-data.org/)，采用 [midicn-lib v1.23 的 Essen MIDI 包](https://github.com/midicn/midi-library/releases/tag/v1.23-packs)。该发行版将所列条目标为 main / OPEN，使用说明见 [midicn-lib 的来源及许可说明](https://github.com/midicn/midi-library/blob/main/LICENSE.md)。每曲保留所选地方版本的旋律与节奏，重新编写速度、力度、反复和声部，采用真乐器单音采样重新演奏。表中速度为基准速度，句尾和段落换气处随谱变化。

| 曲目 | 演奏 | 谱源 |
| --- | --- | --- |
| 江苏民歌《茉莉花》 | 长笛 · 越南筝 · 竖琴，80 BPM | [EsAC / essen-000463](https://lib.midicn.com/detail.html?play=essen-000463) |
| 安徽民歌《凤阳花鼓》 | 越南筝 · 长笛 · 竖琴 · 手鼓，112 BPM | [EsAC / essen-000454](https://lib.midicn.com/detail.html?play=essen-000454) |
| 四川民歌《康定情歌》 | 长笛 · 竖琴 · 越南筝，88 BPM | [EsAC / essen-000496](https://lib.midicn.com/detail.html?play=essen-000496) |
| 江苏民歌《紫竹调》 | 越南筝 · 长笛 · 竖琴，96 BPM | [EsAC / essen-000460](https://lib.midicn.com/detail.html?play=essen-000460) |
| 宁夏民歌《黄河船夫号子》 | 大提琴 · 竖琴，84 BPM | [EsAC / essen-000818](https://lib.midicn.com/detail.html?play=essen-000818) |
| 山西民歌《绣荷包》 | 竖琴 · 越南筝，76 BPM | [EsAC / essen-008897](https://lib.midicn.com/detail.html?play=essen-008897) |
| 福建民歌《采茶灯》 | 长笛 · 越南筝 · 竖琴 · 手鼓，116 BPM | [EsAC / essen-000065](https://lib.midicn.com/detail.html?play=essen-000065) |
| 江苏民歌《无锡景》 | 越南筝 · 竖琴，78 BPM | [EsAC / essen-000461](https://lib.midicn.com/detail.html?play=essen-000461) |
| 河北民歌《孟姜女哭长城》 | 大提琴 · 长笛 · 竖琴，66 BPM | [EsAC / essen-000162](https://lib.midicn.com/detail.html?play=essen-000162) |
| 冼星海《保卫黄河 · 主题轮奏》 | 大提琴 · 长笛 · 竖琴 · 手鼓，128 BPM | [1940 年生活书店谱，第 34–36 页](https://commons.wikimedia.org/wiki/File:NLC416-14jh000644-70576_%E9%BB%83%E6%B2%B3.pdf) |

《保卫黄河》取自冼星海《黄河大合唱》第七曲。依据国图藏本的数字谱摘录第一声部，第二遍用低八度依次模仿，以大提琴、长笛和手鼓重写应答。《黄河船夫号子》取自宁夏民歌条目，是另一首曲子。

### 演奏处理

原有曲库中，《土耳其进行曲》《致爱丽丝》和《第一号吉姆诺佩迪》依照纸谱反复记号展开演奏，轮次采用各自的第一、第二结尾。《土耳其进行曲》采用适合演出的 126 BPM。莫扎特和贝多芬的预览 MIDI 采用单一触键力度，本版依照乐句、重拍和左右手重新配力度。萨蒂沿用谱源 MIDI 的力度。曲末保留琴弦衰减声。

《少女的祈祷》沿用 MIDI 演奏的力度和变速，并将 CC64 踏板释放时刻计入延音，去掉开头的静默预备拍。《月光》依据谱中的 rubato、Un poco mosso、En animant、Calmato 和 morendo 等标记重新编排各段速度和触键。《C 大调前奏曲》按四分音符 80 BPM 演奏，并给分解和弦加入乐句力度。

十首中国曲目的录音使用 Versilian Studios 的开放采样。筝为越南 đàn tranh，另有民谣竖琴、手鼓、长笛及大提琴组。各声部以同一份带乐句速度的起音表生成音频和烟花。采样来源见 [VCSL](https://github.com/sgossner/VCSL/tree/c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e) 与 [VSCO 2 Community Edition](https://github.com/sgossner/VSCO-2-CE/tree/440300901dfe9275fd84e0b7763af1f8443ae62e)，两者均采用 CC0。

其余曲目由 macOS 自带的 General MIDI 音色库渲染。钢琴沿用原音色，三首新增曲分别使用尼龙弦吉他、大提琴和马林巴音色。合奏以 32 kHz 渲染，其余曲目以 48 kHz 渲染；音符起点对齐到音频采样，同一份事件表写入 `tracks.js`，供网页在当前播放时间取用。古典曲目的起始留白为 100 毫秒，谱面休止另计，原创曲保留原有 150 毫秒引子；这些偏移已含在事件时间中。

## 重建

在项目根目录运行 `uv run music/build.py`。需要 macOS 的 Swift 编译器、AVFoundation 与 FFmpeg。构建脚本从本地 MIDI 读取，复用 `src/piano.swift`，重新生成曲库中的 M4A 文件、离线导出音频副本和 `music/tracks.js`。播放网页无需这些开发工具。

更多可编辑的古典乐谱见 [Mutopia 项目源码库](https://github.com/MutopiaProject/MutopiaProject)。
