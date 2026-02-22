import { useRef, useState, useEffect, type WheelEvent as ReactWheelEvent, type TouchEvent as ReactTouchEvent } from "react";
import gsap from "gsap";
import bgVideo from "./assets/bg.mp4";
import languageIcon from "./assets/language.svg";


const SHINE = { highlightOpacity: 0.59, highlightHeight: 1, glowOffset: 14, glowBlur: 27, glowOpacity: 0.14 };
const LANG_SHINE = { highlightOpacity: 0, highlightHeight: 1, glowOffset: 29, glowBlur: 65, glowOpacity: 0.12 };

const CIRCLE_RADIUS = 95;
const PANEL_HEIGHT = 260;
const CIRCLE_LIFT = PANEL_HEIGHT / 2;
const EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
const DURATION = "0.5s";

// ─── Circle geometry ──────────────────────────────────────────────────────────

const TEXT_RADIUS = 55;
const PATH_START = 45;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const polar = (deg: number, r: number) => ({
  x: r * Math.sin(toRad(deg)),
  y: -r * Math.cos(toRad(deg)),
});

const ps = polar(PATH_START, TEXT_RADIUS);
const pa = polar(PATH_START + 180, TEXT_RADIUS);
const circlePath = `M ${ps.x},${ps.y} A ${TEXT_RADIUS},${TEXT_RADIUS} 0 1 1 ${pa.x},${pa.y} A ${TEXT_RADIUS},${TEXT_RADIUS} 0 1 1 ${ps.x},${ps.y}`;
// Counter-clockwise path — text placed on this reads upside-down
const circlePathCCW = `M ${ps.x},${ps.y} A ${TEXT_RADIUS},${TEXT_RADIUS} 0 1 0 ${pa.x},${pa.y} A ${TEXT_RADIUS},${TEXT_RADIUS} 0 1 0 ${ps.x},${ps.y}`;
const WORD_ANGLES = [0, 90, 180, 270];
const OFFSETS = WORD_ANGLES.map(
  (angle) => ((((angle - PATH_START) + 360) % 360) / 360) * 100
);
// Mirror offset for CCW path: position X° on the CW path maps to (100 - X + PATH_START*2/3.6) on CCW
// Simplified: for angle A on CCW path offset = (((PATH_START - A) + 360) % 360) / 360 * 100
const OFFSETS_CCW = WORD_ANGLES.map(
  (angle) => ((((PATH_START - angle) + 360) % 360) / 360) * 100
);

// clipPie — coords in 200×200 space, centre always (100,100)
const clipPie = (startDeg: number, endDeg: number, r: number) => {
  const o = 100;
  const s = polar(startDeg, r);
  const e = polar(endDeg, r);
  return `path('M ${o},${o} L ${s.x + o},${s.y + o} A ${r},${r} 0 0 1 ${e.x + o},${e.y + o} Z')`;
};

// ─── Segment data ─────────────────────────────────────────────────────────────

const SEGMENTS = [
  {
    start: 315, end: 45, word: "Sound",
    body: [
      "There is something deeply artisanal about a well-aged Comté. Each wheel carries the story of its mountain pasture, the wildflowers the cows grazed on, and the hands that turned it in the cave.",
      "A three-year Comté melts on the tongue with a caramel sweetness that no industrial process can replicate. This is cheese as craft — patient, intentional, and quietly extraordinary.",
      "The rind alone tells a story of time. Press your thumb against it and feel decades of tradition compressed into a few centimetres of amber crust.",
    ],
  },
  {
    start: 45, end: 135, word: "Retreat",
    body: [
      "Burrata is an exercise in contrast and restraint. A thin shell of mozzarella holding a soft, surrendering interior of cream and stracciatella — it is designed perfectly.",
      "Its beauty is its honesty. No ageing, no complexity, just the precise moment of freshness captured and presented without apology.",
      "Cut it open and everything spills out. It is generous in a way that feels almost reckless. Good design rarely improves on this.",
    ],
  },
  {
    start: 135, end: 225, word: "Enquire",
    body: [
      "Parmigiano Reggiano is infrastructure. Built slowly over two years in a wheel that weighs forty kilograms, it is the foundation beneath countless dishes.",
      "Crack it open and the crystalline texture — those white specks of tyrosine — tells you something was constructed here, not just made.",
      "It does not melt graciously. It holds its shape, its identity. It is architecture you can eat, and it outlasts almost everything around it.",
    ],
  },
  {
    start: 225, end: 315, word: "Listen",
    body: [
      "Roquefort asks something of you. Veined blue-green through a pale cream interior, it is pungent, mineral, and unapologetically complex.",
      "To appreciate it you must slow down, let it sit on the back of the tongue, and wait. It rewards patience with a depth that lingers long after the plate is cleared.",
      "Some cheeses comfort. Some cheeses seduce. Roquefort simply makes you think — about what you are tasting, and why it took you this long to pay attention.",
    ],
  },
] as const;

const PARA_COLORS = [
  ["#39ff14", "#00e5ff", "#ff2cf8", "#ffe600", "#ff6b00", "#bf5fff"],
  ["#ff2cf8", "#ffe600", "#39ff14", "#bf5fff", "#00e5ff", "#ff6b00"],
  ["#00e5ff", "#ff6b00", "#bf5fff", "#39ff14", "#ff2cf8", "#ffe600"],
  ["#ffe600", "#bf5fff", "#ff6b00", "#ff2cf8", "#39ff14", "#00e5ff"],
];

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const paraRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const touchYRef = useRef<number | null>(null);
  const dragging = useRef(false);
  const segRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Persistent proxy objects — GSAP mutates .t directly, no manual progress sync needed
  const segProxies = useRef(SEGMENTS.map(() => ({ t: 0 })));
  const hoverLeaveTimer = useRef<number | null>(null);

  const [hovered, setHovered] = useState<number | null>(null);
  const [displayWord, setDisplayWord] = useState("");
  const [exploded, setExploded] = useState(false);
  const [sliderPos, setSliderPos] = useState(0.35);
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("EN");

  const maskR = CIRCLE_RADIUS - 1;

  const applyRatio = (ratio: number) => setSliderPos(Math.min(1, Math.max(0, ratio)));
  const resetParagraphScroll = () => { if (paraRef.current) paraRef.current.scrollTop = 0; };
  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) { window.clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
  };

  const handleBack = () => {
    if (langOpen) {
      setLangOpen(false);
      return;
    }
    setExploded(false);
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => { setHovered(null); resetParagraphScroll(); }, 400);
  };

  // Mutually exclusive: exploding closes language panel
  useEffect(() => { if (exploded) setLangOpen(false); }, [exploded]);

  // Click outside language panel closes it — slider is exempt
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      const body = document.getElementById("lang-panel-body");
      const icon = document.getElementById("lang-icon");
      const backBtn = document.getElementById("back-btn");
      const slider = trackRef.current;
      const target = e.target as Node;
      const insidePanel = body?.contains(target) ?? false;
      const insideIcon = icon?.contains(target) ?? false;
      const insideBack = backBtn?.contains(target) ?? false;
      const insideSlider = slider?.contains(target) ?? false;
      if (!insidePanel && !insideIcon && !insideBack && !insideSlider) setLangOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [langOpen]);


  // Set initial clip paths once on mount — GSAP owns clipPath after this, React must not touch it
  useEffect(() => {
    SEGMENTS.forEach((seg, i) => {
      const el = segRefs.current[i];
      if (!el) return;
      segProxies.current[i].t = 0;
      const clip = clipPie(seg.start, seg.end, CIRCLE_RADIUS);
      el.style.clipPath = clip;
      (el.style as any).WebkitClipPath = clip;
    });
  }, []);

  // Each segment's boundary is shared with its neighbour — expanding one shrinks the other,
  // so the circle always tiles perfectly with zero overlap and no z-index juggling needed.
  // CCW neighbour sits at this segment's START boundary; CW neighbour at its END boundary.
  const NEIGHBORS_L = [3, 0, 1, 2]; // counterclockwise (start-side) neighbour index
  const NEIGHBORS_R = [1, 2, 3, 0]; // clockwise (end-side) neighbour index
  const EXPAND = 14;

  useEffect(() => {
    // One shared recompute — reads all 4 proxy values and writes all 4 clip paths
    const recompute = () => {
      const t = segProxies.current.map(p => p.t);
      SEGMENTS.forEach((seg, i) => {
        const el = segRefs.current[i];
        if (!el) return;
        const startDeg = seg.start - t[i] * EXPAND + t[NEIGHBORS_L[i]] * EXPAND;
        const endDeg   = seg.end   + t[i] * EXPAND - t[NEIGHBORS_R[i]] * EXPAND;
        const clip = clipPie(startDeg, endDeg, CIRCLE_RADIUS);
        el.style.clipPath = clip;
        (el.style as any).WebkitClipPath = clip;
      });
    };

    SEGMENTS.forEach((_seg, i) => {
      const proxy = segProxies.current[i];
      const target = hovered === i ? 1 : 0;
      const fromT = proxy.t;
      gsap.killTweensOf(proxy);
      gsap.fromTo(proxy, { t: fromT }, {
        t: target,
        duration: 0.5,
        ease: "power2.inOut",
        onUpdate: recompute,
      });
    });
  }, [hovered]);

  const isInsideParagraph = (target: EventTarget | null) =>
    !!(target instanceof Node && paraRef.current?.contains(target));

  const handleOverlayWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    if (!exploded || !paraRef.current || isInsideParagraph(e.target)) return;
    e.preventDefault();
    paraRef.current.scrollTop += e.deltaY;
  };
  const handleOverlayTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!exploded || !paraRef.current || isInsideParagraph(e.target)) return;
    touchYRef.current = e.touches[0].clientY;
  };
  const handleOverlayTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!exploded || !paraRef.current || isInsideParagraph(e.target)) return;
    if (touchYRef.current === null) { touchYRef.current = e.touches[0].clientY; return; }
    const deltaY = touchYRef.current - e.touches[0].clientY;
    touchYRef.current = e.touches[0].clientY;
    paraRef.current.scrollTop += deltaY;
    e.preventDefault();
  };
  const handleOverlayTouchEnd = () => { touchYRef.current = null; };

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

  useEffect(() => () => clearCloseTimer(), []);

  const circleTransform = langOpen
    ? `translate(-50%, calc(-50% - ${CIRCLE_LIFT}px))`
    : "translate(-50%, -50%)";

  const activeSegmentIdx = SEGMENTS.findIndex(s => s.word === displayWord);

  return (
    <div style={{ width: "100vw", height: "100%", position: "fixed", inset: 0, overflow: "hidden", background: "#000" }}>

      {/* Background video */}
      <video autoPlay loop muted playsInline src={bgVideo}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
      />


      {/* z=10 — Paragraphs */}
      <div style={{
        position: "absolute", left: "50%", top: 0,
        width: "96vw", height: "97vh", zIndex: 10,
        transform: exploded ? "translate(-50%, 3vh)" : "translate(-50%, 100vh)",
        transition: exploded ? "transform 1.2s cubic-bezier(0.25, 1, 0.5, 1) 0.2s" : "transform 0.35s linear",
        pointerEvents: exploded ? "auto" : "none",
      }}
        onWheel={handleOverlayWheel}
        onTouchStart={handleOverlayTouchStart}
        onTouchMove={handleOverlayTouchMove}
        onTouchEnd={handleOverlayTouchEnd}
        onTouchCancel={handleOverlayTouchEnd}
      >
        <div ref={paraRef} style={{
          width: "100%", height: "100%",
          paddingTop: "calc(clamp(5rem, 25vw, 42vh) + 8rem)",
          paddingBottom: "30vh",
          overflowY: exploded ? "auto" : "hidden", overflowX: "hidden",
          WebkitOverflowScrolling: "touch", touchAction: "pan-y",
        }}>
          {(SEGMENTS.find(s => s.word === displayWord)?.body ?? []).map((para, i) => (
            <p key={i} style={{
              fontSize: `${1.0 + sliderPos * 4.0}rem`,
              color: activeSegmentIdx >= 0 ? PARA_COLORS[activeSegmentIdx % 4][i % 6] : "#fff",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              fontWeight: "400", lineHeight: "1.8", letterSpacing: "0.02em",
              maxWidth: "min(1100px, 92vw)", margin: "0 auto 1.4em auto", textAlign: "left",
            }}>
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* z=20 — Title */}
      <div style={{
        position: "absolute", left: "50%", top: 0, zIndex: 20,
        transform: exploded ? "translate(-50%, 3vh)" : "translate(-50%, calc(50vh - 50%))",
        transition: "transform 1.4s cubic-bezier(0.3, 0, 0.1, 1), opacity 0.5s ease",
        width: "96vw", textAlign: "center",
        opacity: hovered !== null || exploded ? 1 : 0,
        pointerEvents: "none",
      }}>
        <span style={{
          fontSize: "clamp(5rem, 25vw, 42vh)", fontWeight: "700",
          color: exploded ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.1)",
          transition: "color 0.6s ease", letterSpacing: "0.06em",
          textTransform: "uppercase", fontFamily: "ui-sans-serif, system-ui, sans-serif",
          display: "block",
        }}>
          {displayWord}
        </span>
      </div>

      {/* ── New glass circle ──────────────────────────────────────────────── */}
      <div style={{
        position: "fixed", left: "50%", top: "50%",
        width: "200px", height: "200px",
        transform: circleTransform,
        transition: `transform ${DURATION} ${EASING}`,
        overflow: "visible", display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 30, pointerEvents: "none",
      }}>
        {SEGMENTS.map((_seg, i) => {
          const origins = ["50% 0%", "100% 50%", "50% 100%", "0% 50%"];
          return (
            <div key={i} ref={el => { segRefs.current[i] = el; }} style={{
              position: "absolute", inset: 0,
              maskImage: `radial-gradient(circle at 50% 50%, #000 ${maskR}px, transparent ${CIRCLE_RADIUS}px)`,
              WebkitMaskImage: `radial-gradient(circle at 50% 50%, #000 ${maskR}px, transparent ${CIRCLE_RADIUS}px)`,
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              willChange: "clip-path",
              zIndex: 2,
            }}>
              {/* Base shading — always visible */}
              <div style={{
                position: "absolute", inset: 0,
                background: `radial-gradient(ellipse at ${origins[i]}, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.18) 10%, rgba(0,0,0,0.22) 55%, rgba(0,0,0,0.22) 100%)`,
              }} />
              {/* Hover boost — fades in/out via opacity */}
              <div style={{
                position: "absolute", inset: 0,
                background: `radial-gradient(ellipse at ${origins[i]}, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.18) 10%, rgba(0,0,0,0.22) 55%, rgba(0,0,0,0.22) 100%)`,
                opacity: hovered === i ? 1 : 0,
                transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }} />
            </div>
          );
        })}

        {/* Shine — hidden */}

        <svg width="200" height="200" viewBox="-100 -100 200 200" style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)", zIndex: 20, overflow: "visible", pointerEvents: "none",
          opacity: exploded ? 0 : 1, transition: "opacity 0.4s ease",
        }}>
          <defs>
            <path id="main-circle-text-path" d={circlePath} />
            <path id="main-circle-text-path-ccw" d={circlePathCCW} />
          </defs>
          {SEGMENTS.map((seg, i) => {
            const flipped = seg.word === "Enquire";
            return (
              <text key={seg.word} fontSize="11" letterSpacing="3" textAnchor="middle"
                fill="white" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="500"
                style={{ userSelect: "none", mixBlendMode: "difference" }}>
                <textPath
                  href={flipped ? "#main-circle-text-path-ccw" : "#main-circle-text-path"}
                  startOffset={`${flipped ? OFFSETS_CCW[i] : OFFSETS[i]}%`}>
                  {seg.word.toUpperCase()}
                </textPath>
              </text>
            );
          })}
        </svg>
      </div>

      {/* Invisible hit areas — same position/transform as circle */}
      <svg
        width="200" height="200" viewBox="-100 -100 200 200"
        style={{
          position: "fixed", left: "50%", top: "50%",
          transform: circleTransform,
          transition: `transform ${DURATION} ${EASING}`,
          zIndex: 30,
          cursor: exploded ? "default" : "pointer",
          pointerEvents: exploded || langOpen ? "none" : "all",
          touchAction: "manipulation", userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          overflow: "visible",
        }}
      >
        {SEGMENTS.map((seg, i) => (
          <path
            key={i}
            d={`M 0,0 L ${polar(seg.start, CIRCLE_RADIUS).x},${polar(seg.start, CIRCLE_RADIUS).y} A ${CIRCLE_RADIUS},${CIRCLE_RADIUS} 0 0 1 ${polar(seg.end, CIRCLE_RADIUS).x},${polar(seg.end, CIRCLE_RADIUS).y} Z`}
            fill="transparent"
            onPointerEnter={(e) => {
              if (hoverLeaveTimer.current) { window.clearTimeout(hoverLeaveTimer.current); hoverLeaveTimer.current = null; }
              if (!exploded && e.pointerType === "mouse") { setHovered(i); setDisplayWord(seg.word); }
            }}
            onPointerLeave={(e) => {
              if (!exploded && e.pointerType === "mouse") {
                hoverLeaveTimer.current = window.setTimeout(() => { setHovered(null); hoverLeaveTimer.current = null; }, 80);
              }
            }}
            onPointerDown={() => {
              if (!exploded) { setHovered(i); setDisplayWord(seg.word); }
            }}
            onClick={() => {
              if (!exploded) { clearCloseTimer(); resetParagraphScroll(); setExploded(true); setHovered(i); setDisplayWord(seg.word); }
            }}
          />
        ))}
      </svg>

      {/* ── Unified bottom bar ───────────────────────────────────────────────
           Structure: [icon row] [language panel]
           When langOpen=false → translateY(PANEL_HEIGHT) hides the panel below
           the screen while the icon row remains visible at the bottom.
           When langOpen=true  → translateY(0) raises everything together.
      ──────────────────────────────────────────────────────────────────── */}
      <div id="lang-panel" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        maxWidth: "100vw", overflow: "hidden",
        height: `calc(${PANEL_HEIGHT}px + 8vh)`,
        transform: langOpen ? "translateY(0)" : `translateY(${PANEL_HEIGHT}px)`,
        transition: `transform ${DURATION} ${EASING}`,
        zIndex: 30, pointerEvents: "none",
      }}>

        {/* Icon row — sits at the very top of this container */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "8vh",
          display: "flex", alignItems: "center",
          padding: "0 3vw", pointerEvents: "none",
        }}>
          {/* Back arrow */}
          <div id="back-btn" onClick={handleBack} style={{
            width: "2.4rem", height: "2.4rem",
            opacity: exploded ? 1 : 0, transition: "opacity 0.4s ease",
            pointerEvents: "auto", willChange: "opacity",
            cursor: exploded ? "pointer" : "default", color: "white",
            fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: "2rem",
            userSelect: "none", WebkitTapHighlightColor: "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>←</div>

          {/* Font size slider — centred, fixed width */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            opacity: exploded ? 1 : 0, transition: "opacity 0.5s ease",
            pointerEvents: exploded ? "auto" : "none",
            userSelect: "none", WebkitTapHighlightColor: "transparent",
            willChange: "opacity",
          }}>
          <div style={{ width: "50vw", display: "flex", alignItems: "center" }}>
            <span style={{ color: "white", fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: "1rem", userSelect: "none", marginRight: "1rem" }}>A</span>
            <div ref={trackRef}
              onMouseDown={(e) => { const r = e.currentTarget.getBoundingClientRect(); applyRatio((e.clientX - r.left) / r.width); dragging.current = true; }}
              onTouchStart={(e) => { const r = e.currentTarget.getBoundingClientRect(); applyRatio((e.touches[0].clientX - r.left) / r.width); dragging.current = true; }}
              style={{ flex: 1, height: "20px", display: "flex", alignItems: "center", cursor: "pointer", position: "relative" }}
            >
              <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.25)" }} />
              <div
                onMouseDown={(e) => { e.stopPropagation(); dragging.current = true; }}
                onTouchStart={(e) => { e.stopPropagation(); dragging.current = true; }}
                style={{
                  position: "absolute", top: "50%", left: `${sliderPos * 100}%`,
                  transform: "translate(-50%, -50%)", width: "10px", height: "10px",
                  borderRadius: "50%", background: "white", cursor: "grab",
                }}
              />
            </div>
            <span style={{ color: "white", fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: "1.6rem", userSelect: "none", marginLeft: "1rem" }}>A</span>
          </div></div>

          {/* Language icon */}
          <img id="lang-icon" src={languageIcon} alt="Language"
            onClick={() => setLangOpen(o => !o)}
            style={{
              width: "2.4rem", height: "2.4rem",
              pointerEvents: "auto", filter: "invert(1)", cursor: "pointer",
              userSelect: "none", WebkitTapHighlightColor: "transparent",
            }}
          />
        </div>

        {/* Language panel */}
        <div id="lang-panel-body" style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: PANEL_HEIGHT,
          zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-evenly",
          padding: "0 5vw",
          pointerEvents: langOpen ? "auto" : "none",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          boxShadow: `inset 0 ${LANG_SHINE.highlightHeight}px 0 rgba(255,255,255,${LANG_SHINE.highlightOpacity}), inset 0 ${LANG_SHINE.glowOffset}px ${LANG_SHINE.glowBlur}px rgba(255,255,255,${LANG_SHINE.glowOpacity})`,
        }}>
          {["EN", "FR", "AR", "ES", "DE", "JA"].map((lang) => {
            const isSelected = selectedLang === lang;
            return (
              <button key={lang} onClick={() => setSelectedLang(lang)} style={{
                background: "none", border: "none",
                color: isSelected ? "#fff" : "rgba(255,255,255,0.4)",
                fontSize: "1.1rem", fontWeight: isSelected ? "700" : "600",
                letterSpacing: "0.2em", cursor: "pointer",
                padding: "0.5rem 0", transition: "color 0.2s ease, font-weight 0.2s ease",
                fontFamily: "inherit",
              }}
                onMouseEnter={(e) => { if (!isSelected) (e.target as HTMLElement).style.color = "rgba(255,255,255,0.75)"; }}
                onMouseLeave={(e) => { if (!isSelected) (e.target as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
              >{lang}</button>
            );
          })}
        </div>

      </div>


    </div>
  );
}

export default App;
