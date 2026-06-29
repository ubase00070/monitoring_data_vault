(function () {
  'use strict';

  const CHANNELS = [
    { id: 'C068DBP6L2H', name: '서비스운영이슈_HW', type: 'hw' },
    { id: 'C06CMMJ4CDP', name: '서비스운영이슈_SW', type: 'sw' },
    { id: 'C07L6MNRGSE', name: '유베이스_가이드및이슈공유', type: 'general' },
    { id: 'C034PQLGEUU', name: 'OS_서비스운영', type: 'general' },
    { id: 'C07KS5H2Y2K', name: '유베이스_내부소통방', type: 'general' },
    { id: 'C091JMYC2FP', name: '다중관제_배차알림', type: 'dispatch' },
    { id: 'C06BUA1G9U7', name: '전체사이트_배차알림', type: 'dispatch' },
  ];

  const BOT_NAMES = ['뉴비슈', '뉴비슈_HW', '뉴비슈_SW', 'Neubie', 'neubie'];

  function getToken() {
    try {
      const boot = unsafeWindow?.TS?.boot_data;
      if (boot?.api_token) return boot.api_token;
      const store = unsafeWindow?.TS?.redux?.store?.getState();
      if (store?.auth?.currentUser?.token) return store.auth.currentUser.token;
    } catch (e) {}
    const m = document.cookie.match(/(?:^|;\s*)d=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  async function slackAPI(method, params) {
    const token = getToken();
    if (!token) throw new Error('슬랙 토큰을 찾을 수 없습니다.');
    const url = new URL(`https://slack.com/api/${method}`);
    url.searchParams.set('token', token);
    Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'API 오류');
    return data;
  }

  function buildQueries(robot, keywords, dateFrom, dateTo, channelIds, msgType) {
    const robotVariants = robot ? expandRobotName(robot) : [];
    const base = robotVariants.length ? robotVariants.join(' OR ') : '';
    const kw = keywords?.trim() || '';
    const q = [base, kw].filter(Boolean).join(' ');
    const after = dateFrom ? `after:${dateFrom}` : '';
    const before = dateTo && dateTo !== '오늘' ? `before:${dateTo}` : '';

    return channelIds.map(cid => {
      const ch = CHANNELS.find(c => c.id === cid);
      const inClause = ch ? `in:${ch.name.replace(/[_\s]/g, '-')}` : `in:<#${cid}>`;
      return [q, inClause, after, before].filter(Boolean).join(' ');
    });
  }

  function expandRobotName(name) {
    const variants = [name];
    const trimmed = name.trim();
    if (/^\d+$/.test(trimmed)) {
      variants.push(`#${trimmed}`, `호기 ${trimmed}`, `${trimmed}호기`);
    } else {
      variants.push(
        trimmed.replace(/\s+/g, ''),
        trimmed.replace(/\s+/g, '-'),
      );
      const m = trimmed.match(/^(.+?)\s*#?(\d+)호?기?$/);
      if (m) {
        variants.push(`${m[1]} #${m[2]}`, `${m[1]}${m[2]}`, `${m[1]} ${m[2]}호기`);
      }
    }
    return [...new Set(variants)];
  }

  function parseIssueFields(text) {
    const field = (label) => {
      const m = text.match(new RegExp(`${label}\\s*[:\\：]\\s*([^\\n•●]+)`));
      return m ? m[1].trim() : null;
    };
    return {
      priority: field('우선순위'),
      urgency: field('긴급도'),
      severity: field('심각도'),
      site: field('사이트'),
      robot: field('로봇 호기'),
      issue: field('이슈 현상') || field('현상') || field('이슈현상'),
      action: field('초동 조치'),
      date: field('날짜'),
    };
  }

  function isBot(msg) {
    return BOT_NAMES.some(n =>
      (msg.username || '').includes(n) ||
      (msg.bot_profile?.name || '').includes(n)
    );
  }

  function isReply(msg) {
    return !!msg.thread_ts && msg.thread_ts !== msg.ts;
  }

  async function search(queries, msgType) {
    const seen = new Set();
    const results = [];

    await Promise.all(queries.map(async (q) => {
      try {
        const data = await slackAPI('search.messages', {
          query: q,
          count: 50,
          sort: 'timestamp',
          sort_dir: 'desc',
        });
        const msgs = data.messages?.matches || [];
        msgs.forEach(msg => {
          if (seen.has(msg.ts)) return;
          seen.add(msg.ts);

          const reply = isReply(msg);
          if (msgType === 'post' && reply) return;
          if (msgType === 'reply' && !reply) return;

          const bot = isBot(msg);
          const fields = bot ? parseIssueFields(msg.text || '') : null;
          results.push({ msg, reply, bot, fields });
        });
      } catch (e) {
        console.warn('[SlackSearch] 쿼리 실패:', q, e.message);
      }
    }));

    results.sort((a, b) => parseFloat(b.msg.ts) - parseFloat(a.msg.ts));
    return results;
  }

  function formatTs(ts) {
    if (!ts) return '';
    const d = new Date(parseFloat(ts) * 1000);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  function slackUrl(msg) {
    const wsUrl = location.origin;
    const ch = msg.channel?.id || msg.channel;
    return `${wsUrl}/archives/${ch}/p${msg.ts.replace('.', '')}`;
  }

  function badgeHtml(type, reply, bot) {
    const typeBadge = type === 'hw'
      ? `<span class="ss-badge ss-hw">HW</span>`
      : type === 'sw'
      ? `<span class="ss-badge ss-sw">SW</span>`
      : type === 'dispatch'
      ? `<span class="ss-badge ss-dp">배차</span>`
      : `<span class="ss-badge ss-gn">일반</span>`;
    const replyBadge = reply
      ? `<span class="ss-badge ss-reply">댓글</span>`
      : `<span class="ss-badge ss-post">원글</span>`;
    const botBadge = bot ? `<span class="ss-badge ss-bot">봇</span>` : '';
    return typeBadge + replyBadge + botBadge;
  }

  function highlight(text, keywords) {
    if (!keywords?.trim()) return text;
    const kws = keywords.trim().split(/\s+/);
    let result = text;
    kws.forEach(kw => {
      result = result.replace(
        new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
        m => `<mark class="ss-hl">${m}</mark>`
      );
    });
    return result;
  }

  function summaryHtml(results) {
    const total = results.length;
    const hw = results.filter(r => r.msg.channel?.name?.includes('hw') || CHANNELS.find(c=>c.id===r.msg.channel?.id)?.type==='hw').length;
    const sw = results.filter(r => r.msg.channel?.name?.includes('sw') || CHANNELS.find(c=>c.id===r.msg.channel?.id)?.type==='sw').length;
    const posts = results.filter(r => !r.reply).length;
    const replies = results.filter(r => r.reply).length;
    return `
      <div class="ss-summary">
        <div class="ss-sum-item"><span class="ss-sum-n">${total}</span><span class="ss-sum-l">전체</span></div>
        <div class="ss-sum-item"><span class="ss-sum-n ss-hw-c">${hw}</span><span class="ss-sum-l">HW</span></div>
        <div class="ss-sum-item"><span class="ss-sum-n ss-sw-c">${sw}</span><span class="ss-sum-l">SW</span></div>
        <div class="ss-sum-item"><span class="ss-sum-n">${posts}</span><span class="ss-sum-l">원글</span></div>
        <div class="ss-sum-item"><span class="ss-sum-n">${replies}</span><span class="ss-sum-l">댓글</span></div>
      </div>`;
  }

  function cardHtml(item, keywords) {
    const { msg, reply, bot, fields } = item;
    const ch = CHANNELS.find(c => c.id === (msg.channel?.id || msg.channel));
    const chName = ch?.name || msg.channel?.name || '알 수 없음';
    const chType = ch?.type || 'general';
    const text = (msg.text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const preview = highlight(text.slice(0, 200) + (text.length > 200 ? '...' : ''), keywords);
    const url = slackUrl(msg);
    const user = msg.username || msg.user || '';
    const ts = formatTs(msg.ts);

    let fieldsHtml = '';
    if (bot && fields && (fields.robot || fields.issue || fields.priority)) {
      fieldsHtml = `<div class="ss-fields">`;
      if (fields.robot) fieldsHtml += `<span class="ss-field"><i class="ss-fi">기체</i>${fields.robot}</span>`;
      if (fields.site) fieldsHtml += `<span class="ss-field"><i class="ss-fi">사이트</i>${fields.site}</span>`;
      if (fields.priority) fieldsHtml += `<span class="ss-field"><i class="ss-fi">우선순위</i>${fields.priority}</span>`;
      if (fields.issue) fieldsHtml += `<span class="ss-field ss-issue-field"><i class="ss-fi">이슈</i>${fields.issue}</span>`;
      fieldsHtml += `</div>`;
    }

    return `
      <div class="ss-card">
        <div class="ss-card-top">
          <span class="ss-ch"># ${chName}</span>
          ${badgeHtml(chType, reply, bot)}
          <span class="ss-ts">${ts}</span>
        </div>
        <div class="ss-card-user">${user}</div>
        <div class="ss-card-body">${preview}</div>
        ${fieldsHtml}
        <div class="ss-card-foot">
          <a class="ss-open" href="${url}" target="_blank">슬랙에서 열기 ↗</a>
        </div>
      </div>`;
  }

  function injectStyles() {
    if (document.getElementById('ss-styles')) return;
    const s = document.createElement('style');
    s.id = 'ss-styles';
    s.textContent = `
      #ss-root { position:fixed; top:0; left:0; width:100%; height:100%; z-index:99999; display:flex; font-family:'Lato',system-ui,sans-serif; font-size:13px; }
      #ss-sidebar { width:220px; background:#3f0e40; display:flex; flex-direction:column; flex-shrink:0; overflow-y:auto; }
      #ss-main { flex:1; display:flex; flex-direction:column; background:#fff; min-width:0; }
      .ss-sb-top { padding:14px 14px 10px; border-bottom:1px solid rgba(255,255,255,0.1); }
      .ss-ws-name { color:#fff; font-size:15px; font-weight:700; display:flex; align-items:center; gap:7px; }
      .ss-ws-dot { width:9px; height:9px; background:#2bac76; border-radius:50%; flex-shrink:0; }
      .ss-ws-sub { font-size:11px; color:#c9a7ca; margin-top:2px; padding-left:16px; }
      .ss-sb-sec { padding:6px 0; }
      .ss-sb-lbl { font-size:10px; font-weight:700; color:#c9a7ca; padding:6px 14px 3px; letter-spacing:.06em; text-transform:uppercase; }
      .ss-sb-item { padding:6px 14px; color:#d8b4d9; cursor:pointer; display:flex; align-items:center; gap:7px; font-size:13px; }
      .ss-sb-item:hover { background:rgba(255,255,255,0.1); color:#fff; }
      .ss-sb-divider { height:1px; background:rgba(255,255,255,0.1); margin:4px 0; }
      .ss-ch-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
      .ss-ch-dot.hw { background:#e07070; }
      .ss-ch-dot.sw { background:#7090e0; }
      .ss-ch-dot.dispatch { background:#70b870; }
      .ss-ch-dot.general { background:#b0a0b0; }

      #ss-topbar { padding:12px 16px 10px; border-bottom:1px solid #e8e8e8; background:#fff; }
      .ss-topbar-row { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
      .ss-title { font-size:17px; font-weight:700; color:#1d1c1d; flex:1; }
      .ss-connected { font-size:11px; background:#e8f5e9; color:#2e7d32; padding:3px 9px; border-radius:12px; font-weight:600; }
      .ss-fg { display:flex; flex-direction:column; gap:3px; }
      .ss-fl { font-size:10px; font-weight:700; color:#868686; letter-spacing:.05em; text-transform:uppercase; }
      .ss-fi-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:8px; }
      .ss-fi-row2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px; }
      .ss-input { height:30px; border:1px solid #e0e0e0; border-radius:5px; padding:0 8px; font-size:12px; color:#1d1c1d; outline:none; background:#fafafa; width:100%; }
      .ss-input:focus { border-color:#1164a3; background:#fff; }
      .ss-input::placeholder { color:#aaa; }
      select.ss-input { appearance:none; cursor:pointer; }
      .ss-chs { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px; }
      .ss-ch-tag { font-size:11px; padding:3px 8px; border-radius:4px; cursor:pointer; border:1px solid #e0e0e0; background:#fafafa; color:#555; user-select:none; }
      .ss-ch-tag.active { background:#e8f0fe; color:#1a56db; border-color:#1a56db; font-weight:600; }
      .ss-msgtype { display:flex; gap:6px; margin-bottom:10px; }
      .ss-type-btn { flex:1; height:28px; border:1px solid #e0e0e0; border-radius:5px; background:#fafafa; font-size:12px; color:#555; cursor:pointer; }
      .ss-type-btn.active { background:#e8f0fe; color:#1a56db; border-color:#1a56db; font-weight:700; }
      .ss-search-btn { width:100%; height:34px; background:#1164a3; border:none; border-radius:6px; color:#fff; font-size:13px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; }
      .ss-search-btn:hover { background:#0d5291; }
      .ss-search-btn:disabled { background:#aaa; cursor:not-allowed; }

      #ss-results { flex:1; overflow-y:auto; padding:10px 14px; background:#f8f8f8; }
      .ss-summary { display:flex; gap:10px; margin-bottom:12px; }
      .ss-sum-item { background:#fff; border:1px solid #e8e8e8; border-radius:8px; padding:8px 14px; display:flex; flex-direction:column; align-items:center; gap:2px; min-width:52px; }
      .ss-sum-n { font-size:18px; font-weight:700; color:#1d1c1d; }
      .ss-sum-l { font-size:10px; color:#868686; text-transform:uppercase; letter-spacing:.04em; }
      .ss-hw-c { color:#c0392b; }
      .ss-sw-c { color:#1a56db; }

      .ss-card { background:#fff; border:1px solid #e8e8e8; border-radius:8px; padding:11px 14px; margin-bottom:7px; cursor:pointer; transition:border-color .15s; }
      .ss-card:hover { border-color:#1164a3; }
      .ss-card-top { display:flex; align-items:center; gap:6px; margin-bottom:5px; flex-wrap:wrap; }
      .ss-ch { font-size:11px; font-weight:700; color:#1164a3; }
      .ss-ts { font-size:11px; color:#aaa; margin-left:auto; }
      .ss-badge { font-size:10px; padding:2px 6px; border-radius:3px; font-weight:700; }
      .ss-hw { background:#fce8e8; color:#c0392b; }
      .ss-sw { background:#e8f0fe; color:#1a56db; }
      .ss-dp { background:#e8f5e9; color:#2e7d32; }
      .ss-gn { background:#f5f5f5; color:#868686; }
      .ss-post { background:#fff3e0; color:#e65100; }
      .ss-reply { background:#f3e5f5; color:#6a1b9a; }
      .ss-bot { background:#e0f2f1; color:#00695c; }
      .ss-card-user { font-size:11px; color:#868686; margin-bottom:4px; }
      .ss-card-body { font-size:12px; color:#444; line-height:1.55; margin-bottom:6px; }
      .ss-hl { background:#fff3b0; color:#b45309; font-weight:700; border-radius:2px; padding:0 2px; }
      .ss-fields { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:6px; }
      .ss-field { font-size:11px; background:#f5f5f5; border-radius:4px; padding:3px 8px; color:#444; display:flex; align-items:center; gap:4px; }
      .ss-issue-field { background:#fce8e8; color:#7b1a1a; }
      .ss-fi { font-style:normal; font-size:10px; color:#999; font-weight:700; }
      .ss-card-foot { display:flex; align-items:center; padding-top:7px; border-top:1px solid #f0f0f0; }
      .ss-open { font-size:11px; color:#1164a3; text-decoration:none; font-weight:600; margin-left:auto; }
      .ss-open:hover { text-decoration:underline; }
      .ss-empty { text-align:center; padding:40px 20px; color:#868686; font-size:13px; }
      .ss-loading { text-align:center; padding:30px; color:#868686; }
      .ss-error { background:#fce8e8; color:#c0392b; border-radius:6px; padding:10px 14px; margin-bottom:10px; font-size:12px; }
    `;
    document.head.appendChild(s);
  }

  function buildUI() {
    if (document.getElementById('ss-root')) return;
    injectStyles();

    const root = document.createElement('div');
    root.id = 'ss-root';

    const chTagsHtml = CHANNELS.map(c =>
      `<div class="ss-ch-tag active" data-ch="${c.id}"># ${c.name}</div>`
    ).join('');

    root.innerHTML = `
      <div id="ss-sidebar">
        <div class="ss-sb-top">
          <div class="ss-ws-name"><div class="ss-ws-dot"></div>Neubility</div>
          <div class="ss-ws-sub">기체 이슈 검색기</div>
        </div>
        <div class="ss-sb-sec">
          <div class="ss-sb-lbl">채널 유형</div>
          ${CHANNELS.map(c => `
            <div class="ss-sb-item">
              <div class="ss-ch-dot ${c.type}"></div>${c.name}
            </div>`).join('')}
        </div>
        <div class="ss-sb-divider"></div>
        <div class="ss-sb-sec">
          <div class="ss-sb-lbl">범례</div>
          <div class="ss-sb-item"><span class="ss-badge ss-hw">HW</span> 하드웨어 이슈</div>
          <div class="ss-sb-item"><span class="ss-badge ss-sw">SW</span> 소프트웨어 이슈</div>
          <div class="ss-sb-item"><span class="ss-badge ss-post">원글</span> 최초 게시글</div>
          <div class="ss-sb-item"><span class="ss-badge ss-reply">댓글</span> 스레드 답글</div>
          <div class="ss-sb-item"><span class="ss-badge ss-bot">봇</span> 뉴비슈 자동 게시</div>
        </div>
      </div>
      <div id="ss-main">
        <div id="ss-topbar">
          <div class="ss-topbar-row">
            <div class="ss-title">기체 이슈 검색</div>
            <div class="ss-connected" id="ss-token-status">토큰 확인 중...</div>
          </div>
          <div class="ss-fi-row">
            <div class="ss-fg">
              <div class="ss-fl">기체명 / 호기</div>
              <input class="ss-input" id="ss-robot" placeholder="예: 리센츠 #126">
            </div>
            <div class="ss-fg">
              <div class="ss-fl">시작일</div>
              <input class="ss-input" id="ss-from" placeholder="2024-01-01">
            </div>
            <div class="ss-fg">
              <div class="ss-fl">종료일</div>
              <input class="ss-input" id="ss-to" placeholder="오늘">
            </div>
          </div>
          <div class="ss-fg" style="margin-bottom:8px">
            <div class="ss-fl">추가 키워드</div>
            <input class="ss-input" id="ss-kw" placeholder="카메라, 배터리, 충전 불가...">
          </div>
          <div class="ss-fg" style="margin-bottom:8px">
            <div class="ss-fl">검색 채널 선택</div>
            <div class="ss-chs">${chTagsHtml}</div>
          </div>
          <div class="ss-fg" style="margin-bottom:10px">
            <div class="ss-fl">메시지 유형</div>
            <div class="ss-msgtype">
              <button class="ss-type-btn active" data-type="all">전체</button>
              <button class="ss-type-btn" data-type="post">원글만</button>
              <button class="ss-type-btn" data-type="reply">댓글만</button>
            </div>
          </div>
          <button class="ss-search-btn" id="ss-btn">검색하기</button>
        </div>
        <div id="ss-results"><div class="ss-empty">조건을 설정하고 검색하세요.</div></div>
      </div>
    `;
    document.body.appendChild(root);

    document.querySelectorAll('.ss-ch-tag').forEach(tag => {
      tag.addEventListener('click', () => tag.classList.toggle('active'));
    });

    document.querySelectorAll('.ss-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ss-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.getElementById('ss-btn').addEventListener('click', runSearch);

    document.getElementById('ss-root').addEventListener('keydown', e => {
      if (e.key === 'Enter') runSearch();
    });

    checkToken();
  }

  function checkToken() {
    const el = document.getElementById('ss-token-status');
    if (!el) return;
    const t = getToken();
    if (t) {
      el.textContent = '슬랙 연결됨';
      el.style.background = '#e8f5e9';
      el.style.color = '#2e7d32';
    } else {
      el.textContent = '토큰 없음 — 새로고침';
      el.style.background = '#fce8e8';
      el.style.color = '#c0392b';
    }
  }

  async function runSearch() {
    const robot = document.getElementById('ss-robot').value.trim();
    const dateFrom = document.getElementById('ss-from').value.trim();
    const dateTo = document.getElementById('ss-to').value.trim();
    const keywords = document.getElementById('ss-kw').value.trim();
    const msgType = document.querySelector('.ss-type-btn.active')?.dataset.type || 'all';
    const selectedChs = [...document.querySelectorAll('.ss-ch-tag.active')].map(t => t.dataset.ch);

    const resultsEl = document.getElementById('ss-results');
    const btn = document.getElementById('ss-btn');

    if (!selectedChs.length) {
      resultsEl.innerHTML = '<div class="ss-error">채널을 하나 이상 선택하세요.</div>';
      return;
    }

    btn.disabled = true;
    btn.textContent = '검색 중...';
    resultsEl.innerHTML = '<div class="ss-loading">검색 중입니다...</div>';

    try {
      const queries = buildQueries(robot, keywords, dateFrom, dateTo, selectedChs, msgType);
      const results = await search(queries, msgType);

      if (!results.length) {
        resultsEl.innerHTML = '<div class="ss-empty">결과가 없습니다. 조건을 바꿔보세요.</div>';
        return;
      }

      resultsEl.innerHTML =
        summaryHtml(results) +
        results.map(r => cardHtml(r, keywords)).join('');
    } catch (e) {
      resultsEl.innerHTML = `<div class="ss-error">오류: ${e.message}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = '검색하기';
    }
  }

  function init() {
    if (!location.href.includes('app.slack.com')) return;
    const tryBuild = () => {
      if (document.body) {
        buildUI();
      } else {
        setTimeout(tryBuild, 500);
      }
    };
    tryBuild();
  }

  init();
})();
