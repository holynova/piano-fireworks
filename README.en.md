# Piano Fireworks

[Open the concert hall](https://piano-fireworks.xiaosang.cc/) · [简体中文](README.md) · [GitHub](https://github.com/holynova/piano-fireworks)

In Bądarzewska’s *A Maiden’s Prayer*, a shell lifts from the riverbank before a piano note and opens as the key sounds. This browser concert hall choreographs fireworks from the score of each of its ten piano, guitar, cello and marimba performances.

[![A burst over the water during A Maiden’s Prayer, with the track list on the right. Click to watch the excerpt.](assets/screenshot.png)](https://piano-fireworks.xiaosang.cc/media/maidens-prayer.mp4)

[▶ Watch *A Maiden’s Prayer* · 22 seconds with sound](https://piano-fireworks.xiaosang.cc/media/maidens-prayer.mp4)

## Try one phrase

1. Press play to hear *A Maiden’s Prayer*. Open the track list (曲目) for Debussy’s *Clair de lune* or *Greensleeves* on nylon-string guitar.
2. Open the tuning panel (调校) and loop six seconds. Use presets A and B to compare a burst for each note with one for an entire chord.
3. Start with the classic firework colors, then change the shells, wind or camera positions. Your browser remembers both presets, the selected preset, the last piece and your mute setting.

Go fullscreen for the performance alone. The share panel (分享) offers a short introduction with a link or a QR card. MP4 export produces a 720p film with the original audio, track title and project QR code.

## Run locally

Download the repository and open `index.html` to listen offline. To serve it locally, run the following command from the project directory and visit `http://localhost:8080`.

```sh
python3 -m http.server 8080
```

To deploy to the configured Cloudflare Worker, run `npm ci` and `npm run deploy`. [Player guide (Chinese)](docs/player-guide.md) · [Score credits and audio build notes (Chinese)](music/SOURCES.md)

<a href="https://piano-fireworks.xiaosang.cc/"><img src="assets/qr.png" width="112" alt="Scan to open the concert hall"></a>
