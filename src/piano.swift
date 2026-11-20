// Offline rendering using the General MIDI sound bank supplied with macOS.
import Foundation
import AVFoundation
import AudioToolbox

struct Note: Decodable { let start: Double; let end: Double; let pitch: UInt8; let velocity: UInt8 }
struct Event { let frame: Int; let pitch: UInt8; let velocity: UInt8 }
let args = CommandLine.arguments
let notes = try JSONDecoder().decode([Note].self, from: Data(contentsOf: URL(fileURLWithPath: args[1])))
let rate = 48000.0
let total = Int(Double(args[3])! * rate)
let events = notes.flatMap { note in
    [Event(frame: Int((note.start*rate).rounded()), pitch: note.pitch, velocity: note.velocity),
     Event(frame: Int((note.end*rate).rounded()), pitch: note.pitch, velocity: 0)]
}.sorted { ($0.frame, $0.velocity) < ($1.frame, $1.velocity) }
let engine = AVAudioEngine()
let piano = AVAudioUnitSampler()
engine.attach(piano)
let format = AVAudioFormat(standardFormatWithSampleRate: rate, channels: 2)!
engine.connect(piano, to: engine.mainMixerNode, format: format)
let bank = URL(fileURLWithPath: "/System/Library/Components/CoreAudio.component/Contents/Resources/gs_instruments.dls")
let program = args.count > 4 ? UInt8(args[4])! : 0
try piano.loadSoundBankInstrument(at: bank, program: program, bankMSB: UInt8(kAUSampler_DefaultMelodicBankMSB), bankLSB: 0)
try engine.enableManualRenderingMode(.offline, format: format, maximumFrameCount: 2048)
let file = try AVAudioFile(forWriting: URL(fileURLWithPath: args[2]), settings: format.settings)
let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: 2048)!
try engine.start()
var frame = 0, index = 0
while frame < total {
    while index < events.count && events[index].frame <= frame {
        let e = events[index]
        if e.velocity == 0 { piano.stopNote(e.pitch, onChannel: 0) }
        else { piano.startNote(e.pitch, withVelocity: e.velocity, onChannel: 0) }
        index += 1
    }
    let next = index < events.count ? min(total, events[index].frame) : total
    let length = AVAudioFrameCount(min(next - frame, 2048))
    let status = try engine.renderOffline(length, to: buffer)
    if status == .cannotDoInCurrentContext { continue }
    guard status == .success && buffer.frameLength > 0 else { fatalError("Offline render failed at frame \(frame)") }
    try file.write(from: buffer)
    frame += Int(buffer.frameLength)
}
engine.stop()
