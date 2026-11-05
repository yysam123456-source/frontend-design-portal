import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  Maximize2,
  RotateCcw,
  Piano,
  Sun,
  Moon,
  AudioLines,
  ArrowUpRight,
  VolumeX,
  Play,
  Square,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  CircleHelp,
  Headphones,
  SlidersHorizontal,
  X,
  Layers,
  Check,
  Music2,
  Upload,
} from 'lucide-react';
import { REPERTOIRE } from './lib/repertoire';
import { Slider } from './components/ui/slider';
import { Switch } from './components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import type { PianoWorld, View } from './lib/piano-world';
import {
  PianoState,
  KEY_MAP,
  KEY_LABELS,
  PEDAL_KEYS,
  type PianoSnapshot,
} from './lib/piano-state';
import { GrandAudio, type AudioStatus } from './lib/piano-audio';
import { BLACK, noteName, midiFrequency } from './lib/music';
import {
  originalScore,
  parsePianoMidi,
  formatTime,
  type PianoScore,
} from './lib/piano-score';
import { PianoTransport } from './lib/piano-transport';

const EMPTY: PianoSnapshot = {
  held: [],
  sounding: [],
  pedals: [false, false, false],
  captured: [],
  lastNote: null,
};
const SCENES = ['Concert Hall', 'Daylight Studio', 'Moonlit Terrace'];
const ENV_NAMES = [
  'THE CONCERT HALL',
  'THE DAYLIGHT STUDIO',
  'THE MOONLIT TERRACE',
];
const PRELUDE = originalScore();
const PEDALS = [
  {
    name: 'Soft',
    key: 'Left Shift',
    detail: 'Shifts the action for a softer, quieter tone',
  },
  {
    name: 'Sostenuto',
    key: 'Right Shift',
    detail: 'Sustains only the notes held when pressed',
  },
  {
    name: 'Sustain',
    key: 'Space',
    detail: 'Lifts all dampers; release to damp the strings',
  },
];
export default function Home() {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<PianoWorld | null>(null);
  const [scene, setScene] = useState(0);
  const [error, setError] = useState('');
  const audio = useRef<GrandAudio | null>(null);
  const player = useRef<PianoState | null>(null);
  const [snapshot, setSnapshot] = useState(EMPTY);
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [view, setView] = useState<View>('overview');
  const [volume, setVolume] = useState(65);
  const [reverb, setReverb] = useState(28);
  const [velocity, setVelocity] = useState(78);
  const [lid, setLid] = useState(true);
  const [slow, setSlow] = useState(false);
  const [help, setHelp] = useState(false);
  const [settings, setSettings] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [dockMinimized, setDockMinimized] = useState(true);
  const [immersiveControls, setImmersiveControls] = useState(false);
  const toggleImmersive = (value: boolean) => {
    setImmersive(value);
    setImmersiveControls(false);
    setSettings(false);
    world.current?.setImmersive(value);
  };
  const [octave, setOctave] = useState(4);
  const octaveRef = useRef(4);
  const velocityRef = useRef(0.78);
  const helpRef = useRef(false);
  const [demo, setDemo] = useState(false);
  const demoRef = useRef(false);
  const transport = useRef<PianoTransport | null>(null);
  const [selection, setSelection] = useState('prelude');
  const [builtin, setBuiltin] = useState<Record<string, PianoScore>>({});
  const [imported, setImported] = useState<PianoScore | null>(null);
  const [position, setPosition] = useState(0);
  const [scrubPosition, setScrubPosition] = useState<number | null>(null);
  const midiInput = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const recordingTask = useRef<{ cancel: () => void } | null>(null);
  const videoUrlRef = useRef('');
  const [ready, setReady] = useState(false);
  const tooltip = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLCanvasElement>(null);
  const activePointers = useRef(new Map<number, number>());
  const keysDown = useRef(new Map<string, number>());
  const config = useRef({
    scene: 0,
    view: 'overview' as View,
    lid: true,
    slow: false,
  });
  const stopDemo = () => {
    demoRef.current = false;
    transport.current?.stop();
    setDemo(false);
  };
  const changeScene = (i: number) => {
    config.current.scene = i;
    setScene(i);
    world.current?.setEnvironment(i);
    audio.current?.setEnvironment(i);
  };
  const changeView = (v: View) => {
    config.current.view = v;
    setView(v);
    world.current?.setView(v);
  };
  const changeOctave = (n: number) => {
    const o = Math.max(1, Math.min(6, n));
    player.current?.releaseSource('key:');
    player.current?.releaseSource('ui:');
    keysDown.current.clear();
    activePointers.current.clear();
    octaveRef.current = o;
    setOctave(o);
  };
  const allOff = () => {
    recordingTask.current?.cancel();
    stopDemo();
    player.current?.allOff();
    world.current?.releasePointers();
    activePointers.current.clear();
    keysDown.current.clear();
  };
  useEffect(() => {
    let disposed = false;
    let frame = 0;
    const scoreAbort = new AbortController();
    const loadScore = async (piece: (typeof REPERTOIRE)[number]) => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch(`/midi/${piece.file}`, {
            signal: AbortSignal.any([
              scoreAbort.signal,
              AbortSignal.timeout(15000),
            ]),
          });
          if (!response.ok) throw Error(`MIDI HTTP ${response.status}`);
          const score = parsePianoMidi(
            new Uint8Array(await response.arrayBuffer()),
            piece.title,
          );
          if (!disposed) setBuiltin(previous => ({ ...previous, [piece.id]: score }));
          return;
        } catch {
          if (disposed) return;
          if (attempt === 1)
            setError(`${piece.title} failed to load. Refresh to retry, or choose another piece.`);
        }
      }
    };
    REPERTOIRE.forEach(piece => { void loadScore(piece); });
    const sound = new GrandAudio();
    audio.current = sound;
    sound.onStatus = setStatus;
    const state = new PianoState({
      attack: (m, v, soft) => {
        sound.attack(m, v, soft);
        if (!demoRef.current) world.current?.sheet.record(m, performance.now() / 1000);
      },
      release: m => sound.release(m),
      silence: () => sound.silenceManual(),
    });
    const demoState = new PianoState({ attack() {}, release() {}, silence() {} });
    player.current = state;
    transport.current = new PianoTransport(sound, demoState);
    sound.onEnd = (m) => state.ended(m);
    const refresh = () => {
      if (disposed) return;
      const manual = state.snapshot(), demo = demoState.snapshot();
      if (!demoRef.current) world.current?.sheet.syncManual(manual.held, manual.pedals, performance.now() / 1000);
      const s = {
        held: [...new Set([...manual.held, ...demo.held])],
        sounding: [...new Set([...manual.sounding, ...demo.sounding])],
        captured: [...new Set([...manual.captured, ...demo.captured])],
        pedals: manual.pedals.map((down, i) => down || demo.pedals[i]),
        lastNote: manual.held.length ? manual.lastNote : demo.lastNote,
      };
      setSnapshot(s);
      if (world.current) {
        world.current.held = new Set(s.held);
        world.current.sounding = new Set(s.sounding);
        world.current.pedal = s.pedals;
        world.current.captured = new Set(s.captured);
      }
    };
    state.onChange = refresh;
    demoState.onChange = refresh;
    state.onStrike = (m) => world.current?.model.strike(m);
    demoState.onStrike = state.onStrike;
    import('./lib/piano-world')
      .then(({ PianoWorld }) => {
        if (!disposed && host.current) {
          const w = new PianoWorld(host.current);
          world.current = w;
          w.setEnvironment(config.current.scene);
          w.setView(config.current.view);
          w.model.lidOpen = config.current.lid;
          w.slow = config.current.slow;
          w.model.startEntrance(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
          state.emit();
          setReady(true);
          w.onNoteOn = (m, s, v) => {
            if (recordingTask.current) return;
            state.noteOn(m, s, v);
          };
          w.onNoteOff = (m, s) => state.noteOff(m, s);
          w.onHover = (m, x, y) => {
            if (!tooltip.current) return;
            tooltip.current.style.opacity = m === null ? '0' : '1';
            tooltip.current.style.transform = `translate(${x + 15}px,${y - 38}px)`;
            tooltip.current.textContent =
              m === null
                ? ''
                : `${noteName(m)} · ${midiFrequency(m).toFixed(2)} Hz`;
          };
          if (!import.meta.env.PROD)
            (window as unknown as Record<string, unknown>).__grandAtelier = {
              state,
              sound,
              world: w,
              transport: transport.current,
            };
        }
      })
      .catch((e) => {
        console.error(e);
        setError(
          '3D is unavailable. Enable browser hardware acceleration and refresh. The on-screen keys remain playable.',
        );
      });
    const down = (e: KeyboardEvent) => {
      if (
        e.repeat ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.isComposing ||
        helpRef.current
      )
        return;
      const target = e.target as HTMLElement;
      if (
        target.closest(
          'input,textarea,select,[role="slider"],[contenteditable="true"]',
        )
      )
        return;
      if (e.code === 'Escape') {
        allOff();
        return;
      }
      if (recordingTask.current) return;
      if (e.code in PEDAL_KEYS) {
        e.preventDefault();
        state.pedal(PEDAL_KEYS[e.code], true, `key:${e.code}`);
        return;
      }
      if (e.code in KEY_MAP) {
        e.preventDefault();
        const midi = (octaveRef.current + 1) * 12 + KEY_MAP[e.code];
        keysDown.current.set(e.code, midi);
        state.noteOn(midi, `key:${e.code}`, velocityRef.current);
      }
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        changeOctave(octaveRef.current + (e.code === 'ArrowRight' ? 1 : -1));
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code in PEDAL_KEYS) {
        state.pedal(PEDAL_KEYS[e.code], false, `key:${e.code}`);
      }
      const midi = keysDown.current.get(e.code);
      if (midi !== undefined) {
        state.noteOff(midi, `key:${e.code}`);
        keysDown.current.delete(e.code);
      }
    };
    const blur = () => {
      // Only release physical input; the independent score clock keeps running.
      state.allOff();
      world.current?.releasePointers();
      activePointers.current.clear();
      keysDown.current.clear();
    };
    const visibility = () => {
      if (document.hidden) blur();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibility);
    const data = new Uint8Array(256);
    const draw = () => {
      if (disposed) return;
      const c = meter.current;
      const ctx = c?.getContext('2d');
      if (c && ctx) {
        const w = c.width,
          h = c.height;
        ctx.clearRect(0, 0, w, h);
        if (sound.analyser) sound.analyser.getByteFrequencyData(data);
        ctx.fillStyle = '#c9b07a';
        for (let i = 0; i < 22; i++) {
          const height = Math.max(2, ((data[i * 3] || 0) / 255) * h * 0.95);
          ctx.fillRect(i * 5, (h - height) / 2, 2, height);
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      disposed = true;
      scoreAbort.abort();
      cancelAnimationFrame(frame);
      demoRef.current = false;
      recordingTask.current?.cancel();
      transport.current?.stop();
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
      sound.dispose();
      world.current?.dispose();
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility);
      delete (window as unknown as Record<string, unknown>).__grandAtelier;
    };
  }, []);
  const changeHelp = (open: boolean) => {
    helpRef.current = open;
    if (open) allOff();
    setHelp(open);
  };
  useEffect(() => {
    if (!ready) return;
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: unknown,
          ) => Promise<void> | void;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: unknown) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    };
    register({
      name: 'read_piano_state',
      title: 'Read piano state',
      description:
        'Read current held notes, ringing notes and three pedal states.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => player.current?.snapshot(),
    });
    register({
      name: 'configure_piano_room',
      title: 'Change piano environment and view',
      description:
        'Change the visible piano environment and camera. Does not play audio.',
      inputSchema: {
        type: 'object',
        properties: {
          environment: { type: 'integer', minimum: 0, maximum: 2 },
          view: { type: 'string', enum: ['overview', 'perform', 'mechanism'] },
        },
        required: ['environment', 'view'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: (input: unknown) => {
        const p = input as { environment: number; view: View };
        if (
          !p ||
          !Number.isInteger(p.environment) ||
          p.environment < 0 ||
          p.environment > 2 ||
          !['overview', 'perform', 'mechanism'].includes(p.view)
        )
          throw Error('Invalid environment or view');
        changeScene(p.environment);
        changeView(p.view);
        return { environment: SCENES[p.environment], view: p.view };
      },
    });
    return () => lifecycle.abort();
  }, [ready]);
  const chosenScore = useMemo(() => {
    if (selection === 'imported') return imported;
    const score = selection === 'prelude' ? PRELUDE : builtin[selection];
    return score ? { ...score, title: score.title } : null;
  }, [builtin, imported, selection]);
  const startDemo = async () => {
    if (recordingTask.current) return;
    if (demoRef.current) {
      setPosition(transport.current?.pause() ?? position);
      demoRef.current = false;
      setDemo(false);
      return;
    }
    if (!chosenScore) {
      setError("The score is still loading. Please try again shortly.");
      return;
    }
    demoRef.current = true;
    setDemo(true);
    try {
      await audio.current?.unlock();
    } catch {
      stopDemo();
      return;
    }
    if (!demoRef.current) return;
    world.current?.sheet.setScore(chosenScore);
    transport.current?.play(chosenScore, setPosition, () => {
      demoRef.current = false;
      setDemo(false);
    }, 0.15, position >= chosenScore.duration ? 0 : position);
  };
  useEffect(() => {
    if (chosenScore && world.current) world.current.sheet.setScore(chosenScore);
  }, [chosenScore, ready]);
  useEffect(() => {
    if (world.current) {
      world.current.sheetTime = position;
      world.current.sheetPlaying = demo || recording;
      world.current.setImmersive(immersive);
    }
  }, [position, demo, recording, immersive, ready]);
  const seekDemo = (seconds: number) => {
    if (!chosenScore) return;
    const target = Math.max(0, Math.min(chosenScore.duration, seconds));
    setScrubPosition(null);
    setPosition(target);
    if (demoRef.current) {
      transport.current?.play(chosenScore, setPosition, () => {
        demoRef.current = false;
        setDemo(false);
      }, 0.03, target);
    }
  };
  const importMidi = async (file?: File) => {
    if (!file) return;
    stopDemo();
    try {
      if (file.size > 2_000_000) throw Error("MIDI files must be at most 2 MB.");
      const score = parsePianoMidi(
        new Uint8Array(await file.arrayBuffer()),
        file.name,
      );
      setImported(score);
      setSelection('imported');
      setPosition(0);
      setError(score.warnings.join(' '));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the MIDI file. Please check the file.");
    }
    if (midiInput.current) midiInput.current.value = '';
  };
  const recordVideo = async (rawScene = false) => {
    if (recordingTask.current) {
      recordingTask.current.cancel();
      return;
    }
    if (!chosenScore) {
      setError("Please wait for the score to load.");
      return;
    }
    if (
      !world.current ||
      !audio.current ||
      !player.current ||
      !transport.current
    )
      return;
    stopDemo();
    const abort = new AbortController();
    recordingTask.current = { cancel: () => abort.abort() };
    setRecording(true);
    const previous = { ...config.current };
    try {
      await audio.current.unlock();
      const { recordPiano } = await import('./lib/piano-capture');
      abort.signal.throwIfAborted();
      const score = selection === 'prelude' ? originalScore(3) : chosenScore;
      const blob = await recordPiano(
        world.current,
        audio.current,
        transport.current,
        score,
        {
          signal: abort.signal,
          onProgress: seconds => setPosition(Math.max(0, seconds - 1)),
          onScene: changeScene,
          onView: changeView,
          rawScene,
        },
      );
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = URL.createObjectURL(blob);
      return videoUrlRef.current;
    } catch (e) {
      if (!abort.signal.aborted)
        setError(
          e instanceof Error
            ? e.message
            : "Recording failed. Use a browser that supports MediaRecorder.",
        );
    } finally {
      recordingTask.current = null;
      setRecording(false);
      changeScene(previous.scene);
      changeView(previous.view);
    }
  };
  // Owner capture is available only in the local development build; it is not
  // a general-purpose recording control and is never shown to visitors.
  useEffect(() => {
    if (import.meta.env.DEV) {
      const scope = window as unknown as { __recordAtelier?: typeof recordVideo };
      scope.__recordAtelier = recordVideo;
      return () => { delete scope.__recordAtelier; };
    }
  });
  const pointerNote = (
    event: ReactPointerEvent<HTMLElement>,
    down: boolean,
  ) => {
    const id = event.pointerId;
    const source = `ui:${id}`;
    if (!down) {
      const old = activePointers.current.get(id);
      if (old !== undefined) player.current?.noteOff(old, source);
      activePointers.current.delete(id);
      return;
    }
    if (recordingTask.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(id);
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-midi]',
    );
    if (target) {
      const midi = Number(target.dataset.midi);
      activePointers.current.set(id, midi);
      player.current?.noteOn(midi, source, velocityRef.current);
    }
  };
  const slideNote = (event: ReactPointerEvent<HTMLElement>) => {
    const old = activePointers.current.get(event.pointerId);
    if (old === undefined) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-midi]');
    const midi = target ? Number(target.dataset.midi) : -1;
    if (midi !== old) {
      if (old >= 21) player.current?.noteOff(old, `ui:${event.pointerId}`);
      activePointers.current.set(event.pointerId, midi);
      if (midi >= 21)
        player.current?.noteOn(
          midi,
          `ui:${event.pointerId}`,
          velocityRef.current,
        );
    }
  };
  const screenKeys = [];
  let white = 0;
  for (let offset = 0; offset < 25; offset++) {
    const midi = (octave + 1) * 12 + offset;
    const black = BLACK.has(midi % 12);
    screenKeys.push({
      midi,
      offset,
      black,
      left: black ? white - 0.31 : white,
    });
    if (!black) white++;
  }
  return (
    <main className={`atelier environment-${scene} view-${view}${immersive ? ' immersive' : ''}${ready ? ' scene-ready' : error ? ' scene-error' : ''}`}>
      <input
        ref={midiInput}
        type="file"
        accept=".mid,.midi,audio/midi"
        hidden
        onChange={(e) => void importMidi(e.target.files?.[0])}
      />
      <div ref={host} className="world" aria-label={"Interactive 3D grand piano"} />
      <div className="scene-vignette" />
      <header className="topbar">
        <a className="brand" href="/grand-atelier.html">
          <b>g.</b>
          <span className="brand-divider" />
          GRAND ATELIER
        </a>
        <span className="top-caption">THE INTERACTIVE PIANO EXPERIENCE</span>
        <div className="header-actions">
          <button className="icon-button immersion-entry" aria-label={"Enter immersive mode"} title={"Immersive mode"} onClick={() => toggleImmersive(true)}>
            <Maximize2 size={17} />
            <span>{"Immerse"}</span>
          </button>
          <button
            className={`sound-status ${status}`}
            onClick={() => void audio.current?.unlock().catch(() => {})}
          >
            <span />
            <span className="sound-status-label">{status === 'ready'
              ? "Stereo samples ready"
              : status === 'loading'
                ? "Loading samples…"
                : status === 'error'
                  ? "Retry samples"
                  : "Enable sound"}</span>
            <Headphones size={14} />
          </button>
          <button
            className="icon-button"
            aria-label={"Playing guide"}
            onClick={() => changeHelp(true)}
          >
            <CircleHelp size={17} />
          </button>
          <button
            className="icon-button"
            aria-label={"Fullscreen"}
            onClick={() => {
              const task = document.fullscreenElement
                ? document.exitFullscreen()
                : document.documentElement.requestFullscreen?.();
              void task?.catch(() =>
                setError("Fullscreen is unavailable in this window. Open the site in a browser."),
              );
            }}
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </header>
      {immersive && <>
        <div className={`immersive-reveal${immersiveControls ? ' pinned' : ''}`}>
          <button className="immersive-handle" aria-label={"Show immersive controls"} aria-expanded={immersiveControls} onClick={() => setImmersiveControls(!immersiveControls)}><span /></button>
          <nav className="immersive-controls" aria-label={"Immersive controls"}>
            <select aria-label={"Environment"} value={scene} onChange={e => changeScene(Number(e.target.value))}>
              {SCENES.map((name, i) => <option key={name} value={i}>{name}</option>)}
            </select>
            <select aria-label={"Camera view"} value={view} onChange={e => changeView(e.target.value as View)}>
              <option value="overview">{"Overview"}</option><option value="perform">{"Play close-up"}</option><option value="mechanism">{"Inside the action"}</option>
            </select>
            <button onClick={() => { setLid(!lid); config.current.lid = !lid; if (world.current) world.current.model.lidOpen = !lid; }} disabled={view === 'mechanism'}>{lid ? "Close lid" : "Open lid"}</button>
            <button onClick={() => void startDemo()} disabled={!chosenScore}>{demo ? "Pause" : position > 0 ? "Resume" : "Listen"}</button>
          </nav>
        </div>
        <button className="immersive-exit" aria-label={"Exit immersive mode"} title={"Exit immersive mode"} onClick={() => toggleImmersive(false)}><X size={19} /></button>
      </>}
      <section className="instrument-heading">
        <p className="eyebrow">
          <span />
          THE CONCERT COLLECTION · 01
        </p>
        <h1>
          Concert
          <br />
          <em>Grand.</em>
        </h1>
        <p className="instrument-subtitle">{"A world of resonance, at your fingertips."}</p>
        <div className="instrument-spec">
          <span>
            88 <small>KEYS</small>
          </span>
          <i />
          <span>
            3 <small>PEDALS</small>
          </span>
        </div>
      </section>
      <nav className="scene-selector" aria-label={"Choose an environment"}>
        <p className="eyebrow">CHOOSE YOUR ATMOSPHERE</p>
        {SCENES.map((name, i) => (
          <button
            key={name}
            aria-pressed={scene === i}
            className={'scene-option ' + (scene === i ? 'selected' : '')}
            onClick={() => changeScene(i)}
          >
            <span className={'scene-icon scene-' + i}>
              {i === 0 ? (
                <AudioLines size={21} />
              ) : i === 1 ? (
                <Sun size={21} />
              ) : (
                <Moon size={21} />
              )}
            </span>
            <span>
              <strong>{name}</strong>
              <small>{ENV_NAMES[i]}</small>
            </span>
            <span className="scene-index">
              {scene === i ? <Check size={13} /> : <>0{i + 1}</>}
            </span>
          </button>
        ))}
      </nav>
      <Tabs
        className="camera-bar"
        value={view}
        onValueChange={(v) => changeView(v as View)}
      >
        <TabsList>
          <TabsTrigger value="overview">{"Overview"}</TabsTrigger>
          <TabsTrigger value="perform">
            <Piano size={15} />{"Play close-up"}</TabsTrigger>
          <TabsTrigger value="mechanism">{"Inside the action"}<ArrowUpRight size={14} />
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <button
        className={'settings-toggle icon-button ' + (settings ? 'active' : '')}
        aria-label={"Sound and lid settings"}
        aria-expanded={settings}
        onClick={() => setSettings(!settings)}
      >
        <SlidersHorizontal size={18} />
      </button>
      <aside
        className={'sound-panel ' + (settings ? 'expanded' : '')}
        inert={!settings}
        aria-hidden={!settings}
      >
        <div className="panel-heading">
          <span>{"Sound & details"}</span>
          <button aria-label={"Close settings"} onClick={() => setSettings(false)}>
            <X size={15} />
          </button>
        </div>
        <div className="range-label">
          <span>{"Volume"}</span>
          <span>{volume}%</span>
        </div>
        <Slider
          aria-label={"Volume"}
          value={[volume]}
          min={0}
          max={100}
          onValueChange={(v) => {
            const n = Array.isArray(v) ? v[0] : v;
            setVolume(n);
            audio.current?.setVolume(n / 100);
          }}
        />
        <div className="range-label">
          <span>{"Room reverb"}</span>
          <span>{reverb}%</span>
        </div>
        <Slider
          aria-label={"Room reverb"}
          value={[reverb]}
          min={0}
          max={100}
          onValueChange={(v) => {
            const n = Array.isArray(v) ? v[0] : v;
            setReverb(n);
            audio.current?.setReverb(n / 100);
          }}
        />
        <div className="range-label">
          <span>{"Touch velocity"}</span>
          <span>
            {velocity < 45 ? "Soft" : velocity < 80 ? "Medium" : "Strong"}
          </span>
        </div>
        <Slider
          aria-label={"Touch velocity"}
          value={[velocity]}
          min={15}
          max={100}
          onValueChange={(v) => {
            const n = Array.isArray(v) ? v[0] : v;
            setVelocity(n);
            velocityRef.current = n / 100;
          }}
        />
        <label className="switch-row" htmlFor="lid-switch">
          <span>{"Open lid"}</span>
          <Switch
            id="lid-switch"
            checked={lid}
            disabled={view === 'mechanism'}
            onCheckedChange={(v) => {
              setLid(v);
              config.current.lid = v;
              if (world.current) world.current.model.lidOpen = v;
            }}
            aria-label={"Open lid"}
          />
        </label>
        <p className="settings-note">{"Each environment changes both lighting and room acoustics."}</p>
      </aside>
      {view === 'mechanism' && (
        <aside className="mechanism-panel">
          <p className="eyebrow">INSIDE THE INSTRUMENT</p>
          <h2>{"See sound take shape"}</h2>
          <p>{"The case is opened. Play a key to explore the action."}</p>
          <ol>
            {[
              "Key descends · tail rises",
              "Wippen drives the jack",
              "Hammer strikes and rebounds",
              "Damper lifts · strings vibrate",
            ].map((s, i) => (
              <li className={snapshot.held.length ? 'engaged' : ''} key={s}>
                <span>0{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <label className="switch-row" htmlFor="slow-switch">
            <span>{"Slow motion"}<small>{"Visual motion only"}</small>
            </span>
            <Switch
              id="slow-switch"
              checked={slow}
              aria-label={"Slow motion"}
              onCheckedChange={(v) => {
                setSlow(v);
                config.current.slow = v;
                if (world.current) world.current.slow = v;
              }}
            />
          </label>
        </aside>
      )}
      <div className="orbit-hint">
        <span>
          {view === 'perform'
            ? "Play the 3D keys or the keyboard below"
            : "Drag to orbit · scroll or pinch to zoom"}
        </span>
        <button aria-label={"Reset view"} onClick={() => changeView('overview')}>
          <RotateCcw size={15} />
        </button>
      </div>
      <section className={`performance-dock${dockMinimized ? ' minimized' : ''}`} aria-label={"Performance controls"}>
        <div className="repertoire-row">
          <label className="repertoire-select">
            <Music2 size={14} />
            <select
              aria-label={"Repertoire"}
              value={selection}
              disabled={recording}
              onChange={(e) => {
                stopDemo();
                setSelection(e.target.value);
                setPosition(0);
              }}
            >
              <option value="prelude">{"Atelier Prelude · Original"}</option>
              {REPERTOIRE.map(piece => <option key={piece.id} value={piece.id}>{piece.title}</option>)}
              {imported && (
                <option value="imported">{"Imported ·"}{imported.title}</option>
              )}
            </select>
          </label>
          <span className="score-time">
            {formatTime(scrubPosition ?? position)} / {formatTime(chosenScore?.duration ?? 0)}
          </span>
          <button
            className="import-button"
            aria-label={"Import MIDI"}
            disabled={recording}
            onClick={() => midiInput.current?.click()}
            title={"Read locally in this browser session; never uploaded"}
          >
            <Upload size={13} />
            <span>{"Import MIDI"}</span>
          </button>
          <button
            className="dock-toggle"
            aria-label={dockMinimized ? "Expand keyboard" : "Minimize keyboard"}
            aria-expanded={!dockMinimized}
            title={dockMinimized ? "Expand keyboard" : "Minimize keyboard"}
            onClick={() => setDockMinimized(v => !v)}
          >
            {dockMinimized ? <Maximize2 size={15} /> : <span aria-hidden="true">−</span>}
          </button>
        </div>
        <Slider
          className="playback-seek"
          aria-label={"Playback position; drag to seek"}
          min={0}
          max={chosenScore?.duration || 1}
          step={0.1}
          disabled={!chosenScore || recording}
          value={[scrubPosition ?? position]}
          onValueChange={v => setScrubPosition(Array.isArray(v) ? v[0] : v)}
          onValueCommitted={v => seekDemo(Array.isArray(v) ? v[0] : v)}
        />
        <div className="dock-top">
          <div className="dock-title">
            <Keyboard size={17} />
            <span>{recording ? "Recording" : demo ? "Auto play" : "Free play"}</span>
            <span className="dock-separator" />
            <span className="note-output" aria-live="off">
              {snapshot.held.length
                ? snapshot.held.map(noteName).join(' · ')
                : snapshot.lastNote
                  ? noteName(snapshot.lastNote)
                  : `${noteName((octave + 1) * 12)} — ${noteName((octave + 3) * 12)}`}
            </span>
          </div>
          <div className="octave">
            <button
              aria-label={"Lower octave"}
              disabled={octave === 1}
              onClick={() => changeOctave(octave - 1)}
            >
              <ChevronLeft size={15} />
            </button>
            <span>
              OCTAVE <b>{octave}</b>
            </span>
            <button
              aria-label={"Raise octave"}
              disabled={octave === 6}
              onClick={() => changeOctave(octave + 1)}
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <button
            className={'demo-button ' + (demo ? 'playing' : '')}
            disabled={recording || !chosenScore}
            onClick={() => void startDemo()}
          >
            {demo ? <Square size={12} /> : <Play size={12} />}
            <span>
              {demo ? "Pause" : !chosenScore ? "Loading score" : position > 0 && position < chosenScore.duration ? "Resume" : "Listen"}
            </span>
          </button>
        </div>
        <div
          className="keyboard-surface"
          onPointerDown={(e) => pointerNote(e, true)}
          onPointerMove={slideNote}
          onPointerUp={(e) => pointerNote(e, false)}
          onPointerCancel={(e) => pointerNote(e, false)}
          onLostPointerCapture={(e) => pointerNote(e, false)}
        >
          {screenKeys.map((k) => (
            <button
              key={k.midi}
              data-midi={k.midi}
              tabIndex={-1}
              aria-label={`Play ${noteName(k.midi)}`}
              className={`piano-key ${k.black ? 'black-key' : 'white-key'} ${snapshot.held.includes(k.midi) ? 'pressed' : ''}`}
              style={{
                left: `${(k.left / white) * 100}%`,
                width: `${((k.black ? 0.62 : 1) / white) * 100}%`,
              }}
            >
              <span className="key-letter">{KEY_LABELS[k.offset] ?? ''}</span>
              {!k.black && <span className="key-note">{noteName(k.midi)}</span>}
            </button>
          ))}
        </div>
        <div className="dock-bottom">
          <span>
            <span className="status-dot" />{"Hold to play, release to damp"}</span>
          <div className="pedals">
            {PEDALS.map((p, i) => (
              <button
                key={p.name}
                title={p.detail}
                aria-label={`${p.name} pedal; hold to press, release to lift`}
                aria-pressed={snapshot.pedals[i]}
                className={'pedal ' + (snapshot.pedals[i] ? 'depressed' : '')}
                onPointerDown={(e) => {
                  if (recordingTask.current) return;
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  player.current?.pedal(i, true, `pedal-ui:${e.pointerId}`);
                }}
                onPointerUp={(e) =>
                  player.current?.pedal(i, false, `pedal-ui:${e.pointerId}`)
                }
                onPointerCancel={(e) =>
                  player.current?.pedal(i, false, `pedal-ui:${e.pointerId}`)
                }
                onLostPointerCapture={(e) =>
                  player.current?.pedal(i, false, `pedal-ui:${e.pointerId}`)
                }
              >
                <span className="pedal-led" />
                <span>{p.name}</span>
                <kbd>{p.key}</kbd>
              </button>
            ))}
          </div>
          <button
            className="panic"
            aria-label={"Release all notes and pedals"}
            title={"Esc · Release all"}
            onClick={allOff}
          >
            <VolumeX size={14} />
          </button>
        </div>
      </section>
      <div className="live-meter">
        <canvas ref={meter} width={110} height={24} />
        <span>
          {snapshot.sounding.length
            ? `${snapshot.sounding.length} VOICES`
            : 'A4 = 440 Hz'}
        </span>
      </div>
      <div ref={tooltip} className="note-tooltip" />
      {!ready && !error && (
        <div className="scene-loading">
          <span />{"Tuning strings and light…"}</div>
      )}
      {error && (
        <div role="alert" className="load-error">
          {error}
          <button aria-label={"Dismiss message"} onClick={() => setError('')}>
            <X size={16} />
          </button>
        </div>
      )}
      <footer className="bottom-signature">
        <span>created by <a href="https://github.com/Anionex" target="_blank" rel="noopener noreferrer">anionex</a> and astra</span>
        <button onClick={() => changeHelp(true)}>{"Guide & sound credits"}<ArrowUpRight size={10} />
        </button>
      </footer>
      <Dialog open={help} onOpenChange={changeHelp}>
        <DialogContent className="help-dialog">
          <DialogTitle>{"Let every touch resonate."}</DialogTitle>
          <DialogDescription>{"Grand Atelier · Playing & exploration guide"}</DialogDescription>
          <div className="help-section">
            <h3>
              <Piano size={17} />{"Start playing"}</h3>
            <p>{"Click “Enable sound”, then “Play close-up”. Hold the 3D or on-screen keys to play. Drag across keys for a glissando; use multiple touches for chords."}</p>
            <p>{"From the player’s position, low notes are on the left. Middle C is the 40th key and the 24th white key from the left: C4 / MIDI 60 / 261.63 Hz. It is marked on the keyboard."}</p>
            <p>
              <kbd>A S D F G H J K L ; &apos;</kbd>{" play white keys; the upper row "}{' '}
              <kbd>W E T Y U O P ]</kbd>{" plays black keys. Arrow keys "}<kbd>← →</kbd>{' '}{" change octave; "}<kbd>Esc</kbd>{" releases all notes and pedals immediately."}</p>
          </div>
          <div className="help-section">
            <h3>
              <Music2 size={17} />{"Repertoire"}</h3>
            <p>{"One original piece is built in — select “Atelier Prelude · Original” to play it. You can also import piano MIDI, preserving pitch, tempo changes, note timing, velocity and all three pedals without quantization or transposition. Imported files stay in this browser session and are never uploaded."}</p>
            <p>{"The desk displays a MIDI transcription with time and key signatures, accidentals, rests, dots, ties and pedal lines, turning pages with playback. Notation uses a 32nd-note grid; audio retains original timing. Missing key signatures are shown without sharps or flats. Fingering and expression are not inferred. Free-play notation uses 120 BPM."}</p>
          </div>
          <div className="help-section">
            <h3>
              <Music2 size={17} />{"Three pedals"}</h3>
            {PEDALS.map((p) => (
              <p key={p.name}>
                <strong>{p.name}</strong> <kbd>{p.key}</kbd> — {p.detail}{". Hold to press; release to lift."}</p>
            ))}
          </div>
          <div className="help-section">
            <h3>
              <Layers size={17} />{"Explore the mechanism"}</h3>
            <p>{"“Inside the action” opens the covering parts. Each note has its own key, wippen, jack and hammer; the upper treble has no dampers, as on a real piano. Slow motion changes only the animation, not pitch or playback speed."}</p>
            <p>{"This visualization follows real mechanical principles, rather than replicating a specific brand’s engineering. String vibration is exaggerated for visibility."}</p>
          </div>
          <p className="credits">{"Sound: "}<a
              href="https://sfzinstruments.github.io/pianos/salamander/"
              target="_blank"
              rel="noreferrer"
            >
              Salamander Grand Piano
            </a>{' '}
            · Alexander Holm ·{' '}
            <a
              href="https://creativecommons.org/licenses/by/3.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY 3.0
            </a>{". Uses 30 MP3 samples distributed by Tone.js, with real-time pitch shifting, velocity filtering and reverb. Rendered in real time with Three.js."}</p>
        </DialogContent>
      </Dialog>
    </main>
  );
}
