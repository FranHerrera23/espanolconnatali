from urllib.request import urlopen,Request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from html.parser import HTMLParser
import json,hashlib
base='https://www.espanolconnatali.com';m=json.loads(Path('content/launch/manifest.json').read_text())
class P(HTMLParser):
 def __init__(self):super().__init__();self.canonical=None;self.robots=None
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='link' and a.get('rel')=='canonical':self.canonical=a.get('href')
  if t=='meta' and a.get('name')=='robots':self.robots=a.get('content')
def check(route):
 try:
  with urlopen(Request(base+route,headers={'User-Agent':'Mozilla/5.0'}),timeout=20) as r:
   data=r.read();headers=dict(r.headers);status=r.status;final=r.url
  result={'route':route,'status':status,'url':final,'xRobotsTag':headers.get('X-Robots-Tag',headers.get('x-robots-tag'))}
  if route.endswith('.pdf'):result['validPdf']=data.startswith(b'%PDF');result['sha256']=hashlib.sha256(data).hexdigest()
  elif route.endswith('.xml') or route.endswith('.txt'):result['body']=data.decode()
  else:
   p=P();p.feed(data.decode());result.update(canonical=p.canonical,robots=p.robots);assert p.canonical==base+route and 'noindex' not in p.robots
  assert not result['xRobotsTag'] or 'noindex' not in result['xRobotsTag']
  return result
 except Exception as e:return {'route':route,'error':str(e)}
routes=['/','/resources/']+[a['route'] for a in m]+['/robots.txt','/sitemap.xml','/assets/downloads/ask-for-clarification-workbook-ru.pdf']
with ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(check,routes))
Path('work').mkdir(exist_ok=True);Path('work/live-verification.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps(results,ensure_ascii=False))
