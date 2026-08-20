(() => {
  "use strict";

  const config = window.proposalConfig;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function bindCopy() {
    const values = {
      name: config.personName,
      welcomeEyebrow: config.welcomeEyebrow,
      welcomeTitle: config.welcomeTitle,
      welcomeDescription: config.welcomeDescription,
      startLabel: config.startLabel,
      timelineIntro: config.timelineIntro,
      confessionEnding: config.confessionEnding,
      finalQuestion: config.finalQuestion
    };
    $$('[data-bind]').forEach((node) => {
      const value = values[node.dataset.bind];
      if (value) node.textContent = value;
    });
    document.title = `A small journey for ${config.personName}`;
  }

  function renderTimeline() {
    const timeline = $("#timeline");
    const detail = $("#timelineDetail");
    config.timeline.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "timeline-point";
      button.innerHTML = `<span class="timeline-dot">${index + 1}</span><span class="timeline-year"></span>`;
      $(".timeline-year", button).textContent = item.year;
      button.addEventListener("click", () => {
        $$(".timeline-point", timeline).forEach((point) => point.classList.remove("active"));
        button.classList.add("active");
        detail.textContent = item.text;
        playChime(520 + index * 40, 0.06);
      });
      timeline.append(button);
    });
  }

  function renderReasons() {
    const grid = $("#reasonGrid");
    const template = $("#reasonTemplate");
    config.reasons.forEach((reason, index) => {
      const card = template.content.firstElementChild.cloneNode(true);
      $(".reason-number", card).textContent = String(index + 1).padStart(2, "0");
      $(".reason-title", card).textContent = reason.title;
      $(".reason-detail", card).textContent = reason.detail;
      card.addEventListener("click", () => {
        const opened = card.classList.toggle("open");
        $(".reason-hint", card).textContent = opened ? "a little more" : "tap to unfold";
        if (opened) playChime(470 + index * 35, 0.045);
      });
      grid.append(card);
    });
  }

  const placeholderImage = (caption) => {
    const safeCaption = caption.replace(/[&<>"']/g, "");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#edbdba"/><stop offset=".5" stop-color="#94708d"/><stop offset="1" stop-color="#453751"/></linearGradient></defs><rect width="900" height="620" fill="url(#g)"/><circle cx="720" cy="155" r="170" fill="#ffd9ce" opacity=".22"/><text x="450" y="316" text-anchor="middle" fill="#fff7ee" font-family="Georgia" font-size="38" font-style="italic">${safeCaption}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  function openMemory(memory) {
    const modal = $("#memoryModal");
    $("#modalImage").src = memory.image || placeholderImage(memory.caption);
    $("#modalCaption").textContent = memory.caption;
    if (typeof modal.showModal === "function") modal.showModal();
  }

  function createMemory(memory, index) {
    const card = $("#memoryTemplate").content.firstElementChild.cloneNode(true);
    const image = $(".polaroid-image", card);
    image.style.background = memory.image ? `center / cover no-repeat url("${memory.image}")` : memory.background;
    $(".memory-caption", card).textContent = memory.caption;
    card.style.setProperty("--rotation", `${[-3, 2.2, -1.4, 3][index % 4]}deg`);
    card.addEventListener("click", () => openMemory(memory));
    return card;
  }

  function renderMemories() {
    const wall = $("#memoryWall");
    config.memories.forEach((memory, index) => wall.append(createMemory(memory, index)));
    $("#photoUpload").addEventListener("change", (event) => {
      [...event.target.files].forEach((file, index) => {
        if (!file.type.startsWith("image/")) return;
        const memory = {
          caption: file.name.replace(/\.[^/.]+$/, ""),
          image: URL.createObjectURL(file),
          background: "#80607b"
        };
        wall.append(createMemory(memory, wall.children.length + index));
      });
      event.target.value = "";
    });
  }

  function setupNotebook() {
    const card = $(".notebook-card");
    const open = () => {
      card.classList.toggle("open");
      playChime(560, 0.05);
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  }

  let audioContext;
  let soundEnabled = false;
  let activeAudio = null;
  let currentTrack = "";

  function getAudioContext() {
    if (!audioContext) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (Context) audioContext = new Context();
    }
    if (audioContext?.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function playChime(frequency = 480, volume = 0.04) {
    if (!soundEnabled || prefersReducedMotion) return;
    const context = getAudioContext();
    if (!context) return;
    const gain = context.createGain();
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);
  }

  function fadeAudio(audio, to, duration = 900, stopWhenSilent = false) {
    const start = audio.volume;
    const began = performance.now();
    const tick = (now) => {
      const elapsed = Math.min(1, (now - began) / duration);
      audio.volume = start + (to - start) * elapsed;
      if (elapsed < 1) requestAnimationFrame(tick);
      else if (stopWhenSilent && to === 0) audio.pause();
    };
    requestAnimationFrame(tick);
  }

  function setTrack(track) {
    if (!soundEnabled || track === currentTrack) return;
    currentTrack = track;
    const url = config.music[track];
    if (!url) return;
    const next = new Audio(url);
    next.loop = true;
    next.volume = 0;
    next.play().then(() => {
      if (activeAudio) fadeAudio(activeAudio, 0, 850, true);
      activeAudio = next;
      fadeAudio(next, 0.42, 1000);
    }).catch(() => {
      currentTrack = "";
    });
  }

  function updateSoundButton() {
    const button = $("#soundToggle");
    button.setAttribute("aria-pressed", String(soundEnabled));
    $("#soundLabel").textContent = soundEnabled ? "Sound on" : "Sound off";
  }

  function enableSound() {
    soundEnabled = true;
    getAudioContext();
    updateSoundButton();
    setTrack("welcome");
    playChime(440, 0.045);
  }

  function setupAudio() {
    $("#soundToggle").addEventListener("click", () => {
      if (soundEnabled) {
        soundEnabled = false;
        if (activeAudio) fadeAudio(activeAudio, 0, 350, true);
      } else enableSound();
      updateSoundButton();
    });
  }

  function setupObservers() {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        $$(".milestones a").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${id}`));
        setTrack(entry.target.dataset.track);
      });
    }, { threshold: .53 });
    $$(".scene").forEach((scene) => sectionObserver.observe(scene));

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        $$(".reveal", entry.target).forEach((node) => node.classList.add("in-view"));
        observer.unobserve(entry.target);
      });
    }, { threshold: .25 });
    $$(".reveal-group").forEach((group) => revealObserver.observe(group));

    const confessionObserver = new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting) return;
      $$(".confession-line").forEach((line, index) => setTimeout(() => line.classList.add("visible"), index * 900));
      setTimeout(() => $(".confession-ending").classList.add("visible"), config.confessionLines.length * 900 + 350);
      observer.disconnect();
    }, { threshold: .5 });
    confessionObserver.observe($("#confession"));

    const buildupObserver = new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting) return;
      $$(".build-line").forEach((line, index) => setTimeout(() => line.classList.add("visible"), index * 720));
      setTimeout(() => $(".build-button").classList.add("visible"), 3150);
      observer.disconnect();
    }, { threshold: .6 });
    buildupObserver.observe($("#buildup"));
  }

  function setupConfession() {
    const target = $("#confessionLines");
    config.confessionLines.forEach((line) => {
      const paragraph = document.createElement("p");
      paragraph.className = "confession-line";
      paragraph.textContent = line;
      target.append(paragraph);
    });
  }

  function createConfetti() {
    const colors = ["#ffafbc", "#fff0d6", "#d9b0f6", "#ff718d"];
    for (let index = 0; index < 54; index += 1) {
      const particle = document.createElement("i");
      particle.className = "confetti";
      particle.textContent = index % 3 === 0 ? "♥" : "✦";
      particle.style.setProperty("--x", `${Math.random() * 100}vw`);
      particle.style.setProperty("--drift", `${(Math.random() - .5) * 26}vw`);
      particle.style.setProperty("--delay", `${Math.random() * .45}s`);
      particle.style.setProperty("--duration", `${2.1 + Math.random() * 1.5}s`);
      particle.style.color = colors[index % colors.length];
      document.body.append(particle);
      setTimeout(() => particle.remove(), 4300);
    }
  }

  async function sendAcceptance() {
    if (!config.notification.enabled || !config.notification.endpoint) return { ok: false, skipped: true };
    const payload = {
      event: "proposal_accepted",
      personName: config.personName,
      senderName: config.senderName,
      occurredAt: new Date().toISOString(),
      source: "proposal-site"
    };
    try {
      const response = await fetch(config.notification.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      });
      if (!response.ok) throw new Error("Notification endpoint did not confirm the event.");
      const result = await response.json();
      return { ok: result.emailed === true, recorded: result.recorded === true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  function showResponse(kind, delivery = null) {
    const response = config.responses[kind];
    $("#responseEyebrow").textContent = response.eyebrow;
    $("#responseTitle").textContent = response.title;
    $("#responseText").textContent = response.text;
    const continueButton = $("#continueButton");
    continueButton.classList.toggle("hidden", kind !== "time");
    const status = $("#deliveryStatus");
    status.textContent = delivery === true
      ? "The acceptance was securely recorded and the email was sent."
      : "";
    const layer = $("#responseLayer");
    layer.classList.add("show");
    layer.setAttribute("aria-hidden", "false");
    $("#closeResponse").focus();
  }

  function closeResponse() {
    const layer = $("#responseLayer");
    layer.classList.remove("show");
    layer.setAttribute("aria-hidden", "true");
  }

  function setupAnswers() {
    $("#yesButton").addEventListener("click", async () => {
      if (!soundEnabled) enableSound();
      document.body.classList.add("celebrating");
      createConfetti();
      playChime(660, .08);
      setTimeout(() => playChime(880, .06), 140);
      setTrack("acceptance");
      showResponse("yes");
      const result = await sendAcceptance();
      $("#deliveryStatus").textContent = result.ok
        ? (result.recorded ? "The acceptance was securely recorded and the email was sent." : "The email was sent. Add secure storage to keep an auditable record, too.")
        : "";
    });
    $("#timeButton").addEventListener("click", () => {
      if (!soundEnabled) enableSound();
      playChime(392, .045);
      showResponse("time");
    });
    $("#closeResponse").addEventListener("click", closeResponse);
    $("#responseLayer").addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeResponse();
    });
    $("#continueButton").addEventListener("click", () => {
      closeResponse();
      $("#memories").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  function setupJourneyStart() {
    $("#startJourney").addEventListener("click", () => {
      if (!soundEnabled) enableSound();
      playChime(526, .065);
      $("#beginning").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  function setupTilt() {
    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion) return;
    $$(".reason-card, .notebook-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const box = card.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - .5;
        const y = (event.clientY - box.top) / box.height - .5;
        card.style.transform = `perspective(800px) rotateX(${y * -4}deg) rotateY(${x * 5}deg) translateY(-5px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
    $$(".magnetic").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        const box = button.getBoundingClientRect();
        button.style.transform = `translate(${(event.clientX - (box.left + box.width / 2)) * .12}px, ${(event.clientY - (box.top + box.height / 2)) * .12}px)`;
      });
      button.addEventListener("pointerleave", () => { button.style.transform = ""; });
    });
  }

  function setupBackground() {
    const canvas = $("#constellation");
    const context = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    const points = Array.from({ length: 42 }, () => ({
      x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .00011, vy: (Math.random() - .5) * .00011, r: Math.random() * 1.2 + .25
    }));
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width * ratio; canvas.height = height * ratio;
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      points.forEach((point, index) => {
        point.x += point.vx; point.y += point.vy;
        if (point.x < 0 || point.x > 1) point.vx *= -1;
        if (point.y < 0 || point.y > 1) point.vy *= -1;
        const x = point.x * width; const y = point.y * height;
        context.fillStyle = "rgba(255,225,231,.55)";
        context.beginPath(); context.arc(x, y, point.r, 0, Math.PI * 2); context.fill();
        for (let otherIndex = index + 1; otherIndex < points.length; otherIndex += 1) {
          const other = points[otherIndex]; const dx = x - other.x * width; const dy = y - other.y * height; const distance = Math.hypot(dx, dy);
          if (distance < 105) {
            context.strokeStyle = `rgba(235,174,214,${.1 * (1 - distance / 105)})`;
            context.lineWidth = .5; context.beginPath(); context.moveTo(x, y); context.lineTo(other.x * width, other.y * height); context.stroke();
          }
        }
      });
      if (!prefersReducedMotion) requestAnimationFrame(draw);
    };
    resize(); draw(); window.addEventListener("resize", resize);
    window.addEventListener("pointermove", (event) => {
      const glow = $(".cursor-glow");
      glow.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
      glow.style.opacity = "1";
    }, { passive: true });
    window.addEventListener("pointerdown", (event) => {
      const sparkle = document.createElement("i");
      sparkle.className = "tap-sparkle";
      sparkle.textContent = "✦";
      sparkle.style.left = `${event.clientX}px`; sparkle.style.top = `${event.clientY}px`;
      document.body.append(sparkle);
      setTimeout(() => sparkle.remove(), 850);
      playChime(590, .025);
    });
  }

  function closeModal() { $("#memoryModal").close(); }

  function init() {
    bindCopy();
    renderTimeline();
    renderReasons();
    renderMemories();
    setupNotebook();
    setupConfession();
    setupAudio();
    setupObservers();
    setupAnswers();
    setupJourneyStart();
    setupTilt();
    setupBackground();
    $(".close-modal").addEventListener("click", closeModal);
    $("#memoryModal").addEventListener("click", (event) => { if (event.target === event.currentTarget) closeModal(); });
  }

  init();
})();
