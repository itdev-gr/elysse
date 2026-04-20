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

export const PRESETS: Record<string, FlowPreset> = {
  hero:      { color1: [0.04, 0.08, 0.06], color2: [0.50, 0.70, 0.55], flowStrength: 0.25, density: 3.0, speed: 1.0 },
  agri:      { color1: [0.05, 0.12, 0.07], color2: [0.68, 0.89, 0.74], flowStrength: 0.30, density: 4.0, speed: 0.8 },
  landscape: { color1: [0.04, 0.10, 0.08], color2: [0.43, 0.72, 0.76], flowStrength: 0.18, density: 2.5, speed: 0.6 },
  building:  { color1: [0.04, 0.06, 0.04], color2: [0.35, 0.45, 0.40], flowStrength: 0.10, density: 5.0, speed: 1.3 },
  industry:  { color1: [0.05, 0.10, 0.07], color2: [0.49, 0.69, 0.55], flowStrength: 0.08, density: 6.5, speed: 1.6 },
  counters:  { color1: [0.04, 0.09, 0.06], color2: [0.68, 0.89, 0.74], flowStrength: 0.22, density: 3.5, speed: 0.9 },
  map:       { color1: [0.03, 0.07, 0.06], color2: [0.43, 0.72, 0.76], flowStrength: 0.15, density: 2.0, speed: 0.5 },
  epsilon:   { color1: [0.04, 0.08, 0.06], color2: [0.68, 0.89, 0.74], flowStrength: 0.12, density: 4.5, speed: 1.1 }
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
  gl.clearColor(0.04, 0.08, 0.06, 1);
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
