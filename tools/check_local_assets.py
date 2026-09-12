#!/usr/bin/env python3
"""Verify that the site's configured images and HTML/CSS resources are local.

Run with Python 3.10+: python tools/check_local_assets.py
Outbound navigation links and optional SoundCloud player frames are allowed.
This checks static references; it does not execute JavaScript or make requests.
"""
from __future__ import annotations

import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
CONFIGS = {
    'site-config.js': 'window.JIAJIE_SITE = ',
    'bodypositive-data.js': 'window.JIAJIE_BODY_PHOTOS = ',
}
IMAGE_KEYS = {'photo', 'thumbnail', 'artwork', 'src'}
RESOURCE_LINKS = {'stylesheet', 'icon', 'apple-touch-icon', 'preload', 'modulepreload'}
CSS_URL = re.compile(r'url\(\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s)]+))\s*\)', re.I)
CSS_IMPORT = re.compile(r'@import\s+["\']([^"\']+)["\']', re.I)


class Audit:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.assets: set[Path] = set()

    def check(self, value: str, source: Path, label: str, *, frame: bool = False) -> None:
        value = value.strip()
        if not value or value.startswith('#'):
            return
        try:
            url = urlsplit(value)
        except ValueError:
            self.errors.append(f'{label}: invalid resource URL {value!r}')
            return
        if frame and url.scheme == 'https' and url.hostname == 'w.soundcloud.com':
            return
        if url.scheme == 'data':
            return  # Embedded data has no network or filesystem dependency.
        if url.scheme or url.netloc:
            self.errors.append(f'{label}: resource is not local: {value}')
            return
        base = ROOT if url.path.startswith('/') else source.parent
        path = (base / unquote(url.path).lstrip('/')).resolve()
        if not path.is_relative_to(ROOT):
            self.errors.append(f'{label}: resource is outside the site: {value}')
        elif not path.is_file():
            self.errors.append(f'{label}: missing local resource: {value}')
        else:
            self.assets.add(path)

    def css(self, text: str, source: Path, label: str) -> None:
        text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
        for match in CSS_URL.finditer(text):
            self.check(next(group for group in match.groups() if group is not None), source, label)
        for match in CSS_IMPORT.finditer(text):
            self.check(match.group(1), source, label)

    def config(self, value: object, source: Path, label: str) -> None:
        if isinstance(value, dict):
            for key, child in value.items():
                if key in IMAGE_KEYS and isinstance(child, str):
                    self.check(child, source, f'{label}.{key}')
                else:
                    self.config(child, source, f'{label}.{key}')
        elif isinstance(value, list):
            for index, child in enumerate(value):
                self.config(child, source, f'{label}[{index}]')


def srcset_urls(value: str):
    """Read ordinary srcset candidates, including embedded data URL commas."""
    while value:
        value = value.lstrip(' \t\r\n,')
        if not value:
            return
        parts = value.split(None, 1)
        candidate = parts[0]
        value = parts[1] if len(parts) == 2 else ''
        yield candidate.rstrip(',')
        if not candidate.endswith(','):
            _, separator, value = value.partition(',')
            if not separator:
                return


class ResourceParser(HTMLParser):
    def __init__(self, audit: Audit, source: Path) -> None:
        super().__init__(convert_charrefs=True)
        self.audit = audit
        self.source = source
        self.in_style = False

    def handle_starttag(self, tag: str, attributes: list[tuple[str, str | None]]) -> None:
        attrs = dict(attributes)
        label = f'{self.source.relative_to(ROOT)}:{self.getpos()[0]}'
        resource_attributes = []
        if tag in {'img', 'script', 'source', 'audio', 'video', 'embed', 'iframe'}:
            resource_attributes.append('src')
        if tag == 'input' and attrs.get('type', '').lower() == 'image':
            resource_attributes.append('src')
        if tag == 'video':
            resource_attributes.append('poster')
        if tag == 'object':
            resource_attributes.append('data')
        if tag == 'link' and RESOURCE_LINKS.intersection((attrs.get('rel') or '').lower().split()):
            resource_attributes.append('href')
        if tag == 'meta' and (attrs.get('property') or attrs.get('name')) in {'og:image', 'og:image:url', 'twitter:image'}:
            resource_attributes.append('content')
        for attribute in resource_attributes:
            value = attrs.get(attribute)
            if value:
                self.audit.check(value, self.source, label, frame=tag == 'iframe')
        if tag in {'img', 'source', 'link'}:
            for value in srcset_urls(attrs.get('srcset') or attrs.get('imagesrcset') or ''):
                self.audit.check(value, self.source, label)
        if attrs.get('style'):
            self.audit.css(attrs['style'], self.source, label)
        if tag == 'style':
            self.in_style = True

    def handle_endtag(self, tag: str) -> None:
        if tag == 'style':
            self.in_style = False

    def handle_data(self, data: str) -> None:
        if self.in_style:
            self.audit.css(data, self.source, str(self.source.relative_to(ROOT)))


def main() -> int:
    audit = Audit()
    for name, marker in CONFIGS.items():
        try:
            source = ROOT / name
            raw = source.read_text(encoding='utf-8').split(marker, 1)[1]
            audit.config(json.loads(raw.strip().removesuffix(';')), source, name)
        except (OSError, IndexError, json.JSONDecodeError) as error:
            audit.errors.append(f'{name}: unable to read configuration: {error}')
    for source in sorted(ROOT.rglob('*')):
        if source.suffix.lower() not in {'.html', '.css'}:
            continue
        if {'tools', '.git', 'node_modules'}.intersection(source.relative_to(ROOT).parts):
            continue
        try:
            text = source.read_text(encoding='utf-8')
            if source.suffix.lower() == '.html':
                ResourceParser(audit, source).feed(text)
            else:
                audit.css(text, source, str(source.relative_to(ROOT)))
        except OSError as error:
            audit.errors.append(f'{source.relative_to(ROOT)}: unable to read file: {error}')
    if audit.errors:
        for error in audit.errors:
            print(f'ERROR: {error}')
        print(f'Local asset check failed: {len(audit.errors)} problem(s).')
        return 1
    print(f'Local asset check passed: {len(audit.assets)} referenced local files exist.')
    print('Outbound links and optional SoundCloud player frames are allowed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
