import { getCaseStudy } from "./work";

// The showreel: public/video/reel.mp4, 1280×720 H.264, 48.96 s, no audio track (ffprobe, 10 Oct 2026).
// Seven live sites, seven seconds each. Cut times verified frame by frame
// (.captures/audit/agent-pages/reel-frames/cuts.jpg). public/video/reel-chapters.vtt mirrors this list.

export const REEL = {
  src: "/video/reel.mp4",
  poster: "/video/reel-poster.webp",
  chaptersTrack: "/video/reel-chapters.vtt",
  width: 1280,
  height: 720,
  duration: 48.96,
  /** The file is 48.96 s; players floor it to "0:48", so the page says the same. */
  length: "0:48",
  summary: "Seven live sites, seven seconds each",
} as const;

type RawChapter = {
  start: number;
  slug: string;
  /** What is on screen, for people who can't see the video. Only what the frames show. */
  shows: string;
};

export const REEL_CHAPTERS: RawChapter[] = [
  { start: 0, slug: "skelmet", shows: "The dark home page, an orange skull helmet mount, then the range in three colours." },
  {
    start: 7,
    slug: "know-your-genes",
    shows: "The home-testing kit beside the site's guide character, then the questions people bring to a DNA test.",
  },
  { start: 14, slug: "hard2soft", shows: "Amazon and Flipkart availability, value packs, then the product's benefits." },
  { start: 21, slug: "happy-ganga", shows: "“Healthy Families & Happy Rivers”, then the cleaning range." },
  { start: 28, slug: "talentifix", shows: "The “Staffing. Rebuilt.” home page, its security certification, then company news." },
  { start: 35, slug: "chetan-mangalwedhe", shows: "The home page with his portrait, then his press coverage." },
  { start: 42, slug: "realty-canvas", shows: "The Downtown 66 launch, then articles on senior living in India." },
];

/** Serializable chapter data for the client-side player. */
export type ReelChapter = {
  start: number;
  end: number;
  slug: string;
  client: string;
  headline: string;
  shows: string;
  accent: string;
  onAccent: string;
};

/** Chapters joined with their case studies. */
export function reelChapters(): ReelChapter[] {
  return REEL_CHAPTERS.flatMap((chapter, i) => {
    const study = getCaseStudy(chapter.slug);
    if (!study) return [];
    return [
      {
        start: chapter.start,
        end: REEL_CHAPTERS[i + 1]?.start ?? REEL.duration,
        slug: study.slug,
        client: study.client,
        headline: study.headline,
        shows: chapter.shows,
        accent: study.theme.accent,
        onAccent: study.theme.onAccent,
      },
    ];
  });
}

/** Everything the client-side player needs, joined on the server so the case-study content never ships to it. */
export type ReelData = {
  src: string;
  poster: string;
  chaptersTrack: string;
  width: number;
  height: number;
  length: string;
  summary: string;
  chapters: ReelChapter[];
};

export function reelData(): ReelData {
  const { src, poster, chaptersTrack, width, height, length, summary } = REEL;
  return { src, poster, chaptersTrack, width, height, length, summary, chapters: reelChapters() };
}
