/* ==================================================================
 * กระดานคนลา V-pack (leave-board.js) v1.1 — 02/11/2569
 * แสดง "วันนี้ใครลา / ลาล่วงหน้า" ในหน้าเว็บระบบอื่น (เช่น Production)
 *
 * วิธีใช้: วางกล่องนี้ตรงที่อยากให้ขึ้น แล้วโหลดสคริปต์ 1 ครั้งท้ายหน้า
 *   <div class="vpack-leave-board" data-mode="strip"></div>
 *   <script src="https://vpack38-coder.github.io/vpack-leave/leave-board.js"></script>
 *
 * data-mode:  strip = แถบบรรทัดเดียว (ค่าเริ่มต้น) · card = การ์ดตัวเลขเล็ก · full = กล่องเต็ม
 * data-days:  ดูล่วงหน้ากี่วัน (ค่าเริ่มต้น 14)
 * "ลาล่วงหน้า" เปิดเป็นหน้าต่างลอย ไม่ดันเนื้อหาในหน้าลง
 * ================================================================== */
(function () {
  const SB_URL = 'https://arcafornkumgbxdzmdob.supabase.co';
  const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyY2Fmb3Jua3VtZ2J4ZHptZG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MTY4NTAsImV4cCI6MjEwOTE5Mjg1MH0.dBaUZO5UHHsRfKsTtIJhI4Qx3t5V1cX3npKMo3J4Exw';
  const REFRESH_MIN = 5;

  const TH_DAY = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const COLORS = {
    'ลาป่วย': ['#e8f1fd', '#1b5fb0'], 'ลากิจ': ['#f2ebfd', '#6a3fb0'], 'ลาพักร้อน': ['#e5f5ec', '#1f8a4c'],
    'ลาคลอด': ['#fdeaf4', '#a8326e'], 'อุบัติเหตุจากการทำงาน(กท.)': ['#fdeaea', '#c62828'], 'อื่นๆ': ['#eeeeee', '#555555']
  };
  const css = `
  .vlb{font-family:inherit;color:#1f1a17;line-height:1.4}
  .vlb-p{display:inline-flex;align-items:center;gap:5px;background:#f4f1ee;border-radius:999px;padding:2px 9px 2px 3px;font-size:.92em;white-space:nowrap}
  .vlb-p b{font-weight:700}
  .vlb-t{border-radius:999px;padding:0 7px;font-size:.85em;font-weight:600}
  .vlb-s{color:#6f6660;font-size:.86em}
  .vlb-ok{color:#1f8a4c;font-weight:600}
  .vlb-btn{background:#fff;border:1px solid #e3ddd8;border-radius:8px;padding:1px 9px;cursor:pointer;font:inherit;font-size:.86em;color:#6f6660;white-space:nowrap}
  .vlb-btn:hover{border-color:#d24a0e;color:#d24a0e}
  /* แถบบรรทัดเดียว */
  .vlb-strip{display:flex;align-items:center;gap:6px;flex-wrap:wrap;background:#fff;border:1px solid #ebe3de;border-left:4px solid #d24a0e;border-radius:10px;padding:5px 12px;font-size:13px}
  .vlb-strip .vlb-h{font-weight:700;white-space:nowrap}
  .vlb-strip .vlb-btn{margin-left:auto}
  /* การ์ด */
  .vlb-card{cursor:pointer;min-width:0}
  .vlb-card .vlb-names{font-size:12px;color:#6f6660;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
  /* กล่องเต็ม */
  .vlb-full{background:#fff;border:1px solid #ebe3de;border-left:4px solid #d24a0e;border-radius:12px;padding:10px 14px}
  .vlb-full .vlb-h{display:flex;align-items:center;gap:8px;font-weight:700}
  .vlb-full .vlb-btn{margin-left:auto}
  .vlb-row{display:flex;flex-wrap:wrap;gap:5px}
  /* หน้าต่างลอย */
  .vlb-pop{position:absolute;z-index:9999;background:#fff;border:1px solid #e3ddd8;border-radius:12px;box-shadow:0 10px 30px rgba(30,20,10,.18);padding:10px 14px;width:min(460px,calc(100vw - 24px));max-height:70vh;overflow:auto;font-family:inherit;font-size:13px;color:#1f1a17;line-height:1.4}
  .vlb-pop h5{margin:2px 0 6px;font-size:13px;color:#6f6660}
  .vlb-pop h5:not(:first-child){margin-top:12px;padding-top:8px;border-top:1px dashed #ebe3de}
  .vlb-day{display:flex;gap:8px;align-items:flex-start;margin-top:5px}
  .vlb-day .vlb-dl{flex:0 0 74px;color:#6f6660;padding-top:3px}
  .vlb-err{color:#c62828;font-size:12px}`;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function addDays(iso, n) { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function dm(iso) { const p = iso.split('-'); return p[2] + '/' + p[1]; }
  function dmy(iso) { const p = iso.split('-'); return p[2] + '/' + p[1] + '/' + (+p[0] + 543); }
  function dayName(iso) { return TH_DAY[new Date(iso + 'T00:00:00Z').getUTCDay()]; }
  function typeLabel(it) { return it.type === 'อื่นๆ' && it.typeOther ? it.typeOther : (it.type === 'อุบัติเหตุจากการทำงาน(กท.)' ? 'กท.' : it.type); }
  function periodShort(p) {
    p = p || 'เต็มวัน';
    if (/^ครึ่งวันเช้า/.test(p)) return 'ครึ่งเช้า';
    if (/^ครึ่งวันบ่าย/.test(p)) return 'ครึ่งบ่าย';
    if (/^เต็มวัน/.test(p)) return 'ทั้งวัน';
    return p.replace(/\s*\(.*\)$/, '');
  }
  function pill(it) {
    const c = COLORS[it.type] || COLORS['อื่นๆ'];
    const range = it.end !== it.start ? ' · ' + dm(it.start) + '–' + dm(it.end) : '';
    return `<span class="vlb-p" title="${esc(it.name)} · ${esc(it.dept)}"><span class="vlb-t" style="background:${c[0]};color:${c[1]}">${esc(typeLabel(it))}</span>` +
      `<b>${esc(it.nick || it.name)}</b><span class="vlb-s">${esc(periodShort(it.period))}${range}</span></span>`;
  }

  /* ---------- หน้าต่างลอย ---------- */
  let pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  document.addEventListener('click', e => { if (pop && !pop.contains(e.target) && !e.target.closest('[data-vlb-open]')) closePop(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePop(); });
  window.addEventListener('resize', closePop);
  function openPop(anchor, data, withToday) {
    if (pop && pop._a === anchor) return closePop();
    closePop();
    const { today, now, up, days } = data, tomorrow = addDays(today, 1);
    let h = '';
    if (withToday) h += `<h5>วันนี้ (${dayName(today)} ${dmy(today)})</h5>` + (now.length ? `<div class="vlb-row">${now.map(pill).join('')}</div>` : `<div class="vlb-ok">มาครบ ✓</div>`);
    const byDay = {};
    up.forEach(i => (byDay[i.start] = byDay[i.start] || []).push(i));
    h += `<h5>ลาล่วงหน้า ${days} วัน</h5>` + (up.length ? Object.keys(byDay).sort().map(d =>
      `<div class="vlb-day"><div class="vlb-dl">${d === tomorrow ? 'พรุ่งนี้' : dayName(d) + ' ' + dm(d)}</div><div class="vlb-row">${byDay[d].map(pill).join('')}</div></div>`).join('')
      : '<div class="vlb-s">ยังไม่มีใครแจ้งลาล่วงหน้า</div>');
    pop = document.createElement('div');
    pop.className = 'vlb-pop'; pop.innerHTML = h; pop._a = anchor;
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect(), w = pop.offsetWidth;
    let left = r.right - w + window.scrollX;
    if (left < 12 + window.scrollX) left = Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - w - 12);
    pop.style.left = left + 'px';
    pop.style.top = (r.bottom + 6 + window.scrollY) + 'px';
  }

  /* ---------- วาดกล่อง ---------- */
  function render(box, data) {
    const mode = box.dataset.compact === '1' ? 'strip' : (box.dataset.mode || 'strip');
    const { today, now, up } = data;
    if (mode === 'card') {
      // ใช้กับการ์ดตัวเลขบนหน้าหลัก: หัวข้อเล็ก + ตัวเลขใหญ่ + รายชื่อบรรทัดเดียว (คลิกดูทั้งหมด)
      box.classList.add('vlb', 'vlb-card');
      box.setAttribute('data-vlb-open', '1');
      box.title = 'คลิกดูรายละเอียด และลาล่วงหน้า';
      box.innerHTML = `<span>🏖 วันนี้ลา${up.length ? ` · ล่วงหน้า ${up.length}` : ''}</span>` +
        (now.length ? `<b>${now.length} คน</b><div class="vlb-names">${now.map(i => esc(i.nick || i.name) + ' (' + esc(typeLabel(i).replace(/^ลา/, '')) + ')').join(' · ')}</div>`
          : `<b class="vlb-ok">มาครบ ✓</b>`);
      box.onclick = e => { e.preventDefault(); e.stopPropagation(); openPop(box, data, true); };
      return;
    }
    const btn = `<button type="button" class="vlb-btn" data-vlb-open="1">ล่วงหน้า ${up.length} ▾</button>`;
    if (mode === 'full') {
      box.innerHTML = `<div class="vlb vlb-full"><div class="vlb-h">🏖 วันนี้ลา ${now.length ? '(' + now.length + ' คน)' : ''}<span class="vlb-s" style="font-weight:400">${dayName(today)} ${dmy(today)}</span>${btn}</div>` +
        `<div class="vlb-row" style="margin-top:6px">${now.length ? now.map(pill).join('') : '<span class="vlb-ok">วันนี้มาครบ ✓</span>'}</div></div>`;
    } else {
      box.innerHTML = `<div class="vlb vlb-strip"><span class="vlb-h">🏖 วันนี้ลา${now.length ? ' (' + now.length + ')' : ''}</span>` +
        (now.length ? now.map(pill).join('') : '<span class="vlb-ok">มาครบ ✓</span>') + btn + `</div>`;
    }
    box.querySelector('[data-vlb-open]').onclick = e => { e.stopPropagation(); openPop(e.currentTarget, data, false); };
  }

  async function load(box) {
    const days = Math.max(0, parseInt(box.dataset.days || '14', 10) || 14);
    try {
      const r = await fetch(SB_URL + '/rest/v1/rpc/leave_board', {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SB_ANON, Authorization: 'Bearer ' + SB_ANON },
        body: JSON.stringify({ p_days: days })
      });
      if (!r.ok) throw new Error('โหลดข้อมูลคนลาไม่ได้ (' + r.status + ')');
      const j = await r.json(), today = j.today, items = j.items || [];
      render(box, { today, days, now: items.filter(i => i.start <= today && i.end >= today), up: items.filter(i => i.start > today) });
    } catch (e) {
      if (!box.dataset.vlbOk) box.innerHTML = `<span class="vlb-err">🏖 ${esc(e.message)}</span>`;
      return;
    }
    box.dataset.vlbOk = '1';
  }

  function init() {
    if (!document.getElementById('vlb-style')) { const s = document.createElement('style'); s.id = 'vlb-style'; s.textContent = css; document.head.appendChild(s); }
    // รองรับหน้าเว็บที่สร้างกล่องทีหลัง (เช่น หลังล็อกอิน / เปลี่ยนหน้า) — ผูกกล่องใหม่อัตโนมัติ
    const scan = () => document.querySelectorAll('#vpack-leave-board, .vpack-leave-board').forEach(box => {
      if (box.dataset.vlbBound) return;
      box.dataset.vlbBound = '1';
      load(box);
      const t = setInterval(() => { if (!document.contains(box)) return clearInterval(t); load(box); }, REFRESH_MIN * 60 * 1000);
    });
    scan();
    let pending = false;
    new MutationObserver(() => { if (pending) return; pending = true; setTimeout(() => { pending = false; scan(); }, 300); })
      .observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
