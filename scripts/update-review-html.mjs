import fs from "fs";

let html = fs.readFileSync("review-editable.html", "utf8");

// Service localization
html = html.replace(
  /src="assets\/service-localization\.jpg"/g,
  'src="assets/service-localization.jpg" width="1717" height="916" loading="lazy" decoding="async"'
);

// Service influencer
html = html.replace(
  /src="assets\/service-influencer\.jpg"/g,
  'src="assets/service-influencer.jpg" width="1717" height="916" loading="lazy" decoding="async"'
);

// Creator recruitment
html = html.replace(
  /src="assets\/creator-recruitment\.jpg"/g,
  'src="assets/creator-recruitment.jpg" width="1716" height="917" loading="lazy" decoding="async"'
);

// Hong kong culture
html = html.replace(
  /src="assets\/hong-kong-culture\.jpg"/g,
  'src="assets/hong-kong-culture.jpg" width="1662" height="946" loading="lazy" decoding="async"'
);

// About HK cross border bridge (appears twice: Talent and About)
html = html.replace(
  /<img\s+src="assets\/about-hk-cross-border-bridge\.png"/g,
  '<img src="assets/about-hk-cross-border-bridge.png" width="1983" height="793" loading="lazy" decoding="async"'
);

// Talent global creator network (Contact section)
html = html.replace(
  /<img\s+src="assets\/talent-global-creator-network\.png"/g,
  '<img src="assets/talent-global-creator-network.png" width="1906" height="825" loading="lazy" decoding="async"'
);

// Hong kong harbour remaining instances
html = html.replace(
  /<img\s+src="assets\/hong-kong-harbour\.jpg"\s+alt="Hong Kong skyline as a global growth launchpoint"/g,
  '<img src="assets/hong-kong-harbour.jpg" alt="Hong Kong skyline as a global growth launchpoint" width="1672" height="941" loading="lazy" decoding="async"'
);

// Brand logos
const logos = [
  { name: "temu", w: 135, h: 72 },
  { name: "anker", w: 235, h: 69 },
  { name: "dreame", w: 210, h: 27 },
  { name: "aliexpress", w: 241, h: 56 },
  { name: "lovart", w: 85, h: 100 },
  { name: "aiper", w: 190, h: 48 },
  { name: "ksp", w: 181, h: 62 },
];

logos.forEach(({ name, w, h }) => {
  const regex = new RegExp(`<img\\s+src="assets/brand-logos/${name}\\.png"`, "g");
  html = html.replace(
    regex,
    `<img src="assets/brand-logos/${name}.png" width="${w}" height="${h}" loading="lazy" decoding="async"`
  );
});

fs.writeFileSync("review-editable.html", html);
console.log("✅ review-editable.html updated with v1.0.1 image optimizations!");
