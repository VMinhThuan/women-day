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

let clientIp = '';
let clientNetwork = '';
let detectedFps = 60;

// Đo tần số quét màn hình (phân biệt dòng Thường 60Hz và dòng Pro 120Hz ProMotion)
function initRefreshRateDetection() {
  try {
    let frames = 0;
    let start = performance.now();
    function step(now) {
      frames++;
      if (frames < 15) {
        requestAnimationFrame(step);
      } else {
        const fps = Math.round((frames * 1000) / (now - start));
        detectedFps = fps > 80 ? 120 : 60;
      }
    }
    requestAnimationFrame(step);
  } catch (e) {}
}
initRefreshRateDetection();

// Đo và cache Safe Area Inset Top 1 lần duy nhất lúc khởi động để không làm đứng màn hình khi bấm
let cachedSafeAreaTop = 0;
function initSafeAreaMeasurement() {
  try {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none;';
    document.body.appendChild(div);
    cachedSafeAreaTop = parseInt(window.getComputedStyle(div).paddingTop, 10) || 0;
    document.body.removeChild(div);
  } catch (e) {
    cachedSafeAreaTop = 0;
  }
}
initSafeAreaMeasurement();

function getSafeAreaTop() {
  return cachedSafeAreaTop;
}

// Nhận diện cụ thể iPhone mấy
function detectSpecificIPhone(w, h, dpr, fps, safeTop) {
  const is120Hz = fps >= 90;
  const isDynamicIsland = safeTop >= 50;

  // iPhone 16 Pro Max (đời mới nhất viền mỏng 6.9")
  if (w === 440 && h === 956) return 'iPhone 16 Pro Max';

  // iPhone 16 Pro (viền mỏng 6.3")
  if (w === 402 && h === 874) return 'iPhone 16 Pro';

  // Màn hình 6.7" Dynamic Island (430 x 932)
  if (w === 430 && h === 932) {
    if (is120Hz) return 'iPhone 14 Pro Max / 15 Pro Max (120Hz)';
    return 'iPhone 15 Plus / 16 Plus (Dynamic Island)';
  }

  // Màn hình 6.1" Dynamic Island (393 x 852)
  if (w === 393 && h === 852) {
    if (is120Hz) return 'iPhone 14 Pro / 15 Pro (120Hz ProMotion)';
    return 'iPhone 15 / iPhone 16 (Dynamic Island)';
  }

  // Màn hình 6.7" Tai thỏ (428 x 926)
  if (w === 428 && h === 926) {
    if (is120Hz) return 'iPhone 13 Pro Max (120Hz ProMotion)';
    return 'iPhone 12 Pro Max / 14 Plus (Tai thỏ 6.7")';
  }

  // Màn hình 6.1" Tai thỏ (390 x 844)
  if (w === 390 && h === 844) {
    if (is120Hz) return 'iPhone 13 Pro (120Hz ProMotion)';
    return 'iPhone 12 / iPhone 13 / iPhone 14 (Tai thỏ 6.1")';
  }

  // Màn hình Mini 5.4" (360 x 780)
  if (w === 360 && h === 780) return 'iPhone 12 mini / 13 mini';

  // Màn hình 414 x 896
  if (w === 414 && h === 896) {
    if (dpr === 3) return 'iPhone 11 Pro Max / XS Max';
    return 'iPhone 11 / iPhone XR (Màn hình 6.1")';
  }

  // Màn hình 375 x 812
  if (w === 375 && h === 812) return 'iPhone 11 Pro / iPhone X / XS';

  // Màn hình 414 x 736
  if (w === 414 && h === 736) return 'iPhone 6 Plus / 7 Plus / 8 Plus';

  // Màn hình 375 x 667
  if (w === 375 && h === 667) return 'iPhone 6 / 7 / 8 / SE (Gen 2-3)';

  // Màn hình 320 x 568
  if (w === 320 && h === 568) return 'iPhone 5 / 5s / SE đời đầu';

  return 'iPhone (Apple iOS)';
}

// Hàm nhận diện chi tiết loại thiết bị & model
function getDeviceInfo() {
  const ua = navigator.userAgent || '';
  const w = Math.min(window.screen.width, window.screen.height);
  const h = Math.max(window.screen.width, window.screen.height);
  const dpr = window.devicePixelRatio || 1;
  const safeTop = getSafeAreaTop();

  let deviceType = 'Điện thoại';
  let model = 'Không rõ model';
  let hardwareDetails = `${w}x${h} @${dpr}x`;

  // 1. Phân loại theo Hệ điều hành & Model
  if (/iPhone/i.test(ua)) {
    deviceType = 'iPhone';
    model = detectSpecificIPhone(w, h, dpr, detectedFps, safeTop);
    hardwareDetails += ` • ${detectedFps}Hz${safeTop >= 50 ? ' • Dynamic Island' : (safeTop >= 40 ? ' • Tai thỏ' : '')}`;
  } else if (/iPad/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua))) {
    deviceType = 'Máy tính bảng';
    model = 'Apple iPad';
  } else if (/Android/i.test(ua)) {
    const isTablet = !/Mobile/i.test(ua) || Math.min(window.screen.width, window.screen.height) >= 600;
    deviceType = isTablet ? 'Máy tính bảng Android' : 'Điện thoại Android';

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
    screen: `${window.screen.width}x${window.screen.height}`,
    hardwareDetails
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
      `🔍 Thông số: ${dev.hardwareDetails}`,
      `🌐 Ứng dụng: ${dev.app} • Màn hình: ${dev.screen}`,
      `⏰ Lúc: ${time}`
    ];

    if (clientIp) {
      messageLines.push(`🌐 Địa chỉ IP: ${clientIp}`);
    }

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

// Báo ngay khi tải trang web (chờ tối đa 600ms để kịp đính kèm IP & Vị trí/Nhà mạng)
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
        clientIp = data.ip || '';
        const city = data.city || data.region || '';
        const isp = data.connection?.isp || data.org || '';
        clientNetwork = `${city}${city && isp ? ' • ' : ''}${isp}`.trim();
      }
      doNotify();
    })
    .catch(() => {
      // Fallback lấy IP nếu ipwho.is gặp sự cố
      fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(d => {
          if (d && d.ip) clientIp = d.ip;
          doNotify();
        })
        .catch(() => doNotify());
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

// Flower Rain Effect (Pinkaholic dreamy mix: hoa đào, nơ hồng, tulip, tim hồng, lấp lánh)
const flowerEmojis = ['🌸', '🎀', '🌷', '💕', '✨', '💐', '🩰'];
function triggerFlowerRain(count = 20) {
  for (let i = 0; i < count; i++) {
    const flower = document.createElement('span');
    flower.className = 'flower-pop';
    flower.textContent = flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)];
    flower.style.left = `${Math.random() * 94 + 3}vw`;
    flower.style.top = `${-20 - Math.random() * 40}px`;
    flower.style.setProperty('--x', `${(Math.random() - 0.5) * 160}px`);
    flower.style.animationDelay = `${Math.random() * 0.4}s`;
    flower.style.animationDuration = `${2.2 + Math.random() * 1.0}s`;
    flower.style.fontSize = `${20 + Math.random() * 14}px`;

    document.body.appendChild(flower);
    setTimeout(() => flower.remove(), 3500);
  }
}

// Open Gift Handler & Gradual Image Reveal
function openGift() {
  playSweetChime();
  notifyMe('Vừa bấm nút MỞ HỘP QUÀ!');

  if (giftBoxBtn) {
    giftBoxBtn.classList.add('opening');
  }

  // Bung hoa chúc mừng mượt mà không giật khung hình
  triggerFlowerRain(20);

  setTimeout(() => {
    if (mainContent) {
      mainContent.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (giftGate) {
      giftGate.classList.add('opened');
    }

    // Khi cổng quà tan ra, kích hoạt ngay hiệu ứng lật 3D từng ô ảnh một cách mượt mà
    setTimeout(() => {
      if (artPanelBox) {
        artPanelBox.classList.add('revealed');
      }
    }, 300);
  }, 380);
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

// =========================================
// HIỆU ỨNG HOA & NƠ HỒNG RƠI KHI CUỘN TRANG (Pinkaholic Scroll Flower Shower)
// =========================================
let lastScrollY = window.scrollY;
let lastScrollSpawnTime = 0;

function createScrollPetal() {
  const flower = document.createElement('span');
  flower.className = 'scroll-petal';
  flower.textContent = flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)];

  // Rơi ngẫu nhiên từ vị trí ngang bất kỳ trên màn hình
  const startX = Math.random() * 92 + 4; // 4vw đến 96vw
  flower.style.left = `${startX}vw`;

  const driftX = (Math.random() - 0.5) * 160; // Gió thổi lượn nhẹ trái/phải
  flower.style.setProperty('--drift-x', `${driftX}px`);
  flower.style.fontSize = `${18 + Math.random() * 12}px`;
  flower.style.animationDuration = `${2.2 + Math.random() * 0.8}s`;

  document.body.appendChild(flower);
  setTimeout(() => flower.remove(), 2800);
}

window.addEventListener('scroll', () => {
  // Chỉ thả hoa khi hộp quà đã mở (đang xem thiệp chính)
  if (giftGate && !giftGate.classList.contains('opened')) return;

  const currentScrollY = window.scrollY;
  const now = performance.now();

  // Chỉ kích hoạt khi cuộn xuống và cách nhau tối thiểu 160ms để mượt 60fps
  if (currentScrollY > lastScrollY && (now - lastScrollSpawnTime > 160)) {
    lastScrollSpawnTime = now;
    createScrollPetal();
    if (Math.random() > 0.45) {
      setTimeout(createScrollPetal, 70);
    }
  }
  lastScrollY = currentScrollY;
}, { passive: true });
