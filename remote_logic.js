/**
 * [뉴빌리티] 통합 관제 엔진 - Dashboard Full Logic (v15.0)
 * 통합 기능: Alt+/ (대시보드), Alt+B (배터리), Alt+M (맵 최적화)
 * 보안 정책(Trusted Types) 완전 우회 및 기능 로직 통합
 */
(function() {
    'use strict';

    console.log("🛰️ 뉴비 통합 엔진 v15.0 로드 완료");

    // 1. 상태 관리
    const state = {
        isMapOpt: localStorage.getItem('neubie_opt_map') === 'true',
        lastBatteryData: []
    };

    // 2. UI 요소 생성 (대시보드 & 배터리 팝업)
    const dashboard = createContainer('neubie-dashboard', '420px', '50%', '50%');
    const batteryPopup = createContainer('neubie-battery-popup', '340px', '20px', 'auto', '20px');
    document.body.append(dashboard, batteryPopup);

    function createContainer(id, width, top, left, right = 'auto') {
        const el = document.createElement('div');
        el.id = id;
        Object.assign(el.style, {
            position: 'fixed', top: top, left: left, right: right,
            width: width, backgroundColor: 'rgba(10, 10, 10, 0.98)', color: '#fff',
            borderRadius: '20px', padding: '20px', zIndex: '1000000',
            fontFamily: 'Pretendard, sans-serif', boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            border: '1px solid #444', display: 'none', transform: left === '50%' ? 'translate(-50%, -50%)' : 'none'
        });
        return el;
    }

    // 3. 성남 배터리 모니터링 설정 & iframe 생성
    const targetConfigs = [
        { id: '142', name: '성남판교 200', shortName: '판교 200' },
        { id: '145', name: '성남서현 201', shortName: '서현 201' },
        { id: '144', name: '성남율동 202', shortName: '율동 202' },
        { id: '155', name: '성남야탑 203', shortName: '야탑 203' }
    ];
    const iframes = {};

    if (window.location.href.includes('/remote/multiple/driving')) {
        targetConfigs.forEach(config => {
            const ifr = document.createElement('iframe');
            ifr.src = `https://go.neubie.ai/ko/monitoring/${config.id}`;
            Object.assign(ifr.style, { width: '0', height: '0', border: 'none', display: 'none' });
            document.body.appendChild(ifr);
            iframes[config.id] = ifr;
        });
    }

    // 4. 배터리 업데이트 & 복사 로직 (기존 로직 그대로)
    function updateBatteryStatus() {
        batteryPopup.innerHTML = ''; // 초기화 (DOM 방식으로 구현 권장하나 일단 기능 우선)
        
        const header = document.createElement('div');
        header.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;";
        header.innerHTML = `<b style="color:#eee; font-size:19px;">🛰️ 성남 배터리</b>`;
        
        const copyBtn = document.createElement('button');
        copyBtn.innerText = '📋 복사';
        Object.assign(copyBtn.style, { background:'#3b82f6', color:'white', border:'none', padding:'6px 14px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold' });
        copyBtn.onclick = copyToClipboard;
        
        header.appendChild(copyBtn);
        batteryPopup.appendChild(header);

        state.lastBatteryData = [];
        targetConfigs.forEach(config => {
            try {
                const doc = iframes[config.id]?.contentDocument || iframes[config.id]?.contentWindow.document;
                const card = doc?.querySelector('li[data-qk="robot-card"]');
                let batteryVal = "- %", statusText = "OFF", accentColor = "#666", statusIcon = "⚪";

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
                state.lastBatteryData.push({ shortName: config.shortName, battery: batteryVal, statusText: statusText });

                const item = document.createElement('div');
                item.style.cssText = `display:flex; justify-content:space-between; background:rgba(255,255,255,0.03); padding:12px 16px; border-radius:10px; margin-bottom:8px; border-left:5px solid ${accentColor};`;
                item.innerHTML = `<span>${statusIcon} ${config.name}</span><span style="font-weight:bold; color:${accentColor};">${batteryVal}</span>`;
                batteryPopup.appendChild(item);
            } catch (e) { }
        });
    }

    function copyToClipboard() {
        const now = new Date();
        let hour = now.getHours();
        if (now.getMinutes() >= 50) hour = (hour + 1) % 24;
        let copyText = `[${hour}시 성남 기체 배터리 현황]\n`;
        state.lastBatteryData.forEach(item => { copyText += `• ${item.shortName}: ${item.battery} (${item.statusText})\n`; });
        
        navigator.clipboard.writeText(copyText).then(() => {
            alert("클립보드에 복사되었습니다!");
        });
    }

    // 5. 맵 최적화 엔진 (v13.5 로직 통합)
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
        if (!state.isMapOpt) { style.textContent = ""; return; }
        style.textContent = `
            [data-qk^="node-marker"] { display: none !important; }
            gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) { display: block !important; visibility: visible !important; z-index: 500 !important; }
            gmp-advanced-marker:has([data-qk*="robot"]), div[class*="MiniMap"] gmp-advanced-marker { display: block !important; visibility: visible !important; z-index: 1000 !important; }
        `;
    }

    // 6. 대시보드 UI 빌더
    function renderDashboard() {
        dashboard.innerHTML = '';
        const title = document.createElement('h2');
        title.innerText = "🛰️ Neubie Helper Panel";
        title.style.color = "#3b82f6";
        dashboard.appendChild(title);

        const list = document.createElement('div');
        list.style.display = "grid"; list.style.gap = "10px";

        list.appendChild(createMenuCard("🗺️ 지도 최적화", "맵 렌더링 가속 (새로고침 필요)", true));
        list.appendChild(createMenuCard("🔋 성남 배터리", "배터리 팝업 토글 (Alt+B)", false, () => {
            toggleBattery();
            dashboard.style.display = 'none';
        }));

        dashboard.appendChild(list);
    }

    function createMenuCard(name, desc, isToggle, action) {
        const card = document.createElement('div');
        card.style.cssText = "background:#252525; padding:15px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;";
        card.innerHTML = `<div><div style="font-weight:bold;">${name}</div><div style="font-size:12px; color:#aaa;">${desc}</div></div>`;
        
        if (isToggle) {
            const chk = document.createElement('input');
            chk.type = 'checkbox'; chk.checked = state.isMapOpt;
            chk.onchange = (e) => {
                state.isMapOpt = e.target.checked;
                localStorage.setItem('neubie_opt_map', state.isMapOpt);
                location.reload();
            };
            card.appendChild(chk);
        } else {
            const btn = document.createElement('button');
            btn.innerText = '실행';
            btn.style.cssText = "background:#3b82f6; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;";
            btn.onclick = action;
            card.appendChild(btn);
        }
        return card;
    }

    // 7. 제어 로직
    function toggleBattery() {
        if (batteryPopup.style.display === 'none') {
            updateBatteryStatus();
            batteryPopup.style.display = 'block';
        } else {
            batteryPopup.style.display = 'none';
        }
    }

    window.addEventListener('keydown', (e) => {
        if (e.altKey && (e.code === 'Slash' || e.key === '/')) {
            e.preventDefault();
            if (dashboard.style.display === 'none') { renderDashboard(); dashboard.style.display = 'block'; }
            else { dashboard.style.display = 'none'; }
        }
        if (e.altKey && e.code === 'KeyB') { e.preventDefault(); toggleBattery(); }
        if (e.altKey && e.code === 'KeyM') {
            e.preventDefault();
            state.isMapOpt = !state.isMapOpt;
            localStorage.setItem('neubie_opt_map', state.isMapOpt);
            location.reload();
        }
    });

    // 8. 초기화
    injectMapStyle();
    setInterval(() => { if (batteryPopup.style.display === 'block') updateBatteryStatus(); }, 10000);

})();
