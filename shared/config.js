// shared/config.js
(() => {
  window.BIZ = window.BIZ || {};

  if (!window.BIZ.tier) window.BIZ.tier = "starter";

  const pickTierFromUrl = () => {
    const fromSearch = new URLSearchParams(window.location.search).get("tier");

    const hash = (window.location.hash || "").replace(/^#/, "");
    const hashClean = hash.startsWith("?") ? hash.slice(1) : hash;
    const fromHash = new URLSearchParams(hashClean).get("tier") || (hash.includes("tier=") ? null : hash);

    const tier = (fromSearch || fromHash || "").toString().trim().toLowerCase();
    if (tier === "starter" || tier === "pro" || tier === "elite") {
      window.BIZ.tier = tier;
    }
  };

  pickTierFromUrl();
  window.addEventListener("hashchange", pickTierFromUrl);
})();
