// shared/config.js
(() => {
  window.BIZ = window.BIZ || {};

  // 1) default tier if nothing else provided
  if (!window.BIZ.tier) window.BIZ.tier = "starter";

  // 2) allow URL tier via:
  //    ?tier=elite   (preferred)
  //    #tier=elite   (also supported)
  //    #?tier=elite  (supported too)
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

  // If user changes only the hash later, still update tier
  window.addEventListener("hashchange", pickTierFromUrl);
})();
