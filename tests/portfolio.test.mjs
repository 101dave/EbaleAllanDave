import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { NowCard } from '../src/components/NowCard.jsx';
import { SkillsTiers } from '../src/components/SkillsTiers.jsx';
import { ProjectPreview, ProjectCaseStudy, VideoSlot, loomEmbedUrl, mp4Url } from '../src/components/ProjectCaseStudy.jsx';
import { HomePage, ProjectsPage, StackPage, CasePage } from '../src/components/Pages.jsx';
import { now, skillTiers, projects, archivedCaseStudies, archiveProjects } from '../src/portfolio-data.js';

const render = element => new JSDOM(renderToStaticMarkup(element)).window.document;
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const htmlPages = [
  'index.html', 'PROJECTS.html', 'TECHSTACK.html', 'PROJECT-SCHOLOG.html',
  'PROJECT-ATM.html', 'PROJECT-GRADES.html', 'EXPERIENCE.html', 'CERTIFICATE.html',
  'RECOMMENDATION.html', 'CONTACT.html', 'MOREINFO.html', '404.html'
];

test('NowCard renders all three fields and does not invent a reading title', () => {
  const doc = render(React.createElement(NowCard, { data: now }));
  const text = doc.body.textContent;
  assert.match(text, /BUILDING/);
  assert.match(text, /READING/);
  assert.match(text, /EXPLORING/);
  assert.match(text, /No title shared yet/);
  assert.match(text, /staging run pending/i);
  assert.equal(doc.querySelector('time').getAttribute('datetime'), now.asOf);
  assert.equal(doc.querySelectorAll('.now-item').length, 3);

  const supplied = render(React.createElement(NowCard, {
    data: { ...now, reading: { text: 'A real paper', href: 'https://example.com/paper' } }
  }));
  assert.equal(supplied.querySelector('.now-item:nth-child(2) a').textContent, 'A real paper');
});

test('skill tiers are grouped by actual use rather than icons', () => {
  const doc = render(React.createElement(SkillsTiers, { tiers: skillTiers }));
  assert.deepEqual([...doc.querySelectorAll('h3')].map(h => h.textContent), [
    'Daily Drivers', 'Production & Tools', 'Currently Exploring'
  ]);
  assert.ok(doc.querySelectorAll('.skill-list li').length >= 9);
  assert.match(doc.body.textContent, /Staging harness prepared/);
});

test('home skills are a concise summary; the stack page keeps the full list', () => {
  const compact = render(React.createElement(SkillsTiers, { tiers: skillTiers, compact: true }));
  assert.equal(compact.querySelectorAll('.skill-list li').length, 9);
  assert.equal(compact.querySelectorAll('.skill-description, .skill-list small').length, 0);
  assert.equal(compact.querySelector('.skill-source').getAttribute('href'), 'TECHSTACK.html');
  assert.match(compact.body.textContent, /\+2 more tools/);
  const full = render(React.createElement(SkillsTiers, { tiers: skillTiers, heading: 'h2' }));
  assert.equal(full.querySelectorAll('.skill-list li').length, 11);
  assert.equal(full.querySelectorAll('.skill-card h2').length, 3);
  assert.match(full.body.textContent, /Automated tests/);
});

test('project previews link to the full case study without repeating it', () => {
  for (const project of projects) {
    const doc = render(React.createElement(ProjectPreview, { project }));
    assert.equal(doc.querySelector('.case-more-link').getAttribute('href'), project.caseStudy);
    assert.equal(doc.querySelector('.case-more-link').getAttribute('aria-label'), `View case study: ${project.name}`);
    assert.ok(doc.body.textContent.includes(project.focus));
    assert.ok(doc.body.textContent.includes(project.proof.value));
    assert.equal(doc.querySelector('.preview-evidence a').href, project.proof.href);
    assert.equal(doc.querySelector('.case-breakdown, .case-details'), null);
  }
  const noProof = render(React.createElement(ProjectPreview, { project: { ...projects[0], proof: null } }));
  assert.ok(noProof.querySelector('.preview-evidence-single'));
  assert.equal(noProof.querySelectorAll('.preview-evidence > div').length, 1);
});

test('page hierarchy avoids repeating full case studies and contact banners', () => {
  const home = render(React.createElement(HomePage));
  const listing = render(React.createElement(ProjectsPage));
  const stack = render(React.createElement(StackPage));
  assert.equal(home.querySelectorAll('.project-preview').length, 2);
  assert.equal(listing.querySelectorAll('.project-preview').length, 2);
  assert.equal(home.querySelectorAll('.case-breakdown, .case-details').length, 0);
  assert.equal(listing.querySelectorAll('.case-breakdown, .case-details').length, 0);
  assert.equal(home.querySelectorAll('.contact-banner').length, 1);
  assert.equal(listing.querySelectorAll('.contact-banner').length, 0);
  assert.equal(stack.querySelectorAll('.contact-banner').length, 0);

  for (const project of [...projects, ...archivedCaseStudies]) {
    const doc = render(React.createElement(CasePage, { projectId: project.id }));
    assert.equal(doc.querySelectorAll('h1').length, 1);
    assert.equal(doc.querySelectorAll('.case-breakdown-item').length, 3);
    assert.equal(doc.querySelectorAll('.case-breakdown-item h2').length, 3);
    assert.equal(doc.querySelectorAll('.case-details').length, 1);
    assert.equal(doc.querySelectorAll('.contact-banner').length, 0);
    assert.equal(doc.body.textContent.split(project.description).length - 1, 1);
  }
});

test('archived case previews reuse their case-study data', () => {
  for (const project of archivedCaseStudies) {
    const preview = archiveProjects.find(item => item.caseStudy === project.caseStudy);
    assert.ok(preview, `archive preview missing for ${project.name}`);
    assert.equal(preview.name, project.name);
    assert.equal(preview.kind, project.category);
    assert.equal(preview.image, project.image);
    assert.equal(preview.source, project.localSource || project.source);
  }
});

test('walkthrough accepts Loom and MP4, with a truthful no-video state', () => {
  assert.equal(loomEmbedUrl('https://www.loom.com/share/abc123?sid=test'), 'https://www.loom.com/embed/abc123');
  assert.equal(loomEmbedUrl('https://evil.example/share/abc123'), null);
  assert.equal(loomEmbedUrl('javascript:alert(1)'), null);
  assert.equal(mp4Url('videos/demo.mp4'), 'videos/demo.mp4');
  assert.equal(mp4Url('https://example.com/demo.mp4'), 'https://example.com/demo.mp4');
  for (const invalid of ['//example.com/demo.mp4', ' javascript:alert(1)', 'data:text/html,bad', '\\evil.example/x']) {
    assert.equal(mp4Url(invalid), null);
  }

  const blank = render(React.createElement(VideoSlot, { video: null, projectName: 'Example' }));
  assert.match(blank.body.textContent, /Walkthrough not published yet/);
  assert.equal(blank.querySelector('iframe, video'), null);
  const loom = render(React.createElement(VideoSlot, { video: { type: 'loom', src: 'https://loom.com/share/abc123' }, projectName: 'Example' }));
  assert.equal(loom.querySelector('iframe').getAttribute('src'), 'https://www.loom.com/embed/abc123');
  assert.equal(loom.querySelector('iframe').getAttribute('title'), 'Example video walkthrough');
  const mp4 = render(React.createElement(VideoSlot, { video: { type: 'mp4', src: 'videos/demo.mp4' }, projectName: 'Example' }));
  assert.equal(mp4.querySelector('video source').getAttribute('src'), 'videos/demo.mp4');
  assert.ok(mp4.querySelector('video').hasAttribute('controls'));
});

test('case studies include decisions, evidence, and an accessible system flow', () => {
  for (const project of [...projects, ...archivedCaseStudies]) {
    const doc = render(React.createElement(ProjectCaseStudy, { project, detail: true }));
    const text = doc.body.textContent;
    assert.match(text, /THE TECHNICAL BOTTLENECK/);
    assert.match(text, /THE TRADE-OFF/);
    assert.match(text, /THE PROOF/);
    assert.match(text, /60-SECOND WALKTHROUGH/);
    assert.equal(doc.querySelector('.flow-frame').getAttribute('aria-label'), project.flow.label);
    assert.equal(doc.querySelectorAll('.flow-lane').length, 2);
    assert.ok(doc.querySelector('details').hasAttribute('open'));
    assert.equal(doc.querySelector('.case-proof a').href, project.proof.href);
  }
  const unfinished = render(React.createElement(ProjectCaseStudy, { project: { ...projects[0], proof: null, flow: null } }));
  assert.match(unfinished.body.textContent, /No verified metric published yet/);
  assert.match(unfinished.body.textContent, /Architecture diagram not published yet/);
  assert.equal(unfinished.querySelectorAll('.case-overview h3').length, 1);
  assert.equal(unfinished.querySelectorAll('.case-breakdown-item h4').length, 3);
});

test('generated pages are current, have a single main heading, and use unique ids', () => {
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/render-portfolio.jsx', '--check'], { stdio: 'pipe' });
  for (const file of htmlPages) {
    const doc = new JSDOM(read(file)).window.document;
    assert.equal(doc.querySelectorAll('main').length, 1, `${file}: main`);
    assert.equal(doc.querySelectorAll('main h1').length, 1, `${file}: h1`);
    assert.ok(doc.querySelector('#sidebar nav[aria-label]'), `${file}: nav`);
    const ids = [...doc.querySelectorAll('[id]')].map(el => el.id);
    assert.equal(new Set(ids).size, ids.length, `${file}: duplicate IDs`);
  }
});

test('all pages use the portrait for their icon and share preview', () => {
  const shareUrl = 'https://101dave.github.io/EbaleAllanDave/images/portrait-share.jpg';
  for (const file of htmlPages) {
    const doc = new JSDOM(read(file)).window.document;
    assert.equal(doc.querySelector('link[rel="icon"][sizes="48x48"]').getAttribute('href'), 'images/portrait-icon-48.png', file);
    assert.equal(doc.querySelector('link[rel="icon"][sizes="192x192"]').getAttribute('href'), 'images/portrait-icon-192.png', file);
    assert.equal(doc.querySelector('link[rel="apple-touch-icon"]').getAttribute('href'), 'images/portrait-touch-180.png', file);
    assert.equal(doc.querySelectorAll('meta[property="og:image"]').length, 1, file);
    assert.equal(doc.querySelector('meta[property="og:image"]').content, shareUrl, file);
    assert.equal(doc.querySelector('meta[property="og:image:width"]').content, '1200', file);
    assert.equal(doc.querySelector('meta[property="og:image:height"]').content, '630', file);
    assert.equal(doc.querySelector('meta[property="og:image:alt"]').content, 'Portrait of Allan Dave Ebale', file);
    assert.equal(doc.querySelector('meta[name="twitter:image"]').content, shareUrl, file);
    assert.equal(doc.querySelector('.portfolio-brand img').getAttribute('src'), 'images/portrait-icon-192.png', file);
    assert.match(doc.querySelector('.portfolio-brand').textContent, /Allan Dave Ebale/, file);
    assert.equal(doc.querySelector('link[href="logo.jpg"]'), null, file);
  }

  for (const [file, size] of [['images/portrait-icon-48.png', 48], ['images/portrait-icon-192.png', 192], ['images/portrait-touch-180.png', 180]]) {
    const png = readFileSync(path.resolve(file));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], file);
    assert.equal(png.readUInt32BE(16), size, file);
    assert.equal(png.readUInt32BE(20), size, file);
  }
  const jpg = readFileSync(path.resolve('images/portrait-share.jpg'));
  assert.deepEqual([...jpg.subarray(0, 2)], [255, 216]);
  // The checked-in share image is a baseline or progressive JPEG with a SOF marker.
  let offset = 2, dimensions;
  while (offset < jpg.length) {
    assert.equal(jpg[offset++], 0xff, 'invalid JPEG marker');
    while (jpg[offset] === 0xff) offset++;
    const marker = jpg[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = jpg.readUInt16BE(offset);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      dimensions = [jpg.readUInt16BE(offset + 5), jpg.readUInt16BE(offset + 3)];
      break;
    }
    offset += length;
  }
  assert.deepEqual(dimensions, [1200, 630]);
});

test('the checked-in Tailwind CSS matches the component source', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'portfolio-css-'));
  try {
    const output = path.join(dir, 'portfolio.css');
    execFileSync(process.execPath, ['node_modules/tailwindcss/lib/cli.js', '-i', 'src/portfolio.css', '-o', output, '--minify'], { stdio: 'pipe' });
    assert.equal(readFileSync(output, 'utf8'), read('portfolio.css'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('local links and assets on all static pages resolve', () => {
  for (const file of htmlPages) {
    const doc = new JSDOM(read(file)).window.document;
    for (const el of doc.querySelectorAll('[href], [src]')) {
      const value = el.getAttribute('href') || el.getAttribute('src');
      if (!value || /^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(value)) continue;
      const [target, fragment] = value.split('#');
      const local = target.split('?')[0];
      if (local) assert.ok(existsSync(path.resolve(local)), `${file}: missing ${value}`);
      if (fragment && (!local || local === file)) assert.ok(doc.getElementById(fragment), `${file}: missing #${fragment}`);
    }
  }
});

test('theme toggles correctly from system dark and mobile navigation closes on Escape', () => {
  const dom = new JSDOM(read('index.html'), { url: 'https://portfolio.example/', runScripts: 'outside-only' });
  const { document, localStorage, KeyboardEvent } = dom.window;
  document.documentElement.classList.add('dark-mode-init');
  dom.window.eval(read('script.js'));
  const theme = document.getElementById('themeToggle');
  assert.equal(theme.getAttribute('aria-pressed'), 'true');
  theme.click();
  assert.equal(document.documentElement.classList.contains('dark-mode-init'), false);
  assert.equal(document.body.classList.contains('dark-mode'), false);
  assert.equal(localStorage.getItem('darkMode'), 'disabled');
  theme.click();
  assert.equal(document.body.classList.contains('dark-mode'), true);
  assert.equal(theme.getAttribute('aria-pressed'), 'true');

  const menu = document.getElementById('menuToggle');
  menu.click();
  assert.equal(menu.getAttribute('aria-expanded'), 'true');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(menu.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, menu);
  dom.window.close();
});
