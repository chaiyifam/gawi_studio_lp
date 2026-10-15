// Ubah file export Shopee Seller Centre (.xlsx / .csv) → products.json
//
// Cara pakai (atau klik dua kali update-produk.bat):
//   Simpan file export di folder import/ lalu jalankan:
//     node scripts/import-products.mjs
//
//   File yang dikenali (boleh salah satu atau keduanya, digabung lewat Kode Produk):
//   • Business Insights → Produk → Performa Produk → Export   → jumlah terjual (untuk ranking)
//   • Produk Saya → Update Massal → Informasi Media / Info Dasar → foto sampul, harga, nama
//
// Pengaturan ada di products.config.json (Shop ID, jumlah produk, exclude, override).
// Tanpa dependency — cukup Node.js 18+.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_FILE = path.join(ROOT, "products.config.json");
const OUT_FILE = path.join(ROOT, "products.json");
const IMPORT_DIR = path.join(ROOT, "import");
const IMAGES_DIR = path.join(ROOT, "images");

// ---------- config ----------
const config = {
  shopId: "",
  domain: "shopee.co.id",
  topN: 5,
  exclude: [],
  overrides: {},
  ...(fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")) : {}),
};

// ---------- daftar file (terbaru dulu) ----------
const files = process.argv.length > 2
  ? process.argv.slice(2)
  : fs.existsSync(IMPORT_DIR)
    ? fs.readdirSync(IMPORT_DIR)
        .filter((f) => /\.(xlsx|csv)$/i.test(f) && !f.startsWith("~$"))
        .map((f) => path.join(IMPORT_DIR, f))
        .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
    : [];
if (!files.length) fail(`Tidak ada file .xlsx/.csv di folder import/. Taruh file export Seller Centre di:\n   ${IMPORT_DIR}`);

// ---------- pengenal kolom ----------
const norm = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
const COLS = {
  id:     [/^(kode|id) produk$/, /^product id$/, /^item id$/, /^ps_product_id/, /kode produk/, /id produk/],
  name:   [/^nama produk$/, /^produk$/, /^product( name)?$/, /^ps_product_name/, /nama produk/],
  sold:   [/produk terjual|unit terjual|terjual/, /units? sold|^sold/, /pesanan siap dikirim.*unit|unit.*pesanan/],
  price:  [/^harga$|^harga jual|^harga diskon|^price$|^ps_price/, /^harga/],
  image:  [/^foto sampul|^gambar sampul|cover image|^ps_item_cover_image/],
  rating: [/^rating|penilaian/],
  url:    [/^link produk|^url|^tautan/],
};
const SKIP_SHEET = /panduan|contoh|guide|example|sample|petunjuk|instruksi|kategori|ukuran|pre-?order/i;

function findHeader(rows) {
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const h = rows[r].map(norm);
    const found = {};
    for (const [key, patterns] of Object.entries(COLS)) {
      for (const p of patterns) {
        const i = h.findIndex((x, j) => x && p.test(x) && !Object.values(found).includes(j));
        if (i >= 0) { found[key] = i; break; }
      }
    }
    if (found.name != null || (found.id != null && (found.sold != null || found.image != null))) return { r, col: found };
  }
  return null;
}

const num = (v) => {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/rp|idr|\s/gi, "");
  if (!s || s === "-") return null;
  const n = Number(/,\d{1,2}$/.test(s) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/[.,](?=\d{3}(\D|$))/g, ""));
  return Number.isFinite(n) ? n : null;
};
const cleanId = (v) => String(v ?? "").trim().replace(/\.0$/, "");
const isUrl = (v) => /^https?:\/\/\S+$/.test(String(v ?? "").trim());

// ---------- baca semua file & sheet ----------
const products = new Map();   // key → produk gabungan
let hasSales = false, salesFileDone = false, order = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file) || file;
  const sheets = /\.csv$/i.test(file) ? [{ name: "csv", rows: readCsv(file) }] : readXlsx(file);
  let used = false;

  for (const { name: sheetName, rows } of sheets) {
    if (SKIP_SHEET.test(sheetName)) continue;
    const h = findHeader(rows);
    if (!h) continue;
    const { col } = h;
    const isSales = col.sold != null;
    if (col.id == null && !isSales) continue;  // template kosong / tanpa Kode Produk
    if (isSales && salesFileDone) continue;  // hanya data penjualan terbaru

    let count = 0;
    for (const r of rows.slice(h.r + 1)) {
      const name = col.name != null ? String(r[col.name] ?? "").trim() : "";
      const id = col.id != null ? cleanId(r[col.id]) : "";
      if (col.id != null ? !/^\d{5,}$/.test(id) : (!name || /^(total|jumlah|grand total)$/i.test(name))) continue;

      const key = id || name;
      const p = products.get(key) || { id, name: "", sold: 0, price: null, image: "", rating: null, url: "", order: order++ };
      if (name && !p.name) p.name = name;
      if (isSales) { const s = num(r[col.sold]); if (s) p.sold += s; }
      if (col.price != null) { const x = num(r[col.price]); if (x && (p.price == null || x < p.price)) p.price = x; }
      if (!p.image && col.image != null && isUrl(r[col.image])) p.image = String(r[col.image]).trim();
      if (p.rating == null && col.rating != null) { const x = num(r[col.rating]); if (x && x <= 5) p.rating = x; }
      if (!p.url && col.url != null && isUrl(r[col.url])) p.url = String(r[col.url]).trim();
      products.set(key, p);
      count++;
    }
    if (!count) continue;
    used = true;
    if (isSales) { hasSales = true; salesFileDone = true; }
    console.log(`📄 ${rel}${sheets.length > 1 ? ` [${sheetName}]` : ""}: ${count} baris` +
      ` — ${isSales ? "data penjualan" : "info produk"}` +
      ` (${Object.keys(col).filter((k) => k !== "sold" || isSales).join(", ")})`);
  }
  if (!used) console.log(`⏭️  ${rel}: tidak ada data produk (template kosong / format lain) — dilewati`);
}

let list = [...products.values()].filter((p) => p.name && !config.exclude.map(String).includes(p.id));
if (!list.length) {
  fail("Belum ada data produk yang terbaca.\n" +
    "   Pakai export dari Seller Centre:\n" +
    "   • Business Insights → Produk → Performa Produk → Export (jumlah terjual)\n" +
    "   • Produk Saya → Update Massal → download Informasi Media / Info Dasar (foto & harga)\n" +
    "   Catatan: template 'Mass Upload' (untuk upload produk baru) isinya kosong, tidak bisa dipakai.");
}
if (!hasSales) console.warn("⚠️  Belum ada data penjualan — urutan mengikuti file. Tambahkan export Performa Produk untuk ranking terlaris.");

list.sort((a, b) => (b.sold - a.sold) || (a.order - b.order));
list = list.slice(0, config.topN);

// ---------- foto lokal, link, override ----------
const localImage = (id) => {
  if (!id || !fs.existsSync(IMAGES_DIR)) return "";
  const f = fs.readdirSync(IMAGES_DIR).find((x) => x.replace(/\.(jpe?g|png|webp|avif)$/i, "") === id);
  return f ? `images/${f}` : "";
};
const shopUrl = config.shopId ? `https://${config.domain}/shop/${config.shopId}` : `https://${config.domain}`;

const out = list.map((p) => {
  const o = config.overrides[p.id] || config.overrides[p.name] || {};
  return {
    id: p.id || null,
    name: o.name || p.name,
    image: o.image || localImage(p.id) || p.image || "",
    price: o.price ?? p.price,
    originalPrice: null,
    sold: Math.round(p.sold),
    rating: o.rating ?? (p.rating ? Math.round(p.rating * 10) / 10 : null),
    url: o.url || p.url || (p.id && config.shopId ? `https://${config.domain}/product/${config.shopId}/${p.id}` : shopUrl),
  };
});

fs.writeFileSync(OUT_FILE, JSON.stringify({ updatedAt: new Date().toISOString(), products: out }, null, 2) + "\n");

console.log("\n✅ products.json diperbarui:\n");
out.forEach((p, i) => console.log(
  `  ${String(i + 1).padStart(2)}. ${p.name.slice(0, 46).padEnd(46)} ${hasSales ? String(p.sold).padStart(6) + " terjual" : ""}` +
  `${p.image ? "" : "   ⚠️ belum ada foto"}`));
const noImg = out.filter((p) => !p.image);
if (noImg.length) console.log(`\n💡 Foto: tambahkan export Informasi Media, atau simpan foto sebagai images/<Kode Produk>.jpg (contoh images/${noImg[0].id || "123456789"}.jpg)`);
if (!config.shopId) console.log("💡 Isi \"shopId\" di products.config.json supaya link langsung ke halaman produk.");

// ================= helpers =================
function fail(msg) { console.error("❌ " + msg); process.exit(1); }

function readCsv(f) {
  const text = fs.readFileSync(f, "utf8").replace(/^﻿/, "");
  const sep = (text.split("\n")[0].match(/;/g) || []).length > (text.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
  const out = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); out.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); out.push(row); }
  return out;
}

// Pembaca .xlsx minimal (unzip + XML) → [{ name, rows }] untuk semua sheet
function readXlsx(f) {
  const files = unzip(fs.readFileSync(f));
  const xml = (n) => files[n] ? files[n].toString("utf8") : "";
  const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&amp;/g, "&");
  const texts = (s) => [...s.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1])).join("");

  const shared = [...xml("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1]));

  const rels = xml("xl/_rels/workbook.xml.rels");
  const target = (rid) => {
    const m = rels.match(new RegExp(`<Relationship [^>]*Id="${rid}"[^>]*Target="([^"]+)"`)) ||
      rels.match(new RegExp(`<Relationship [^>]*Target="([^"]+)"[^>]*Id="${rid}"`));
    if (!m) return null;
    return m[1].startsWith("/") ? m[1].slice(1) : "xl/" + m[1].replace(/^\.\//, "");
  };
  const sheets = [...xml("xl/workbook.xml").matchAll(/<sheet ([^>]*)\/?>/g)].map((m) => ({
    name: decode((m[1].match(/name="([^"]*)"/) || [])[1] || ""),
    hidden: /state="(hidden|veryHidden)"/.test(m[1]),
    path: target((m[1].match(/r:id="([^"]+)"/) || [])[1]),
  })).filter((s) => !s.hidden && s.path && files[s.path]);

  const colIdx = (ref) => { let n = 0; for (const ch of ref.replace(/\d+/g, "")) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  const parseSheet = (sheet) => {
  const out = [];
  for (const rm of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cm of rm[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1], inner = cm[2] || "";
      const ref = (attrs.match(/r="([A-Z]+)\d+"/) || [])[1];
      const type = (attrs.match(/t="([^"]+)"/) || [])[1];
      const v = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      let val = "";
      if (type === "s") val = shared[+v] ?? "";
      else if (type === "inlineStr") val = texts(inner);
      else if (type === "str" || type === "e") val = v != null ? decode(v) : "";
      else if (v != null) val = Number(v);
      row[ref ? colIdx(ref) : row.length] = val;
    }
    out.push(Array.from(row, (x) => x ?? ""));
  }
  return out;
  };
  return sheets.map((s) => ({ name: s.name, rows: parseSheet(xml(s.path)) }));
}

function unzip(buf) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) fail("File .xlsx rusak atau bukan file Excel.");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = {};
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28), elen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const off = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nlen);
    const data = buf.subarray(off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28)).subarray(0, csize);
    out[name] = method === 8 ? zlib.inflateRawSync(data) : data;
    p += 46 + nlen + elen + clen;
  }
  return out;
}
