import { useRef, useState } from "react";
import bgVideo from "./assets/bg.mp4";

const WORDS = ["Studio", "Design", "Build", "Think"];
const RADIUS = 55;
const LINE = RADIUS * 1.4;
const D = RADIUS * 2;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const polar = (deg: number, r: number) => ({
  x: r * Math.sin(toRad(deg)),
  y: -r * Math.cos(toRad(deg)),
});

const pie = (startDeg: number, endDeg: number, r: number) => {
  const s = polar(startDeg, r);
  const e = polar(endDeg, r);
  return `M 0,0 L ${s.x},${s.y} A ${r},${r} 0 0 1 ${e.x},${e.y} Z`;
};

// 4 hover segments matching X arm positions (45° rotation)
const SEGMENTS = [
  { start: 315, end: 45,  word: "Studio" },  // North
  { start: 45,  end: 135, word: "Design" },  // East
  { start: 135, end: 225, word: "Build"  },  // South
  { start: 225, end: 315, word: "Think"  },  // West
];

// textPath
const PATH_START = 45;
const ps = polar(PATH_START, RADIUS);
const pa = polar(PATH_START + 180, RADIUS);
const circlePath = `M ${ps.x},${ps.y} A ${RADIUS},${RADIUS} 0 1 1 ${pa.x},${pa.y} A ${RADIUS},${RADIUS} 0 1 1 ${ps.x},${ps.y}`;
const WORD_ANGLES = [0, 90, 180, 270];
const OFFSETS = WORD_ANGLES.map(
  (angle) => (((angle - PATH_START) + 360) % 360) / 360 * 100
);

const X_ARMS = [
  [polar(45, LINE), polar(225, LINE)],
  [polar(135, LINE), polar(315, LINE)],
];

function App() {
  const spinRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [displayWord, setDisplayWord] = useState("");

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
        src={bgVideo}
      />

      {/* Large background word on hover */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          pointerEvents: "none",
          opacity: hovered !== null ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        <span
          style={{
            fontSize: "clamp(4rem, 18vw, 30vh)",
            fontWeight: "700",
            color: "rgba(255,255,255,0.1)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            userSelect: "none",
          }}
        >
          {displayWord}
        </span>
      </div>

      {/* SVG filter */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="glass-distort" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="8" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Visual content (will spin later) */}
      <div
        ref={spinRef}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {/* Liquid glass disc */}
        <div
          style={{
            position: "absolute",
            left: `calc(50% - ${LINE}px)`,
            top: `calc(50% - ${LINE}px)`,
            width: LINE * 2,
            height: LINE * 2,
            borderRadius: "50%",
            backdropFilter: "blur(3px) contrast(1.5) brightness(1.18) saturate(2)",
            WebkitBackdropFilter: "blur(3px) contrast(1.5) brightness(1.18) saturate(2)",
            filter: "url(#glass-distort)",
            background: "rgba(255,255,255,0.03)",
            zIndex: 2,
          }}
        />

        {/* X arms */}
        <svg
          width={LINE * 2}
          height={LINE * 2}
          viewBox={`${-LINE} ${-LINE} ${LINE * 2} ${LINE * 2}`}
          style={{
            position: "absolute",
            left: `calc(50% - ${LINE}px)`,
            top: `calc(50% - ${LINE}px)`,
            overflow: "visible",
            zIndex: 3,
          }}
        >
          {X_ARMS.map(([a, b], i) => (
            <line
              key={i}
              x1={a.x} y1={a.y}
              x2={b.x} y2={b.y}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={0.8}
            />
          ))}
        </svg>

        {/* Words */}
        <svg
          width={D}
          height={D}
          viewBox={`${-RADIUS} ${-RADIUS} ${D} ${D}`}
          style={{
            position: "absolute",
            left: `calc(50% - ${RADIUS}px)`,
            top: `calc(50% - ${RADIUS}px)`,
            overflow: "visible",
            zIndex: 4,
            mixBlendMode: "difference",
          }}
        >
          <defs>
            <path id="circle-path" d={circlePath} />
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
              style={{ userSelect: "none", pointerEvents: "none", mixBlendMode: "difference" }}
            >
              <textPath href="#circle-path" startOffset={`${OFFSETS[i]}%`}>
                {word.toUpperCase()}
              </textPath>
            </text>
          ))}
        </svg>
      </div>

      {/* Invisible hover areas — outside spin container so they stay interactive */}
      <svg
        width={LINE * 2}
        height={LINE * 2}
        viewBox={`${-LINE} ${-LINE} ${LINE * 2} ${LINE * 2}`}
        style={{
          position: "absolute",
          left: `calc(50% - ${LINE}px)`,
          top: `calc(50% - ${LINE}px)`,
          zIndex: 10,
          cursor: "pointer",
        }}
      >
        {SEGMENTS.map((seg, i) => (
          <path
            key={i}
            d={pie(seg.start, seg.end, LINE)}
            fill="transparent"
            onMouseEnter={() => { setHovered(i); setDisplayWord(SEGMENTS[i].word); }}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </svg>
    </div>
  );
}

export default App;
