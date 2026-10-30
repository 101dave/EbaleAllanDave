"""Smoke tests for the restored static portfolio and portrait metadata."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import struct
import unittest

ROOT = Path(__file__).resolve().parent.parent
PAGES = (
    'index.html', 'PROJECTS.html', 'TECHSTACK.html', 'PROJECT-SCHOLOG.html',
    'PROJECT-ATM.html', 'PROJECT-GRADES.html', 'EXPERIENCE.html', 'CERTIFICATE.html',
    'RECOMMENDATION.html', 'CONTACT.html', 'MOREINFO.html', '404.html', 'PROJECT-EXPENSE.html',
)
SHARE_IMAGE = 'https://101dave.github.io/EbaleAllanDave/images/portrait-share.jpg'


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.ids = []
        self.feed(path.read_text(encoding='utf-8'))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if 'id' in attrs:
            self.ids.append(attrs['id'])

    def elements_matching(self, tag, **attrs):
        return [a for t, a in self.elements if t == tag and all(a.get(k) == v for k, v in attrs.items())]


class StaticSiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages = {name: Page(ROOT / name) for name in PAGES}

    def test_classic_home_and_project_links(self):
        home = (ROOT / 'index.html').read_text(encoding='utf-8')
        self.assertIn('<h1>Allan Dave Ebale</h1>', home)
        self.assertIn('class="hero-grid"', home)
        self.assertIn('src="images/me.webp"', home)
        self.assertIn('id="projectDeck"', home)
        for target in ('PROJECT-SCHOLOG.html', 'PROJECT-ATM.html', 'PROJECT-GRADES.html', 'PROJECT-EXPENSE.html'):
            self.assertIn(f'href="{target}"', home)

    def test_scholog_is_the_only_featured_project(self):
        projects = (ROOT / 'PROJECTS.html').read_text(encoding='utf-8')
        self.assertEqual(projects.count('class="showcase-card featured-project"'), 1)
        self.assertEqual(projects.count('class="project-item"'), 9)
        featured, other_projects = projects.split('<h2 class="other-projects-title">', 1)
        for target in ('https://scholog.vercel.app', 'https://github.com/101dave/Scholog', 'PROJECT-SCHOLOG.html'):
            self.assertIn(f'href="{target}"', featured)
        for target in ('ATMSIMMULATOR.txt', 'STUDENTGRADEMANAGEMENTSYSTEM.txt', 'CALCULATOR.txt'):
            self.assertIn(f'href="{target}"', other_projects)

    def test_portrait_is_used_for_icons_and_shared_links(self):
        for name, page in self.pages.items():
            with self.subTest(page=name):
                icons = {a.get('sizes'): a.get('href') for a in page.elements_matching('link', rel='icon')}
                self.assertEqual(icons, {'48x48': 'images/portrait-icon-48.png', '192x192': 'images/portrait-icon-192.png'})
                self.assertEqual(page.elements_matching('link', rel='apple-touch-icon')[0]['href'], 'images/portrait-touch-180.png')
                self.assertEqual([a['content'] for a in page.elements_matching('meta', property='og:image')], [SHARE_IMAGE])
                self.assertEqual([a['content'] for a in page.elements_matching('meta', name='twitter:image')], [SHARE_IMAGE])
                self.assertEqual(page.elements_matching('meta', property='og:image:alt')[0]['content'], 'Portrait of Allan Dave Ebale')
                self.assertEqual(page.elements_matching('meta', property='og:image:width')[0]['content'], '1200')
                self.assertEqual(page.elements_matching('meta', property='og:image:height')[0]['content'], '630')

    def test_icon_files_are_square_pngs(self):
        for filename, size in (('portrait-icon-48.png', 48), ('portrait-icon-192.png', 192), ('portrait-touch-180.png', 180)):
            with self.subTest(filename=filename):
                image = (ROOT / 'images' / filename).read_bytes()
                self.assertEqual(image[:8], b'\x89PNG\r\n\x1a\n')
                self.assertEqual(struct.unpack('>II', image[16:24]), (size, size))
        self.assertTrue((ROOT / 'images' / 'portrait-share.jpg').read_bytes().startswith(b'\xff\xd8'))

    def test_relative_links_and_fragments_exist(self):
        for filename, page in self.pages.items():
            self.assertEqual(len(page.ids), len(set(page.ids)), f'duplicate IDs in {filename}')
            for tag, attrs in page.elements:
                for attribute in ('href', 'src'):
                    value = attrs.get(attribute)
                    if not value:
                        continue
                    target = urlsplit(value)
                    if target.scheme or target.netloc:
                        continue
                    path = unquote(target.path)
                    local = (ROOT / filename).parent / path if path else ROOT / filename
                    if local.is_dir():
                        local /= 'index.html'
                    with self.subTest(page=filename, target=value):
                        self.assertTrue(local.is_file(), f'{filename}: missing {value}')
                        if target.fragment and local.suffix.lower() == '.html':
                            self.assertIn(unquote(target.fragment), Page(local).ids)

    def test_finora_is_a_separate_repository(self):
        live = 'https://101dave.github.io/Finora/'
        source = 'https://github.com/101dave/Finora'
        for filename in ('index.html', 'PROJECTS.html', 'PROJECT-EXPENSE.html'):
            text = (ROOT / filename).read_text(encoding='utf-8')
            with self.subTest(page=filename):
                self.assertIn('Finora', text)
                self.assertIn(live, text)
                self.assertIn(source, text)
                self.assertNotIn('Ledger', text)
                self.assertNotIn('?demo=1', text)
                self.assertNotIn('href="expense-tracker/', text)
                self.assertNotIn('EbaleAllanDave/expense-tracker', text)
        self.assertNotIn('Ledger', (ROOT / 'README.md').read_text(encoding='utf-8'))
        self.assertFalse((ROOT / 'expense-tracker').exists())

    def test_resume_retains_corrected_project_claims(self):
        resume = (ROOT / 'MOREINFO.html').read_text(encoding='utf-8')
        self.assertIn('known withdrawal bug', resume)
        self.assertIn('uninitialized vector-size bug', resume)
        self.assertNotIn('without crashing on bad input', resume)
        self.assertTrue((ROOT / 'resume.pdf').read_bytes().startswith(b'%PDF-'))


if __name__ == '__main__':
    unittest.main()
