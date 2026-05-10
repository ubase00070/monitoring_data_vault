// ==UserScript==
// @name         🛰️ 뉴비 통합 관제 엔진 (v16.1)
// @namespace    http://tampermonkey.net/
// @version      16.1
// @author       ubase00070
// @match        https://go.neubie.ai/*
// @match        https://github.com/*
// @match        https://gemini.google.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // [0] 중복 실행 방지 플래그
    if (window.neubieEngineLoaded) return;
    window.neubieEngineLoaded = true;

    const currUrl = window.location.href;
    console.log("🛰️ 뉴비 통합 엔진 v16.7 로드 완료 (보안 대응 패치)");

    /* ============================================================
       SECTION 1. 상태 및 설정
       ============================================================ */
    const config = {
        targetIds: ['44', '56', '65', '109'],
        batteryIds: [
            { id: '142', name: '성남판교 200', shortName: '판교 200' },
            { id: '145', name: '성남서현 201', shortName: '서현 201' },
            { id: '144', name: '성남율동 202', shortName: '율동 202' },
            { id: '155', name: '성남야탑 203', shortName: '야탑 203' }
        ]
    };

    const isAutoTarget = config.targetIds.some(id => currUrl.includes(`/monitoring/${id}`));
    const state = {
        isMapOpt: localStorage.getItem('neubie_opt_map') === 'true' || isAutoTarget,
        isQueueOpt: localStorage.getItem('neubie_opt_queue') === 'true', // 줄을 서시오 상태 저장
        lastBatteryData: []
    };

    const QUEUE_CONFIG = {
        SLOTS: [0, 350, 700, 1050, 1400], 
        JITTER: 100, 
        MIN_OVERLAY_SHOW: 500,
        STYLE: {
            position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'rgba(15, 23, 42, 0.98)', color: 'white', border: '3px solid #ffeb3b',
            padding: '25px 50px', borderRadius: '15px', zIndex: '2147483647', textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)', fontWeight: 'bold', pointerEvents: 'none',
            fontFamily: 'Pretendard, sans-serif'
        }
    };

    /* ============================================================
       SECTION 2. UI 컨테이너 생성 및 관리
       ============================================================ */
    function createContainer(id, width, top, left, right = 'auto') {
        const el = document.createElement('div');
        el.id = id;
        Object.assign(el.style, {
            position: 'fixed', top: top, left: left, right: right,
            width: width, backgroundColor: 'rgba(15, 15, 15, 0.98)', color: '#fff',
            borderRadius: '24px', padding: '20px', zIndex: '1000000',
            fontFamily: 'Pretendard, sans-serif', boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            border: '1px solid #333', display: 'none', transform: left === '50%' ? 'translate(-50%, -50%)' : 'none'
        });
        return el;
    }

    const dashboard = createContainer('neubie-dashboard', '420px', '50%', '50%');
    const batteryPopup = createContainer('neubie-battery-popup', '340px', '20px', 'auto', '20px');

    // [안전장치] Body가 없을 경우 대기 후 삽입
    const injectUI = () => { if (document.body) document.body.append(dashboard, batteryPopup); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectUI);
    else injectUI();

    /* ============================================================
       SECTION 3. 성남 배터리 및 맵 최적화 로직 (기존 무결성 유지)
       ============================================================ */
    const iframes = {};
    if (currUrl.includes('/remote/multiple/driving')) {
        config.batteryIds.forEach(c => {
            const ifr = document.createElement('iframe');
            ifr.src = `https://go.neubie.ai/ko/monitoring/${c.id}`;
            Object.assign(ifr.style, { width: '0', height: '0', border: 'none', display: 'none' });
            document.body.appendChild(ifr);
            iframes[c.id] = ifr;
        });
    }

    function updateBatteryStatus() {
        batteryPopup.innerHTML = '';
        const header = document.createElement('div');
        header.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;";
        
        const titleB = document.createElement('b');
        titleB.textContent = "🛰️ 성남 배터리";
        titleB.style.cssText = "color:#eee; font-size:18px;";
        
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 복사';
        Object.assign(copyBtn.style, { background:'#3b82f6', color:'white', border:'none', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold' });
        copyBtn.onclick = copyToClipboard;
        
        header.append(titleB, copyBtn);
        batteryPopup.appendChild(header);

        state.lastBatteryData = [];
        config.batteryIds.forEach(c => {
            let batteryVal = "- %", statusText = "OFF", accentColor = "#666", statusIcon = "⚪";
            try {
                const doc = iframes[c.id]?.contentDocument || iframes[c.id]?.contentWindow.document;
                const card = doc?.querySelector('li[data-qk="robot-card"]');
                if (card) {
                    const cardText = card.innerText;
                    const batteryMatch = cardText.match(/(\d+)%/);
                    const isCharging = card.querySelector('svg[class*="text-tertiary-300"]') || cardText.includes('배터리');
                    const isPatrolling = cardText.includes('순회');

                    if (batteryMatch) {
                        batteryVal = batteryMatch[0];
                        if (isPatrolling) { accentColor = "#3b82f6"; statusIcon = "🔵"; statusText = "순회 중"; }
                        else if (isCharging) { accentColor = "#22c55e"; statusIcon = "🟢"; statusText = "충전 중"; }
                        else { accentColor = "#888888"; statusIcon = "⚪"; statusText = "대기 중"; }
                    }
                }
            } catch (e) {}

            state.lastBatteryData.push({ shortName: c.shortName, battery: batteryVal, statusText: statusText });
            const item = document.createElement('div');
            item.style.cssText = `display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:12px 16px; border-radius:12px; margin-bottom:8px; border-left:5px solid ${accentColor};`;
            
            const leftSpan = document.createElement('span'); leftSpan.textContent = `${statusIcon} ${c.name}`;
            const rightSpan = document.createElement('span'); 
            rightSpan.textContent = batteryVal;
            rightSpan.style.cssText = `font-weight:bold; color:${accentColor};`;
            
            item.append(leftSpan, rightSpan);
            batteryPopup.appendChild(item);
        });
    }

    function copyToClipboard() {
        const now = new Date();
        let hour = now.getHours();
        if (now.getMinutes() >= 50) hour = (hour + 1) % 24;
        let copyText = `[${hour}시 성남 기체 배터리 현황]\n`;
        state.lastBatteryData.forEach(item => { copyText += `• ${item.shortName}: ${item.battery} (${item.statusText})\n`; });
        navigator.clipboard.writeText(copyText).then(() => alert("복사 완료!"));
    }

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        if (state.isMapOpt && url && (url.includes('nodes?') || url.includes('sites?') || url.includes('paths?'))) {
            return new Response(JSON.stringify({ data: [], items: [], total: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return originalFetch(...args);
    };

    function injectMapStyle() {
        let style = document.getElementById('neubie-opt-style') || document.createElement('style');
        style.id = 'neubie-opt-style';
        style.textContent = state.isMapOpt ? `
            [data-qk^="node-marker"] { display: none !important; }
            gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) { display: block !important; visibility: visible !important; z-index: 500 !important; }
            gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) svg { transform: rotate(180deg) !important; }
            gmp-advanced-marker:has([data-qk*="robot"]), div[class*="MiniMap"] gmp-advanced-marker { display: block !important; visibility: visible !important; z-index: 1000 !important; }
        ` : "";
        if (!style.parentElement) document.head.appendChild(style);
    }

    /* ============================================================
       SECTION 4. 대시보드 및 토글 UI (줄을 서시오 통합)
       ============================================================ */
    function renderDashboard() {
        dashboard.innerHTML = '';
        const title = document.createElement('h2');
        title.textContent = "🛰️ Neubie Helper Panel";
        title.style.cssText = "color:#3b82f6; margin-bottom:20px; font-size:20px;";
        dashboard.appendChild(title);

        const list = document.createElement('div');
        list.style.display = "grid"; list.style.gap = "12px";

        // 1. 지도 최적화 토글
        list.appendChild(createMenuCard("🗺️ 지도 최적화", "노드 제거 및 마커 회전", 'isMapOpt', 'neubie_opt_map', () => injectMapStyle()));
        
        // 2. 줄을 서시오 토글 (신규 추가)
        list.appendChild(createMenuCard("📡 줄을 서시오", "중복 개입 방지 (Gemini/GitHub)", 'isQueueOpt', 'neubie_opt_queue'));

        // 3. 배터리 팝업 버튼
        list.appendChild(createMenuCard("🔋 성남 배터리", "배터리 실시간 현황", null, null, () => {
            toggleBattery(); dashboard.style.display = 'none';
        }));

        dashboard.appendChild(list);
    }

    function createMenuCard(name, desc, stateKey, storageKey, action) {
        const card = document.createElement('div');
        card.style.cssText = "background:#252525; padding:15px; border-radius:15px; display:flex; justify-content:space-between; align-items:center; border:1px solid #333;";
        
        const info = document.createElement('div');
        info.style.flex = "1";
        info.innerHTML = `<div style="font-weight:bold; font-size:15px;">${name}</div><div style="font-size:12px; color:#aaa;">${desc}</div>`;
        card.appendChild(info);

        if (stateKey) {
            const chk = document.createElement('input');
            chk.type = 'checkbox'; chk.checked = state[stateKey];
            chk.style.cssText = "width:18px; height:18px; cursor:pointer;";
            chk.onchange = (e) => {
                state[stateKey] = e.target.checked;
                localStorage.setItem(storageKey, state[stateKey]);
                if (action) action();
            };
            card.appendChild(chk);
        } else {
            const btn = document.createElement('button');
            btn.textContent = '열기';
            btn.style.cssText = "background:#3b82f6; color:white; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:bold;";
            btn.onclick = action;
            card.appendChild(btn);
        }
        return card;
    }

    function toggleBattery() {
        if (batteryPopup.style.display === 'none') {
            updateBatteryStatus();
            batteryPopup.style.display = 'block';
        } else {
            batteryPopup.style.display = 'none';
        }
    }

    /* ============================================================
       SECTION 5. 줄을 서시오 로직 (보안 및 텍스트 대응)
       ============================================================ */
    function handleConcurrencyControl(e) {
        if (!state.isQueueOpt) return;

        const btn = e.target.closest('button') || e.target.closest('a') || e.target.closest('span.ng-star-inserted') || e.target.closest('div.model-selector');
        if (!btn || btn.dataset.intercepted) return;

        const btnText = btn.innerText.trim();
        // GitHub 테스트용 'Contributors' 및 제미나이 키워드 포함
        const isTarget = btnText.includes("Contributors") || btnText.includes("빠른모델") || btnText.includes("Flash") || btnText.includes("개입시작");

        if (isTarget) {
            e.preventDefault();
            e.stopPropagation();

            const base = QUEUE_CONFIG.SLOTS[Math.floor(Math.random() * QUEUE_CONFIG.SLOTS.length)];
            const jitter = Math.floor(Math.random() * (QUEUE_CONFIG.JITTER * 2 + 1)) - QUEUE_CONFIG.JITTER;
            const finalDelay = Math.max(0, base + jitter);

            // [보안 대응] textContent 기반 오버레이 생성
            const overlay = document.createElement('div');
            Object.assign(overlay.style, QUEUE_CONFIG.STYLE);
            
            const t1 = document.createElement('div'); t1.textContent = "📡 중복 관제 완화 시스템"; t1.style.fontSize = "20px"; t1.style.marginBottom = "8px";
            const t2 = document.createElement('div'); t2.textContent = `딜레이 적용 중... (${(finalDelay/1000).toFixed(2)}s)`; t2.style.color = "#ffeb3b";
            
            overlay.append(t1, t2);
            (document.body || document.documentElement).appendChild(overlay);

            setTimeout(() => {
                btn.dataset.intercepted = 'true';
                btn.click();
                btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

                setTimeout(() => {
                    overlay.remove();
                    delete btn.dataset.intercepted;
                }, QUEUE_CONFIG.MIN_OVERLAY_SHOW);
            }, finalDelay);
        }
    }

    /* ============================================================
       SECTION 6. 이벤트 바인딩 및 초기화
       ============================================================ */
    window.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === '/' || e.code === 'Slash')) {
            e.preventDefault();
            if (dashboard.style.display === 'none') { renderDashboard(); dashboard.style.display = 'block'; }
            else { dashboard.style.display = 'none'; }
        }
        if (e.altKey && e.code === 'KeyB') { e.preventDefault(); toggleBattery(); }
    });

    document.addEventListener('click', handleConcurrencyControl, true);
    injectMapStyle();
    setInterval(() => { if (batteryPopup.style.display === 'block') updateBatteryStatus(); }, 10000);

})();
