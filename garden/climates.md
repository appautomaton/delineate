# Climates

Gardens beyond the tropical and the Mediterranean, from a survey of their plants (October 2026).
The survey was written from memory: research how each plant looks before it enters
`src/garden/plants.json` (the skill's `ref/botany.md`), and doubt those marked (?) most.

## Status

- **Built, 8 of 12:** tropical, Mediterranean, Sonoran Desert, Afroalpine, Cape fynbos, Lowveld
  savanna, Namib and Namaqualand, and the mangrove, the first with water.
- **In progress:** East Asian, the first four-season garden, with lotus and rabbit-ear iris on a
  still pond. Scaffolded with its signature plant, the ginkgo, at one moment (late spring), a side
  tree from the left edge; the seasons system comes next (see Seasons).
- **Waiting for seasons:** boreal taiga, Eastern North American edge, Northwest European
  woodland.

## The test

A garden earns its place if it can be told from every other by silhouette alone, before color.
Every plant must be real and grown in the climate, wild or cultivated; a garden need not keep to
one place. Each holds about twelve plants in three roles: **side** (about 4, branches reaching in
from an edge), **hanging** (2 or 3, entering from the top on a host drawn with them, a bough or an
arbor beam; open land has none), **bed** (about 5, rising from the bottom).

## Ranking

| # | Garden | Köppen | Reads by | Weakness |
|---|---|---|---|---|
| 1 | Sonoran Desert | BWh | ribbed columns with raised arms, stacked pads, bare whips | none |
| 2 | East Asian | Cfa | ringed culms, fan leaves, falling racemes, raised shield leaves | none; brings a bare winter |
| 3 | Afroalpine | ET | giant rosettes on bare columns, towering spikes | unfamiliar; only lichens hang |
| 4 | Mangrove | Aw | arched stilt roots, pegs from the mud, curtains of Spanish moss | needs a waterline |
| 5 | Cape fynbos | Csb | domed bract heads, fountains of reeds | the Mediterranean's climate; told apart by flower form only |
| 6 | Lowveld savanna | Aw | flat parasol crowns, a swollen trunk, hanging sausage fruit | aloe and euphorbia repeat the deserts |
| 7 | Boreal taiga | Dfc | tiered spires of drooping whorls, white trunks | the spire nears the cypress |
| 8 | Namib and Namaqualand | BWk | forked trunks tipped with rosettes, two-strap welwitschia | a second desert; almost nothing hangs |
| 9 | Eastern North American edge | Dfa | squared leaves, tall prairie spikes | weak |
| 10 | Northwest European woodland | Cfb | ferns, ivy, foxglove | weakest: reads as generic green woodland |

**Order:** single-moment gardens first, simple to complex, then water, then seasons; Status
says where that stands.

## What the survey taught

- **Open land has no top.** Deserts, tundra, and savanna have almost nothing that truly hangs;
  the survey filled the role with standing plants (cholla fruit chains, nara, twinflower, beach
  morning glory). The three roles come from gardens with a canopy. In open gardens, leave the top
  to the sky: emptiness is the climate's character, and a standing plant drawn as a hanger floats.
- **Geometry compounds.** `draw/` already covers much of the survey: `tendril`, `trailingStem`
  and `heartLeaf`, `palmate`, `needleTuft` and `pineCone`, `lavenderSpike`, `agaveLeaf` (a
  rosette's leaf), `walkFrond`. New geometry, by reach:
  - ribbed column with areoles and spines: saguaro, organ pipe, barrel cactus (built);
    Euphorbia virosa (built); Euphorbia ingens (dropped)
  - jointed segments: prickly pear pads, cholla joints (built); Cissus quadrangularis;
    horsetail; bamboo culms (four gardens)
  - rosette in space (`draw/rosette.ts`): giant groundsel, quiver tree (built); halfmens (built,
    drawn flat)
  - curtain of strands: Usnea lichen, Cassytha dodder, Spanish moss (all built); weeping willow;
    taiga beard lichens (five gardens)
  - bipinnate leaflets: mesquite, palo verde, umbrella thorn (all built)
  - one garden each: prop roots and pegs (mangrove, built), bract heads (fynbos, built), dichotomous
    fan (East Asian), pendant raceme (wisteria)
- **Overlaps to settle when choosing.** Candelabra euphorbias (settled: dropped from savanna, built
  in Namib as `Euphorbia virosa` hosting `Tapinanthus oleifolius`); aloe rosettes (settled: dropped
  from savanna, built in Namib as `Aloidendron dichotomum`); mistletoe (settled: leafless coral-red
  `Phoradendron californicum` on Sonoran palo verde vs leafy grey-green and crimson-tubed
  `Tapinanthus oleifolius` erupting from Namib `Euphorbia virosa`); Sesuvium (settled: dropped from
  Namib in favor of `Monsonia crassicaulis` and `Hoodia gordonii`, built in mangrove as `Sesuvium
  portulacastrum`); Crinum (settled: bell-flowered pink-striped `Crinum macowanii` in savanna vs
  spider-tepaled white `Crinum americanum` in mangrove); silver birch (taiga, northwest Europe);
  beard lichens (Afroalpine, taiga); Erica (settled: woody tree `Erica arborea` and cushion
  `E. trimera` in Afroalpine vs scarlet tubular fire-heath `E. cerinthoides` in fynbos); Clematis
  (settled: dropped from fynbos, kept for northwest Europe).

## What the desert taught

- **Roles follow the drawing, not the survey.** The saguaro moved from side to bed, where it
  carries the height. Mistletoe hangs from the palo verde's limbs inside that plant's drawing
  instead of standing as a plant of its own; cholla stands in the bed; ibervillea trails in along
  the ground. The garden has eleven plants, and nothing hangs from the top.
- **Corners make sides.** A plant rooted just past a corner of the frame, its base hidden, reads
  as reaching in from that edge, and the layout solver treats it as a side plant. Ocotillo and
  creosote sweep in this way from the bottom corners without a redrawn side form.
- **The ground is never drawn.** Bed plants root a few units below the frame
  (`calc(100svh + var(--u) * n)` in the layout file), so a plant rises from whatever lies off the
  frame.
- **Open ground is part of the composition.** On a 1440 by 900 laptop the bed leaves a wide gap
  between the barrel and the organ pipe. Wider screens add plants into the gaps (creosote from
  1200 pixels wide; cholla, brittlebush, and ibervillea from 1600); narrower ones keep the
  emptiness.

## What the Afroalpine taught

- **Research, draw the signature plant, draw the rest, compose.** The check replaced six of the
  survey's twelve plants before a line was drawn. The giant groundsel took five rounds; once
  it set the manner, the others took two or three each. Judge each plant in the token gallery, day
  and night side by side, before placing it; the layout comes last and is only CSS.
- **Rosettes and whorls are modeled in space.** A flat fan of leaves reads as a paper fan or a
  succulent. `rosette()` sets leaves round a crown at the golden angle, raises each by its age,
  projects them from a little above, and draws them far to near; a `Habit` tunes it per plant.
  Heads on a spike take the same placement round their axis, the far ones behind it: evenly
  spaced heads read as a ladder.
- **Mass comes from the parts, not a blob.** A body shape behind a shrub reads as a rock. Give each
  stem or twig its own soft body (the heath plumes and clumps, the everlasting's stems), or let
  density carry it (the lady's mantle).
- **Needles need depth.** Needles stroked two ways read as a fern; whorls projected round the twig
  over a darker body read as a heath.
- **Legibility over scale.** A flower under about eight pixels at garden size vanishes: enlarge
  the flower, not the plant.
- **Forks hide their seams.** A branch's hem of leaf tips hangs over the stem it leaves, in
  hairline ink; a capped dome reads as a pipe.
- **Detail no one sees need not be drawn.** Ten segments a leaf are as smooth once the curve runs
  through them.
- **Empty sides take real wood.** Fill a thin edge with a woody plant rooted past the frame (the
  young groundsel, the Mount Kenya heath), never with a hanger from the sky.

## What the savanna taught

- **A garden can enter, not only grow.** Each savanna plant starts off its place (`--enter` in the
  layout, as shares of its own size) and eases in as it grows, so the garden opens wide and fills
  as the visitor scrolls. Gardens that do not set it are unchanged: the motion is the garden's to
  choose, since it only displays the tokens.
- **A trunk that forks hides its neck under its limbs, and sets `shadeFrom` at the neck.** The
  baobab's limbs start well inside the neck and are drawn over it, without ink across the top;
  started at its edge, they poke out as hard cuts. Because the trunk outline is open at the top
  (`closed: false`), `shape()`'s default shadow polygon would connect the upper-left neck corner to
  the lower-right base and slice a diagonal shadow stripe across the trunk; passing `shadeFrom` at
  the upper-right neck index keeps the shadow strictly along the right trunk wall.
- **Never back compound leaves with a circular `.wash` blob.** Because `.garden .wash` carries a
  darker `0.7px` stroke even when `ink: false`, a polar backing shape behind pinnate or palmate
  crowns (`kigelia`, `marula`, `baobab`) renders as a visible circular plate. Layering back-rank
  (`dl: -0.05`) and front-rank (`dl: +0.03`) leaflets batched via `bladeBunch` builds natural
  foliage depth while cutting raw SVG byte size by 65–75%.
- **Tussock grasses need three-point arching blades and dedicated close studies.** Two-point
  `bladeBunch` segments produce stiff fans of straight needles; three-point quadratics give a
  parabolic arch, and exporting dedicated `redgrassDetail` and `thatchgrassDetail` studies lets the
  gallery inspect boat-shaped spatheoles, geniculate twisted awns, and paired racemes rather than
  repeating the full tussock.
- **Open spiral pods beat tight discs at garden scale.** A 2.5-turn closed pod merges into a solid
  dark coin at tree scale; an open 1.35-turn ribbon spiral reads immediately as *Vachellia tortilis*
  in both the gallery and the full garden.
- **Every `part()` rotates and scales around its single `data-o` origin (`main.ts`).** Grouping
  thorns or canopy pads along a whole 700-unit limb into one `part()` with `origin` at the limb's
  midpoint swings the outer thorns into empty air whenever `0 < t < 1`—especially at `scrollY = 0`,
  where the intro rests at `INTRO = 0.5`. Emit each node's thorn pair, leaf cushion, and hanging
  pod in its own `part(out, gate(res, g, i) + 0.015, p, ...)` anchored at `p = res.pts[i]` so its
  base stays locked to the bark at every frame.

## What the fynbos taught

- **A front-row bract bowl dips its front lip to reveal the cone.** Drawing all involucral bract
  tiers at equal length turns *Protea cynaroides* into a closed pink wall that hides its signature
  snowy-white bearded floret dome. Foreshortening the front-center `midCount` and `outCount` bracts
  while fanning the back rank opens a three-quarter royal cup around the plush white cone.
- **Cylindrical pagodas and two-ranked spikes read by axil-by-axil layering.** *Mimetes cucullatus*
  reads as a hooded pagoda only when each upper node layers its scarlet-and-gold cucullate leaf-hood
  directly over the white-bearded floret packet and extended red styles below it; *Watsonia borbonica*
  reads as a bugle-lily when curved zygomorphic trumpets alternate in two ranks below ascending
  unopened buds at the apex.
- **Rush fountains read by their node sheaths and spathe.** *Elegia tectorum* is told apart from
  grass tussocks by its leafless dark-green rods ringed with black node bands, curling golden-brown
  papery sheaths peeling away at the lower nodes, and the boat-shaped papery spathe subtending each
  dark-brown terminal plume.

## What the Namib taught

- **A plant rooted past the bottom edge must never rise.** The solver slides a corner plant along
  its side, and a slide upward lifted the cut bases of *Tylecodon paniculatus*, *Euphorbia
  damarana*, and *Pachypodium namaquanum* into mid-air. Nudging them off the edge (`--x: 0.2%`,
  `99%`) only hid the fault; `arrange.ts` now lets any plant rooted past the bottom edge sink but
  never lift, and corner plants stay at `0%` and `100%`.
- **Two-leaved *Welwitschia* needs longitudinal splits, frayed tan tips, and a central crater cup.**
  Carving a dark bi-lobed corky growth groove across the woody crown, splitting each undulating strap
  into ribbon lobes that fray and bleach into weathered tan strips where they touch the gravel, and
  raising forked scarlet-and-salmon cone panicles from the crown rim makes *Welwitschia mirabilis*
  unmistakable at a glance.
- **Host-drawn hemiparasites separate convergent desert silhouettes.** Drawing *Tapinanthus
  oleifolius* as a woody haustorial bush of glaucous opposite leaves and split crimson-and-black
  floral tubes erupting directly from an upper ribbed arm of *Euphorbia virosa* honors the treeless
  Namib sky while immediately distinguishing the gifboom from the Sonoran organ pipe.

## What the mangrove taught

- **Tide and entry share one scroll.** Before scrolling (`scrollY = 0`, `all = INTRO = 0.5`), the
  waterline rests low near the bottom edge (`LOW_TIDE = 0.22`) so the full arch of the red mangrove's
  stilt roots and the black mangrove's breathing pegs stand exposed above the mud, and only those two
  margin anchors plus a single central cordgrass shoot are present (`g0 < 0.50`). Scrolling from
  `0.5` to `1.0` raises the tide (`--tide: 0.22 -> 1.0`) across the roots while the remaining plants
  reach in from every edge and angle (`--enter` + `g0 >= 0.50`).
- **Supratidal shore runners belong on the high-tide bank, not the lagoon floor.** Rooting prostrate
  runners (*Ipomoea pes-caprae* and *Sesuvium portulacastrum*) at `calc(100svh + var(--u) * 1.5)`
  submerges their terrestrial flowers under high water. They root on the left and right banks
  (`--x: 0%` and `--x: 100%`), high enough that the lowest stolon, not just the anchor, clears the
  surface: at `calc(100svh - var(--u) * 15.5)` and `* 17` over a landscape depth of 12.9.
- **A drawing cannot know its own scale.** `waterOf` once assumed 10 drawing units per `--u`, but
  each layout sets `--h`, so the true ratio ran from 10.2 to 13.7, and in portrait 11 of the black
  mangrove's 14 pegs, sized to clear high water, drowned. The layout now sets the depth to fit
  the drawing; see Water.
- **Canopy epiphytes need living host wood.** Hanging *Tillandsia usneoides* or perching *Tillandsia
  utriculata* on a bare brown bar from the top border looks like a cut stick; tipping the dipping
  host bough with a terminal mangrove leaf cluster (`leafCluster`) turns it into a living canopy limb.

## Settled

- **How a visitor chooses a climate.** A switcher in the controls lists every garden by emblem
  and name (`src/garden/switcher.ts`); the choice is kept in the address and for the next visit.
  A first visit opens on the theme's garden: tropical by day, Mediterranean at night.
- **Each climate in both lights.** Every garden is authored for day and night in
  `src/tokens.css`: a day set under `:root` and a night set under the dark theme, grouped by
  garden. Night values are written out per token, not derived at runtime, and all tokens stay on
  `:root`.

## Seasons

The gardens built each show one moment. A four-season garden shows a year: its parts arrive and
leave in their own seasons, its leaves turn, and its wood stands bare in winter. This is the
design; nothing of it is built yet.

**One axis, the year.** A seasonal garden's progress u runs from 0 to 1 through the year, on the
same axis growth already uses (`data-g`): spring 0 to 0.45, summer to 0.65, autumn to 0.85,
winter to 1. Growth is not only spring's: the spider lily's scape rises in autumn, the plum
flowers in late winter, pods and seed heads form after the flowers. Each happens where it
happens on the one axis.

- **Where the page rests.** The intro grows a seasonal garden to late spring, u = 0.42, its
  fullest moment, and the scroll carries it from there to winter. Reduced motion rests at 0.42
  too, where a single-moment garden rests fully grown. Touch autoplay stops at full summer,
  u = 0.6. Scrolling back runs the year back.
- **Switching in.** A seasonal garden switched into mid-scroll grows in straight to the page's
  season.
- **The end.** The page ends on winter as the climate has it: bare wood and seed heads, with the
  plum flowering on bare zigzag wood so the end reads as finished.

**A part's life.** Today a part only arrives: it unfolds at g. A seasonal part may also leave,
and its markup carries both: it arrives at g and, if it leaves, leaves at d. Wood, winter buds,
and fruit that stays through winter never leave. A herbaceous stem that dies back (the peony,
the spider lily's scape, the lotus's stalks) leaves too.

**Leaving reads as falling, not as arrival run backward.** A part shrinking back into its bud
reads as time reversed. A leaf leaves by dropping and tilting as it fades; a petal drops and
fades; a dying stem bends and fades. Before it falls, a leaf has already turned.

**Turning.** Each species has a summer and an autumn tone, `--pl-<key>` and
`--pl-<key>-autumn`, in both lights, and a turning window on the year in `plants.json`. The
page writes each plant's turn (0 to 1) on its bed, stepped, and only when the step changes, as
everything `renderGarden` draws is; `paint.css` mixes the two tones by it. The ginkgo turns late
and all at once, the maple early and scarlet.

**Bare winter wood.** Today's trees are drawn for leaves to cover the branch tips. A deciduous
tree must read bare, so its twigs are drawn to be seen: spur shoots, buds, fine tips. Drawn bare
first, then leafed.

**Still water.** A garden whose water is a pond, not a tide, holds it at full depth: `gardens.ts`
marks the water still, and `--tide` stays at 1.

**The tools follow.** `npm run draw` also fails when a part outlives the stem it sits on.
`npm run look` shows a seasonal garden in each season (late spring, summer, autumn, winter), so
a layout is judged across the year, not at one moment.

**Build order.** Research how the East Asian roster looks (done; see §2). Build the
system with one plant, the ginkgo, which crosses every part of it: fans unfolding, green
deepening, gold all at once, then bare limbs with spur shoots. Show it, then grow the roster.

The taiga and the two temperate woodlands take the same system, and their rosters get the same
four columns when their turn comes.

## Water

Water is a mechanism of the garden, not a feature of the mangrove alone. Below the surface is a
tint, and where roots and stems cross the surface they meet a soft edge—no mirrored reflections,
which would double every drawing and break the paper-and-wash look.

**How water works (built in `#4 Mangrove`, ready for `#2 East Asian`):**
1. **Depth.** A garden with water sets `water` on its `Garden` entry in `src/garden/gardens.ts`: its
   default depth in `--u`, which `src/main.ts` writes as `--water` on `.garden`. The flag also gives
   the garden's plants the runtime treatment below.
2. **Drawings and layouts agree on the surface.** A drawing places what meets the water from
   `waterOf` in `draw/mangrove.ts`: high water in drawing units above the base, the default depth at
   10 units per `--u`. A layout draws each plant at its own scale (viewBox height ÷ `--h` units per
   `--u`), and `draw.ts` never reads layouts, so each layout sets its own depth on
   `:root[data-garden="<key>"] .garden .water`, chosen to land the surface on `waterOf` for the
   plant whose parts are sized to it: `--water = W × --h / viewBox height − sink`. Redraw that plant
   and its viewBox changes, and these numbers with it. Move `waterOf` to a shared module when the
   East Asian garden needs it.
3. **Tide (`src/main.ts`).** `--tide` rises from 0 to `LOW_TIDE = 0.22` over the intro, so roots and
   pegs stand exposed above a low rim, then to 1 over the scroll. When a water garden comes on show,
   the tide grows in with its plants. A still pond is designed with the seasons (see Seasons).
4. **The band (`src/garden/paint.css`).** `.garden .water` is a fixed band `--water` × `--u` tall,
   lowered by `1 − --tide`, washed with `--water-tint` under a thin `--water-line` edge.
5. **Plants at the surface (`src/main.ts`).** `collect` wraps each water-garden plant in a group
   masked by a vertical luminance gradient that fades it below the waterline; `waterPlant` draws a
   glaze (`.wash.water-edge`) and ripple strokes (`.ink.water-line`) wherever a grown limb crosses
   it. Only limbs drawn with `grow` are found, so anything that should meet the water with a
   meniscus is drawn as a limb.
6. **The solver (`src/garden/arrange.ts`).** `arrange` reads the band's full height: no plant's
   anchor slides across the high-water line, and crowding below it costs a quarter as much.

The mangrove (`#4`) built and verified this mechanism with its twelve brackish Everglades and
Caribbean lagoon species (§4). Lotus (*Nelumbo nucifera*) and rabbit-ear iris (*Iris laevigata*)
stay out of the mangrove—both are freshwater plants, and the iris is temperate—and will reuse
`water` in the East Asian garden (`#2`).

## The gardens

### 1. Sonoran Desert: BWh, southern Arizona and Sonora
Hard clear light and dry air; rain twice a year, so green flushes after storms and greys between.
Palette: blue-green and olive stems, silver felt, yellow palo verde and brittlebush, red ocotillo,
pale sand.

Built. The table is the survey; the garden departs from it as What the desert taught records.

| Plant | Latin | Role | Note | New geometry |
|---|---|---|---|---|
| Saguaro | Carnegiea gigantea | side | A pleated column, arms lifting like raised hands | pleated ribs, arms bent at a knee |
| Ocotillo | Fouquieria splendens | side | Whip canes splay from one crown, bare and thorned | radial whips, clustered leaves |
| Foothill palo verde | Parkinsonia microphylla | side | Green trunk and limbs, leaves sparse as lace | green bark, fine leaflets |
| Velvet mesquite | Prosopis velutina | side | Twisted dark limbs, feathered leaves, thorns at the nodes | twisted limbs, bipinnate leaves |
| Desert mistletoe | Phoradendron californicum | hanging | Leathery clumps hanging from palo verde limbs | forking clumps |
| Sonoran ibervillea | Ibervillea sonorae | hanging | Lobed leaves and coiled tendrils poured over a shrub | helical tendrils |
| Chain-fruit cholla | Cylindropuntia fulgida | hanging (stretch: it stands) | Jointed cylinders trailing strings of fruit | segmented cylinders, fruit chains |
| Organ pipe | Stenocereus thurberi | bed | Columns clustered from one base | many ribbed columns |
| Fishhook barrel | Ferocactus wislizeni | bed | A squat barrel of hooked red spines | helical ribs, hooked spines |
| Engelmann prickly pear | Opuntia engelmannii | bed | Flat pads stacked into a sprawling clump | obovate pads, areoles |
| Brittlebush | Encelia farinosa | bed | Silver felted leaves, yellow daisies on stalks | felted stipple, daisy heads |
| Creosote | Larrea tridentata | bed | A resinous shrub, paired leaflets on many twigs | opposite leaflet pairs |

### 2. East Asian: Cfa, the lower Yangtze and Kanto plains
Monsoon summers, plum-rain haze, a clear gold autumn, bare trunks under a low winter sky.
Palette: bamboo olive, ginkgo butter, paulownia lilac, wisteria violet, lotus pink, lycoris
vermilion.

The first seasonal garden, and the second with water: a still pond in the bed. Researched in
October 2026 (below). The roster chooses each plant by how it reads; where it is native does not
matter, since a garden's plants are grown there. Plants reach in from the sides and the top and
enter as they grow (`--enter`), so the garden's motion carries the year as much as its colors.

**The roster through the year.** Thirteen plants: six sides, two hangers, five in the bed and the
pond. Revised from the survey:
- Weeping willow replaces Japanese cedar, whose spire nears the Mediterranean cypress and pine.
- Plum joins, for winter's flowers on bare wood.
- Morning glory and hardy kiwi stay out: the morning glory's funnel repeats the mangrove's beach
  morning glory and is gone in winter, and the kiwi's leaves sit near the tropical philodendron's
  hearts. Two woody vines hold the top, each hanging from its host (an arbor beam or a bough)
  drawn with it, and both keep bare twisted vines and split pods through winter.
- Lotus and rabbit-ear iris return on the still water the mangrove built; the iris grows in
  standing water.
- Japanese wisteria over Chinese: its racemes fall 20 to 50 cm, against 15 to 20, and read at
  garden size as the rain they are named for.
- Moso bamboo moves from the bed to a side: its culms reach 20 m, so a few ringed culms rise
  from below the frame and out of its top, the strongest upright in a winter of bare wood. They
  stand on the left: on the right they would pass through the controls.

| Plant | Latin | Role | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|---|---|
| Ginkgo | Ginkgo biloba | side | fresh green fans on short shoots | full green fans | gold fans, shed almost at once | bare limbs studded with spur shoots |
| Japanese maple | Acer palmatum | side | red-tinged new hands, tiny red flowers | green hands, paired winged keys | scarlet | fine bare twigs |
| Paulownia | Paulownia tomentosa | side | lilac panicles on bare wood | plate-sized heart leaves | leaves drop, capsules split, next year's buds already furred | bare, hung with capsules and furred buds |
| Weeping willow | Salix babylonica | side | first green, catkins | a full curtain | a yellowing curtain | bare whips that still hang |
| Plum | Prunus mume | side | new leaves, small fruit | green plums yellowing in the plum rain | leaves yellow and fall | flowers on bare zigzag wood, late in winter |
| Moso bamboo | Phyllostachys edulis | side, ringed culms rising out of the frame | shoots rising in sheaths; old leaves yellow and shed | full plumes on ringed culms | unchanged | the garden's one full green |
| Japanese wisteria | Wisteria floribunda | hanging | long violet racemes opening base to tip as the leaves unfold | pinnate leaves, velvet pods | yellow leaves, pods | bare twisted vines, pods splitting |
| Chocolate vine | Akebia quinata | hanging | purple-brown flowers | five-leaflet palms | sausage pods split open | thinned leaves on twining stems |
| Lotus | Nelumbo nucifera | bed, in the pond | rolled leaves rising from the water | shield leaves on tall stalks, pink flowers over their pods | leaves tattered and browning, pods ripening | dry pods on broken stalks bent into the water |
| Rabbit-ear iris | Iris laevigata | bed, in the pond's shallows | grey-green swords; violet flowers in May | the last flowers into June, then capsules | leaves yellowing | dry leaf stubs at the water |
| Peony | Paeonia lactiflora | bed | red shoots, then ball flowers late in spring | glossy divided leaves | leaves redden, seed follicles | dies back to the ground |
| Hydrangea | Hydrangea macrophylla | bed | new leaves | mopheads in the plum rain | heads fade to antique green and rose | dried heads on bare stems |
| Red spider lily | Lycoris radiata | bed | narrow leaves wither | dormant, nothing above ground; scarlet umbels on bare stalks at its end | the flowers fade; narrow dark leaves rise | dark leaves, about 5 mm wide |

**The calendar,** lower Yangtze unless marked; the year axis starts in March (see Seasons).

| Plant | Leaves | Flowers | Fruit and what persists | Autumn and leaf fall |
|---|---|---|---|---|
| Ginkgo | late March | April (male catkins) | seeds drop in October | saffron yellow late November (Tokyo) to early December (Nanjing), shed in 1 to 15 days; spur shoots all winter |
| Japanese maple | red new leaves in March | hanging red-purple corymbs, April to May | paired keys ripen in September | scarlet in sun, yellow in shade, late November to early December; bare by December |
| Paulownia | late April, after the flowers | pale violet panicles on bare wood, late March to April | brown capsules from September, hanging all winter with next year's furred buds | leaves drop in October |
| Weeping willow | late March | catkins, February to March | none to draw | yellowing in October, bare in November |
| Plum | March, after the flowers | from mid-February to early March (from December in warm years) | fruit yellowing in June, in the plum rain | yellow, falling in November (not verified) |
| Moso bamboo | evergreen; old leaves yellow and shed in April to May as new shoots rise | rare | sheaths fall from the new culms | unchanged |
| Japanese wisteria | with the flowers, April to May | April to May, each raceme opening from base to tip | velvety pods from summer, splitting in winter's dry air | yellow in October to November |
| Chocolate vine | spring | purple-brown, March to May | sausage pods ripen and split, September to October | leaves thin out; some stay through mild winters |
| Lotus | rolled leaves from the water in May | June to August | pods ripen and darken, September to October | tattered and brown in October; dry pods on stalks over winter |
| Rabbit-ear iris | swords in March to April | May to June | capsules ripen July to August | yellowing in autumn; stubs over winter |
| Peony | red shoots, February to March | April to May (double in cultivation, single in the wild) | follicles in August | yellow or red in autumn; dies back after frost |
| Hydrangea | March to April | mopheads June to July, in the plum rain | heads stay, fading to antique green and rose | leaves fall in October; dried heads on bare stems all winter |
| Red spider lily | October to May, through winter | August to September, on bare scapes | capsules in October | leaves wither in late spring; dormant in summer |

**Drawing facts.** Ginkgo fans 5 to 10 cm wide on 3 to 8 cm stalks, three to seven to a spur shoot,
the notch deeper on young shoots. Maple hands 4 to 12 cm, five to nine tailed lobes, doubly toothed.
Paulownia hearts 15 to 40 cm, velvety beneath; capsules egg-shaped, 3 to 4 cm. Willow leaves 4 to 16
cm, narrow and long-pointed. Plum leaves 4 to 8 cm, oval; the tree bent and knotted. Wisteria
racemes 20 to 50 cm; leaves of eleven to nineteen leaflets, 2 to 6 cm each. Chocolate vine leaflets
five, notched; pods sausage-shaped, grey-purple. Moso culms to 20 m and 20 cm across, ringed at
every node, the internodes to 40 cm and white-powdery when young; culm sheaths yellow-brown to
purple-brown, dark-spotted and hairy; leaves narrow, 4 to 11 cm, two to four to a branchlet. Lotus
blades 25 to 90 cm, glaucous, on hollow stalks 1 to 2 m; flowers 10 to 23 cm; the pod a flat-topped
cone 5 to 10 cm. Rabbit-ear iris leaves grey-green, 40 to 100 cm, no midrib; stems 22 to 60 cm;
flowers 9 to 10 cm, the falls marked with white or yellow. Peony to 70 cm, its leaflets with a white
toothed margin. Lycoris scapes about 30 cm, four to seven flowers, the lobes strongly recurved and
the stamens far out; leaves about 15 cm by 5 mm, a pale midvein.

**Keep apart in the drawing.** Plum and maple are both fine bare trees in winter: the plum's trunk
bent and knotted, the maple's crown layered. Wisteria and chocolate vine are both bare twining
stems in winter: the wisteria thick and twisted with pods, the akebia thin with a few leaves. The
arbor they hang from is East Asian timber, not a Mediterranean pergola, or the vines read as a
grapevine.

**Unresolved.** Plum's leaf-fall month and bark; the maple's bark color; the wisteria's twining
direction (sources disagree); how many leaves the chocolate vine keeps in winter; when lotus pods
ripen and whether winter stalks break into the water; the peony's autumn color and flowering
dates; the hydrangea's autumn color; the plum rain's dates; when moso sheds its culm sheaths.

**Sources.** Flora of China PDFs at iplant.cn (Poaceae, Iridaceae, Amaryllidaceae, Paeoniaceae,
Nelumbonaceae, Saxifragaceae); efloras.org, *Iris laevigata*; GBIF species match; Oregon State
Landscape Plants (*Wisteria sinensis*, *Paulownia tomentosa*); RHS (wisteria, *Akebia quinata*,
*Iris laevigata*); Trees and Shrubs Online (*Akebia*); Missouri Botanical Garden (*Akebia*,
*Paeonia lactiflora*); NC State Extension (*Hydrangea macrophylla*); Nohara 1997 on lotus and
water depth; Nanjing municipal guide to ginkgo color; Hangzhou plum bloom reports; English and
Japanese Wikipedia for each plant.

### 3. Afroalpine: ET, the Teleki Valley on Mount Kenya, about 3,900 to 4,100 metres
Thin hard equatorial sun by day, frost almost every night, no seasons: "winter every night,
summer every day" (Hedberg 1964). Palette: silver felt, rust-brown skirts of dead leaves, pale
grey-green lichen, yellow groundsel heads, mauve thistle, cream everlastings, orange lichen on
the groundsel bark.

Built. Verified against the floras in October 2026. The survey mixed two mountains;
the garden keeps to the Teleki Valley, where the giant rosettes meet the top of the heath belt and
every plant below is recorded growing together (Hedberg 1964; Downing et al. 2024).

| Plant | Latin | Role | Note | New geometry |
|---|---|---|---|---|
| Giant groundsel | Dendrosenecio keniodendron | bed, carries the height | A trunk forked into a candelabra, one fork per flowering; each tip a metre-wide rosette over a skirt of dead leaves; spent panicles hang from the rosettes; orange lichen on the cork | rosette on a column, dead-leaf skirt |
| Teleki's lobelia | Lobelia telekii | bed | One rosette under a column of long hairy bracts that hide its blue-purple flowers | shaggy bract column |
| Cabbage groundsel | Dendrosenecio keniensis | bed | Rosettes at ground level on a hidden creeping stem, white felt beneath; a narrow spike of nodding yellow-rayed heads | ground rosettes |
| Tree heath | Erica arborea | side | Red-brown limbs plumed with whorls of needle leaves, white bells along the side shoots, Usnea strands draped over the limbs | needle plumes, strand curtain |
| Mount Kenya thistle | Afrocarduus keniensis | bed | A cobwebbed spiny rosette, a winged spiny stem to 2.4 metres, dense clusters of mauve heads | winged stem, thistle heads |
| Silver lady's mantle | Alchemilla argyrophylla | bed | A shrub to a metre, silver all over, tiny three-lobed leaves; the field layer under the groundsels | small silver leaves |
| Water lobelia | Lobelia gregoriana | bed | Shiny rosettes on sprawling stems with dead-leaf mantles; a narrow spike whose short bracts show the flowers; last year's dead spikes left standing | none new |
| Brown's everlasting | Helichrysum brownei | bed | A grey cushion of linear leaves, papery cream heads with pink bases | papery bracts |
| Tussock grass | Festuca pilgeri | bed | Dense tussocks of fine blades | blade tussock |
| Haplocarpha | Haplocarpha rueppellii | bed | A flat glossy rosette pressed to the ground, yellow daisies on short stalks | flat rosette |
| Young giant groundsel | Dendrosenecio keniodendron | side, from a bottom corner | Not yet flowered, so not yet branched: one rosette on a skirted column, leaning in from beyond the frame | none new |
| Mount Kenya heath | Erica trimera subsp. keniensis | side | A low shrub's grey twiggy branch, its sticky light-green leaves packed into rounded clumps, bells opening white and aging brown | leaf clumps |

**Nothing hangs from the top.** What hangs is drawn with its host, as the desert's mistletoe
is: Usnea articulata draped over the tree heath (on Mount Kenya the beard lichens hang
from Erica, never from the groundsels), and the groundsel's spent panicles.

**The sides fill from beyond the frame.** At this height only the groundsels and the heaths are
woody, so the side plants are drawn from them: the tree heath reaches in high on the right with a
young groundsel leaning in below it, and the Mount Kenya heath reaches in on the left. The two
heaths are told apart by habit, not by flower: ascending plumes on red-brown limbs against
rounded light-green clumps on grey twigs.

**Corrections to the survey.** Dendrosenecio kilimanjari and Lobelia deckenii grow on
Kilimanjaro; Mount Kenya's counterparts are D. keniodendron and L. gregoriana (L. keniensis and
L. deckenii subsp. keniensis are its synonyms). Hypericum revolutum grows below 3,550 metres,
Kniphofia thomsonii is not recorded in the Teleki Valley, and Helichrysum newii is a Kilimanjaro
plant: all dropped, with Afrocarduus keniensis and Helichrysum brownei in their place. Alectoria
has no Kenyan records, and the form of Mount Kenya's Ramalina could not be verified: both
dropped. Use D. keniensis, not D. brassica (illegitimate per FTEA, though POWO still lists it).

**Unresolved:** the flower color of L. gregoriana on Mount Kenya (related subspecies are purple
or mauve); the tallest spike of L. telekii (1.2 metres measured, "to 8 ft" on a label); the height
of E. arborea near 3,900 metres (draw a shrub to small tree); whether Usnea hangs on Erica above
3,800 metres (records run 3,600 to 3,800).

**By night the giant rosettes close.** The groundsel folds its leaves over the bud into a night
bud; Teleki's lobelia presses into a tight head; the cabbage groundsel shuts into a white ball of
felted undersides; the water lobelia's rosette fluid freezes over in crescents. The night theme
could show it one day; the first build does not.

Sources: Hedberg 1964, *Features of Afroalpine Plant Ecology*
(diva-portal.org/smash/get/diva2:565487/FULLTEXT01.pdf); Downing et al. 2024, the Teleki Valley
re-survey (tpyoung.ucdavis.edu); Flora of Tropical East Africa (plants.jstor.org); WCVP accepted
names; GBIF lichen specimens.

### 4. Mangrove: Aw, the Everglades and the Caribbean lagoons
Flat white light off brackish water; hot salt air; tides, not seasons. Palette: glaucous olive,
leathery dark green, rust-red stilts, black mud, bleached silver, cream flowers.

Built. Verified in October 2026 against Flora of North America (FNA), World Flora Online (WFO / WCVP), the
Institute for Regional Conservation's *Floristic Inventory of South Florida*, and Gill & Tomlinson's
monographs on *Rhizophora* architecture. All twelve species are native and co-occur across
Everglades National Park and the Greater Caribbean basin, spanning the tidal zonation from the
seaward prop-root fringe across the intertidal pneumatophore mudflat to the brackish landward rim.

| Plant | Latin | Role | Note | New geometry |
|---|---|---|---|---|
| Red mangrove | Rhizophora mangle | side, rooted in water | Multi-tiered catenary arches of rust-red stilt roots and plumb-vertical aerial drop roots lifting an opposite-leaved crown hung with 15 to 25 cm viviparous pencil propagules above the waterline | catenary stilt-root arcade, drop roots, pencil propagules |
| Black mangrove | Avicennia germinans | side | A dark fissured trunk and rounded crown of grey-backed opposite leaves over a bristling intertidal carpet of erect pencil pneumatophores, creamy four-lobed flowers, and lima-bean capsules | erect pneumatophore field, bicolored opposite leaves |
| White mangrove | Laguncularia racemosa | side | An open ascending crown of rounded yellow-green opposite leaves on bright carmine-red petioles with paired sub-blade nectar glands, loose flowering spikes, and ribbed obovoid drupes | biglandular red petioles, ribbed drupe spikes |
| Buttonwood | Conocarpus erectus | side, on the landward rim | A leaning rough-plated trunk and angled twigs of spirally alternate elliptic leaves bearing stalked panicles of globose cone-like button heads | globose cone panicles |
| Spanish moss | Tillandsia usneoides | hanging (on host limbs) | Rootless cascading silver-grey festoons of flexuous wiry stems and curly two-ranked scaly filiform leaves draped from mangrove and buttonwood limbs | curly silver strand festoons |
| Giant airplant | Tillandsia utriculata | hanging (perched on host limb) | A solitary massive cream-green crateriform tank rosette of spreading recurved blades anchored on a stout limb, raising a tall laxly 2- to 3-pinnate green-and-rose panicle with tubular white flowers | epiphytic tank rosette, lax pinnate panicle |
| Beach morning glory | Ipomoea pes-caprae subsp. brasiliensis | bed (prostrate shore runner) | Long fleshy purplish-green stolons creeping across the shore berm, rooting at the nodes with upright bilobed goat's-foot leaves and rose-magenta funnels | prostrate stolon, notched bilobed leaves |
| Giant leather fern | Acrostichum danaeifolium | bed | A tall erect V-clump of stiff 1-pinnate leathery fronds with 20 to 32 overlapping lanceolate pinna pairs; fertile inner fronds coated golden-rust beneath with sporangia | overlapping leathery pinnae, spore-felted fertile fronds |
| Smooth cordgrass | Sporobolus alterniflorus (syn. Spartina alterniflora) | bed, emergent in water | Dense intertidal colonies of smooth hollow culms, flat tapering grey-green blades, and narrow wand-like panicles of appressed one-sided spikes | appressed one-sided spike panicles |
| Saltwort | Batis maritima | bed | Sprawling woody-based stems sending up perpendicular ranks of 4-angled shoots crowded with swollen club-shaped chartreuse succulent leaves and axillary green cones | decussate club-succulent shoots |
| Sea purslane | Sesuvium portulacastrum | bed | A low prostrate mat of fleshy crimson-pink stems hugging the mud, opposite glossy jade-green spatulate leaves, and solitary five-pointed rose-pink star flowers | dichotomous crimson stems, succulent spatulate pairs |
| Swamp lily | Crinum americanum | bed | A basal fountain of channeled dark-green strap leaves and a stout scape crowned by an umbel of 2 to 6 spider-like white flowers with long crimson-purple stamen filaments | spider-tepal umbel, exserted purple filaments |

**Two hangers, no third.** Spanish moss (*Tillandsia usneoides*) and the giant airplant
(*Tillandsia utriculata*) are canopy epiphytes of Everglades mangroves and buttonwoods, drawn on
their host boughs. Beach
morning glory (*Ipomoea pes-caprae* subsp. *brasiliensis*) is a prostrate supratidal runner ("railroad
vine") that roots at every node along the shore berm and never hangs from trees: it moves to the bed.

**Corrections to the survey.**
- `Tillandsia utriculata (?)` is confirmed native and frequent on mangrove and buttonwood limbs in
  Everglades National Park (IRC `Tillutri`, FNA Vol. 22). It is solitary and monocarpic (not stacked
  vegetative offsets, though several independent plants often perch along one limb) and raises a
  laxly branched 2- to 3-pinnate panicle of tubular white flowers.
- `Spartina alterniflora` is now accepted in POWO/WCVP and WFO (`wfo-0001341444`) as `Sporobolus
  alterniflorus` (Loisel.) P.M.Peterson & Saarela (Peterson et al. 2014), with *Spartina
  alterniflora* retained as its universal ecological synonym.
- `Ipomoea pes-caprae` in the Atlantic and Caribbean is subsp. `brasiliensis` (L.) van Ooststr.,
  with shallowly bilobed/emarginate goat's-foot leaves, moved from `hanging` to `bed`.
- `Acrostichum danaeifolium` is distinguished from *A. aureum* by its 20–32+ closely spaced,
  overlapping acute pinna pairs and fertile fronds coated with golden-brown sporangia along nearly
  their entire length rather than only the top 4–8 pinna pairs.

**Unresolved:** whether to show green buttonwood (*Conocarpus erectus* var. *erectus*, dominant in
the mainland Everglades) or silver buttonwood (var. *sericeus*)—green buttonwood keeps the four
woody side species maximally distinct in tone against the silver-backed *Avicennia* and silver
*Tillandsia*; whether a secondary limb should also carry a clustering cardinal airplant (*Tillandsia
fasciculata* var. *densispica*).

Sources: Flora of North America Vols. 2, 4, 7, 10, 12, 14, 22, 26 (efloras.org); World Flora Online
/ WCVP (`wfo-0000460362`, `wfo-0000302902`, `wfo-0000358854`, `wfo-0000618338`, `wfo-0000586340`,
`wfo-0000586439`, `wfo-0001296638`, `wfo-0001109379`, `wfo-0001341444`, `wfo-0000320463`,
`wfo-0000432992`, `wfo-0000764381`); Institute for Regional Conservation, *Floristic Inventory of
South Florida* (regionalconservation.org); Gill & Tomlinson (1969, 1971a, 1971b, 1977), *Biotropica*
1(1): 1–9, 3(1): 63–77, 3(2): 109–124, 9(3): 145–155; Tomlinson (1986), *The Botany of Mangroves*.

### 5. Cape fynbos: Csb, Table Mountain and the Cape Peninsula, October
Wet winters, dry summers, fire every decade or so; strong wind, bright light, poor sandstone and
granite slopes. Palette: silky silver-grey, cream, shell pink and carmine bracts, golden pincushion
styles, chestnut restio sheaths, gentian blue.

Built. Verified in October 2026 against WFO/WCVP, SANBI e-Flora and PlantZAfrica, and Cape Peninsula
GBIF and iNaturalist phenology records. The moment is October (mid-spring), when the king protea, the
tree pincushion, the hooded pagoda, the fire heath, the watsonia, the pelargonium, the buttonbush,
the Cape everlasting, and the blue sceptre all peak together, the silver tree and the sugarbush
flower while carrying last year's cones, and the thatching reed sheds its papery brown sheaths.

| Plant | Latin | Role | Note | New geometry |
|---|---|---|---|---|
| King protea | Protea cynaroides | bed, carries the focal bowl | Thick unbranched stems with long red-stalked oval leaves and a 20 to 30 cm bowl of pointed silky-pink bracts around a snowy-white cone | imbricate bract bowl, bearded cone |
| Silver tree | Leucadendron argenteum | side | Stout ascending grey limbs shingled with silky silver lance-leaves flaring into terminal rosettes around heavy silver-felted cones | shingled silver rosettes, woody cones |
| Sugarbush | Protea repens | side | Woody branches of narrow upright blue-green leaves and V-shaped goblets of pointed cream-to-carmine bracts, draped with Cassytha threads and old brown cones | V-cup bract head, host-drawn parasite threads |
| Tree pincushion | Leucospermum conocarpodendron | side, from a corner | Thick corky limbs branching at right angles, wedge leaves notched with red-tipped apical teeth, and 8 cm golden domes of arching styles with conical pollen presenters | arching style dome, apical-toothed leaves |
| Hooded pagoda | Mimetes cucullatus | bed | Upright wand stems clad in oval leaves, crowned by a cylindrical pagoda where scarlet-and-gold folded leaf-hoods cowl over white beards and red style tufts | cucullate bract hoods |
| Cape thatching reed | Elegia tectorum | bed | A dense fountain of leafless dark-green culms ringed with black node bands, curling golden-brown papery sheaths, and dark-brown terminal plumes | ringed rush fountain, peeling sheaths |
| Fire heath | Erica cerinthoides | bed | Wiry stems with 4- to 6-whorled needles, tipped with nodding umbels of swollen hairy crimson-scarlet tubes | swollen tubular umbels |
| Cape bugle-lily | Watsonia borbonica | bed | A basal fan of broad sword leaves and a tall branched spire lined in two ranks with rose-magenta bugle trumpets | two-ranked trumpet spire |
| Hooded pelargonium | Pelargonium cucullatum | bed | Hairy sprawling stems with cupped kidney-shaped toothed leaves and long-stalked umbels of asymmetric magenta-pink flowers feathered dark purple | cupped reniform leaves, feathered petals |
| Kolkol | Berzelia lanuginosa | bed | Soft bottlebrush stems clothed in fine yellow-green needles, topped by clusters of creamy-white spherical pompom heads and reddish fruiting knobs | needle bottlebrush, pompom corymbs |
| Cape everlasting | Phaenocoma prolifera | bed | Stiff white-woolly branches studded with bead-like granular spur shoots, crowned with 5 cm glossy magenta-pink papery star-heads | granular spur shoots, radiant bract star |
| Blue sceptre | Aristea capitata | bed | Stiff sword-leaf fans and 1.5 m rod stems packed along the upper third with sessile clusters of deep gentian-blue six-petaled stars and papery brown spathes | sessile star thyrse |

**Nothing hangs from the top.** Fynbos is an open-sky shrubland with no forest canopy. Dodder
laurel (Cassytha ciliolata) is a rootless, leafless yellow-green to orange parasitic twiner that
smothers fynbos shrubs on Table Mountain and cascades from their limbs with tiny white flower spikes
and red berries; it is drawn on the sugarbush (Protea repens), as mistletoe is drawn on the desert's
palo verde.

**Corrections to the survey.** Rhoicissus digitata is a summer-flowering coastal thicket and forest
climber (only one Cape Peninsula record in GBIF) whose tendrils repeat the Mediterranean grapevine;
Clematis brachiata is a summer-rainfall savanna and forest-margin liana flowering in autumn (March
to April) and overlapping the European woodland roster: both dropped. Disa uniflora is strictly a
mid-summer flowerer (January to February, zero records from June to November) confined to waterfall
spray zones and dripping vertical cliffs, so Aristea capitata (or Gladiolus carneus) takes its place
in the October bed. Leucospermum conocarpodendron (native and abundant on Table Mountain) replaces
the dropped climbers on the side/corner; Berzelia lanuginosa (representing the endemic Cape family
Bruniaceae) and Phaenocoma prolifera complete the bed. Chondropetalum tectorum is now Elegia
tectorum (Moline & Linder 2005).

**Unresolved:** whether to draw Leucospermum conocarpodendron subsp. viridum (bright green hairless
leaves, Kirstenbosch to Cape Point) rather than subsp. conocarpodendron (silver-felted leaves,
Table Mountain and Lion's Head) so its foliage stays distinct in tone from Leucadendron argenteum;
whether Gladiolus carneus (blush-pink funnels with carmine spades) should join or replace Aristea
capitata; whether Disa uniflora is wanted despite its January–February bloom.

Sources: World Flora Online / WCVP and SANBI e-Flora of South Africa (Goldblatt & Manning 2000;
Manning & Goldblatt 2012, *Strelitzia* 29); SANBI PlantZAfrica monographs (pza.sanbi.org); Fernkloof
Nature Reserve Herbarium (fernkloof.org.za); GBIF occurrence and monthly phenology facets for the
Cape Peninsula; iNaturalist flowering phenology histograms.

### 6. Lowveld savanna: Aw, the Kruger lowveld of South Africa, early in December
Hard white light after the first rains: the trees just in leaf and flower, last year's grass
bleached to straw under the new green, a wide sky. Palette: grey and copper bark, straw and rust
grass, dusty olive leaves, white baobab and thorn flowers, a plum flame lily.

Built. Verified in October 2026 against GBIF records for the eastern lowveld and the regional
floras, and refined in a second pass for botanical silhouette, two-tone layered compound crowns,
arching tussock culms with boat-shaped spatheoles, and responsive spacing. The moment is early
December: the baobab, the umbrella thorn, the crinum, and the star flower are in flower, the flame
lily has its first bells, and the sausage tree still carries last season's fruit.

| Plant | Latin | Role | Note | New geometry |
|---|---|---|---|---|
| Baobab | Adansonia digitata | bed, carries the height | A swollen grey trunk, thick limbs thrust up like roots, new palmate leaves, white flowers hanging on long stalks | swollen trunk, pendant flowers |
| Umbrella thorn | Vachellia tortilis subsp. heteracantha | side | A flat crown on zigzag limbs, thorns in pairs (one long, straight, and white, one short and hooked), white ball flowers, coiled pods | flat crown, paired thorns |
| Sausage tree | Kigelia africana | side | A rounded crown of pinnate leaves, last season's long grey fruit hanging on rope-like stalks | pendulous fruit |
| Marula | Sclerocarya birrea subsp. caffra | side, from a corner | A dense rounded crown of pinnate leaves on a grey mottled trunk | none new |
| Flame lily | Gloriosa superba | bed, scrambling | Leaf-tip tendrils climbing through the grass, nodding plum flowers with reflexed tepals | reflexed petals, leaf-tip tendrils |
| Red grass | Themeda triandra | bed | Tufts with drooping clusters of rust-red spikelets | drooping spikelet clusters |
| Fine thatching grass | Hyparrhenia filipendula | bed | Tall culms with slender false panicles | tall culms |
| Sabie crinum | Crinum macowanii | bed | A blue-green strap rosette, an umbel of white bells striped pink | strap fan, umbel |
| Star flower | Hypoxis hemerocallidea | bed | Three-ranked hairy strap leaves, erect scapes of yellow stars | star flowers |

**What hangs** hangs from its own plant: the sausage fruit, the baobab's flowers, the thorn's
coiled pods. The flame lily scrambles up through the grass rather than hanging from a tree.

**Corrections to the survey.** Euphorbia ingens reads as the desert's ribbed columns and flowers
from April to August; Aloe marlothii's rosette repeats the Afroalpine groundsel and the
Mediterranean agave, and flowers from June to August: both dropped, with the marula in their
place. Crinum bulbispermum is a highveld plant; the lowveld crinum is C. macowanii. The fine
thatching grass is Hyparrhenia filipendula, not H. rufa. The wild yam (Dioscorea sylvatica)
repeats the tropical heart-leaved vines, and the veldt grape (Cissus quadrangularis) is not
confirmed in Kruger: both dropped. The eastern lowveld's flame lily is plum, not orange; the star
flower carries several stars on each scape; the baobab is not confined to Kruger's far north.

**Unresolved:** how far south the baobab grows wild in Kruger; whether the umbrella thorn's crown
is flat (a nursery source; subsp. heteracantha is shrubbier); the crinum's altitude (Wikipedia
gives 1,000 to 2,600 metres, above the lowveld, though GBIF records place it there, and Limpopo's
crinum may be C. stuhlmannii); the flowering months of the star flower and the thatching grass.
Candidates if the composition needs more, to verify before drawing: weeping wattle (Peltophorum
africanum, yellow sprays September to February) and leadwood (Combretum imberbe, cream flowers
November to March).

Sources: the GBIF occurrence API; the Floras of Zimbabwe, Botswana, and the Caprivi; Wikipedia;
SANBI PlantZAfrica (search excerpts only: its pages refused the fetch).

### 7. Boreal taiga: Dfc, Siberia and Fennoscandia
Low sun, a long snowed-under winter, cold wet air. Palette: black-green spruce, white birch,
rust-gold larch, grey lichen.

| Plant | Latin | Role | Note | New geometry |
|---|---|---|---|---|
| Siberian spruce | Picea obovata | side | Drooping whorled tiers, a narrow spire | tiered whorls |
| Siberian larch | Larix sibirica | side | Soft needle tufts, gold in autumn | spur tufts |
| Silver birch | Betula pendula | side | A white peeling trunk, pendant twigs | peeling bark, pendulous shoots |
| Scots pine | Pinus sylvestris | side | Orange bark, candle tufts at the tips | cracked bark |
| Methuselah's beard | Usnea longissima | hanging | Long pale strands from spruce twigs | strand curtain |
| Witch's hair | Alectoria sarmentosa | hanging | Black threads from pine | dark threads |
| Twinflower | Linnaea borealis | hanging (stretch: a creeper) | Trailing stems, paired pink bells | paired bells |
| Lingonberry | Vaccinium vitis-idaea | bed | Glossy small leaves, red berry bunches | berry clusters |
| Labrador tea | Rhododendron tomentosum | bed | Leathery leaves, rusty beneath | rust-felted undersides |
| Cloudberry | Rubus chamaemorus | bed | Lobed leaves, one white flower, one gold berry | single-fruit stem |
| Wood horsetail | Equisetum sylvaticum | bed | Jointed hollow stems in whorls | jointed whorls |
| Lady fern | Athyrium filix-femina | bed | Feathered fronds from crosiers | unrolling crosiers |

### 8. Namib and Namaqualand: BWk, the Namibian coast and escarpment to the Richtersveld, August–September
Low hazy light under dawn advection fog; wet air at the coast, winter rain just past in the
Richtersveld and Namaqualand. Palette: dune ochre and rose, bone-white and golden-flaking pachycaul
bark, blue-glaucous aloe rosettes, weathered welwitschia brown, crimson mistletoe tubes, flesh-pink
hoodia saucers, and crinkly sulphur-yellow Bushman's candle petals.

Built. Verified in October 2026 against World Flora Online (WFO / WCVP), SANBI e-Flora of South
Africa, Tree Atlas of Namibia, and peer-reviewed Namibian field studies. The chosen moment is **late
winter to early spring (August–September)**: *Aloidendron dichotomum* finishes its bright yellow
winter racemes while *Pachypodium namaquanum* opens its velvet-crowned tubular flowers, *Tylecodon
paniculatus* stands in full succulent paddle leaf initiating its crimson flower stalks, *Euphorbia
virosa* and its hemiparasite *Tapinanthus oleifolius* are in bloom, *Welwitschia mirabilis* carries
late salmon-red female cones, and *Hoodia gordonii*, *Monsonia crassicaulis*, and *Lithops
ruschiorum* flush across the gravel flats.

| Plant | Latin | Role | Note | New geometry |
|---|---|---|---|---|
| Quiver tree | Aloidendron dichotomum | bed or side, carries the height | A stout tapering trunk plated with golden-brown scales, 4–6 dichotomous forks into a rounded crown of compact blue-glaucous rosettes and erect canary-yellow racemes | dichotomous forks, terminal rosettes |
| Halfmens | Pachypodium namaquanum | side, leaning in | A single unbranched warty silver-grey column tilting 20–30° north, 3 spines per tubercle (2 long spreading + 1 short central), a terminal crest of strongly undulate velvety leaves and red-throated yellow-green tubes | tilted pachycaul, 3-spine tubercles, wavy apical crest |
| Butter tree | Tylecodon paniculatus | side, from a corner | A squat dwarf-baobab pachycaul (1–2 m) with translucent golden-yellow peeling bark over olive underbark, thick dichotomous branches, and terminal clusters of bright green obovate paddle leaves with red-stalked urn panicles | peeling golden bark, paddle leaves |
| Damara milk-bush | Euphorbia damarana | side, from a corner | A dense hemispherical dome of hundreds of erect leafless pencil-thick (12–20 mm) glaucous yellow-green rods tipped with sessile yellow-brown cyathia and 3-lobed capsules | erect leafless pencil rods |
| Gifboom + Namibian mistletoe | Euphorbia virosa + Tapinanthus oleifolius | bed (host + hemiparasite drawn as one plant) | *E. virosa*: twisted basal caudex with strict candelabra whorl of 5–8-angled constricted segments armed with paired shiny brown stipular spines on a continuous horny grey shield. *T. oleifolius*: woody haustorial clump erupting directly from an upper *E. virosa* rib, bearing leathery glaucous opposite leaves and umbels of 4–5 cm crimson-red split-tube flowers with black-tipped yellow-green reflexed lobes | spirally twisted constricted ribs, hemiparasitic mistletoe clump |
| Nara melon | Acanthosicyos horridus | bed or lower side | A leafless, tendril-less phreatophytic thorny mounding shrub of grooved grey-green stems armed with paired 2–3 cm straight ivory-tipped spines at every node, pale greenish-yellow axillary flowers, and 15 cm globose spiny orange-yellow melons | paired nodal spines, spiny globose melon |
| Welwitschia | Welwitschia mirabilis | bed | A low corky bi-lobed crater-cup crown issuing exactly two broad leathery olive-russet straps that arch out, split lengthwise into frayed ribbons over the gravel, and frame forked scarlet-and-salmon cone panicles | two split leathery straps, 4-ranked cone panicles |
| Bushman's grass | Stipagrostis sabulicola | bed | A tough dune-anchoring hummock of rigid bamboo-like knotted culms (to 1.8 m) bent by wind and topped by narrow feathery silver-cream plumose panicles | wind-bent knotted culms, plumose panicles |
| Bushman's candle | Monsonia crassicaulis | bed | A dwarf spiny resin-waxy shrublet (20–40 cm) of horizontal pale-grey branches armed with 2–4 cm petiolar spines, small crenate-folded glaucous leaves, and 4 cm crinkly translucent sulphur-yellow 5-petalled saucer flowers | waxy spiny branches, crinkly saucer flowers |
| Ghaap | Hoodia gordonii | bed | A tight upright cluster of 12–17-ribbed grey-brown succulent cylinders studded with single-spined tubercles and crowned near the apex by flat 7–10 cm five-angled flesh-pink to maroon saucer corollas with five tail-like points | tuberculate multi-ribbed stems, pentagonal saucer flowers |
| Rusch's living stones | Lithops ruschiorum | bed (foreground) | Clumps of 2–6 cordate, convex, nearly unspotted pearl-grey and bone-ochre fused leaf pairs with a shallow V-cleft and persistent 5-chambered boat-valved capsules in the gravel | cordate cleft pebble bodies |

**Nothing hangs from the sky.** Open fog desert has no tree canopy. *Tapinanthus oleifolius* is
drawn as part of *Euphorbia virosa*, erupting from its upper stems just as *Phoradendron* grows on
the Sonoran palo verde. *Acanthosicyos horridus* is drawn as a mounded thorny dune-base shrub
with heavy spiny melons resting near the ground.

**Corrections to the survey.**
- `Aloe dichotoma` is now accepted as `Aloidendron dichotomum` (Grace et al. 2013, *Phytotaxa* 76).
- `Ceropegia sp. (?)` ("thin succulent stems falling from a ledge | paired leaves on threads")
  conflated the subtropical Eastern Cape/KZN forest vine *Ceropegia linearis* subsp. *woodii* with
  arid Namaqualand geophytes (*C. occidentalis*, *C. filiformis*), which are tiny underground tubers
  that never hang from ledges: **dropped**.
- `Tapinanthus oleifolius` was listed as "hanging from acacia," but there is no *Vachellia* in the
  Namib roster (which would repeat the savanna's *Vachellia tortilis*). Namibian field studies
  (Richter et al. 1995; Midgley et al. 1995) and SANBI e-Flora document *Tapinanthus oleifolius*
  growing directly as a stem hemiparasite on *Euphorbia virosa* (as well as *Aloidendron* and
  *Tylecodon*). Drawing *T. oleifolius* on *E. virosa* keeps the sky open and sets *E. virosa*
  apart from the Sonoran organ pipe.
- `Acanthosicyos horridus` (nara) has no tendrils and never hangs from above; it is a deep-rooted
  phreatophytic thorny bush trapping sand into hummocks, moved to `bed`/`side`.
- `Pachypodium namaquanum` carries **three** spines per tubercle (a spreading pair of 3–7 cm
  stipular spines plus a shorter central spine), not paired spines alone, and tilts 20–30° north.
- `Moringa ovalifolia` (phantom tree) is a summer-rain Central/Northern Namib escarpment tree that
  stands bare from June to September and leafs/flowers November–May. Replaced in the August–September
  single-season roster by `Tylecodon paniculatus` (butter tree / botterboom), which shares the pale
  peeling pachycaul bottle silhouette of the Richtersveld/Namaqualand escarpment while standing in
  full succulent leaf and early flower scape in August–September (if `Moringa ovalifolia` is kept
  as a secondary corner tree, it should either show bare white bottle wood with pendulous 3-angled
  pods or acknowledge a slight seasonal compression).
- `Sesuvium sesuvioides` overlapped with mangrove's `Sesuvium portulacastrum`: replaced by
  `Monsonia crassicaulis` (syn. *Sarcocaulon crassicaule*, Bushman's candle) and `Hoodia gordonii`
  (ghaap), with `Dimorphotheca sinuata` (orange Namaqualand daisy) available as an optional low bed
  accent.
- `Lithops sp.` is specified as `Lithops ruschiorum` (the true Central/Northern Namib fog-zone
  species co-occurring with *Welwitschia* on quartz/dolerite gravel plains, bearing opaque
  pearl-grey/ochre cordate bodies; *Lithops optica* f. *rubra* from the Lüderitz southern fog coast
  is an alternative if ruby-magenta bodies are wanted).

Sources: World Flora Online / WCVP (`wfo-0001335020`, `wfo-0000262078`, `wfo-0000965374`,
`wfo-0000413298`, `wfo-0000513667`, `wfo-0000899838`, `wfo-0000363042`, `wfo-0001297274`); Grace et
al. (2013), *Phytotaxa* 76(1): 7–14 (`doi:10.11646/phytotaxa.76.1.2`); Richter et al. (1995),
*Functional Plant Biology* 22(4): 537–544 (`doi:10.1071/pp9950537`); Midgley et al. (1995), *South
African Journal of Botany* 61(4): 230–232 (`doi:10.1016/s0254-6299(15)30534-2`); Roth-Nebelsick et
al. (2012), *J. R. Soc. Interface* 9(73): 1965–1974 (`doi:10.1098/rsif.2011.0847`); Ebner et al.
(2011), *J. Arid Environments* 75(6): 513–520 (`doi:10.1016/j.jaridenv.2011.03.005`); SANBI
PlantZAfrica and Tree Atlas of Namibia.

### 9. Eastern North American edge: Dfa, the Ohio Valley
Tulip tree (Liriodendron tulipifera), sugar maple (Acer saccharum), eastern redbud (Cercis
canadensis), black walnut (Juglans nigra); Virginia creeper (Parthenocissus quinquefolia), trumpet
vine (Campsis radicans), Dutchman's pipe (Aristolochia macrophylla); compass plant (Silphium
laciniatum), common milkweed (Asclepias syriaca), big bluestem (Andropogon gerardii), blazing star
(Liatris spicata), purple coneflower (Echinacea purpurea).

### 10. Northwest European woodland: Cfb, Devon, Cornwall, and the west of Ireland
Silver birch (Betula pendula), holly (Ilex aquifolium), hawthorn (Crataegus monogyna), pedunculate
oak (Quercus robur); ivy (Hedera helix), honeysuckle (Lonicera periclymenum), old man's beard
(Clematis vitalba); bracken (Pteridium aquilinum), bluebell (Hyacinthoides non-scripta), foxglove
(Digitalis purpurea), hart's-tongue fern (Asplenium scolopendrium), gorse (Ulex europaeus).
