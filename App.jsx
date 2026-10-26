import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Heart, Calendar, MapPin, Image as ImageIcon, Video, Plus, Trash2, Edit3, 
  Search, Sparkles, Clock, Gift, Bell, X, ChevronLeft, ChevronRight, 
  Camera, Quote, Star, Check, Filter, Play, Pause, Award, Coffee, Plane, Home,
  Lock, KeyRound, Settings, Music, Volume2, VolumeX, SkipForward, SkipBack,
  Upload, MessageCircle, Send, Smile, Type, Bold, Italic, Palette, Snowflake, Flower2,
  Wifi, Users, Copy, RefreshCw
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// ==========================================
// KHỞI TẠO KẾT NỐI ĐÁM MÂY THỜI GIAN THỰC
// ==========================================
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Helper nén ảnh nhẹ để đồng bộ trực tiếp giữa 2 thiết bị theo thời gian thực
const compressImageToDataUrl = (file, maxWidth = 720, quality = 0.65) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(URL.createObjectURL(file));
    reader.readAsDataURL(file);
  });
};

// ==========================================
// DỮ LIỆU MẪU (INITIAL SAMPLE DATA)
// ==========================================
const LOVE_QUOTES = [
  "Yêu không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng.",
  "Giữa hàng tỷ người trên thế giới, thật may mắn vì chúng ta đã tìm thấy nhau.",
  "Mỗi ngày bên em đều là một trang nhật ký đẹp nhất trong cuộc đời anh.",
  "Hạnh phúc không phải là đích đến, mà là hành trình chúng ta nắm tay nhau đi qua.",
  "Cảm ơn vì đã đến và làm cho thế giới của nhau trở nên rực rỡ hơn.",
  "Chẳng cần hứa hẹn trăm năm, chỉ cần mỗi ngày đều yêu nhau như thuở ban đầu.",
  "Nơi bình yên nhất không phải là một địa điểm, mà là ở ngay bên cạnh người mình thương."
];

const TAG_CONFIG = {
  'Hẹn hò đầu tiên': { color: 'bg-pink-100 text-pink-700 border-pink-200', icon: Coffee },
  'Du lịch': { color: 'bg-sky-100 text-sky-700 border-sky-200', icon: Plane },
  'Kỷ niệm năm': { color: 'bg-rose-100 text-rose-800 border-rose-200', icon: Award },
  'Đời thường': { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Home },
  'Quà tặng': { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Gift },
  'Đặc biệt': { color: 'bg-red-100 text-red-700 border-red-200', icon: Sparkles }
};

const INITIAL_COUPLE_DATA = {
  person1: {
    name: "Minh Nhật",
    nickname: "Chàng Trai Tháng 10",
    birthday: "1998-10-15",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
  },
  person2: {
    name: "Hải Yến",
    nickname: "Cô Gái Mùa Thu",
    birthday: "2000-08-22",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80"
  },
  startDate: "2023-02-14T19:30"
};

const DEFAULT_TEXT_STYLE = {
  fontSize: 'base', // 'sm' | 'base' | 'lg' | 'xl'
  color: '#334155',
  bold: false,
  italic: false
};

const INITIAL_MEMORIES = [
  {
    id: 'mem-1',
    date: '2023-02-14',
    title: 'Ngày đầu tiên nắm tay & Lời tỏ tình dưới ánh đèn vàng',
    location: 'Hồ Tây, Hà Nội',
    tag: 'Hẹn hò đầu tiên',
    mood: '🥰 Rung động',
    story: 'Buổi tối Valentine se lạnh, hai đứa đi dạo quanh hồ Tây. Sau bao nhiêu lần ngại ngùng, cuối cùng anh cũng dám nắm lấy bàn tay nhỏ nhắn của em và nói lời thương. Khoảnh khắc ấy thời gian như ngừng trôi.',
    textStyle: { fontSize: 'base', color: '#881337', bold: false, italic: true },
    media: [
      {
        id: 'm1-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80',
        caption: 'Ly cacao nóng ngày đầu hẹn hò'
      },
      {
        id: 'm1-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80',
        caption: 'Nắm tay nhau đi hết con đường'
      }
    ]
  },
  {
    id: 'mem-2',
    date: '2023-07-20',
    title: 'Chuyến du lịch Đà Lạt đầu tiên cùng nhau',
    location: 'Đà Lạt, Lâm Đồng',
    tag: 'Du lịch',
    mood: '✈️ Hào hứng',
    story: 'Chuyến đi xa đầu tiên của hai đứa! Cùng nhau dậy từ 4h sáng đi săn mây ở Cầu Đất, cùng ăn lẩu gà lá é trong tiết trời 16 độ và rong ruổi trên chiếc xe máy khắp các con dốc Đà Lạt.',
    textStyle: { fontSize: 'base', color: '#334155', bold: false, italic: false },
    media: [
      {
        id: 'm2-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        caption: 'Bình minh rực rỡ bên nhau'
      },
      {
        id: 'm2-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=80',
        caption: 'Những bức ảnh kỷ niệm không thể quên'
      },
      {
        id: 'm2-3',
        type: 'video',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        caption: 'Video ngắn ghi lại khoảnh khắc vui nhộn'
      }
    ]
  },
  {
    id: 'mem-3',
    date: '2024-02-14',
    title: 'Kỷ niệm 1 năm ngày yêu nhau (365 Ngày Yêu)',
    location: 'Nhà hàng Skyline, Hà Nội',
    tag: 'Kỷ niệm năm',
    mood: '🥂 Hạnh phúc',
    story: 'Vậy là chúng mình đã đi cùng nhau tròn 1 năm với biết bao kỷ niệm vui buồn. Cảm ơn vì đã luôn kiên nhẫn, lắng nghe và bao dung cho nhau. Chúc cho chặng đường phía trước của hai đứa luôn ngập tràn tiếng cười!',
    textStyle: { fontSize: 'lg', color: '#be123c', bold: true, italic: false },
    media: [
      {
        id: 'm3-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
        caption: 'Bữa tối lãng mạn dưới ánh nến'
      }
    ]
  },
  {
    id: 'mem-4',
    date: '2024-11-10',
    title: 'Cuối tuần bình yên tự nấu ăn tại nhà',
    location: 'Căn bếp nhỏ ấm áp',
    tag: 'Đời thường',
    mood: '🍲 Ấm áp',
    story: 'Chẳng cần đi đâu xa xôi, chỉ cần chiều Chủ nhật cùng nhau đi siêu thị mua đồ, về nấu một bữa thật ngon và cùng xem bộ phim yêu thích. Bình yên chính là đây.',
    textStyle: { fontSize: 'base', color: '#334155', bold: false, italic: false },
    media: [
      {
        id: 'm4-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop&q=80',
        caption: 'Cùng nhau vào bếp trổ tài'
      }
    ]
  }
];

const INITIAL_REMINDERS = [
  {
    id: 'rem-1',
    title: 'Kỷ niệm ngày bắt đầu yêu (Valentine)',
    date: '02-14',
    isRecurringYearly: true,
    priority: 'high',
    category: 'Kỷ niệm',
    giftPlan: 'Đặt bàn nhà hàng lãng mạn, chuẩn bị album ảnh in và hoa hồng đỏ.'
  },
  {
    id: 'rem-2',
    title: 'Sinh nhật Hải Yến (Em yêu)',
    date: '08-22',
    isRecurringYearly: true,
    priority: 'high',
    category: 'Sinh nhật',
    giftPlan: 'Mua túi xách cô ấy thích + Bánh kem dâu tây + Chuyến đi nghỉ dưỡng ngắn ngày.'
  },
  {
    id: 'rem-3',
    title: 'Sinh nhật Minh Nhật (Anh yêu)',
    date: '10-15',
    isRecurringYearly: true,
    priority: 'high',
    category: 'Sinh nhật',
    giftPlan: 'Đồng hồ đeo tay hoặc nước hoa + Tự tay nấu bữa tối bất ngờ.'
  },
  {
    id: 'rem-4',
    title: 'Ngày Quốc tế Phụ nữ 8/3',
    date: '03-08',
    isRecurringYearly: true,
    priority: 'medium',
    category: 'Ngày lễ',
    giftPlan: 'Hoa tươi và son môi màu cam đất.'
  },
  {
    id: 'rem-5',
    title: 'Ngày Phụ nữ Việt Nam 20/10',
    date: '10-20',
    isRecurringYearly: true,
    priority: 'medium',
    category: 'Ngày lễ',
    giftPlan: 'Đưa đi xem phim và ăn đồ nướng Hàn Quốc.'
  }
];

// CÂU HỎI MẬT KHẨU 3 LỚP VUI NHỘN MẶC ĐỊNH (CÓ THỂ TÙY CHỈNH)
const INITIAL_SECURITY_QUESTIONS = [
  {
    id: 'q1',
    question: "Bạn có yêu tôi không? ❤️",
    correctAnswer: "Có",
    suggestions: ["Có", "Rất nhiều 🥰", "Siêu nhiều 💖", "Thương nhất trên đời"]
  },
  {
    id: 'q2',
    question: "Ai là người nóc nhà? 👑",
    correctAnswer: "Em",
    suggestions: ["Em", "Người yêu tớ", "Hải Yến", "Cả hai đứa mình 💕"]
  },
  {
    id: 'q3',
    question: "Mình bên nhau bao lâu? 🥺",
    correctAnswer: "Mãi mãi",
    suggestions: ["Mãi mãi", "Trọn đời 💍", "100 năm nữa", "Luôn bên nhau ✨"]
  }
];

// DANH SÁCH NHẠC NỀN LÃNG MẠN TÍCH HỢP SẴN (DÙNG SYNTHESIZER + TẢI FILE TỪ MÁY)
const BUILTIN_TRACKS = [
  {
    id: 'track-1',
    title: 'Giai Điệu Tình Yêu (Music Box)',
    artist: 'Hộp Nhạc Lãng Mạn',
    type: 'synth',
    tempo: 420,
    notes: [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 587.33, 698.46, 880.0, 698.46, 587.33, 493.88, 587.33, 783.99, 659.25, 523.25]
  },
  {
    id: 'track-2',
    title: 'Bản Tình Ca Mùa Thu (Sweet Piano)',
    artist: 'Piano Ngọt Ngào',
    type: 'synth',
    tempo: 360,
    notes: [440.0, 523.25, 659.25, 880.0, 783.99, 659.25, 523.25, 587.33, 698.46, 880.0, 783.99, 698.46, 659.25, 523.25, 493.88, 440.0]
  },
  {
    id: 'track-3',
    title: 'Đêm Sao Lấp Lánh (Starlight Lullaby)',
    artist: 'Acoustic Hòa Tấu',
    type: 'synth',
    tempo: 480,
    notes: [523.25, 523.25, 783.99, 783.99, 880.0, 880.0, 783.99, 698.46, 698.46, 659.25, 659.25, 587.33, 587.33, 523.25]
  }
];

// TIN NHẮN MẪU TRONG MỤC CHAT ĐÔI LỨA
const INITIAL_CHAT_MESSAGES = [
  {
    id: 'msg-1',
    sender: 'person1',
    text: 'Chào công chúa của anh! Hôm nay mở nhật ký xem lại ảnh Đà Lạt thấy nhớ em quá 🥰',
    timestamp: '09:15',
    textStyle: { fontSize: 'base', color: '#be123c', bold: false, italic: false },
    reactions: ['❤️', '🥰']
  },
  {
    id: 'msg-2',
    sender: 'person2',
    text: 'Hihi em cũng vừa xem xong nè! Cuối tuần này mình đi ăn đồ nướng rồi dạo phố chụp thêm nhiều ảnh mới nha anh 💕',
    timestamp: '09:17',
    textStyle: { fontSize: 'base', color: '#334155', bold: true, italic: false },
    reactions: ['💖']
  },
  {
    id: 'msg-3',
    sender: 'person1',
    text: 'Chốt luôn! Tối thứ 7 anh qua đón em lúc 7h nhé, yêu em nhiều lắm! 🌹',
    timestamp: '09:18',
    textStyle: { fontSize: 'lg', color: '#881337', bold: true, italic: true },
    sticker: '🌹 Tặng hoa cho người thương',
    reactions: ['❤️', '😘']
  }
];

const CHAT_STICKERS = [
  '🥰 Yêu thương ngập tràn',
  '🫂 Ôm một cái thật chặt',
  '😘 Hôn gió ngàn cái',
  '🌹 Tặng hoa cho người đẹp',
  '🧋 Đi uống trà sữa nha',
  '💖 Nhớ lắm luôn á'
];

const PRESET_TEXT_COLORS = [
  { label: 'Đen xám', value: '#334155' },
  { label: 'Đỏ rượu vang', value: '#881337' },
  { label: 'Hồng đậm', value: '#be123c' },
  { label: 'Tím lãng mạn', value: '#7e22ce' },
  { label: 'Xanh biển sâu', value: '#0369a1' },
  { label: 'Nâu ấm', value: '#92400e' }
];

// ==========================================
// COMPONENT THANH CÔNG CỤ ĐỊNH DẠNG CHỮ (TEXT TOOLBAR)
// ==========================================
function TextFormattingToolbar({ styleValue, onChange, compact = false }) {
  const current = styleValue || DEFAULT_TEXT_STYLE;

  const updateField = (key, val) => {
    onChange({ ...current, [key]: val });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 bg-rose-50/90 border border-rose-200/80 rounded-2xl ${compact ? 'p-2' : 'p-2.5'}`}>
      {/* Chọn cỡ chữ */}
      <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-rose-100">
        <Type className="w-3.5 h-3.5 text-rose-500" />
        <select
          value={current.fontSize}
          onChange={(e) => updateField('fontSize', e.target.value)}
          className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
          title="Cỡ chữ"
        >
          <option value="sm">Cỡ nhỏ</option>
          <option value="base">Cỡ vừa</option>
          <option value="lg">Cỡ lớn</option>
          <option value="xl">Rất lớn</option>
        </select>
      </div>

      {/* Nút In Đậm & In Nghiêng */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-rose-100">
        <button
          type="button"
          onClick={() => updateField('bold', !current.bold)}
          className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
            current.bold
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-rose-50'
          }`}
          title="In đậm (Bold)"
        >
          <Bold className="w-3.5 h-3.5" />
          {!compact && <span>Đậm</span>}
        </button>

        <button
          type="button"
          onClick={() => updateField('italic', !current.italic)}
          className={`p-1.5 rounded-lg text-xs italic transition-all flex items-center gap-1 ${
            current.italic
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-rose-50'
          }`}
          title="In nghiêng (Italic)"
        >
          <Italic className="w-3.5 h-3.5" />
          {!compact && <span>Nghiêng</span>}
        </button>
      </div>

      {/* Chọn màu chữ */}
      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-rose-100">
        <Palette className="w-3.5 h-3.5 text-rose-500" />
        <div className="flex items-center gap-1">
          {PRESET_TEXT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => updateField('color', c.value)}
              className={`w-4 h-4 rounded-full border transition-transform ${
                current.color === c.value ? 'scale-125 ring-2 ring-rose-400 border-white' : 'border-slate-200'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
          <input
            type="color"
            value={current.color}
            onChange={(e) => updateField('color', e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 ml-1"
            title="Chọn màu tùy thích"
          />
        </div>
      </div>
    </div>
  );
}

// Helper chuyển đổi textStyle sang class & inline style
function getRenderedTextStyle(styleObj) {
  const st = styleObj || DEFAULT_TEXT_STYLE;
  const sizeMap = {
    sm: 'text-xs sm:text-sm',
    base: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
    xl: 'text-lg sm:text-xl'
  };
  const classes = [
    sizeMap[st.fontSize] || 'text-sm sm:text-base',
    st.bold ? 'font-bold' : 'font-normal',
    st.italic ? 'italic' : 'not-italic'
  ].join(' ');

  return {
    className: classes,
    style: { color: st.color || '#334155' }
  };
}

// ==========================================
// COMPONENT HIỆU ỨNG RƠI TOÀN MÀN HÌNH
// ==========================================
function SceneFallingEffects({ effectType }) {
  const particles = useMemo(() => {
    return Array.from({ length: 26 }).map((_, idx) => ({
      id: idx,
      left: `${(idx * 3.8 + (idx % 3) * 2) % 98}%`,
      duration: `${7 + (idx % 6) * 1.8}s`,
      delay: `${(idx % 7) * 0.9}s`,
      size: 14 + (idx % 4) * 5,
      opacity: 0.55 + (idx % 4) * 0.12
    }));
  }, []);

  if (!effectType || effectType === 'none') return null;

  const getSymbol = (idx) => {
    if (effectType === 'flowers') return idx % 2 === 0 ? '🌸' : '🌺';
    if (effectType === 'hearts') return idx % 3 === 0 ? '💖' : idx % 2 === 0 ? '❤️' : '💕';
    if (effectType === 'snow') return idx % 2 === 0 ? '❄️' : '❅';
    return '';
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      <style>{`
        @keyframes fallDownSway {
          0% {
            transform: translateY(-10vh) translateX(0px) rotate(0deg);
          }
          50% {
            transform: translateY(50vh) translateX(25px) rotate(180deg);
          }
          100% {
            transform: translateY(110vh) translateX(-15px) rotate(360deg);
          }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-40px',
            left: p.left,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            animation: `fallDownSway ${p.duration} linear ${p.delay} infinite`
          }}
        >
          {getSymbol(p.id)}
        </div>
      ))}
    </div>
  );
}

// ==========================================
// COMPONENT CHÍNH (MAIN APP)
// ==========================================
export default function App() {
  // ==========================================
  // 0. STATE ĐỒNG BỘ THỜI GIAN THỰC 2 NGƯỜI (REAL-TIME SYNC)
  // ==========================================
  const [user, setUser] = useState(null);
  const [roomCode, setRoomCode] = useState('MINHNHAT-HAIYEN');
  const [roomInput, setRoomInput] = useState('MINHNHAT-HAIYEN');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncModalTab, setSyncModalTab] = useState('guide'); // 'sync' | 'guide'
  const [syncStatus, setSyncStatus] = useState('connecting'); // 'connecting' | 'connected' | 'error'
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);
  const lastSyncedJsonRef = useRef('');

  // ==========================================
  // 1. STATE MẬT KHẨU VUI NHỘN & QUẢN LÝ CÂU HỎI
  // ==========================================
  const [securityQuestions, setSecurityQuestions] = useState(INITIAL_SECURITY_QUESTIONS);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [passcodeInputs, setPasscodeInputs] = useState(['', '', '']);
  const [lockErrorMsg, setLockErrorMsg] = useState('');
  const [shakeAnimation, setShakeAnimation] = useState(false);

  // Modal cài đặt câu hỏi mật khẩu
  const [isPassSettingsOpen, setIsPassSettingsOpen] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState(securityQuestions);
  const [newSuggestionInputs, setNewSuggestionInputs] = useState(['', '', '']);

  // ==========================================
  // 2. STATE TRÌNH PHÁT NHẠC NỀN LÃNG MẠN
  // ==========================================
  const [tracks, setTracks] = useState(BUILTIN_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);

  const audioElementRef = useRef(null);
  const synthTimerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const noteIdxRef = useRef(0);

  // ==========================================
  // 3. STATE HIỆU ỨNG TRONG APP
  // ==========================================
  const [sceneEffect, setSceneEffect] = useState('hearts'); // 'none' | 'flowers' | 'hearts' | 'snow'

  // ==========================================
  // 4. STATE CẶP ĐÔI, KỶ NIỆM, NHẮC NHỞ & CHAT
  // ==========================================
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'timeline' | 'reminders'
  const [isChatOpen, setIsChatOpen] = useState(false); // Bật/tắt khung chat nổi độc lập không làm mất vị trí đang lướt xem
  const [coupleData, setCoupleData] = useState(INITIAL_COUPLE_DATA);
  const [memories, setMemories] = useState(INITIAL_MEMORIES);
  const [reminders, setReminders] = useState(INITIAL_REMINDERS);
  const [chatMessages, setChatMessages] = useState(INITIAL_CHAT_MESSAGES);

  // Xác thực tài khoản thiết bị để kết nối đám mây
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Auth error:', err);
        setSyncStatus('error');
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Lắng nghe dữ liệu phòng đôi lứa theo thời gian thực (Real-time Listener)
  useEffect(() => {
    if (!user || !roomCode) return;
    setSyncStatus('connecting');
    setIsCloudLoaded(false);

    const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'couple_rooms', roomCode);
    const unsubscribe = onSnapshot(
      roomDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const incomingPayload = {
            securityQuestions: data.securityQuestions || INITIAL_SECURITY_QUESTIONS,
            sceneEffect: data.sceneEffect || 'hearts',
            coupleData: data.coupleData || INITIAL_COUPLE_DATA,
            memories: data.memories || INITIAL_MEMORIES,
            reminders: data.reminders || INITIAL_REMINDERS,
            chatMessages: data.chatMessages || INITIAL_CHAT_MESSAGES
          };
          const incomingJson = JSON.stringify(incomingPayload);
          if (incomingJson !== lastSyncedJsonRef.current) {
            lastSyncedJsonRef.current = incomingJson;
            setSecurityQuestions(incomingPayload.securityQuestions);
            setSceneEffect(incomingPayload.sceneEffect);
            setCoupleData(incomingPayload.coupleData);
            setMemories(incomingPayload.memories);
            setReminders(incomingPayload.reminders);
            setChatMessages(incomingPayload.chatMessages);
          }
          setIsCloudLoaded(true);
          setSyncStatus('connected');
        } else {
          const initialPayload = {
            securityQuestions: INITIAL_SECURITY_QUESTIONS,
            sceneEffect: 'hearts',
            coupleData: INITIAL_COUPLE_DATA,
            memories: INITIAL_MEMORIES,
            reminders: INITIAL_REMINDERS,
            chatMessages: INITIAL_CHAT_MESSAGES
          };
          lastSyncedJsonRef.current = JSON.stringify(initialPayload);
          setDoc(roomDocRef, {
            ...initialPayload,
            updatedAt: Date.now(),
            updatedBy: user.uid
          }).catch((err) => console.error('Init room error:', err));
          setIsCloudLoaded(true);
          setSyncStatus('connected');
        }
      },
      (error) => {
        console.error('Real-time sync error:', error);
        setSyncStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user, roomCode]);

  // Tự động đẩy thay đổi mới lên đám mây ngay khi 1 trong 2 người cập nhật
  useEffect(() => {
    if (!user || !isCloudLoaded || !roomCode) return;
    const currentPayload = {
      securityQuestions,
      sceneEffect,
      coupleData,
      memories,
      reminders,
      chatMessages
    };
    const currentJson = JSON.stringify(currentPayload);
    if (currentJson === lastSyncedJsonRef.current) return;

    lastSyncedJsonRef.current = currentJson;
    const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'couple_rooms', roomCode);
    setDoc(
      roomDocRef,
      {
        ...currentPayload,
        updatedAt: Date.now(),
        updatedBy: user.uid
      },
      { merge: true }
    ).catch((err) => console.error('Sync save error:', err));
  }, [securityQuestions, sceneEffect, coupleData, memories, reminders, chatMessages, user, isCloudLoaded, roomCode]);

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [now, setNow] = useState(new Date());

  // Bộ lọc dòng thời gian
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('Tất cả');
  const [selectedYear, setSelectedYear] = useState('Tất cả');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal chỉnh sửa thông tin cặp đôi
  const [isEditingCouple, setIsEditingCouple] = useState(false);
  const [coupleForm, setCoupleForm] = useState(coupleData);

  // Modal Thêm / Sửa Kỷ niệm (kèm định dạng chữ textStyle)
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState(null);
  const [memoryForm, setMemoryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    location: '',
    tag: 'Hẹn hò đầu tiên',
    mood: '🥰 Hạnh phúc',
    story: '',
    textStyle: { ...DEFAULT_TEXT_STYLE },
    media: []
  });

  // Modal Thêm / Sửa Nhắc nhở
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState(null);
  const [reminderForm, setReminderForm] = useState({
    title: '',
    date: '',
    isRecurringYearly: true,
    priority: 'high',
    category: 'Kỷ niệm',
    giftPlan: ''
  });

  // State cho mục Chat Đôi Lứa
  const [activeChatSender, setActiveChatSender] = useState('person1'); // 'person1' | 'person2'
  const [chatInput, setChatInput] = useState('');
  const [chatTextStyle, setChatTextStyle] = useState({ ...DEFAULT_TEXT_STYLE });
  const [chatImagePreview, setChatImagePreview] = useState(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [isChatBubbleVisible, setIsChatBubbleVisible] = useState(true);
  const chatEndRef = useRef(null);

  // Lightbox phóng to Ảnh / Video
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    mediaList: [],
    currentIndex: 0,
    memoryTitle: ''
  });

  // Xác nhận xóa
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: null,
    id: null,
    title: ''
  });

  // Thông báo Toast
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3200);
  };

  // ==========================================
  // XỬ LÝ PHÁT NHẠC NỀN (WEB AUDIO SYNTH + FILE MP3)
  // ==========================================
  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  const stopAllAudio = () => {
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  };

  const playNote = (freq) => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.15);
    } catch {
      // Ignore Web Audio errors if blocked
    }
  };

  useEffect(() => {
    stopAllAudio();
    if (!isPlayingMusic || !currentTrack) return;

    if (currentTrack.type === 'synth') {
      noteIdxRef.current = 0;
      synthTimerRef.current = setInterval(() => {
        const notes = currentTrack.notes || [523.25];
        const freq = notes[noteIdxRef.current % notes.length];
        playNote(freq);
        noteIdxRef.current += 1;
      }, currentTrack.tempo || 420);
    } else if (currentTrack.type === 'uploaded' && audioElementRef.current) {
      audioElementRef.current.src = currentTrack.url;
      audioElementRef.current.muted = isMuted;
      audioElementRef.current.play().catch(() => {
        setIsPlayingMusic(false);
      });
    }

    return () => stopAllAudio();
  }, [isPlayingMusic, currentTrackIndex, isMuted, tracks]);

  const handleUploadCustomMusic = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const uploadedTracks = files.map((file) => ({
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Nhạc của hai đứa 💕',
      type: 'uploaded',
      url: URL.createObjectURL(file)
    }));

    setTracks((prev) => {
      const updated = [...prev, ...uploadedTracks];
      setCurrentTrackIndex(updated.length - uploadedTracks.length);
      return updated;
    });
    setIsPlayingMusic(true);
    showToast(`Đã thêm ${uploadedTracks.length} bài hát mới và bắt đầu phát! 🎵`);
  };

  // ==========================================
  // XỬ LÝ XÁC THỰC & TÙY CHỈNH MẬT KHẨU 3 LỚP
  // ==========================================
  const handlePasscodeSubmit = (e, overrideAnswer = null) => {
    if (e) e.preventDefault();
    const activeQuestions = securityQuestions.length > 0 ? securityQuestions : INITIAL_SECURITY_QUESTIONS;
    const currentQ = activeQuestions[currentStep] || activeQuestions[0];
    const rawAns = overrideAnswer !== null ? overrideAnswer : (passcodeInputs[currentStep] || '');
    const userAns = rawAns.trim().toLowerCase();

    if (!userAns) {
      setLockErrorMsg('Hãy nhập hoặc chọn một câu trả lời đáng yêu nhé! 🥺');
      return;
    }

    // Hợp lệ nếu khớp với đáp án đúng HOẶC một trong các gợi ý
    const validList = [
      currentQ.correctAnswer,
      ...(currentQ.suggestions || [])
    ]
      .filter(Boolean)
      .map((item) => item.trim().toLowerCase());

    const isValid = validList.some((ans) => userAns === ans || userAns.includes(ans));

    if (isValid) {
      setLockErrorMsg('');
      if (currentStep < activeQuestions.length - 1) {
        setCurrentStep((prev) => prev + 1);
        showToast(`Qua ải lớp ${currentStep + 1} thành công! Tiếp tục nào 💕`);
      } else {
        setIsUnlocked(true);
        showToast('Mở khóa thành công! Chào mừng bạn đến với nhật ký tình yêu ✨');
      }
    } else {
      setShakeAnimation(true);
      setTimeout(() => setShakeAnimation(false), 500);
      setLockErrorMsg(`Chưa đúng mật khẩu tình yêu rồi! Gợi ý đáp án là: "${currentQ.correctAnswer}" nha 😂`);
    }
  };

  const openPasswordSettingsModal = () => {
    setEditingQuestions(JSON.parse(JSON.stringify(securityQuestions)));
    setNewSuggestionInputs(['', '', '']);
    setIsPassSettingsOpen(true);
  };

  const handleSavePasswordSettings = (e) => {
    e.preventDefault();
    const cleaned = editingQuestions
      .filter((q) => q.question.trim() !== '')
      .slice(0, 3)
      .map((q, idx) => ({
        ...q,
        id: `q-${idx + 1}`,
        correctAnswer: q.correctAnswer.trim() || 'Có',
        suggestions: q.suggestions.length > 0 ? q.suggestions : [q.correctAnswer.trim() || 'Có']
      }));

    if (cleaned.length === 0) {
      showToast('Cần ít nhất 1 câu hỏi mật khẩu đáng yêu nhé!');
      return;
    }

    setSecurityQuestions(cleaned);
    setCurrentStep(0);
    setPasscodeInputs(['', '', '']);
    setIsPassSettingsOpen(false);
    showToast('Đã lưu cài đặt câu hỏi mật khẩu mới! 🔑💕');
  };

  // ==========================================
  // ĐỒNG HỒ THỜI GIAN THỰC (REAL-TIME COUNTER)
  // ==========================================
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loveDuration = useMemo(() => {
    const start = new Date(coupleData.startDate);
    if (isNaN(start.getTime())) {
      return { totalDays: 0, years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const diffMs = Math.max(0, now.getTime() - start.getTime());
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();
    let hours = now.getHours() - start.getHours();
    let minutes = now.getMinutes() - start.getMinutes();
    let seconds = now.getSeconds() - start.getSeconds();

    if (seconds < 0) {
      seconds += 60;
      minutes -= 1;
    }
    if (minutes < 0) {
      minutes += 60;
      hours -= 1;
    }
    if (hours < 0) {
      hours += 24;
      days -= 1;
    }
    if (days < 0) {
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
      months -= 1;
    }
    if (months < 0) {
      months += 12;
      years -= 1;
    }

    return {
      totalDays,
      years: Math.max(0, years),
      months: Math.max(0, months),
      days: Math.max(0, days),
      hours: Math.max(0, hours),
      minutes: Math.max(0, minutes),
      seconds: Math.max(0, seconds)
    };
  }, [coupleData.startDate, now]);

  // ==========================================
  // TÍNH TOÁN CÁC MỐC KỶ NIỆM TỰ ĐỘNG & NHẮC NHỞ
  // ==========================================
  const allUpcomingEvents = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(coupleData.startDate);
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());

    const processedReminders = reminders.map((rem) => {
      let targetDate;
      if (rem.isRecurringYearly) {
        const parts = rem.date.split('-');
        const month = parseInt(parts[parts.length - 2], 10) - 1;
        const day = parseInt(parts[parts.length - 1], 10);
        targetDate = new Date(today.getFullYear(), month, day);
        if (targetDate < today) {
          targetDate = new Date(today.getFullYear() + 1, month, day);
        }
      } else {
        const [y, m, d] = rem.date.split('-').map(Number);
        targetDate = new Date(y, m - 1, d);
      }

      const diffTime = targetDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...rem,
        targetDate,
        daysLeft,
        isAutoMilestone: false
      };
    });

    const autoMilestones = [];
    if (!isNaN(startDay.getTime())) {
      const specialDays = [100, 200, 300, 500, 1000, 1500, 2000, 2500, 3000, 5000];
      specialDays.forEach((dCount) => {
        const mDate = new Date(startDay.getTime() + dCount * 24 * 60 * 60 * 1000);
        const diffTime = mDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysLeft >= 0 && daysLeft <= 400) {
          autoMilestones.push({
            id: `auto-days-${dCount}`,
            title: `Kỷ niệm ${dCount} ngày bên nhau`,
            date: mDate.toISOString().split('T')[0],
            targetDate: mDate,
            daysLeft,
            priority: 'high',
            category: 'Cột mốc tự động',
            giftPlan: `Cùng chụp bộ ảnh kỷ niệm cột mốc ${dCount} ngày yêu thương!`,
            isAutoMilestone: true
          });
        }
      });

      const nextYearNum = loveDuration.years + 1;
      const nextAnnivDate = new Date(
        startDay.getFullYear() + nextYearNum,
        startDay.getMonth(),
        startDay.getDate()
      );
      const annivDaysLeft = Math.ceil((nextAnnivDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (annivDaysLeft >= 0) {
        autoMilestones.push({
          id: `auto-year-${nextYearNum}`,
          title: `Kỷ niệm ${nextYearNum} năm ngày yêu nhau`,
          date: nextAnnivDate.toISOString().split('T')[0],
          targetDate: nextAnnivDate,
          daysLeft: annivDaysLeft,
          priority: 'high',
          category: 'Cột mốc tự động',
          giftPlan: `Đánh dấu chặng đường ${nextYearNum} năm gắn bó bên nhau.`,
          isAutoMilestone: true
        });
      }
    }

    return [...processedReminders, ...autoMilestones]
      .filter((item) => item.daysLeft >= -1)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [reminders, coupleData.startDate, now, loveDuration.years]);

  // ==========================================
  // BỘ LỌC DÒNG THỜI GIAN
  // ==========================================
  const availableYears = useMemo(() => {
    const years = new Set(memories.map((m) => m.date.split('-')[0]));
    return ['Tất cả', ...Array.from(years).sort((a, b) => b - a)];
  }, [memories]);

  const filteredMemories = useMemo(() => {
    return memories
      .filter((m) => {
        const matchesSearch =
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.story.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesTag = selectedTag === 'Tất cả' || m.tag === selectedTag;
        const matchesYear = selectedYear === 'Tất cả' || m.date.startsWith(selectedYear);
        return matchesSearch && matchesTag && matchesYear;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [memories, searchQuery, selectedTag, selectedYear, sortOrder]);

  // ==========================================
  // XỬ LÝ TẢI LÊN ẢNH & VIDEO
  // ==========================================
  const handleAvatarUpload = async (personKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await compressImageToDataUrl(file, 400, 0.7);
    setCoupleForm((prev) => ({
      ...prev,
      [personKey]: {
        ...prev[personKey],
        avatar: url
      }
    }));
  };

  const handleMediaFilesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newMediaItems = await Promise.all(
      files.map(async (file) => {
        const isVideo = file.type.startsWith('video/');
        const mediaUrl = isVideo
          ? URL.createObjectURL(file)
          : await compressImageToDataUrl(file, 720, 0.65);
        return {
          id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: isVideo ? 'video' : 'image',
          url: mediaUrl,
          caption: file.name.replace(/\.[^/.]+$/, '')
        };
      })
    );

    setMemoryForm((prev) => ({
      ...prev,
      media: [...prev.media, ...newMediaItems]
    }));
  };

  // ==========================================
  // XỬ LÝ THÊM / SỬA / XÓA KỶ NIỆM & LỜI NHẮC
  // ==========================================
  const openAddMemoryModal = () => {
    setEditingMemoryId(null);
    setMemoryForm({
      date: new Date().toISOString().split('T')[0],
      title: '',
      location: '',
      tag: 'Hẹn hò đầu tiên',
      mood: '🥰 Hạnh phúc',
      story: '',
      textStyle: { ...DEFAULT_TEXT_STYLE },
      media: []
    });
    setIsMemoryModalOpen(true);
  };

  const openEditMemoryModal = (memory) => {
    setEditingMemoryId(memory.id);
    setMemoryForm({
      date: memory.date,
      title: memory.title,
      location: memory.location || '',
      tag: memory.tag || 'Đời thường',
      mood: memory.mood || '🥰 Hạnh phúc',
      story: memory.story || '',
      textStyle: memory.textStyle || { ...DEFAULT_TEXT_STYLE },
      media: memory.media || []
    });
    setIsMemoryModalOpen(true);
  };

  const handleSaveMemory = (e) => {
    e.preventDefault();
    if (!memoryForm.title.trim()) return;

    if (editingMemoryId) {
      setMemories((prev) =>
        prev.map((m) => (m.id === editingMemoryId ? { ...memoryForm, id: editingMemoryId } : m))
      );
      showToast('Đã cập nhật mốc kỷ niệm thành công! 💕');
    } else {
      const newMemory = {
        ...memoryForm,
        id: `mem-${Date.now()}`
      };
      setMemories((prev) => [newMemory, ...prev]);
      showToast('Đã thêm một kỷ niệm ngọt ngào mới! ✨');
    }
    setIsMemoryModalOpen(false);
  };

  const openAddReminderModal = () => {
    setEditingReminderId(null);
    setReminderForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      isRecurringYearly: true,
      priority: 'high',
      category: 'Kỷ niệm',
      giftPlan: ''
    });
    setIsReminderModalOpen(true);
  };

  const openEditReminderModal = (rem) => {
    setEditingReminderId(rem.id);
    let formattedDate = rem.date;
    if (rem.date.length === 5) {
      formattedDate = `${new Date().getFullYear()}-${rem.date}`;
    }
    setReminderForm({
      title: rem.title,
      date: formattedDate,
      isRecurringYearly: rem.isRecurringYearly ?? true,
      priority: rem.priority || 'high',
      category: rem.category || 'Kỷ niệm',
      giftPlan: rem.giftPlan || ''
    });
    setIsReminderModalOpen(true);
  };

  const handleSaveReminder = (e) => {
    e.preventDefault();
    if (!reminderForm.title.trim() || !reminderForm.date) return;

    const normalizedDate = reminderForm.isRecurringYearly
      ? reminderForm.date.slice(-5)
      : reminderForm.date;

    if (editingReminderId) {
      setReminders((prev) =>
        prev.map((r) =>
          r.id === editingReminderId ? { ...reminderForm, date: normalizedDate, id: editingReminderId } : r
        )
      );
      showToast('Đã cập nhật lời nhắc ngày quan trọng! 🔔');
    } else {
      setReminders((prev) => [
        ...prev,
        {
          ...reminderForm,
          date: normalizedDate,
          id: `rem-${Date.now()}`
        }
      ]);
      showToast('Đã thêm ngày quan trọng mới! 🎁');
    }
    setIsReminderModalOpen(false);
  };

  // ==========================================
  // XỬ LÝ MỤC CHAT ĐÔI LỨA
  // ==========================================
  useEffect(() => {
    if (isChatOpen && chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [isChatOpen]);

  const handleSendChatMessage = (e, customSticker = null) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() && !chatImagePreview && !customSticker) return;

    const timeStr = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: activeChatSender,
      text: chatInput.trim(),
      timestamp: timeStr,
      textStyle: { ...chatTextStyle },
      imageUrl: chatImagePreview,
      sticker: customSticker,
      reactions: []
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    setChatImagePreview(null);
    setShowStickerPicker(false);

    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollTo({
          top: chatEndRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 80);
  };

  const toggleMessageReaction = (msgId, emoji) => {
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const exists = (m.reactions || []).includes(emoji);
        const updated = exists
          ? m.reactions.filter((r) => r !== emoji)
          : [...(m.reactions || []), emoji];
        return { ...m, reactions: updated };
      })
    );
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.type === 'memory') {
      setMemories((prev) => prev.filter((m) => m.id !== deleteConfirm.id));
      showToast('Đã xóa mốc kỷ niệm.');
    } else if (deleteConfirm.type === 'reminder') {
      setReminders((prev) => prev.filter((r) => r.id !== deleteConfirm.id));
      showToast('Đã xóa lời nhắc sự kiện.');
    } else if (deleteConfirm.type === 'chat') {
      setChatMessages((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
      showToast('Đã xóa tin nhắn.');
    }
    setDeleteConfirm({ isOpen: false, type: null, id: null, title: '' });
  };

  const formatVNDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 2) {
      return `Ngày ${parts[1]} tháng ${parts[0]} hàng năm`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `Ngày ${String(d.getDate()).padStart(2, '0')} tháng ${String(d.getMonth() + 1).padStart(2, '0')}, ${d.getFullYear()}`;
  };

  const getDayMilestoneBadge = (memoryDateStr) => {
    const start = new Date(coupleData.startDate);
    const memDate = new Date(memoryDateStr);
    if (isNaN(start.getTime()) || isNaN(memDate.getTime())) return null;
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const targetDay = new Date(memDate.getFullYear(), memDate.getMonth(), memDate.getDate());
    const diffDays = Math.floor((targetDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays <= 0) return `Trước ngày yêu (${Math.abs(diffDays - 1)} ngày)`;
    return `Ngày thứ ${diffDays.toLocaleString('vi-VN')} bên nhau`;
  };

  // ==========================================
  // MODAL CÀI ĐẶT CÂU HỎI MẬT KHẨU (DÙNG CHUNG)
  // ==========================================
  const renderPasswordSettingsModal = () => {
    if (!isPassSettingsOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-rose-100 my-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-rose-100">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-rose-600" />
                <span>Tùy Chỉnh Câu Hỏi Mật Khẩu Đáng Yêu</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cả hai bạn đều có thể đổi câu hỏi (tối đa 3 lớp) và thêm các gợi ý trả lời ngọt ngào
              </p>
            </div>
            <button
              onClick={() => setIsPassSettingsOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSavePasswordSettings} className="space-y-5 mt-5">
            {editingQuestions.map((q, qIdx) => (
              <div
                key={q.id || qIdx}
                className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 border border-rose-200/70 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-white px-3 py-1 rounded-full border border-rose-200">
                    Lớp câu hỏi {qIdx + 1} / {editingQuestions.length}
                  </span>

                  {editingQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingQuestions((prev) => prev.filter((_, idx) => idx !== qIdx))
                      }
                      className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-full flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa lớp này
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nội dung câu hỏi *
                  </label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingQuestions((prev) => {
                        const copy = [...prev];
                        copy[qIdx] = { ...copy[qIdx], question: val };
                        return copy;
                      });
                    }}
                    placeholder="VD: Bạn có yêu tớ không?"
                    className="w-full px-3.5 py-2 rounded-xl border border-rose-200 bg-white text-sm focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Câu trả lời chính xác *
                  </label>
                  <input
                    type="text"
                    value={q.correctAnswer}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingQuestions((prev) => {
                        const copy = [...prev];
                        copy[qIdx] = { ...copy[qIdx], correctAnswer: val };
                        return copy;
                      });
                    }}
                    placeholder="VD: Có"
                    className="w-full px-3.5 py-2 rounded-xl border border-rose-200 bg-white text-sm focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                {/* Quản lý các nút gợi ý câu trả lời */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Các nhãn gợi ý câu trả lời (Bấm vào là chọn luôn khi đăng nhập)
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(q.suggestions || []).map((sug, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1.5 bg-white text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {sug}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestions((prev) => {
                              const copy = [...prev];
                              copy[qIdx] = {
                                ...copy[qIdx],
                                suggestions: copy[qIdx].suggestions.filter((_, i) => i !== sIdx)
                              };
                              return copy;
                            });
                          }}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSuggestionInputs[qIdx] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewSuggestionInputs((prev) => {
                          const copy = [...prev];
                          copy[qIdx] = val;
                          return copy;
                        });
                      }}
                      placeholder="Thêm gợi ý mới (VD: Rất nhiều 🥰)..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-xs focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const text = (newSuggestionInputs[qIdx] || '').trim();
                        if (!text) return;
                        setEditingQuestions((prev) => {
                          const copy = [...prev];
                          copy[qIdx] = {
                            ...copy[qIdx],
                            suggestions: [...(copy[qIdx].suggestions || []), text]
                          };
                          return copy;
                        });
                        setNewSuggestionInputs((prev) => {
                          const copy = [...prev];
                          copy[qIdx] = '';
                          return copy;
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-semibold"
                    >
                      + Thêm gợi ý
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {editingQuestions.length < 3 && (
              <button
                type="button"
                onClick={() =>
                  setEditingQuestions((prev) => [
                    ...prev,
                    {
                      id: `q-${Date.now()}`,
                      question: 'Hôm nay có nhớ tớ không? 🥺',
                      correctAnswer: 'Nhớ lắm',
                      suggestions: ['Nhớ lắm', 'Luôn luôn nhớ 💕', 'Nhớ ơi là nhớ']
                    }
                  ])
                }
                className="w-full py-2.5 rounded-2xl border-2 border-dashed border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm lớp câu hỏi mới (Tối đa 3 lớp)</span>
              </button>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-rose-100">
              <button
                type="button"
                onClick={() => setIsPassSettingsOpen(false)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md hover:from-rose-700 hover:to-pink-700"
              >
                Lưu câu hỏi mật khẩu
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ==========================================
  // MODAL KẾT NỐI 2 NGƯỜI & HƯỚNG DẪN CÀI ĐẶT CHI TIẾT
  // ==========================================
  const renderSyncAndGuideModal = () => {
    if (!isSyncModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-rose-100 my-8 max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-rose-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Cài Đặt & Kết Nối 2 Người
                </h3>
                <p className="text-xs text-emerald-600 font-medium">
                  {syncStatus === 'connected'
                    ? '● Đang đồng bộ đám mây trực tuyến tức thì'
                    : '● Đang kết nối máy chủ...'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Thanh chuyển Tab giữa Hướng dẫn cài đặt & Mã phòng */}
          <div className="grid grid-cols-2 gap-2 bg-rose-50 p-1.5 rounded-2xl border border-rose-100 mt-4">
            <button
              type="button"
              onClick={() => setSyncModalTab('guide')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                syncModalTab === 'guide'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:bg-rose-100/60'
              }`}
            >
              📲 1. Cách cài đặt ra điện thoại
            </button>
            <button
              type="button"
              onClick={() => setSyncModalTab('sync')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                syncModalTab === 'sync'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:bg-rose-100/60'
              }`}
            >
              🔗 2. Nhập Mã Phòng 2 người
            </button>
          </div>

          {syncModalTab === 'guide' ? (
            <div className="space-y-4 mt-5 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {/* Bước 1 */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shrink-0">
                    1
                  </span>
                  <span>Lấy Link ứng dụng gửi cho người yêu</span>
                </div>
                <p className="text-xs text-slate-600 pl-8">
                  Ở góc trên cùng bên phải của khung xem ứng dụng này (trên giao diện Gemini), bạn bấm vào biểu tượng <strong>Chia sẻ (Share)</strong> ➔ chọn <strong>Tạo liên kết công khai (Create public link)</strong> rồi gửi link đó qua Zalo / Messenger cho người ấy.
                </p>
              </div>

              {/* Bước 2 */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sky-900 text-sm">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs shrink-0">
                    2
                  </span>
                  <span>Cài ra màn hình chính điện thoại (Như App thật)</span>
                </div>
                <div className="pl-8 space-y-2 text-xs text-slate-600">
                  <p>
                    🍎 <strong>Trên iPhone (Safari):</strong> Mở link vừa tạo bằng trình duyệt Safari ➔ Bấm nút <strong>Chia sẻ</strong> (biểu tượng hình vuông có mũi tên hướng lên ở thanh dưới cùng) ➔ Kéo xuống chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>.
                  </p>
                  <p>
                    🤖 <strong>Trên Android (Chrome):</strong> Mở link bằng Chrome ➔ Bấm biểu tượng <strong>3 dấu chấm dọc</strong> (góc trên bên phải) ➔ Chọn <strong>"Thêm vào màn hình chính"</strong> hoặc <strong>"Cài đặt ứng dụng"</strong>.
                  </p>
                </div>
              </div>

              {/* Bước 3 */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0">
                    3
                  </span>
                  <span>Nhập chung Mã Phòng để đồng bộ thời gian thực</span>
                </div>
                <p className="text-xs text-slate-600 pl-8">
                  Cả hai cùng mở app trên máy của mình ➔ Chuyển sang tab <strong>"🔗 2. Nhập Mã Phòng 2 người"</strong> ngay bên cạnh ➔ Nhập chung một mã phòng (VD: <code className="font-bold text-emerald-700">{roomCode}</code>) và chọn đúng tên của mình. Mọi tin nhắn, ảnh kỷ niệm sẽ tự động đồng bộ tức thì!
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSyncModalTab('sync')}
                  className="w-full py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-md flex items-center justify-center gap-2"
                >
                  <span>Tiếp theo: Thiết lập Mã Phòng 2 người</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 mt-5">
              {/* Chọn bạn là ai trên thiết bị này */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                  Bước A: Bạn đang dùng máy này với tư cách là ai?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'person1', data: coupleData.person1 },
                    { key: 'person2', data: coupleData.person2 }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setActiveChatSender(item.key);
                        showToast(`Đã chọn vai trò: ${item.data.name} 💕`);
                      }}
                      className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left transition-all ${
                        activeChatSender === item.key
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                          : 'bg-white text-slate-700 border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      <img
                        src={item.data.avatar}
                        alt={item.data.name}
                        className="w-9 h-9 rounded-full object-cover border-2 border-white shrink-0"
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{item.data.name}</p>
                        <p
                          className={`text-[10px] truncate ${
                            activeChatSender === item.key ? 'text-rose-100' : 'text-slate-400'
                          }`}
                        >
                          {activeChatSender === item.key ? 'Đang chọn trên máy này' : 'Nhấn để chọn'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mã phòng đôi lứa */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const cleanCode = roomInput.trim().toUpperCase().replace(/\s+/g, '-');
                  if (!cleanCode) return;
                  setRoomCode(cleanCode);
                  setRoomInput(cleanCode);
                  setIsSyncModalOpen(false);
                  showToast(`Đã kết nối vào phòng: ${cleanCode} ✨`);
                }}
                className="space-y-3"
              >
                <label className="block text-xs font-bold uppercase text-slate-600">
                  Bước B: Mã Phòng Yêu Thương (2 máy nhập giống hệt nhau)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                    placeholder="VD: NHAT-YEN-1402"
                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-rose-200 font-bold text-rose-700 text-sm tracking-wider uppercase focus:outline-none focus:border-rose-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(roomCode);
                      showToast(`Đã sao chép mã phòng: ${roomCode} 📋`);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 shrink-0"
                    title="Sao chép mã phòng"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Sao chép</span>
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-500 flex items-center justify-between gap-2">
                  <span className="truncate">
                    ID thiết bị: <strong className="text-slate-700 font-mono">{user?.uid || 'Đang cấp...'}</strong>
                  </span>
                  <span className="text-emerald-600 font-semibold shrink-0">● Đồng bộ đám mây</span>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-rose-100">
                  <button
                    type="button"
                    onClick={() => setIsSyncModalOpen(false)}
                    className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-md flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Lưu & Vào Phòng Này</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // GIAO DIỆN MÀN HÌNH KHÓA BẢO MẬT (TỐI ĐA 3 LỚP)
  // ==========================================
  if (!isUnlocked) {
    const activeQuestions = securityQuestions.length > 0 ? securityQuestions : INITIAL_SECURITY_QUESTIONS;
    const safeStep = Math.min(currentStep, activeQuestions.length - 1);
    const currentQ = activeQuestions[safeStep];

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fff0f3] via-[#fdf2f4] to-[#fce4ec] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Hiệu ứng rơi cả ở màn hình khóa */}
        <SceneFallingEffects effectType={sceneEffect} />

        {/* Audio ẩn */}
        <audio ref={audioElementRef} onEnded={() => setCurrentTrackIndex((i) => (i + 1) % tracks.length)} />

        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-rose-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
            <Heart className="w-5 h-5 text-rose-300 fill-rose-300" />
            <span className="font-medium text-sm">{toast}</span>
          </div>
        )}

        <div className={`w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-rose-100 relative z-10 transition-transform ${shakeAnimation ? 'animate-bounce' : ''}`}>
          {/* Thanh nút Hướng dẫn cài đặt & Đổi câu hỏi mật khẩu ngay trên màn hình khóa */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setSyncModalTab('guide');
                setIsSyncModalOpen(true);
              }}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-emerald-200/80 transition-colors"
              title="Xem hướng dẫn cài đặt ra điện thoại và kết nối 2 máy"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Cách cài & Dùng 2 máy</span>
            </button>

            <button
              type="button"
              onClick={openPasswordSettingsModal}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full flex items-center gap-1 border border-rose-200/70 transition-colors"
              title="Thay đổi câu hỏi và câu trả lời"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Đổi câu hỏi</span>
            </button>
          </div>

          <div className="text-center mb-6 pt-1">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-200 mb-3">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-rose-800 to-pink-600 bg-clip-text text-transparent">
              Mật Khẩu Tình Yêu
            </h2>
            <p className="text-xs text-rose-500 font-medium mt-1">
              Không gian ngọt ngào của {coupleData.person1.name} & {coupleData.person2.name}
            </p>
          </div>

          {/* Tiến trình các lớp câu hỏi */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {activeQuestions.map((_, stepIdx) => (
              <div key={stepIdx} className="flex items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    safeStep > stepIdx
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                      : safeStep === stepIdx
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-200 scale-110 ring-4 ring-rose-100'
                      : 'bg-rose-100 text-rose-400'
                  }`}
                >
                  {safeStep > stepIdx ? <Check className="w-4 h-4" /> : stepIdx + 1}
                </div>
                {stepIdx < activeQuestions.length - 1 && (
                  <div
                    className={`w-10 h-1 rounded-full mx-1 ${
                      safeStep > stepIdx ? 'bg-emerald-400' : 'bg-rose-100'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form trả lời mật khẩu */}
          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div className="bg-rose-50/75 border border-rose-100 rounded-2xl p-4 text-center">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-rose-500 bg-white px-3 py-0.5 rounded-full border border-rose-200/60 mb-2">
                Lớp câu hỏi {safeStep + 1} / {activeQuestions.length}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                {currentQ.question}
              </h3>
              <p className="text-xs text-rose-500 font-medium mt-1">
                💡 Đáp án gợi ý: "{currentQ.correctAnswer}"
              </p>
            </div>

            <div>
              <input
                type="text"
                autoFocus
                placeholder="Nhập câu trả lời hoặc bấm gợi ý bên dưới..."
                value={passcodeInputs[safeStep] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setPasscodeInputs((prev) => {
                    const copy = [...prev];
                    copy[safeStep] = val;
                    return copy;
                  });
                }}
                className="w-full px-4 py-3 rounded-2xl border-2 border-rose-200 bg-white text-center font-semibold text-slate-800 text-sm focus:outline-none focus:border-rose-600 transition-all shadow-inner"
              />
            </div>

            {/* Danh sách các nhãn gợi ý câu trả lời có thể bấm chọn ngay */}
            {currentQ.suggestions && currentQ.suggestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] text-center text-slate-500 font-medium">
                  ✨ Gợi ý câu trả lời (chạm nhẹ để chọn):
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {currentQ.suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPasscodeInputs((prev) => {
                          const copy = [...prev];
                          copy[safeStep] = sug;
                          return copy;
                        });
                        handlePasscodeSubmit(null, sug);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-xs font-semibold transition-all shadow-sm active:scale-95"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {lockErrorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs text-center py-2.5 px-4 rounded-xl font-medium">
                {lockErrorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-sm shadow-lg shadow-rose-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <span>Xác nhận yêu thương</span>
              <Heart className="w-4 h-4 fill-white" />
            </button>
          </form>
        </div>

        {renderPasswordSettingsModal()}
        {renderSyncAndGuideModal()}
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN CHÍNH CỦA ỨNG DỤNG (SAU KHI MỞ KHÓA)
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f7] via-[#fdfbf7] to-[#fceef2] text-slate-800 font-sans selection:bg-rose-200 selection:text-rose-900 pb-24">
      {/* Thẻ Audio ẩn cho các file nhạc tải lên */}
      <audio
        ref={audioElementRef}
        onEnded={() => setCurrentTrackIndex((prev) => (prev + 1) % tracks.length)}
      />

      {/* Hiệu ứng rơi toàn màn hình (Hoa rơi / Tim rơi / Tuyết rơi / Không hiệu ứng) */}
      <SceneFallingEffects effectType={sceneEffect} />

      {/* Hiệu ứng trang trí nền */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-pink-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl" />
      </div>

      {/* Thông báo Toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 bg-rose-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <Heart className="w-5 h-5 text-rose-300 fill-rose-300" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      {/* ==========================================
          THANH ĐIỀU HƯỚNG (HEADER)
      ========================================== */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-rose-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Tên cặp đôi */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-md shadow-rose-200">
              <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-rose-800 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                Hành Trình Yêu Thương
              </h1>
              <p className="text-xs text-rose-400 font-medium">
                {coupleData.person1.name} & {coupleData.person2.name}
              </p>
            </div>
          </div>

          {/* Menu chuyển chế độ xem */}
          <div className="flex items-center bg-rose-50/90 p-1 rounded-full border border-rose-100 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'all'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:bg-rose-100/60'
              }`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                activeTab === 'timeline'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:bg-rose-100/60'
              }`}
            >
              <span>Chặng đường yêu</span>
              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full text-[10px]">
                {memories.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                activeTab === 'reminders'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:bg-rose-100/60'
              }`}
            >
              <span>Ngày quan trọng</span>
              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full text-[10px]">
                {allUpcomingEvents.length}
              </span>
            </button>
            <button
              onClick={() => {
                setIsChatOpen((prev) => !prev);
                setIsChatBubbleVisible(true);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                isChatOpen
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:bg-rose-100/60'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Nhắn Tin Đôi Lứa</span>
              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full text-[10px]">
                {chatMessages.length}
              </span>
            </button>
          </div>

          {/* Cụm công cụ: Kết nối 2 người, Hiệu ứng, Âm nhạc, Đổi mật khẩu, Khóa & Thêm kỷ niệm */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 0. Nút Kết Nối 2 Người & Hướng dẫn cài đặt */}
            <button
              onClick={() => {
                setRoomInput(roomCode);
                setSyncModalTab('guide');
                setIsSyncModalOpen(true);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                syncStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title="Xem hướng dẫn cài đặt và Mã Phòng để 2 người dùng chung"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  syncStatus === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                }`}
              />
              <Users className="w-3.5 h-3.5" />
              <span>Cài đặt & Kết nối 2 máy</span>
            </button>

            {/* 1. Chọn Hiệu ứng rơi */}
            <div className="flex items-center bg-rose-50 border border-rose-200 rounded-full px-2.5 py-1.5 text-xs font-medium text-rose-700">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-rose-500" />
              <select
                value={sceneEffect}
                onChange={(e) => {
                  setSceneEffect(e.target.value);
                  const names = {
                    none: 'Đã tắt hiệu ứng rơi',
                    flowers: 'Đã bật hiệu ứng Hoa rơi 🌸',
                    hearts: 'Đã bật hiệu ứng Trái tim rơi 💖',
                    snow: 'Đã bật hiệu ứng Tuyết rơi ❄️'
                  };
                  showToast(names[e.target.value]);
                }}
                className="bg-transparent focus:outline-none cursor-pointer font-semibold text-xs"
                title="Chọn hiệu ứng khung cảnh"
              >
                <option value="none">✨ Không hiệu ứng</option>
                <option value="flowers">🌸 Hoa rơi</option>
                <option value="hearts">💖 Trái tim rơi</option>
                <option value="snow">❄️ Tuyết rơi</option>
              </select>
            </div>

            {/* 2. Nút mở Trình phát nhạc nền */}
            <button
              onClick={() => setIsMusicModalOpen(true)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                isPlayingMusic
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
              title="Trình phát nhạc tình yêu"
            >
              <Music className={`w-3.5 h-3.5 ${isPlayingMusic ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline max-w-[110px] truncate">
                {isPlayingMusic ? currentTrack.title : 'Nhạc nền'}
              </span>
            </button>

            {/* 3. Nút Đổi mật khẩu & Khóa màn hình */}
            <button
              onClick={openPasswordSettingsModal}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
              title="Đổi câu hỏi mật khẩu và câu trả lời"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đổi mật khẩu</span>
            </button>

            <button
              onClick={() => {
                setIsUnlocked(false);
                setCurrentStep(0);
                setPasscodeInputs(['', '', '']);
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
              title="Khóa màn hình ngay"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Khóa</span>
            </button>

            <button
              onClick={openAddMemoryModal}
              className="bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white text-xs font-semibold px-3.5 py-2 rounded-full shadow-md shadow-rose-200 flex items-center gap-1 transition-transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Kỷ Niệm</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-10">
        {/* ==========================================
            1. BỘ ĐẾM THỜI GIAN YÊU (LOVE COUNTER HERO)
        ========================================== */}
        <section className="relative rounded-3xl bg-white/85 backdrop-blur-xl border border-rose-100 shadow-xl shadow-rose-100/50 overflow-hidden p-6 sm:p-10">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-rose-400 via-pink-500 to-rose-700" />
          <button
            onClick={() => {
              setCoupleForm(coupleData);
              setIsEditingCouple(true);
            }}
            className="absolute top-5 right-5 text-xs font-medium text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-full flex items-center gap-1.5 border border-rose-200/60 transition-colors"
            title="Chỉnh sửa thông tin 2 người"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Chỉnh sửa hồ sơ</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4 lg:pt-0">
            <div className="lg:col-span-5 flex items-center justify-center gap-4 sm:gap-6">
              <div className="flex flex-col items-center text-center group">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-rose-500 to-pink-300 shadow-lg">
                    <img
                      src={coupleData.person1.avatar}
                      alt={coupleData.person1.name}
                      className="w-full h-full object-cover rounded-full border-2 border-white"
                    />
                  </div>
                  <span className="absolute -bottom-1 right-1 bg-white text-rose-600 p-1.5 rounded-full shadow border border-rose-100">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h3 className="mt-3 font-bold text-base sm:text-lg text-slate-800">
                  {coupleData.person1.name}
                </h3>
                <p className="text-xs text-rose-500 font-medium">{coupleData.person1.nickname}</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center w-14 h-14">
                  <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-20" />
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-200">
                    <Heart className="w-6 h-6 text-white fill-white animate-pulse" />
                  </div>
                </div>
                <div className="mt-2 h-0.5 w-12 bg-gradient-to-r from-transparent via-rose-300 to-transparent" />
                <span className="text-[11px] text-rose-400 font-semibold tracking-wider uppercase mt-1">
                  Mãi bên nhau
                </span>
              </div>

              <div className="flex flex-col items-center text-center group">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-pink-500 to-rose-300 shadow-lg">
                    <img
                      src={coupleData.person2.avatar}
                      alt={coupleData.person2.name}
                      className="w-full h-full object-cover rounded-full border-2 border-white"
                    />
                  </div>
                  <span className="absolute -bottom-1 right-1 bg-white text-pink-600 p-1.5 rounded-full shadow border border-pink-100">
                    <Heart className="w-3.5 h-3.5 fill-pink-500" />
                  </span>
                </div>
                <h3 className="mt-3 font-bold text-base sm:text-lg text-slate-800">
                  {coupleData.person2.name}
                </h3>
                <p className="text-xs text-pink-500 font-medium">{coupleData.person2.nickname}</p>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left border-t lg:border-t-0 lg:border-l border-rose-100 pt-6 lg:pt-0 lg:pl-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-rose-700 text-xs font-semibold mb-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Bắt đầu yêu từ: {formatVNDate(coupleData.startDate.split('T')[0])}</span>
              </div>

              <div className="flex items-baseline gap-3 my-1">
                <span className="text-4xl sm:text-6xl font-extrabold bg-gradient-to-r from-rose-700 via-rose-600 to-pink-500 bg-clip-text text-transparent tracking-tight">
                  {loveDuration.totalDays.toLocaleString('vi-VN')}
                </span>
                <span className="text-lg sm:text-2xl font-bold text-rose-800">
                  Ngày Yêu Thương
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 w-full mt-4">
                {[
                  { label: 'Năm', value: loveDuration.years },
                  { label: 'Tháng', value: loveDuration.months },
                  { label: 'Ngày', value: loveDuration.days },
                  { label: 'Giờ', value: String(loveDuration.hours).padStart(2, '0') },
                  { label: 'Phút', value: String(loveDuration.minutes).padStart(2, '0') },
                  { label: 'Giây', value: String(loveDuration.seconds).padStart(2, '0'), highlight: true }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-3 text-center border transition-all ${
                      item.highlight
                        ? 'bg-gradient-to-b from-rose-600 to-pink-600 text-white border-rose-600 shadow-md shadow-rose-200'
                        : 'bg-rose-50/70 border-rose-100 text-slate-800'
                    }`}
                  >
                    <div className="text-xl sm:text-2xl font-bold tabular-nums">{item.value}</div>
                    <div
                      className={`text-[11px] font-medium uppercase tracking-wider mt-0.5 ${
                        item.highlight ? 'text-rose-100' : 'text-rose-500'
                      }`}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              <div
                onClick={() => setQuoteIndex((prev) => (prev + 1) % LOVE_QUOTES.length)}
                className="mt-5 w-full bg-gradient-to-r from-rose-50/80 to-pink-50/50 border border-rose-100/80 rounded-2xl p-3.5 flex items-start gap-3 cursor-pointer hover:border-rose-200 transition-all group"
                title="Nhấn để đổi câu trích dẫn khác"
              >
                <Quote className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm italic text-slate-600 flex-1">
                  "{LOVE_QUOTES[quoteIndex]}"
                </p>
                <span className="text-[11px] text-rose-400 group-hover:text-rose-600 shrink-0 self-center">
                  Đổi câu ✨
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            2. CHẶNG ĐƯỜNG YÊU & NHẮC NHỞ NGÀY QUAN TRỌNG (LUÔN GIỮ VỊ TRÍ CUỘN)
        ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {(activeTab === 'all' || activeTab === 'timeline') && (
            <div className={activeTab === 'timeline' ? 'lg:col-span-12' : 'lg:col-span-8'}>
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-sm mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                      <Sparkles className="w-6 h-6 text-rose-500" />
                      <span>Chặng Đường Yêu Thương</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Mỗi mốc thời gian được nối liền bằng sợi dây kỷ niệm của hai đứa
                    </p>
                  </div>

                  <button
                    onClick={openAddMemoryModal}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Viết thêm kỷ niệm</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6 relative">
                    <Search className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên kỷ niệm, câu chuyện, địa điểm..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-rose-50/50 border border-rose-100 text-sm focus:outline-none focus:border-rose-400 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-rose-50/50 border border-rose-100 text-sm text-slate-700 focus:outline-none focus:border-rose-400"
                    >
                      {availableYears.map((y) => (
                        <option key={y} value={y}>
                          {y === 'Tất cả' ? '📅 Tất cả các năm' : `Năm ${y}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-rose-50/50 border border-rose-100 text-sm text-slate-700 focus:outline-none focus:border-rose-400"
                    >
                      <option value="desc">⏳ Mới nhất trước</option>
                      <option value="asc">🌱 Từ ngày đầu tiên</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-4 no-scrollbar">
                  {['Tất cả', ...Object.keys(TAG_CONFIG)].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        selectedTag === tag
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMemories.length === 0 ? (
                <div className="bg-white/80 rounded-3xl p-12 text-center border border-dashed border-rose-200">
                  <Heart className="w-12 h-12 text-rose-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-700">Chưa tìm thấy mốc kỷ niệm nào</h3>
                  <p className="text-sm text-slate-500 mt-1 mb-5">
                    Hãy thêm hình ảnh, video và câu chuyện để lưu giữ khoảnh khắc của hai bạn nhé!
                  </p>
                  <button
                    onClick={openAddMemoryModal}
                    className="bg-rose-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow hover:bg-rose-700 transition-colors"
                  >
                    + Thêm mốc kỷ niệm đầu tiên
                  </button>
                </div>
              ) : (
                <div className="relative pl-6 sm:pl-10 space-y-10 before:content-[''] before:absolute before:top-6 before:bottom-6 before:left-[15px] sm:before:left-[23px] before:w-0.5 before:border-l-2 before:border-dashed before:border-rose-300">
                  {filteredMemories.map((memory) => {
                    const tagInfo = TAG_CONFIG[memory.tag] || TAG_CONFIG['Đặc biệt'];
                    const TagIcon = tagInfo.icon;
                    const milestoneBadge = getDayMilestoneBadge(memory.date);
                    const storyRender = getRenderedTextStyle(memory.textStyle);

                    return (
                      <div key={memory.id} className="relative group">
                        <svg
                          className="absolute -left-6 sm:-left-10 top-6 w-6 sm:w-10 h-6 text-rose-300 pointer-events-none"
                          viewBox="0 0 40 24"
                          fill="none"
                        >
                          <path
                            d="M 4 12 C 18 12, 22 12, 40 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray="4 3"
                          />
                        </svg>

                        <div className="absolute -left-[22px] sm:-left-[30px] top-3.5 w-8 h-8 rounded-full bg-white border-2 border-rose-400 shadow-md flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-500 group-hover:border-rose-500 transition-all z-10">
                          <Heart className="w-4 h-4 text-rose-500 fill-rose-500 group-hover:text-white group-hover:fill-white transition-colors" />
                        </div>

                        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-rose-100 shadow-md hover:shadow-xl hover:border-rose-200 transition-all">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 px-3.5 py-1 rounded-full border border-rose-200/60">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatVNDate(memory.date)}
                              </span>

                              {milestoneBadge && (
                                <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/70 px-3 py-1 rounded-full">
                                  ✨ {milestoneBadge}
                                </span>
                              )}

                              <span
                                className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full border ${tagInfo.color}`}
                              >
                                <TagIcon className="w-3 h-3" />
                                {memory.tag}
                              </span>

                              {memory.mood && (
                                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                                  {memory.mood}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditMemoryModal(memory)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                                title="Chỉnh sửa kỷ niệm"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    isOpen: true,
                                    type: 'memory',
                                    id: memory.id,
                                    title: memory.title
                                  })
                                }
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Xóa kỷ niệm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <h3 className="text-lg sm:text-xl font-bold text-slate-800 leading-snug">
                            {memory.title}
                          </h3>

                          {memory.location && (
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-rose-500 font-medium mt-1.5">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span>{memory.location}</span>
                            </div>
                          )}

                          {/* Hiển thị phần ghi chú với định dạng chữ đã chọn (cỡ chữ, màu chữ, in đậm, in nghiêng) */}
                          {memory.story && (
                            <p
                              className={`mt-3 leading-relaxed whitespace-pre-line bg-rose-50/40 p-4 rounded-2xl border border-rose-100/60 ${storyRender.className}`}
                              style={storyRender.style}
                            >
                              {memory.story}
                            </p>
                          )}

                          {memory.media && memory.media.length > 0 && (
                            <div
                              className={`mt-4 grid gap-3 ${
                                memory.media.length === 1
                                  ? 'grid-cols-1'
                                  : memory.media.length === 2
                                  ? 'grid-cols-1 sm:grid-cols-2'
                                  : 'grid-cols-2 sm:grid-cols-3'
                              }`}
                            >
                              {memory.media.map((item, mIdx) => (
                                <div
                                  key={item.id || mIdx}
                                  onClick={() =>
                                    setLightbox({
                                      isOpen: true,
                                      mediaList: memory.media,
                                      currentIndex: mIdx,
                                      memoryTitle: memory.title
                                    })
                                  }
                                  className="group/media relative rounded-2xl overflow-hidden bg-slate-100 border border-rose-100 cursor-pointer aspect-[4/3]"
                                >
                                  {item.type === 'video' ? (
                                    <div className="w-full h-full relative">
                                      <video
                                        src={item.url}
                                        className="w-full h-full object-cover"
                                        muted
                                        playsInline
                                      />
                                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/media:bg-black/40 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow-lg">
                                          <Play className="w-5 h-5 fill-rose-600 ml-0.5" />
                                        </div>
                                      </div>
                                      <span className="absolute top-2.5 left-2.5 bg-black/60 text-white text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <Video className="w-3 h-3" /> Video
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="w-full h-full relative">
                                      <img
                                        src={item.url}
                                        alt={item.caption || memory.title}
                                        className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-500"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity flex items-end p-3">
                                        <p className="text-white text-xs font-medium truncate">
                                          {item.caption || 'Nhấn để phóng to'}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="relative pl-2 pt-2">
                    <div className="absolute -left-[20px] sm:-left-[28px] top-2 w-7 h-7 rounded-full bg-rose-100 border-2 border-rose-400 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-rose-500 italic">
                      Và hành trình yêu thương của chúng mình vẫn đang tiếp tục được viết thêm mỗi ngày...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CỘT NHẮC NHỞ CÁC NGÀY QUAN TRỌNG */}
          {(activeTab === 'all' || activeTab === 'reminders') && (
            <div className={activeTab === 'reminders' ? 'lg:col-span-12' : 'lg:col-span-4'}>
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-sm sticky top-20">
                <div className="flex items-center justify-between gap-2 mb-5">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-rose-500" />
                      <span>Ngày Quan Trọng</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đếm ngược các dịp kỷ niệm & sinh nhật sắp tới
                    </p>
                  </div>

                  <button
                    onClick={openAddReminderModal}
                    className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                    title="Thêm ngày quan trọng"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3.5 max-h-[680px] overflow-y-auto pr-1">
                  {allUpcomingEvents.map((ev) => {
                    const isToday = ev.daysLeft === 0;
                    const isSoon = ev.daysLeft > 0 && ev.daysLeft <= 14;

                    return (
                      <div
                        key={ev.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isToday
                            ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-600 shadow-lg shadow-rose-200'
                            : isSoon
                            ? 'bg-rose-50/90 border-rose-200'
                            : 'bg-white border-rose-100 hover:border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                  isToday
                                    ? 'bg-white/20 text-white'
                                    : ev.isAutoMilestone
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {ev.category}
                              </span>
                              {ev.priority === 'high' && !isToday && (
                                <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                  ★ Quan trọng
                                </span>
                              )}
                            </div>

                            <h4
                              className={`font-bold text-sm sm:text-base mt-1.5 ${
                                isToday ? 'text-white' : 'text-slate-800'
                              }`}
                            >
                              {ev.title}
                            </h4>

                            <p
                              className={`text-xs mt-0.5 flex items-center gap-1 ${
                                isToday ? 'text-rose-100' : 'text-slate-500'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{formatVNDate(ev.date)}</span>
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <div
                              className={`inline-flex flex-col items-center justify-center px-3 py-1.5 rounded-xl font-bold ${
                                isToday
                                  ? 'bg-white text-rose-600'
                                  : isSoon
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}
                            >
                              {isToday ? (
                                <span className="text-xs">Hôm nay! 🎉</span>
                              ) : (
                                <>
                                  <span className="text-base leading-none">{ev.daysLeft}</span>
                                  <span className="text-[10px] font-medium opacity-80">ngày nữa</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {ev.giftPlan && (
                          <div
                            className={`mt-3 pt-2.5 border-t text-xs flex items-start gap-2 ${
                              isToday
                                ? 'border-white/20 text-rose-50'
                                : 'border-rose-100/80 text-slate-600'
                            }`}
                          >
                            <Gift className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                            <span>{ev.giftPlan}</span>
                          </div>
                        )}

                        {!ev.isAutoMilestone && (
                          <div className="mt-2.5 flex justify-end gap-1">
                            <button
                              onClick={() => openEditReminderModal(ev)}
                              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                                isToday
                                  ? 'text-white/80 hover:bg-white/10'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  isOpen: true,
                                  type: 'reminder',
                                  id: ev.id,
                                  title: ev.title
                                })
                              }
                              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                                isToday
                                  ? 'text-white/80 hover:bg-white/10'
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ==========================================
          CỬA SỔ NHẮN TIN ĐÔI LỨA NỔI (KHÔNG ẢNH HƯỞNG VỊ TRÍ ĐANG XEM)
      ========================================== */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-3 sm:right-6 z-40 w-[calc(100vw-1.5rem)] sm:w-[480px] md:w-[540px] max-h-[82vh] flex flex-col bg-white/95 backdrop-blur-xl rounded-3xl border border-rose-200 shadow-2xl overflow-hidden animate-fadeIn">
          {/* Header phòng chat kèm nút ✕ Ẩn chat */}
          <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500 p-3.5 sm:p-4 text-white flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2">
                <img
                  src={coupleData.person1.avatar}
                  alt={coupleData.person1.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white"
                />
                <img
                  src={coupleData.person2.avatar}
                  alt={coupleData.person2.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white"
                />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                  <span>Góc Nhắn Tin Riêng Tư</span>
                  <Heart className="w-3.5 h-3.5 fill-white" />
                </h2>
                <p className="text-[11px] text-rose-100">
                  {coupleData.person1.name} & {coupleData.person2.name}
                </p>
              </div>
            </div>

            {/* Cụm chuyển đổi vai người nhắn & Nút ✕ Ẩn chat */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-white/15 p-1 rounded-full border border-white/20">
                <button
                  type="button"
                  onClick={() => setActiveChatSender('person1')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                    activeChatSender === 'person1'
                      ? 'bg-white text-rose-600 shadow'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <img src={coupleData.person1.avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                  <span>{coupleData.person1.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChatSender('person2')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                    activeChatSender === 'person2'
                      ? 'bg-white text-rose-600 shadow'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <img src={coupleData.person2.avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                  <span>{coupleData.person2.name}</span>
                </button>
              </div>

              {/* Nút Tắt / Ẩn khung chat khỏi màn hình */}
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="bg-white/20 hover:bg-white text-white hover:text-rose-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 border border-white/30 transition-all shadow-sm active:scale-95"
                title="Đóng và ẩn khung trò chuyện (giữ nguyên vị trí đang xem)"
              >
                <X className="w-3.5 h-3.5" />
                <span>Ẩn chat</span>
              </button>
            </div>
          </div>

          {/* Danh sách tin nhắn */}
          <div
            ref={chatEndRef}
            className="p-4 flex-1 overflow-y-auto space-y-3.5 bg-gradient-to-b from-rose-50/40 to-white min-h-[260px] max-h-[380px]"
          >
            {chatMessages.map((msg) => {
              const isPerson1 = msg.sender === 'person1';
              const senderProfile = isPerson1 ? coupleData.person1 : coupleData.person2;
              const formatted = getRenderedTextStyle(msg.textStyle);

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isPerson1 ? 'justify-start' : 'justify-end'}`}
                >
                  {isPerson1 && (
                    <img
                      src={senderProfile.avatar}
                      alt={senderProfile.name}
                      className="w-7 h-7 rounded-full object-cover border border-rose-200 shrink-0"
                    />
                  )}

                  <div className="max-w-[78%] group relative">
                    <div className={`text-[10px] text-slate-400 mb-0.5 px-1 ${isPerson1 ? 'text-left' : 'text-right'}`}>
                      <span className="font-semibold text-rose-500">{senderProfile.name}</span> • {msg.timestamp}
                    </div>

                    <div
                      className={`rounded-2xl p-3 shadow-sm border ${
                        isPerson1
                          ? 'bg-white border-rose-100 rounded-bl-none'
                          : 'bg-rose-50/90 border-rose-200 rounded-br-none'
                      }`}
                    >
                      {msg.sticker && (
                        <div className="inline-block bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-1.5 shadow-sm">
                          {msg.sticker}
                        </div>
                      )}

                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Chat attachment"
                          className="rounded-xl max-h-44 object-cover mb-2 border border-rose-100"
                        />
                      )}

                      {msg.text && (
                        <p className={`whitespace-pre-line leading-relaxed ${formatted.className}`} style={formatted.style}>
                          {msg.text}
                        </p>
                      )}
                    </div>

                    {/* Thanh thả cảm xúc & xóa tin nhắn */}
                    <div className={`flex items-center gap-1 mt-1 ${isPerson1 ? 'justify-start' : 'justify-end'}`}>
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex items-center gap-0.5 bg-white border border-rose-100 px-2 py-0.5 rounded-full shadow-xs text-xs">
                          {msg.reactions.map((r, i) => (
                            <span key={i}>{r}</span>
                          ))}
                        </div>
                      )}

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-full border border-rose-100 text-xs">
                        {['❤️', '🥰', '😘', '😂'].map((emo) => (
                          <button
                            key={emo}
                            type="button"
                            onClick={() => toggleMessageReaction(msg.id, emo)}
                            className="hover:scale-125 transition-transform"
                          >
                            {emo}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirm({
                              isOpen: true,
                              type: 'chat',
                              id: msg.id,
                              title: msg.text || 'tin nhắn này'
                            })
                          }
                          className="text-slate-400 hover:text-red-500 ml-1"
                          title="Xóa tin nhắn"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {!isPerson1 && (
                    <img
                      src={senderProfile.avatar}
                      alt={senderProfile.name}
                      className="w-7 h-7 rounded-full object-cover border border-rose-200 shrink-0"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Khu vực soạn tin nhắn + Tùy chỉnh cỡ chữ, màu chữ, in đậm, in nghiêng */}
          <div className="p-3 bg-white border-t border-rose-100 space-y-2.5 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <TextFormattingToolbar
                styleValue={chatTextStyle}
                onChange={setChatTextStyle}
                compact
              />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStickerPicker((prev) => !prev)}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1"
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>Nhãn dán</span>
                </button>

                {showStickerPicker && (
                  <div className="absolute bottom-10 right-0 z-20 bg-white rounded-2xl p-2.5 shadow-xl border border-rose-100 w-60 grid grid-cols-1 gap-1">
                    {CHAT_STICKERS.map((stk, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendChatMessage(null, stk)}
                        className="text-left px-3 py-1.5 rounded-xl hover:bg-rose-50 text-xs font-semibold text-rose-700 transition-colors"
                      >
                        {stk}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {chatImagePreview && (
              <div className="relative inline-block">
                <img
                  src={chatImagePreview}
                  alt="Preview"
                  className="h-16 rounded-xl object-cover border border-rose-200"
                />
                <button
                  type="button"
                  onClick={() => setChatImagePreview(null)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <form onSubmit={(e) => handleSendChatMessage(e)} className="flex items-center gap-2">
              <label className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer transition-colors shrink-0" title="Đính kèm ảnh">
                <ImageIcon className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const compressed = await compressImageToDataUrl(f, 600, 0.65);
                      setChatImagePreview(compressed);
                    }
                  }}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Nhắn với tư cách ${
                  activeChatSender === 'person1' ? coupleData.person1.name : coupleData.person2.name
                }...`}
                style={{
                  color: chatTextStyle.color,
                  fontWeight: chatTextStyle.bold ? 'bold' : 'normal',
                  fontStyle: chatTextStyle.italic ? 'italic' : 'normal'
                }}
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-rose-50/50 border border-rose-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:bg-white"
              />

              <button
                type="submit"
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-1 shrink-0"
              >
                <span>Gửi</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          NÚT NỔI GÓC DƯỚI: NHẠC NỀN MINI & CHAT NHANH (CÓ NÚT TẮT ẨN ĐI)
      ========================================== */}
      <div className="fixed bottom-5 right-5 z-30 flex items-center gap-3">
        {/* Đĩa nhạc xoay mini */}
        <button
          onClick={() => setIsPlayingMusic((prev) => !prev)}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all ${
            isPlayingMusic
              ? 'bg-gradient-to-tr from-rose-600 to-pink-500 text-white animate-spin'
              : 'bg-white text-rose-600 hover:bg-rose-50'
          }`}
          title={isPlayingMusic ? 'Tạm dừng nhạc nền' : 'Phát nhạc nền lãng mạn'}
        >
          <Music className="w-5 h-5" />
        </button>

        {/* Nút mở nhanh mục Chat kèm nút ✕ nhỏ để ẩn hẳn khỏi màn hình khi không dùng */}
        {!isChatOpen && isChatBubbleVisible && (
          <div className="relative group flex items-center">
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white pl-4 pr-8 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-xs sm:text-sm border-2 border-white transition-transform active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Nhắn tin ({chatMessages.length})</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsChatBubbleVisible(false);
                showToast('Đã ẩn bong bóng chat ở góc màn hình!');
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-rose-800/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow"
              title="Tắt / Ẩn nút nhắn tin nổi khỏi màn hình"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL TRÌNH PHÁT NHẠC NỀN LÃNG MẠN
      ========================================== */}
      {isMusicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Music className="w-5 h-5 text-rose-600" />
                <span>Giai Điệu Tình Yêu</span>
              </h3>
              <button
                onClick={() => setIsMusicModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Đĩa than xoay tròn */}
            <div className="my-6 flex flex-col items-center text-center">
              <div
                className={`w-28 h-28 rounded-full bg-gradient-to-tr from-slate-900 via-slate-800 to-rose-900 p-3 shadow-xl flex items-center justify-center border-4 border-rose-200 ${
                  isPlayingMusic ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '6s' }}
              >
                <div className="w-10 h-10 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white fill-white" />
                </div>
              </div>

              <h4 className="mt-4 font-bold text-base text-slate-800">{currentTrack.title}</h4>
              <p className="text-xs text-rose-500 font-medium">{currentTrack.artist}</p>

              {/* Điều khiển Play / Pause / Next / Prev */}
              <div className="flex items-center gap-4 mt-5">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length)
                  }
                  className="p-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsPlayingMusic((prev) => !prev)}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-rose-200 hover:scale-105 transition-transform"
                >
                  {isPlayingMusic ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTrackIndex((prev) => (prev + 1) % tracks.length)}
                  className="p-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
                  title="Tắt / Bật tiếng"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Danh sách bài hát & tải nhạc từ máy */}
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1 mb-4">
              {tracks.map((t, idx) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlayingMusic(true);
                  }}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    currentTrackIndex === idx
                      ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                      : 'bg-white border-rose-100 hover:bg-rose-50/40 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Music className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-400">{t.artist}</p>
                    </div>
                  </div>
                  {currentTrackIndex === idx && isPlayingMusic && (
                    <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full">
                      Đang phát
                    </span>
                  )}
                </div>
              ))}
            </div>

            <label className="w-full py-3 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/60 hover:bg-rose-100/60 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Thêm bài hát yêu thích từ máy (.mp3, .wav...)</span>
              <input
                type="file"
                accept="audio/*"
                multiple
                onChange={handleUploadCustomMusic}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Modal đổi câu hỏi mật khẩu */}
      {renderPasswordSettingsModal()}

      {/* Modal Hướng dẫn cài đặt & Kết nối 2 người thời gian thực */}
      {renderSyncAndGuideModal()}

      {/* Modal thiết lập thông tin cặp đôi */}
      {isEditingCouple && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span>Thiết Lập Thông Tin Cặp Đôi</span>
              </h3>
              <button
                onClick={() => setIsEditingCouple(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setCoupleData(coupleForm);
                setIsEditingCouple(false);
                showToast('Đã lưu thông tin cặp đôi! 💑');
              }}
              className="space-y-5 mt-5"
            >
              <div>
                <label className="block text-xs font-bold uppercase text-rose-700 mb-1.5">
                  Ngày & Giờ bắt đầu yêu nhau
                </label>
                <input
                  type="datetime-local"
                  value={coupleForm.startDate}
                  onChange={(e) => setCoupleForm({ ...coupleForm, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-rose-200 focus:outline-none focus:border-rose-500 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['person1', 'person2'].map((key, idx) => (
                  <div key={key} className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={coupleForm[key].avatar}
                        alt="avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                      />
                      <label className="cursor-pointer text-xs font-semibold text-rose-600 bg-white px-3 py-1.5 rounded-full border border-rose-200 hover:bg-rose-50">
                        Đổi ảnh
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAvatarUpload(key, e)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Tên người thứ {idx + 1}
                      </label>
                      <input
                        type="text"
                        value={coupleForm[key].name}
                        onChange={(e) =>
                          setCoupleForm({
                            ...coupleForm,
                            [key]: { ...coupleForm[key], name: e.target.value }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-rose-200 text-sm bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Biệt danh đáng yêu
                      </label>
                      <input
                        type="text"
                        value={coupleForm[key].nickname}
                        onChange={(e) =>
                          setCoupleForm({
                            ...coupleForm,
                            [key]: { ...coupleForm[key], nickname: e.target.value }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-rose-200 text-sm bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditingCouple(false)}
                  className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm / Sửa Kỷ Niệm (Tích hợp thanh công cụ chỉnh chữ TextFormattingToolbar) */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-rose-100 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-rose-500" />
                <span>{editingMemoryId ? 'Chỉnh Sửa Kỷ Niệm' : 'Thêm Mốc Kỷ Niệm Mới'}</span>
              </h3>
              <button
                onClick={() => setIsMemoryModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMemory} className="space-y-4 mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Ngày diễn ra kỷ niệm *
                  </label>
                  <input
                    type="date"
                    value={memoryForm.date}
                    onChange={(e) => setMemoryForm({ ...memoryForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 text-sm focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Chủ đề / Tag
                  </label>
                  <select
                    value={memoryForm.tag}
                    onChange={(e) => setMemoryForm({ ...memoryForm, tag: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 text-sm focus:outline-none focus:border-rose-500"
                  >
                    {Object.keys(TAG_CONFIG).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Tiêu đề kỷ niệm *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Chuyến đi Đà Lạt đầu tiên của hai đứa..."
                  value={memoryForm.title}
                  onChange={(e) => setMemoryForm({ ...memoryForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-rose-200 text-sm focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Địa điểm
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hồ Xuân Hương, Đà Lạt"
                    value={memoryForm.location}
                    onChange={(e) => setMemoryForm({ ...memoryForm, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Cảm xúc lúc đó
                  </label>
                  <select
                    value={memoryForm.mood}
                    onChange={(e) => setMemoryForm({ ...memoryForm, mood: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value="🥰 Rung động">🥰 Rung động</option>
                    <option value="🥂 Hạnh phúc">🥂 Hạnh phúc</option>
                    <option value="✈️ Hào hứng">✈️ Hào hứng</option>
                    <option value="🍲 Ấm áp">🍲 Ấm áp</option>
                    <option value="😂 Vui nhộn">😂 Vui nhộn</option>
                    <option value="🥺 Xúc động">🥺 Xúc động</option>
                  </select>
                </div>
              </div>

              {/* Phần câu chuyện kèm thanh công cụ chỉnh cỡ chữ, màu chữ, in đậm, in nghiêng */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-600">
                  Câu chuyện & Ghi chú kỷ niệm (Tùy chỉnh cỡ chữ, màu sắc, in đậm/nghiêng)
                </label>

                <TextFormattingToolbar
                  styleValue={memoryForm.textStyle}
                  onChange={(newStyle) => setMemoryForm({ ...memoryForm, textStyle: newStyle })}
                />

                <textarea
                  rows={4}
                  placeholder="Hãy viết lại cảm xúc, những điều đáng nhớ trong ngày hôm ấy..."
                  value={memoryForm.story}
                  onChange={(e) => setMemoryForm({ ...memoryForm, story: e.target.value })}
                  style={{
                    color: memoryForm.textStyle?.color || '#334155',
                    fontWeight: memoryForm.textStyle?.bold ? 'bold' : 'normal',
                    fontStyle: memoryForm.textStyle?.italic ? 'italic' : 'normal'
                  }}
                  className={`w-full px-4 py-3 rounded-xl border border-rose-200 focus:outline-none focus:border-rose-500 ${
                    memoryForm.textStyle?.fontSize === 'xl'
                      ? 'text-xl'
                      : memoryForm.textStyle?.fontSize === 'lg'
                      ? 'text-lg'
                      : memoryForm.textStyle?.fontSize === 'sm'
                      ? 'text-xs'
                      : 'text-sm'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                  Hình ảnh & Video kỷ niệm ({memoryForm.media.length})
                </label>

                <label className="flex flex-col items-center justify-center border-2 border-dashed border-rose-300 bg-rose-50/50 hover:bg-rose-50 rounded-2xl p-5 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
                    <ImageIcon className="w-5 h-5" />
                    <Video className="w-5 h-5" />
                    <span>Nhấn để chọn nhiều Ảnh hoặc Video từ máy của bạn</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaFilesUpload}
                    className="hidden"
                  />
                </label>

                {memoryForm.media.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {memoryForm.media.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="relative rounded-xl overflow-hidden border border-rose-200 bg-slate-50 group"
                      >
                        <div className="aspect-video w-full bg-black/5">
                          {item.type === 'video' ? (
                            <video src={item.url} className="w-full h-full object-cover" controls />
                          ) : (
                            <img src={item.url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Chú thích ảnh/video..."
                          value={item.caption || ''}
                          onChange={(e) => {
                            const updated = [...memoryForm.media];
                            updated[idx] = { ...updated[idx], caption: e.target.value };
                            setMemoryForm({ ...memoryForm, media: updated });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs border-t border-rose-100 bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setMemoryForm({
                              ...memoryForm,
                              media: memoryForm.media.filter((_, i) => i !== idx)
                            })
                          }
                          className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setIsMemoryModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-md"
                >
                  {editingMemoryId ? 'Cập nhật kỷ niệm' : 'Lưu vào dòng thời gian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReminderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-500" />
                <span>{editingReminderId ? 'Sửa Ngày Quan Trọng' : 'Thêm Ngày Quan Trọng'}</span>
              </h3>
              <button
                onClick={() => setIsReminderModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Tên sự kiện / Ngày kỷ niệm *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kỷ niệm ngày cầu hôn, Sinh nhật nàng..."
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 text-sm focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Chọn ngày *
                  </label>
                  <input
                    type="date"
                    value={reminderForm.date}
                    onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-rose-200 text-sm focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Phân loại
                  </label>
                  <select
                    value={reminderForm.category}
                    onChange={(e) => setReminderForm({ ...reminderForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-rose-200 text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value="Kỷ niệm">💑 Kỷ niệm</option>
                    <option value="Sinh nhật">🎂 Sinh nhật</option>
                    <option value="Ngày lễ">🌹 Ngày lễ</option>
                    <option value="Hẹn hò">🍷 Hẹn hò</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between bg-rose-50/70 p-3 rounded-xl border border-rose-100">
                <span className="text-xs font-medium text-slate-700">
                  Lặp lại sự kiện này vào mỗi năm
                </span>
                <input
                  type="checkbox"
                  checked={reminderForm.isRecurringYearly}
                  onChange={(e) =>
                    setReminderForm({ ...reminderForm, isRecurringYearly: e.target.checked })
                  }
                  className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Mức độ ưu tiên
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'high', label: '★ Rất quan trọng' },
                    { id: 'medium', label: 'Bình thường' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setReminderForm({ ...reminderForm, priority: p.id })}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        reminderForm.priority === p.id
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-600 border-rose-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Ý tưởng quà tặng / Kế hoạch dự kiến
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú món quà cô ấy/anh ấy thích..."
                  value={reminderForm.giftPlan}
                  onChange={(e) => setReminderForm({ ...reminderForm, giftPlan: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-rose-200 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(false)}
                  className="px-4 py-2 rounded-full text-sm text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow"
                >
                  Lưu lời nhắc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lightbox.isOpen && lightbox.mediaList.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl flex items-center justify-between text-white mb-3 px-2">
            <div>
              <h4 className="font-bold text-sm sm:text-base">{lightbox.memoryTitle}</h4>
              <p className="text-xs text-rose-300">
                {lightbox.currentIndex + 1} / {lightbox.mediaList.length} •{' '}
                {lightbox.mediaList[lightbox.currentIndex]?.caption || ''}
              </p>
            </div>
            <button
              onClick={() => setLightbox({ ...lightbox, isOpen: false })}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative w-full max-w-4xl aspect-video bg-black/50 rounded-2xl overflow-hidden flex items-center justify-center border border-white/10">
            {lightbox.mediaList[lightbox.currentIndex]?.type === 'video' ? (
              <video
                src={lightbox.mediaList[lightbox.currentIndex].url}
                controls
                autoPlay
                className="max-h-[75vh] max-w-full"
              />
            ) : (
              <img
                src={lightbox.mediaList[lightbox.currentIndex]?.url}
                alt=""
                className="max-h-[75vh] max-w-full object-contain"
              />
            )}

            {lightbox.mediaList.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setLightbox((prev) => ({
                      ...prev,
                      currentIndex:
                        (prev.currentIndex - 1 + prev.mediaList.length) % prev.mediaList.length
                    }))
                  }
                  className="absolute left-3 p-3 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() =>
                    setLightbox((prev) => ({
                      ...prev,
                      currentIndex: (prev.currentIndex + 1) % prev.mediaList.length
                    }))
                  }
                  className="absolute right-3 p-3 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-100">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">Xác nhận xóa?</h4>
            <p className="text-xs text-slate-500 mt-1.5">
              Bạn có chắc muốn xóa <strong>"{deleteConfirm.title}"</strong> khỏi nhật ký tình yêu không?
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, type: null, id: null, title: '' })}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Giữ lại
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
