/* analysis.js v4 — แท็บ Analysis (เฉพาะ Level 2 ขึ้นไป)
 * ใช้คู่กับ index.html ที่มี SPM Plugin Host v1 (window.SPM) และ Backend คำสั่ง getFullSPAnalysis / updateWhData
 * อัปเดตไฟล์นี้แล้ว ให้เปลี่ยนเลขเวอร์ชันท้ายชื่อไฟล์ใน index.html (analysis.js?v=N) เพื่อล้างแคชของเบราว์เซอร์
 */
(function () {
  'use strict';
  var NEED_HOST = 2;
  if (!window.SPM || window.SPM.apiVersion !== NEED_HOST) {
    console.error('analysis.js: ต้องใช้ index.html ที่รองรับ SPM Plugin Host v' + NEED_HOST + ' — ข้ามการโหลดแท็บ Analysis');
    return;
  }
  const SPM = window.SPM;
  // ฟังก์ชันของแอปหลักที่ใช้ (ผูกตอนแอปเริ่มทำงาน จึงเรียกผ่านตัวแทนเสมอ)
  const t = k => SPM.api.t(k);
  const escHTML = x => SPM.api.escHTML(x);
  const callApi = (a, p) => SPM.api.callApi(a, p);
  const splitCodes = c => SPM.api.splitCodes(c);
  const codeKey = c => SPM.api.codeKey(c);
  const r2 = n => SPM.api.r2(n);
  const translateServerMsg = m => SPM.api.translateServerMsg(m);

  SPM.registerI18n({
    th: { tabAnalysis:'Analysis', analysisTitle:'Analysis — Full SP Analysis', analysisUpload:'Upload Excel', analysisUpdate:'Update WH data', whUploadOk:'Upload success!', whUploadFail:'Upload ไม่สำเร็จ: ', whNoFile:'ยังไม่ได้ Upload ไฟล์ Excel', whNoFormat:'Error: ไม่พบ Sheet ชื่อ "Format" ในไฟล์ Excel ที่ Upload', whNoHeader:'Error: ไม่พบหัวคอลัมน์ *Material และ *Stock Qty ใน Sheet "Format"', whUpdating:'กำลังอัปเดต Current WH Qty. ...', whDone:'อัปเดต Current WH Qty. แล้ว: จับคู่ด้วย P/N {m} รายการ, ด้วย Short Text {x} รายการ, No info {n} รายการ', whNoShortText:'หมายเหตุ: ไม่พบหัวคอลัมน์ Short Text ในไฟล์ Excel จึงเทียบด้วย P/N อย่างเดียว', whNoDesc:'หมายเหตุ: ชีทไม่มีหัวคอลัมน์ Description ( English ) ≤ 40 characters จึงเทียบด้วย P/N อย่างเดียว', whLast:'อัปเดต WH ล่าสุด', whLastNone:'ยังไม่เคยอัปเดต WH data', anBackendOld:'Backend ยังไม่ใช่เวอร์ชันล่าสุด: ให้วาง Code.gs/Analysis.gs ใหม่แล้ว Deploy New version', anSyncFail:'ซิงก์ชีทไม่สำเร็จ:', anMissingHeaders:'ไม่พบหัวคอลัมน์ในชีท:', anSyncOk:'ซิงก์ชีทแล้ว', analysisSearch:'ค้นหาในตาราง', analysisLegend:'ตัวเลข Current Internal Qty. ที่ขีดเส้นใต้ = ข้อมูลล่าสุดจากคลังอะไหล่ (จับคู่รหัสได้) ส่วนที่ไม่ขีดเส้นใต้ = ค่าจากชีท Full SP Analysis · ช่อง SUM (WH + Internal) สีส้ม = น้อยกว่า Safety stock / 4 month', analysisShowing:'แสดง {a} จาก {b} รายการ', analysisEmpty:'ไม่มีข้อมูลในชีท Full SP Analysis', analysisHdrMissing:'ไม่พบหัวคอลัมน์ "Spare parts P/N (Delta)" ในชีท จึงยังเทียบกับคลังอะไหล่ไม่ได้', },
    en: { tabAnalysis:'Analysis', analysisTitle:'Analysis — Full SP Analysis', analysisUpload:'Upload Excel', analysisUpdate:'Update WH data', whUploadOk:'Upload success!', whUploadFail:'Upload failed: ', whNoFile:'No Excel file uploaded yet', whNoFormat:'Error: Sheet "Format" not found in the uploaded Excel file', whNoHeader:'Error: Columns *Material and *Stock Qty not found in Sheet "Format"', whUpdating:'Updating Current WH Qty. ...', whDone:'Current WH Qty. updated: {m} matched by P/N, {x} by Short Text, {n} No info', whNoShortText:'Note: column Short Text not found in the Excel file, matched by P/N only', whNoDesc:'Note: the sheet has no column Description ( English ) ≤ 40 characters, matched by P/N only', whLast:'Last WH update', whLastNone:'WH data has not been updated yet', anBackendOld:'Backend is not the latest version: paste Code.gs/Analysis.gs again and Deploy a New version', anSyncFail:'Sheet sync failed:', anMissingHeaders:'Headers not found in the sheet:', anSyncOk:'Sheet synced', analysisSearch:'Search table', analysisLegend:'Underlined Current Internal Qty. = live value from the spare part inventory (code matched). Not underlined = value from the Full SP Analysis sheet · Orange SUM (WH + Internal) = below Safety stock / 4 month', analysisShowing:'Showing {a} of {b} rows', analysisEmpty:'No data in the Full SP Analysis sheet', analysisHdrMissing:'Column "Spare parts P/N (Delta)" not found, so rows cannot be matched with the inventory', }
  });
  SPM.addStyle(`
#analysisTableWrap{max-height:calc(100vh - 300px);overflow:auto;}
#analysisTableWrap thead th{position:sticky;top:0;background:var(--card);z-index:1;white-space:nowrap;}
#analysisTableWrap td{white-space:nowrap;}
#analysisTableWrap td u{text-underline-offset:3px;font-weight:700;}
#analysisTableWrap thead th.hl-th{background:#FFF176;color:#4A3F00;}
#analysisTableWrap td.cell-warn{background:#FFB74D;color:#5A2D00;font-weight:700;}
.wh-status{font-size:13px;font-weight:600;}
`);

  // เมนู Analysis แสดงเฉพาะ Level 2 ขึ้นไป (Level 3 = Admin เห็นทุกแท็บ)
  function canSeeAnalysis(u) { return SPM.api.levelOf(u) >= 2; }

// ================= Analysis (เฉพาะตำแหน่ง Admin / Engineer) =================
let analysisData = null;      // {headers:[...], rows:[[...]]} จากชีท Full SP Analysis
let analysisSearch = '';
let whWorkbook = null, whFileName = '';
let whStatus = {text:'', ok:true};
let whLastInfo = null;   // {atText, by, file} วันที่อัปเดต WH ล่าสุด
const ANALYSIS_MAX_ROWS = 500;
const WH_KEY_HEADER = 'Spare parts P/N (Delta)', WH_QTY_HEADER = 'Current WH Qty.', INTERNAL_QTY_HEADER = 'Current Internal Qty.';
const ANALYSIS_JS_VERSION = 'v4';
const hnorm = h => String(h==null?'':h).trim().toLowerCase().replace(/\s+/g,''); // ไม่สนตัวพิมพ์เล็ก/ใหญ่และช่องว่าง
const textKey = x => String(x==null?'':x).trim().replace(/\s+/g,' ').toLowerCase();
const SUM_HEADER = 'SUM (WH + Internal)', SAFETY_HEADER = 'Safety stock / 4 month';
const isNum = v => v!=='' && v!=null && isFinite(Number(v));
function renderAnalysis(){
  return `
  <div class="card">
    <h2>${t('analysisTitle')}</h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
      <button type="button" id="whUploadBtn" class="period-btn" style="border:1px solid var(--border);background:var(--bg);color:var(--text);padding:8px 14px;border-radius:8px;cursor:pointer;font-size:13px;">${t('analysisUpload')}</button>
      <button type="button" id="whUpdateBtn" class="submit" style="width:auto;padding:8px 16px;margin:0;">${t('analysisUpdate')}</button>
      <input type="file" id="whFileInput" accept=".xlsx,.xlsm,.xls" hidden>
      <span id="whStatus" class="wh-status" style="color:${whStatus.ok?'var(--ok)':'var(--danger)'};">${escHTML(whStatus.text)}</span>
    </div>
    <div id="whLast" style="font-size:13px;margin-top:10px;"></div>
    <div style="margin-top:12px;"><input id="analysisSearch" placeholder="${t('analysisSearch')}" value="${escHTML(analysisSearch)}" style="max-width:320px;"></div>
  </div>
  <div class="card">
    <div id="analysisInfo" style="font-size:12px;color:var(--muted);margin-bottom:8px;"></div>
    <div class="tbl-wrap" id="analysisTableWrap"><div class="empty">${t('loading')}</div></div>
    <div style="font-size:12px;color:var(--muted);margin-top:10px;">${t('analysisLegend')}</div>
    <div id="analysisStatus" style="font-size:12px;margin-top:8px;word-break:break-word;"></div>
  </div>`;
}
function loadAnalysis(){
  callApi('getFullSPAnalysis').then(res=>{
    if(!res || res.ok===false || !res.headers) throw new Error((res && res.message) || 'Invalid response');
    analysisData = res; renderAnalysisTable(); renderWhLast(res.whLast); renderAnalysisStatus(res);
  }).catch(err=>{
    const w = document.getElementById('analysisTableWrap');
    if(w) w.innerHTML = `<div class="empty">${t('loadFailShort')}${escHTML(translateServerMsg(err.message))}</div>`;
  });
}
function renderWhLast(w){
  const el = document.getElementById('whLast'); if(!el) return;
  if(w) whLastInfo = w;
  const x = whLastInfo;
  el.innerHTML = x ? `<b>${t('whLast')}:</b> ${escHTML(x.atText)}${x.by ? ' · ' + escHTML(x.by) : ''}${x.file ? ' · ' + escHTML(x.file) : ''}` : `<span style="color:var(--muted);">${t('whLastNone')}</span>`;
}
// บรรทัดสถานะ: เวอร์ชันไฟล์/Backend, ผลซิงก์ชีท และหัวคอลัมน์ที่ไม่พบ (ช่วยให้เห็นสาเหตุเมื่อผลลัพธ์ไม่เปลี่ยน)
function renderAnalysisStatus(res){
  const el = document.getElementById('analysisStatus'); if(!el) return;
  const has = n => res.headers.some(h=>hnorm(h)===hnorm(n));
  const miss = [WH_KEY_HEADER, INTERNAL_QTY_HEADER, WH_QTY_HEADER, SUM_HEADER, SAFETY_HEADER].filter(n=>!has(n));
  const warns = [];
  if(!res.backend) warns.push(t('anBackendOld'));
  else if(res.sync && res.sync.ok === false) warns.push(t('anSyncFail') + ' ' + (res.sync.message || ''));
  if(miss.length) warns.push(t('anMissingHeaders') + ' ' + miss.join(', '));
  el.style.color = warns.length ? 'var(--danger)' : 'var(--muted)';
  el.textContent = 'analysis.js ' + ANALYSIS_JS_VERSION + ' · Backend ' + (res.backend || '—') + ' · ' + (warns.length ? warns.join(' · ') : t('anSyncOk'));
}
function renderAnalysisTable(){
  const wrap = document.getElementById('analysisTableWrap'); if(!wrap || !analysisData) return;
  const H = analysisData.headers, R = analysisData.rows;
  if(!R.length){ wrap.innerHTML = `<div class="empty">${t('analysisEmpty')}</div>`; return; }
  const iPN = H.findIndex(h=>hnorm(h)===hnorm(WH_KEY_HEADER)), iInt = H.findIndex(h=>hnorm(h)===hnorm(INTERNAL_QTY_HEADER));
  const iSum = H.findIndex(h=>hnorm(h)===hnorm(SUM_HEADER)), iSafe = H.findIndex(h=>hnorm(h)===hnorm(SAFETY_HEADER)), iWh = H.findIndex(h=>hnorm(h)===hnorm(WH_QTY_HEADER));
  const asNum = v => (v===''||v==null||!isFinite(Number(v))) ? 0 : Number(v);   // No info / ว่าง / ข้อความ = 0
  const canSum = iSum>=0 && iInt>=0 && iWh>=0;
  const idx = new Map(); SPM.api.getParts().forEach(p=>splitCodes(p.code).forEach(c=>idx.set(codeKey(c), p)));
  const live = row => { if(iPN<0) return null; for(const c of splitCodes(String(row[iPN]))){ const p = idx.get(codeKey(c)); if(p) return p; } return null; };
  const q = analysisSearch.trim().toLowerCase();
  const filtered = q ? R.filter(r=>r.join(' ').toLowerCase().includes(q)) : R;
  const shown = filtered.slice(0, ANALYSIS_MAX_ROWS);
  wrap.innerHTML = `<table><thead><tr>${H.map((h,i)=>`<th class="${(i===iSum||i===iSafe)?'hl-th':''}">${escHTML(h)}</th>`).join('')}</tr></thead><tbody>
    ${shown.map(r=>{ const p = (iInt>=0) ? live(r) : null;
      const sumVal = canSum ? r2(asNum(p ? (p.pending ? 0 : p.stock) : r[iInt]) + asNum(r[iWh])) : r[iSum]; // SUM = Current WH Qty. + Current Internal Qty.
      const low = iSum>=0 && iSafe>=0 && isNum(sumVal) && isNum(r[iSafe]) && Number(sumVal) < Number(r[iSafe]); // SUM น้อยกว่า Safety stock / 4 month
      return `<tr>${H.map((h,i)=> (i===iInt && p) ? `<td><u title="${escHTML(t('colStock'))}">${SPM.api.stockText(p)}</u></td>` : (i===iSum && canSum) ? `<td class="${low?'cell-warn':''}">${sumVal}</td>` : `<td>${escHTML(r[i]==null?'':r[i])}</td>`).join('')}</tr>`; }).join('')}
  </tbody></table>`;
  const info = document.getElementById('analysisInfo');
  if(info) info.textContent = t('analysisShowing').replace('{a}', shown.length).replace('{b}', filtered.length) + (iPN<0 ? ' · ' + t('analysisHdrMissing') : '');
}
function setWhStatus(text, ok){ whStatus = {text, ok}; const el = document.getElementById('whStatus'); if(el){ el.textContent = text; el.style.color = ok ? 'var(--ok)' : 'var(--danger)'; } }
let _xlsxPromise = null;
function loadXLSX(){ // ตัวอ่านไฟล์ Excel (SheetJS) โหลดเมื่อใช้งานครั้งแรกเท่านั้น
  if(window.XLSX) return Promise.resolve(window.XLSX);
  if(_xlsxPromise) return _xlsxPromise;
  _xlsxPromise = new Promise((res, rej)=>{
    const sc = document.createElement('script');
    sc.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    sc.onload = ()=>res(window.XLSX);
    sc.onerror = ()=>{ _xlsxPromise = null; rej(new Error('โหลดตัวอ่านไฟล์ Excel ไม่สำเร็จ (ตรวจการเชื่อมต่ออินเทอร์เน็ต)')); };
    document.head.appendChild(sc);
  });
  return _xlsxPromise;
}
function handleWhFile(file){
  if(!file) return;
  whWorkbook = null; whFileName = file.name;
  loadXLSX().then(X=>file.arrayBuffer().then(buf=>{ whWorkbook = X.read(buf, {type:'array'}); setWhStatus(t('whUploadOk') + '  (' + file.name + ')', true); }))
    .catch(err=>setWhStatus(t('whUploadFail') + err.message, false));
}
function doUpdateWh(){
  if(!whWorkbook){ setWhStatus(t('whNoFile'), false); return; }
  const X = window.XLSX;
  const sheetName = whWorkbook.SheetNames.find(n=>hnorm(n)==='format');
  if(!sheetName){ setWhStatus(t('whNoFormat'), false); return; }
  const rows = X.utils.sheet_to_json(whWorkbook.Sheets[sheetName], {header:1, raw:true, defval:''});
  let hr = -1, cM = -1, cQ = -1, cT = -1;
  for(let i=0; i<Math.min(rows.length, 30) && hr<0; i++){
    const m = rows[i].findIndex(c=>hnorm(c)==='*material'), q = rows[i].findIndex(c=>hnorm(c)==='*stockqty');
    if(m>=0 && q>=0){ hr = i; cM = m; cQ = q; cT = rows[i].findIndex(c=>hnorm(c)==='shorttext'); }
  }
  if(hr<0){ setWhStatus(t('whNoHeader'), false); return; }
  const agg = new Map(); // รวมจำนวนของแถวที่ Material และ Short Text เหมือนกัน
  for(let i=hr+1; i<rows.length; i++){
    const mat = String(rows[i][cM]==null?'':rows[i][cM]).trim();
    const txt = cT>=0 ? String(rows[i][cT]==null?'':rows[i][cT]).trim() : '';
    if(!mat && !txt) continue;
    const qty = Number(String(rows[i][cQ]).replace(/,/g,'')) || 0;
    const k = codeKey(mat) + '|' + textKey(txt), cur = agg.get(k);
    agg.set(k, {material: mat, text: txt, qty: r2((cur ? cur.qty : 0) + qty)});
  }
  setWhStatus(t('whUpdating'), true);
  const btn = document.getElementById('whUpdateBtn'); if(btn) btn.disabled = true;
  callApi('updateWhData', {items:[...agg.values()], fileName:whFileName, person:(SPM.api.getUser()&&SPM.api.getUser().name)||''}).then(res=>{
    if(btn) btn.disabled = false;
    if(!res.ok){ setWhStatus(translateServerMsg(res.message), false); return; }
    let msg = t('whDone').replace('{m}', res.matched).replace('{x}', res.matchedText||0).replace('{n}', res.noInfo);
    if(cT<0) msg += ' · ' + t('whNoShortText'); else if(res.descFound===false) msg += ' · ' + t('whNoDesc');
    setWhStatus(msg, true);
    renderWhLast(res.whLast);
    loadAnalysis();
  }).catch(err=>{ if(btn) btn.disabled = false; setWhStatus(t('errorPrefix') + err.message, false); });
}
document.addEventListener('click', e=>{
  const c = e.target.closest ? e.target.closest('#whUploadBtn, #whUpdateBtn') : null; if(!c) return;
  if(c.id==='whUploadBtn') document.getElementById('whFileInput').click(); else doUpdateWh();
});
document.addEventListener('change', e=>{ if(e.target.id==='whFileInput'){ handleWhFile(e.target.files[0]); e.target.value = ''; } });
document.addEventListener('input', e=>{ if(e.target.id==='analysisSearch'){ analysisSearch = e.target.value; renderAnalysisTable(); } });


  SPM.registerTab({ id: 'analysis', labelKey: 'tabAnalysis', icon: '🔬', after: 'report', visible: canSeeAnalysis, render: renderAnalysis, onShow: loadAnalysis });
})();
