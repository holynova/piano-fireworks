"""Play the opening theme of Für Elise with individual recorded ice slides."""
from collections import Counter
from pathlib import Path
import math
import subprocess
import wave

import numpy as np

RATE = 44100
# Recording, start/end in milliseconds, dominant resonance in Hz.
# 'senbon' is BV1FV411b7Qf, 'canon' is BV12u411D738. Each entry is one gesture.
TAKES = [
    ('canon', 54294, 54538, 1561), ('canon', 136033, 136148, 1545),
    ('canon', 122992, 123182, 1981), ('canon', 26686, 26857, 1949),
    ('canon', 119904, 120043, 2094),
    ('canon', 67708, 67854, 2342),
    ('senbon', 41997, 42106, 2406), ('canon', 43204, 43344, 2509),
    ('senbon', 47883, 47979, 2670), ('senbon', 22905, 23068, 2686),
    ('senbon', 16460, 16549, 2821), ('senbon', 14349, 14546, 2810),
    ('canon', 122673, 122772, 3128), ('senbon', 57955, 58134, 3268),
    ('canon', 66157, 66348, 3575), ('canon', 23608, 23727, 3628),
    ('senbon', 17807, 17930, 3709), ('canon', 15746, 15886, 3741),
    ('senbon', 53969, 54108, 3908), ('senbon', 37192, 37359, 3903),
    ('canon', 152166, 152266, 4237),
]
BANK = Path(__file__).with_name('ice-slides.wav')


def load_slides():
    slides = []
    with wave.open(str(BANK), 'rb') as bank:
        assert bank.getparams()[:3] == (2, 2, RATE)
        for _, start, end, hz in TAKES:
            length = round(end*RATE/1000) - round(start*RATE/1000)
            clip = np.frombuffer(bank.readframes(length), dtype='<i2').reshape(length, 2)
            slides.append((hz, clip.astype(float)/32768))
    return slides


def render(raw, bpm, output):
    # Opening A–B–A, right hand only. The octave leap in the bridge returns
    # to the sampled register. Keep the last tonic before the next pickup.
    theme = [n for n in raw if n[4] == 0 and n[0] <= 33]
    beat_map = []
    clock = .10
    for beat in range(35):
        bpm_here = bpm*(1 + .037*math.sin(beat*math.pi/3))
        if beat in (10, 18, 31, 32):
            bpm_here *= .90
        beat_map.append([beat, round(clock, 5), round(bpm_here, 5)])
        clock += 60/bpm_here
    duration = round(beat_map[33][1] + .95, 3)
    mix = np.zeros((math.ceil(duration*RATE), 2))
    slides = load_slides()
    uses = Counter()
    notes = []
    for beat, _, pitch, _, _ in theme:
        i = int(beat)
        start = beat_map[i][1] + (beat-i)*60/beat_map[i][2]
        key = (pitch-12 if pitch == 88 else pitch) + 31
        target = 440*2**((key-69)/12)
        # Alternate different physical slides only when both need very little tuning.
        ranked = sorted(slides, key=lambda slide: abs(math.log2(slide[0]/target)))
        nearest = abs(12*math.log2(ranked[0][0]/target))
        choices = [s for s in ranked[:2] if abs(12*math.log2(s[0]/target)) <= nearest+.48]
        hz, clip = choices[uses[key] % len(choices)]
        uses[key] += 1
        positions = np.arange(0, len(clip)-1, target/hz)
        samples = np.column_stack([np.interp(positions, np.arange(len(clip)), ch) for ch in clip.T])
        strength = round(76 + 6*math.cos((beat-.5)*math.pi/3) + (5 if beat%1.5 == .5 else 0))
        rms = np.sqrt(np.mean(samples**2))
        gain = min(.115/rms, .86/np.max(abs(samples))) * (strength/88)**1.6
        pos = round(start*RATE)
        mix[pos:pos+len(samples)] += samples*gain
        notes.append(dict(start=start, pitch=key, velocity=strength))
    with wave.open(str(output), 'wb') as wav:
        wav.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))
        wav.writeframes((np.clip(mix,-1,1)*32767).astype('<i2').tobytes())
    return notes, duration, beat_map


def score_recording(audio):
    """Locate ice slides on the final audio clock; the field performance has no MIDI."""
    rate, hop = 24000, 120  # 5 ms frames
    data = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(audio),
        '-af', 'highpass=f=1500,lowpass=f=9600', '-ac', '1', '-ar', str(rate), '-f', 'f32le', '-'])
    pcm = np.frombuffer(data, dtype='<f4')
    blocks = pcm[:len(pcm)//hop*hop].reshape(-1, hop)
    env = np.sqrt(np.mean(blocks**2, axis=1))
    env = np.convolve(env, [.2, .6, .2], mode='same')
    past = np.pad(env, (8, 0))
    floor = np.min(np.lib.stride_tricks.sliding_window_view(past, 8)[:len(env)], axis=1)
    rise = env-floor
    peaks = [i for i in range(4, len(env)-4) if rise[i] >= max(rise[i-4:i+5])
             and rise[i] > max(.008, .7*floor[i])]
    # Keep the initial strike and its subsequent scrape together as one gesture.
    hits = []
    occupied = np.zeros(len(env), dtype=bool)
    for i in sorted(peaks, key=lambda p: -rise[p]):
        if occupied[i]:
            continue
        occupied[max(0, i-19):i+20] = True
        onset = i
        while onset > max(0, i-16) and env[onset] > floor[i]+rise[i]*.10:
            onset -= 1
        hits.append((onset, i))
    notes = []
    last_peak = None
    for onset, peak in sorted(hits):
        if last_peak is not None and peak-last_peak < 52:
            valley = env[last_peak:peak].min()
            if valley > .18*min(env[last_peak], env[peak]):
                continue
        last_peak = peak
        clip = pcm[onset*hop:(peak+13)*hop]
        spectrum = abs(np.fft.rfft(clip*np.hanning(len(clip)), 8192))
        lo, hi = round(1650*8192/rate), round(6500*8192/rate)
        resonance = (lo+np.argmax(spectrum[lo:hi]))*rate/8192
        # Use the octave-equivalent key in the middle of the display for the ice resonance.
        key = round(69+12*math.log2(resonance/440))-24
        velocity = round(np.clip(90+16*math.log10(max(.001, env[peak])/.1), 42, 115))
        notes.append(dict(start=onset*hop/rate, pitch=key, velocity=velocity))
    duration = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'a:0',
        '-show_entries', 'stream=duration', '-of', 'csv=p=0', str(audio)], text=True)
    return notes, round(float(duration), 3)
