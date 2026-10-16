# WG3 Plating Spare Part Management — วิธี Deploy

```
GitHub Pages (index.html)  --fetch(JSON)-->  Apps Script Web App (Code.gs)  -->  Google Sheet + Google Drive (รูป)
```

ไฟล์ในโฟลเดอร์นี้
- `index.html` — หน้าเว็บทั้งหมด (วางบน GitHub Pages) ตั้งค่า `DEMO_MODE = false` และใส่ `API_URL` ไว้แล้ว
- `Code.gs` — ฝั่งเซิร์ฟเวอร์ (วางใน Google Apps Script ที่ผูกกับ Google Sheet "Master Spare Part List")

## A. อัปเดต Code.gs (Apps Script)
1. เปิด Google Sheet → **Extensions > Apps Script** → วางเนื้อหา `Code.gs` ทับของเดิม → Save
2. รัน `setupSheets` หนึ่งครั้ง (Run) เพื่อให้แน่ใจว่าชีทและ Header ครบ (ไม่ลบข้อมูลเดิม) — กด **Allow** ถ้าถูกขอสิทธิ์ (รวมสิทธิ์ Google Drive สำหรับรูป)
3. **Deploy > Manage deployments > แก้ไข (ไอคอนดินสอ) > Version: New version > Deploy**
   (ถ้าไม่ทำข้อนี้ URL เดิมจะยังใช้โค้ดเก่า) — URL ของ Web app จะคงเดิม ไม่ต้องแก้ `API_URL`
   - Execute as: **Me** / Who has access: **Anyone**

## B. อัปเดตหน้าเว็บบน GitHub Pages
1. เข้า repository → เปิดไฟล์ `index.html` → ไอคอนดินสอ (Edit) หรือ **Add file > Upload files** แล้วแทนที่ด้วยไฟล์ใหม่
2. Commit changes → รอ 1–2 นาที → เปิดเว็บแล้วกด Ctrl+Shift+R (รีเฟรชล้างแคช)

## สิ่งที่เวอร์ชันนี้มี (สรุปการเปลี่ยนแปลงสำคัญ)
- ต้อง Login ทุกครั้งที่เปิดหน้าเว็บ (ไม่จำสถานะล็อกอิน)
- Inventory มีแท็บย่อยตาม Category (General, Consumable, PPE, Stationary), ตรึงหัวตาราง, คอลัมน์ Safety Stock ยุบ/ขยายได้, แยกคอลัมน์จำนวน/หน่วย
- อะไหล่ 1 ชิ้นใส่ได้ 2 รหัส (คั่นด้วย `,`) แสดงคนละบรรทัด และตรวจรหัสซ้ำทั้ง 2 รหัส
- หน้า Add Stock/Return เลือกได้ว่าเป็น "เติมสต็อก" หรือ "คืน" (บันทึกแยกประเภทในชีท History)
- ตัวกรอง Category/Owner ในหน้าเบิก/เติม/แก้ไข
- รูปอะไหล่ใช้ลิงก์ Drive แบบ thumbnail (แก้ปัญหารูปไม่แสดง) และรูปเดิมที่เป็นลิงก์แบบเก่าจะแสดงได้เองโดยไม่ต้องแก้ข้อมูล
- หน้าภาพรวมแสดงจำนวนอะไหล่แยกตาม Category

## ข้อควรทราบ
- Web app ตั้งเป็น "Anyone" (จำเป็นให้ GitHub Pages เรียกได้) — ผู้ที่รู้ URL สามารถเรียก API ตรงได้ เหมาะกับใช้ภายในทีม
- รหัสผ่านผู้ใช้เก็บเป็นข้อความธรรมดาในชีท `Users` — จำกัดสิทธิ์การเข้าถึงไฟล์ Google Sheet ให้เฉพาะผู้ดูแล
- โลโก้ที่อัปโหลดในหน้า "ข้อมูล Google Sheet" จำไว้เฉพาะเบราว์เซอร์เครื่องนั้น
