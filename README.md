# gawi_studio_lp
landing page like linktree

Live: https://gawi.studio

## Produk terlaris dari Shopee

**Featured Object** = produk terlaris #1, **Best Sellers** = #2–#5.
Datanya dari `products.json`, yang dibuat dari file export Shopee Seller Centre.
Selama `products.json` kosong, featured memakai isi manual di `script.js`.

### Update produk (±2 menit, misalnya 2–4 minggu sekali)

1. Download dari **Shopee Seller Centre**, simpan ke folder `import\` (tidak ikut di-upload):
   - **Data penjualan** (untuk ranking): *Business Insights → Produk → Performa Produk* →
     pilih periode (misalnya 30 hari) → **Export**.
   - **Foto & harga** (opsional): *Produk Saya → Update Massal* → download
     **Informasi Media** / **Info Dasar**.
   Kedua file digabung otomatis lewat Kode Produk. Untuk data penjualan, yang dipakai file terbaru.
   ⚠️ Template **Mass Upload** (untuk upload produk baru) isinya kosong, jadi tidak bisa dipakai.
2. Klik dua kali **`update-produk.bat`** → cek daftar produk → ketik `y` untuk upload.

Website ter-update 1–2 menit kemudian. Bisa juga lewat terminal: `node scripts/import-products.mjs`

### Foto produk
Kalau export Informasi Media disertakan, foto sampul diambil otomatis dari Shopee.
Untuk memakai foto sendiri, simpan sebagai `images\<Kode Produk>.jpg` (jpg/png/webp, ±800×800 px).
Foto di `images\` selalu didahulukan.

### Pengaturan — `products.config.json`

```json
{
  "shopId": "123456789",
  "domain": "shopee.co.id",
  "topN": 5,
  "exclude": ["28374651234"],
  "overrides": {
    "19283746501": { "name": "Battery Case AA" }
  }
}
```

- `shopId` — supaya link langsung ke halaman produk. Lihat di Seller Centre → Pengaturan Toko,
  atau dari link produk Shopee: `shopee.co.id/product/<shopId>/<kodeProduk>`.
- `topN` — jumlah produk yang ditampilkan (1 featured + sisanya best sellers).
- `exclude` — Kode Produk yang tidak mau ditampilkan.
- `overrides` — ganti nama/foto/link/harga produk tertentu (nama Shopee sering kepanjangan).

### Kalau error
- *Kolom 'Nama Produk' / 'Terjual' tidak ditemukan* → file export-nya beda format.
  Script akan menampilkan baris awal file; kirim ke developer untuk disesuaikan.
- Pastikan Node.js terpasang (`node -v` di terminal).
