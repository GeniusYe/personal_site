#!/usr/bin/env python3
"""Optional: copy the configured public images into this static site's assets/.

Run: python tools/localize_images.py
Requires Python 3.9+ and internet access. Uses only the standard library.
No configuration is changed unless every image has downloaded successfully.
This script never uploads or publishes anything.
"""
from __future__ import annotations

import html
import json
from pathlib import Path
import re
import sys
import tempfile
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
LIMIT = 20 * 1024 * 1024
PATTERN = re.compile(r'^\s*(photo|thumbnail|artwork):\s*("(?:[^"\\]|\\.)*")', re.M)


def extension(data: bytes, content_type: str) -> str:
    if data.startswith(b'\xff\xd8\xff'):
        return '.jpg'
    if data.startswith(b'\x89PNG\r\n\x1a\n'):
        return '.png'
    if data.startswith(b'RIFF') and data[8:12] == b'WEBP':
        return '.webp'
    if data.startswith((b'GIF87a', b'GIF89a')):
        return '.gif'
    if content_type in ('image/avif', 'image/heif'):
        return '.avif' if content_type == 'image/avif' else '.heif'
    raise ValueError('The server did not return a supported image.')


def main() -> int:
    config_path = ROOT / 'site-config.js'
    page_path = ROOT / 'index.html'
    config = config_path.read_text(encoding='utf-8')
    page = page_path.read_text(encoding='utf-8')
    candidates = []
    for match in PATTERN.finditer(config):
        source = json.loads(match.group(2))
        if urlparse(source).scheme in ('https', 'http'):
            candidates.append((match.group(1), source))
    if not candidates:
        print('No remote image values found. Images may already be local.')
        return 0
    replacements: dict[str, str] = {}
    counters: dict[str, int] = {}
    names = {'photo': 'portrait', 'thumbnail': 'website-thumbnail', 'artwork': 'song-artwork'}
    with tempfile.TemporaryDirectory(prefix='jiajie-images-') as tmp:
        staging = Path(tmp)
        for field, source in candidates:
            if source in replacements:
                continue
            counters[field] = counters.get(field, 0) + 1
            label = names[field]
            suffix = f'-{counters[field]}' if field == 'artwork' or counters[field] > 1 else ''
            print(f'Downloading {label}{suffix}…')
            request = Request(source, headers={'User-Agent': 'Mozilla/5.0 JiaJie-Site-Asset-Downloader/1.0'})
            with urlopen(request, timeout=30) as response:
                if not response.headers.get_content_type().startswith('image/'):
                    raise ValueError(f'{source} did not return an image.')
                data = response.read(LIMIT + 1)
                if len(data) > LIMIT:
                    raise ValueError(f'{source} exceeds the 20 MiB safety limit.')
                ext = extension(data, response.headers.get_content_type())
            filename = f'{label}{suffix}{ext}'
            (staging / filename).write_bytes(data)
            replacements[source] = f'assets/{filename}'
        # No edits above this point. Only commit after all downloads succeeded.
        assets = ROOT / 'assets'
        assets.mkdir(exist_ok=True)
        for old, new in replacements.items():
            (assets / Path(new).name).write_bytes((staging / Path(new).name).read_bytes())
            config = config.replace(json.dumps(old, ensure_ascii=False), json.dumps(new))
            page = page.replace(html.escape(old, quote=True), new).replace(old, new)
        config_path.write_text(config, encoding='utf-8')
        page_path.write_text(page, encoding='utf-8')
    print(f'Copied {len(replacements)} images into assets/ and updated the site.')
    print('The page now serves its images locally. SoundCloud audio remains an embed.')
    print('For rich social previews, make og:image in index.html an absolute URL after publishing.')
    print('Upload the updated site folder (or ZIP its contents) to Cloudflare Pages.')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, ValueError) as error:
        print(f'Images were not fully downloaded: {error}', file=sys.stderr)
        print('The existing remote-image version still works. Check connectivity and try again.', file=sys.stderr)
        raise SystemExit(1)
