export const AURA_GALAXY_VERTEX_SHADER = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const AURA_GALAXY_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uQuality;
  uniform float uPointerStrength;
  uniform vec2 uResolution;
  uniform vec2 uPointer;

  varying vec2 vUv;

  const float TAU = 6.28318530718;

  float hash21(vec2 value) {
    value = fract(value * vec2(123.34, 456.21));
    value += dot(value, value + 45.32);
    return fract(value.x * value.y);
  }

  float valueNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);

    float a = hash21(cell);
    float b = hash21(cell + vec2(1.0, 0.0));
    float c = hash21(cell + vec2(0.0, 1.0));
    float d = hash21(cell + vec2(1.0, 1.0));

    return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.54;
    mat2 rotation = mat2(0.80, 0.60, -0.60, 0.80);

    for (int octave = 0; octave < 5; octave++) {
      value += amplitude * valueNoise(point);
      point = rotation * point * 2.03 + vec2(13.1, 7.7);
      amplitude *= 0.49;
    }

    return value;
  }

  float starLayer(vec2 point, float scale, float threshold, float radius, float speed) {
    vec2 grid = point * scale;
    vec2 cell = floor(grid);
    vec2 local = fract(grid) - 0.5;

    float seed = hash21(cell);
    vec2 jitter = vec2(hash21(cell + 17.3), hash21(cell + 61.7)) - 0.5;
    local -= jitter * 0.66;

    float distanceToStar = length(local);
    float star = 1.0 - smoothstep(0.0, radius, distanceToStar);
    float presence = step(threshold, seed);
    float twinkle = 0.68 + 0.32 * sin(uTime * (speed + seed * 1.15) + seed * TAU);

    float horizontalRay = (1.0 - smoothstep(0.0, radius * 3.5, abs(local.x))) * (1.0 - smoothstep(0.0, radius * 0.42, abs(local.y)));
    float verticalRay = (1.0 - smoothstep(0.0, radius * 3.5, abs(local.y))) * (1.0 - smoothstep(0.0, radius * 0.42, abs(local.x)));
    float rays = (horizontalRay + verticalRay) * 0.11;

    return presence * (star + rays) * twinkle;
  }

  void main() {
    float safeHeight = max(uResolution.y, 1.0);
    float aspect = uResolution.x / safeHeight;

    vec2 point = (vUv - 0.5) * vec2(aspect, 1.0);
    vec2 pointer = (uPointer - 0.5) * vec2(aspect, 1.0);
    vec2 pointerDelta = point - pointer;
    float pointerDistance = max(length(pointerDelta), 0.001);
    float lens = exp(-dot(pointerDelta, pointerDelta) * 8.5) * uPointerStrength;
    vec2 tangent = vec2(-pointerDelta.y, pointerDelta.x) / pointerDistance;

    point += tangent * lens * 0.018;
    point += pointerDelta * lens * 0.021;

    float slowTime = uTime * 0.018;
    vec2 driftA = vec2(slowTime, -slowTime * 0.68);
    vec2 driftB = vec2(-slowTime * 0.72, slowTime * 0.46);

    float broadNoise = fbm(point * 0.84 + driftA);
    float foldedNoise = fbm((point + vec2(broadNoise, -broadNoise) * 0.30) * 1.48 + driftB);
    float detailNoise = valueNoise(point * mix(3.8, 5.2, uQuality) + vec2(-slowTime * 2.0, slowTime));

    float diagonalBand = point.y + point.x * 0.24 + (broadNoise - 0.5) * 0.34;
    float band = exp(-diagonalBand * diagonalBand * 2.45);
    float cloudDensity = broadNoise * 0.58 + foldedNoise * 0.52 + detailNoise * 0.09;
    float clouds = smoothstep(0.40, 0.88, cloudDensity + band * 0.16);

    float centerCalm = 1.0 - 0.23 * exp(-dot(point * vec2(0.78, 1.12), point * vec2(0.78, 1.12)) * 1.7);
    clouds *= centerCalm;

    vec3 deepSpace = vec3(0.035, 0.018, 0.085);
    vec3 deepBlue = vec3(0.045, 0.145, 0.31);
    vec3 violet = vec3(0.34, 0.11, 0.53);
    vec3 dustyRose = vec3(0.61, 0.18, 0.47);
    vec3 paleGlow = vec3(0.78, 0.46, 0.76);

    float chromaNoise = fbm(point * 0.58 + vec2(slowTime * 0.34, -slowTime * 0.22));
    vec3 cloudColor = mix(violet, dustyRose, smoothstep(0.30, 0.78, chromaNoise));
    cloudColor = mix(cloudColor, deepBlue, smoothstep(0.56, 0.92, foldedNoise) * 0.72);

    vec3 color = deepSpace;
    color += deepBlue * smoothstep(0.18, 0.92, broadNoise) * 0.25;
    color += cloudColor * clouds * (0.62 + band * 0.28);
    color += paleGlow * pow(max(clouds * band, 0.0), 2.2) * 0.22;

    vec2 pointerParallax = (uPointer - 0.5) * uPointerStrength;
    float farStars = starLayer(point + pointerParallax * 0.010, 42.0, 0.982, 0.055, 0.48);
    float middleStars = starLayer(point + pointerParallax * 0.019 + 7.31, 67.0, 0.989, 0.070, 0.72);
    float nearStars = starLayer(point + pointerParallax * 0.032 - 11.7, 93.0, mix(0.994, 0.992, uQuality), 0.085, 0.98);
    float brightStars = starLayer(point + pointerParallax * 0.043 + 23.4, 31.0, 0.9975, 0.105, 0.82);

    color += vec3(0.76, 0.84, 1.0) * farStars * 0.48;
    color += vec3(1.0, 0.86, 0.97) * middleStars * 0.72;
    color += vec3(0.82, 0.91, 1.0) * nearStars * mix(0.62, 0.90, uQuality);
    color += vec3(1.0, 0.78, 0.95) * brightStars * 1.28;

    float cursorHalo = exp(-dot(pointerDelta, pointerDelta) * 12.0) * uPointerStrength;
    color += mix(vec3(0.10, 0.16, 0.35), vec3(0.33, 0.12, 0.34), broadNoise) * cursorHalo * 0.10;

    float vignette = 1.0 - smoothstep(0.24, 1.06, length((vUv - 0.5) * vec2(0.84, 1.0)));
    color *= mix(0.72, 1.0, vignette);
    color = pow(color, vec3(0.92));

    gl_FragColor = vec4(color, 1.0);
  }
`;
