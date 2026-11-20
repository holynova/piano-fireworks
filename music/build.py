# /// script
# requires-python = ">=3.10"
# dependencies = ["mido==1.3.3"]
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
]


# Zero-based General MIDI programs used by the offline sampler.
INSTRUMENTS = {
    'greensleeves': (24, '尼龙弦吉他'),
    'cello': (42, '大提琴'),
    'entertainer': (12, '马林巴'),
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
        if name == 'prayer' and msg.type == 'set_tempo':
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
            audio = HERE/f'{id_}.m4a'
            encode(wav,audio,duration)
            pack_export_audio(audio)
            tracks.append(dict(id=id_,title=title,composer=composer,mark=mark,tempo=tempo,
                    mode=mode,instrument=instrument,duration=duration,src=f'music/{id_}.m4a',
                    source=(ref if isinstance(ref,str) else f'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id={ref}') if ref else '',
                    notes=[[round(n['start'],5), n['pitch'], n['velocity']] for n in notes]))
            if beat_map:
                tracks[-1]['beatMap'] = beat_map
            print(f'{title}: {duration:.3f} seconds, {len(notes)} note-on events',flush=True)
    text = json.dumps(tracks, ensure_ascii=False, separators=(',',':'))
    (HERE/'tracks.js').write_text('window.PIANO_TRACKS='+text+';\n',encoding='utf-8')


if __name__ == '__main__':
    build(sys.argv[1:])
