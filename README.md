# Allan Dave Ebale — Portfolio

A static portfolio generated from reusable **React components** and **Tailwind CSS**. Visitors get ordinary HTML, CSS, and a small shared JavaScript file; there is no React runtime, API, or build step required on the hosting server. The checked-in HTML and `portfolio.css` are the deployable output, so the existing GitHub Pages setup can keep serving the repository directly.

**Live site:** https://101dave.github.io/EbaleAllanDave/

## Develop and publish

Node.js 20+ is recommended. After editing the React components, content data, or Tailwind styles:

```bash
npm ci
npm run build       # regenerates portfolio.css and the marked HTML regions
npm test            # component, static-page, and behavior checks
npm run serve       # http://localhost:8000
```

Commit the changed source **and** the generated HTML/CSS together. The build preserves the unmarked content of the older pages, including the contact form and printable résumé. `npm run build:pages -- --check` checks whether the generated HTML is up to date without writing files.

## Update the content

All of the new portfolio copy is in `src/portfolio-data.js` and `src/components/Pages.jsx`:

- **Hero:** edit the headline and subheadline in `HomePage` in `src/components/Pages.jsx`.
- **Now:** update `now.building`, `now.reading`, `now.exploring`, `asOf`, and `asOfLabel` in `src/portfolio-data.js`. Each entry is `{ text, detail, href }` (the last two are optional). The date is deliberately manual: don't make an old update appear current by changing it automatically. A `null` entry is shown as “not shared yet.” The existing dated entries refer to documented Scholog work; add a book or paper only when you have one to share.
- **Skills:** edit `skillTiers` to reflect what you actually use. The “Currently Exploring” tier is for recent investigation, not a claim of production experience.
- **Case studies:** edit `projects` or `archivedCaseStudies`. Each project has a bottleneck, trade-off, and a proof object with a source link. Use a reproducible result or artifact; leave `proof` as `null` if there is no verified result. The Scholog performance comparison links to its documentation; the ATM example acknowledges the original bug.
- **Walkthrough:** set a project's `video` to `{ type: 'loom', src: 'https://www.loom.com/share/VIDEO_ID' }` or `{ type: 'mp4', src: 'videos/walkthrough.mp4' }`. Loom share URLs are converted to embeds; an MP4 can be a relative file or HTTPS URL. Add your own recording and make sure you have permission to show any people or data. With `video: null` the card clearly says the walkthrough has not been published.
- **System flow:** edit `flow.lanes` and `flow.note`. The reusable `ArchitectureSlot` renders a simple, accessible diagram without a Mermaid runtime. Set `flow` to `null` until an accurate diagram is ready.
- **Archive:** add or change smaller projects in `archiveProjects`; source files and existing case-study pages stay accessible.

`NowCard`, `SkillsTiers`, and `ProjectCaseStudy` live in `src/components/` and can also be adapted to a client-rendered React/Tailwind app. `tailwind.config.cjs` uses a `tw-` prefix and disables Tailwind's preflight reset so the older pages and print layout are not disturbed.

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| Projects and archive | `PROJECTS.html` |
| Experience & education | `EXPERIENCE.html` |
| Certificates | `CERTIFICATE.html` |
| Tech stack | `TECHSTACK.html` |
| Recommendations | `RECOMMENDATION.html` |
| Contact | `CONTACT.html` |
| Résumé | `MOREINFO.html` (+ downloadable `resume.pdf`) |
| Case studies | `PROJECT-SCHOLOG.html`, `PROJECT-ATM.html`, `PROJECT-GRADES.html` |
| 404 | `404.html` |

The C++ console projects are in the repository root as `.txt` files. Scholog is a separate [live app](https://scholog.vercel.app) and [repository](https://github.com/101dave/Scholog).

The site retains a light/dark theme, responsive navigation, a contact form that opens an email app, skip links, keyboard support, reduced-motion support, SEO metadata, and printable résumé styles.

## Résumé PDF

`MOREINFO.html` renders the résumé as a print-first page. To regenerate the downloadable PDF after editing its source:

```bash
pip install fpdf2
python3 scripts/build-resume-pdf.py
```

The script embeds DejaVu fonts when available. Set `RESUME_FONT_DIR` to a directory containing those TTF files if needed. The browser's “print / save as PDF” action uses the page's A4 print rules.
