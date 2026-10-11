# Climates

Gardens beyond the tropical and the Mediterranean, from a botany survey (October 2026). The survey
was written from memory: check every Latin name against a regional flora before a plant enters
`src/garden/plants.json`, and doubt those marked (?) most.

## Status

- **Built:** tropical, Mediterranean, Sonoran Desert, Afroalpine.
- **Drawn, in review:** Lowveld savanna, all nine plants and their layouts.
- **Waiting for seasons:** East Asian, boreal taiga, Eastern North American edge, Northwest
  European woodland. Each is a four-season climate, unlike the gardens built; see Seasons.
- **Waiting for water:** mangrove, and the lotus and rabbit-ear iris from the East Asian survey;
  see Water.

## The test

A garden earns its place if it can be told from every other by silhouette alone, before color.
Every plant must be real and belong to the climate; a garden need not keep to one place. Each
holds about twelve plants in three roles: **side** (about 4, branches reaching in from an
edge), **hanging** (about 3, from the top), **bed** (about 5, rising from the bottom).

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

**Order:** Sonoran first, now built: its ribbed columns, areoles, and pads are a new family of
geometry that the Namib euphorbias reuse. Afroalpine second: one moment, like the gardens
built, and its rosettes on columns and strand lichens serve the Namib, the taiga, and the water
garden later. The savanna third: the most legible silhouettes left, and the first warm palette.
East Asian waits for the season system, and mangrove for water.

## What the survey taught

- **Open land has no top.** Deserts, tundra, and savanna have almost nothing that truly hangs;
  the survey filled the role with standing plants (cholla fruit chains, nara, twinflower, beach
  morning glory). The three roles come from gardens with a canopy. In open gardens, leave the top
  to the sky: emptiness is the climate's character, and a fake hanger is a lie.
- **Geometry compounds.** `draw/` already covers much of the survey: `tendril`, `trailingStem`
  and `heartLeaf`, `palmate`, `needleTuft` and `pineCone`, `lavenderSpike`, `agaveLeaf` (a
  rosette's leaf), `walkFrond`. New geometry, by reach:
  - ribbed column with areoles and spines: saguaro, organ pipe, barrel cactus (built);
    Euphorbia virosa; Euphorbia ingens (three gardens)
  - jointed segments: prickly pear pads, cholla joints (built); Cissus quadrangularis;
    horsetail; bamboo culms (four gardens)
  - rosette on a column, extending `agaveLeaf`: giant groundsel; quiver tree, halfmens; Aloe
    marlothii (three gardens)
  - curtain of strands: Usnea lichen; Spanish moss; weeping willow; taiga beard lichens (four
    gardens)
  - bipinnate leaflets: mesquite, palo verde (built); umbrella thorn (two gardens)
  - one garden each: prop roots and pegs (mangrove), bract heads (fynbos), dichotomous fan
    (East Asian), pendant raceme (wisteria)
- **Overlaps to settle when choosing.** Candelabra euphorbias (Namib, savanna); aloe rosettes
  (Namib, savanna); mistletoe (Sonoran, Namib); Sesuvium (Namib, mangrove); Crinum (mangrove,
  savanna); silver birch (taiga, northwest Europe); beard lichens (Afroalpine, taiga); Erica
  (Afroalpine, fynbos); Clematis (fynbos, northwest Europe).

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

- **Verify, draw the signature plant, draw the rest, compose.** The botany check replaced six of
  the survey's twelve plants before a line was drawn. The giant groundsel took five rounds; once
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
- **Budget.** Ten segments a leaf are as smooth once the curve runs through them. Keep a plant
  near 50 KB gzipped.
- **Empty sides take real wood.** Fill a thin edge with a woody plant rooted past the frame (the
  young groundsel, the Mount Kenya heath), never with a hanger from the sky.

## What the savanna taught

- **A garden can enter, not only grow.** Each savanna plant starts off its place (`--enter` in the
  layout, as shares of its own size) and eases in as it grows, so the garden opens wide and fills
  as the visitor scrolls. Gardens that do not set it are unchanged: the motion is the garden's to
  choose, since it only displays the tokens.
- **A trunk that forks hides its neck under its limbs.** The baobab's limbs start well inside the
  neck and are drawn over it, without ink across the top; started at its edge, they poke out as
  hard cuts.
- **Tiers taper.** Foliage tiers with square ends show seams where they overlap; lens-shaped tiers
  read as one crown.
- **Leaves are drawn at the size they are seen.** A bipinnate leaf of nine pinnae reads the same as
  one of forty-four leaflets at garden size, at a fifth of the bytes; a palmate leaf is one wash,
  not a shape per leaflet.
- **Haiku at high effort verified the roster well,** and marked plainly what it could not confirm.

## Settled

- **How a visitor chooses a climate.** A switcher in the controls lists every garden by emblem
  and name (`src/garden/switcher.ts`); the choice is kept in the address and for the next visit.
  A first visit opens on the theme's garden: tropical by day, Mediterranean at night.
- **Each climate in both lights.** Every garden is authored for day and night in
  `src/tokens.css`: a day set under `:root` and a night set under the dark theme, grouped by
  garden. Night values are written out per token, not derived at runtime, and all tokens stay on
  `:root`.

## Seasons

The gardens built each show one moment. A four-season garden shows a year, which changes both
the drawings and the renderer, so these gardens wait until the system below is designed.

**The year is the scroll.** The intro is spring: today's growth (shoots, limbs, leaves unfolding,
flowers opening) already reads as spring. Scrolling carries the garden on through summer and
autumn, and the end of the scroll rests on winter; scrolling back runs the year back.

**What the system needs:**
- **Season windows.** Every leaf, flower, and fruit carries the span of the year it shows, not
  only the moment it unfolds. `draw/` stamps them as it stamps growth (`data-g`) today.
- **An exit.** Parts must leave as well as arrive: leaves color and fall, flowers drop, fruit
  swells and ripens. Only arrival exists now.
- **Leaf color by season.** One season value on the root, and `color-mix` between a species'
  summer and autumn tokens, in both lights. Changing it every frame restyles every inlined
  drawing, so measure before committing; stepping it at the redraw rate may be enough.
- **Bare winter wood.** Today's trees are drawn for leaves to cover the branch tips. A deciduous
  tree must read bare, so its twigs are drawn to be seen: spur shoots, buds, fine tips. This is
  why no seasonal plant should be drawn before the system exists.
- **A garden's own timeline.** `src/main.ts` grows every garden by one value, the intro plus the
  scroll. A seasonal garden maps the scroll past full growth into the year.

**Open questions:** which season reduced motion shows at rest (late spring is the fullest);
whether touch autoplay plays the whole year; what switching into a seasonal garden mid-scroll
shows; how winter rests at the page's end (bare is the climate's truth, and the plum's flowers
keep it from looking unfinished).

**East Asian through the year.** The survey's roster, revised: weeping willow replaces Japanese
cedar, whose spire nears the Mediterranean cypress and pine; plum replaces lotus, which waits for
water. Undecided: morning glory or hardy kiwi. Morning glory gives summer a second star; kiwi
must be drawn with serrate oval leaves to stay clear of the tropical philodendron's hearts.

| Plant | Latin | Role | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|---|---|
| Ginkgo | Ginkgo biloba | side | fresh green fans on short shoots | full green fans | gold fans, shed almost at once | bare limbs studded with spur shoots |
| Japanese maple | Acer palmatum | side | red-tinged new hands, tiny red flowers | green hands, paired winged keys | scarlet | fine bare twigs |
| Paulownia | Paulownia tomentosa | side | lilac panicles on bare wood | plate-sized heart leaves | leaves drop, capsules split, next year's buds already furred | bare, hung with capsules and furred buds |
| Weeping willow | Salix babylonica | side | first green, catkins | a full curtain | a yellowing curtain | bare whips that still hang |
| Plum | Prunus mume | side | new leaves, small fruit | green plums yellowing in the plum rain | leaves yellow and fall | flowers on bare zigzag wood, late in winter |
| Wisteria | Wisteria floribunda | hanging | violet racemes as the leaves unfold | pinnate leaves, velvet pods | yellow leaves, pods | bare twisted vines, pods splitting |
| Chocolate vine | Akebia quinata | hanging | purple-brown flowers | five-leaflet palms | purple pods split open | thinned leaves on twining stems |
| Morning glory | Ipomoea nil | hanging (or kiwi) | seedlings | blue funnels each morning | the last flowers, seed capsules | gone, an annual |
| Hardy kiwi | Actinidia arguta | hanging (or morning glory) | leaves on red stalks | white cup flowers, early | smooth green fruit | bare twining stems |
| Moso bamboo | Phyllostachys edulis | bed | shoots rising in sheaths; old leaves yellow and shed | full plumes on ringed culms | unchanged | the garden's one full green |
| Peony | Paeonia lactiflora | bed | red shoots, then ball flowers late in spring | glossy divided leaves | leaves redden, seed follicles | dies back to the ground |
| Hydrangea | Hydrangea macrophylla | bed | new leaves | mopheads in the plum rain | heads fade to antique green and rose | dried heads on bare stems |
| Red spider lily | Lycoris radiata | bed | strap leaves wither | dormant, nothing above ground | scarlet umbels on bare stalks | dark strap leaves, grown after the flowers |

The taiga and the two temperate woodlands take the same system, and their rosters get the same
four columns when their turn comes.

## Water

Water plants wait for a garden of their own, where the water is seen. The mangrove becomes that
garden or joins it; lotus (Nelumbo nucifera) and rabbit-ear iris (Iris laevigata) come to it
from the East Asian survey.

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

Waits for seasons. The table is the survey; the revised roster, through the year, is under
Seasons.

| Plant | Latin | Role | Note | New geometry |
|---|---|---|---|---|
| Ginkgo | Ginkgo biloba | side | Fan leaves on short shoots, one notch per fan | dichotomous fan veins |
| Japanese maple | Acer palmatum | side | Five to seven lobes held open like hands | palmate lobes, opposite pairs |
| Paulownia | Paulownia tomentosa | side | Plate-sized heart leaves; lilac panicles before them | huge heart leaves, panicles |
| Japanese cedar | Cryptomeria japonica | side | Shaggy spires of curved needles, bark peeling red | spiral needle fans, shredding bark |
| Wisteria | Wisteria floribunda | hanging | Violet racemes falling like rain | pinnate leaves, pendant racemes |
| Chocolate vine | Akebia quinata | hanging | Five-leaflet palms over dangling purple-brown flowers | five-leaflet clusters |
| Hardy kiwi | Actinidia arguta | hanging | Heart leaves on long twining stems, white stars | twining stem |
| Moso bamboo | Phyllostachys edulis | bed | Green culms ringed at every node, plumes at the top | node rings, sheath scars |
| Lotus | Nelumbo nucifera | bed (needs water) | Shield leaves on stalks; a pink flower over its seedpod | peltate disk, pod |
| Peony | Paeonia lactiflora | bed | Glossy divided leaves under ball-shaped flowers | biternate leaves |
| Red spider lily | Lycoris radiata | bed | Bare scarlet stamens on a leafless stalk | recurved umbel |
| Hydrangea | Hydrangea macrophylla | bed | Mophead clusters of pink or blue florets | corymb clusters |

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

**Nothing hangs from the top.** What hangs is honest and drawn with its host, as the desert's
mistletoe is: Usnea articulata draped over the tree heath (on Mount Kenya the beard lichens hang
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

| Plant | Latin | Role | Note | New geometry |
|---|---|---|---|---|
| Red mangrove | Rhizophora mangle | side | Arched red stilts lift the trunk out of the water | converging prop roots |
| Black mangrove | Avicennia germinans | side | A dark crown over a field of upright breathing pegs | pneumatophores |
| White mangrove | Laguncularia racemosa | side | A pale open crown with sky through it | sparse foliage |
| Buttonwood | Conocarpus erectus | side | A dense round head on the landward rim | cone-studded crown |
| Spanish moss | Tillandsia usneoides | hanging | Grey threads from every limb like wet hair | strand curtain |
| Giant airplant | Tillandsia utriculata (?) | hanging | Stacked green rosettes swelling on a limb | angled rosette cups |
| Beach morning glory | Ipomoea pes-caprae | hanging (stretch: a beach runner) | Purple funnels spilling over a dune lip | paired bilobed leaves |
| Giant leather fern | Acrostichum danaeifolium | bed | Tall leathery fronds, spore-dusted beneath | tall unscrolling frond |
| Smooth cordgrass | Spartina alterniflora | bed | Arching blades in a dense fringe | parallel arches |
| Saltwort | Batis maritima | bed | A low fleshy shrub greening the flats | jointed succulent stems |
| Sea purslane | Sesuvium portulacastrum | bed | A pink-stemmed mat hugging the mud | rooting carpet |
| Swamp lily | Crinum americanum | bed | A strap-leaf clump, white trumpets on a stalk | strap fan, long-tubed umbel |

### 5. Cape fynbos: Csb, the Cape Peninsula
Wet winters, dry summers, fire every decade or so; strong wind, bright light, poor sand. Palette:
silver-grey, cream, rose, bronze bract heads.

| Plant | Latin | Role | Note | New geometry |
|---|---|---|---|---|
| Silver tree | Leucadendron argenteum | side | Silky silver leaves in a round crown | radial silky rosettes |
| Sugarbush | Protea repens | side | Pink-red cups of overlapping bracts | bract heads |
| Hooded pagoda | Mimetes cucullatus | side | An upright shrub of hooded red heads | hooded bract clusters |
| Fire heath | Erica cerinthoides | side | Dense clusters of red tube flowers | whorled tubes |
| Wild grape | Rhoicissus digitata (?) | hanging | Hand-shaped leaves, coiling tendrils | tendril coils |
| Traveller's joy | Clematis brachiata | hanging | Twining stems, fluffy seed plumes | plumed seeds |
| Dodder laurel | Cassytha ciliolata | hanging | Leafless yellow-green threads | twining threads |
| King protea | Protea cynaroides | bed | One giant domed head on a short stem | stiff-bract dome |
| Thatching reed | Elegia tectorum | bed | A fountain of leafless green stems | reed fountain |
| Bugle lily | Watsonia borbonica | bed | Pink tubes up a spear | tubular spike |
| Pride of Table Mountain | Disa uniflora | bed | One scarlet hooded flower | hooded flower |
| Hooded pelargonium | Pelargonium cucullatum | bed | Pale hairy lobed leaves, pink flowers | hairy lobes |

### 6. Lowveld savanna: Aw, the Kruger lowveld of South Africa, early in December
Hard white light after the first rains: the trees just in leaf and flower, last year's grass
bleached to straw under the new green, a wide sky. Palette: grey and copper bark, straw and rust
grass, dusty olive leaves, white baobab and thorn flowers, a plum flame lily.

Drawn, in review. Verified in October 2026 against GBIF records for the eastern lowveld and the
regional floras. The moment is early December: the baobab, the umbrella thorn, the crinum, and
the star flower are in flower, the flame lily has its first bells, and the sausage tree still
carries last season's fruit.

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

### 8. Namib and Namaqualand: BWk, the Namibian coast to the Richtersveld
Low hazy light under dawn fog; wet air at the coast, rain failing for years. Palette: dune ochre
and rose, bone white, grey-green, welwitschia brown, flat yellow-green mats.

| Plant | Latin | Role | Note | New geometry |
|---|---|---|---|---|
| Quiver tree | Aloidendron dichotomum | side | A forked trunk, rosettes at the branch tips | dichotomous forks |
| Halfmens | Pachypodium namaquanum | side | A swollen trunk crowned by a rosette, paired spines | pachycaul, spine pairs |
| Phantom tree | Moringa ovalifolia | side | A pale bottle trunk under fine sparse leaves | sparse foliage |
| Damara milk-bush | Euphorbia damarana | side | A dense grey-green mound of leafless pencil stems | pencil stems |
| Namibian mistletoe | Tapinanthus oleifolius | hanging | Leafy clumps hanging from acacia | forking clumps |
| Nara | Acanthosicyos horridus | hanging (stretch: a dune shrub) | Spiny leafless stems over dune crests, melons at the joints | spiny trailing stems |
| Ceropegia | Ceropegia sp. (?) | hanging | Thin succulent stems falling from a ledge | paired leaves on threads |
| Welwitschia | Welwitschia mirabilis | bed | Two leathery straps spilling from a woody crown | torn ribbons |
| Dune grass | Stipagrostis sabulicola | bed | Fine tufts bent by wind | arcing blades |
| Living stones | Lithops sp. | bed | Pairs of fused pebble leaves in sand | fused leaf pairs |
| Sesuvium | Sesuvium sesuvioides | bed | Fleshy mats creeping over sand | radiating stems |
| Gifboom | Euphorbia virosa | bed | Clustered ribbed stems rising from sand | ribs and teeth |

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
