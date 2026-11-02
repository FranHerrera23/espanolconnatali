import json,subprocess,shutil
from pathlib import Path
src=Path('work/seo-fixture');shutil.copytree('site',src,dirs_exist_ok=True)
data=json.loads((src/'resources-content.json').read_text());a=data['plans'];a.update(status='published',approvalRequired=False,author={'name':'Тестовый автор','jobTitle':'Тестовая роль','image':'/assets/natali-city.jpg'},reviewer={'name':'Тестовый редактор'},sources=[{'title':'Тестовый источник','url':'https://example.test/source'}],publishedAt='2026-11-01',updatedAt='2026-11-02');(src/'resources-content.json').write_text(json.dumps(data,ensure_ascii=False))
import os
env={**os.environ,'DEPLOY_MODE':'production','SITE_URL':'https://example.test','SITE_SOURCE':str(src),'BUILD_DIR':'work/seo-published-test'}
subprocess.run(['node','scripts/build.mjs'],env=env,check=True);subprocess.run(['python3','scripts/check-seo.py','work/seo-published-test','production'],check=True)
assert Path('work/seo-published-test/resources/make-plans-in-spanish/index.html').is_file()
assert not Path('work/seo-published-test/resources/keep-a-conversation-going').exists()
# Missing editorial approval must stop the build.
a['approvalRequired']=True;(src/'resources-content.json').write_text(json.dumps(data));r=subprocess.run(['node','scripts/build.mjs'],env=env,capture_output=True,text=True);assert r.returncode and 'Publication approval missing' in r.stderr
# A production domain is mandatory; the previous Lovable URL cannot silently leak.
env.pop('SITE_URL');r=subprocess.run(['node','scripts/build.mjs'],env=env,capture_output=True,text=True);assert r.returncode and 'confirmed production origin' in r.stderr
print('Publication gates passed: published fixture only, author/date rendering, draft exclusion, missing approval and missing production domain. All fixture identities are test data, not approvals.')
