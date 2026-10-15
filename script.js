const GAWI_CONFIG = {

  brand: {
    name: "GAWI",

    studioLabel: "DESIGN STUDIO",

    heroTitle: `
      Objects for<br>
      your desk.
    `,

    heroDescription:
      "Independent studio creating functional desk objects through design & 3D printing.",

    studioTagline: `
      Small objects.<br>
      Better desk spaces.
    `,

    footerLeft:
      "GAWI STUDIO",

    footerRight:
      "DESIGNED IN INDONESIA"
  },


  links: {

    shopee:
      "https://shopee.co.id/gawi.studio",

    tiktok:
      "https://www.tiktok.com/@gawi.studio",

    instagram:
      "https://www.instagram.com/gawi.works",

    makerworld:
      "https://makerworld.com/en/@gawi.studio"

  },



  featured: {

    number:
      "01 / 2026",

    category:
      "CABLE MANAGEMENT",

    name:
      "Magnetic Cable Box",

    description:
      "Modular cable storage designed around everyday desk setups.",

    url:
      "https://shopee.co.id/LINK_PRODUK_KAMU"

  }

};


document.addEventListener(
  "DOMContentLoaded",
  () => {

    setText(
      "[data-brand-name]",
      GAWI_CONFIG.brand.name
    );

    setText(
      "[data-studio-label]",
      GAWI_CONFIG.brand.studioLabel
    );

    setHTML(
      "[data-hero-title]",
      GAWI_CONFIG.brand.heroTitle
    );

    setText(
      "[data-hero-description]",
      GAWI_CONFIG.brand.heroDescription
    );

    setHTML(
      "[data-studio-tagline]",
      GAWI_CONFIG.brand.studioTagline
    );

    setText(
      "[data-footer-left]",
      GAWI_CONFIG.brand.footerLeft
    );

    setText(
      "[data-footer-right]",
      GAWI_CONFIG.brand.footerRight
    );

    setLinks(
      "[data-link='shopee']",
      GAWI_CONFIG.links.shopee
    );

    setLinks(
      "[data-link='tiktok']",
      GAWI_CONFIG.links.tiktok
    );

    setLinks(
      "[data-link='instagram']",
      GAWI_CONFIG.links.instagram
    );

    setLinks(
      "[data-link='makerworld']",
      GAWI_CONFIG.links.makerworld
    );


    setText(
      "[data-featured-number]",
      GAWI_CONFIG.featured.number
    );

    setText(
      "[data-featured-category]",
      GAWI_CONFIG.featured.category
    );

    setText(
      "[data-featured-name]",
      GAWI_CONFIG.featured.name
    );

    setText(
      "[data-featured-description]",
      GAWI_CONFIG.featured.description
    );

    setLinks(
      "[data-featured-link]",
      GAWI_CONFIG.featured.url
    );

  }
);


function setText(
  selector,
  value
) {

  const elements =
    document.querySelectorAll(
      selector
    );

  elements.forEach(
    element => {

      element.textContent =
        value;

    }
  );

}


function setHTML(
  selector,
  value
) {

  const elements =
    document.querySelectorAll(
      selector
    );

  elements.forEach(
    element => {

      element.innerHTML =
        value;

    }
  );

}


function setLinks(
  selector,
  url
) {

  const elements =
    document.querySelectorAll(
      selector
    );

  elements.forEach(
    element => {

      element.href =
        url;

    }
  );

}

/* ================================
   PRODUK SHOPEE (otomatis)
   products.json dibuat dari export Seller Centre (update-produk.bat).
   #1 terlaris → Featured Object, sisanya → Best Sellers.
   Kalau products.json kosong/gagal, featured tetap pakai GAWI_CONFIG di atas.
================================ */

const formatRupiah = n =>
  "Rp" + Math.round(n).toLocaleString("id-ID");

const formatSold = n =>
  n >= 1000
    ? (n / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + "rb"
    : String(n);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function productMeta(p) {
  const parts = [];
  if (p.price != null) parts.push(formatRupiah(p.price));
  if (p.sold) parts.push(formatSold(p.sold) + " terjual");
  if (p.rating) parts.push("★ " + p.rating);
  return parts.join("  ·  ");
}

async function loadShopeeProducts() {

  let data;

  try {
    const res = await fetch(
      "./products.json?v=" + Math.floor(Date.now() / 3.6e6),
      { cache: "no-store" }
    );
    data = await res.json();
  } catch (e) {
    return;
  }

  const products = (data.products || []).filter(p => p.url);
  if (!products.length) return;

  /* --- Featured = terlaris #1 --- */
  const top = products[0];

  setText("[data-featured-category]", "BEST SELLER #1");
  setText("[data-featured-name]", top.name);
  setText("[data-featured-description]", productMeta(top));
  setLinks("[data-featured-link]", top.url);

  if (top.image) {
    const photo = document.querySelector("[data-featured-photo]");
    photo.src = top.image;
    photo.alt = top.name;
    photo.hidden = false;
    document
      .querySelector(".product-visual")
      .classList.add("has-photo");
  }

  /* --- Best sellers = sisanya --- */
  const rest = products.slice(1);
  if (!rest.length) return;

  const list = document.querySelector("[data-product-list]");
  list.replaceChildren();

  rest.forEach((p, i) => {

    const a = el("a", "product-row");
    a.href = p.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";

    const thumb = el("div", "product-thumb");
    if (p.image) {
      const img = el("img");
      img.src = p.image;
      img.alt = "";
      img.loading = "lazy";
      thumb.append(img);
    }

    const info = el("div", "product-info");
    info.append(
      el("span", "product-name", p.name),
      el("span", "product-meta", productMeta(p))
    );

    a.append(
      el("span", "link-number", String(i + 2).padStart(2, "0")),
      thumb,
      info,
      el("span", "arrow", "↗")
    );

    list.append(a);
  });

  if (data.updatedAt) {
    setText(
      "[data-products-updated]",
      "UPDATED " +
        new Date(data.updatedAt)
          .toLocaleDateString("id-ID", { day: "numeric", month: "short" })
          .toUpperCase()
    );
  }

  document.querySelector("[data-bestsellers]").hidden = false;
}

document.addEventListener("DOMContentLoaded", loadShopeeProducts);
