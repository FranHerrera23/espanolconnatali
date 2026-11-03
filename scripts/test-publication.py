from pathlib import Path
import json,re,hashlib,subprocess
from html.parser import HTMLParser
m=json.loads(Path('content/launch/manifest.json').read_text())
class T(HTMLParser):
 def __init__(self):super().__init__();self.text=[]
 def handle_data(self,s):self.text.append(s)
for a in m:
 md=Path('content/launch',Path(a['sourceFile']).name).read_text();assert hashlib.sha256(md.encode()).hexdigest()==a['sha256']
 s=Path('dist'+a['route']+'index.html').read_text();p=T();p.feed(s);visible=' '.join(p.text)
 for word in set(re.findall('[А-Яа-яЁё]{2,}',md.split('\n',1)[1])):assert word in visible,(a['route'],word)
 assert 'library-course' not in s and 'О курсе' not in s and 'Индивидуальные занятия' not in s
 assert 'reviewedBy' not in s and '.md"' not in s and 'noindex' not in s
 assert all(url.replace('&','&amp;') in s for url in a['sourceUrls'])
pdf=Path('dist/assets/downloads/ask-for-clarification-workbook-ru.pdf');assert pdf.read_bytes().startswith(b'%PDF')
assert pdf.read_bytes()==Path('site/assets/downloads/ask-for-clarification-workbook-ru.pdf').read_bytes()
assert sum('Скачать PDF' in f.read_text() for f in Path('dist/resources').rglob('index.html'))==1
assert len(re.findall('<loc>',Path('dist/sitemap.xml').read_text()))==12
print('Launch checks: ten source hashes, full Russian word coverage, sources, open resources, no commercial blocks/fake review, one real PDF, twelve sitemap URLs.')
