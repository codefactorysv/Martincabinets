(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (!hasGsap || reduce) root.classList.remove("js");

  document.getElementById("yr").textContent = new Date().getFullYear();
  document.getElementById("wo-no").textContent = String(Math.floor(1000 + Math.random() * 8999));

  /* ---------- top bar + mobile dock ---------- */
  const topbar = document.querySelector(".topbar");
  const dock = document.querySelector(".dock");
  const hero = document.querySelector(".hero");
  const estimate = document.getElementById("estimate");
  const onScroll = () => {
    const y = window.scrollY;
    topbar.classList.toggle("is-solid", y > 40);
    const pastHero = y > hero.offsetHeight * 0.6;
    const r = estimate.getBoundingClientRect();
    const inForm = r.top < window.innerHeight && r.bottom > 0;
    dock.classList.toggle("is-on", pastHero && !inForm);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- tape measure ticks ---------- */
  const track = document.querySelector(".tape__track");
  const inch = 48;
  const inches = Math.ceil((innerWidth * 4) / inch);
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= Math.min(inches, 400); i++) {
    const s = document.createElement("span");
    s.textContent = i;
    s.style.left = i * inch + "px";
    if (i % 12 === 0 || i === 25) s.className = "red";
    frag.appendChild(s);
  }
  track.appendChild(frag);

  /* ---------- cut list hover preview (desktop) ---------- */
  const preview = document.querySelector(".cl__preview");
  const pimg = preview.querySelector("img");
  if (matchMedia("(hover: hover) and (min-width: 1001px)").matches) {
    let x = 0, y = 0, cx = 0, cy = 0, raf = null;
    const loop = () => {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      preview.style.left = cx + 24 + "px";
      preview.style.top = cy - 140 + "px";
      raf = requestAnimationFrame(loop);
    };
    document.querySelectorAll(".cl__row").forEach((row) => {
      row.addEventListener("mouseenter", (e) => {
        pimg.src = row.dataset.img;
        x = cx = e.clientX; y = cy = e.clientY;
        preview.classList.add("is-on");
        if (!raf) loop();
      });
      row.addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; });
      row.addEventListener("mouseleave", () => {
        preview.classList.remove("is-on");
        cancelAnimationFrame(raf); raf = null;
      });
    });
  }

  /* ---------- on-site video: play only while visible ---------- */
  const video = document.querySelector(".onsite__video");
  if (video) {
    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      }, { threshold: 0.35 }).observe(video);
    } else {
      video.controls = true;
    }
  }

  /* ---------- estimate form → email ---------- */
  const form = document.getElementById("workorder");
  const msg = form.querySelector(".workorder__msg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    let bad = null;
    ["name", "phone", "service"].forEach((k) => {
      const f = form.elements[k].closest(".field");
      const empty = !String(data[k] || "").trim();
      f.classList.toggle("is-error", empty);
      if (empty && !bad) bad = form.elements[k];
    });
    if (bad) {
      msg.textContent = "Please add your name, phone and the service you need.";
      msg.classList.add("is-error");
      bad.focus();
      return;
    }
    msg.classList.remove("is-error");
    const body = [
      `Name: ${data.name}`,
      `Phone: ${data.phone}`,
      `Email: ${data.email || "-"}`,
      `Service: ${data.service}`,
      "",
      data.details || "",
    ].join("\n");
    const subject = `Estimate request — ${data.service} — ${data.name}`;
    window.location.href =
      `mailto:martincisneros153@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    msg.textContent = "Opening your email app… If nothing happens, call 979-203-4150.";
  });

  if (!hasGsap || reduce) {
    document.querySelector(".drawing").classList.add("is-built");
    return;
  }

  /* ================= GSAP ================= */
  gsap.registerPlugin(ScrollTrigger);

  // Hero: copy in, then the drawing draws itself
  const lines = gsap.utils.toArray(".drawing .ln path");
  const dims = gsap.utils.toArray(".drawing .dim path");
  [...lines, ...dims].forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".hero [data-hero]", { y: 40, opacity: 0, duration: 1, stagger: 0.12 })
    .to(lines, { strokeDashoffset: 0, duration: 1.4, stagger: 0.035, ease: "power2.inOut" }, 0.2)
    .to(dims, { strokeDashoffset: 0, duration: 0.7, stagger: 0.1, ease: "power1.inOut" }, "-=0.5")
    .from(".drawing .dim-txt > *", { opacity: 0, duration: 0.4, stagger: 0.08 }, "-=0.3")
    .add(() => document.querySelector(".drawing").classList.add("is-built"))
    .from(".titleblock", { opacity: 0, y: 10, duration: 0.6 }, "-=0.2");

  // Drawing drifts slightly as you leave the hero
  gsap.to(".drawing svg", {
    yPercent: 10, rotate: -1.5,
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  // Generic reveals
  gsap.utils.toArray(".reveal:not(.plate)").forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  // Years: count up 0 → 25
  const num = document.querySelector(".years__num");
  const counter = { v: 0 };
  gsap.to(counter, {
    v: 25, duration: 1.6, ease: "power2.out",
    onUpdate: () => (num.textContent = Math.round(counter.v)),
    scrollTrigger: { trigger: ".years", start: "top 70%", once: true },
  });

  // Tape measure pulls out while you scroll
  gsap.fromTo(track, { x: 0 }, {
    x: () => -(track.offsetWidth - innerWidth) * 0.6,
    ease: "none",
    scrollTrigger: { trigger: ".years", start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true },
  });

  // Gallery plates drift at different speeds
  const drift = matchMedia("(min-width: 641px)").matches;
  gsap.utils.toArray(".plate").forEach((p, i) => {
    gsap.to(p, { opacity: 1, duration: 1, scrollTrigger: { trigger: p, start: "top 92%", once: true } });
    if (drift) gsap.fromTo(p, { y: i % 2 ? 40 : -10 }, {
      y: i % 2 ? -40 : 30, ease: "none",
      scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
})();
