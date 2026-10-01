/**
 * ============================================================================
 * MAFAZA GROUP ERP - MODUL SEWA ALAT
 * File: js/modules/sewa.js
 * ============================================================================
 */

window.katalogAlat = [
    { id: 'AL-001', nama: 'Eskavator Mini', hargaSewa: 1500000, qty: 2 },
    { id: 'AL-002', nama: 'Mesin Molen Beton', hargaSewa: 250000, qty: 5 },
    { id: 'AL-003', nama: 'Stamper Kuda', hargaSewa: 300000, qty: 4 },
    { id: 'AL-004', nama: 'Genset 5000 Watt', hargaSewa: 500000, qty: 3 },
    { id: 'AL-005', nama: 'Scaffolding (Set)', hargaSewa: 40000, qty: 100 }
];

window.keranjangSewa = [];

window.renderAlatSewa = function(filterQuery) {
    var grid = document.getElementById('gridAlatSewa');
    if(!grid) return;
    grid.innerHTML = '';
    
    var query = (filterQuery || '').toLowerCase();
    
    window.katalogAlat.forEach(function(alat) {
        if(query && alat.nama.toLowerCase().indexOf(query) === -1) return;
        
        var card = document.createElement('div');
        card.className = 'pos-product-card';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.padding = '12px';
        card.style.background = '#fff';
        card.style.borderRadius = '10px';
        card.style.border = '1px solid var(--border-soft)';
        card.style.cursor = 'pointer';
        card.onclick = function() { window.tambahKeKeranjangSewa(alat); };
        
        card.innerHTML = `
            <div style="font-weight: 700; font-size: 13px; color: var(--text-dark); margin-bottom: 4px;">${alat.nama}</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Stok: ${alat.qty}</div>
            <div style="font-weight: 800; color: var(--violet-main); font-size: 14px; margin-top: auto;">Rp ${window.formatRupiah ? window.formatRupiah(alat.hargaSewa) : alat.hargaSewa} <span style="font-size: 10px; font-weight: normal; color: var(--text-muted);">/hari</span></div>
        `;
        
        grid.appendChild(card);
    });
};

window.filterAlatSewa = function() {
    var input = document.getElementById('inpCariAlat');
    if(input) window.renderAlatSewa(input.value);
};

window.tambahKeKeranjangSewa = function(alat) {
    var existing = window.keranjangSewa.find(function(item) { return item.id === alat.id; });
    if(existing) {
        existing.qty += 1;
    } else {
        window.keranjangSewa.push({
            id: alat.id,
            nama: alat.nama,
            hargaSewa: alat.hargaSewa,
            qty: 1
        });
    }
    window.renderKeranjangSewa();
};

window.kurangiKeranjangSewa = function(alatId) {
    var idx = window.keranjangSewa.findIndex(function(item) { return item.id === alatId; });
    if(idx > -1) {
        window.keranjangSewa[idx].qty -= 1;
        if(window.keranjangSewa[idx].qty <= 0) {
            window.keranjangSewa.splice(idx, 1);
        }
    }
    window.renderKeranjangSewa();
};

window.renderKeranjangSewa = function() {
    var list = document.getElementById('listKeranjangSewa');
    if(!list) return;
    
    if(window.keranjangSewa.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 20px;">Belum ada alat yang dipilih.</div>';
    } else {
        list.innerHTML = '';
        window.keranjangSewa.forEach(function(item) {
            var row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '8px 0';
            row.style.borderBottom = '1px solid var(--border-soft)';
            
            var subtotal = item.hargaSewa * item.qty;
            
            row.innerHTML = `
                <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 12px; color: var(--text-dark);">${item.nama}</div>
                    <div style="font-size: 11px; color: var(--violet-main); font-weight: 600;">Rp ${window.formatRupiah ? window.formatRupiah(item.hargaSewa) : item.hargaSewa}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button style="width: 24px; height: 24px; border-radius: 4px; border: 1px solid var(--border-soft); background: white; cursor: pointer; color: red;" onclick="window.kurangiKeranjangSewa('${item.id}')">-</button>
                    <span style="font-size: 13px; font-weight: 700; min-width: 20px; text-align: center;">${item.qty}</span>
                    <button style="width: 24px; height: 24px; border-radius: 4px; border: none; background: var(--violet-main); color: white; cursor: pointer;" onclick="window.tambahKeKeranjangSewa({id: '${item.id}', nama: '${item.nama}', hargaSewa: ${item.hargaSewa}})">+</button>
                </div>
            `;
            list.appendChild(row);
        });
    }
    window.hitungTotalSewa();
};

window.hitungTotalSewa = function() {
    var durasiInput = document.getElementById('inpDurasiSewa');
    var durasi = 1;
    if(durasiInput) durasi = parseInt(durasiInput.value) || 1;
    
    var elInfo = document.getElementById('lblDurasiSewaInfo');
    if(elInfo) elInfo.textContent = durasi + ' Hari';
    
    var subtotal = 0;
    window.keranjangSewa.forEach(function(item) {
        subtotal += item.hargaSewa * item.qty;
    });
    
    var totalBayar = subtotal * durasi;
    
    var lblSub = document.getElementById('lblSubtotalSewa');
    var lblTotal = document.getElementById('lblTotalSewa');
    
    if(lblSub) lblSub.textContent = 'Rp ' + (window.formatRupiah ? window.formatRupiah(subtotal) : subtotal);
    if(lblTotal) lblTotal.textContent = 'Rp ' + (window.formatRupiah ? window.formatRupiah(totalBayar) : totalBayar);
};

window.prosesSewa = function() {
    if(window.keranjangSewa.length === 0) {
        if(window.showToast) window.showToast('Keranjang sewa masih kosong!', 'error');
        return;
    }
    
    var penyewa = document.getElementById('inpPenyewaSewa').value || 'Pelanggan Umum';
    var durasi = document.getElementById('inpDurasiSewa').value || 1;
    
    if(window.showToast) window.showToast('Transaksi Sewa berhasil diproses untuk ' + penyewa + ' selama ' + durasi + ' hari!', 'success');
    
    // Clear keranjang
    window.keranjangSewa = [];
    document.getElementById('inpPenyewaSewa').value = '';
    document.getElementById('inpDurasiSewa').value = 1;
    
    window.renderKeranjangSewa();
    
    if(typeof window.addMockAuditLog === 'function') {
        window.addMockAuditLog('Sewa Alat', 'Transaksi Sewa Baru: ' + penyewa);
    }
};

// Auto render on load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(window.renderAlatSewa, 500);
});
