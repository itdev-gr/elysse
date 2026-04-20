import { Renderer, Program, Mesh, Triangle } from 'ogl';
import vertex from '~/assets/shaders/flow.vert?raw';
import fragment from '~/assets/shaders/flow.frag?raw';
import { prefersReducedMotion } from '~/scripts/utils/reducedMotion';

export interface FlowPreset {
  color1: [number, number, number];
  color2: [number, number, number];
  flowStrength: number;
  density: number;
  speed: number;
}

// Base (color1) is warm cream #f6f4ec ≈ [0.963, 0.956, 0.926]. Accent tints (color2) are muted green/moss/water.
export const PRESETS: Record<string, FlowPreset> = {
  hero:      { color1: [0.963, 0.956, 0.926], color2: [0.48, 0.62, 0.52], flowStrength: 0.22, density: 3.2, speed: 0.9 },
  agri:      { color1: [0.955, 0.955, 0.920], color2: [0.42, 0.60, 0.44], flowStrength: 0.28, density: 4.0, speed: 0.8 },
  landscape: { color1: [0.940, 0.955, 0.930], color2: [0.36, 0.58, 0.56], flowStrength: 0.18, density: 2.6, speed: 0.6 },
  building:  { color1: [0.960, 0.958, 0.940], color2: [0.32, 0.44, 0.38], flowStrength: 0.10, density: 5.0, speed: 1.2 },
  industry:  { color1: [0.955, 0.950, 0.920], color2: [0.28, 0.46, 0.34], flowStrength: 0.10, density: 6.0, speed: 1.4 },
  counters:  { color1: [0.960, 0.950, 0.930], color2: [0.40, 0.62, 0.48], flowStrength: 0.20, density: 3.4, speed: 0.9 },
  map:       { color1: [0.940, 0.948, 0.930], color2: [0.24, 0.48, 0.52], flowStrength: 0.14, density: 2.2, speed: 0.55 },
  epsilon:   { color1: [0.958, 0.955, 0.930], color2: [0.36, 0.56, 0.44], flowStrength: 0.13, density: 4.2, speed: 1.0 }
};

export function lerpPreset(a: FlowPreset, b: FlowPreset, t: number): FlowPreset {
  const lerp = (x: number, y: number) => x + (y - x) * t;
  const lerp3 = (x: [number, number, number], y: [number, number, number]): [number, number, number] =>
    [lerp(x[0], y[0]), lerp(x[1], y[1]), lerp(x[2], y[2])];
  return {
    color1: lerp3(a.color1, b.color1),
    color2: lerp3(a.color2, b.color2),
    flowStrength: lerp(a.flowStrength, b.flowStrength),
    density: lerp(a.density, b.density),
    speed: lerp(a.speed, b.speed)
  };
}

export interface ParticleFlow {
  setPreset: (name: keyof typeof PRESETS, durationMs?: number) => void;
  destroy: () => void;
}

export function createParticleFlow(container: HTMLElement): ParticleFlow | null {
  if (prefersReducedMotion()) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const renderer = new Renderer({ dpr, alpha: false });
  const gl = renderer.gl;
  gl.clearColor(0.963, 0.956, 0.926, 1);
  container.appendChild(gl.canvas);
  Object.assign(gl.canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '0', pointerEvents: 'none'
  });

  const geometry = new Triangle(gl);
  const current = { ...PRESETS.hero };

  const program = new Program(gl, {
    vertex, fragment,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: [gl.canvas.width, gl.canvas.height] },
      uMouse: { value: [0.5, 0.5] },
      uColor1: { value: [...current.color1] },
      uColor2: { value: [...current.color2] },
      uFlowStrength: { value: current.flowStrength },
      uDensity: { value: current.density },
      uSpeed: { value: current.speed }
    }
  });
  const mesh = new Mesh(gl, { geometry, program });

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
  };
  onResize();
  window.addEventListener('resize', onResize, { passive: true });

  const onMouse = (e: MouseEvent) => {
    program.uniforms.uMouse.value = [e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight];
  };
  window.addEventListener('mousemove', onMouse, { passive: true });

  let rafId = 0;
  let lastFrame = performance.now();
  let slowFrames = 0;
  let transitionStart = 0;
  let transitioning = false;
  let transitionDuration = 0;
  let from: FlowPreset = { ...current };
  let to: FlowPreset = { ...current };

  const tick = (t: number) => {
    const dt = t - lastFrame;
    if (dt > 33) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
    lastFrame = t;
    if (slowFrames > 180) { destroy(); return; } // ~3s of sub-30fps

    program.uniforms.uTime.value = t * 0.001;

    if (transitioning) {
      const k = Math.min(1, (t - transitionStart) / transitionDuration);
      const eased = 1 - Math.pow(2, -10 * k);
      const lerped = lerpPreset(from, to, eased);
      program.uniforms.uColor1.value = [...lerped.color1];
      program.uniforms.uColor2.value = [...lerped.color2];
      program.uniforms.uFlowStrength.value = lerped.flowStrength;
      program.uniforms.uDensity.value = lerped.density;
      program.uniforms.uSpeed.value = lerped.speed;
      if (k >= 1) transitioning = false;
    }

    renderer.render({ scene: mesh });
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  function setPreset(name: keyof typeof PRESETS, durationMs = 900) {
    const preset = PRESETS[name];
    if (!preset) return;
    from = {
      color1: [...program.uniforms.uColor1.value] as [number, number, number],
      color2: [...program.uniforms.uColor2.value] as [number, number, number],
      flowStrength: program.uniforms.uFlowStrength.value,
      density: program.uniforms.uDensity.value,
      speed: program.uniforms.uSpeed.value
    };
    to = preset;
    transitionStart = performance.now();
    transitionDuration = durationMs;
    transitioning = true;
  }

  function destroy() {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMouse);
    gl.canvas.remove();
  }

  return { setPreset, destroy };
}
