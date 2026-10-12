// Every sound in the world is synthesised with Web Audio: no files to download, nothing licensed.
// The sea, wind and rain are shaped noise; the outboard is detuned saws; the horn is two notes.
// Silent until the visitor chooses sound.

export type Audio = ReturnType<typeof createAudio>;

type Mix = { speed: number; throttle: number; boost: boolean; rain: number; wind: number; airborne: boolean };

export function createAudio() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let on = false;
  const loops: {
    sea?: GainNode;
    wind?: GainNode;
    windFilter?: BiquadFilterNode;
    rain?: GainNode;
    engine?: GainNode;
    engineFilter?: BiquadFilterNode;
    oscA?: OscillatorNode;
    oscB?: OscillatorNode;
  } = {};
  let t = 0;

  function noiseSource(): AudioBufferSourceNode {
    const src = ctx!.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    src.start(0, Math.random() * 2);
    return src;
  }

  function build() {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioCtx();
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(comp).connect(ctx.destination);

    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const ch = noise.getChannelData(0);
    // Pinkish noise: gentler than white for water and wind.
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < ch.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      ch[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2;
    }

    // Sea: low swell.
    const seaFilter = ctx.createBiquadFilter();
    seaFilter.type = "lowpass";
    seaFilter.frequency.value = 520;
    loops.sea = ctx.createGain();
    loops.sea.gain.value = 0.25;
    noiseSource().connect(seaFilter).connect(loops.sea).connect(master);

    // Wind: a band that wanders.
    loops.windFilter = ctx.createBiquadFilter();
    loops.windFilter.type = "bandpass";
    loops.windFilter.Q.value = 0.8;
    loops.windFilter.frequency.value = 600;
    loops.wind = ctx.createGain();
    loops.wind.gain.value = 0;
    noiseSource().connect(loops.windFilter).connect(loops.wind).connect(master);

    // Rain: bright hiss.
    const rainHigh = ctx.createBiquadFilter();
    rainHigh.type = "highpass";
    rainHigh.frequency.value = 1400;
    loops.rain = ctx.createGain();
    loops.rain.gain.value = 0;
    noiseSource().connect(rainHigh).connect(loops.rain).connect(master);

    // Outboard: two detuned saws through a filter that opens with speed.
    loops.engineFilter = ctx.createBiquadFilter();
    loops.engineFilter.type = "lowpass";
    loops.engineFilter.frequency.value = 300;
    loops.engine = ctx.createGain();
    loops.engine.gain.value = 0;
    loops.oscA = ctx.createOscillator();
    loops.oscA.type = "sawtooth";
    loops.oscA.frequency.value = 46;
    loops.oscB = ctx.createOscillator();
    loops.oscB.type = "sawtooth";
    loops.oscB.frequency.value = 47.3;
    loops.oscA.connect(loops.engineFilter);
    loops.oscB.connect(loops.engineFilter);
    loops.engineFilter.connect(loops.engine).connect(master);
    loops.oscA.start();
    loops.oscB.start();
  }

  function burst(opts: { type: BiquadFilterType; freq: number; q?: number; gain: number; decay: number; delay?: number }) {
    if (!ctx || !master || !on) return;
    const start = ctx.currentTime + (opts.delay ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = opts.type;
    filter.frequency.value = opts.freq;
    filter.Q.value = opts.q ?? 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(opts.gain, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + opts.decay);
    src.connect(filter).connect(g).connect(master);
    src.start(start, Math.random());
    src.stop(start + opts.decay + 0.05);
  }

  function tone(freqs: number[], type: OscillatorType, gain: number, decay: number, glide = 1) {
    if (!ctx || !master || !on) return;
    const now = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.03);
    g.gain.setValueAtTime(gain, now + decay * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1800;
    g.connect(filter).connect(master);
    for (const f of freqs) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, now);
      if (glide !== 1) o.frequency.exponentialRampToValueAtTime(f * glide, now + decay);
      o.connect(g);
      o.start(now);
      o.stop(now + decay + 0.05);
    }
  }

  return {
    enable() {
      if (!ctx) build();
      on = true;
      void ctx!.resume();
      master!.gain.setTargetAtTime(0.9, ctx!.currentTime, 0.4);
    },
    disable() {
      on = false;
      if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    },
    suspend() {
      if (ctx && ctx.state === "running") void ctx.suspend();
    },
    get enabled() {
      return on;
    },
    update(dt: number, mix: Mix) {
      if (!ctx || !on) return;
      t += dt;
      const now = ctx.currentTime;
      const swell = 0.2 + Math.sin(t * 0.37) * 0.05 + Math.sin(t * 0.11) * 0.04;
      loops.sea?.gain.setTargetAtTime(swell + mix.wind * 0.12, now, 0.3);
      loops.wind?.gain.setTargetAtTime(mix.wind * mix.wind * 0.22, now, 0.5);
      loops.windFilter?.frequency.setTargetAtTime(420 + Math.sin(t * 0.23) * 220 + mix.wind * 500, now, 0.5);
      loops.rain?.gain.setTargetAtTime(mix.rain * 0.16, now, 0.6);
      const rev = Math.min(1, mix.speed / 19) * 0.7 + mix.throttle * 0.2 + (mix.boost && mix.throttle > 0 ? 0.3 : 0);
      const base = 44 + rev * 52;
      loops.oscA?.frequency.setTargetAtTime(base, now, 0.08);
      loops.oscB?.frequency.setTargetAtTime(base * 1.028, now, 0.08);
      loops.engineFilter?.frequency.setTargetAtTime(mix.airborne ? 1400 : 260 + rev * 900, now, 0.1);
      loops.engine?.gain.setTargetAtTime(0.018 + rev * 0.06, now, 0.15);
    },
    horn() {
      tone([233, 311], "sawtooth", 0.09, 0.9);
    },
    hop() {
      burst({ type: "bandpass", freq: 900, gain: 0.12, decay: 0.35 });
    },
    splash(speed: number) {
      burst({ type: "bandpass", freq: 1100, q: 0.5, gain: Math.min(0.35, 0.06 + speed * 0.04), decay: 0.7 });
    },
    thud(speed: number) {
      burst({ type: "lowpass", freq: 260, gain: Math.min(0.45, speed * 0.07), decay: 0.32 });
      tone([70], "sine", Math.min(0.2, speed * 0.03), 0.25, 0.6);
    },
    thunder(delay: number) {
      burst({ type: "lowpass", freq: 140, gain: 0.5, decay: 3.2, delay });
      burst({ type: "lowpass", freq: 320, gain: 0.18, decay: 1.4, delay: delay + 0.05 });
    },
    click() {
      tone([880], "sine", 0.05, 0.08);
    },
    chime() {
      tone([659, 988], "triangle", 0.035, 0.5);
    },
    dispose() {
      on = false;
      void ctx?.close();
      ctx = null;
    },
  };
}
