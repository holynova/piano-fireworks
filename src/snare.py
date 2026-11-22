"""Three original solo-snare scores. Each beat token divides one quarter equally."""
from collections import Counter
from functools import lru_cache
from pathlib import Path
import math
import subprocess
import wave

import numpy as np

RATE = 32000
# X = accent, o = tap, g = ghost note, r = roll stroke, - = rest.
MARCH = [
    'X- oo X- og', 'X- gg o- X-', 'Xg oo Xg oo', 'X- rrrr rrrr X-',
    'o- gg X- oo', 'X- o- gg X-', 'Xg og Xg og', 'rrrr rrrr X- -',
    'X- oo X- og', 'Xg og o- X-', 'X- rrrr X- rrrr', 'X - o X',
]
OFFBEAT = [
    'X--o --X- ---- X-g-', 'o--X --o- X--- --g-', 'X--g --Xo --g- X---', 'g--X ---- o-X- --o-',
    '---X --g- X--- --X-', 'o--g -X-- ---o X---', 'X--o --X- ---- X-g-', 'o--X --gg X--- ----',
    'X--o --X- ---- X-g-', 'g--X --o- X--- --o-', 'X--g --Xo -g-- X---', '---X --X- X--- ----',
]
TIDE = [
    'g - g -', 'o - gg -', 'rr rr rr rr', 'rrrr rrrr rrrr X',
    'g - o -', 'rr rr rrrr rrrr', 'rrrrrr rrrrrr rrrrrr rrrrrr', 'X - - -',
    'rr rr rr rr', 'rrrr rrrr rrrr rrrr', 'rrrrrr rrrrrr rrrrrr rrrrrr', 'X - g -',
    'rrrr rrrr rr rr', 'rr rr g -', 'g - - -', 'X - - -',
]
SCORES = {'snare_march': MARCH, 'snare_offbeat': OFFBEAT, 'snare_tide': TIDE}
STROKES = {'X': ('accent', 109), 'o': ('tap', 81), 'g': ('ghost', 47), 'r': ('roll', 65)}
TIDE_LEVEL = [-9, -6, -12, 4, -5, -8, 14, 2, -15, -3, 15, 0, -3, -11, -10, 0]


@lru_cache(maxsize=8)
def sample(layer, take):
    path = Path(__file__).with_name('snare-samples') / f'v{layer}-{take}.flac'
    data = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-'])
    clip = np.frombuffer(data, dtype='<f4').reshape(-1, 2)
    return clip / np.max(np.abs(clip))


def render(name, tempo, output):
    notes = []
    uses = Counter()
    for bar, pattern in enumerate(SCORES[name]):
        for pulse, group in enumerate(pattern.split()):
            for part, symbol in enumerate(group):
                if symbol == '-':
                    continue
                beat = 4*bar + pulse + part/len(group)
                stroke, velocity = STROKES[symbol]
                if name == 'snare_tide' and stroke == 'roll':
                    current = TIDE_LEVEL[bar]
                    following = TIDE_LEVEL[min(bar+1, len(TIDE_LEVEL)-1)]
                    velocity += round(current + (following-current)*(beat%4)/4)
                velocity += (0, -4, 2, -2)[len(notes)%4]
                notes.append(dict(start=round(.10 + beat*60/tempo, 5), pitch=38,
                                  velocity=velocity, stroke=stroke))

    duration = round(notes[-1]['start'] + 1.80, 3)
    mix = np.zeros((math.ceil(duration*RATE), 2))
    for note in notes:
        velocity = note['velocity']
        layer = 1 if velocity < 55 else 3 if velocity < 75 else 5 if velocity < 98 else 9
        hit = sample(layer, 1 + uses[layer]%2)
        uses[layer] += 1
        pos = round(note['start']*RATE)
        mix[pos:pos+len(hit)] += hit * (velocity/112)**2
    with wave.open(str(output), 'wb') as wav:
        wav.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))
        wav.writeframes((mix * (30000/max(1, np.max(np.abs(mix))))).astype('<i2').tobytes())
    return notes, duration
