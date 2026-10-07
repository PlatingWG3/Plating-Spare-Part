# ระบบจัดการอะไหล่ (Spare Part Management) — Deploy บน GitHub Pages

สถาปัตยกรรมใหม่: **หน้าเว็บ (index.html)** โฮสต์บน GitHub Pages (static site)
เรียก **API ผ่าน Google Apps Script Web App** (Code.gs) ที่อ่าน/เขียนข้อมูลลง
Google Sheet "Master Spare Part List" โดยตรง

```
GitHub Pages (index.html)  --fetch(JSON)-->  Apps Script Web App (Code.gs)  --read/write-->  Google Sheet
```

## ขั้นตอนที่ 1 — Deploy Apps Script เป็น API backend

1. เปิด Google Sheet "Master Spare Part List" → เมนู **Extensions > Apps Script**
2. วางไฟล์ `Code.gs` ทับโค้ดเดิม (ไฟล์ Index.html ของ Apps Script จะไม่ถูกใช้แล้ว แต่ทิ้งไว้ได้ไม่มีผล)
3. รันฟังก์ชัน `setupSheets` หนึ่งครั้ง (เมนู Run > เลือกฟังก์ชัน setupSheets > Run) เพื่อสร้าง Header
   ครบทั้ง 4 ชีท และ seed บัญชีผู้ใช้เริ่มต้น — ต้องกด **Allow** ตอนขอสิทธิ์ (รวมสิทธิ์ Google Drive
   สำหรับอัปโหลดรูป)
4. **Deploy > New deployment**
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (จำเป็น เพราะหน้าเว็บจาก GitHub Pages ต้องเรียกเข้ามาได้โดยไม่ต้อง
     ล็อกอินด้วย Google account — ระบบมี username/password ของตัวเองอยู่แล้ว)
   - กด Deploy แล้ว **คัดลอก Web app URL** ที่ได้ (ลงท้ายด้วย `/exec`)

> ⚠️ ทุกครั้งที่แก้ไข Code.gs ภายหลัง ต้องไปที่ **Manage deployments > แก้ไข (ปากกา) >
> Version: New version > Deploy** ไม่เช่นนั้น URL เดิมจะยังใช้โค้ดเวอร์ชันเก่าอยู่

## ขั้นตอนที่ 2 — ตั้งค่าไฟล์ index.html

เปิดไฟล์ `index.html` หาบรรทัดนี้ใกล้ด้านบนของ `<script>`:

```js
const API_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
```

แก้เป็น Web app URL ที่คัดลอกมาจากขั้นตอนที่ 1 เช่น:

```js
const API_URL = "https://script.google.com/macros/s/AKfycbx.../exec";
```

## ขั้นตอนที่ 3 — สร้าง Repository บน GitHub

1. ไปที่ github.com → **New repository** → ตั้งชื่อ (เช่น `spare-part-management`) → Create
2. อัปโหลดไฟล์ `index.html` (ที่แก้ API_URL แล้ว) เข้า repo — ลากไฟล์วางในหน้า "Add file > Upload files"
   แล้ว Commit
3. ไปที่ **Settings > Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** / folder **/ (root)** → Save
4. รอสักครู่ (1–2 นาที) แล้ว GitHub จะให้ลิงก์เว็บไซต์ เช่น
   `https://<username>.github.io/spare-part-management/`

## ขั้นตอนที่ 4 — ทดสอบ

เปิดลิงก์ GitHub Pages ที่ได้ → ควรเห็นหน้า Login
(Demo accounts: `admin/1234`, `me01/1234`, `mfg01/1234`, `pe01/1234`)

ถ้าเข้าหน้า Login ไม่ได้ หรือเจอ error "เชื่อมต่อ API ไม่ได้":
- เปิด Console (F12) ดู error เพิ่มเติม
- เช็กว่า API_URL ถูกต้องและลงท้ายด้วย `/exec` (ไม่ใช่ `/dev`)
- เช็กว่า Deploy เป็น "Anyone" ที่เข้าถึงได้ ไม่ใช่ "Only myself"
- เช็กว่า deploy เวอร์ชันล่าสุดแล้ว (Manage deployments)

## ข้อควรทราบด้านความปลอดภัย

เนื่องจาก Web app ตั้งเป็น "Anyone" เข้าถึงได้ (จำเป็นสำหรับให้ GitHub Pages เรียกได้)
ใครก็ตามที่รู้ URL ของ Web app สามารถเรียก API ได้โดยตรง (ข้ามหน้า Login ของเว็บ) —
เหมาะสำหรับใช้งานภายในทีม/องค์กรที่ไว้ใจกันในระดับหนึ่ง หากต้องการความปลอดภัยสูงขึ้น
ควรพิจารณาเพิ่ม API key หรือ token ตรวจสอบใน `doPost` ของ Code.gs เพิ่มเติม
