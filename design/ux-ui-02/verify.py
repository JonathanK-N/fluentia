"""Contrôles structurels des références locales. Responsable : Jonathan Kakesa."""
from pathlib import Path
import hashlib
import json
import re

root=Path(__file__).resolve().parent
catalogue=json.loads((root/'catalogue.json').read_text(encoding='utf-8'))
screens=catalogue['screens'];ids={s['id'] for s in screens}
assert len(ids)==len(screens)==62
assert len({s['route'] for s in screens})==62
assert all(s['figmaId'] is None for s in screens)
assert all(s['formats']==[375,768,1440] for s in screens)
assert len(catalogue['flows'])==8
for flow in catalogue['flows']:
    assert all(id in ids for id in flow['screens'])
    assert flow['error'] and flow['interruption']
for item in json.loads((root/'assets.json').read_text(encoding='utf-8'))['assets']:
    assert hashlib.sha256((root/'assets'/item['file']).read_bytes()).hexdigest()==item['sha256']
source=(root/'prototype.js').read_text(encoding='utf-8')
assert 'getUserMedia' not in source and 'MediaRecorder' not in source
assert 'localStorage' not in source and 'sessionStorage' not in source
assert '04_SVG' not in source
css=(root/'tokens.css').read_text(encoding='utf-8')
themes=re.findall(r'\{([^{}]*--bg:[^{}]*)\}',css)
def luminance(value):
    channels=[int(value[i:i+2],16)/255 for i in (0,2,4)]
    return sum((v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4)*factor for v,factor in zip(channels,[.2126,.7152,.0722]))
ratios=[]
for i,theme in enumerate(themes):
    values=dict(re.findall(r'--([\w-]+):#([\da-f]{6})',theme))
    for front,back,minimum in [('text','bg',4.5),('muted','surface',4.5),('on-action','action',4.5),('accent','tint',4.5),('danger','surface',4.5),('control-border','bg',3),('control-border','surface',3),('focus','bg',3)]:
        a,b=sorted([luminance(values[front]),luminance(values[back])]);ratio=(b+.05)/(a+.05)
        assert ratio>=minimum,(i,front,back,ratio)
        ratios.append({'theme':'Clair commun v3','foreground':front,'background':back,'ratio':round(ratio,3),'minimum':minimum})
assert len(ratios)==8
output={'screens':len(screens),'flows':8,'assets':3,'contrastPairs':ratios,'figmaNativeDelivered':False}
evidence=root/'test-results';evidence.mkdir(exist_ok=True)
(evidence/'structure.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('62 écrans, 8 parcours, 3 assets officiels et 8 paires de contraste vérifiés.')
