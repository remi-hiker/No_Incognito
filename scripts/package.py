"""Package only the extension's runtime files (Python standard library only)."""
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent
source = root / 'extension'
version = json.loads((source / 'manifest.json').read_text())['version']
destination = root / 'dist' / f'TopLock-Antincognito-{version}.zip'
destination.parent.mkdir(exist_ok=True)
with ZipFile(destination, 'w', ZIP_DEFLATED) as archive:
    for name in ['manifest.json', 'background.js', 'status.html', 'status.css', 'status.js']:
        archive.write(source / name, name)
    for icon in sorted((source / 'icons').glob('*.png')):
        archive.write(icon, icon.relative_to(source))
print(destination)
