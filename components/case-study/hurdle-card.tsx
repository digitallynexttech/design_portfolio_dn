import type { Hurdle } from "@/content/types";
import { person } from "@/content/team";
import { CompareSlider } from "./compare-slider";
import { ShiftMeter } from "./shift-meter";

/** One hurdle: a large numeral holds the rail; the story reads hard → fix → result beside it. */
export function HurdleCard({ hurdle, index }: { hurdle: Hurdle; index: number }) {
  const solvers = hurdle.solvedBy.map(person);
  const number = String(index + 1).padStart(2, "0");
  return (
    <article
      id={hurdle.id}
      className="reveal scroll-mt-36 border-t border-(--c-line) py-14 md:grid md:grid-cols-[7rem_minmax(0,1fr)] md:gap-x-8 md:py-24 lg:grid-cols-[9rem_minmax(0,1fr)]"
      aria-labelledby={`${hurdle.id}-title`}
    >
      <div aria-hidden className="md:sticky md:top-36 md:self-start">
        <span className="block font-(family-name:--c-display) text-6xl leading-none tracking-tight text-(--c-accent) lining-nums tabular-nums md:text-7xl lg:text-8xl">
          {number}
        </span>
      </div>

      <div className="mt-5 min-w-0 md:mt-0">
        <h2 id={`${hurdle.id}-title`} className="study-h2">
          {hurdle.title}
        </h2>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="grid content-start gap-8">
            <section>
              <h3 className="label">Why it was hard</h3>
              <p className="mt-3 text-lg leading-relaxed">{hurdle.hard}</p>
            </section>
            {hurdle.tried ? (
              <section>
                <h3 className="label">What we tried</h3>
                <p className="mt-3 leading-relaxed text-(--c-muted)">{hurdle.tried}</p>
              </section>
            ) : null}
          </div>
          <div className="grid content-start gap-8">
            <section>
              <h3 className="label">The fix</h3>
              <p className="mt-3 text-lg leading-relaxed">{hurdle.fix}</p>
            </section>
            <section className="rounded-r-2xl border-l-4 border-(--c-accent) bg-[color-mix(in_oklab,var(--c-accent)_9%,transparent)] py-5 pr-5 pl-6">
              <h3 className="label">The result</h3>
              <p className="mt-2 text-lg leading-snug font-medium">{hurdle.result}</p>
            </section>
          </div>
        </div>

        {hurdle.demo ? (
          <div className="mt-14">
            <p className="label mb-4 text-center">See it</p>
            {hurdle.demo.kind === "compare" ? <CompareSlider demo={hurdle.demo} /> : <ShiftMeter demo={hurdle.demo} />}
          </div>
        ) : null}

        <p className="mt-10 text-sm text-(--c-muted)">
          Solved by{" "}
          {solvers.map((s, i) => (
            <span key={s.id}>
              {i > 0 ? (i === solvers.length - 1 ? " and " : ", ") : null}
              <span className="text-(--c-text)">{s.name}</span>
            </span>
          ))}
        </p>
      </div>
    </article>
  );
}
