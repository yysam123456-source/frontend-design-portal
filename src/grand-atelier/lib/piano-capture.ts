import type { PianoWorld, View } from './piano-world';
import type { GrandAudio } from './piano-audio';
import type { PianoTransport } from './piano-transport';
import type { PianoScore } from './piano-score';
import { KEY_LAYOUT, noteName } from './music';

export const SHARE_URL = 'piano.anionex.me';

export function recordPiano(
  world: PianoWorld,
  audio: GrandAudio,
  transport: PianoTransport,
  score: PianoScore,
  options: {
    signal: AbortSignal;
    onProgress: (seconds: number) => void;
    onScene: (scene: number) => void;
    onView: (view: View) => void;
    rawScene?: boolean;
  },
): Promise<Blob> {
  if (typeof MediaRecorder === 'undefined')
    throw Error('Video recording is not supported in this browser. Use the latest Chrome or Safari.');
  options.signal.throwIfAborted();
  const mimeType = [
    'video/mp4;codecs=avc1.640028,mp4a.40.2',
    'video/mp4;codecs=avc1.42001f,mp4a.40.2',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ].find((type) => MediaRecorder.isTypeSupported(type));
  if (!mimeType) throw Error('No video encoder is available.');
  world.sheet.setScore(score);
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  const capture = audio.capture();
  // Direct WebGL capture avoids a GPU-to-2D copy on every frame. The owner
  // can add titles in post-production without lowering scene resolution.
  const stream = (options.rawScene ? world.renderer.domElement : canvas).captureStream(30);
  capture.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 9_000_000,
    audioBitsPerSecond: 192_000,
  });
  const restore = world.beginCapture(1920, 1080);
  const previousSlow = world.slow;
  world.slow = false;
  const chunks: Blob[] = [];
  const musicDuration = Math.min(33, score.duration);
  const length = musicDuration + 3;
  const origin = audio.context!.currentTime;
  let scene = -1,
    view: View | null = null,
    frames = 0,
    ending = false;
  const timeData = new Float32Array(512);
  let peak = 0;
  const scenes = [
    'THE CONCERT HALL',
    'THE DAYLIGHT STUDIO',
    'THE MOONLIT TERRACE',
  ];
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      clearTimeout(timeout);
      options.signal.removeEventListener('abort', cancel);
      world.onFrame = undefined;
      transport.stop();
      capture.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      world.slow = previousSlow;
      restore();
    };
    const cancel = () => {
      if (settled) return;
      settled = true;
      if (recorder.state !== 'inactive') recorder.stop();
      cleanup();
      reject(new DOMException('Recording cancelled', 'AbortError'));
    };
    const timeout = setTimeout(
      () => {
        if (settled) return;
        settled = true;
        if (recorder.state !== 'inactive') recorder.stop();
        cleanup();
        reject(Error('Recording timed out. Keep the page visible and try again.'));
      },
      (length + 15) * 1000,
    );
    options.signal.addEventListener('abort', cancel, { once: true });
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(Error('Browser encoding failed.'));
    };
    recorder.onstop = () => {
      if (settled) return;
      settled = true;
      const blob = new Blob(chunks, { type: recorder.mimeType });
      cleanup();
      if (frames < 30 || blob.size < 50_000 || peak < 0.0001)
        reject(Error('Recording failed the audio-visual check. Enable sound and try again.'));
      else resolve(blob);
    };
    world.onFrame = () => {
      const elapsed = audio.context!.currentTime - origin;
      const progress = Math.max(0, Math.min(1, (elapsed - 1) / musicDuration));
      const nextScene = progress < 0.43 ? 0 : progress < 0.73 ? 1 : 2;
      const nextView: View =
        progress < 0.13 || progress > 0.88
          ? 'overview'
          : (progress > 0.3 && progress < 0.43) ||
              (progress > 0.57 && progress < 0.73)
            ? 'mechanism'
            : 'perform';
      if (scene !== nextScene) {
        scene = nextScene;
        options.onScene(scene);
      }
      if (view !== nextView) {
        view = nextView;
        options.onView(view);
      }
      if (!options.rawScene) {
      ctx.drawImage(world.renderer.domElement, 0, 0, 1920, 1080);
      const top = ctx.createLinearGradient(0, 0, 0, 220);
      top.addColorStop(0, '#0b110ff2');
      top.addColorStop(1, '#0b110f00');
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, 1920, 220);
      const bottom = ctx.createLinearGradient(0, 765, 0, 1080);
      bottom.addColorStop(0, '#0b110f00');
      bottom.addColorStop(0.3, '#0b110fe8');
      bottom.addColorStop(1, '#0b110fff');
      ctx.fillStyle = bottom;
      ctx.fillRect(0, 765, 1920, 315);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#d5c295';
      ctx.font = 'italic 68px Georgia';
      ctx.fillText('g.', 66, 89);
      ctx.font = '22px sans-serif';
      ctx.fillText('GRAND ATELIER', 139, 80);
      ctx.font = '17px sans-serif';
      ctx.fillStyle = '#c4cbbd';
      ctx.fillText('created by anionex and astra', 140, 113);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ede8d7';
      ctx.font = '23px sans-serif';
      ctx.fillText(scenes[scene], 1854, 77);
      ctx.fillStyle = '#c6b584';
      ctx.font = '17px sans-serif';
      ctx.fillText(
        view === 'mechanism'
          ? 'Keys · wippens · hammers · dampers / live linkage'
          : 'Live piano video and audio / not pre-rendered',
        1854,
        111,
      );
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f0eadb';
      ctx.font = '25px Georgia';
      ctx.fillText(score.title.slice(0, 68), 70, 852);
      ctx.textAlign = 'right';
      ctx.font = '19px sans-serif';
      ctx.fillStyle = '#d5c295';
      ctx.fillText(
        [...world.held].map(noteName).join('  ') ||
          'Let every touch resonate.',
        1850,
        852,
      );
      const keyWidth = 1780 / 52,
        y = 881,
        height = 89;
      for (const black of [false, true])
        for (const key of KEY_LAYOUT) {
          if (key.black !== black) continue;
          const x =
            70 +
            (black ? key.whiteIndex + 0.5 - 0.31 : key.whiteIndex) * keyWidth;
          const pressed = world.held.has(key.midi);
          ctx.fillStyle = pressed ? '#c5a76c' : black ? '#151b16' : '#eee9db';
          ctx.fillRect(
            x,
            y,
            keyWidth * (black ? 0.62 : 1) - 1.3,
            height * (black ? 0.64 : 1),
          );
          if (!black && key.midi % 12 === 0) {
            ctx.fillStyle = key.midi === 60 ? '#946824' : '#7c7a6d';
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(noteName(key.midi), x + keyWidth / 2, y + height - 8);
          }
        }
      ctx.fillStyle = '#d1b579';
      ctx.fillRect(70, 982, 1780 * progress, 2);
      ctx.textAlign = 'left';
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#bac2b2';
      ctx.fillText('Low left · high right · C4 = 261.63 Hz', 70, 1017);
      ctx.textAlign = 'right';
      ctx.fillStyle = world.pedal[2] ? '#e5c483' : '#858f80';
      ctx.fillText(
        ['Soft', 'Sostenuto', 'Sustain']
          .map((name, i) => `${world.pedal[i] ? '●' : '○'} ${name}`)
          .join('   '),
        1850,
        1017,
      );
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e5d6af';
      ctx.font = '23px sans-serif';
      ctx.fillText(SHARE_URL, 960, 1059);
      if (elapsed > length - 1.5) {
        ctx.fillStyle = '#0d160fcc';
        ctx.fillRect(475, 470, 970, 152);
        ctx.fillStyle = '#ede3c9';
        ctx.font = '37px Georgia';
        ctx.fillText('Your turn to play.', 960, 530);
        ctx.font = '22px sans-serif';
        ctx.fillText('Open the site and play this piano.', 960, 578);
      }
      }
      frames++;
      audio.analyser?.getFloatTimeDomainData(timeData);
      for (const value of timeData) peak = Math.max(peak, Math.abs(value));
      options.onProgress(elapsed);
      if (elapsed >= musicDuration + 1 && transport.playing) transport.stop();
      if (elapsed >= length && !ending) {
        ending = true;
        recorder.stop();
      }
    };
    recorder.start(1000);
    transport.play(
      score,
      () => {},
      () => {},
      1,
    );
  });
}
