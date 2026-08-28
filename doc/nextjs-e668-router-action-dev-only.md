# E668 "Router action dispatched before initialization" (+ warning "React state update … hasn't mounted yet") — เสียงรบกวนของ dev เท่านั้น

> ตรวจแล้ว 2026-08-28 · Next.js 16.3.0 (Turbopack) · React 19.2.4
> **ข้อสรุป: ไม่ต้องแก้อะไรในโค้ดเรา** — error นี้เกิดเฉพาะตอนรัน `next dev` และไม่มีทางเกิดใน production
> เขียนไว้เพื่อไม่ให้ session ถัดไปเสียเวลาไล่ซ้ำ

## error ที่เห็นใน console

```
Uncaught Error: Internal Next.js error: Router action dispatched before initialization. (__NEXT_ERROR_CODE: E668)
```

โผล่ตอนโหลดหน้า ประมาณ 1–8 ครั้งต่อการโหลด · เจอได้ทุกหน้า รวมหน้าที่ไม่มี header เลย (`/login`, `/proto/navbar`) · stack ชี้เข้า `node_modules/next/dist/client/...`

และมักมีเพื่อนอีกตัวโผล่คู่กัน (สาเหตุเดียวกันเป๊ะ — ดูหัวข้อ "อาการที่สอง" ท้ายไฟล์):

```
Can't perform a React state update on a component that hasn't mounted yet.
This indicates that you have a side-effect in your render function that
asynchronously tries to update the component. Move this work to useEffect instead.
```

## 1) เกิดใน production ไหม — ไม่เกิด

ตรวจจริงด้วย `npm run build && npm run start` (port 3001) แล้วเปิด `/`, `/login`, `/proto/navbar` พร้อม hard reload → **console สะอาด ไม่มี E668 เลย**

เหตุผลเชิงโค้ด (ยืนยันจากซอร์สใน `node_modules/next/dist/client/components/app-router-instance.js`):

- ตัวที่ยิง error นี้คือ `hmrRefresh()` ซึ่ง **throw ทิ้งทันทีถ้า `NODE_ENV !== 'development'`** (error คนละตัว: E485)
- client ของ HMR (`client/dev/hot-reloader/app/hot-reloader-app.js`) ไม่ถูก bundle ลง production เลย

## 2) ต้นเหตุจริง — HMR ส่ง refresh มาก่อนหน้าจะ hydrate เสร็จ (ของ Next เอง ไม่ใช่ของเรา)

App Router เก็บ `dispatch` ไว้เป็นตัวแปรระดับ module ใน
`node_modules/next/dist/client/components/use-action-queue.js` และจะถูก set **ตอน React render ครั้งแรก (hydrate)** เท่านั้น
ถ้ามีใครสั่ง router action ก่อนหน้านั้น → `dispatch === null` → โยน E668

ลำดับที่จับได้จริง (ใส่ probe log ลง `use-action-queue.js` ชั่วคราวแล้วอ่าน console):

```
[HMR] connected                                    ← เอกสารใหม่โหลด, websocket ของ dev ต่อติดแล้ว
[PROBE] dispatchAppRouterAction hmr-refresh dispatchReady= false
    at Object.hmrRefresh (…/hot-reloader-app)
    at processMessage (…)
    at WebSocket.handleMessage (…)
Uncaught Error: … (E668)
[PROBE] createMutableActionQueue called            ← hydrate เพิ่งเริ่ม "หลัง" error
```

แปลเป็นภาษาคน: ระหว่างที่เบราว์เซอร์โหลดหน้าใหม่ websocket ของ dev server ต่อติด **ก่อน** React จะ hydrate เสร็จ
ถ้าจังหวะนั้นมี update จากการเซฟไฟล์ส่งเข้ามาพอดี Next จะสั่ง `hmrRefresh()` ทันที
แต่ router ยังไม่เกิด → error หลุดออกมาแบบ uncaught (โยนอยู่ใน handler ของ websocket)
พอ hydrate เสร็จอีกเสี้ยววินาที ทุกอย่างก็ทำงานปกติ

ยิ่งเจอบ่อยเมื่อ:
- แก้ไฟล์ที่อยู่ใน layout/ทุกหน้า (เช่นงาน header) → ทุกหน้าต้อง compile ใหม่ → hydrate ช้าลง ช่องว่างกว้างขึ้น
- เปิดหน้าที่ยังไม่เคย compile ในรอบนั้น (first compile ใช้เวลาหลายวินาที)
- เซฟไฟล์รัวๆ ติดกัน → update หลายก้อนตกลงมาในช่องว่างเดียว → error หลายครั้งต่อการโหลด 1 ครั้ง

**สำคัญ: ไม่มีโค้ดของเราเกี่ยวเลย** — ใส่ probe นับ dispatch ตอนโหลดหน้าปกติแล้วได้ **0 ครั้ง**
คือแอปเราไม่ได้สั่ง router action ใดๆ ตอนโหลดหน้า (`router.push/replace/refresh` ทุกจุดอยู่ใน event handler หรือ effect หลัง mount ทั้งหมด)
`prefetch={false}` ใน `src/components/layout/header-catalog-control.tsx` ก็ **ไม่เกี่ยว** กับเรื่องนี้ — มันถูกใส่มาตั้งแต่คอมมิต `037ccad` เพื่อไม่ให้ลิสต์ชุดการ์ดยาวๆ prefetch ทุกลิงก์ (เรื่อง performance ล้วนๆ)

### วิธี reproduce ซ้ำ (ทำจริงแล้ว ได้ทุกครั้ง)

1. `npm run dev` (Turbopack)
2. เปิด loop แก้ client component ที่อยู่ใน layout ทุก 0.4 วิ:
   ```bash
   for i in $(seq 1 90); do printf '\n// probe %s\n' "$i" >> src/components/shared/scroll-to-top.tsx; sleep 0.4; done
   ```
3. ระหว่าง loop ทำงาน เปิดหน้าที่ยังไม่เคย compile ในรอบนั้น (เช่น `/honey`, `/sets`, `/most-expensive`)
4. E668 โผล่ใน console — แล้วหน้าก็ hydrate ต่อได้ตามปกติ
5. อย่าลืมย้อนไฟล์ที่แก้: `perl -0pi -e 's/\n\/\/ probe \d+\n//g' src/components/shared/scroll-to-top.tsx`

## 3) เป็นบั๊กที่รู้จักของ Next.js ไหม — ใช่ แต่ยังไม่มี fix และไม่มี workaround ที่คุ้ม

- ยังไม่มี issue upstream ที่ตรงกับ race นี้โดยตรง (ค้น issue/PR ของ `vercel/next.js` ด้วย "Router action dispatched before initialization", "E668", "hmrRefresh" แล้ว)
- ตัวใกล้เคียง: [#92855](https://github.com/vercel/next.js/issues/92855) / [#92858](https://github.com/vercel/next.js/issues/92858) — `deploymentId: ""` ทำให้ Turbopack dev **hydrate ไม่สำเร็จเลย** แล้วเห็น E668 เป็น "อาการ" ตามมา · เราไม่ได้ตั้ง `deploymentId` ใน `next.config.ts` จึงไม่ใช่เคสนี้
- [#97777](https://github.com/vercel/next.js/issues/97777) พูดถึง E668 ผ่านๆ แต่เป็นคนละเรื่อง (React #310)
- เช็คซอร์ส canary แล้ว: จุดที่เรียก `hmrRefresh()` มีแค่ guard เรื่อง runtime error (`RuntimeErrorHandler.hadRuntimeError`, `document.documentElement.id === '__next_error__'`) **ไม่มี guard ว่า router init แล้วหรือยัง** → อัปเกรด Next เฉยๆ ยังไม่หาย

**ทางเลือกที่มี แต่ไม่ทำ:**
- patch `node_modules` ให้ `hmrRefresh()` เช็ค `getCurrentAppRouterState() !== null` ก่อน → ต้องดูแล patch ตลอด แลกกับการลบ log ที่ไม่มีผลอะไร ไม่คุ้ม
- `next dev --webpack` → เลี่ยงได้แต่ dev ช้าลงทั้งทีม ไม่คุ้ม

## อาการที่สอง: warning "React state update on a component that hasn't mounted yet"

**สาเหตุเดียวกับ E668 เป๊ะ และไม่ใช่โค้ดเราเช่นกัน** (ตรวจ 2026-08-28 · จับ stack ได้ 3 ครั้ง สัญญาณเหมือนกันทุกครั้ง)

ข้อความ warning ฟังเหมือนกำลังด่าโค้ดเรา ("คุณมี side-effect ใน render") แต่ stack จริงไม่มีไฟล์ของเราอยู่เลยสักบรรทัด อ่านจากล่างขึ้นบน:

```
WebSocket.handleMessage          ← websocket ของ dev server
  processMessage
    startTransition
      Object.hmrRefresh          ← hot-reloader ของ Next
        dispatchAppRouterAction
          nextDispatch
            startTransition
              dispatchOptimisticSetState        ← React
                enqueueConcurrentHookUpdate
                  warnAboutUpdateOnNotYetMountedFiberInDEV   ← warning ออกตรงนี้
```

ตัวที่สั่ง state update คือ **ตัวบอกสถานะ render ของ Next DevTools** (`useAppDevRenderingIndicator` ใน `node_modules/next/dist/next-devtools/userspace/use-app-dev-rendering-indicator.js` — คือ `useTransition()` เฉยๆ) ซึ่งถูกเรียกใน `use-action-queue.js` **ใต้ `if (process.env.NODE_ENV !== 'production')`** ตรงๆ → production ไม่มีโค้ดนี้เลย

เทียบสองอาการ (race เดียวกัน คนละจังหวะเสี้ยววินาที):

| HMR refresh มาถึงตอน | ผลลัพธ์ |
| --- | --- |
| `useActionQueue` ยังไม่ทันรันเลย (`dispatch === null`) | **throw E668** |
| `useActionQueue` รันแล้ว แต่ fiber ของ Router ยัง mount ไม่เสร็จ | **warning "hasn't mounted yet"** |

ยืนยันว่าโค้ดเราไม่เกี่ยว:
- โหลดหน้าปกติ (ไม่แก้ไฟล์ระหว่างนั้น) → ไม่มี warning เลยสักหน้า
- Fast Refresh บนหน้าที่เปิดค้างอยู่แล้ว (hydrate เสร็จแล้ว) → ก็ไม่มี
- จะโผล่เฉพาะตอน "โหลดหน้าใหม่ + มี update จากการเซฟไฟล์ตกลงมาพอดี" เท่านั้น
- ดัก `console.error` ด้วยสคริปต์ที่รันก่อน hydrate แล้วเก็บ stack ได้ 3 ครั้ง (`/marketplace`, `/guide/versions`, `/honey`) — **ไม่มี frame ของ `src/app` หรือ `src/components` เลยแม้แต่ครั้งเดียว**

## ถ้าเจอ E668 ใน production ขึ้นมาจริง

แปลว่า **หน้าไม่ hydrate** (ไม่ใช่เรื่อง HMR แล้ว) — ปุ่ม/dropdown/สวิตช์จะกดไม่ติดทั้งหน้า
ที่ต้องดูก่อน: `deploymentId` ใน `next.config.ts` เป็นสตริงว่างหรือเปล่า (ดู #92855), chunk โหลดไม่ครบ, หรือ error ตอน hydrate ที่ทำให้ root render ไม่สำเร็จ
กรณีนั้นถือเป็นบั๊กจริงและต้องแก้ — ต่างจากเคส dev ในเอกสารนี้ที่ปล่อยไว้ได้
