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

// =========================================
// HỆ THỐNG THÔNG BÁO BÍ MẬT QUA NTFY.SH/CHINHI-20
// =========================================
const NTFY_TOPIC = 'chinhi-20';

let clientNetwork = '';

// Hàm nhận diện chi tiết loại thiết bị & model
function getDeviceInfo() {
  const ua = navigator.userAgent || '';
  const w = Math.min(window.screen.width, window.screen.height);
  const h = Math.max(window.screen.width, window.screen.height);
  const dpr = window.devicePixelRatio || 1;

  let deviceType = 'Điện thoại';
  let model = 'Không rõ model';

  // 1. Phân loại theo Hệ điều hành & Model
  if (/iPhone/i.test(ua)) {
    deviceType = 'Điện thoại';
    // Dự đoán chính xác model iPhone dựa vào độ phân giải màn hình + devicePixelRatio
    if (w === 440 && h === 956) model = 'iPhone 16 Pro Max';
    else if (w === 402 && h === 874) model = 'iPhone 16 Pro';
    else if (w === 430 && h === 932) model = 'iPhone 14 Pro Max / 15 Plus / 15 Pro Max / 16 Plus';
    else if (w === 393 && h === 852) model = 'iPhone 14 Pro / 15 / 15 Pro / 16';
    else if (w === 428 && h === 926) model = 'iPhone 12 Pro Max / 13 Pro Max / 14 Plus';
    else if (w === 390 && h === 844) model = 'iPhone 12 / 12 Pro / 13 / 13 Pro / 14';
    else if (w === 360 && h === 780) model = 'iPhone 12 mini / 13 mini';
    else if (w === 414 && h === 896) model = (dpr === 3 ? 'iPhone XS Max / 11 Pro Max' : 'iPhone XR / 11');
    else if (w === 375 && h === 812) model = 'iPhone X / XS / 11 Pro';
    else if (w === 414 && h === 736) model = 'iPhone 6+ / 7+ / 8+';
    else if (w === 375 && h === 667) model = 'iPhone 6 / 7 / 8 / SE';
    else if (w === 320 && h === 568) model = 'iPhone 5 / 5s / SE 1';
    else model = 'iPhone (Apple)';
  } else if (/iPad/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua))) {
    deviceType = 'Máy tính bảng';
    model = 'Apple iPad';
  } else if (/Android/i.test(ua)) {
    const isTablet = !/Mobile/i.test(ua) || Math.min(window.screen.width, window.screen.height) >= 600;
    deviceType = isTablet ? 'Máy tính bảng' : 'Điện thoại';

    // Bắt tên model máy Android từ User Agent (vd: SM-S918B, Redmi Note 11, CPH2269...)
    const match = ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build|\))/i);
    if (match && match[1]) {
      model = match[1].trim();
    } else {
      model = 'Thiết bị Android';
    }
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceType = 'Máy tính (Laptop/PC)';
    model = 'MacBook / Mac (macOS)';
  } else if (/Windows/i.test(ua)) {
    deviceType = 'Máy tính (Laptop/PC)';
    model = 'Máy tính Windows';
  } else if (/Linux/i.test(ua)) {
    deviceType = 'Máy tính (Linux)';
    model = 'Linux PC';
  } else {
    deviceType = 'Thiết bị khác';
    model = 'Không xác định';
  }

  // 2. Ứng dụng hoặc trình duyệt đang mở
  let app = 'Trình duyệt web';
  if (/Zalo/i.test(ua)) app = 'Zalo App';
  else if (/FBAN|FBAV|Messenger/i.test(ua)) app = 'Facebook / Messenger';
  else if (/Instagram/i.test(ua)) app = 'Instagram';
  else if (/TikTok/i.test(ua)) app = 'TikTok';
  else if (/CocCoc/i.test(ua)) app = 'Trình duyệt Cốc Cốc';
  else if (/Edg/i.test(ua)) app = 'Microsoft Edge';
  else if (/Chrome/i.test(ua)) app = 'Google Chrome';
  else if (/Safari/i.test(ua)) app = 'Apple Safari';

  return {
    deviceType,
    model,
    app,
    screen: `${window.screen.width}x${window.screen.height}`
  };
}

function notifyMe(action) {
  try {
    const params = new URLSearchParams(window.location.search);
    const isTarget = params.get('to') === 'nhi' || params.has('nhi');
    const isMe = params.has('me') || localStorage.getItem('is_tester') === 'true';

    // Nếu bạn mở link có ?me=1, hệ thống nhớ đây là máy của bạn
    if (params.has('me')) {
      localStorage.setItem('is_tester', 'true');
    }

    const dev = getDeviceInfo();
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let title = '🌸 Có người mở web 20/10';
    let prefix = '👀 ';
    let priority = 3;
    let tags = ['bell', 'cherry_blossom'];

    if (isMe) {
      title = '🛠️ [Thuận Test] Đang mở web';
      prefix = '[Thuận test] ';
      priority = 2;
      tags = ['gear'];
    } else if (isTarget) {
      title = '🎉 CHÍNH XÁC CHỊ NHI ĐÃ MỞ!';
      prefix = '🎯 [ĐÚNG CHỊ NHI] ';
      priority = 4;
      tags = ['tada', 'sparkles', 'heart'];
    }

    const messageLines = [
      `${prefix}${action}`,
      `📱 Thiết bị: ${dev.model} (${dev.deviceType})`,
      `🌐 Ứng dụng: ${dev.app} • Màn hình: ${dev.screen}`,
      `⏰ Lúc: ${time}`
    ];

    if (clientNetwork) {
      messageLines.push(`📍 Vị trí/Mạng: ${clientNetwork}`);
    }

    const message = messageLines.join('\n');

    fetch('https://ntfy.sh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: NTFY_TOPIC,
        title: title,
        message: message,
        priority: priority,
        tags: tags
      })
    }).catch(() => {});
  } catch (e) {
    // Silent fail
  }
}

// Báo ngay khi tải trang web (chờ tối đa 600ms để kịp đính kèm Vị trí/Nhà mạng)
function triggerInitialNotify() {
  let hasNotified = false;
  const doNotify = () => {
    if (hasNotified) return;
    hasNotified = true;
    notifyMe('Vừa bấm mở đường link web');
  };

  fetch('https://ipwho.is/')
    .then(r => r.json())
    .then(data => {
      if (data && data.success) {
        const city = data.city || data.region || '';
        const isp = data.connection?.isp || data.org || '';
        clientNetwork = `${city}${city && isp ? ' • ' : ''}${isp}`.trim();
      }
      doNotify();
    })
    .catch(() => {
      doNotify();
    });

  // Fallback nếu mạng chậm sau 700ms vẫn phát thông báo
  setTimeout(doNotify, 700);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', triggerInitialNotify);
} else {
  triggerInitialNotify();
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
const flowerEmojis = ['🌸', '❀'];
function triggerFlowerRain(count = 30) {
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
  notifyMe('Vừa bấm nút MỞ HỘP QUÀ!');

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
  notifyMe('Vừa bấm phóng to xem FULL ẢNH chân dung!');

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
    const titleEl = card.querySelector('h4');
    const cardTitle = titleEl ? titleEl.textContent.trim() : 'lời chúc';
    notifyMe(`Vừa bấm xem thẻ: "${cardTitle}"`);

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
    notifyMe('Vừa bấm nút thả mưa hoa chúc mừng!');
    showToast('Chúc chị Nhi ngày 20/10 thật vui vẻ và nhận được nhiều quà!');
    triggerFlowerRain(35);
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
