# Allan Dave Ebale — Portfolio

My personal portfolio site, built with **plain HTML, CSS, and JavaScript** — no frameworks, no build step.

**Live site:** https://101dave.github.io/EbaleAllanDave/

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| Projects | `PROJECTS.html` |
| Experience & Education | `EXPERIENCE.html` |
| Certificates | `CERTIFICATE.html` |
| Tech Stack | `TECHSTACK.html` |
| Recommendations | `RECOMMENDATION.html` |
| Contact | `CONTACT.html` |
| Résumé | `MOREINFO.html` (+ downloadable `resume.pdf`) |
| Case studies | `PROJECT-SCHOLOG.html`, `PROJECT-ATM.html`, `PROJECT-GRADES.html`, `PROJECT-EXPENSE.html` |
| 404 | `404.html` |

## Features

- Light/dark theme with system preference detection and `localStorage` persistence (no flash on load)
- Responsive sidebar navigation with mobile hamburger menu
- Contact form that composes a pre-filled email (no backend needed)
- Printable résumé page (`Ctrl/Cmd + P` friendly)
- SEO meta tags, Open Graph/Twitter cards, `robots.txt`, and `sitemap.xml`
- Accessibility: skip link, `aria-expanded`/`aria-pressed` states, keyboard (Esc) support, reduced-motion support
- SVG project covers in `images/` (crisp at any size, tiny file size)
- Design language inspired by [bryl-minimal](https://github.com/bryllim/bryl-minimal-design) (bryllim.com): monochrome ramp, mono micro-labels, numbered sections, halftone accent, soft shadows

## Project source code

The C++ console projects showcased on the site live in the repository root as `.txt` files
(e.g. `ATMSIMMULATOR.txt`, `BINARYConverter.txt`) and are linked from the project cards.
Web apps are linked to their live deployments. **Scholog** ([scholog.vercel.app](https://scholog.vercel.app),
[github.com/101dave/Scholog](https://github.com/101dave/Scholog)) lives in its own repository.
**Ledger**, the expense tracker, lives in its own [Finora repository](https://github.com/101dave/Finora),
deployed at [101dave.github.io/Finora](https://101dave.github.io/Finora/). This repository keeps its
[case study](PROJECT-EXPENSE.html) and cover image.

## Running locally

Any static file server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Portrait and link preview

The browser icons and social-sharing image are generated from `Me.jpg`. To replace the photo, update that file and run `sh scripts/build-portrait.sh` (requires ImageMagick). Commit the regenerated `images/portrait-*` files with the photo. Browsers and social apps may cache the previous image after deployment.

## Checks

```bash
python3 -m unittest discover -s tests -v
```

The app has its own unit tests inside the [Finora repository](https://github.com/101dave/Finora);
run `node --test` there.

## résumé

`MOREINFO.html` renders the résumé in a single-column, print-first layout (centered header, uppercase section rules, org/place and role/date rows). The same content ships as `resume.pdf`.

Regenerate the PDF after editing the résumé:

```bash
pip install fpdf2
python3 scripts/build-resume-pdf.py   # writes resume.pdf
```

The script embeds DejaVu (regular/bold/oblique + serif bold) when it can find the TTFs, so en dashes and bullets survive. Point `RESUME_FONT_DIR` at a folder of DejaVu fonts if they live outside the usual Linux paths. Printing from the browser (`print / save as pdf`) uses the page's A4 `@media print` rules and matches the generated file.
