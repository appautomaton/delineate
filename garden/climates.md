# Climates

The gardens' shared mechanisms, seasons and water, and each garden's botanical reference: how its
plants look (through the year, where it shows one), what to keep apart in the drawing, what is
unresolved, and the sources. The tropical and Mediterranean gardens have no section.

## Seasons

Most gardens show one moment. A garden marked `year` in `gardens.ts` shows a year: its parts arrive
and leave in their own seasons, its leaves turn, and its wood stands bare in winter.

**One axis, the year.** Its progress u runs from 0 to 1 through the year, on the same axis growth
uses (`data-g`): spring 0 to 0.45, summer to 0.65, autumn to 0.85, winter to 1. Growth is not only
spring's: the spider lily's scape rises in autumn, the plum flowers in late winter, pods and seed
heads form after the flowers. Each happens where it happens on the one axis, and a seasonal
garden's plants are not staggered, so they keep to the calendar.

- **Where the page rests.** The intro grows a seasonal garden only into early spring (`BUD` in
  `main.ts`), its wood reaching in and hardly a leaf open, so the first scroll answers at once: the
  leaves open, and by late spring, its fullest moment, the garden is in full leaf and every
  entering plant has settled. Reduced motion shows that moment, where a single-moment garden shows
  itself fully grown. Touch autoplay stops in full summer (`SUMMER`). Scrolling back runs the year
  back. The address can pin any moment, `?u=0.8` for late autumn.
- **Switching in.** A seasonal garden switched into mid-scroll grows in straight to the page's
  season, passing through the year on the way.
- **The end.** The page ends on winter as the climate has it: bare wood and seed heads, with the
  plum flowering on bare zigzag wood so the end reads as finished.

**A part's life.** A part arrives at g and, if it leaves, falls at d (`part`'s `leave`, written
as `data-d`), or, marked `fade`, fades where it is: the hydrangea's mopheads fade to the dry heads
drawn beneath them. Wood, winter buds, and fruit that stays through winter never leave. A
herbaceous stem that dies back (the peony's, the spider lily's scape, the lotus's stalks) leaves
too (`grow`'s `leave`). What happens twice on the page's year is drawn twice at the same place:
the plum's flowers in early spring and again at the year's end, the spider lily's leaves standing
as the year opens and coming again after its flowers.

**Leaving reads as falling, not as arrival run backward.** A part shrinking back into its bud
reads as time reversed. A falling part lets go at once and drops toward the foot of its plant,
faster as it goes, swaying side to side and tilting, and fades over the second half of its fall.
A tree's shedding is spread over enough of the scroll to watch (the ginkgo's, about a sixth),
even where the real one sheds in days. Before it falls, a leaf has already turned. A dying stem
bends over from its base and fades.

**Turning.** A species that turns has an autumn tone, `--pl-<key>-autumn`, beside its summer one
in both lights, and a turning window on the year in `plants.json` (`turn`). `draw.ts` writes its
leaf color as a mix of the two by `--turn`; the page writes `--turn` on its bed in tenths, only
when the step changes.

**Bare winter wood.** A deciduous tree must read bare, so its twigs are drawn to be seen: spur
shoots, buds, fine tips. Draw it bare first, then leaf it.

**Water through the year (`春涨秋落`).** A garden with both `water` and `year` runs its water
through the monsoon year: low in early spring, rising gently through spring, full across summer
while the lotus and iris bloom, and receding through autumn to shallow winter water under the dry
lotus pods.

## Water

Water is a mechanism of the garden, not a feature of one garden. Below the surface is a tint, and
where roots and stems cross the surface they meet a soft edge: no mirrored reflections, which would
double every drawing and break the paper-and-wash look.

1. **Depth.** A garden with water sets `water` on its `Garden` entry in `src/garden/gardens.ts`: its
   default depth in `--u`, which `src/main.ts` writes as `--water` on `.garden`. The flag also gives
   the garden's plants the runtime treatment below.
2. **Drawings and layouts agree on the surface.** A drawing places what meets the water from
   `waterOf` in `draw/mangrove.ts`: high water in drawing units above the base, the default depth at
   10 units per `--u`. A layout draws each plant at its own scale (viewBox height ÷ `--h` units per
   `--u`), and `draw.ts` never reads layouts, so each layout sets its own depth on
   `:root[data-garden="<key>"] .garden .water`, chosen to land the surface on `waterOf` for the
   plant whose parts are sized to it: `--water = W × --h / viewBox height − sink`. Redraw that plant
   and its viewBox changes, and these numbers with it.
3. **Tide (`src/main.ts`).** `--tide` rises from 0 to `LOW_TIDE` over the intro, so roots and pegs
   stand exposed above a low rim, then to 1 over the scroll. When a water garden comes on show, the
   tide grows in with its plants. A garden with a year runs its water through the year instead
   (see Seasons).
4. **The band (`src/garden/paint.css`).** `.garden .water` is a fixed band `--water` × `--u` tall,
   lowered by `1 − --tide`, washed with `--water-tint` under a thin `--water-line` edge.
5. **Plants at the surface (`src/main.ts`).** `collect` wraps each water-garden plant in a group
   masked by a vertical luminance gradient that fades it below the waterline; `waterPlant` draws a
   glaze (`.wash.water-edge`) and ripple strokes (`.ink.water-line`) wherever a grown limb crosses
   it. Only limbs drawn with `grow` are found, so anything that should meet the water with a
   meniscus is drawn as a limb.
6. **The solver (`src/garden/arrange.ts`).** `arrange` reads the band's full height: no plant's
   anchor slides across the high-water line, and crowding below it costs a quarter as much.

## The gardens

### Sonoran Desert: BWh, southern Arizona and Sonora
Hard clear light and dry air; rain twice a year, so green flushes after storms and greys between.
Palette: blue-green and olive stems, silver felt, yellow palo verde and brittlebush, red ocotillo,
pale sand.

Eleven plants, and nothing hangs from the top.

| Plant | Latin | Role | Note |
|---|---|---|---|
| Saguaro | Carnegiea gigantea | bed, carries the height | A pleated column, arms lifting like raised hands |
| Ocotillo | Fouquieria splendens | side, from a bottom corner | Whip canes splay from one crown, bare and thorned |
| Foothill palo verde | Parkinsonia microphylla | side | Green trunk and limbs, leaves sparse as lace |
| Velvet mesquite | Prosopis velutina | side | Twisted dark limbs, feathered leaves, thorns at the nodes |
| Desert mistletoe | Phoradendron californicum | in the palo verde's drawing | Leathery clumps hanging from palo verde limbs |
| Sonoran ibervillea | Ibervillea sonorae | bed, trailing along the ground | Lobed leaves and coiled tendrils |
| Chain-fruit cholla | Cylindropuntia fulgida | bed | Jointed cylinders trailing strings of fruit |
| Organ pipe | Stenocereus thurberi | bed | Columns clustered from one base |
| Fishhook barrel | Ferocactus wislizeni | bed | A squat barrel of hooked red spines |
| Engelmann prickly pear | Opuntia engelmannii | bed | Flat pads stacked into a sprawling clump |
| Brittlebush | Encelia farinosa | bed | Silver felted leaves, yellow daisies on stalks |
| Creosote | Larrea tridentata | side, from a bottom corner | A resinous shrub, paired leaflets on many twigs |

### East Asian: Cfa, the lower Yangtze and Kanto plains
Monsoon summers, plum-rain haze, a clear gold autumn, bare trunks under a low winter sky.
Palette: bamboo olive, ginkgo butter, paulownia lilac, wisteria violet, lotus pink, lycoris
vermilion.

A year, with a still pond in the bed. Plants reach in from the sides and the top and enter as they
grow (`--enter`), so the garden's motion carries the year as much as its colors. Two woody vines
hold the top, each drawn with its host (an arbor beam, a bamboo pole), and both keep bare twisted
stems and split pods through winter. The moso's ringed culms rise from below the frame and out of
its top, the strongest upright in a winter of bare wood.

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

### Afroalpine: ET, the Teleki Valley on Mount Kenya, about 3,900 to 4,100 metres
Thin hard equatorial sun by day, frost almost every night, no seasons: "winter every night,
summer every day" (Hedberg 1964). Palette: silver felt, rust-brown skirts of dead leaves, pale
grey-green lichen, yellow groundsel heads, mauve thistle, cream everlastings, orange lichen on
the groundsel bark.

Kept to the Teleki Valley, where the giant rosettes meet the top of the heath belt and every plant
below is recorded growing together (Hedberg 1964; Downing et al. 2024).

| Plant | Latin | Role | Note |
|---|---|---|---|
| Giant groundsel | Dendrosenecio keniodendron | bed, carries the height | A trunk forked into a candelabra, one fork per flowering; each tip a metre-wide rosette over a skirt of dead leaves; spent panicles hang from the rosettes; orange lichen on the cork |
| Teleki's lobelia | Lobelia telekii | bed | One rosette under a column of long hairy bracts that hide its blue-purple flowers |
| Cabbage groundsel | Dendrosenecio keniensis | bed | Rosettes at ground level on a hidden creeping stem, white felt beneath; a narrow spike of nodding yellow-rayed heads |
| Tree heath | Erica arborea | side | Red-brown limbs plumed with whorls of needle leaves, white bells along the side shoots, Usnea strands draped over the limbs |
| Mount Kenya thistle | Afrocarduus keniensis | bed | A cobwebbed spiny rosette, a winged spiny stem to 2.4 metres, dense clusters of mauve heads |
| Silver lady's mantle | Alchemilla argyrophylla | bed | A shrub to a metre, silver all over, tiny three-lobed leaves; the field layer under the groundsels |
| Water lobelia | Lobelia gregoriana | bed | Shiny rosettes on sprawling stems with dead-leaf mantles; a narrow spike whose short bracts show the flowers; last year's dead spikes left standing |
| Brown's everlasting | Helichrysum brownei | bed | A grey cushion of linear leaves, papery cream heads with pink bases |
| Tussock grass | Festuca pilgeri | bed | Dense tussocks of fine blades |
| Haplocarpha | Haplocarpha rueppellii | bed | A flat glossy rosette pressed to the ground, yellow daisies on short stalks |
| Young giant groundsel | Dendrosenecio keniodendron | side, from a bottom corner | Not yet flowered, so not yet branched: one rosette on a skirted column, leaning in from beyond the frame |
| Mount Kenya heath | Erica trimera subsp. keniensis | side | A low shrub's grey twiggy branch, its sticky light-green leaves packed into rounded clumps, bells opening white and aging brown |

**Unresolved:** the flower color of L. gregoriana on Mount Kenya (related subspecies are purple
or mauve); the tallest spike of L. telekii (1.2 metres measured, "to 8 ft" on a label); the height
of E. arborea near 3,900 metres (draw a shrub to small tree); whether Usnea hangs on Erica above
3,800 metres (records run 3,600 to 3,800).

**By night the giant rosettes close.** The groundsel folds its leaves over the bud into a night
bud; Teleki's lobelia presses into a tight head; the cabbage groundsel shuts into a white ball of
felted undersides; the water lobelia's rosette fluid freezes over in crescents. The night theme
does not show it yet.

Sources: Hedberg 1964, *Features of Afroalpine Plant Ecology*
(diva-portal.org/smash/get/diva2:565487/FULLTEXT01.pdf); Downing et al. 2024, the Teleki Valley
re-survey (tpyoung.ucdavis.edu); Flora of Tropical East Africa (plants.jstor.org); WCVP accepted
names; GBIF lichen specimens.

### Mangrove: Aw, the Everglades and the Caribbean lagoons
Flat white light off brackish water; hot salt air; tides, not seasons. Palette: glaucous olive,
leathery dark green, rust-red stilts, black mud, bleached silver, cream flowers.

Twelve species of one tidal zonation, from the seaward prop-root fringe across the intertidal
pneumatophore mudflat to the brackish landward rim.

| Plant | Latin | Role | Note |
|---|---|---|---|
| Red mangrove | Rhizophora mangle | side, rooted in water | Multi-tiered catenary arches of rust-red stilt roots and plumb-vertical aerial drop roots lifting an opposite-leaved crown hung with 15 to 25 cm viviparous pencil propagules above the waterline |
| Black mangrove | Avicennia germinans | side | A dark fissured trunk and rounded crown of grey-backed opposite leaves over a bristling intertidal carpet of erect pencil pneumatophores, creamy four-lobed flowers, and lima-bean capsules |
| White mangrove | Laguncularia racemosa | side | An open ascending crown of rounded yellow-green opposite leaves on bright carmine-red petioles with paired sub-blade nectar glands, loose flowering spikes, and ribbed obovoid drupes |
| Buttonwood | Conocarpus erectus | side, on the landward rim | A leaning rough-plated trunk and angled twigs of spirally alternate elliptic leaves bearing stalked panicles of globose cone-like button heads |
| Spanish moss | Tillandsia usneoides | hanging (on host limbs) | Rootless cascading silver-grey festoons of flexuous wiry stems and curly two-ranked scaly filiform leaves draped from mangrove and buttonwood limbs |
| Giant airplant | Tillandsia utriculata | hanging (perched on host limb) | A solitary massive cream-green crateriform tank rosette of spreading recurved blades anchored on a stout limb, raising a tall laxly 2- to 3-pinnate green-and-rose panicle with tubular white flowers |
| Beach morning glory | Ipomoea pes-caprae subsp. brasiliensis | bed (prostrate shore runner) | Long fleshy purplish-green stolons creeping across the shore berm, rooting at the nodes with upright bilobed goat's-foot leaves and rose-magenta funnels |
| Giant leather fern | Acrostichum danaeifolium | bed | A tall erect V-clump of stiff 1-pinnate leathery fronds with 20 to 32 overlapping lanceolate pinna pairs; fertile inner fronds coated golden-rust beneath with sporangia |
| Smooth cordgrass | Sporobolus alterniflorus (syn. Spartina alterniflora) | bed, emergent in water | Dense intertidal colonies of smooth hollow culms, flat tapering grey-green blades, and narrow wand-like panicles of appressed one-sided spikes |
| Saltwort | Batis maritima | bed | Sprawling woody-based stems sending up perpendicular ranks of 4-angled shoots crowded with swollen club-shaped chartreuse succulent leaves and axillary green cones |
| Sea purslane | Sesuvium portulacastrum | bed | A low prostrate mat of fleshy crimson-pink stems hugging the mud, opposite glossy jade-green spatulate leaves, and solitary five-pointed rose-pink star flowers |
| Swamp lily | Crinum americanum | bed | A basal fountain of channeled dark-green strap leaves and a stout scape crowned by an umbel of 2 to 6 spider-like white flowers with long crimson-purple stamen filaments |

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

### Cape fynbos: Csb, Table Mountain and the Cape Peninsula, October
Wet winters, dry summers, fire every decade or so; strong wind, bright light, poor sandstone and
granite slopes. Palette: silky silver-grey, cream, shell pink and carmine bracts, golden pincushion
styles, chestnut restio sheaths, gentian blue.

The moment is October (mid-spring), when the king protea, the tree pincushion, the hooded pagoda,
the fire heath, the watsonia, the pelargonium, the buttonbush, the Cape everlasting, and the blue
sceptre all peak together, the silver tree and the sugarbush flower while carrying last year's
cones, and the thatching reed sheds its papery brown sheaths.

| Plant | Latin | Role | Note |
|---|---|---|---|
| King protea | Protea cynaroides | bed, carries the focal bowl | Thick unbranched stems with long red-stalked oval leaves and a 20 to 30 cm bowl of pointed silky-pink bracts around a snowy-white cone |
| Silver tree | Leucadendron argenteum | side | Stout ascending grey limbs shingled with silky silver lance-leaves flaring into terminal rosettes around heavy silver-felted cones |
| Sugarbush | Protea repens | side | Woody branches of narrow upright blue-green leaves and V-shaped goblets of pointed cream-to-carmine bracts, draped with Cassytha threads and old brown cones |
| Tree pincushion | Leucospermum conocarpodendron | side, from a corner | Thick corky limbs branching at right angles, wedge leaves notched with red-tipped apical teeth, and 8 cm golden domes of arching styles with conical pollen presenters |
| Hooded pagoda | Mimetes cucullatus | bed | Upright wand stems clad in oval leaves, crowned by a cylindrical pagoda where scarlet-and-gold folded leaf-hoods cowl over white beards and red style tufts |
| Cape thatching reed | Elegia tectorum | bed | A dense fountain of leafless dark-green culms ringed with black node bands, curling golden-brown papery sheaths, and dark-brown terminal plumes |
| Fire heath | Erica cerinthoides | bed | Wiry stems with 4- to 6-whorled needles, tipped with nodding umbels of swollen hairy crimson-scarlet tubes |
| Cape bugle-lily | Watsonia borbonica | bed | A basal fan of broad sword leaves and a tall branched spire lined in two ranks with rose-magenta bugle trumpets |
| Hooded pelargonium | Pelargonium cucullatum | bed | Hairy sprawling stems with cupped kidney-shaped toothed leaves and long-stalked umbels of asymmetric magenta-pink flowers feathered dark purple |
| Kolkol | Berzelia lanuginosa | bed | Soft bottlebrush stems clothed in fine yellow-green needles, topped by clusters of creamy-white spherical pompom heads and reddish fruiting knobs |
| Cape everlasting | Phaenocoma prolifera | bed | Stiff white-woolly branches studded with bead-like granular spur shoots, crowned with 5 cm glossy magenta-pink papery star-heads |
| Blue sceptre | Aristea capitata | bed | Stiff sword-leaf fans and 1.5 m rod stems packed along the upper third with sessile clusters of deep gentian-blue six-petaled stars and papery brown spathes |

**Unresolved:** whether to draw Leucospermum conocarpodendron subsp. viridum (bright green hairless
leaves, Kirstenbosch to Cape Point) rather than subsp. conocarpodendron (silver-felted leaves,
Table Mountain and Lion's Head) so its foliage stays distinct in tone from Leucadendron argenteum;
whether Gladiolus carneus (blush-pink funnels with carmine spades) should join or replace Aristea
capitata; whether Disa uniflora is wanted despite its January–February bloom.

Sources: World Flora Online / WCVP and SANBI e-Flora of South Africa (Goldblatt & Manning 2000;
Manning & Goldblatt 2012, *Strelitzia* 29); SANBI PlantZAfrica monographs (pza.sanbi.org); Fernkloof
Nature Reserve Herbarium (fernkloof.org.za); GBIF occurrence and monthly phenology facets for the
Cape Peninsula; iNaturalist flowering phenology histograms.

### Lowveld savanna: Aw, the Kruger lowveld of South Africa, early in December
Hard white light after the first rains: the trees just in leaf and flower, last year's grass
bleached to straw under the new green, a wide sky. Palette: grey and copper bark, straw and rust
grass, dusty olive leaves, white baobab and thorn flowers, a plum flame lily.

The moment is early December: the baobab, the umbrella thorn, the crinum, and the star flower are in
flower, the flame lily has its first bells, and the sausage tree still carries last season's fruit.

| Plant | Latin | Role | Note |
|---|---|---|---|
| Baobab | Adansonia digitata | bed, carries the height | A swollen grey trunk, thick limbs thrust up like roots, new palmate leaves, white flowers hanging on long stalks |
| Umbrella thorn | Vachellia tortilis subsp. heteracantha | side | A flat crown on zigzag limbs, thorns in pairs (one long, straight, and white, one short and hooked), white ball flowers, coiled pods |
| Sausage tree | Kigelia africana | side | A rounded crown of pinnate leaves, last season's long grey fruit hanging on rope-like stalks |
| Marula | Sclerocarya birrea subsp. caffra | side, from a corner | A dense rounded crown of pinnate leaves on a grey mottled trunk |
| Flame lily | Gloriosa superba | bed, scrambling | Leaf-tip tendrils climbing through the grass, nodding plum flowers with reflexed tepals |
| Red grass | Themeda triandra | bed | Tufts with drooping clusters of rust-red spikelets |
| Fine thatching grass | Hyparrhenia filipendula | bed | Tall culms with slender false panicles |
| Sabie crinum | Crinum macowanii | bed | A blue-green strap rosette, an umbel of white bells striped pink |
| Star flower | Hypoxis hemerocallidea | bed | Three-ranked hairy strap leaves, erect scapes of yellow stars |

**Unresolved:** how far south the baobab grows wild in Kruger; whether the umbrella thorn's crown
is flat (a nursery source; subsp. heteracantha is shrubbier); the crinum's altitude (Wikipedia
gives 1,000 to 2,600 metres, above the lowveld, though GBIF records place it there, and Limpopo's
crinum may be C. stuhlmannii); the flowering months of the star flower and the thatching grass.
Candidates if the composition needs more, to verify before drawing: weeping wattle (Peltophorum
africanum, yellow sprays September to February) and leadwood (Combretum imberbe, cream flowers
November to March).

Sources: the GBIF occurrence API; the Floras of Zimbabwe, Botswana, and the Caprivi; Wikipedia;
SANBI PlantZAfrica (search excerpts only: its pages refused the fetch).

### Boreal taiga: Dfc, Siberia and Fennoscandia
Low sun, a long snowed-under winter, cold wet air, a brief incandescent autumn (*ruska*). Palette:
black-green spruce, chalk-white birch bark, salmon-orange pine bark, amber-gold larch, pale
chartreuse-grey and chocolate-black beard lichens, scarlet lingonberry, amber cloudberry, magenta
fireweed, rust-felted Labrador tea.

A year (`year`, from April): four trees reach in from the sides, two beard lichens hang from living
spruce and pine boughs along the top, and six forest-floor plants rise from the bed.

| Plant | Latin | Role | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|---|---|
| Siberian spruce | Picea obovata | side | lime-green shoot tips, erect crimson female conelets, yellow-red male cones | dark blue-green 4-angled needles; cones turn pendulous and green-purple | glossy brown cylindrical cones with smooth rounded scales | dark evergreen tiers hung with pendulous brown cones |
| Siberian larch | Larix sibirica | side | emerald needle tufts burst from woody spurs; erect rose-pink female cones | soft green rosettes of 25–40 needles on spurs, single needles on long shoots | needles turn brilliant amber-gold and shed | bare buff-grey twigs studded with dark spur pegs and erect brown cones |
| Silver birch | Betula pendula | side | weeping twigs hang with yellow-brown male tassels as sticky diamond leaves unfold | curtain of dark green doubly serrate triangular leaves, green cylindrical catkins | butter-gold curtain, fruiting catkins shattering into winged nutlets | chalk-white peeling trunk with black diamond fissures, bare weeping twigs with winter catkins |
| Scots pine | Pinus sylvestris | side | erect golden-brown "candles" at shoot tips, yellow pollen clusters, tiny red conelets | twisted blue-green needle pairs on flaky salmon-orange limbs, swelling green cones | oldest needle cohort yellows and drops; 2nd-year cones turn dull ochre-brown | blue-green needle tufts and closed conical cones on bright orange-red upper bark |
| Methuselah's beard | Usnea longissima (syn. Dolichousnea longissima) | hanging, on spruce bough | hydrated pale chartreuse-green strands with perpendicular fishbone fibrils | pale silver-green garlands draped unattached over spruce twigs | bright pale green in autumn mist | frosted silver-grey tinsel strands |
| Horsehair lichen | Bryoria fremontii (syn. Alectoria fremontii) | hanging, on pine bough | dark chocolate-brown to black horsehair locks on orange pine bark | dry olive-black dichotomous thread tangles | dark brown-black locks swelling in autumn rain | black horsehair skeins against winter sky |
| Twinflower | Linnaea borealis | bed, creeping foreground | trailing woody stolons with opposite evergreen rounded crenate leaves | thread-like erect stalks forked into paired nodding pale-pink bells | evergreen stolons, tiny nodding yellow-brown achenes | low evergreen leaf pairs hugging the ground |
| Lingonberry | Vaccinium vitis-idaea | bed | glossy leathery oval leaves, terminal nodding racemes of white-pink urns in late spring | green berries swelling among dark glossy foliage | dense bunches of glossy scarlet-red berries | evergreen dwarf clumps with persistent scarlet berries |
| Labrador tea | Rhododendron tomentosum (syn. Ledum palustre) | bed | narrow rolled leaves unfold white-felted, turning rusty beneath; white star corymbs in late spring | full domes of 5-petalled creamy-white flowers with 10 protruding stamens | brown 5-valved capsules split from the base on down-curved stalks | evergreen leaves folded straight down against the stem, showing rust-woolly backs, below dry capsule umbels |
| Cloudberry | Rubus chamaemorus | bed | pleated 5–7-lobed kidney leaves rise with a single white 5-petalled flower per stem | hard ruby-red berry clasped inside calyx lobes, ripening to plump golden-amber | leaves turn deep burgundy-bronze; fruit gone, empty star calyxes remain | dies back to low dry stems and persistent calyx husks |
| Wood horsetail | Equisetum sylvaticum | bed | pale pinkish-brown fertile stems with terminal spore cones alongside unrolling green stems | cones wither as fertile stems branch out; tiered lacy pagodas of compound drooping whorls | compound whorls yellow and bleach to straw | dies back to the ground after frost |
| Fireweed | Chamaenerion angustifolium (syn. Epilobium angustifolium) | bed | reddish shoots rising with spirally alternate willow-like lance leaves | tall wands crowned by tapering racemes of magenta-rose 4-petalled flowers opening base to tip | scarlet leaves; lower pods split into 4 curling valves releasing white silk plumes | tall dry bronze stalks topped with curled 4-valved pods and lingering white silk |

**The calendar,** Fennoscandia and western Siberia; the year axis starts in April (snowmelt and bud
swell).

| Plant | Leaves | Flowers / Cones | Fruit and what persists | Autumn and leaf fall |
|---|---|---|---|---|
| Siberian spruce | evergreen (needles persist 5 to 9 years); lime-green bud burst late May to June | pollination late May to June: erect purple-crimson female cones, strawberry-red male cones shedding yellow pollen | cones pendulous, ripening glossy brown September to October, staying all winter and shedding seed in March to April | evergreen |
| Siberian larch | soft bright green tufts emerge early to mid-May | May, with the new needles: erect rose-pink or green female cones, globose yellow male cones | erect brown ovoid cones (2.5 to 4.5 cm) ripen September, persisting on bare branches for 2 to 5 years | turns bright amber-gold in September, sheds needles late September to mid-October; bare peg-studded twigs all winter |
| Silver birch | late April to mid-May | late April to May: overwintered male catkins elongate to 5–6 cm yellow-brown tassels; erect green female catkins | pendulous brown fruiting cylinders (2 to 3.5 cm) ripen July to August, shattering in autumn and onto winter snow | bright yellow in September to October, bare by mid-October; next year's rigid dark male catkins sit at twig tips all winter |
| Scots pine | evergreen (needles persist 3 to 5 years, to 8 in the far north); "candles" elongate May to June | late May to June: yellow male cones at candle base, tiny crimson female conelets at tip | cones mature in autumn of their 2nd year (3 to 7.5 cm, brown), staying closed all winter and opening scales in April to May | oldest (3rd–4th year) needles turn yellow and drop in September to October |
| Methuselah's beard | perennial thallus all year | apothecia rare; reproduces by wind-blown thallus fragments | whole pale curtain persists all year on spruce boughs | unchanged |
| Horsehair lichen | perennial thallus all year | yellow soralia and apothecia rare | whole dark brown-black tangle persists all year on pine boughs | unchanged |
| Twinflower | evergreen (each leaf pair lives 2 years); new stolon leaves in May to June | June to July (into August in the north), paired nodding fragrant pink bells | tiny nodding yellow-brown 1-seeded dry fruit (achene) enclosed in sticky bracteoles, August to September | evergreen prostrate stolons through winter; flower stalks wither in autumn |
| Lingonberry | evergreen (leaves live 2 to 4 years); new apical leaves in May to June | late May to July (occasionally a small second bloom in August) | glossy scarlet berries ripen late August to September, persisting on the stems under snow into spring | evergreen leathery leaves all winter |
| Labrador tea | evergreen (leaves live 2 years); new white-pubescent leaves in May to June | late May to July, terminal umbel-like corymbs of white flowers | 5-valved brown capsules on down-curved pedicels ripen August to September, splitting from the base and persisting all winter | older leaves shed in autumn; remaining evergreen leaves droop vertically against the stem in winter frost |
| Cloudberry | May, unfolding pleated 5–7-lobed leaves | late May to June, solitary white dioecious flowers | berry ruby-red and enclosed in sepals in June to early July; sepals spread as fruit turns golden-amber in July to August | leaves turn burgundy-red in September and wither in October; dry stems and spreading calyx stars in winter |
| Wood horsetail | fertile brown stems early May, sterile green stems May | spore cones shed spores May to early June, then wither as fertile stems grow green compound whorls | none in winter | turns yellow-tan in September to October and collapses after frost |
| Fireweed | red shoots late April to May | July to August, racemes opening progressively from bottom to top | linear capsules split from apex into 4 recurved valves with white silky coma from August to October | leaves turn fiery crimson in September; dry stems with curled 4-valved pods and silk tufts stand through winter |

**Drawing facts.**
- **Siberian spruce (*Picea obovata*):** Narrow conical crown to 15–35 m, main branches horizontal to
  drooping with pendulous side branchlets; young shoots orange-brown, densely glandular-pubescent.
  Needles spirally arranged, pointing forward on upper side and spreading below, 4-angled
  (quadrangular-rhombic in cross-section), 1.3–2.3 cm × 2 mm, shiny dark green to blue-green with
  4–7 stomatal lines per face, mounted on woody peg-like sterigmata. Female cones erect and
  dark purple-crimson (3–4 cm) at pollination in May–June, turning pendulous, cylindric-ovoid,
  5–10 cm × 2–3 cm, maturing glossy brown with **smoothly rounded, entire, convex obovate seed
  scales** (1.8–2.1 × 1.5–1.8 cm)—unlike European *Picea abies*, whose cones are 10–15 cm with
  notched/rhombic scales.
- **Siberian larch (*Larix sibirica*):** Deciduous conifer to 20–40 m; pale yellow-buff to grey-yellow
  weakly drooping branchlets studded with dark cylindrical short spur shoots (brachyblasts, 2–6 mm).
  Needles soft, flat (keeled beneath), bright emerald green in spring/summer and amber-gold in
  autumn, 2–4.5 cm × 1 mm, borne in dense rosettes of **25–40 needles per short spur** (and singly in
  a spiral along elongating terminal shoots). Mature female cones **strictly erect** on the twig,
  ovoid, 2.5–4.5 × 2–3.5 cm, with 25–40 loosely appressed, slightly incurved, rusty-downy rounded
  scales (bracts hidden), opening in autumn and remaining erect and grey-black on the bare winter
  twigs.
- **Silver birch (*Betula pendula*):** Deciduous tree to 15–25 m; trunk bark chalk-white, peeling
  horizontally in papery strips, marked with dark horizontal lenticels and breaking at the lower trunk
  into **rough black diamond-shaped fissures**. Main branches ascending, side branchlets long,
  slender, whip-like and **strongly pendulous**, dark reddish-brown, glabrous and studded with pale
  resin warts (verrucae). Leaves alternate on 2–3 cm slender petioles, rhombic-triangular (diamond
  to deltoid-ovate), 3–7 × 2–5 cm, truncate to broadly cuneate base, long-acuminate tip, **doubly
  serrate** margin. Male catkins 2–4 at shoot tips: rigid dark purple-brown cylinders (2–3 cm) in
  autumn/winter, elongating in spring to 5–6 cm × 7 mm pendulous yellow-brown tassels. Female catkins
  erect/ascending and pale green (1.5–2 cm) in spring, becoming pendulous brown cones (2–3.5 cm ×
  8–10 mm) that shatter in autumn/winter into 3-lobed scales and 2 mm winged nutlets.
- **Scots pine (*Pinus sylvestris*):** Evergreen conifer to 15–35 m; upper trunk and limbs clad in
  **bright salmon-orange to coppery-red papery flaking bark** (lower trunk dark grey-brown fissured
  plates). Needles in **fascicles of 2** bound by a persistent 5–8 mm grey basal sheath, stiff,
  glaucous blue-green, semi-circular in cross-section, **twisted**, 3–7 cm × 1.5–2 mm. Spring
  "candles" (erect elongating buds) 4–10 cm, golden-brown. Seed cones short-stalked, **pointing
  backward (deflexed) along the shoot**, pointed conical-ovoid, 3–7.5 × 2–3.5 cm, green in summer,
  maturing dull yellow-brown/ochre with rhombic flat-to-pyramidal scale apophyses, opening into
  broadly conical rosettes in spring.
- **Methuselah's beard (*Usnea longissima*, syn. *Dolichousnea longissima*):** Pendent fruticose
  epiphytic lichen hanging 30–100+ cm (up to 3 m in nature) draped unattached over spruce twigs.
  Consists of a single unbranched (or sparsely forked) pale straw-yellow to silvery grey-green main
  strand (1–2 mm thick, with a tough white internal cord) clothed perpendicularly along its entire
  length with dense, even, horizontal **fibrils 5–25 mm long** (resembling a fishbone or tinsel
  garland).
- **Horsehair lichen (*Bryoria fremontii*, syn. *Alectoria fremontii*):** Pendent fruticose lichen
  hanging 15–50 cm (to 90 cm) from Scots pine branches. Dense, soft, cascading horsehair-like locks
  of dark chocolate-brown to olive-black cylindrical-to-flattened threads (main branches 0.4–1.5 mm
  wide, wrinkled and twisted with age) branching **dichotomously at acute angles** into fine capillary
  tips, without perpendicular fibrils or a white central cord.
- **Twinflower (*Linnaea borealis*):** Creeping evergreen subshrub with thread-like pubescent woody
  stolons 20–60 cm long rooting at nodes; opposite pairs of small orbicular-oval leaves 5–12 ×
  4–8 mm, leathery dark green above, pale beneath, with 1–3 pairs of shallow rounded marginal teeth
  on 2–4 mm petioles. Flowering stalks rise vertically 5–8 cm, leafless except at base, forking at
  the apex into two short pedicels (<10 mm) bearing **a pair of nodding, trumpet- to bell-shaped
  5-lobed pale pink flowers** (7–12 mm long, deeper rose inside) fragrant at dusk.
- **Lingonberry (*Vaccinium vitis-idaea*):** Colonial dwarf evergreen shrub 10–30 cm tall with erect
  terete puberulent stems. Leaves alternate, crowded, leathery, obovate to elliptic, 10–25 × 5–10 mm,
  glossy dark green with impressed veins above, **pale green dotted with dark-brown sessile glands
  beneath**, margins entire and rolled under (revolute), tip rounded or notched. Flowers in terminal
  nodding racemes (1.5–3 cm, 4–10 flowers): 4-lobed white to pale-pink campanulate-urceolate bells
  (5–7 mm) with slightly exserted style. Berries globose, 6–10 mm across, glossy bright scarlet-red,
  packed in heavy terminal clusters.
- **Labrador tea (*Rhododendron tomentosum*, syn. *Ledum palustre*):** Erect evergreen shrub 30–80 cm
  tall; young twigs and winter buds coated in dense rusty-red (ferruginous) wool. Leaves alternate,
  leathery, linear to narrowly oblong, 2–5 cm × 2–8 mm, dark wrinkled green above, **margins strongly
  rolled under (revolute)**, underside completely covered in **dense rusty-orange woolly felt**
  (white when first unfolding in May); in winter cold, leaves hang steeply downward parallel to the
  stem. Inflorescence a terminal hemispherical umbel-like corymb (3–5 cm across) of 15–35 erect
  long-pediceled (1–2.5 cm) pure white 5-petalled star flowers (10–15 mm across) with 10 long
  protruding stamens. Fruiting pedicels curve sharply downward at the tip, bearing 3.5–5 mm ovoid
  brown 5-valved capsules that split from the base upward and persist all winter.
- **Cloudberry (*Rubus chamaemorus*):** Unarmed herbaceous perennial 10–25 cm tall rising from
  creeping rhizomes; each erect unbranched annual stem bears 1–3(–4) alternate long-petioled (3–6 cm)
  leaves and a **single terminal flower**. Leaf blades reniform-orbicular (kidney-shaped), 4–8 cm
  wide, strongly pleated (rugose/plicate), palmately **5–7-lobed** with rounded serrate lobes.
  Flowers solitary, erect, 2–3 cm across, with 5 (rarely 4–6) broad white obovate petals. Fruit a
  single erect hemispherical aggregate berry (1.5–2.2 cm across) of **5–25 large plump drupelets**:
  initially ruby-red and clasped by 5 pointed green calyx lobes, which spread open as the berry
  swells into a translucent **golden-amber to salmon-yellow** dome.
- **Wood horsetail (*Equisetum sylvaticum*):** Erect hollow jointed stems 30–60 cm tall, 2–5 mm thick,
  with 10–18 vertical ridges and loose nodal sheaths (6–15 mm long) green below and **papery
  reddish-brown above, fused into 3–4 broad blunt lobes/teeth**. Above the lower third, each node
  bears a dense whorl of 12+ slender arching lateral branches that **branch again (2-pinnate compound
  whorls)** and droop gracefully at the tips, creating tiered lacy horizontal umbrellas. Spring
  fertile stems emerge reddish-tan topped by a blunt ovoid brown strobilus (1.5–2.5 cm on a 3–4 cm
  stalk) that withers after shedding spores in May–June while the stem greens and grows compound
  whorls.
- **Fireweed (*Chamaenerion angustifolium*, syn. *Epilobium angustifolium*):** Tall unbranched erect
  smooth reddish stems 80–150 cm tall. Leaves spirally alternate, willow-like, narrowly lanceolate,
  7–15 × 1–2.5 cm, dark green above, pale glaucous beneath with a characteristic **continuous
  submarginal loop vein**. Terminal symmetrical pyramidal raceme (20–40 cm): dark crimson reflexed
  buds at the pointed apex, open 2–3 cm **4-petalled magenta-rose flowers** (with 4 narrow dark-pink
  sepals, 8 stamens, and a 4-cleft cross stigma) in the middle, and ascending reddish-purple linear
  seed capsules (4–9 cm × 2–3 mm) below. In autumn, capsules split from the apex into **4 strongly
  recurved curling valves**, releasing billowy masses of white silky-plumed seeds (coma 1–1.7 cm).

**Keep apart in the drawing.**
- **The two lichens:** pale straw-green *Usnea longissima* with perpendicular fishbone fibrils on a
  spruce bough, against dark chocolate-black *Bryoria fremontii* in dichotomous hair tangles on an
  orange-barked pine bough. Both differ from the Afroalpine's sausage-constricted *Usnea
  articulata*.
- **Siberian spruce (*Picea obovata*) vs. Mediterranean cypress (*Cupressus sempervirens*):** Drawn
  as a `side` plant reaching in from the edge, *Picea obovata* never repeats the upright flame of
  *Cupressus*: its boughs sweep outward and downward in layered concave tiers hung with curtains of
  pendulous branchlets, bristling 4-angled needles, and 6–8 cm cylindrical pendulous brown cones.
- **Siberian spruce (*Picea obovata*) vs. Siberian larch (*Larix sibirica*):** Kept apart by cone
  orientation, needle grouping, and autumn/winter behavior: spruce is dark blue-green and evergreen
  with solitary 4-angled needles and **pendulous** 6–8 cm cones; larch is bright emerald turning
  **brilliant amber-gold in autumn and bare in winter**, with needles in soft rosettes of 25–40 on
  woody spur pegs and small 3 cm cones that stand **strictly erect** above the twig.
- **Scots pine (*Pinus sylvestris*) vs. Mediterranean stone pine (*Pinus pinea*):** *Pinus sylvestris*
  is set apart by its bright **salmon-orange peeling upper bark**, short twisted glaucous blue-green
  needle pairs (3–7 cm vs. 10–20 cm in *P. pinea*), spring upright golden "candles", and small
  pointed conical cones (3–7.5 cm) pointing backward along the branch.

**Unresolved.**
- Whether *Usnea longissima* should be labeled under its traditional name `Usnea longissima` Ach. or
  its segregate `Dolichousnea longissima` (Ach.) Articus.
- Exact date in late autumn when *Rhododendron tomentosum* folds its leaves downward against the
  stem (triggered by sub-zero frost in October–November).

**Sources.**
- Flora of China @ efloras.org: *Picea obovata* (Vol. 4 p. 26), *Larix sibirica* (Vol. 4 p. 35),
  *Pinus sylvestris* (Vol. 4 p. 18), *Betula pendula* (Vol. 4 p. 311), *Linnaea borealis* (Vol. 19
  p. 648), *Vaccinium vitis-idaea* (Vol. 14 p. 499), *Ledum palustre* (Vol. 14 p. 259), *Rubus
  chamaemorus* (Vol. 9 p. 285), *Equisetum sylvaticum* (Vol. 2–3 p. 68), *Chamerion angustifolium*
  (Vol. 13 p. 409).
- Flora of North America @ efloras.org: *Equisetum sylvaticum* (Vol. 2), *Rhododendron tomentosum*
  (Vol. 8 p. 455), *Vaccinium vitis-idaea* (Vol. 8 p. 516), *Rubus chamaemorus* (Vol. 9).
- World Flora Online (WFO / WCVP): `wfo-0000482620`, `wfo-0000443388`, `wfo-0000335449`,
  `wfo-0000481648`, `wfo-0000358023`, `wfo-0000421966`, `wfo-0001275534`, `wfo-0001014280`,
  `wfo-0001108924`, `wfo-0000599594`.
- Brodo & Hawksworth (1977), *Opera Botanica* 42: 1–164 (*Alectoria* and *Bryoria*); Hämet-Ahti et
  al. (1998), *Retkeilykasvio* (Finnish Museum of Natural History, Helsinki).


### Namib and Namaqualand: BWk, the Namibian coast and escarpment to the Richtersveld, August–September
Low hazy light under dawn advection fog; wet air at the coast, winter rain just past in the
Richtersveld and Namaqualand. Palette: dune ochre and rose, bone-white and golden-flaking pachycaul
bark, blue-glaucous aloe rosettes, weathered welwitschia brown, crimson mistletoe tubes, flesh-pink
hoodia saucers, and crinkly sulphur-yellow Bushman's candle petals.

The moment is late winter to early spring (August–September): *Aloidendron dichotomum*
finishes its bright yellow winter racemes while *Pachypodium namaquanum* opens its velvet-crowned
tubular flowers, *Tylecodon paniculatus* stands in full succulent paddle leaf initiating its crimson
flower stalks, *Euphorbia virosa* and its hemiparasite *Tapinanthus oleifolius* are in bloom,
*Welwitschia mirabilis* carries late salmon-red female cones, and *Hoodia gordonii*, *Monsonia
crassicaulis*, and *Lithops ruschiorum* flush across the gravel flats.

| Plant | Latin | Role | Note |
|---|---|---|---|
| Quiver tree | Aloidendron dichotomum | bed or side, carries the height | A stout tapering trunk plated with golden-brown scales, 4–6 dichotomous forks into a rounded crown of compact blue-glaucous rosettes and erect canary-yellow racemes |
| Halfmens | Pachypodium namaquanum | side, leaning in | A single unbranched warty silver-grey column tilting 20–30° north, 3 spines per tubercle (2 long spreading + 1 short central), a terminal crest of strongly undulate velvety leaves and red-throated yellow-green tubes |
| Butter tree | Tylecodon paniculatus | side, from a corner | A squat dwarf-baobab pachycaul (1–2 m) with translucent golden-yellow peeling bark over olive underbark, thick dichotomous branches, and terminal clusters of bright green obovate paddle leaves with red-stalked urn panicles |
| Damara milk-bush | Euphorbia damarana | side, from a corner | A dense hemispherical dome of hundreds of erect leafless pencil-thick (12–20 mm) glaucous yellow-green rods tipped with sessile yellow-brown cyathia and 3-lobed capsules |
| Gifboom + Namibian mistletoe | Euphorbia virosa + Tapinanthus oleifolius | bed (host + hemiparasite drawn as one plant) | *E. virosa*: twisted basal caudex with strict candelabra whorl of 5–8-angled constricted segments armed with paired shiny brown stipular spines on a continuous horny grey shield. *T. oleifolius*: woody haustorial clump erupting directly from an upper *E. virosa* rib, bearing leathery glaucous opposite leaves and umbels of 4–5 cm crimson-red split-tube flowers with black-tipped yellow-green reflexed lobes |
| Nara melon | Acanthosicyos horridus | bed or lower side | A leafless, tendril-less phreatophytic thorny mounding shrub of grooved grey-green stems armed with paired 2–3 cm straight ivory-tipped spines at every node, pale greenish-yellow axillary flowers, and 15 cm globose spiny orange-yellow melons |
| Welwitschia | Welwitschia mirabilis | bed | A low corky bi-lobed crater-cup crown issuing exactly two broad leathery olive-russet straps that arch out, split lengthwise into frayed ribbons over the gravel, and frame forked scarlet-and-salmon cone panicles |
| Bushman's grass | Stipagrostis sabulicola | bed | A tough dune-anchoring hummock of rigid bamboo-like knotted culms (to 1.8 m) bent by wind and topped by narrow feathery silver-cream plumose panicles |
| Bushman's candle | Monsonia crassicaulis | bed | A dwarf spiny resin-waxy shrublet (20–40 cm) of horizontal pale-grey branches armed with 2–4 cm petiolar spines, small crenate-folded glaucous leaves, and 4 cm crinkly translucent sulphur-yellow 5-petalled saucer flowers |
| Ghaap | Hoodia gordonii | bed | A tight upright cluster of 12–17-ribbed grey-brown succulent cylinders studded with single-spined tubercles and crowned near the apex by flat 7–10 cm five-angled flesh-pink to maroon saucer corollas with five tail-like points |
| Rusch's living stones | Lithops ruschiorum | bed (foreground) | Clumps of 2–6 cordate, convex, nearly unspotted pearl-grey and bone-ochre fused leaf pairs with a shallow V-cleft and persistent 5-chambered boat-valved capsules in the gravel |

**Candidates** if the composition needs more: the orange Namaqualand daisy (*Dimorphotheca sinuata*)
as a low bed accent; *Lithops optica* f. *rubra*, from the Lüderitz fog coast, for ruby-magenta
bodies.

Sources: World Flora Online / WCVP (`wfo-0001335020`, `wfo-0000262078`, `wfo-0000965374`,
`wfo-0000413298`, `wfo-0000513667`, `wfo-0000899838`, `wfo-0000363042`, `wfo-0001297274`); Grace et
al. (2013), *Phytotaxa* 76(1): 7–14 (`doi:10.11646/phytotaxa.76.1.2`); Richter et al. (1995),
*Functional Plant Biology* 22(4): 537–544 (`doi:10.1071/pp9950537`); Midgley et al. (1995), *South
African Journal of Botany* 61(4): 230–232 (`doi:10.1016/s0254-6299(15)30534-2`); Roth-Nebelsick et
al. (2012), *J. R. Soc. Interface* 9(73): 1965–1974 (`doi:10.1098/rsif.2011.0847`); Ebner et al.
(2011), *J. Arid Environments* 75(6): 513–520 (`doi:10.1016/j.jaridenv.2011.03.005`); SANBI
PlantZAfrica and Tree Atlas of Namibia.

### Eastern North American edge: Dfa, the Ohio Valley
Humid continental summers, early autumn frosts, a blazing October canopy over tallgrass prairie
openings, and stark winter wood against grey snow-light. Palette: tulip-tree emerald and chrome
yellow, sugar-maple fluorescent orange-scarlet, redbud magenta on black zigzag bark,
Virginia-creeper crimson and pruinose blue-black berries on carmine pedicels, trumpet-vine
vermilion, compass-plant resin gold, milkweed dusty rose, blazing-star magenta, coneflower
purple-rose and blackened winter cones, big-bluestem glaucous blue and autumn copper-burgundy.

A year (`year`, from March) where the eastern deciduous forest edge meets the tallgrass prairie:
four woody boughs reach in from the sides, three woody climbers hang from host boughs and an arbor
beam along the top, and five prairie perennials rise from the bed.

| Plant | Latin | Role | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|---|---|
| Tulip tree | Liriodendron tulipifera | side | duck-bill stipules open, squared four-lobed leaves unfold; green-and-orange cup flowers in May | glossy squared leaves, upright green samara cones | clear chrome-yellow leaves | bare limbs tipped with erect wheat-brown samara-cone receptacles |
| Sugar maple | Acer saccharum | side | drooping chartreuse flower tassels on bare twigs, then five-lobed leaves | deep green U-sinused palms, paired horseshoe keys | uneven fluorescent yellow, orange, and scarlet | dense ascending tiers of fine opposite brown twigs and sharp conical buds |
| Eastern redbud | Cercis canadensis | side | magenta-pink pea clusters directly on bare black zigzag wood, then folded tawny hearts | broad dull-green heart leaves, flat reddish-green pods | clear canary-yellow leaves, purple-brown pods | dark zigzag branches hung with twisted purple-brown pods |
| Black walnut | Juglans nigra | side | late yellow-green pinnate shoots and dangling green catkins on chambered twigs | long 15-to-23-leaflet fronds, paired warty lime-green nuts | clear yellow fronds dropping early; darkening nuts on bare wood | stout dark-ridged twigs with notched monkey-face leaf scars |
| Virginia creeper | Parthenocissus quinquefolia | hanging | bronze-tinged five-leaflet palms unfolding along disk-tipped tendrils | dull green five-leaflet palms, greenish flower panicles | brilliant crimson-scarlet leaves dropping early to reveal blue-black berries on bright red stalks | bare woody vines, adhesive tendril pads, and red-branched berry pedicels |
| Trumpet vine | Campsis radicans | hanging | late opposite pinnate shoots on aerial-rootlet stems | glossy serrated pinnate leaves, clusters of orange-scarlet tubular trumpets | yellow leaves, long green cigar capsules | tan scaly stems hung with curved brown capsules split into two boat valves |
| Dutchman's pipe | Aristolochia macrophylla | hanging | velvety shoots and expanding kidney-heart leaves; U-curved pipe flowers in May | overlapping shingle of huge dark-green heart leaves | yellow-brown leaves, 6-ribbed capsules turning black | bare twining stems hung with 6-valved basket capsules split from the base |
| Compass plant | Silphium laciniatum | bed | stiff vertical deeply pinnatifid basal leaves oriented north–south | tall rough-haired resinous stems crowned with large yellow sunflower heads | brown ragged oak-like leaves and dark cup-shaped fruiting heads | stiff blackened stalks and dark involucral cups standing to 2.5 m |
| Common milkweed | Asclepias syriaca | bed | stout downy shoots with opposite oblong leaves | spherical axil umbels of dusty rose-pink crowned flowers, young warty pods | yellowing leaves; grey warty follicles splitting along one seam | bare stiff stems with split boat-shaped grey pods spilling white silk comas |
| Big bluestem | Andropogon gerardii | bed | glaucous blue-green basal blades with white-haired bases | tall blue-green culms with purplish nodes; three-parted purple-bronze turkey-foot racemes in late summer | entire tussock turning burnt copper, orange, and wine-burgundy | standing copper-tan culms tipped with silvery-haired turkey-foot racemes |
| Dense blazing star | Liatris spicata | bed | dense basal tuft of narrow grass-like blades | tall unbranched leafy wands; magenta-purple button heads opening strictly top-to-bottom from July | tawny blades, fuzzy tan barbellate pappus spikes | rigid dry brown wand stalks with spent chaffy involucres |
| Purple coneflower | Echinacea purpurea | bed | rough dark-green ovate-lanceolate basal and stem leaves | reflexed rose-purple ray florets around a prominent coppery-orange spiny cone | rays wither and drop; leaves brown | rigid dark stems topped by coal-black spiky cones |

**The calendar,** Ohio Valley (`Dfa`, Cincinnati / Louisville / Columbus latitude); the year axis
starts in March (see Seasons).

| Plant | Leaves | Flowers | Fruit and what persists | Autumn and leaf fall |
|---|---|---|---|---|
| Tulip tree | mid-April, emerging folded downward inside paired duck-bill stipules | May to early June, solitary upright cups after leaves expand | cone-like aggregate of samaras ripens September–October; outer winged samaras shed through autumn, leaving upright woody axis and basal carpel cup ("candle") all winter | bright golden yellow in October; bare by early November |
| Sugar maple | mid-to-late April | April, greenish-yellow apetalous corymbs on bare or opening shoots | paired horseshoe samaras ripen September–October and spin down in autumn | uneven yellow, burnt orange, and fluorescent scarlet from late September through October; bare by mid-November |
| Eastern redbud | late April to early May, after the flowers, folded along midrib | late March to April, cauliflorous fascicles on bare branches and trunk | flat oblong pods (5–10 cm) swell in May–June, turn reddish-purple in summer, and persist dark brown through winter | bright clear yellow in October; bare in November |
| Black walnut | late April to May (one of the last trees to leaf out) | late April to May, drooping 5–10 cm male catkins with expanding leaves | globose warty green-husked nuts (4–6 cm) ripen September–October, blackening and dropping in October–November | clear yellow in September to early October, shedding early; bare by October |
| Virginia creeper | mid-April, emerging purplish-bronze | June to July, inconspicuous greenish panicles | 5–8 mm blue-black berries ripen August–September on bright carmine-red branched pedicels that persist into winter after birds strip the fruit | turns brilliant crimson-scarlet in September–October (one of the earliest to turn) and drops before the canopy |
| Trumpet vine | late April to May | mid-June to September, terminal cymes on new growth | 10–18 cm keeled cigar-like capsules mature September–October, splitting lengthwise into two boat valves that hang on bare vines all winter | yellow in October, dropping rapidly after frost |
| Dutchman's pipe | mid-to-late April | May to June, solitary axillary pipe flowers hidden under leaves | 6–8 cm 6-ribbed cylindrical capsules ripen September–October, turning grey-black and splitting basipetally into 6 parachute-like ribs through winter | dull yellow to brown in October; bare by November |
| Compass plant | basal leaves rise in April | July to September, tiered along the upper half of the tall stem | flat winged cypselae shed in autumn; dark hairy involucral cups and rigid resinous stalks stand through winter | rough pinnatifid leaves brown in October–November |
| Common milkweed | late April to May | June to August, fragrant spherical umbels in upper axils | 7–12 cm warty lance-ovoid follicles ripen September–October, splitting open to release overlapping brown seeds on 3–4 cm white silky comas through winter | broad oblong leaves yellow and drop in September–October |
| Big bluestem | warm-season flush from late April to May | late July to September, digitate turkey-foot racemes | caryopses shed in autumn; silvery-haired rachises and three-toed turkey-foot racemes persist on standing culms all winter | turns flame orange, copper, and wine-burgundy from September–October, curing to warm copper-bronze |
| Dense blazing star | basal grass-like tuft in April | July to September, heads opening basipetally (top of spike to bottom) | cypselae tipped with barbellate tan pappus bristles mature September–October; stiff stalks stand through winter | linear leaves turn tawny brown in October |
| Purple coneflower | April | mid-June to September | paleae harden into sharp 9–15 mm spines; coal-black conical receptacles (2–4 cm across) stand on rigid stems all winter | coarse leaves brown after October frosts |

**Drawing facts.**
- **Tulip tree (*Liriodendron tulipifera*):** Smooth lustrous reddish-brown twigs with 1–1.5 cm
  dark-red flattened "duck-bill" winter buds and circular stipule scars ringing each node. Alternate
  blades 7.5–15 × 8.5–18 cm on 5–11 cm petioles: 4-lobed (2 spreading basal lobes + 2 shallow
  apical lobes separated by a broad flat-to-shallowly-notched truncate apex), glossy bright emerald
  above, paler glaucous beneath. Solitary terminal campanulate flowers 4–6 × 5–8 cm: 3 reflexed
  pale-green sepals below 6 erect chartreuse-yellow tepals each marked near the base with a vivid
  orange nectar band, surrounding 20–50 creamy-anthered stamens and a central cone of imbricate
  pistils. Fruit an upright light-brown cone (*samaracetum*) 4.5–8.5 × 2–2.5 cm; outer samaras shed
  in wind, leaving the persistent central axis and basal carpel whorl standing like pale wooden
  candelabras all winter.
- **Sugar maple (*Acer saccharum*):** Slender glossy reddish-brown twigs with opposite leaf scars
  and sharp-pointed conical dark-brown terminal buds (6–9 mm). Opposite palmate blades 8–15 cm on
  4–10 cm glabrous stalks: 5 acuminate lobes (3 large upper + 2 smaller basal) separated by deep,
  rounded U-shaped sinuses; margins entire inside the sinuses with only a few sparse blunt-tapering
  teeth on the lobe shoulders. Spring flowers apetalous, greenish-yellow, hanging on long
  thread-like hairy pedicels (3–7 cm) in drooping corymbs. Fruit a paired samara with globose
  7–10 mm nutlets and 2–3.5 cm wings diverging at a narrow horseshoe angle (30–60°).
- **Eastern redbud (*Cercis canadensis*):** Slender, strongly **zigzag**, nearly black twigs dotted
  with pale lenticels. Cauliflorous flowers open on bare wood in umbellate fascicles of 4–8 before
  the leaves: dark wine-red calyx (4–6 mm) and 12–15 mm rose-magenta pea corolla on 10–20 mm
  pedicels. Alternate simple blades 7–12 × 7–12 cm on petioles swollen with a pulvinus at both ends:
  broadly cordate with an entire margin, short acuminate tip, and 5–7 palmate veins; emerging folded
  along the midrib in tawny-bronze, maturing matte blue-green above. Pods pendulous in clusters,
  flattened oblong-acute, 5–10 × 1.2–1.8 cm, tapered at both ends, ripening from rose-green to deep
  purple-brown and hanging on bare zigzag twigs through winter.
- **Black walnut (*Juglans nigra*):** Stout orange-brown twigs with chambered buff pith, velvety-grey
  terminal buds, and notched 3-lobed "monkey-face" leaf scars. Alternate odd-pinnate leaves 30–60 cm
  long with 15–19(–23) nearly sessile ovate-lanceolate, slightly falcate serrate leaflets (6–15 ×
  2–5 cm; terminal leaflet often reduced or absent). Male flowers in drooping 5–10 cm yellow-green
  catkins. Fruit solitary or paired, globose, 3.5–8 cm diameter, with a thick warty lime-green husk
  speckled with pale lenticels that blackens in October.
- **Virginia creeper (*Parthenocissus quinquefolia*):** Woody liana clinging by 4–12-branched
  tendrils opposite the leaves, each branchlet ending in a flat 5 mm oval adhesive disk. Alternate
  palmately compound leaves of 5 leaflets radiating from one point, each leaflet 6–15 × 2.5–6 cm,
  obovate-elliptic, wedge-shaped at base, coarsely saw-toothed along the distal half. Globose
  5–8 mm pruinose blue-black berries ripen on branching stalks that turn **vivid carmine-red**,
  staying bright red on the bare vine after the crimson-scarlet leaflets fall.
- **Trumpet vine (*Campsis radicans*):** Woody liana with tan bark and nodal rows of short aerial
  rootlets. Leaves **opposite**, odd-pinnate, 15–38 cm long, with 7–11 coarsely serrate ovate
  leaflets (4–8 × 1.5–4 cm). Terminal clusters of 2–8 large **orange-to-scarlet trumpet corollas**
  6–9 cm long × 3–4 cm across at the 5 rounded lobes, with a yellow-orange throat. Fruit a curved,
  keeled cigar-shaped woody capsule 10–18 × 1.5–2.5 cm, ripening tan-brown and splitting lengthwise
  into 2 boat-shaped valves.
- **Dutchman's pipe (*Aristolochia macrophylla*, syn. *Isotrema macrophyllum*):** Twining woody
  liana shingled with massive **orbicular-reniform to broadly cordate blades** 15–34 × 15–35 cm,
  smooth dark green above and pale silvery-glaucous beneath. Solitary axillary flowers on 3–7 cm
  peduncles: a strongly U-curved calyx tube shaped like a Dutch smoking pipe—pendent inflated base,
  ascending yellow-green tube (2–3 cm), flaring abruptly into a flat 3-lobed velvety
  **chocolate-maroon limb** (3–4 cm across). Fruit a pendent 6-ribbed cylindrical-ovoid capsule
  6–8 × 4–6 cm, turning charcoal-black and splitting basipetally into a 6-valved hanging basket.
- **Compass plant (*Silphium laciniatum*):** Stout rough-hairy stem 1.5–3 m tall. Basal and lower
  cauline leaves huge (30–60 × 15–30 cm), stiffly erect and oriented vertically north–south, deeply
  1- to 2-pinnatifid with 5–9 pairs of narrow linear-oblong lobes and wide rounded sinuses. Tall
  racemiform panicle of 6–30 sunflower-like heads 7–11 cm across: coarse spreading-tipped phyllaries
  cupping 27–38 chrome-yellow ray florets (2.5–4 cm) around a flat yellow-and-brown central disc.
- **Common milkweed (*Asclepias syriaca*):** Stout velvety-green stem 0.8–1.8 m tall with **opposite**
  broadly oblong-elliptic leaves (10–25 × 5–11 cm) marked by a creamy-pink midrib and looping lateral
  veins. Globose axillary umbels (5–10 cm across) of 10–12 mm dusty-rose flowers with 5 reflexed
  petals below an erect 5-parted paler pink corona of hoods and horns. Fruit an erect, plump,
  warty-tuberculate grey-green follicle (7–12 × 2.5–4 cm) on an S-curved stalk, splitting along one
  seam in autumn/winter to spill brown seeds on 3–4 cm white silky comas.
- **Big bluestem (*Andropogon gerardii*):** Tall tussock of glaucous blue-green culms (1.2–2.4 m)
  with purplish-black nodes, turning flame-orange, copper, and wine-burgundy in autumn. Culms
  terminate in exserted **digitate clusters of 3 ascending spike-like rames** (5–10 cm long)
  diverging from one point like a **three-toed turkey's foot**, fringed with silvery hairs and bent
  brown awns.
- **Dense blazing star (*Liatris spicata*):** Erect unbranched leafy wand 60–150 cm tall rising from
  a dense basal tuft of linear grass-like blades. Terminal cylindrical spike (15–40 × 2–3 cm) of
  40–120+ sessile discoid button heads (no ray florets) fuzzy with long exserted magenta-purple
  thread-styles, **opening strictly top-to-bottom (basipetally)**.
- **Purple coneflower (*Echinacea purpurea*):** Rough-hairy stems 60–120 cm tall with 3–5-veined
  ovate-lanceolate serrate leaves. Solitary terminal heads (7–13 cm across): a prominent
  hemispherical-to-conical central disc (2–4 cm) bristling with stiff coppery-orange chaff spines
  (paleae) surrounded by 12–22 drooping/reflexed rose-purple strap rays (3–7 cm). In autumn/winter
  the rays drop and the spiny cone turns hard coal-black on rigid dark stems.

**Keep apart in the drawing.**
- **Sugar maple (*Acer saccharum*) vs. East Asian Japanese maple (*Acer palmatum*):** *Acer palmatum*
  has small deeply cut 5–9-lobed doubly serrate hands and turns uniform scarlet; *Acer saccharum* has
  broad 5-lobed leaves with wide rounded U-shaped sinuses and nearly entire margins, turns a mottled
  gradient of yellow, tangerine, and scarlet on the same bough, and hangs nearly parallel horseshoe
  samaras.
- **Dutchman's pipe (*Aristolochia macrophylla*) vs. East Asian paulownia (*Paulownia tomentosa*)
  and tropical philodendron (*Philodendron hederaceum*):** *Aristolochia macrophylla* is a heavy
  twining woody hanger shingled with huge overlapping 15–34 cm rounded kidney-heart leaves, tucked
  with U-bent yellow-green-and-maroon smoking-pipe flowers in late spring and 6-ribbed charcoal-black
  hanging basket capsules that split from the base up in winter.
- **Virginia creeper (*Parthenocissus quinquefolia*) vs. East Asian chocolate vine (*Akebia
  quinata*):** *Parthenocissus* has larger diamond-elliptic acuminate leaflets coarsely saw-toothed
  on the outer half, climbs by branched tendrils tipped with flat adhesive pads, turns flaming
  crimson-scarlet in early autumn, and drops its leaflets to leave bright carmine-red branched
  pedicels bearing blue-black berries.
- **Trumpet vine (*Campsis radicans*) vs. East Asian wisteria (*Wisteria floribunda*):** *Campsis*
  has **opposite** 7–11 coarsely serrate leaflets, nodal aerial rootlets, summer terminal clusters of
  stiff 6–9 cm orange-scarlet trumpets, and smooth keeled 10–18 cm cigar capsules splitting into two
  boat valves.
- **Eastern redbud (*Cercis canadensis*) vs. East Asian plum (*Prunus mume*) and tropical orchid tree
  (*Bauhinia variegata*):** *Cercis* blooms in mid-spring with tight cauliflorous fascicles of 4–8
  magenta-pink pea flowers directly on black zigzag branches, followed by broad unlobed heart leaves
  and flat shuttle-shaped pods that persist through winter.
- **Dense blazing star (*Liatris spicata*) vs. other spikes:** *Liatris spicata* rises from a
  grass-like linear tussock into a strict wand of discoid button heads fuzzy with long exserted
  magenta thread-styles and **opens strictly from the top downward (basipetally)**.
- **Big bluestem (*Andropogon gerardii*) vs. Lowveld savanna grasses:** *Andropogon gerardii* is told
  apart at once by its digitate 3-branched "turkey-foot" terminal racemes on tall glaucous blue-green
  culms that turn solid copper-burgundy in autumn.

**Unresolved.**
- How many berries *Parthenocissus quinquefolia* retains into winter after leaf drop (birds strip
  most berries by early winter, leaving the bright carmine-red branched pedicels bare on the winter
  vine).

**Sources.**
- Flora of North America @ efloras.org: Vols. 3 (*Liriodendron tulipifera*, *Juglans nigra*,
  *Aristolochia macrophylla*), 12 (*Parthenocissus quinquefolia*), 14 (*Asclepias syriaca*), 21
  (*Silphium laciniatum*, *Liatris spicata*, *Echinacea purpurea*), and 25 (*Andropogon gerardii*).
- World Flora Online / WCVP: `wfo-0000229261`, `wfo-0000515026`, `wfo-0000174035`, `wfo-0000355126`,
  `wfo-0000403060`, `wfo-0000548026`, `wfo-0000117950`, `wfo-0000551803`, `wfo-0000846629`,
  `wfo-0000065042`, `wfo-0000036347`.
- Illinois Wildflowers (`illinoiswildflowers.info`), Minnesota Wildflowers
  (`minnesotawildflowers.info`), and NC State Extension Plant Toolbox (`plants.ces.ncsu.edu`).

### Northwest European woodland: Cfb, Devon, Cornwall, and the west of Ireland
Soft Atlantic rain, mild winters, a spring floor of bluebells before the canopy closes, and a long
russet-and-emerald winter of holly, ivy, gorse, and old man's beard. Palette: mossy oak grey,
holly and hart's-tongue emerald, lamb's-tail catkin yellow, hawthorn chalk-white, bluebell violet,
foxglove magenta-purple, gorse gold, bracken copper-russet, silver-white clematis plumes.

A year (`year`, from March). Three climbers hold the top on living mossy oak or ash boughs,
staggered so the top never goes blank: honeysuckle's trumpets in summer, ivy's flowers in autumn and
its berries through winter, old man's beard's silver seed heads from autumn to February. The bed
trades places through the seasons too: bluebells carpet the spring floor and are gone by July,
foxglove spires follow in summer, bracken turns copper in October, and hart's-tongue fern and
winter-flowering gorse hold green and gold through the darkest months.

| Plant | Latin | Role | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|---|---|
| Pedunculate oak | Quercus robur | side | yellow-green catkins and bronze-pink new lobed leaves | deep green auriculate lobed leaves, swelling acorns on long stalks | leaves turn ochre-brown; acorns ripen and drop from scaly cups | gnarled fissured limbs, clustered ovoid terminal buds, empty long-stalked acorn cups and marble galls |
| Common hazel | Corylus avellana | side | dangling yellow lamb's-tail catkins and tiny crimson female styles on bare coppery rods, then pleated round leaves | broad doubly-toothed leaves; green cobnuts in leafy ragged husks | leaves turn clear butter-yellow and shed; husks brown and release nuts | bare shining brown coppice rods hung with tight grey-green immature catkins expanding yellow by late January |
| Common hawthorn | Crataegus monogyna | side | deeply cut green leaves, then snowy masses of five-petalled white May blossom with pink-purple anthers | dark glossy lobed leaves; green haws swelling | leaves turn yellow-bronze and drop; dense clusters of deep crimson-red haws | bare gnarled thorny twigs studded with crimson haws |
| English holly | Ilex aquifolium | side | glossy dark-green undulating spiny leaves; axillary clusters of small four-petalled white flowers in May | glossy spiny leaves, green berries swelling | berries turn bright scarlet against dark glossy foliage | evergreen spiny leaves and dense clusters of scarlet berries |
| English ivy | Hedera helix | hanging, on a mossy host bough | evergreen palmately 5-lobed climbing leaves and unlobed diamond adult leaves; last winter's black berries finish | full dimorphic dark-green foliage with pale veins; flower buds forming on adult shoots | spherical umbels of chartreuse-yellow flowers open in September–November on unlobed adult shoots | evergreen leaves and round clusters of dull ink-black berries ripening through winter |
| European honeysuckle | Lonicera periclymenum | hanging, twining a host bough | opposite oval leaves (blue-glaucous beneath) unfold along clockwise-twining stems | terminal whorls of long two-lipped creamy-white and rose-flushed trumpets aging warm yellow | tight terminal clusters of translucent crimson-red berries; leaves yellow and thin | bare spiralled woody ropes with flaking bark |
| Old man's beard | Clematis vitalba | hanging, scrambling from a host bough | opposite pinnate leaves of five heart-shaped leaflets climbing by twisting leaf-stalks | axillary panicles of almond-scented greenish-cream blossoms with fluffy sepals | leaves yellow and drop; achenes spin out 3 cm silky silver-white feathery style plumes | bare grooved stems smothered in billowing silver-grey "old man's beard" seed-head balls all winter |
| Bracken | Pteridium aquilinum | bed | silver-felted crosier fiddleheads rise and unroll into broad triangular 3-pinnate fronds | tall horizontal tiers of leathery green triangular fronds | fronds turn warm gold, copper, and russet-bronze from October | collapsed, broken-over bronze-brown fronds carpeting the bed |
| English bluebell | Hyacinthoides non-scripta | bed | channelled linear leaves and strongly nodding one-sided racemes of violet-blue tubular bells with rolled-back tips and cream anthers | erect green capsules ripen and split in June; leaves yellow and die back completely underground | dormant underground | dormant; pale leaf tips just piercing the soil in February |
| Common foxglove | Digitalis purpurea | bed | downy grey-green basal rosette of ovate crenate leaves; tall leafy spike rising in May | 1–2 m one-sided spire of pendulous purple-pink bells spotted dark crimson inside white-rimmed speckles, opening bottom-to-top | lower capsules split open; stem browns, fresh basal rosettes stay green | stiff dry brown stalks lined with split ovoid capsules over a low overwintering rosette |
| Hart's-tongue fern | Asplenium scolopendrium | bed | pale-green crosiers unroll from rusty-scaled crowns into undivided strap fronds | rosette of glossy bright-green undulating tongue straps with eared cordate bases; parallel herringbone rust-brown sori beneath | evergreen straps at full gloss, dark spore lines beneath | evergreen clump of glossy straps holding fast through winter |
| Common gorse | Ulex europaeus | bed or lower corner | dense grey-green spiny bush ablaze with coconut-scented golden-yellow pea flowers | dark velvety purple-black pods ripen in persistent brown calyces and pop open in sun | sporadic autumn yellow flowers among furrowed branched green spines | evergreen dark-green spiny stems already opening winter golden-yellow pea flowers from November onward |

**The calendar,** South West England (Devon and Cornwall) and western Ireland; the year axis starts
in March (see Seasons).

| Plant | Leaves | Flowers | Fruit and what persists | Autumn and leaf fall |
|---|---|---|---|---|
| Pedunculate oak | late April to early May (bronze-pink flush) | late April to May (pendulous yellow-green male catkins, 2–4 cm, with the new leaves) | acorns (1.5–4 cm, 1–3 on a 3–8 cm stalk) swell July–August, ripen brown and drop September–October; stalked scaly cups and round marble galls stay on winter twigs | ochre-yellow to russet-brown in October–November, shed by late November |
| Common hazel | April, after the catkins shed pollen | male catkins form in autumn, expand 5–12 cm and shed yellow pollen January to March; tiny crimson female style tufts (1–3 mm) in February–March | clusters of 1–4 cobnuts in ragged leafy husks swell June–August, ripen brown and drop September–October; next year's grey-green catkins already hang from September | clear butter-yellow in October to early November, bare by mid-November |
| Common hawthorn | mid-March to April (first hedgerow leaf-out) | mid-May to early June ("May blossom"), dense corymbs of 5–25 white flowers | crimson-red single-seeded haws (8–11 mm) ripen from September and persist on bare thorny twigs into January | yellow-bronze to reddish in October, bare by November |
| English holly | evergreen (leaves live 2–5 years) | May to early June, small white 4-lobed flowers in leaf axils | globose berries (6–10 mm) ripen bright scarlet in September–October and persist on female branches through winter | unchanged evergreen |
| English ivy | evergreen (juvenile 5-lobed on climbing stems, adult unlobed on flowering shoots) | September to November, globose umbels of greenish-yellow flowers | berries (6–8 mm) swell green in early winter and ripen dull ink-black from January to April | unchanged evergreen |
| European honeysuckle | March | June to August, opening at dusk | tight globose clusters of glossy crimson berries (6–8 mm) from August to October | foliage yellows and drops October–November |
| Old man's beard | April to May | July to September, fragrant greenish-white panicles | achene heads with 3–3.5 cm feathery silver-white styles ("old man's beard") mature from September and persist as fluffy balls until February | leaves yellow and drop October–November |
| Bracken | furry silver-grey crosiers rise April to May, unfurling into full fronds by June | none (spores ripen July–September in continuous marginal lines under rolled pinna edges) | dead bronze-rust fronds collapse and persist as a tangled winter mat | turns butter-gold to rich copper-russet in October; frost-killed in November |
| English bluebell | linear leaves emerge February to March | mid-April to May | erect 3-chambered ovoid capsules ripen in June, splitting to shed shiny black seeds | foliage yellows and withers completely underground by late June–July |
| Common foxglove | overwintering basal rosette; tall stem rises April to May | June to July (main spike opening bottom to top) | ovoid septicidal capsules (12 mm) ripen August–September; stiff dry brown stalks packed with open capsules stand all winter | stem leaves wither in late summer; new first-year basal rosettes stay downy green through winter |
| Hart's-tongue fern | evergreen; fresh pale-green crosiers unroll April to May | none (herringbone linear sori ripen spores July–September on underside) | persistent evergreen fronds | evergreen all year |
| Common gorse | evergreen (leaves modified into 1.5–4 cm furrowed green spines) | peak bloom March to May (secondary autumn/winter flush October to February) | velvety dark purple-brown pods (1.5–2 cm) enclosed in hairy brown calyces ripen July–August | unchanged evergreen spiny mound |

**Drawing facts.**
- **Pedunculate oak (*Quercus robur*):** Stout, wide-spreading, crooked limbs with deeply fissured
  grey-brown bark; hairless twigs ending in a tight terminal cluster of blunt ovoid red-brown buds
  (`2–3 mm`). Leaves alternate, obovate-oblong, `7–15 × 3.5–8.5 cm`, practically stalkless (petiole
  `2–6 mm`), with a strongly **auriculate (eared/cordate) base** and `3–6` rounded asymmetric lobes
  per side. Male catkins slender, pendulous, `2–4 cm`; acorns ovoid-oblong (`1.5–4 cm`), 1–3
  together on a long slender **peduncle `3–8 cm` long**, held in a hemispherical scaly cupule. Round
  brown marble galls (`1.5–2 cm`) and empty stalked cups persist on winter twigs.
- **Common hazel (*Corylus avellana*):** Multi-stemmed coppice rods with smooth shining coppery-brown
  bark marked by horizontal lenticels. Leaves broadly orbicular to obovate (`6–12 × 5–10 cm`), base
  cordate, margin **coarsely doubly-serrate** with a sudden narrow **drip-tip (acuminate apex)**.
  Male catkins in clusters of `2–4`, naked over winter (`3–5 cm`, grey-green), elongating to `5–12 cm`
  and turning sulphur-yellow in January–March alongside tiny crimson female style tufts (`1–3 mm`).
  Fruit in clusters of `1–4` ovoid nuts (`15–20 mm`), each enclosed in a leafy, jagged-toothed green
  involucre (husk).
- **Common hawthorn (*Crataegus monogyna*):** Gnarled thorny branches armed with sharp straight
  axillary thorns (`1–2.4 cm`). Leaves ovate-deltate (`2–5.5 cm`), **deeply cut more than halfway to
  the midrib into `3–7` forward-pointing acute lobes**. Flowers (`8–15 mm` across) in dense
  flat-topped corymbs of `5–25`, with 5 rounded white petals, `15–20` stamens tipped with
  **pink-purple anthers**, and 1 style. Fruit (`haw`) an ovoid deep crimson-red pome (`8–11 mm`)
  crowned by persistent calyx teeth.
- **English holly (*Ilex aquifolium*):** Evergreen thick coriaceous leaves (`5–10 × 2.5–5 cm`),
  glossy dark green above, **strongly undulate (3D wave-twisted) margins armed with `4–8` sharp
  divaricate spines per side** pointing alternately up and down. Small 4-petalled white flowers in
  May; globose bright scarlet drupes (`6–10 mm`) clustered tightly in the leaf axils through winter.
- **English ivy (*Hedera helix*):** Shoot dimorphism: (1) *Juvenile climbing/trailing shoots* with
  aerial rootlets and alternate **palmately 3–5-lobed dark-green leaves (`4–10 cm`)** marked with
  pale whitish-green veins; (2) *Adult fertile shoots* arching out with **unlobed ovate-rhombic
  entire leaves (`6–10 cm`)** and terminal panicles of **spherical umbels (`3–5 cm`)** of
  greenish-yellow autumn flowers (September–November), ripening into spherical clusters of **dull
  ink-black berries** in late winter.
- **European honeysuckle / woodbine (*Lonicera periclymenum*):** Woody liana twining **clockwise**
  (rising lower-left to upper-right across the front of its support). Leaves opposite, oval (`4–6.5
  cm`), dark green above and **blue-glaucous beneath**, **always free to the base—never fused into a
  connate cup**. Terminal stalked whorls of `6–12+` strongly curved **two-lipped tubular-funnelform
  flowers (`3.8–5 cm` long)**, creamy-white flushed rose-carmine outside, aging warm butter-yellow.
  Fruit a tight globose cluster of glossy translucent crimson-red berries.
- **Old man's beard / traveller's joy (*Clematis vitalba*):** Deciduous liana with 6-angled ribbed
  buff stems climbing by **twisting petioles and petiolules like tendrils**. Leaves opposite,
  **odd-pinnate with 5 ovate-cordate leaflets**. Loose panicles of `1.8–2.2 cm` greenish-cream
  4-tepaled flowers in summer, maturing in autumn/winter into `6–10 cm` billowing silver-white wigs
  of `3–3.5 cm` plumose styles that persist all winter.
- **Bracken (*Pteridium aquilinum*):** Solitary stiffly erect stipes (`0.5–1.8 m`) unrolling from
  silver-furry shepherd's-crook crosiers into **broadly triangular 2- to 3-pinnate horizontal blades**
  that turn bright ochre-gold to deep russet-copper in October and collapse into angled bronze heaps
  in winter.
- **English bluebell (*Hyacinthoides non-scripta*):** Bulbous spring ephemeral (`20–50 cm`) with
  linear channelled leaves and a smooth scape **drooping strongly at the top in a shepherd's crook**,
  bearing a **strictly one-sided (`secund`) nodding raceme of `6–12` narrow parallel-sided
  violet-blue tubular bells (`14–20 mm`)** with strongly rolled-back tips and **cream-white anthers**.
  Ripens erect 3-lobed capsules in June before vanishing underground.
- **Common foxglove (*Digitalis purpurea*):** Downy grey-green basal rosette of rugose ovate leaves
  sending up a **`1–2 m` unbranched stem** topped by a **strictly one-sided (`secund`) raceme of
  `20–80` pendulous inflated purple-pink thimbles (`4–6 cm`)** spotted dark crimson inside
  white-rimmed speckles on the lower floor, opening bottom-to-top. Stiff brown stalks of split ovoid
  capsules stand all winter.
- **Hart's-tongue fern (*Asplenium scolopendrium*):** Evergreen shuttlecock clump (`20–60 cm`) of
  **completely undivided glossy emerald strap blades (`15–50 × 3–6 cm`)** with ruffled undulating
  margins, deeply **cordate-auriculate bases**, and paired oblique rows of rust-brown linear
  herringbone sori beneath.
- **Common gorse (*Ulex europaeus*):** Dense evergreen spiny shrub (`1–2.5 m`) with furrowed green
  stems and **branched green spines (`1.5–4 cm`)**, ablaze in spring (and sporadically from November
  through winter) with **golden-yellow pea flowers (`1.5–2 cm`)** cupped in velvety brown two-lipped
  calyces, followed by shaggy dark purple-black pods (`1.5–2 cm`).

**Keep apart in the drawing.**
- **English bluebell (*Hyacinthoides non-scripta*) vs Spanish bluebell (*H. hispanica*):** The scape
  tip must droop strongly to one side in a shepherd's crook, the flowers must hang strictly on the
  underside (`secund`), the tube must be narrow and parallel-sided with rolled-back tips, and the
  anthers must be cream-white.
- **Honeysuckle (*Lonicera periclymenum*) vs Italian woodbine (*L. caprifolium*):** Uppermost leaf
  pairs beneath the flower whorls are sessile but **completely separate to the base** (never fused
  into a perfoliate saucer).
- **Keeping the three climbers apart across the year:** *Hedera helix* clings with rootlets and
  thrusts out unlobed adult shoots with spherical autumn flower umbels and winter black berries;
  *Lonicera periclymenum* winds in tight clockwise spirals with summer rose- and-cream trumpets and
  autumn red berries; *Clematis vitalba* scrambles by tendril-coiled petioles with 5-leaflet pinnate
  leaves and billowing winter silver-white style wigs.
- **Keeping the two ferns apart in the bed:** *Asplenium scolopendrium* is low, clumping, and
  evergreen with undivided glossy ruffled straps; *Pteridium aquilinum* rises on tall single stems
  into wide horizontal 3-pinnate triangular umbrellas that turn copper-bronze in autumn and collapse
  in winter.

**Unresolved.**
- Whether the mossy canopy host boughs for the three climbers should show a few oak leaves of their
  own or rely on the side oak limb to establish the canopy.

**Sources.**
- World Flora Online / WCVP: `wfo-0000292858`, `wfo-0000925259`, `wfo-0001009785`, `wfo-0000729203`,
  `wfo-0000979730`, `wfo-0000367818`, `wfo-0000610926`, `wfo-0001107402`, `wfo-0000664295`,
  `wfo-0000647394`, `wfo-0001110391`, `wfo-0000213410`.
- Bean's *Trees and Shrubs Hardy in the British Isles* (*Trees and Shrubs Online*,
  `treesandshrubsonline.org`); Stace (2019), *New Flora of the British Isles* (4th ed.); GBIF UK and
  Ireland phenology records.
