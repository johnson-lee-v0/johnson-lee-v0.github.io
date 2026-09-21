/*
 * Genuine StockX multi-angle photographs, restored from the original js/shoe.js.
 * Verified 2026-09-20: frames 01, 18, and 36 return images for each set below;
 * frame 37 does not exist. All 36 Visionaire frames were additionally verified.
 * KD 7 Easter and the two Tanjuns remain static because
 * no corresponding StockX 360 set was available at their image slugs.
 *
 * Frame URL:
 * https://images.stockx.com/360/{slug}/Images/{slug}/Lv2/img{01..36}.jpg
 * Fetch on interaction, not all 360 photographs at page load.
 */
window.SNEAKER_SPINS = Object.freeze({
  "Air Jordan 1 High Skyline": {
    slug: "Air-Jordan-1-Retro-High-OG-Skyline",
    frames: 36
  },
  "Air Jordan 1 Retro High White Cement": {
    slug: "Air-Jordan-1-Retro-High-OG-White-Cement",
    frames: 36
  },
  "Air Jordan 1 High OG Denim": {
    slug: "Air-Jordan-1-High-OG-Denim-W",
    frames: 36
  },
  "Air Jordan 1 Retro High OG Visionaire": {
    slug: "Air-Jordan-1-Retro-High-OG-Visionaire",
    frames: 36
  },
  "Air Jordan 1 High Element Gore-Tex Berry": {
    slug: "Air-Jordan-1-High-Element-Gore-Tex-Berry",
    frames: 36
  },
  "Nike Air Force 1 Flyknit 2 Black Pure Platinum": {
    slug: "Nike-Air-Force-1-Flyknit-2-Black-Pure-Platinum",
    frames: 36
  },
  "Jordan XXXIII University Red": {
    slug: "Air-Jordan-XXXIII-University-Red",
    frames: 36
  },
  "Nike Air Max 270 Flyknit Laser Orange Blue Orbit": {
    slug: "Nike-Air-Max-270-Flyknit-Laser-Orange-Blue-Orbit",
    frames: 36
  },
  "Nike Air Max 270 Flyknit Bred": {
    slug: "Nike-Air-Max-270-Flyknit-Bred",
    frames: 36
  },
  "Nike Epic React Flyknit 2 Blue Void": {
    slug: "Nike-Epic-React-Flyknit-2-Blue-Void",
    frames: 36
  }
});
