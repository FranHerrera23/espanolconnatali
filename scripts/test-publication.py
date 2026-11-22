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
expected_routes={'/','/resources/','/students/','/resources/jobs-in-spain/','/life-in-spain/'}|{a['route'] for a in m}
feed=json.loads(Path('dist/assets/data/jobs.json').read_text())
expected_routes|={job['url'].removeprefix('https://www.espanolconnatali.com') for job in feed['jobs']}
actual_routes=set(re.findall(r'<loc>https://www.espanolconnatali.com([^<]+)</loc>',Path('dist/sitemap.xml').read_text()))
expected_routes.add('/articles/')
assert expected_routes <= actual_routes, expected_routes - actual_routes
all_indexable = {
 '/' + f.relative_to('dist').as_posix().removesuffix('index.html')
 for f in Path('dist').rglob('index.html')
 if re.search(r'<meta name="robots" content="index,follow', f.read_text())
}
assert actual_routes == all_indexable, actual_routes ^ all_indexable
archive = Path('dist/articles/index.html').read_text()
dates = re.findall(r'<time datetime="([^"]+)">', archive)
assert len(dates) == len(m) and dates == sorted(dates, reverse=True)
covers = re.findall(r'<img src="(/assets/editorial/covers/[^"]+)"', archive)
assert len(set(covers)) == len(m) and all(Path('dist' + cover).is_file() for cover in covers)
latest = json.loads(Path('dist/articles/feed.json').read_text())['articles']
assert [a['date'] for a in latest] == dates[:3]
print(f'Launch checks: {len(m)} verified articles, matching PDFs and {len(actual_routes)} sitemap URLs.')
