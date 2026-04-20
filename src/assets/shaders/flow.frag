precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uFlowStrength;
uniform float uDensity;
uniform float uSpeed;

// Simplex-like noise (cheap approximation)
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec2 curl(vec2 p) {
  float e = 0.01;
  float n1 = noise(p + vec2(0.0, e));
  float n2 = noise(p - vec2(0.0, e));
  float n3 = noise(p + vec2(e, 0.0));
  float n4 = noise(p - vec2(e, 0.0));
  return vec2(n1 - n2, n4 - n3);
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = uv * aspect * uDensity;
  p += uTime * uSpeed * 0.05;
  vec2 flow = curl(p) * uFlowStrength;

  // Mouse curl
  vec2 mouseDist = uv - uMouse;
  float mouseInf = exp(-dot(mouseDist, mouseDist) * 20.0) * 0.3;
  flow += mouseInf * vec2(-mouseDist.y, mouseDist.x);

  float particle = noise(p + flow * 5.0);
  particle = smoothstep(0.45, 0.55, particle);

  vec3 col = mix(uColor1, uColor2, particle);
  col *= 0.12 + particle * 0.4; // Subtle overall
  gl_FragColor = vec4(col, 1.0);
}
