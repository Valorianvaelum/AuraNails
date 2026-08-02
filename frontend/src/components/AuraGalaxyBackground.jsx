import { useEffect, useRef } from "react";

const MAX_OFFSET = 18;
const LAYERS = {
  "--aura-stars-x": -0.18,
  "--aura-stars-y": -0.18,
  "--aura-violet-x": 0.72,
  "--aura-violet-y": 0.72,
  "--aura-rose-x": -0.48,
  "--aura-rose-y": -0.48,
  "--aura-blue-x": 0.3,
  "--aura-blue-y": -0.3,
  "--aura-glow-x": 0.95,
  "--aura-glow-y": 0.95,
};

function AuraGalaxyBackground() {
  const frameRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");

    const setLayerOffsets = (x, y) => {
      Object.entries(LAYERS).forEach(([property, factor]) => {
        const value = property.endsWith("-x") ? x * factor : y * factor;
        root.style.setProperty(property, `${value.toFixed(2)}px`);
      });
    };

    const render = () => {
      const current = currentRef.current;
      const target = targetRef.current;

      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      setLayerOffsets(current.x, current.y);

      if (Math.abs(target.x - current.x) > 0.05 || Math.abs(target.y - current.y) > 0.05) {
        frameRef.current = window.requestAnimationFrame(render);
      } else {
        frameRef.current = null;
      }
    };

    const requestRender = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(render);
      }
    };

    const handlePointerMove = (event) => {
      if (reducedMotion.matches || !finePointer.matches) return;

      const normalizedX = event.clientX / window.innerWidth - 0.5;
      const normalizedY = event.clientY / window.innerHeight - 0.5;

      targetRef.current = {
        x: normalizedX * MAX_OFFSET * 2,
        y: normalizedY * MAX_OFFSET * 2,
      };
      requestRender();
    };

    const resetPointer = () => {
      targetRef.current = { x: 0, y: 0 };
      requestRender();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", resetPointer);
    reducedMotion.addEventListener("change", resetPointer);
    finePointer.addEventListener("change", resetPointer);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", resetPointer);
      reducedMotion.removeEventListener("change", resetPointer);
      finePointer.removeEventListener("change", resetPointer);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      Object.keys(LAYERS).forEach((property) => root.style.removeProperty(property));
    };
  }, []);

  return (
    <div className="aura-galaxy" aria-hidden="true">
      <div className="aura-galaxy__stars" />
      <div className="aura-galaxy__nebula aura-galaxy__nebula--violet" />
      <div className="aura-galaxy__nebula aura-galaxy__nebula--rose" />
      <div className="aura-galaxy__nebula aura-galaxy__nebula--blue" />
      <div className="aura-galaxy__glow" />
      <div className="aura-galaxy__veil" />
    </div>
  );
}

export default AuraGalaxyBackground;
