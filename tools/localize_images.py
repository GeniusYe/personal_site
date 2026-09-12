#!/usr/bin/env python3
"""Copy both galleries' remote images into this website before retiring old hosting.

Run from any directory with Python 3.10+ and internet access:
    python tools/localize_images.py --dry-run
    python tools/localize_images.py

Only standard-library modules are used. Failed downloads retain their original
URLs and produce a nonzero exit status. Backups are stored in tools/backups/.
Images are saved under profile/, music/, culture/, postcards/, movie/, or bodypositive/
inside assets/, according to their content section.
"""
from __future__ import annotations
import argparse
import hashlib
import html
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
CONFIGS = [('site-config.js', 'window.JIAJIE_SITE = ', None),
           ('bodypositive-data.js', 'window.JIAJIE_BODY_PHOTOS = ', 'assets/bodypositive')]
SECTION_FOLDERS = {'profile': 'assets/profile', 'songs': 'assets/music',
                   'culture': 'assets/culture', 'travel': 'assets/postcards', 'project': 'assets/movie'}
KEYS = {'photo', 'thumbnail', 'artwork', 'src'}
MAX_BYTES = 24 * 1024 * 1024
EXTENSIONS = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif'}


def sources(value: object) -> set[str]:
    found: set[str] = set()
    if isinstance(value, dict):
        for key, child in value.items():
            if key in KEYS and isinstance(child, str) and child.startswith('https://'):
                found.add(child)
            else:
                found.update(sources(child))
    elif isinstance(value, list):
        for child in value:
            found.update(sources(child))
    return found


def destinations(value: dict, default_folder: str | None) -> dict[str, str]:
    if default_folder:
        return {url: default_folder for url in sources(value)}
    folders = {url: folder for section, folder in SECTION_FOLDERS.items()
               for url in sources(value.get(section))}
    unrouted = sources(value) - folders.keys()
    if unrouted:
        raise ValueError('Add a content folder for these image sources: ' + ', '.join(sorted(unrouted)))
    return folders


def replace(value: object, mapping: dict[str, str]) -> object:
    if isinstance(value, dict):
        return {key: replace(child, mapping) for key, child in value.items()}
    if isinstance(value, list):
        return [replace(child, mapping) for child in value]
    return mapping.get(value, value) if isinstance(value, str) else value


def download(url: str, folder: str) -> tuple[str, str]:
    request = Request(url, headers={'User-Agent': 'JiaJie-Website-Image-Migration/1.0'})
    with urlopen(request, timeout=30) as response:
        extension = EXTENSIONS.get(response.headers.get_content_type())
        if extension is None:
            raise ValueError('Response is not a supported image')
        content = response.read(MAX_BYTES + 1)
    if not content or len(content) > MAX_BYTES:
        raise ValueError('Image is empty or exceeds 24 MiB')
    name = hashlib.sha256(url.encode()).hexdigest()[:20] + extension
    path = ROOT / folder / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    return url, f'{folder}/{name}'


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()
    replacements: dict[str, str] = {}
    failed = 0
    for name, marker, default_folder in CONFIGS:
        path = ROOT / name
        original = path.read_text(encoding='utf-8')
        if marker not in original:
            raise SystemExit(f'{name}: configuration assignment not found.')
        prefix, raw = original.split(marker, 1)
        try:
            data = json.loads(raw.strip().removesuffix(';'))
        except json.JSONDecodeError as error:
            raise SystemExit(f'{name}: keep the configuration JSON-compatible: {error}') from error
        folders = destinations(data, default_folder)
        urls = sorted(folders)
        print(f'{name}: {len(urls)} remote image(s).')
        if args.dry_run:
            print('\n'.join(f'{url} -> {folders[url]}/' for url in urls))
            continue
        mapping: dict[str, str] = {}
        with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 8))) as executor:
            jobs = {executor.submit(download, url, folders[url]): url for url in urls}
            for job in as_completed(jobs):
                url = jobs[job]
                try:
                    source, local = job.result()
                    mapping[source] = local
                    print(f'Saved {local}')
                except Exception as error:
                    failed += 1
                    print(f'FAILED; retained remote URL: {url}\n  {error}')
        if mapping:
            backup = ROOT / 'tools' / 'backups' / name
            backup.parent.mkdir(parents=True, exist_ok=True)
            if not backup.exists():
                backup.write_text(original, encoding='utf-8')
            path.write_text(prefix + marker + json.dumps(replace(data, mapping), ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
            replacements.update(mapping)
    if args.dry_run:
        return 0
    # Update server-rendered image fallbacks and the home page sharing thumbnail.
    # Relative OG images work in some readers; see README for an absolute final URL.
    for path in [ROOT / 'index.html', ROOT / 'bodypositive.html']:
        original = path.read_text(encoding='utf-8')
        updated = original
        for url, local in replacements.items():
            updated = updated.replace(html.escape(url, quote=True), local).replace(url, local)
        if updated != original:
            backup = ROOT / 'tools' / 'backups' / path.name
            backup.parent.mkdir(parents=True, exist_ok=True)
            if not backup.exists():
                backup.write_text(original, encoding='utf-8')
            path.write_text(updated, encoding='utf-8')
    print(f'Localized {len(replacements)} image(s); {failed} failed.')
    if failed:
        print('Some images still depend on their old host. Do not retire that host yet.')
        return 1
    print('Upload the updated site folder, including assets/. Check both pages before retiring old hosting.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
