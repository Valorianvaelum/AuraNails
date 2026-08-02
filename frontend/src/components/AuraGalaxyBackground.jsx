import { useEffect, useRef, useState } from "react";

import { AURA_GALAXY_FRAGMENT_SHADER, AURA_GALAXY_VERTEX_SHADER } from "../shaders/auraGalaxyShader.js";

const POINTER_EASING = 0.055;
const STRENGTH_EASING = 0.065;

function getQualityProfile({ reducedMotion }) {
  const smallScreen = window.matchMedia("(max-width: 767px)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const hardwareConcurrency = window.navigator.hardwareConcurrency || 8;
  const deviceMemory = window.navigator.deviceMemory || 8;
  const saveData = window.navigator.connection?.saveData === true;
  const limitedDevice = hardwareConcurrency <= 4 || deviceMemory <= 4;
  const reducedQuality = smallScreen || coarsePointer || limitedDevice || saveData;

  return {
    dpr: reducedMotion ? 1 : Math.min(window.devicePixelRatio || 1, reducedQuality ? 1 : 1.5),
    fps: reducedMotion ? 0 : saveData ? 24 : reducedQuality ? 30 : 60,
    interactive: !reducedMotion && !saveData && !coarsePointer && window.matchMedia("(pointer: fine)").matches,
    lowPower: reducedQuality,
    quality: saveData ? 0.52 : reducedQuality ? 0.64 : 1,
  };
}

function AuraGalaxyBackground() {
  const rootRef = useRef(null);
  const canvasHostRef = useRef(null);
  const [rendererVersion, setRendererVersion] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const canvasHost = canvasHostRef.current;
    if (!root || !canvasHost) return undefined;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerTarget = { x: 0.5, y: 0.5 };
    const pointerCurrent = { x: 0.5, y: 0.5 };
    let pointerStrengthTarget = 0;
    let pointerStrengthCurrent = 0;
    let disposed = false;
    let animationFrame = 0;
    let resizeFrame = 0;
    let lastFrameTime = 0;
    let renderer;
    let gl;
    let program;
    let mesh;
    let canvas;
    let handleContextLost;
    let handleContextRestored;
    let profile = getQualityProfile({ reducedMotion: reducedMotionQuery.matches });

    const stopAnimation = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    };

    const hideWebGL = () => {
      root.classList.remove("is-webgl-ready");
      root.dataset.galaxyRenderer = "css";
    };

    const resize = () => {
      if (!renderer || !program) return;

      profile = getQualityProfile({ reducedMotion: reducedMotionQuery.matches });
      renderer.dpr = profile.dpr;
      renderer.setSize(window.innerWidth, window.innerHeight);
      program.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      program.uniforms.uQuality.value = profile.quality;

      if (profile.fps === 0) {
        program.uniforms.uPointerStrength.value = 0;
        renderer.render({ scene: mesh });
      }
    };

    const scheduleResize = () => {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
      });
    };

    const renderFrame = (now) => {
      if (disposed || !renderer || !program || !mesh || document.hidden) {
        animationFrame = 0;
        return;
      }

      const frameInterval = profile.fps > 0 ? 1000 / profile.fps : Infinity;
      if (now - lastFrameTime >= frameInterval) {
        const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.05);
        lastFrameTime = now;

        pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * POINTER_EASING;
        pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * POINTER_EASING;
        pointerStrengthCurrent += (pointerStrengthTarget - pointerStrengthCurrent) * STRENGTH_EASING;

        program.uniforms.uTime.value += deltaSeconds;
        program.uniforms.uPointer.value.set(pointerCurrent.x, pointerCurrent.y);
        program.uniforms.uPointerStrength.value = pointerStrengthCurrent;
        renderer.render({ scene: mesh });
      }

      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    const startAnimation = () => {
      if (animationFrame || profile.fps === 0 || document.hidden) return;
      lastFrameTime = window.performance.now();
      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    const handlePointerMove = (event) => {
      if (!profile.interactive) return;
      pointerTarget.x = event.clientX / Math.max(window.innerWidth, 1);
      pointerTarget.y = 1 - event.clientY / Math.max(window.innerHeight, 1);
      pointerStrengthTarget = 1;
    };

    const resetPointer = () => {
      pointerTarget.x = 0.5;
      pointerTarget.y = 0.5;
      pointerStrengthTarget = 0;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) stopAnimation();
      else startAnimation();
    };

    const restartRenderer = () => setRendererVersion((version) => version + 1);

    const initialize = async () => {
      try {
        const { Mesh, Program, Renderer, Triangle, Vec2 } = await import("ogl");
        if (disposed) return;

        renderer = new Renderer({
          alpha: true,
          antialias: false,
          depth: false,
          dpr: profile.dpr,
          powerPreference: profile.lowPower ? "low-power" : "high-performance",
          premultipliedAlpha: false,
          stencil: false,
        });
        gl = renderer.gl;
        canvas = gl.canvas;
        canvas.className = "aura-galaxy__canvas";
        canvas.setAttribute("aria-hidden", "true");
        gl.clearColor(0, 0, 0, 0);

        const geometry = new Triangle(gl);
        program = new Program(gl, {
          cullFace: null,
          depthTest: false,
          depthWrite: false,
          fragment: AURA_GALAXY_FRAGMENT_SHADER,
          transparent: false,
          uniforms: {
            uPointer: { value: new Vec2(0.5, 0.5) },
            uPointerStrength: { value: 0 },
            uQuality: { value: profile.quality },
            uResolution: { value: new Vec2(window.innerWidth, window.innerHeight) },
            uTime: { value: 0 },
          },
          vertex: AURA_GALAXY_VERTEX_SHADER,
        });
        if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)) {
          throw new Error("No se pudo compilar el shader de Aura Galaxy.");
        }

        mesh = new Mesh(gl, { geometry, program });

        handleContextLost = (event) => {
          event.preventDefault();
          stopAnimation();
          hideWebGL();
        };
        handleContextRestored = restartRenderer;
        canvas.addEventListener("webglcontextlost", handleContextLost);
        canvas.addEventListener("webglcontextrestored", handleContextRestored, { once: true });
        canvasHost.replaceChildren(canvas);

        resize();
        renderer.render({ scene: mesh });

        window.requestAnimationFrame(() => {
          if (disposed) return;
          root.classList.add("is-webgl-ready");
          root.dataset.galaxyRenderer = "webgl";
        });

        startAnimation();
      } catch (error) {
        hideWebGL();
        if (import.meta.env.DEV) root.dataset.galaxyError = error instanceof Error ? error.name : "unknown";
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", resetPointer);
    window.addEventListener("resize", scheduleResize, { passive: true });
    document.addEventListener("mouseleave", resetPointer);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    reducedMotionQuery.addEventListener("change", restartRenderer);

    initialize();

    return () => {
      disposed = true;
      stopAnimation();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetPointer);
      window.removeEventListener("resize", scheduleResize);
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      document.removeEventListener("mouseleave", resetPointer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotionQuery.removeEventListener("change", restartRenderer);
      root.classList.remove("is-webgl-ready");
      delete root.dataset.galaxyRenderer;
      delete root.dataset.galaxyError;
      if (canvas) {
        if (handleContextLost) canvas.removeEventListener("webglcontextlost", handleContextLost);
        if (handleContextRestored) canvas.removeEventListener("webglcontextrestored", handleContextRestored);
        if (canvas.parentNode === canvasHost) canvasHost.removeChild(canvas);
      }
      renderer = null;
      gl = null;
      program = null;
      mesh = null;
    };
  }, [rendererVersion]);

  return (
    <div className="aura-galaxy" ref={rootRef} aria-hidden="true">
      <div className="aura-galaxy__fallback">
        <div className="aura-galaxy__stars" />
        <div className="aura-galaxy__nebula aura-galaxy__nebula--violet" />
        <div className="aura-galaxy__nebula aura-galaxy__nebula--rose" />
        <div className="aura-galaxy__nebula aura-galaxy__nebula--blue" />
        <div className="aura-galaxy__glow" />
      </div>
      <div className="aura-galaxy__webgl" ref={canvasHostRef} />
      <div className="aura-galaxy__veil" />
    </div>
  );
}

export default AuraGalaxyBackground;
