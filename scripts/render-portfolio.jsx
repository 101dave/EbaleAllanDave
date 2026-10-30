import fs from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import prettier from 'prettier';
import { SiteSidebar, SiteFooter } from '../src/components/SiteSidebar.jsx';
import { HomePage, ProjectsPage, StackPage, CasePage } from '../src/components/Pages.jsx';

// The checked-in HTML is the deployment artifact for GitHub Pages. The marked
// regions are generated from these React components; everything else in the
// older pages (including forms, print styles, and metadata) remains untouched.
const pages = [
  { file: 'index.html', active: 'home', content: <HomePage /> },
  { file: 'PROJECTS.html', active: 'projects', content: <ProjectsPage /> },
  { file: 'TECHSTACK.html', active: 'stack', content: <StackPage /> },
  { file: 'PROJECT-SCHOLOG.html', active: 'projects', content: <CasePage projectId="scholog" /> },
  { file: 'PROJECT-ATM.html', active: 'projects', content: <CasePage projectId="atm-simulator" /> },
  { file: 'PROJECT-GRADES.html', active: 'projects', content: <CasePage projectId="grade-management" /> },
  { file: 'EXPERIENCE.html', active: 'experience' },
  { file: 'CERTIFICATE.html', active: 'certificates' },
  { file: 'RECOMMENDATION.html', active: 'recommendations' },
  { file: 'CONTACT.html', active: 'contact' },
  { file: 'MOREINFO.html', active: 'resume' },
  { file: '404.html', active: null }
];

async function markup(element) {
  const html = renderToStaticMarkup(element);
  const formatted = await prettier.format(html, { parser: 'html', printWidth: 110 });
  return formatted.trimEnd().split('\n').map(line => `  ${line}`).join('\n');
}

function replaceRegion(html, name, content, file) {
  const start = `<!-- BEGIN ${name} -->`;
  const end = `<!-- END ${name} -->`;
  const first = html.indexOf(start);
  const last = html.indexOf(end);
  if (first === -1 || last === -1 || first >= last || html.indexOf(start, first + start.length) !== -1) {
    throw new Error(`${file}: expected one ordered ${name} marker pair`);
  }
  return `${html.slice(0, first + start.length)}\n${content}\n  ${html.slice(last)}`;
}

const checkOnly = process.argv.includes('--check');
let stale = false;
for (const page of pages) {
  const filename = path.resolve(page.file);
  const before = await fs.readFile(filename, 'utf8');
  let after = replaceRegion(before, 'SHARED_SIDEBAR', await markup(<SiteSidebar active={page.active} />), page.file);
  after = replaceRegion(after, 'SHARED_FOOTER', await markup(<SiteFooter />), page.file);
  if (page.content) after = replaceRegion(after, 'PORTFOLIO_CONTENT', await markup(page.content), page.file);
  if (before !== after) {
    if (checkOnly) {
      stale = true;
      console.error(`${page.file} is out of date`);
    } else {
      await fs.writeFile(filename, after);
      console.log(`rendered ${page.file}`);
    }
  }
}
if (stale) process.exitCode = 1;
