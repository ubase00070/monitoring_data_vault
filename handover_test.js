(function () {
    'use strict';

    if (window.__handoverLoaded) return;
    window.__handoverLoaded = true;

    const currUrl = window.location.href;
    const isMonitoringPage = currUrl.includes('go.neubie.ai/ko/remote/multiple/monitoring')
        || currUrl.includes('multimonitoring.vercel.app');

    if (!isMonitoringPage) return;

    /* ============================================================
        SECTION 1. 상수 및 유틸
    ============================================================ */
    const HANDOVER_RAW_URL = 'https://raw.githubusercontent.com/ubase00070/monitoring_handover/main/handover.json';
    const GITHUB_TOKEN = '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'; // handover.json 전용 Fine-grained Token
    const GITHUB_API_URL = 'https://api.github.com/repos/ubase00070/monitoring_handover/contents/handover.json';

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    /* ============================================================
        SECTION 2. 빼꼼 탭 + 패널 UI 생성
    ============================================================ */

    // 빼꼼 탭 (상단 고정)
    const peekTab = document.createElement('div');
    peekTab.id = 'ho-peek-tab';
    peekTab.innerHTML = '📋 인계';
    Object.assign(peekTab.style, {
        position: 'fixed',
        top: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '2147483647',
        background: 'rgba(240, 242, 248, 0.95)',
        color: '#1a1f2e',
        padding: '4px 22px',
        borderRadius: '0 0 10px 10px',
        fontSize: '12px',
        fontWeight: '700',
        fontFamily: 'Pretendard, sans-serif',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
        letterSpacing: '0.04em',
        userSelect: 'none',
        transition: 'background 0.15s',
        border: '1px solid rgba(255,255,255,0.3)',
        borderTop: 'none',
    });

    // 메인 패널
    const panel = document.createElement('div');
    panel.id = 'ho-panel';
    Object.assign(panel.style, {
        position: 'fixed',
        top: '-260px', // 숨겨진 상태
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '2147483646',
        width: '720px',
        background: 'rgba(232, 236, 245, 0.97)',
        borderRadius: '0 0 18px 18px',
        padding: '14px 18px 16px',
        fontFamily: 'Pretendard, sans-serif',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        border: '1px solid rgba(255,255,255,0.4)',
        borderTop: 'none',
        transition: 'top 0.3s cubic-bezier(0.4,0,0.2,1)',
        userSelect: 'none',
    });

    panel.innerHTML = `
        <div id="ho-panel-header" style="
            display:flex; justify-content:space-between; align-items:center;
            margin-bottom:12px; padding-bottom:10px;
            border-bottom:1px solid rgba(0,0,0,0.1);
        ">
            <span style="font-size:13px; font-weight:700; color:#1a1f2e; letter-spacing:0.03em;">
                📋 인계 기체 현황
            </span>
            <div style="display:flex; gap:8px; align-items:center;">
                <span id="ho-status-text" style="font-size:11px; color:#64748b;"></span>
                <button id="ho-fetch-btn" style="
                    background:#3b82f6; color:#fff; border:none;
                    padding:5px 14px; border-radius:8px; font-size:12px;
                    font-weight:600; cursor:pointer; font-family:Pretendard,sans-serif;
                    transition:background 0.15s;
                ">📥 인계 받기</button>
                <button id="ho-upload-btn" style="
                    background:#f59e0b; color:#fff; border:none;
                    padding:5px 14px; border-radius:8px; font-size:12px;
                    font-weight:600; cursor:pointer; font-family:Pretendard,sans-serif;
                    transition:background 0.15s;
                ">📤 인계 완료</button>
            </div>
        </div>

        <!-- 6×2 그리드: 좌(본인탭) + 우(멀티탭) -->
        <div style="display:flex; gap:12px;">

            <!-- 본인 탭 (3×2) -->
            <div style="flex:1;">
                <div style="
                    font-size:10px; font-weight:700; color:#64748b;
                    letter-spacing:0.06em; margin-bottom:6px; text-align:center;
                ">본인 계정</div>
                <div id="ho-grid-tab1" style="
                    display:grid; grid-template-columns:repeat(3,1fr); gap:6px;
                ">
                    ${Array(6).fill(0).map((_, i) => `
                        <button class="ho-cell" data-tab="1" data-idx="${i}" style="
                            height:52px; border-radius:10px;
                            border:1.5px dashed #c0c8d8;
                            background:rgba(255,255,255,0.5);
                            color:#94a3b8; font-size:11px;
                            font-family:Pretendard,sans-serif;
                            cursor:default; transition:all 0.15s;
                            display:flex; align-items:center; justify-content:center;
                            text-align:center; line-height:1.3; padding:4px;
                        ">-</button>
                    `).join('')}
                </div>
            </div>

            <!-- 구분선 -->
            <div style="
                width:1px; background:rgba(0,0,0,0.12);
                margin:0 2px; border-radius:1px;
            "></div>

            <!-- 멀티 탭 (3×2) -->
            <div style="flex:1;">
                <div style="
                    font-size:10px; font-weight:700; color:#64748b;
                    letter-spacing:0.06em; margin-bottom:6px; text-align:center;
                ">멀티 계정</div>
                <div id="ho-grid-tab2" style="
                    display:grid; grid-template-columns:repeat(3,1fr); gap:6px;
                ">
                    ${Array(6).fill(0).map((_, i) => `
                        <button class="ho-cell" data-tab="2" data-idx="${i}" style="
                            height:52px; border-radius:10px;
                            border:1.5px dashed #c0c8d8;
                            background:rgba(255,255,255,0.5);
                            color:#94a3b8; font-size:11px;
                            font-family:Pretendard,sans-serif;
                            cursor:default; transition:all 0.15s;
                            display:flex; align-items:center; justify-content:center;
                            text-align:center; line-height:1.3; padding:4px;
                        ">-</button>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- 하단 안내 -->
        <div style="
            margin-top:10px; font-size:10px; color:#94a3b8;
            text-align:center; letter-spacing:0.02em;
        ">
            기체 버튼을 누르면 순서대로 뉴비고에 자동 추가됩니다 &nbsp;|&nbsp; <kbd style="
                background:#e2e8f0; border:1px solid #cbd5e1;
                border-radius:4px; padding:1px 5px; font-size:10px; color:#475569;
            ">Alt+M</kbd> 단축키
        </div>
    `;

    document.body.appendChild(peekTab);
    document.body.appendChild(panel);

    /* ============================================================
        SECTION 3. 열기/닫기 토글
    ============================================================ */
    let isPanelOpen = false;

    function openPanel() {
        isPanelOpen = true;
        panel.style.top = '0px';
        peekTab.style.opacity = '0';
        peekTab.style.pointerEvents = 'none';
    }

    function closePanel() {
        isPanelOpen = false;
        panel.style.top = '-260px';
        peekTab.style.opacity = '1';
        peekTab.style.pointerEvents = 'auto';
    }

    peekTab.addEventListener('click', openPanel);

    // 패널 바깥 클릭 시 닫기
    document.addEventListener('mousedown', (e) => {
        if (isPanelOpen && !panel.contains(e.target) && e.target !== peekTab) {
            closePanel();
        }
    });

    // Alt+M 단축키
    document.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'm' || e.key === 'M' || e.key === 'ㅡ')) {
            e.preventDefault();
            isPanelOpen ? closePanel() : openPanel();
        }
    });

    /* ============================================================
        SECTION 4. 그리드 렌더링
    ============================================================ */
    function setStatus(msg, color = '#64748b') {
        const el = document.getElementById('ho-status-text');
        if (el) { el.textContent = msg; el.style.color = color; }
    }

    function renderGrid(tab1Units = [], tab2Units = []) {
        ['tab1', 'tab2'].forEach((tab, tabIdx) => {
            const units = tabIdx === 0 ? tab1Units : tab2Units;
            const grid = document.getElementById(`ho-grid-${tab}`);
            if (!grid) return;

            const cells = grid.querySelectorAll('.ho-cell');
            cells.forEach((cell, i) => {
                const name = units[i] || null;
                if (name) {
                    cell.textContent = name;
                    cell.style.background = 'rgba(255,255,255,0.85)';
                    cell.style.color = '#1e293b';
                    cell.style.border = '1.5px solid #93c5fd';
                    cell.style.cursor = 'pointer';
                    cell.style.fontWeight = '600';
                    cell.dataset.unit = name;
                    cell.dataset.done = 'false';
                } else {
                    cell.textContent = '-';
                    cell.style.background = 'rgba(255,255,255,0.5)';
                    cell.style.color = '#94a3b8';
                    cell.style.border = '1.5px dashed #c0c8d8';
                    cell.style.cursor = 'default';
                    cell.style.fontWeight = '400';
                    cell.dataset.unit = '';
                    cell.dataset.done = 'false';
                }
            });
        });
    }

    // 버튼 클릭 → 자동 선택 (내일 구현)
    document.addEventListener('click', async (e) => {
        const cell = e.target.closest('.ho-cell');
        if (!cell || !cell.dataset.unit) return;
        if (cell.dataset.done === 'true') return;

        // 임시: 클릭 확인용 토글 (내일 실제 자동화로 교체)
        cell.style.background = 'rgba(134,239,172,0.4)';
        cell.style.border = '1.5px solid #4ade80';
        cell.style.color = '#15803d';
        cell.dataset.done = 'true';
        setStatus(`✅ ${cell.dataset.unit} 선택됨`, '#15803d');
    });

    /* ============================================================
        SECTION 5. 인계 받기 (fetch) — 내일 본격 구현
    ============================================================ */
    document.getElementById('ho-fetch-btn').addEventListener('click', async () => {
        setStatus('⏳ 불러오는 중...', '#3b82f6');
        try {
            // 내일: GitHub API로 캐시 없이 fetch
            // 지금: raw URL로 테스트
            const res = await fetch(HANDOVER_RAW_URL + '?t=' + Date.now());
            if (!res.ok) throw new Error('fetch 실패');
            const data = await res.json();

            const tab1 = data.tab1 || data.units || [];
            const tab2 = data.tab2 || [];

            renderGrid(tab1, tab2);
            setStatus(`📋 ${tab1.length + tab2.length}대 불러옴 (${data.handover_by || '?'})`, '#3b82f6');
        } catch (e) {
            setStatus('❌ 불러오기 실패', '#ef4444');
        }
    });

    /* ============================================================
        SECTION 6. 인계 완료 (업로드) — 내일 본격 구현
    ============================================================ */
    document.getElementById('ho-upload-btn').addEventListener('click', async () => {
        setStatus('⏳ 업로드 중...', '#f59e0b');

        // 내일: 실제 기체 목록 추출 + 권한 검증 + GitHub API push
        // 지금: 더미 데이터로 구조 테스트
        const dummyData = {
            updatedAt: new Date().toISOString(),
            handover_by: '테스트',
            tab1: ['테스트 1호기', '테스트 2호기'],
            tab2: []
        };
        renderGrid(dummyData.tab1, dummyData.tab2);
        setStatus('✅ 업로드 완료 (테스트)', '#22c55e');
    });

    /* ============================================================
        SECTION 7. URL 변경 감지 (SPA 대응)
    ============================================================ */
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            const isTarget = location.href.includes('/ko/remote/multiple/monitoring')
                || location.href.includes('multimonitoring.vercel.app');
            peekTab.style.display = isTarget ? 'block' : 'none';
            if (!isTarget) closePanel();
        }
    }).observe(document.body, { subtree: true, childList: true });

})();
