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
      "https://www.instagram.com/gawi.works"

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