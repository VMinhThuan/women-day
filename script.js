// Web Audio Chime Sound (không cần file âm thanh ngoài)
let audioCtx = null;
function playSweetChime() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Sweet arpeggio)
    notes.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.08);

      gain.gain.setValueAtTime(0, audioCtx.currentTime + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(audioCtx.currentTime + index * 0.08);
      osc.stop(audioCtx.currentTime + index * 0.08 + 0.65);
    });
  } catch (e) {
    // Audio context not allowed or unsupported - silent fallback
  }
}

// Elements
const giftGate = document.getElementById('gift-gate');
const giftBoxBtn = document.getElementById('gift-box-btn');
const openGiftBtn = document.getElementById('open-gift-btn');
const mainContent = document.getElementById('main-content');
const artPanelBox = document.getElementById('art-panel-box');
const imageModal = document.getElementById('image-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalBackdrop = document.getElementById('modal-backdrop');
const toast = document.getElementById('toast');
const rainBtn = document.getElementById('rain-btn');
const rewatchBtn = document.getElementById('rewatch-btn');

let toastTimer = null;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4200);
}

// Flower Rain Effect
const flowerEmojis = ['🌸', '🌷', '✨', '💖', '🌼', '💐', '🎀'];
function triggerFlowerRain(count = 35) {
  for (let i = 0; i < count; i++) {
    const flower = document.createElement('span');
    flower.className = 'flower-pop';
    flower.textContent = flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)];
    flower.style.left = `${Math.random() * 96 + 2}vw`;
    flower.style.top = `${-20 - Math.random() * 50}px`;
    flower.style.setProperty('--x', `${(Math.random() - 0.5) * 200}px`);
    flower.style.animationDelay = `${Math.random() * 0.55}s`;
    flower.style.animationDuration = `${2.4 + Math.random() * 1.2}s`;
    flower.style.fontSize = `${20 + Math.random() * 16}px`;

    document.body.appendChild(flower);
    setTimeout(() => flower.remove(), 4000);
  }
}

// Open Gift Handler & Gradual Image Reveal
function openGift() {
  playSweetChime();
  if (giftBoxBtn) {
    giftBoxBtn.classList.add('opening');
  }

  // Bung hoa chúc mừng ngay khi mở
  triggerFlowerRain(45);

  setTimeout(() => {
    if (giftGate) {
      giftGate.classList.add('opened');
    }
    if (mainContent) {
      mainContent.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Kích hoạt hiệu ứng mở ảnh từ từ (Gradual Mosaic & Bloom Reveal)
      setTimeout(() => {
        if (artPanelBox) {
          artPanelBox.classList.add('revealed');
        }
      }, 250);
    }
  }, 500);
}

if (giftBoxBtn) giftBoxBtn.addEventListener('click', openGift);
if (openGiftBtn) openGiftBtn.addEventListener('click', openGift);

// Lightbox Modal: Mở và đóng full ảnh
function openFullImageModal() {
  playSweetChime();
  if (imageModal) {
    imageModal.classList.add('active');
    imageModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeFullImageModal() {
  if (imageModal) {
    imageModal.classList.remove('active');
    imageModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

if (artPanelBox) {
  artPanelBox.addEventListener('click', openFullImageModal);
  artPanelBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFullImageModal();
    }
  });
}

if (closeModalBtn) closeModalBtn.addEventListener('click', closeFullImageModal);
if (modalBackdrop) modalBackdrop.addEventListener('click', closeFullImageModal);

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeFullImageModal();
  }
});

// Wish Cards Interactive
document.querySelectorAll('.wish-card').forEach((card) => {
  card.addEventListener('click', () => {
    playSweetChime();
    const msg = card.getAttribute('data-message');
    if (msg) {
      showToast(msg);
      triggerFlowerRain(12);
    }
  });
});

// Rain Button
if (rainBtn) {
  rainBtn.addEventListener('click', () => {
    playSweetChime();
    showToast('Chúc chị Nhi ngày 20/10 luôn tươi vui, rạng ngời và ngập tràn hạnh phúc! 🌸💖');
    triggerFlowerRain(40);
  });
}

// Rewatch Button (Đóng lại để mở quà lại từ đầu)
if (rewatchBtn) {
  rewatchBtn.addEventListener('click', () => {
    closeFullImageModal();
    if (artPanelBox) artPanelBox.classList.remove('revealed');
    if (mainContent) mainContent.classList.add('hidden');
    if (giftBoxBtn) giftBoxBtn.classList.remove('opening');
    if (giftGate) giftGate.classList.remove('opened');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
