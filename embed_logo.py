import base64
import os

b64 = 'data:image/jpeg;base64,' + base64.b64encode(open('assets/logo.jpg', 'rb').read()).decode('utf-8')

for fname in ['js/modules/sewa.js', 'js/modules/dashboard.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('"assets/logo.jpg"', f'"{b64}"')
    content = content.replace("'assets/logo.jpg'", f'"{b64}"')
    
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
