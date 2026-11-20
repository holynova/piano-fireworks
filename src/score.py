"""The piano part and visual cues share a single beat timeline. Beats start at zero."""
from dataclasses import dataclass
import math

BPM = 120
PULSE = 60 / BPM
LEAD = 0.15
DURATION = 17
FPS = 60
CLIMAX = 24

def seconds(beat):
    return LEAD + beat * PULSE

@dataclass(frozen=True)
class Shell:
    launch: float       # beats
    hit: float
    x: float            # relative to the width
    y: float            # relative to the height
    radius: float       # relative to the width
    color: int
    group: str

def arrangement():
    notes, shells = [], []
    def key(beat, pitch, length, velocity):
        notes.append(dict(start=seconds(beat), end=seconds(beat + length), pitch=pitch, velocity=velocity))

    # E flat major. Left-hand broken tenths leave room for the right-hand pickups.
    harmony = [(39, 46, 55, 58), (34, 46, 53, 62), (36, 43, 51, 58),
               (32, 44, 51, 60), (41, 48, 56, 63), (34, 41, 53, 62)]
    for bar, (root, fifth, third, top) in enumerate(harmony):
        for offset, pitch, duration, strength in [(0, root, 2.7, 63), (.53, fifth, 1.35, 46),
                            (1.02, third, 1.75, 50), (1.52, top, 1.25, 47),
                            (2, fifth, 1.55, 53), (2.55, third, 1.2, 48), (3.05, top, .9, 49)]:
            key(bar * 4 + offset, pitch, duration, strength + bar)

    # Each phrase traces its own arc across the sky.
    phrases = [
        [(0, 67), (1, 70), (1.5, 72), (2.5, 74), (3, 75)],
        [(4, 74), (5, 70), (5.5, 67), (6.5, 65), (7.25, 67)],
        [(8, 67), (9, 72), (9.5, 75), (10.5, 77), (11, 79)],
        [(12, 77), (13, 75), (13.5, 72), (14.5, 70), (15.25, 72)],
        [(16, 72), (17, 75), (17.5, 77), (18, 79), (18.75, 80), (19.5, 84)],
    ]
    for row, phrase in enumerate(phrases):
        for i, (beat, pitch) in enumerate(phrase):
            u = i / (len(phrase) - 1)
            key(beat, pitch, .48 if i < len(phrase)-1 else .82, 76 + 2*row + (5 if i == 0 else 0))
            x = .18 + .62 * (u if row % 2 == 0 else 1-u)
            y = .48 - .045 * row - .075 * math.sin(math.pi*u) + .025*(1-u)
            shells.append(Shell(max(-.3, beat - 1.1), beat, x, y, .075 + .014*math.sin(math.pi*u),
                                (row+i//3) % 3, 'phrase'))

    # Four first rockets on the left-hand attacks, then a rising right-hand run in sixteenths.
    run = [65, 68, 70, 74, 77, 80, 82, 86, 89]
    launches = [20, 20.5, 21, 21.5, 22, 22.25, 22.5, 22.75, 23, 23.25, 23.5, 23.75]
    for beat, pitch in zip(launches, [58, 62, 65] + run):
        key(beat, pitch, .33, round(67 + (beat-20)*5))
    # 18 outer chrysanthemums, 12 inner pearls and a four-shell core.
    points = []
    for count, radius, size in [(18, .346, .048), (12, .213, .043), (4, .035, .055)]:
        for i in range(count):
            a = 2*math.pi*i/count - math.pi/2
            points.append((.5 + radius*math.cos(a), .392 + radius*(9/16)*math.sin(a), size,
                           (0 if i<count//2 else 1) if count == 18 else (i%3 if count == 12 else 2)))
    # Higher destinations get a longer flight. Shared hit time is the first sample of the tonic.
    for i, (x, y, radius, color) in enumerate(sorted(points, key=lambda p: (p[1], p[0]))):
        launch = launches[min(i * len(launches)//len(points), len(launches)-1)]
        shells.append(Shell(launch, CLIMAX, x, y, radius, color, 'ring'))
    for pitch, strength in [(27,91), (39,95), (46,88), (55,84), (58,82), (63,84), (67,88), (75,100), (87,89)]:
        key(CLIMAX, pitch, 3.35, strength)
    for beat, pitch, length in [(26.5,82,.45),(27,79,.75),(28,75,1.15),(29.5,70,.48),(30,75,1.7)]:
        key(beat, pitch, length, 68 if beat<28 else 60)
        u=(beat-26.5)/3.5
        shells.append(Shell(beat-.75,beat,.25+.5*u,.485-.06*math.sin(u*math.pi),.036,2 if beat==30 else 1,'coda'))
    for pitch in [39, 51, 55, 58, 67]:
        key(28 + .025*(pitch%4),pitch,3.4,49)
    return notes, shells
