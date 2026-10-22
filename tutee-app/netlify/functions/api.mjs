import { getStore } from "@netlify/blobs";
import { handle } from "../lib/core.mjs";

// 관리자 비밀번호는 Netlify 사이트 설정의 환경 변수 ADMIN_PIN 으로 바꿀 수 있습니다.
const DEFAULT_PIN = "1234";

export default async (req) => {
  const store = getStore({ name: "tutee-warmup", consistency: "strong" });
  const pin =
    (globalThis.Netlify && globalThis.Netlify.env && globalThis.Netlify.env.get("ADMIN_PIN")) ||
    process.env.ADMIN_PIN ||
    DEFAULT_PIN;
  return handle(req, store, pin);
};

export const config = { path: "/api/*" };
