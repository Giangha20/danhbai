'use strict';
/* =====================================================================
   CARD MASTER — script.js
   Đợt 1: khung app + Tiến Lên (3 bản) + Sâm Lốc + Xì Dách + Blackjack
   Chỉ dùng HTML/CSS/JS thuần, chạy offline hoàn toàn.
   ===================================================================== */

const STORAGE_KEY = 'offline_card_master_v1';
const IN_BROWSER = typeof window !== 'undefined' && typeof document !== 'undefined';

/* ============================ 1. UTILS ============================ */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = n => Math.floor(Math.random() * n);
const pick = a => a[rand(a.length)];
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function fmt(n) { return Number(n || 0).toLocaleString('vi-VN'); }
function norm(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}
function sanitizeName(s) {
  return String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);
}
function minBy(arr, fn) {
  let best = null, bv = Infinity;
  for (const x of arr) { const v = fn(x); if (v < bv) { bv = v; best = x; } }
  return best;
}
function maxBy(arr, fn) { return minBy(arr, x => -fn(x)); }
function fmtTime(sec) {
  sec = Math.floor(sec || 0);
  const hh = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60);
  return hh > 0 ? hh + 'g ' + mm + 'p' : mm + 'p ' + (sec % 60) + 's';
}

/* ============================ 2. DỮ LIỆU NHÚNG ============================ */
const LEVEL_NAMES = ['Dễ', 'Bình thường', 'Khó', 'Siêu khó'];
const LEVEL_ICONS = ['🟢', '🟡', '🟠', '🔴'];
const TIME_OPTIONS = [10, 15, 20, 30, 60];
const AVATARS = ['👨', '👩', '🤖', '🐱', '🐯', '🦊', '🐼', '🦁', '🐉', '👽', '⭐', '🔥', '🦅', '🐺', '🦄', '🐙', '🎩', '👑', '🧙', '🥷', '🧑‍🚀', '🐸', '🦉', '💎'];
const REGIONS = { AS: 'Châu Á', EU: 'Châu Âu', AF: 'Châu Phi', NA: 'Bắc & Trung Mỹ', SA: 'Nam Mỹ', OC: 'Châu Đại Dương' };

/* Danh sách quốc gia: mã ISO | tên tiếng Việt | khu vực */
const COUNTRY_RAW = [
  'AF|Afghanistan|AS', 'AM|Armenia|AS', 'AZ|Azerbaijan|AS', 'BH|Bahrain|AS', 'BD|Bangladesh|AS', 'BT|Bhutan|AS', 'BN|Brunei|AS', 'KH|Campuchia|AS',
  'CN|Trung Quốc|AS', 'CY|Síp|AS', 'GE|Georgia|AS', 'HK|Hồng Kông|AS', 'IN|Ấn Độ|AS', 'ID|Indonesia|AS', 'IR|Iran|AS', 'IQ|Iraq|AS', 'IL|Israel|AS',
  'JP|Nhật Bản|AS', 'JO|Jordan|AS', 'KZ|Kazakhstan|AS', 'KW|Kuwait|AS', 'KG|Kyrgyzstan|AS', 'LA|Lào|AS', 'LB|Liban|AS', 'MO|Ma Cao|AS', 'MY|Malaysia|AS',
  'MV|Maldives|AS', 'MN|Mông Cổ|AS', 'MM|Myanmar|AS', 'NP|Nepal|AS', 'KP|Triều Tiên|AS', 'OM|Oman|AS', 'PK|Pakistan|AS', 'PS|Palestine|AS',
  'PH|Philippines|AS', 'QA|Qatar|AS', 'SA|Ả Rập Xê Út|AS', 'SG|Singapore|AS', 'KR|Hàn Quốc|AS', 'LK|Sri Lanka|AS', 'SY|Syria|AS', 'TW|Đài Loan|AS',
  'TJ|Tajikistan|AS', 'TH|Thái Lan|AS', 'TL|Đông Timor|AS', 'TR|Thổ Nhĩ Kỳ|AS', 'TM|Turkmenistan|AS', 'AE|Các Tiểu vương quốc Ả Rập|AS', 'UZ|Uzbekistan|AS',
  'VN|Việt Nam|AS', 'YE|Yemen|AS',
  'AL|Albania|EU', 'AD|Andorra|EU', 'AT|Áo|EU', 'BY|Belarus|EU', 'BE|Bỉ|EU', 'BA|Bosnia và Herzegovina|EU', 'BG|Bulgaria|EU', 'HR|Croatia|EU', 'CZ|Séc|EU',
  'DK|Đan Mạch|EU', 'EE|Estonia|EU', 'FI|Phần Lan|EU', 'FR|Pháp|EU', 'DE|Đức|EU', 'GR|Hy Lạp|EU', 'HU|Hungary|EU', 'IS|Iceland|EU', 'IE|Ireland|EU', 'IT|Ý|EU',
  'XK|Kosovo|EU', 'LV|Latvia|EU', 'LI|Liechtenstein|EU', 'LT|Litva|EU', 'LU|Luxembourg|EU', 'MT|Malta|EU', 'MD|Moldova|EU', 'MC|Monaco|EU', 'ME|Montenegro|EU',
  'NL|Hà Lan|EU', 'MK|Bắc Macedonia|EU', 'NO|Na Uy|EU', 'PL|Ba Lan|EU', 'PT|Bồ Đào Nha|EU', 'RO|Romania|EU', 'RU|Nga|EU', 'SM|San Marino|EU', 'RS|Serbia|EU',
  'SK|Slovakia|EU', 'SI|Slovenia|EU', 'ES|Tây Ban Nha|EU', 'SE|Thụy Điển|EU', 'CH|Thụy Sĩ|EU', 'UA|Ukraine|EU', 'GB|Anh|EU', 'VA|Vatican|EU',
  'DZ|Algeria|AF', 'AO|Angola|AF', 'BJ|Benin|AF', 'BW|Botswana|AF', 'BF|Burkina Faso|AF', 'BI|Burundi|AF', 'CV|Cabo Verde|AF', 'CM|Cameroon|AF',
  'CF|Cộng hòa Trung Phi|AF', 'TD|Chad|AF', 'KM|Comoros|AF', 'CG|Cộng hòa Congo|AF', 'CD|CHDC Congo|AF', 'CI|Bờ Biển Ngà|AF', 'DJ|Djibouti|AF', 'EG|Ai Cập|AF',
  'GQ|Guinea Xích Đạo|AF', 'ER|Eritrea|AF', 'SZ|Eswatini|AF', 'ET|Ethiopia|AF', 'GA|Gabon|AF', 'GM|Gambia|AF', 'GH|Ghana|AF', 'GN|Guinea|AF', 'GW|Guinea-Bissau|AF',
  'KE|Kenya|AF', 'LS|Lesotho|AF', 'LR|Liberia|AF', 'LY|Libya|AF', 'MG|Madagascar|AF', 'MW|Malawi|AF', 'ML|Mali|AF', 'MR|Mauritania|AF', 'MU|Mauritius|AF',
  'MA|Maroc|AF', 'MZ|Mozambique|AF', 'NA|Namibia|AF', 'NE|Niger|AF', 'NG|Nigeria|AF', 'RW|Rwanda|AF', 'ST|São Tomé và Príncipe|AF', 'SN|Senegal|AF', 'SC|Seychelles|AF',
  'SL|Sierra Leone|AF', 'SO|Somalia|AF', 'ZA|Nam Phi|AF', 'SS|Nam Sudan|AF', 'SD|Sudan|AF', 'TZ|Tanzania|AF', 'TG|Togo|AF', 'TN|Tunisia|AF', 'UG|Uganda|AF',
  'ZM|Zambia|AF', 'ZW|Zimbabwe|AF',
  'AG|Antigua và Barbuda|NA', 'BS|Bahamas|NA', 'BB|Barbados|NA', 'BZ|Belize|NA', 'CA|Canada|NA', 'CR|Costa Rica|NA', 'CU|Cuba|NA', 'DM|Dominica|NA',
  'DO|Cộng hòa Dominica|NA', 'SV|El Salvador|NA', 'GD|Grenada|NA', 'GT|Guatemala|NA', 'HT|Haiti|NA', 'HN|Honduras|NA', 'JM|Jamaica|NA', 'MX|Mexico|NA',
  'NI|Nicaragua|NA', 'PA|Panama|NA', 'KN|Saint Kitts và Nevis|NA', 'LC|Saint Lucia|NA', 'VC|Saint Vincent và Grenadines|NA', 'TT|Trinidad và Tobago|NA',
  'US|Hoa Kỳ|NA', 'PR|Puerto Rico|NA',
  'AR|Argentina|SA', 'BO|Bolivia|SA', 'BR|Brazil|SA', 'CL|Chile|SA', 'CO|Colombia|SA', 'EC|Ecuador|SA', 'GY|Guyana|SA', 'PY|Paraguay|SA', 'PE|Peru|SA',
  'SR|Suriname|SA', 'UY|Uruguay|SA', 'VE|Venezuela|SA',
  'AU|Úc|OC', 'FJ|Fiji|OC', 'KI|Kiribati|OC', 'MH|Quần đảo Marshall|OC', 'FM|Micronesia|OC', 'NR|Nauru|OC', 'NZ|New Zealand|OC', 'PW|Palau|OC',
  'PG|Papua New Guinea|OC', 'WS|Samoa|OC', 'SB|Quần đảo Solomon|OC', 'TO|Tonga|OC', 'TV|Tuvalu|OC', 'VU|Vanuatu|OC'
];
function flagEmoji(code) {
  if (!/^[A-Z]{2}$/.test(code)) return '🏳️';
  return String.fromCodePoint(...code.split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}
const COUNTRIES = COUNTRY_RAW.map(s => {
  const p = s.split('|');
  return { code: p[0], name: p[1], flag: flagEmoji(p[0]), region: p[2] };
}).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
const COUNTRY_BY_CODE = {};
COUNTRIES.forEach(c => { COUNTRY_BY_CODE[c.code] = c; });

/* Danh sách AI: tên:mã quốc gia */
const AI_ROSTER = ('Hiro:JP,Min-jun:KR,Alex:US,Lucas:FR,Felix:DE,Rafael:BR,Noah:CA,Sakura:JP,Ji-woo:KR,Mateo:ES,Sofia:IT,Liam:IE,Emma:GB,Oliver:AU,Aarav:IN,Priya:IN,' +
  'Wei:CN,Mei:CN,Somchai:TH,Nong:TH,Budi:ID,Siti:MY,Arif:PK,Omar:EG,Youssef:MA,Amara:NG,Kwame:GH,Thabo:ZA,Dmitri:RU,Olga:UA,Jan:PL,Lars:SE,Sven:NO,Mikkel:DK,' +
  'Aino:FI,Pieter:NL,Hans:AT,Matteo:CH,Diego:AR,Camila:CO,Valentina:CL,Carlos:MX,Joao:PT,Nikos:GR,Ahmet:TR,Layla:AE,Tariq:SA,Aziz:UZ,Tane:NZ,Hùng:VN,Lan:VN,Trang:VN,Kai:SG,Ravi:LK').split(',')
  .map(s => { const p = s.split(':'); return { name: p[0], country: p[1] }; });

const GAME_META = {
  tienLen: { name: 'Tiến Lên', desc: 'Đi hết bài trước — luật cơ bản', minP: 2, maxP: 4, defP: 4, icon: 'fan', kind: 'shed', ready: true },
  tienLenMienNam: { name: 'Tiến Lên Miền Nam', desc: 'Chặt 2, đôi thông, thối 2, tới trắng', minP: 2, maxP: 4, defP: 4, icon: 'fan2', kind: 'shed', ready: true },
  tienLenMienBac: { name: 'Tiến Lên Miền Bắc', desc: 'Luật Bắc: chặt hạn chế, tới trắng riêng', minP: 2, maxP: 4, defP: 4, icon: 'fan3', kind: 'shed', ready: true },
  samLoc: { name: 'Sâm Lốc', desc: '10 lá — báo Sâm, chặn Sâm, ăn trắng', minP: 2, maxP: 4, defP: 4, icon: 'ten', kind: 'shed', ready: true },
  xiDach: { name: 'Xì Dách', desc: 'Rút bài đạt 16–21, đấu với nhà cái', minP: 1, maxP: 4, defP: 3, icon: 'bj', kind: 'bj', ready: true },
  blackjack: { name: 'Blackjack', desc: 'Hit, stand, double, split — đấu nhà cái', minP: 1, maxP: 4, defP: 3, icon: 'bj2', kind: 'bj', ready: true },
  lieng: { name: 'Liêng', desc: '3 lá, tố/theo/úp/bỏ rồi so bài', minP: 2, maxP: 5, defP: 4, icon: 'three', kind: 'bet', ready: true },
  baCay: { name: 'Ba Cây', desc: '3 lá, so điểm 0–9, ba cây ảnh', minP: 2, maxP: 5, defP: 4, icon: 'three2', kind: 'show', ready: true },
  phom: { name: 'Phỏm', desc: 'Bốc, ăn, hạ phỏm, gửi bài, ù', minP: 2, maxP: 4, defP: 4, icon: 'phom', kind: 'draw', ready: true },
  mauBinh: { name: 'Mậu Binh', desc: '13 lá xếp 3 chi, so chi', minP: 2, maxP: 4, defP: 4, icon: 'mb', kind: 'mb', ready: true },
  poker: { name: 'Poker Offline', desc: "Texas Hold'em: check, bet, raise, all-in", minP: 2, maxP: 6, defP: 4, icon: 'chips', kind: 'poker', ready: true },
  highCard: { name: 'High Card', desc: 'Lá cao nhất thắng · 3 ván', minP: 2, maxP: 4, defP: 3, icon: 'hc', kind: 'show', ready: true },
  rummy: { name: 'Rummy', desc: 'Bốc, đánh, hạ bộ, gõ khi rác ≤ 10', minP: 2, maxP: 4, defP: 2, icon: 'rummy', kind: 'draw', ready: true },
  solitaire: { name: 'Solitaire', desc: 'Klondike một người · rút 1 hoặc 3 lá', minP: 1, maxP: 1, defP: 1, icon: 'sol', kind: 'solo', ready: true },
  freeCell: { name: 'FreeCell', desc: '8 cột, 4 ô trống, 4 nền', minP: 1, maxP: 1, defP: 1, icon: 'fc', kind: 'solo', ready: true },
  spider: { name: 'Spider Solitaire', desc: '104 lá · 1/2/4 chất', minP: 1, maxP: 1, defP: 1, icon: 'spider', kind: 'solo', ready: true },
};
const READY_GAMES = Object.keys(GAME_META).filter(k => GAME_META[k].ready);
const ROOM_GAMES = READY_GAMES.filter(k => GAME_META[k].kind !== 'solo');

/* Thành tích đạt được trong Đợt 1 (mọi thành tích đều mở được bằng gameplay thật) */
const ACHIEVEMENTS = [
  { id: 'firstWin', icon: '🏆', name: 'Chiến thắng đầu tiên', desc: 'Thắng 1 ván bất kỳ', test: (d, s) => d.statistics.wins >= 1 },
  { id: 'streak5', icon: '🔥', name: '5 trận thắng liên tiếp', desc: 'Chuỗi thắng 5', test: (d) => d.statistics.bestStreak >= 5 },
  { id: 'streak10', icon: '🔥', name: '10 trận thắng liên tiếp', desc: 'Chuỗi thắng 10', test: (d) => d.statistics.bestStreak >= 10 },
  { id: 'matches10', icon: '🎴', name: 'Làm quen', desc: 'Chơi 10 ván', test: (d) => d.statistics.total >= 10 },
  { id: 'matches50', icon: '🃏', name: 'Dân chơi bài', desc: 'Chơi 50 ván', test: (d) => d.statistics.total >= 50 },
  { id: 'sam100', icon: '🎴', name: 'Chơi 100 ván Sâm Lốc', desc: 'Hoàn thành 100 ván Sâm Lốc', test: (d) => ((d.statistics.games.samLoc || {}).played || 0) >= 100 },
  { id: 'quad', icon: '♠', name: 'Thắng bằng tứ quý', desc: 'Về nhất bằng nước đánh tứ quý', test: (d, s) => s.includes('quad') },
  { id: 'trang', icon: '♥', name: 'Ăn trắng', desc: 'Thắng ngay khi chia bài', test: (d, s) => s.includes('trang') },
  { id: 'baoSam', icon: '💥', name: 'Báo Sâm thành công', desc: 'Báo Sâm và đi hết 10 lá không ai chặn', test: (d, s) => s.includes('baoSamOk') },
  { id: 'chanSam', icon: '🛡️', name: 'Chặn Sâm', desc: 'Chặn thành công người báo Sâm', test: (d, s) => s.includes('chanSam') },
  { id: 'blackjack', icon: '🂡', name: 'Blackjack tự nhiên', desc: 'Có A + 10 ngay 2 lá đầu và thắng', test: (d, s) => s.includes('blackjack') },
  { id: 'xibang', icon: '🅰️', name: 'Xì bàng', desc: 'Thắng với 2 lá A', test: (d, s) => s.includes('xibang') },
  { id: 'nguLinh', icon: '🖐️', name: 'Ngũ linh', desc: 'Thắng với 5 lá không quá 21', test: (d, s) => s.includes('nguLinh') },
  { id: 'beatHard', icon: '🔴', name: 'Hạ AI Siêu khó', desc: 'Thắng bàn toàn AI Siêu khó', test: (d, s) => s.includes('beatHard') },
  { id: 'champion', icon: '👑', name: 'Vô địch giải đấu', desc: 'Giành chức vô địch một giải đấu bất kỳ', test: (d, s) => s.includes('champion') || d.statistics.championships >= 1 },
  { id: 'worldChampion', icon: '🌎', name: 'Vô địch thế giới', desc: 'Vô địch World Solo Championship', test: (d, s) => s.includes('worldChampion') },
  { id: 'solSol', icon: '🂱', name: 'Xếp xong Solitaire', desc: 'Hoàn thành một ván Solitaire (Klondike)', test: (d, s) => s.includes('solo:solitaire') },
  { id: 'solFc', icon: '🆓', name: 'Giải xong FreeCell', desc: 'Hoàn thành một ván FreeCell', test: (d, s) => s.includes('solo:freeCell') },
  { id: 'solSp', icon: '🕷️', name: 'Gỡ hết Spider', desc: 'Gỡ đủ 8 chuỗi trong Spider Solitaire', test: (d, s) => s.includes('solo:spider') },
  { id: 'phomU', icon: '🏆', name: 'Ù Phỏm', desc: 'Ù trong một ván Phỏm', test: (d, s) => s.includes('phomU') },
  { id: 'mbSap', icon: '💥', name: 'Sập hầm', desc: 'Thắng cả 3 chi trước một đối thủ trong Mậu Binh', test: (d, s) => s.includes('mbSap') },
  { id: 'rumGin', icon: '♻️', name: 'Gin Rummy', desc: 'Gõ với 0 điểm rác và thắng', test: (d, s) => s.includes('rumGin') },
  { id: 'lienSap', icon: '🎰', name: 'Liêng Sáp', desc: 'Thắng ván Liêng bằng bộ Sáp', test: (d, s) => s.includes('lienSap') },
  { id: 'pkStrong', icon: '🃏', name: 'Poker mạnh', desc: 'Thắng ván Poker bằng Flush trở lên', test: (d, s) => s.includes('pkStrong') },
  { id: 'legendChampion', icon: '👑', name: 'Huyền thoại', desc: 'Vô địch Giải Huyền thoại (AI Siêu khó)', test: (d, s) => s.includes('legendChampion') },
  { id: 'level20', icon: '⭐', name: 'Lên cấp 20', desc: 'Đạt Level 20', test: (d) => d.level >= 20 }
];

/* Luật chơi — mỗi game một nội dung riêng. Game chưa mở (ready=false) vẫn có luật đầy đủ để xem trước. */
const RULES = {
  tienLen: ['Tiến Lên (cơ bản)', [
    'Số người: 2–4. Mỗi người 13 lá. Ai hết bài trước là nhất; những người còn lại xếp theo số lá còn trên tay.',
    'Thứ tự lá: 3 < 4 < … < 10 < J < Q < K < A < 2. Thứ tự chất: ♠ Bích < ♣ Tép < ♦ Rô < ♥ Cơ.',
    'Bộ hợp lệ: lẻ, đôi, bộ ba, tứ quý, sảnh (từ 3 lá liên tiếp trở lên, không có 2, không cần cùng chất).',
    'Người có lá nhỏ nhất đi trước và phải đánh bộ có chứa lá đó. Sau đó phải đánh cùng loại, cùng số lá và lá cao nhất lớn hơn bộ trước.',
    'Không đánh được thì bỏ lượt — bỏ lượt là mất quyền đánh đến hết vòng. Khi mọi người khác đã bỏ, người đánh cuối được đi tự do.',
    'Chặt: tứ quý chặt 2 lẻ. Bản cơ bản không có đôi thông.',
    'Luật thối 2: không được đánh quân 2 làm nước cuối cùng (hết bài bằng quân 2). Ai chỉ còn toàn quân 2 mà phải đánh tự do thì bị "Thối 2" và thua ván — hãy đánh 2 sớm.',
    'Tới trắng (thắng ngay khi chia bài): sảnh rồng 3→A hoặc tứ quý 2.'
  ]],
  tienLenMienNam: ['Tiến Lên Miền Nam', [
    'Số người 2–4, mỗi người 13 lá. Thứ tự 3 < … < K < A < 2; chất ♠ < ♣ < ♦ < ♥. Người có lá nhỏ nhất đi trước và phải đánh lá đó.',
    'Bộ hợp lệ: lẻ, đôi, ba, tứ quý, sảnh (≥3 lá, không có 2) và đôi thông (≥3 đôi liên tiếp, không có 2).',
    'Chặt 2 lẻ: tứ quý hoặc 3 đôi thông (hoặc nhiều hơn).',
    'Chặt đôi 2: tứ quý hoặc 4 đôi thông. 4 đôi thông cũng chặt được tứ quý.',
    'Thối 2: không được đánh quân 2 làm nước cuối cùng (hết bài bằng quân 2). Ai chỉ còn toàn quân 2 mà phải đánh tự do thì bị "Thối 2" và thua ván; còn quân 2 khi ván kết thúc cũng bị đánh dấu "Thối 2". Chưa đánh được lá nào là "Cóng".',
    'Tới trắng: sảnh rồng 3→A, tứ quý 2, hoặc 6 đôi — thắng ngay khi chia bài.'
  ]],
  tienLenMienBac: ['Tiến Lên Miền Bắc', [
    'Số người 2–4, mỗi người 13 lá. Thứ tự và chất như Tiến Lên; người có lá nhỏ nhất đi trước.',
    'Bộ hợp lệ: lẻ, đôi, ba, tứ quý, sảnh (≥3 lá, không có 2) và đôi thông (≥3 đôi liên tiếp).',
    'Chặt hạn chế hơn Miền Nam: chỉ tứ quý và đôi thông (≥3 đôi) chặt được 2 lẻ. Đôi 2 không bị chặt; đôi thông không chặt được tứ quý.',
    'Luật thối 2: không được đánh quân 2 làm nước cuối cùng (hết bài bằng quân 2). Ai chỉ còn toàn quân 2 mà phải đánh tự do thì bị "Thối 2" và thua ván.',
    'Tới trắng: sảnh rồng 3→A, tứ quý 2, hoặc tứ quý 3.'
  ]],
  samLoc: ['Sâm Lốc', [
    'Số người 2–4, mỗi người 10 lá. Thứ tự: 3 < 4 < … < K < A < 2. Chất không quyết định giá trị: bài bằng nhau thì không chặt được.',
    'Bộ hợp lệ: lẻ, đôi, bộ ba, tứ quý, sảnh (≥3 lá liên tiếp, không có 2). Phải đánh cùng loại, cùng số lá và lớn hơn bộ trước.',
    'Chặt: tứ quý chặt 2 lẻ và đôi 2.',
    'Báo Sâm: trước khi đánh, bạn có thể báo Sâm — phải đi hết 10 lá mà không ai chặn được. Người báo được đi trước. Có người đánh bài chặn thì người báo thua, người chặn thắng.',
    'Ăn trắng: tứ quý 2, 5 đôi, hoặc sảnh rồng 10 lá liên tiếp — thắng ngay khi chia bài.',
    'Luật thối 2: không được đánh quân 2 làm nước cuối cùng (hết bài bằng quân 2). Ai chỉ còn toàn quân 2 mà phải đánh tự do thì bị "Thối 2" và thua ván.',
    'Còn 1 lá sẽ có cảnh báo ⚠️. Ai hết bài trước là nhất.'
  ]],
  xiDach: ['Xì Dách', [
    'Mục tiêu: điểm gần 21 hơn nhà cái nhưng không quá 21 (quắc). Bạn đấu với nhà cái, AI khác cũng chơi cùng bàn.',
    'J, Q, K = 10. A = 1, 10 hoặc 11 khi có 2–3 lá; có 4–5 lá thì A = 1.',
    'Người chơi phải đạt ít nhất 16 điểm mới được dằn; nhà cái phải đạt ít nhất 15 điểm. Tối đa 5 lá.',
    'Xếp hạng bài: Xì bàng (2 lá A) > Xì dách (A + lá 10 điểm) > Ngũ linh (5 lá, không quá 21) > 21 điểm … thấp hơn. Quắc luôn thua.',
    'Ngũ linh so với ngũ linh: tổng thấp hơn thắng. Bằng điểm là hòa. Nhà cái có Xì dách/Xì bàng thì so bài ngay.'
  ]],
  blackjack: ['Blackjack', [
    'Mục tiêu: điểm gần 21 hơn nhà cái nhưng không quá 21. Hình = 10, A = 1 hoặc 11.',
    'Hit: rút thêm. Stand: dừng. Double: gấp đôi cược, rút đúng 1 lá rồi dừng (chỉ khi có 2 lá). Split: tách đôi hai lá cùng số (1 lần); tách A chỉ được 1 lá mỗi tay.',
    'Blackjack tự nhiên (A + 10 ở 2 lá đầu) thắng 21 thường. Nhà cái rút đến khi đạt từ 17 điểm.',
    'Quắc (>21) là thua. Bằng điểm là Push (hòa). Chỉ dùng điểm ảo, không có tiền thật.'
  ]],
  lieng: ['Liêng', [
    'Số người 2–5, mỗi người 3 lá úp. Mỗi người góp 10 điểm ảo (chip) vào pot, bắt đầu với 200 chip. Chỉ dùng điểm ảo, không có tiền thật.',
    'Xếp hạng: Sáp (3 lá cùng số) > Liêng (3 lá liên tiếp, A-2-3 và Q-K-A hợp lệ) > Ảnh (3 lá J/Q/K) > điểm (A=1, 2–9 theo số, 10/J/Q/K=0; lấy số lẻ của tổng).',
    'Bạn có thể bấm 👁 XEM để lật xem bài của mình, hoặc chơi úp không xem.',
    'Mỗi lượt: ÚP (qua lượt, chỉ khi chưa ai tố), THEO (bằng mức tố hiện tại), TỐ (+10, tối đa 3 lần tố mỗi ván), BỎ (bỏ ván, mất phần đã góp).',
    'Khi mọi người còn lại đã theo xong thì so bài: bộ cao nhất ăn pot (bằng nhau thì so lá cao nhất rồi chất). Nếu chỉ còn 1 người, người đó ăn pot không cần lật bài.'
  ]],
  baCay: ['Ba Cây', [
    'Số người 2–5, mỗi người 3 lá úp. Điểm = tổng 3 lá, chỉ lấy số lẻ (A=1, 2–9 theo số, 10/J/Q/K=0). Điểm cao nhất là 9.',
    'Ba cây ảnh (3 lá J/Q/K) là bài cao nhất — có thể tắt trong màn chọn game.',
    'Bấm LẬT BÀI để lật tất cả. Bằng điểm thì so lá cao nhất (A cao nhất), rồi so chất ♠ < ♣ < ♦ < ♥.',
    'Mỗi ván là một lần so bài; không có cược.'
  ]],
  phom: ['Phỏm', [
    'Số người 2–4, dùng 52 lá. Mỗi người 9 lá; người đi trước có 10 lá và đánh trước. Mục tiêu: ghép phỏm và còn ít điểm rác nhất.',
    'Phỏm = 3 lá trở lên cùng số (ngang) hoặc 3 lá trở lên liên tiếp cùng chất (dọc, A chỉ là lá nhỏ nhất).',
    'Mỗi lượt: BỐC 1 lá từ nọc hoặc ĂN lá người trước vừa đánh (chỉ khi ghép được phỏm với lá trong tay — phỏm đó được hạ ngay trước mặt), rồi ĐÁNH ra 1 lá.',
    'Ù: toàn bộ bài trên tay thành phỏm → thắng ngay. Ván kết thúc khi mỗi người đã đánh 4 lá (hoặc hết nọc).',
    'Hạ phỏm: bài được tự động chia thành phỏm tốt nhất, sau đó gửi lá lẻ vào các phỏm đã hạ nếu nối được. Điểm rác: A=1 … K=13; ít điểm nhất thắng. Người không có phỏm nào là MÓM và xếp cuối.',
    'AI biết giữ quân tạo phỏm, đánh rác, ăn khi có lợi và tránh đánh quân gần với những quân đối thủ đã bỏ. Bài trên tay tự xếp phỏm lên đầu hàng.'
  ]],
  mauBinh: ['Mậu Binh', [
    'Số người 2–4, mỗi người 13 lá, xếp thành 3 chi: Chi 1 (đầu) 3 lá, Chi 2 (giữa) 5 lá, Chi 3 (cuối) 5 lá. Bắt buộc Chi 3 ≥ Chi 2 ≥ Chi 1, xếp sai là binh lủng.',
    'Hạng bài (cao → thấp): Thùng phá sảnh, Tứ quý, Cù lũ, Thùng, Sảnh, Sám, Thú (2 đôi), Đôi, Mậu thầu. Chi 1 chỉ có Sám, Đôi hoặc Mậu thầu.',
    'Cách xếp: chạm chọn các lá trong tay rồi chạm vào một chi để đặt; chạm lá đã đặt để trả về tay. TỰ XẾP nhờ AI xếp giúp. Chỉ XÁC NHẬN được khi xếp đủ 13 lá và hợp lệ.',
    'So từng chi với từng đối thủ: thắng mỗi chi +1 điểm, thắng cả 3 chi (sập hầm) nhân đôi. Thưởng thêm: Sám chi 1 (+2), Cù lũ chi 2 (+1), Tứ quý (+4 chi 3 / +8 chi 2), Thùng phá sảnh (+5 / +10).',
    'Thắng trắng (thắng ngay khi chia): sảnh rồng 13 lá, 6 đôi, 3 sảnh, 3 thùng.'
  ]],
  poker: ["Poker Offline (Texas Hold'em)", [
    'Số người 2–6, mỗi người bắt đầu 1.000 chip ảo (không có tiền thật). Mỗi người 2 lá riêng, dùng cùng 5 lá chung để ghép bộ 5 lá tốt nhất. Mỗi lần chơi là một ván bài.',
    'Blind: small blind 10, big blind 20. Các vòng: Pre-flop → Flop (3 lá) → Turn → River → Showdown.',
    'Hành động: Check (qua), Call (theo), Raise (tố — chọn mức tối thiểu / ½ Pot / Pot / 2× Pot), Fold (bỏ), All-in (đẩy hết chip). Có pot phụ khi có người all-in.',
    'Xếp hạng: High Card < One Pair < Two Pair < Three of a Kind < Straight < Flush < Full House < Four of a Kind < Straight Flush < Royal Flush.',
    'AI chỉ dựa vào bài của nó và bài chung công khai; các cấp độ cao dùng ước lượng xác suất thắng và tỷ lệ pot.'
  ]],
  highCard: ['High Card', [
    'Số người 2–4. Mỗi ván mỗi người nhận 1 lá úp; bấm LẬT BÀI để lật. Lá cao nhất thắng ván.',
    'Thứ tự: 2 < 3 < … < 10 < J < Q < K < A. Cùng số thì so chất: ♠ < ♣ < ♦ < ♥.',
    'Chơi 3 ván; ai thắng nhiều ván nhất là người thắng chung cuộc.'
  ]],
  rummy: ['Rummy (kiểu Gin Rummy)', [
    'Số người 2–4. Mỗi người 10 lá (2 người) hoặc 7 lá (3–4 người). Một lá được lật ra làm chồng bỏ.',
    'Bộ hợp lệ: Set (3–4 lá cùng số) hoặc Sequence (≥3 lá liên tiếp cùng chất, A là lá nhỏ nhất). Lá không vào bộ gọi là deadwood (rác): A=1, 2–9 theo số, 10/J/Q/K=10.',
    'Mỗi lượt: bốc 1 lá (từ nọc hoặc lấy lá trên chồng bỏ), rồi đánh 1 lá — hoặc GÕ nếu sau khi đánh tổng rác ≤ 10.',
    'Khi có người gõ, mọi người hạ bài và so rác: gõ mà rác thấp nhất thì thắng (rác = 0 là Gin); nếu có người rác bằng hoặc thấp hơn thì bị undercut, người đó thắng.',
    'Hết nọc mà chưa ai gõ thì người ít rác nhất thắng. Bài trên tay tự động xếp bộ ở đầu hàng để dễ nhìn.'
  ]],
  solitaire: ['Solitaire (Klondike)', [
    '7 cột (cột i có i lá, chỉ lá cuối ngửa), 4 nền theo chất từ A → K, kho bài (stock) và chồng bỏ (waste). Chọn rút 1 hoặc 3 lá mỗi lần.',
    'Xếp lá trên cột theo thứ tự giảm dần và xen kẽ màu đỏ/đen. Chỉ lá K (hoặc chuỗi bắt đầu bằng K) được đặt vào cột trống. Có thể chuyển cả chuỗi đúng thứ tự giữa các cột; lá úp được lật khi lộ ra.',
    'Cách chơi: chạm một lá để chọn, chạm cột hoặc nền đích để chuyển. Chạm đúp để đẩy lá lên nền. Chạm kho để rút bài; kho hết thì chạm để lật lại chồng bỏ.',
    'Có Hoàn tác, Gợi ý, Lên nền (tự đẩy các lá lên nền), Ván mới và Chơi lại ván này. Thắng khi cả 52 lá lên 4 nền.'
  ]],
  freeCell: ['FreeCell', [
    '8 cột, tất cả lá đều ngửa (4 cột 7 lá, 4 cột 6 lá). 4 ô tạm (free cell) mỗi ô chứa 1 lá, và 4 nền theo chất A → K.',
    'Xếp lá trên cột theo thứ tự giảm dần và xen kẽ màu. Cột trống đặt được lá hoặc chuỗi bất kỳ.',
    'Số lá di chuyển cùng lúc tối đa = (số ô trống + 1) × 2^(số cột trống) (không tính cột đích nếu nó đang trống).',
    'Chạm lá để chọn, chạm đích để chuyển; chạm đúp để lên nền. Có Hoàn tác, Gợi ý. Thắng khi cả 52 lá lên 4 nền.'
  ]],
  spider: ['Spider Solitaire', [
    'Dùng 104 lá với 1, 2 hoặc 4 chất. 10 cột (4 cột 6 lá, 6 cột 5 lá, chỉ lá cuối ngửa) và kho 50 lá.',
    'Xếp lá giảm dần (không cần xen màu): được đặt lá lên lá lớn hơn 1 bậc bất kể chất. Chỉ di chuyển được cả chuỗi khi các lá cùng chất và liên tiếp.',
    'Chạm kho để chia 1 lá lên mỗi cột (không được có cột trống). Khi có đủ chuỗi K → A cùng chất ở cuối cột thì chuỗi tự được gỡ khỏi bàn.',
    'Thắng khi gỡ hết 8 chuỗi. Có Hoàn tác, Gợi ý và Chơi lại.'
  ]]
};
const RULES_EXTRA = [
  ['🏆 Giải đấu', [
    'Có 10 giải: Tân thủ (8 người, AI dễ), Nhanh (8), Hàng ngày (16, mỗi ngày 1 lần), Tuần (16, mỗi tuần 1 lần, có vòng bảng), Khu vực (8 đại diện), Quốc gia (16), Châu lục (16), Siêu khó (8 cao thủ), World Solo Championship (32 quốc gia) và Huyền thoại (32 quốc gia, toàn AI Siêu khó).',
    'Mở cho tất cả game đang chơi được: Tiến Lên (3 bản), Sâm Lốc, Blackjack, Xì Dách. Tiến Lên / Sâm Lốc: mỗi trận là một ván 1-1. Blackjack / Xì Dách: bạn và đối thủ cùng đấu nhà cái, ai được điểm cao hơn thì thắng trận; hòa thì đánh lại (loại trực tiếp).',
    'Vòng bảng: chia bảng 4 đội, mỗi đội đá 3 trận. Thắng 3 điểm, hòa 1 điểm; xếp theo điểm rồi số trận thắng. Top 2 mỗi bảng vào vòng loại trực tiếp.',
    'Vòng loại trực tiếp: thua là bị loại. Giải Siêu khó, World và Huyền thoại có vòng cuối đấu 3 ván thắng 2 (Huyền thoại: từ bán kết).',
    'Vô địch được XP thưởng, một chiếc cúp trong Phòng truyền thống và thành tích. Các trận của AI được mô phỏng bằng chính engine và AI của game.',
    'Giải đấu được lưu tự động. Mở lại game sẽ có lựa chọn "Tiếp tục giải đấu". Bỏ ván giữa chừng tính là thua ván đó.'
  ]],
  ['🏟️ Phòng chơi', [
    'Có 32 phòng, mỗi phòng 64 bàn (tổng 2.048 bàn). Phòng 1–8 AI Dễ, 9–16 Bình thường, 17–24 Khó, 25–32 Siêu khó.',
    'Mỗi bàn có game, số người, trạng thái: Đang chờ, Đang chơi, Đầy, Kết thúc. Chỉ bàn "Đang chờ" mới vào được; các ghế còn trống được AI lấp đầy.',
    'Dùng ô tìm phòng, tìm bàn, lọc game, lọc trạng thái và phân trang. Nút 🔄 làm mới danh sách bàn, ⚡ Vào nhanh chọn ngẫu nhiên một bàn đang chờ.'
  ]],
  ['📅 Nhiệm vụ & quà đăng nhập', [
    'Mỗi ngày có 3 nhiệm vụ mới (chơi, thắng, chặt bài, thắng trong giải đấu...). Hoàn thành rồi bấm NHẬN để lấy XP; nhận đủ cả 3 được thêm 100 XP.',
    'Quà đăng nhập: vào game mỗi ngày để giữ chuỗi ngày liên tiếp — chuỗi càng dài quà càng lớn (tối đa ở ngày thứ 7).'
  ]],
  ['🎨 Giao diện & danh hiệu', [
    'Lên level để mở khoá mặt sau lá bài và màu bàn chơi mới (vào Giao diện hoặc Cài đặt). Danh hiệu thay đổi theo level: Tân binh → Học việc → Tay chơi → Cao thủ → Đại cao thủ → Bậc thầy → Huyền thoại → CARD MASTER.'
  ]],
  ['🥇 Xếp hạng, lịch sử, sao lưu', [
    'Bảng xếp hạng là mô phỏng ngoại tuyến (đổi theo tuần), xếp theo tổng XP tích luỹ, có bảng toàn cầu và bảng quốc gia của bạn.',
    'Lịch sử lưu 30 ván gần nhất. Trong Cài đặt có Sao lưu dữ liệu: xuất ra một đoạn mã để cất giữ và nhập lại trên máy khác.'
  ]],
  ['😀 Phản ứng nhanh & sắp xếp bài', [
    'Nút 😀 trên thanh bàn chơi gửi biểu cảm nhanh; AI đôi khi đáp lại. Nút ↕ cạnh GỢI Ý đổi cách xếp bài: theo số, theo chất, hoặc gom theo bộ (đôi/ba/tứ).',
    'Cài đặt có thêm tốc độ AI (chậm / vừa / nhanh) và rung trên điện thoại.'
  ]]
];

/* ============================ 3. HỆ THỐNG LÁ BÀI ============================ */
const SUITS = [
  { key: 'S', sym: '♠', name: 'Bích', color: 'black', order: 0 },
  { key: 'C', sym: '♣', name: 'Tép', color: 'black', order: 1 },
  { key: 'D', sym: '♦', name: 'Rô', color: 'red', order: 2 },
  { key: 'H', sym: '♥', name: 'Cơ', color: 'red', order: 3 }
];
const SUIT_BY_KEY = {}; const SUIT_ORDER = {};
SUITS.forEach(s => { SUIT_BY_KEY[s.key] = s; SUIT_ORDER[s.key] = s.order; });
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const TL_ORDER = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
const TL_IDX = {}; TL_ORDER.forEach((r, i) => { TL_IDX[r] = i; });

const _L = 36, _C = 50, _R = 64;
const PIP_POS = {
  'A': [[_C, 70]], '2': [[_C, 30], [_C, 110]], '3': [[_C, 30], [_C, 70], [_C, 110]],
  '4': [[_L, 30], [_R, 30], [_L, 110], [_R, 110]],
  '5': [[_L, 30], [_R, 30], [_C, 70], [_L, 110], [_R, 110]],
  '6': [[_L, 30], [_R, 30], [_L, 70], [_R, 70], [_L, 110], [_R, 110]],
  '7': [[_L, 30], [_R, 30], [_C, 50], [_L, 70], [_R, 70], [_L, 110], [_R, 110]],
  '8': [[_L, 30], [_R, 30], [_C, 50], [_L, 70], [_R, 70], [_C, 90], [_L, 110], [_R, 110]],
  '9': [[_L, 30], [_R, 30], [_L, 56.7], [_R, 56.7], [_C, 70], [_L, 83.3], [_R, 83.3], [_L, 110], [_R, 110]],
  '10': [[_L, 30], [_R, 30], [_C, 43], [_L, 56.7], [_R, 56.7], [_L, 83.3], [_R, 83.3], [_C, 97], [_L, 110], [_R, 110]]
};
const CARD_IMG_CACHE = {};
let CARD_BACK_URI = null;

function buildCardSvg(card) {
  const su = SUIT_BY_KEY[card.suit];
  const col = su.color === 'red' ? '#c4192d' : '#15171c';
  const r = card.rank, sym = su.sym;
  const fs = r === '10' ? 23 : 28;
  let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1ece0"/></linearGradient></defs>' +
    '<rect x="1" y="1" width="98" height="138" rx="9" fill="url(#g)" stroke="#a9adb6" stroke-width="2"/>' +
    '<rect x="5" y="5" width="90" height="130" rx="6" fill="none" stroke="' + col + '" stroke-opacity=".12"/>' +
    '<g fill="' + col + '" font-family="Georgia,\'Times New Roman\',serif" font-weight="700" text-anchor="middle">';
  const corner = '<text x="15" y="27" font-size="' + fs + '">' + r + '</text><text x="15" y="49" font-size="23">' + sym + '</text>';
  s += corner + '<g transform="rotate(180 50 70)">' + corner + '</g>';
  if (r === 'J' || r === 'Q' || r === 'K') {
    const gold = '#e0b64d', skin = '#f2d3b0';
    const fig = (r === 'K'
      ? '<path d="M39 46 L41 34 L46 40 L50 31 L54 40 L59 34 L61 46 Z" fill="' + gold + '" stroke="#8a6a1d"/><circle cx="50" cy="55" r="9" fill="' + skin + '" stroke="#8a6a4a"/><path d="M42 58 Q50 72 58 58 Q50 64 42 58Z" fill="#6b4a2a"/>'
      : r === 'Q'
        ? '<path d="M40 46 L42 36 L46 41 L50 33 L54 41 L58 36 L60 46 Z" fill="' + gold + '" stroke="#8a6a1d"/><circle cx="50" cy="55" r="9" fill="' + skin + '" stroke="#8a6a4a"/><path d="M40 52 Q38 66 44 70 L44 58Z M60 52 Q62 66 56 70 L56 58Z" fill="#6b4a2a"/><circle cx="50" cy="40" r="1.8" fill="#c4192d"/>'
        : '<path d="M40 48 Q50 30 60 48 Z" fill="' + col + '" stroke="#333"/><path d="M58 44 Q66 36 64 30" stroke="#c4192d" stroke-width="2" fill="none"/><circle cx="50" cy="56" r="9" fill="' + skin + '" stroke="#8a6a4a"/>') +
      '<path d="M33 86 Q35 68 50 65 Q65 68 67 86 Z" fill="' + col + '" fill-opacity=".85" stroke="#333" stroke-opacity=".4"/><text x="50" y="83" font-size="13" fill="#fff" stroke="none">' + r + '</text>';
    s += '<rect x="26" y="26" width="48" height="88" rx="4" fill="' + col + '" fill-opacity=".06" stroke="' + col + '" stroke-width="1.6" opacity=".7"/>' + fig +
      '<g transform="rotate(180 50 70)">' + fig + '</g>';
  } else {
    const pos = PIP_POS[r];
    const size = r === 'A' ? 54 : 24;
    pos.forEach(p => {
      const rot = p[1] > 70 ? ' transform="rotate(180 ' + p[0] + ' ' + p[1] + ')"' : '';
      s += '<text x="' + p[0] + '" y="' + (p[1] + size * 0.33) + '" font-size="' + size + '"' + rot + '>' + sym + '</text>';
    });
  }
  return s + '</g></svg>';
}
function getCardImage(card) {
  if (!card) return getCardBack();
  if (!CARD_IMG_CACHE[card.id]) CARD_IMG_CACHE[card.id] = 'data:image/svg+xml;utf8,' + encodeURIComponent(buildCardSvg(card));
  return CARD_IMG_CACHE[card.id];
}
function getCardBack() { return cardBackUri(currentCardBack()); }
const CARD_BY_ID = {};
(function buildCanon() {
  SUITS.forEach(su => RANKS.forEach((rk, i) => {
    const id = rk + su.key;
    CARD_BY_ID[id] = { id, rank: rk, suit: su.key, value: i + 1, color: su.color, image: null };
  }));
})();
function createDeck() {
  const d = [];
  SUITS.forEach(su => RANKS.forEach(rk => {
    const c = Object.assign({}, CARD_BY_ID[rk + su.key]);
    c.image = getCardImage(c);
    d.push(c);
  }));
  return d;
}
function shuffleDeck(deck) { // Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
function assertValidDeck(deck) {
  if (!Array.isArray(deck) || deck.length !== 52) throw new Error('Bộ bài phải đủ 52 lá');
  const ids = new Set(deck.map(c => c.id));
  if (ids.size !== 52) throw new Error('Bộ bài có lá trùng');
  if (new Set(deck.map(c => c.suit)).size !== 4) throw new Error('Bộ bài thiếu chất');
  if (new Set(deck.map(c => c.rank)).size !== 13) throw new Error('Bộ bài thiếu số');
  return true;
}
function newShuffledDeck() { const d = createDeck(); assertValidDeck(d); return shuffleDeck(d); }
function drawCard(deck) {
  if (!deck.length) { const nd = newShuffledDeck(); nd.forEach(c => deck.push(c)); }
  return deck.pop();
}
function dealCards(deck, nPlayers, perPlayer) {
  const hands = Array.from({ length: nPlayers }, () => []);
  for (let r = 0; r < perPlayer; r++) for (let p = 0; p < nPlayers; p++) hands[p].push(drawCard(deck));
  return hands;
}
function tlPower(c) { return TL_IDX[c.rank] * 4 + SUIT_ORDER[c.suit]; }
function sortCards(cards) { return cards.sort((a, b) => tlPower(a) - tlPower(b)); }
function playCard(hand, id) {
  const i = hand.findIndex(c => c.id === id);
  return i < 0 ? null : hand.splice(i, 1)[0];
}
function cardLabel(c) { return c.rank + ' ' + SUIT_BY_KEY[c.suit].name; }
function cardShort(c) { return c.rank + SUIT_BY_KEY[c.suit].sym; }

/* Tính bố cục tay bài: KHÔNG chồng, KHÔNG tràn, dễ đọc, dễ chạm.
   viewportWidth/viewportHeight = vùng khả dụng (đã trừ vùng khác). */
/* Bố cục MỘT HÀNG: các lá chồng nhẹ lên nhau, luôn lộ số + chất ở góc trái để đọc và chạm */
function calcRowLayout(o) {
  const gap = o.gap != null ? o.gap : 4, ratio = 1.4, n = Math.max(1, o.cardCount | 0);
  const availW = Math.max(80, o.viewportWidth), availH = Math.max(40, o.viewportHeight);
  const maxW = o.cardWidth || 84, minStep = o.minStep || 22;
  const need = cw => (n <= 1 ? 0 : Math.max(minStep, cw * 0.3));
  let w = Math.min(maxW, Math.floor(availH / ratio));
  while (w > 30 && w + (n - 1) * need(w) > availW) w--;
  w = Math.max(24, w);
  const step = n <= 1 ? 0 : Math.max(8, Math.min(w + gap, (availW - w) / (n - 1)));
  const ch = Math.round(w * ratio), totalWidth = Math.round(w + (n - 1) * step);
  return {
    cardWidth: w, cardHeight: ch, gap, step, overlap: Math.max(0, w - step), columns: n, rows: 1, totalWidth, totalHeight: ch,
    startX: Math.max(0, (o.viewportWidth - totalWidth) / 2), startY: Math.max(0, (o.viewportHeight - ch) / 2), mode: 'row',
    orientation: o.orientation || (o.viewportWidth >= o.viewportHeight ? 'landscape' : 'portrait')
  };
}
function calculateHandLayout(o) {
  if (o.mode === 'row') return calcRowLayout(o);
  const gap = o.gap != null ? o.gap : 6;
  const ratio = 1.4;
  const n = Math.max(1, o.cardCount | 0);
  const sa = o.safeArea || { left: 0, right: 0, top: 0, bottom: 0 };
  const availW = Math.max(80, o.viewportWidth - (sa.left || 0) - (sa.right || 0));
  const availH = Math.max(50, o.viewportHeight - (sa.top || 0) - (sa.bottom || 0));
  const maxW = o.cardWidth || 80;
  let best = null;
  for (let cols = n; cols >= 1; cols--) {
    const rows = Math.ceil(n / cols);
    let w = Math.min(maxW, (availW - gap * (cols - 1)) / cols);
    w = Math.min(w, ((availH - gap * (rows - 1)) / rows) / ratio);
    if (w <= 0) continue;
    if (!best || w > best.w + 0.01 || (Math.abs(w - best.w) <= 0.01 && rows < best.rows)) best = { w, cols, rows };
  }
  if (!best) best = { w: 24, cols: n, rows: 1 };
  const w = Math.max(20, Math.floor(best.w));
  const ch = Math.round(w * ratio);
  const totalWidth = best.cols * w + gap * (best.cols - 1);
  const totalHeight = best.rows * ch + gap * (best.rows - 1);
  return {
    cardWidth: w, cardHeight: ch, gap, columns: best.cols, rows: best.rows, totalWidth, totalHeight,
    startX: Math.max(0, (o.viewportWidth - totalWidth) / 2), startY: Math.max(0, (o.viewportHeight - totalHeight) / 2),
    orientation: o.orientation || (o.viewportWidth >= o.viewportHeight ? 'landscape' : 'portrait')
  };
}

/* ============================ 4. LƯU TRỮ ============================ */
function defaultData() {
  return {
    v: 2,
    profile: { name: 'Minh', avatar: '👨', country: 'VN', age: 25 },
    settings: { gameCfg: {}, sound: true, notify: true, vibrate: true, aiSpeed: 1, cardBack: 'classic', table: 'green', effects: true, animation: true, reducedMotion: false, theme: 'dark', aiLevel: 1, turnTime: 15, players: {} },
    statistics: { total: 0, wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0, playTime: 0, tournaments: 0, championships: 0, games: {} },
    achievements: {},
    xp: 0,
    level: 1,
    currentGame: null,
    currentMatch: null,
    tournament: null,
    rooms: { room: 1, epoch: (Date.now() % 100000) + 1 },
    tourMeta: { daily: '', weekly: '', game: 'tienLen', history: [], trophies: [] },
    missions: { date: '', list: [], bonus: false },
    daily: { last: '', streak: 0, claimed: '' },
    history: []
  };
}
function mergeDefaults(def, src) {
  if (def === null) return (src && typeof src === 'object') ? src : null;
  if (typeof def !== 'object' || Array.isArray(def)) return (typeof src === typeof def) ? src : def;
  if (!src || typeof src !== 'object' || Array.isArray(src)) return JSON.parse(JSON.stringify(def));
  if (Object.keys(def).length === 0) return src; // map động (games, achievements...)
  const out = {};
  for (const k of Object.keys(def)) out[k] = mergeDefaults(def[k], src[k]);
  return out;
}
function sanitizeData(d) {
  const x = mergeDefaults(defaultData(), d);
  if ((Number(d && d.v) || 1) < 2) { x.level = 1; x.xp = 0; } // bản cũ dùng Lv.12 mặc định giả → đặt lại Lv.1 / 0 XP
  x.v = 2;
  x.profile.name = sanitizeName(x.profile.name) || 'Minh';
  if (!COUNTRY_BY_CODE[x.profile.country]) x.profile.country = 'VN';
  x.profile.age = clamp(Math.round(Number(x.profile.age) || 25), 6, 120);
  x.level = clamp(Math.round(Number(x.level) || 1), 1, 100);
  x.xp = Math.max(0, Number(x.xp) || 0);
  x.settings.aiLevel = Number.isFinite(Number(x.settings.aiLevel)) ? clamp(Math.round(Number(x.settings.aiLevel)), 0, 4) : 1;
  if (!TIME_OPTIONS.includes(x.settings.turnTime)) x.settings.turnTime = 15;
  if (!['light', 'dark', 'system'].includes(x.settings.theme)) x.settings.theme = 'dark';
  x.rooms.room = clamp(Math.round(Number(x.rooms.room)) || 1, 1, 32);
  x.rooms.epoch = Number.isFinite(Number(x.rooms.epoch)) && Number(x.rooms.epoch) > 0 ? Math.floor(Number(x.rooms.epoch)) : (Date.now() % 100000) + 1;
  if (!Array.isArray(x.tourMeta.history)) x.tourMeta.history = [];
  x.tourMeta.history = x.tourMeta.history.filter(e => e && typeof e.name === 'string').slice(0, 8);
  if (typeof x.tourMeta.daily !== 'string') x.tourMeta.daily = '';
  if (typeof x.tourMeta.weekly !== 'string') x.tourMeta.weekly = '';
  if (!Array.isArray(x.tourMeta.trophies)) x.tourMeta.trophies = [];
  x.tourMeta.trophies = x.tourMeta.trophies.filter(e => e && typeof e.name === 'string').slice(0, 40);
  if (!Array.isArray(x.missions.list)) x.missions.list = [];
  if (!Array.isArray(x.history)) x.history = [];
  x.history = x.history.filter(e => e && typeof e.g === 'string').slice(0, 30);
  x.settings.aiSpeed = clamp(Math.round(Number(x.settings.aiSpeed)) || 0, 0, 2);
  if (typeof x.settings.cardBack !== 'string') x.settings.cardBack = 'classic';
  if (typeof x.settings.table !== 'string') x.settings.table = 'green';
  const t = x.tournament;
  if (t && !(Array.isArray(t.players) && t.players.length >= 2 && ['group', 'ko', 'done'].includes(t.phase) && TOURNAMENTS[t.id] && Array.isArray(t.round) && t.log && t.stats && Tour.H2H_GAMES.includes(t.gameId))) x.tournament = null;
  return x;
}
function cardReplacer(k, v) {
  if (v && typeof v === 'object' && typeof v.id === 'string' && typeof v.rank === 'string' && typeof v.suit === 'string' && 'image' in v) return { __c: v.id };
  return v;
}
function cardReviver(k, v) {
  if (v && typeof v === 'object' && typeof v.__c === 'string' && CARD_BY_ID[v.__c]) {
    const c = Object.assign({}, CARD_BY_ID[v.__c]); c.image = getCardImage(c); return c;
  }
  return v;
}
const Store = {
  ok: true,
  load() {
    let raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { this.ok = false; }
    if (!raw) return defaultData();
    try { return sanitizeData(JSON.parse(raw, cardReviver)); } catch (e) { return defaultData(); }
  },
  save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data, cardReplacer)); return true; }
    catch (e) { this.ok = false; return false; }
  }
};
let Data = defaultData();
function saveData() { return Store.save(Data); }

/* ============================ 5. ÂM THANH (Web Audio) ============================ */
const SFX = (function () {
  let ctx = null;
  const NOTIFY = { notification: 1, warn: 1, error: 1, success: 1 };
  function ensure() {
    if (!IN_BROWSER) return null;
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, delay) {
    const c = ensure(); if (!c) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.06, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function glide(f1, f2, dur, type, vol, delay) { // âm trượt tần số
    const c = ensure(); if (!c) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.06, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, ftype, freq, delay, q) { // tiếng sột soạt của lá bài
    const c = ensure(); if (!c) return;
    const t = c.currentTime + (delay || 0), len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = ftype || 'bandpass'; f.frequency.value = freq || 2500; f.Q.value = q || 0.8;
    const g = c.createGain(); g.gain.setValueAtTime(vol || 0.1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(c.destination); src.start(t); src.stop(t + dur + 0.02);
  }
  const SOUNDS = {
    click: () => tone(560, 0.05, 'square', 0.03),
    select: () => tone(720, 0.04, 'sine', 0.05),
    timer: () => tone(900, 0.07, 'square', 0.04),
    // chia bài: tiếng "phạch" nhẹ của lá bài lướt qua
    deal: () => { noise(0.07, 0.11, 'highpass', 2200); tone(240, 0.05, 'triangle', 0.03, 0.01); },
    // đánh bài: tiếng "tạch" của lá bài úp xuống bàn
    card: () => { noise(0.06, 0.12, 'bandpass', 900, 0, 1.2); tone(150, 0.09, 'sine', 0.13); },
    // ăn bài: thu bài về — trượt lên và "ting"
    eat: () => { glide(300, 900, 0.2, 'triangle', 0.07); noise(0.14, 0.07, 'bandpass', 3200, 0.02); tone(988, 0.14, 'sine', 0.05, 0.18); tone(1319, 0.14, 'sine', 0.04, 0.26); },
    // chặt: tiếng nổ trầm + va đập
    chat: () => { glide(170, 45, 0.5, 'sine', 0.26); glide(340, 110, 0.32, 'sawtooth', 0.07); noise(0.4, 0.15, 'lowpass', 1300); tone(110, 0.25, 'square', 0.04, 0.04); },
    // tới lượt: chuông hai nốt nhẹ
    turn: () => { tone(659, 0.12, 'sine', 0.05); tone(880, 0.2, 'sine', 0.05, 0.1); },
    win: () => { [[523, 659, 784], [659, 784, 1047], [784, 1047, 1319]].forEach((ch, i) => ch.forEach(f => tone(f, i === 2 ? 0.55 : 0.2, 'triangle', 0.05, i * 0.16))); },
    lose: () => { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.26, 'sawtooth', 0.035, i * 0.17)); glide(200, 90, 0.5, 'sine', 0.05, 0.68); },
    levelup: () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.2, 'triangle', 0.06, i * 0.09)); glide(600, 2400, 0.5, 'sine', 0.04, 0.1); tone(2093, 0.4, 'sine', 0.035, 0.6); },
    achievement: () => [659, 784, 988, 1319, 1568].forEach((f, i) => tone(f, 0.16, 'triangle', 0.06, i * 0.09)),
    // âm thanh thông báo
    notification: () => { tone(660, 0.08, 'sine', 0.06); tone(880, 0.1, 'sine', 0.06, 0.09); },
    success: () => { tone(784, 0.09, 'sine', 0.05); tone(1047, 0.14, 'sine', 0.05, 0.08); },
    warn: () => { tone(440, 0.1, 'square', 0.035); tone(440, 0.1, 'square', 0.035, 0.14); },
    error: () => { tone(220, 0.22, 'sawtooth', 0.05); tone(165, 0.25, 'sawtooth', 0.05, 0.16); }
  };
  return {
    play(name) {
      if (!Data.settings.sound) return;
      if (NOTIFY[name] && Data.settings.notify === false) return;
      try { if (SOUNDS[name]) SOUNDS[name](); } catch (e) { /* bỏ qua lỗi âm thanh */ }
    },
    unlock() { try { ensure(); } catch (e) { } }
  };
})();

/* ============================ 6. XP / LEVEL / THỐNG KÊ ============================ */
function xpNeed(level) { return 400 * level + 200; }
function addXP(amount, cap) {
  amount = clamp(Math.round(amount), 0, cap || 500); // chống cộng XP vô hạn
  Data.xp += amount;
  let leveled = 0;
  while (Data.level < 100 && Data.xp >= xpNeed(Data.level)) { Data.xp -= xpNeed(Data.level); Data.level++; leveled++; }
  if (Data.level >= 100) Data.xp = Math.min(Data.xp, xpNeed(100) - 1);
  if (leveled > 0 && IN_BROWSER && typeof levelUpFx === 'function') { const lv = Data.level; setTimeout(() => levelUpFx(lv), 900); }
  return { amount, leveled };
}
function calcXP(outcome, diff, streak, specialCount) {
  let xp;
  if (outcome === 'win') xp = 80 + diff * 20 + Math.min(streak, 10) * 5 + specialCount * 30;
  else if (outcome === 'draw') xp = 35;
  else xp = 10 + diff * 3; // thua vẫn được ít XP
  return clamp(xp, 0, 400);
}
function recordMatch(gameId, outcome, seconds) {
  const st = Data.statistics;
  st.total++; st.playTime += Math.max(0, Math.round(seconds || 0));
  const g = st.games[gameId] || (st.games[gameId] = { played: 0, won: 0, lost: 0, draw: 0 });
  g.played++;
  if (outcome === 'win') { st.wins++; g.won++; st.streak++; if (st.streak > st.bestStreak) st.bestStreak = st.streak; }
  else if (outcome === 'lose') { st.losses++; g.lost++; st.streak = 0; }
  else { st.draws++; g.draw++; }
}
function checkAchievements(specials) {
  const got = [];
  ACHIEVEMENTS.forEach(a => {
    if (!Data.achievements[a.id]) {
      let ok = false;
      try { ok = a.test(Data, specials || []); } catch (e) { ok = false; }
      if (ok) { Data.achievements[a.id] = Date.now(); got.push(a); }
    }
  });
  return got;
}

/* ============================ 7. TIMERS ============================ */
const Timers = {
  ids: new Set(),
  set(fn, ms) {
    const id = setTimeout(() => { Timers.ids.delete(id); try { fn(); } catch (e) { handleError(e); } }, ms);
    Timers.ids.add(id); return id;
  },
  clearAll() { Timers.ids.forEach(clearTimeout); Timers.ids.clear(); }
};
const TurnTimer = {
  iv: null, endAt: 0, total: 0, remainMs: 0, paused: false, cb: null, lastTick: -1,
  startTimer(sec, cb) {
    this.stopTimer(); this.total = sec * 1000; this.endAt = Date.now() + this.total; this.cb = cb; this.paused = false; this.lastTick = -1;
    this.iv = setInterval(() => this.tick(), 200); this.tick();
  },
  tick() {
    if (this.paused) return;
    const left = Math.max(0, this.endAt - Date.now());
    const secs = Math.ceil(left / 1000);
    if (typeof UI !== 'undefined' && UI.updateTimer) UI.updateTimer(secs, left / this.total);
    if (secs <= 5 && secs > 0 && secs !== this.lastTick) { this.lastTick = secs; SFX.play('timer'); }
    if (left <= 0) this.handleTimeout();
  },
  pauseTimer() { if (this.iv && !this.paused) { this.paused = true; this.remainMs = Math.max(0, this.endAt - Date.now()); } },
  resumeTimer() { if (this.iv && this.paused) { this.paused = false; this.endAt = Date.now() + this.remainMs; } },
  stopTimer() { if (this.iv) clearInterval(this.iv); this.iv = null; this.cb = null; this.paused = false; if (typeof UI !== 'undefined' && UI.updateTimer) UI.updateTimer(null, 0); },
  handleTimeout() { const cb = this.cb; this.stopTimer(); if (cb) { try { cb(); } catch (e) { handleError(e); } } }
};

/* ============================ 8. STATE TRUNG TÂM ============================ */
function newGameState() {
  return {
    currentGame: null, room: null, table: null, players: [], deck: [], hands: [], turn: 0, timer: null,
    playedCards: [], score: {}, phase: 'idle', tournament: null, settings: null,
    cfg: null, lastPlay: null, passed: [], first: true, firstCardId: null, bao: null, over: null,
    dealer: null, handIdx: 0, startCounts: [], round: 0
  };
}
let gameState = newGameState();

function pickOpponents(n, levelSetting, exclude) {
  const myName = norm(Data.profile.name), ex = new Set((exclude || []).map(norm));
  const pool = AI_ROSTER.filter(a => norm(a.name) !== myName && !ex.has(norm(a.name)));
  for (let i = pool.length - 1; i > 0; i--) { const j = rand(i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const chosen = [], usedC = new Set();
  pool.forEach(a => { if (chosen.length < n && !usedC.has(a.country)) { chosen.push(a); usedC.add(a.country); } });
  pool.forEach(a => { if (chosen.length < n && !chosen.includes(a)) chosen.push(a); });
  const avs = AVATARS.slice(); for (let i = avs.length - 1; i > 0; i--) { const j = rand(i + 1); [avs[i], avs[j]] = [avs[j], avs[i]]; }
  return chosen.slice(0, n).map((a, i) => {
    const c = COUNTRY_BY_CODE[a.country] || COUNTRY_BY_CODE.VN;
    return {
      name: a.name, avatar: avs[i % avs.length], country: c.name, code: c.code, flag: c.flag,
      difficulty: levelSetting === 4 ? rand(4) : clamp(levelSetting, 0, 3)
    };
  });
}
function makePlayers(count) {
  let opp;
  if (NEXT_OPP && NEXT_OPP.length) { // đối thủ chỉ định (giải đấu / bàn trong phòng)
    opp = NEXT_OPP.slice(0, count - 1);
    if (opp.length < count - 1) opp = opp.concat(pickOpponents(count - 1 - opp.length, effAiLevel(), opp.map(o => o.name)));
  } else opp = pickOpponents(count - 1, effAiLevel());
  NEXT_OPP = null;
  const c = COUNTRY_BY_CODE[Data.profile.country] || COUNTRY_BY_CODE.VN;
  const me = { id: 0, name: Data.profile.name, avatar: Data.profile.avatar, country: c.name, code: c.code, flag: c.flag, isHuman: true, level: -1 };
  return [me].concat(opp.map((o, i) => ({ id: i + 1, name: o.name, avatar: o.avatar, country: o.country, code: o.code, flag: o.flag, isHuman: false, level: o.difficulty })));
}
function cardsLeft(p) { return gameState.hands[p].length; }
function oppMinCards(p) {
  let m = 99; gameState.hands.forEach((hd, i) => { if (i !== p && hd.length < m) m = hd.length; }); return m;
}

/* ============================ 9. GAME ENGINES — DÙNG CHUNG CHO NHÓM ĐÁNH HẾT BÀI ============================ */
/* Ước lượng số lượt cần để hết bài (ít hơn = tay bài tốt hơn) */
function tlEstimateTurns(hand) {
  const cnt = new Array(13).fill(0);
  hand.forEach(c => { cnt[TL_IDX[c.rank]]++; });
  let turns = 0;
  for (let i = 0; i < 13; i++) if (cnt[i]) turns++;
  let run = 0;
  for (let i = 0; i <= 12; i++) {
    if (i < 12 && cnt[i]) run++;
    else { if (run >= 3) turns -= (run - 1); run = 0; }
  }
  return Math.max(turns, hand.length ? 1 : 0);
}
function shedValidate(eng, p, move) {
  const gs = gameState;
  if (!move) return { ok: false, reason: 'Không có nước đi' };
  if (gs.over || gs.turn !== p) return { ok: false, reason: 'Chưa đến lượt' };
  if (move.type === 'pass') {
    if (!gs.lastPlay || gs.lastPlay.player === p) return { ok: false, reason: 'Bạn đang dẫn vòng, không thể bỏ lượt' };
    return { ok: true };
  }
  if (move.type !== 'play' || !Array.isArray(move.cards) || !move.cards.length) return { ok: false, reason: 'Chưa chọn lá bài' };
  const hand = gs.hands[p], seen = new Set(), cards = [];
  for (const id of move.cards) {
    if (seen.has(id)) return { ok: false, reason: 'Lá bài bị trùng' };
    const c = hand.find(x => x.id === id);
    if (!c) return { ok: false, reason: 'Lá bài không có trên tay' };
    seen.add(id); cards.push(c);
  }
  const combo = eng.classify(cards);
  if (!combo) return { ok: false, reason: 'Bài chọn chưa thành bộ hợp lệ' };
  // Luật thối 2: không được đánh quân 2 làm nước cuối cùng (hết bài bằng 2)
  if (cards.length === hand.length && cards.some(c => c.rank === '2')) return { ok: false, reason: 'Không được đánh quân 2 cuối cùng (thối 2)' };
  if (gs.first && eng.mustFirst && !seen.has(gs.firstCardId)) return { ok: false, reason: 'Ván đầu phải đánh có ' + cardShort(CARD_BY_ID[gs.firstCardId]) };
  const prev = gs.lastPlay ? gs.lastPlay.combo : null;
  if (prev && !eng.canBeat(prev, combo)) {
    return { ok: false, reason: (prev.type === combo.type && prev.len === combo.len) ? 'Bộ bài chưa đủ lớn' : 'Phải đánh cùng loại với bộ trước' };
  }
  return { ok: true, combo };
}
function shedPlay(eng, p, move) {
  const gs = gameState;
  if (move.type === 'pass') { gs.passed[p] = true; return { type: 'pass', player: p }; }
  const cards = move.cards.map(id => playCard(gs.hands[p], id));
  const combo = eng.classify(cards);
  gs.lastPlay = { player: p, combo, cards };
  cards.forEach(c => gs.playedCards.push(c));
  gs.first = false;
  if (gs.hands[p].length === 0) gs.over = { winner: p, reason: 'out', quadFinish: combo.type === 'quad' };
  return { type: 'play', player: p, cards, combo };
}
function shedNextTurn() {
  const gs = gameState;
  if (gs.over) return;
  const n = gs.players.length;
  let t = gs.turn;
  for (let i = 0; i < n; i++) {
    t = (t + 1) % n;
    if (gs.lastPlay && t === gs.lastPlay.player) { // mọi người khác đã bỏ → vòng mới
      gs.passed = gs.passed.map(() => false); gs.lastPlay = null; gs.round++; gs.turn = t; gs.newRound = true; return;
    }
    if (!gs.passed[t]) { gs.turn = t; return; }
  }
}
function shedMovesFor(eng, p) {
  const gs = gameState, prev = gs.lastPlay ? gs.lastPlay.combo : null;
  let list = eng.generate(gs.hands[p]).filter(m => eng.canBeat(prev, m));
  list = list.filter(m => !(m.cards.length === gs.hands[p].length && m.cards.some(c => c.rank === '2'))); // thối 2
  if (gs.first && eng.mustFirst) list = list.filter(m => m.cards.some(c => c.id === gs.firstCardId));
  const moves = list.map(m => ({ type: 'play', cards: m.cards.map(c => c.id), combo: m }));
  return moves;
}
function shedCanPass(p) { const gs = gameState; return !!(gs.lastPlay && gs.lastPlay.player !== p); }
/* Kẹt: đang phải đánh tự do nhưng mọi nước đều là đánh 2 cuối cùng → thối 2, thua ván */
function shedIsStuck(eng, p) { const gs = gameState; return !gs.over && gs.turn === p && !shedCanPass(p) && shedMovesFor(eng, p).length === 0; }
function shedForceThoi(p) {
  const gs = gameState; let w = -1, best = 99;
  for (let i = 0; i < gs.players.length; i++) { if (i !== p && gs.hands[i].length < best) { best = gs.hands[i].length; w = i; } }
  gs.over = { winner: w, reason: 'thoi2', loser: p };
}
function shedScore(m, ctx) {
  const rem = ctx.hand.filter(c => !m.cards.includes(c.id));
  const turnsAfter = tlEstimateTurns(rem);
  let spend = 0; m.combo.cards.forEach(c => { spend += TL_IDX[c.rank] / 12; });
  let s = -turnsAfter * 10 - spend * (ctx.level >= 3 ? 3.2 : 2.2) + m.cards.length * 1.1;
  const prev = ctx.prev;
  if (prev) {
    const same = prev.type === m.combo.type && prev.len === m.combo.len;
    if (!same) s += (ctx.oppMin <= 3 || (prev.rank === 12 && ctx.level >= 2)) ? 4 : -7; // chặt: chỉ khi đáng
    else s -= (m.combo.key - prev.key) * 0.12; // ưu tiên nước nhỏ nhất vừa đủ
  }
  if (ctx.oppMin <= 2 && m.combo.type === 'single') s += prev ? m.combo.key * 0.35 : -(ctx.oppMin === 1 ? 30 : 6);
  if (ctx.level >= 3 && !prev && m.combo.type === 'single' && m.combo.key >= ctx.unseenMax && rem.length > 2) s -= 2.5; // giữ quân chủ lực
  if (rem.length === 0) s += 1000;
  if (rem.length === 1 && ctx.level >= 2) s += 3;
  return { s, turnsAfter };
}
/* AI chỉ dùng: bài của chính nó, số lá còn lại của người khác, lá đã đánh, bộ bài hiện trên bàn */
function shedChoose(p, moves, canPass, level) {
  const gs = gameState, hand = gs.hands[p], prev = gs.lastPlay ? gs.lastPlay.combo : null;
  const oppMin = oppMinCards(p);
  if (!moves.length) return { type: 'pass' };
  if (level >= 1) { // AI tránh để lại toàn quân 2 (không thể đi hết → thối 2)
    const onlyTwos = m => { const rem = hand.filter(c => !m.cards.includes(c.id)); return rem.length > 0 && rem.every(c => c.rank === '2'); };
    const safe = moves.filter(m => !onlyTwos(m));
    if (!safe.length && canPass) return { type: 'pass' };
    if (safe.length) moves = safe;
  }
  if (level <= 0) { if (canPass && Math.random() < 0.2) return { type: 'pass' }; return pick(moves); }
  if (level === 1) {
    if (prev) return minBy(moves, m => (m.combo.type === prev.type && m.combo.len === prev.len ? 0 : 1000) + m.combo.key);
    const low = minBy(hand, c => tlPower(c));
    const cand = moves.filter(m => m.cards.includes(low.id));
    const pool = cand.length ? cand : moves;
    return maxBy(pool, m => (['quad', 'dthong'].includes(m.combo.type) ? 0 : 1000) + m.cards.length * 10 - m.combo.key * 0.01);
  }
  const seen = new Set(hand.map(c => c.id)); gs.playedCards.forEach(c => seen.add(c.id));
  let unseenMax = -1; Object.keys(CARD_BY_ID).forEach(id => { if (!seen.has(id)) unseenMax = Math.max(unseenMax, tlPower(CARD_BY_ID[id])); });
  const ctx = { hand, prev, oppMin, level, unseenMax };
  const turnsNow = tlEstimateTurns(hand);
  let best = null, bs = -Infinity, bt = 0;
  moves.forEach(m => { const r = shedScore(m, ctx); if (r.s > bs) { bs = r.s; best = m; bt = r.turnsAfter; } });
  // Khó/Siêu khó: không phí quân mạnh (A/2) để đè bài thấp khi đối thủ còn nhiều lá và không giúp hết bài nhanh hơn
  if (canPass && oppMin > 4 && best.cards.some(id => TL_IDX[CARD_BY_ID[id].rank] >= 11) && bt >= turnsNow && !best.combo.cards.every(c => TL_IDX[c.rank] >= 11 && best.combo.type === 'single' && oppMin <= 4)) return { type: 'pass' };
  return best;
}

/* ============================ TIẾN LÊN (3 phiên bản) ============================ */
function tlClassify(cards, cfg) {
  const n = cards.length;
  if (!n) return null;
  const cs = cards.slice().sort((a, b) => tlPower(a) - tlPower(b));
  const rk = cs.map(c => TL_IDX[c.rank]);
  const base = { cards: cs, key: tlPower(cs[n - 1]), rank: rk[n - 1] };
  if (n === 1) return Object.assign({ type: 'single', len: 1 }, base);
  if (rk.every(r => r === rk[0])) {
    if (n === 2) return Object.assign({ type: 'pair', len: 2 }, base);
    if (n === 3) return Object.assign({ type: 'triple', len: 3 }, base);
    if (n === 4 && cfg.quad) return Object.assign({ type: 'quad', len: 4 }, base);
    return null;
  }
  if (n >= 3 && rk[n - 1] < 12) {
    let seq = true;
    for (let i = 1; i < n; i++) if (rk[i] !== rk[i - 1] + 1) { seq = false; break; }
    if (seq) return Object.assign({ type: 'straight', len: n }, base);
    if (cfg.dthong && n >= 6 && n % 2 === 0) {
      let ok = true;
      for (let i = 0; i < n / 2; i++) if (rk[2 * i] !== rk[0] + i || rk[2 * i + 1] !== rk[0] + i) { ok = false; break; }
      if (ok) return Object.assign({ type: 'dthong', len: n / 2 }, base);
    }
  }
  return null;
}
function tlCanBeat(prev, cur, cfg) {
  if (!prev) return true;
  if (prev.type === cur.type && prev.len === cur.len) return cur.key > prev.key;
  if (prev.type === 'single' && prev.rank === 12) {
    if (cur.type === 'quad' && cfg.quad) return true;
    if (cur.type === 'dthong' && cur.len >= 3 && cfg.dthongChatTwo) return true;
  }
  if (prev.type === 'pair' && prev.rank === 12 && cfg.chatDoi2) {
    if (cur.type === 'quad') return true;
    if (cur.type === 'dthong' && cur.len >= 4) return true;
  }
  if (prev.type === 'quad' && cur.type === 'dthong' && cur.len >= 4 && cfg.dthong4ChatQuad) return true;
  return false;
}
function tlGenerate(hand, cfg) {
  const by = Array.from({ length: 13 }, () => []);
  hand.forEach(c => by[TL_IDX[c.rank]].push(c));
  by.forEach(g => g.sort((a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]));
  const out = [];
  const add = cs => { const k = tlClassify(cs, cfg); if (k) out.push(k); };
  by.forEach(g => {
    const n = g.length;
    for (let i = 0; i < n; i++) add([g[i]]);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      add([g[i], g[j]]);
      for (let k = j + 1; k < n; k++) add([g[i], g[j], g[k]]);
    }
    if (n === 4 && cfg.quad) add(g);
  });
  for (let s = 0; s <= 9; s++) { // sảnh
    if (!by[s].length) continue;
    const cur = [];
    for (let r = s; r <= 11 && by[r].length; r++) {
      cur.push(r);
      if (cur.length >= 3) {
        add(cur.map(x => by[x][0]));
        const hi = cur.map(x => by[x][by[x].length - 1]);
        if (hi.some((c, i) => c !== by[cur[i]][0])) add(hi);
      }
    }
  }
  if (cfg.dthong) { // đôi thông
    for (let s = 0; s <= 9; s++) {
      if (by[s].length < 2) continue;
      const cur = [];
      for (let r = s; r <= 11 && by[r].length >= 2; r++) {
        cur.push(r);
        if (cur.length >= 3) {
          add(cur.flatMap(x => [by[x][0], by[x][1]]));
          add(cur.flatMap(x => [by[x][by[x].length - 2], by[x][by[x].length - 1]]));
        }
      }
    }
  }
  return out;
}
function tlWhite(hand, cfg) {
  const cnt = new Array(13).fill(0); hand.forEach(c => { cnt[TL_IDX[c.rank]]++; });
  for (const w of cfg.white) {
    if (w === 'rong') { let all = true; for (let i = 0; i <= 11; i++) if (!cnt[i]) { all = false; break; } if (all) return 'Sảnh rồng'; }
    if (w === 'tuQuy2' && cnt[12] === 4) return 'Tứ quý 2';
    if (w === 'tuQuy3' && cnt[0] === 4) return 'Tứ quý 3';
    if (w === '6doi') { let pairs = 0; cnt.forEach(c => { pairs += Math.floor(c / 2); }); if (pairs >= 6) return '6 đôi'; }
  }
  return null;
}
function makeTienLen(id, cfg) {
  const eng = {
    id, kind: 'shed', cfg, mustFirst: true,
    classify: cs => tlClassify(cs, cfg),
    canBeat: (a, b) => tlCanBeat(a, b, cfg),
    generate: hand => tlGenerate(hand, cfg),
    setup(opts) {
      gameState = newGameState();
      gameState.currentGame = id; gameState.cfg = cfg;
      gameState.players = makePlayers(clamp(opts.players, 2, 4));
      gameState.deck = newShuffledDeck();
    },
    deal() {
      const gs = gameState, n = gs.players.length;
      gs.hands = dealCards(gs.deck, n, 13).map(sortCards);
      gs.startCounts = gs.hands.map(x => x.length);
      gs.passed = new Array(n).fill(false); gs.lastPlay = null; gs.first = true; gs.playedCards = []; gs.over = null; gs.round = 0;
      let low = null, lp = 0;
      gs.hands.forEach((hd, i) => { if (!low || tlPower(hd[0]) < tlPower(low)) { low = hd[0]; lp = i; } });
      gs.turn = lp; gs.firstCardId = low.id;
      for (let k = 0; k < n; k++) { // tới trắng
        const p = (lp + k) % n, w = tlWhite(gs.hands[p], cfg);
        if (w) { gs.over = { winner: p, reason: 'trang', label: w }; break; }
      }
      gs.phase = gs.over ? 'over' : 'play';
    },
    validateMove: (p, move) => shedValidate(eng, p, move),
    getValidMoves(p) {
      const gs = gameState; if (gs.over || gs.turn !== p) return [];
      const m = shedMovesFor(eng, p); if (shedCanPass(p)) m.push({ type: 'pass' }); return m;
    },
    play: (p, move) => shedPlay(eng, p, move),
    nextTurn: shedNextTurn,
    isStuck: p => shedIsStuck(eng, p),
    forceThoi: p => shedForceThoi(p),
    checkWin: () => gameState.over,
    aiChoose(p, level) { return shedChoose(p, shedMovesFor(eng, p), shedCanPass(p), level); },
    timeoutMove(p) {
      if (shedCanPass(p)) return { type: 'pass' };
      const ms = shedMovesFor(eng, p);
      return ms.length ? minBy(ms, m => m.combo.key - m.cards.length * 1000) : { type: 'pass' };
    },
    hint(p) { const ms = shedMovesFor(eng, p); return ms.length ? shedChoose(p, ms, shedCanPass(p), 2) : { type: 'pass' }; },
    calculateResult() {
      const gs = gameState, o = gs.over, n = gs.players.length;
      const others = []; for (let i = 0; i < n; i++) if (i !== o.winner) others.push(i);
      others.sort((a, b) => gs.hands[a].length - gs.hands[b].length || a - b);
      if (o.reason === 'thoi2') others.sort((a, b) => (a === o.loser ? 1 : 0) - (b === o.loser ? 1 : 0));
      const rankings = [{ p: o.winner, label: o.reason === 'trang' ? 'Ăn trắng — ' + o.label : o.reason === 'thoi2' ? 'Thắng — đối thủ thối 2' : 'Hết bài' }];
      others.forEach(p => {
        const left = gs.hands[p].length; let label = left + ' lá còn lại';
        if (p === o.loser) label = 'Thối 2 — còn ' + left + ' lá';
        else if (gs.hands[p].some(c => c.rank === '2')) label += ' · Thối 2';
        if (left === gs.startCounts[p]) label += ' · Cóng';
        rankings.push({ p, label });
      });
      const specials = [];
      if (o.winner === 0) { if (o.reason === 'trang') specials.push('trang'); if (o.quadFinish) specials.push('quad'); }
      return { outcome: o.winner === 0 ? 'win' : 'lose', rankings, specials, headline: o.reason === 'trang' ? '🏆 ĂN TRẮNG' : o.reason === 'thoi2' ? (o.loser === 0 ? '💥 BẠN BỊ THỐI 2' : '💥 ĐỐI THỦ THỐI 2') : null };
    }
  };
  return eng;
}

/* ============================ SÂM LỐC (engine riêng) ============================ */
function samClassify(cards) {
  const n = cards.length; if (!n) return null;
  const cs = cards.slice().sort((a, b) => tlPower(a) - tlPower(b));
  const rk = cs.map(c => TL_IDX[c.rank]);
  const base = { cards: cs, key: rk[n - 1], rank: rk[n - 1] };
  if (n === 1) return Object.assign({ type: 'single', len: 1 }, base);
  if (rk.every(r => r === rk[0])) {
    if (n === 2) return Object.assign({ type: 'pair', len: 2 }, base);
    if (n === 3) return Object.assign({ type: 'triple', len: 3 }, base);
    if (n === 4) return Object.assign({ type: 'quad', len: 4 }, base);
    return null;
  }
  if (n >= 3 && rk[n - 1] < 12) {
    for (let i = 1; i < n; i++) if (rk[i] !== rk[i - 1] + 1) return null;
    return Object.assign({ type: 'straight', len: n }, base);
  }
  return null;
}
function samCanBeat(prev, cur) { // chất không quyết định: bằng nhau không chặt được
  if (!prev) return true;
  if (prev.type === cur.type && prev.len === cur.len) return cur.key > prev.key;
  if (cur.type === 'quad' && ((prev.type === 'single' && prev.key === 12) || (prev.type === 'pair' && prev.key === 12))) return true;
  return false;
}
function samGenerate(hand) {
  const by = Array.from({ length: 13 }, () => []);
  hand.forEach(c => by[TL_IDX[c.rank]].push(c));
  const out = [];
  by.forEach(g => { for (let k = 1; k <= g.length; k++) { const c = samClassify(g.slice(0, k)); if (c) out.push(c); } });
  for (let s = 0; s <= 9; s++) {
    if (!by[s].length) continue;
    const cur = [];
    for (let r = s; r <= 11 && by[r].length; r++) { cur.push(r); if (cur.length >= 3) { const c = samClassify(cur.map(x => by[x][0])); if (c) out.push(c); } }
  }
  return out;
}
function samInstantWin(hand) {
  const cnt = new Array(13).fill(0); hand.forEach(c => { cnt[TL_IDX[c.rank]]++; });
  if (cnt[12] === 4) return 'Tứ quý 2';
  let pairs = 0; cnt.forEach(c => { pairs += Math.floor(c / 2); });
  if (pairs >= 5) return '5 đôi';
  for (let s = 0; s + 9 <= 11; s++) { let ok = true; for (let i = s; i < s + 10; i++) if (!cnt[i]) { ok = false; break; } if (ok) return 'Sảnh rồng'; }
  return null;
}
/* AI quyết định báo Sâm dựa trên tay bài của chính nó */
function samAIWantsBao(hand, level) {
  if (level <= 0) return false;
  const turns = tlEstimateTurns(hand), strong = hand.filter(c => TL_IDX[c.rank] >= 11).length;
  if (level === 1) return turns <= 3 && strong >= 4;
  return (turns <= 4 && strong >= 3) || (turns <= 3 && strong >= 2);
}
const SAM_ENGINE = {
  id: 'samLoc', kind: 'shed', cfg: {}, mustFirst: false,
  classify: samClassify, canBeat: samCanBeat, generate: samGenerate,
  setup(opts) {
    gameState = newGameState(); gameState.currentGame = 'samLoc';
    gameState.players = makePlayers(clamp(opts.players, 2, 4));
    gameState.deck = newShuffledDeck();
  },
  deal() {
    const gs = gameState, n = gs.players.length;
    gs.hands = dealCards(gs.deck, n, 10).map(sortCards);
    gs.startCounts = gs.hands.map(x => x.length);
    gs.passed = new Array(n).fill(false); gs.lastPlay = null; gs.first = false; gs.playedCards = []; gs.over = null; gs.bao = null; gs.round = 0;
    let low = null, lp = 0;
    gs.hands.forEach((hd, i) => { if (!low || tlPower(hd[0]) < tlPower(low)) { low = hd[0]; lp = i; } });
    gs.turn = lp;
    for (let k = 0; k < n; k++) {
      const p = (lp + k) % n, w = samInstantWin(gs.hands[p]);
      if (w) { gs.over = { winner: p, reason: 'trang', label: w }; break; }
    }
    gs.phase = gs.over ? 'over' : 'bao';
  },
  /* Báo Sâm: người báo phải thắng mọi vòng */
  checkBaoSam(p) { return !!(gameState.bao && gameState.bao.active && gameState.bao.player === p); },
  declareBao(p) { gameState.bao = { player: p, active: true }; gameState.turn = p; },
  aiBaoCheck() {
    const gs = gameState;
    for (let i = 1; i < gs.players.length; i++) if (samAIWantsBao(gs.hands[i], gs.players[i].level)) { this.declareBao(i); return i; }
    return -1;
  },
  checkSamLocInstantWin: samInstantWin,
  validateMove(p, move) {
    const r = shedValidate(SAM_ENGINE, p, move);
    return r;
  },
  getValidMoves(p) {
    const gs = gameState; if (gs.over || gs.turn !== p) return [];
    const m = shedMovesFor(SAM_ENGINE, p); if (shedCanPass(p)) m.push({ type: 'pass' }); return m;
  },
  play(p, move) {
    const gs = gameState, bao = gs.bao && gs.bao.active ? gs.bao : null;
    const info = shedPlay(SAM_ENGINE, p, move);
    if (info.type === 'play' && bao) {
      if (p !== bao.player) { gs.over = { winner: p, reason: 'chanSam', loser: bao.player }; }
      else if (gs.hands[p].length === 0) { gs.over = { winner: p, reason: 'baoSamOk' }; }
    }
    return info;
  },
  nextTurn: shedNextTurn,
  isStuck: p => shedIsStuck(SAM_ENGINE, p),
  forceThoi: p => shedForceThoi(p),
  checkWin: () => gameState.over,
  aiChoose(p, level) {
    const gs = gameState, moves = shedMovesFor(SAM_ENGINE, p), canPass = shedCanPass(p);
    const bao = gs.bao && gs.bao.active ? gs.bao : null;
    if (!moves.length) return { type: 'pass' };
    if (bao && p !== bao.player) { // chặn Sâm bằng nước nhỏ nhất đủ chặn
      if (level === 0 && canPass && Math.random() < 0.3) return { type: 'pass' };
      return minBy(moves, m => (gs.lastPlay && m.combo.type === gs.lastPlay.combo.type ? 0 : 100) + m.combo.key);
    }
    return shedChoose(p, moves, canPass, level);
  },
  timeoutMove(p) {
    if (shedCanPass(p)) return { type: 'pass' };
    const ms = shedMovesFor(SAM_ENGINE, p);
    return ms.length ? minBy(ms, m => m.combo.key - m.cards.length * 1000) : { type: 'pass' };
  },
  hint(p) { const ms = shedMovesFor(SAM_ENGINE, p); return ms.length ? shedChoose(p, ms, shedCanPass(p), 2) : { type: 'pass' }; },
  calculateResult() {
    const gs = gameState, o = gs.over, n = gs.players.length;
    const others = []; for (let i = 0; i < n; i++) if (i !== o.winner) others.push(i);
    others.sort((a, b) => gs.hands[a].length - gs.hands[b].length || a - b);
    if (o.reason === 'chanSam' || o.reason === 'thoi2') { others.sort((a, b) => (a === o.loser ? 1 : 0) - (b === o.loser ? 1 : 0) || gs.hands[a].length - gs.hands[b].length); }
    const heads = { trang: 'Ăn trắng — ' + (o.label || ''), baoSamOk: 'SÂM! Đi hết không ai chặn', chanSam: 'Chặn Sâm thành công', thoi2: 'Thắng — đối thủ thối 2', out: 'Hết bài' };
    const rankings = [{ p: o.winner, label: heads[o.reason] }];
    others.forEach(p => rankings.push({ p, label: p === o.loser ? (o.reason === 'thoi2' ? 'Thối 2 — còn ' + gs.hands[p].length + ' lá' : 'Báo Sâm thất bại') : gs.hands[p].length + ' lá còn lại' + (gs.hands[p].some(c => c.rank === '2') ? ' · Thối 2' : '') }));
    const specials = [];
    if (o.winner === 0) { if (o.reason === 'trang') specials.push('trang'); if (o.reason === 'baoSamOk') specials.push('baoSamOk'); if (o.reason === 'chanSam') specials.push('chanSam'); if (o.quadFinish) specials.push('quad'); }
    const headline = o.reason === 'trang' ? '🏆 ĂN TRẮNG' : o.reason === 'baoSamOk' ? '💥 SÂM!' : o.reason === 'chanSam' ? '🛡️ CHẶN SÂM' : o.reason === 'thoi2' ? (o.loser === 0 ? '💥 BẠN BỊ THỐI 2' : '💥 ĐỐI THỦ THỐI 2') : null;
    return { outcome: o.winner === 0 ? 'win' : 'lose', rankings, specials, headline };
  }
};

/* ============================ BLACKJACK ============================ */
function bjCardVal(c) { if (c.rank === 'A') return 11; return (['10', 'J', 'Q', 'K'].includes(c.rank)) ? 10 : parseInt(c.rank, 10); }
function bjValue(cards) {
  let t = 0, a = 0;
  cards.forEach(c => { if (c.rank === 'A') { a++; t += 1; } else t += bjCardVal(c); });
  let soft = false;
  if (a > 0 && t + 10 <= 21) { t += 10; soft = true; }
  return { total: t, soft };
}
function newBjHand() { return { cards: [], done: false, doubled: false, natural: false, bust: false }; }
/* Xác suất quắc nếu rút thêm, chỉ dựa trên lá đang lộ (công khai) */
function bjBustProb(total) {
  const visible = new Set();
  gameState.hands.forEach(hs => hs.forEach(h => h.cards.forEach(c => visible.add(c.id))));
  const up = gameState.dealer.cards[0]; if (up) visible.add(up.id);
  let bad = 0, all = 0;
  Object.keys(CARD_BY_ID).forEach(id => {
    if (visible.has(id)) return; all++;
    const c = CARD_BY_ID[id], v = c.rank === 'A' ? 1 : bjCardVal(c);
    if (total + v > 21) bad++;
  });
  return all ? bad / all : 0.4;
}
const BJ_ENGINE = {
  id: 'blackjack', kind: 'bj',
  setup(opts) {
    gameState = newGameState(); gameState.currentGame = 'blackjack';
    gameState.players = makePlayers(clamp(opts.players, 1, 4)); gameState.deck = newShuffledDeck();
  },
  deal() {
    const gs = gameState, n = gs.players.length;
    gs.hands = gs.players.map(() => [newBjHand()]);
    gs.dealer = { cards: [], hidden: true }; gs.over = null; gs.handIdx = 0; gs.playedCards = [];
    for (let r = 0; r < 2; r++) { gs.hands.forEach(hs => hs[0].cards.push(drawCard(gs.deck))); gs.dealer.cards.push(drawCard(gs.deck)); }
    gs.hands.forEach(hs => { const h = hs[0]; if (bjValue(h.cards).total === 21) { h.natural = true; h.done = true; } });
    if (bjValue(gs.dealer.cards).total === 21) { gs.dealer.hidden = false; gs.over = BJ_ENGINE.settle(); gs.phase = 'over'; return; }
    gs.turn = 0; gs.phase = 'play'; BJ_ENGINE.nextTurn();
  },
  curHand(p) { return gameState.hands[p] ? gameState.hands[p][gameState.handIdx] : null; },
  getValidMoves(p) {
    const gs = gameState; if (gs.over || gs.turn !== p) return [];
    const hs = gs.hands[p], h = hs[gs.handIdx]; if (!h || h.done) return [];
    const m = [{ type: 'hit' }, { type: 'stand' }];
    if (h.cards.length === 2 && !h.doubled) m.push({ type: 'double' });
    if (h.cards.length === 2 && hs.length < 2 && h.cards[0].rank === h.cards[1].rank) m.push({ type: 'split' });
    return m;
  },
  validateMove(p, move) {
    if (!move) return { ok: false, reason: 'Không có nước đi' };
    if (gameState.turn !== p) return { ok: false, reason: 'Chưa đến lượt' };
    return BJ_ENGINE.getValidMoves(p).some(m => m.type === move.type) ? { ok: true } : { ok: false, reason: 'Nước đi không hợp lệ' };
  },
  play(p, move) {
    const gs = gameState, hs = gs.hands[p], h = hs[gs.handIdx], idx = gs.handIdx;
    const upd = x => { const v = bjValue(x.cards).total; if (v > 21) { x.bust = true; x.done = true; } else if (v === 21) x.done = true; };
    if (move.type === 'hit') { h.cards.push(drawCard(gs.deck)); upd(h); }
    else if (move.type === 'stand') h.done = true;
    else if (move.type === 'double') { h.cards.push(drawCard(gs.deck)); h.doubled = true; h.done = true; if (bjValue(h.cards).total > 21) h.bust = true; }
    else if (move.type === 'split') {
      const second = newBjHand(); second.cards.push(h.cards.pop());
      h.cards.push(drawCard(gs.deck)); second.cards.push(drawCard(gs.deck));
      hs.splice(idx + 1, 0, second);
      if (h.cards[0].rank === 'A') { h.done = true; second.done = true; } else { upd(h); upd(second); }
    }
    return { type: move.type, player: p, handIdx: idx };
  },
  nextTurn() {
    const gs = gameState; if (gs.over) return;
    const hs = gs.hands, p = gs.turn;
    if (p < hs.length) {
      const hi = hs[p].findIndex(x => !x.done);
      if (hi >= 0) { gs.handIdx = hi; return; }
      for (let q = p + 1; q < hs.length; q++) {
        const hi2 = hs[q].findIndex(x => !x.done);
        if (hi2 >= 0) { gs.turn = q; gs.handIdx = hi2; return; }
      }
      gs.turn = hs.length; gs.handIdx = 0; gs.dealer.hidden = false;
    }
  },
  isDealerTurn() { return gameState.turn >= gameState.players.length && !gameState.over; },
  dealerStep() {
    const gs = gameState, d = gs.dealer; d.hidden = false;
    const live = gs.hands.some(hs => hs.some(x => !x.bust && !x.natural));
    const v = bjValue(d.cards).total;
    if (live && v < 17) { d.cards.push(drawCard(gs.deck)); return { type: 'dealerHit' }; }
    gs.over = BJ_ENGINE.settle(); gs.phase = 'over';
    return { type: 'dealerStand' };
  },
  settle() {
    const gs = gameState, d = gs.dealer, dv = bjValue(d.cards).total, dNat = d.cards.length === 2 && dv === 21;
    const results = gs.hands.map(hs => {
      let net = 0; const parts = [];
      hs.forEach(x => {
        const v = bjValue(x.cards).total, stake = x.doubled ? 2 : 1; let o;
        if (x.bust) o = -1;
        else if (x.natural) o = dNat ? 0 : 1.5;
        else if (dNat) o = -1;
        else if (dv > 21) o = 1;
        else o = v > dv ? 1 : v < dv ? -1 : 0;
        net += o * stake;
        parts.push(x.bust ? 'Quắc' : x.natural ? 'Blackjack' : o > 0 ? 'Thắng ' + v : o < 0 ? 'Thua ' + v : 'Push ' + v);
      });
      return { net, text: parts.join(' · '), natural: hs[0].natural };
    });
    return { results, dealerValue: dv, dealerNatural: dNat };
  },
  checkWin: () => gameState.over,
  aiChoose(p, level) {
    const gs = gameState, h = gs.hands[p][gs.handIdx], { total, soft } = bjValue(h.cards);
    const up = bjCardVal(gs.dealer.cards[0]);
    const valid = BJ_ENGINE.getValidMoves(p).map(m => m.type), has = t => valid.includes(t);
    const M = t => ({ type: t });
    if (level <= 0) return (total < 15 || (total < 17 && Math.random() < 0.3)) ? M('hit') : M('stand');
    if (level === 1) return soft ? (total < 18 ? M('hit') : M('stand')) : (total < 17 ? M('hit') : M('stand'));
    if (has('split') && (h.cards[0].rank === 'A' || h.cards[0].rank === '8')) return M('split');
    if (has('double') && ((!soft && (total === 11 || (total === 10 && up <= 9) || (total === 9 && up >= 3 && up <= 6))) || (soft && total >= 13 && total <= 17 && up >= 5 && up <= 6))) return M('double');
    if (soft) { if (total >= 19) return M('stand'); if (total === 18) return up >= 9 ? M('hit') : M('stand'); return M('hit'); }
    if (total >= 17) return M('stand');
    if (total <= 11) return M('hit');
    if (level >= 3) { // Siêu khó: dùng xác suất quắc từ lá công khai
      const pb = bjBustProb(total);
      return up <= 6 ? (pb < 0.22 ? M('hit') : M('stand')) : (pb < 0.62 ? M('hit') : M('stand'));
    }
    if (total >= 13) return up <= 6 ? M('stand') : M('hit');
    return (up >= 4 && up <= 6) ? M('stand') : M('hit');
  },
  timeoutMove(p) { return { type: 'stand' }; },
  hint(p) { return BJ_ENGINE.aiChoose(p, 2); },
  calculateResult() {
    const gs = gameState, o = gs.over;
    const order = o.results.map((r, p) => ({ p, net: r.net, label: r.text })).sort((a, b) => b.net - a.net || a.p - b.p);
    const me = o.results[0];
    const outcome = me.net > 0 ? 'win' : me.net < 0 ? 'lose' : 'draw';
    const specials = [];
    if (outcome === 'win' && me.natural) specials.push('blackjack');
    return { outcome, rankings: order, specials, headline: me.natural && outcome === 'win' ? '🂡 BLACKJACK!' : null, dealerValue: o.dealerValue };
  }
};

/* ============================ XÌ DÁCH ============================ */
function xdTotal(cards) {
  const n = cards.length; let base = 0, aces = 0;
  cards.forEach(c => { if (c.rank === 'A') aces++; else base += (['10', 'J', 'Q', 'K'].includes(c.rank) ? 10 : parseInt(c.rank, 10)); });
  const opts = n <= 3 ? [1, 10, 11] : [1];
  let best = null, min = Infinity;
  (function rec(i, sum) {
    if (i === aces) { if (sum <= 21 && (best === null || sum > best)) best = sum; if (sum < min) min = sum; return; }
    opts.forEach(v => rec(i + 1, sum + v));
  })(0, base);
  return best !== null ? best : min;
}
function xdClassify(cards) {
  const n = cards.length, total = xdTotal(cards);
  if (n === 2 && cards[0].rank === 'A' && cards[1].rank === 'A') return { kind: 'xibang', rank: 5, total: 22, name: 'Xì bàng', w: 3 };
  if (n === 2 && total === 21 && cards.some(c => c.rank === 'A')) return { kind: 'xidach', rank: 4, total: 21, name: 'Xì dách', w: 2 };
  if (total > 21) return { kind: 'quac', rank: 0, total, name: 'Quắc', w: 1 };
  if (n === 5) return { kind: 'nguLinh', rank: 3, total, name: 'Ngũ linh', w: 2 };
  return { kind: 'point', rank: 2, total, name: total + ' điểm', w: 1 };
}
function xdCompare(P, D) { // 1: người chơi thắng, -1: thua, 0: hòa
  if (P.kind === 'quac') return -1;
  if (D.kind === 'quac') return 1;
  if (P.rank !== D.rank) return P.rank > D.rank ? 1 : -1;
  if (P.kind === 'point') return Math.sign(P.total - D.total);
  if (P.kind === 'nguLinh') return Math.sign(D.total - P.total);
  return 0;
}
const XD_ENGINE = {
  id: 'xiDach', kind: 'bj',
  setup(opts) {
    gameState = newGameState(); gameState.currentGame = 'xiDach';
    gameState.players = makePlayers(clamp(opts.players, 1, 4)); gameState.deck = newShuffledDeck();
    gameState.cfg = { playerMin: 16, dealerMin: 15, dealerLevel: effAiLevel() === 4 ? 1 : effAiLevel() };
  },
  deal() {
    const gs = gameState;
    gs.hands = gs.players.map(() => [newBjHand()]);
    gs.dealer = { cards: [], hidden: true }; gs.over = null; gs.handIdx = 0; gs.playedCards = [];
    for (let r = 0; r < 2; r++) { gs.hands.forEach(hs => hs[0].cards.push(drawCard(gs.deck))); gs.dealer.cards.push(drawCard(gs.deck)); }
    const dk = xdClassify(gs.dealer.cards).kind;
    if (dk === 'xibang' || dk === 'xidach') { gs.dealer.hidden = false; gs.over = XD_ENGINE.settle(); gs.phase = 'over'; return; }
    gs.hands.forEach(hs => { const k = xdClassify(hs[0].cards).kind; if (k === 'xibang' || k === 'xidach') { hs[0].done = true; hs[0].natural = true; } });
    gs.turn = 0; gs.phase = 'play'; XD_ENGINE.nextTurn();
  },
  getValidMoves(p) {
    const gs = gameState; if (gs.over || gs.turn !== p) return [];
    const h = gs.hands[p][0]; if (!h || h.done) return [];
    const m = []; if (h.cards.length < 5) m.push({ type: 'hit' });
    if (xdTotal(h.cards) >= gs.cfg.playerMin) m.push({ type: 'stand' });
    return m;
  },
  validateMove(p, move) {
    if (!move) return { ok: false, reason: 'Không có nước đi' };
    if (gameState.turn !== p) return { ok: false, reason: 'Chưa đến lượt' };
    const h = gameState.hands[p][0];
    if (move.type === 'stand' && xdTotal(h.cards) < gameState.cfg.playerMin) return { ok: false, reason: 'Cần ít nhất 16 điểm mới được dằn' };
    if (move.type === 'hit' && h.cards.length >= 5) return { ok: false, reason: 'Đã đủ 5 lá' };
    return XD_ENGINE.getValidMoves(p).some(m => m.type === move.type) ? { ok: true } : { ok: false, reason: 'Nước đi không hợp lệ' };
  },
  play(p, move) {
    const gs = gameState, h = gs.hands[p][0];
    if (move.type === 'hit') {
      h.cards.push(drawCard(gs.deck));
      const k = xdClassify(h.cards);
      if (k.kind === 'quac' || h.cards.length >= 5) { h.done = true; if (k.kind === 'quac') h.bust = true; }
    } else h.done = true;
    return { type: move.type, player: p, handIdx: 0 };
  },
  nextTurn() {
    const gs = gameState; if (gs.over) return;
    const hs = gs.hands, p = gs.turn;
    if (p < hs.length) {
      if (!hs[p][0].done) return;
      for (let q = p + 1; q < hs.length; q++) if (!hs[q][0].done) { gs.turn = q; return; }
      gs.turn = hs.length; gs.dealer.hidden = true; // nhà cái bài vẫn úp tới khi so
    }
  },
  isDealerTurn() { return gameState.turn >= gameState.players.length && !gameState.over; },
  dealerStep() {
    const gs = gameState, d = gs.dealer, lv = gs.cfg.dealerLevel;
    const k = xdClassify(d.cards), total = k.total;
    let hit = false;
    if (d.cards.length < 5 && k.kind === 'point') {
      if (total < gs.cfg.dealerMin) hit = true;
      else if (lv >= 2 && total === 15 && d.cards.length <= 3) hit = true;
      else if (lv >= 3 && total === 16 && d.cards.length === 4) hit = true;
    }
    if (hit) { d.cards.push(drawCard(gs.deck)); return { type: 'dealerHit' }; }
    d.hidden = false; gs.over = XD_ENGINE.settle(); gs.phase = 'over';
    return { type: 'dealerStand' };
  },
  settle() {
    const gs = gameState, D = xdClassify(gs.dealer.cards);
    const results = gs.hands.map(hs => {
      const P = xdClassify(hs[0].cards), c = xdCompare(P, D);
      const w = c === 0 ? 0 : Math.max(P.w, D.w);
      const net = c * w;
      const text = (c > 0 ? 'Thắng — ' : c < 0 ? 'Thua — ' : 'Hòa — ') + P.name;
      return { net, text, kind: P.kind, outcome: c };
    });
    return { results, dealerValue: D.total, dealerName: D.name };
  },
  checkWin: () => gameState.over,
  aiChoose(p, level) {
    const gs = gameState, h = gs.hands[p][0], total = xdTotal(h.cards), n = h.cards.length;
    const valid = XD_ENGINE.getValidMoves(p).map(m => m.type);
    const M = t => (valid.includes(t) ? { type: t } : { type: valid[0] || 'stand' });
    if (total < 16) return M('hit');
    if (level <= 0) return M('stand');
    if (total === 16) return (level >= 2 && n <= 3) || (level === 1 && Math.random() < 0.3) ? M('hit') : M('stand');
    if (level >= 3 && n === 4 && total <= 17) return M('hit'); // săn ngũ linh khi ít nguy cơ
    return M('stand');
  },
  timeoutMove(p) { const h = gameState.hands[p][0]; return xdTotal(h.cards) < 16 && h.cards.length < 5 ? { type: 'hit' } : { type: 'stand' }; },
  hint(p) { return XD_ENGINE.aiChoose(p, 2); },
  calculateResult() {
    const gs = gameState, o = gs.over;
    const order = o.results.map((r, p) => ({ p, net: r.net, label: r.text })).sort((a, b) => b.net - a.net || a.p - b.p);
    const me = o.results[0];
    const outcome = me.outcome > 0 ? 'win' : me.outcome < 0 ? 'lose' : 'draw';
    const specials = [];
    if (outcome === 'win' && me.kind === 'xibang') specials.push('xibang');
    if (outcome === 'win' && me.kind === 'nguLinh') specials.push('nguLinh');
    return { outcome, rankings: order, specials, headline: outcome === 'win' && ['xibang', 'xidach', 'nguLinh'].includes(me.kind) ? '🂡 ' + xdClassify(gs.hands[0][0].cards).name.toUpperCase() : null, dealerValue: o.dealerValue };
  }
};


/* ============================ 9d. CÁC GAME CÒN LẠI — bộ đánh giá bài dùng chung ============================ */
const ci = (card, down) => ({ card, down: !!down });
function rv(c) { return c.rank === 'A' ? 14 : c.rank === 'K' ? 13 : c.rank === 'Q' ? 12 : c.rank === 'J' ? 11 : parseInt(c.rank, 10); }
function cmpArr(a, b) { const n = Math.max(a.length, b.length); for (let i = 0; i < n; i++) { const x = a[i] || 0, y = b[i] || 0; if (x !== y) return x > y ? 1 : -1; } return 0; }
function cmpPrefix(a, b) { const n = Math.min(a.length, b.length); for (let i = 0; i < n; i++) { if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1; } return 0; }
function combos(arr, k) { const out = []; (function rec(s, cur) { if (cur.length === k) { out.push(cur.slice()); return; } for (let i = s; i < arr.length; i++) { cur.push(arr[i]); rec(i + 1, cur); cur.pop(); } })(0, []); return out; }
const IDX_COMB = {};
function idxCombos(n, k) { const key = n + ':' + k; if (!IDX_COMB[key]) IDX_COMB[key] = combos([...Array(n).keys()], k); return IDX_COMB[key]; }
function eval5(cs) { // [hạng, ...so sánh] — hạng 0..8 (8 = thùng phá sảnh)
  const v = cs.map(rv).sort((a, b) => b - a), flush = cs.every(c => c.suit === cs[0].suit);
  let sh = 0; const u = new Set(v);
  if (u.size === 5) { if (v[0] - v[4] === 4) sh = v[0]; else if (v[0] === 14 && v[1] === 5 && v[2] === 4 && v[3] === 3 && v[4] === 2) sh = 5; }
  const cnt = {}; v.forEach(x => { cnt[x] = (cnt[x] || 0) + 1; });
  const g = Object.keys(cnt).map(k => [cnt[k], +k]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  if (sh && flush) return [8, sh];
  if (g[0][0] === 4) return [7, g[0][1], g[1][1]];
  if (g[0][0] === 3 && g[1][0] === 2) return [6, g[0][1], g[1][1]];
  if (flush) return [5].concat(v);
  if (sh) return [4, sh];
  if (g[0][0] === 3) return [3, g[0][1]].concat(g.slice(1).map(x => x[1]));
  if (g[0][0] === 2 && g[1][0] === 2) return [2, g[0][1], g[1][1], g[2][1]];
  if (g[0][0] === 2) return [1, g[0][1]].concat(g.slice(1).map(x => x[1]));
  return [0].concat(v);
}
function eval3(cs) { // chi 1 của Mậu Binh: 3 lá
  const v = cs.map(rv).sort((a, b) => b - a);
  if (v[0] === v[1] && v[1] === v[2]) return [3, v[0]];
  if (v[0] === v[1]) return [1, v[0], v[2]];
  if (v[1] === v[2]) return [1, v[1], v[0]];
  return [0].concat(v);
}
function best5(cards) { // tốt nhất trong 5..7 lá
  let best = null, bc = null;
  idxCombos(cards.length, 5).forEach(ix => { const cs = ix.map(i => cards[i]), e = eval5(cs); if (!best || cmpArr(e, best) > 0) { best = e; bc = cs; } });
  return { score: best, cards: bc };
}
const CHI5_NAMES = ['Mậu thầu', 'Đôi', 'Thú', 'Sám', 'Sảnh', 'Thùng', 'Cù lũ', 'Tứ quý', 'Thùng phá sảnh'];
const PK_NAMES = ['High Card', 'One Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush'];
function chiName(e, n) { return n === 3 ? (e[0] === 3 ? 'Sám' : e[0] === 1 ? 'Đôi' : 'Mậu thầu') : CHI5_NAMES[e[0]]; }
function pkName(e) { return e[0] === 8 && e[1] === 14 ? 'Royal Flush' : PK_NAMES[e[0]]; }

/* ---------- Bộ tìm phỏm / bộ (dùng cho Phỏm và Rummy). Bộ = 3+ lá cùng số hoặc 3+ lá liên tiếp cùng chất (A thấp) ---------- */
function meldCandidates(cards) {
  const out = [], byRank = {}, bySuit = {};
  cards.forEach((c, i) => { (byRank[c.rank] = byRank[c.rank] || []).push(i); (bySuit[c.suit] = bySuit[c.suit] || []).push(i); });
  Object.keys(byRank).forEach(k => {
    const ix = byRank[k]; if (ix.length < 3) return;
    for (let m = 0; m < (1 << ix.length); m++) { const sub = ix.filter((_, j) => m & (1 << j)); if (sub.length >= 3) out.push(sub); }
  });
  Object.keys(bySuit).forEach(k => {
    const ix = bySuit[k].slice().sort((a, b) => cards[a].value - cards[b].value);
    for (let s = 0; s < ix.length; s++) {
      const run = [ix[s]];
      for (let e = s + 1; e < ix.length; e++) {
        if (cards[ix[e]].value === cards[ix[e - 1]].value + 1) { run.push(ix[e]); if (run.length >= 3) out.push(run.slice()); } else break;
      }
    }
  });
  return out;
}
function bestMelds(cards, valFn) { // phân hoạch ít điểm rác nhất
  const cand = meldCandidates(cards), n = cards.length;
  let best = { dw: Infinity, masks: [] };
  const total = cards.reduce((a, c) => a + valFn(c), 0);
  const cm = cand.map(m => ({ m, mask: m.reduce((a, i) => a | (1 << i), 0), val: m.reduce((a, i) => a + valFn(cards[i]), 0) }));
  (function dfs(start, used, cover, chosen) {
    const dw = total - cover;
    if (dw < best.dw || (dw === best.dw && chosen.length > best.masks.length)) best = { dw, masks: chosen.slice() };
    for (let i = start; i < cm.length; i++) { if (cm[i].mask & used) continue; chosen.push(cm[i]); dfs(i + 1, used | cm[i].mask, cover + cm[i].val, chosen); chosen.pop(); }
  })(0, 0, 0, []);
  const usedMask = best.masks.reduce((a, x) => a | x.mask, 0);
  return { melds: best.masks.map(x => x.m.map(i => cards[i])), deadwood: cards.filter((_, i) => !(usedMask & (1 << i))), dw: best.dw === Infinity ? total : best.dw };
}
function canAttachMeld(meld, c) { // gửi bài vào phỏm
  const first = meld[0];
  if (meld.every(x => x.rank === first.rank)) return c.rank === first.rank && meld.length < 4 && !meld.some(x => x.suit === c.suit);
  if (!meld.every(x => x.suit === first.suit) || c.suit !== first.suit) return false;
  const vs = meld.map(x => x.value).sort((a, b) => a - b);
  return c.value === vs[0] - 1 || c.value === vs[vs.length - 1] + 1;
}

/* ============================ HIGH CARD ============================ */
const hcPower = c => rv(c) * 4 + SUIT_ORDER[c.suit];
const HC_ENGINE = {
  id: 'highCard', kind: 'show',
  setup(opts) { gameState = newGameState(); const gs = gameState; gs.currentGame = 'highCard'; gs.players = makePlayers(clamp(opts.players, 2, 4)); gs.score = gs.players.map(() => 0); gs.round = 0; gs.rounds = 3; },
  deal() {
    const gs = gameState; gs.deck = newShuffledDeck(); gs.hands = gs.players.map(() => [drawCard(gs.deck)]);
    gs.revealed = false; gs.roundWinner = -1; gs.round++; gs.over = null; gs.phase = 'play'; gs.turn = 0;
  },
  humanTurn() { const gs = gameState; return !gs.over && (gs.phase === 'play' || gs.phase === 'result'); },
  getValidMoves() { const gs = gameState; return gs.over ? [] : gs.phase === 'play' ? [{ type: 'reveal' }] : [{ type: 'next' }]; },
  validateMove(p, mv) {
    const gs = gameState;
    if (p !== 0 || gs.over || !mv) return { ok: false, reason: 'Chưa đến lượt' };
    if (mv.type === 'reveal' && gs.phase === 'play') return { ok: true };
    if (mv.type === 'next' && gs.phase === 'result') return { ok: true };
    return { ok: false, reason: 'Nước đi không hợp lệ' };
  },
  play(p, mv) {
    const gs = gameState;
    if (mv.type === 'next') { HC_ENGINE.deal(); return { type: 'next', sfx: 'deal' }; }
    let w = 0; gs.hands.forEach((hd, i) => { if (hcPower(hd[0]) > hcPower(gs.hands[w][0])) w = i; });
    gs.score[w]++; gs.roundWinner = w; gs.revealed = true; gs.phase = 'result';
    if (gs.round >= gs.rounds) { gs.over = { reason: 'done' }; gs.phase = 'over'; }
    return { type: 'reveal', sfx: 'eat' };
  },
  nextTurn() { }, checkWin: () => gameState.over,
  aiChoose() { return { type: 'reveal' }; }, timeoutMove() { return { type: gameState.phase === 'result' ? 'next' : 'reveal' }; }, hint() { return HC_ENGINE.timeoutMove(); },
  seatView(i) { const gs = gameState; return { cnt: '🏅 ' + gs.score[i], warn: gs.revealed && gs.roundWinner === i ? '★ Thắng ván' : '', rows: [[ci(gs.hands[i][0], !gs.revealed)]] }; },
  tableView() { const gs = gameState; return { info: gs.phase === 'play' ? 'Ván ' + gs.round + '/' + gs.rounds + ' — bấm LẬT BÀI' : 'Ván ' + gs.round + ': ' + gs.players[gs.roundWinner].name + ' có lá cao nhất', rows: [] }; },
  handView() { const gs = gameState; return { cards: [ci(gs.hands[0][0], !gs.revealed)] }; },
  myInfo() { const gs = gameState; return 'Ván thắng của bạn: ' + gs.score[0] + ' · Lá cao nhất thắng (A cao nhất; bằng số so chất ♠ < ♣ < ♦ < ♥)'; },
  actionsView() { const gs = gameState; return gs.phase === 'play' ? [{ txt: '🃏 LẬT BÀI', act: 'g:reveal', cls: 'primary' }] : [{ txt: 'VÁN TIẾP', act: 'g:next', cls: 'primary' }]; },
  calculateResult() {
    const gs = gameState, sc = gs.score, top = Math.max.apply(null, sc), tops = sc.filter(x => x === top).length;
    const order = [...sc.keys()].sort((a, b) => sc[b] - sc[a] || a - b);
    return { outcome: sc[0] === top ? (tops === 1 ? 'win' : 'draw') : 'lose', rankings: order.map(p => ({ p, label: sc[p] + '/' + gs.rounds + ' ván thắng' })), specials: [], headline: sc[0] === top && tops === 1 ? '🃏 LÁ CAO NHẤT!' : null };
  },
  detail() { return gameState.players.map((p, i) => p.name + ': ' + cardShort(gameState.hands[i][0])); }
};

/* ============================ BA CÂY ============================ */
function bcPts(cs) { return cs.reduce((a, c) => a + (c.rank === 'A' ? 1 : (['10', 'J', 'Q', 'K'].includes(c.rank) ? 0 : parseInt(c.rank, 10))), 0) % 10; }
function bcScore(cs, anh) {
  const hi = Math.max.apply(null, cs.map(hcPower));
  if (anh && cs.every(c => ['J', 'Q', 'K'].includes(c.rank))) return { s: [2, hi], name: 'Ba cây ảnh' };
  const p = bcPts(cs); return { s: [1, p, hi], name: p + ' điểm' };
}
const BC_ENGINE = {
  id: 'baCay', kind: 'show',
  setup(opts) {
    gameState = newGameState(); const gs = gameState; gs.currentGame = 'baCay'; gs.players = makePlayers(clamp(opts.players, 2, 5));
    gs.cfg = { anh: ((Data.settings.gameCfg || {}).baCay || {}).anh !== false };
  },
  deal() { const gs = gameState; gs.deck = newShuffledDeck(); gs.hands = dealCards(gs.deck, gs.players.length, 3); gs.revealed = false; gs.over = null; gs.phase = 'play'; gs.turn = 0; },
  humanTurn() { const gs = gameState; return !gs.over && gs.phase === 'play'; },
  getValidMoves() { return gameState.over ? [] : [{ type: 'reveal' }]; },
  validateMove(p, mv) { const gs = gameState; return p === 0 && !gs.over && mv && mv.type === 'reveal' ? { ok: true } : { ok: false, reason: 'Nước đi không hợp lệ' }; },
  play() {
    const gs = gameState; gs.revealed = true; gs.phase = 'over';
    gs.scores = gs.hands.map(h => bcScore(h, gs.cfg.anh)); gs.over = { reason: 'done' };
    return { type: 'reveal', sfx: 'eat' };
  },
  nextTurn() { }, checkWin: () => gameState.over,
  aiChoose() { return { type: 'reveal' }; }, timeoutMove() { return { type: 'reveal' }; }, hint() { return { type: 'reveal' }; },
  seatView(i) { const gs = gameState; return { cnt: gs.revealed ? gs.scores[i].name : '3 lá', warn: '', rows: [gs.hands[i].map(c => ci(c, !gs.revealed))] }; },
  tableView() { const gs = gameState; return { info: gs.revealed ? 'Đã lật bài — so điểm' : 'Điểm = tổng 3 lá, lấy số lẻ (A=1, 10/J/Q/K=0)' + (gs.cfg.anh ? ' · Ba cây ảnh cao nhất' : ''), rows: [] }; },
  handView() { const gs = gameState; return { cards: gs.hands[0].map(c => ci(c, !gs.revealed)) }; },
  myInfo() { const gs = gameState; return gs.revealed ? 'Bài của bạn: ' + gs.scores[0].name : 'Bấm LẬT BÀI để so điểm'; },
  actionsView() { return gameState.phase === 'play' ? [{ txt: '🃏 LẬT BÀI', act: 'g:reveal', cls: 'primary' }] : []; },
  calculateResult() {
    const gs = gameState, order = [...gs.players.keys()].sort((a, b) => cmpArr(gs.scores[b].s, gs.scores[a].s));
    const win = order[0] === 0;
    return { outcome: win ? 'win' : 'lose', rankings: order.map(p => ({ p, label: gs.scores[p].name })), specials: [], headline: win && gs.scores[0].s[0] === 2 ? '👑 BA CÂY ẢNH!' : (win ? '🃏 THẮNG!' : null) };
  },
  detail() { return gameState.players.map((p, i) => p.name + ': ' + gameState.hands[i].map(cardShort).join(' ') + ' → ' + gameState.scores[i].name); }
};

/* ============================ LIÊNG (có vòng cược bằng điểm ảo) ============================ */
const LIENG = { ANTE: 10, STEP: 10, MAXR: 3, STACK: 200 };
function lieng3(cs) {
  const v = cs.map(rv).sort((a, b) => b - a), hi = Math.max.apply(null, cs.map(hcPower));
  if (v[0] === v[1] && v[1] === v[2]) return { s: [4, v[0]], name: 'Sáp ' + cs[0].rank, str: 0.97 };
  let top = 0; if (v[0] - v[1] === 1 && v[1] - v[2] === 1) top = v[0]; else if (v[0] === 14 && v[1] === 3 && v[2] === 2) top = 3;
  if (top) return { s: [3, top, hi], name: 'Liêng', str: 0.86 };
  if (cs.every(c => ['J', 'Q', 'K'].includes(c.rank))) return { s: [2, v[0], v[1], v[2], hi], name: 'Ảnh', str: 0.74 };
  const p = bcPts(cs); return { s: [1, p, hi], name: p + ' điểm', str: [0.12, 0.16, 0.2, 0.24, 0.3, 0.36, 0.44, 0.54, 0.64, 0.72][p] };
}
const LIENG_ENGINE = {
  id: 'lieng', kind: 'bet',
  setup(opts) { gameState = newGameState(); const gs = gameState; gs.currentGame = 'lieng'; gs.players = makePlayers(clamp(opts.players, 2, 5)); gs.deck = newShuffledDeck(); },
  deal() {
    const gs = gameState, n = gs.players.length;
    gs.hands = dealCards(gs.deck, n, 3); gs.chips = new Array(n).fill(LIENG.STACK - LIENG.ANTE); gs.pot = LIENG.ANTE * n; gs.put = new Array(n).fill(0);
    gs.folded = new Array(n).fill(false); gs.curBet = 0; gs.raises = 0; gs.seen = false; gs.over = null; gs.phase = 'play'; gs.show = false;
    gs.lastAct = new Array(n).fill(''); gs.needAct = [...Array(n).keys()]; gs.turn = rand(n);
  },
  cost(p) { return gameState.curBet - gameState.put[p]; },
  getValidMoves(p) {
    const gs = gameState; if (gs.over || gs.turn !== p) return [];
    const m = [{ type: 'fold' }]; const c = gs.curBet - gs.put[p];
    if (c === 0) m.push({ type: 'check' }); else m.push({ type: 'call' });
    if (gs.raises < LIENG.MAXR) m.push({ type: 'raise' });
    return m;
  },
  validateMove(p, mv) {
    const gs = gameState;
    if (!mv) return { ok: false, reason: 'Không có nước đi' };
    if (mv.type === 'peek') return p === 0 && !gs.over ? { ok: true, free: true } : { ok: false, reason: 'Không thể xem bài' };
    if (gs.over || gs.turn !== p) return { ok: false, reason: 'Chưa đến lượt' };
    if (mv.type === 'check' && gs.curBet !== gs.put[p]) return { ok: false, reason: 'Đã có người tố — hãy Theo hoặc Bỏ' };
    if (mv.type === 'call' && gs.curBet === gs.put[p]) return { ok: false, reason: 'Chưa ai tố — dùng Úp' };
    if (mv.type === 'raise' && gs.raises >= LIENG.MAXR) return { ok: false, reason: 'Đã hết lượt tố' };
    return ['fold', 'check', 'call', 'raise'].includes(mv.type) ? { ok: true } : { ok: false, reason: 'Nước đi không hợp lệ' };
  },
  play(p, mv) {
    const gs = gameState;
    if (mv.type === 'peek') { gs.seen = true; return { type: 'peek', sfx: 'select' }; }
    const pay = c => { gs.chips[p] -= c; gs.put[p] += c; gs.pot += c; };
    if (mv.type === 'fold') { gs.folded[p] = true; gs.lastAct[p] = 'Bỏ'; gs.needAct = gs.needAct.filter(x => x !== p); }
    else if (mv.type === 'check') { gs.lastAct[p] = 'Úp'; gs.needAct = gs.needAct.filter(x => x !== p); }
    else if (mv.type === 'call') { pay(gs.curBet - gs.put[p]); gs.lastAct[p] = 'Theo'; gs.needAct = gs.needAct.filter(x => x !== p); }
    else { gs.curBet += LIENG.STEP; pay(gs.curBet - gs.put[p]); gs.raises++; gs.lastAct[p] = 'Tố ' + gs.curBet; gs.needAct = [...gs.players.keys()].filter(x => x !== p && !gs.folded[x]); }
    const alive = [...gs.players.keys()].filter(x => !gs.folded[x]);
    if (alive.length === 1) { gs.chips[alive[0]] += gs.pot; gs.over = { reason: 'fold', winners: alive }; gs.phase = 'over'; gs.show = false; }
    else if (!gs.needAct.length) {
      gs.show = true; const sc = {}; alive.forEach(i => { sc[i] = lieng3(gs.hands[i]); });
      const best = alive.reduce((b, i) => (b === null || cmpArr(sc[i].s, sc[b].s) > 0 ? i : b), null);
      const winners = alive.filter(i => cmpArr(sc[i].s, sc[best].s) === 0);
      const share = Math.floor(gs.pot / winners.length); winners.forEach(i => { gs.chips[i] += share; }); gs.chips[winners[0]] += gs.pot - share * winners.length;
      gs.over = { reason: 'show', winners }; gs.phase = 'over';
    }
    return { type: mv.type, sfx: mv.type === 'raise' ? 'chat' : 'card' };
  },
  nextTurn() {
    const gs = gameState; if (gs.over) return; const n = gs.players.length;
    for (let k = 1; k <= n; k++) { const q = (gs.turn + k) % n; if (gs.needAct.includes(q)) { gs.turn = q; return; } }
  },
  checkWin: () => gameState.over,
  aiChoose(p, level) {
    const gs = gameState, opts = LIENG_ENGINE.getValidMoves(p).map(m => m.type), has = t => opts.includes(t);
    const str = lieng3(gs.hands[p]).str + (Math.random() - 0.5) * (level <= 0 ? 0.5 : level === 1 ? 0.18 : 0.08);
    const cost = gs.curBet - gs.put[p], odds = cost > 0 ? cost / (gs.pot + cost) : 0, opp = gs.players.filter((_, i) => !gs.folded[i]).length - 1;
    const call = () => (has('check') ? { type: 'check' } : { type: 'call' });
    if (level <= 0) { const r = Math.random(); if (r < 0.15 && has('fold')) return { type: 'fold' }; if (r < 0.4 && has('raise')) return { type: 'raise' }; return call(); }
    if (level === 1) { if (str >= 0.7 && has('raise')) return { type: 'raise' }; if (str >= 0.36 || cost === 0) return call(); return { type: 'fold' }; }
    const need = 0.28 + 0.55 * odds + (level >= 3 ? 0.03 * (opp - 1) : 0);
    if (str >= 0.78 && has('raise')) return { type: 'raise' };
    if (str >= 0.6 && has('raise') && Math.random() < (level >= 3 ? 0.45 : 0.25)) return { type: 'raise' };
    if (cost === 0 && has('raise') && Math.random() < (level >= 3 ? 0.1 : 0.04)) return { type: 'raise' }; // thỉnh thoảng tố liều
    if (str >= need || cost === 0) return call();
    return { type: 'fold' };
  },
  timeoutMove(p) { const gs = gameState, c = gs.curBet - gs.put[p]; return c === 0 ? { type: 'check' } : c <= LIENG.STEP ? { type: 'call' } : { type: 'fold' }; },
  hint(p) { return LIENG_ENGINE.aiChoose(p, 2); },
  seatView(i) {
    const gs = gameState, shown = gs.show && !gs.folded[i];
    return { cnt: '💰 ' + gs.chips[i], warn: gs.folded[i] ? 'Bỏ' : (gs.over ? (gs.over.winners.includes(i) ? '★ Thắng' : '') : (gs.lastAct[i] || '')), rows: [gs.hands[i].map(c => ci(c, !shown))], name: shown ? lieng3(gs.hands[i]).name : '' };
  },
  tableView() { const gs = gameState; return { info: '💰 Pot ' + gs.pot + ' · Mức tố hiện tại: +' + gs.curBet + (gs.over ? ' · ' + (gs.over.reason === 'fold' ? 'Tất cả bỏ' : 'So bài') : ''), rows: [] }; },
  handView() { const gs = gameState; return { cards: gs.hands[0].map(c => ci(c, !(gs.seen || gs.over))) }; },
  myInfo() { const gs = gameState; return '💰 ' + gs.chips[0] + ' · đã bỏ vào ' + (LIENG.ANTE + gs.put[0]) + (gs.seen || gs.over ? ' · ' + lieng3(gs.hands[0]).name : ' · (chưa xem bài)'); },
  actionsView(my) {
    const gs = gameState, mv = my ? LIENG_ENGINE.getValidMoves(0).map(m => m.type) : [], out = [];
    if (!gs.seen && !gs.over) out.push({ txt: '👁 XEM', act: 'g:peek', cls: 'sortbtn' });
    out.push({ txt: 'BỎ', act: 'g:fold', dis: !mv.includes('fold') });
    if (mv.includes('check') || !my) out.push({ txt: 'ÚP', act: 'g:check', dis: !mv.includes('check') });
    if (mv.includes('call') || !my) out.push({ txt: 'THEO ' + (my ? LIENG_ENGINE.cost(0) : ''), act: 'g:call', dis: !mv.includes('call') });
    out.push({ txt: 'TỐ +' + LIENG.STEP, act: 'g:raise', cls: 'primary', dis: !mv.includes('raise') });
    return out;
  },
  calculateResult() {
    const gs = gameState, net = gs.chips.map(c => c - LIENG.STACK), order = [...gs.players.keys()].sort((a, b) => net[b] - net[a] || a - b);
    const me = net[0], outcome = me > 0 ? 'win' : me < 0 ? 'lose' : 'draw', sp = [];
    if (outcome === 'win' && !gs.folded[0] && lieng3(gs.hands[0]).s[0] === 4) sp.push('lienSap');
    return { outcome, rankings: order.map(p => ({ p, label: (net[p] >= 0 ? '+' : '') + net[p] + ' điểm' + (!gs.folded[p] && gs.show ? ' · ' + lieng3(gs.hands[p]).name : (gs.folded[p] ? ' · Bỏ' : '')) })), specials: sp, headline: outcome === 'win' ? '💰 THẮNG POT ' + gs.pot : null };
  },
  detail() { return gameState.players.map((p, i) => p.name + ': ' + gameState.hands[i].map(cardShort).join(' ') + ' → ' + lieng3(gameState.hands[i]).name + (gameState.folded[i] ? ' (bỏ)' : '')); }
};

/* ============================ MẬU BINH ============================ */
function st3(cs) { const v = cs.map(rv).sort((a, b) => b - a); return (v[0] - v[1] === 1 && v[1] - v[2] === 1) || (v[0] === 14 && v[1] === 3 && v[2] === 2); }
function mbMask(ix) { return ix.reduce((m, i) => m | (1 << i), 0); }
function mbSearch(hand, topN) { // liệt kê các cách xếp hợp lệ (chi3 ≥ chi2 ≥ chi1); topN giới hạn số chi 3 để chạy nhanh
  const n = hand.length, idx = [...Array(n).keys()], C5 = idxCombos(n, 5), ev = {};
  const list = C5.map(ix => { const e = eval5(ix.map(i => hand[i])); ev[mbMask(ix)] = e; return { ix, e }; });
  list.sort((a, b) => cmpArr(b.e, a.e));
  const cand = topN ? list.slice(0, topN).concat(list.slice(topN).filter(() => Math.random() < 0.02)) : list;
  const out = [];
  cand.forEach(a => {
    const m3 = mbMask(a.ix), e3 = a.e, rest = idx.filter(i => !(m3 & (1 << i)));
    combos(rest, 5).forEach(b => {
      const m2 = mbMask(b), e2 = ev[m2]; if (cmpArr(e3, e2) < 0) return;
      const r1 = rest.filter(i => !(m2 & (1 << i))), e1 = eval3(r1.map(i => hand[i]));
      if (cmpPrefix(e2, e1) < 0) return;
      out.push({ a: a.ix, b, r1, e3, e2, e1 });
    });
  });
  return out;
}
function mbScore(x) {
  const s = e => e[0] * 15 + (e[1] || 0);
  return s(x.e1) + s(x.e2) * 1.2 + s(x.e3) * 1.4 + (x.e1[0] === 3 ? 10 : 0) + (x.e2[0] === 6 ? 6 : 0) + (x.e3[0] >= 7 ? 14 : 0);
}
function mbArrange(hand, level) { // trả về [chi1(3), chi2(5), chi3(5)]
  let list = mbSearch(hand, level >= 2 ? 160 : 70), pickd;
  if (!list.length) list = mbSearch(hand, 0);
  if (!list.length) { const sorted = hand.slice().sort((a, b) => rv(a) - rv(b)); return [sorted.slice(0, 3), sorted.slice(3, 8), sorted.slice(8)]; }
  if (level <= 0) pickd = pick(list);
  else if (level === 1) pickd = list.reduce((b, x) => (cmpArr(x.e3, b.e3) > 0 || (cmpArr(x.e3, b.e3) === 0 && cmpArr(x.e2, b.e2) > 0) ? x : b), list[0]);
  else pickd = maxBy(list, mbScore);
  return [pickd.r1.map(i => hand[i]), pickd.b.map(i => hand[i]), pickd.a.map(i => hand[i])];
}
function mbWhite(hand) {
  if (new Set(hand.map(c => c.value)).size === 13) return 'Sảnh rồng';
  const cnt = {}; hand.forEach(c => { cnt[c.rank] = (cnt[c.rank] || 0) + 1; });
  let pairs = 0; Object.keys(cnt).forEach(k => { pairs += Math.floor(cnt[k] / 2); }); if (pairs >= 6) return '6 đôi';
  const sc = { S: 0, C: 0, D: 0, H: 0 }; hand.forEach(c => { sc[c.suit]++; });
  const cs = Object.keys(sc).map(k => sc[k]); let flush3 = false;
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) { const need = [0, 0, 0, 0]; need[a] += 3; need[b] += 5; need[c] += 5; if (need.every((x, i) => x === cs[i])) flush3 = true; }
  if (flush3) return '3 thùng';
  // 3 sảnh: tìm 2 sảnh 5 lá rời nhau + 3 lá còn lại là sảnh
  const byVal = {}; hand.forEach((c, i) => { const v = rv(c); (byVal[v] = byVal[v] || []).push(i); if (v === 14) (byVal[1] = byVal[1] || []).push(i); });
  const S5 = [];
  for (let s = 1; s <= 10; s++) { let lists = [[]]; for (let v = s; v < s + 5; v++) { if (!byVal[v]) { lists = []; break; } const nl = []; lists.forEach(l => byVal[v].forEach(i => nl.push(l.concat([i])))); lists = nl; } lists.forEach(l => S5.push(l)); }
  for (let i = 0; i < S5.length; i++) for (let j = i + 1; j < S5.length; j++) {
    if (S5[i].some(x => S5[j].includes(x))) continue;
    const used = S5[i].concat(S5[j]), rest = hand.filter((_, k) => !used.includes(k));
    if (rest.length === 3 && st3(rest)) return '3 sảnh';
  }
  return null;
}
function mbCompare(a, b) { // trả về [điểm của a, điểm của b]; mỗi arrangement = {chi:[c1,c2,c3], ok}
  if (!a.ok || !b.ok) return a.ok === b.ok ? [0, 0] : (a.ok ? [3, -3] : [-3, 3]);
  let pa = 0, wins = 0;
  const e = [[eval3(a.chi[0]), eval3(b.chi[0]), 3], [eval5(a.chi[1]), eval5(b.chi[1]), 5], [eval5(a.chi[2]), eval5(b.chi[2]), 5]];
  e.forEach((x, i) => {
    const c = cmpArr(x[0], x[1]); if (!c) return;
    const win = c > 0, w = win ? x[0] : x[1]; let pts = 1;
    if (i === 0 && w[0] === 3) pts += 2; if (i === 1 && w[0] === 6) pts += 1;
    if (w[0] === 7) pts += i === 2 ? 4 : 8; if (w[0] === 8) pts += i === 2 ? 5 : 10;
    pa += win ? pts : -pts; wins += win ? 1 : -1;
  });
  if (wins === 3) pa *= 2; else if (wins === -3) pa *= 2; // sập hầm
  return [pa, -pa];
}
function mbValid(chi) { const e1 = eval3(chi[0]), e2 = eval5(chi[1]), e3 = eval5(chi[2]); return cmpArr(e3, e2) >= 0 && cmpPrefix(e2, e1) >= 0; }
const MB_ENGINE = {
  id: 'mauBinh', kind: 'mb',
  setup(opts) { gameState = newGameState(); const gs = gameState; gs.currentGame = 'mauBinh'; gs.players = makePlayers(clamp(opts.players, 2, 4)); gs.deck = newShuffledDeck(); },
  deal() {
    const gs = gameState, n = gs.players.length;
    gs.hands = dealCards(gs.deck, n, 13).map(h => h.sort((a, b) => rv(a) - rv(b) || SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]));
    gs.chi = [[], [], []]; gs.over = null; gs.phase = 'play'; gs.turn = 0; gs.arr = null; gs.white = new Array(n).fill(null);
    for (let i = 0; i < n; i++) gs.white[i] = mbWhite(gs.hands[i]);
    const w = gs.white.findIndex(x => x); if (w >= 0) { gs.over = { reason: 'white', winner: w, label: gs.white[w] }; gs.phase = 'over'; MB_ENGINE.settle(); }
  },
  humanTurn() { const gs = gameState; return !gs.over && gs.phase === 'play'; },
  timeLimit(base) { return Math.max(60, base * 4); },
  pool() { const gs = gameState, used = new Set([].concat.apply([], gs.chi).map(c => c.id)); return gs.hands[0].filter(c => !used.has(c.id)); },
  getValidMoves() { return gameState.over ? [] : [{ type: 'auto_confirm' }]; },
  validateMove(p, mv) {
    const gs = gameState; if (p !== 0 || gs.over || !mv) return { ok: false, reason: 'Chưa đến lượt' };
    const CAP = [3, 5, 5];
    if (mv.type === 'place') {
      const ids = mv.cards || [], pool = MB_ENGINE.pool().map(c => c.id);
      if (!ids.length) return { ok: false, reason: 'Hãy chạm chọn lá bài trước' };
      if (!ids.every(id => pool.includes(id))) return { ok: false, reason: 'Lá bài đã được xếp' };
      if (gs.chi[mv.chi].length + ids.length > CAP[mv.chi]) return { ok: false, reason: 'Chi ' + (mv.chi + 1) + ' chỉ chứa ' + CAP[mv.chi] + ' lá' };
      return { ok: true, free: true };
    }
    if (mv.type === 'unplace' || mv.type === 'clear' || mv.type === 'auto') return { ok: true, free: true };
    if (mv.type === 'auto_confirm') return { ok: true };
    if (mv.type === 'confirm') {
      if (MB_ENGINE.pool().length) return { ok: false, reason: 'Hãy xếp đủ 13 lá vào 3 chi' };
      if (!mbValid(gs.chi)) return { ok: false, reason: 'Binh lủng! Chi 3 phải ≥ Chi 2 ≥ Chi 1' };
      return { ok: true };
    }
    return { ok: false, reason: 'Nước đi không hợp lệ' };
  },
  play(p, mv) {
    const gs = gameState;
    if (mv.type === 'place') { const hs = gs.hands[0]; mv.cards.forEach(id => { gs.chi[mv.chi].push(hs.find(c => c.id === id)); }); return { type: 'place', sfx: 'card' }; }
    if (mv.type === 'unplace') { gs.chi = gs.chi.map(r => r.filter(c => !(mv.cards || []).includes(c.id))); return { type: 'unplace', sfx: 'select' }; }
    if (mv.type === 'clear') { gs.chi = [[], [], []]; return { type: 'clear', sfx: 'select' }; }
    if (mv.type === 'auto') { gs.chi = mbArrange(gs.hands[0], 3); return { type: 'auto', sfx: 'deal' }; }
    if (mv.type === 'auto_confirm') gs.chi = mbArrange(gs.hands[0], 2);
    gs.over = { reason: 'show' }; gs.phase = 'over'; MB_ENGINE.settle();
    return { type: 'confirm', sfx: 'eat' };
  },
  settle() {
    const gs = gameState, n = gs.players.length;
    gs.arr = gs.hands.map((h, i) => { if (i === 0 && gs.over.reason !== 'white') return { chi: gs.chi.map(r => r.slice()), ok: mbValid(gs.chi) }; const chi = mbArrange(h, gs.players[i].level); return { chi, ok: mbValid(chi) }; });
    gs.total = new Array(n).fill(0);
    if (gs.over.reason === 'white') { for (let i = 0; i < n; i++) { if (i === gs.over.winner) gs.total[i] = 6 * (n - 1); else gs.total[i] = -6; } return; }
    gs.sap = new Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const r = mbCompare(gs.arr[i], gs.arr[j]); gs.total[i] += r[0]; gs.total[j] += r[1]; }
  },
  nextTurn() { }, checkWin: () => gameState.over,
  aiChoose() { return { type: 'auto_confirm' }; }, timeoutMove() { return { type: 'auto_confirm' }; }, hint() { return { type: 'auto' }; },
  seatView(i) { const gs = gameState; return { cnt: gs.over ? (gs.total[i] >= 0 ? '+' : '') + gs.total[i] : '13 lá', warn: gs.over && gs.white[i] ? '🏆 ' + gs.white[i] : '', rows: [] }; },
  tableView() {
    const gs = gameState, names = ['Chi 1 (3 lá)', 'Chi 2 (5 lá)', 'Chi 3 (5 lá)'], rows = [];
    for (let k = 2; k >= 0; k--) {
      const cards = gs.over && gs.arr ? gs.arr[0].chi[k] : gs.chi[k], e = cards.length === (k === 0 ? 3 : 5) ? (k === 0 ? eval3(cards) : eval5(cards)) : null;
      rows.push({ label: names[k] + (e ? '\n' + chiName(e, k === 0 ? 3 : 5) : ''), cards: cards.map(c => ci(c)), slots: (k === 0 ? 3 : 5) - cards.length, tapKey: String(k), tap: !gs.over });
    }
    return { info: gs.over ? (gs.over.reason === 'white' ? '🏆 ' + gs.players[gs.over.winner].name + ' thắng trắng: ' + gs.over.label : 'Đã so chi') : 'Xếp 13 lá: Chi 3 ≥ Chi 2 ≥ Chi 1 — chạm lá bài rồi chạm chi để đặt', rows };
  },
  handView() { const gs = gameState; return { cards: gs.over ? [] : MB_ENGINE.pool().map(c => ci(c)) }; },
  tapTable(key, cardId) {
    const gs = gameState; if (gs.over) return null;
    if (cardId) return { type: 'unplace', cards: [cardId] };
    return { type: 'place', chi: parseInt(key, 10), cards: [...UI.selected] };
  },
  myInfo() { const gs = gameState; return gs.over ? 'Điểm của bạn: ' + (gs.total[0] >= 0 ? '+' : '') + gs.total[0] : 'Còn ' + MB_ENGINE.pool().length + ' lá chưa xếp'; },
  actionsView(my) { return gameState.over ? [] : [{ txt: 'TỰ XẾP', act: 'g:auto', dis: !my }, { txt: 'XOÁ', act: 'g:clear', dis: !my }, { txt: '✓ XÁC NHẬN', act: 'g:confirm', cls: 'primary', dis: !my }]; },
  calculateResult() {
    const gs = gameState, order = [...gs.players.keys()].sort((a, b) => gs.total[b] - gs.total[a] || a - b), me = gs.total[0];
    const sp = []; if (me > 0 && gs.over.reason === 'white') sp.push('trang');
    if (me > 0 && gs.arr && gs.arr[0].ok) { const mine = gs.arr[0]; for (let j = 1; j < gs.players.length; j++) { const e = [0, 1, 2].map(k => { const a = k === 0 ? eval3(mine.chi[0]) : eval5(mine.chi[k]), b = gs.arr[j].chi[k] ? (k === 0 ? eval3(gs.arr[j].chi[0]) : eval5(gs.arr[j].chi[k])) : [0]; return cmpArr(a, b) > 0; }); if (e.every(Boolean) && gs.arr[j].ok) { sp.push('mbSap'); break; } } }
    return { outcome: me > 0 ? 'win' : me < 0 ? 'lose' : 'draw', rankings: order.map(p => ({ p, label: (gs.total[p] >= 0 ? '+' : '') + gs.total[p] + ' điểm' + (gs.white[p] ? ' · ' + gs.white[p] : '') })), specials: sp, headline: gs.over.reason === 'white' ? '🏆 THẮNG TRẮNG: ' + gs.over.label : (me > 0 ? '🃏 THẮNG!' : null) };
  },
  detail() { const gs = gameState; return gs.players.map((p, i) => p.name + ': ' + (gs.arr ? gs.arr[i].chi.map((c, k) => c.map(cardShort).join(' ') + ' [' + chiName(k === 0 ? eval3(c) : eval5(c), k === 0 ? 3 : 5) + ']').join(' | ') : '')); }
};

/* ============================ POKER — TEXAS HOLD'EM ============================ */
const PK = { SB: 10, BB: 20, STACK: 1000 };
const PK_ALL = Object.keys(CARD_BY_ID);
function pkAlive(gs) { return gs.players.map((_, i) => i).filter(i => !gs.folded[i]); }
function pkPot(gs) { return gs.contrib.reduce((a, b) => a + b, 0); }
function pkPost(gs, p, amt) { const a = Math.max(0, Math.min(amt, gs.chips[p])); gs.chips[p] -= a; gs.bets[p] += a; gs.contrib[p] += a; if (gs.chips[p] === 0) gs.allin[p] = true; return a; }
function pkOrderFrom(gs, start, pred) { const n = gs.players.length, out = []; for (let k = 0; k < n; k++) { const q = (start + k) % n; if (pred(q)) out.push(q); } return out; }
/* Chia pot chính + pot phụ theo mức đóng góp */
function pkSidePots(gs) {
  const levels = [...new Set(gs.contrib.filter(x => x > 0))].sort((a, b) => a - b), pots = []; let prev = 0;
  levels.forEach(L => {
    const amt = gs.contrib.reduce((s, c) => s + Math.max(0, Math.min(c, L) - prev), 0);
    const elig = gs.players.map((_, i) => i).filter(i => !gs.folded[i] && gs.contrib[i] >= L);
    pots.push({ amt, elig, top: gs.players.map((_, i) => i).filter(i => gs.contrib[i] >= L) }); prev = L;
  });
  return pots;
}
/* Xác suất thắng (Monte Carlo) — chỉ dùng bài của chính AI và bài chung công khai */
function pkEquity(gs, p, sims) {
  const known = new Set(gs.hands[p].concat(gs.board).map(c => c.id)), rest = PK_ALL.filter(id => !known.has(id)).map(id => CARD_BY_ID[id]);
  const opp = pkAlive(gs).filter(i => i !== p).length, need = 5 - gs.board.length; let win = 0;
  for (let s = 0; s < sims; s++) {
    const m = need + opp * 2;
    for (let k = 0; k < m; k++) { const j = k + Math.floor(Math.random() * (rest.length - k)); const t = rest[k]; rest[k] = rest[j]; rest[j] = t; }
    const board = gs.board.concat(rest.slice(0, need)), mine = best5(gs.hands[p].concat(board)).score;
    let res = 1;
    for (let o = 0; o < opp; o++) { const c = cmpArr(mine, best5([rest[need + o * 2], rest[need + o * 2 + 1]].concat(board)).score); if (c < 0) { res = 0; break; } if (c === 0) res = Math.min(res, 0.5); }
    win += res;
  }
  return win / sims;
}
function pkPreflop(cs) {
  const a = rv(cs[0]), b = rv(cs[1]), hi = Math.max(a, b), lo = Math.min(a, b);
  if (a === b) return 0.55 + (a - 2) / 26;
  return clamp((hi + lo) / 56 + (cs[0].suit === cs[1].suit ? 0.05 : 0) + (hi - lo <= 2 ? 0.05 : 0) + (hi >= 12 ? 0.05 : 0) - 0.05, 0.08, 0.7);
}
function pkMade(gs, p) {
  if (gs.board.length < 3) return pkPreflop(gs.hands[p]);
  const e = best5(gs.hands[p].concat(gs.board)).score;
  return [0.22 + (e[1] || 0) / 70, 0.5, 0.68, 0.78, 0.86, 0.9, 0.94, 0.98, 1][e[0]];
}
const POKER_ENGINE = {
  id: 'poker', kind: 'poker',
  setup(opts) {
    gameState = newGameState(); const gs = gameState; gs.currentGame = 'poker'; gs.players = makePlayers(clamp(opts.players, 2, 6));
    gs.deck = newShuffledDeck(); gs.chips = new Array(gs.players.length).fill(PK.STACK);
  },
  deal() {
    const gs = gameState, n = gs.players.length;
    gs.hands = dealCards(gs.deck, n, 2); gs.board = []; gs.folded = new Array(n).fill(false); gs.allin = new Array(n).fill(false);
    gs.bets = new Array(n).fill(0); gs.contrib = new Array(n).fill(0); gs.stage = 'preflop'; gs.dealer = rand(n); gs.over = null; gs.phase = 'play'; gs.lastAct = new Array(n).fill('');
    const sb = n === 2 ? gs.dealer : (gs.dealer + 1) % n, bb = (sb + 1) % n;
    pkPost(gs, sb, PK.SB); pkPost(gs, bb, PK.BB); gs.sb = sb; gs.bb = bb; gs.curBet = PK.BB; gs.minRaise = PK.BB;
    gs.needAct = pkOrderFrom(gs, (bb + 1) % n, q => !gs.allin[q]); gs.turn = gs.needAct[0];
  },
  toCall(p) { const gs = gameState; return Math.max(0, Math.min(gs.curBet - gs.bets[p], gs.chips[p])); },
  raiseOptions() { // các mức tố gợi ý cho người chơi
    const gs = gameState, p = 0, pot = pkPot(gs), maxTo = gs.bets[p] + gs.chips[p], minTo = gs.curBet + gs.minRaise, out = [];
    const add = (label, to) => { to = Math.round(to / 10) * 10; if (to >= maxTo) to = maxTo; if (to > gs.curBet && to >= Math.min(minTo, maxTo) && !out.some(o => o.to === to)) out.push({ label, to }); };
    add('Tối thiểu', minTo); add('½ Pot', gs.curBet + pot / 2); add('Pot', gs.curBet + pot); add('2× Pot', gs.curBet + pot * 2);
    if (!out.some(o => o.to === maxTo) && maxTo > gs.curBet) out.push({ label: 'ALL-IN', to: maxTo });
    return out;
  },
  getValidMoves(p) {
    const gs = gameState; if (gs.over || gs.turn !== p) return [];
    const m = [{ type: 'fold' }]; if (gs.curBet === gs.bets[p]) m.push({ type: 'check' }); else m.push({ type: 'call' });
    if (gs.chips[p] > gs.curBet - gs.bets[p]) m.push({ type: 'raise', to: Math.min(gs.bets[p] + gs.chips[p], gs.curBet + gs.minRaise) });
    m.push({ type: 'allin' }); return m;
  },
  validateMove(p, mv) {
    const gs = gameState; if (!mv) return { ok: false, reason: 'Không có nước đi' };
    if (gs.over || gs.turn !== p) return { ok: false, reason: 'Chưa đến lượt' };
    if (mv.type === 'check' && gs.curBet !== gs.bets[p]) return { ok: false, reason: 'Không thể Check — hãy Call hoặc Fold' };
    if (mv.type === 'call' && gs.curBet === gs.bets[p]) return { ok: false, reason: 'Không cần Call — hãy Check' };
    if (mv.type === 'raise') {
      const max = gs.bets[p] + gs.chips[p];
      if (!(mv.to > gs.curBet)) return { ok: false, reason: 'Mức tố phải lớn hơn mức hiện tại' };
      if (mv.to > max) return { ok: false, reason: 'Không đủ chip' };
      if (mv.to < gs.curBet + gs.minRaise && mv.to !== max) return { ok: false, reason: 'Tố tối thiểu lên ' + (gs.curBet + gs.minRaise) };
    }
    return ['fold', 'check', 'call', 'raise', 'allin'].includes(mv.type) ? { ok: true } : { ok: false, reason: 'Nước đi không hợp lệ' };
  },
  play(p, mv) {
    const gs = gameState; let reopen = false, sfx = 'card';
    if (mv.type === 'fold') { gs.folded[p] = true; gs.lastAct[p] = 'Fold'; sfx = 'select'; }
    else if (mv.type === 'check') gs.lastAct[p] = 'Check';
    else if (mv.type === 'call') { pkPost(gs, p, gs.curBet - gs.bets[p]); gs.lastAct[p] = gs.allin[p] ? 'All-in' : 'Call'; }
    else {
      const to = mv.type === 'allin' ? gs.bets[p] + gs.chips[p] : mv.to;
      if (to <= gs.curBet) { pkPost(gs, p, gs.curBet - gs.bets[p]); gs.lastAct[p] = 'All-in'; }
      else { if (to - gs.curBet >= gs.minRaise) gs.minRaise = to - gs.curBet; pkPost(gs, p, to - gs.bets[p]); gs.curBet = to; reopen = true; gs.lastAct[p] = gs.allin[p] ? 'All-in' : 'Raise ' + to; sfx = 'chat'; }
    }
    if (reopen) gs.needAct = pkOrderFrom(gs, (p + 1) % gs.players.length, q => q !== p && !gs.folded[q] && !gs.allin[q]);
    else gs.needAct = gs.needAct.filter(x => x !== p);
    POKER_ENGINE.afterAction();
    return { type: mv.type, sfx };
  },
  afterAction() {
    const gs = gameState, alive = pkAlive(gs);
    if (alive.length === 1) { const total = pkPot(gs); gs.chips[alive[0]] += total; gs.contrib = gs.contrib.map(() => 0); gs.over = { reason: 'fold', winners: [alive[0]], pot: total }; gs.phase = 'over'; return; }
    gs.needAct = gs.needAct.filter(q => !gs.folded[q] && !gs.allin[q]);
    if (gs.needAct.length) return;
    // kết thúc vòng cược: sang vòng mới hoặc so bài
    while (true) {
      gs.bets = gs.bets.map(() => 0); gs.curBet = 0; gs.minRaise = PK.BB;
      if (gs.stage === 'river') { POKER_ENGINE.showdown(); return; }
      if (gs.stage === 'preflop') { gs.board.push(drawCard(gs.deck), drawCard(gs.deck), drawCard(gs.deck)); gs.stage = 'flop'; }
      else if (gs.stage === 'flop') { gs.board.push(drawCard(gs.deck)); gs.stage = 'turn'; }
      else { gs.board.push(drawCard(gs.deck)); gs.stage = 'river'; }
      const can = alive.filter(q => !gs.allin[q]);
      if (can.length > 1) { gs.needAct = pkOrderFrom(gs, (gs.dealer + 1) % gs.players.length, q => !gs.folded[q] && !gs.allin[q]); gs.turn = gs.needAct[0]; return; }
    }
  },
  showdown() {
    const gs = gameState, alive = pkAlive(gs), sc = {}, totalPot = pkPot(gs);
    alive.forEach(i => { sc[i] = best5(gs.hands[i].concat(gs.board)); });
    const winnersAll = new Set();
    pkSidePots(gs).forEach(pot => {
      const el = pot.elig.length ? pot.elig : pot.top.slice(0, 1);
      let best = null; el.forEach(i => { if (sc[i] && (best === null || cmpArr(sc[i].score, sc[best].score) > 0)) best = i; });
      const ws = best === null ? el : el.filter(i => cmpArr(sc[i].score, sc[best].score) === 0), share = Math.floor(pot.amt / ws.length);
      ws.forEach(i => { gs.chips[i] += share; winnersAll.add(i); }); gs.chips[ws[0]] += pot.amt - share * ws.length;
    });
    gs.sc = {}; alive.forEach(i => { gs.sc[i] = { name: pkName(sc[i].score), score: sc[i].score }; });
    gs.over = { reason: 'show', winners: [...winnersAll], pot: totalPot }; gs.phase = 'over'; gs.contrib = gs.contrib.map(() => 0);
  },
  nextTurn() {
    const gs = gameState; if (gs.over) return; const n = gs.players.length;
    if (gs.needAct.includes(gs.turn)) return; // người này vẫn phải hành động (sau khi sang vòng mới)
    for (let k = 1; k <= n; k++) { const q = (gs.turn + k) % n; if (gs.needAct.includes(q)) { gs.turn = q; return; } }
  },
  checkWin: () => gameState.over,
  aiChoose(p, level) {
    const gs = gameState, call = POKER_ENGINE.toCall(p), pot = pkPot(gs), chips = gs.chips[p], oppN = pkAlive(gs).length - 1;
    let eq;
    if (level <= 0 || (level === 1 && gs.board.length === 0)) eq = pkMade(gs, p);
    else if (level === 1) eq = pkMade(gs, p) * 0.5 + pkEquity(gs, p, 50) * 0.5;
    else eq = pkEquity(gs, p, level === 2 ? 120 : 300);
    eq += (Math.random() - 0.5) * (level <= 0 ? 0.5 : level === 1 ? 0.12 : level === 2 ? 0.05 : 0.02);
    const odds = call > 0 ? call / (pot + call) : 0;
    const R = [0.74, 0.7, 0.66, 0.62][clamp(level, 0, 3)], margin = [-0.06, 0, 0.02, 0.03][clamp(level, 0, 3)];
    const raiseTo = frac => { const size = Math.max(gs.minRaise, Math.round(pot * frac / 10) * 10), to = gs.curBet + size; return to - gs.bets[p] >= chips ? { type: 'allin' } : { type: 'raise', to }; };
    if (call === 0) {
      if (eq > R && chips > 0) return raiseTo(eq > 0.85 ? 0.75 : 0.5);
      if (level >= 3 && gs.board.length >= 3 && eq < 0.4 && Math.random() < 0.1) return raiseTo(0.4);
      return { type: 'check' };
    }
    if (eq > R + 0.05 && chips > call) return raiseTo(eq > 0.85 ? 0.8 : 0.55);
    if (eq >= odds + margin + (oppN > 2 ? 0.02 * (oppN - 2) : 0)) return call >= chips ? { type: 'allin' } : { type: 'call' };
    return { type: 'fold' };
  },
  timeoutMove(p) { const gs = gameState; return gs.curBet === gs.bets[p] ? { type: 'check' } : { type: 'fold' }; },
  hint(p) { return POKER_ENGINE.aiChoose(p, 2); },
  seatView(i) {
    const gs = gameState, shown = gs.over && gs.over.reason === 'show' && !gs.folded[i];
    let warn = gs.folded[i] ? 'Fold' : gs.allin[i] ? 'ALL-IN' : (gs.lastAct[i] || '');
    if (gs.over && gs.over.winners.includes(i)) warn = '★ Thắng';
    return { cnt: '💰 ' + gs.chips[i] + (gs.bets[i] ? ' · cược ' + gs.bets[i] : ''), warn: (gs.dealer === i ? '🔘D ' : '') + warn, rows: [gs.hands[i].map(c => ci(c, !shown || gs.folded[i]))], name: shown && gs.sc && gs.sc[i] ? gs.sc[i].name : '' };
  },
  tableView() {
    const gs = gameState, cards = gs.board.map(c => ci(c)), pot = pkPot(gs) + (gs.over ? 0 : 0);
    const stageName = { preflop: 'Pre-flop', flop: 'Flop', turn: 'Turn', river: 'River' }[gs.stage];
    return { info: '💰 Pot ' + (gs.over ? gs.over.pot || '' : pot) + ' · ' + stageName + (gs.curBet ? ' · Mức cược ' + gs.curBet : ''), rows: [{ label: 'Bài chung', cards, slots: 5 - cards.length }] };
  },
  handView() { return { cards: gameState.hands[0].map(c => ci(c)) }; },
  myInfo() {
    const gs = gameState; let t = '💰 ' + gs.chips[0] + (gs.bets[0] ? ' · cược ' + gs.bets[0] : '');
    if (gs.board.length >= 3 && !gs.folded[0]) t += ' · ' + pkName(best5(gs.hands[0].concat(gs.board)).score);
    return t + (gs.folded[0] ? ' · Đã Fold' : '');
  },
  actionsView(my) {
    const gs = gameState, mv = my ? POKER_ENGINE.getValidMoves(0).map(m => m.type) : [], call = my ? POKER_ENGINE.toCall(0) : 0, out = [];
    out.push({ txt: 'FOLD', act: 'g:fold', dis: !my });
    out.push({ txt: call > 0 ? 'CALL ' + call : 'CHECK', act: call > 0 ? 'g:call' : 'g:check', dis: !my });
    out.push({ txt: 'RAISE ▲', act: 'raise-menu', cls: 'primary', dis: !my || !mv.includes('raise') });
    out.push({ txt: 'ALL-IN', act: 'g:allin', dis: !my });
    return out;
  },
  calculateResult() {
    const gs = gameState, net = gs.chips.map(c => c - PK.STACK), order = [...gs.players.keys()].sort((a, b) => net[b] - net[a] || a - b), me = net[0], sp = [];
    if (me > 0 && gs.sc && gs.sc[0] && gs.sc[0].score[0] >= 5) sp.push('pkStrong');
    return { outcome: me > 0 ? 'win' : me < 0 ? 'lose' : 'draw', rankings: order.map(p => ({ p, label: (net[p] >= 0 ? '+' : '') + net[p] + ' chip' + (gs.sc && gs.sc[p] ? ' · ' + gs.sc[p].name : (gs.folded[p] ? ' · Fold' : '')) })), specials: sp, headline: me > 0 ? '🃏 THẮNG ' + (gs.sc && gs.sc[0] ? gs.sc[0].name.toUpperCase() : 'VÁN POKER') : null };
  },
  detail() { const gs = gameState; return ['Bài chung: ' + (gs.board.map(cardShort).join(' ') || '(chưa có)')].concat(gs.players.map((p, i) => p.name + ': ' + gs.hands[i].map(cardShort).join(' ') + (gs.sc && gs.sc[i] ? ' → ' + gs.sc[i].name : (gs.folded[i] ? ' (fold)' : '')))); }
};

/* ============================ PHỎM ============================ */
const phomVal = c => c.value; // A=1 … K=13
const rumVal = c => (c.value >= 10 ? 10 : c.value); // A=1, 2–9, 10/J/Q/K=10
function drawPrev(gs, p) { return (p + gs.players.length - 1) % gs.players.length; }
/* Cách ăn bài tốt nhất: bộ chứa lá vừa bỏ, ghép từ ≥2 lá trong tay */
function phomEatOption(p) {
  const gs = gameState, last = gs.last; if (!last || last.player !== drawPrev(gs, p)) return null;
  const hand = gs.hands[p], cards = hand.concat([last.card]), li = cards.length - 1;
  const cand = meldCandidates(cards).filter(m => m.includes(li)); if (!cand.length) return null;
  let best = null, bd = Infinity;
  cand.forEach(m => {
    const used = new Set(m), rest = cards.filter((_, i) => !used.has(i)), r = bestMelds(rest, phomVal);
    const score = r.dw - m.length * 0.01; if (score < bd) { bd = score; best = m; }
  });
  return best.map(i => cards[i]);
}
function phomPotential(rest) { // số cặp tiềm năng thành phỏm (cùng số hoặc cùng chất liền kề)
  let pot = 0;
  for (let i = 0; i < rest.length; i++) for (let j = i + 1; j < rest.length; j++) {
    const a = rest[i], b = rest[j];
    if (a.rank === b.rank) pot += 1; else if (a.suit === b.suit && Math.abs(a.value - b.value) <= 2) pot += 0.7;
  }
  return pot;
}
function drawDiscardChoice(p, level, valFn, selfOnly) { // chọn lá bỏ: ít điểm rác nhất, giữ lá tạo bộ
  const gs = gameState, hand = gs.hands[p];
  if (level <= 0 && Math.random() < 0.35) return pick(hand);
  const nxt = (p + 1) % gs.players.length, nd = (gs.discards && gs.discards[nxt]) || [];
  let best = null, bs = Infinity;
  hand.forEach(c => {
    const rest = hand.filter(x => x !== c), r = bestMelds(rest, valFn);
    let sc = r.dw - (level >= 1 ? 0.9 * phomPotential(rest) : 0) - c.value * 0.01;
    if (level >= 2 && !selfOnly) { // đoán an toàn: lá giống thứ đối thủ kế tiếp đã bỏ thì ít bị ăn
      let safe = 0; nd.forEach(d => { if (d.rank === c.rank || (d.suit === c.suit && Math.abs(d.value - c.value) <= 2)) safe++; });
      sc += 0.5 - 0.3 * Math.min(safe, 2);
    }
    if (sc < bs) { bs = sc; best = c; }
  });
  return best;
}
function phomSettle(ender) {
  const gs = gameState, n = gs.players.length;
  const res = gs.hands.map((h, i) => { const r = bestMelds(h, phomVal); return { melds: r.melds, left: r.deadwood.slice() }; });
  const table = []; // tất cả phỏm đã hạ
  res.forEach((r, i) => { gs.melds[i].concat(r.melds).forEach(m => table.push({ owner: i, cards: m.slice() })); });
  const mom = res.map((r, i) => gs.melds[i].length + r.melds.length === 0);
  for (let i = 0; i < n; i++) { // gửi bài vào phỏm trên bàn
    if (mom[i]) continue;
    res[i].left.sort((a, b) => b.value - a.value);
    res[i].left = res[i].left.filter(c => { const m = table.find(t => canAttachMeld(t.cards, c)); if (m) { m.cards.push(c); return false; } return true; });
  }
  const pts = res.map(r => r.left.reduce((a, c) => a + phomVal(c), 0));
  gs.final = { res, pts, mom, table };
  const order = [...Array(n).keys()].sort((a, b) => (mom[a] ? 1 : 0) - (mom[b] ? 1 : 0) || pts[a] - pts[b] || res[a].left.length - res[b].left.length || a - b);
  if (ender != null) { order.splice(order.indexOf(ender), 1); order.unshift(ender); }
  gs.final.order = order;
}
const PHOM_ENGINE = {
  id: 'phom', kind: 'draw',
  setup(opts) { gameState = newGameState(); const gs = gameState; gs.currentGame = 'phom'; gs.players = makePlayers(clamp(opts.players, 2, 4)); gs.deck = newShuffledDeck(); },
  deal() {
    const gs = gameState, n = gs.players.length;
    gs.hands = dealCards(gs.deck, n, 9); gs.stock = gs.deck; gs.melds = gs.players.map(() => []); gs.discards = gs.players.map(() => []);
    gs.dcount = new Array(n).fill(0); gs.last = null; gs.over = null; gs.phase = 'play'; gs.pendingNext = false; gs.final = null;
    gs.starter = rand(n); gs.hands[gs.starter].push(drawCard(gs.stock)); gs.turn = gs.starter; gs.dphase = 'discard';
    gs.hands.forEach(h => h.sort((a, b) => a.value - b.value || SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]));
    const r = bestMelds(gs.hands[gs.starter], phomVal);
    if (r.dw === 0) { gs.over = { reason: 'u', winner: gs.starter }; gs.phase = 'over'; phomSettle(gs.starter); }
  },
  getValidMoves(p) {
    const gs = gameState; if (gs.over || gs.turn !== p) return [];
    if (gs.dphase === 'draw') { const m = [{ type: 'draw', src: 'stock' }]; if (phomEatOption(p)) m.push({ type: 'eat' }); return m; }
    return gs.hands[p].map(c => ({ type: 'discard', card: c.id }));
  },
  validateMove(p, mv) {
    const gs = gameState; if (!mv) return { ok: false, reason: 'Không có nước đi' };
    if (gs.over || gs.turn !== p) return { ok: false, reason: 'Chưa đến lượt' };
    if (mv.type === 'turn') return gs.dphase === 'draw' ? { ok: true } : { ok: false, reason: 'Đã bốc bài rồi' };
    if (mv.type === 'draw') return gs.dphase === 'draw' ? { ok: true, free: p === 0 } : { ok: false, reason: 'Bạn phải đánh một lá' };
    if (mv.type === 'eat') { if (gs.dphase !== 'draw') return { ok: false, reason: 'Bạn phải đánh một lá' }; return phomEatOption(p) ? { ok: true, free: p === 0 } : { ok: false, reason: 'Không ăn được: lá này không tạo thành phỏm' }; }
    if (mv.type === 'discard') { if (gs.dphase !== 'discard') return { ok: false, reason: 'Hãy bốc hoặc ăn bài trước' }; return gs.hands[p].some(c => c.id === mv.card) ? { ok: true } : { ok: false, reason: 'Hãy chọn 1 lá để đánh' }; }
    return { ok: false, reason: 'Nước đi không hợp lệ' };
  },
  doDraw(p) {
    const gs = gameState;
    if (!gs.stock.length) { gs.over = { reason: 'end' }; gs.phase = 'over'; phomSettle(null); return false; }
    gs.hands[p].push(drawCard(gs.stock)); gs.dphase = 'discard';
    if (bestMelds(gs.hands[p], phomVal).dw === 0) { gs.over = { reason: 'u', winner: p }; gs.phase = 'over'; phomSettle(p); }
    return true;
  },
  doEat(p) {
    const gs = gameState, m = phomEatOption(p), last = gs.last.card;
    m.forEach(c => { if (c !== last) { const i = gs.hands[p].indexOf(c); if (i >= 0) gs.hands[p].splice(i, 1); } });
    gs.melds[p].push(m); const dp = gs.discards[gs.last.player]; dp.pop(); gs.last = null; gs.dphase = 'discard';
    if (!gs.hands[p].length || bestMelds(gs.hands[p], phomVal).dw === 0) { gs.over = { reason: 'u', winner: p }; gs.phase = 'over'; phomSettle(p); }
  },
  doDiscard(p, id) {
    const gs = gameState, i = gs.hands[p].findIndex(c => c.id === id), c = gs.hands[p].splice(i, 1)[0];
    gs.discards[p].push(c); gs.last = { player: p, card: c }; gs.dcount[p]++; gs.dphase = 'draw'; gs.pendingNext = true;
    if (!gs.hands[p].length) { gs.over = { reason: 'u', winner: p }; gs.phase = 'over'; phomSettle(p); return; }
    if (gs.dcount.every(x => x >= 4)) { gs.over = { reason: 'end' }; gs.phase = 'over'; phomSettle(null); }
  },
  play(p, mv) {
    const gs = gameState;
    if (mv.type === 'draw') { PHOM_ENGINE.doDraw(p); return { type: 'draw', sfx: 'deal' }; }
    if (mv.type === 'eat') { PHOM_ENGINE.doEat(p); return { type: 'eat', sfx: 'eat' }; }
    if (mv.type === 'turn') { // AI / hết giờ: bốc hoặc ăn rồi đánh luôn
      const lv = mv.lv != null ? mv.lv : gs.players[p].level;
      let ate = false;
      if (mv.src === 'eat' && phomEatOption(p)) { PHOM_ENGINE.doEat(p); ate = true; } else if (!PHOM_ENGINE.doDraw(p)) return { type: 'draw' };
      if (gs.over) return { type: 'turn', sfx: ate ? 'eat' : 'deal' };
      PHOM_ENGINE.doDiscard(p, drawDiscardChoice(p, Math.max(0, lv), phomVal).id);
      return { type: 'turn', sfx: ate ? 'eat' : 'card' };
    }
    PHOM_ENGINE.doDiscard(p, mv.card); return { type: 'discard', sfx: 'card' };
  },
  nextTurn() { const gs = gameState; if (gs.over) return; if (gs.pendingNext) { gs.pendingNext = false; gs.turn = (gs.turn + 1) % gs.players.length; } },
  checkWin: () => gameState.over,
  aiChoose(p, level) {
    const eatable = phomEatOption(p);
    if (gameState.dphase === 'discard') return { type: 'discard', card: drawDiscardChoice(p, level, phomVal).id };
    const eat = eatable && (level >= 1 || Math.random() < 0.6);
    return { type: 'turn', src: eat ? 'eat' : 'stock', lv: level };
  },
  timeoutMove(p) { const gs = gameState; return gs.dphase === 'discard' ? { type: 'discard', card: drawDiscardChoice(p, 2, phomVal, true).id } : { type: 'turn', src: 'stock', lv: 1 }; },
  hint(p) { const gs = gameState; if (gs.dphase === 'discard') return { type: 'discard', card: drawDiscardChoice(p, 3, phomVal).id }; return phomEatOption(p) ? { type: 'eat' } : { type: 'draw', src: 'stock' }; },
  seatView(i) {
    const gs = gameState, rows = [];
    gs.melds[i].forEach(m => rows.push(m.map(c => ci(c))));
    if (gs.discards[i].length) rows.push(gs.discards[i].map(c => ci(c)));
    if (gs.over && gs.final) { const r = gs.final.res[i]; if (r.melds.length) r.melds.forEach(m => rows.push(m.map(c => ci(c)))); if (r.left.length) rows.push(r.left.map(c => ci(c))); }
    return { cnt: gs.over ? '' : '🂠 ' + gs.hands[i].length, warn: gs.over && gs.final ? (gs.final.mom[i] ? 'MÓM' : (gs.over.winner === i ? 'Ù! ' : '') + gs.final.pts[i] + ' điểm') : (gs.discards[i].length + '/4 lá bỏ'), rows };
  },
  tableView() {
    const gs = gameState, rows = [];
    rows.push({ label: 'Nọc ' + gs.stock.length, cards: [ci(gs.stock[0] || gs.hands[0][0], true)].concat(gs.last ? [ci(gs.last.card)] : []) });
    const tall = typeof window === 'undefined' || window.innerHeight >= 600;
    if (tall && gs.melds[0].length) rows.push({ label: 'Phỏm bạn ăn', cards: [].concat.apply([], gs.melds[0]).map(c => ci(c)) });
    if (tall && gs.discards[0].length) rows.push({ label: 'Bạn đã bỏ', cards: gs.discards[0].map(c => ci(c)) });
    let info = gs.over ? (gs.over.reason === 'u' ? '🏆 Ù! ' + gs.players[gs.over.winner].name : 'Hết 4 vòng — hạ phỏm, gửi bài, tính điểm') : (gs.turn === 0 ? (gs.dphase === 'draw' ? 'Bốc nọc hoặc ăn lá vừa bỏ (nếu tạo được phỏm)' : 'Chọn 1 lá để đánh') : gs.players[gs.turn].name + ' đang chơi');
    return { info, rows };
  },
  handView() {
    const gs = gameState, r = bestMelds(gs.hands[0], phomVal), inM = new Set([].concat.apply([], r.melds).map(c => c.id));
    return { cards: [].concat.apply([], r.melds).concat(r.deadwood.slice().sort((a, b) => a.value - b.value)).map(c => ci(c)), melded: inM };
  },
  myInfo() { const gs = gameState, r = bestMelds(gs.hands[0], phomVal); return 'Phỏm: ' + (r.melds.length + gs.melds[0].length) + ' · điểm rác ' + r.dw + ' · bài bỏ ' + gs.dcount[0] + '/4'; },
  actionsView(my) {
    const gs = gameState, out = []; if (gs.over) return out;
    if (gs.dphase === 'draw' || !my) {
      out.push({ txt: '🂠 BỐC NỌC', act: 'g:draw', cls: 'primary', dis: !my || gs.dphase !== 'draw' });
      out.push({ txt: '🍽 ĂN', act: 'g:eat', dis: !my || gs.dphase !== 'draw' || !phomEatOption(0) });
    } else out.push({ txt: '⬇ ĐÁNH', act: 'g:discard', cls: 'primary' });
    out.push({ txt: '💡', act: 'hint', cls: 'sortbtn', dis: !my });
    return out;
  },
  calculateResult() {
    const gs = gameState, f = gs.final, order = f.order, me = order.indexOf(0), sp = [];
    if (gs.over.reason === 'u' && gs.over.winner === 0) sp.push('phomU');
    return { outcome: me === 0 ? 'win' : 'lose', rankings: order.map(p => ({ p, label: f.mom[p] ? 'Móm' : (gs.over.reason === 'u' && gs.over.winner === p ? 'Ù! ' : '') + f.pts[p] + ' điểm rác' })), specials: sp, headline: gs.over.reason === 'u' ? (gs.over.winner === 0 ? '🏆 BẠN Ù!' : '💥 ' + gs.players[gs.over.winner].name + ' Ù!') : (f.mom[0] ? '😵 BẠN BỊ MÓM' : null) };
  },
  detail() { const gs = gameState, f = gs.final; return gs.players.map((p, i) => p.name + ': ' + (f.res[i].melds.concat(gs.melds[i]).map(m => '[' + m.map(cardShort).join(' ') + ']').join(' ') || '(không phỏm)') + ' + rác ' + (f.res[i].left.map(cardShort).join(' ') || '0') + ' = ' + f.pts[i]); }
};

/* ============================ RUMMY (kiểu Gin Rummy: gõ khi rác ≤ 10) ============================ */
const RUM = { KNOCK: 10 };
const RUMMY_ENGINE = {
  id: 'rummy', kind: 'draw',
  setup(opts) { gameState = newGameState(); const gs = gameState; gs.currentGame = 'rummy'; gs.players = makePlayers(clamp(opts.players, 2, 4)); gs.deck = newShuffledDeck(); },
  deal() {
    const gs = gameState, n = gs.players.length;
    gs.hands = dealCards(gs.deck, n, n === 2 ? 10 : 7); gs.stock = gs.deck; gs.pile = [drawCard(gs.stock)]; gs.melds = gs.players.map(() => []);
    gs.over = null; gs.phase = 'play'; gs.pendingNext = false; gs.final = null; gs.turn = rand(n); gs.dphase = 'draw'; gs.dcount = new Array(n).fill(0); gs.discards = gs.players.map(() => []);
    gs.hands.forEach(h => h.sort((a, b) => a.value - b.value || SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]));
  },
  dwAfter(p, id) { const gs = gameState; return bestMelds(gs.hands[p].filter(c => c.id !== id), rumVal).dw; },
  getValidMoves(p) {
    const gs = gameState; if (gs.over || gs.turn !== p) return [];
    if (gs.dphase === 'draw') return [{ type: 'draw', src: 'stock' }, { type: 'draw', src: 'pile' }];
    const m = gs.hands[p].map(c => ({ type: 'discard', card: c.id }));
    gs.hands[p].forEach(c => { if (RUMMY_ENGINE.dwAfter(p, c.id) <= RUM.KNOCK) m.push({ type: 'knock', card: c.id }); });
    return m;
  },
  validateMove(p, mv) {
    const gs = gameState; if (!mv) return { ok: false, reason: 'Không có nước đi' };
    if (gs.over || gs.turn !== p) return { ok: false, reason: 'Chưa đến lượt' };
    if (mv.type === 'turn') return gs.dphase === 'draw' ? { ok: true } : { ok: false, reason: 'Đã bốc bài rồi' };
    if (mv.type === 'draw') { if (gs.dphase !== 'draw') return { ok: false, reason: 'Bạn phải đánh một lá' }; if (mv.src === 'pile' && !gs.pile.length) return { ok: false, reason: 'Chồng bỏ đang trống' }; return { ok: true, free: p === 0 }; }
    if (mv.type === 'discard' || mv.type === 'knock') {
      if (gs.dphase !== 'discard') return { ok: false, reason: 'Hãy bốc bài trước' };
      if (!gs.hands[p].some(c => c.id === mv.card)) return { ok: false, reason: 'Hãy chọn 1 lá để đánh' };
      if (mv.type === 'knock' && RUMMY_ENGINE.dwAfter(p, mv.card) > RUM.KNOCK) return { ok: false, reason: 'Chỉ gõ được khi điểm rác ≤ ' + RUM.KNOCK };
      return { ok: true };
    }
    return { ok: false, reason: 'Nước đi không hợp lệ' };
  },
  doDraw(p, src) {
    const gs = gameState;
    if (src === 'pile' && gs.pile.length) gs.hands[p].push(gs.pile.pop());
    else { if (gs.stock.length <= 2) { RUMMY_ENGINE.settle(null, true); return false; } gs.hands[p].push(drawCard(gs.stock)); }
    gs.dphase = 'discard'; return true;
  },
  doDiscard(p, id, knock) {
    const gs = gameState, i = gs.hands[p].findIndex(c => c.id === id), c = gs.hands[p].splice(i, 1)[0];
    gs.pile.push(c); gs.dphase = 'draw'; gs.pendingNext = true; gs.tcount = (gs.tcount || 0) + 1;
    if (knock) RUMMY_ENGINE.settle(p, false);
    else if (gs.tcount >= 60) RUMMY_ENGINE.settle(null, true); // quá nhiều lượt mà chưa ai gõ → so điểm rác
  },
  settle(knocker, stockOut) {
    const gs = gameState, n = gs.players.length;
    const res = gs.hands.map(h => { const r = bestMelds(h, rumVal); return { melds: r.melds, left: r.deadwood, dw: r.dw }; });
    gs.final = { res, knocker, stockOut };
    let winner;
    if (knocker == null) { winner = res.map((r, i) => i).sort((a, b) => res[a].dw - res[b].dw || a - b)[0]; const tie = res.filter(r => r.dw === res[winner].dw).length > 1; gs.final.tie = tie; }
    else { const others = res.map((r, i) => i).filter(i => i !== knocker), low = others.reduce((b, i) => (b === null || res[i].dw < res[b].dw ? i : b), null); winner = res[knocker].dw < res[low].dw ? knocker : low; gs.final.undercut = winner !== knocker; gs.final.gin = res[knocker].dw === 0; }
    gs.over = { reason: knocker == null ? 'stock' : 'knock', winner }; gs.phase = 'over';
    gs.final.order = [...Array(n).keys()].sort((a, b) => (a === winner ? -1 : b === winner ? 1 : res[a].dw - res[b].dw || a - b));
  },
  play(p, mv) {
    const gs = gameState;
    if (mv.type === 'draw') { RUMMY_ENGINE.doDraw(p, mv.src); return { type: 'draw', sfx: mv.src === 'pile' ? 'eat' : 'deal' }; }
    if (mv.type === 'turn') {
      const lv = mv.lv != null ? mv.lv : gs.players[p].level, top = gs.pile[gs.pile.length - 1];
      let src = 'stock';
      if (top && lv >= 0) {
        const cur = bestMelds(gs.hands[p], rumVal).dw, withTop = bestMelds(gs.hands[p].concat([top]), rumVal);
        const bestDrop = withTop.dw - Math.max.apply(null, withTop.deadwood.map(rumVal).concat([0]));
        if ((lv >= 1 && bestDrop < cur - 2) || (lv === 0 && Math.random() < 0.3)) src = 'pile';
      }
      if (!RUMMY_ENGINE.doDraw(p, src)) return { type: 'draw' };
      if (gs.over) return { type: 'turn' };
      let bc = null, bs = Infinity; // chọn lá bỏ làm rác ít nhất
      gs.hands[p].forEach(c => { const dw = RUMMY_ENGINE.dwAfter(p, c.id) - (lv >= 1 ? 0.2 * phomPotential(gs.hands[p].filter(x => x !== c)) : 0) - rumVal(c) * 0.001; if (dw < bs) { bs = dw; bc = c; } });
      if (lv <= 0 && Math.random() < 0.3) bc = pick(gs.hands[p]);
      const dwNow = RUMMY_ENGINE.dwAfter(p, bc.id), lim = lv <= 0 ? 0 : lv === 1 ? 5 : lv === 2 ? 8 : RUM.KNOCK;
      RUMMY_ENGINE.doDiscard(p, bc.id, dwNow <= lim);
      return { type: 'turn', sfx: src === 'pile' ? 'eat' : 'card' };
    }
    RUMMY_ENGINE.doDiscard(p, mv.card, mv.type === 'knock'); return { type: mv.type, sfx: mv.type === 'knock' ? 'chat' : 'card' };
  },
  nextTurn() { const gs = gameState; if (gs.over) return; if (gs.pendingNext) { gs.pendingNext = false; gs.turn = (gs.turn + 1) % gs.players.length; } },
  checkWin: () => gameState.over,
  aiChoose(p, level) { return gameState.dphase === 'discard' ? RUMMY_ENGINE.timeoutMove(p) : { type: 'turn', lv: level }; },
  timeoutMove(p) {
    const gs = gameState; if (gs.dphase === 'draw') return { type: 'turn', lv: 1 };
    const c = minBy(gs.hands[p], x => RUMMY_ENGINE.dwAfter(p, x.id) - rumVal(x) * 0.001); return { type: 'discard', card: c.id };
  },
  hint(p) {
    const gs = gameState; if (gs.dphase === 'draw') { const top = gs.pile[gs.pile.length - 1]; if (top && bestMelds(gs.hands[p].concat([top]), rumVal).dw < bestMelds(gs.hands[p], rumVal).dw - 2) return { type: 'draw', src: 'pile' }; return { type: 'draw', src: 'stock' }; }
    const c = minBy(gs.hands[p], x => RUMMY_ENGINE.dwAfter(p, x.id) - rumVal(x) * 0.001); return { type: RUMMY_ENGINE.dwAfter(p, c.id) <= RUM.KNOCK ? 'knock' : 'discard', card: c.id };
  },
  seatView(i) {
    const gs = gameState, rows = [];
    if (gs.over && gs.final) { const r = gs.final.res[i]; r.melds.forEach(m => rows.push(m.map(c => ci(c)))); if (r.left.length) rows.push(r.left.map(c => ci(c))); }
    return { cnt: gs.over ? '' : '🂠 ' + gs.hands[i].length, warn: gs.over && gs.final ? 'rác ' + gs.final.res[i].dw + (gs.over.winner === i ? ' ★' : '') : '', rows };
  },
  tableView() {
    const gs = gameState, top = gs.pile[gs.pile.length - 1];
    const info = gs.over ? (gs.over.reason === 'knock' ? (gs.final.gin ? '🏆 GIN! ' : '✊ Gõ! ') + (gs.final.undercut ? 'Bị undercut' : '') : 'Hết nọc — so điểm rác') : (gs.turn === 0 ? (gs.dphase === 'draw' ? 'Bốc nọc hoặc lấy lá bỏ' : 'Đánh 1 lá, hoặc GÕ nếu rác ≤ ' + RUM.KNOCK) : gs.players[gs.turn].name + ' đang chơi');
    return { info, rows: [{ label: 'Nọc ' + gs.stock.length + '\nChồng bỏ', cards: [ci(gs.stock[0] || top, true)].concat(top ? [ci(top)] : []) }] };
  },
  handView() {
    const gs = gameState, r = bestMelds(gs.hands[0], rumVal);
    return { cards: [].concat.apply([], r.melds).concat(r.deadwood.slice().sort((a, b) => a.value - b.value)).map(c => ci(c)) };
  },
  myInfo() { const gs = gameState, r = bestMelds(gs.hands[0], rumVal); return 'Bộ: ' + r.melds.length + ' · điểm rác ' + r.dw + (r.dw <= RUM.KNOCK ? ' (có thể gõ)' : ''); },
  actionsView(my) {
    const gs = gameState, out = []; if (gs.over) return out;
    if (gs.dphase === 'draw' || !my) {
      out.push({ txt: '🂠 BỐC NỌC', act: 'g:draw', cls: 'primary', dis: !my || gs.dphase !== 'draw', data: { src: 'stock' } });
      out.push({ txt: '♻ LẤY BÀI BỎ', act: 'g:draw', dis: !my || gs.dphase !== 'draw' || !gs.pile.length, data: { src: 'pile' } });
    } else { out.push({ txt: '⬇ ĐÁNH', act: 'g:discard', cls: 'primary' }); out.push({ txt: '✊ GÕ', act: 'g:knock' }); }
    out.push({ txt: '💡', act: 'hint', cls: 'sortbtn', dis: !my });
    return out;
  },
  calculateResult() {
    const gs = gameState, f = gs.final, order = f.order, me = order.indexOf(0), sp = [];
    if (gs.over.winner === 0 && f.gin) sp.push('rumGin');
    const draw = f.knocker == null && f.tie && f.res[0].dw === f.res[order[0]].dw;
    return { outcome: me === 0 ? (draw ? 'draw' : 'win') : 'lose', rankings: order.map(p => ({ p, label: 'rác ' + f.res[p].dw + (p === f.knocker ? ' · gõ' : '') })), specials: sp, headline: gs.over.winner === 0 ? (f.gin ? '🏆 GIN RUMMY!' : '🏆 THẮNG!') : null };
  },
  detail() { const gs = gameState, f = gs.final; return gs.players.map((p, i) => p.name + ': ' + (f.res[i].melds.map(m => '[' + m.map(cardShort).join(' ') + ']').join(' ') || '(không bộ)') + ' + rác ' + (f.res[i].left.map(cardShort).join(' ') || '0') + ' = ' + f.res[i].dw); }
};

/* ============================ ĐĂNG KÝ ENGINE ============================ */
const GAME_ENGINES = {
  tienLen: makeTienLen('tienLen', { quad: true, dthong: false, dthongChatTwo: false, chatDoi2: false, dthong4ChatQuad: false, penalty2: false, white: ['rong', 'tuQuy2'] }),
  tienLenMienNam: makeTienLen('tienLenMienNam', { quad: true, dthong: true, dthongChatTwo: true, chatDoi2: true, dthong4ChatQuad: true, penalty2: true, white: ['rong', 'tuQuy2', '6doi'] }),
  tienLenMienBac: makeTienLen('tienLenMienBac', { quad: true, dthong: true, dthongChatTwo: true, chatDoi2: false, dthong4ChatQuad: false, penalty2: false, white: ['rong', 'tuQuy2', 'tuQuy3'] }),
  samLoc: SAM_ENGINE,
  xiDach: XD_ENGINE,
  blackjack: BJ_ENGINE,
  highCard: HC_ENGINE,
  baCay: BC_ENGINE,
  lieng: LIENG_ENGINE,
  mauBinh: MB_ENGINE,
  poker: POKER_ENGINE,
  phom: PHOM_ENGINE,
  rummy: RUMMY_ENGINE
};
const DEALER_PLAYER = { id: -1, name: 'Nhà cái', avatar: '🎩', country: '', code: '', flag: '🏦', isHuman: false, level: 2 };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GAME_ENGINES, createDeck, shuffleDeck, assertValidDeck, calculateHandLayout, tlClassify, samClassify, xdTotal, xdClassify, bjValue };
}

/* ============================ 9b. GIẢI ĐẤU & PHÒNG (logic, không đụng DOM) ============================ */
let LEVEL_OVERRIDE = null, NEXT_OPP = null;
function effAiLevel() { return LEVEL_OVERRIDE != null ? LEVEL_OVERRIDE : Data.settings.aiLevel; }
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }

const SUBREGIONS = {
  sea: { name: 'Đông Nam Á', codes: ['VN', 'TH', 'ID', 'MY', 'SG', 'PH', 'KH', 'LA', 'MM', 'BN', 'TL'] },
  ea: { name: 'Đông Á & Trung Á', codes: ['JP', 'KR', 'CN', 'TW', 'HK', 'MN', 'KZ', 'UZ', 'KG', 'TJ', 'TM'] },
  swa: { name: 'Nam Á & Trung Đông', codes: ['IN', 'PK', 'BD', 'LK', 'NP', 'BT', 'MV', 'SA', 'AE', 'QA', 'KW', 'OM', 'BH', 'IR', 'IQ', 'JO', 'LB', 'IL', 'TR'] },
  weu: { name: 'Tây & Bắc Âu', codes: ['GB', 'IE', 'FR', 'DE', 'NL', 'BE', 'LU', 'CH', 'AT', 'DK', 'SE', 'NO', 'FI', 'IS'] },
  seu: { name: 'Nam & Đông Âu', codes: ['ES', 'PT', 'IT', 'GR', 'HR', 'RS', 'PL', 'CZ', 'HU', 'RO', 'BG', 'UA', 'RU', 'SK', 'SI'] },
  lat: { name: 'Mỹ Latinh', codes: ['MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'UY', 'PY', 'EC', 'VE', 'BO', 'CR', 'PA', 'CU'] },
  naoc: { name: 'Bắc Mỹ & Châu Đại Dương', codes: ['US', 'CA', 'AU', 'NZ', 'FJ', 'PG', 'JM', 'TT', 'CR', 'PA', 'CU', 'MX'] },
  afr: { name: 'Châu Phi', codes: ['EG', 'MA', 'DZ', 'TN', 'NG', 'GH', 'SN', 'CI', 'CM', 'KE', 'ET', 'ZA', 'UG', 'TZ', 'AO'] }
};
const TOURNAMENTS = {
  rookie: { name: 'Giải tân thủ', icon: '🌱', size: 8, format: 'ko', reward: 100, lv: [0, 1], desc: '8 người chơi mới (AI Dễ – Bình thường) · loại trực tiếp. Rất hợp để bắt đầu.' },
  quick: { name: 'Giải nhanh', icon: '⚡', size: 8, format: 'ko', reward: 150, desc: '8 người · đấu loại trực tiếp (Tứ kết → Bán kết → Chung kết).' },
  daily: { name: 'Giải hàng ngày', icon: '📅', size: 16, format: 'ko', reward: 250, daily: true, desc: '16 người · mỗi ngày tham gia 1 lần · bảng đấu giống nhau trong cùng một ngày.' },
  weekly: { name: 'Giải tuần', icon: '🗓️', size: 16, format: 'groups', reward: 450, weekly: true, desc: '16 người · mỗi tuần 1 lần · vòng bảng + loại trực tiếp · bảng đấu giống nhau trong cùng một tuần.' },
  regional: { name: 'Giải khu vực', icon: '🗺️', size: 8, format: 'ko', reward: 350, pick: 'sub', desc: '8 đại diện trong một khu vực bạn chọn · loại trực tiếp.' },
  national: { name: 'Giải quốc gia', icon: '🏅', size: 16, format: 'groups', reward: 500, desc: '16 người cùng đại diện quốc gia của bạn · vòng bảng 3 trận rồi loại trực tiếp.' },
  continental: { name: 'Giải châu lục', icon: '🌍', size: 16, format: 'groups', reward: 800, pick: 'region', desc: '16 đại diện của một châu lục · vòng bảng rồi loại trực tiếp.' },
  hard: { name: 'Giải Siêu khó', icon: '🔥', size: 8, format: 'ko', reward: 700, lv: [3, 3], bo3: 1, desc: '8 cao thủ AI Siêu khó · chung kết đấu 3 ván thắng 2.' },
  world: { name: 'World Solo Championship', icon: '🌎', size: 32, format: 'groups', reward: 2000, bo3: 1, desc: '32 quốc gia · 8 bảng · Vòng bảng → Vòng 16 đội → Tứ kết → Bán kết → Chung kết (3 ván thắng 2) → WORLD CHAMPION.' },
  legend: { name: 'Giải Huyền thoại', icon: '👑', size: 32, format: 'groups', reward: 3500, lv: [3, 3], bo3: 2, desc: '32 quốc gia, toàn AI Siêu khó · bán kết và chung kết đấu 3 ván thắng 2.' }
};
const NEUTRAL_NAMES = ['Zara', 'Leo', 'Nina', 'Max', 'Mia', 'Ethan', 'Ivy', 'Theo', 'Luna', 'Oscar', 'Nora', 'Jade', 'Rex', 'Ada', 'Finn', 'Cleo', 'Milo', 'Vera', 'Axel', 'Lia', 'Ezra', 'Isla', 'Jude', 'Sora', 'Dara', 'Remy', 'Tess', 'Odin', 'Yara', 'Kira', 'Zane', 'Rhea', 'Nico', 'Elio', 'Maya', 'Alma', 'Soren', 'Tala', 'Idris', 'Anya', 'Joss', 'Lena', 'Ugo', 'Vik', 'Wren', 'Xena', 'Yuri', 'Zeke', 'Bram', 'Cora', 'Dax', 'Esme', 'Flor', 'Gus', 'Hana', 'Ilan', 'Juno', 'Kofi', 'Lior', 'Mina'];
const MD_PAIRS = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];

/* Mô phỏng một trận 1-1 bằng chính engine + AI thật (không đụng ván người chơi).
   Trả về 0 / 1 là người thắng, -1 là hòa (chỉ xảy ra ở Blackjack/Xì Dách). */
function simulateH2H(gameId, lvA, lvB) {
  const saved = gameState, eng = GAME_ENGINES[gameId];
  let winner = -1;
  try {
    eng.setup({ players: 2 });
    gameState.players[0].level = lvA; gameState.players[1].level = lvB;
    eng.deal();
    if (eng.kind === 'bj') { // hai người cùng đấu nhà cái, ai được nhiều điểm hơn thì thắng
      let guard = 0;
      while (!gameState.over && guard++ < 400) {
        if (eng.isDealerTurn()) { eng.dealerStep(); continue; }
        const p = gameState.turn, lv = gameState.players[p].level;
        let mv = null; try { mv = eng.aiChoose(p, lv); } catch (e) { mv = null; }
        if (!mv || !eng.validateMove(p, mv).ok) { mv = eng.timeoutMove(p); if (!eng.validateMove(p, mv).ok) mv = eng.getValidMoves(p)[0]; }
        eng.play(p, mv); if (gameState.over) break; eng.nextTurn();
      }
      const r = gameState.over && gameState.over.results;
      winner = r ? (r[0].net > r[1].net ? 0 : r[0].net < r[1].net ? 1 : -1) : -1;
    } else {
      if (gameId === 'samLoc' && !gameState.over) {
        for (let i = 0; i < 2; i++) if (samAIWantsBao(gameState.hands[i], gameState.players[i].level)) { eng.declareBao(i); break; }
      }
      if (!gameState.over) gameState.phase = 'play';
      let guard = 0;
      while (!gameState.over && guard++ < 3000) {
        const p = gameState.turn, lv = gameState.players[p].level;
        if (eng.isStuck && eng.isStuck(p)) { eng.forceThoi(p); break; }
        let mv = null; try { mv = eng.aiChoose(p, lv); } catch (e) { mv = null; }
        if (!mv || !eng.validateMove(p, mv).ok) { mv = eng.timeoutMove(p); if (!eng.validateMove(p, mv).ok) mv = eng.getValidMoves(p)[0]; }
        eng.play(p, mv); if (gameState.over) break; eng.nextTurn();
      }
      winner = gameState.over ? gameState.over.winner : (Math.random() < 0.5 ? 0 : 1);
    }
  } catch (e) { winner = Math.random() < 0.5 ? 0 : 1; }
  gameState = saved;
  return winner;
}

const Tour = {
  H2H_GAMES: ['tienLen', 'tienLenMienNam', 'tienLenMienBac', 'samLoc', 'blackjack', 'xiDach'],
  dateKey() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  weekKey() { const d = new Date(); return 'W' + Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000 + 3) / 7); }, // tuần bắt đầu từ thứ Hai
  stageLabel(T) {
    if (T.phase === 'group') return 'Vòng bảng — Lượt ' + (T.md + 1) + '/3';
    if (T.phase === 'done') return T.champion === 0 ? 'Vô địch' : 'Đã kết thúc';
    const m = T.round.length;
    return m >= 16 ? 'Vòng 32 đội' : m === 8 ? 'Vòng 16 đội' : m === 4 ? 'Tứ kết' : m === 2 ? 'Bán kết' : 'Chung kết';
  },
  /* số ván của vòng hiện tại: 1 hoặc 3 (thắng 2) */
  boFor(T) { const def = TOURNAMENTS[T.id]; return def && def.bo3 && T.round.length <= Math.pow(2, def.bo3 - 1) ? 3 : 1; },
  build(defId, gameId, opt) {
    opt = opt || {};
    const def = TOURNAMENTS[defId], n = def.size;
    const seedKey = def.daily ? 'daily' + this.dateKey() + gameId : def.weekly ? 'weekly' + this.weekKey() + gameId : null;
    const rng = seedKey ? mulberry32(hashStr(seedKey)) : Math.random;
    const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; };
    const me = COUNTRY_BY_CODE[Data.profile.country] || COUNTRY_BY_CODE.VN;
    let codes;
    if (defId === 'national') codes = new Array(n - 1).fill(me.code);
    else {
      let pool;
      if (defId === 'regional') pool = (SUBREGIONS[opt.sub] || SUBREGIONS.sea).codes.slice();
      else if (defId === 'continental') pool = COUNTRIES.filter(c => c.region === (opt.region || 'AS')).map(c => c.code);
      else pool = COUNTRIES.map(c => c.code);
      pool = shuffle(pool.filter(c => c !== me.code && COUNTRY_BY_CODE[c]));
      codes = pool.slice(0, n - 1);
      if (codes.length < n - 1) {
        const extra = shuffle(COUNTRIES.map(c => c.code).filter(c => c !== me.code && !codes.includes(c)));
        codes = codes.concat(extra.slice(0, n - 1 - codes.length));
      }
    }
    const myN = norm(Data.profile.name);
    const names = shuffle(AI_ROSTER.filter(a => norm(a.name) !== myN));
    const neutral = shuffle(NEUTRAL_NAMES.filter(x => norm(x) !== myN && !names.some(a => a.name === x)));
    const take = code => { const i = names.findIndex(a => a.country === code); return i >= 0 ? names.splice(i, 1)[0] : { name: neutral.length ? neutral.pop() : names.pop().name, country: code }; };
    const avs = shuffle(AVATARS);
    const base = Data.settings.aiLevel === 4 ? 1 : Data.settings.aiLevel;
    const lvPick = [-1, 0, 0, 1];
    const players = [{ id: 0, name: Data.profile.name, avatar: Data.profile.avatar, country: me.name, code: me.code, flag: me.flag, level: -1, human: true }];
    codes.forEach((code, i) => {
      const c = COUNTRY_BY_CODE[code], a = take(code);
      const lv = def.lv ? clamp(def.lv[0] + Math.floor(rng() * (def.lv[1] - def.lv[0] + 1)), 0, 3) : clamp(base + lvPick[Math.floor(rng() * 4)], 0, 3);
      players.push({ id: i + 1, name: a.name, avatar: avs[i % avs.length], country: c.name, code: c.code, flag: c.flag, level: lv, human: false });
    });
    const T = {
      v: 2, id: defId, name: def.name, icon: def.icon, gameId, size: n, players, phase: def.format === 'groups' ? 'group' : 'ko',
      groups: null, md: 0, stats: {}, tie: {}, round: [], log: [], status: 'active', outLabel: '', champion: null, pending: null,
      note: defId === 'regional' ? SUBREGIONS[opt.sub || 'sea'].name : defId === 'continental' ? REGIONS[opt.region || 'AS'] : '', startedAt: Date.now()
    };
    players.forEach(p => { T.tie[p.id] = Math.floor(rng() * 1e6); T.stats[p.id] = { w: 0, d: 0, l: 0, pts: 0 }; });
    const ids = [0].concat(shuffle(players.slice(1).map(p => p.id)));
    if (T.phase === 'group') { T.groups = []; for (let i = 0; i < ids.length; i += 4) T.groups.push(ids.slice(i, i + 4)); }
    else { for (let i = 0; i < ids.length; i += 2) T.round.push({ a: ids[i], b: ids[i + 1], w: null, sa: 0, sb: 0 }); }
    return T;
  },
  start(defId, gameId, opt) {
    const def = TOURNAMENTS[defId];
    if (def.daily) Data.tourMeta.daily = this.dateKey();
    if (def.weekly) Data.tourMeta.weekly = this.weekKey();
    Data.tourMeta.game = gameId;
    const T = this.build(defId, gameId, opt);
    Data.tournament = T; Data.statistics.tournaments++; saveData();
    return T;
  },
  humanPair(T) {
    if (!T || T.status !== 'active') return null;
    if (T.phase === 'group') {
      for (const pr of MD_PAIRS[T.md]) { const a = T.groups[0][pr[0]], b = T.groups[0][pr[1]]; if (a === 0) return [0, b]; if (b === 0) return [0, a]; }
    } else if (T.phase === 'ko') {
      for (const m of T.round) if (m.w == null && (m.a === 0 || m.b === 0)) return [0, m.a === 0 ? m.b : m.a];
    }
    return null;
  },
  /* Người thắng một ván; -1 nếu hòa (chỉ khi allowDraw) */
  simWinner(T, a, b, allowDraw) {
    for (let i = 0; i < 8; i++) {
      const w = simulateH2H(T.gameId, T.players[a].level, T.players[b].level);
      if (w >= 0) return w === 0 ? a : b;
      if (allowDraw) return -1;
    }
    return Math.random() < 0.5 ? a : b;
  },
  /* Mô phỏng cả trận loại trực tiếp (có thể 3 ván thắng 2) */
  simMatch(T, m) {
    const need = Math.ceil(this.boFor(T) / 2); let sa = 0, sb = 0, g = 0;
    while (sa < need && sb < need && g++ < 12) { if (this.simWinner(T, m.a, m.b) === m.a) sa++; else sb++; }
    m.sa = sa; m.sb = sb; m.w = sa >= need ? m.a : m.b;
    this.logPush(T, m.a, m.b, m.w);
  },
  logPush(T, a, b, w) { T.log.push({ s: this.stageLabel(T), a, b, w }); if (T.log.length > 90) T.log.shift(); },
  applyGroup(T, a, b, w) { const l = w === a ? b : a; T.stats[w].w++; T.stats[w].pts += 3; T.stats[l].l++; this.logPush(T, a, b, w); },
  applyDraw(T, a, b) { T.stats[a].d++; T.stats[b].d++; T.stats[a].pts++; T.stats[b].pts++; this.logPush(T, a, b, -1); },
  rankGroup(T, g) {
    return T.groups[g].slice().sort((x, y) => { const A = T.stats[x], B = T.stats[y]; return B.pts - A.pts || B.w - A.w || T.tie[y] - T.tie[x]; });
  },
  buildKo(T) {
    const G = T.groups.length, win = [], run = [];
    for (let g = 0; g < G; g++) { const r = this.rankGroup(T, g); win.push(r[0]); run.push(r[1]); }
    const round = [];
    for (let g = 0; g < G; g += 2) round.push({ a: win[g], b: run[g + 1], w: null, sa: 0, sb: 0 });
    for (let g = 0; g < G; g += 2) round.push({ a: win[g + 1], b: run[g], w: null, sa: 0, sb: 0 });
    T.round = round; T.phase = 'ko';
  },
  nextRound(T) {
    const w = T.round.map(m => m.w), r = [];
    for (let i = 0; i < w.length; i += 2) r.push({ a: w[i], b: w[i + 1], w: null, sa: 0, sb: 0 });
    return r;
  },
  simulateToEnd(T) {
    let guard = 0;
    while (guard++ < 10) {
      T.round.forEach(m => { if (m.w == null) this.simMatch(T, m); });
      if (T.round.length === 1) { T.champion = T.round[0].w; T.phase = 'done'; return; }
      T.round = this.nextRound(T);
    }
  },
  /* Gọi khi một ván của người chơi kết thúc. outcome: 'win' | 'lose' | 'draw' (hoặc true/false). Trả về dòng thông báo. */
  report(outcome) {
    if (outcome === true) outcome = 'win'; else if (outcome === false) outcome = 'lose';
    const T = Data.tournament;
    if (!T || T.status !== 'active') return '';
    const pr = this.humanPair(T);
    T.pending = null;
    if (!pr) return '';
    const opp = pr[1];
    let note = '';
    if (T.phase === 'group') {
      if (outcome === 'draw') this.applyDraw(T, 0, opp); else this.applyGroup(T, 0, opp, outcome === 'win' ? 0 : opp);
      T.groups.forEach(grp => {
        MD_PAIRS[T.md].forEach(p => {
          const a = grp[p[0]], b = grp[p[1]]; if (a === 0 || b === 0) return;
          const w = this.simWinner(T, a, b, true);
          if (w < 0) this.applyDraw(T, a, b); else this.applyGroup(T, a, b, w);
        });
      });
      T.md++;
      const rs = outcome === 'win' ? 'Thắng' : outcome === 'draw' ? 'Hòa' : 'Thua';
      if (T.md < 3) note = rs + ' — chuẩn bị lượt ' + (T.md + 1) + '/3';
      else {
        this.buildKo(T);
        if (!T.round.some(m => m.a === 0 || m.b === 0)) {
          T.status = 'out'; T.outLabel = 'Vòng bảng'; this.simulateToEnd(T); note = 'Bị loại ở vòng bảng';
        } else note = 'Vào vòng loại trực tiếp: ' + this.stageLabel(T);
      }
    } else {
      const mine = T.round.find(m => m.w == null && (m.a === 0 || m.b === 0));
      if (outcome === 'draw') return 'Hòa — đánh lại ván quyết định';
      const bo = this.boFor(T), need = Math.ceil(bo / 2), meA = mine.a === 0;
      if (outcome === 'win') { if (meA) mine.sa = (mine.sa || 0) + 1; else mine.sb = (mine.sb || 0) + 1; }
      else { if (meA) mine.sb = (mine.sb || 0) + 1; else mine.sa = (mine.sa || 0) + 1; }
      const my = meA ? mine.sa : mine.sb, op = meA ? mine.sb : mine.sa;
      if (my < need && op < need) { saveData(); return 'Tỷ số ' + my + '-' + op + ' — ván tiếp theo (thắng ' + need + ' ván)'; }
      const win = my >= need, w = win ? 0 : opp;
      mine.w = w; this.logPush(T, mine.a, mine.b, w);
      T.round.forEach(m => { if (m.w == null) this.simMatch(T, m); });
      if (!win) { const lbl = this.stageLabel(T); T.status = 'out'; T.outLabel = lbl; this.simulateToEnd(T); note = 'Bị loại ở ' + lbl; }
      else if (T.round.length === 1) { T.champion = 0; T.phase = 'done'; T.status = 'champion'; note = '🏆 VÔ ĐỊCH!'; }
      else { T.round = this.nextRound(T); note = 'Thắng — vào ' + this.stageLabel(T); }
    }
    if (T.status !== 'active') this.finishTour(T);
    saveData();
    return note;
  },
  finishTour(T) {
    if (T.finished) return;
    T.finished = true;
    const def = TOURNAMENTS[T.id], win = T.champion === 0;
    if (win) { T.status = 'champion'; Data.statistics.championships++; Data.tourMeta.trophies.unshift({ name: T.name, icon: T.icon, game: T.gameId, date: this.dateKey() }); if (Data.tourMeta.trophies.length > 40) Data.tourMeta.trophies.length = 40; }
    const reward = win ? def.reward : Math.round(def.reward * 0.12);
    T.reward = reward; addXP(reward, 3000);
    Data.tourMeta.history.unshift({ name: T.name, game: T.gameId, result: win ? 'Vô địch 🏆' : 'Bị loại: ' + T.outLabel, date: this.dateKey() });
    if (Data.tourMeta.history.length > 8) Data.tourMeta.history.length = 8;
    const sp = []; if (win) { sp.push('champion'); if (T.id === 'world') sp.push('worldChampion'); if (T.id === 'legend') sp.push('legendChampion'); }
    T.ach = checkAchievements(sp).map(a => a.name);
  },
  abandon() {
    const T = Data.tournament; if (!T) return;
    if (T.status === 'active') { Data.tourMeta.history.unshift({ name: T.name, game: T.gameId, result: 'Bỏ giải', date: this.dateKey() }); if (Data.tourMeta.history.length > 8) Data.tourMeta.history.length = 8; }
    Data.tournament = null; saveData();
  }
};

/* ============================ 9c. TÍNH NĂNG MỞ RỘNG ============================ */
/* ---------- Danh hiệu theo level ---------- */
const TITLES = [[1, 'Tân binh'], [5, 'Học việc'], [10, 'Tay chơi'], [20, 'Cao thủ'], [35, 'Đại cao thủ'], [50, 'Bậc thầy'], [75, 'Huyền thoại'], [100, 'CARD MASTER']];
function titleFor(level) { let t = TITLES[0][1]; TITLES.forEach(x => { if (level >= x[0]) t = x[1]; }); return t; }

/* ---------- Giao diện mở khoá theo level (mặt sau lá bài, màu bàn) ---------- */
const CARD_BACKS = [
  { id: 'classic', name: 'Cổ điển', lv: 1, c: ['#1b3a8a', '#7fb0ff', '#142a66'], p: 'dia' },
  { id: 'ruby', name: 'Hồng ngọc', lv: 3, c: ['#8a1b2b', '#ff9aa8', '#5c0f1b'], p: 'dots' },
  { id: 'emerald', name: 'Lục bảo', lv: 6, c: ['#0f6b4a', '#7dffc0', '#07402c'], p: 'stripe' },
  { id: 'gold', name: 'Hoàng kim', lv: 10, c: ['#a8802a', '#ffe28a', '#6b4e12'], p: 'dia' },
  { id: 'night', name: 'Dạ quang', lv: 15, c: ['#1a1a2e', '#a78bfa', '#0b0b18'], p: 'star' },
  { id: 'royal', name: 'Hoàng gia', lv: 25, c: ['#4c1d95', '#f5c542', '#2e1065'], p: 'dots' }
];
const TABLES = [
  { id: 'green', name: 'Nỉ xanh lá', lv: 1, c: ['#0d5a40', '#083b2a'] },
  { id: 'blue', name: 'Nỉ xanh dương', lv: 2, c: ['#1b4f8f', '#0c2b52'] },
  { id: 'red', name: 'Nỉ đỏ rượu', lv: 5, c: ['#8f1d2c', '#4f0d17'] },
  { id: 'purple', name: 'Nỉ tím', lv: 8, c: ['#5b2a91', '#2f1450'] },
  { id: 'black', name: 'Nỉ đen', lv: 12, c: ['#2b2f36', '#0f1114'] },
  { id: 'gold', name: 'Nỉ vàng đồng', lv: 20, c: ['#8a6a1d', '#4a360c'] }
];
function itemUnlocked(it) { return Data.level >= it.lv; }
function currentCardBack() { const it = CARD_BACKS.find(x => x.id === Data.settings.cardBack); return it && itemUnlocked(it) ? it : CARD_BACKS[0]; }
function currentTable() { const it = TABLES.find(x => x.id === Data.settings.table); return it && itemUnlocked(it) ? it : TABLES[0]; }
const CARD_BACK_CACHE = {};
function cardBackUri(it) {
  if (!CARD_BACK_CACHE[it.id]) {
    const a = it.c[0], b = it.c[1], c = it.c[2];
    const pat = it.p === 'stripe' ? '<path d="M-1 11L11 -1" stroke="' + b + '" stroke-width="1.2" opacity=".55"/>'
      : it.p === 'dots' ? '<circle cx="5" cy="5" r="1.7" fill="' + b + '" opacity=".6"/>'
      : it.p === 'star' ? '<path d="M5 1V9M1 5H9" stroke="' + b + '" stroke-width="1" opacity=".6"/>'
      : '<path d="M0 5L5 0L10 5L5 10Z" fill="none" stroke="' + b + '" stroke-width=".8" opacity=".55"/>';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140"><defs><pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse">' + pat + '</pattern></defs>' +
      '<rect x="1" y="1" width="98" height="138" rx="9" fill="' + a + '" stroke="#fffdf8" stroke-width="3"/>' +
      '<rect x="8" y="8" width="84" height="124" rx="5" fill="url(#p)" stroke="' + b + '" stroke-width="1.5"/>' +
      '<circle cx="50" cy="70" r="17" fill="' + c + '" stroke="' + b + '" stroke-width="1.5"/>' +
      '<text x="50" y="79" font-size="24" text-anchor="middle" fill="#fffdf8" font-family="Georgia,serif">♠</text></svg>';
    CARD_BACK_CACHE[it.id] = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  return CARD_BACK_CACHE[it.id];
}

/* ---------- Lịch sử ván ---------- */
function pushHistory(e) { Data.history.unshift(e); if (Data.history.length > 30) Data.history.length = 30; }

/* ---------- Nhiệm vụ hàng ngày ---------- */
const MISSION_POOL = [
  { id: 'play3', name: 'Chơi 3 ván', goal: 3, xp: 60, ev: 'play' },
  { id: 'play5', name: 'Chơi 5 ván', goal: 5, xp: 100, ev: 'play' },
  { id: 'win2', name: 'Thắng 2 ván', goal: 2, xp: 80, ev: 'win' },
  { id: 'win3', name: 'Thắng 3 ván', goal: 3, xp: 130, ev: 'win' },
  { id: 'chat1', name: 'Chặt bài 1 lần', goal: 1, xp: 70, ev: 'chat' },
  { id: 'chat3', name: 'Chặt bài 3 lần', goal: 3, xp: 120, ev: 'chat' },
  { id: 'sam2', name: 'Chơi 2 ván Sâm Lốc', goal: 2, xp: 70, ev: 'play:samLoc' },
  { id: 'tl1', name: 'Thắng 1 ván Tiến Lên (bất kỳ bản)', goal: 1, xp: 80, ev: 'win:tl' },
  { id: 'bj3', name: 'Chơi 3 ván Blackjack / Xì Dách', goal: 3, xp: 70, ev: 'play:bj' },
  { id: 'tour1', name: 'Thắng 1 ván trong giải đấu', goal: 1, xp: 100, ev: 'win:tour' },
  { id: 'hard1', name: 'Thắng 1 ván có AI Siêu khó', goal: 1, xp: 150, ev: 'win:hard' },
  { id: 'room1', name: 'Chơi 1 ván trong Phòng', goal: 1, xp: 60, ev: 'play:room' }
];
const Missions = {
  ALL_BONUS: 100,
  ensure() {
    const t = Tour.dateKey();
    if (Data.missions.date === t && Array.isArray(Data.missions.list) && Data.missions.list.length === 3) return;
    const rng = mulberry32(hashStr('mission' + t));
    const pool = MISSION_POOL.slice(), pickd = [], evs = new Set();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const x = pool[i]; pool[i] = pool[j]; pool[j] = x; }
    pool.forEach(m => { if (pickd.length < 3 && !evs.has(m.ev)) { pickd.push(m); evs.add(m.ev); } });
    Data.missions = { date: t, list: pickd.map(m => ({ id: m.id, prog: 0, claimed: false })), bonus: false };
    saveData();
  },
  def(id) { return MISSION_POOL.find(m => m.id === id); },
  event(ev) {
    this.ensure(); let changed = false;
    Data.missions.list.forEach(m => { const d = this.def(m.id); if (d && d.ev === ev && m.prog < d.goal) { m.prog++; changed = true; } });
    if (changed) saveData();
  },
  onMatch(gameId, outcome, f) {
    this.event('play'); this.event('play:' + gameId);
    if (gameId === 'blackjack' || gameId === 'xiDach') this.event('play:bj');
    if (f.room) this.event('play:room');
    if (outcome === 'win') {
      this.event('win'); if (gameId.indexOf('tienLen') === 0) this.event('win:tl');
      if (f.tour) this.event('win:tour'); if (f.hard) this.event('win:hard');
    }
  },
  claim(i) {
    this.ensure(); const m = Data.missions.list[i]; if (!m) return 0;
    const d = this.def(m.id); if (!d || m.claimed || m.prog < d.goal) return 0;
    m.claimed = true; addXP(d.xp); saveData(); return d.xp;
  },
  canClaimBonus() { return !Data.missions.bonus && Data.missions.list.length === 3 && Data.missions.list.every(m => m.claimed); },
  claimBonus() { if (!this.canClaimBonus()) return 0; Data.missions.bonus = true; addXP(this.ALL_BONUS); saveData(); return this.ALL_BONUS; },
  readyCount() { this.ensure(); return Data.missions.list.filter(m => { const d = this.def(m.id); return d && !m.claimed && m.prog >= d.goal; }).length; }
};

/* ---------- Quà đăng nhập hàng ngày + chuỗi ngày ---------- */
const Daily = {
  yesterday() { const d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  /* cập nhật chuỗi ngày; trả về true nếu hôm nay chưa nhận quà */
  check() {
    const t = Tour.dateKey(), d = Data.daily;
    if (d.last !== t) { d.streak = d.last === this.yesterday() ? d.streak + 1 : 1; d.last = t; saveData(); }
    return d.claimed !== t;
  },
  reward() { return 40 + 20 * Math.min(Math.max(Data.daily.streak, 1), 7); },
  claim() { const t = Tour.dateKey(); if (Data.daily.claimed === t) return 0; Data.daily.claimed = t; const r = this.reward(); addXP(r); saveData(); return r; }
};

/* ---------- Bảng xếp hạng (mô phỏng offline, đổi theo tuần) ---------- */
const Leaderboard = {
  total(level, xp) { let t = xp; for (let i = 1; i < level; i++) t += xpNeed(i); return t; },
  levelOf(total) { let l = 1, left = total; while (l < 100 && left >= xpNeed(l)) { left -= xpNeed(l); l++; } return l; },
  build() {
    const rng = mulberry32(hashStr('lb' + Tour.weekKey())), out = [];
    const myCode = Data.profile.country, myN = norm(Data.profile.name);
    const used = new Set();
    const add = (name, code) => {
      if (used.has(norm(name)) || norm(name) === myN) return; used.add(norm(name));
      const c = COUNTRY_BY_CODE[code] || COUNTRY_BY_CODE.VN;
      const score = Math.floor(Math.pow(rng(), 2.4) * 180000) + 300;
      out.push({ name, code: c.code, flag: c.flag, country: c.name, score, avatar: AVATARS[Math.floor(rng() * AVATARS.length)] });
    };
    AI_ROSTER.forEach(a => add(a.name, a.country));
    NEUTRAL_NAMES.forEach(n => { const cs = COUNTRIES[Math.floor(rng() * COUNTRIES.length)]; add(n, cs.code); });
    NEUTRAL_NAMES.slice(0, 14).forEach((n, i) => add(n + ' ' + String.fromCharCode(65 + i) + '.', myCode)); // thêm vài người cùng quốc gia cho bảng quốc gia
    out.forEach(e => { e.level = this.levelOf(e.score); });
    out.sort((a, b) => b.score - a.score);
    return out;
  },
  /* hạng của bạn (1 = cao nhất) trong danh sách đã lọc */
  rankOf(list, myScore) { let r = 1; list.forEach(e => { if (e.score > myScore) r++; }); return r; }
};

/* ---------- PHÒNG: 32 phòng × 64 bàn = 2048 bàn (sinh theo hạt giống, không dựng 2048 DOM) ---------- */
const Rooms = {
  TOTAL: 32, TABLES: 64, PAGE: 12,
  TIERS: ['Tân thủ', 'Phổ thông', 'Cao thủ', 'Đại cao thủ'],
  STATUS: { waiting: 'Đang chờ', playing: 'Đang chơi', full: 'Đầy', finished: 'Kết thúc' },
  tier(room) { return Math.floor((room - 1) / 8); },
  roomName(room) { return 'Phòng ' + room + ' — ' + this.TIERS[this.tier(room)]; },
  info(room, table) {
    const rng = mulberry32(hashStr('r' + room + 't' + table + 'e' + Data.rooms.epoch));
    const game = ROOM_GAMES[Math.floor(rng() * ROOM_GAMES.length)], m = GAME_META[game];
    const max = m.minP + Math.floor(rng() * (m.maxP - m.minP + 1));
    const r = rng(); let status, occ;
    if (r < 0.5) { status = 'waiting'; occ = Math.floor(rng() * max); }
    else if (r < 0.78) { status = 'playing'; occ = max; }
    else if (r < 0.9) { status = 'full'; occ = max; }
    else { status = 'finished'; occ = max; }
    return { room, table, game, max, occ, status, level: this.tier(room) };
  },
  occupants(inf) {
    const rng = mulberry32(hashStr('o' + inf.room + 't' + inf.table + 'e' + Data.rooms.epoch));
    const myN = norm(Data.profile.name);
    const pool = AI_ROSTER.filter(a => norm(a.name) !== myN), used = new Set(), out = [];
    while (out.length < inf.occ && used.size < pool.length) {
      const i = Math.floor(rng() * pool.length); if (used.has(i)) continue; used.add(i);
      const a = pool[i], c = COUNTRY_BY_CODE[a.country] || COUNTRY_BY_CODE.VN;
      out.push({ name: a.name, avatar: AVATARS[Math.floor(rng() * AVATARS.length)], country: c.name, code: c.code, flag: c.flag, difficulty: inf.level });
    }
    return out;
  },
  /* Danh sách đối thủ khi vào bàn: người đang ngồi + AI bổ sung cho đủ chỗ */
  opponentsFor(inf) {
    const occ = this.occupants(inf);
    const need = inf.max - 1 - occ.length;
    return need > 0 ? occ.concat(pickOpponents(need, inf.level, occ.map(o => o.name))) : occ.slice(0, inf.max - 1);
  },
  filtered(room, f) {
    const out = [], tq = norm(f.tq || '');
    for (let t = 1; t <= this.TABLES; t++) {
      const inf = this.info(room, t);
      if (f.game && inf.game !== f.game) continue;
      if (f.status && inf.status !== f.status) continue;
      if (tq && !(String(t) === tq || norm(GAME_META[inf.game].name).includes(tq) || String(t).includes(tq))) continue;
      out.push(inf);
    }
    return out;
  },
  findRooms(q) {
    q = norm(q); const out = [];
    for (let r = 1; r <= this.TOTAL; r++) if (!q || String(r) === q || norm(this.roomName(r)).includes(q)) out.push(r);
    return out;
  }
};

/* ============================ 10. GIAO DIỆN ============================ */
function handleError(err) {
  try { console.error(err); } catch (e) { }
  if (!IN_BROWSER) return;
  const now = Date.now();
  if (handleError.last && now - handleError.last < 3000) return;
  handleError.last = now;
  try {
    showToast('⚠️ Đã xảy ra lỗi', 'error');
    Modal.open({
      title: '⚠️ Đã xảy ra lỗi', body: 'Game gặp sự cố nhỏ. Tiến trình ván chơi được giữ lại nếu có thể.',
      buttons: [
        { text: 'THỬ LẠI', cls: 'primary', fn: () => { if (Match.running) Match.advance(); } },
        { text: 'VỀ MENU', fn: () => { Match.abort(true); navigateTo('home', { force: true }); } }
      ]
    });
  } catch (e) { /* tránh lỗi lồng nhau */ }
}

function canAnimate() {
  if (!Data.settings.animation || Data.settings.reducedMotion) return false;
  try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false; } catch (e) { }
  return true;
}
function rectCenter(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }
function flyEl(el, from, opts) {
  if (!canAnimate() || !el || !el.animate || !from) return;
  const to = rectCenter(el);
  const dx = from.x - to.x, dy = from.y - to.y;
  try {
    el.animate([
      { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (opts.rot || -18) + 'deg) scale(' + (opts.scale || 0.5) + ')', opacity: 0 },
      { transform: 'none', opacity: 1 }
    ], { duration: opts.dur || 360, delay: opts.delay || 0, easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'backwards' });
  } catch (e) { }
}
function flipEl(el, newSrc) {
  const img = $('img', el);
  if (!canAnimate() || !el.animate) { if (img) img.src = newSrc; el.classList.remove('back'); return; }
  try {
    const a = el.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 160, easing: 'ease-in' });
    a.onfinish = () => {
      if (img) img.src = newSrc; el.classList.remove('back');
      el.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 160, easing: 'ease-out' });
    };
  } catch (e) { if (img) img.src = newSrc; }
}
function confetti() {
  if (!Data.settings.effects || !canAnimate()) return;
  const root = $('#fx-root'); if (!root) return;
  const colors = ['#f5c542', '#ff5a6e', '#4ade80', '#60a5fa', '#e879f9', '#fff'];
  for (let i = 0; i < 36; i++) {
    const p = h('i', 'confetti'); p.style.left = (Math.random() * 100) + '%'; p.style.background = colors[i % colors.length];
    root.appendChild(p);
    const dx = (Math.random() - 0.5) * 220, dur = 1500 + Math.random() * 1400;
    try {
      const a = p.animate([{ transform: 'translate(0,-20px) rotate(0)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + (window.innerHeight + 40) + 'px) rotate(' + (Math.random() * 720) + 'deg)', opacity: 0.9 }],
        { duration: dur, delay: Math.random() * 300, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'forwards' });
      a.onfinish = () => p.remove();
    } catch (e) { p.remove(); }
  }
  setTimeout(() => { $$('.confetti', root).forEach(e => e.remove()); }, 3600);
}


/* ---------- Hiệu ứng: banner, rung bàn, chớp màn hình, tới lượt, lên level ---------- */
function showBanner(text, cls, ms, sub) {
  const root = $('#fx-root'); if (!root || !Data.settings.effects) return;
  ms = ms || 1300;
  const b = h('div', 'fx-banner ' + (cls || '')); b.appendChild(h('div', 'fx-main', text));
  if (sub) b.appendChild(h('div', 'fx-sub', sub));
  b.style.setProperty('--d', ms + 'ms'); if (!canAnimate()) b.classList.add('static');
  root.appendChild(b); setTimeout(() => b.remove(), ms);
}
function shakeEl(el) {
  if (!el || !Data.settings.effects || !canAnimate()) return;
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 450);
}
function flashScreen(color) {
  const root = $('#fx-root'); if (!root || !Data.settings.effects || !canAnimate()) return;
  const f = h('div', 'fx-flash'); f.style.background = color; root.appendChild(f); setTimeout(() => f.remove(), 480);
}
/* Chặt (đặc biệt chặt 2): âm thanh + chữ lớn + rung bàn + chớp đỏ */
function chatEffect(prev, cur, p) {
  const two = prev.rank === 12;
  const kind = cur.type === 'quad' ? 'Tứ quý' : cur.type === 'dthong' ? 'Đôi thông' : '';
  SFX.play('chat'); vibrate([40, 30, 70]);
  showBanner(two ? 'CHẶT 2!' : 'CHẶT!', 'chat', 1400, gameState.players[p].name + (kind ? ' · ' + kind : ''));
  shakeEl($('#table')); flashScreen('rgba(217,67,90,.4)');
}
/* Tới lượt của bạn: chuông nhẹ + viền sáng quanh tay bài */
function turnEffect() {
  SFX.play('turn'); vibrate(25);
  if (!Data.settings.effects || !canAnimate()) return;
  const w = $('#hand-wrap'); if (w) { w.classList.remove('my-turn'); void w.offsetWidth; w.classList.add('my-turn'); setTimeout(() => w.classList.remove('my-turn'), 1300); }
  const l = $('#turn-label'); if (l) { l.classList.remove('ping'); void l.offsetWidth; l.classList.add('ping'); setTimeout(() => l.classList.remove('ping'), 900); }
}
function levelUpFx(lv) {
  SFX.play('levelup');
  const root = $('#fx-root'); if (!root) return;
  if (Data.settings.effects) {
    const d = h('div', 'levelup'); if (!canAnimate()) d.classList.add('static');
    d.appendChild(h('div', 'lu-ring')); d.appendChild(h('div', 'lu-title', 'LEVEL UP!')); d.appendChild(h('div', 'lu-num', 'Lv.' + lv));
    root.appendChild(d); setTimeout(() => d.remove(), 2800); confetti();
  } else showToast('🎉 Lên Level ' + lv + '!', 'success', { silent: true });
}

/* ---------- Toast ---------- */
function showToast(msg, type, opts) {
  const root = $('#toast-root'); if (!root) return;
  if (!(opts && opts.silent)) SFX.play({ success: 'success', warning: 'warn', error: 'error' }[type] || 'notification');
  while (root.children.length >= 3) root.removeChild(root.firstChild);
  const t = h('div', 'toast ' + (type || 'info'), msg);
  t.setAttribute('role', 'status');
  root.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 250); }, 2300);
}

/* ---------- Modal ---------- */
const Modal = {
  stack: [],
  open(o) {
    const back = h('div', 'modal-backdrop');
    const box = h('div', 'modal'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    const head = h('div', 'modal-head');
    head.appendChild(h('h2', '', o.title || ''));
    const x = h('button', 'icon-btn', '✕'); x.setAttribute('aria-label', 'Đóng'); x.type = 'button';
    if (o.closable !== false) head.appendChild(x);
    const body = h('div', 'modal-body');
    if (typeof o.body === 'string') body.textContent = o.body; else if (o.body) body.appendChild(o.body);
    box.appendChild(head); box.appendChild(body);
    const m = { back, box, o };
    if (o.buttons && o.buttons.length) {
      const foot = h('div', 'modal-foot');
      o.buttons.forEach(b => {
        const btn = h('button', 'btn ' + (b.cls || ''), b.text); btn.type = 'button';
        btn.addEventListener('click', () => { SFX.play('click'); if (b.keep) { if (b.fn) b.fn(m); } else { Modal.close(m); if (b.fn) b.fn(m); } });
        foot.appendChild(btn);
      });
      box.appendChild(foot);
    }
    x.addEventListener('click', () => Modal.close(m));
    back.addEventListener('click', e => { if (e.target === back && o.closable !== false) Modal.close(m); });
    back.appendChild(box); $('#modal-root').appendChild(back);
    this.stack.push(m);
    if (Match.running) TurnTimer.pauseTimer();
    const first = $('.btn', box) || x; try { first.focus(); } catch (e) { }
    return m;
  },
  close(m) {
    m = m || this.stack[this.stack.length - 1]; if (!m) return;
    const i = this.stack.indexOf(m); if (i < 0) return;
    this.stack.splice(i, 1); m.back.remove();
    if (m.o.onClose) { try { m.o.onClose(); } catch (e) { handleError(e); } }
    if (!this.stack.length && Match.running) TurnTimer.resumeTimer();
  },
  closeAll() { while (this.stack.length) this.close(); }
};

/* ---------- Icon game (SVG nhúng) ---------- */
function miniCard(cx, cy, rot, txt, red, big) {
  const w = big ? 26 : 22, hh = big ? 36 : 30;
  return '<g transform="translate(' + cx + ' ' + cy + ') rotate(' + rot + ')"><rect x="' + (-w / 2) + '" y="' + (-hh / 2) + '" width="' + w + '" height="' + hh + '" rx="3" fill="#fffdf8" stroke="#8a8f99"/>' +
    '<text x="0" y="5" font-size="' + (big ? 15 : 13) + '" text-anchor="middle" font-weight="700" fill="' + (red ? '#c4192d' : '#15171c') + '" font-family="Georgia,serif">' + txt + '</text></g>';
}
let _iconSeq = 0;
function gameIcon(kind) {
  const gid = 'gi' + (++_iconSeq);
  const bg = '<rect width="64" height="64" rx="14" fill="url(#' + gid + ')"/>';
  const defs = '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14684b"/><stop offset="1" stop-color="#0a3a2a"/></linearGradient></defs>';
  let b = '';
  switch (kind) {
    case 'fan': b = miniCard(18, 36, -24, 'A♠') + miniCard(32, 33, -8, 'K♥', 1) + miniCard(46, 36, 12, '2♦', 1); break;
    case 'fan2': b = miniCard(16, 36, -28, '3♠') + miniCard(26, 33, -12, '4♥', 1) + miniCard(38, 33, 6, '5♣') + miniCard(48, 37, 22, '6♦', 1); break;
    case 'fan3': b = miniCard(20, 35, -20, '2♠') + miniCard(32, 32, 0, '2♥', 1) + miniCard(44, 35, 20, '2♦', 1); break;
    case 'ten': b = miniCard(14, 38, -30, '3♠') + miniCard(22, 33, -18, '5♥', 1) + miniCard(32, 31, -4, '10♣') + miniCard(42, 33, 12, 'Q♦', 1) + miniCard(50, 38, 26, 'A♠'); break;
    case 'bj': b = miniCard(24, 34, -10, 'A♠', 0, 1) + miniCard(40, 34, 10, 'K♥', 1, 1); break;
    case 'bj2': b = miniCard(24, 34, -10, 'A♥', 1, 1) + miniCard(40, 34, 10, 'J♠', 0, 1); break;
    case 'three': case 'three2': b = miniCard(20, 35, -14, 'Q♠') + miniCard(32, 33, 0, 'Q♥', 1) + miniCard(44, 35, 14, 'Q♦', 1); break;
    case 'phom': b = miniCard(18, 34, -10, '5♠') + miniCard(30, 34, 0, '5♥', 1) + miniCard(42, 34, 10, '5♦', 1) + '<circle cx="50" cy="16" r="5" fill="#f5c542"/>'; break;
    case 'mb': b = miniCard(14, 38, -24, 'A♠') + miniCard(24, 33, -10, 'K♥', 1) + miniCard(34, 31, 0, 'Q♣') + miniCard(44, 33, 10, 'J♦', 1) + miniCard(52, 38, 24, '10♠'); break;
    case 'chips': b = '<circle cx="22" cy="40" r="11" fill="#c4192d" stroke="#fff" stroke-width="3" stroke-dasharray="5 4"/><circle cx="40" cy="42" r="11" fill="#1d4ed8" stroke="#fff" stroke-width="3" stroke-dasharray="5 4"/>' + miniCard(34, 22, 8, 'A♠'); break;
    case 'hc': b = miniCard(32, 34, 0, 'A♠', 0, 1); break;
    case 'rummy': b = miniCard(20, 34, -12, '7♥', 1) + miniCard(32, 34, 0, '8♥', 1) + miniCard(44, 34, 12, '9♥', 1); break;
    case 'sol': b = miniCard(16, 24, 0, 'K♠') + miniCard(30, 32, 0, 'Q♥', 1) + miniCard(44, 40, 0, 'J♣'); break;
    case 'fc': b = '<rect x="6" y="10" width="11" height="15" rx="2" fill="none" stroke="#f5c542"/><rect x="19" y="10" width="11" height="15" rx="2" fill="none" stroke="#f5c542"/><rect x="34" y="10" width="11" height="15" rx="2" fill="none" stroke="#f5c542"/><rect x="47" y="10" width="11" height="15" rx="2" fill="none" stroke="#f5c542"/>' + miniCard(32, 44, 0, 'A♦', 1); break;
    case 'spider': b = '<text x="32" y="30" font-size="26" text-anchor="middle">🕷️</text>' + miniCard(32, 46, 0, 'K♠'); break;
    default: b = miniCard(32, 34, 0, '♠');
  }
  return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + defs + bg + b + '</svg>';
}
function appLogoSvg(uid) {
  uid = uid || 'lg';
  return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14684b"/><stop offset="1" stop-color="#062a1e"/></linearGradient></defs>' +
    '<rect width="120" height="120" rx="26" fill="url(#' + uid + ')"/><g transform="rotate(-12 60 62)"><rect x="32" y="22" width="50" height="72" rx="7" fill="#fffdf8" stroke="#c9a24a" stroke-width="3"/>' +
    '<text x="39" y="42" font-size="17" font-weight="700" font-family="Georgia,serif" fill="#15171c">A</text><text x="57" y="78" font-size="38" text-anchor="middle" fill="#15171c">♠</text></g>' +
    '<circle cx="86" cy="86" r="17" fill="#c9a24a"/><text x="86" y="93" font-size="20" text-anchor="middle" font-weight="700" font-family="Georgia,serif" fill="#062a1e">CM</text></svg>';
}

/* ---------- Nút bài DOM ---------- */
function createCardElement(card, opts) {
  opts = opts || {};
  const e = document.createElement(opts.tag || 'div');
  e.className = 'card' + (opts.faceDown ? ' back' : '');
  const img = document.createElement('img'); img.draggable = false;
  img.alt = opts.faceDown ? 'Lá bài úp' : cardLabel(card);
  img.src = opts.faceDown ? getCardBack() : getCardImage(card);
  e.appendChild(img);
  if (card && !opts.faceDown) e.dataset.id = card.id;
  if (opts.tag === 'button') { e.type = 'button'; e.setAttribute('aria-label', opts.faceDown ? 'Lá bài úp' : cardLabel(card)); }
  return e;
}

/* ---------- Điều hướng ---------- */
const SCREENS = ['home', 'games', 'play', 'solo', 'tournament', 'rooms', 'missions', 'leaderboard', 'themes', 'history', 'profile', 'stats', 'achievements', 'settings', 'guide'];
const SCREEN_TITLES = { home: 'CARD MASTER', games: 'Chơi game', play: '', solo: '', tournament: 'Giải đấu', rooms: 'Phòng chơi', missions: 'Nhiệm vụ', leaderboard: 'Xếp hạng', themes: 'Giao diện', history: 'Lịch sử ván', profile: 'Hồ sơ', stats: 'Thống kê', achievements: 'Thành tích', settings: 'Cài đặt', guide: 'Hướng dẫn' };
const UI = {
  screen: 'home', stack: [], selected: new Set(), lock: false, seats: {}, lastTableKey: '', handKey: '',
  updateTimer(secs, frac) {
    const num = $('#timer-num'), bar = $('#timer-bar'), pill = $('#timer-pill'); if (!num) return;
    if (secs == null) { num.textContent = '—'; bar.style.transform = 'scaleX(0)'; pill.classList.remove('warn'); return; }
    num.textContent = secs; bar.style.transform = 'scaleX(' + clamp(frac, 0, 1) + ')';
    pill.classList.toggle('warn', secs <= 5);
  }
};
const RENDERERS = {};
function navigateTo(name, opts) {
  opts = opts || {};
  if (!SCREENS.includes(name)) name = 'home';
  if (UI.screen === 'play' && name !== 'play' && Match.running && !opts.force) { confirmExit(name); return; }
  if (UI.screen === 'solo' && name !== 'solo' && Solo.running && !opts.force) { confirmExitSolo(name); return; }
  if (!opts.back && UI.screen !== name && !opts.noStack) UI.stack.push(UI.screen);
  if (UI.stack.length > 12) UI.stack.shift();
  UI.screen = name;
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + name));
  document.body.dataset.screen = name;
  $('#screen-title').textContent = SCREEN_TITLES[name] || '';
  $('#btn-back').hidden = (name === 'home');
  $$('#bottomnav [data-target]').forEach(b => b.classList.toggle('on', b.dataset.target === name));
  if (RENDERERS[name]) { try { RENDERERS[name](); } catch (e) { handleError(e); } }
  const main = $('#main'); if (main) main.scrollTop = 0;
}
function goBack() {
  if (UI.screen === 'play') { confirmExit('home'); return; }
  if (UI.screen === 'solo') { if (Solo.running) confirmExitSolo('home'); else navigateTo('home', { force: true }); return; }
  const prev = UI.stack.pop() || 'home';
  navigateTo(prev === 'play' ? 'home' : prev, { back: true });
}
function confirmExitSolo(target) {
  Modal.open({
    title: 'Thoát ván?', body: 'Ván đang chơi được lưu tự động — bạn có thể tiếp tục sau. Bỏ ván sẽ tính là thua nếu bạn đã đi từ 8 nước.',
    buttons: [
      { text: 'Chơi tiếp', cls: 'primary' },
      { text: 'Thoát & lưu', fn: () => { Solo.leave(); navigateTo(target || 'home', { force: true }); } },
      { text: 'Bỏ ván', cls: 'danger', fn: () => { Solo.abort(true); navigateTo(target || 'home', { force: true }); } }
    ]
  });
}
function confirmExit(target) {
  Modal.open({
    title: 'Thoát ván chơi?', body: 'Ván đang chơi được lưu tự động — bạn có thể tiếp tục sau.',
    buttons: [
      { text: 'Chơi tiếp', cls: 'primary' },
      { text: 'Thoát & lưu', fn: () => { Match.leave(); navigateTo(target || 'home', { force: true }); } },
      { text: 'Bỏ ván', cls: 'danger', fn: () => { Match.abort(true); navigateTo(target || 'home', { force: true }); } }
    ]
  });
}

/* ---------- Màn: Trang chủ ---------- */
function xpBarHtml() { const need = xpNeed(Data.level); return clamp(Data.xp / need * 100, 0, 100); }
RENDERERS.home = function () {
  const c = COUNTRY_BY_CODE[Data.profile.country] || COUNTRY_BY_CODE.VN;
  $('#home-avatar').textContent = Data.profile.avatar;
  $('#home-name').textContent = Data.profile.name;
  $('#home-country').textContent = c.flag + ' ' + c.name;
  $('#home-level').textContent = 'Lv.' + Data.level;
  $('#home-xp-fill').style.width = xpBarHtml() + '%';
  $('#home-xp-text').textContent = fmt(Data.xp) + ' / ' + fmt(xpNeed(Data.level)) + ' XP';
  $('#btn-play-now').textContent = Data.currentMatch ? '▶ TIẾP TỤC VÁN' : '🎴 CHƠI NGAY';
  const ht = $('#home-title'); if (ht) ht.textContent = '🎖️ ' + titleFor(Data.level);
  buildHomeExtra();
};

/* ---------- Màn: Chọn game ---------- */
RENDERERS.games = function () {
  const root = $('#games-list'); root.textContent = '';
  READY_GAMES.forEach(id => root.appendChild(gameCard(id, true)));
  const lockedRoot = $('#games-locked'); lockedRoot.textContent = '';
  Object.keys(GAME_META).filter(k => !GAME_META[k].ready).forEach(id => lockedRoot.appendChild(gameCard(id, false)));
  const soon = $('#games-soon'); if (soon) soon.hidden = !lockedRoot.children.length;
};
function gameCard(id, ready) {
  const m = GAME_META[id];
  const card = h('article', 'game-card' + (ready ? '' : ' locked'));
  const ic = h('div', 'game-icon'); ic.innerHTML = gameIcon(m.icon); // SVG tĩnh do mã tạo, không có dữ liệu người dùng
  const info = h('div', 'game-info');
  info.appendChild(h('h3', '', m.name));
  info.appendChild(h('p', 'game-desc', m.desc));
  if (ready) {
    const tags = h('div', 'tags');
    if (m.kind === 'solo') { tags.appendChild(h('span', 'tag', '👤 1 người')); tags.appendChild(h('span', 'tag', '↶ Hoàn tác')); tags.appendChild(h('span', 'tag', '💡 Gợi ý')); }
    else {
      tags.appendChild(h('span', 'tag', '👥 ' + (m.minP === m.maxP ? m.minP : m.minP + '–' + m.maxP) + (m.kind === 'bj' ? ' + nhà cái' : '')));
      tags.appendChild(h('span', 'tag', '⏱ ' + Data.settings.turnTime + 's'));
      tags.appendChild(h('span', 'tag', Data.settings.aiLevel === 4 ? '🎲 Ngẫu nhiên' : LEVEL_ICONS[Data.settings.aiLevel] + ' ' + LEVEL_NAMES[Data.settings.aiLevel]));
    }
    info.appendChild(tags);
    const act = h('div', 'game-actions');
    const r = h('button', 'btn small', '📖 Luật'); r.type = 'button'; r.dataset.action = 'rules'; r.dataset.game = id;
    const p = h('button', 'btn small primary', 'CHƠI'); p.type = 'button'; p.dataset.action = 'setup-game'; p.dataset.game = id;
    act.appendChild(r); act.appendChild(p); info.appendChild(act);
  } else {
    info.appendChild(h('span', 'badge-soon', m.phase + ' — chưa chơi được, xem luật trước'));
    const act = h('div', 'game-actions'); const r = h('button', 'btn small', '📖 LUẬT CHƠI'); r.type = 'button'; r.dataset.action = 'rules'; r.dataset.game = id; act.appendChild(r); info.appendChild(act);
  }
  card.appendChild(ic); card.appendChild(info);
  return card;
}
function showRules(id) {
  const r = RULES[id]; if (!r) { showToast('Luật game này sẽ có khi game ra mắt', 'info'); return; }
  const body = h('div', 'rules');
  r[1].forEach(t => body.appendChild(h('p', '', t)));
  if (GAME_META[id] && !GAME_META[id].ready) body.appendChild(h('p', 'muted', '🔒 Game này chưa chơi được trong bản hiện tại (' + GAME_META[id].phase + ').'));
  Modal.open({ title: '📖 ' + r[0], body, buttons: [{ text: 'Đã hiểu', cls: 'primary' }] });
}
function segmented(options, value, onPick, labelFn) {
  const wrap = h('div', 'segmented'); wrap.setAttribute('role', 'radiogroup');
  options.forEach(o => {
    const b = h('button', 'seg' + (o === value ? ' on' : ''), labelFn ? labelFn(o) : String(o)); b.type = 'button';
    b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', o === value ? 'true' : 'false');
    b.addEventListener('click', () => { SFX.play('click'); $$('.seg', wrap).forEach(x => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); }); b.classList.add('on'); b.setAttribute('aria-checked', 'true'); onPick(o); });
    wrap.appendChild(b);
  });
  return wrap;
}
function setupGame(id) {
  const m = GAME_META[id];
  if (Data.currentMatch) {
    Modal.open({ title: 'Có ván chưa xong', body: 'Bạn đang có một ván dở. Tiếp tục hoặc bỏ ván đó trước khi bắt đầu ván mới.', buttons: [
      { text: 'TIẾP TỤC', cls: 'primary', fn: () => Match.resume() }, { text: 'Bỏ ván & chơi mới', cls: 'danger', fn: () => { Match.abort(true); setupGame(id); } }] });
    return;
  }
  if (m.kind === 'solo') {
    const cfgAll = Data.settings.gameCfg || (Data.settings.gameCfg = {}), cfg = Object.assign({}, cfgAll[id] || {}), sb = h('div', 'setup');
    sb.appendChild(h('p', 'muted', m.desc));
    if (id === 'solitaire') { sb.appendChild(h('label', 'lbl', 'Số lá rút từ kho')); sb.appendChild(segmented([1, 3], cfg.draw === 3 ? 3 : 1, v => { cfg.draw = v; }, v => 'Rút ' + v + ' lá')); }
    if (id === 'spider') { sb.appendChild(h('label', 'lbl', 'Số chất (độ khó)')); sb.appendChild(segmented([1, 2, 4], [1, 2, 4].includes(cfg.suits) ? cfg.suits : 1, v => { cfg.suits = v; }, v => v + ' chất')); }
    Modal.open({ title: m.name, body: sb, buttons: [{ text: '📖 Luật', keep: true, fn: () => showRules(id) }, { text: 'CHƠI', cls: 'primary', fn: () => { cfgAll[id] = cfg; saveData(); Solo.start(id, cfg); } }] });
    return;
  }
  let players = clamp(Data.settings.players[id] || m.defP, m.minP, m.maxP), level = Data.settings.aiLevel, time = Data.settings.turnTime;
  const body = h('div', 'setup');
  if (m.minP !== m.maxP) {
    body.appendChild(h('label', 'lbl', m.kind === 'bj' ? 'Số người chơi (không tính nhà cái)' : 'Số người chơi'));
    const arr = []; for (let i = m.minP; i <= m.maxP; i++) arr.push(i);
    body.appendChild(segmented(arr, players, v => { players = v; }));
  }
  body.appendChild(h('label', 'lbl', 'Độ khó AI'));
  body.appendChild(segmented([0, 1, 2, 3, 4], level, v => { level = v; }, v => v === 4 ? '🎲' : LEVEL_ICONS[v] + ' ' + LEVEL_NAMES[v]));
  body.appendChild(h('label', 'lbl', 'Thời gian mỗi lượt'));
  body.appendChild(segmented(TIME_OPTIONS, time, v => { time = v; }, v => v + 's'));
  const gcfg = Data.settings.gameCfg || (Data.settings.gameCfg = {}); let anh = ((gcfg.baCay || {}).anh) !== false;
  if (id === 'baCay') { body.appendChild(h('label', 'lbl', 'Luật Ba Cây')); body.appendChild(segmented([true, false], anh, v => { anh = v; }, v => v ? 'Ba cây ảnh: Bật' : 'Ba cây ảnh: Tắt')); }
  Modal.open({
    title: m.name, body, buttons: [
      { text: '📖 Luật', keep: true, fn: () => showRules(id) },
      { text: 'CHƠI', cls: 'primary', fn: () => { if (id === 'baCay') gcfg.baCay = { anh }; Data.settings.players[id] = players; Data.settings.aiLevel = level; Data.settings.turnTime = time; saveData(); Match.start(id, { players }); } }
    ]
  });
}

/* ---------- Màn: Hồ sơ ---------- */
RENDERERS.profile = function () {
  const c = COUNTRY_BY_CODE[Data.profile.country] || COUNTRY_BY_CODE.VN, st = Data.statistics;
  $('#pf-avatar').textContent = Data.profile.avatar;
  $('#pf-name').textContent = Data.profile.name;
  $('#pf-country').textContent = c.flag + ' ' + c.name;
  $('#pf-age').textContent = 'Tuổi: ' + Data.profile.age;
  $('#pf-level').textContent = 'Lv.' + Data.level;
  const pt = $('#pf-title'); if (pt) pt.textContent = '🎖️ ' + titleFor(Data.level);
  $('#pf-xp-fill').style.width = xpBarHtml() + '%';
  $('#pf-xp-text').textContent = 'XP ' + fmt(Data.xp) + ' / ' + fmt(xpNeed(Data.level));
  const rate = st.total ? Math.round(st.wins / st.total * 100) : 0;
  const rows = [['🏆', 'Số trận', st.total], ['🥇', 'Thắng', st.wins], ['❌', 'Thua', st.losses], ['📈', 'Tỷ lệ thắng', rate + '%'],
    ['🔥', 'Chuỗi thắng', st.streak], ['⭐', 'Chuỗi tốt nhất', st.bestStreak], ['🎴', 'Số game đã chơi', Object.keys(st.games).length],
    ['🏟️', 'Số giải', st.tournaments], ['👑', 'Vô địch', st.championships], ['🏆', 'Số cúp', Data.tourMeta.trophies.length], ['⏱️', 'Thời gian chơi', fmtTime(st.playTime)]];
  const g = $('#pf-grid'); g.textContent = '';
  rows.forEach(r => { const d = h('div', 'stat'); d.appendChild(h('span', 'stat-ic', r[0])); d.appendChild(h('b', '', String(r[2]))); d.appendChild(h('small', '', r[1])); g.appendChild(d); });
};
function editName() {
  const body = h('div', 'setup'); const inp = h('input', 'input'); inp.type = 'text'; inp.maxLength = 20; inp.value = Data.profile.name; inp.setAttribute('aria-label', 'Tên người chơi');
  body.appendChild(inp); const err = h('p', 'err', ''); body.appendChild(err);
  const ok = () => { const v = sanitizeName(inp.value); if (!v) { err.textContent = 'Tên không được để trống (1–20 ký tự)'; return false; } Data.profile.name = v; saveData(); RENDERERS.profile(); showToast('Đã đổi tên', 'success'); return true; };
  const m = Modal.open({ title: 'Đổi tên', body, buttons: [{ text: 'Huỷ' }, { text: 'Lưu', cls: 'primary', keep: true, fn: mm => { if (ok()) Modal.close(mm); } }] });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (ok()) Modal.close(m); } });
  setTimeout(() => inp.focus(), 50);
}
function editAge() {
  const body = h('div', 'setup'); const inp = h('input', 'input'); inp.type = 'number'; inp.min = 6; inp.max = 120; inp.value = Data.profile.age; inp.setAttribute('aria-label', 'Tuổi');
  body.appendChild(inp); const err = h('p', 'err', ''); body.appendChild(err);
  const ok = () => { const v = Math.round(Number(inp.value)); if (!(v >= 6 && v <= 120)) { err.textContent = 'Nhập tuổi từ 6 đến 120'; return false; } Data.profile.age = v; saveData(); RENDERERS.profile(); return true; };
  Modal.open({ title: 'Đổi tuổi', body, buttons: [{ text: 'Huỷ' }, { text: 'Lưu', cls: 'primary', keep: true, fn: mm => { if (ok()) Modal.close(mm); } }] });
}
function editAvatar() {
  const body = h('div', 'avatar-grid');
  AVATARS.forEach(a => {
    const b = h('button', 'av-pick' + (a === Data.profile.avatar ? ' on' : ''), a); b.type = 'button'; b.setAttribute('aria-label', 'Avatar ' + a);
    b.addEventListener('click', () => { Data.profile.avatar = a; saveData(); RENDERERS.profile(); RENDERERS.home(); Modal.close(); });
    body.appendChild(b);
  });
  Modal.open({ title: 'Chọn avatar', body });
}
function editCountry() {
  const body = h('div', 'country-pick');
  const search = h('input', 'input'); search.type = 'search'; search.placeholder = '🔍 Tìm quốc gia'; search.setAttribute('aria-label', 'Tìm quốc gia');
  const regSel = h('select', 'input'); regSel.setAttribute('aria-label', 'Lọc theo khu vực');
  const all = h('option', '', 'Tất cả khu vực'); all.value = ''; regSel.appendChild(all);
  Object.keys(REGIONS).forEach(k => { const o = h('option', '', REGIONS[k]); o.value = k; regSel.appendChild(o); });
  const list = h('div', 'country-list'); const more = h('button', 'btn small', 'Xem thêm'); more.type = 'button';
  let shown = 40, filtered = [];
  function render() {
    const q = norm(search.value), rg = regSel.value;
    filtered = COUNTRIES.filter(c => (!rg || c.region === rg) && (!q || norm(c.name).includes(q) || c.code.toLowerCase() === q));
    list.textContent = '';
    filtered.slice(0, shown).forEach(c => {
      const b = h('button', 'country-item' + (c.code === Data.profile.country ? ' on' : ''), c.flag + '  ' + c.name); b.type = 'button'; b.dataset.code = c.code; list.appendChild(b);
    });
    if (!filtered.length) list.appendChild(h('p', 'muted', 'Không tìm thấy quốc gia phù hợp'));
    more.hidden = filtered.length <= shown;
  }
  list.addEventListener('click', e => {
    const b = e.target.closest('.country-item'); if (!b) return;
    Data.profile.country = b.dataset.code; saveData(); RENDERERS.profile(); RENDERERS.home(); Modal.close();
  });
  search.addEventListener('input', () => { shown = 40; render(); }); regSel.addEventListener('change', () => { shown = 40; render(); });
  more.addEventListener('click', () => { shown += 40; render(); });
  body.appendChild(search); body.appendChild(regSel); body.appendChild(list); body.appendChild(more); render();
  Modal.open({ title: 'Chọn quốc gia', body });
}

/* ---------- Màn: Thống kê ---------- */
RENDERERS.stats = function () {
  const st = Data.statistics, rate = st.total ? Math.round(st.wins / st.total * 100) : 0;
  let fav = '—', fp = 0;
  Object.keys(st.games).forEach(k => { if (st.games[k].played > fp && GAME_META[k]) { fp = st.games[k].played; fav = GAME_META[k].name; } });
  const rows = [['Tổng trận', st.total], ['Thắng', st.wins], ['Thua', st.losses], ['Hòa', st.draws], ['Win rate', rate + '%'], ['Win streak', st.streak],
    ['Best streak', st.bestStreak], ['Game yêu thích', fav], ['Thời gian chơi', fmtTime(st.playTime)], ['Số lần vô địch', st.championships], ['Số giải tham gia', st.tournaments]];
  const g = $('#stats-grid'); g.textContent = '';
  rows.forEach(r => { const d = h('div', 'stat'); d.appendChild(h('b', '', String(r[1]))); d.appendChild(h('small', '', r[0])); g.appendChild(d); });
  const t = $('#stats-games'); t.textContent = '';
  READY_GAMES.forEach(id => {
    const s = st.games[id] || { played: 0, won: 0, lost: 0, draw: 0 };
    const row = h('div', 'trow'); row.appendChild(h('span', 'tname', GAME_META[id].name));
    row.appendChild(h('span', '', s.played + ' ván')); row.appendChild(h('span', '', s.won + 'T'));
    row.appendChild(h('span', '', s.lost + 'B')); row.appendChild(h('span', '', s.played ? Math.round(s.won / s.played * 100) + '%' : '—'));
    t.appendChild(row);
  });
  buildStatBars();
};

/* ---------- Màn: Thành tích ---------- */
RENDERERS.achievements = function () {
  const root = $('#ach-list'); root.textContent = '';
  const n = ACHIEVEMENTS.filter(a => Data.achievements[a.id]).length;
  $('#ach-count').textContent = n + ' / ' + ACHIEVEMENTS.length + ' đã mở';
  ACHIEVEMENTS.forEach(a => {
    const on = !!Data.achievements[a.id];
    const d = h('div', 'ach' + (on ? ' on' : '')); d.appendChild(h('span', 'ach-ic', on ? a.icon : '🔒'));
    const t = h('div', 'ach-t'); t.appendChild(h('b', '', a.name)); t.appendChild(h('small', '', a.desc)); d.appendChild(t); root.appendChild(d);
  });
};

/* ---------- Màn: Cài đặt ---------- */
function toggleRow(label, key) {
  const row = h('div', 'setting'); row.appendChild(h('span', '', label));
  const b = h('button', 'switch' + (Data.settings[key] ? ' on' : ''), Data.settings[key] ? 'ON' : 'OFF'); b.type = 'button';
  b.setAttribute('role', 'switch'); b.setAttribute('aria-checked', Data.settings[key] ? 'true' : 'false'); b.setAttribute('aria-label', label);
  b.addEventListener('click', () => {
    Data.settings[key] = !Data.settings[key]; saveData(); applySettings(); SFX.play('click'); RENDERERS.settings();
  });
  row.appendChild(b); return row;
}
RENDERERS.settings = function () {
  const root = $('#settings-body'); root.textContent = '';
  root.appendChild(toggleRow('🔊 Âm thanh', 'sound'));
  root.appendChild(toggleRow('🔔 Âm thông báo', 'notify'));
  root.appendChild(toggleRow('✨ Hiệu ứng (chặt 2, tới lượt, lên level…)', 'effects'));
  root.appendChild(toggleRow('🎬 Animation bài', 'animation'));
  root.appendChild(toggleRow('♿ Reduced Motion', 'reducedMotion'));
  const th = h('div', 'setting col'); th.appendChild(h('span', '', '🌙 Giao diện'));
  th.appendChild(segmented(['light', 'dark', 'system'], Data.settings.theme, v => { Data.settings.theme = v; saveData(); applySettings(); }, v => ({ light: 'Sáng', dark: 'Tối', system: 'Hệ thống' }[v])));
  root.appendChild(th);
  const fs = h('div', 'setting'); fs.appendChild(h('span', '', '⛶ Toàn màn hình'));
  const fb = h('button', 'btn small', document.fullscreenElement ? 'Thoát' : 'Bật'); fb.type = 'button'; fb.dataset.action = 'fullscreen'; fs.appendChild(fb); root.appendChild(fs);
  const ai = h('div', 'setting col'); ai.appendChild(h('span', '', '🤖 Độ khó AI'));
  ai.appendChild(segmented([0, 1, 2, 3, 4], Data.settings.aiLevel, v => { Data.settings.aiLevel = v; saveData(); }, v => v === 4 ? '🎲 Ngẫu nhiên' : LEVEL_ICONS[v] + ' ' + LEVEL_NAMES[v]));
  root.appendChild(ai);
  const tm = h('div', 'setting col'); tm.appendChild(h('span', '', '⏱️ Thời gian lượt'));
  tm.appendChild(segmented(TIME_OPTIONS, Data.settings.turnTime, v => { Data.settings.turnTime = v; saveData(); }, v => v + 's'));
  root.appendChild(tm);
  const sp = h('div', 'setting col'); sp.appendChild(h('span', '', '🤖 Tốc độ AI'));
  sp.appendChild(segmented([0, 1, 2], Data.settings.aiSpeed, v => { Data.settings.aiSpeed = v; saveData(); }, v => ['🐢 Chậm', '🚶 Vừa', '⚡ Nhanh'][v]));
  root.appendChild(sp);
  root.appendChild(toggleRow('📳 Rung (điện thoại)', 'vibrate'));
  const thr = h('div', 'setting'); thr.appendChild(h('span', '', '🎨 Giao diện bài & bàn'));
  const thb = h('button', 'btn small', 'Mở'); thb.type = 'button'; thb.dataset.action = 'goto'; thb.dataset.target = 'themes'; thr.appendChild(thb); root.appendChild(thr);
  const bk = h('div', 'setting'); bk.appendChild(h('span', '', '💾 Sao lưu dữ liệu'));
  const bkw = h('div', 'btn-pair'); const ex = h('button', 'btn small', 'Xuất'); ex.type = 'button'; ex.addEventListener('click', exportDataModal);
  const im = h('button', 'btn small', 'Nhập'); im.type = 'button'; im.addEventListener('click', importDataModal); bkw.appendChild(ex); bkw.appendChild(im); bk.appendChild(bkw); root.appendChild(bk);
  const rs = h('div', 'setting'); rs.appendChild(h('span', '', '🗑️ Xoá toàn bộ dữ liệu'));
  const rb = h('button', 'btn small danger', 'Xoá'); rb.type = 'button'; rb.dataset.action = 'reset-data'; rs.appendChild(rb); root.appendChild(rs);
  if (!Store.ok) root.appendChild(h('p', 'err', '⚠️ Trình duyệt không cho lưu dữ liệu — tiến trình chỉ giữ trong phiên này.'));
};
function applySettings() {
  const s = Data.settings;
  try { applyTheme(); } catch (e) { }
  let theme = s.theme;
  if (theme === 'system') { try { theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { theme = 'dark'; } }
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('reduce-motion', !!s.reducedMotion);
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = theme === 'dark' ? '#062a1e' : '#e9efe8';
  const sb = $('#btn-sound'); if (sb) { sb.textContent = s.sound ? '🔊' : '🔇'; sb.setAttribute('aria-pressed', s.sound ? 'true' : 'false'); }
}
function toggleFullscreen() {
  try {
    const d = document, de = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); }
    else if (de.requestFullscreen || de.webkitRequestFullscreen) { const p = (de.requestFullscreen || de.webkitRequestFullscreen).call(de); if (p && p.catch) p.catch(() => showToast('Không bật được toàn màn hình', 'warning')); }
    else showToast('Trình duyệt này không hỗ trợ toàn màn hình — hãy thêm vào Màn hình chính', 'info');
  } catch (e) { showToast('Không bật được toàn màn hình', 'warning'); }
}

/* ---------- Màn: Hướng dẫn ---------- */
RENDERERS.guide = function () {
  const root = $('#guide-body'); if (root.dataset.built) return; root.dataset.built = '1';
  const sec = (title, lines) => {
    const d = h('details', 'acc'); d.appendChild(h('summary', '', title));
    lines.forEach(t => d.appendChild(h('p', '', t))); root.appendChild(d);
  };
  sec('🎴 Cách chơi chung', ['Chạm lá bài để chọn (bài nhích lên), chạm lần nữa để bỏ chọn. Bấm ĐÁNH để đánh các lá đã chọn. GỢI Ý cho nước đi hợp lệ.', 'Mỗi lượt có đồng hồ đếm ngược. Hết giờ, game tự chọn nước đi hợp lệ cho bạn.', 'Nước đi sai sẽ báo "Nước đi không hợp lệ" và không mất bài.']);
  Object.keys(GAME_META).forEach(id => { if (RULES[id]) sec('📖 ' + RULES[id][0] + (GAME_META[id].ready ? '' : ' (chưa chơi được)'), RULES[id][1]); });
  sec('🤖 AI', ['Dễ: nước đi đơn giản, đôi khi bỏ qua nước tốt. Bình thường: hợp lý, biết chặn. Khó: giữ quân mạnh, tính hết bài nhanh. Siêu khó: đánh giá nhiều nước và theo dõi lá đã ra.', 'AI không xem bài của bạn — chỉ dùng thông tin công khai.']);
  sec('⭐ XP, hồ sơ, thành tích', ['Bắt đầu từ Lv.1 với 0 XP. Thắng ván được nhiều XP (độ khó càng cao càng nhiều), thua vẫn được một ít XP. Không có tiền thật, nạp hay cược.', 'Hồ sơ, thống kê, thành tích và ván đang chơi tự lưu trong trình duyệt (LocalStorage).']);
  sec('📲 Thêm vào Màn hình chính (iPhone)', ['Đặt 3 file lên một web tĩnh (GitHub Pages, Netlify…), mở bằng Safari → nút Chia sẻ → "Thêm vào MH chính". Icon app được nhúng sẵn.', 'Sau khi đã tải, game không cần Internet để chơi.']);
  RULES_EXTRA.forEach(x => sec(x[0], x[1]));
};

/* ============================ 10b. MÀN HÌNH GIẢI ĐẤU ============================ */
function tourPlayerName(T, id) { const p = T.players[id]; return p.flag + ' ' + p.name; }
function levelTag(p) { return p.human ? '' : ' ' + LEVEL_ICONS[clamp(p.level, 0, 3)]; }
function buildTourBracket(T) {
  const root = h('div', 'bracket');
  root.appendChild(h('p', 'muted', 'Game thi đấu: ' + GAME_META[T.gameId].name + (T.note ? ' · ' + T.note : '')));
  if (T.groups) {
    T.groups.forEach((grp, gi) => {
      const d = h('details', 'acc'); if (gi === 0) d.open = true;
      d.appendChild(h('summary', '', 'Bảng ' + String.fromCharCode(65 + gi) + (gi === 0 ? ' (bảng của bạn)' : '')));
      const head = h('div', 'trow standing head'); ['Đội', 'T', 'H', 'B', 'Đ'].forEach(x => head.appendChild(h('span', '', x))); d.appendChild(head);
      Tour.rankGroup(T, gi).forEach((id, pos) => {
        const s = T.stats[id], row = h('div', 'trow standing' + (id === 0 ? ' me' : '') + (pos < 2 ? ' qual' : ''));
        row.appendChild(h('span', 'tname', (pos + 1) + '. ' + tourPlayerName(T, id) + levelTag(T.players[id])));
        [s.w, s.d, s.l, s.pts].forEach(x => row.appendChild(h('span', '', String(x)))); d.appendChild(row);
      });
      root.appendChild(d);
    });
    root.appendChild(h('p', 'muted small', 'Top 2 mỗi bảng vào vòng loại trực tiếp · Thắng 3 điểm, hòa 1 điểm.'));
  }
  if (T.phase === 'ko' || T.phase === 'done') {
    const bo = T.phase === 'ko' ? Tour.boFor(T) : (TOURNAMENTS[T.id].bo3 ? 3 : 1);
    root.appendChild(h('h3', 'sub', (T.phase === 'done' ? 'Vòng cuối' : 'Vòng hiện tại — ' + Tour.stageLabel(T)) + (bo > 1 ? ' · 3 ván thắng 2' : '')));
    T.round.forEach(m => {
      const row = h('div', 'match' + ((m.a === 0 || m.b === 0) ? ' me' : ''));
      [m.a, m.b].forEach((id, i) => {
        const s = h('span', 'mside' + (m.w === id ? ' win' : (m.w != null ? ' lose' : '')), tourPlayerName(T, id));
        row.appendChild(s); if (i === 0) row.appendChild(h('em', '', (m.sa || m.sb) ? (m.sa || 0) + '-' + (m.sb || 0) : 'vs'));
      });
      root.appendChild(row);
    });
  }
  if (T.champion != null) root.appendChild(h('div', 'champ', '🏆 Vô địch: ' + tourPlayerName(T, T.champion)));
  if (T.log.length) {
    const d = h('details', 'acc'); d.appendChild(h('summary', '', 'Kết quả đã đấu (' + T.log.length + ')'));
    T.log.slice(-20).reverse().forEach(l => d.appendChild(h('p', 'small', l.s + ': ' + T.players[l.a].name + ' – ' + T.players[l.b].name + (l.w < 0 ? ' → hòa' : ' → ' + T.players[l.w].name + ' thắng'))));
    root.appendChild(d);
  }
  return root;
}
function tourStatusCard(T) {
  const card = h('div', 'tour-card active-tour');
  card.appendChild(h('h3', '', T.icon + ' ' + T.name));
  if (T.status === 'active') {
    card.appendChild(h('p', 'muted', 'Đang diễn ra · ' + Tour.stageLabel(T) + ' · ' + GAME_META[T.gameId].name));
    const pr = Tour.humanPair(T);
    if (pr) {
      const o = T.players[pr[1]];
      const row = h('div', 'next-opp'); row.appendChild(h('span', 'seat-av', o.avatar));
      const t = h('div', ''); t.appendChild(h('b', '', 'Đối thủ: ' + o.name)); t.appendChild(h('small', 'muted', o.flag + ' ' + o.country + ' · ' + LEVEL_ICONS[clamp(o.level, 0, 3)] + ' ' + LEVEL_NAMES[clamp(o.level, 0, 3)]));
      row.appendChild(t); card.appendChild(row);
    }
    if (T.phase === 'group') {
      const s = T.stats[0]; card.appendChild(h('p', '', 'Thành tích bảng: ' + s.w + 'T ' + s.d + 'H ' + s.l + 'B · ' + s.pts + ' điểm'));
    } else if (T.phase === 'ko' && Tour.boFor(T) > 1) {
      const m = T.round.find(x => x.w == null && (x.a === 0 || x.b === 0));
      if (m) card.appendChild(h('p', '', '⚔️ 3 ván thắng 2 · Tỷ số: ' + (m.a === 0 ? (m.sa || 0) + '-' + (m.sb || 0) : (m.sb || 0) + '-' + (m.sa || 0))));
    }
    if (T.gameId === 'blackjack' || T.gameId === 'xiDach') card.appendChild(h('p', 'muted small', 'Bạn và đối thủ cùng đấu nhà cái — ai được điểm cao hơn thắng; bằng nhau là hòa (đấu loại thì đánh lại).'));
    const act = h('div', 'game-actions');
    const play = h('button', 'btn primary', '▶ CHƠI TRẬN TIẾP THEO'); play.type = 'button'; play.addEventListener('click', () => Tour2.playNext());
    act.appendChild(play); card.appendChild(act);
    const act2 = h('div', 'game-actions');
    const br = h('button', 'btn small', '📊 Bảng đấu'); br.type = 'button'; br.addEventListener('click', () => Modal.open({ title: T.name, body: buildTourBracket(T), buttons: [{ text: 'Đóng', cls: 'primary' }] }));
    const ab = h('button', 'btn small danger', 'Bỏ giải'); ab.type = 'button';
    ab.addEventListener('click', () => Modal.open({ title: 'Bỏ giải đấu?', body: 'Bạn sẽ rời giải và mất tiến trình giải này.', buttons: [{ text: 'Ở lại' }, { text: 'BỎ GIẢI', cls: 'danger', fn: () => { Tour.abandon(); RENDERERS.tournament(); } }] }));
    act2.appendChild(br); act2.appendChild(ab); card.appendChild(act2);
  } else {
    const win = T.champion === 0;
    card.appendChild(h('div', 'res-headline', win ? '🏆 BẠN LÀ NHÀ VÔ ĐỊCH!' : 'Đã kết thúc — ' + T.outLabel));
    card.appendChild(h('p', 'res-xp', '+' + (T.reward || 0) + ' XP'));
    (T.ach || []).forEach(n => card.appendChild(h('div', 'res-ach', '🏅 Thành tích mới: ' + n)));
    if (T.champion != null && !win) card.appendChild(h('p', 'muted', 'Nhà vô địch: ' + tourPlayerName(T, T.champion)));
    const act = h('div', 'game-actions');
    const br = h('button', 'btn small', '📊 Xem bảng đấu'); br.type = 'button'; br.addEventListener('click', () => Modal.open({ title: T.name, body: buildTourBracket(T), buttons: [{ text: 'Đóng', cls: 'primary' }] }));
    const cl = h('button', 'btn small primary', 'Đóng & chọn giải mới'); cl.type = 'button'; cl.addEventListener('click', () => { Data.tournament = null; saveData(); RENDERERS.tournament(); });
    act.appendChild(br); act.appendChild(cl); card.appendChild(act);
    if (win && !T.celebrated) { T.celebrated = true; saveData(); setTimeout(() => { SFX.play('win'); confetti(); }, 300); }
  }
  return card;
}
function tourLocked(def) {
  if (def.daily && Data.tourMeta.daily === Tour.dateKey()) return 'Đã tham gia hôm nay';
  if (def.weekly && Data.tourMeta.weekly === Tour.weekKey()) return 'Đã tham gia tuần này';
  return '';
}
const Tour2 = {
  playNext() {
    const T = Data.tournament; if (!T || T.status !== 'active') return;
    if (Data.currentMatch) {
      if (Data.currentMatch.tour) Match.resume(); else showToast('Hãy hoàn tất hoặc bỏ ván đang chơi trước', 'warning');
      return;
    }
    const pr = Tour.humanPair(T); if (!pr) return;
    const o = T.players[pr[1]];
    T.pending = { opp: pr[1] }; saveData();
    Match.start(T.gameId, { players: 2, tour: true, aiLevel: o.level, opponents: [{ name: o.name, avatar: o.avatar, country: o.country, code: o.code, flag: o.flag, difficulty: o.level }] });
  },
  setup(id) {
    const def = TOURNAMENTS[id];
    if (Data.tournament && Data.tournament.status === 'active') { showToast('Bạn đang tham gia một giải — hãy hoàn tất hoặc bỏ giải trước', 'warning'); return; }
    const lock = tourLocked(def);
    if (lock) { showToast(lock + ' — quay lại sau', 'info'); return; }
    let game = Tour.H2H_GAMES.includes(Data.tourMeta.game) ? Data.tourMeta.game : 'tienLen', sub = 'sea', region = 'AS';
    const body = h('div', 'setup');
    body.appendChild(h('p', '', def.desc));
    body.appendChild(h('p', 'muted', 'Phần thưởng vô địch: +' + def.reward + ' XP + 1 cúp · Mỗi trận là ván đấu 1-1 với AI.'));
    body.appendChild(h('label', 'lbl', 'Game thi đấu (tất cả game đang chơi được)'));
    body.appendChild(segmented(Tour.H2H_GAMES, game, v => { game = v; }, v => GAME_META[v].name.replace('Tiến Lên ', 'TL ')));
    body.appendChild(h('p', 'muted small', 'Blackjack / Xì Dách: hai người cùng đấu nhà cái, ai được điểm cao hơn thì thắng trận.'));
    if (def.pick === 'sub') {
      body.appendChild(h('label', 'lbl', 'Khu vực'));
      const s = h('select', 'input'); s.setAttribute('aria-label', 'Khu vực');
      Object.keys(SUBREGIONS).forEach(k => { const o = h('option', '', SUBREGIONS[k].name); o.value = k; s.appendChild(o); });
      s.addEventListener('change', () => { sub = s.value; }); body.appendChild(s);
    }
    if (def.pick === 'region') {
      body.appendChild(h('label', 'lbl', 'Châu lục'));
      const s = h('select', 'input'); s.setAttribute('aria-label', 'Châu lục');
      Object.keys(REGIONS).forEach(k => { const o = h('option', '', REGIONS[k]); o.value = k; s.appendChild(o); });
      s.addEventListener('change', () => { region = s.value; }); body.appendChild(s);
    }
    Modal.open({
      title: def.icon + ' ' + def.name, body, buttons: [
        { text: 'Huỷ' },
        { text: 'BẮT ĐẦU', cls: 'primary', fn: () => {
          if (Data.currentMatch) { showToast('Hãy hoàn tất hoặc bỏ ván đang chơi trước', 'warning'); return; }
          Tour.start(id, game, { sub, region }); RENDERERS.tournament(); showToast('Đã vào giải — chúc may mắn!', 'success');
        } }
      ]
    });
  }
};
RENDERERS.tournament = function () {
  const root = $('#tour-body'); root.textContent = '';
  const T = Data.tournament;
  if (T) root.appendChild(tourStatusCard(T));
  if (Data.tourMeta.trophies.length) {
    const tr = h('div', 'trophies'); tr.appendChild(h('b', '', '🏆 Phòng truyền thống: ' + Data.tourMeta.trophies.length + ' cúp'));
    const row = h('div', 'trophy-row');
    Data.tourMeta.trophies.slice(0, 12).forEach(c => { const x = h('span', 'trophy', c.icon); x.title = c.name + ' · ' + c.date; x.setAttribute('aria-label', c.name + ' ' + c.date); row.appendChild(x); });
    tr.appendChild(row); root.appendChild(tr);
  }
  root.appendChild(h('h3', 'sub', 'Các giải đấu (' + Object.keys(TOURNAMENTS).length + ')'));
  Object.keys(TOURNAMENTS).forEach(id => {
    const def = TOURNAMENTS[id];
    const card = h('article', 'tour-card');
    card.appendChild(h('h3', '', def.icon + ' ' + def.name)); card.appendChild(h('p', 'muted', def.desc));
    card.appendChild(h('small', 'muted', def.size + ' người · thưởng vô địch +' + def.reward + ' XP' + (def.bo3 ? ' · có vòng 3 ván thắng 2' : '')));
    const lock = tourLocked(def);
    const b = h('button', 'btn small primary', lock || 'THAM GIA'); b.type = 'button'; if (lock) b.disabled = true;
    b.addEventListener('click', () => Tour2.setup(id));
    card.appendChild(b); root.appendChild(card);
  });
  if (Data.tourMeta.history.length) {
    root.appendChild(h('h3', 'sub', 'Lịch sử giải đấu'));
    Data.tourMeta.history.forEach(x => root.appendChild(h('div', 'trow hist', x.date + ' · ' + x.name + ' · ' + (GAME_META[x.game] ? GAME_META[x.game].name : '') + ' — ' + x.result)));
  }
};

/* ============================ 10d. TÍNH NĂNG MỞ RỘNG (UI) ============================ */
function vibrate(p) { if (!Data.settings.vibrate) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }
function applyTheme() {
  const t = currentTable(), r = document.documentElement.style;
  r.setProperty('--felt', t.c[0]); r.setProperty('--felt2', t.c[1]);
  const dp = $('#deck-pile img'); if (dp) dp.src = getCardBack();
}
function fmtDate(t) { try { return new Date(t).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }

/* ---------- Trang chủ: danh hiệu, quà, nhiệm vụ, giải đang chơi ---------- */
function buildHomeExtra() {
  const root = $('#home-extra'); if (!root) return; root.textContent = '';
  const unclaimed = Daily.check();
  if (unclaimed) {
    const c = h('div', 'mini-card gift'); c.appendChild(h('span', 'mc-ic', '🎁'));
    const t = h('div', 'mc-t'); t.appendChild(h('b', '', 'Quà đăng nhập · chuỗi ' + Data.daily.streak + ' ngày')); t.appendChild(h('small', 'muted', '+' + Daily.reward() + ' XP đang chờ bạn'));
    const b = h('button', 'btn small primary', 'NHẬN'); b.type = 'button';
    b.addEventListener('click', () => { const r = Daily.claim(); if (r) { showToast('🎁 Nhận +' + r + ' XP', 'success'); RENDERERS.home(); } });
    c.appendChild(t); c.appendChild(b); root.appendChild(c);
  }
  Missions.ensure();
  const done = Data.missions.list.filter(m => m.claimed).length, ready = Missions.readyCount();
  const mc = h('button', 'mini-card link'); mc.type = 'button'; mc.dataset.action = 'goto'; mc.dataset.target = 'missions';
  mc.appendChild(h('span', 'mc-ic', '📅'));
  const t2 = h('div', 'mc-t'); t2.appendChild(h('b', '', 'Nhiệm vụ hôm nay: ' + done + '/3 đã nhận')); t2.appendChild(h('small', ready ? 'ready' : 'muted', ready ? '🎉 ' + ready + ' nhiệm vụ có thể nhận thưởng' : 'Hoàn thành để nhận XP'));
  mc.appendChild(t2); root.appendChild(mc);
  const T = Data.tournament;
  if (T && T.status === 'active') {
    const tc = h('button', 'mini-card link'); tc.type = 'button'; tc.dataset.action = 'goto'; tc.dataset.target = 'tournament';
    tc.appendChild(h('span', 'mc-ic', T.icon)); const t3 = h('div', 'mc-t'); t3.appendChild(h('b', '', T.name)); t3.appendChild(h('small', 'muted', Tour.stageLabel(T) + ' · bấm để tiếp tục')); tc.appendChild(t3); root.appendChild(tc);
  }
}

/* ---------- Màn: Nhiệm vụ ---------- */
RENDERERS.missions = function () {
  Missions.ensure();
  const root = $('#missions-body'); root.textContent = '';
  const g = h('div', 'tour-card');
  g.appendChild(h('h3', '', '🎁 Quà đăng nhập hàng ngày'));
  const unclaimed = Daily.check();
  const days = h('div', 'streak');
  for (let i = 1; i <= 7; i++) { const d = h('span', 'day' + (i <= Math.min(Data.daily.streak, 7) ? ' on' : ''), String(i)); days.appendChild(d); }
  g.appendChild(days);
  g.appendChild(h('p', 'muted', 'Chuỗi hiện tại: ' + Data.daily.streak + ' ngày · quà hôm nay +' + Daily.reward() + ' XP (tối đa +180 XP ở ngày thứ 7)'));
  const gb = h('button', 'btn small primary', unclaimed ? 'NHẬN QUÀ HÔM NAY' : 'Đã nhận hôm nay'); gb.type = 'button'; if (!unclaimed) gb.disabled = true;
  gb.addEventListener('click', () => { const r = Daily.claim(); if (r) { showToast('🎁 Nhận +' + r + ' XP', 'success'); RENDERERS.missions(); } });
  g.appendChild(gb); root.appendChild(g);
  root.appendChild(h('h3', 'sub', 'Nhiệm vụ hôm nay'));
  Data.missions.list.forEach((m, i) => {
    const d = Missions.def(m.id); if (!d) return;
    const c = h('div', 'tour-card mission' + (m.claimed ? ' claimed' : ''));
    c.appendChild(h('b', '', d.name));
    const bar = h('div', 'xp-bar'); const fill = h('i', ''); fill.style.width = Math.min(100, Math.round(m.prog / d.goal * 100)) + '%'; bar.appendChild(fill); c.appendChild(bar);
    c.appendChild(h('small', 'muted', Math.min(m.prog, d.goal) + ' / ' + d.goal + ' · thưởng +' + d.xp + ' XP'));
    const ready = m.prog >= d.goal && !m.claimed;
    const b = h('button', 'btn small' + (ready ? ' primary' : ''), m.claimed ? '✓ Đã nhận' : ready ? 'NHẬN +' + d.xp + ' XP' : 'Chưa xong'); b.type = 'button'; if (!ready) b.disabled = true;
    b.addEventListener('click', () => { const xp = Missions.claim(i); if (xp) { showToast('🎉 +' + xp + ' XP', 'success'); RENDERERS.missions(); } });
    c.appendChild(b); root.appendChild(c);
  });
  const bonus = h('div', 'tour-card');
  bonus.appendChild(h('b', '', '⭐ Hoàn thành cả 3 nhiệm vụ: +' + Missions.ALL_BONUS + ' XP'));
  const bb = h('button', 'btn small' + (Missions.canClaimBonus() ? ' primary' : ''), Data.missions.bonus ? '✓ Đã nhận' : Missions.canClaimBonus() ? 'NHẬN THƯỞNG' : 'Nhận hết 3 nhiệm vụ trước'); bb.type = 'button'; if (!Missions.canClaimBonus()) bb.disabled = true;
  bb.addEventListener('click', () => { const xp = Missions.claimBonus(); if (xp) { showToast('⭐ +' + xp + ' XP', 'success'); RENDERERS.missions(); } });
  bonus.appendChild(bb); root.appendChild(bonus);
  root.appendChild(h('p', 'muted small center', 'Nhiệm vụ làm mới mỗi ngày.'));
};

/* ---------- Màn: Bảng xếp hạng (mô phỏng) ---------- */
const LBUI = { tab: 'world', shown: 25 };
RENDERERS.leaderboard = function () {
  const root = $('#lb-body'); root.textContent = '';
  const mine = Leaderboard.total(Data.level, Data.xp);
  let list = Leaderboard.build(); if (LBUI.tab === 'nation') list = list.filter(e => e.code === Data.profile.country);
  root.appendChild(segmented(['world', 'nation'], LBUI.tab, v => { LBUI.tab = v; LBUI.shown = 25; RENDERERS.leaderboard(); }, v => v === 'world' ? '🌎 Toàn cầu' : '🏳️ Quốc gia'));
  root.appendChild(h('p', 'muted small', 'Bảng xếp hạng mô phỏng ngoại tuyến (đổi theo tuần) — xếp theo tổng XP tích luỹ.'));
  const c = COUNTRY_BY_CODE[Data.profile.country] || COUNTRY_BY_CODE.VN;
  const me = h('div', 'lb-row me'); me.appendChild(h('span', 'lb-rank', '#' + Leaderboard.rankOf(list, mine)));
  me.appendChild(h('span', 'lb-av', Data.profile.avatar)); const nm = h('span', 'lb-name'); nm.appendChild(h('b', '', Data.profile.name + ' (Bạn)')); nm.appendChild(h('small', 'muted', c.flag + ' Lv.' + Data.level + ' · ' + titleFor(Data.level))); me.appendChild(nm);
  me.appendChild(h('span', 'lb-score', fmt(mine))); root.appendChild(me);
  const box = h('div', 'lb-list');
  list.slice(0, LBUI.shown).forEach((e, i) => {
    const row = h('div', 'lb-row' + (i < 3 ? ' top' : '')); row.appendChild(h('span', 'lb-rank', i < 3 ? ['🥇', '🥈', '🥉'][i] : '#' + (i + 1)));
    row.appendChild(h('span', 'lb-av', e.avatar)); const n = h('span', 'lb-name'); n.appendChild(h('b', '', e.name)); n.appendChild(h('small', 'muted', e.flag + ' Lv.' + e.level + ' · ' + titleFor(e.level))); row.appendChild(n);
    row.appendChild(h('span', 'lb-score', fmt(e.score))); box.appendChild(row);
  });
  root.appendChild(box);
  if (list.length > LBUI.shown) { const more = h('button', 'btn small', 'Xem thêm'); more.type = 'button'; more.addEventListener('click', () => { LBUI.shown += 25; RENDERERS.leaderboard(); }); root.appendChild(more); }
  if (!list.length) root.appendChild(h('p', 'muted center', 'Chưa có ai trong bảng này.'));
};

/* ---------- Màn: Giao diện (mặt sau lá bài, màu bàn) ---------- */
RENDERERS.themes = function () {
  const root = $('#themes-body'); root.textContent = '';
  root.appendChild(h('p', 'muted', 'Mở khoá thêm giao diện khi lên level. Level hiện tại: ' + Data.level));
  const sect = (title, items, current, key, previewFn) => {
    root.appendChild(h('h3', 'sub', title));
    const grid = h('div', 'theme-grid');
    items.forEach(it => {
      const ok = itemUnlocked(it), on = current.id === it.id;
      const b = h('button', 'theme-item' + (on ? ' on' : '') + (ok ? '' : ' locked'), ''); b.type = 'button'; b.setAttribute('aria-label', it.name + (ok ? '' : ' (khoá, cần Lv.' + it.lv + ')'));
      b.appendChild(previewFn(it)); b.appendChild(h('b', '', it.name)); b.appendChild(h('small', 'muted', ok ? (on ? '✓ Đang dùng' : 'Chọn') : '🔒 Lv.' + it.lv));
      b.addEventListener('click', () => {
        if (!ok) { showToast('🔒 Mở khoá ở Level ' + it.lv, 'warning'); return; }
        Data.settings[key] = it.id; saveData(); applyTheme(); SFX.play('select'); RENDERERS.themes();
      });
      grid.appendChild(b);
    });
    root.appendChild(grid);
  };
  sect('Mặt sau lá bài', CARD_BACKS, currentCardBack(), 'cardBack', it => { const i = h('img', 'theme-card'); i.alt = ''; i.src = cardBackUri(it); return i; });
  sect('Màu bàn chơi', TABLES, currentTable(), 'table', it => { const d = h('div', 'theme-felt'); d.style.background = 'radial-gradient(circle at 50% 40%,' + it.c[0] + ',' + it.c[1] + ')'; return d; });
};

/* ---------- Màn: Lịch sử ván ---------- */
RENDERERS.history = function () {
  const root = $('#history-body'); root.textContent = '';
  if (!Data.history.length) { root.appendChild(h('p', 'muted center', 'Chưa có ván nào. Hãy chơi một ván để bắt đầu lịch sử!')); return; }
  const wins = Data.history.filter(e => e.o === 'win').length;
  root.appendChild(h('p', 'muted', 'Gần đây: ' + Data.history.length + ' ván · ' + wins + ' thắng (' + Math.round(wins / Data.history.length * 100) + '%)'));
  Data.history.forEach(e => {
    const row = h('div', 'hist-row ' + e.o);
    row.appendChild(h('span', 'hist-ic', e.o === 'win' ? '🏆' : e.o === 'draw' ? '🤝' : '❌'));
    const t = h('div', 'hist-t'); t.appendChild(h('b', '', (GAME_META[e.g] ? GAME_META[e.g].name : e.g) + (e.tour ? ' · Giải đấu' : '') + (e.room ? ' · Phòng' : '')));
    t.appendChild(h('small', 'muted', fmtDate(e.t) + ' · vs ' + (e.opp || []).join(', ') + ' · ' + fmtTime(e.sec || 0)));
    row.appendChild(t); row.appendChild(h('span', 'hist-xp', '+' + (e.xp || 0) + ' XP')); root.appendChild(row);
  });
  const clr = h('button', 'btn small danger', 'Xoá lịch sử'); clr.type = 'button';
  clr.addEventListener('click', () => { Data.history = []; saveData(); RENDERERS.history(); });
  root.appendChild(clr);
};

/* ---------- Sao lưu / khôi phục dữ liệu ---------- */
function fallbackCopy(txt) {
  const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) { } ta.remove();
  showToast(ok ? 'Đã sao chép' : 'Hãy chọn tất cả rồi sao chép thủ công', ok ? 'success' : 'warning');
}
function copyText(txt) {
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => showToast('Đã sao chép', 'success')).catch(() => fallbackCopy(txt));
  else fallbackCopy(txt);
}
function exportDataModal() {
  const copy = JSON.parse(JSON.stringify(Data, cardReplacer)); copy.currentMatch = null;
  const txt = JSON.stringify(copy);
  const body = h('div', 'setup'); body.appendChild(h('p', 'muted', 'Sao chép đoạn mã dưới đây và cất giữ. Dùng "Nhập dữ liệu" trên máy khác để khôi phục.'));
  const ta = h('textarea', 'input ta'); ta.readOnly = true; ta.value = txt; ta.rows = 6; ta.setAttribute('aria-label', 'Dữ liệu sao lưu'); body.appendChild(ta);
  Modal.open({ title: '💾 Sao lưu dữ liệu', body, buttons: [{ text: 'Sao chép', cls: 'primary', keep: true, fn: () => { ta.select(); copyText(txt); } }, { text: 'Đóng' }] });
}
function importDataModal() {
  const body = h('div', 'setup'); body.appendChild(h('p', 'muted', 'Dán đoạn mã sao lưu vào đây. Dữ liệu hiện tại sẽ bị thay thế.'));
  const ta = h('textarea', 'input ta'); ta.rows = 6; ta.placeholder = '{"v":2,...}'; ta.setAttribute('aria-label', 'Dán dữ liệu sao lưu'); body.appendChild(ta);
  const err = h('p', 'err', ''); body.appendChild(err);
  Modal.open({
    title: '📥 Nhập dữ liệu', body, buttons: [
      { text: 'Huỷ' },
      { text: 'KHÔI PHỤC', cls: 'primary', keep: true, fn: m => {
        let obj = null;
        try { const v = ta.value.trim(); if (!v) throw new Error('empty'); if (v.length > 600000) throw new Error('big'); obj = JSON.parse(v); } catch (e) { err.textContent = 'Mã không hợp lệ hoặc quá lớn.'; return; }
        if (!obj || typeof obj !== 'object' || !obj.profile || !obj.statistics) { err.textContent = 'Đây không phải dữ liệu Card Master.'; return; }
        Match.abort(false); Data = sanitizeData(obj); Data.currentMatch = null; saveData(); applySettings(); Modal.close(m);
        navigateTo('home', { force: true }); showToast('Đã khôi phục dữ liệu', 'success');
      } }
    ]
  });
}

/* ---------- Phản ứng nhanh (emote) ---------- */
const EMOTES = ['😀', '😎', '👍', '😮', '😅', '😡', '😭', '🤔'];
const AI_EMOTES = { victim: ['😡', '😭', '😮'], chatter: ['😎', '😏', '😄'], win: ['😎', '🎉', '😄'], lose: ['😭', '😅', '🤔'], reply: ['😀', '👍', '😮', '😅', '😎'] };
function buildEmoteTray() {
  const tray = $('#emote-tray'); if (!tray || tray.dataset.built) return; tray.dataset.built = '1';
  EMOTES.forEach(em => { const b = h('button', 'emote-btn', em); b.type = 'button'; b.dataset.emote = em; b.setAttribute('aria-label', 'Phản ứng ' + em); tray.appendChild(b); });
  tray.addEventListener('click', e => {
    const b = e.target.closest('.emote-btn'); if (!b) return;
    tray.hidden = true; showEmote(0, b.dataset.emote); SFX.play('select');
    if (Match.running && Math.random() < 0.5) aiEmote(null, 'reply', 700 + rand(900));
  });
}
function showEmote(p, em) {
  const target = p === 0 ? $('#table') : (UI.seats[p] && UI.seats[p].root); if (!target) return;
  const e = h('div', 'emote' + (p === 0 ? ' me' : ''), em); target.appendChild(e); setTimeout(() => e.remove(), 1900);
}
function aiEmote(p, kind, delay) {
  if (!Match.running) return;
  if (p == null) { const ids = Object.keys(UI.seats); if (!ids.length) return; p = parseInt(pick(ids), 10); }
  if (!UI.seats[p]) return;
  Timers.set(() => { if (Match.running || kind === 'win' || kind === 'lose') showEmote(p, pick(AI_EMOTES[kind] || AI_EMOTES.reply)); }, delay || 300);
}

/* ---------- Sắp xếp bài ---------- */
const SORT_NAMES = ['Theo số', 'Theo chất', 'Theo bộ (đôi/ba/tứ)'];
function sortHand(cards) {
  const m = UI.sortMode | 0;
  if (m === 1) return cards.sort((a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || TL_IDX[a.rank] - TL_IDX[b.rank]);
  if (m === 2) { const cnt = {}; cards.forEach(c => { cnt[c.rank] = (cnt[c.rank] || 0) + 1; }); return cards.sort((a, b) => cnt[b.rank] - cnt[a.rank] || TL_IDX[b.rank] - TL_IDX[a.rank] || SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]); }
  return cards.sort((a, b) => tlPower(a) - tlPower(b));
}

/* ---------- Thống kê: biểu đồ thanh tỷ lệ thắng ---------- */
function buildStatBars() {
  const root = $('#stats-bars'); if (!root) return; root.textContent = '';
  root.appendChild(h('h3', 'sub', 'Tỷ lệ thắng theo game'));
  READY_GAMES.forEach(id => {
    const s = Data.statistics.games[id] || { played: 0, won: 0 }, pct = s.played ? Math.round(s.won / s.played * 100) : 0;
    const row = h('div', 'bar-row'); row.appendChild(h('span', 'bar-name', GAME_META[id].name));
    const bar = h('div', 'bar'); const f = h('i', ''); f.style.width = pct + '%'; bar.appendChild(f); row.appendChild(bar);
    row.appendChild(h('span', 'bar-pct', s.played ? pct + '%' : '—')); root.appendChild(row);
  });
}


/* ============================ 10c. MÀN HÌNH PHÒNG ============================ */
const RoomsUI = { built: false, page: 1, game: '', status: '', tq: '', rq: '' };
function buildRoomsControls() {
  const root = $('#rooms-body'); root.textContent = '';
  const bar = h('div', 'room-bar');
  const prev = h('button', 'btn small', '‹'); prev.type = 'button'; prev.setAttribute('aria-label', 'Phòng trước');
  const sel = h('select', 'input'); sel.id = 'room-select'; sel.setAttribute('aria-label', 'Chọn phòng');
  for (let r = 1; r <= Rooms.TOTAL; r++) { const o = h('option', '', Rooms.roomName(r)); o.value = r; sel.appendChild(o); }
  const next = h('button', 'btn small', '›'); next.type = 'button'; next.setAttribute('aria-label', 'Phòng sau');
  const refresh = h('button', 'btn small', '🔄'); refresh.type = 'button'; refresh.setAttribute('aria-label', 'Làm mới danh sách bàn');
  bar.appendChild(prev); bar.appendChild(sel); bar.appendChild(next); bar.appendChild(refresh); root.appendChild(bar);
  const rq = h('input', 'input'); rq.type = 'search'; rq.placeholder = '🔍 Tìm phòng (số hoặc tên)'; rq.setAttribute('aria-label', 'Tìm phòng');
  const chips = h('div', 'chips'); root.appendChild(rq); root.appendChild(chips);
  const f = h('div', 'room-filters');
  const gs = h('select', 'input'); gs.setAttribute('aria-label', 'Lọc game');
  const g0 = h('option', '', 'Mọi game'); g0.value = ''; gs.appendChild(g0);
  ROOM_GAMES.forEach(id => { const o = h('option', '', GAME_META[id].name); o.value = id; gs.appendChild(o); });
  const ss = h('select', 'input'); ss.setAttribute('aria-label', 'Lọc trạng thái');
  const s0 = h('option', '', 'Mọi trạng thái'); s0.value = ''; ss.appendChild(s0);
  Object.keys(Rooms.STATUS).forEach(k => { const o = h('option', '', Rooms.STATUS[k]); o.value = k; ss.appendChild(o); });
  const tq = h('input', 'input'); tq.type = 'search'; tq.placeholder = '🔍 Tìm bàn (số bàn / game)'; tq.setAttribute('aria-label', 'Tìm bàn');
  f.appendChild(gs); f.appendChild(ss); f.appendChild(tq); root.appendChild(f);
  const quick = h('button', 'btn primary big', '⚡ VÀO NHANH'); quick.type = 'button'; root.appendChild(quick);
  root.appendChild(h('p', 'muted small', '')).id = 'room-sum';
  const list = h('div', 'rooms-list'); list.id = 'rooms-list'; root.appendChild(list);
  const pager = h('nav', 'pager'); pager.id = 'rooms-pager'; pager.setAttribute('aria-label', 'Phân trang bàn'); root.appendChild(pager);

  const setRoom = r => { Data.rooms.room = clamp(r, 1, Rooms.TOTAL); RoomsUI.page = 1; saveData(); sel.value = Data.rooms.room; renderRoomsList(); };
  sel.addEventListener('change', () => setRoom(parseInt(sel.value, 10)));
  prev.addEventListener('click', () => setRoom(Data.rooms.room - 1)); next.addEventListener('click', () => setRoom(Data.rooms.room + 1));
  refresh.addEventListener('click', () => { Data.rooms.epoch = (Data.rooms.epoch + 1) % 1000003; saveData(); RoomsUI.page = 1; renderRoomsList(); showToast('Đã làm mới danh sách bàn', 'info'); });
  const renderChips = () => {
    chips.textContent = ''; const q = rq.value.trim(); if (!q) return;
    Rooms.findRooms(q).slice(0, 8).forEach(r => {
      const c = h('button', 'chip', Rooms.roomName(r)); c.type = 'button';
      c.addEventListener('click', () => { rq.value = ''; chips.textContent = ''; setRoom(r); }); chips.appendChild(c);
    });
    if (!chips.children.length) chips.appendChild(h('span', 'muted small', 'Không có phòng phù hợp'));
  };
  rq.addEventListener('input', renderChips);
  rq.addEventListener('keydown', e => { if (e.key === 'Enter') { const m = Rooms.findRooms(rq.value.trim()); if (m.length) { rq.value = ''; chips.textContent = ''; setRoom(m[0]); } } });
  gs.addEventListener('change', () => { RoomsUI.game = gs.value; RoomsUI.page = 1; renderRoomsList(); });
  ss.addEventListener('change', () => { RoomsUI.status = ss.value; RoomsUI.page = 1; renderRoomsList(); });
  tq.addEventListener('input', () => { RoomsUI.tq = tq.value; RoomsUI.page = 1; renderRoomsList(); });
  quick.addEventListener('click', () => {
    const all = Rooms.filtered(Data.rooms.room, { status: 'waiting' });
    if (!all.length) { showToast('Phòng này chưa có bàn chờ — thử làm mới 🔄', 'info'); return; }
    joinTable(pick(all));
  });
  RoomsUI.built = true;
}
function joinTable(inf) {
  if (inf.status !== 'waiting') { showToast('Bàn này không còn chỗ', 'warning'); return; }
  if (Data.currentMatch) { showToast('Hãy hoàn tất hoặc bỏ ván đang chơi trước', 'warning'); return; }
  Match.start(inf.game, { players: inf.max, aiLevel: inf.level, opponents: Rooms.opponentsFor(inf), room: { room: inf.room, table: inf.table } });
}
function pagerPages(cur, total) {
  const set = new Set([1, total, cur - 1, cur, cur + 1]); const arr = [...set].filter(x => x >= 1 && x <= total).sort((a, b) => a - b);
  const out = []; arr.forEach((x, i) => { if (i && x - arr[i - 1] > 1) out.push('…'); out.push(x); }); return out;
}
function renderRoomsList() {
  const room = Data.rooms.room, list = $('#rooms-list'), pager = $('#rooms-pager');
  $('#room-select').value = room;
  const all = Rooms.filtered(room, { game: RoomsUI.game, status: RoomsUI.status, tq: RoomsUI.tq });
  const pages = Math.max(1, Math.ceil(all.length / Rooms.PAGE)); RoomsUI.page = clamp(RoomsUI.page, 1, pages);
  const lv = Rooms.tier(room);
  $('#room-sum').textContent = Rooms.roomName(room) + ' · AI ' + LEVEL_ICONS[lv] + ' ' + LEVEL_NAMES[lv] + ' · ' + all.length + '/' + Rooms.TABLES + ' bàn khớp bộ lọc';
  list.textContent = '';
  all.slice((RoomsUI.page - 1) * Rooms.PAGE, RoomsUI.page * Rooms.PAGE).forEach(inf => { // chỉ dựng tối đa 12 bàn
    const m = GAME_META[inf.game], card = h('article', 'table-card st-' + inf.status);
    const ic = h('div', 'game-icon sm'); ic.innerHTML = gameIcon(m.icon);
    const info = h('div', 'game-info');
    info.appendChild(h('b', '', 'Bàn ' + inf.table + ' · ' + m.name));
    const meta = h('div', 'tags');
    meta.appendChild(h('span', 'tag', '👥 ' + inf.occ + '/' + inf.max)); meta.appendChild(h('span', 'tag st', Rooms.STATUS[inf.status]));
    if (inf.occ) meta.appendChild(h('span', 'tag', Rooms.occupants(inf).map(o => o.avatar).join(' ')));
    info.appendChild(meta);
    const b = h('button', 'btn small' + (inf.status === 'waiting' ? ' primary' : ''), inf.status === 'waiting' ? 'VÀO BÀN' : Rooms.STATUS[inf.status]); b.type = 'button';
    if (inf.status !== 'waiting') b.disabled = true; else b.addEventListener('click', () => joinTable(inf));
    card.appendChild(ic); card.appendChild(info); card.appendChild(b); list.appendChild(card);
  });
  if (!all.length) list.appendChild(h('p', 'muted center', 'Không có bàn nào khớp bộ lọc.'));
  pager.textContent = '';
  const mk = (txt, pg, on, label) => { const b = h('button', 'pg' + (on ? ' on' : ''), txt); b.type = 'button'; b.setAttribute('aria-label', label || ('Trang ' + txt)); if (pg == null) b.disabled = true; else b.addEventListener('click', () => { RoomsUI.page = pg; renderRoomsList(); }); pager.appendChild(b); };
  mk('‹', RoomsUI.page > 1 ? RoomsUI.page - 1 : null, false, 'Trang trước');
  pagerPages(RoomsUI.page, pages).forEach(x => x === '…' ? mk('…', null) : mk(String(x), x, x === RoomsUI.page));
  mk('›', RoomsUI.page < pages ? RoomsUI.page + 1 : null, false, 'Trang sau');
}
RENDERERS.rooms = function () { if (!RoomsUI.built) buildRoomsControls(); renderRoomsList(); };


/* ============================ 11. MÀN HÌNH CHƠI ============================ */
function viewport() { return { w: window.innerWidth, h: window.innerHeight }; }
function setAppHeight() { document.documentElement.style.setProperty('--app-h', window.innerHeight + 'px'); }
function safeInsets() {
  const cs = getComputedStyle(document.documentElement);
  const g = n => parseFloat(cs.getPropertyValue(n)) || 0;
  return { top: g('--sat'), right: g('--sar'), bottom: g('--sab'), left: g('--sal') };
}
function buildPlayScreen() {
  const gs = gameState, eng = Match.engine;
  $('#play-title').textContent = GAME_META[gs.currentGame].name;
  const seats = $('#seats'); seats.textContent = ''; UI.seats = {};
  gs.players.forEach((p, i) => {
    if (i === 0) return;
    const s = h('div', 'seat'); s.dataset.p = i;
    s.appendChild(h('div', 'seat-av', p.avatar));
    const t = h('div', 'seat-txt'); t.appendChild(h('b', 'seat-name', p.name)); t.appendChild(h('small', 'seat-ct', p.flag + ' ' + p.country)); s.appendChild(t);
    const cnt = h('div', 'seat-count'); s.appendChild(cnt);
    const warn = h('div', 'seat-warn', ''); s.appendChild(warn);
    const sc = h('div', 'seat-cards'); s.appendChild(sc);
    seats.appendChild(s); UI.seats[i] = { root: s, cnt, warn, sc };
  });
  if (eng.kind === 'bj') {
    const dl = h('div', 'seat dealer-seat'); dl.appendChild(h('div', 'seat-av', DEALER_PLAYER.avatar));
    const t = h('div', 'seat-txt'); t.appendChild(h('b', 'seat-name', 'Nhà cái')); t.appendChild(h('small', 'seat-ct', '')); dl.appendChild(t);
    UI.dealerSeat = dl;
  } else UI.dealerSeat = null;
  seats.className = 'n' + (gs.players.length - 1);
  UI.selected.clear(); UI.lastTableKey = ''; UI.handKey = ''; UI.dealerWasHidden = false; UI.dealerPrevCount = 0;
  $('#table-cards').textContent = ''; $('#hand').textContent = ''; $('#table-cards').className = eng.tableView ? 'rows' : '';
  const rt = $('#raise-tray'); if (rt) rt.hidden = true; const et = $('#emote-tray'); if (et) et.hidden = true;
  $('#screen-play').dataset.kind = eng.kind;
  $('#screen-play').classList.remove('win-glow');
}
function playMetrics() {
  const v = viewport(), landscape = v.w > v.h;
  return { v, landscape, handH: Math.round(clamp(v.h * (landscape ? (v.h < 400 ? 0.34 : 0.4) : 0.27), 118, 168)) };
}
/* Tính lại bố cục — gọi khi resize / xoay máy, không reset ván */
function layoutPlay() {
  if (UI.screen !== 'play' || !Match.running) return;
  const m = playMetrics(), wrap = $('#hand-wrap');
  wrap.style.height = m.handH + 'px';
  layoutHand(); layoutTable();
}
function layoutHand() {
  const wrap = $('#hand-wrap'), hand = $('#hand'); if (!wrap || !hand) return;
  const n = hand.children.length; if (!n) return;
  const L = calculateHandLayout({
    mode: 'row', viewportWidth: wrap.clientWidth - 12, viewportHeight: wrap.clientHeight - 22, cardCount: n, cardWidth: 86, gap: 6, minStep: 22,
    orientation: playMetrics().landscape ? 'landscape' : 'portrait'
  });
  hand.style.setProperty('--cw', L.cardWidth + 'px'); hand.style.setProperty('--ch', L.cardHeight + 'px'); hand.style.setProperty('--ov', L.overlap + 'px');
  hand.style.gap = '0px'; hand.style.width = (L.totalWidth + 2) + 'px';
}
function layoutTable() {
  const box = $('#table-cards'); if (!box) return;
  const n = box.children.length; if (!n) return;
  if (box.classList.contains('rows')) { layoutRows(box); return; }
  const L = calculateHandLayout({ mode: 'row', viewportWidth: box.clientWidth - 8, viewportHeight: box.clientHeight - 6, cardCount: n, cardWidth: 74, gap: 5, minStep: 18 });
  box.style.setProperty('--cw', L.cardWidth + 'px'); box.style.setProperty('--ch', L.cardHeight + 'px'); box.style.setProperty('--ov', L.overlap + 'px'); box.style.gap = '0px';
}
/* Bố cục nhiều hàng bài trên bàn (Mậu Binh, Poker, Phỏm...) — mỗi hàng một dải chồng nhẹ */
function layoutRows(box) {
  const rows = $$('.t-row', box); if (!rows.length) return;
  const rowH = Math.max(30, Math.floor((box.clientHeight - 4) / rows.length) - 8);
  rows.forEach(r => {
    const n = $$('.card, .t-slot', r).length || 1;
    const L = calculateHandLayout({ mode: 'row', viewportWidth: box.clientWidth - 70, viewportHeight: rowH, cardCount: n, cardWidth: 58, gap: 4, minStep: 16 });
    r.style.setProperty('--cw', L.cardWidth + 'px'); r.style.setProperty('--ch', L.cardHeight + 'px'); r.style.setProperty('--ov', L.overlap + 'px');
  });
}
function renderHand() {
  const gs = gameState, hand = $('#hand'), eng = Match.engine;
  let items;
  if (eng.handView) items = eng.handView().cards;
  else if (eng.kind === 'shed') items = sortHand(gs.hands[0].slice()).map(c => ({ card: c, down: false }));
  else items = gs.hands[0].reduce((a, x) => a.concat(x.cards), []).map(c => ({ card: c, down: false }));
  const key = items.map(x => (x.down ? 'x' : x.card.id)).join(',');
  const sel = UI.selected;
  [...sel].forEach(id => { if (!items.some(x => !x.down && x.card.id === id)) sel.delete(id); });
  if (key === UI.handKey) { $$('.card', hand).forEach(e => e.classList.toggle('selected', !!e.dataset.id && sel.has(e.dataset.id))); return false; }
  UI.handKey = key; hand.textContent = '';
  items.forEach(x => {
    const e = createCardElement(x.card, { tag: 'button', faceDown: x.down }); e.classList.add('hand-card');
    if (x.down) e.classList.add('down'); else if (sel.has(x.card.id)) e.classList.add('selected');
    hand.appendChild(e);
  });
  layoutHand();
  return true;
}
/* Ghế AI cho các game dùng seatView (Poker, Liêng, Phỏm...) */
function renderSeatsGeneric() {
  const gs = gameState, eng = Match.engine;
  gs.players.forEach((p, i) => {
    if (i === 0) return; const s = UI.seats[i]; if (!s) return;
    s.root.classList.toggle('turn', gs.turn === i && !gs.over);
    const v = eng.seatView(i);
    s.cnt.textContent = v.cnt || ''; s.warn.textContent = (v.name ? v.name + ' · ' : '') + (v.warn || ''); s.warn.classList.toggle('alert', !!v.alert);
    s.sc.textContent = '';
    (v.rows || []).forEach(r => { const row = h('div', 'mini-row'); r.forEach(x => row.appendChild(createCardElement(x.card, { faceDown: x.down }))); s.sc.appendChild(row); });
  });
}
/* Bàn chơi nhiều hàng (Mậu Binh, Poker, Phỏm, Rummy...) */
function renderTableGeneric() {
  const eng = Match.engine, box = $('#table-cards'), info = $('#table-info'), v = eng.tableView();
  info.textContent = v.info || ''; box.classList.add('rows'); box.textContent = '';
  (v.rows || []).forEach(r => {
    const row = h('div', 't-row' + (r.tap ? ' tap' : '')); if (r.tapKey != null) row.dataset.key = r.tapKey;
    if (r.label) { const l = h('div', 't-lbl'); l.textContent = r.label; l.style.whiteSpace = 'pre-line'; row.appendChild(l); }
    const cs = h('div', 't-cards');
    r.cards.forEach(x => cs.appendChild(createCardElement(x.card, { faceDown: x.down, tag: r.tap && !x.down ? 'button' : 'div' })));
    for (let k = 0; k < (r.slots || 0); k++) cs.appendChild(h('div', 't-slot'));
    row.appendChild(cs); box.appendChild(row);
  });
  layoutRows(box);
}
function renderSeats() {
  const gs = gameState, eng = Match.engine;
  if (eng.seatView) { renderSeatsGeneric(); return; }
  gs.players.forEach((p, i) => {
    if (i === 0) return; const s = UI.seats[i]; if (!s) return;
    const myTurn = gs.turn === i && !gs.over;
    s.root.classList.toggle('turn', myTurn);
    if (eng.kind === 'shed') {
      const n = gs.hands[i].length;
      s.cnt.textContent = '🂠 ' + n;
      s.warn.textContent = n === 1 ? '⚠️ CÒN 1 LÁ' : (gs.passed[i] && gs.lastPlay ? 'Bỏ lượt' : '');
      s.warn.classList.toggle('alert', n === 1);
      s.sc.textContent = '';
    } else {
      s.sc.textContent = '';
      const hs = gs.hands[i];
      hs.forEach((hd, hi) => {
        const row = h('div', 'mini-row' + (myTurn && gs.handIdx === hi ? ' active' : ''));
        const reveal = gs.currentGame === 'blackjack' || gs.over;
        hd.cards.forEach(c => row.appendChild(createCardElement(c, { faceDown: !reveal })));
        if (reveal) row.appendChild(h('span', 'mini-total', gs.currentGame === 'blackjack' ? String(bjValue(hd.cards).total) : xdClassify(hd.cards).name));
        s.sc.appendChild(row);
      });
      s.cnt.textContent = ''; const showBust = gs.currentGame === 'blackjack' || gs.over; s.warn.textContent = (showBust && hs[0].bust) ? 'Quắc' : (hs.every(x => x.done) ? 'Dằn' : '');
      s.warn.classList.remove('alert');
    }
  });
}
function renderTable(fromRects) {
  const gs = gameState, eng = Match.engine, box = $('#table-cards'), info = $('#table-info');
  if (eng.tableView) { renderTableGeneric(); return; }
  if (eng.kind === 'shed') {
    const lp = gs.lastPlay;
    const key = lp ? lp.cards.map(c => c.id).join(',') : '';
    if (key !== UI.lastTableKey) {
      UI.lastTableKey = key; box.textContent = '';
      if (lp) {
        lp.cards.forEach(c => box.appendChild(createCardElement(c)));
        layoutTable();
        if (fromRects) $$('.card', box).forEach((e, i) => flyEl(e, fromRects[e.dataset.id] || fromRects._default, { dur: 320, delay: i * 25, rot: -12, scale: 0.7 }));
      }
    }
    const typeNames = { single: 'Lẻ', pair: 'Đôi', triple: 'Bộ ba', quad: 'Tứ quý', straight: 'Sảnh', dthong: 'Đôi thông' };
    if (lp) info.textContent = gs.players[lp.player].name + ' đánh: ' + typeNames[lp.combo.type] + (lp.combo.type === 'straight' || lp.combo.type === 'dthong' ? ' ' + lp.combo.len : '');
    else info.textContent = gs.bao && gs.bao.active ? '💥 ' + gs.players[gs.bao.player].name + ' báo Sâm!' : (gs.round > 0 || gs.turn === 0 ? 'Vòng mới — ' + gs.players[gs.turn].name + ' đánh tự do' : 'Chờ ' + gs.players[gs.turn].name + ' đánh');
    if (gs.bao && gs.bao.active && lp) info.textContent += ' · 💥 Báo Sâm: ' + gs.players[gs.bao.player].name;
    $('#screen-play').dataset.alert = '';
  } else { // bj / xì dách: hiển thị bài nhà cái
    const d = gs.dealer; box.textContent = '';
    const justRevealed = UI.dealerWasHidden && !d.hidden;
    d.cards.forEach((c, i) => {
      const wasBack = gs.currentGame === 'xiDach' || i === 1;
      const hidden = d.hidden && wasBack;
      const el = createCardElement(c, { faceDown: hidden || (justRevealed && wasBack && i < UI.dealerPrevCount) });
      box.appendChild(el);
      if (justRevealed && wasBack && i < UI.dealerPrevCount) setTimeout(() => flipEl(el, getCardImage(c)), 80 + i * 120);
    });
    UI.dealerWasHidden = d.hidden; UI.dealerPrevCount = d.cards.length;
    layoutTable();
    if (gs.currentGame === 'blackjack') info.textContent = d.hidden ? 'Nhà cái: ' + bjCardVal(d.cards[0]) + ' + ?' : 'Nhà cái: ' + bjValue(d.cards).total;
    else info.textContent = d.hidden ? 'Nhà cái (' + d.cards.length + ' lá) — bài úp' : 'Nhà cái: ' + xdClassify(d.cards).name;
  }
}
function renderMyInfo() {
  const gs = gameState, el = $('#my-info'); if (!el) return;
  if (Match.engine.myInfo) { el.textContent = Match.engine.myInfo(); el.classList.remove('alert'); return; }
  if (Match.engine.kind === 'bj') {
    const hs = gs.hands[0];
    if (gs.currentGame === 'blackjack') el.textContent = hs.map((hd, i) => (hs.length > 1 ? (i === gs.handIdx && gs.turn === 0 ? '▶ Bài ' : 'Bài ') + (i + 1) + ': ' : 'Điểm: ') + bjValue(hd.cards).total + (hd.doubled ? ' (x2)' : '') + (hd.bust ? ' — QUẮC' : '')).join('  |  ');
    else el.textContent = 'Bạn: ' + xdClassify(hs[0].cards).name;
  } else {
    const n = gs.hands[0].length; el.textContent = n === 1 ? '⚠️ CÒN 1 LÁ' : n + ' lá';
    el.classList.toggle('alert', n === 1);
  }
}
function renderActions() {
  const gs = gameState, eng = Match.engine, bar = $('#action-bar'), myTurn = Match.humanTurn();
  bar.textContent = '';
  const mk = (txt, act, cls, dis) => { const b = h('button', 'btn ' + (cls || ''), txt); b.type = 'button'; b.dataset.action = act; if (dis) b.disabled = true; bar.appendChild(b); return b; };
  if (gs.over || gs.phase === 'bao') return;
  if (eng.actionsView) { eng.actionsView(myTurn).forEach(a => { const b = mk(a.txt, a.act, a.cls, a.dis); if (a.data) Object.keys(a.data).forEach(k => { b.dataset[k] = a.data[k]; }); }); return; }
  if (eng.kind === 'shed') {
    const moves = myTurn ? eng.getValidMoves(0) : [];
    const canPass = moves.some(m => m.type === 'pass');
    const sb = mk('↕', 'sort', 'sortbtn'); sb.setAttribute('aria-label', 'Sắp xếp bài (' + SORT_NAMES[UI.sortMode | 0] + ')');
    mk('GỢI Ý', 'hint', '', !myTurn);
    mk('BỎ LƯỢT', 'pass', '', !myTurn || !canPass);
    mk('ĐÁNH', 'play', 'primary', !myTurn);
  } else {
    const mv = myTurn ? eng.getValidMoves(0).map(m => m.type) : [];
    if (gs.currentGame === 'blackjack') {
      mk('HIT', 'bj-hit', 'primary', !mv.includes('hit')); mk('STAND', 'bj-stand', '', !mv.includes('stand'));
      if (mv.includes('double')) mk('DOUBLE', 'bj-double'); if (mv.includes('split')) mk('SPLIT', 'bj-split');
    } else { mk('RÚT (HIT)', 'bj-hit', 'primary', !mv.includes('hit')); mk('DẰN (STAND)', 'bj-stand', '', !myTurn); }
  }
}
function renderTurn() {
  const gs = gameState, el = $('#turn-label'); if (!el) return;
  if (gs.over) { el.textContent = 'KẾT THÚC'; return; }
  if (gs.phase === 'bao') { el.textContent = 'BÁO SÂM?'; return; }
  if (Match.engine.kind === 'bj' && Match.engine.isDealerTurn()) { el.textContent = 'LƯỢT NHÀ CÁI'; return; }
  const p = gs.players[gs.turn]; el.textContent = Match.humanTurn() ? 'LƯỢT CỦA BẠN' : 'LƯỢT CỦA ' + p.name.toUpperCase();
  el.classList.toggle('mine', Match.humanTurn());
}
function renderBoard(fromRects) {
  renderSeats(); renderTable(fromRects); renderHand(); renderMyInfo(); renderTurn(); renderActions();
}
function dealSounds() { // tiếng chia bài: mỗi lá một tiếng, nhịp theo animation
  const n = clamp($$('#hand .card').length + (gameState.players ? gameState.players.length : 0), 4, 14);
  for (let k = 0; k < n; k++) setTimeout(() => SFX.play('deal'), 40 + k * 45);
}
function animateDeal() {
  dealSounds();
  const deck = $('#deck-pile'); if (!deck || !canAnimate()) return 0;
  const from = rectCenter(deck); let i = 0;
  $$('#hand .card').forEach(e => { flyEl(e, from, { dur: 380, delay: i * 45, rot: -25, scale: 0.4 }); i++; });
  const total = Math.min(i, 13);
  Object.keys(UI.seats).forEach(k => { const a = $('.seat-av', UI.seats[k].root); if (a && a.animate) a.animate([{ transform: 'scale(.8)' }, { transform: 'scale(1)' }], { duration: 260, delay: k * 80 }); });
  $$('#table-cards .card, .mini-row .card').forEach((e, j) => flyEl(e, from, { dur: 360, delay: 120 + j * 55, rot: 20, scale: 0.4 }));
  return total * 45 + 420;
}
function collectTable(done) {
  const box = $('#table-cards'), deck = $('#deck-pile'); const els = $$('.card', box);
  if (!els.length || !canAnimate() || !deck) { done(); return; }
  const to = rectCenter(deck);
  els.forEach(e => { const c = rectCenter(e); try { e.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(' + (to.x - c.x) + 'px,' + (to.y - c.y) + 'px) scale(.4)', opacity: 0 }], { duration: 260, fill: 'forwards' }); } catch (er) { } });
  setTimeout(done, 270);
}

/* ============================ 12. ĐIỀU KHIỂN VÁN CHƠI ============================ */
const Match = {
  running: false, gameId: null, engine: null, startedAt: 0, elapsedBefore: 0, busy: false, token: 0,
  humanTurn() { const gs = gameState; if (this.running && this.engine && this.engine.humanTurn) return this.engine.humanTurn(); return this.running && !gs.over && gs.phase === 'play' && gs.turn === 0 && !(this.engine.kind === 'bj' && this.engine.isDealerTurn()); },
  start(gameId, extra) {
    if (GAME_META[gameId] && GAME_META[gameId].kind === 'solo') { Solo.start(gameId); return; }
    extra = extra || {};
    try {
      Modal.closeAll(); this.cleanup();
      this.gameId = gameId; this.engine = GAME_ENGINES[gameId]; this.running = true;
      this.extra = extra; this.tour = !!extra.tour; this.roomCtx = extra.room || null; this._wasHuman = false;
      this.startedAt = Date.now(); this.elapsedBefore = 0; this.token++;
      NEXT_OPP = extra.opponents || null; LEVEL_OVERRIDE = extra.aiLevel != null ? extra.aiLevel : null;
      try { this.engine.setup({ players: extra.players || Data.settings.players[gameId] || GAME_META[gameId].defP }); }
      finally { NEXT_OPP = null; LEVEL_OVERRIDE = null; }
      gameState.settings = JSON.parse(JSON.stringify({ turnTime: Data.settings.turnTime, aiLevel: Data.settings.aiLevel }));
      this.engine.deal();
      Data.currentGame = gameId;
      navigateTo('play', { noStack: false });
      setAppHeight(); buildPlayScreen(); layoutPlayInit();
      renderBoard();
      this.persist();
      const delay = animateDeal(); UI.lock = true; const tk = this.token;
      Timers.set(() => { if (tk !== this.token) return; UI.lock = false; this.afterDeal(); }, delay + 60);
    } catch (e) { this.running = false; this.tour = false; handleError(e); navigateTo('home', { force: true }); }
  },
  afterDeal() {
    const gs = gameState;
    if (gs.over) { this.finish(); return; }
    if (gs.phase === 'bao') { this.baoPhase(); return; }
    this.advance();
  },
  baoPhase() {
    const gs = gameState, tk = this.token;
    renderBoard();
    let done = false;
    const decide = yes => {
      if (done || tk !== this.token) return; done = true; TurnTimer.stopTimer();
      const eng = this.engine;
      if (yes) { eng.declareBao(0); showToast('💥 Bạn báo Sâm! Phải thắng mọi vòng', 'warning'); }
      else { const who = eng.aiBaoCheck(); if (who > 0) { showToast('💥 ' + gs.players[who].name + ' BÁO SÂM — hãy chặn!', 'warning'); } }
      gs.phase = 'play'; this.persist(); this.advance();
    };
    const m = Modal.open({
      title: '💥 Báo Sâm?', closable: false,
      body: 'Báo Sâm = phải đi hết 10 lá mà không ai chặn được. Chặn thành công thì người báo thua. Có chắc bài mạnh không?',
      buttons: [{ text: 'Không báo', fn: () => decide(false) }, { text: 'BÁO SÂM', cls: 'primary', fn: () => decide(true) }]
    });
    this.baoModal = m;
    TurnTimer.stopTimer();
    // hết giờ → không báo
    const tt = Timers.set(() => { if (!done) { Modal.close(m); decide(false); } }, Math.max(8, gs.settings.turnTime) * 1000);
  },
  advance() {
    if (!this.running) return;
    const gs = gameState, eng = this.engine, tk = this.token;
    if (gs.over) { this.finish(); return; }
    if (gs.newRound) { gs.newRound = false; }
    renderBoard();
    if (eng.isStuck && eng.isStuck(gs.turn)) { // chỉ còn toàn quân 2 mà phải đánh tự do → thối 2
      const sp = gs.turn; TurnTimer.stopTimer(); eng.forceThoi(sp); renderBoard();
      showBanner(gs.players[sp].name + ' — THỐI 2!', 'thoi', 1800); SFX.play('chat'); this.persist();
      Timers.set(() => this.finish(), 1300); return;
    }
    if (eng.kind === 'bj' && eng.isDealerTurn()) { this._wasHuman = false; this.dealerLoop(); return; }
    if (this.humanTurn()) {
      if (!this._wasHuman) turnEffect();
      this._wasHuman = true;
      const tl = gs.settings ? gs.settings.turnTime : Data.settings.turnTime;
      TurnTimer.startTimer(eng.timeLimit ? eng.timeLimit(tl) : tl, () => this.humanTimeout());
    } else {
      this._wasHuman = false;
      TurnTimer.stopTimer();
      const p = gs.turn, lv = gs.players[p].level;
      const wait = Math.round((650 + rand(650) + (lv >= 2 ? 150 : 0)) * [1.6, 1, 0.45][Data.settings.aiSpeed == null ? 1 : Data.settings.aiSpeed]);
      Timers.set(() => { if (tk === this.token) this.aiAct(p); }, wait);
    }
  },
  aiAct(p) {
    if (!this.running || gameState.over || gameState.turn !== p) return;
    const eng = this.engine, gs = gameState; let mv = null;
    try { mv = eng.aiChoose(p, gs.players[p].level); } catch (e) { console.error(e); }
    let v = mv ? eng.validateMove(p, mv) : { ok: false };
    if (!v.ok) { // AI luôn phải qua validateMove — lỗi thì dùng nước hợp lệ dự phòng
      try { mv = eng.timeoutMove(p); v = eng.validateMove(p, mv); } catch (e) { v = { ok: false }; }
      if (!v.ok) { const all = eng.getValidMoves(p); mv = all[0]; v = mv ? eng.validateMove(p, mv) : { ok: false }; }
      if (!v.ok) { console.error('AI không có nước đi hợp lệ'); gs.turn = gs.turn; this.afterMove(); return; }
    }
    this.commit(p, mv);
  },
  humanTimeout() {
    if (!this.running || !this.humanTurn()) return;
    showToast('⏰ Hết giờ — tự động chọn nước đi', 'warning');
    let mv = this.engine.timeoutMove(0), v = this.engine.validateMove(0, mv);
    if (!v.ok) { const all = this.engine.getValidMoves(0); mv = all[0]; }
    if (mv) { UI.selected.clear(); this.commit(0, mv); } else this.afterMove();
  },
  humanMove(mv) {
    if (!this.humanTurn() || UI.lock) return;
    const v = this.engine.validateMove(0, mv);
    if (!v.ok) { showToast('⚠️ Nước đi không hợp lệ — ' + (v.reason || ''), 'warning'); vibrate(40); return; }
    if (!v.free) TurnTimer.stopTimer(); UI.selected.clear(); this.commit(0, mv, v);
  },
  commit(p, mv, vres) {
    const eng = this.engine, gs = gameState;
    // ghi nhận vị trí xuất phát của bài để làm animation bay
    const rects = {};
    if (mv.type === 'play' && mv.cards) {
      if (p === 0) mv.cards.forEach(id => { const e = $('#hand .card[data-id="' + id + '"]'); if (e) rects[id] = rectCenter(e); });
      const seat = UI.seats[p] ? $('.seat-av', UI.seats[p].root) : null;
      rects._default = seat ? rectCenter(seat) : rectCenter($('#hand'));
    }
    const prevCombo = gs.lastPlay ? gs.lastPlay.combo : null, prevPlayer = gs.lastPlay ? gs.lastPlay.player : -1;
    const info = eng.play(p, mv);
    if (info.type === 'play') {
      SFX.play('card');
      if (prevCombo && eng.kind === 'shed' && !(info.combo.type === prevCombo.type && info.combo.len === prevCombo.len)) {
        setTimeout(() => chatEffect(prevCombo, info.combo, p), 90);
        if (p === 0) Missions.event('chat');
        if (prevPlayer > 0 && Math.random() < 0.6) aiEmote(prevPlayer, 'victim', 900 + rand(500));
        if (p > 0 && Math.random() < 0.4) aiEmote(p, 'chatter', 1000 + rand(500));
      }
    }
    else if (info.type === 'pass') { showToast(gs.players[p].name + ' bỏ lượt', 'info', { silent: true }); }
    else if (eng.kind === 'bj') SFX.play('card');
    if (info.sfx) SFX.play(info.sfx);
    renderBoard(rects);
    if (info.type === 'hit' || info.type === 'double' || info.type === 'split' || info.type === 'dealerHit') {
      const hand = p === 0 && info.type !== 'dealerHit' ? $$('#hand .card') : [];
      const last = hand[hand.length - 1]; if (last) flyEl(last, rectCenter($('#deck-pile')), { dur: 320, rot: 15, scale: 0.5 });
    }
    if (vres && vres.free) { this.persist(); return; } // nước đi tự do: vẫn là lượt của bạn
    this.afterMove(info);
  },
  afterMove() {
    if (!this.running) return;
    const gs = gameState, eng = this.engine;
    if (gs.over) { this.persist(); Timers.set(() => this.finish(), 600); return; }
    const wasLead = gs.lastPlay;
    eng.nextTurn();
    if (gs.newRound && eng.kind === 'shed') { // thu bài về chồng rồi vòng mới
      gs.newRound = false; this.persist(); SFX.play('eat'); // ăn bài: thu bài về
      const tk = this.token; UI.lock = true;
      Timers.set(() => collectTable(() => { if (tk !== this.token) return; UI.lock = false; UI.lastTableKey = '__x'; $('#table-cards').textContent = ''; UI.lastTableKey = ''; this.advance(); }), 450);
      return;
    }
    this.persist();
    Timers.set(() => this.advance(), 120);
  },
  dealerLoop() {
    const tk = this.token, eng = this.engine, gs = gameState;
    TurnTimer.stopTimer(); renderBoard();
    const firstReveal = gs.dealer.hidden;
    const step = () => {
      if (tk !== this.token || !this.running) return;
      const wasHidden = gs.dealer.hidden;
      const r = eng.dealerStep();
      if (wasHidden) { const els = $$('#table-cards .card.back'); }
      renderBoard();
      if (r.type === 'dealerHit') { SFX.play('card'); const last = $$('#table-cards .card').pop(); if (last) flyEl(last, rectCenter($('#deck-pile')), { dur: 320, rot: 10, scale: 0.5 }); }
      if (gs.over) { this.persist(); Timers.set(() => this.finish(), 800); return; }
      this.persist(); Timers.set(step, 900);
    };
    Timers.set(step, firstReveal ? 600 : 300);
  },
  finish() {
    if (!this.running) return;
    const gs = gameState, eng = this.engine; TurnTimer.stopTimer(); Timers.clearAll(); UI.lock = false;
    const tk = this.token;
    let res; try { res = eng.calculateResult(); } catch (e) { handleError(e); this.abort(true); navigateTo('home', { force: true }); return; }
    if (this.tour && eng.kind === 'bj' && gs.over && gs.over.results && gs.over.results[1]) { // giải đấu Blackjack/Xì Dách: so điểm với đối thủ
      const na = gs.over.results[0].net, nb = gs.over.results[1].net;
      res.outcome = na > nb ? 'win' : na < nb ? 'lose' : 'draw'; res.headline = res.outcome === 'win' ? '⚔️ THẮNG ĐỐI THỦ' : res.outcome === 'lose' ? null : '🤝 HÒA ĐỐI THỦ';
    }
    // phơi bài tất cả để xem kết quả (bj đã mở)
    const seconds = this.elapsedBefore + (Date.now() - this.startedAt) / 1000;
    const diff = gs.players.slice(1).reduce((a, p) => a + Math.max(0, p.level), 0) / Math.max(1, gs.players.length - 1);
    const specials = res.specials.slice();
    if (res.outcome === 'win' && eng.kind === 'shed' && gs.players.length > 1 && gs.players.slice(1).every(p => p.level === 3)) specials.push('beatHard');
    recordMatch(this.gameId, res.outcome, seconds);
    const isTour = this.tour;
    const xp = calcXP(res.outcome, Math.round(diff), Data.statistics.streak, specials.filter(s => ['trang', 'baoSamOk', 'chanSam', 'blackjack', 'xibang', 'nguLinh', 'quad'].includes(s)).length);
    const before = Data.level; const add = addXP(xp);
    pushHistory({ t: Date.now(), g: this.gameId, o: res.outcome, xp: add.amount, opp: gs.players.slice(1, 4).map(p => p.name), tour: !!isTour, room: !!this.roomCtx, sec: Math.round(seconds) });
    Missions.onMatch(this.gameId, res.outcome, { tour: !!isTour, room: !!this.roomCtx, hard: gs.players.slice(1).some(p => p.level === 3) });
    const ach = checkAchievements(specials);
    Data.currentMatch = null; Data.currentGame = null; saveData();
    this.running = false; this.token++;
    let tourNote = '';
    if (isTour) { try { tourNote = Tour.report(res.outcome); } catch (e) { handleError(e); } this.tour = false; }
    renderBoard(); // trạng thái cuối
    if (res.outcome === 'win') { SFX.play('win'); confetti(); vibrate([60, 40, 60]); $('#screen-play').classList.add('win-glow'); } else if (res.outcome === 'lose') { SFX.play('lose'); vibrate(160); } else SFX.play('notification');
    if (gs.over && gs.over.winner > 0 && eng.kind === 'shed') aiEmote(gs.over.winner, 'win', 500);
    Timers.set(() => { showResult(res, add, ach, before, isTour ? (tourNote || 'Trận giải đấu') : null); }, res.outcome === 'win' ? 700 : 450);
  },
  persist() {
    try {
      if (!this.running) return;
      const snap = JSON.parse(JSON.stringify(gameState, cardReplacer));
      Data.currentMatch = { gameId: this.gameId, state: snap, elapsed: this.elapsedBefore + (Date.now() - this.startedAt) / 1000, savedAt: Date.now(), tour: !!this.tour, room: this.roomCtx || null, extra: this.extra ? { players: this.extra.players, aiLevel: this.extra.aiLevel, opponents: this.extra.opponents, room: this.extra.room } : null };
      saveData();
    } catch (e) { /* lưu lỗi không được làm hỏng ván */ }
  },
  leave() { // thoát nhưng giữ ván
    if (this.running) { this.persist(); }
    this.cleanup();
  },
  abort(clear) {
    if (Data.currentMatch && Data.currentMatch.solo) { Solo.abort(clear); return; }
    const forfeit = clear && ((this.running && this.tour) || (Data.currentMatch && Data.currentMatch.tour));
    this.cleanup();
    if (clear) { Data.currentMatch = null; Data.currentGame = null; saveData(); }
    if (forfeit) { try { Tour.report(false); } catch (e) { handleError(e); } this.tour = false; showToast('Bỏ ván giải đấu — tính là thua trận này', 'warning'); }
  },
  cleanup() {
    if (this.baoModal) { try { Modal.close(this.baoModal); } catch (e) { } this.baoModal = null; }
    this.token++; this.running = false; TurnTimer.stopTimer(); Timers.clearAll(); UI.lock = false;
  },
  resume() {
    if (Data.currentMatch && Data.currentMatch.solo) { Solo.resume(); return; }
    const cm = Data.currentMatch;
    try {
      if (!cm || !GAME_ENGINES[cm.gameId]) throw new Error('Không có ván để tiếp tục');
      Modal.closeAll(); this.cleanup();
      gameState = Object.assign(newGameState(), JSON.parse(JSON.stringify(cm.state), cardReviver));
      this.gameId = cm.gameId; this.engine = GAME_ENGINES[cm.gameId]; this.running = true;
      this.tour = !!cm.tour; this.roomCtx = cm.room || null; this.extra = cm.extra || {}; this._wasHuman = false;
      this.startedAt = Date.now(); this.elapsedBefore = cm.elapsed || 0;
      navigateTo('play'); setAppHeight(); buildPlayScreen(); layoutPlayInit(); renderBoard();
      if (gameState.over) { this.finish(); return; }
      if (gameState.phase === 'bao') { this.baoPhase(); return; }
      this.advance();
    } catch (e) { this.running = false; Data.currentMatch = null; saveData(); handleError(e); navigateTo('home', { force: true }); }
  }
};
function layoutPlayInit() { const m = playMetrics(); $('#hand-wrap').style.height = m.handH + 'px'; }

function showResult(res, add, ach, levelBefore, tourNote) {
  const gs = gameState, body = h('div', 'result');
  const head = res.outcome === 'win' ? '🏆 CHIẾN THẮNG!' : res.outcome === 'lose' ? 'Thua rồi' : 'Hòa';
  if (res.headline) body.appendChild(h('div', 'res-headline', res.headline));
  if (tourNote) body.appendChild(h('div', 'res-tour', '🏆 Giải đấu: ' + tourNote));
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  res.rankings.forEach((r, i) => {
    const p = gs.players[r.p]; const row = h('div', 'res-row' + (r.p === 0 ? ' me' : ''));
    row.appendChild(h('span', 'res-medal', medals[i] || String(i + 1)));
    row.appendChild(h('span', 'res-name', p.avatar + ' ' + p.name));
    row.appendChild(h('small', 'res-detail', r.label || '')); body.appendChild(row);
  });
  if (res.dealerValue != null) body.appendChild(h('p', 'muted', 'Nhà cái: ' + (res.dealerValue > 21 ? 'quắc (' + res.dealerValue + ')' : res.dealerValue + ' điểm')));
  body.appendChild(h('div', 'res-xp', '+' + add.amount + ' XP' + (Data.level > levelBefore ? '  ·  🎉 Lên Level ' + Data.level + '!' : '')));
  ach.forEach(a => body.appendChild(h('div', 'res-ach', '🏅 Thành tích mới: ' + a.name)));
  if (ach.length) setTimeout(() => SFX.play('achievement'), 400);
  const id = Match.gameId, extra = Match.extra || {};
  const btns = tourNote ? [
    { text: 'TIẾP TỤC GIẢI', cls: 'primary', fn: () => navigateTo('tournament', { force: true }) },
    { text: 'XEM CHI TIẾT', keep: true, fn: () => showDetail() }
  ] : [
    { text: 'CHƠI LẠI', cls: 'primary', fn: () => Match.start(id, extra.room ? extra : { players: extra.players }) },
    extra.room ? { text: 'VỀ PHÒNG', fn: () => navigateTo('rooms', { force: true }) } : { text: 'VỀ MENU', fn: () => { navigateTo('home', { force: true }); } },
    { text: 'XEM CHI TIẾT', keep: true, fn: () => showDetail() }
  ];
  Modal.open({ title: head, closable: false, body, buttons: btns });
}
function showDetail() {
  const gs = gameState, body = h('div', 'rules');
  if (Match.engine.detail) { Match.engine.detail().forEach(t => body.appendChild(h('p', '', t))); Modal.open({ title: 'Chi tiết ván', body, buttons: [{ text: 'Đóng', cls: 'primary' }] }); return; }
  gs.players.forEach((p, i) => {
    let t;
    if (Match.engine.kind === 'shed') t = gs.hands[i].map(cardShort).join(' ') || '(hết bài)';
    else t = gs.hands[i].map(hd => hd.cards.map(cardShort).join(' ')).join(' | ');
    body.appendChild(h('p', '', p.name + ': ' + t));
  });
  if (gs.dealer) body.appendChild(h('p', '', 'Nhà cái: ' + gs.dealer.cards.map(cardShort).join(' ')));
  Modal.open({ title: 'Chi tiết ván', body, buttons: [{ text: 'Đóng', cls: 'primary' }] });
}


/* ============================ 14. GAME XẾP BÀI MỘT NGƯỜI: SOLITAIRE / FREECELL / SPIDER ============================ */
const SOLO_SUITS = ['S', 'H', 'D', 'C'];
const isRed = c => c.suit === 'H' || c.suit === 'D';
const cloneCard = c => Object.assign({}, c);
function soloFullDeck() { return createDeck(); }

/* ---------- Luật từng game: tạo ván, kiểm tra, di chuyển (thuần dữ liệu, không đụng DOM) ---------- */
const SoloRules = {
  /* ----- Klondike ----- */
  klondike: {
    deal(cfg) {
      const d = newShuffledDeck(), tab = [];
      for (let i = 0; i < 7; i++) { const col = []; for (let k = 0; k <= i; k++) col.push({ c: d.pop(), up: k === i }); tab.push(col); }
      return { tab, found: { S: [], H: [], D: [], C: [] }, stock: d, waste: [], draw: cfg.draw === 3 ? 3 : 1 };
    },
    canFound(st, c) { const f = st.found[c.suit]; return f.length === c.value - 1; },
    canTab(st, col, c) { const t = st.tab[col]; if (!t.length) return c.value === 13; const top = t[t.length - 1]; return top.up && isRed(top.c) !== isRed(c) && top.c.value === c.value + 1; },
    /* nguồn: {k:'tab',col,idx} | {k:'waste'} | {k:'found',suit} */
    cardsOf(st, src) {
      if (src.k === 'waste') return st.waste.length ? [st.waste[st.waste.length - 1]] : [];
      if (src.k === 'found') { const f = st.found[src.suit]; return f.length ? [f[f.length - 1]] : []; }
      const col = st.tab[src.col]; if (!col[src.idx] || !col[src.idx].up) return [];
      const seq = col.slice(src.idx);
      for (let i = 0; i < seq.length - 1; i++) { if (!(isRed(seq[i].c) !== isRed(seq[i + 1].c) && seq[i].c.value === seq[i + 1].c.value + 1)) return []; }
      return seq.map(x => x.c);
    },
    move(st, src, dst) { // dst: {k:'tab',col} | {k:'found'}
      const cs = SoloRules.klondike.cardsOf(st, src); if (!cs.length) return false;
      if (dst.k === 'found') { if (cs.length !== 1 || !SoloRules.klondike.canFound(st, cs[0])) return false; }
      else { if (src.k === 'tab' && src.col === dst.col) return false; if (!SoloRules.klondike.canTab(st, dst.col, cs[0])) return false; }
      if (src.k === 'tab') { st.tab[src.col].splice(src.idx); const col = st.tab[src.col]; if (col.length && !col[col.length - 1].up) col[col.length - 1].up = true; }
      else if (src.k === 'waste') st.waste.pop(); else st.found[src.suit].pop();
      if (dst.k === 'found') st.found[cs[0].suit].push(cs[0]); else cs.forEach(c => st.tab[dst.col].push({ c, up: true }));
      return true;
    },
    stockClick(st) {
      if (st.stock.length) { for (let i = 0; i < st.draw && st.stock.length; i++) st.waste.push(st.stock.pop()); return true; }
      if (st.waste.length) { while (st.waste.length) st.stock.push(st.waste.pop()); return true; }
      return false;
    },
    won(st) { return SOLO_SUITS.every(s => st.found[s].length === 13); },
    hints(st) {
      const out = [], R = SoloRules.klondike;
      const srcs = []; if (st.waste.length) srcs.push({ k: 'waste' });
      st.tab.forEach((col, ci2) => col.forEach((x, idx) => { if (x.up) srcs.push({ k: 'tab', col: ci2, idx }); }));
      srcs.forEach(src => {
        const cs = R.cardsOf(st, src); if (!cs.length) return;
        if (cs.length === 1 && R.canFound(st, cs[0])) out.push({ src, dst: { k: 'found' }, pri: 0 });
        for (let c2 = 0; c2 < 7; c2++) {
          if (src.k === 'tab' && src.col === c2) continue;
          if (R.canTab(st, c2, cs[0])) {
            const reveals = src.k === 'tab' && src.idx > 0 && !st.tab[src.col][src.idx - 1].up;
            const pointless = src.k === 'tab' && src.idx === 0 && cs[0].value === 13 && !st.tab[c2].length;
            if (!pointless) out.push({ src, dst: { k: 'tab', col: c2 }, pri: reveals ? 1 : (src.k === 'waste' ? 2 : 3) });
          }
        }
      });
      out.sort((a, b) => a.pri - b.pri);
      if (!out.length && (st.stock.length || st.waste.length)) out.push({ stock: true, pri: 9 });
      return out;
    }
  },
  /* ----- FreeCell ----- */
  freecell: {
    deal() {
      const d = newShuffledDeck(), tab = Array.from({ length: 8 }, () => []);
      let i = 0; while (d.length) { tab[i % 8].push(d.pop()); i++; }
      return { tab, cells: [null, null, null, null], found: { S: [], H: [], D: [], C: [] } };
    },
    canFound(st, c) { return st.found[c.suit].length === c.value - 1; },
    maxMove(st, toEmpty) { const free = st.cells.filter(x => !x).length, empties = st.tab.filter(c => !c.length).length - (toEmpty ? 1 : 0); return (free + 1) * Math.pow(2, Math.max(0, empties)); },
    seqOk(a, b) { return isRed(a) !== isRed(b) && a.value === b.value + 1; },
    cardsOf(st, src) {
      if (src.k === 'cell') return st.cells[src.i] ? [st.cells[src.i]] : [];
      if (src.k === 'found') { const f = st.found[src.suit]; return f.length ? [f[f.length - 1]] : []; }
      const col = st.tab[src.col]; if (!col[src.idx]) return [];
      const seq = col.slice(src.idx);
      for (let i = 0; i < seq.length - 1; i++) if (!SoloRules.freecell.seqOk(seq[i], seq[i + 1])) return [];
      return seq;
    },
    move(st, src, dst) {
      const R = SoloRules.freecell, cs = R.cardsOf(st, src); if (!cs.length) return false;
      if (dst.k === 'found') { if (cs.length !== 1 || !R.canFound(st, cs[0])) return false; }
      else if (dst.k === 'cell') { if (cs.length !== 1 || st.cells[dst.i]) return false; }
      else {
        if (src.k === 'tab' && src.col === dst.col) return false;
        const t = st.tab[dst.col];
        if (t.length && !R.seqOk(t[t.length - 1], cs[0])) return false;
        if (cs.length > R.maxMove(st, !t.length)) return false;
      }
      if (src.k === 'tab') st.tab[src.col].splice(src.idx); else if (src.k === 'cell') st.cells[src.i] = null; else st.found[src.suit].pop();
      if (dst.k === 'found') st.found[cs[0].suit].push(cs[0]); else if (dst.k === 'cell') st.cells[dst.i] = cs[0]; else cs.forEach(c => st.tab[dst.col].push(c));
      return true;
    },
    won(st) { return SOLO_SUITS.every(s => st.found[s].length === 13); },
    hints(st) {
      const R = SoloRules.freecell, out = [];
      const srcs = []; st.cells.forEach((c, i) => { if (c) srcs.push({ k: 'cell', i }); });
      st.tab.forEach((col, ci2) => { if (col.length) { for (let idx = col.length - 1; idx >= 0; idx--) { if (idx < col.length - 1 && !R.seqOk(col[idx], col[idx + 1])) break; srcs.push({ k: 'tab', col: ci2, idx }); } } });
      srcs.forEach(src => {
        const cs = R.cardsOf(st, src); if (!cs.length) return;
        if (cs.length === 1 && R.canFound(st, cs[0])) out.push({ src, dst: { k: 'found' }, pri: 0 });
        for (let c2 = 0; c2 < 8; c2++) {
          if (src.k === 'tab' && src.col === c2) continue;
          const t = st.tab[c2];
          if (t.length && R.seqOk(t[t.length - 1], cs[0]) && cs.length <= R.maxMove(st, false)) out.push({ src, dst: { k: 'tab', col: c2 }, pri: src.k === 'cell' ? 1 : 2 });
        }
        if (src.k === 'tab' && cs.length === 1) { const ei = st.cells.findIndex(x => !x); if (ei >= 0) out.push({ src, dst: { k: 'cell', i: ei }, pri: 5 }); }
      });
      out.sort((a, b) => a.pri - b.pri); return out;
    }
  },
  /* ----- Spider ----- */
  spider: {
    deal(cfg) {
      const suits = [1, 2, 4].includes(cfg.suits) ? cfg.suits : 1, keys = ['S', 'H', 'D', 'C'], cards = [];
      for (let k = 0; k < 8; k++) { const key = keys[k % suits]; RANKS.forEach(rk => { const c = cloneCard(CARD_BY_ID[rk + key]); c.image = getCardImage(c); cards.push(c); }); }
      for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = cards[i]; cards[i] = cards[j]; cards[j] = t; }
      const tab = Array.from({ length: 10 }, () => []);
      for (let i = 0; i < 54; i++) tab[i % 10].push({ c: cards.pop(), up: false });
      tab.forEach(col => { col[col.length - 1].up = true; });
      return { tab, stock: cards, done: 0, suits };
    },
    cardsOf(st, src) {
      const col = st.tab[src.col]; if (!col[src.idx] || !col[src.idx].up) return [];
      const seq = col.slice(src.idx);
      for (let i = 0; i < seq.length - 1; i++) if (!(seq[i].c.suit === seq[i + 1].c.suit && seq[i].c.value === seq[i + 1].c.value + 1)) return [];
      return seq.map(x => x.c);
    },
    canTab(st, col, c) { const t = st.tab[col]; if (!t.length) return true; const top = t[t.length - 1]; return top.up && top.c.value === c.value + 1; },
    removeRuns(st) {
      let removed = 0;
      st.tab.forEach(col => {
        if (col.length >= 13) {
          const seq = col.slice(col.length - 13);
          if (seq.every((x, i) => x.up && x.c.suit === seq[0].c.suit && x.c.value === 13 - i)) { col.splice(col.length - 13); if (col.length && !col[col.length - 1].up) col[col.length - 1].up = true; st.done++; removed++; }
        }
      });
      return removed;
    },
    move(st, src, dst) {
      const R = SoloRules.spider, cs = R.cardsOf(st, src); if (!cs.length) return false;
      if (src.col === dst.col || !R.canTab(st, dst.col, cs[0])) return false;
      st.tab[src.col].splice(src.idx); const col = st.tab[src.col]; if (col.length && !col[col.length - 1].up) col[col.length - 1].up = true;
      cs.forEach(c => st.tab[dst.col].push({ c, up: true })); R.removeRuns(st); return true;
    },
    stockClick(st) {
      if (!st.stock.length) return false;
      if (st.tab.some(c => !c.length)) return 'empty';
      for (let i = 0; i < 10; i++) st.tab[i].push({ c: st.stock.pop(), up: true });
      SoloRules.spider.removeRuns(st); return true;
    },
    won(st) { return st.done >= 8; },
    hints(st) {
      const R = SoloRules.spider, out = [];
      st.tab.forEach((col, ci2) => {
        for (let idx = 0; idx < col.length; idx++) {
          if (!col[idx].up) continue; const cs = R.cardsOf(st, { col: ci2, idx }); if (!cs.length) continue;
          for (let c2 = 0; c2 < 10; c2++) {
            if (c2 === ci2 || !R.canTab(st, c2, cs[0])) continue;
            const t = st.tab[c2], sameSuit = t.length && t[t.length - 1].c.suit === cs[0].suit;
            const reveals = idx > 0 && !col[idx - 1].up, pointless = idx === 0 && !t.length;
            if (pointless) continue;
            out.push({ src: { k: 'tab', col: ci2, idx }, dst: { k: 'tab', col: c2 }, pri: (sameSuit ? 0 : 3) + (reveals ? 0 : 1) + (!t.length ? 2 : 0) });
          }
        }
      });
      out.sort((a, b) => a.pri - b.pri);
      if (!out.length && st.stock.length) out.push({ stock: true, pri: 9 });
      return out;
    }
  }
};
const SOLO_RULE_KEY = { solitaire: 'klondike', freeCell: 'freecell', spider: 'spider' };

const Solo = {
  running: false, gameId: null, st: null, hist: [], moves: 0, startedAt: 0, elapsedBefore: 0, sel: null, ticker: null, won: false, cfg: {}, lastTap: 0,
  R() { return SoloRules[SOLO_RULE_KEY[this.gameId]]; },
  snapshot() { return JSON.stringify(this.st, cardReplacer); },
  restore(txt) { this.st = JSON.parse(txt, cardReviver); },
  start(gameId, cfg) {
    Modal.closeAll(); this.cleanup();
    this.gameId = gameId; this.cfg = Object.assign({}, (Data.settings.gameCfg || {})[gameId] || {}, cfg || {});
    this.st = this.R().deal(this.cfg); this.hist = []; this.moves = 0; this.sel = null; this.won = false;
    this.startedAt = Date.now(); this.elapsedBefore = 0; this.running = true; this.initialSnap = this.snapshot();
    Data.currentGame = gameId; navigateTo('solo'); this.build(); this.render(); this.startTicker(); this.persist(); SFX.play('deal');
  },
  restart() { if (!this.running) return; this.restore(this.initialSnap); this.hist = []; this.moves = 0; this.sel = null; this.won = false; this.render(); this.persist(); SFX.play('deal'); },
  startTicker() { clearInterval(this.ticker); this.ticker = setInterval(() => { const el = $('#solo-time'); if (el) el.textContent = '⏱ ' + fmtTime(this.seconds()); }, 1000); },
  seconds() { return this.elapsedBefore + (Date.now() - this.startedAt) / 1000; },
  cleanup() { clearInterval(this.ticker); this.ticker = null; this.running = false; this.sel = null; },
  persist() {
    if (!this.running || this.won) return;
    try { Data.currentMatch = { solo: true, gameId: this.gameId, state: JSON.parse(this.snapshot()), initial: this.initialSnap, moves: this.moves, elapsed: this.seconds(), cfg: this.cfg, savedAt: Date.now() }; saveData(); } catch (e) { }
  },
  resume() {
    const cm = Data.currentMatch;
    try {
      if (!cm || !cm.solo || !SOLO_RULE_KEY[cm.gameId]) throw new Error('Không có ván để tiếp tục');
      Modal.closeAll(); this.cleanup(); this.gameId = cm.gameId; this.cfg = cm.cfg || {};
      this.st = JSON.parse(JSON.stringify(cm.state), cardReviver); this.initialSnap = cm.initial || this.snapshot(); this.hist = []; this.moves = cm.moves || 0; this.sel = null; this.won = false;
      this.startedAt = Date.now(); this.elapsedBefore = cm.elapsed || 0; this.running = true;
      navigateTo('solo'); this.build(); this.render(); this.startTicker();
    } catch (e) { this.running = false; Data.currentMatch = null; saveData(); handleError(e); navigateTo('home', { force: true }); }
  },
  leave() { this.persist(); this.cleanup(); },
  abort(clear) { // bỏ ván: tính thua nếu đã đi ≥ 8 nước
    const had = this.running || (Data.currentMatch && Data.currentMatch.solo), mv = this.running ? this.moves : (Data.currentMatch ? Data.currentMatch.moves : 0), gid = this.running ? this.gameId : (Data.currentMatch || {}).gameId, secs = this.running ? this.seconds() : ((Data.currentMatch || {}).elapsed || 0);
    this.cleanup();
    if (clear) { Data.currentMatch = null; Data.currentGame = null; if (had && gid && mv >= 8 && !this.won) { recordMatch(gid, 'lose', secs); addXP(8); } saveData(); }
  },
  /* ---------- hành động ---------- */
  push() { this.hist.push(this.snapshot()); if (this.hist.length > 300) this.hist.shift(); },
  afterChange(sfx) {
    this.moves++; this.sel = null; this.render(); this.persist(); if (sfx) SFX.play(sfx);
    if (this.R().won(this.st)) this.win();
  },
  undo() {
    if (!this.running || !this.hist.length) { showToast('Chưa có nước đi để hoàn tác', 'info', { silent: true }); return; }
    this.restore(this.hist.pop()); this.moves = Math.max(0, this.moves - 1); this.sel = null; this.render(); this.persist(); SFX.play('select');
  },
  tryMove(src, dst) {
    this.push(); const ok = this.R().move(this.st, src, dst);
    if (!ok) { this.hist.pop(); return false; }
    this.afterChange(dst.k === 'found' ? 'eat' : 'card'); return true;
  },
  clickStock() {
    if (!this.running) return; this.push(); const r = this.R().stockClick(this.st);
    if (r === 'empty') { this.hist.pop(); showToast('Spider: cần có ít nhất 1 lá ở mỗi cột trước khi chia', 'warning'); return; }
    if (!r) { this.hist.pop(); return; } this.afterChange('deal');
  },
  autoFound(src) { // chạm đúp: tự lên nền
    const R = this.R(), cs = R.cardsOf(this.st, src); if (cs.length !== 1 || this.gameId === 'spider') return false;
    return this.tryMove(src, { k: 'found' });
  },
  autoFinish() { // đẩy mọi lá có thể lên nền
    if (this.gameId === 'spider') return; let moved = true, guard = 0, any = false;
    while (moved && guard++ < 80) {
      moved = false; const st = this.st, R = this.R();
      const srcs = []; if (this.gameId === 'solitaire') { if (st.waste.length) srcs.push({ k: 'waste' }); st.tab.forEach((col, i) => { if (col.length && col[col.length - 1].up) srcs.push({ k: 'tab', col: i, idx: col.length - 1 }); }); }
      else { st.cells.forEach((c, i) => { if (c) srcs.push({ k: 'cell', i }); }); st.tab.forEach((col, i) => { if (col.length) srcs.push({ k: 'tab', col: i, idx: col.length - 1 }); }); }
      for (const s of srcs) { const cs = R.cardsOf(st, s); if (cs.length === 1 && R.canFound(st, cs[0])) { this.push(); R.move(st, s, { k: 'found' }); this.moves++; moved = true; any = true; break; } }
    }
    this.sel = null; this.render(); this.persist(); if (any) { SFX.play('eat'); if (this.R().won(this.st)) this.win(); } else showToast('Chưa có lá nào lên nền được', 'info', { silent: true });
  },
  hint() {
    if (!this.running) return; const hs = this.R().hints(this.st);
    if (!hs.length) { showToast('💡 Không còn nước đi — hãy hoàn tác hoặc chia lại', 'warning'); return; }
    const h0 = hs[0];
    if (h0.stock) { showToast('💡 Gợi ý: bốc bài từ kho', 'info', { silent: true }); this.flashStock(); return; }
    this.sel = h0.src; this.render(); this.flash(h0.dst);
    showToast('💡 Gợi ý: chuyển lá được chọn sang vị trí nhấp nháy', 'info', { silent: true });
  },
  /* ---------- giao diện ---------- */
  build() {
    const g = this.gameId; $('#solo-title').textContent = GAME_META[g].name;
    $('#screen-solo').dataset.game = g;
    const top = $('#solo-top'); top.textContent = '';
    const mkSlot = (cls, attrs, label) => { const d = h('div', 'slot ' + cls); Object.keys(attrs).forEach(k => { d.dataset[k] = attrs[k]; }); if (label) d.appendChild(h('span', 'slot-lbl', label)); return d; };
    if (g === 'solitaire') {
      top.appendChild(mkSlot('stock', { zone: 'stock' }, '↻'));
      top.appendChild(mkSlot('waste', { zone: 'waste' }));
      top.appendChild(h('div', 'slot-gap'));
      SOLO_SUITS.forEach(s => top.appendChild(mkSlot('found', { zone: 'found', suit: s }, SUIT_BY_KEY[s].sym)));
    } else if (g === 'freeCell') {
      for (let i = 0; i < 4; i++) top.appendChild(mkSlot('cell', { zone: 'cell', i }, ''));
      SOLO_SUITS.forEach(s => top.appendChild(mkSlot('found', { zone: 'found', suit: s }, SUIT_BY_KEY[s].sym)));
    } else {
      top.appendChild(mkSlot('stock', { zone: 'stock' }, ''));
      const dn = h('div', 'spider-done'); dn.id = 'spider-done'; top.appendChild(dn);
    }
    const tab = $('#solo-tab'); tab.textContent = '';
    const cols = g === 'solitaire' ? 7 : g === 'freeCell' ? 8 : 10;
    for (let i = 0; i < cols; i++) { const c = h('div', 'col'); c.dataset.zone = 'col'; c.dataset.col = i; tab.appendChild(c); }
    tab.dataset.cols = cols;
  },
  cardW() { const w = $('#solo-board').clientWidth, cols = this.gameId === 'solitaire' ? 7 : this.gameId === 'freeCell' ? 8 : 10; const gap = cols >= 10 ? 3 : 5; const bh = $('#solo-board').clientHeight || 600; return { cw: Math.max(24, Math.min(74, Math.floor(bh * 0.21), Math.floor((w - 8 - gap * (cols - 1)) / cols))), gap }; },
  render() {
    if (!this.running && !this.st) return;
    const st = this.st, g = this.gameId, { cw, gap } = this.cardW(), ch = Math.round(cw * 1.4);
    const board = $('#solo-board'); board.style.setProperty('--cw', cw + 'px'); board.style.setProperty('--ch', ch + 'px'); $('#solo-tab').style.gap = gap + 'px'; $('#solo-top').style.gap = gap + 'px';
    const isSel = (k, o) => this.sel && this.sel.k === k && Object.keys(o).every(x => this.sel[x] === o[x]);
    const card = (c, up, extra) => { const e = createCardElement(c, { faceDown: !up }); if (extra) e.classList.add(extra); return e; };
    // khu trên
    $$('#solo-top .slot').forEach(sl => {
      const z = sl.dataset.zone; $$('.card', sl).forEach(x => x.remove());
      sl.classList.remove('sel', 'flash');
      if (g === 'solitaire' && z === 'stock') { if (st.stock.length) sl.appendChild(card(null, false)); sl.dataset.n = st.stock.length; sl.classList.toggle('empty', !st.stock.length); }
      else if (g === 'solitaire' && z === 'waste') { if (st.waste.length) { const e = card(st.waste[st.waste.length - 1], true); if (isSel('waste', {})) e.classList.add('selected'); sl.appendChild(e); } }
      else if (z === 'found') { const f = st.found[sl.dataset.suit]; if (f.length) sl.appendChild(card(f[f.length - 1], true)); }
      else if (z === 'cell') { const c = st.cells[sl.dataset.i]; if (c) { const e = card(c, true); if (isSel('cell', { i: +sl.dataset.i })) e.classList.add('selected'); sl.appendChild(e); } }
      else if (g === 'spider' && z === 'stock') { sl.dataset.n = st.stock.length; sl.classList.toggle('empty', !st.stock.length); if (st.stock.length) sl.appendChild(card(null, false)); }
    });
    if (g === 'spider') { const dn = $('#spider-done'); dn.textContent = ''; for (let i = 0; i < 8; i++) dn.appendChild(h('span', 'done-pip' + (i < st.done ? ' on' : ''), '♠')); }
    // cột
    const colsEl = $$('#solo-tab .col'); const tallest = Math.max.apply(null, st.tab.map(c => c.length).concat([1]));
    const availH = Math.max(120, board.clientHeight - $('#solo-top').offsetHeight - 14);
    const upStep = Math.max(16, Math.min(Math.round(ch * 0.5), Math.floor((availH - ch) / Math.max(1, tallest - 1))));
    const dnStep = Math.max(7, Math.round(upStep * 0.38));
    colsEl.forEach((colEl, i) => {
      colEl.textContent = ''; const col = st.tab[i];
      let y = 0; colEl.style.minHeight = ch + 'px';
      col.forEach((x, idx) => {
        const c = g === 'freeCell' ? x : x.c, up = g === 'freeCell' ? true : x.up;
        const e = card(c, up); e.classList.add('tc'); e.style.top = y + 'px'; e.dataset.idx = idx; e.dataset.col = i;
        if (this.sel && this.sel.k === 'tab' && this.sel.col === i && idx >= this.sel.idx) e.classList.add('selected');
        colEl.appendChild(e); y += up ? upStep : dnStep;
      });
      colEl.style.height = (col.length ? y - (col.length ? (col[col.length - 1].up !== false ? upStep : dnStep) : 0) + ch : ch) + 'px';
    });
    $('#solo-moves').textContent = '↦ ' + this.moves; $('#solo-time').textContent = '⏱ ' + fmtTime(this.seconds());
    const af = $('#solo-auto'); if (af) af.hidden = g === 'spider';
  },
  flash(dst) {
    let el = null;
    if (dst.k === 'found') el = $$('#solo-top .slot.found').find(x => this.gameId === 'spider' ? false : true);
    else if (dst.k === 'cell') el = $('#solo-top .slot.cell[data-i="' + dst.i + '"]');
    else el = $('#solo-tab .col[data-col="' + dst.col + '"]');
    if (el) { el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1400); }
  },
  flashStock() { const s = $('#solo-top .slot.stock'); if (s) { s.classList.add('flash'); setTimeout(() => s.classList.remove('flash'), 1400); } },
  /* chạm một vùng */
  tap(e) {
    if (!this.running || this.won) return;
    const slot = e.target.closest('.slot'), cardEl = e.target.closest('.card'), colEl = e.target.closest('.col');
    const g = this.gameId, st = this.st, R = this.R();
    // kho
    if (slot && slot.dataset.zone === 'stock') { this.clickStock(); return; }
    // nền
    if (slot && slot.dataset.zone === 'found') {
      if (this.sel) { const ok = this.tryMove(this.sel, { k: 'found' }); if (!ok) showToast('Chưa thể đặt lên nền', 'warning', { silent: true }); }
      else if (g !== 'spider') { const f = st.found[slot.dataset.suit]; if (f.length) { this.sel = { k: 'found', suit: slot.dataset.suit }; this.render(); } }
      return;
    }
    // ô tạm FreeCell
    if (slot && slot.dataset.zone === 'cell') {
      const i = +slot.dataset.i;
      if (this.sel) { if (this.sel.k === 'cell' && this.sel.i === i) { this.sel = null; this.render(); return; } const ok = this.tryMove(this.sel, { k: 'cell', i }); if (!ok) showToast('Ô tạm đã có bài hoặc chỉ nhận 1 lá', 'warning', { silent: true }); }
      else if (st.cells[i]) { this.sel = { k: 'cell', i }; this.render(); }
      return;
    }
    // chồng bỏ Klondike
    if (slot && slot.dataset.zone === 'waste') {
      if (this.sel && this.sel.k === 'waste') { this.sel = null; this.render(); return; }
      if (st.waste.length) { const now = Date.now(); if (now - this.lastTap < 350 && this.autoFound({ k: 'waste' })) { this.lastTap = 0; return; } this.lastTap = now; this.sel = { k: 'waste' }; this.render(); }
      return;
    }
    // cột
    if (colEl) {
      const col = +colEl.dataset.col, idx = cardEl && cardEl.dataset.idx != null ? +cardEl.dataset.idx : null;
      if (this.sel) {
        const sameSource = this.sel.k === 'tab' && this.sel.col === col;
        if (!sameSource) { const ok = this.tryMove(this.sel, { k: 'tab', col }); if (ok) return; }
        if (idx != null && R.cardsOf(st, { k: 'tab', col, idx }).length) { // đổi lựa chọn
          if (sameSource && this.sel.idx === idx) { this.sel = null; this.render(); return; }
          this.sel = { k: 'tab', col, idx }; this.render(); return;
        }
        if (!sameSource) showToast('Không đặt được ở đây', 'warning', { silent: true }); else { this.sel = null; this.render(); }
        return;
      }
      if (idx != null) {
        const cs = R.cardsOf(st, { k: 'tab', col, idx });
        if (!cs.length) { showToast('Lá này chưa di chuyển được', 'info', { silent: true }); return; }
        const now = Date.now(); if (idx === st.tab[col].length - 1 && now - this.lastTap < 350 && g !== 'spider' && this.autoFound({ k: 'tab', col, idx })) { this.lastTap = 0; return; } this.lastTap = now;
        this.sel = { k: 'tab', col, idx }; this.render();
      }
    }
  },
  win() {
    if (this.won) return; this.won = true; clearInterval(this.ticker);
    const secs = this.seconds(), gid = this.gameId, cfg = this.cfg;
    recordMatch(gid, 'win', secs);
    let xp = 90 + (gid === 'spider' ? ({ 1: 0, 2: 40, 4: 90 }[cfg.suits || 1]) : gid === 'solitaire' ? (cfg.draw === 3 ? 30 : 0) : 20);
    const specials = ['solo:' + gid]; const before = Data.level; const add = addXP(xp);
    pushHistory({ t: Date.now(), g: gid, o: 'win', xp: add.amount, opp: [], tour: false, room: false, sec: Math.round(secs) });
    Missions.onMatch(gid, 'win', {}); const ach = checkAchievements(specials);
    Data.currentMatch = null; Data.currentGame = null; saveData();
    SFX.play('win'); confetti(); vibrate([60, 40, 60]);
    const body = h('div', 'result'); body.appendChild(h('div', 'res-headline', '🏆 HOÀN THÀNH!'));
    body.appendChild(h('p', 'center', 'Thời gian ' + fmtTime(secs) + ' · ' + this.moves + ' nước đi'));
    body.appendChild(h('div', 'res-xp', '+' + add.amount + ' XP' + (Data.level > before ? '  ·  🎉 Lên Level ' + Data.level + '!' : '')));
    ach.forEach(a => body.appendChild(h('div', 'res-ach', '🏅 Thành tích mới: ' + a.name)));
    this.running = false;
    Timers.set(() => Modal.open({ title: 'Chiến thắng!', closable: false, body, buttons: [{ text: 'VÁN MỚI', cls: 'primary', fn: () => Solo.start(gid, cfg) }, { text: 'VỀ MENU', fn: () => navigateTo('home', { force: true }) }] }), 600);
  }
};

/* ============================ 13. SỰ KIỆN & KHỞI TẠO ============================ */
function onHandClick(e) {
  const c = e.target.closest('.hand-card'); if (!c || UI.lock) return;
  const id = c.dataset.id; if (!id) return;
  if (UI.selected.has(id)) UI.selected.delete(id); else UI.selected.add(id);
  c.classList.toggle('selected', UI.selected.has(id)); SFX.play('select');
}
function doAction(act, t) {
  switch (act) {
    case 'goto': navigateTo(t.dataset.target); break;
    case 'back': goBack(); break;
    case 'play-now': if (Data.currentMatch) Match.resume(); else navigateTo('games'); break;
    case 'soon': showToast('🔒 ' + (t.dataset.what || 'Tính năng') + ' sẽ có ở đợt sau', 'info'); break;
    case 'toggle-sound': Data.settings.sound = !Data.settings.sound; saveData(); applySettings(); if (UI.screen === 'settings') RENDERERS.settings(); break;
    case 'rules': showRules(t.dataset.game); break;
    case 'setup-game': setupGame(t.dataset.game); break;
    case 'play-exit': confirmExit('home'); break;
    case 'play-rules': showRules(Match.gameId); break;
    case 'edit-name': editName(); break;
    case 'edit-age': editAge(); break;
    case 'edit-avatar': editAvatar(); break;
    case 'edit-country': editCountry(); break;
    case 'fullscreen': toggleFullscreen(); setTimeout(() => { if (UI.screen === 'settings') RENDERERS.settings(); }, 300); break;
    case 'reset-data':
      Modal.open({ title: 'Xoá dữ liệu?', body: 'Hồ sơ, thống kê, thành tích và ván đang chơi sẽ bị xoá vĩnh viễn.', buttons: [{ text: 'Huỷ' }, { text: 'XOÁ HẾT', cls: 'danger', fn: () => { Match.abort(false); Data = defaultData(); saveData(); applySettings(); navigateTo('home', { force: true }); showToast('Đã xoá dữ liệu', 'success'); } }] });
      break;
    case 'sort': UI.sortMode = ((UI.sortMode | 0) + 1) % 3; UI.handKey = ''; renderHand(); showToast('↕ Sắp xếp: ' + SORT_NAMES[UI.sortMode], 'info', { silent: true }); break;
    case 'emote': { const tr = $('#emote-tray'); if (tr) { buildEmoteTray(); tr.hidden = !tr.hidden; } break; }
    case 'hint': {
      if (!Match.humanTurn()) return; const mv = Match.engine.hint(0);
      UI.selected.clear();
      if (mv.type === 'pass') showToast('💡 Gợi ý: bỏ lượt', 'info', { silent: true });
      else if (!mv.cards) {
        if (mv.card) { UI.selected.add(mv.card); renderHand(); }
        const HT = { draw: mv.src === 'pile' ? 'lấy bài bỏ' : 'bốc nọc', eat: 'ăn bài', discard: 'đánh lá đã chọn', knock: 'gõ (đánh lá đã chọn)', fold: 'Fold', check: 'Check', call: 'Call', raise: 'Raise lên ' + mv.to, allin: 'All-in', auto: 'bấm TỰ XẾP', reveal: 'lật bài', next: 'ván tiếp' };
        showToast('💡 Gợi ý: ' + (HT[mv.type] || mv.type), 'info', { silent: true });
      }
      else { mv.cards.forEach(id => UI.selected.add(id)); renderHand(); showToast('💡 Đã chọn nước gợi ý', 'info', { silent: true }); }
      break;
    }
    case 'pass': Match.humanMove({ type: 'pass' }); break;
    case 'play': Match.humanMove({ type: 'play', cards: [...UI.selected] }); break;
    case 'bj-hit': Match.humanMove({ type: 'hit' }); break;
    case 'bj-stand': Match.humanMove({ type: 'stand' }); break;
    case 'bj-double': Match.humanMove({ type: 'double' }); break;
    case 'bj-split': Match.humanMove({ type: 'split' }); break;
    case 'solo-exit': if (Solo.running) confirmExitSolo('home'); else navigateTo('home', { force: true }); break;
    case 'solo-undo': Solo.undo(); break;
    case 'solo-hint': Solo.hint(); break;
    case 'solo-auto': Solo.autoFinish(); break;
    case 'solo-restart': Solo.restart(); showToast('Đã chơi lại ván này từ đầu', 'info', { silent: true }); break;
    case 'solo-rules': showRules(Solo.gameId); break;
    case 'solo-new':
      Modal.open({ title: 'Ván mới?', body: 'Ván hiện tại sẽ bị bỏ (tính thua nếu đã đi từ 8 nước).', buttons: [{ text: 'Huỷ' }, { text: 'VÁN MỚI', cls: 'primary', fn: () => { const g = Solo.gameId, c = Solo.cfg; Solo.abort(true); Solo.start(g, c); } }] });
      break;
    case 'raise-menu': {
      const tr = $('#raise-tray'); if (!tr || !Match.humanTurn()) break;
      if (!tr.hidden) { tr.hidden = true; break; }
      tr.textContent = '';
      POKER_ENGINE.raiseOptions().forEach(o => { const b = h('button', 'raise-btn', o.label + ' · ' + o.to); b.type = 'button'; b.dataset.action = 'g:raise'; b.dataset.to = o.to; tr.appendChild(b); });
      tr.hidden = false; break;
    }
    default:
      if (act.indexOf('g:') === 0) {
        const sel = [...UI.selected], mv = { type: act.slice(2), cards: sel, card: sel[0] };
        if (t.dataset.src) mv.src = t.dataset.src; if (t.dataset.to) mv.to = parseInt(t.dataset.to, 10);
        const rt = $('#raise-tray'); if (rt) rt.hidden = true;
        Match.humanMove(mv);
      }
      break;
  }
}
let _layoutQueued = false;
function onResize() {
  if (_layoutQueued) return; _layoutQueued = true;
  requestAnimationFrame(() => { _layoutQueued = false; setAppHeight(); layoutPlay(); if (UI.screen === 'solo' && Solo.st && Solo.running) Solo.render(); });
}
function setIcons() {
  try {
    const svg = appLogoSvg();
    const uri = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    let ico = $('link[rel="icon"]'); if (ico) ico.href = uri;
    // iOS cần PNG cho apple-touch-icon → vẽ bằng canvas
    const cv = document.createElement('canvas'); cv.width = cv.height = 180; const g = cv.getContext('2d');
    const img = new Image();
    img.onload = () => {
      try { g.drawImage(img, 0, 0, 180, 180); const a = $('link[rel="apple-touch-icon"]'); if (a) a.href = cv.toDataURL('image/png'); } catch (e) { }
    };
    img.src = uri;
    const lg = $('#loading-logo'); if (lg) lg.innerHTML = appLogoSvg('lg1'); const hl = $('#home-logo'); if (hl) hl.innerHTML = appLogoSvg('lg2');
    const dp = $('#deck-pile img'); if (dp) dp.src = getCardBack();
  } catch (e) { /* bỏ qua */ }
}
function init() {
  try { Data = Store.load(); } catch (e) { Data = defaultData(); }
  saveData(); applySettings(); setAppHeight(); setIcons(); try { Missions.ensure(); buildEmoteTray(); } catch (e) { }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-action]'); if (!t || t.disabled) return;
    SFX.unlock(); if (t.dataset.action !== 'play') SFX.play('click');
    try { doAction(t.dataset.action, t); } catch (err) { handleError(err); }
  });
  document.addEventListener('pointerdown', () => SFX.unlock(), { once: true });
  $('#hand').addEventListener('click', onHandClick);
  $('#solo-board').addEventListener('click', e => Solo.tap(e));
  $('#table-cards').addEventListener('click', e => {
    const eng = Match.engine; if (!Match.running || !eng || !eng.tapTable || UI.lock) return;
    const row = e.target.closest('.t-row'); if (!row || row.dataset.key == null) return;
    const card = e.target.closest('.card'); const mv = eng.tapTable(row.dataset.key, card ? card.dataset.id : null); if (mv) Match.humanMove(mv);
  });
  $('#hand').addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const cs = $$('.hand-card'), i = cs.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault(); const n = cs[i + (e.key === 'ArrowRight' ? 1 : -1)]; if (n) n.focus();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (Modal.stack.length) { const m = Modal.stack[Modal.stack.length - 1]; if (m.o.closable !== false) Modal.close(m); } else if (UI.screen !== 'home') goBack(); }
    else if (e.key === 'Enter' && UI.screen === 'play' && !Modal.stack.length && (document.activeElement === document.body)) { doAction('play', document.body); }
  });
  window.addEventListener('resize', onResize); window.addEventListener('orientationchange', onResize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (Solo.running) Solo.persist(); if (Match.running) { TurnTimer.pauseTimer(); Match.persist(); } }
    else if (Match.running && !Modal.stack.length) TurnTimer.resumeTimer();
  });
  window.addEventListener('pagehide', () => { if (Solo.running) Solo.persist(); if (Match.running) Match.persist(); });
  window.addEventListener('error', e => handleError(e.error || e.message));
  window.addEventListener('unhandledrejection', e => handleError(e.reason));
  try { const mq = window.matchMedia('(prefers-color-scheme: dark)'); (mq.addEventListener ? mq.addEventListener('change', applySettings) : mq.addListener && mq.addListener(applySettings)); } catch (e) { }
  navigateTo('home', { noStack: true });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $('#loading').classList.add('hide'); $('#app').hidden = false; setTimeout(() => { $('#loading').hidden = true; }, 250);
    if (Data.currentMatch && (GAME_ENGINES[Data.currentMatch.gameId] || Data.currentMatch.solo)) {
      Modal.open({
        title: 'Ván chưa hoàn thành', closable: false, body: 'Bạn có ván chơi chưa hoàn thành (' + GAME_META[Data.currentMatch.gameId].name + ').',
        buttons: [{ text: 'TIẾP TỤC', cls: 'primary', fn: () => Match.resume() }, { text: 'BỎ VÁN', cls: 'danger', fn: () => { Match.abort(true); RENDERERS.home(); } }]
      });
    } else if (Data.currentMatch) { Data.currentMatch = null; saveData(); }
    else if (Data.tournament && Data.tournament.status === 'active') {
      Modal.open({
        title: 'Tiếp tục giải đấu?', body: 'Bạn đang tham gia ' + Data.tournament.name + ' (' + Tour.stageLabel(Data.tournament) + ').',
        buttons: [{ text: 'TIẾP TỤC', cls: 'primary', fn: () => navigateTo('tournament') }, { text: 'Để sau' }]
      });
    }
  }));
}
if (IN_BROWSER) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}
