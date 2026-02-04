// shared/shared.js
(() => {
  const $ = (id) => document.getElementById(id);

  // ---------- helpers ----------
  const isPlaceholder = (v) =>
    !v || String(v).trim() === "" || /^REPLACE_/i.test(String(v).trim());

  const normUrl = (u) => {
    if (isPlaceholder(u)) return "";
    const s = String(u).trim();
    if (/^https?:\/\//i.test(s)) return s;
    return "https://" + s.replace(/^\/+/, "");
  };

  const setText = (id, value) => {
    const el = $(id);
    if (el) el.textContent = isPlaceholder(value) ? "" : String(value);
  };

  const disableEl = (el) => {
    if (!el) return;
    el.setAttribute("aria-disabled", "true");
    el.style.opacity = "0.45";
    el.style.pointerEvents = "none";
    if (el.tagName === "A") el.setAttribute("href", "javascript:void(0)");
  };

  // ✅ Force navigation in in-app browsers/webviews (Android, IG, TikTok, etc.)
  const forceNavigate = (href) => {
    try {
      if (!href) return;

      // tel/sms/mailto must use direct navigation
      if (/^(tel:|sms:|mailto:)/i.test(href)) {
        window.location.href = href;
        return;
      }

      // https links: try new tab, then fallback
      if (/^https?:\/\//i.test(href)) {
        const w = window.open(href, "_blank", "noopener");
        if (!w) window.location.href = href; // fallback if popup blocked
        return;
      }

      // everything else
      window.location.href = href;
    } catch (e) {
      // ultimate fallback
      window.location.href = href;
    }
  };

  const enableHref = (id, href) => {
    const el = $(id);
    if (!el) return;

    if (!href) {
      disableEl(el);
      return;
    }

    el.setAttribute("aria-disabled", "false");
    el.style.opacity = "";
    el.style.pointerEvents = "";
    el.setAttribute("href", href);

    // If it's a web link, open in new tab safely (still add forced click)
    if (/^https?:\/\//i.test(href)) {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    } else {
      el.removeAttribute("target");
      el.removeAttribute("rel");
    }

    // ✅ One-time click handler to force navigation
    if (!el.dataset.forcedNav) {
      el.dataset.forcedNav = "1";
      el.addEventListener("click", (e) => {
        const h = el.getAttribute("href") || "";
        if (!h || h === "#" || h.startsWith("javascript:")) return;
        e.preventDefault();
        forceNavigate(h);
      }, { passive: false });
    }
  };

  const buildSmsLink = (digitsOnly, body) => {
    const num = String(digitsOnly || "").replace(/[^\d]/g, "");
    if (!num) return "";
    const msg = isPlaceholder(body) ? "" : String(body || "");
    if (!msg) return `sms:${num}`;

    const ua = navigator.userAgent || "";
    const isiOS = /iPhone|iPad|iPod/i.test(ua);
    const sep = isiOS ? "&" : "?";
    return `sms:${num}${sep}body=${encodeURIComponent(msg)}`;
  };

  // ---------- tier features ----------
  const FEATURES = {
    starter: { booking: true, qr: false, qrDownload: false, eliteCTA: false },
    pro:     { booking: true, qr: true,  qrDownload: true,  eliteCTA: false },
    elite:   { booking: true, qr: true,  qrDownload: true,  eliteCTA: true  },
  };

  const getTier = () => {
    const t = (window.BIZ?.tier || "starter").toString().toLowerCase();
    return t === "pro" || t === "elite" ? t : "starter";
  };

  // ---------- UI apply ----------
  const applyTierUI = () => {
    const tier = getTier();
    const f = FEATURES[tier];

    const chipMain = $("chipMain");
    const tierBadge = $("tierBadge");

    if (chipMain) chipMain.textContent =
      tier === "elite" ? "Elite eCard" :
      tier === "pro"   ? "Pro eCard" :
      "eCard";

    if (tierBadge) tierBadge.textContent = tier.toUpperCase();

    const hint = $("qrHint");
    const row  = $("utilityRow");
    if (hint) hint.style.display = f.qr ? "block" : "none";
    if (row)  row.style.display  = f.qr ? "flex"  : "none";

    const eliteBtn = $("eliteCtaBtn");
    if (eliteBtn) eliteBtn.style.display = f.eliteCTA ? "" : "none";
  };

  const applyCardData = () => {
    const B = window.BIZ || {};
    const tier = getTier();
    const f = FEATURES[tier];

    setText("fullName", B.fullName);
    setText("companyName", B.company);
    setText("companyTag", B.tagline);
    setText("title", B.title);
    setText("phonePretty", B.phonePretty);

    const digits  = String(B.phoneTel || "").replace(/[^\d]/g, "");
    const telHref = digits ? `tel:${digits}` : "";
    const smsHref = buildSmsLink(digits, B.textPrefill);

    enableHref("callBtn", telHref);
    enableHref("textBtn", smsHref);

    const email = isPlaceholder(B.email) ? "" : String(B.email).trim();
    enableHref("emailBtn", email ? `mailto:${email}` : "");

    const emailLink = $("emailLink");
    if (emailLink) {
      if (email) {
        emailLink.textContent = email;
        emailLink.setAttribute("href", `mailto:${email}`);
        emailLink.style.pointerEvents = "";
        emailLink.style.opacity = "";
      } else {
        emailLink.textContent = "";
        disableEl(emailLink);
      }
    }

    const website = normUrl(B.website);
    enableHref("siteBtn", website);

    const siteLink = $("siteLink");
    if (siteLink) {
      if (website) {
        siteLink.textContent = website.replace(/^https?:\/\//i, "");
        siteLink.setAttribute("href", website);
        siteLink.setAttribute("target", "_blank");
        siteLink.setAttribute("rel", "noopener");
        siteLink.style.pointerEvents = "";
        siteLink.style.opacity = "";
      } else {
        siteLink.textContent = "";
        disableEl(siteLink);
      }
    }

    const booking = normUrl(B.bookingLink);
    if (!f.booking) {
      const bookBtn = $("bookBtn");
      if (bookBtn) bookBtn.style.display = "none";
    } else {
      enableHref("bookBtn", booking);
    }

    const eliteBtn = $("eliteCtaBtn");
    const eliteLabelEl = $("eliteCtaLabel");

    const label = isPlaceholder(B.eliteCtaLabel) ? "" : String(B.eliteCtaLabel).trim();
    if (eliteLabelEl) eliteLabelEl.textContent = label || "Elite Bonus";

    const eliteUrl = normUrl(B.eliteCtaUrl);

    if (eliteBtn) {
      if (!f.eliteCTA) {
        eliteBtn.style.display = "none";
      } else {
        if (!eliteUrl) {
          eliteBtn.style.display = "none";
          disableEl(eliteBtn);
        } else {
          eliteBtn.style.display = "";
          enableHref("eliteCtaBtn", eliteUrl);
        }
      }
    }

    const phoneTile = $("phoneTile");
    if (phoneTile) {
      if (telHref) {
        phoneTile.style.pointerEvents = "";
        phoneTile.style.opacity = "";
        phoneTile.onclick = () => forceNavigate(telHref);
      } else {
        disableEl(phoneTile);
      }
    }
  };

  // ---------- sheet ----------
  const overlay = () => $("overlay");
  const sheet = () => $("sheet");
  const sheetBody = () => $("sheetBody");

  const openSheet = () => {
    overlay()?.classList.add("open");
    sheet()?.classList.add("open");
  };
  const closeSheet = () => {
    overlay()?.classList.remove("open");
    sheet()?.classList.remove("open");
    if (sheetBody()) sheetBody().innerHTML = "";
  };

  const wireSheet = () => {
    $("closeSheetBtn")?.addEventListener("click", closeSheet);
    overlay()?.addEventListener("click", closeSheet);
  };

  // ---------- QR (qrserver image) ----------
  const qrImageUrl = () => {
    const url = window.location.href.split("#")[0];
    const data = encodeURIComponent(url);
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${data}`;
  };

  const showQR = () => {
    const body = sheetBody();
    if (!body) return;

    const imgUrl = qrImageUrl();

    body.innerHTML = `
      <div class="qrFrame elite">
        <div class="qrCaption">Scan to open this card</div>
        <img id="qrImg" src="${imgUrl}" alt="QR code" style="width:260px;height:260px;border-radius:14px;background:#fff;padding:10px;">
        <div class="qrUrl">${window.location.href}</div>
      </div>

      <a class="sheetBtn primary" id="qrDownloadLink" href="${imgUrl}" download="qr-code.png">
        Download QR
      </a>
    `;

    openSheet();
  };

  const wireQR = () => {
    $("qrBtn")?.addEventListener("click", showQR);

    $("qrDownloadBtn")?.addEventListener("click", () => {
      showQR();
      setTimeout(() => {
        const a = $("qrDownloadLink");
        if (a) a.click();
      }, 50);
    });
  };

  // ---------- init ----------
  const init = () => {
    applyCardData();
    applyTierUI();
    wireSheet();
    wireQR();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("hashchange", () => {
    applyTierUI();
    applyCardData();
  });
})();
