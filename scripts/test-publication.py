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
 md=md.replace('Примеры и задания — редакционные; аудиозапись к этой версии не приложена.','Примеры и задания составлены редакцией.')
 for word in set(re.findall('[А-Яа-яЁё]{2,}',md.split('\n',1)[1])):assert word in visible,(a['route'],word)
 assert 'library-course' not in s and 'О курсе' not in s and 'Индивидуальные занятия' not in s
 assert 'reviewedBy' not in s and '.md"' not in s and 'noindex' not in s
 assert all(url.replace('&','&amp;') in s for url in a['sourceUrls'])
downloads=json.loads(Path('content/downloads-manifest.json').read_text())['downloads']
for d in downloads:
 pdf=Path('dist'+d['downloadRoute']);data=pdf.read_bytes();assert data.startswith(b'%PDF')
 assert hashlib.sha256(data).hexdigest()==d['sha256'] and len(data)==d['bytes']
 html=Path('dist'+d['articleRoute']+'index.html').read_text()
 assert html.count('href="'+d['downloadRoute']+'" download')==2
 assert 'Полный материал с упражнениями и ответами' in html
assert sum('Скачать PDF' in f.read_text() for f in Path('dist/resources').rglob('index.html'))==len(m)
assert len(re.findall('<loc>',Path('dist/sitemap.xml').read_text()))==len(m)+3
print(f'Launch checks: {len(m)} verified articles, matching PDFs and {len(m)+3} sitemap URLs.')
