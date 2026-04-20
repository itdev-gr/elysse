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
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
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
  p += uTime * uSpeed * 0.04;
  vec2 flow = curl(p) * uFlowStrength;

  vec2 mouseDist = uv - uMouse;
  float mouseInf = exp(-dot(mouseDist, mouseDist) * 18.0) * 0.25;
  flow += mouseInf * vec2(-mouseDist.y, mouseDist.x);

  // Very subtle green tint over cream — type must stay dominant
  vec3 base = uColor1;
  float particle = fbm(p * 1.2 + flow * 2.5);
  particle = smoothstep(0.35, 0.70, particle);
  float grain = (noise(p * 18.0) - 0.5) * 0.015;

  // Cap the tint influence at 0.10 so the canvas reads as cream
  float tintAmount = particle * 0.10 + grain;
  vec3 col = mix(base, uColor2, tintAmount);

  // Soft radial settle — slightly lighter center, darker edges, very gentle
  vec2 v = uv - 0.5;
  float vig = 1.0 - dot(v, v) * 0.18;
  col *= vig;

  gl_FragColor = vec4(col, 1.0);
}
