# 새 교생 튜티가 왔습니다

2026 정보교원 AI 실전 연수 TRACK 2 · DAY2 시작 전 도입 활동 웹앱입니다.
AI 튜터를 우리 반에 온 교생 '튜티'로 놓고, 7장의 질문을 함께 넘기며 오늘 배울 06~10차시를 미리 훑어봅니다.

- **참여자 화면** `https://내사이트.netlify.app/` : 선생님들이 휴대폰으로 접속해 답을 쓰고 제출하면, 해당 차시에서 무엇을 배우는지 튜티가 알려 줍니다.
- **진행 화면** `https://내사이트.netlify.app/admin` : 강사가 7장을 넘기며 진행합니다. 선생님들의 답이 실시간으로 모이고, 강사가 넘기면 휴대폰 화면도 함께 넘어갑니다.

## 7장 구성

| 장 | 내용 | 연결 차시 |
|---|---|---|
| 1 | 새 교생이 왔습니다 · 학생에게 받은 가장 난감한 질문 (아이스브레이킹) | – |
| 2 | 교생은 처음에 무엇을 모를까요? | 06 |
| 3 | 모르는 걸 질문받으면 어떻게 할까요? | 07 |
| 4 | 그럼 무엇을 건네주실 건가요? | 08 |
| 5 | 그런데 이것도 건네주실 건가요? | 09 |
| 6 | 아이가 이렇게 물으면 어떻게 할까요? | 10 |
| 7 | 오늘의 연수 지도 | 06~10 |

문구를 바꾸고 싶으면 `public/js/content.js`의 `SLIDES` 부분만 고치면 됩니다.

## 배포하기 (GitHub → Netlify)

1. GitHub에서 새 저장소를 만들고 이 폴더의 파일을 모두 올립니다.
   (`public`, `netlify`, `netlify.toml`, `package.json`, `README.md`)
2. Netlify에서 **Add new site → Import an existing project → GitHub**를 누르고 방금 만든 저장소를 고릅니다.
3. 빌드 설정은 `netlify.toml`이 알아서 채웁니다. 그대로 **Deploy**를 누릅니다.
4. **관리자 비밀번호 바꾸기 (꼭 해 주세요)**
   Netlify 사이트 화면에서 **Site configuration → Environment variables → Add a variable**
   - Key: `ADMIN_PIN`
   - Value: 원하는 비밀번호 (예: 숫자 6자리)

   저장한 뒤 **Deploys → Trigger deploy → Deploy site**로 한 번 다시 배포하면 적용됩니다.
   설정하지 않으면 기본 비밀번호는 `1234`입니다.
5. 사이트 이름은 **Site configuration → Change site name**에서 바꿀 수 있습니다 (예: `tutee-day2`).

선생님들의 답은 Netlify Blobs(사이트에 딸린 저장소)에 저장되므로 따로 가입할 서비스는 없습니다.
폴더를 끌어다 놓는 방식(Netlify Drop)으로는 저장 기능이 동작하지 않으니 꼭 GitHub로 연결해 주세요.

## 연수 당일 진행 순서

1. 노트북에서 `/admin`에 들어가 비밀번호를 입력하고 프로젝터에 띄웁니다.
2. 1장 화면의 QR 코드로 선생님들이 휴대폰 접속 → 이름 입력 → 1장 답 작성.
3. 오른쪽에 답이 모이면 함께 이야기 나누고 **다음 →** (또는 키보드 → 키)로 넘깁니다.
4. 7장 지도에서 기대 표시를 함께 보고 06차시로 들어갑니다.

### 진행 화면 단축키

- `→` / `스페이스` : 다음 장
- `←` : 이전 장
- `F` : 결과 크게 보기 ↔ 슬라이드 함께 보기

### 리허설 후 초기화

연습으로 답을 넣어 봤다면 연수 전에 진행 화면 오른쪽 아래 **초기화**를 눌러 주세요.
모든 답이 지워지고 1장부터 다시 시작하며, 이미 접속해 있던 휴대폰은 이름 입력 화면으로 돌아갑니다.

## 파일 구성

```
public/
  index.html          참여자 화면
  admin.html          진행 화면
  css/style.css       디자인
  js/content.js       7장 문구, 캐릭터 튜티
  js/participant.js   참여자 화면 동작
  js/admin.js         진행 화면 동작
netlify/
  functions/api.mjs   저장 API (Netlify Functions)
  lib/core.mjs        저장·조회 처리 로직
netlify.toml          Netlify 설정
package.json          저장소 라이브러리(@netlify/blobs)
```
