import { useState } from "react";
import bgVideo from "./assets/bg.mp4";
import languageIcon from "./assets/language.svg";

const TEXT_RADIUS = 55;
const PATH_START = 45;
const WORDS = ["Studio", "Design", "Build", "Think"] as const;
const WORD_ANGLES = [0, 90, 180, 270];
const SEGMENTS = [
  { word: "Studio", start: 315, end: 45 },
  { word: "Design", start: 45, end: 135 },
  { word: "Build", start: 135, end: 225 },
  { word: "Think", start: 225, end: 315 },
] as const;

// Locked values for the language panel glass
const LANG_PANEL = {
  scale: 67,
  freqX: 0.006,
  freqY: 0.039,
  octaves: 1,
  seed: 92,
  blur: 0.9,
  tint: 0,
  shine: 0,
  shineSpread: 77,
  shineSize: 59,
  noiseType: "turbulence" as const,
  xChannel: "G" as const,
  yChannel: "A" as const,
};

// Fixed circle geometry
const CIRCLE_RADIUS = 95;

// Circle glass defaults
const PANEL_DEFAULTS = {
  scale: 67,
  freqX: 0.006,
  freqY: 0.039,
  octaves: 1,
  seed: 92,
  blur: 0.9,
  tint: 0,
  shine: 0,
  shineSpread: 77,
  shineSize: 59,
  noiseType: "turbulence" as const,
  xChannel: "G" as const,
  yChannel: "A" as const,
};

type NoiseType = "fractalNoise" | "turbulence";
type Channel = "R" | "G" | "B" | "A";
interface PanelControls {
  scale: number; freqX: number; freqY: number; octaves: number; seed: number;
  blur: number; tint: number; shine: number; shineSpread: number; shineSize: number;
  noiseType: NoiseType; xChannel: Channel; yChannel: Channel;
}



const SHINE_DEFAULTS = {
  highlightOpacity: 0.59,
  highlightHeight: 1,
  glowOffset: 14,
  glowBlur: 27,
  glowOpacity: 0.14,
};


type ShineControls = typeof SHINE_DEFAULTS;

const LANG_SHINE_DEFAULTS = {
  highlightOpacity: 0,
  highlightHeight: 1,
  glowOffset: 29,
  glowBlur: 65,
  glowOpacity: 0.12,
};

const PANEL_HEIGHT = 260;
const CIRCLE_LIFT = PANEL_HEIGHT / 2;
const EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
const DURATION = "0.5s";

const toRad = (deg: number) => (deg * Math.PI) / 180;
const polar = (deg: number, r: number) => ({
  x: r * Math.sin(toRad(deg)),
  y: -r * Math.cos(toRad(deg)),
});

const ps = polar(PATH_START, TEXT_RADIUS);
const pa = polar(PATH_START + 180, TEXT_RADIUS);
const circlePath = `M ${ps.x},${ps.y} A ${TEXT_RADIUS},${TEXT_RADIUS} 0 1 1 ${pa.x},${pa.y} A ${TEXT_RADIUS},${TEXT_RADIUS} 0 1 1 ${ps.x},${ps.y}`;
const OFFSETS = WORD_ANGLES.map(
  (angle) => ((((angle - PATH_START) + 360) % 360) / 360) * 100
);

const clipPie = (startDeg: number, endDeg: number, r: number) => {
  const o = 100;
  const s = polar(startDeg, r);
  const e = polar(endDeg, r);
  return `path('M ${o},${o} L ${s.x + o},${s.y + o} A ${r},${r} 0 0 1 ${e.x + o},${e.y + o} Z')`;
};

function AppLandingPlayground() {
  const [langOpen, setLangOpen] = useState(false);
  const p: PanelControls = PANEL_DEFAULTS;
  const s: ShineControls = SHINE_DEFAULTS;
  const ls: ShineControls = LANG_SHINE_DEFAULTS;



  const maskR = CIRCLE_RADIUS - 1;

  return (
    <>
      <video
        autoPlay
        loop
        muted
        playsInline
        src={bgVideo}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />

      {/* Circle */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          width: "200px",
          height: "200px",
          transform: langOpen
            ? `translate(-50%, calc(-50% - ${CIRCLE_LIFT}px))`
            : "translate(-50%, -50%)",
          transition: `transform ${DURATION} ${EASING}`,
          overflow: "visible",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        {SEGMENTS.map((seg, i) => {
          const wedgeClip = clipPie(seg.start, seg.end, CIRCLE_RADIUS);
          return (
            <div
              key={seg.word}
              style={{
                position: "absolute",
                inset: 0,
                clipPath: wedgeClip,
                WebkitClipPath: wedgeClip,
                maskImage: `radial-gradient(circle at 50% 50%, #000 ${maskR}px, transparent ${CIRCLE_RADIUS}px)`,
                WebkitMaskImage: `radial-gradient(circle at 50% 50%, #000 ${maskR}px, transparent ${CIRCLE_RADIUS}px)`,
                zIndex: 2,
                overflow: "hidden",
                backdropFilter: `blur(${p.blur}px)`,
                WebkitBackdropFilter: `blur(${p.blur}px)`,
                filter: `url(#glass-distortion-${i})`,
                isolation: "isolate",
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${p.tint})` }} />
              <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 ${p.shineSpread}px ${p.shineSize}px rgba(255,255,255,${p.shine * 0.2})` }} />
            </div>
          );
        })}
        {/* Unfiltered shine — crisp, above glass distortion */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            borderRadius: "50%",
            maskImage: `radial-gradient(circle at 50% 50%, #000 ${maskR}px, transparent ${CIRCLE_RADIUS}px)`,
            WebkitMaskImage: `radial-gradient(circle at 50% 50%, #000 ${maskR}px, transparent ${CIRCLE_RADIUS}px)`,
            boxShadow: `inset 0 ${s.highlightHeight}px 0 rgba(255,255,255,${s.highlightOpacity}), inset 0 ${s.glowOffset}px ${s.glowBlur}px rgba(255,255,255,${s.glowOpacity})`,
            pointerEvents: "none",
          }}
        />

        <svg
          width="200"
          height="200"
          viewBox="-100 -100 200 200"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 4,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <defs>
            <path id="main-circle-text-path" d={circlePath} />
          </defs>
          {WORDS.map((word, i) => (
            <text
              key={word}
              fontSize="11"
              letterSpacing="3"
              textAnchor="middle"
              fill="white"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontWeight="500"
              style={{ userSelect: "none", mixBlendMode: "difference" }}
            >
              <textPath href="#main-circle-text-path" startOffset={`${OFFSETS[i]}%`}>
                {word.toUpperCase()}
              </textPath>
            </text>
          ))}
        </svg>
      </div>

      {/* Language icon */}
      <img
        src={languageIcon}
        alt="Language"
        onClick={() => setLangOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: langOpen ? `calc(${PANEL_HEIGHT}px + 4vh)` : "4vh",
          right: "3vw",
          width: "2.4rem",
          height: "2.4rem",
          zIndex: 25,
          transition: `bottom ${DURATION} ${EASING}, opacity 0.4s ease`,
          pointerEvents: "auto",
          filter: "invert(1)",
          cursor: "pointer",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      />

      {/* Language panel — glass layer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: PANEL_HEIGHT,
          transform: langOpen ? "translateY(0)" : "translateY(100%)",
          transition: `transform ${DURATION} ${EASING}`,
          zIndex: 20,
          backdropFilter: `blur(${LANG_PANEL.blur}px)`,
          WebkitBackdropFilter: `blur(${LANG_PANEL.blur}px)`,
          filter: "url(#glass-distortion-panel)",
          isolation: "isolate",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${LANG_PANEL.tint})` }} />
        <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 ${LANG_PANEL.shineSpread}px ${LANG_PANEL.shineSize}px rgba(255,255,255,${LANG_PANEL.shine * 0.2})` }} />
      </div>

      {/* Language options — above glass, unfiltered */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: PANEL_HEIGHT,
          transform: langOpen ? "translateY(0)" : "translateY(100%)",
          transition: `transform ${DURATION} ${EASING}`,
          zIndex: 21,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: langOpen ? "auto" : "none",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          boxShadow: `inset 0 ${ls.highlightHeight}px 0 rgba(255,255,255,${ls.highlightOpacity}), inset 0 ${ls.glowOffset}px ${ls.glowBlur}px rgba(255,255,255,${ls.glowOpacity})`,
        }}
      >
        {["EN", "FR", "AR", "ES", "DE", "JA"].map((lang) => (
          <button
            key={lang}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.85rem",
              letterSpacing: "0.15em",
              cursor: "pointer",
              padding: "0.5rem 0.75rem",
              transition: "color 0.2s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#fff")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
          >
            {lang}
          </button>
        ))}
      </div>


      <svg width="0" height="0" style={{ position: "absolute" }}>
        {SEGMENTS.map((seg, i) => (
          <filter key={seg.word} id={`glass-distortion-${i}`}>
            <feTurbulence
              type={p.noiseType}
              baseFrequency={`${p.freqX} ${p.freqY}`}
              numOctaves={p.octaves}
              seed={`${p.seed + i * 11}`}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={p.scale}
              xChannelSelector={p.xChannel}
              yChannelSelector={p.yChannel}
            />
          </filter>
        ))}
        <filter id="glass-distortion-panel" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type={LANG_PANEL.noiseType}
            baseFrequency={`${LANG_PANEL.freqX} ${LANG_PANEL.freqY}`}
            numOctaves={LANG_PANEL.octaves}
            seed={`${LANG_PANEL.seed}`}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={LANG_PANEL.scale}
            xChannelSelector={LANG_PANEL.xChannel}
            yChannelSelector={LANG_PANEL.yChannel}
          />
        </filter>
      </svg>
    </>
  );
}

export default AppLandingPlayground;
