"""Smoke tests for the restored static portfolio and portrait metadata."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import struct
import unittest

ROOT = Path(__file__).resolve().parent.parent
PAGES = (
    'index.html', 'PROJECTS.html', 'TECHSTACK.html', 'PROJECT-SCHOLOG.html',
    'PROJECT-ATM.html', 'PROJECT-GRADES.html', 'EXPERIENCE.html', 'CERTIFICATE.html',
    'RECOMMENDATION.html', 'CONTACT.html', 'MOREINFO.html', '404.html', 'PROJECT-EXPENSE.html',
)
SHARE_IMAGE = 'https://101dave.github.io/EbaleAllanDave/images/portrait-share.jpg'
TERMINAL_PREVIEWS = {
    'atm-simulator-preview.png': 'ATMSIMMULATOR.txt',
    'grade-management-preview.png': 'STUDENTGRADEMANAGEMENTSYSTEM.txt',
    'cashier-simulator-preview.png': 'CASHIERSIMULATOR.txt',
    'honor-calculator-preview.png': 'STUDENTHONORSTATUSCALCULATOR.txt',
    'shape-calculator-preview.png': 'SHAPECALCULATOR.txt',
    'temperature-converter-preview.png': 'FAHRENHEITANDCELSIUSCONVERTER.txt',
    'binary-converter-preview.png': 'BINARYConverter.txt',
    'calculator-preview.png': 'CALCULATOR.txt',
}


def png_info(path):
    """Read dimensions and uncompressed text metadata without Pillow."""
    data = path.read_bytes()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError(f'{path} is not a PNG')
    dimensions = struct.unpack('>II', data[16:24])
    metadata = {}
    offset = 8
    while offset < len(data):
        length = struct.unpack('>I', data[offset:offset + 4])[0]
        kind = data[offset + 4:offset + 8]
        chunk = data[offset + 8:offset + 8 + length]
        if kind == b'tEXt':
            key, value = chunk.split(b'\x00', 1)
            metadata[key.decode('latin-1')] = value.decode('latin-1')
        offset += length + 12
        if kind == b'IEND':
            break
    return dimensions, metadata


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


class PreviewLinks(HTMLParser):
    """Keep each progressively enhanced image link paired with its image."""

    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.previews = []
        self.current = None
        self.nested_anchor = False
        self.feed(path.read_text(encoding='utf-8'))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a':
            if self.current is not None:
                self.nested_anchor = True
            if 'data-preview' in attrs:
                self.current = {'link': attrs, 'images': []}
                self.previews.append(self.current)
        elif tag == 'img' and self.current is not None:
            self.current['images'].append(attrs)

    def handle_endtag(self, tag):
        if tag == 'a':
            self.current = None


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

    def test_project_preview_links_use_correct_assets(self):
        web = {'images/scholog-cover.png', 'images/expense-tracker-cover.png'}
        terminal = {f'images/{name}' for name in TERMINAL_PREVIEWS}
        expected_by_page = {
            'PROJECTS.html': web | terminal,
            'index.html': web | {'images/atm-simulator-preview.png', 'images/grade-management-preview.png'},
            'PROJECT-SCHOLOG.html': {'images/scholog-cover.png'},
            'PROJECT-EXPENSE.html': {'images/expense-tracker-cover.png'},
            'PROJECT-ATM.html': {'images/atm-simulator-preview.png'},
            'PROJECT-GRADES.html': {'images/grade-management-preview.png'},
        }
        for name, expected in expected_by_page.items():
            with self.subTest(page=name):
                links = PreviewLinks(ROOT / name)
                self.assertFalse(links.nested_anchor, f'nested preview anchor in {name}')
                self.assertCountEqual([item['link']['href'] for item in links.previews], expected)
                for item in links.previews:
                    link = item['link']
                    self.assertEqual(len(item['images']), 1)
                    image = item['images'][0]
                    self.assertEqual(link['href'], image['src'])  # Works without JavaScript.
                    self.assertTrue(link.get('data-preview-title'))
                    self.assertTrue(link.get('data-preview-caption'))
                    self.assertTrue(link.get('aria-label'))
                    self.assertTrue(image.get('alt'))
                    self.assertEqual(
                        (int(image['width']), int(image['height'])),
                        png_info(ROOT / image['src'])[0],
                    )

    def test_project_thumbnails_fit_the_full_image(self):
        css = (ROOT / 'styles.css').read_text(encoding='utf-8')
        image_rule = re.search(r'\.thumb img\s*\{([^}]*)\}', css)
        self.assertIsNotNone(image_rule)
        self.assertIn('object-fit: contain;', image_rule.group(1))
        self.assertNotIn('.project-item:hover .thumb img', css)

    def test_terminal_previews_record_source_and_disclose_demo_fix(self):
        for filename, source in TERMINAL_PREVIEWS.items():
            with self.subTest(filename=filename):
                dimensions, metadata = png_info(ROOT / 'images' / filename)
                self.assertEqual(dimensions, (1200, 750))
                self.assertEqual(metadata['Source'], source)
                self.assertIn('compiled C++ project', metadata['Description'])
                self.assertTrue(metadata['Sample input'])
        self.assertIn('temporary input-order correction', png_info(ROOT / 'images/grade-management-preview.png')[1]['Note'])
        for page in ('index.html', 'PROJECTS.html', 'PROJECT-GRADES.html'):
            with self.subTest(page=page):
                grade = next(item for item in PreviewLinks(ROOT / page).previews
                             if item['link']['href'] == 'images/grade-management-preview.png')
                self.assertIn('temporary demo build', grade['link']['data-preview-caption'])
                self.assertIn('input-order', (ROOT / page).read_text(encoding='utf-8'))
        self.assertIn('href="images/atm-demo.gif"', (ROOT / 'PROJECT-ATM.html').read_text(encoding='utf-8'))

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
