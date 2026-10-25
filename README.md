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
| Résumé | `MOREINFO.html` |
| 404 | `404.html` |

## Features

- Light/dark theme with system preference detection and `localStorage` persistence (no flash on load)
- Responsive sidebar navigation with mobile hamburger menu
- Contact form that composes a pre-filled email (no backend needed)
- Printable résumé page (`Ctrl/Cmd + P` friendly)
- SEO meta tags, Open Graph/Twitter cards, `robots.txt`, and `sitemap.xml`
- Accessibility: skip link, `aria-expanded`/`aria-pressed` states, keyboard (Esc) support, reduced-motion support
- SVG project covers in `images/` (crisp at any size, tiny file size)

## Project source code

The C++ console projects showcased on the site live in the repository root as `.txt` files
(e.g. `ATMSIMMULATOR.txt`, `BINARYConverter.txt`) and are linked from the project cards.
Web apps live in their own repositories — **Scholog** ([scholog.vercel.app](https://scholog.vercel.app),
[github.com/101dave/Scholog](https://github.com/101dave/Scholog)) is linked to its live deployment.

## Running locally

Any static file server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```
