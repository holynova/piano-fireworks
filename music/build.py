# /// script
# requires-python = ">=3.10"
# dependencies = ["mido==1.3.3", "numpy>=1.26,<3"]
# ///
"""Rebuild the audio tracks and browser cue sheet on macOS: uv run music/build.py."""
from bisect import bisect_right
from collections import defaultdict, deque
import base64
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import tempfile

import mido

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / "src"
sys.dont_write_bytecode = True
sys.path.insert(0, str(SOURCE))
from score import arrangement, DURATION
import folk
import ice
import snare

# Quarter-note intervals in the official source MIDI. LilyPond's preview writes
# successive alternatives once; these itineraries play the printed repeats.
def repeated(start, end):
    return [(start, end)] * 2

TURCA = [
    *repeated(0, 16), *repeated(16, 48), *repeated(48, 64),
    *repeated(64, 80), *repeated(80, 112), *repeated(112, 128),
    *repeated(128, 144), *repeated(144, 176),
    (176, 192), (176, 191), (192, 255)
]
# These editions use their own MIDI tempo maps, including changes within a movement.
CLASSIC_PIANO = [
    ('traumerei', '梦幻曲', '舒曼', '童年情景 · Op. 15 第 7 首', 60, 'slow', 504, None),
    ('ave_maria', '圣母颂', '巴赫／古诺', '据 BWV 846 改编 · 钢琴版', 66, 'lyric', 2167, None),
    ('bumblebee', '野蜂飞舞', '里姆斯基－科萨科夫', '钢琴版', 144, 'fast', 'https://musicnotesdir.com/piece/domain-flight-of-the-bumblebee/', None),
    ('revolutionary', '革命练习曲', '肖邦', 'Op. 10 第 12 首', 160, 'fast', 743, None),
    ('piano_canon', 'D 大调卡农', '帕赫贝尔', '钢琴版', 100, 'lyric', 'https://musicnotesdir.com/piece/domain-canon-in-d/', None),
    ('liebestraum', '爱之梦 · 第三首', '李斯特', 'S. 541 第 3 首', 152, 'lyric', 'https://musicnotesdir.com/piece/domain-liebestraum-no-3-in-a-major/', None),
    ('hungarian_five', '匈牙利舞曲 · 第五号', '勃拉姆斯', 'G 小调钢琴版', 130, 'fast', 'https://musicnotesdir.com/piece/domain-hungarian-dance-no-5-in-g-minor/', None),
    ('moonlight', '月光奏鸣曲 · 第一乐章', '贝多芬', 'Op. 27 No. 2', 60, 'slow', 276, None),
    ('nocturne', '降 E 大调夜曲', '肖邦', 'Op. 9 No. 2', 66, 'lyric', 1590, None),
    ('facile', 'C 大调奏鸣曲 · 第一乐章', '莫扎特', 'K. 545', 132, 'fast', 998, None),
    ('kinderszenen', '童年情景 · 异国和异国人民', '舒曼', 'Op. 15 No. 1', 72, 'lyric', 354, None),
    ('minute', '小狗圆舞曲', '肖邦', 'Op. 64 No. 1', 280, 'fast', 483, None),
    ('pathetique', '悲怆奏鸣曲 · 第二乐章', '贝多芬', 'Op. 13', 36, 'slow', 295, None),
    ('invention', '第一首二部创意曲', '巴赫', 'BWV 772', 80, 'lyric', 40, None),
    ('fantaisie', '幻想即兴曲', '肖邦', 'Op. 66', 168, 'fast', 1693, None),
    ('eminor', 'E 小调前奏曲', '肖邦', 'Op. 28 No. 4', 48, 'slow', 921, None),
    ('maple', '枫叶拉格', '斯科特·乔普林', '拉格泰姆', 120, 'fast', 23, None),
    ('debussy_arabesque', '第一号阿拉伯风格曲', '德彪西', 'L. 66 No. 1', 144, 'lyric', 1777, None),
    ('raindrop', '雨滴前奏曲', '肖邦', 'Op. 28 No. 15', 80, 'slow', 471, None),
    ('mountain_king', '山魔王的宫殿', '格里格', 'Op. 46 No. 4 · 钢琴版', 138, 'fast', 1888, None),
    ('campanella', '钟', '李斯特', '帕格尼尼大练习曲 · S.141 第 3 首', 97, 'fast',
     'https://musicnotesdir.com/piece/liszt-la-campanella-grandes-etudes-de-paganini-no-3-franz-liszt/', None),
    ('consolation', '第三号安慰曲', '李斯特', 'S. 172 No. 3', 60, 'slow', 1647, None),
    ('gondola', '威尼斯船歌', '门德尔松', 'Op. 30 No. 6', 60, 'lyric', 1741, None),
    ('bells', '升 C 小调前奏曲', '拉赫玛尼诺夫', 'Op. 3 No. 2', 60, 'lyric', 2033, None),
    ('schubert_impromptu', '降 G 大调即兴曲', '舒伯特', 'D. 899 No. 3', 120, 'lyric', 1193, None),
    ('gnossienne', '第一号玄秘曲', '萨蒂', 'Gnossienne No. 1', 100, 'slow', 2035, None),
    ('carmen', '卡门序曲', '比才', '钢琴版', 116, 'fast', 635, None),
    ('minuet_g', 'G 大调小步舞曲', '佩措尔德', 'BWV Anh. 114', 140, 'lyric', 75, None),
]
CLASSIC_IDS = {piece[0] for piece in CLASSIC_PIANO}

PIECES = [
    ('turca', '土耳其进行曲', '莫扎特', '稍快板', 126, 'fast', 108, TURCA),
    ('elise', '致爱丽丝', '贝多芬', '稍快而流动', 72, 'lyric', 931,
     [(0, 12), (0, 11), (12, 34.5), (13.5, 33), (34.5, 156.5)]),
    ('gymnopedie', '第一号吉姆诺佩迪', '萨蒂', '缓慢而忧郁', 60, 'slow', 37,
     [(0, 117), (0, 93), (117, 141)]),
    ('original', '夜空练习曲', '原创', '流动的快板', 120, 'original', None, None),
    ('prayer', '少女的祈祷', '巴达捷夫斯卡', '如歌的变奏', 83, 'lyric',
     "https://commons.wikimedia.org/wiki/File:A_Maiden%27s_Prayer.mid", None),
    ('clair', '月光', '德彪西', '富于表情的行板', 60, 'slow', 1778, None),
    ('prelude', 'C 大调前奏曲', '巴赫', 'BWV 846', 80, 'lyric', 5, None),
    ('greensleeves', '绿袖子', '英格兰民谣', '民谣', 108, 'lyric', 109, None),
    ('cello', '第一大提琴组曲 · 前奏曲', '巴赫', '巴洛克', 80, 'lyric', 517, None),
    ('entertainer', '演艺人', '斯科特·乔普林', '拉格泰姆', 84, 'fast', 263, None),
    ('ice_elise', '致爱丽丝 · 冰上主题', '贝多芬', '冰面滑奏 · 主题节选', 70, 'lyric',
     'https://www.bilibili.com/video/BV1FV411b7Qf/', None),
    *CLASSIC_PIANO,
    ('jasmine', '茉莉花', '江苏民歌', '扬州小调', 80, 'lyric', 'https://lib.midicn.com/detail.html?play=essen-000463', None),
    ('flower_drum', '凤阳花鼓', '安徽民歌', '花鼓小调', 112, 'fast', 'https://lib.midicn.com/detail.html?play=essen-000454', None),
    ('kangding', '康定情歌', '四川民歌', '山歌', 88, 'lyric', 'https://lib.midicn.com/detail.html?play=essen-000496', None),
    ('purple_bamboo', '紫竹调', '江苏民歌', '苏州小调', 96, 'lyric', 'https://lib.midicn.com/detail.html?play=essen-000460', None),
    ('boatmen', '黄河船夫号子', '宁夏民歌', '劳动号子', 84, 'lyric', 'https://lib.midicn.com/detail.html?play=essen-000818', None),
    ('pouch', '绣荷包', '山西民歌', '山西小调', 76, 'slow', 'https://lib.midicn.com/detail.html?play=essen-008897', None),
    ('tea_lantern', '采茶灯', '福建民歌', '龙岩民歌', 116, 'fast', 'https://lib.midicn.com/detail.html?play=essen-000065', None),
    ('wuxi', '无锡景', '江苏民歌', '江南小调', 78, 'lyric', 'https://lib.midicn.com/detail.html?play=essen-000461', None),
    ('mengjiang', '孟姜女哭长城', '河北民歌', '河北小调', 66, 'slow', 'https://lib.midicn.com/detail.html?play=essen-000162', None),
    ('defend_river', '保卫黄河 · 主题轮奏', '冼星海', '《黄河大合唱》选段', 128, 'fast', 'https://commons.wikimedia.org/wiki/File:NLC416-14jh000644-70576_%E9%BB%83%E6%B2%B3.pdf', None),
    ('snare_march', '列队', '花火琴房', '小军鼓进行曲', 112, 'fast', None, None),
    ('snare_offbeat', '错步', '花火琴房', '切分小品', 100, 'fast', None, None),
    ('snare_tide', '潮汐滚奏', '花火琴房', '渐强与渐弱', 84, 'slow', None, None),
    ('senbonzakura', '千本樱 · 冰上演奏', '黒うさP', '十五的月亮廿九圆 · 实演节选', 144, 'fast',
     'https://www.bilibili.com/video/BV1FV411b7Qf/', None),
    ('ievan_polkka', '甩葱歌', '芬兰传统民歌', '伊娃的波尔卡', 126, 'fast',
     'https://thesession.org/tunes/418#setting418', None),
    ('korobeiniki', '货郎 · 俄罗斯方块主题曲', '俄罗斯传统民歌', 'Korobeiniki', 148, 'fast',
     'https://thesession.org/tunes/13747#setting24502', None),
]


# Zero-based General MIDI programs used by the offline sampler.
INSTRUMENTS = {
    'greensleeves': (24, '尼龙弦吉他'),
    'cello': (42, '大提琴'),
    'entertainer': (12, '马林巴'),
    'ievan_polkka': (21, '手风琴'),
    'korobeiniki': (80, '方波合成器'),
}


def read_score(path):
    midi = mido.MidiFile(path)
    active = defaultdict(deque)
    tick = 0
    result = []
    for event in mido.merge_tracks(midi.tracks):
        tick += event.time
        if event.type not in ('note_on', 'note_off'):
            continue
        key = event.channel, event.note
        beat = tick / midi.ticks_per_beat
        if event.type == 'note_on' and event.velocity:
            active[key].append((beat, event.velocity))
        elif active[key]:  # Some overlapping unisons emit redundant note-offs.
            onset, velocity = active[key].popleft()
            result.append((onset, beat, event.note, velocity, event.channel))
    assert not any(active.values()), 'Dangling note-on'
    return sorted(result), tick / midi.ticks_per_beat


def perform(name, tempo, itinerary):
    raw, end_beat = read_score(HERE/'scores'/f'{name}.mid')
    assert abs(end_beat - itinerary[-1][1]) < 0.01, (name, end_beat)
    elapsed = 0.0
    notes = []
    for first, last in itinerary:
        for start, end, pitch, velocity, hand in raw:
            if not first <= start < last:
                continue
            # Mutopia's Mozart and Beethoven MIDI files use one velocity per piece.
            # Shape each two-handed phrase without displacing the score's onsets.
            if name != 'gymnopedie':
                bar_length = 2 if name == 'turca' else 1.5
                accent = 5 if (start - (1 if name == 'turca' else .5)) % bar_length < 0.02 else 0
                phrase = 5 * math.sin(start * math.pi / (bar_length * 4))
                velocity = round((80 if name == 'turca' else 69) + (4 if hand == 0 else -12) + phrase + accent)
                if name == 'turca' and (48 <= start < 64 or 112 <= start < 128 or start >= 176):
                    velocity += 8
            onset = .1 + (elapsed + start - first) * 60 / tempo
            length = (min(end, last) - start) * 60 / tempo
            notes.append(dict(start=onset, end=onset+length, pitch=pitch, velocity=velocity))
        elapsed += last - first
    return notes, round(.1 + elapsed * 60 / tempo + 1.6, 3)


def continuous_performance(name, tempo):
    """Time the fully unfolded MIDIs, keeping pedal releases and tempo changes in score beats."""
    path = HERE/'scores'/f'{name}.mid'
    midi = mido.MidiFile(path)
    raw, end_beat = read_score(path)
    first = min(n[0] for n in raw)
    tempos = {0: tempo}
    pedal = defaultdict(list)
    tick = 0
    for msg in mido.merge_tracks(midi.tracks):
        tick += msg.time
        beat = tick / midi.ticks_per_beat
        if (name == 'prayer' or name in CLASSIC_IDS) and msg.type == 'set_tempo':
            tempos[beat] = mido.tempo2bpm(msg.tempo)
        if msg.type == 'control_change' and msg.control == 64:
            pedal[msg.channel].append((beat, msg.value >= 64))
    if name == 'clair':
        # Quarter-note pulses for the printed rubato, mosso, en animant, calmato,
        # a tempo and morendo passages. Measure length is 4.5 quarter notes.
        tempos.update({(bar-1)*4.5: bpm for bar,bpm in
                       [(15,55),(27,74),(37,82),(43,66),(51,60),(66,52),(71,46)]})
    segments = []
    for beat,bpm in sorted(tempos.items()):
        sec = 0 if not segments else segments[-1][1] + (beat-segments[-1][0])*60/segments[-1][2]
        segments.append((beat,sec,bpm))
    starts = [b for b,_,_ in segments]

    def seconds(beat):
        b,sec,bpm = segments[bisect_right(starts,beat)-1]
        return sec + (beat-b)*60/bpm

    # The performance MIDI opens with a silent count-in. Keep Debussy's written rest.
    zero = seconds(first) if name == 'prayer' else 0
    def clock(beat):
        return .1+seconds(beat)-zero

    pedal_beats = {ch:[b for b,_ in events] for ch,events in pedal.items()}
    releases = {ch:[b for b,down in events if not down] for ch,events in pedal.items()}
    notes = []
    # Some score previews have a single attack velocity on both staves.
    shape_touches = name in CLASSIC_IDS and len({n[3] for n in raw}) == 1
    for start,end,pitch,vel,channel in raw:
        if channel in pedal:
            i = bisect_right(pedal_beats[channel],end)-1
            if i >= 0 and pedal[channel][i][1]:
                off = releases[channel]
                j = bisect_right(off,end)
                end = off[j] if j<len(off) else end_beat
        if name == 'clair':
            bar = 1 + start/4.5
            strength = 57 if bar < 27 else 61 if bar < 37 else 78 if bar < 43 else 60 if bar < 51 else 51
            vel = round(strength + .16*(pitch-60) + 4*math.sin(start*math.pi/18))
            if 27 <= bar < 51:
                end = max(end, min(start+.65, (math.floor(start/1.5)+1)*1.5))
        elif name == 'prelude':
            vel = round(70 + .15*(pitch-60) + 5*math.cos(start*math.pi/2) + 4*math.sin(start*math.pi/16))
        elif name == 'greensleeves':
            # The tune lies above middle A; let it sing above the lower plucked part.
            vel = round((78 if pitch >= 69 else 61) + 4*math.cos((start-1)*math.pi/6))
        elif name == 'cello':
            vel = round(75 + 5*math.cos(start*math.pi/2) + 7*math.sin(start*math.pi/16))
        elif name == 'entertainer':
            # Bring out the syncopated melody over the stride bass.
            vel = round((77 if pitch >= 60 else 65) + (6 if start % 1 else 0) + 3*math.sin(start*math.pi/8))
        elif shape_touches:
            vel = round(65 + max(-10, min(12, (pitch-60)*.4)) + 4*math.cos(start*math.pi/8))
        notes.append(dict(start=clock(start),end=clock(end),pitch=pitch,velocity=vel))
    duration = round(max(n['end'] for n in notes)+1.8,3)
    active_tempo = segments[bisect_right(starts,first)-1][2]
    beat_map = [[0,round(clock(first),5),round(active_tempo,5)]]
    beat_map.extend([round(b-first,6),round(clock(b),5),round(bpm,5)] for b,_,bpm in segments if b>first)
    return notes,duration,beat_map


def arrange_voices(notes):
    # A keyboard can have only one sounding attack on an individual key at a time.
    unique = {}
    for n in notes:
        key = (round(n['start'], 6), n['pitch'])
        if key in unique:
            old = unique[key]
            old['velocity'] = max(n['velocity'], old['velocity'])
            old['end'] = max(n['end'], old['end'])
        else:
            unique[key] = dict(n)
    ordered = sorted(unique.values(), key=lambda n: (n['start'], n['pitch']))
    previous = {}
    for n in ordered:
        if n['pitch'] in previous:
            prior = previous[n['pitch']]
            prior['end'] = min(prior['end'], n['start'])
        previous[n['pitch']] = n
    return ordered


def encode(source, output, duration):
    # Peak-aware constant gain preserves crescendos, quiet entrances and score timing.
    readings = subprocess.run(['ffmpeg', '-hide_banner', '-nostats','-i',str(source),
        '-af','ebur128=peak=true','-f','null','-'], capture_output=True,text=True,check=True).stderr
    loudness = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', readings)[-1])
    peak = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', readings)[-1])
    gain = min(-18.5 - loudness, -1.3 - peak)
    filters = f'volume={gain:.2f}dB,afade=t=out:st={duration-.38:.3f}:d=0.38'
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-af',filters,
            '-c:a','aac','-b:a','160k','-movflags','+faststart',str(output)],check=True)


def pack_export_audio(audio):
    # file:// pages can play a sibling M4A but cannot fetch its bytes for MP4 muxing.
    folder = audio.parent / 'export'
    folder.mkdir(exist_ok=True)
    encoded = base64.b64encode(audio.read_bytes()).decode('ascii')
    (folder / (audio.stem + '.js')).write_text('document.currentScript.pianoAudio="' + encoded + '";\n', encoding='ascii')


def build(only=()):
    catalog = HERE/'tracks.js'
    existing = {}
    if only:
        if set(only) - {p[0] for p in PIECES}:
            raise ValueError('Unknown track ID')
        saved = catalog.read_text().strip().removeprefix('window.PIANO_TRACKS=').removesuffix(';')
        existing = {t['id']:t for t in json.loads(saved)}
    tracks = []
    with tempfile.TemporaryDirectory() as temp:
        temp = Path(temp)
        renderer = temp/'piano'
        subprocess.run(['swiftc','-O',str(SOURCE/'piano.swift'),'-o',str(renderer)],check=True)
        for id_, title, composer, mark, tempo, mode, ref, itinerary in PIECES:
            if only and id_ not in only:
                tracks.append(existing[id_])
                continue
            beat_map = None
            audio = HERE/f'{id_}.m4a'
            if id_ == 'senbonzakura':
                notes, duration = ice.score_recording(audio)
                instrument = '冰块'
                wav = None
            elif id_ in snare.SCORES:
                wav = temp/'snare.wav'
                notes, duration = snare.render(id_, tempo, wav)
                instrument = '小军鼓'
            elif id_ == 'ice_elise':
                raw, _ = read_score(HERE/'scores'/'elise.mid')
                wav = temp/'ice.wav'
                notes, duration, beat_map = ice.render(raw, tempo, wav)
                instrument = '冰块'
            elif id_ in folk.PARTS:
                raw, _ = read_score(HERE/'scores'/f'{id_}.mid')
                notes, duration, beat_map, instrument = folk.perform(id_,raw,tempo)
                wav = temp/'ensemble.wav'
                folk.render(notes,duration,wav)
            else:
                if ref and itinerary is None:
                    notes,duration,beat_map = continuous_performance(id_,tempo)
                elif ref:
                    notes, duration = perform(id_, tempo, itinerary)
                else:
                    notes, duration = arrangement()[0], DURATION
                notes = arrange_voices(notes)
                score, wav = temp/'part.json', temp/'performance.caf'
                score.write_text(json.dumps(notes))
                wav.unlink(missing_ok=True)
                program, instrument = INSTRUMENTS.get(id_, (0, '钢琴'))
                subprocess.run([str(renderer),str(score),str(wav),str(duration),str(program)],check=True)
            if wav is not None:
                encode(wav,audio,duration)
            pack_export_audio(audio)
            tracks.append(dict(id=id_,title=title,composer=composer,mark=mark,tempo=tempo,
                    mode=mode,instrument=instrument,duration=duration,src=f'music/{id_}.m4a',
                    source=(ref if isinstance(ref,str) else f'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id={ref}') if ref else '',
                    notes=[[round(n['start'],5), n['pitch'], n['velocity']] for n in notes]))
            if id_ in snare.SCORES:
                for event, note in zip(tracks[-1]['notes'], notes):
                    event.append(note['stroke'])
            if beat_map:
                tracks[-1]['beatMap'] = beat_map
            print(f'{title}: {duration:.3f} seconds, {len(notes)} note-on events',flush=True)
    text = json.dumps(tracks, ensure_ascii=False, separators=(',',':'))
    (HERE/'tracks.js').write_text('window.PIANO_TRACKS='+text+';\n',encoding='utf-8')


if __name__ == '__main__':
    build(sys.argv[1:])
