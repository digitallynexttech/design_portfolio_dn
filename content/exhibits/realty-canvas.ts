import type { Img } from "../types";

// Exhibit data for the Realty Canvas case study: the home-page hero banners, as a deck to swipe.
// Source: realtycanvas/public/banner/{mobile,tablet}/ (wired up in realtycanvas/data/banners.ts).
// Each project has a near-square phone cut (768×680) and a landscape tablet cut (resized from 2048×1200);
// the deck pairs them so a swipe also shows the art direction. Prices on the banners are the client's
// own published launch prices.

export const RC_DECK: { title: string; image: Img }[] = [
  {
    title: "Ishva by TARC · phone cut",
    image: {
      src: "/work/realty-canvas/deck/ishva-phone.webp",
      alt: "Banner for Ishva by TARC: three lit towers against a dusk sky above the name and starting price, composed for a phone",
      width: 768,
      height: 680,
    },
  },
  {
    title: "Ishva by TARC · tablet cut",
    image: {
      src: "/work/realty-canvas/deck/ishva-tablet.webp",
      alt: "The Ishva banner recomposed for a tablet: the towers spread wider across the sky, with the details beneath",
      width: 900,
      height: 527,
    },
  },
  {
    title: "Downtown 66 · phone cut",
    image: {
      src: "/work/realty-canvas/deck/downtown-phone.webp",
      alt: "Banner for Downtown 66: three tall towers at sunset framed in bronze, with the address and starting price, composed for a phone",
      width: 768,
      height: 680,
    },
  },
  {
    title: "Downtown 66 · tablet cut",
    image: {
      src: "/work/realty-canvas/deck/downtown-tablet.webp",
      alt: "The Downtown 66 banner recomposed for a tablet: towers on the left, name, address and starting price on the right",
      width: 900,
      height: 527,
    },
  },
  {
    title: "Joy District · phone cut",
    image: {
      src: "/work/realty-canvas/deck/joy-district-phone.webp",
      alt: "Banner for Joy District by AIPL: a curved retail building lit at night above the name and starting price, composed for a phone",
      width: 768,
      height: 680,
    },
  },
  {
    title: "Joy District · tablet cut",
    image: {
      src: "/work/realty-canvas/deck/joy-district-tablet.webp",
      alt: "The Joy District banner recomposed for a tablet, building on the left and the name and price on the right",
      width: 900,
      height: 527,
    },
  },
];
