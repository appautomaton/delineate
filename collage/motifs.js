// The motifs a card can be made of: a sculpture, its record, and the drawings made of one view of its scan. Every
// fact here is the holder's or the scan's own; the drawings live in art/<id>/, one file a hand, each frame wide by
// frame high. A crop is [x, y, width, height] in the drawings' own pixels.

export const HANDS = {
  engraving: { name: "Engraving", ground: "#F4EFE4" },
  screen: { name: "Line screen", ground: "#1E2F7E" },
  marble: { name: "Marble", ground: null },
  contour: { name: "Contour", ground: null },
};

export const MOTIFS = {
  "panther-hunter": {
    title: "The Panther Hunter",
    record: [
      ["Object", "The Panther Hunter"],
      ["Maker", "J.A. Jerichau"],
      ["Made", "1845–46"],
      ["Material", "Bronze"],
      ["Size", "2095 × 1050 × 650 mm"],
      ["Holder", "SMK, Copenhagen"],
      ["Number", "KMS5250"],
      ["Scan", "3,721,294 triangles"],
      ["View", "15° · 5° · 85 mm"],
      ["Rights", "Public domain"],
    ],
    number: "KMS5250",
    year: "1846",
    frame: [677, 1200],
    crops: {
      jaw: [0, 592, 290, 290],
      meeting: [60, 300, 520, 520],
      upper: [20, 110, 640, 760],
      chest: [110, 170, 470, 590],
    },
  },
};
