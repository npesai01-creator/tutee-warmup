/* 관리자(강사) 진행 화면 */
(() => {
  const app = document.getElementById("app");
  const PIN_KEY = "tutee-warmup-pin";
  const POLL_MS = 2500;

  let pin = (() => { try { return sessionStorage.getItem(PIN_KEY) || ""; } catch { return ""; } })();
  let state = { slide: 0, round: 1 };
  let people = [];
  let big = false;
  let leftKey = "";
  let timer = null;
  let lastSig = "";
  const seen = new Set();
  // 처음 보는 답에만 등장 효과
  const fresh = (p, sid) => { const k = p.pid + sid + (p.answers[sid] && p.answers[sid].at); if (seen.has(k)) return ""; seen.add(k); return " new"; };

  async function api(path, opts = {}) {
    const res = await fetch("/api/" + path, {
      method: opts.method || "GET",
      headers: { "content-type": "application/json", "x-admin-pin": pin },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  /* ---------- 비밀번호 ---------- */
  function gate(msg = "") {
    app.innerHTML = `
      <div class="a-gate"><form id="gate">
        ${tutee("wave")}
        <h2 style="margin:6px 0 2px">진행 화면</h2>
        <p style="color:var(--muted);margin:0">강사용 비밀번호를 입력해 주세요</p>
        <input id="pin" type="password" inputmode="numeric" autocomplete="off" autofocus />
        <button class="btn-main" type="submit">들어가기</button>
        <p class="err">${esc(msg)}</p>
      </form></div>`;
    document.getElementById("gate").addEventListener("submit", async (e) => {
      e.preventDefault();
      pin = document.getElementById("pin").value.trim();
      const r = await api("auth", { method: "POST" });
      if (r.ok) { try { sessionStorage.setItem(PIN_KEY, pin); } catch {} start(); }
      else gate("비밀번호가 맞지 않아요");
    });
  }

  async function start() {
    const r = await api("responses");
    if (r.status === 401) return gate();
    if (r.ok) { state = r.data.state; people = r.data.people; }
    shell();
    renderAll();
    clearInterval(timer);
    timer = setInterval(refresh, POLL_MS);
  }

  async function refresh() {
    try {
      const r = await api("responses");
      if (!r.ok) return;
      const slideChanged = r.data.state.slide !== state.slide;
      state = r.data.state; people = r.data.people;
      slideChanged ? renderAll() : renderLive();
    } catch {}
  }

  /* ---------- 틀 ---------- */
  function shell() {
    app.innerHTML = `
      <div class="admin" id="adm">
        <header class="a-bar">
          <div class="brand">새 교생 <span>튜티</span>가 왔습니다</div>
          <nav class="a-steps" id="steps"></nav>
          <div class="a-count" id="count"></div>
        </header>
        <main class="a-main">
          <section class="a-left" id="left"></section>
          <section class="a-right" id="right"></section>
        </main>
        <footer class="a-foot">
          <button class="a-btn" data-act="prev">← 이전</button>
          <button class="a-btn main" data-act="next">다음 →</button>
          <span class="grow"></span>
          <button class="a-btn" data-act="big">결과 크게 보기</button>
          <button class="a-btn" data-act="copy">참여 주소 복사</button>
          <button class="a-btn danger" data-act="reset">초기화</button>
        </footer>
      </div>`;
  }

  function renderAll() {
    const s = SLIDES[state.slide];
    const adm = document.getElementById("adm");
    adm.classList.toggle("big", big && s.id !== "s7");
    adm.classList.toggle("mapmode", s.id === "s7");
    document.getElementById("steps").innerHTML = SLIDES.map((x, i) => `
      <button class="a-step ${i === state.slide ? "on" : ""}" data-go="${i}"><span class="n">${i + 1}</span>${esc(x.session ? x.session + "차시" : x.tag)}</button>`).join("");
    const key = state.slide + "|" + state.round;
    if (key !== leftKey) { renderLeft(s); leftKey = key; }
    lastSig = "";
    renderLive();
  }

  function renderLeft(s) {
    const left = document.getElementById("left");
    const joinBox = s.id === "s1" ? `
      <div class="join-box"><div class="qr" id="qr"></div>
        <div><b>휴대폰으로 접속해 주세요</b><div class="url">${esc(location.host)}</div></div></div>` : "";
    left.innerHTML = `
      ${SQUIGGLE}
      <div class="head">
        <span class="tag">${esc(s.tag)}${s.session ? " · " + esc(SESSIONS[s.session]) : ""}</span>
        <p class="l1">${esc(s.line1)}</p>
        <p class="l2">${esc(s.line2)}</p>
      </div>
      ${joinBox}
      <div class="band">${WAVE_TOP}${tutee(s.pose)}<div class="bubble"><span class="who">교생 튜티</span>${esc(s.ask)}</div>${WAVE_BOTTOM}</div>`;
    if (s.id === "s1" && window.QRCode) {
      new QRCode(document.getElementById("qr"), { text: location.origin + "/", width: 236, height: 236, colorDark: "#111111", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M });
    }
  }

  function renderLive() {
    const s = SLIDES[state.slide];
    const joined = people.filter((p) => p.name).length;
    const answered = people.filter((p) => p.answers && p.answers[s.id]).length;
    document.getElementById("count").innerHTML = `참여 <b>${joined}</b>명 · 이 장 제출 <b>${answered}</b>명`;
    const sig = state.slide + "|" + state.round + "|" + JSON.stringify(people);
    if (sig === lastSig) return;
    lastSig = sig;
    const right = document.getElementById("right");
    const prevScroll = right.scrollTop;
    right.innerHTML = RESULTS[s.id](s, people.filter((p) => p.answers && p.answers[s.id]));
    right.scrollTop = prevScroll;
    if (s.id === "s7") placeStops();
  }

  /* ---------- 결과 그리기 도구 ---------- */
  const title = (t, sub = "") => `<div class="r-title"><h2>${t}</h2><span class="sub">${sub}</span></div>`;
  const emptyBox = (t = "선생님들의 답을 기다리고 있어요") => `<div class="empty">${tutee("think")}${t}</div>`;
  const count = (list, fn) => list.reduce((m, p) => { const v = fn(p); (Array.isArray(v) ? v : [v]).forEach((x) => { if (x) m[x] = (m[x] || 0) + 1; }); return m; }, {});
  const colorVar = (c) => `var(--${c})`;

  function bars(items, total, starV) {
    const max = Math.max(1, ...items.map((i) => i.n));
    return items.map((i) => `
      <div class="bar-row ${i.v === starV ? "star" : ""}" style="--c:${colorVar(i.color || "green")}">
        <span class="lab">${esc(i.label)}</span>
        <span class="track"><span class="fill" style="width:${(i.n / max) * 100}%"></span></span>
        <span class="num">${i.n}</span>
      </div>`).join("");
  }

  function stack(label, counts, opts, badge = "") {
    const total = opts.reduce((a, o) => a + (counts[o.v] || 0), 0);
    const segs = total ? opts.map((o) => {
      const n = counts[o.v] || 0;
      return n ? `<span style="--c:${colorVar(o.color)};flex-grow:${n}">${n}</span>` : "";
    }).join("") : "";
    return `<div class="stack-row"><div class="lab"><span>${label}</span>${badge}</div><div class="stack">${segs}</div></div>`;
  }
  const legend = (opts) => `<div class="legend">${opts.map((o) => `<span style="--c:${colorVar(o.color)}"><i></i>${esc(o.label)}</span>`).join("")}</div>`;

  // 의견이 얼마나 갈렸는지 (가장 많은 선택의 비율이 낮을수록 갈림)
  const splitScore = (counts, opts) => {
    const ns = opts.map((o) => counts[o.v] || 0);
    const t = ns.reduce((a, b) => a + b, 0);
    return t < 2 ? 0 : 1 - Math.max(...ns) / t;
  };

  /* ---------- 장별 결과 ---------- */
  const RESULTS = {
    s1(s, list) {
      if (!list.length) return title("우리가 받은 난감한 질문들") + emptyBox();
      const tc = count(list, (p) => p.answers.s1.type);
      const lv = count(list, (p) => p.answers.s1.level);
      const notes = list.slice().reverse().map((p) => {
        const a = p.answers.s1; const t = TYPE3.find((x) => x.v === a.type) || TYPE3[0];
        return `<div class="note${fresh(p, "s1")}"><div class="q">“${esc(a.q)}”</div>${a.a ? `<div class="a">→ ${esc(a.a)}</div>` : ""}
          <div class="meta"><span>${esc(p.name || "")}${a.level ? " · " + esc(a.level) : ""}</span><span class="tp" style="--c:${colorVar(t.color)}">${esc(t.label)}</span></div></div>`;
      }).join("");
      return title("우리가 받은 난감한 질문들", `${list.length}개`) + `
        <div class="r-grid two" style="margin-bottom:18px">
          <div class="r-card"><h3>그때 나의 대답 유형</h3>${bars(TYPE3.map((t) => ({ ...t, n: tc[t.v] || 0 })))}</div>
          <div class="r-card"><h3>학교급</h3>${bars(s.levels.map((l) => ({ v: l, label: l, n: lv[l] || 0 })))}</div>
        </div>
        <div class="wall">${notes}</div>`;
    },

    s2(s, list) {
      if (!list.length) return title("튜티가 처음에 모르는 것") + emptyBox();
      const cc = count(list, (p) => p.answers.s2.chips || []);
      const chips = Object.entries(cc).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span class="chipcount">${esc(k)}<b>${n}</b></span>`).join("");
      const bubs = list.filter((p) => p.answers.s2.text && p.answers.s2.text.trim()).slice().reverse()
        .map((p) => `<span class="bub${fresh(p, "s2")}">${esc(p.answers.s2.text)}<small>${esc(p.name || "")}</small></span>`).join("");
      return title("튜티가 처음에 모르는 것", `${list.length}명 응답`) + `
        ${chips ? `<div class="r-card" style="margin-bottom:18px"><h3>많이 고른 것</h3>${chips}</div>` : ""}
        ${bubs ? `<div class="r-card"><h3>선생님들의 생각</h3><div class="bubbles">${bubs}</div></div>` : ""}
        <div class="r-card hl" style="margin-top:18px"><h3>06차시에서 확인할 AI의 세 가지 실수</h3>
          <div class="chips" style="margin:0"><span class="chipcount">환각 · 없는 정보를 만든다</span><span class="chipcount">지식 시점 한계 · 최신 정보를 모른다</span><span class="chipcount">맥락 손실 · 우리 반을 모른다</span></div></div>`;
    },

    s3(s, list) {
      if (!list.length) return title("모르는 걸 질문받으면?") + emptyBox();
      const c = count(list, (p) => p.answers.s3.choice);
      return title("모르는 걸 질문받으면?", `${list.length}명 응답`) + `
        <div class="r-card">${bars(s.options.map((o) => ({ ...o, n: c[o.v] || 0, color: o.v === "rag" ? "green" : "yellow" })), list.length, "rag")}</div>
        <div class="r-card hl" style="margin-top:18px"><h3>★ 받은 자료를 찾아보고 근거로 답하기 = RAG</h3>
          <p style="margin:0;color:#ccc">07차시에서 AI가 교과 자료를 찾아 근거로 답하는 원리를 알아봅니다.</p></div>`;
    },

    s4(s, list) {
      if (!list.length) return title("튜티에게 건네줄 자료") + emptyBox();
      const m = count(list, (p) => p.answers.s4.materials || []);
      const ch = count(list, (p) => p.answers.s4.change);
      const items = s.materials.map((x) => ({ v: x, label: x, n: m[x] || 0 })).sort((a, b) => b.n - a.n);
      const others = list.map((p) => p.answers.s4.other).filter((x) => x && x.trim());
      return title("튜티에게 건네줄 자료", `${list.length}명 응답`) + `
        <div class="r-grid two">
          <div class="r-card"><h3>건네줄 자료</h3>${bars(items)}
            ${others.length ? `<div class="bubbles" style="margin-top:12px">${others.map((o) => `<span class="bub">${esc(o)}</span>`).join("")}</div>` : ""}</div>
          <div class="r-card"><h3>자료를 받으면 답은?</h3>${bars(s.change.map((c) => ({ ...c, label: c.label + " 달라진다", n: ch[c.v] || 0 })))}
            <p style="color:var(--muted);margin:14px 0 0;font-size:14px">08차시에서 직접 넣어 보고 정말 그런지 확인합니다.</p></div>
        </div>`;
    },

    s5(s, list) {
      if (!list.length) return title("이것도 건네줄까요?") + emptyBox();
      const per = s.cards.map((c) => ({ c, counts: count(list, (p) => (p.answers.s5.sort || {})[c.v]) }));
      const scores = per.map((x) => splitScore(x.counts, SORT3));
      const top = Math.max(...scores);
      const rows = per.map((x, i) => stack(esc(x.c.label), x.counts, SORT3,
        top > 0 && scores[i] === top ? `<span class="split-badge">의견이 가장 갈렸어요</span>` : "")).join("");
      return title("이것도 건네줄까요?", `${list.length}명 응답`) + `
        <div class="r-card">${legend(SORT3)}${rows}</div>
        <p style="color:var(--muted);margin:14px 4px 0">‘고민돼요’에 기준을 세우는 시간이 09차시입니다.</p>`;
    },

    s6(s, list) {
      if (!list.length) return title("아이가 이렇게 물으면?") + emptyBox();
      const rows = s.qs.map((q, i) => {
        const c = count(list, (p) => (p.answers.s6.pick || {})[q.v]);
        return stack(`${i + 1}. “${esc(q.text)}”`, c, TYPE3) +
          (q.v === "q3" ? `<div class="fixed-note">자해·위기 신호는 예외 없이 선생님께 연결합니다</div>` : "");
      }).join("");
      const reasons = list.filter((p) => p.answers.s6.reason && p.answers.s6.reason.trim()).slice().reverse()
        .map((p) => `<div class="reason${fresh(p, "s6")}">${esc(p.answers.s6.reason)}<small>${esc(p.name || "")}</small></div>`).join("");
      return title("아이가 이렇게 물으면?", `${list.length}명 응답`) + `
        <div class="r-card">${legend(TYPE3)}${rows}</div>
        ${reasons ? `<div class="r-card" style="margin-top:18px"><h3>고른 이유</h3>${reasons}</div>` : ""}`;
    },

    s7(s, list) {
      const c = count(list, (p) => p.answers.s7.stop);
      const stops = STOPS.map((st, i) => `
        <div class="astop ${i % 2 ? "top" : ""}" data-i="${i}">
          <div class="pin">${st.v}<span class="flag ${c[st.v] ? "" : "zero"}">🚩 ${c[st.v] || 0}</span></div>
          <div class="card"><div class="t">${esc(SESSIONS[st.v])}</div><div class="q">“${esc(st.q)}”</div></div>
        </div>`).join("");
      return `
        <div class="map-head">${tutee("map")}<div><p class="l1">${esc(s.line1)}</p><p class="l2">${esc(s.line2)}</p></div>
          <span class="grow" style="flex:1"></span><span class="a-count">기대 표시 <b>${list.length}</b>명</span></div>
        <div class="amap" id="amap">
          <svg class="road" viewBox="0 0 1000 470" preserveAspectRatio="none" aria-hidden="true">
            <path id="road" d="M40 300 C 150 300, 170 170, 290 170 S 420 330, 520 300 S 640 150, 720 170 S 860 320, 960 230"
              fill="none" stroke="#2fb86a" stroke-width="34" stroke-linecap="round" opacity=".35"/>
            <path d="M40 300 C 150 300, 170 170, 290 170 S 420 330, 520 300 S 640 150, 720 170 S 860 320, 960 230"
              fill="none" stroke="#5be895" stroke-width="4" stroke-dasharray="14 12" stroke-linecap="round"/>
          </svg>
          ${stops}
        </div>`;
    },
  };

  // 지도 위 지점 배치
  function placeStops() {
    const path = document.getElementById("road");
    const box = document.getElementById("amap");
    if (!path || !box) return;
    const L = path.getTotalLength();
    const fr = [0.08, 0.29, 0.5, 0.71, 0.92];
    box.querySelectorAll(".astop").forEach((el) => {
      const p = path.getPointAtLength(L * fr[+el.dataset.i]);
      el.style.left = (p.x / 1000) * 100 + "%";
      el.style.top = (p.y / 470) * 100 + "%";
    });
  }

  /* ---------- 조작 ---------- */
  async function go(i) {
    i = Math.max(0, Math.min(SLIDES.length - 1, i));
    if (i === state.slide) return;
    state.slide = i;
    renderAll();
    const r = await api("state", { method: "POST", body: { slide: i } });
    if (r.status === 401) return gate("다시 로그인해 주세요");
    if (r.ok) state = r.data;
  }

  function toast(t) {
    const el = document.createElement("div");
    el.className = "toast"; el.textContent = t;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  app.addEventListener("click", async (e) => {
    const g = e.target.closest("[data-go]");
    if (g) return go(+g.dataset.go);
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "prev") return go(state.slide - 1);
    if (act === "next") return go(state.slide + 1);
    if (act === "big") { big = !big; b.textContent = big ? "슬라이드 함께 보기" : "결과 크게 보기"; return renderAll(); }
    if (act === "copy") {
      const url = location.origin + "/";
      try { await navigator.clipboard.writeText(url); toast("참여 주소를 복사했어요"); } catch { toast(url); }
      return;
    }
    if (act === "reset") {
      if (!confirm("모든 선생님의 답을 지우고 1장부터 다시 시작할까요?")) return;
      const r = await api("reset", { method: "POST" });
      if (r.ok) { state = r.data; people = []; leftKey = ""; renderAll(); toast("초기화했어요"); }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!document.getElementById("adm") || e.target.closest("input,textarea")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(state.slide + 1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(state.slide - 1); }
    if (e.key === "f" || e.key === "F") document.querySelector('[data-act="big"]').click();
  });
  window.addEventListener("resize", () => { if (SLIDES[state.slide].id === "s7") placeStops(); });

  pin ? start() : gate();
})();
