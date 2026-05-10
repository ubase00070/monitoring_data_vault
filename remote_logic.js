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

    const currUrl = window.location.href;
    console.log("🛰️ 뉴비 통합 엔진 v16.0 기준점 로드 완료");

    // 1. 상태 및 설정
    const config = {
        targetIds: ['44', '56', '65', '109'], // 자동 최적화 대상
        batteryIds: [
            { id: '142', name: '성남판교 200', shortName: '판교 200' },
            { id: '145', name: '성남서현 201', shortName: '서현 201' },
            { id: '144', name: '성남율동 202', shortName: '율동 202' },
            { id: '155', name: '성남야탑 203', shortName: '야탑 203' }
        ]
    };

    const isAutoTarget = config.targetIds.some(id => currUrl.includes(`/monitoring/${id}`));
    const state = {
        // 자동 대상 페이지거나, 이전에 수동으로 켰던 경우 활성화
        isMapOpt: localStorage.getItem('neubie_opt_map') === 'true' || isAutoTarget,
        lastBatteryData: []
    };

    // 2. UI 컨테이너 생성 (보안 대응)
    const dashboard = createContainer('neubie-dashboard', '420px', '50%', '50%');
    const batteryPopup = createContainer('neubie-battery-popup', '340px', '20px', 'auto', '20px');
    document.body.append(dashboard, batteryPopup);

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

    // 3. 성남 배터리 iframe 로직 (v13.5 로직 계승)
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

    // 4. 배터리 업데이트 & 복사 (v13.5 레이아웃 + v15 UI)
    function updateBatteryStatus() {
        batteryPopup.innerHTML = '';
        const header = document.createElement('div');
        header.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;";
        header.innerHTML = `<b style="color:#eee; font-size:18px;">🛰️ 성남 배터리</b>`;
        
        const copyBtn = document.createElement('button');
        copyBtn.innerText = '📋 복사';
        Object.assign(copyBtn.style, { background:'#3b82f6', color:'white', border:'none', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold' });
        copyBtn.onclick = copyToClipboard;
        header.append(copyBtn);
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
            } catch (e) { /* 타 도메인 테스트 시 예외 처리 */ }

            state.lastBatteryData.push({ shortName: c.shortName, battery: batteryVal, statusText: statusText });
            const item = document.createElement('div');
            item.style.cssText = `display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:12px 16px; border-radius:12px; margin-bottom:8px; border-left:5px solid ${accentColor};`;
            item.innerHTML = `<span>${statusIcon} ${c.name}</span><span style="font-weight:bold; color:${accentColor};">${batteryVal}</span>`;
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

    // 5. 맵 최적화 로직 (v13.5 로직 완전 이식)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        if (state.isMapOpt && url && (url.includes('nodes?') || url.includes('sites?') || url.includes('paths?'))) {
            return new Response(JSON.stringify({ data: [], items: [], total: 0 }), {
                status: 200, headers: { 'Content-Type': 'application/json' }
            });
        }
        return originalFetch(...args);
    };

    function injectMapStyle() {
        let style = document.getElementById('neubie-opt-style');
        if (!style) {
            style = document.createElement('style');
            style.id = 'neubie-opt-style';
            document.head.appendChild(style);
        }
        // v13.5의 svg 회전 로직 포함
        style.textContent = state.isMapOpt ? `
            [data-qk^="node-marker"] { display: none !important; }
            gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) { display: block !important; visibility: visible !important; z-index: 500 !important; }
            gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) svg { transform: rotate(180deg) !important; }
            gmp-advanced-marker:has([data-qk*="robot"]), div[class*="MiniMap"] gmp-advanced-marker { display: block !important; visibility: visible !important; z-index: 1000 !important; }
        ` : "";
    }

    // 6. 대시보드 UI
    function renderDashboard() {
        dashboard.innerHTML = '';
        const title = document.createElement('h2');
        title.innerText = "🛰️ Neubie Helper Panel";
        title.style.cssText = "color:#3b82f6; margin-bottom:20px; font-size:20px;";
        dashboard.appendChild(title);

        const list = document.createElement('div');
        list.style.display = "grid"; list.style.gap = "12px";

        // 지도 최적화 카드
        const mapCard = createMenuCard("🗺️ 지도 최적화", "노드 제거 및 마커 회전", true);
        list.appendChild(mapCard);

        // 배터리 카드 (v15.2 열기 버튼 수정 반영)
        const battCard = createMenuCard("🔋 성남 배터리", "배터리 실시간 팝업", false, () => {
            toggleBattery();
            dashboard.style.display = 'none';
        });
        list.appendChild(battCard);

        dashboard.appendChild(list);
    }

    function createMenuCard(name, desc, isToggle, action) {
        const card = document.createElement('div');
        card.style.cssText = "background:#252525; padding:15px; border-radius:15px; display:flex; justify-content:space-between; align-items:center; border:1px solid #333;";
        card.innerHTML = `<div style="flex:1;"><div style="font-weight:bold; font-size:15px;">${name}</div><div style="font-size:12px; color:#aaa;">${desc}</div></div>`;
        if (isToggle) {
            const chk = document.createElement('input');
            chk.type = 'checkbox'; chk.checked = state.isMapOpt;
            chk.style.cssText = "width:18px; height:18px; cursor:pointer;";
            chk.onchange = (e) => {
                state.isMapOpt = e.target.checked;
                localStorage.setItem('neubie_opt_map', state.isMapOpt);
                injectMapStyle();
            };
            card.appendChild(chk);
        } else {
            const btn = document.createElement('button');
            btn.innerText = '열기';
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

    // 7. 통합 단축키 (Alt+/, Alt+B, Alt+M)
    window.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === '/' || e.code === 'Slash' || e.key === '?')) {
            e.preventDefault();
            if (dashboard.style.display === 'none') { renderDashboard(); dashboard.style.display = 'block'; }
            else { dashboard.style.display = 'none'; }
        }
        if (e.altKey && e.code === 'KeyB') { e.preventDefault(); toggleBattery(); }
        if (e.altKey && e.code === 'KeyM') {
            e.preventDefault();
            state.isMapOpt = !state.isMapOpt;
            localStorage.setItem('neubie_opt_map', state.isMapOpt);
            injectMapStyle();
            console.log(`맵 최적화: ${state.isMapOpt ? 'ON' : 'OFF'}`);
        }
    });

    // 8. 초기 실행
    injectMapStyle();
    setInterval(() => { if (batteryPopup.style.display === 'block') updateBatteryStatus(); }, 10000);

    /* ============================================================
       SECTION 2. [추가] 줄을 서시오 v1.0 (중복 개입 방지 모듈)
       ============================================================ */
    const QUEUE_CONFIG = {
        SLOTS: [0, 350, 700, 1050, 1400], 
        JITTER: 100, 
        OVERLAY_DURATION: 2000,
        MIN_OVERLAY_SHOW: 500,
        STYLE: {
            position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'rgba(15, 23, 42, 0.98)', color: 'white', border: '3px solid #ffeb3b',
            padding: '25px 50px', borderRadius: '15px', zIndex: '2147483647', textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)', fontWeight: 'bold', pointerEvents: 'none'
        }
    };

    function handleConcurrencyControl(e) {
        // 관제 개입/모델 선택 관련 타겟 탐색
        const btn = e.target.closest('button') || e.target.closest('span.ng-star-inserted') || e.target.closest('div.model-selector');
        if (!btn || btn.dataset.intercepted) return;

        const btnText = btn.innerText.replace(/\s/g, "");
        // 가로챌 키워드 설정
        const isTarget = btnText.includes("빠른모델") || btnText.includes("Flash") || btnText.includes("개입시작");

        if (isTarget) {
            e.preventDefault();
            e.stopPropagation();

            // 딜레이 계산
            const base = QUEUE_CONFIG.SLOTS[Math.floor(Math.random() * QUEUE_CONFIG.SLOTS.length)];
            const jitter = Math.floor(Math.random() * (QUEUE_CONFIG.JITTER * 2 + 1)) - QUEUE_CONFIG.JITTER;
            const finalDelay = Math.max(0, base + jitter);

            // 오버레이 생성
            const overlay = document.createElement('div');
            overlay.innerHTML = `<div style="font-size: 20px; margin-bottom: 8px;">📡 중복 관제 완화 시스템</div>
                                 <div style="color: #ffeb3b;">딜레이 적용 중... (${(finalDelay/1000).toFixed(2)}s)</div>`;
            Object.assign(overlay.style, QUEUE_CONFIG.STYLE);
            document.body.appendChild(overlay);

            // 실행
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

    // 클릭 이벤트 가로채기 등록
    document.addEventListener('click', handleConcurrencyControl, true);
    
})();
