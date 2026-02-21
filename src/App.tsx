const WORDS = ["Studio", "Design", "Build", "Think"];
const RADIUS = 55;
const D = RADIUS * 2;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const polar = (deg: number, r: number) => ({
  x: r * Math.sin(toRad(deg)),
  y: -r * Math.cos(toRad(deg)),
});

// Path starts at 45° (NE) so no word sits at the 0%/100% boundary
const PATH_START = 45;
const s = polar(PATH_START, RADIUS);
const a = polar(PATH_START + 180, RADIUS);
const circlePath = `M ${s.x},${s.y} A ${RADIUS},${RADIUS} 0 1 1 ${a.x},${a.y} A ${RADIUS},${RADIUS} 0 1 1 ${s.x},${s.y}`;

// N=0°, E=90°, S=180°, W=270° → offsets: 87.5%, 12.5%, 37.5%, 62.5%
const WORD_ANGLES = [0, 90, 180, 270];
const OFFSETS = WORD_ANGLES.map(
  (angle) => (((angle - PATH_START) + 360) % 360) / 360 * 100
);

function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        inset: 0,
        background: "white",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: "100%",
          height: "1px",
          background: "#e5e7eb",
          transform: "translateY(-0.5px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: "1px",
          height: "100%",
          background: "#e5e7eb",
          transform: "translateX(-0.5px)",
        }}
      />

      <svg
        width={D}
        height={D}
        viewBox={`${-RADIUS} ${-RADIUS} ${D} ${D}`}
        style={{
          position: "absolute",
          left: `calc(50% - ${RADIUS}px)`,
          top: `calc(50% - ${RADIUS}px)`,
          overflow: "visible",
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
            fill="#111"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontWeight="500"
          >
            <textPath href="#circle-path" startOffset={`${OFFSETS[i]}%`}>
              {word.toUpperCase()}
            </textPath>
          </text>
        ))}
      </svg>
    </div>
  );
}

export default App;
