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
import { ProjectCaseStudy, VideoSlot, loomEmbedUrl, mp4Url } from '../src/components/ProjectCaseStudy.jsx';
import { now, skillTiers, projects, archivedCaseStudies } from '../src/portfolio-data.js';

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
