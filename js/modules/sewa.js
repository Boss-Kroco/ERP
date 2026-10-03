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
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                <div style="font-weight: 700; font-size: 13px; color: var(--text-dark);">${alat.nama}</div>
                <button style="background: transparent; border: none; color: #dc2626; cursor: pointer; padding: 2px;" onclick="event.stopPropagation(); window.hapusAlat('${alat.id}')" title="Hapus Alat">
                    <svg class="svg-icon-xs" viewBox="0 0 24 24" style="width: 14px; height: 14px;"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Stok: ${alat.qty}</div>
            <div style="font-weight: 800; color: var(--violet-main); font-size: 14px; margin-top: auto;">${window.formatAppCurrency(alat.hargaSewa)} <span style="font-size: 10px; font-weight: normal; color: var(--text-muted);">/hari</span></div>
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
                    <div style="font-size: 11px; color: var(--violet-main); font-weight: 600;">${window.formatAppCurrency(item.hargaSewa)}</div>
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
    
    if(lblSub) lblSub.textContent = window.formatAppCurrency(subtotal);
    if(lblTotal) lblTotal.textContent = window.formatAppCurrency(totalBayar);
};

window.prosesSewa = function() {
    if(window.keranjangSewa.length === 0) {
        if(window.showToast) window.showToast('Keranjang sewa masih kosong!', 'error');
        return;
    }
    
    var penyewa = document.getElementById('inpPenyewaSewa').value || 'Pelanggan Umum';
    var durasi = document.getElementById('inpDurasiSewa').value || 1;
    
    if(window.showToast) window.showToast('Transaksi Sewa berhasil diproses untuk ' + penyewa + ' selama ' + durasi + ' hari!', 'success');
    
    // Cetak Struk
    window.cetakStrukSewa(penyewa, durasi);

    // Clear keranjang
    window.keranjangSewa = [];
    document.getElementById('inpPenyewaSewa').value = '';
    document.getElementById('inpDurasiSewa').value = 1;
    
    window.renderKeranjangSewa();
    
    if(typeof window.addMockAuditLog === 'function') {
        window.addMockAuditLog('Sewa Alat', 'Transaksi Sewa Baru: ' + penyewa);
    }
};

window.bukaModalTambahAlat = function() {
    document.getElementById('inpIdAlatBaru').value = 'AL-' + Math.floor(Math.random() * 1000);
    document.getElementById('inpNamaAlatBaru').value = '';
    document.getElementById('inpHargaAlatBaru').value = '';
    document.getElementById('inpQtyAlatBaru').value = '1';
    document.getElementById('modalTambahAlatSewa').style.display = 'flex';
};

window.simpanAlatBaru = function() {
    var id = document.getElementById('inpIdAlatBaru').value;
    var nama = document.getElementById('inpNamaAlatBaru').value;
    var harga = parseInt(document.getElementById('inpHargaAlatBaru').value) || 0;
    var qty = parseInt(document.getElementById('inpQtyAlatBaru').value) || 1;
    
    if(!nama || harga <= 0) {
        if(window.showToast) window.showToast('Nama dan harga alat harus diisi!', 'error');
        return;
    }
    
    window.katalogAlat.push({ id: id, nama: nama, hargaSewa: harga, qty: qty });
    document.getElementById('modalTambahAlatSewa').style.display = 'none';
    window.renderAlatSewa();
    if(window.showToast) window.showToast('Alat baru berhasil ditambahkan.', 'success');
};

window.hapusAlat = function(id) {
    if(confirm('Yakin ingin menghapus alat ini?')) {
        window.katalogAlat = window.katalogAlat.filter(function(a) { return a.id !== id; });
        window.renderAlatSewa();
        if(window.showToast) window.showToast('Alat berhasil dihapus.', 'success');
    }
};

window.cetakStrukSewa = function(penyewa, durasi) {
    var subtotal = 0;
    var itemsHtml = '';
    window.keranjangSewa.forEach(function(item) {
        var lineTotal = item.hargaSewa * item.qty * durasi;
        subtotal += lineTotal;
        itemsHtml += `
            <tr>
                <td style="padding: 4px 0; border-bottom: 1px dashed #ccc;">${item.nama}<br><small>${item.qty} x ${window.formatAppCurrency(item.hargaSewa)}</small></td>
                <td style="padding: 4px 0; text-align: right; border-bottom: 1px dashed #ccc;">${window.formatAppCurrency(lineTotal)}</td>
            </tr>
        `;
    });

    var strukHtml = `
        <div style="width: 300px; padding: 20px; font-family: monospace; color: #000; background: #fff;">
            <div style="text-align: center; margin-bottom: 10px;">
                <h2 style="margin: 0; font-size: 18px;">MAFAZA GROUP</h2>
                <p style="margin: 5px 0;">Struk Sewa Alat</p>
                <p style="margin: 0; font-size: 12px;">Tanggal: ${new Date().toLocaleDateString()}</p>
            </div>
            <hr style="border: none; border-top: 1px dashed #000;">
            <p style="margin: 5px 0;">Penyewa: ${penyewa}</p>
            <p style="margin: 5px 0;">Durasi: ${durasi} Hari</p>
            <hr style="border: none; border-top: 1px dashed #000;">
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <hr style="border: none; border-top: 1px dashed #000;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
                <span>TOTAL</span>
                <span>${window.formatAppCurrency(subtotal)}</span>
            </div>
            <div style="text-align: center; margin-top: 20px; font-size: 11px;">
                Terima Kasih Atas Kepercayaannya
            </div>
        </div>
    `;

    if (typeof window.downloadStrukPdf === 'function') {
        window.downloadStrukPdf(strukHtml, 'Struk_Sewa_' + penyewa.replace(/\s+/g, '_') + '.pdf');
    } else {
        var printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write('<html><head><title>Cetak Struk Sewa</title></head><body style="margin:0; padding:0; display:flex; justify-content:center;">' + strukHtml + '</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(function() {
            printWindow.print();
            printWindow.close();
        }, 500);
    }
};

// Auto render on load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(window.renderAlatSewa, 500);
});
