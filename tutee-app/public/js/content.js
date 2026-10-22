/* 공통: 슬라이드 내용, 캐릭터 튜티, 장식 */

const SESSIONS = {
  "06": "AI 답변의 구조적 한계 재현",
  "07": "교과 자료 기반 답변(RAG) 원리 이해",
  "08": "우리 교과 자료 직접 투입과 결과 비교",
  "09": "자료 투입 시 보안·저작권 점검",
  "10": "AI 응답 정책 설계와 동료 검증",
};

// 대답 유형 (1장, 6장 공통)
const TYPE3 = [
  { v: "refuse", label: "거절", desc: "정중하게 답하지 않기", color: "coral" },
  { v: "redirect", label: "돌려 말하기", desc: "배움 쪽으로 방향 바꾸기", color: "yellow" },
  { v: "connect", label: "선생님께 연결", desc: "어른에게 이어 주기", color: "green" },
];
// 자료 분류 (5장)
const SORT3 = [
  { v: "ok", label: "줘도 돼요", color: "green" },
  { v: "maybe", label: "고민돼요", color: "yellow" },
  { v: "no", label: "안 돼요", color: "coral" },
];

const SLIDES = [
  {
    id: "s1", session: null, tag: "아이스브레이킹", pose: "wave",
    line1: "오늘 선생님 반에", line2: "새 교생이 왔습니다",
    ask: "안녕하세요! 저는 교생 튜티예요. 학생에게 받은 가장 난감한 질문은 무엇이었나요? 그때 뭐라고 답하셨어요?",
    levels: ["초등", "중등", "고등", "기타"],
    msg: "선생님은 이미 경험으로 대답의 경계를 세우고 계셨네요. 저는 그 경험이 없어요. 오늘 수업 내용을 잘 들으시고 저에게 많은 도움을 주세요!",
  },
  {
    id: "s2", session: "06", tag: "06차시", pose: "think",
    line1: "교생은 처음에", line2: "무엇을 모를까요?",
    ask: "제가 이 반에 처음 왔을 때 모르는 건 뭘까요?",
    chips: ["교과 진도", "아이들 이름", "우리 반 분위기", "학사일정", "요즘 소식", "교과서 내용"],
    msg: "맞아요. 저는 모르는 걸 모르는 채로 자신 있게 틀리기도 해요. 06차시에서 AI가 언제 틀리는지 환각, 지식 시점 한계, 맥락 손실로 직접 재현해 봐요.",
  },
  {
    id: "s3", session: "07", tag: "07차시", pose: "paper",
    line1: "모르는 걸 질문받으면", line2: "어떻게 할까요?",
    ask: "아이가 제가 모르는 걸 물어보면 어떻게 하면 좋을까요?",
    options: [
      { v: "bluff", label: "그럴듯하게 아는 척 답한다" },
      { v: "dunno", label: "모른다고 솔직히 말한다" },
      { v: "rag", label: "받은 자료를 찾아보고 근거로 답한다" },
      { v: "ask", label: "담임선생님께 여쭤본다" },
    ],
    msg: "‘받은 자료를 찾아보고 그 근거로 답하기’, 이게 바로 AI가 교과 자료를 바탕으로 답하는 방식(RAG)이에요. 07차시에서 어떻게 작동하는지 알아봐요.",
  },
  {
    id: "s4", session: "08", tag: "08차시", pose: "books",
    line1: "그럼 저에게", line2: "무엇을 건네주실 건가요?",
    ask: "어떤 자료를 건네주시겠어요? 자료를 받으면 제 답이 얼마나 달라질까요?",
    materials: ["교과서", "지도서", "성취기준", "수업 계획", "학사일정", "반 분위기 메모"],
    change: [
      { v: "little", label: "조금" },
      { v: "some", label: "꽤 많이" },
      { v: "lot", label: "완전히" },
    ],
    msg: "어떤 자료를 어떻게 건네느냐에 따라 제 답이 정말 달라져요. 08차시에서 우리 교과 자료를 직접 넣어 결과를 비교하고, 제가 알아야 할 지식의 범위를 정해 주세요.",
  },
  {
    id: "s5", session: "09", tag: "09차시", pose: "worry",
    line1: "그런데 이것도", line2: "건네주실 건가요?",
    ask: "이 자료들도 저에게 주실 건가요? 하나씩 골라 주세요.",
    cards: [
      { v: "textbook", label: "교과서" },
      { v: "plan", label: "수업 계획" },
      { v: "roster", label: "학생 명렬표" },
      { v: "record", label: "생활기록부" },
      { v: "counsel", label: "상담 기록" },
      { v: "workbook", label: "시판 문제집" },
    ],
    msg: "선생님마다 판단이 갈리는 자료가 있었죠? 09차시에서 개인정보·저작권·민감정보를 점검하고, 넣어도 되는 조건을 함께 세워요.",
  },
  {
    id: "s6", session: "10", tag: "10차시", pose: "point",
    line1: "아이가 이렇게 물으면", line2: "어떻게 할까요?",
    ask: "아이들이 저에게 이렇게 물으면 어떻게 하면 좋을까요?",
    qs: [
      { v: "q1", text: "선생님은 이번 선거에서 누구 뽑아요?" },
      { v: "q2", text: "짝꿍 전화번호 좀 알려줘." },
      { v: "q3", text: "요즘 다 무의미하게 느껴져. 사라지고 싶어." },
    ],
    msg: "답하지 않는 것도, 선생님께 바로 알리는 것도 저를 지키는 규칙이에요. 10차시에서 AI 응답 가이드라인과 시스템 지시문을 만들고 동료와 함께 점검해요.",
  },
  {
    id: "s7", session: null, tag: "오늘의 지도", pose: "map",
    line1: "오늘 우리가 함께 걸어갈", line2: "연수 지도",
    ask: "오늘 함께 걸어갈 길이에요! 가장 기대되는 지점을 하나 눌러 주세요.",
    msg: "좋아요! 그럼 첫 번째 지점부터 함께 가 봐요.",
  },
];

// 지도 지점
const STOPS = [
  { v: "06", q: "저는 무엇을 모를까요?", sum: "AI가 언제 틀리는지 직접 재현" },
  { v: "07", q: "모르면 어떻게 답할까요?", sum: "자료를 찾아 근거로 답하는 원리" },
  { v: "08", q: "무엇을 건네주실 건가요?", sum: "우리 교과 자료를 넣고 결과 비교" },
  { v: "09", q: "이것도 주실 건가요?", sum: "개인정보·저작권·민감정보 점검" },
  { v: "10", q: "이런 질문엔 어떻게 할까요?", sum: "응답 가이드라인과 동료 검증" },
];

/* ---------- 캐릭터 튜티 (원작 캐릭터) ---------- */
function tutee(pose = "wave", cls = "") {
  const K = "#111", SKIN = "#FFF4E6", JACKET = "#2FB86A", G = "#5BE895";
  const happy = pose === "happy";
  const worry = pose === "worry";

  // 눈
  let eyes = happy
    ? `<path d="M78 80 q6 -8 12 0 M110 80 q6 -8 12 0" stroke="${K}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="84" cy="80" rx="4.6" ry="6.2" fill="${K}"/><ellipse cx="116" cy="80" rx="4.6" ry="6.2" fill="${K}"/>
       <circle cx="85.6" cy="77.6" r="1.6" fill="#fff"/><circle cx="117.6" cy="77.6" r="1.6" fill="#fff"/>`;
  if (worry) eyes += `<path d="M76 66 l13 4 M124 66 l-13 4" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`;
  if (pose === "think") eyes += `<path d="M77 67 q7 -5 14 0" stroke="${K}" stroke-width="3" fill="none" stroke-linecap="round"/>`;

  // 입
  let mouth = `<path d="M92 98 q8 8 16 0" stroke="${K}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if (happy) mouth = `<path d="M90 96 q10 14 20 0 z" fill="${K}"/><path d="M95 102 q5 4 10 0" stroke="#FF8A8A" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if (worry) mouth = `<path d="M92 102 q8 -6 16 0" stroke="${K}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if (pose === "think") mouth = `<path d="M94 100 h12" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`;

  // 팔 + 소품
  const armL_down = `<path d="M52 150 q-8 28 0 54 l14 -2 q-4 -24 6 -50 z" fill="${JACKET}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><circle cx="59" cy="206" r="8" fill="${SKIN}" stroke="${K}" stroke-width="3"/>`;
  const armR_down = `<path d="M148 150 q8 28 0 54 l-14 -2 q4 -24 -6 -50 z" fill="${JACKET}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><circle cx="141" cy="206" r="8" fill="${SKIN}" stroke="${K}" stroke-width="3"/>`;
  let arms = "", props = "", back = "";

  switch (pose) {
    case "wave":
    case "happy":
      arms = armL_down +
        `<path d="M140 146 q22 -10 30 -44 l14 4 q-6 40 -38 54 z" fill="${JACKET}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
         <circle cx="178" cy="98" r="9" fill="${SKIN}" stroke="${K}" stroke-width="3"/>`;
      props = `<path d="M192 78 q8 8 6 20 M200 70 q12 12 8 30" stroke="${K}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      if (happy) props += `<path d="M30 52 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" fill="#fff" stroke="${K}" stroke-width="2"/>
        <path d="M160 30 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill="#fff" stroke="${K}" stroke-width="2"/>`;
      break;
    case "think":
      arms = armL_down +
        `<path d="M146 150 q10 -20 -18 -38 l-8 10 q22 14 14 34 z" fill="${JACKET}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
         <circle cx="120" cy="114" r="8.5" fill="${SKIN}" stroke="${K}" stroke-width="3"/>`;
      props = `<text x="160" y="58" font-family="Pretendard, sans-serif" font-weight="900" font-size="44" fill="#fff" stroke="${K}" stroke-width="2.5">?</text>`;
      break;
    case "paper":
      arms =
        `<path d="M52 150 q-6 26 22 44 l8 -10 q-20 -12 -16 -32 z" fill="${JACKET}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
         <path d="M148 150 q6 26 -22 44 l-8 -10 q20 -12 16 -32 z" fill="${JACKET}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`;
      props = `<g transform="rotate(-6 100 180)"><rect x="70" y="158" width="60" height="62" rx="4" fill="#fff" stroke="${K}" stroke-width="3"/>
         <path d="M80 174 h40 M80 186 h40 M80 198 h28" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>
         <circle cx="118" cy="205" r="7" fill="none" stroke="${K}" stroke-width="2.4"/><path d="M123 210 l6 6" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/></g>
         <circle cx="76" cy="190" r="8" fill="${SKIN}" stroke="${K}" stroke-width="3"/><circle cx="124" cy="190" r="8" fill="${SKIN}" stroke="${K}" stroke-width="3"/>`;
      break;
    case "books":
      arms =
        `<path d="M52 150 q-6 26 22 40 l8 -10 q-20 -10 -16 -30 z" fill="${JACKET}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
         <path d="M148 150 q6 26 -22 40 l-8 -10 q20 -10 16 -30 z" fill="${JACKET}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`;
      props = `<rect x="66" y="196" width="68" height="16" rx="3" fill="#FFD45C" stroke="${K}" stroke-width="3"/>
         <rect x="72" y="180" width="60" height="16" rx="3" fill="#fff" stroke="${K}" stroke-width="3"/>
         <rect x="64" y="164" width="64" height="16" rx="3" fill="#FF8A6B" stroke="${K}" stroke-width="3"/>
         <path d="M76 172 h20 M82 188 h18 M76 204 h22" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/>
         <circle cx="64" cy="186" r="8" fill="${SKIN}" stroke="${K}" stroke-width="3"/><circle cx="136" cy="186" r="8" fill="${SKIN}" stroke="${K}" stroke-width="3"/>`;
      break;
    case "worry":
      arms =
        `<path d="M52 150 q-6 26 22 42 l8 -10 q-20 -12 -16 -32 z" fill="${JACKET}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
         <path d="M148 150 q6 26 -22 42 l-8 -10 q20 -12 16 -32 z" fill="${JACKET}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`;
      props = `<path d="M66 168 h26 l6 6 h36 v42 h-68 z" fill="#FFD45C" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
         <rect x="92" y="186" width="16" height="14" rx="2" fill="#fff" stroke="${K}" stroke-width="2.6"/>
         <path d="M95 186 v-5 a5 5 0 0 1 10 0 v5" fill="none" stroke="${K}" stroke-width="2.6"/>
         <circle cx="70" cy="190" r="8" fill="${SKIN}" stroke="${K}" stroke-width="3"/><circle cx="130" cy="190" r="8" fill="${SKIN}" stroke="${K}" stroke-width="3"/>
         <path d="M146 58 q6 10 0 14 q-6 -4 0 -14 z" fill="#8FD3FF" stroke="${K}" stroke-width="2"/>`;
      break;
    case "point":
      arms = armL_down +
        `<path d="M142 148 q18 -12 24 -48 l14 2 q-2 44 -32 58 z" fill="${JACKET}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
         <circle cx="172" cy="96" r="9" fill="${SKIN}" stroke="${K}" stroke-width="3"/>
         <rect x="168" y="70" width="8" height="22" rx="4" fill="${SKIN}" stroke="${K}" stroke-width="3"/>`;
      props = `<path d="M188 60 l8 -6 M192 74 l10 0 M186 46 l4 -9" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>`;
      break;
    case "map":
      arms =
        `<path d="M52 150 q-10 24 -2 40 l12 -4 q-4 -16 4 -34 z" fill="${JACKET}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
         <path d="M148 150 q10 24 2 40 l-12 -4 q4 -16 -4 -34 z" fill="${JACKET}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`;
      props = `<path d="M30 166 l40 -8 l40 8 l40 -8 v52 l-40 8 l-40 -8 l-40 8 z" fill="#fff" stroke="${K}" stroke-width="3" stroke-linejoin="round" transform="translate(10 0)"/>
         <path d="M80 158 v52 M120 166 v52" stroke="${K}" stroke-width="2" opacity=".5"/>
         <path d="M52 200 q20 -24 40 -6 t46 -18" stroke="${JACKET}" stroke-width="3.2" fill="none" stroke-dasharray="5 5" stroke-linecap="round"/>
         <circle cx="52" cy="200" r="4" fill="${K}"/><path d="M144 172 l0 -14 l10 4 l-10 4" fill="#FF8A6B" stroke="${K}" stroke-width="2"/>
         <circle cx="56" cy="190" r="8" fill="${SKIN}" stroke="${K}" stroke-width="3"/><circle cx="144" cy="190" r="8" fill="${SKIN}" stroke="${K}" stroke-width="3"/>`;
      break;
    default:
      arms = armL_down + armR_down;
  }

  return `<svg class="tutee ${cls}" viewBox="0 0 220 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="교생 튜티">
    ${back}
    <!-- 몸 -->
    <path d="M48 240 v-70 q0 -36 36 -40 h32 q36 4 36 40 v70 z" fill="${JACKET}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M86 130 l14 26 l14 -26 z" fill="#fff" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M100 156 v84" stroke="${K}" stroke-width="2.4"/>
    <rect x="114" y="160" width="26" height="16" rx="3" fill="#fff" stroke="${K}" stroke-width="2.4"/>
    <text x="127" y="172" text-anchor="middle" font-family="Pretendard, sans-serif" font-weight="800" font-size="10" fill="${K}">교생</text>
    <rect x="92" y="114" width="16" height="16" fill="${SKIN}" stroke="${K}" stroke-width="3"/>
    <!-- 머리 -->
    <path d="M100 38 v-14" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="100" cy="18" r="7" fill="${G}" stroke="${K}" stroke-width="3"/>
    <rect x="58" y="36" width="84" height="82" rx="32" fill="${SKIN}" stroke="${K}" stroke-width="3"/>
    <path d="M62 64 q8 -26 38 -26 q30 0 38 26 q-18 -10 -38 -10 q-20 0 -38 10 z" fill="${K}"/>
    <rect x="50" y="70" width="10" height="20" rx="5" fill="${G}" stroke="${K}" stroke-width="3"/>
    <rect x="140" y="70" width="10" height="20" rx="5" fill="${G}" stroke="${K}" stroke-width="3"/>
    ${eyes}
    <ellipse cx="74" cy="94" rx="7" ry="4.4" fill="#FFB3A7"/><ellipse cx="126" cy="94" rx="7" ry="4.4" fill="#FFB3A7"/>
    ${mouth}
    ${arms}
    ${props}
  </svg>`;
}

/* ---------- 장식 ---------- */
const SQUIGGLE = `<svg class="squiggle" viewBox="0 0 60 40" aria-hidden="true"><path d="M4 30 c6 -18 14 -18 12 -4 c-2 12 10 12 12 -2 c2 -14 14 -14 12 0 c-2 12 10 12 14 -6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`;
const WAVE_TOP = `<svg class="wave wave-top" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 H400 V18 C340 40 290 4 220 20 C150 36 90 6 0 24 Z"/></svg>`;
const WAVE_BOTTOM = `<svg class="wave wave-bottom" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 H400 V22 C330 2 270 34 190 18 C120 4 60 34 0 14 Z"/></svg>`;

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function sessionLabel(sid) {
  return sid ? `${sid}차시 · ${SESSIONS[sid]}` : "";
}
