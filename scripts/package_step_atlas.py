"""Build byte-preserving, deterministic download archives for the atlas."""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs/step-atlas'
OUT = ROOT / 'atlas-release'

def add(archive, source, name):
    entry = zipfile.ZipInfo(name, date_time=(2026, 10, 15, 0, 0, 0))
    entry.compress_type = zipfile.ZIP_STORED
    entry.external_attr = 0o644 << 16
    archive.writestr(entry, source.read_bytes())

def main():
    manifest = json.loads((DOCS / 'publication-manifest.json').read_text())
    OUT.mkdir(exist_ok=True)
    cases = {}
    for image in manifest['images']:
        source = ROOT / image['repository_path']
        assert source.stat().st_size == image['bytes'], source
        assert hashlib.sha256(source.read_bytes()).hexdigest() == image['sha256'], source
        cases.setdefault(image['case_id'], []).append(image)
    assert len(cases) == 26
    for cid, images in cases.items():
        with zipfile.ZipFile(OUT / f'{cid}-all-steps.zip', 'w') as archive:
            for image in sorted(images, key=lambda x: x['name']):
                add(archive, ROOT / image['repository_path'], cid + '/' + image['name'])
            add(archive, DOCS / 'assets' / cid / 'metadata.json', cid + '/metadata.json')
        print(f'Packaged {cid}: {len(images)} images', flush=True)
    with zipfile.ZipFile(OUT / 'all-20-step-sheets.zip', 'w') as archive:
        sheets = [v for v in manifest['images'] if v['name'].endswith(('-full-20.webp', '-detail-20.webp'))]
        assert len(sheets) == 118
        for image in sheets:
            add(archive, ROOT / image['repository_path'], image['case_id'] + '/' + image['name'])
        for name in ['plan.json', 'summary.json']:
            add(archive, DOCS / 'assets' / name, name)
    checksums = []
    for p in sorted(OUT.glob('*.zip')):
        with zipfile.ZipFile(p) as archive:
            assert archive.testzip() is None, p
        checksums.append(hashlib.sha256(p.read_bytes()).hexdigest() + '  ' + p.name)
    assert len(checksums) == 27
    (OUT / 'SHA256SUMS.txt').write_text('\n'.join(checksums) + '\n')
    print(f'Validated {len(checksums)} archives', flush=True)

if __name__ == '__main__':
    main()
