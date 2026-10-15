// The motifs a card can be made of: a sculpture, its record, and the drawings made of one view of its scan. Every
// fact here is the holder's or the scan's own; the drawings live in art/<id>/, one file a hand, each frame wide by
// frame high. A crop is [x, y, width, height] in the drawings' own pixels, one for each of the two parts a card cuts
// out: the detail laid beside the record, and the stamp's face. Shown whole, a figure keeps its base.
// The mark is the stamp's small print; the labels are the two strips of tape on the record.
//
// A motif's scan says how its view is rendered (npm run collage:render): the scan's file, as kept in the cache, and
// where its holder publishes it; the turn, in degrees about x, y, z, that stands it upright; the view's azimuth and
// elevation in degrees; the lens in mm; and the side the key light comes from, the side the subject faces.

// The grounds a card is printed in: four inks of one lightness and one chroma (OKLCH L .345, C .11; the green .09,
// all its hue holds there), so they sit together, and one line screen, matched to the navy, serves on each.
export const GROUNDS = {
  navy: "#213371",
  oxblood: "#67191A",
  forest: "#0C451C",
  plum: "#52215A",
};

// The hands, each a file in art/<id>/, and the ground each draws on its own sheet; the line screen takes the card's.
// The cast is the object itself, rendered in ivory: the one hand that is a picture.
export const HANDS = {
  engraving: { name: "Engraving", file: "engraving.svg", ground: "#F4EFE4" },
  screen: { name: "Line screen", file: "screen.svg", ground: null },
  marble: { name: "Marble", file: "marble.svg", ground: null },
  contour: { name: "Contour", file: "contour.svg", ground: null },
  cast: { name: "Cast", file: "cast.webp", ground: null },
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
    mark: "KMS5250 · 1846",
    labels: ["Bronze, 1846", "Public domain"],
    credit: "J.A. Jerichau, <i>The Panther Hunter</i>, 1845–46. Drawn from SMK – Statens Museum for Kunst’s public-domain scan.",
    scan: {
      file: "KMS5250_full.stl",
      from: "https://api.smk.dk/api/v1/download-3d/6m311v17d_smk25-kms-panther-and-man.stl",
      fix: [0, 0, 0],
      view: [15, 5],
      lens: 85,
      key: "left",
    },
    frame: [677, 1200],
    crops: {
      detail: [0, 592, 290, 290],
      stamp: [110, 170, 470, 590],
    },
  },
  discobolus: {
    title: "Discobolus",
    record: [
      ["Object", "Discobolus"],
      ["Maker", "After Myron"],
      ["Made", "Original c. 450 BCE"],
      ["Material", "Painted plaster cast"],
      ["Size", "1680 × 1000 × 505 mm"],
      ["Holder", "SMK, Copenhagen"],
      ["Number", "KAS1074"],
      ["Scan", "1,999,971 triangles"],
      ["View", "10° · 5° · 85 mm"],
      ["Rights", "Public domain"],
    ],
    mark: "KAS1074 · c. 450 BCE",
    labels: ["Plaster, after Myron", "Public domain"],
    credit: "<i>Discobolus</i>, a plaster cast after Myron. Drawn from the public-domain scan of SMK – Statens Museum for Kunst’s Royal Cast Collection.",
    scan: {
      file: "KAS1074_full.stl",
      from: "https://api.smk.dk/api/v1/download-3d/s4655n32f_smk-kas1074-discobolus-decimated.stl",
      fix: [0, 0, 0],
      view: [10, 5],
      lens: 85,
      key: "left",
    },
    frame: [795, 1200],
    crops: {
      detail: [30, 30, 300, 300],
      stamp: [300, 200, 470, 590],
    },
  },
  "medici-riccardi-horse": {
    title: "Horse Head",
    record: [
      ["Object", "Horse Head, “Medici Riccardi”"],
      ["Maker", "Unknown, Greek"],
      ["Made", "Late 4th c. BCE"],
      ["Material", "Bronze"],
      ["Holder", "Museo Archeologico, Florence"],
      ["Scan", "2,499,712 triangles"],
      ["View", "150° · 5° · 85 mm"],
      ["Rights", "No restrictions"],
    ],
    mark: "Florence · 4th c. BCE",
    labels: ["Bronze, 4th c. BCE", "No restrictions"],
    credit: "The “Medici Riccardi” <i>Horse Head</i>, Greek, late 4th century BCE, Museo Archeologico Nazionale, Florence. Drawn from Oliver Laric’s scan for threedscans.com.",
    scan: {
      file: "Horse_Head.obj",
      from: "https://threedscans.com/wp-content/uploads/2016/02/Horse_Head.obj.zip",
      fix: [-90, 0, 0],
      view: [150, 5],
      lens: 85,
      key: "left",
    },
    frame: [1200, 1086],
    crops: {
      detail: [80, 70, 320, 320],
      stamp: [40, 60, 1120, 960],
    },
  },
  "striding-eagle": {
    title: "Striding Eagle",
    record: [
      ["Object", "Striding Eagle"],
      ["Maker", "Unknown"],
      ["Made", "16th century"],
      ["Material", "Marble"],
      ["Size", "768 × 584 × 660 mm"],
      ["Holder", "Saint Louis Art Museum"],
      ["Scan", "540,970 triangles"],
      ["View", "100° · 5° · 85 mm"],
      ["Rights", "No restrictions"],
    ],
    mark: "Saint Louis · 16th c.",
    labels: ["Marble, 16th century", "No restrictions"],
    credit: "<i>Striding Eagle</i>, 16th century, Saint Louis Art Museum. Drawn from Oliver Laric’s scan for threedscans.com.",
    scan: {
      file: "Eagle_custom_Normals.obj",
      from: "https://threedscans.com/wp-content/uploads/2019/02/Eagle_custom_Normals.obj.zip",
      fix: [90, 0, 0],
      view: [100, 5],
      lens: 85,
      key: "left",
    },
    frame: [854, 1200],
    crops: {
      detail: [290, 50, 300, 300],
      stamp: [250, 30, 400, 500],
    },
  },
  "oplontis-centaur": {
    title: "Centaur",
    record: [
      ["Object", "Centaur"],
      ["Maker", "Unknown, Roman"],
      ["Made", "1st century CE"],
      ["Holder", "Villa Poppaea, Oplontis"],
      ["Scan", "522,327 triangles"],
      ["View", "210° · 5° · 85 mm"],
      ["Rights", "No restrictions"],
    ],
    mark: "Oplontis · 1st c. CE",
    labels: ["Roman, 1st century", "No restrictions"],
    credit: "<i>Centaur</i>, Roman, 1st century CE, from the Villa Poppaea at Oplontis. Drawn from Oliver Laric’s scan for threedscans.com.",
    scan: {
      file: "Centaur.stl",
      from: "https://threedscans.com/wp-content/uploads/2025/10/Centaur.stl.zip",
      fix: [90, 0, 0],
      view: [210, 5],
      lens: 85,
      key: "left",
    },
    frame: [743, 1200],
    crops: {
      detail: [240, 40, 300, 300],
      stamp: [100, 220, 480, 600],
    },
  },
};
