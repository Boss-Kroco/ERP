import os
import re

def process_dir(d):
    for fn in os.listdir(d):
        p = os.path.join(d, fn)
        if os.path.isdir(p):
            process_dir(p)
        elif p.endswith('.js') or p.endswith('.html'):
            with open(p, 'r', encoding='utf-8') as f:
                content = f.read()
            
            orig_content = content
            
            if p.endswith('.js'):
                # Handle typeof window.formatRupiah === 'function' ? window.formatRupiah(x) : ('Rp ' + x)
                content = re.sub(
                    r"\(?typeof\s+window\.formatRupiah\s*===\s*'function'\)?\s*\?\s*window\.formatRupiah\(([^)]+)\)\s*:\s*\('Rp '\s*\+\s*([^)]+)\)", 
                    r"window.formatAppCurrency(\1)", 
                    content
                )
                # Handle window.formatRupiah ? window.formatRupiah(x) : ('Rp ' + x)
                content = re.sub(
                    r"window\.formatRupiah\s*\?\s*window\.formatRupiah\(([^)]+)\)\s*:\s*\('Rp '\s*\+\s*([^)]+)\)", 
                    r"window.formatAppCurrency(\1)", 
                    content
                )
                # Replace remaining typeof
                content = content.replace("typeof window.formatRupiah === 'function'", "typeof window.formatAppCurrency === 'function'")
                content = content.replace("typeof window.formatRupiah", "typeof window.formatAppCurrency")
                
                # Replace any remaining formatRupiah references
                content = content.replace('window.formatRupiah', 'window.formatAppCurrency')
                content = re.sub(r'(?<!function\s)formatRupiah\(', r'window.formatAppCurrency(', content)
                content = content.replace('formatRp(', 'window.formatAppCurrency(')
                
            if p.endswith('.html'):
                # Replace <option value="rp">Rp</option> to generic
                content = content.replace('<option value="rp">Rp</option>', '<option value="rp">Nominal Tunai</option>')
                
            if content != orig_content:
                with open(p, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {p}")

process_dir('js')
process_dir('views')
