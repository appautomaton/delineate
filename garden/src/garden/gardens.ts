// The gardens a visitor can choose, in the switcher's order. Each has an emblem: a line drawing of
// its signature plant on a 24-unit square, in the garden's own ink. `leaves` are closed shapes,
// washed with `tone` (a species token in src/tokens.css) while the garden is on show; `lines` are
// open strokes: ribs, stems, cuts. A garden with water sets `water`, its height in `--u` units; a
// garden that shows a year rather than one moment sets `year`.

export type Garden = { key: string; name: string; tone: string; water?: number; year?: boolean; leaves: string[]; lines: string[] };

// Where a garden that shows a year is fullest: late spring, every leaf open. Reduced motion and
// the token gallery show it there.
export const SPRING = 0.42;

export const GARDENS: Garden[] = [
  {
    key: "tropical",
    name: "Tropical",
    tone: "--pl-monstera",
    // A monstera leaf: a broad heart, split from the edge toward the midrib.
    leaves: ["M12 20.4C6.2 19.4 2.9 14.4 3.9 9.4 4.8 5.2 9 3.1 12 5.6 15 3.1 19.2 5.2 20.1 9.4 21.1 14.4 17.8 19.4 12 20.4Z"],
    lines: ["M12 22.6V5.6", "M4.3 10.6 8.9 11.9", "M5.2 14.9 9.4 15.1", "M19.7 10.6 15.1 11.9", "M18.8 14.9 14.6 15.1"],
  },
  {
    key: "mediterranean",
    name: "Mediterranean",
    tone: "--pl-olive",
    // An olive sprig: long narrow leaves set alternately along a bowed stem, and one fruit.
    leaves: [
      "M8.62 16.18C9.98 14.03 9.03 11.13 7.92 9.58 7.16 11.33 6.84 14.37 8.62 16.18Z",
      "M10.86 13.6C12.57 15.35 15.42 14.99 17.06 14.2 15.6 13.11 12.87 12.21 10.86 13.6Z",
      "M13.82 10.13C15.13 8.24 14.27 5.69 13.22 4.33 12.47 5.87 12.15 8.54 13.82 10.13Z",
      "M16.51 6.96C17.85 8.61 20.28 8.41 21.71 7.76 20.54 6.71 18.29 5.79 16.51 6.96Z",
      "M8.94 17.98A2 1.5 55 1 0 11.24 21.26 2 1.5 55 1 0 8.94 17.98Z",
    ],
    lines: ["M4.6 20.6C9 16 13.5 10.4 19.4 3.6", "M6.99 18.02 8.94 17.98"],
  },
  {
    key: "desert",
    name: "Desert",
    tone: "--pl-saguaro",
    // A saguaro: a ribbed column, an arm raised on either side, on a line of desert floor.
    leaves: ["M10 22V15.2H8.2Q6 15.2 6 13V7.2A1.5 1.5 0 0 1 9 7.2V11.6Q9 12.3 10 12.3V4.6A2 2 0 0 1 14 4.6V9.6Q15.2 9.6 15.2 8.6V6A1.4 1.4 0 0 1 18 6V10.3Q18 12.4 15.8 12.4H14V22Z"],
    lines: ["M12 21.6V3.2", "M7.5 13V6.4", "M16.6 10.8V5.2", "M5 22H19"],
  },
  {
    key: "afroalpine",
    name: "Afroalpine",
    tone: "--pl-groundsel",
    // A giant groundsel: a trunk forked into three, a rosette on every tip, on a line of ground.
    leaves: [
      "M10.3 7.1L7.8 6.9 10.3 6.3 8.3 5 10.7 5.6 9.8 3.5 11.5 5.1 12 3 12.5 5.1 14.2 3.5 13.3 5.6 15.7 5 13.7 6.3 16.2 6.9 13.7 7.1Q12 8.6 10.3 7.1Z",
      "M5.1 10.8L3.1 10.6 5 10.2 3.5 9.1 5.4 9.6 4.7 8 6 9.3 6.4 7.6 6.8 9.3 8.1 8 7.4 9.6 9.3 9.1 7.8 10.2 9.7 10.6 7.7 10.8Q6.4 11.9 5.1 10.8Z",
      "M16.4 11.8L14.5 11.6 16.3 11.2 14.8 10.2 16.6 10.7 16 9.2 17.2 10.3 17.6 8.8 18 10.3 19.2 9.2 18.6 10.7 20.4 10.2 18.9 11.2 20.7 11.6 18.8 11.8Q17.6 12.8 16.4 11.8Z",
    ],
    lines: ["M12 22V7.6", "M12 15C9.4 14.2 7 13.2 6.4 11.4", "M12 15.6C14.8 15 17 14 17.6 12.4", "M5 22H19"],
  },
  {
    key: "savanna",
    name: "Savanna",
    tone: "--pl-baobab",
    // A baobab: a swollen trunk, limbs thrust up like roots, a tuft of new leaves on each.
    leaves: [
      "M3.6 7.4A1.8 1.3 -20 1 0 7 6.2 1.8 1.3 -20 1 0 3.6 7.4Z",
      "M9 4.6A1.6 1.3 0 1 0 12.2 4.6 1.6 1.3 0 1 0 9 4.6Z",
      "M11.8 4.6A1.6 1.3 0 1 0 15 4.6 1.6 1.3 0 1 0 11.8 4.6Z",
      "M17 6.2A1.8 1.3 20 1 0 20.4 7.4 1.8 1.3 20 1 0 17 6.2Z",
    ],
    lines: [
      "M8 22C7.1 18.4 7.4 14.6 9.6 11.6",
      "M16 22C16.9 18.4 16.6 14.6 14.4 11.6",
      "M9.6 11.6C8.4 9.8 7 8.4 5.4 7.4",
      "M10.9 11.1C10.6 9 10.5 7.2 10.6 5.6",
      "M13.1 11.1C13.4 9 13.5 7.2 13.4 5.6",
      "M14.4 11.6C15.6 9.8 17 8.4 18.6 7.4",
      "M4 22H20",
    ],
  },
  {
    key: "fynbos",
    name: "Fynbos",
    tone: "--pl-kingprotea",
    // A king protea: a crown of pointed bracts cupped round a domed cone, between two oval leaves.
    leaves: [
      "M12 15.6C7.8 15.6 5.2 12.6 4.4 7.4L7.6 10.2 9.4 5.6 12 9.2 14.6 5.6 16.4 10.2 19.6 7.4C18.8 12.6 16.2 15.6 12 15.6Z",
      "M8.8 17.8C6.1 16.4 4.2 14.2 3.6 11.8 6.2 12.6 8.2 14.8 8.8 17.8Z",
      "M15.2 17.8C17.9 16.4 19.8 14.2 20.4 11.8 17.8 12.6 15.8 14.8 15.2 17.8Z",
    ],
    lines: ["M12 22V15.6", "M8.8 10.2Q12 6.8 15.2 10.2", "M5 22H19"],
  },
  {
    key: "namib",
    name: "Namib",
    tone: "--pl-quivertree",
    // A quiver tree: a tapering trunk forked into four, a rosette on every tip, on desert gravel.
    leaves: [
      "M3.6 10.2 5.4 7.2 6.4 9.2 7.4 6.8 8.2 9.6C7.1 10.8 4.8 11 3.6 10.2Z",
      "M8 6.8 9.2 3.6 10.3 5.8 11.2 3.4 12 6.4C10.9 7.4 9 7.5 8 6.8Z",
      "M12 6.4 12.8 3.4 13.7 5.8 14.8 3.6 16 6.8C15 7.5 13.1 7.4 12 6.4Z",
      "M15.8 9.6 16.6 6.8 17.6 9.2 18.6 7.2 20.4 10.2C19.2 11 16.9 10.8 15.8 9.6Z",
    ],
    lines: [
      "M9.4 22 10.8 13.2",
      "M14.6 22 13.2 13.2",
      "M10.8 13.2 8.6 9.8 6.2 10.2",
      "M8.6 9.8 10 6.8",
      "M13.2 13.2 15.4 9.8 17.8 10.2",
      "M15.4 9.8 14 6.8",
      "M4 22H20",
    ],
  },
  {
    key: "mangrove",
    name: "Mangrove",
    tone: "--pl-redmangrove",
    water: 16,
    // A red mangrove: opposite leaves above a trunk lifted on arched stilt roots crossing water.
    leaves: [
      "M11.6 8.2C8.2 7.8 6.4 5.6 7.4 3.4 9.8 3.6 11.6 5.6 11.6 8.2Z",
      "M12.4 8.2C15.8 7.8 17.6 5.6 16.6 3.4 14.2 3.6 12.4 5.6 12.4 8.2Z",
      "M10.8 11.4C7.2 11.4 5 9.6 5.6 7.4 8.2 7.4 10.2 9.2 10.8 11.4Z",
      "M13.2 11.4C16.8 11.4 19 9.6 18.4 7.4 15.8 7.4 13.8 9.2 13.2 11.4Z",
    ],
    lines: [
      "M12 16V7.6",
      "M12 12.6C8.2 13.4 5.8 16.4 5.2 21.6",
      "M12 12.6C15.8 13.4 18.2 16.4 18.8 21.6",
      "M8.2 14.8C6.4 16.4 5.6 18.8 5.4 21.6",
      "M15.8 14.8C17.6 16.4 18.4 18.8 18.6 21.6",
      "M12 14.2C10.2 16 9.4 18.6 9.2 21.6",
      "M12 14.2C13.8 16 14.6 18.6 14.8 21.6",
      "M3 18.4H21",
    ],
  },
  {
    key: "eastasian",
    name: "East Asian",
    tone: "--pl-ginkgo",
    year: true,
    // A ginkgo spur: three fan leaves on stalks from one shoot, each notched at its outer edge.
    leaves: [
      "M12 14L4.9 9.9C5.92 7.15 8.82 6.19 12 8.21 15.18 6.19 18.08 7.15 19.1 9.9Z",
      "M8.6 15.4L2.23 15.96C1.65 13.74 3.07 11.83 6.01 11.7 7.14 8.98 9.42 8.3 11.3 9.6Z",
      "M15.4 15.4L12.7 9.6C14.58 8.3 16.86 8.98 17.99 11.7 20.93 11.83 22.35 13.74 21.77 15.96Z",
    ],
    lines: ["M12 22V14", "M12 17.4Q9.6 17 8.6 15.4", "M12 17.4Q14.4 17 15.4 15.4"],
  },
];
