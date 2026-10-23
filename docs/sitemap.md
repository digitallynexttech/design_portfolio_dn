# Sitemap and page sections

Set by Karan on 21 Oct 2026. Below the tree, each unique page has its sections listed top to bottom. The 11 case studies share one template, so their four chapters are listed once.

```
design.digitallynext.com
├── /                Home: hero · showreel · the work (01–10, one list) · clients & awards · studio & services · contact
├── /work            All work as one list in this order, then the archive of older sites
│   ├── 01  /work/skelmet
│   ├── 02  /work/know-your-genes
│   ├── 03  /work/hard2soft
│   ├── 04  /work/happy-ganga
│   ├── 05  /work/talentifix
│   ├── 06  /work/chetan-mangalwedhe
│   ├── 07  /work/realty-canvas
│   ├── 08  /work/dnms
│   ├── 09  /work/leocym
│   ├── 10  /work/kyg-network
│   └── 11  /work/making-of        (on /work only, not the home)
│
│       Every case study has the same 4 chapters:
│       /work/<slug>            Overview
│       /work/<slug>/approach   Brief, design and build
│       /work/<slug>/hurdles    Hurdles & fixes
│       /work/<slug>/outcome    Outcome
│
├── /services        the services · process · the projects that prove each one
├── /about           story · principles · team · studio · clients & recognition
├── /reel            the showreel on its own page, for sharing (not in the menu)
└── /#sail           the 3D world, a mode of the home page
```

**Unique pages: 10.** Home, Work, the four case-study chapters, Services, About, Reel and Sail.

---

## On every page

**Header**
- The X logo, which links home.
- Work · Services · About · **Start a project ↗**
- Phones: a bottom **Menu** pill that opens the menu as a liquid sheet (Home, Work, Services, About, Start a project).

**Footer**
1. **Closing call to action:** "(∞) Next", then "Have something that needs shaping?" with the X, then **Start a project ↗** and **Join the studio ↗**. In a case study it shows on the Outcome chapter only.
2. **Links:** Work · Services · About, then Careers ↗ · Journal ↗ · Privacy ↗, then socials.

---

## 1. Home `/`

1. **Hero.** A red eyebrow pill and "Building your tomorrow." One lead line. **Start a project** and **See the work**, plus the link "Or sail through our work in 3D" (opens `/#sail`). On the right, the X on its lit stage, a "Let's build yours." bubble and the live New Delhi clock.
2. **Showreel.** "WATCH OUR SHOWREEL." runs as a marquee behind a small reel card, with "Scroll to enlarge" under it. Scrolling grows the card to full screen. A **Play reel** pill, because the reel is silent.
3. **(01) The work.** Projects 01–10 as one numbered list, in the sitemap order, with no flagship/standard split. Each row shows the number, client, one line and disciplines; with a mouse, the project's screen follows the pointer. Ends with **All work →**. The making-of is left out.
4. **(02) Clients and awards.** The client logo wall on a slow current, then the compact recognition row.
5. **(03) Studio and services.** "One studio, six kinds of work." One line about the studio, then three numbers: 12+ years, 50+ brands, the case-study count. The six services follow as a ribbon of images, each naming its proof clients. Ends with **All services →** and **Meet the studio →**.
6. **Contact.** The footer's closing call to action, then the footer.

No team section and no client quotes on the home.

> **Changes from today's build:** the work is two sections today, (01) Selected work with the 4 flagships in the water vessel, and (02) More work with 6 rows. Both merge into one list. The project order changes to the sitemap's.

## 2. Work `/work`

1. **Intro.** "(02) Work", then "Shapes we've taken." and one paragraph on what each case study holds.
2. **All work.** Projects 01–11 as one list in the sitemap order, the making-of last. Each card shows the poster, client, year and disciplines. The discipline filter stays, and its choice is kept in the URL.
3. **Archive.** "Earlier shapes." These are older sites with no case study, as screenshot cards that link out to the live sites. On phones they become a swipe rail.

> **Changes from today's build:** today's grid gives each flagship a full row and puts two standards side by side, which becomes one even list. The order changes to the sitemap's.

## 3. Case study: Overview `/work/<slug>`

Every chapter wears the client's colours and fonts. A **sticky chapter bar** sits at the top of all four chapters, with the client name, the four chapter links, reading times and a progress line.

1. **Live exhibit.** The real thing, running and interactive. On phones a short "how to play" hint shows first.
2. **Intro.** Industry · year, the client name as the title, the headline and a summary. Platform and disciplines. **Visit the live site ↗**.
3. **Numbers.** Three sourced metrics.
4. **Client quote.** Approved quotes only, so this section is hidden when there is no approved quote.
5. **Credits.** Who designed and built it.
6. **Next.** Chapter 02 Approach, with its reading time.

## 4. Case study: Approach `/work/<slug>/approach`

1. **Chapter header.** "Chapter 02 / 04 · N min", the title, and an intro line counted from the chapter itself (e.g. "4 colours, 2 typefaces and 6 tools").
2. **Brief.** Who the client is, the problem, the constraints, and what success had to look like.
3. **Design.** The identity as it ships: colour palette, a type specimen in the client's font, and key screens and decisions.
4. **Build.** An architecture diagram, the key systems in plain language, and the stack.
5. **Previous / Next.** Overview ← → Hurdles & fixes.

## 5. Case study: Hurdles & fixes `/work/<slug>/hurdles`

1. **Chapter header.** "Chapter 03 / 04 · N min", the title, and an intro line ("Five hurdles, each with the fix and who solved it. Two you can see for yourself.")
2. **Hurdle index.** Numbered chips that jump to each hurdle.
3. **Hurdle cards**, one per hurdle. Each card has:
   - a large numeral;
   - the hurdle;
   - why it was hard;
   - what we tried, where there was a failed first try;
   - the fix;
   - the result;
   - **see it**, an interactive before/after, where it helps;
   - who solved it.
4. **Previous / Next.** Approach ← → Outcome.

## 6. Case study: Outcome `/work/<slug>/outcome`

1. **Chapter header.** "Chapter 04 / 04 · N min", the title, and "Where it landed and who built it, then on to <next client>."
2. **Results.** Sourced numbers only, and what happened after launch.
3. **Client quote.** The full approved testimonial, hidden when there is none.
4. **Credits.** Who designed and built it.
5. **Next project.** The next study's poster, which flows into its exhibit when clicked.
6. **Previous.** ← Hurdles & fixes.
7. **Contact.** The footer's closing call to action, which shows on this chapter only.

> **Changes from today's build:** flagships have Brief, Design and Build as three separate chapters today. Any study with more than 5 hurdles splits them over two pages ("on screen" and "under the hood"). Both cases become the single 4-chapter template above.

## 7. Services `/services`

1. **Intro.** "(03) Services", then "What we pour into." and one paragraph. Beside it, a numbered jump list of the six services and **How we work ↓**.
2. **The six services**, one block each:
   - Brand & digital identity
   - UI/UX & design systems
   - Websites & creative development
   - E-commerce
   - Platforms & products
   - Search & AI visibility

   Each block shows the number, title, one line and a paragraph. Then **What you get** (the deliverables) and **Tools**. Then **Proof**: compact cards for the case studies that prove it.
3. **How we work.** "Six steps, every time.": Discover · Design · Build · Test · Launch · Care. Each step has a line and a **Proof →** link to a real hurdle.

## 8. About `/about`

1. **Story.** "(04) About", then "A studio that takes your shape." A full-bleed team photo, in portrait on phones. Two paragraphs: 12+ years, 50+ brands, New Delhi, no house style, part of Digitally Next under its Group CEO.
2. **Principles.** "How we think": Adapt · Flow · Carve · Clear, one line each.
3. **Team.** "The people." covers three groups:
   - VIM, the designers, motion and video;
   - WEM, the developers;
   - the rest of the studio, in a smaller row.

   Each name is set large with its discipline title and chips linking to the projects that person shipped.
4. **Studio.** "Inside the studio": a grid of office photos with captions.
5. **How we work link.** "How we work: six steps, each with proof →" goes to `/services#process`.
6. **Clients & recognition.** The client logo wall, then the full recognition block of awards, empanelment and alliances.

## 9. Reel `/reel`

Not in the menu. It's a standalone page for sharing the reel.

1. **Title.** "Reel · 7 · No sound", then "The work, running."
2. **Player.** The poster with one play button, then the native controls. A **Now** pill in the current client's colour links to that case study.
3. **Chapter list.** Every site in the reel in order. Visitors can jump to one or read what it is. This is also the reel's text alternative.
4. **End of reel.** **See the work →** and **Watch again** appear when it finishes.

## 10. Sail `/#sail`

The 3D world opens over the home page, either from the hero link or straight from a `/#sail` link. You sail a red boat. Each place opens a liquid panel when you dock.

**Places**
1. **Digitally Next (hub):** how we built this world, which links to the making-of.
2. **Four large islands:** SKELMET, Know Your Genes, Hard2Soft, DNMS.
3. **Six smaller islands:** Happy Ganga, Leocym India, KYG network (with a lighthouse rock for each of its 13 sites), TalentiFi-X, Chetan Mangalwedhe, Realty Canvas.
4. **The studio:** who poured it, meaning the team.
5. **The Lab:** work made for no client.
6. **Service buoys:** the six services, in a channel from the hub to the studio.
7. **Reel screen:** the showreel, floating on the water.
8. **Recognition rock:** awards and alliances.
9. **Archive reef:** older sites on floating screens.
10. **Message in a bottle.**
11. **Weather buoys:** set the sky to Yours, Clear, Rain, Storm, Mist or Snow.

Each island panel shows the client, its numbers and a gallery, then links to the full case study.

**Controls (always on screen)**
- **Map:** a chart of every place. Tap one to travel there.
- **Logbook:** links to all work, the making-of, Services, About and Reel.
- **Options:** weather, season, time of day, sound, quality, and **Classic view**, which goes back to the normal site.
