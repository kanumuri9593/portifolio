#!/usr/bin/env python3
"""Local gallery editor. Bind to loopback only; do not expose this server publicly."""
import argparse
import email.policy
import json
import os
import re
import threading
import uuid
import zlib
from datetime import datetime, timezone
from email.parser import BytesParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

MAX_FILE = 12 * 1024 * 1024
MAX_REQUEST = 64 * 1024 * 1024
CATEGORIES = {'photography', 'art', 'table'}
LOCK = threading.RLock()


def image_type(content):
    """Validate container structure, dimensions and essential image payloads.

    This intentionally is not a full pixel decoder; it needs no imaging packages.
    """
    def dimensions(width, height):
        if not (0 < width <= 30000 and 0 < height <= 30000 and width * height <= 100_000_000):
            raise ValueError('Image dimensions are invalid or too large.')

    if content.startswith(b'\x89PNG\r\n\x1a\n'):
        offset, header, pixels, ended = 8, False, False, False
        while offset + 12 <= len(content):
            length = int.from_bytes(content[offset:offset + 4], 'big')
            kind = content[offset + 4:offset + 8]
            end = offset + 12 + length
            if end > len(content):
                break
            data = content[offset + 8:end - 4]
            if zlib.crc32(kind + data) & 0xffffffff != int.from_bytes(content[end - 4:end], 'big'):
                break
            if not header and kind != b'IHDR':
                break
            if kind == b'IHDR':
                if header or length != 13:
                    break
                dimensions(int.from_bytes(data[:4], 'big'), int.from_bytes(data[4:8], 'big'))
                depths = {0: {1, 2, 4, 8, 16}, 2: {8, 16}, 3: {1, 2, 4, 8}, 4: {8, 16}, 6: {8, 16}}
                if data[8] not in depths.get(data[9], set()) or data[10:12] != b'\0\0' or data[12] not in (0, 1):
                    break
                header = True
            elif kind == b'IDAT':
                pixels = pixels or bool(length)
            elif kind == b'IEND':
                ended = length == 0 and end == len(content)
                break
            offset = end
        if header and pixels and ended:
            return '.png', 'image/png'
    elif content.startswith(b'\xff\xd8'):
        offset, frame, scan, ended = 2, False, False, False
        while offset < len(content):
            if content[offset] != 255:
                break
            while offset < len(content) and content[offset] == 255:
                offset += 1
            if offset >= len(content):
                break
            marker = content[offset]
            offset += 1
            if marker == 0xd9:
                ended = offset == len(content)
                break
            if marker in (0, 0xd8) or 0xd0 <= marker <= 0xd7:
                break
            if offset + 2 > len(content):
                break
            length = int.from_bytes(content[offset:offset + 2], 'big')
            if length < 2 or offset + length > len(content):
                break
            payload = content[offset + 2:offset + length]
            if marker in {0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf}:
                if len(payload) < 6 or len(payload) != 6 + 3 * payload[5]:
                    break
                dimensions(int.from_bytes(payload[3:5], 'big'), int.from_bytes(payload[1:3], 'big'))
                frame = True
            offset += length
            if marker == 0xda:
                if not frame or len(payload) < 6 or len(payload) != 4 + 2 * payload[0]:
                    break
                start = offset
                while offset < len(content):
                    if content[offset] != 255:
                        offset += 1
                    elif offset + 1 < len(content) and (content[offset + 1] == 0 or 0xd0 <= content[offset + 1] <= 0xd7):
                        offset += 2
                    else:
                        break
                scan = scan or offset > start
        if frame and scan and ended:
            return '.jpg', 'image/jpeg'
    elif content[:4] == b'RIFF' and content[8:12] == b'WEBP' and int.from_bytes(content[4:8], 'little') + 8 == len(content):
        offset, pixels = 12, False
        while offset + 8 <= len(content):
            kind = content[offset:offset + 4]
            length = int.from_bytes(content[offset + 4:offset + 8], 'little')
            end = offset + 8 + length
            if end > len(content):
                break
            data = content[offset + 8:end]
            if kind == b'VP8 ':
                if length < 11 or data[3:6] != b'\x9d\x01\x2a' or data[0] & 1:
                    break
                dimensions(int.from_bytes(data[6:8], 'little') & 0x3fff, int.from_bytes(data[8:10], 'little') & 0x3fff)
                pixels = True
            elif kind == b'VP8L':
                if length < 6 or data[0] != 0x2f or data[4] >> 5:
                    break
                bits = int.from_bytes(data[1:5], 'little')
                dimensions((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1)
                pixels = True
            elif kind == b'ANIM':
                raise ValueError('Use a still JPEG, PNG, or WebP image.')
            offset = end + (length & 1)
        if pixels and offset == len(content):
            return '.webp', 'image/webp'
    raise ValueError('Choose a valid, complete JPEG, PNG, or still WebP image.')


def make_handler(root):
    root = root.resolve()
    metadata = root / 'data' / 'gallery.json'
    uploads = root / 'assets' / 'uploads'
    metadata.parent.mkdir(parents=True, exist_ok=True)
    uploads.mkdir(parents=True, exist_ok=True)
    if not metadata.exists():
        metadata.write_text('[]\n', encoding='utf-8')

    def records():
        value = json.loads(metadata.read_text(encoding='utf-8'))
        if not isinstance(value, list):
            raise ValueError('Gallery metadata must contain an array.')
        return value

    def save(value):
        temporary = metadata.with_suffix('.tmp')
        temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        os.replace(temporary, metadata)

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(root), **kwargs)

        def end_headers(self):
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Referrer-Policy', 'same-origin')
            self.send_header('Cache-Control', 'no-store')
            super().end_headers()

        def valid_host(self):
            host = self.headers.get('Host', '')
            return host in {f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}'}

        def allowed_write(self):
            if not self.valid_host():
                self.respond(403, {'error': 'Use the localhost studio address.'})
                return False
            origin = self.headers.get('Origin')
            allowed = {f'http://127.0.0.1:{self.server.server_port}', f'http://localhost:{self.server.server_port}'}
            if (origin and origin not in allowed) or self.headers.get('Sec-Fetch-Site') == 'cross-site':
                self.respond(403, {'error': 'Cross-site changes are not allowed.'})
                return False
            return True

        def respond(self, status, payload):
            body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def safe_static(self):
            path = unquote(urlsplit(self.path).path)
            if '\x00' in path or '\\' in path or '..' in Path(path).parts:
                return False
            candidate = (root / path.lstrip('/')).resolve()
            return candidate.is_relative_to(root)

        def do_GET(self):
            if not self.valid_host():
                return self.respond(403, {'error': 'Use the localhost studio address.'})
            if urlsplit(self.path).path == '/api/gallery':
                try:
                    with LOCK:
                        return self.respond(200, {'items': records()})
                except (OSError, ValueError):
                    return self.respond(500, {'error': 'The gallery could not be read. Check data/gallery.json.'})
            if not self.safe_static():
                return self.respond(403, {'error': 'Invalid path.'})
            return super().do_GET()

        def do_HEAD(self):
            if not self.valid_host() or not self.safe_static():
                self.send_error(403)
                return
            return super().do_HEAD()

        def list_directory(self, path):
            self.send_error(404, 'Page not found')
            return None

        def do_POST(self):
            if not self.allowed_write():
                return
            if urlsplit(self.path).path != '/api/gallery':
                return self.respond(404, {'error': 'Unknown endpoint.'})
            created_paths = []
            try:
                if self.headers.get('Transfer-Encoding'):
                    raise ValueError('Chunked uploads are not supported.')
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0:
                    raise ValueError('Choose at least one image.')
                if length > MAX_REQUEST:
                    self.close_connection = True
                    return self.respond(413, {'error': 'Upload at most 60 MB at a time; each image must be at most 12 MB.'})
                content_type = self.headers.get('Content-Type', '')
                if not content_type.lower().startswith('multipart/form-data;') or '\n' in content_type or '\r' in content_type:
                    raise ValueError('Send images using multipart form data.')
                self.connection.settimeout(30)
                body = self.rfile.read(length)
                if len(body) != length:
                    raise ValueError('Upload was interrupted. Please try again.')
                message = BytesParser(policy=email.policy.default).parsebytes(('Content-Type: ' + content_type + '\r\nMIME-Version: 1.0\r\n\r\n').encode() + body)
                if not message.is_multipart():
                    raise ValueError('The upload form is invalid.')
                fields, files = {}, []
                for part in message.iter_parts():
                    name = part.get_param('name', header='content-disposition')
                    filename = part.get_filename()
                    content = part.get_payload(decode=True) or b''
                    if filename is not None:
                        if name not in {'file', 'files', 'images'}:
                            raise ValueError('Unexpected file field.')
                        if len(files) >= 10:
                            raise ValueError('Choose no more than 10 images at once.')
                        if not filename or '/' in filename or '\\' in filename or '\x00' in filename or filename in {'.', '..'}:
                            raise ValueError('The image filename is invalid.')
                        if len(content) > MAX_FILE:
                            raise ValueError(f'{filename}: images must be at most 12 MB.')
                        if Path(filename).suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp'}:
                            raise ValueError('Only JPEG, PNG, and WebP filenames are supported.')
                        extension, mime = image_type(content)
                        if part.get_content_type() not in {'image/jpeg', 'image/png', 'image/webp', 'application/octet-stream'}:
                            raise ValueError('Only JPEG, PNG, and WebP images are supported.')
                        files.append((filename, content, extension, mime))
                    elif name in {'title', 'category', 'caption', 'group'}:
                        if len(content) > 8192:
                            raise ValueError('Text fields are too long.')
                        fields[name] = content.decode('utf-8').strip()
                if not files:
                    raise ValueError('Choose at least one image.')
                category = fields.get('category', 'photography')
                if category not in CATEGORIES:
                    raise ValueError('Choose photography, art, or table.')
                group = fields.get('group', '') if category == 'photography' else ''
                if group not in {'', 'people', 'places', 'details'}:
                    raise ValueError('Choose People, Places, Little things, or Everything only.')
                title, caption = fields.get('title', ''), fields.get('caption', '')
                if len(title) > 160 or len(caption) > 2000:
                    raise ValueError('Use a title under 160 characters and a caption under 2,000 characters.')
                additions = []
                with LOCK:
                    current = records()
                    for index, (filename, content, extension, mime) in enumerate(files):
                        identifier = uuid.uuid4().hex
                        relative = f'assets/uploads/{identifier}{extension}'
                        destination = root / relative
                        destination.write_bytes(content)
                        created_paths.append(destination)
                        item_title = title or Path(filename).stem.replace('_', ' ').replace('-', ' ')
                        if title and len(files) > 1:
                            item_title += f' {index + 1}'
                        additions.append({'id': identifier, 'title': item_title, 'category': category, 'group': group, 'caption': caption, 'url': '/' + relative, 'src': '/' + relative, 'filename': filename, 'mime': mime, 'size': len(content), 'createdAt': datetime.now(timezone.utc).isoformat()})
                    save(additions + current)
                    # Metadata and files are committed; response failures must not undo them.
                    created_paths.clear()
                try:
                    return self.respond(201, {'items': additions})
                except (BrokenPipeError, ConnectionResetError, TimeoutError):
                    self.close_connection = True
                    return
            except (ValueError, UnicodeError) as error:
                for path in created_paths:
                    path.unlink(missing_ok=True)
                return self.respond(400, {'error': str(error)})
            except (OSError, TimeoutError):
                for path in created_paths:
                    path.unlink(missing_ok=True)
                return self.respond(500, {'error': 'The upload could not be saved. Check local folder permissions and retry.'})

        def do_DELETE(self):
            if not self.allowed_write():
                return
            match = re.fullmatch(r'/api/gallery/([a-f0-9]{32})', urlsplit(self.path).path)
            if not match:
                return self.respond(404, {'error': 'Image not found.'})
            try:
                with LOCK:
                    current = records()
                    item = next((record for record in current if record.get('id') == match.group(1)), None)
                    if item is None:
                        return self.respond(404, {'error': 'Image not found.'})
                    relative = str(item.get('url', '')).lstrip('/')
                    target = (root / relative).resolve()
                    if not target.is_relative_to(uploads.resolve()) or target.stem != match.group(1):
                        return self.respond(409, {'error': 'This record has an invalid image path.'})
                    save([record for record in current if record.get('id') != match.group(1)])
                    target.unlink(missing_ok=True)
                return self.respond(200, {'deleted': match.group(1)})
            except (OSError, ValueError):
                return self.respond(500, {'error': 'The image could not be removed.'})

    return Handler


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument('--port', type=int, default=4180)
    options = parser.parse_args()
    options.root.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', options.port), make_handler(options.root))
    server.daemon_threads = True
    print(f'Local portfolio: http://127.0.0.1:{options.port}/\nGallery studio: http://127.0.0.1:{options.port}/studio.html\nServing {options.root.resolve()}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
