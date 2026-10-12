# Brief for case-study content agents

You are writing case-study content for **design.digitallynext.com**, the award-targeted portfolio of Digitally Next's design (VIM) and web (WEM) teams. The concept is "We are water": we take the shape of what each client needs.

**Project root:** `C:\Users\Karan\Desktop\Projects\Digitally next_projects\dn_portfolio`. The other projects live next to it, in `..\<project>`.

## Read first
1. `content/types.ts` — the schema; follow it exactly.
2. `content/work/skelmet.ts` — the **reference**. Match its structure, tone, depth and sourcing.
3. `content/team.ts` — the only people you may credit, by id.
4. `docs/research-brief.md` — your project's section.
5. `docs/dnms-findings.md` — your project's section: tasks, credits, hurdles and dates.
6. `docs/PLAN.md` §10.3 (hurdle bank) and §12 (exhibit ideas).

## Write
- **`content/work/<slug>.ts`:** default-export one `CaseStudy`. Use the slug, order, tier, exhibit key and `next` you were given.
- **`content/exhibits/<slug>.ts`:** only when your instructions ask for exhibit data. Use the exact shape you were given.
- **Assets:**
  - Images go in `public/work/<slug>/`, as WebP at max width 1600. Convert with `python -I scripts/import-images.py public/work/<slug> 1600 <src>[=name] ...`; it prints the exact width and height to put in the `Img` objects.
  - 3D models go in `public/models/<slug>/`.

## Content rules
- **Plain language for non-developers.** Calm, clipped sentences in the brand voice, no hype. Use about the same amount of text as skelmet.ts.
- **Flagship case studies:** fill `brief`, `design`, `build`, `hurdles` (6–9) and `outcome`.
- **Standard case studies:** keep `brief`, `design` and `build` short; they render together as one "Approach" chapter. Use 3–5 hurdles.
- **Hurdles** are the core of the content. Find them in three places:
  1. **The code:** git log (fix, refactor and revert commits), audit reports, docs, CLAUDE.md, and code comments explaining workarounds. You may also infer what *would have been* a hurdle from unusual engineering, such as fallbacks, build scripts or workers. Each hurdle needs a `source`: a commit, file path or DNMS task.
  2. **DNMS task history:** see `docs/dnms-findings.md`. Use the reasons tasks were put on hold.
  3. **The hurdle bank:** PLAN §10.3.
- **Hurdle format:** each one gives `hard` (why it was hard), optionally `tried`, then `fix` and `result`.
  - Add a `demo` only where it truly explains the fix. Use `shift` for before→after numbers. Use `compare` only when you have a genuine before/after image pair.
- **Numbers:** every metric and number must be traceable, and gets a `source`. If you can't verify something, leave it out.
- **Testimonial:** write one draft quote that sounds like the client, with `approved: null`. **Do not invent a person's name**: use e.g. `name: "<Client> founder"`, `role: "Founder"`.
- **Credits:** use only the ids in content/team.ts, with the per-project credits in `docs/dnms-findings.md`. **Never credit former staff** (Hemant Nandal, Aashutosh Jaiswal, Gavisha Dhonsi, Guruprasad Shirangavi). If DNMS has no data, credit by what the git log shows, mapped to team ids. If you can't determine it, credit `diwakar-jha` (Web Lead) only.
- **Company tenure** is "12+ years" only. Never give a founding year.
- **Never publish:**
  - secrets or credentials, unfixed weaknesses, or security details beyond "audit and hardening done";
  - personal data, or client-side people's names;
  - internal staffing changes, timers or overdue counts;
  - client order data.
- **Theme:** take the client's real colours and fonts from their code. `accent` must reach at least 3:1 contrast on `bg`. Only use fonts available as `FontKey` in types.ts; if the client's font isn't there, pick the closest one and mention the real font in prose.

## Screenshots of live sites
- Use Playwright from this project, for example `node` with `import { chromium, devices } from "@playwright/test"`. Write any helper scripts into `scratch/<slug>/` inside this project; that folder is gitignored.
- **Capture:** desktop at a 1440×900 viewport (above the fold, plus 1–2 key sections) and phone at iPhone 13 size.
- **Before capturing:** wait for network idle plus 2 s, and dismiss cookie bars by clicking any "Accept" button.
- **Then:** convert with import-images.py. Don't add frames to the images; the site draws browser and phone frames itself (`frame: "browser" | "phone"`).
- **If the live site is down or not public:** use images from the project's repo instead.

## Don't
- Edit files you weren't assigned. That includes the reference, the types, other slugs and app code.
- Run `next dev` or `next build`. A dev server is already running, and Next allows only one.
- Commit to git.

## Verify
Run `pnpm exec tsc --noEmit` in the project root. **Your own files must have zero errors**; ignore errors in files you didn't write.

## Report back (final message)
- The files you created.
- Each image, with its dimensions.
- Facts you couldn't verify and left out.
- Anything the site builder needs to know for your exhibit.
