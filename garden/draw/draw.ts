// Draws the plants listed in src/garden/plants.json:
// - public/garden/<name>.svg, each plant fully grown, with its growth markup
// - src/garden/anchors.css, each plant's aspect ratio, anchor (where its base sits inside its
//   box), and species tone
// - src/garden/fields.ts, a coarse map of where each plant paints, for the layout solver
// - gallery/details/<name>.svg, a close study of each plant for the token gallery
// It stops with an error if any leaf, flower, fruit, or thorn would appear before the limb it
// sits on has grown to it.
// Run: node garden/draw/draw.ts

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { rng, rad, compact, sample } from "./lib.ts";
import type { Out, Pt, Rng } from "./lib.ts";
import * as W from "./woody.ts";
import * as H from "./herbs.ts";
import * as M from "./mediterranean.ts";
import * as D from "./desert.ts";
import * as A from "./afroalpine.ts";
import * as RO from "./rosette.ts";
import * as S from "./savanna.ts";
import * as F from "./fynbos.ts";
import * as N from "./namib.ts";
import * as MG from "./mangrove.ts";
import * as E from "./eastasian.ts";
import * as TG from "./taiga.ts";
import * as AM from "./american.ts";
import * as WL from "./woodland.ts";

const REGISTRY: { name: string; garden: string; turn?: [number, number] }[] = JSON.parse(readFileSync(new URL("../src/garden/plants.json", import.meta.url), "utf8"));

// Each plant is drawn with its base (or hanging point) at the origin, from its own seed so its
// drawing never depends on the order of the list. A detail is a close study of one leaf,
// flower, or fruit.
type Drawing = (o: Out, r: Rng) => unknown;
const PLANTS: Record<string, { seed: number; draw: Drawing; detail: Drawing }> = {
  frangipani: { seed: 112, draw: (o, r) => W.frangipani(o, r, [0, 0]), detail: (o, r) => W.plumeriaFlower(o, r, [150, 150], 120, 0.3) },
  bauhinia: { seed: 213, draw: (o, r) => W.bauhinia(o, r, [0, 0]), detail: (o, r) => W.bauhiniaFlower(o, r, [130, 160], 110, -0.2) },
  mango: { seed: 314, draw: (o, r) => W.mango(o, r, [0, 0]), detail: (o, r) => W.mangoFruit(o, r, [150, 30], 180, rad(8)) },
  lychee: { seed: 415, draw: (o, r) => W.lychee(o, r, [0, 0]), detail: (o, r) => W.lycheeFruit(o, r, [150, 150], 96) },
  palm: { seed: 516, draw: (o, r) => H.fanPalm(o, r, [0, 0]), detail: (o, r) => H.palmLeaf(o, r, [150, 160], rad(-90), 120, 0.9, -8) },
  monstera: { seed: 617, draw: (o, r) => H.monstera(o, r, [0, 0]), detail: (o, r) => H.monsteraLeaf(o, r, [40, 160], 0, 230, { tilt: 0.92 }) },
  adansonii: { seed: 718, draw: (o, r) => H.adansonii(o, r, [0, 0], 620), detail: (o, r) => H.adansoniiLeaf(o, r, [30, 150], 0, 240) },
  strelitzia: { seed: 819, draw: (o, r) => H.strelitzia(o, r, [0, 0]), detail: (o, r) => H.craneFlower(o, r, [70, 300], [70, 170], rad(-6)) },
  alocasia: { seed: 920, draw: (o, r) => H.alocasia(o, r, [0, 0]), detail: (o, r) => H.alocasiaLeaf(o, r, [110, 150], 0, 180) },
  calathea: { seed: 1021, draw: (o, r) => H.calathea(o, r, [0, 0]), detail: (o, r) => H.calatheaLeaf(o, r, [40, 150], 0, 230) },
  staghorn: { seed: 1122, draw: (o, r) => H.staghorn(o, r, [0, 0]), detail: (o, r) => H.antlerFrond(o, r, [24, 90], rad(-4), 360, 90, 0.35) },
  philodendron: { seed: 1223, draw: (o, r) => H.philodendron(o, r, [0, 0]), detail: (o, r) => H.heartLeaf(o, r, [40, 150], 0, 220) },
  olive: {
    seed: 1324,
    draw: (o, r) => M.olive(o, r, [0, 0]),
    detail: (o, r) => {
      [-130, -106, -82, -58].forEach((d, i) => M.oliveLeaf(o, r, [0, 0], rad(d), 110 - i * 5));
      M.oliveFruit(o, r, [22, 34], 17, true);
      M.oliveFruit(o, r, [-16, 40], 16, false);
    },
  },
  fig: {
    seed: 1425,
    draw: (o, r) => M.fig(o, r, [0, 0]),
    detail: (o, r) => {
      M.figLeaf(o, r, [0, 0], rad(-90), 220);
      M.figFruit(o, r, [170, -60], rad(70), 96);
    },
  },
  lemon: {
    seed: 1526,
    draw: (o, r) => M.lemon(o, r, [0, 0]),
    detail: (o, r) => {
      M.lemonFruit(o, r, [0, 0], 160, 0.12);
      M.lemonBlossom(o, r, [170, 40], 54, 0.3);
    },
  },
  pine: { seed: 1627, draw: (o, r) => M.pine(o, r, [0, 0]), detail: (o, r) => M.pineCone(o, r, [0, 0], 200, -0.15) },
  grapevine: { seed: 1728, draw: (o, r) => M.grapevine(o, r, [0, 0]), detail: (o, r) => M.grapeCluster(o, r, [0, 0], 260) },
  jasmine: {
    seed: 1829,
    draw: (o, r) => M.jasmine(o, r, [0, 0]),
    detail: (o, r) => {
      M.jasmineFlower(o, r, [0, 0], 80, 0.2);
      M.jasmineFlower(o, r, [110, 50], 60, 1.1);
    },
  },
  bougainvillea: { seed: 1930, draw: (o, r) => M.bougainvillea(o, r, [0, 0]), detail: (o, r) => M.bougainvilleaCluster(o, r, [0, 0], 120, 0.4) },
  cypress: { seed: 2031, draw: (o, r) => M.cypress(o, r, [0, 0]), detail: (o, r) => M.cypressColumn(o, r, [0, 0], 420, 92) },
  lavender: { seed: 2132, draw: (o, r) => M.lavender(o, r, [0, 0]), detail: (o, r) => M.lavenderSpike(o, r, [0, 0], rad(-90), 72) },
  rosemary: { seed: 2233, draw: (o, r) => M.rosemary(o, r, [0, 0]), detail: (o, r) => M.rosemaryStem(o, r, [0, 0], rad(-90), 300) },
  agave: { seed: 2334, draw: (o, r) => M.agave(o, r, [0, 0]), detail: (o, r) => M.agaveLeaf(o, r, [0, 0], rad(-80), 320, 0.04) },
  acanthus: { seed: 2435, draw: (o, r) => M.acanthus(o, r, [0, 0]), detail: (o, r) => M.acanthusLeaf(o, r, [0, 0], rad(-30), 320) },
  saguaro: {
    seed: 2536,
    draw: (o, r) => D.saguaro(o, r, [0, 0]),
    detail: (o, r) => {
      D.saguaroColumn(o, r, sample((t) => [0, -t * 320], 32), 140, 6);
      [[-0.5, -22], [0.1, 4], [0.62, 24]].forEach(([x, lean]) => D.saguaroFlower(o, r, [x * 70, -320 + Math.abs(x) * 25], 58, rad(lean)));
    },
  },
  opuntia: {
    seed: 2637,
    draw: (o, r) => D.opuntia(o, r, [0, 0]),
    detail: (o, r) => {
      const pad = D.opuntiaPad(o, r, [0, 0], rad(-90), 300);
      [[0.92, -0.6], [0.99, 0.05], [0.9, 0.66]].forEach(([s, v]) => D.opuntiaFruit(o, r, pad.at(s, v), pad.dir + v * 0.7, 40));
    },
  },
  ferocactus: {
    seed: 2738,
    draw: (o, r) => D.ferocactus(o, r, [0, 0]),
    detail: (o, r) => {
      const { crown } = D.barrelBody(o, r, [0, 0], 220, 230, rad(5));
      [-0.45, 0, 0.45].forEach((x) => D.barrelFlower(o, r, [crown[0] + x * 115, crown[1] + Math.abs(x) * 24], 48, x * 0.5));
    },
  },
  paloverde: {
    seed: 2839,
    draw: (o, r) => D.paloverde(o, r, [0, 0]),
    detail: (o, r) => {
      D.verdeTwig(o, r, [0, 0], rad(-24), 240, true, 2.2);
      D.mistletoe(o, r, [70, 30], 220);
    },
  },
  ocotillo: {
    seed: 2940,
    draw: (o, r) => D.ocotillo(o, r, [0, 0]),
    detail: (o, r) => {
      const cane = D.ocotilloStem(o, r, [0, 0], [10, -170], [30, -340]);
      D.ocotilloLeaves(o, r, cane.pts, 3, 24);
      D.ocotilloSpike(o, r, cane.pts[30], -1.5, 1.8);
    },
  },
  organpipe: {
    seed: 3041,
    draw: (o, r) => D.organpipe(o, r, [0, 0]),
    detail: (o, r) => {
      D.saguaroColumn(o, r, sample((t) => [0, -t * 280], 28), 84, 4);
      D.organpipeFlower(o, r, [-14, -276], 54, rad(-14));
      D.organpipeFlower(o, r, [20, -272], 46, rad(18));
    },
  },
  brittlebush: {
    seed: 3142,
    draw: (o, r) => D.brittlebush(o, r, [0, 0]),
    detail: (o, r) => {
      [-140, -100, -64].forEach((d) => D.brittlebushLeaf(o, r, [0, 0], rad(d), 150));
      D.brittlebushHead(o, r, [40, -230], 70);
    },
  },
  mesquite: {
    seed: 3243,
    draw: (o, r) => D.mesquite(o, r, [0, 0]),
    detail: (o, r) => {
      D.mesquiteLeaf(o, r, [0, 0], rad(-60), 240);
      D.catkin(o, r, [160, 10], rad(24), 110);
      D.mesquitePod(o, r, [-40, 30], 230, 1);
    },
  },
  cholla: {
    seed: 3344,
    draw: (o, r) => D.cholla(o, r, [0, 0]),
    detail: (o, r) => {
      D.chollaJoint(o, r, [0, 0], rad(-80), 210, 84);
      D.chollaFruit(o, r, [70, -90], 4, 0, 1.8);
    },
  },
  creosote: {
    seed: 3445,
    draw: (o, r) => D.creosote(o, r, [0, 0]),
    detail: (o, r) => {
      const stem = sample((t) => [t * 60 + Math.sin(t * 9) * 6, -t * 260], 26);
      o.push(`<path class="ink thin" d="M${stem.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L")}"/>`);
      D.creosoteLeaves(o, r, stem, 4, 2.4);
      D.creosoteFlower(o, r, [70, -272], 40);
      D.creosoteSeed(o, r, [-30, -150], 3);
    },
  },
  ibervillea: {
    seed: 3546,
    draw: (o, r) => D.ibervillea(o, r, [0, 0]),
    detail: (o, r) => {
      D.ibervilleaLeaf(o, r, [0, 0], rad(-90), 200);
      D.ibervilleaFruit(o, r, [170, 40], 42);
    },
  },
  groundsel: {
    seed: 3647,
    draw: (o, r) => A.groundsel(o, r, [0, 0]),
    detail: (o, r) => {
      RO.rosette(o, r, [0, 0], 190, 0, 40, A.GIANT);
      A.spentPanicle(o, r, [40, 0], 1, 320);
    },
  },
  sapling: {
    seed: 4657,
    draw: (o, r) => A.sapling(o, r, [0, 0]),
    detail: (o, r) => RO.rosette(o, r, [0, 0], 200, 0, 56, A.GIANT),
  },
  trimera: {
    seed: 4758,
    draw: (o, r) => A.trimera(o, r, [0, 0]),
    detail: (o, r) => {
      A.heathClump(o, r, [0, 0], 110, true);
      A.heathClump(o, r, [150, 60], 80, false);
    },
  },
  telekii: {
    seed: 3748,
    draw: (o, r) => A.telekii(o, r, [0, 0]),
    detail: (o, r) => {
      [[-1.1, 0.4], [-1.0, 2.2], [-0.9, 1.2], [-1.15, 3.6], [-0.95, 5]].forEach(([el, az]) => A.hairyBract(o, r, [0, 0], az, el, 240));
      A.lobeliaFlower(o, r, [10, 30], rad(20), 70);
    },
  },
  cabbage: {
    seed: 3849,
    draw: (o, r) => A.cabbage(o, r, [0, 0]),
    detail: (o, r) => {
      RO.rosette(o, r, [0, 0], 200, 0, 40, A.CABBAGE);
      A.noddingHead(o, r, [230, -120], 90, rad(15));
    },
  },
  heath: {
    seed: 3950,
    draw: (o, r) => A.heath(o, r, [0, 0]),
    detail: (o, r) => {
      A.plume(o, r, [0, 0], rad(-70), 300, true);
      A.usnea(o, r, [60, -120], 300);
    },
  },
  thistle: {
    seed: 4051,
    draw: (o, r) => A.thistle(o, r, [0, 0]),
    detail: (o, r) => {
      A.thistleLeaf(o, r, [0, 0], rad(-20), 300);
      A.thistleHead(o, r, [150, -150], 120, 0.1);
    },
  },
  alchemilla: {
    seed: 4152,
    draw: (o, r) => A.alchemilla(o, r, [0, 0]),
    detail: (o, r) => A.alchemillaSprig(o, r, [0, 0], rad(-60), 300),
  },
  gregoriana: {
    seed: 4253,
    draw: (o, r) => A.gregoriana(o, r, [0, 0]),
    detail: (o, r) => {
      RO.rosette(o, r, [0, 0], 170, 0, 36, A.GLOSSY);
      [[150, -150, -20], [180, -100, -10], [140, -60, -30]].forEach(([x, y, d]) => A.lobeliaFlower(o, r, [x, y], rad(d), 60));
    },
  },
  helichrysum: {
    seed: 4354,
    draw: (o, r) => A.helichrysum(o, r, [0, 0]),
    detail: (o, r) => [[0, 0], [90, 20], [40, -80]].forEach(([x, y]) => A.everlasting(o, r, [x, y], 90)),
  },
  tussock: {
    seed: 4455,
    draw: (o, r) => A.tussock(o, r, [0, 0]),
    detail: (o, r) => A.tussock(o, r, [0, 0]),
  },
  haplocarpha: {
    seed: 4556,
    draw: (o, r) => A.haplocarpha(o, r, [0, 0]),
    detail: (o, r) => {
      RO.rosette(o, r, [0, 0], 160, 0, 30, A.FLAT);
      A.daisy(o, r, [60, -130], 130, 0.55);
    },
  },
  baobab: {
    seed: 4859,
    draw: (o, r) => S.baobab(o, r, [0, 0]),
    detail: (o, r) => {
      S.baobabFlower(o, r, [100, -180], 115, 115, 1);
      [-150, -110, -70].forEach((d, k) => S.baobabLeaf(o, r, [-120 + k * 34, 40], (d * Math.PI) / 180, 145));
    },
  },
  thorn: {
    seed: 4960,
    draw: (o, r) => S.thorn(o, r, [0, 0]),
    detail: (o, r) => {
      S.puffball(o, r, [0, 0], 40);
      S.coiledPod(o, r, [120, -60], 70);
    },
  },
  kigelia: {
    seed: 5061,
    draw: (o, r) => S.kigelia(o, r, [0, 0]),
    detail: (o, r) => {
      S.pinnateLeaf(o, r, [0, 0], (-60 * Math.PI) / 180, 300, 3);
      S.sausage(o, r, [200, -200], 60, 300, 70, 1);
    },
  },
  marula: {
    seed: 5162,
    draw: (o, r) => S.marula(o, r, [0, 0]),
    detail: (o, r) => S.pinnateLeaf(o, r, [0, 0], (-60 * Math.PI) / 180, 320, 5, 0.34),
  },
  gloriosa: {
    seed: 5263,
    draw: (o, r) => S.gloriosa(o, r, [0, 0]),
    detail: (o, r) => S.gloriosaFlower(o, r, [0, 0], 260, 0.15),
  },
  redgrass: {
    seed: 5364,
    draw: (o, r) => S.redgrass(o, r, [0, 0]),
    detail: (o, r) => S.redgrassDetail(o, r, [0, 0]),
  },
  thatchgrass: {
    seed: 5465,
    draw: (o, r) => S.thatchgrass(o, r, [0, 0]),
    detail: (o, r) => S.thatchgrassDetail(o, r, [0, 0]),
  },
  crinum: {
    seed: 5566,
    draw: (o, r) => S.crinum(o, r, [0, 0]),
    detail: (o, r) => S.crinumFlower(o, r, [0, 0], (20 * Math.PI) / 180, 300),
  },
  hypoxis: {
    seed: 5667,
    draw: (o, r) => S.hypoxis(o, r, [0, 0]),
    detail: (o, r) => {
      S.star(o, r, [0, 0], 120, 0.8);
      S.star(o, r, [200, 60], 80, 0.6);
    },
  },
  kingprotea: {
    seed: 5768,
    draw: (o, r) => F.kingprotea(o, r, [0, 0]),
    detail: (o, r) => F.kingProteaDetail(o, r),
  },
  silvertree: {
    seed: 5869,
    draw: (o, r) => F.silvertree(o, r, [0, 0]),
    detail: (o, r) => F.silverRosette(o, r, [0, 0], rad(-65), 165, true),
  },
  sugarbush: {
    seed: 5970,
    draw: (o, r) => F.sugarbush(o, r, [0, 0]),
    detail: (o, r) => {
      F.repensHead(o, r, [-60, 70], rad(-82), 185, false);
      F.cassytha(o, r, [70, -70], 240);
    },
  },
  pincushion: {
    seed: 6071,
    draw: (o, r) => F.pincushion(o, r, [0, 0]),
    detail: (o, r) => {
      F.pincushionLeaf(o, r, [-90, 95], rad(-135), 115, -0.02);
      F.pincushionLeaf(o, r, [90, 95], rad(-45), 115, 0.02);
      F.pincushionHead(o, r, [0, 50], rad(4), 145);
    },
  },
  pagoda: {
    seed: 6172,
    draw: (o, r) => F.pagoda(o, r, [0, 0]),
    detail: (o, r) => {
      F.pagodaHood(o, r, [0, 80], -1, 105);
      F.pagodaHood(o, r, [0, 15], 1, 100);
      F.pagodaHood(o, r, [0, -50], -1, 92);
    },
  },
  restio: {
    seed: 6273,
    draw: (o, r) => F.restio(o, r, [0, 0]),
    detail: (o, r) => F.restioDetail(o, r),
  },
  watsonia: {
    seed: 6374,
    draw: (o, r) => F.watsonia(o, r, [0, 0]),
    detail: (o, r) => {
      F.watsoniaFlower(o, r, [0, 80], -1, 130);
      F.watsoniaFlower(o, r, [0, 15], 1, 125);
      F.watsoniaFlower(o, r, [0, -50], -1, 115);
    },
  },
  fireheath: {
    seed: 6475,
    draw: (o, r) => F.fireheath(o, r, [0, 0]),
    detail: (o, r) => F.fireheathUmbel(o, r, [0, -20], rad(8), 95),
  },
  phaenocoma: {
    seed: 6576,
    draw: (o, r) => F.phaenocoma(o, r, [0, 0]),
    detail: (o, r) => {
      F.phaenocomaHead(o, r, [-55, 25], 88, 0.65);
      F.phaenocomaHead(o, r, [65, -35], 76, 0.58);
    },
  },
  pelargonium: {
    seed: 6677,
    draw: (o, r) => F.pelargonium(o, r, [0, 0]),
    detail: (o, r) => {
      F.pelargoniumLeaf(o, r, [-65, 55], 78, rad(-115), 0);
      F.pelargoniumFlower(o, r, [45, -35], 92, rad(10));
      F.pelargoniumFlower(o, r, [-35, -55], 78, rad(-14));
    },
  },
  berzelia: {
    seed: 6778,
    draw: (o, r) => F.berzelia(o, r, [0, 0]),
    detail: (o, r) => F.berzeliaCorymb(o, r, [0, 80], rad(4), 125),
  },
  aristea: {
    seed: 6879,
    draw: (o, r) => F.aristea(o, r, [0, 0]),
    detail: (o, r) => F.aristeaDetail(o, r),
  },
  quivertree: {
    seed: 6980,
    draw: (o, r) => N.quivertree(o, r, [0, 0]),
    detail: (o, r) => N.quivertreeDetail(o, r),
  },
  halfmens: {
    seed: 7081,
    draw: (o, r) => N.halfmens(o, r, [0, 0]),
    detail: (o, r) => N.halfmensDetail(o, r),
  },
  buttertree: {
    seed: 7182,
    draw: (o, r) => N.buttertree(o, r, [0, 0]),
    detail: (o, r) => N.buttertreeDetail(o, r),
  },
  damara: {
    seed: 7283,
    draw: (o, r) => N.damara(o, r, [0, 0]),
    detail: (o, r) => N.damaraDetail(o, r),
  },
  gifboom: {
    seed: 7384,
    draw: (o, r) => N.gifboom(o, r, [0, 0]),
    detail: (o, r) => N.gifboomDetail(o, r),
  },
  nara: {
    seed: 7485,
    draw: (o, r) => N.nara(o, r, [0, 0]),
    detail: (o, r) => N.naraDetail(o, r),
  },
  welwitschia: {
    seed: 7586,
    draw: (o, r) => N.welwitschia(o, r, [0, 0]),
    detail: (o, r) => N.welwitschiaDetail(o, r),
  },
  dunegrass: {
    seed: 7687,
    draw: (o, r) => N.dunegrass(o, r, [0, 0]),
    detail: (o, r) => N.dunegrassDetail(o, r),
  },
  bushmanscandle: {
    seed: 7788,
    draw: (o, r) => N.bushmanscandle(o, r, [0, 0]),
    detail: (o, r) => N.bushmanscandleDetail(o, r),
  },
  hoodia: {
    seed: 7889,
    draw: (o, r) => N.hoodia(o, r, [0, 0]),
    detail: (o, r) => N.hoodiaDetail(o, r),
  },
  lithops: {
    seed: 7990,
    draw: (o, r) => N.lithops(o, r, [0, 0]),
    detail: (o, r) => N.lithopsDetail(o, r),
  },
  redmangrove: {
    seed: 8091,
    draw: (o, r) => MG.redmangrove(o, r, [0, 0]),
    detail: (o, r) => MG.redmangroveDetail(o, r),
  },
  blackmangrove: {
    seed: 8192,
    draw: (o, r) => MG.blackmangrove(o, r, [0, 0]),
    detail: (o, r) => MG.blackmangroveDetail(o, r),
  },
  whitemangrove: {
    seed: 8293,
    draw: (o, r) => MG.whitemangrove(o, r, [0, 0]),
    detail: (o, r) => MG.whitemangroveDetail(o, r),
  },
  buttonwood: {
    seed: 8394,
    draw: (o, r) => MG.buttonwood(o, r, [0, 0]),
    detail: (o, r) => MG.buttonwoodDetail(o, r),
  },
  spanishmoss: {
    seed: 8495,
    draw: (o, r) => MG.spanishmoss(o, r, [0, 0]),
    detail: (o, r) => MG.spanishmossDetail(o, r),
  },
  airplant: {
    seed: 8596,
    draw: (o, r) => MG.airplant(o, r, [0, 0]),
    detail: (o, r) => MG.airplantDetail(o, r),
  },
  leatherfern: {
    seed: 8697,
    draw: (o, r) => MG.leatherfern(o, r, [0, 0]),
    detail: (o, r) => MG.leatherfernDetail(o, r),
  },
  cordgrass: {
    seed: 8798,
    draw: (o, r) => MG.cordgrass(o, r, [0, 0]),
    detail: (o, r) => MG.cordgrassDetail(o, r),
  },
  swamplily: {
    seed: 8899,
    draw: (o, r) => MG.swamplily(o, r, [0, 0]),
    detail: (o, r) => MG.swamplilyDetail(o, r),
  },
  morningglory: {
    seed: 8901,
    draw: (o, r) => MG.morningglory(o, r, [0, 0]),
    detail: (o, r) => MG.morninggloryDetail(o, r),
  },
  saltwort: {
    seed: 9012,
    draw: (o, r) => MG.saltwort(o, r, [0, 0]),
    detail: (o, r) => MG.saltwortDetail(o, r),
  },
  seapurslane: {
    seed: 9123,
    draw: (o, r) => MG.seapurslane(o, r, [0, 0]),
    detail: (o, r) => MG.seapurslaneDetail(o, r),
  },  ginkgo: {
    seed: 9411,
    draw: (o, r) => E.ginkgo(o, r, [0, 0]),
    detail: (o, r) => E.ginkgoSpurDetail(o, r),
  },  maple: {
    seed: 9512,
    draw: (o, r) => E.maple(o, r, [0, 0]),
    detail: (o, r) => E.mapleDetail(o, r),
  },  plum: {
    seed: 9613,
    draw: (o, r) => E.plum(o, r, [0, 0]),
    detail: (o, r) => E.plumDetail(o, r),
  },  paulownia: {
    seed: 9714,
    draw: (o, r) => E.paulownia(o, r, [0, 0]),
    detail: (o, r) => E.paulowniaDetail(o, r),
  },  willow: {
    seed: 9815,
    draw: (o, r) => E.willow(o, r, [0, 0]),
    detail: (o, r) => E.willowDetail(o, r),
  },  moso: {
    seed: 9916,
    draw: (o, r) => E.moso(o, r, [0, 0]),
    detail: (o, r) => E.mosoDetail(o, r),
  },  wisteria: {
    seed: 10017,
    draw: (o, r) => E.wisteria(o, r, [0, 0]),
    detail: (o, r) => E.wisteriaDetail(o, r),
  },  akebia: {
    seed: 10118,
    draw: (o, r) => E.akebia(o, r, [0, 0]),
    detail: (o, r) => E.akebiaDetail(o, r),
  },  peony: {
    seed: 10219,
    draw: (o, r) => E.peony(o, r, [0, 0]),
    detail: (o, r) => E.peonyDetail(o, r),
  },
  hydrangea: {
    seed: 10320,
    draw: (o, r) => E.hydrangea(o, r, [0, 0]),
    detail: (o, r) => E.hydrangeaDetail(o, r),
  },
  lycoris: {
    seed: 10421,
    draw: (o, r) => E.lycoris(o, r, [0, 0]),
    detail: (o, r) => E.lycorisDetail(o, r),
  },
  iris: {
    seed: 10522,
    draw: (o, r) => E.iris(o, r, [0, 0]),
    detail: (o, r) => E.irisDetail(o, r),
  },
  lotus: {
    seed: 10623,
    draw: (o, r) => E.lotus(o, r, [0, 0]),
    detail: (o, r) => E.lotusDetail(o, r),
  },
  spruce: {
    seed: 11001,
    draw: (o, r) => TG.spruce(o, r, [0, 0]),
    detail: (o, r) => TG.spruceDetail(o, r),
  },
  larch: {
    seed: 11102,
    draw: (o, r) => TG.larch(o, r, [0, 0]),
    detail: (o, r) => TG.larchDetail(o, r),
  },
  birch: {
    seed: 11203,
    draw: (o, r) => TG.birch(o, r, [0, 0]),
    detail: (o, r) => TG.birchDetail(o, r),
  },
  scotspine: {
    seed: 11304,
    draw: (o, r) => TG.scotspine(o, r, [0, 0]),
    detail: (o, r) => TG.scotspineDetail(o, r),
  },
  methuselah: {
    seed: 11405,
    draw: (o, r) => TG.methuselah(o, r, [0, 0]),
    detail: (o, r) => TG.methuselahDetail(o, r),
  },
  horsehair: {
    seed: 11506,
    draw: (o, r) => TG.horsehair(o, r, [0, 0]),
    detail: (o, r) => TG.horsehairDetail(o, r),
  },
  fireweed: {
    seed: 11607,
    draw: (o, r) => TG.fireweed(o, r, [0, 0]),
    detail: (o, r) => TG.fireweedDetail(o, r),
  },
  labradortea: {
    seed: 11708,
    draw: (o, r) => TG.labradortea(o, r, [0, 0]),
    detail: (o, r) => TG.labradorteaDetail(o, r),
  },
  horsetail: {
    seed: 11809,
    draw: (o, r) => TG.horsetail(o, r, [0, 0]),
    detail: (o, r) => TG.horsetailDetail(o, r),
  },
  lingonberry: {
    seed: 11910,
    draw: (o, r) => TG.lingonberry(o, r, [0, 0]),
    detail: (o, r) => TG.lingonberryDetail(o, r),
  },
  cloudberry: {
    seed: 12011,
    draw: (o, r) => TG.cloudberry(o, r, [0, 0]),
    detail: (o, r) => TG.cloudberryDetail(o, r),
  },
  twinflower: {
    seed: 12112,
    draw: (o, r) => TG.twinflower(o, r, [0, 0]),
    detail: (o, r) => TG.twinflowerDetail(o, r),
  },
  tuliptree: {
    seed: 13001,
    draw: (o, r) => AM.tuliptree(o, r, [0, 0]),
    detail: (o, r) => AM.tuliptreeDetail(o, r),
  },
  sugarmaple: {
    seed: 13102,
    draw: (o, r) => AM.sugarmaple(o, r, [0, 0]),
    detail: (o, r) => AM.sugarmapleDetail(o, r),
  },
  redbud: {
    seed: 13203,
    draw: (o, r) => AM.redbud(o, r, [0, 0]),
    detail: (o, r) => AM.redbudDetail(o, r),
  },
  walnut: {
    seed: 13304,
    draw: (o, r) => AM.walnut(o, r, [0, 0]),
    detail: (o, r) => AM.walnutDetail(o, r),
  },
  creeper: {
    seed: 13405,
    draw: (o, r) => AM.creeper(o, r, [0, 0]),
    detail: (o, r) => AM.creeperDetail(o, r),
  },
  trumpetvine: {
    seed: 13506,
    draw: (o, r) => AM.trumpetvine(o, r, [0, 0]),
    detail: (o, r) => AM.trumpetvineDetail(o, r),
  },
  dutchmanspipe: {
    seed: 13607,
    draw: (o, r) => AM.dutchmanspipe(o, r, [0, 0]),
    detail: (o, r) => AM.dutchmanspipeDetail(o, r),
  },
  compassplant: {
    seed: 13708,
    draw: (o, r) => AM.compassplant(o, r, [0, 0]),
    detail: (o, r) => AM.compassplantDetail(o, r),
  },
  bluestem: {
    seed: 13809,
    draw: (o, r) => AM.bluestem(o, r, [0, 0]),
    detail: (o, r) => AM.bluestemDetail(o, r),
  },
  milkweed: {
    seed: 13910,
    draw: (o, r) => AM.milkweed(o, r, [0, 0]),
    detail: (o, r) => AM.milkweedDetail(o, r),
  },
  blazingstar: {
    seed: 14011,
    draw: (o, r) => AM.blazingstar(o, r, [0, 0]),
    detail: (o, r) => AM.blazingstarDetail(o, r),
  },
  coneflower: {
    seed: 14112,
    draw: (o, r) => AM.coneflower(o, r, [0, 0]),
    detail: (o, r) => AM.coneflowerDetail(o, r),
  },
  oak: {
    seed: 15001,
    draw: (o, r) => WL.oak(o, r, [0, 0]),
    detail: (o, r) => WL.oakDetail(o, r),
  },
  hazel: {
    seed: 15102,
    draw: (o, r) => WL.hazel(o, r, [0, 0]),
    detail: (o, r) => WL.hazelDetail(o, r),
  },
  hawthorn: {
    seed: 15203,
    draw: (o, r) => WL.hawthorn(o, r, [0, 0]),
    detail: (o, r) => WL.hawthornDetail(o, r),
  },
  holly: {
    seed: 15304,
    draw: (o, r) => WL.holly(o, r, [0, 0]),
    detail: (o, r) => WL.hollyDetail(o, r),
  },
  ivy: {
    seed: 15405,
    draw: (o, r) => WL.ivy(o, r, [0, 0]),
    detail: (o, r) => WL.ivyDetail(o, r),
  },
  oldmansbeard: {
    seed: 15506,
    draw: (o, r) => WL.oldmansbeard(o, r, [0, 0]),
    detail: (o, r) => WL.oldmansbeardDetail(o, r),
  },
  honeysuckle: {
    seed: 15607,
    draw: (o, r) => WL.honeysuckle(o, r, [0, 0]),
    detail: (o, r) => WL.honeysuckleDetail(o, r),
  },
  bracken: {
    seed: 15708,
    draw: (o, r) => WL.bracken(o, r, [0, 0]),
    detail: (o, r) => WL.brackenDetail(o, r),
  },
  foxglove: {
    seed: 15809,
    draw: (o, r) => WL.foxglove(o, r, [0, 0]),
    detail: (o, r) => WL.foxgloveDetail(o, r),
  },
  gorse: {
    seed: 15910,
    draw: (o, r) => WL.gorse(o, r, [0, 0]),
    detail: (o, r) => WL.gorseDetail(o, r),
  },
  hartstongue: {
    seed: 16011,
    draw: (o, r) => WL.hartstongue(o, r, [0, 0]),
    detail: (o, r) => WL.hartstongueDetail(o, r),
  },
  bluebell: {
    seed: 16112,
    draw: (o, r) => WL.bluebell(o, r, [0, 0]),
    detail: (o, r) => WL.bluebellDetail(o, r),
  },
};

// Bounding box from the absolute coordinates in path data, read before it is compacted.
function bbox(markup: string) {
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [, d] of markup.matchAll(/ d="([^"]+)"/g)) {
    const nums = d.replace(/h[-\d.]+/g, "").match(/-?\d*\.?\d+/g) ?? [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = +nums[i];
      const y = +nums[i + 1];
      box[0] = Math.min(box[0], x);
      box[1] = Math.min(box[1], y);
      box[2] = Math.max(box[2], x);
      box[3] = Math.max(box[3], y);
    }
  }
  return box;
}

// Which cells of a grid over the plant's box are painted: every wash shape filled even-odd,
// its outline taken from the path's points. FIELD cells span the longer side.
const FIELD = 40;
function field(markup: string, vb: number[]): [number, number, string] {
  const s = Math.max(vb[2], vb[3]) / FIELD;
  const cols = Math.round(vb[2] / s);
  const rows = Math.round(vb[3] / s);
  const cw = vb[2] / cols;
  const ch = vb[3] / rows;
  const on = new Uint8Array(cols * rows);
  for (const [, d] of markup.matchAll(/class="wash[^"]*"[^>]* d="([^"]+)"/g)) {
    if (/[aAhHvV]/.test(d)) continue;
    const rings = d.split("M").filter(Boolean).map((sub) => {
      const nums = sub.match(/-?\d*\.?\d+/g)!.map(Number);
      const ring: Pt[] = [];
      for (let i = 0; i + 1 < nums.length; i += 2) ring.push([nums[i], nums[i + 1]]);
      return ring;
    });
    const fill = new Uint8Array(cols * rows);
    for (let j = 0; j < rows; j++) {
      const y = vb[1] + (j + 0.5) * ch;
      for (const ring of rings)
        for (let k = 0; k < ring.length; k++) {
          const [x0, y0] = ring[k];
          const [x1, y1] = ring[(k + 1) % ring.length];
          if (y0 > y === y1 > y) continue;
          const x = x0 + ((y - y0) / (y1 - y0)) * (x1 - x0);
          const start = Math.max(0, Math.ceil((x - vb[0]) / cw - 0.5));
          for (let i = start; i < cols; i++) fill[j * cols + i] ^= 1;
        }
    }
    fill.forEach((v, i) => (on[i] |= v));
  }
  let hex = "";
  for (let i = 0; i < on.length; i += 4) hex += ((on[i] << 3) | (on[i + 1] << 2) | (on[i + 2] << 1) | on[i + 3]).toString(16);
  return [cols, rows, hex];
}

// Parts (leaves, flowers, fruit, thorns) whose timing their limb contradicts: one that would
// appear before the limb it sits on has grown to it, or stay after that limb has died back. A part
// counts as sitting on a limb when it attaches within that limb's half width of its spine, past
// its base.
function mistimedParts(markup: string) {
  const limbs = [...markup.matchAll(/class="gl" data-g0="([-\d.]+)" data-g1="([-\d.]+)"(?: data-d="([-\d.]+)")? data-sp="([^"]+)"/g)].map(([, g0, g1, d, sp]) => {
    const v = sp.split(" ").map(Number);
    const pts: number[][] = [];
    for (let i = 0; i < v.length; i += 3) pts.push([v[i], v[i + 1], v[i + 2]]);
    let len = 0;
    const along = pts.map((p, i) => (i ? (len += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])) : 0));
    return { g0: +g0, g1: +g1, d: d === undefined ? Infinity : +d, pts, along, len };
  });
  const faults: string[] = [];
  for (const [, g, leave, o] of markup.matchAll(/class="gp" data-g="([-\d.]+)"(?: data-d="([-\d.]+)")? data-o="([^"]+)"/g)) {
    const [x, y] = o.split(" ").map(Number);
    let best = null as { dist: number; arrives: number; dies: number } | null;
    for (const limb of limbs)
      limb.pts.forEach((p, i) => {
        const dist = Math.hypot(p[0] - x, p[1] - y);
        if (i > 0 && dist <= p[2] + 6 && (!best || dist < best.dist)) best = { dist, arrives: limb.g0 + (limb.g1 - limb.g0) * (limb.along[i] / limb.len), dies: limb.d };
      });
    if (!best) continue;
    if (+g < best.arrives - 0.01) faults.push(`${o} opens at ${g}, before its limb arrives at ${best.arrives.toFixed(3)}`);
    const goes = leave === undefined ? Infinity : +leave;
    if (goes > best.dies + 0.01) faults.push(`${o} stays until ${leave ?? "the end"}, after its limb dies back at ${best.dies}`);
  }
  return faults;
}

// One drawing as a file: viewBox from the bounding box, path data compacted.
function render(fn: Drawing, seed: number) {
  const parts: string[] = [];
  fn(parts, rng(seed));
  const markup = parts.join("");
  const [x0, y0, x1, y1] = bbox(markup);
  const pad = 8;
  const vb = [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2].map((n) => Math.round(n));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}" aria-hidden="true" focusable="false">${markup.replace(/ d="([^"]+)"/g, (_, d) => ` d="${compact(d)}"`)}</svg>\n`;
  return { markup, vb, svg };
}

function writeIfChanged(url: URL, content: string) {
  try {
    if (readFileSync(url, "utf8") === content) return;
  } catch {}
  writeFileSync(url, content);
}

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const onlyGarden = args.find((a) => !a.startsWith("-"));

const out = new URL("../public/garden/", import.meta.url);
const details = new URL("../gallery/details/", import.meta.url);
if (!checkOnly) {
  mkdirSync(out, { recursive: true });
  mkdirSync(details, { recursive: true });
}
const css = ["/* Generated by garden/draw/draw.ts: each plant's aspect ratio, anchor, and species tone. */"];
const fields: Record<string, [number, number, string]> = {};
for (const { name, garden, turn } of REGISTRY) {
  if (onlyGarden && garden !== onlyGarden) continue;
  const plant = PLANTS[name];
  if (!plant) throw new Error(`plants.json lists ${name}, but draw.ts has no drawing for it`);
  const { markup, vb, svg } = render(plant.draw, plant.seed);
  const faults = mistimedParts(markup);
  if (faults.length) throw new Error(`${name}: ${faults.length} parts are timed against their limb, for example ${faults[0]}`);
  const detailSvg = render(plant.detail, plant.seed + 1).svg;
  if (!checkOnly) {
    writeIfChanged(new URL(`${name}.svg`, out), svg);
    writeIfChanged(new URL(`${name}.svg`, details), detailSvg);
  }
  const bx = (-vb[0] / vb[2]).toFixed(4);
  const by = (-vb[1] / vb[3]).toFixed(4);
  // A plant that turns in autumn mixes its autumn tone in by --turn, which the page writes.
  const leaf = turn ? `color-mix(in oklch, var(--pl-${name}-autumn) calc(var(--turn, 0) * 100%), var(--pl-${name}))` : `var(--pl-${name})`;
  css.push(`.g-${name} { --ar: ${(vb[2] / vb[3]).toFixed(4)}; --bx: ${bx}; --by: ${by}; --leaf: ${leaf}; }`);
  fields[name] = field(markup, vb);
  console.log(`${name.padEnd(14)} ${String(markup.length).padStart(7)} bytes  vb=[${vb.join(" ")}]  ar=${(vb[2] / vb[3]).toFixed(3)} bx=${bx} by=${by}`);
}
if (!checkOnly && !onlyGarden) {
  writeIfChanged(new URL("../src/garden/anchors.css", import.meta.url), css.join("\n") + "\n");
  writeIfChanged(
    new URL("../src/garden/fields.ts", import.meta.url),
    "// Generated by garden/draw/draw.ts: where each plant paints, as [cols, rows, hex bits] over its box.\n" +
      "export const FIELDS: Record<string, [number, number, string]> = {\n" +
      Object.entries(fields).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`).join("\n") +
      "\n};\n",
  );
}

