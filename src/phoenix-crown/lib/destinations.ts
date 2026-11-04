export type Destination = {
  id: string
  name: string
  headingRest: string
  phrase: string
  phraseNote: string
  caption: string
  roofSrc: string
  roofAlt: string
  /** pool of characters that form the hanging curtain */
  charPool: string
  /** curtain width relative to roof width */
  curtainWidth: number
  roofOverlap: number
  /** dark scenes flip the page palette and glow instead of shadow */
  theme?: 'light' | 'dark'
  /** ink palette for the curtain; single-entry = uniform color */
  curtainColors?: string[]
  /** strand length multiplier (default 1) — smaller = shorter curtain */
  curtainLength?: number
  /** 0-1: how uneven the ragged bottom edge is (default ~0.28) */
  curtainRaggedness?: number
  /** glyph + grid scale (default 1) — smaller = finer, denser strands */
  curtainGlyphScale?: number
  /** override the dark-scene halo/glow colors (defaults to moonlit blue) */
  glow?: { halo: string; haloFaint: string; shadow: string }
}

export const destinations: Destination[] = [
  {
    id: 'fengguan',
    name: 'Fengguan',
    headingRest: 'kingfisher blue, gold filigree, and pearls that remember dynasties',
    phrase: 'The Phoenix Crown',
    phraseNote: 'A Ming phoenix crown of kingfisher, gold and pearl',
    caption:
      'Beneath point-cui feathers and strands of pearl, every blue petal was once a promise.',
    roofSrc: '/phoenix-crown/images/crown-fengguan.png',
    roofAlt: 'Ming-style phoenix crown with kingfisher-blue enamel flowers, gold filigree and pearl tassels',
    charPool:
      'PHOENIXCROWNKINGFISHERBLUEGOLDFILIGREEPEARLSPROMISESJADEFLOWERSENAMELTASSELSPHOENIXDANCECLOUDSBROCADESILKROYAL',
    curtainWidth: 0.78,
    roofOverlap: 20,
    theme: 'dark',
    // luminous inks matched to the lit crown: kingfisher blue, turquoise,
    // bright gold, pearl white
    curtainColors: ['#7d9bf0', '#5cc8e8', '#e8c46a', '#f2ecdc', '#7d9bf0', '#e8c46a'],
  },
  {
    id: 'xifeng',
    name: 'Xifeng',
    headingRest: 'stage-lit turquoise, ruby clusters, and tassels that dance with the drum',
    phrase: 'The Pear Garden',
    phraseNote: 'A dream in the pear garden',
    caption:
      'Under the opera lamps, kingfisher clouds and pearl nets sway to a drumbeat older than the stage.',
    roofSrc: '/phoenix-crown/images/crown-opera.png',
    roofAlt: 'Chinese opera phoenix crown with turquoise cloud motifs, gold phoenixes, ruby clusters and long pearl tassel wings',
    charPool:
      'OPERADREAMSTAGEGONGDRUMSLEEVESDANCEROLESPEARLGARDENTURQUOISEANDRUBYMASKCHORUSSONGSACTFINALECURTAIN',
    curtainWidth: 0.82,
    roofOverlap: 20,
    theme: 'dark',
    // inks pulled from the opera crown: turquoise cloud, gold phoenix,
    // ruby bead, sapphire, pearl white
    curtainColors: ['#4fc3e8', '#e8c46a', '#d4525a', '#6b8de0', '#f2ecdc', '#4fc3e8'],
  },
  {
    id: 'cuiyu',
    name: 'Cuiyu',
    headingRest: 'peacock plumes, jade dew, and gardens folded into gold',
    phrase: 'Halcyon Plumes',
    phraseNote: 'Halcyon plumes, bright pendants',
    caption:
      'Peacock feathers curl around jade blossoms, and every pearl tassel drips with spring.',
    roofSrc: '/phoenix-crown/images/crown-jade.png',
    roofAlt: 'Jade-green phoenix crown with peacock feather motifs, jade beads, pearls and long gold tassels',
    charPool:
      'JADEGREENPEACOCKPLUMESSPRINGDEWGARDENSGOLDENPETALSJADEORCHIDSTREAMSMOONLIGHTEVERGREENBAMBOO',
    curtainWidth: 0.8,
    roofOverlap: 20,
    theme: 'dark',
    // inks from the jade crown: peacock green, spring jade, gold, pearl
    curtainColors: ['#5ed49a', '#8fd6b0', '#e8c46a', '#f2ecdc', '#3fb8c9', '#5ed49a'],
  },
  {
    id: 'bingluan',
    name: 'Bingluan',
    headingRest: 'moonlit silver, frost petals, and sapphires cut from winter sky',
    phrase: 'Ice and Jade',
    phraseNote: 'Skin of ice, bones of jade',
    caption:
      'Silver wings unfold like frost on glass, and sapphire hearts keep the cold light of the moon.',
    roofSrc: '/phoenix-crown/images/crown-ice.png',
    roofAlt: 'Ice-blue and silver phoenix crown with frost-petal wings, sapphires and pale pearl chains',
    charPool:
      'ICEMOONSILVERFROSTPETALSSAPPHIRESNOWWINTERSKYJADEBONESCOLDLIGHTGLACIERWINDNIGHTSNOWFLAKES',
    curtainWidth: 0.8,
    roofOverlap: 20,
    theme: 'dark',
    // inks from the ice crown: glacier blue, silver white, sapphire, pearl
    curtainColors: ['#9cc4f0', '#e4ecf7', '#4a6fd8', '#f2f0ea', '#b8d4f0', '#9cc4f0'],
  },
  {
    id: 'jinluan',
    name: 'Jinluan',
    headingRest: 'lacquer night, twin dragons, and phoenixes forged in imperial gold',
    phrase: 'The Golden Feast',
    phraseNote: 'Night feast at the golden throne',
    caption:
      'Dragons coil through black lacquer peonies while gold phoenixes guard pearls the size of moons.',
    roofSrc: '/phoenix-crown/images/crown-gold.png',
    roofAlt: 'Black and gold imperial crown with twin dragons, gold phoenixes, black lacquer flowers and large pearls',
    charPool:
      'IMPERIALGOLDNIGHTFEASTDRAGONSPHOENIXESLACQUERPEONIESJADEJEWELSBRONZEVESSELSTOASTSCHALICES',
    curtainWidth: 0.82,
    roofOverlap: 20,
    theme: 'dark',
    // inks from the gold crown: imperial gold, warm brass, pearl cream
    curtainColors: ['#e8b84b', '#f2ecdc', '#c9973a', '#f7e9c4', '#e8b84b', '#d8c8a0'],
  },
  {
    id: 'jinzan',
    name: 'Jinzan',
    headingRest: 'chrysanthemum gold, peach-shell dew, and wings that trail like dawn clouds',
    phrase: 'Gold and Jade',
    phraseNote: 'Branches of gold, leaves of jade',
    caption:
      'Ten thousand gold petals hold drops of peach shell, and pink wings sweep down like the first light of a wedding morning.',
    roofSrc: '/phoenix-crown/images/crown-bridal.png',
    roofAlt: 'Gold filigree bridal crown covered in chrysanthemum petals and pearls, with peach mother-of-pearl teardrops and long pink scale-patterned side wings',
    charPool:
      'GOLDENWEDDINGCHRYSANTHEMUMPETALSPEARLSWINGSLIKEDAWNCLOUDSREDCARRIAGEHAPPINESSFOREVERTOGETHER',
    curtainWidth: 0.84,
    roofOverlap: 20,
    theme: 'dark',
    // dominated by bright filigree gold, with rare accents of peach
    // shell and pearl so the curtain reads as spun gold
    curtainColors: ['#f0c552', '#f5d478', '#e8b84b', '#f0c552', '#f5d478', '#eda8a0', '#f0c552', '#f7e9c4'],
  },
  {
    id: 'fenghou',
    name: 'Fenghou',
    headingRest: 'nine dragons in gold, kingfisher gardens, and pearls sown like stars',
    phrase: 'Mother of Heaven',
    phraseNote: 'Mother of all under heaven',
    caption:
      'Gold dragons prowl above kingfisher meadows, where sapphires and rubies bloom in rings of seed pearl.',
    roofSrc: '/phoenix-crown/images/crown-empress.png',
    roofAlt: 'Ming empress phoenix crown with gold filigree dragons, kingfisher-blue enamel flowers, seed pearls, sapphires, rubies and a coral-red base band',
    charPool:
      'EMPRESSOFHEAVENNINEDRAGONSPHOENIXESKINGFISHERGARDENSSAPPHIRESRUBIESPEARLSCEREMONIES',
    curtainWidth: 0.86,
    roofOverlap: 20,
    theme: 'dark',
    // inks from the empress crown: kingfisher blue, malachite green,
    // sapphire, ruby red, coral, seed pearl
    curtainColors: ['#5c8fe0', '#4bab8a', '#3a5fc0', '#c05252', '#e08a7a', '#ede8d8'],
  },
  {
    id: 'xiapei',
    name: 'Xiapei',
    headingRest: 'vermilion silk, gold peonies, and jade drops that fall like summer rain',
    phrase: 'Rosy-Cloud Cape',
    phraseNote: 'The rosy-cloud cape',
    caption:
      'Twin phoenixes alight on shoulders of red brocade, and every gold tassel ends in a bead of green jade.',
    roofSrc: '/phoenix-crown/images/cape-xiapei.png',
    roofAlt: 'Chinese bridal cloud-shoulder cape of red embroidered silk with gold filigree phoenixes, peonies, pearls, jade-green beads and long hanging tassels',
    charPool:
      'VERMILIONSILKCAPEGOLDPEONIESJADETASSELSTWINPHOENIXESSUMMERRAINBRIDALREDFORTUNEBLESSING',
    curtainWidth: 0.84,
    roofOverlap: 20,
    theme: 'dark',
    // inks from the cape: a tight red-to-gold range — vermilion silk,
    // amber between red and yellow, warm gold. No green, no extras.
    curtainColors: ['#d4553e', '#e0873a', '#e8b84b', '#e0873a', '#d4553e', '#e8b84b'],
    // shorter strands with a strongly staggered bottom edge, so the
    // text reads like uneven tassels rather than a solid wall
    curtainLength: 0.55,
    curtainRaggedness: 0.75,
    // finer, tighter glyphs — thin dense threads echoing the tassels
    curtainGlyphScale: 0.72,
    // no glow at all — the red cape sits directly on the dark ground
    glow: {
      halo: 'transparent',
      haloFaint: 'transparent',
      shadow: 'transparent',
    },
  },
]
