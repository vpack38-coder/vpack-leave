/* ==================================================================
 * กระดานคนลา V-pack (leave-board.js) v1.0 — 02/11/2569
 * ใช้แสดง "วันนี้ใครลา / ลาล่วงหน้า" ในหน้าเว็บระบบ Production
 *
 * วิธีใช้: วาง 2 บรรทัดนี้ในหน้า HTML ตรงที่อยากให้กระดานขึ้น
 *   <div id="vpack-leave-board"></div>
 *   <script src="https://vpack38-coder.github.io/vpack-leave/leave-board.js"></script>
 *
 * ตัวเลือก (ใส่ใน div ได้):  data-days="14"  = ดูล่วงหน้ากี่วัน
 *                            data-compact="1" = แบบแถบบรรทัดเดียว (เหมาะกับหน้าที่พื้นที่น้อย)
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
  .vlb{font-family:inherit;background:#fff;border:1px solid #ebe3de;border-left:4px solid #d24a0e;border-radius:12px;padding:10px 14px;margin:0 0 14px;box-shadow:0 1px 2px rgba(0,0,0,.04);color:#1f1a17;line-height:1.4}
  .vlb-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-weight:700}
  .vlb-h .vlb-d{font-weight:400;color:#6f6660;font-size:.85em}
  .vlb-h button{margin-left:auto;background:none;border:1px solid #ebe3de;border-radius:8px;padding:2px 10px;cursor:pointer;font:inherit;font-size:.85em;color:#6f6660}
  .vlb-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
  .vlb-p{display:inline-flex;align-items:center;gap:6px;background:#f7f3f0;border-radius:999px;padding:3px 10px 3px 4px;font-size:.92em;white-space:nowrap}
  .vlb-p b{font-weight:700}
  .vlb-t{border-radius:999px;padding:1px 8px;font-size:.85em;font-weight:600}
  .vlb-s{color:#6f6660;font-size:.85em}
  .vlb-none{color:#1f8a4c;margin-top:6px;font-size:.95em}
  .vlb-up{margin-top:10px;border-top:1px dashed #ebe3de;padding-top:8px}
  .vlb-up-h{font-weight:700;font-size:.9em;color:#6f6660}
  .vlb-day{display:flex;gap:8px;align-items:flex-start;margin-top:6px}
  .vlb-day .vlb-dl{flex:0 0 92px;font-size:.88em;color:#6f6660;padding-top:4px}
  .vlb-err{color:#c62828;font-size:.85em;margin-top:6px}
  .vlb.vlb-c{padding:6px 12px}
  .vlb.vlb-c .vlb-row{display:inline-flex;margin:0 0 0 6px}
  .vlb.vlb-c .vlb-h{display:inline-flex}`;

  function el(html) { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function addDays(iso, n) { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function dm(iso) { const [y, m, d] = iso.split('-'); return d + '/' + m; }
  function dmy(iso) { const [y, m, d] = iso.split('-'); return d + '/' + m + '/' + (+y + 543); }
  function dayName(iso) { return TH_DAY[new Date(iso + 'T00:00:00Z').getUTCDay()]; }
  function periodShort(p, days) {
    p = p || 'เต็มวัน';
    if (/^ครึ่งวันเช้า/.test(p)) return 'ครึ่งเช้า';
    if (/^ครึ่งวันบ่าย/.test(p)) return 'ครึ่งบ่าย';
    if (/^เต็มวัน/.test(p)) return 'ทั้งวัน';
    return p.replace(/\s*\(.*\)$/, '');
  }
  function pill(it, showRange) {
    const t = it.type === 'อื่นๆ' && it.typeOther ? it.typeOther : (it.type === 'อุบัติเหตุจากการทำงาน(กท.)' ? 'กท.' : it.type);
    const c = COLORS[it.type] || COLORS['อื่นๆ'];
    const range = it.end !== it.start ? dm(it.start) + '–' + dm(it.end) : '';
    return `<span class="vlb-p" title="${esc(it.name)} · ${esc(it.dept)}"><span class="vlb-t" style="background:${c[0]};color:${c[1]}">${esc(t)}</span>` +
      `<b>${esc(it.nick || it.name)}</b><span class="vlb-s">${esc(periodShort(it.period))}${showRange && range ? ' · ' + range : ''}</span></span>`;
  }

  async function load(box) {
    const days = Math.max(0, parseInt(box.dataset.days || '14', 10) || 14);
    const compact = box.dataset.compact === '1';
    try {
      const r = await fetch(SB_URL + '/rest/v1/rpc/leave_board', {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SB_ANON, Authorization: 'Bearer ' + SB_ANON },
        body: JSON.stringify({ p_days: days })
      });
      if (!r.ok) throw new Error('โหลดข้อมูลคนลาไม่ได้ (' + r.status + ')');
      const j = await r.json(), today = j.today, items = j.items || [];
      const now = items.filter(i => i.start <= today && i.end >= today);
      const up = items.filter(i => i.start > today);
      let h = `<div class="vlb${compact ? ' vlb-c' : ''}"><div class="vlb-h">🏖 วันนี้ลา ${now.length ? '(' + now.length + ' คน)' : ''}` +
        `<span class="vlb-d">${dayName(today)} ${dmy(today)}</span>` +
        (!compact && up.length ? `<button type="button" data-t>ล่วงหน้า ${up.length} รายการ ▾</button>` : '') + `</div>`;
      h += now.length ? `<div class="vlb-row">${now.map(i => pill(i, true)).join('')}</div>` : `<div class="vlb-none">วันนี้มาครบ ✓</div>`;
      if (compact && up.length) h += ` <span class="vlb-s">· ล่วงหน้า ${up.length} รายการ</span>`;
      if (!compact && up.length) {
        const byDay = {};
        up.forEach(i => (byDay[i.start] = byDay[i.start] || []).push(i));
        const tomorrow = addDays(today, 1);
        h += `<div class="vlb-up" data-up style="display:none"><div class="vlb-up-h">ลาล่วงหน้า (${days} วัน)</div>` +
          Object.keys(byDay).sort().map(d => `<div class="vlb-day"><div class="vlb-dl">${d === tomorrow ? 'พรุ่งนี้' : dayName(d) + ' ' + dm(d)}</div>` +
            `<div class="vlb-row" style="margin:0">${byDay[d].map(i => pill(i, true)).join('')}</div></div>`).join('') + `</div>`;
      }
      h += `</div>`;
      box.innerHTML = h;
      const btn = box.querySelector('[data-t]'), upBox = box.querySelector('[data-up]');
      if (btn && upBox) {
        let open = false;
        try { open = localStorage.getItem('vlb_open') === '1'; } catch (e) { }
        const set = v => { open = v; upBox.style.display = v ? '' : 'none'; btn.textContent = 'ล่วงหน้า ' + up.length + ' รายการ ' + (v ? '▴' : '▾'); try { localStorage.setItem('vlb_open', v ? '1' : '0'); } catch (e) { } };
        set(open);
        btn.onclick = () => set(!open);
      }
    } catch (e) {
      if (!box.innerHTML) box.innerHTML = `<div class="vlb"><div class="vlb-h">🏖 วันนี้ลา</div><div class="vlb-err">${esc(e.message)}</div></div>`;
    }
  }

  function init() {
    if (!document.getElementById('vlb-style')) { const s = document.createElement('style'); s.id = 'vlb-style'; s.textContent = css; document.head.appendChild(s); }
    // รองรับหน้าเว็บที่สร้างกล่องทีหลัง (เช่น หลังล็อกอิน) — คอยดูแล้วผูกกล่องใหม่อัตโนมัติ
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
