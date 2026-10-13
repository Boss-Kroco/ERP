import os, re

def replace_bantuan_html():
    with open('views/bantuan.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Title icon
    content = re.sub(r'<div class="faq-title">\s*<svg.*?</svg>', r'<div class="faq-title">\n                <i class="ph-duotone ph-info" style="color: var(--violet-main); font-size: 24px;"></i>', content, flags=re.DOTALL)
    
    # Guide card icons
    content = re.sub(r'<div class="guide-icon-box"[^>]*>\s*<svg.*?</svg>', r'<div class="guide-icon-box">\n                            <i class="ph-duotone ph-book-open-text" style="font-size: 24px;"></i>', content, flags=re.DOTALL)
    
    # Make the boxes match colors
    content = content.replace('stroke: #ea580c', 'color: #ea580c').replace('stroke: #dc2626', 'color: #dc2626').replace('stroke: #2563eb', 'color: #2563eb').replace('stroke: #16a34a', 'color: #16a34a').replace('stroke: #8b5cf6', 'color: #8b5cf6')

    with open('views/bantuan.html', 'w', encoding='utf-8') as f:
        f.write(content)

def replace_bantuan_js():
    with open('js/modules/bantuan.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r"iconSvg: '<svg.*?</svg>'", r"iconSvg: '<i class=\"ph-duotone ph-book-open-text\" style=\"font-size: 20px; color: ' + badgeColor + '\"></i>'", content)
    
    with open('js/modules/bantuan.js', 'w', encoding='utf-8') as f:
        f.write(content)

replace_bantuan_html()
replace_bantuan_js()
print("Bantuan icons updated!")
