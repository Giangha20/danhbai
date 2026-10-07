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
  lieng: { name: 'Liêng', desc: '3 lá, tố/theo/úp/bỏ', icon: 'three', phase: 'Đợt 2' },
  baCay: { name: 'Ba Cây', desc: '3 lá, điểm 0–9', icon: 'three2', phase: 'Đợt 2' },
  phom: { name: 'Phỏm', desc: 'Bốc, ăn, hạ phỏm, ù', icon: 'phom', phase: 'Đợt 2' },
  mauBinh: { name: 'Mậu Binh', desc: '13 lá chia 3 chi', icon: 'mb', phase: 'Đợt 3' },
  poker: { name: 'Poker Offline', desc: "Texas Hold'em", icon: 'chips', phase: 'Đợt 3' },
  highCard: { name: 'High Card', desc: 'Lá cao nhất thắng', icon: 'hc', phase: 'Đợt 2' },
  rummy: { name: 'Rummy', desc: 'Bốc, đánh, hạ bộ', icon: 'rummy', phase: 'Đợt 3' },
  solitaire: { name: 'Solitaire', desc: 'Klondike một người', icon: 'sol', phase: 'Đợt 4' },
  freeCell: { name: 'FreeCell', desc: '8 cột, 4 ô trống', icon: 'fc', phase: 'Đợt 4' },
  spider: { name: 'Spider Solitaire', desc: '1/2/4 chất', icon: 'spider', phase: 'Đợt 4' }
};
const READY_GAMES = Object.keys(GAME_META).filter(k => GAME_META[k].ready);

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
    'Tới trắng (thắng ngay khi chia bài): sảnh rồng 3→A hoặc tứ quý 2.'
  ]],
  tienLenMienNam: ['Tiến Lên Miền Nam', [
    'Số người 2–4, mỗi người 13 lá. Thứ tự 3 < … < K < A < 2; chất ♠ < ♣ < ♦ < ♥. Người có lá nhỏ nhất đi trước và phải đánh lá đó.',
    'Bộ hợp lệ: lẻ, đôi, ba, tứ quý, sảnh (≥3 lá, không có 2) và đôi thông (≥3 đôi liên tiếp, không có 2).',
    'Chặt 2 lẻ: tứ quý hoặc 3 đôi thông (hoặc nhiều hơn).',
    'Chặt đôi 2: tứ quý hoặc 4 đôi thông. 4 đôi thông cũng chặt được tứ quý.',
    'Thối 2: khi ván kết thúc mà còn quân 2 trên tay thì bị đánh dấu "Thối 2". Chưa đánh được lá nào là "Cóng".',
    'Tới trắng: sảnh rồng 3→A, tứ quý 2, hoặc 6 đôi — thắng ngay khi chia bài.'
  ]],
  tienLenMienBac: ['Tiến Lên Miền Bắc', [
    'Số người 2–4, mỗi người 13 lá. Thứ tự và chất như Tiến Lên; người có lá nhỏ nhất đi trước.',
    'Bộ hợp lệ: lẻ, đôi, ba, tứ quý, sảnh (≥3 lá, không có 2) và đôi thông (≥3 đôi liên tiếp).',
    'Chặt hạn chế hơn Miền Nam: chỉ tứ quý và đôi thông (≥3 đôi) chặt được 2 lẻ. Đôi 2 không bị chặt; đôi thông không chặt được tứ quý.',
    'Không có luật thối 2.',
    'Tới trắng: sảnh rồng 3→A, tứ quý 2, hoặc tứ quý 3.'
  ]],
  samLoc: ['Sâm Lốc', [
    'Số người 2–4, mỗi người 10 lá. Thứ tự: 3 < 4 < … < K < A < 2. Chất không quyết định giá trị: bài bằng nhau thì không chặt được.',
    'Bộ hợp lệ: lẻ, đôi, bộ ba, tứ quý, sảnh (≥3 lá liên tiếp, không có 2). Phải đánh cùng loại, cùng số lá và lớn hơn bộ trước.',
    'Chặt: tứ quý chặt 2 lẻ và đôi 2.',
    'Báo Sâm: trước khi đánh, bạn có thể báo Sâm — phải đi hết 10 lá mà không ai chặn được. Người báo được đi trước. Có người đánh bài chặn thì người báo thua, người chặn thắng.',
    'Ăn trắng: tứ quý 2, 5 đôi, hoặc sảnh rồng 10 lá liên tiếp — thắng ngay khi chia bài.',
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
    'Mỗi người 3 lá. Xếp hạng: Sáp (3 lá cùng số) > Liêng (3 lá liên tiếp) > Ảnh (3 lá J/Q/K) > bài thường tính điểm.',
    'Điểm bài thường: A = 1, 2–9 theo số, 10/J/Q/K = 10 (tính 0); điểm = tổng chia 10 lấy dư (cao nhất 9).',
    'Vòng cược bằng điểm ảo: Tố (tăng mức), Theo (bằng mức), Úp/Bỏ (rời ván). Sau vòng cược các lá được lật để so bài.',
    'Cùng hạng thì so lá cao nhất, rồi so chất (♠ < ♣ < ♦ < ♥). Game sẽ có ở đợt sau.'
  ]],
  baCay: ['Ba Cây', [
    'Mỗi người 3 lá. Điểm = tổng điểm 3 lá chia 10 lấy dư, từ 0 đến 9. A = 1; J/Q/K = 10 (hoặc tính 0 tuỳ cấu hình luật).',
    'Ba cây ảnh (3 lá J/Q/K) là bài cao nhất. Sau đó so điểm 9 > 8 > … > 0.',
    'Bằng điểm thì so lá cao nhất, rồi so chất. Game sẽ có ở đợt sau.'
  ]],
  phom: ['Phỏm', [
    'Dùng 52 lá, 2–4 người. Mỗi người 9 lá (người đi đầu 10 lá). Mục tiêu: ghép bài thành phỏm và còn ít điểm rác nhất.',
    'Phỏm = 3 lá trở lên cùng số (phỏm ngang) hoặc 3 lá trở lên liên tiếp cùng chất (phỏm dọc, A có thể là 1).',
    'Mỗi lượt: bốc 1 lá từ nọc hoặc ăn lá người trước vừa đánh (chỉ khi lá đó tạo được phỏm), rồi đánh ra 1 lá.',
    'Hết 4 vòng đánh thì hạ phỏm. Người hạ phỏm được gửi lá còn lại vào phỏm đã hạ của mình hoặc của người khác.',
    'Ù: hết bài sau khi hạ phỏm (hoặc 9 lá thành phỏm hết). Móm: không có phỏm nào — bị xếp bét. Tính điểm lá rác (A = 1 … K = 13), ít điểm nhất thắng. Game sẽ có ở đợt sau.'
  ]],
  mauBinh: ['Mậu Binh', [
    'Mỗi người 13 lá, xếp thành 3 chi: Chi 1 (đầu) 3 lá, Chi 2 (giữa) 5 lá, Chi 3 (cuối) 5 lá. Bắt buộc Chi 3 ≥ Chi 2 ≥ Chi 1, xếp sai gọi là binh lủng (thua).',
    'Hạng bài (cao → thấp): Thùng phá sảnh, Tứ quý, Cù lũ, Thùng, Sảnh, Sám, Thú (2 đôi), Đôi, Mậu thầu. Chi 1 chỉ có Sám, Đôi hoặc Mậu thầu.',
    'So từng chi với đối thủ: thắng 2/3 chi là thắng ván. Thắng cả 3 chi là "sập hầm" (thưởng thêm).',
    'Thắng trắng (thắng ngay): sảnh rồng 13 lá, 6 đôi, 3 sảnh, 3 thùng. Game sẽ có ở đợt sau.'
  ]],
  poker: ["Poker (Texas Hold'em)", [
    'Mỗi người 2 lá riêng và dùng 5 lá chung trên bàn để ghép bộ 5 lá tốt nhất.',
    'Các vòng: Pre-flop (chia 2 lá) → Flop (3 lá chung) → Turn (lá thứ 4) → River (lá thứ 5) → Showdown (so bài).',
    'Hành động: Check (bỏ qua), Bet (đặt), Call (theo), Raise (tố thêm), Fold (bỏ bài), All-in (đẩy hết điểm). Chỉ dùng điểm ảo.',
    'Xếp hạng: High Card < One Pair < Two Pair < Three of a Kind < Straight < Flush < Full House < Four of a Kind < Straight Flush < Royal Flush.',
    'Còn nhiều người đến showdown thì bộ cao hơn thắng; bằng nhau thì chia. Game sẽ có ở đợt sau.'
  ]],
  highCard: ['High Card', [
    'Mỗi người nhận 1 lá (hoặc rút từ bộ bài). Lá cao nhất thắng.',
    'Thứ tự: 2 < 3 < … < 10 < J < Q < K < A. Cùng số thì so chất: ♠ < ♣ < ♦ < ♥.',
    'Game nhanh, dùng để thi đấu giải mini. Game sẽ có ở đợt sau.'
  ]],
  rummy: ['Rummy', [
    'Mỗi người nhận 10 lá (2 người) hoặc 7 lá (3–4 người). Mục tiêu: ghép hết bài thành bộ và đánh ra lá cuối.',
    'Bộ hợp lệ: Set (3–4 lá cùng số khác chất) hoặc Sequence (≥3 lá liên tiếp cùng chất).',
    'Mỗi lượt: bốc 1 lá (từ nọc hoặc từ chồng bỏ), hạ bộ nếu có, rồi đánh ra 1 lá.',
    'Deadwood = lá lẻ chưa vào bộ (A = 1, J/Q/K = 10). Người hết bài thắng; hoặc kết thúc khi deadwood thấp hơn đối thủ. Game sẽ có ở đợt sau.'
  ]],
  solitaire: ['Solitaire (Klondike)', [
    '7 cột (cột i có i lá, chỉ lá cuối ngửa), 4 nền theo chất từ A → K, một kho bài (stock) và chồng bỏ (waste).',
    'Xếp lá trên cột theo thứ tự giảm dần và xen kẽ màu đỏ/đen. Chỉ lá K (hoặc chuỗi bắt đầu bằng K) được đặt vào cột trống.',
    'Có thể chuyển cả chuỗi đúng thứ tự giữa các cột. Lá úp được lật khi lộ ra. Có Undo, Gợi ý và Chơi lại.',
    'Thắng khi cả 52 lá lên 4 nền. Game sẽ có ở đợt sau.'
  ]],
  freeCell: ['FreeCell', [
    '8 cột, tất cả lá đều ngửa (4 cột 7 lá, 4 cột 6 lá). 4 ô trống (free cell) mỗi ô chứa 1 lá, và 4 nền theo chất A → K.',
    'Xếp lá trên cột theo thứ tự giảm dần và xen kẽ màu. Cột trống đặt được lá bất kỳ.',
    'Số lá di chuyển cùng lúc tối đa = (số ô trống + 1) × 2^(số cột trống).',
    'Thắng khi cả 52 lá lên 4 nền. Có Undo và Gợi ý. Game sẽ có ở đợt sau.'
  ]],
  spider: ['Spider Solitaire', [
    'Dùng 104 lá với 1, 2 hoặc 4 chất. 10 cột (4 cột 6 lá, 6 cột 5 lá, chỉ lá cuối ngửa) và kho 50 lá.',
    'Xếp lá giảm dần (không cần xen màu). Chỉ di chuyển được cả chuỗi khi các lá cùng chất và liên tiếp.',
    'Bấm kho để chia 1 lá lên mỗi cột (không được có cột trống). Khi có đủ chuỗi K → A cùng chất thì chuỗi tự được gỡ khỏi bàn.',
    'Thắng khi gỡ hết 8 chuỗi. Game sẽ có ở đợt sau.'
  ]]
};
const RULES_EXTRA = [
  ['🏆 Giải đấu', [
    'Có 6 giải: Giải nhanh (8 người), Giải hàng ngày (16 người, mỗi ngày 1 lần), Giải khu vực (8 đại diện trong khu vực), Giải quốc gia (16 người, vòng bảng + loại trực tiếp), Giải châu lục (16 đại diện của châu lục) và World Solo Championship (32 quốc gia).',
    'Mỗi trận là một ván đấu 1-1 với AI đại diện quốc gia khác. Game thi đấu: Tiến Lên (3 bản) hoặc Sâm Lốc.',
    'Vòng bảng: chia bảng 4 đội, mỗi đội đá 3 trận. Thắng 3 điểm, hòa 1 điểm; xếp theo điểm, số trận thắng. Top 2 mỗi bảng vào vòng loại trực tiếp.',
    'Vòng loại trực tiếp: một ván quyết định. Thua là bị loại. Các trận của AI được mô phỏng bằng chính engine và AI của game.',
    'World Solo Championship: Vòng bảng (8 bảng) → Vòng 16 đội → Tứ kết → Bán kết → Chung kết → 🌎 WORLD CHAMPION.',
    'Giải đấu được lưu tự động. Mở lại game sẽ có lựa chọn "Tiếp tục giải đấu". Bỏ ván giữa chừng tính là thua trận đó.'
  ]],
  ['🏟️ Phòng chơi', [
    'Có 32 phòng, mỗi phòng 64 bàn (tổng 2.048 bàn). Phòng 1–8 AI Dễ, 9–16 AI Bình thường, 17–24 AI Khó, 25–32 AI Siêu khó.',
    'Mỗi bàn có game, số người, trạng thái: Đang chờ, Đang chơi, Đầy, Kết thúc. Chỉ bàn "Đang chờ" mới vào được; các ghế còn trống được AI lấp đầy.',
    'Dùng ô tìm phòng, tìm bàn, lọc game, lọc trạng thái và phân trang. Nút 🔄 làm mới danh sách bàn, ⚡ Vào nhanh chọn ngẫu nhiên một bàn đang chờ.'
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
  const fs = r === '10' ? 21 : 24;
  let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140">' +
    '<rect x="1" y="1" width="98" height="138" rx="9" fill="#fffdf8" stroke="#b9bcc4" stroke-width="2"/>' +
    '<g fill="' + col + '" font-family="Georgia,\'Times New Roman\',serif" font-weight="700" text-anchor="middle">';
  const corner = '<text x="15" y="25" font-size="' + fs + '">' + r + '</text><text x="15" y="44" font-size="19">' + sym + '</text>';
  s += corner + '<g transform="rotate(180 50 70)">' + corner + '</g>';
  if (r === 'J' || r === 'Q' || r === 'K') {
    s += '<rect x="28" y="30" width="44" height="80" rx="4" fill="none" stroke="' + col + '" stroke-width="2" opacity=".6"/>' +
      '<text x="50" y="82" font-size="46">' + r + '</text><text x="50" y="52" font-size="18">' + sym + '</text>' +
      '<g transform="rotate(180 50 70)"><text x="50" y="52" font-size="18">' + sym + '</text></g>';
  } else {
    const pos = PIP_POS[r];
    const size = r === 'A' ? 52 : 24;
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
function getCardBack() {
  if (!CARD_BACK_URI) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140"><defs><pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse">' +
      '<path d="M0 5L5 0L10 5L5 10Z" fill="none" stroke="#7fb0ff" stroke-width=".8" opacity=".55"/></pattern></defs>' +
      '<rect x="1" y="1" width="98" height="138" rx="9" fill="#1b3a8a" stroke="#fffdf8" stroke-width="3"/>' +
      '<rect x="8" y="8" width="84" height="124" rx="5" fill="url(#p)" stroke="#9cc2ff" stroke-width="1.5"/>' +
      '<circle cx="50" cy="70" r="17" fill="#142a66" stroke="#9cc2ff" stroke-width="1.5"/>' +
      '<text x="50" y="79" font-size="24" text-anchor="middle" fill="#fffdf8" font-family="Georgia,serif">♠</text></svg>';
    CARD_BACK_URI = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  return CARD_BACK_URI;
}
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
function calculateHandLayout(o) {
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
    v: 1,
    profile: { name: 'Your Name', avatar: '👨', country: 'VN', age: 18 },
    settings: { sound: true, effects: true, animation: true, reducedMotion: false, theme: 'dark', aiLevel: 1, turnTime: 15, players: {} },
    statistics: { total: 0, wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0, playTime: 0, tournaments: 0, championships: 0, games: {} },
    achievements: {},
    xp: 4250,
    level: 12,
    currentGame: null,
    currentMatch: null,
    tournament: null,
    rooms: { room: 1, epoch: (Date.now() % 100000) + 1 },
    tourMeta: { daily: '', game: 'tienLen', history: [] }
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
  x.profile.name = sanitizeName(x.profile.name) || 'Your Name';
  if (!COUNTRY_BY_CODE[x.profile.country]) x.profile.country = 'VN';
  x.profile.age = clamp(Math.round(Number(x.profile.age) || 18), 6, 120);
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
  const SOUNDS = {
    click: () => tone(560, 0.05, 'square', 0.03),
    deal: () => { tone(260, 0.06, 'triangle', 0.05); tone(190, 0.05, 'triangle', 0.04, 0.04); },
    card: () => { tone(380, 0.06, 'triangle', 0.06); tone(300, 0.05, 'triangle', 0.04, 0.03); },
    select: () => tone(720, 0.04, 'sine', 0.05),
    timer: () => tone(900, 0.07, 'square', 0.04),
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.07, i * 0.11)),
    lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.22, 'sawtooth', 0.04, i * 0.14)),
    notification: () => { tone(660, 0.08, 'sine', 0.06); tone(880, 0.1, 'sine', 0.06, 0.09); },
    achievement: () => [659, 784, 988, 1319, 1568].forEach((f, i) => tone(f, 0.16, 'triangle', 0.06, i * 0.09))
  };
  return {
    play(name) {
      if (!Data.settings.sound) return;
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
  return { amount, leveled };
}
function calcXP(outcome, diff, streak, specialCount) {
  let xp;
  if (outcome === 'win') xp = 80 + diff * 20 + Math.min(streak, 10) * 5 + specialCount * 30;
  else if (outcome === 'draw') xp = 35;
  else xp = 15 + diff * 5;
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
  if (gs.first && eng.mustFirst) list = list.filter(m => m.cards.some(c => c.id === gs.firstCardId));
  const moves = list.map(m => ({ type: 'play', cards: m.cards.map(c => c.id), combo: m }));
  return moves;
}
function shedCanPass(p) { const gs = gameState; return !!(gs.lastPlay && gs.lastPlay.player !== p); }
function shedScore(m, ctx) {
  const rem = ctx.hand.filter(c => !m.cards.includes(c.id));
  const turnsAfter = tlEstimateTurns(rem);
  let spend = 0; m.combo.cards.forEach(c => { spend += TL_IDX[c.rank] / 1; });
  let s = -turnsAfter * 10 - spend * (ctx.level >= 3 ? 3.2 : 2.2) + m.cards.length * 1.1;
  const prev = ctx.prev;
  if (prev) {
    const same = prev.type === m.combo.type && prev.len === m.combo.len;
    if (!same) s += (ctx.oppMin <= 3 || (prev.rank === 1 && ctx.level >= 2)) ? 4 : -7; // chặt: chỉ khi đáng
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
      const rankings = [{ p: o.winner, label: o.reason === 'trang' ? 'Ăn trắng — ' + o.label : 'Hết bài' }];
      others.forEach(p => {
        const left = gs.hands[p].length; let label = left + ' lá còn lại';
        if (cfg.penalty2 && gs.hands[p].some(c => c.rank === '2')) label += ' · Thối 2';
        if (left === gs.startCounts[p]) label += ' · Cóng';
        rankings.push({ p, label });
      });
      const specials = [];
      if (o.winner === 0) { if (o.reason === 'trang') specials.push('trang'); if (o.quadFinish) specials.push('quad'); }
      return { outcome: o.winner === 0 ? 'win' : 'lose', rankings, specials, headline: o.reason === 'trang' ? '🏆 ĂN TRẮNG' : null };
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
    if (o.reason === 'chanSam') { others.sort((a, b) => (a === o.loser ? 1 : 0) - (b === o.loser ? 1 : 0) || gs.hands[a].length - gs.hands[b].length); }
    const heads = { trang: 'Ăn trắng — ' + (o.label || ''), baoSamOk: 'SÂM! Đi hết không ai chặn', chanSam: 'Chặn Sâm thành công', out: 'Hết bài' };
    const rankings = [{ p: o.winner, label: heads[o.reason] }];
    others.forEach(p => rankings.push({ p, label: p === o.loser ? 'Báo Sâm thất bại' : gs.hands[p].length + ' lá còn lại' }));
    const specials = [];
    if (o.winner === 0) { if (o.reason === 'trang') specials.push('trang'); if (o.reason === 'baoSamOk') specials.push('baoSamOk'); if (o.reason === 'chanSam') specials.push('chanSam'); if (o.quadFinish) specials.push('quad'); }
    const headline = o.reason === 'trang' ? '🏆 ĂN TRẮNG' : o.reason === 'baoSamOk' ? '💥 SÂM!' : o.reason === 'chanSam' ? '🛡️ CHẶN SÂM' : null;
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

/* ============================ ĐĂNG KÝ ENGINE ============================ */
const GAME_ENGINES = {
  tienLen: makeTienLen('tienLen', { quad: true, dthong: false, dthongChatTwo: false, chatDoi2: false, dthong4ChatQuad: false, penalty2: false, white: ['rong', 'tuQuy2'] }),
  tienLenMienNam: makeTienLen('tienLenMienNam', { quad: true, dthong: true, dthongChatTwo: true, chatDoi2: true, dthong4ChatQuad: true, penalty2: true, white: ['rong', 'tuQuy2', '6doi'] }),
  tienLenMienBac: makeTienLen('tienLenMienBac', { quad: true, dthong: true, dthongChatTwo: true, chatDoi2: false, dthong4ChatQuad: false, penalty2: false, white: ['rong', 'tuQuy2', 'tuQuy3'] }),
  samLoc: SAM_ENGINE,
  xiDach: XD_ENGINE,
  blackjack: BJ_ENGINE
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
  quick: { name: 'Giải nhanh', icon: '⚡', size: 8, format: 'ko', reward: 150, desc: '8 người · đấu loại trực tiếp (Tứ kết → Bán kết → Chung kết).' },
  daily: { name: 'Giải hàng ngày', icon: '📅', size: 16, format: 'ko', reward: 250, daily: true, desc: '16 người · mỗi ngày tham gia 1 lần · bảng đấu giống nhau trong cùng một ngày.' },
  regional: { name: 'Giải khu vực', icon: '🗺️', size: 8, format: 'ko', reward: 350, pick: 'sub', desc: '8 đại diện trong một khu vực bạn chọn · loại trực tiếp.' },
  national: { name: 'Giải quốc gia', icon: '🏅', size: 16, format: 'groups', reward: 500, desc: '16 người cùng đại diện quốc gia của bạn · vòng bảng 3 trận rồi loại trực tiếp.' },
  continental: { name: 'Giải châu lục', icon: '🌍', size: 16, format: 'groups', reward: 800, pick: 'region', desc: '16 đại diện của một châu lục · vòng bảng rồi loại trực tiếp.' },
  world: { name: 'World Solo Championship', icon: '🌎', size: 32, format: 'groups', reward: 2000, desc: '32 quốc gia · 8 bảng · Vòng bảng → Vòng 16 đội → Tứ kết → Bán kết → Chung kết → WORLD CHAMPION.' }
};
const NEUTRAL_NAMES = ['Zara', 'Leo', 'Nina', 'Max', 'Mia', 'Ethan', 'Ivy', 'Theo', 'Luna', 'Oscar', 'Nora', 'Jade', 'Rex', 'Ada', 'Finn', 'Cleo', 'Milo', 'Vera', 'Axel', 'Lia', 'Ezra', 'Isla', 'Jude', 'Sora', 'Dara', 'Remy', 'Tess', 'Odin', 'Yara', 'Kira', 'Zane', 'Rhea', 'Nico', 'Elio', 'Maya', 'Alma', 'Soren', 'Tala', 'Idris', 'Anya', 'Joss', 'Lena', 'Ugo', 'Vik', 'Wren', 'Xena', 'Yuri', 'Zeke', 'Bram', 'Cora', 'Dax', 'Esme', 'Flor', 'Gus', 'Hana', 'Ilan', 'Juno', 'Kofi', 'Lior', 'Mina'];
const MD_PAIRS = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];

/* Mô phỏng một trận 1-1 bằng chính engine + AI thật (không đụng ván người chơi) */
function simulateH2H(gameId, lvA, lvB) {
  const saved = gameState, eng = GAME_ENGINES[gameId];
  let winner;
  try {
    eng.setup({ players: 2 });
    gameState.players[0].level = lvA; gameState.players[1].level = lvB;
    eng.deal();
    if (gameId === 'samLoc' && !gameState.over) {
      for (let i = 0; i < 2; i++) if (samAIWantsBao(gameState.hands[i], gameState.players[i].level)) { eng.declareBao(i); break; }
    }
    if (!gameState.over) gameState.phase = 'play';
    let guard = 0;
    while (!gameState.over && guard++ < 3000) {
      const p = gameState.turn, lv = gameState.players[p].level;
      let mv = null; try { mv = eng.aiChoose(p, lv); } catch (e) { mv = null; }
      if (!mv || !eng.validateMove(p, mv).ok) { mv = eng.timeoutMove(p); if (!eng.validateMove(p, mv).ok) mv = eng.getValidMoves(p)[0]; }
      eng.play(p, mv); if (gameState.over) break; eng.nextTurn();
    }
    winner = gameState.over ? gameState.over.winner : (Math.random() < 0.5 ? 0 : 1);
  } catch (e) { winner = Math.random() < 0.5 ? 0 : 1; }
  gameState = saved;
  return winner;
}

const Tour = {
  H2H_GAMES: ['tienLen', 'tienLenMienNam', 'tienLenMienBac', 'samLoc'],
  dateKey() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  stageLabel(T) {
    if (T.phase === 'group') return 'Vòng bảng — Lượt ' + (T.md + 1) + '/3';
    if (T.phase === 'done') return T.champion === 0 ? 'Vô địch' : 'Đã kết thúc';
    const m = T.round.length;
    return m >= 16 ? 'Vòng 32 đội' : m === 8 ? 'Vòng 16 đội' : m === 4 ? 'Tứ kết' : m === 2 ? 'Bán kết' : 'Chung kết';
  },
  build(defId, gameId, opt) {
    opt = opt || {};
    const def = TOURNAMENTS[defId], n = def.size;
    const rng = def.daily ? mulberry32(hashStr('daily' + this.dateKey() + gameId)) : Math.random;
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
    const neutral = shuffle(NEUTRAL_NAMES.filter(n => norm(n) !== myN && !names.some(a => a.name === n)));
    const take = code => { const i = names.findIndex(a => a.country === code); return i >= 0 ? names.splice(i, 1)[0] : { name: neutral.length ? neutral.pop() : names.pop().name, country: code }; };
    const avs = shuffle(AVATARS);
    const base = Data.settings.aiLevel === 4 ? 1 : Data.settings.aiLevel;
    const lvPick = [-1, 0, 0, 1];
    const players = [{ id: 0, name: Data.profile.name, avatar: Data.profile.avatar, country: me.name, code: me.code, flag: me.flag, level: -1, human: true }];
    codes.forEach((code, i) => {
      const c = COUNTRY_BY_CODE[code], a = take(code);
      players.push({ id: i + 1, name: a.name, avatar: avs[i % avs.length], country: c.name, code: c.code, flag: c.flag, level: clamp(base + lvPick[Math.floor(rng() * 4)], 0, 3), human: false });
    });
    const T = {
      v: 1, id: defId, name: def.name, icon: def.icon, gameId, size: n, players, phase: def.format === 'groups' ? 'group' : 'ko',
      groups: null, md: 0, stats: {}, tie: {}, round: [], log: [], status: 'active', outLabel: '', champion: null, pending: null,
      note: defId === 'regional' ? SUBREGIONS[opt.sub || 'sea'].name : defId === 'continental' ? REGIONS[opt.region || 'AS'] : '', startedAt: Date.now()
    };
    players.forEach(p => { T.tie[p.id] = Math.floor(rng() * 1e6); T.stats[p.id] = { w: 0, d: 0, l: 0, pts: 0 }; });
    const ids = [0].concat(shuffle(players.slice(1).map(p => p.id)));
    if (T.phase === 'group') { T.groups = []; for (let i = 0; i < ids.length; i += 4) T.groups.push(ids.slice(i, i + 4)); }
    else { for (let i = 0; i < ids.length; i += 2) T.round.push({ a: ids[i], b: ids[i + 1], w: null }); }
    return T;
  },
  start(defId, gameId, opt) {
    const def = TOURNAMENTS[defId];
    if (def.daily) Data.tourMeta.daily = this.dateKey();
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
  simWinner(T, a, b) { return simulateH2H(T.gameId, T.players[a].level, T.players[b].level) === 0 ? a : b; },
  logPush(T, a, b, w) { T.log.push({ s: this.stageLabel(T), a, b, w }); if (T.log.length > 90) T.log.shift(); },
  applyGroup(T, a, b, w) { const l = w === a ? b : a; T.stats[w].w++; T.stats[w].pts += 3; T.stats[l].l++; this.logPush(T, a, b, w); },
  rankGroup(T, g) {
    return T.groups[g].slice().sort((x, y) => { const A = T.stats[x], B = T.stats[y]; return B.pts - A.pts || B.w - A.w || T.tie[y] - T.tie[x]; });
  },
  buildKo(T) {
    const G = T.groups.length, win = [], run = [];
    for (let g = 0; g < G; g++) { const r = this.rankGroup(T, g); win.push(r[0]); run.push(r[1]); }
    const round = [];
    for (let g = 0; g < G; g += 2) round.push({ a: win[g], b: run[g + 1], w: null });
    for (let g = 0; g < G; g += 2) round.push({ a: win[g + 1], b: run[g], w: null });
    T.round = round; T.phase = 'ko';
  },
  nextRound(T) {
    const w = T.round.map(m => m.w), r = [];
    for (let i = 0; i < w.length; i += 2) r.push({ a: w[i], b: w[i + 1], w: null });
    return r;
  },
  simulateToEnd(T) {
    let guard = 0;
    while (guard++ < 10) {
      T.round.forEach(m => { if (m.w == null) { m.w = this.simWinner(T, m.a, m.b); this.logPush(T, m.a, m.b, m.w); } });
      if (T.round.length === 1) { T.champion = T.round[0].w; T.phase = 'done'; return; }
      T.round = this.nextRound(T);
    }
  },
  /* Gọi khi trận của người chơi kết thúc. Trả về dòng thông báo. */
  report(win) {
    const T = Data.tournament;
    if (!T || T.status !== 'active') return '';
    const pr = this.humanPair(T);
    T.pending = null;
    if (!pr) return '';
    const opp = pr[1], w = win ? 0 : opp;
    let note = '';
    if (T.phase === 'group') {
      this.applyGroup(T, 0, opp, w);
      T.groups.forEach((grp, gi) => {
        MD_PAIRS[T.md].forEach(p => {
          const a = grp[p[0]], b = grp[p[1]]; if (a === 0 || b === 0) return;
          this.applyGroup(T, a, b, this.simWinner(T, a, b));
        });
      });
      T.md++;
      if (T.md < 3) note = (win ? 'Thắng' : 'Thua') + ' — chuẩn bị lượt ' + (T.md + 1) + '/3';
      else {
        this.buildKo(T);
        if (!T.round.some(m => m.a === 0 || m.b === 0)) {
          T.status = 'out'; T.outLabel = 'Vòng bảng'; this.simulateToEnd(T); note = 'Bị loại ở vòng bảng';
        } else note = 'Vào vòng loại trực tiếp: ' + this.stageLabel(T);
      }
    } else {
      const mine = T.round.find(m => m.w == null && (m.a === 0 || m.b === 0));
      mine.w = w; this.logPush(T, mine.a, mine.b, w);
      T.round.forEach(m => { if (m.w == null) { m.w = this.simWinner(T, m.a, m.b); this.logPush(T, m.a, m.b, m.w); } });
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
    if (win) { T.status = 'champion'; Data.statistics.championships++; }
    const reward = win ? def.reward : Math.round(def.reward * 0.12);
    T.reward = reward; addXP(reward, 3000);
    Data.tourMeta.history.unshift({ name: T.name, game: T.gameId, result: win ? 'Vô địch 🏆' : 'Bị loại: ' + T.outLabel, date: this.dateKey() });
    if (Data.tourMeta.history.length > 8) Data.tourMeta.history.length = 8;
    const sp = []; if (win) { sp.push('champion'); if (T.id === 'world') sp.push('worldChampion'); }
    T.ach = checkAchievements(sp).map(a => a.name);
  },
  abandon() {
    const T = Data.tournament; if (!T) return;
    if (T.status === 'active') { Data.tourMeta.history.unshift({ name: T.name, game: T.gameId, result: 'Bỏ giải', date: this.dateKey() }); if (Data.tourMeta.history.length > 8) Data.tourMeta.history.length = 8; }
    Data.tournament = null; saveData();
  }
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
    const game = READY_GAMES[Math.floor(rng() * READY_GAMES.length)], m = GAME_META[game];
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
  setTimeout(() => { if (root) root.innerHTML = ''; }, 3600);
}

/* ---------- Toast ---------- */
function showToast(msg, type) {
  const root = $('#toast-root'); if (!root) return;
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
  if (card) e.dataset.id = card.id;
  if (opts.tag === 'button') { e.type = 'button'; e.setAttribute('aria-label', cardLabel(card)); }
  return e;
}

/* ---------- Điều hướng ---------- */
const SCREENS = ['home', 'games', 'play', 'tournament', 'rooms', 'profile', 'stats', 'achievements', 'settings', 'guide'];
const SCREEN_TITLES = { home: 'CARD MASTER', games: 'Chơi game', play: '', tournament: 'Giải đấu', rooms: 'Phòng chơi', profile: 'Hồ sơ', stats: 'Thống kê', achievements: 'Thành tích', settings: 'Cài đặt', guide: 'Hướng dẫn' };
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
  const prev = UI.stack.pop() || 'home';
  navigateTo(prev === 'play' ? 'home' : prev, { back: true });
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
};

/* ---------- Màn: Chọn game ---------- */
RENDERERS.games = function () {
  const root = $('#games-list'); root.textContent = '';
  READY_GAMES.forEach(id => root.appendChild(gameCard(id, true)));
  const lockedRoot = $('#games-locked'); lockedRoot.textContent = '';
  Object.keys(GAME_META).filter(k => !GAME_META[k].ready).forEach(id => lockedRoot.appendChild(gameCard(id, false)));
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
    tags.appendChild(h('span', 'tag', '👥 ' + (m.minP === m.maxP ? m.minP : m.minP + '–' + m.maxP) + (m.kind === 'bj' ? ' + nhà cái' : '')));
    tags.appendChild(h('span', 'tag', '⏱ ' + Data.settings.turnTime + 's'));
    tags.appendChild(h('span', 'tag', Data.settings.aiLevel === 4 ? '🎲 Ngẫu nhiên' : LEVEL_ICONS[Data.settings.aiLevel] + ' ' + LEVEL_NAMES[Data.settings.aiLevel]));
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
  Modal.open({
    title: m.name, body, buttons: [
      { text: '📖 Luật', keep: true, fn: () => showRules(id) },
      { text: 'CHƠI', cls: 'primary', fn: () => { Data.settings.players[id] = players; Data.settings.aiLevel = level; Data.settings.turnTime = time; saveData(); Match.start(id, { players }); } }
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
  $('#pf-xp-fill').style.width = xpBarHtml() + '%';
  $('#pf-xp-text').textContent = 'XP ' + fmt(Data.xp) + ' / ' + fmt(xpNeed(Data.level));
  const rate = st.total ? Math.round(st.wins / st.total * 100) : 0;
  const rows = [['🏆', 'Số trận', st.total], ['🥇', 'Thắng', st.wins], ['❌', 'Thua', st.losses], ['📈', 'Tỷ lệ thắng', rate + '%'],
    ['🔥', 'Chuỗi thắng', st.streak], ['⭐', 'Chuỗi tốt nhất', st.bestStreak], ['🎴', 'Số game đã chơi', Object.keys(st.games).length],
    ['🏟️', 'Số giải', st.tournaments], ['👑', 'Vô địch', st.championships], ['⏱️', 'Thời gian chơi', fmtTime(st.playTime)]];
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
  root.appendChild(toggleRow('✨ Hiệu ứng (pháo giấy)', 'effects'));
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
  const rs = h('div', 'setting'); rs.appendChild(h('span', '', '🗑️ Xoá toàn bộ dữ liệu'));
  const rb = h('button', 'btn small danger', 'Xoá'); rb.type = 'button'; rb.dataset.action = 'reset-data'; rs.appendChild(rb); root.appendChild(rs);
  if (!Store.ok) root.appendChild(h('p', 'err', '⚠️ Trình duyệt không cho lưu dữ liệu — tiến trình chỉ giữ trong phiên này.'));
};
function applySettings() {
  const s = Data.settings;
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
  sec('⭐ XP, hồ sơ, thành tích', ['Thắng ván được XP, độ khó càng cao XP càng nhiều. Không có tiền thật, nạp hay cược.', 'Hồ sơ, thống kê, thành tích và ván đang chơi tự lưu trong trình duyệt (LocalStorage).']);
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
    root.appendChild(h('h3', 'sub', T.phase === 'done' ? 'Vòng cuối' : 'Vòng hiện tại — ' + Tour.stageLabel(T)));
    T.round.forEach(m => {
      const row = h('div', 'match' + ((m.a === 0 || m.b === 0) ? ' me' : ''));
      [m.a, m.b].forEach((id, i) => {
        const s = h('span', 'mside' + (m.w === id ? ' win' : (m.w != null ? ' lose' : '')), tourPlayerName(T, id));
        row.appendChild(s); if (i === 0) row.appendChild(h('em', '', 'vs'));
      });
      root.appendChild(row);
    });
  }
  if (T.champion != null) root.appendChild(h('div', 'champ', '🏆 Vô địch: ' + tourPlayerName(T, T.champion)));
  if (T.log.length) {
    const d = h('details', 'acc'); d.appendChild(h('summary', '', 'Kết quả đã đấu (' + T.log.length + ')'));
    T.log.slice(-20).reverse().forEach(l => d.appendChild(h('p', 'small', l.s + ': ' + T.players[l.a].name + ' – ' + T.players[l.b].name + ' → ' + T.players[l.w].name + ' thắng')));
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
    }
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
    if (def.daily && Data.tourMeta.daily === Tour.dateKey()) { showToast('Hôm nay bạn đã tham gia giải hàng ngày — quay lại vào ngày mai', 'info'); return; }
    let game = Tour.H2H_GAMES.includes(Data.tourMeta.game) ? Data.tourMeta.game : 'tienLen', sub = 'sea', region = 'AS';
    const body = h('div', 'setup');
    body.appendChild(h('p', '', def.desc));
    body.appendChild(h('p', 'muted', 'Phần thưởng vô địch: +' + def.reward + ' XP · Mỗi trận là 1 ván đấu 1-1 với AI.'));
    body.appendChild(h('label', 'lbl', 'Game thi đấu'));
    body.appendChild(segmented(Tour.H2H_GAMES, game, v => { game = v; }, v => GAME_META[v].name.replace('Tiến Lên ', 'TL ')));
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
          Tour.start(id, game, { sub, region }); RENDERERS.tournament(); showToast('Đã vào giải — chúc may mắn!', 'success'); SFX.play('notification');
        } }
      ]
    });
  }
};
RENDERERS.tournament = function () {
  const root = $('#tour-body'); root.textContent = '';
  const T = Data.tournament;
  if (T) root.appendChild(tourStatusCard(T));
  root.appendChild(h('h3', 'sub', 'Các giải đấu'));
  Object.keys(TOURNAMENTS).forEach(id => {
    const def = TOURNAMENTS[id];
    const card = h('article', 'tour-card');
    card.appendChild(h('h3', '', def.icon + ' ' + def.name)); card.appendChild(h('p', 'muted', def.desc));
    const done = def.daily && Data.tourMeta.daily === Tour.dateKey();
    const b = h('button', 'btn small primary', done ? 'Đã tham gia hôm nay' : 'THAM GIA'); b.type = 'button'; if (done) b.disabled = true;
    b.addEventListener('click', () => Tour2.setup(id));
    card.appendChild(b); root.appendChild(card);
  });
  if (Data.tourMeta.history.length) {
    root.appendChild(h('h3', 'sub', 'Lịch sử giải đấu'));
    Data.tourMeta.history.forEach(x => root.appendChild(h('div', 'trow hist', x.date + ' · ' + x.name + ' · ' + (GAME_META[x.game] ? GAME_META[x.game].name : '') + ' — ' + x.result)));
  }
};

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
  READY_GAMES.forEach(id => { const o = h('option', '', GAME_META[id].name); o.value = id; gs.appendChild(o); });
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
  $('#table-cards').textContent = ''; $('#hand').textContent = '';
  $('#screen-play').dataset.kind = eng.kind;
  $('#screen-play').classList.remove('win-glow');
}
function playMetrics() {
  const v = viewport(), landscape = v.w > v.h;
  return { v, landscape, handH: Math.round(v.h * (landscape ? (v.h < 400 ? 0.3 : 0.34) : 0.31)) };
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
  const sa = safeInsets();
  const L = calculateHandLayout({
    viewportWidth: wrap.clientWidth - 12, viewportHeight: wrap.clientHeight - 20, cardCount: n, cardWidth: 84, gap: 5,
    safeArea: { left: 0, right: 0, top: 0, bottom: 0 }, orientation: playMetrics().landscape ? 'landscape' : 'portrait'
  });
  hand.style.setProperty('--cw', L.cardWidth + 'px'); hand.style.setProperty('--ch', L.cardHeight + 'px');
  hand.style.gap = L.gap + 'px'; hand.style.width = (L.totalWidth + 1) + 'px';
}
function layoutTable() {
  const box = $('#table-cards'), tc = $('#table-cards'); if (!box) return;
  const n = box.children.length; if (!n) return;
  const L = calculateHandLayout({ viewportWidth: box.clientWidth - 8, viewportHeight: box.clientHeight - 6, cardCount: n, cardWidth: 64, gap: 4 });
  box.style.setProperty('--cw', L.cardWidth + 'px'); box.style.setProperty('--ch', L.cardHeight + 'px'); box.style.gap = L.gap + 'px';
}
function renderHand() {
  const gs = gameState, hand = $('#hand'); const eng = Match.engine;
  let cards;
  if (eng.kind === 'shed') cards = gs.hands[0];
  else cards = gs.hands[0].reduce((a, x) => a.concat(x.cards), []);
  const key = cards.map(c => c.id).join(',');
  const sel = UI.selected;
  [...sel].forEach(id => { if (!cards.some(c => c.id === id)) sel.delete(id); });
  if (key === UI.handKey) { $$('.card', hand).forEach(e => e.classList.toggle('selected', sel.has(e.dataset.id))); return false; }
  const newCards = !UI.handKey || cards.length > hand.children.length;
  UI.handKey = key; hand.textContent = '';
  cards.forEach(c => {
    const e = createCardElement(c, { tag: 'button' }); e.classList.add('hand-card'); if (sel.has(c.id)) e.classList.add('selected'); hand.appendChild(e);
  });
  layoutHand();
  return true;
}
function renderSeats() {
  const gs = gameState, eng = Match.engine;
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
  if (eng.kind === 'shed') {
    const moves = myTurn ? eng.getValidMoves(0) : [];
    const canPass = moves.some(m => m.type === 'pass');
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
function animateDeal() {
  const deck = $('#deck-pile'); if (!deck || !canAnimate()) return 0;
  const from = rectCenter(deck); let i = 0;
  $$('#hand .card').forEach(e => { flyEl(e, from, { dur: 380, delay: i * 45, rot: -25, scale: 0.4 }); i++; });
  const total = Math.min(i, 13);
  Object.keys(UI.seats).forEach(k => { const a = $('.seat-av', UI.seats[k].root); if (a && a.animate) a.animate([{ transform: 'scale(.8)' }, { transform: 'scale(1)' }], { duration: 260, delay: k * 80 }); });
  $$('#table-cards .card, .mini-row .card').forEach((e, j) => flyEl(e, from, { dur: 360, delay: 120 + j * 55, rot: 20, scale: 0.4 }));
  for (let k = 0; k < Math.min(total, 6); k++) setTimeout(() => SFX.play('deal'), k * 90);
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
  humanTurn() { const gs = gameState; return this.running && !gs.over && gs.phase === 'play' && gs.turn === 0 && !(this.engine.kind === 'bj' && this.engine.isDealerTurn()); },
  start(gameId, extra) {
    extra = extra || {};
    try {
      Modal.closeAll(); this.cleanup();
      this.gameId = gameId; this.engine = GAME_ENGINES[gameId]; this.running = true;
      this.extra = extra; this.tour = !!extra.tour; this.roomCtx = extra.room || null;
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
      if (yes) { eng.declareBao(0); showToast('💥 Bạn báo Sâm! Phải thắng mọi vòng', 'warning'); SFX.play('notification'); }
      else { const who = eng.aiBaoCheck(); if (who > 0) { showToast('💥 ' + gs.players[who].name + ' BÁO SÂM — hãy chặn!', 'warning'); SFX.play('notification'); } }
      gs.phase = 'play'; this.persist(); this.advance();
    };
    const m = Modal.open({
      title: '💥 Báo Sâm?', closable: false,
      body: 'Báo Sâm = phải đi hết 10 lá mà không ai chặn được. Chặn thành công thì người báo thua. Có chắc bài mạnh không?',
      buttons: [{ text: 'Không báo', fn: () => decide(false) }, { text: 'BÁO SÂM', cls: 'primary', fn: () => decide(true) }]
    });
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
    if (eng.kind === 'bj' && eng.isDealerTurn()) { this.dealerLoop(); return; }
    if (this.humanTurn()) {
      TurnTimer.startTimer(gs.settings ? gs.settings.turnTime : Data.settings.turnTime, () => this.humanTimeout());
    } else {
      TurnTimer.stopTimer();
      const p = gs.turn, lv = gs.players[p].level;
      const wait = 650 + rand(650) + (lv >= 2 ? 150 : 0);
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
    if (!v.ok) { showToast('⚠️ Nước đi không hợp lệ — ' + (v.reason || ''), 'warning'); SFX.play('notification'); return; }
    TurnTimer.stopTimer(); UI.selected.clear(); this.commit(0, mv);
  },
  commit(p, mv) {
    const eng = this.engine, gs = gameState;
    // ghi nhận vị trí xuất phát của bài để làm animation bay
    const rects = {};
    if (mv.type === 'play' && mv.cards) {
      if (p === 0) mv.cards.forEach(id => { const e = $('#hand .card[data-id="' + id + '"]'); if (e) rects[id] = rectCenter(e); });
      const seat = UI.seats[p] ? $('.seat-av', UI.seats[p].root) : null;
      rects._default = seat ? rectCenter(seat) : rectCenter($('#hand'));
    }
    const info = eng.play(p, mv);
    if (info.type === 'play') { SFX.play('card'); }
    else if (info.type === 'pass') { showToast(gs.players[p].name + ' bỏ lượt', 'info'); }
    else if (eng.kind === 'bj') SFX.play('card');
    renderBoard(rects);
    if (info.type === 'hit' || info.type === 'double' || info.type === 'split' || info.type === 'dealerHit') {
      const hand = p === 0 && info.type !== 'dealerHit' ? $$('#hand .card') : [];
      const last = hand[hand.length - 1]; if (last) flyEl(last, rectCenter($('#deck-pile')), { dur: 320, rot: 15, scale: 0.5 });
    }
    this.afterMove(info);
  },
  afterMove() {
    if (!this.running) return;
    const gs = gameState, eng = this.engine;
    if (gs.over) { this.persist(); Timers.set(() => this.finish(), 600); return; }
    const wasLead = gs.lastPlay;
    eng.nextTurn();
    if (gs.newRound && eng.kind === 'shed') { // thu bài về chồng rồi vòng mới
      gs.newRound = false; this.persist();
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
    // phơi bài tất cả để xem kết quả (bj đã mở)
    const seconds = this.elapsedBefore + (Date.now() - this.startedAt) / 1000;
    const diff = gs.players.slice(1).reduce((a, p) => a + Math.max(0, p.level), 0) / Math.max(1, gs.players.length - 1);
    const specials = res.specials.slice();
    if (res.outcome === 'win' && eng.kind === 'shed' && gs.players.length > 1 && gs.players.slice(1).every(p => p.level === 3)) specials.push('beatHard');
    recordMatch(this.gameId, res.outcome, seconds);
    const isTour = this.tour;
    const xp = calcXP(res.outcome, Math.round(diff), Data.statistics.streak, specials.filter(s => ['trang', 'baoSamOk', 'chanSam', 'blackjack', 'xibang', 'nguLinh', 'quad'].includes(s)).length);
    const before = Data.level; const add = addXP(xp);
    const ach = checkAchievements(specials);
    Data.currentMatch = null; Data.currentGame = null; saveData();
    this.running = false; this.token++;
    let tourNote = '';
    if (isTour) { try { tourNote = Tour.report(res.outcome === 'win'); } catch (e) { handleError(e); } this.tour = false; }
    renderBoard(); // trạng thái cuối
    if (res.outcome === 'win') { SFX.play('win'); confetti(); $('#screen-play').classList.add('win-glow'); } else if (res.outcome === 'lose') SFX.play('lose'); else SFX.play('notification');
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
    const forfeit = clear && ((this.running && this.tour) || (Data.currentMatch && Data.currentMatch.tour));
    this.cleanup();
    if (clear) { Data.currentMatch = null; Data.currentGame = null; saveData(); }
    if (forfeit) { try { Tour.report(false); } catch (e) { handleError(e); } this.tour = false; showToast('Bỏ ván giải đấu — tính là thua trận này', 'warning'); }
  },
  cleanup() {
    this.token++; this.running = false; TurnTimer.stopTimer(); Timers.clearAll(); UI.lock = false;
  },
  resume() {
    const cm = Data.currentMatch;
    try {
      if (!cm || !GAME_ENGINES[cm.gameId]) throw new Error('Không có ván để tiếp tục');
      Modal.closeAll(); this.cleanup();
      gameState = Object.assign(newGameState(), JSON.parse(JSON.stringify(cm.state), cardReviver));
      this.gameId = cm.gameId; this.engine = GAME_ENGINES[cm.gameId]; this.running = true;
      this.tour = !!cm.tour; this.roomCtx = cm.room || null; this.extra = cm.extra || {};
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
  gs.players.forEach((p, i) => {
    let t;
    if (Match.engine.kind === 'shed') t = gs.hands[i].map(cardShort).join(' ') || '(hết bài)';
    else t = gs.hands[i].map(hd => hd.cards.map(cardShort).join(' ')).join(' | ');
    body.appendChild(h('p', '', p.name + ': ' + t));
  });
  if (gs.dealer) body.appendChild(h('p', '', 'Nhà cái: ' + gs.dealer.cards.map(cardShort).join(' ')));
  Modal.open({ title: 'Chi tiết ván', body, buttons: [{ text: 'Đóng', cls: 'primary' }] });
}

/* ============================ 13. SỰ KIỆN & KHỞI TẠO ============================ */
function onHandClick(e) {
  const c = e.target.closest('.hand-card'); if (!c || UI.lock) return;
  const id = c.dataset.id;
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
    case 'hint': {
      if (!Match.humanTurn()) return; const mv = Match.engine.hint(0);
      UI.selected.clear();
      if (mv.type === 'pass') showToast('💡 Gợi ý: bỏ lượt', 'info');
      else { mv.cards.forEach(id => UI.selected.add(id)); renderHand(); showToast('💡 Đã chọn nước gợi ý', 'info'); }
      break;
    }
    case 'pass': Match.humanMove({ type: 'pass' }); break;
    case 'play': Match.humanMove({ type: 'play', cards: [...UI.selected] }); break;
    case 'bj-hit': Match.humanMove({ type: 'hit' }); break;
    case 'bj-stand': Match.humanMove({ type: 'stand' }); break;
    case 'bj-double': Match.humanMove({ type: 'double' }); break;
    case 'bj-split': Match.humanMove({ type: 'split' }); break;
    default: break;
  }
}
let _layoutQueued = false;
function onResize() {
  if (_layoutQueued) return; _layoutQueued = true;
  requestAnimationFrame(() => { _layoutQueued = false; setAppHeight(); layoutPlay(); });
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
  applySettings(); setAppHeight(); setIcons();
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-action]'); if (!t || t.disabled) return;
    SFX.unlock(); if (t.dataset.action !== 'play') SFX.play('click');
    try { doAction(t.dataset.action, t); } catch (err) { handleError(err); }
  });
  document.addEventListener('pointerdown', () => SFX.unlock(), { once: true });
  $('#hand').addEventListener('click', onHandClick);
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
    if (document.hidden) { if (Match.running) { TurnTimer.pauseTimer(); Match.persist(); } }
    else if (Match.running && !Modal.stack.length) TurnTimer.resumeTimer();
  });
  window.addEventListener('pagehide', () => { if (Match.running) Match.persist(); });
  window.addEventListener('error', e => handleError(e.error || e.message));
  window.addEventListener('unhandledrejection', e => handleError(e.reason));
  try { const mq = window.matchMedia('(prefers-color-scheme: dark)'); (mq.addEventListener ? mq.addEventListener('change', applySettings) : mq.addListener && mq.addListener(applySettings)); } catch (e) { }
  navigateTo('home', { noStack: true });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $('#loading').classList.add('hide'); $('#app').hidden = false; setTimeout(() => { $('#loading').hidden = true; }, 250);
    if (Data.currentMatch && GAME_ENGINES[Data.currentMatch.gameId]) {
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
