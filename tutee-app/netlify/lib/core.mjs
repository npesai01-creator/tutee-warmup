// 요청 처리 로직 (저장소를 주입받아 동작하므로 로컬 시험에도 그대로 쓰입니다)

const SLIDE_IDS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"];
const SLIDE_COUNT = SLIDE_IDS.length;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

// 입력값 정리: 길이·깊이 제한
function clean(v, depth = 0) {
  if (depth > 3) return null;
  if (typeof v === "string") return v.slice(0, 300);
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.slice(0, 20).map((x) => clean(x, depth + 1));
  if (v && typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v).slice(0, 30)) o[k.slice(0, 40)] = clean(v[k], depth + 1);
    return o;
  }
  return null;
}

async function getState(store) {
  return (await store.get("state", { type: "json" })) || { slide: 0, round: 1, updated: 0 };
}

async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export async function handle(req, store, adminPin) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const isAdmin = !!adminPin && req.headers.get("x-admin-pin") === adminPin;
  const m = req.method;

  try {
    // 현재 슬라이드·회차
    if (path === "state" && m === "GET") return json(await getState(store));

    // 관리자 비밀번호 확인
    if (path === "auth" && m === "POST") return json({ ok: isAdmin }, isAdmin ? 200 : 401);

    // 관리자: 슬라이드 넘기기
    if (path === "state" && m === "POST") {
      if (!isAdmin) return json({ error: "unauthorized" }, 401);
      const body = await readBody(req);
      const st = await getState(store);
      const slide = Math.max(0, Math.min(SLIDE_COUNT - 1, Number(body.slide) | 0));
      const next = { ...st, slide, updated: Date.now() };
      await store.setJSON("state", next);
      return json(next);
    }

    // 참여자: 이름 등록 또는 답 제출
    if (path === "submit" && m === "POST") {
      const body = await readBody(req);
      const pid = String(body.pid || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
      if (!pid) return json({ error: "pid" }, 400);
      const st = await getState(store);
      if (body.round && Number(body.round) !== st.round) return json({ error: "round", round: st.round }, 409);
      const key = `p/${st.round}/${pid}`;
      const cur = (await store.get(key, { type: "json" })) || { pid, answers: {}, joined: Date.now() };
      if (typeof body.name === "string" && body.name.trim()) cur.name = body.name.trim().slice(0, 20);
      if (body.slide) {
        if (!SLIDE_IDS.includes(body.slide)) return json({ error: "slide" }, 400);
        cur.answers[body.slide] = { ...(clean(body.data) || {}), at: Date.now() };
      }
      cur.updated = Date.now();
      await store.setJSON(key, cur);
      return json({ ok: true, round: st.round });
    }

    // 관리자: 모든 답 보기
    if (path === "responses" && m === "GET") {
      if (!isAdmin) return json({ error: "unauthorized" }, 401);
      const st = await getState(store);
      const { blobs } = await store.list({ prefix: `p/${st.round}/` });
      const people = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
      people.sort((a, b) => (a.joined || 0) - (b.joined || 0));
      return json({ state: st, people });
    }

    // 관리자: 초기화 (새 회차로 넘어가고 이전 답은 지움)
    if (path === "reset" && m === "POST") {
      if (!isAdmin) return json({ error: "unauthorized" }, 401);
      const st = await getState(store);
      const next = { slide: 0, round: st.round + 1, updated: Date.now() };
      await store.setJSON("state", next);
      const { blobs } = await store.list({ prefix: "p/" });
      await Promise.all(blobs.map((b) => store.delete(b.key)));
      return json(next);
    }
  } catch (e) {
    return json({ error: "server", detail: String((e && e.message) || e) }, 500);
  }
  return json({ error: "not found" }, 404);
}
