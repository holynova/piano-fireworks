"""Chamber arrangements of the ten local Chinese scores, including their cue sheets."""
from bisect import bisect_right
from functools import lru_cache
from pathlib import Path
import math
import subprocess
import wave

import numpy as np

# Lead and answering voice, pickup to verse two, and phrase length in quarter notes.
PARTS = {
    'jasmine': ('flute', 'zither', 72, 8),
    'purple_bamboo': ('zither', 'flute', 54, 8),
    'flower_drum': ('zither', 'flute', 66, 4),
    'kangding': ('flute', 'harp', 28, 6),
    'boatmen': ('cello', 'cello', 30, 6),
    'pouch': ('harp', 'zither', 46, 8),
    'tea_lantern': ('flute', 'zither', 66, 4),
    'wuxi': ('zither', 'harp', 34, 8),
    'mengjiang': ('cello', 'flute', 34, 8),
    'defend_river': ('cello', 'flute', 66, 8),
}
NAMES = {'flute': '长笛', 'zither': '越南筝', 'harp': '竖琴', 'cello': '大提琴', 'drum': '手鼓'}
RATE = 32000
SAMPLES = Path(__file__).parent / 'folk-samples'


def perform(name, raw, bpm):
    lead, reply, repeat, phrase = PARTS[name]
    rhythmic = name in {'flower_drum', 'tea_lantern', 'defend_river'}
    span = max(end for _, end, *_ in raw)
    tempi = []
    starts = []
    for beat in range(math.ceil(span) + 1):
        position = (beat if beat < repeat else beat-repeat) % phrase / phrase
        pace = 1 + (.035 if rhythmic else .065)*math.sin(2*math.pi*position)
        # Let the first statement come to rest, then take time at the final cadence.
        for cadence in (repeat-2, span):
            if cadence-3 <= beat < cadence:
                pace *= 1 - (.12 if rhythmic else .21)*(1-(cadence-beat)/4)
        sec = .10 if not tempi else tempi[-1][1] + 60/tempi[-1][2]
        tempi.append([beat, sec, bpm*pace])
        starts.append(beat)

    def clock(beat):
        b, sec, speed = tempi[bisect_right(starts, beat)-1]
        return sec + (beat-b)*60/speed

    notes = []
    def add(voice, start, end, pitch, velocity):
        notes.append(dict(voice=voice, start=start, end=end, pitch=pitch,
                          velocity=round(max(25, min(110, velocity)))))

    tonic = max((n for n in raw if n[3]>=65),key=lambda n:n[0])[2] % 12
    for beat, end, pitch, vel, _ in raw:
        second = beat >= repeat
        local = beat-repeat if second else beat
        contour = math.sin(math.pi*(local % phrase)/phrase)
        t = clock(beat)
        if vel <= 51:  # The existing score marks its open-fifth accompaniment pianissimo.
            if int(local) % 8 == 6 and not second:
                continue
            add('harp' if lead!='harp' else 'zither', t, clock(end), pitch, vel-4)
            continue
        voice = reply if second else lead
        if name=='defend_river' and vel<62:
            voice='cello'
        if voice=='cello' and (name=='mengjiang' or (name=='defend_river' and vel>=62)):
            pitch-=12
        length = clock(end)-t
        phrasing = 9*contour - (4 if local % phrase > phrase-1.1 else 0)
        held = length*(.98 if voice in ('flute','cello') else .92)
        add(voice, t, t+held, pitch, vel+phrasing)
        # A quiet answer on a held syllable draws on the tune's final rather than
        # paralleling every note. Leave short pickups and phrase endings exposed.
        if length>.60 and local%phrase<=phrase/2 and name!='defend_river':
            answer = 'harp' if voice!='harp' else 'zither'
            bass = 45+(tonic-45)%12
            add(answer,t+length*.48,t+length*.87,bass+(7 if second else 0),47+4*contour)
        if rhythmic and local%4==0:
            add('drum',t,t+.24,60+int(local//4)%2,48+6*second)
    notes.sort(key=lambda n:(n['start'],n['pitch']))
    instruments = list(dict.fromkeys([lead,reply]+[n['voice'] for n in notes]))
    return notes, round(max(n['end'] for n in notes)+1.8,3), tempi, ' · '.join(NAMES[i] for i in instruments)


@lru_cache(None)
def bank(voice, loud):
    prefix=voice+('-loud-' if loud else '-')
    return {int(p.stem[len(prefix):]):p for p in SAMPLES.glob(prefix+'*.flac')
            if p.stem[len(prefix):].isdigit()}


@lru_cache(None)
def sample(path):
    pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-'])
    return np.frombuffer(pcm,dtype='<f4')


def render(notes, duration, out):
    stereo=np.zeros((round(duration*RATE),2),dtype=np.float32)
    pan={'harp':-.32,'zither':.26,'flute':-.10,'cello':.14,'drum':-.18}
    for n in notes:
        voice, pitch, vel=n['voice'], n['pitch'], n['velocity']
        sounds=bank(voice,voice=='cello' and vel>=81)
        key=min(sounds,key=lambda k:abs(k-pitch))
        src=sample(sounds[key])
        held=n['end']-n['start']
        release=.52 if voice in ('harp','zither') else .12
        ratio=2**((pitch-key)/12)
        first=round(n['start']*RATE)
        frames=min(int((held+release)*RATE),int((len(src)-1)/ratio),len(stereo)-first)
        t=np.arange(frames)/RATE
        tone=np.interp(np.arange(frames)*ratio,np.arange(len(src)),src)
        envelope=np.clip(1-(t-held)/release,0,1)**2
        if voice in ('flute','cello'):
            envelope *= .80+.20*np.sin(np.pi*np.clip(t/max(.12,held),0,1))
        gain=(vel/100)**1.65*(.50 if voice=='drum' else 1)
        for ch,balance in enumerate((-pan[voice],pan[voice])):
            stereo[first:first+frames,ch]+=tone*envelope*gain*math.sqrt((1+balance)/2)
    dry=stereo.copy()
    for delay,amount in ((.029,.10),(.043,.075),(.073,.04)):
        k=round(delay*RATE)
        stereo[k:] += dry[:-k,::-1]*amount
    stereo*=.92/max(.001,float(np.max(np.abs(stereo))))
    with wave.open(str(out),'wb') as f:
        f.setparams((2,2,RATE,0,'NONE','not compressed'))
        f.writeframes((stereo*32767).astype('<i2').tobytes())
