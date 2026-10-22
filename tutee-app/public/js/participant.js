/* 참여자(휴대폰) 화면 */
(() => {
  const app = document.getElementById("app");
  const LS = "tutee-warmup-me";
  const POLL_MS = 2000;

  const store = {
    load() { try { return JSON.parse(localStorage.getItem(LS)) || null; } catch { return null; } },
    save(v) { try { localStorage.setItem(LS, JSON.stringify(v)); } catch {} },
  };
  const newPid = () => "p" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

  let me = store.load() || { pid: newPid(), name: "", round: null, answers: {} };
  let state = { slide: 0, round: null };
  let draft = {};      // 장별 작성 중인 값
  let editing = {};    // 다시 고치는 중인 장
  let busy = false;
  let shownKey = "";   // 마지막으로 그린 화면 키

  async function api(path, opts = {}) {
    const res = await fetch("/api/" + path, {
      method: opts.method || "GET",
      headers: { "content-type": "application/json" },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  function syncRound(round) {
    if (me.round !== round) {
      // 관리자가 초기화했거나 처음 접속: 이전 답은 비우고 이름은 다시 등록
      const oldName = me.name;
      me = { pid: me.pid || newPid(), name: "", round, answers: {} };
      draft = { name: oldName || "" }; editing = {};
      store.save(me);
    }
  }

  async function poll() {
    try {
      const r = await api("state");
      if (!r.ok) return;
      const changed = r.data.slide !== state.slide || r.data.round !== state.round;
      state = r.data;
      syncRound(state.round);
      if (changed) render(true);
    } catch {}
  }

  /* ---------- 그리기 ---------- */
  function render(scrollTop) {
    const key = !me.name ? "join" : `${state.slide}|${!!me.answers[SLIDES[state.slide].id] && !editing[SLIDES[state.slide].id]}`;
    app.innerHTML = !me.name ? joinView() : slideView();
    bind();
    if (scrollTop && key !== shownKey) window.scrollTo({ top: 0 });
    shownKey = key;
  }

  function joinView() {
    return `
      <div class="join">
        <div class="join-title">
          <p>2026 정보교원 AI 실전 연수 · TRACK 2</p>
          <h1>오늘 선생님 반에<br><em>새 교생이 왔습니다</em></h1>
        </div>
        <div class="band">${WAVE_TOP}${tutee("wave")}${WAVE_BOTTOM}</div>
        <div class="p-body">
          <div class="field">
            <label for="nm">선생님 이름 또는 별명</label>
            <input id="nm" type="text" maxlength="20" placeholder="예: 김정보" value="${esc(draft.name || "")}" autocomplete="off" />
          </div>
          <button class="btn-main" data-act="join">교생 튜티 만나러 가기</button>
          <p class="err" id="err"></p>
        </div>
        <div class="foot">ⓒ 2026 정보교원 AI 실전 연수</div>
      </div>`;
  }

  function topBar() {
    const dots = SLIDES.map((s, i) =>
      `<i class="${i === state.slide ? "on" : me.answers[s.id] ? "past" : ""}"></i>`).join("");
    return `<div class="p-top"><span class="p-step"><b>${state.slide + 1}</b> / ${SLIDES.length}</span><div class="p-dots">${dots}</div></div>`;
  }

  function slideView() {
    const s = SLIDES[state.slide];
    const submitted = me.answers[s.id] && !editing[s.id];
    const head = `
      ${topBar()}
      <div class="p-head">
        <span class="tag">${esc(s.tag)}</span>
        <p class="l1">${esc(s.line1)}</p>
        <p class="l2">${esc(s.line2)}</p>
      </div>`;
    if (submitted) return head + doneView(s);
    return head + `
      <div class="band">${WAVE_TOP}${tutee(s.pose)}<div class="bubble"><span class="who">교생 튜티</span>${esc(s.ask)}</div>${WAVE_BOTTOM}</div>
      <div class="p-body">
        ${formFor(s)}
        <button class="btn-main" data-act="submit">제출하기</button>
        <p class="err" id="err"></p>
        <p class="hint">다음 화면은 강사 선생님이 함께 넘겨 주세요</p>
      </div>`;
  }

  function doneView(s) {
    const a = me.answers[s.id] || {};
    let msg = esc(s.msg);
    if (s.id === "s3") msg = (a.choice === "rag" ? "<b>바로 그거예요!</b> " : "그럴 수도 있겠네요. ") + msg;
    if (s.id === "s1" && me.name) msg = `<b>${esc(me.name)} 선생님,</b> ` + msg;
    if (s.id === "s7" && a.stop) msg = `<b>${esc(a.stop)}차시</b>를 가장 기대하시는군요. ` + msg;
    const next = s.session
      ? `<div class="next-pill">📍 ${esc(sessionLabel(s.session))}</div>`
      : s.id === "s7" ? `<div class="next-pill">📍 첫 번째 지점 · 06차시에서 출발!</div>` : "";
    return `
      <div class="band" style="justify-content:center">${WAVE_TOP}${tutee("happy")}${WAVE_BOTTOM}</div>
      <div class="done">
        <div class="done-card">
          <span class="tag ghost">제출 완료</span>
          <p class="msg">${msg}</p>
          ${next}
        </div>
        <button class="btn-ghost" data-act="edit">답 고치기</button>
        <p class="hint">강사 선생님이 다음 화면으로 넘기면 자동으로 이동해요</p>
      </div>`;
  }

  /* ---------- 장별 입력 ---------- */
  const D = () => (draft[SLIDES[state.slide].id] ||= {});
  const optBtn = (field, v, label, on, extra = "", color = "") =>
    `<button class="opt ${extra} ${color ? "c-" + color : ""} ${on ? "on" : ""}" data-act="pick" data-field="${field}" data-v="${esc(v)}">${label}</button>`;

  function type3(field, cur) {
    return `<div class="seg cols-3">${TYPE3.map((t) =>
      optBtn(field, t.v, `${t.label}<small>${t.desc}</small>`, cur === t.v, "", t.color)).join("")}</div>`;
  }

  function formFor(s) {
    const d = D();
    switch (s.id) {
      case "s1":
        return `
          <div class="field"><span class="lbl">학교급</span>
            <div class="seg cols-4">${s.levels.map((l) => optBtn("level", l, l, d.level === l)).join("")}</div></div>
          <div class="field"><label for="f-q">학생에게 받은 가장 난감한 질문</label>
            <textarea id="f-q" data-field="q" maxlength="200" placeholder="예: 선생님은 몇 살이에요? 결혼은 왜 안 해요?">${esc(d.q || "")}</textarea></div>
          <div class="field"><label for="f-a">그때 나의 대답</label>
            <textarea id="f-a" data-field="a" maxlength="200" placeholder="예: 그건 선생님 비밀! 대신 오늘 배운 거 물어볼래?">${esc(d.a || "")}</textarea></div>
          <div class="field"><span class="lbl">내 대답은 어떤 유형이었나요?</span>${type3("type", d.type)}</div>`;
      case "s2":
        return `
          <div class="field"><label for="f-t">튜티가 처음에 모르는 것</label>
            <textarea id="f-t" data-field="text" maxlength="200" placeholder="자유롭게 적거나 아래에서 골라 주세요">${esc(d.text || "")}</textarea>
            <div class="chips">${s.chips.map((c) =>
              `<button class="chip ${(d.chips || []).includes(c) ? "on" : ""}" data-act="chip" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>`;
      case "s3":
        return `<div class="field"><span class="lbl">하나만 골라 주세요</span><div class="seg">${s.options.map((o) =>
          optBtn("choice", o.v, `<span class="dot"></span>${esc(o.label)}`, d.choice === o.v, "left")).join("")}</div></div>`;
      case "s4":
        return `
          <div class="field"><span class="lbl">건네줄 자료 <small>여러 개 골라도 돼요</small></span>
            <div class="chips">${s.materials.map((m) =>
              `<button class="chip ${(d.materials || []).includes(m) ? "on" : ""}" data-act="multi" data-field="materials" data-v="${esc(m)}">${esc(m)}</button>`).join("")}</div>
            <input type="text" data-field="other" maxlength="60" placeholder="그 밖에 건네줄 자료 (선택)" value="${esc(d.other || "")}" style="margin-top:12px" /></div>
          <div class="field"><span class="lbl">자료를 받으면 튜티의 답은?</span>
            <div class="seg cols-3">${s.change.map((c) => optBtn("change", c.v, `${c.label}<small>달라질 거예요</small>`, d.change === c.v)).join("")}</div></div>`;
      case "s5":
        return `<div class="field"><span class="lbl">자료마다 하나씩 골라 주세요</span>${s.cards.map((c, i) => `
          <div class="rowq"><div class="q"><span class="n">${i + 1}</span>${esc(c.label)}</div>
            <div class="seg cols-3">${SORT3.map((o) => optBtn("sort." + c.v, o.v, o.label, (d.sort || {})[c.v] === o.v, "", o.color)).join("")}</div></div>`).join("")}</div>`;
      case "s6":
        return `<div class="field"><span class="lbl">질문마다 하나씩 골라 주세요</span>${s.qs.map((q, i) => `
          <div class="rowq"><div class="q"><span class="n">${i + 1}</span>“${esc(q.text)}”</div>
            ${type3("pick." + q.v, (d.pick || {})[q.v])}</div>`).join("")}</div>
          <div class="field"><label for="f-r">고르신 이유 한마디 <small style="font-weight:500;color:var(--muted)">선택</small></label>
            <textarea id="f-r" data-field="reason" maxlength="150" placeholder="예: 3번은 튜티가 혼자 판단하면 안 돼요">${esc(d.reason || "")}</textarea></div>`;
      case "s7":
        return `<div class="field"><span class="lbl">가장 기대되는 지점을 눌러 주세요</span><div class="pmap">${STOPS.map((st) => `
          <button class="pstop ${d.stop === st.v ? "on" : ""}" data-act="pick" data-field="stop" data-v="${st.v}">
            <span class="pin">${st.v}</span>
            <span class="card"><b>${esc(SESSIONS[st.v])}</b><span>튜티: ${esc(st.q)}</span></span>
          </button>`).join("")}</div></div>`;
    }
    return "";
  }

  function validate(s, d) {
    switch (s.id) {
      case "s1": return !d.q?.trim() ? "난감했던 질문을 적어 주세요" : !d.type ? "대답 유형을 골라 주세요" : "";
      case "s2": return !(d.text?.trim() || (d.chips || []).length) ? "한 가지 이상 적거나 골라 주세요" : "";
      case "s3": return !d.choice ? "하나를 골라 주세요" : "";
      case "s4": return !((d.materials || []).length || d.other?.trim()) ? "건네줄 자료를 골라 주세요" : !d.change ? "답이 얼마나 달라질지 골라 주세요" : "";
      case "s5": return s.cards.some((c) => !(d.sort || {})[c.v]) ? "모든 자료를 골라 주세요" : "";
      case "s6": return s.qs.some((q) => !(d.pick || {})[q.v]) ? "세 질문 모두 골라 주세요" : "";
      case "s7": return !d.stop ? "지도에서 한 곳을 눌러 주세요" : "";
    }
    return "";
  }

  /* ---------- 이벤트 ---------- */
  function setPath(obj, path, v) {
    const ks = path.split(".");
    let o = obj;
    while (ks.length > 1) { const k = ks.shift(); o = o[k] ||= {}; }
    o[ks[0]] = v;
  }

  function bind() {
    app.querySelectorAll("[data-field]").forEach((el) => {
      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
        el.addEventListener("input", () => { D()[el.dataset.field] = el.value; });
      }
    });
    const nm = app.querySelector("#nm");
    if (nm) {
      nm.addEventListener("input", () => (draft.name = nm.value));
      nm.addEventListener("keydown", (e) => { if (e.key === "Enter") join(); });
    }
  }

  app.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    const sid = SLIDES[state.slide].id;
    if (act === "join") return join();
    if (act === "submit") return submit();
    if (act === "edit") { editing[sid] = true; draft[sid] = JSON.parse(JSON.stringify(me.answers[sid] || {})); return render(true); }
    if (act === "pick") { setPath(D(), b.dataset.field, b.dataset.v); return render(); }
    if (act === "multi" || act === "chip") {
      const f = act === "chip" ? "chips" : b.dataset.field;
      const arr = (D()[f] ||= []);
      const i = arr.indexOf(b.dataset.v);
      i >= 0 ? arr.splice(i, 1) : arr.push(b.dataset.v);
      return render();
    }
  });

  function showErr(t) { const el = document.getElementById("err"); if (el) el.textContent = t; }

  async function join() {
    const name = (draft.name || "").trim();
    if (!name) return showErr("이름이나 별명을 적어 주세요");
    if (busy) return; busy = true;
    try {
      const r = await api("submit", { method: "POST", body: { pid: me.pid, round: state.round, name } });
      if (r.status === 409) { await poll(); busy = false; return join(); }
      if (!r.ok) throw 0;
      me.name = name; me.round = r.data.round; store.save(me);
      render(true);
    } catch { showErr("연결이 잠시 불안정해요. 다시 눌러 주세요"); }
    busy = false;
  }

  async function submit() {
    const s = SLIDES[state.slide];
    const d = D();
    const msg = validate(s, d);
    if (msg) return showErr(msg);
    if (busy) return; busy = true;
    const btn = app.querySelector('[data-act="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = "보내는 중…"; }
    try {
      const data = JSON.parse(JSON.stringify(d));
      const r = await api("submit", { method: "POST", body: { pid: me.pid, round: state.round, name: me.name, slide: s.id, data } });
      if (r.status === 409) { await poll(); throw 0; }
      if (!r.ok) throw 0;
      me.answers[s.id] = data; editing[s.id] = false; store.save(me);
      render(true);
    } catch {
      showErr("전송하지 못했어요. 다시 눌러 주세요");
      if (btn) { btn.disabled = false; btn.textContent = "제출하기"; }
    }
    busy = false;
  }

  /* ---------- 시작 ---------- */
  (async () => {
    app.innerHTML = `<div class="band" style="margin-top:30vh;justify-content:center">${WAVE_TOP}${tutee("wave")}${WAVE_BOTTOM}</div>`;
    await poll();
    if (state.round == null) { state.round = me.round; }
    render(true);
    setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) poll(); });
  })();
})();
