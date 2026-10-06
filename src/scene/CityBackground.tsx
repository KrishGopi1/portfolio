// Fixed full-screen WebGL night city behind the comic panels.
// Falls back to a CSS/SVG skyline when WebGL is unavailable or crashes.
import { Component, useEffect, useState, type ReactNode } from "react";
import { Canvas, advance } from "@react-three/fiber";
import { scrollState } from "../store/scroll";
import { detectQuality } from "./config";
import CityScene from "./CityScene";
import FallbackCity from "./FallbackCity";

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const ctx = c.getContext("webgl2") || c.getContext("webgl");
    const ok = !!ctx;
    (ctx as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("[CityBackground] WebGL scene failed, using fallback.", err);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function CityBackground() {
  const [supported] = useState(() => typeof window !== "undefined" && hasWebGL());
  const [failed, setFailed] = useState(false);
  const [quality] = useState(detectQuality);
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);

  // Dev-only debug hook: drive the scene/scroll state without a visible tab.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // ?cityP=0.5&citySec=3&cityV=0&cityOnly=1 pins the scroll state for screenshots.
    const qs = new URLSearchParams(location.search);
    if (qs.has("cityP")) {
      const p = Number(qs.get("cityP"));
      (window as unknown as Record<string, unknown>).__cityDebug = {
        progress: p,
        sectionIndex: qs.has("citySec") ? Number(qs.get("citySec")) : Math.round(p * 6),
        velocity: Number(qs.get("cityV") || 0),
      };
      if (qs.get("cityOnly")) {
        const s = document.createElement("style");
        s.textContent = "#root > :not(div[aria-hidden]) { visibility: hidden !important; }";
        document.head.appendChild(s);
      }
    }
    let t = performance.now();
    (window as unknown as Record<string, unknown>).__city = {
      state: scrollState,
      step(frames = 60, patch?: Partial<typeof scrollState>) {
        if (patch) Object.assign(scrollState, patch);
        for (let i = 0; i < frames; i++) advance((t += 1000 / 60), true);
      },
    };
  }, []);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (!supported || failed) return <FallbackCity />;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: "var(--z-scene)" as unknown as number,
        pointerEvents: "none",
        background: "linear-gradient(180deg, #0a0520 0%, #2a1250 60%, #4a1866 100%)",
      }}
    >
      <SceneBoundary onError={() => setFailed(true)}>
        <Canvas
          frameloop={hidden ? "never" : "always"}
          dpr={[1, quality.maxDpr]}
          flat
          linear
          gl={{ antialias: false, alpha: false, stencil: false, powerPreference: "high-performance" }}
          camera={{ fov: 50, near: 1, far: 6000, position: [0, 176, 290] }}
          fallback={<FallbackCity />}
          style={{ pointerEvents: "none" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x0b0b1a, 1);
          }}
        >
          <CityScene q={quality} />
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
