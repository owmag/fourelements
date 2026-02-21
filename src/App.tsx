import { useRef, useState, useEffect } from "react";
import bgVideo from "./assets/bg.mp4";

const RADIUS = 55;
const LINE = RADIUS * 1.4;
const D = RADIUS * 2;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const polar = (deg: number, r: number) => ({
  x: r * Math.sin(toRad(deg)),
  y: -r * Math.cos(toRad(deg)),
});

// clip-path path string — coords relative to top-left of the div (offset = LINE)
const clipPie = (startDeg: number, endDeg: number, r: number) => {
  const o = r; // offset = radius so centre is at (r, r)
  const s = polar(startDeg, r);
  const e = polar(endDeg, r);
  return `path('M ${o},${o} L ${s.x + o},${s.y + o} A ${r},${r} 0 0 1 ${e.x + o},${e.y + o} Z')`;
};

const SEGMENTS = [
  {
    start: 315, end: 45, word: "Studio", dx: 0, dy: -1,
    body: [
      "There is something deeply artisanal about a well-aged Comté. Each wheel carries the story of its mountain pasture, the wildflowers the cows grazed on, and the hands that turned it in the cave.",
      "A three-year Comté melts on the tongue with a caramel sweetness that no industrial process can replicate. This is cheese as craft — patient, intentional, and quietly extraordinary.",
      "The rind alone tells a story of time. Press your thumb against it and feel decades of tradition compressed into a few centimetres of amber crust.",
    ],
  },
  {
    start: 45, end: 135, word: "Design", dx: 1, dy: 0,
    body: [
      "Burrata is an exercise in contrast and restraint. A thin shell of mozzarella holding a soft, surrendering interior of cream and stracciatella — it is designed perfectly.",
      "Its beauty is its honesty. No ageing, no complexity, just the precise moment of freshness captured and presented without apology.",
      "Cut it open and everything spills out. It is generous in a way that feels almost reckless. Good design rarely improves on this.",
    ],
  },
  {
    start: 135, end: 225, word: "Build", dx: 0, dy: 1,
    body: [
      "Parmigiano Reggiano is infrastructure. Built slowly over two years in a wheel that weighs forty kilograms, it is the foundation beneath countless dishes.",
      "Crack it open and the crystalline texture — those white specks of tyrosine — tells you something was constructed here, not just made.",
      "It does not melt graciously. It holds its shape, its identity. It is architecture you can eat, and it outlasts almost everything around it.",
    ],
  },
  {
    start: 225, end: 315, word: "Think", dx: -1, dy: 0,
    body: [
      "Roquefort asks something of you. Veined blue-green through a pale cream interior, it is pungent, mineral, and unapologetically complex.",
      "To appreciate it you must slow down, let it sit on the back of the tongue, and wait. It rewards patience with a depth that lingers long after the plate is cleared.",
      "Some cheeses comfort. Some cheeses seduce. Roquefort simply makes you think — about what you are tasting, and why it took you this long to pay attention.",
    ],
  },
];

// textPath setup
const PATH_START = 45;
const ps = polar(PATH_START, RADIUS);
const pa = polar(PATH_START + 180, RADIUS);
const circlePath = `M ${ps.x},${ps.y} A ${RADIUS},${RADIUS} 0 1 1 ${pa.x},${pa.y} A ${RADIUS},${RADIUS} 0 1 1 ${ps.x},${ps.y}`;
const WORD_ANGLES = [0, 90, 180, 270];
const OFFSETS = WORD_ANGLES.map(
  (angle) => (((angle - PATH_START) + 360) % 360) / 360 * 100
);


function App() {
  const spinRef = useRef<HTMLDivElement>(null);
  const paraRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [displayWord, setDisplayWord] = useState("");
  const [exploded, setExploded] = useState(false);
  const [sliderPos, setSliderPos] = useState(0.35);
  const dragging = useRef(false);

  const applyRatio = (ratio: number) => {
    setSliderPos(Math.min(1, Math.max(0, ratio)));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      applyRatio((clientX - rect.left) / rect.width);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);


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
        autoPlay loop muted playsInline
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", zIndex: 0,
        }}
        src={bgVideo}
      />

      {/* Large bg word + paragraph */}
      <div
        style={{
          position: "absolute", inset: 0,
          zIndex: 1, pointerEvents: exploded ? "auto" : "none",
          opacity: hovered !== null || exploded ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        {/* Title — centred on hover, fixed at top when exploded */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: exploded ? "3vh" : "50%",
            transform: exploded ? "translateX(-50%)" : "translate(-50%, -50%)",
            transition: "top 1.4s cubic-bezier(0.3, 0, 0.1, 1), transform 1.4s cubic-bezier(0.3, 0, 0.1, 1)",
            width: "96vw",
            textAlign: "center",
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: "clamp(5rem, 25vw, 42vh)",
              fontWeight: "700",
              color: exploded ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.1)",
              transition: "color 0.6s ease",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              userSelect: "none",
              display: "block",
            }}
          >
            {displayWord}
          </span>
        </div>

        {/* Scrollable paragraph area — slides up from bottom, scrollable once in view */}
        <div
          ref={paraRef}
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: "96vw",
            top: exploded ? "3vh" : "100vh",
            height: "97vh",
            paddingTop: "clamp(5rem, 25vw, 42vh)",
            overflowY: exploded ? "auto" : "hidden",
            transition: "top 1.2s cubic-bezier(0.25, 1, 0.5, 1) 0.2s",
            pointerEvents: exploded ? "auto" : "none",
            zIndex: 1,
          }}
        >
          {(SEGMENTS.find(s => s.word === displayWord)?.body ?? []).map((para, i) => (
            <p
              key={i}
              style={{
                fontSize: `${1.0 + sliderPos * 4.0}rem`,
                color: [
                  ["#39ff14", "#00e5ff", "#ff2cf8", "#ffe600", "#ff6b00", "#bf5fff"],
                  ["#ff2cf8", "#ffe600", "#39ff14", "#bf5fff", "#00e5ff", "#ff6b00"],
                  ["#00e5ff", "#ff6b00", "#bf5fff", "#39ff14", "#ff2cf8", "#ffe600"],
                  ["#ffe600", "#bf5fff", "#ff6b00", "#ff2cf8", "#39ff14", "#00e5ff"],
                ][SEGMENTS.findIndex(s => s.word === displayWord) % 4][i % 6],
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                fontWeight: "400",
                lineHeight: "1.8",
                letterSpacing: "0.02em",
                userSelect: "none",
                maxWidth: "min(720px, 80vw)",
                margin: "0 auto 1.4em auto",
                textAlign: "left",
              }}
            >
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Back arrow */}
      <div
        onClick={() => setExploded(false)}
        style={{
          position: "fixed",
          bottom: "4vh",
          left: "3vw",
          zIndex: 30,
          opacity: exploded ? 1 : 0,
          transition: "opacity 0.4s ease",
          pointerEvents: exploded ? "auto" : "none",
          cursor: "pointer",
          color: "white",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          fontSize: "1.4rem",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          letterSpacing: "0.05em",
        }}
      >
        ←
      </div>

      {/* Horizontal slider */}
      <div
        style={{
          position: "fixed",
          bottom: "4vh",
          left: "50%",
          transform: "translateX(-50%)",
          width: "50vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20,
          opacity: exploded ? 1 : 0,
          transition: "opacity 0.5s ease",
          pointerEvents: exploded ? "auto" : "none",
        }}
      >
        <span style={{ color: "white", fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: "1rem", userSelect: "none", marginRight: "1rem" }}>A</span>

        {/* Track */}
        <div
          ref={trackRef}
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            applyRatio((e.clientX - rect.left) / rect.width);
            dragging.current = true;
          }}
          style={{
            flex: 1,
            height: "20px",
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.25)" }} />
          {/* Handle */}
          <div
            onMouseDown={(e) => { e.stopPropagation(); dragging.current = true; }}
            onTouchStart={(e) => { e.stopPropagation(); dragging.current = true; }}
            style={{
              position: "absolute",
              top: "50%",
              left: `${sliderPos * 100}%`,
              transform: "translate(-50%, -50%)",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "white",
              cursor: "grab",
            }}
          />
        </div>

        <span style={{ color: "white", fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: "1.6rem", userSelect: "none", marginLeft: "1rem" }}>A</span>
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

      {/* Visual content */}
      <div ref={spinRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>

        {/* 4 glass segments — each clips + translates independently */}
        {SEGMENTS.map((seg, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(50% - ${LINE}px)`,
              top: `calc(50% - ${LINE}px)`,
              width: LINE * 2,
              height: LINE * 2,
              clipPath: clipPie(seg.start, seg.end, LINE),
              backdropFilter: "blur(3px) contrast(1.5) brightness(1.18) saturate(2)",
              WebkitBackdropFilter: "blur(3px) contrast(1.5) brightness(1.18) saturate(2)",
              filter: "url(#glass-distort)",
              background: "rgba(255,255,255,0.03)",
              opacity: exploded ? 0 : 1,
              transition: "opacity 0.5s ease",
              zIndex: 2,
            }}
          />
        ))}

        {/* 4 arm-pair SVGs — one per segment, translate with their segment */}
        {SEGMENTS.map((seg, i) => {
          const tipA = polar(seg.start, LINE);
          const tipB = polar(seg.end, LINE);
          return (
            <svg
              key={i}
              width={LINE * 2} height={LINE * 2}
              viewBox={`${-LINE} ${-LINE} ${LINE * 2} ${LINE * 2}`}
              style={{
                position: "absolute",
                left: `calc(50% - ${LINE}px)`,
                top: `calc(50% - ${LINE}px)`,
                overflow: "visible",
                opacity: exploded ? 0 : 1,
                transition: "opacity 0.5s ease",
                zIndex: 3,
              }}
            >
              <line x1={0} y1={0} x2={tipA.x} y2={tipA.y} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
              <line x1={0} y1={0} x2={tipB.x} y2={tipB.y} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
            </svg>
          );
        })}

        {/* Words — each text translates with its segment */}
        <svg
          width={D} height={D}
          viewBox={`${-RADIUS} ${-RADIUS} ${D} ${D}`}
          style={{
            position: "absolute",
            left: `calc(50% - ${RADIUS}px)`,
            top: `calc(50% - ${RADIUS}px)`,
            overflow: "visible",
            opacity: exploded ? 0 : 1,
            transition: "opacity 0.5s ease",
            zIndex: 4,
          }}
        >
          <defs>
            <path id="circle-path" d={circlePath} />
          </defs>
          {SEGMENTS.map((seg, i) => (
            <text
              key={seg.word}
              fontSize="11"
              letterSpacing="3"
              textAnchor="middle"
              fill="white"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontWeight="500"
              style={{
                userSelect: "none",
                pointerEvents: "none",
                mixBlendMode: "difference",
              }}
            >
              <textPath href="#circle-path" startOffset={`${OFFSETS[i]}%`}>
                {seg.word.toUpperCase()}
              </textPath>
            </text>
          ))}
        </svg>
      </div>

      {/* Invisible hover areas */}
      <svg
        width={LINE * 2} height={LINE * 2}
        viewBox={`${-LINE} ${-LINE} ${LINE * 2} ${LINE * 2}`}
        style={{
          position: "absolute",
          left: `calc(50% - ${LINE}px)`,
          top: `calc(50% - ${LINE}px)`,
          zIndex: 10,
          cursor: exploded ? "default" : "pointer",
          pointerEvents: exploded ? "none" : "all",
        }}
      >
        {SEGMENTS.map((seg, i) => (
          <path
            key={i}
            d={`M 0,0 L ${polar(seg.start, LINE).x},${polar(seg.start, LINE).y} A ${LINE},${LINE} 0 0 1 ${polar(seg.end, LINE).x},${polar(seg.end, LINE).y} Z`}
            fill="transparent"
            onMouseEnter={() => { if (!exploded) { setHovered(i); setDisplayWord(seg.word); } }}
            onMouseLeave={() => { if (!exploded) setHovered(null); }}
            onClick={() => { setExploded(e => !e); setHovered(null); }}
          />
        ))}
      </svg>
    </div>
  );
}

export default App;
