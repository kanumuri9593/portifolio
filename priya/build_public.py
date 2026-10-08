#!/usr/bin/env python3
"""Build a static, read-only publication from the adjacent local portfolio."""
import argparse
import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ORIGIN = 'https://priya.oneenergytogether.com'
ARCHIVE = 'https://github.com/kanumuri9593/portifolio/tree/main/priya'
PUBLIC_FIELDS = {'id', 'title', 'category', 'group', 'caption', 'url', 'alt', 'tag', 'source', 'position', 'createdAt'}
TEXT_EXTENSIONS = {'.html', '.css', '.js', '.json'}
ALLOWED_EXTENSIONS = TEXT_EXTENSIONS | {'.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.webm', '.mp3', '.ogg', '.pdf'}


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if value and key in {'src', 'href', 'poster'}:
                self.urls.append(value)
            elif value and key == 'srcset':
                self.urls.extend(part.strip().split()[0] for part in value.split(',') if part.strip())


def references(text, suffix):
    urls = []
    if suffix == '.html':
        parser = References()
        parser.feed(text)
        urls.extend(parser.urls)
    # Authored image paths in JavaScript, CSS, HTML and gallery metadata.
    urls.extend(re.findall(r'''(?:\./|/)?assets/[^\s"'`<>\\)\]}]+''', text))
    urls.extend(re.findall(r'''url\(\s*["']?([^\s"')]+)''', text))
    urls.extend(re.findall(r'''(?:import\s+(?:[^;]*?\s+from\s+)?|import\s*\(|fetch\s*\()["']([^"']+)["']''', text))
    return urls


def build(source, output):
    source, output = source.resolve(), output.resolve()
    if output == source or output in source.parents or output.is_relative_to(source):
        raise ValueError('Choose a publication directory outside the source directory.')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Output must be empty. Use a fresh directory to avoid stale or private files.')
    seed = json.loads((source / 'gallery-seed.json').read_text())
    metadata = source / 'data' / 'gallery.json'
    uploaded = json.loads(metadata.read_text()) if metadata.exists() else []
    if not isinstance(uploaded, list) or not isinstance(seed.get('items'), list):
        raise ValueError('Gallery metadata must contain valid item arrays.')
    merged, seen = [], set()
    for record in uploaded + seed['items']:
        if not isinstance(record, dict):
            raise ValueError('Gallery items must be objects.')
        key = record.get('id') or record.get('url')
        if not key:
            raise ValueError('Each gallery item needs an id or image URL.')
        if key in seen:
            continue
        seen.add(key)
        item = {key: value for key, value in record.items() if key in PUBLIC_FIELDS}
        if item.get('group') not in {'people', 'places', 'details'}:
            item['group'] = ''
        merged.append(item)
    gallery = json.dumps({'items': merged}, ensure_ascii=False, indent=2) + '\n'
    index = (source / 'index.html').read_text()
    index = re.sub(r'''<a\b[^>]*href=["'](?:\./|/)?studio\.html["'][^>]*>.*?</a>''',
                   f'<a href="{ARCHIVE}" target="_blank" rel="noopener">Site source</a>', index, flags=re.S | re.I)
    index = re.sub(r'''<link\b[^>]*rel=["']canonical["'][^>]*>''', '', index, flags=re.I)
    index = re.sub(r'''<meta\b[^>]*(?:property|name)=["']og:url["'][^>]*>''', '', index, flags=re.I)
    index = index.replace('</head>', f'<link rel="canonical" href="{ORIGIN}/"><meta property="og:url" content="{ORIGIN}/"></head>')
    virtual = {'index.html': index, 'gallery-seed.json': gallery}
    pending = ['index.html', 'gallery-seed.json']
    staged = {}
    while pending:
        relative = pending.pop()
        if relative in staged:
            continue
        candidate = (source / relative).resolve()
        if not candidate.is_relative_to(source) or not candidate.is_file():
            raise ValueError(f'Missing or unsafe public dependency: {relative}')
        if relative.startswith(('data/', 'studio.')) or candidate.suffix.lower() not in ALLOWED_EXTENSIONS:
            raise ValueError(f'Private or unsupported dependency: {relative}')
        payload = virtual.get(relative)
        if candidate.suffix.lower() in TEXT_EXTENSIONS:
            if payload is None:
                payload = candidate.read_text()
            if candidate.suffix == '.js':
                payload = re.sub(r'''fetch\((["'])/api/gallery\1\)''', "fetch('/api/gallery.json')", payload)
            staged[relative] = payload.encode('utf-8')
            for url in references(payload, candidate.suffix.lower()):
                parsed = urlsplit(html.unescape(url))
                if parsed.scheme or parsed.netloc or not parsed.path or parsed.path == '/':
                    continue
                if parsed.path == '/api/gallery.json':
                    continue
                raw = unquote(parsed.path)
                if raw.startswith('#'):
                    continue
                # assets literals are source-root relative throughout this portfolio.
                path = source / raw.lstrip('/') if raw.startswith('/') or raw.startswith('assets/') else candidate.parent / raw
                resolved = path.resolve()
                if not resolved.is_relative_to(source):
                    raise ValueError(f'Unsafe dependency in {relative}: {url}')
                dependency = resolved.relative_to(source).as_posix()
                if dependency not in staged:
                    pending.append(dependency)
        else:
            staged[relative] = candidate.read_bytes()
    output.mkdir(parents=True, exist_ok=True)
    for relative, payload in staged.items():
        target = output / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
    (output / 'api').mkdir(exist_ok=True)
    (output / 'api' / 'gallery.json').write_text('{"items":[]}\n')
    (output / '_headers').write_text('/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n')
    (output / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {ORIGIN}/sitemap.xml\n')
    (output / 'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{ORIGIN}/</loc></url></urlset>\n')
    print(f'Built {len(staged) + 4} public files, {len(merged)} gallery items in {output}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True, help='Fresh or empty publication directory, outside the source folder')
    args = parser.parse_args()
    try:
        build(Path(__file__).resolve().parent, args.out.resolve())
    except (ValueError, OSError, json.JSONDecodeError) as error:
        parser.exit(1, f'Build failed: {error}\n')
