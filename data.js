/* TANRAIN — every word, film, poster and poem on the site lives here.
   Edit this file to update the portfolio; the pages and 3D worlds build themselves from it. */

window.TR_DATA = {
  links: {
    substack: "https://tanishaparhi.substack.com",
    linkedin: "https://www.linkedin.com/in/tanisha-parhi-a6a8a1275/",
    instagram: "https://www.instagram.com/taniverse.tm/",
    design: "https://www.instagram.com/aesthetes_meraki/",
    email: "tanrain.films@gmail.com"
  },

  /* ---------- films: each one gets its own 3D world ----------
     frames: how many stills live in assets/films/<id>/ (00.webp, 01.webp …)
     world: the environment the frames float in — booth · ocean · glass · flame · stars · garden · neon */
  films: [
    {
      id: "anamne", title: "Anamne Booth", project: "Contingency", year: "2026", status: "finished",
      kind: "magical-realist memory drama · ~5 min", label: "memory drama", world: "booth",
      drive: "1461poQ3tKtIGtT2aRyPyY-6BwedE21YZ", frames: 14,
      logline: "On the day she finally keeps a promise, a young woman steps into a photo booth that remembers more than she does — and the person beside her may never have truly been there.",
      lines: [
        "Memory is sometimes the only place love survives.",
        "“I have always been afraid of forgetting. Photographs are the one place where the people we lose keep their faces — creased, fading, but still ours.”",
        "A florist's corner. A narrow street. A curtain breathing in an open window — grief never announces itself."
      ],
      links: [["moodboard + storyboard", "https://canva.link/f79h4ubv8shb9db"]]
    },
    {
      id: "paralian", title: "Paralian", year: "in development", status: "draft clips",
      kind: "two-episode short · 2.39:1 anamorphic", label: "the sea", world: "ocean",
      drive: "1qSaNsSGolJw6fimeMy8UQxZ6dq6ql7Zv", frames: 10,
      logline: "A man sheds every false thing that ever held him — and is granted the one freedom that forecloses the only thing he needs. The ocean gives him exactly what he asks for.",
      lines: [
        "The cage was never the city. It was staying.",
        "He runs: out of the city, through the forest, to the edge of the sea — and the water speaks.",
        "Episode One, The Coronation, is in production. These are the draft clips."
      ],
      links: []
    },
    {
      id: "mishen", title: "Mishen", year: "Jan 2026", status: "trailer",
      kind: "series · pitch trailer", label: "series trailer", world: "glass",
      drive: "1Pgqo7_BAJ9uuAeNLiX8BIVXvSwmPvH_t", frames: 9,
      logline: "The trailer for a series still finding its final form — cut to prove the world could hold.",
      lines: ["Temples, green fire, an old book that opens a door.", "A world built shot by shot until it held its own weight."],
      links: [["series pitch deck", "https://canva.link/pro2id65dp9m3k0"], ["moodboard", "https://canva.link/tv20ahxuo1cz3rk"]]
    },
    {
      id: "kalaagni", title: "Kala Agni", year: "Oct 2025", status: "finished",
      kind: "60-second film · Midjourney & Veo 3", label: "the fire of art", world: "flame",
      drive: "1hfM-lSn3Qa-ShO99rvCRZNAUoo-uEBfZ", frames: 9,
      logline: "The fire of art: a single flame passed from the rock paintings of Bhimbetka, through Chola bronzes and Mughal miniatures, into modern and digital art — Indian creativity that has never gone out, only changed form.",
      lines: ["“By using AI to create dynamic, seamless transitions, my goal was to craft a modern, cinematic poem.”", "One flame. Ten thousand years. It never went out."],
      links: []
    },
    {
      id: "stars", title: "Touch the Stars", year: "Dec 2025", status: "finished",
      kind: "short", label: "night sky", world: "stars",
      drive: "1OiI4mUARxDNLercmMdoQojhdUtnSImNx", frames: 9,
      logline: "A child, a field, a sky full of stars — and a reach.",
      lines: ["Auroras only reveal themselves to the minds that wander.", "Don't forget to look up."],
      links: []
    },
    {
      id: "welcome", title: "Welcome 2026", year: "Jan 2026", status: "finished",
      kind: "short", label: "new year", world: "garden",
      drive: "1xg1Gh-RNGWVJ0b1etKS5ch7s2cm73ema", frames: 10,
      logline: "A short made to open the year — sunflowers, sea light, a city waking up.",
      lines: ["A year, opened like a window."],
      links: []
    },
    {
      id: "ninth", title: "The 9th Revolution", year: "Sept 2025", status: "finished",
      kind: "AI horror short", label: "horror", world: "neon",
      drive: "1BKxZhjOxXpvugpv-_J0BtyL8o-9sy1C5", frames: 11,
      logline: "An AI horror short — the first film taken all the way from storyboard to final cut.",
      lines: ["A fairground at the edge of the night. A book that should not be opened.", "Fear is the hardest emotion to fake."],
      links: [["the storyboard", "https://canva.link/3vk7v9gql1blkdk"]]
    }
  ],

  /* ---------- the lab: experiments, world-building, tool fights ---------- */
  lab: [
    {
      id: "viviana", title: "Viviana — world building", year: "Aug 2026", tag: "world building",
      blurb: "Building a world before shooting it: the people, the parlour, the candlelight — locked as frames first.",
      images: ["lab/viviana-1", "lab/viviana-0", "lab/viviana-2", "lab/viviana-3", "lab/viviana-4", "lab/viviana-5"]
    },
    {
      id: "gozero", title: "Go Zero — concept ad", year: "Nov 2025", tag: "commercial test",
      drive: "1KeMzMnjLrU1X-NQjtrIwImbm9RNRchX1", images: ["films/gozero/00", "films/gozero/01", "films/gozero/02", "films/gozero/03", "films/gozero/04"],
      blurb: "Rohan, in his forties, wants to play his old guitar but the whispers of “too late” always win — until the word ZERO on a sugar-free ice-cream tub becomes his permission slip.",
      tools: "Midjourney · Freepik · Higgsfield · Kling · Veo 3.1 · Epidemic Sound"
    },
    {
      id: "caption", title: "Birds born in a cage", year: "Jan 2026", tag: "mixed media", portrait: true,
      drive: "162-OvwfYasfFoE2B2W-lnk7m4ecgAwpU", images: ["films/caption/00", "films/caption/01"],
      blurb: "A vertical caption piece in engraving and paper — words and image sharing the frame."
    },
    {
      id: "poet", title: "TanRain — poet intro", year: "Nov 2025", tag: "first hybrid", portrait: true,
      drive: "1BauPjYGDgs8EE_B-lP-AI4uTJostHsN5", images: ["films/poet/01", "films/poet/00", "films/poet/02"],
      blurb: "Live footage of me, AI everything else. Where the two layers meet is where the interesting problems live."
    },
    {
      id: "info", title: "AI info video", year: "Apr 2025", tag: "where it began", portrait: true,
      drive: "1UcfNYvfi_V3geG6R7QnO9U7kUmrbwlcP", images: ["films/info/00", "films/info/01", "films/info/02", "films/info/03"],
      blurb: "The very first thing I made with these tools. The beginning belongs in the record too."
    }
  ],
  generations: [
    ["lab/gen-2", "seedream 4.0 · gen 10"], ["lab/gen-4", "nano banana · gen 14"], ["lab/gen-5", "nano banana · gen 12"],
    ["lab/gen-6", "seedream 4.0 · gen 8"], ["lab/gen-3", "nano banana · gen 23"], ["lab/gen-1", "seedream 4.0 · gen 1"]
  ],
  boards: [
    ["Contingency", "moodboard + storyboard", "https://canva.link/f79h4ubv8shb9db"],
    ["Mishen", "series pitch deck", "https://canva.link/pro2id65dp9m3k0"],
    ["Mishen", "moodboard", "https://canva.link/tv20ahxuo1cz3rk"],
    ["The 9th Revolution", "storyboard", "https://canva.link/3vk7v9gql1blkdk"]
  ],

  /* ---------- the stairs: posters from @aesthetes_meraki ---------- */
  posters: [
    ["beyond-the-horizon", "Beyond the Horizon"], ["vision", "Vision — Cosmic Gaze"], ["legacy", "Legacy"],
    ["b-diaries", "B-Diaries × Halsey"], ["astronaut", "Starbound"], ["flower-face", "Bloom, Behind Glass"],
    ["david", "David, Electric"], ["starry-start", "Start — after Van Gogh"], ["cottagecore", "Cottagecore Seasons"],
    ["unicef", "UNICEF — Ruins"], ["clockwork", "Clockwork"], ["donuts-cure", "Donuts Cure Depression"],
    ["doughnuts-bad", "Doughnuts Are Bad For You"], ["donut-puns", "Just Donut — puns"], ["statue", "Stone, Lit"],
    ["vision-tee", "Vision — merch"]
  ],

  /* ---------- the archive at the top of the stairs: brand, ads, thumbnails ---------- */
  archive: [
    ["kishmish-kit", "Kishmish — brand kit", "brand"], ["kishmish-logo", "Kishmish — logo", "logo"],
    ["kishmish-stickers", "Kishmish — stickers", "print"], ["sleek-crafted", "Sleek & Crafted — logo", "logo"],
    ["mineral", "Mineral Resources — identity", "logo"], ["manas", "Manas Educational Trust — logo", "logo"],
    ["stepps", "Stepps × Spotify", "campaign"], ["social-campaign", "Topical social campaign", "campaign"],
    ["email-sequence", "Email marketing sequence", "copy"], ["alexa", "Alexa — ad concept", "ad"],
    ["audible", "Audible — video ad", "video edit"], ["selfie-ad", "“Here is what we have for you”", "video edit"],
    ["topical", "Topical news edit", "video edit"], ["thumb-biryani", "YouTube thumbnail — 1M+ views", "thumbnail"],
    ["thumb-cook", "YouTube thumbnail", "thumbnail"], ["thumb-grid", "Thumbnail optimisation", "thumbnail"],
    ["thumb-news", "News thumbnails", "thumbnail"]
  ],

  /* ---------- poems & stories: each opens into its own world ----------
     world: the shader the poem lives inside — aurora · words · polaroid · kaleido · abyss · dawn · waves · nebula */
  worlds: {
    hiraeth: "aurora", alexithymia: "words", polaroid: "polaroid", alpenglow: "aurora2",
    kaleidoscope: "kaleido", society: "abyss", dawn: "dawn", nocturne: "waves", neonweaver: "nebula"
  },
  stickers: {
    hiraeth: [["hiraeth", "a deep longing for a home that perhaps never was"], ["toska", "a dull ache of the soul — Nabokov"], ["caleö", "Latin: to be warm; to be in love"]],
    alpenglow: [["noctifer", "the night-bringer star"]],
    kaleidoscope: [["astrifer", "star-bearing"]],
    alexithymia: [["alexithymia", "the inability to put feelings into words"]]
  },
  poems: [
    {
      "id": "hiraeth",
      "kind": "poem",
      "num": "i.",
      "title": "Hiraeth",
      "gloss": "a deep longing for a home — perhaps one that never was",
      "html": "<p>The house of his dreams ain't a big bungalow in a remote place with opulent comforts — but a tranquil cottage in the middle of woods, or maybe under the celestial northern lights, or by the calm yet angry sea.</p> <p>Because there is a pleasure in the pathless woods,<br> There is a rapture in the iridescent polar lights,<br> There is a society where one intrudes on the deep sea.</p> <p>The house of his dreams has always been greeted with the first rays of sunlight and the aroma of coffee in the first blush. Days filled with company of art, music, poetry, love — cuz these are what we humans stay alive for.</p> <p>And when the orange, yellow, and red sunset fades in the west,<br> The birds chirp, nocturnal nature spirits awaken, and the enchanting melancholy twilight makes its appearance.<br> That is the time of the day when he picks up his pen, bleeds out poetry, and writes holy billet-doux to be read later.</p> <p>When black by black the dark takes over, the noctifer will notify and the stellifer sky will glimmer. And he'll lie on the rooftop with a person who has astrologia.</p> <p>The house of his dreams is indeed a cottagecore aesthetic but with a cyberpunk twist.<br> Log cabin with blossoming red, blue, green roses; tulips, sunflowers, and an amaryllis garden.<br> An open green field nearby gives a sense of freedom.<br> A library having books that give wings to the mind and flight to the imagination.<br> A gaming room — literal portal to dreamy worlds — with neon lights energizing every bone of the body.<br> A living room with a crackling fireplace that invites him to its hearth and warms his frozen bones.<br> A bedroom that unbinds him from the toska and lets him dive into the depths and feel the essence of the other.</p> <p>But in the end, they say<br> Home is not a place, instead a person,<br> Warmth was never merely a blanket,<br> Melancholy was the sounds on a winter's night<br> And the arm of the right one is what you call caleö.</p> <p class=\"sig\">— T.R.</p> <p class=\"gloss-note\">hiraeth · toska · caleö — the poem keeps its own dictionary of longing: Welsh for homesickness for a place that never existed; Nabokov's untranslatable ache of the soul; Latin for <em>to be warm — to be in love</em>.</p>"
    },
    {
      "id": "alexithymia",
      "kind": "poem",
      "num": "ii.",
      "title": "Alexithymia",
      "gloss": "the inability to express emotions verbally",
      "html": "<p>The butterflies of unspoken words roam inside my head<br> There are millions and billions of them<br> They fill up the whole space of the skull<br> Hovering and bumping over the cogs and wheels<br> They trigger moments of unspoken bliss<br> There is a graveyard of words, too<br> Long lost that will never get a chance to escape</p> <p>The heart is heavy too,<br> With an ocean of emotions deep,<br> A thousand words within it sleep,<br> But when they seek to leave the soul,<br> The tongue is silent, and the words won't roll.</p> <p>The eyes may water with unshed tears,<br> The chest may heave with unspoken fears,<br> The mind may crowd with butterflies of thoughts unshared,<br> But the words remain locked,<br> The soul impaired.</p> <p>Oh, the frustration of a heart in chains,<br> Desperate to break free of wordless pains,<br> But unable to find the right expression,<br> To convey the depth of its impression.</p> <p>Words betray me when I speak<br> But when jotted down on paper<br> They join the dots of constellations<br> What's their philosophy?<br> Are they a colour palette of poetry?</p> <p>The poet's pen may flow with ease,<br> As words are feelings, the poet bleeds<br> But for some, words refuse to appease,<br> And so the heart remains unheard,<br> Its feelings are lost,<br> Its voice deferred.</p> <p>Yet still, it beats, this heart of mine,<br> With feelings vast and thoughts divine,<br> It sings a ballad of its own.<br> And though the words may not come out,<br> The emotions still exist, without a doubt.</p> <p>So, I let the heart beat on,<br> And drown me with its melody<br> Even when the words remain unsung,<br> For though they may not find a voice,<br> The feelings remain, and drowning is a choice.</p> <p class=\"sig\">— T.R.</p>"
    },
    {
      "id": "polaroid",
      "kind": "poem",
      "num": "iii.",
      "title": "The Polaroid",
      "gloss": "memory, developed in darkness",
      "html": "<p>I close my eyes<br> And hear the clicking of the memory reel as it starts spinning inside my head,<br> I am stuck in a causality loop<br> I see the glimpses of every moment I have spent with you,<br> I snap and imprint them on Polaroids</p> <p>They say darkness is necessary for Polaroids to develop fully and brilliantly<br> And after driving through the waves of darkness we've been through<br> When I revisit the snaps, I realize that<br> In the darkest nights, we see the brightest stars</p> <p>I collect the stars of our memories and keep them<br> Inside the special pocket stitched inside my chest,<br> The stars align themselves and form a wonder that lights up the dark nights<br> And that's when I know how vital you are to me.</p> <p>They say music is life, that's why our hearts have beats<br> And you know our heart syncs with the rhythm of the music we play?<br> So if I were to say that you are the music of my heart, then it wouldn't be a lie,<br> Because when we bind our forces we balance each other.</p> <p>In a nutshell, you are the tapestry of art that contains the knowledge of the Universe<br> You are the mesh of art and science that contains the vastness of infinity<br> You are the artist who will map out the new world with the history of our origin<br> and discover the mysteries of the universe.</p> <p>And I think we are destined to be together for a long time<br> and that's the reason our stars aligned.</p> <p class=\"sig\">— T.R.</p>"
    },
    {
      "id": "alpenglow",
      "kind": "poem",
      "num": "iv.",
      "title": "Alpenglow",
      "gloss": "for the auroras, and the minds that wander",
      "html": "<p>Whoosh! See a shooting star<br> Whoops! You are not in your room anymore<br> A black void sucked you in — maybe a lil black hole<br> You look up at the wonder of the blue and green symphony of lights<br> An ocean in the sky, a fragile curtain hung upside down, scaling the moonlit ice<br> Reflecting the depths and vivid colors of your soul's midnights</p> <p>Shall I compare thee to the aurora?<br> Thou art the waves of the lights tainted crimson at the bottom edges like the fires of Hell<br> Swinging and shimmering loosely with more grace than the most skillful dancer,<br> Beckoning the stars to join in.</p> <p>I felt your brilliance dance over me<br> A guiding light as I sail into the night<br> But few will see your spectacularity<br> Because auroras only reveal themselves to the minds that wander<br> I would like to count myself lucky to have glanced at your soul — free-spirited and noctifer.</p> <p>Don't forget to look up<br> Always look up<br> Keep shining.</p> <p class=\"sig\">— T.R.</p>"
    },
    {
      "id": "kaleidoscope",
      "kind": "poem",
      "num": "v.",
      "title": "Kaleidoscope, in three parts",
      "gloss": "the heart, the mind, and the war between",
      "html": "<p class=\"part\">Part 1</p> <p>A house of mirrors full of reflections<br> Contains a fragile, shining instrument of crystals and strings,<br> Which can either weep or sing ballads of receptions.<br> Splashed with colours of blue and blinded by lights,<br> Stuck in a cage is hit with arrows of words used to create imagery.<br> A throbbing of pulse and a tremble of strings,<br> Fuels the instrument that creates numerous perceptions.<br> The cogs and wheels start spinning, creating projections,<br> Forming numerous realities on mirrors — or are they deceptions?</p> <p class=\"part\">Part 2</p> <p>A battle breaks out between<br> The instrument of strings<br> And the machine of cogs and springs<br> One siding with red (love) while the other with orange (warning)<br> The out-turn of war isn't bought with peace<br> And the pumping machine emerges victorious<br> Breaking the lease.</p> <p class=\"part\">Part 3</p> <p>The shining crystal takes the charge<br> Forms astrifer delusions and mirage<br> The cogs and wheels still spin, but are kept in blissful ignorance<br> The crystal doesn't know it'll soon be tested for its endurance<br> It plays its string when sent mixtapes of red<br> It doesn't know that neglecting the circuit machine is a risky trade.</p> <p class=\"sig\">— T.R.</p>"
    },
    {
      "id": "society",
      "kind": "poem",
      "num": "vi.",
      "title": "The Perks of Our Society",
      "gloss": "on masks, armour, and the bravery of taking them off",
      "html": "<p>We live in a Society<br> where people have shields<br> and armours around them.<br> They wear masks to hide themselves<br> scared to reveal their true identities.<br> They lock themselves up in their own<br> prisons because they are<br> Afraid to give more of them<br> Afraid to show weaknesses of em<br> Afraid of being played like a game.<br> And sometimes afraid of getting healed.</p> <p>We live in a Society.<br> Where the emotions portrayed on the<br> face are not always true.<br> The leaves are not always green nor<br> the violets always blue.<br> Observe keenly, you will find<br> secrets behind the smiles of people.<br> The darkness, they conceal in their eyes.<br> Never get fooled by<br> how cheerful their shell seems.<br> Deep down, they often have chaos<br> in their seas.<br> And their mind and heart are often at war.</p> <p>They all have different stories<br> But they would seem to fight the same war.<br> The war to survive the fall (depression)<br> The war to make the jump (anxiety)<br> The war to find the light (sadness).</p> <p>I sometimes wonder what would happen if<br> They take off their shields &amp; armours<br> They take off their masks<br> And come out of their shells &amp; prisons.<br> What if someone rescues them,<br> offers a hand out of the war to provide Peace.<br> Finds them in the deep abyss of vita Tartarus,<br> Offers a place called Home.<br> To flee with them from their prisons<br> And shine a light in the maze.</p> <p>Will they escape from the chaos<br> of their minds, brokenness of their hearts?<br> Or would they choose to stay in the<br> fields of punishment they have made for themselves?<br> Will they find a permanent home —<br> a place of eternal peace and comfort —<br> or would they choose to be wild<br> hunters and gatherers fighting each day for survival?<br> Will they accept the helping hand,<br> a healer's help, who offers to heal them?<br> Or would they choose to stay with<br> the wrong person and live in pieces rather than peace?</p> <p>Some people cease chaos in life<br> while others long for peace.<br> This is the society we live in —<br> people never get confused in this maze.<br> The bravery is in showcasing your<br> true self, not in hiding behind a false face.</p> <p class=\"sig\">— T.R.</p>"
    },
    {
      "id": "dawn",
      "kind": "story",
      "num": "vii.",
      "title": "The Dawn",
      "gloss": "flash fiction — a confession, almost made",
      "html": "<p>Late in the evening, as the sun goes down, he decides to let her know that he loves her. He would tell her how much he cares about her — that she is his home of unconditional love and comfort. He will tell her how she changed him for the better, and that it is because of her that he bleeds words instead of blood.</p> <p>He would tell her how just one smile from her makes his day survivable, how her eyes are always honest with him, and how he finds his way through her light.</p> <p>With hope in his eyes and enthusiasm in his heart, he went to her — only to find out that she was never actually there. She was just an unfinished dream, one he had every night when sleep embraced him.</p> <p>With an ache in his heart, he decided that she was his destiny. And so, he closed his eyes, drifting off into eternal sleep.</p> <p>And this was the way he embraced his destiny.</p> <p class=\"sig\">— T.R.</p>"
    },
    {
      "id": "nocturne",
      "kind": "story",
      "num": "viii.",
      "title": "Nocturne Notes",
      "gloss": "a world where music has magical properties",
      "html": "<p>The elevator door opened to the third level, a floor that I seldom visited. But hold on — I forgot to introduce myself. I am Tanner Slate, and this is Harmonia Nocturne, a place where music possesses magical powers at night. Now, you must be thinking music feels magical on Earth too at night (when I am inebriated). Haha — except music can even eviscerate here. But there's no need to be scared; it only happens if you stumble upon Chord Shadow Bazaar. We'll talk about that later.</p> <p>In my city, we are divided into four clans. The <strong>Chordians</strong> — string players — create melodies that evoke strong emotions, using the resonant qualities of their instruments to influence the environment and people's moods. The <strong>Harmonixies</strong> — key players — are masters of harmony and rhythm, weaving soundscapes that heal, calm, or energize: they are the doctors. The <strong>Aeronates</strong> — wind players — craft powerful solos and uplifting tunes, manipulating air and breath to bring vitality and motion to my world: they command the wind and waves. And the <strong>Rythmatists</strong> — percussionists — control the beats and tempo, keeping every other harmony synchronized. They play the role of Hestia, our goddess of the hearth.</p> <p>Our world is mapped like a Ludo board, the four clans holding each corner with the Crescendo Court Hotel in the centre — a cardinal hall where all the clans gather to create harmonies and go about their work. But here's the fun part: only the senior council members work, while we teens do a very creative job. We are given Spotify playlists of humans from Earth, and our task is to choose one and bring it to life with our music — to give it a personality. That is where the people of Harmonia Nocturne come from. Who knows — there might be an Aeronate or a Chordian out there who is the personified form of <em>your</em> playlist.</p> <p>Let's break the suspense of Chord Shadow Bazaar now: it is a tenebrous black market where one can trade major and minor chords. You must be thinking that is ludicrous, Tanner — a trade of chords? How is that dangerous in any sense? Well, in our world, major and minor chords regulate a person's mood — and worse, they can intoxicate. The Bazaar is run by haughty Chordians and Harmonixies who believe their clans superior, and that they should dominate.</p> <p><em>* alarm bells ring *</em></p> <p>So let's wrap it up here today — I am getting late for my Curation Class. I'll see you guys later.</p> <p class=\"sig\">— T.R.</p>"
    },
    {
      "id": "neonweaver",
      "kind": "story",
      "num": "ix.",
      "title": "The Neon Weaver's Quest",
      "gloss": "a short story about magic, and confessing",
      "html": "<p>Tanner Slate was the youngest magician in Arcanovia, known for his exceptional talent and youthful charm. Nicknamed <em>Neon Weaver</em> for his ability to animate objects through his glowing sign designs, Tanner sported straight, sun-kissed blonde locks and a sleek black obsidian bracelet with an emerald at its centre.</p> <p>Arcanovia is where magic first came into existence, yet not everyone possessed it. Eventually, fewer people were born with it, and the gifted began to live ordinary lives. Magicians were reduced to party entertainers, performing quirky tricks at birthdays and weddings. Tanner's vibrant magic made him a favorite among the city's children — though he felt destined for something greater.</p> <p>In the stillness of an afternoon, a mysterious letter arrived, exuding an otherworldly aura in elegant, regal handwriting: an invitation to perform at an enigmatic castle by the sea. Expecting another mundane performance, he reluctantly agreed, though curiosity tugged at his thoughts.</p> <p>The castle's grand doors swung open with an eerie creak and closed behind him with a resounding thud. \"Hello? Is anyone there?\" Pressing the emerald on his bracelet, he summoned a glowing pen and sketched a lamp, which materialized in his hand, casting light into the shadows.</p> <p>\"Welcome to Stellician Palace,\" a voice boomed. \"I am Cybele Shadow, the curator of mysteries within these walls. You have been chosen, young Weaver, to solve a mystery of utmost importance. You must find the one who holds the stars in their grasp, and the weaver of words. The one who understands the cosmos, and the one who crafts verses.\"</p> <p>Two portals stood before him, adorned with intricate runes. Through the first he stepped into a cosmic realm of nebulae and shimmering stars, and found Stella — an astrophysicist, and his first love — studying star charts with furrowed brows, trying to save a dying star on the brink of supernova. Together they navigated treacherous asteroid fields, seeking rare cosmic elements; Tanner wove neon shields to guide them through peril, and marveled at how vast the universe was, and how much he still felt for her. Just as the star steadied, the portal pulled him back.</p> <p>The final portal led to a realm where words came to life. A tall, jet-black-haired man stood wielding a pen like Tanner's own, its tip a hologram of a majestic phoenix — Mistico, a talented poet, and the other person he had secretly loved. Together they deciphered cryptic verses and confronted the rogue bard who used poems for dark magic, dodging hostile verses and harnessing the power of the good ones. Through Mistico's work, Tanner saw his soul.</p> <p>Back at the palace, Cybele stood holding Stella's telescope and Mistico's pen — without which both would eventually disintegrate. \"One final challenge awaits. You must confess your feelings to Stella and Mistico, risking vulnerability and rejection. Only then will they be truly free.\"</p> <p>Tanner stood there, dumbfounded. He had always run away when feelings became unbearable. \"Why are you doing this?\" he asked angrily.</p> <p>\"Because,\" Cybele replied, her voice softening, \"the greatest magic is love. You must show them your true heart to break the spell.\"</p> <p>He took a deep breath. \"Stella, Mistico — I love you both. I've been a coward, hiding my feelings, afraid of rejection. But I can't let fear control me anymore.\"</p> <p>Tears welled in Stella's eyes. \"Oh, Tanner — I've always loved you too.\" Mistico's intense gaze softened. \"I've felt the same way. I just didn't know how to tell you.\"</p> <p>As Tanner embraced them both, a brilliant light filled the room, and the castle's enchantments dissolved. Cybele smiled warmly. \"Well done, Neon Weaver. You have unlocked the true power of your magic.\"</p> <p class=\"sig\">— T.R.</p>"
    }
  ]
};
