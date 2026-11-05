from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,unquote
import json,sys,xml.etree.ElementTree as ET
root=Path(sys.argv[1] if len(sys.argv)>1 else 'dist');mode=sys.argv[2] if len(sys.argv)>2 else 'preview'
class Page(HTMLParser):
 def __init__(self):super().__init__();self.tags=[];self.text=[];self.jsons=[];self.injson=False
 def handle_starttag(self,t,a):
  a=dict(a);self.tags.append((t,a))
  if t=='script' and a.get('type')=='application/ld+json':self.injson=True
 def handle_endtag(self,t):
  if t=='script':self.injson=False
 def handle_data(self,s):
  if self.injson:self.jsons.append(json.loads(s))
  else:self.text.append(s)
normalize=lambda s:' '.join(s.split())
for f in root.rglob('*.html'):
 p=Page();raw=f.read_text();p.feed(raw);text=normalize(' '.join(p.text))
 assert sum(t=='h1' for t,a in p.tags)==1,f
 locale=f.relative_to(root).parts[0]
 localized=locale in ('es','en')
 assert any(t=='html' and a.get('lang')==(locale if localized else 'ru') for t,a in p.tags),f
 assert 't.me/' not in raw and 'Telegram' not in raw,f
 if f.name=='404.html':continue
 canonical=[a['href'] for t,a in p.tags if t=='link' and a.get('rel')=='canonical'];assert len(canonical)==1,f
 assert any(t=='meta' and a.get('name')=='description' and a.get('content') for t,a in p.tags),f
 if localized:
  russian_path='/'+'/'.join(f.relative_to(root/locale).parent.parts)
  assert urlparse(canonical[0]).path==russian_path.rstrip('/')+'/',f
  assert not p.jsons,f
 else:
  assert any(t=='meta' and a.get('property')=='og:url' and a['content']==canonical[0] for t,a in p.tags),f
  assert len(p.jsons)==1,f
  graph=p.jsons[0]['@graph'];ids=[x['@id'] for x in graph];assert len(ids)==len(set(ids)),f
  for node in graph:
   if node['@type']=='FAQPage':
    for q in node['mainEntity']:assert normalize(q['name']) in text and normalize(q['acceptedAnswer']['text']) in text,f
   if node['@type']=='Article':
    assert normalize(node['headline']) in text and normalize(node['description']) in text,f
    if node['creativeWorkStatus']=='Published':assert node.get('author',{}).get('name') and node.get('datePublished'),f
    else:assert not node.get('datePublished') and not node.get('author'),f
 for t,a in p.tags:
  if t in ['a','img','script','link']:
   link=a.get('href',a.get('src',''))
   if not link or link.startswith(('http:','https:','data:','mailto:')):continue
   path,_,fragment=link.partition('#')
   dest=root/path.lstrip('/') if path else f
   if path.endswith('/'):dest=dest/'index.html'
   assert dest.is_file(),(f,link)
   if fragment:assert 'id="'+unquote(fragment)+'"' in dest.read_text(),(f,link)
 robots=[a.get('content','') for t,a in p.tags if t=='meta' and a.get('name')=='robots'];assert len(robots)==1,f
 if mode=='preview' or localized:assert 'noindex' in robots[0],f
urls=ET.parse(root/'sitemap.xml').getroot();ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
for u in urls.findall('s:url',ns):
 location=u.find('s:loc',ns).text;assert not urlparse(location).path.startswith(('/es/','/en/')),location;dest=root/urlparse(location).path.lstrip('/')/'index.html';assert dest.is_file(),location
 p=Page();p.feed(dest.read_text());assert any(t=='meta' and a.get('name')=='robots' and a['content'].startswith('index,') for t,a in p.tags),location
if mode=='preview':assert len(urls)==0
print(f'SEO checks passed: {len(list(root.rglob("*.html")))} HTML files; graph/visible-text parity, local links/anchors, metadata, language, indexation and sitemap.')
