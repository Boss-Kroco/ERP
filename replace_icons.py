import os, re

def replace_icon(content, target_id, phosphor_class):
    # Find the nav-icon-pill with the target_id
    pattern = r'(<div class="nav-icon-pill"[^>]*id="' + target_id + r'"[^>]*>)\s*<svg.*?</svg>'
    replacement = r'\g<1>\n                        <i class="ph-duotone ' + phosphor_class + r' nav-icon-i"></i>'
    return re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add Phosphor script to head if not exists
if 'phosphor-icons' not in content:
    content = content.replace('</head>', '    <!-- Phosphor Icons (Premium) -->\n    <script src="https://unpkg.com/@phosphor-icons/web"></script>\n</head>')

# Add CSS for .nav-icon-i in style.css or index.html
if 'nav-icon-i' not in content:
    content = content.replace('</head>', '    <style>.nav-icon-i { font-size: 24px; transition: all 0.2s; }</style>\n</head>')

# Replace icons
icons_map = {
    'navPillDashboard': 'ph-squares-four',
    'navPillPos': 'ph-storefront',
    'navPillPelanggan': 'ph-users-three',
    'navPillSewa': 'ph-toolbox',
    'navPillProduk': 'ph-package',
    'navPillProduksi': 'ph-factory',
    'navPillMultilokasi': 'ph-truck',
    'navPillOpname': 'ph-clipboard-text',
    'navPillKeuangan': 'ph-wallet',
    'navPillTenagakerja': 'ph-hard-hat',
    'navPillAgenda': 'ph-calendar-check',
    'navPillAudit': 'ph-clock-counter-clockwise',
    'navPillPengaturan': 'ph-gear-six',
    'navPillBantuan': 'ph-lifebuoy'
}

for target_id, ph_class in icons_map.items():
    content = replace_icon(content, target_id, ph_class)

# Replace logout icon
content = re.sub(r'(<div class="sb-bottom-btn"[^>]*>)\s*<svg.*?</svg>', r'\g<1>\n                <i class="ph-duotone ph-sign-out nav-icon-i"></i>', content, flags=re.DOTALL)

# Write back
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated index.html sidebar icons!')
