/**
 * [뉴빌리티] 통합 관제 엔진 - Remote Logic (v13.5)
 * 통합 기능: Alt+B (성남 배터리), Alt+M (맵 최적화)
 * 업데이트: 누락된 배터리 업데이트/복사 로직 완전 통합
 */
(function() {
    'use strict';

    const currUrl = window.location.href;
    console.log("🛰️ 뉴비 통합 엔진 로드 완료");

    // ==========================================
    // [기능 1] 성남 배터리 실시간 모니터링 (Alt+B)
    // ==========================================
    if (currUrl.includes('/remote/multiple/driving')) {
        (function initBatteryMonitor() {
            const targetConfigs = [
                { id: '142', name: '성남판교 200', shortName: '판교 200' },
                { id: '145', name: '성남서현 201', shortName: '서현 201' },
                { id: '144', name: '성남율동 202', shortName: '율동 202' },
                { id: '155', name: '성남야탑 203', shortName: '야탑 203' }
            ];
            const iframes = {};
            let lastData = [];

            // 1. 팝업 UI 생성
            const popup = document.createElement('div');
            Object.assign(popup.style, {
                position: 'fixed', top: '20px', right: '20px',
                backgroundColor: 'rgba(10, 10, 10, 0.98)', color: '#ffffff', padding: '20px',
                borderRadius: '15px', zIndex: '999999', fontSize: '17px',
                border: '1px solid #444', minWidth: '340px',
                fontFamily: 'Pretendard, sans-serif', display: 'none',
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)', lineHeight: '1.8'
            });
            document.body.appendChild(popup);

            // 2. iframe 생성
            targetConfigs.forEach(config => {
                const ifr = document.createElement('iframe');
                ifr.src = `https://go.neubie.ai/ko/monitoring/${config.id}`;
                Object.assign(ifr.style, { width: '0', height: '0', border: 'none', display: 'none' });
                document.body.appendChild(ifr);
                iframes[config.id] = ifr;
            });

            // 3. 복사 기능 (시간 올림 로직 포함)
            function copyToClipboard() {
                const now = new Date();
                let hour = now.getHours();
                if (now.getMinutes() >= 50) hour = (hour + 1) % 24;

                let copyText = `[${hour}시 성남 기체 배터리 현황]\n`;
                lastData.forEach(item => {
                    copyText += `• ${item.shortName}: ${item.battery} (${item.statusText})\n`;
                });

                const el = document.createElement('textarea');
                el.value = copyText;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);

                const btn = document.getElementById('copy-btn');
                if(btn) {
                    btn.innerText = '✅ 복사됨';
                    setTimeout(() => { btn.innerText = '📋 복사'; }, 1500);
                }
            }

            // 4. 데이터 업데이트 로직
            function updateStatus() {
                let tempLastData = [];
                let finalHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
                        <b style="color:#eee; font-size:19px;">🛰️ 성남 배터리 모니터링</b>
                        <button id="copy-btn" style="background:#3b82f6; color:white; border:none; padding:6px 14px; border-radius:6px; cursor:pointer; font-size:14px; font-weight:bold;">📋 복사</button>
                    </div>`;

                targetConfigs.forEach(config => {
                    try {
                        const doc = iframes[config.id].contentDocument || iframes[config.id].contentWindow.document;
                        const card = doc.querySelector('li[data-qk="robot-card"]');
                        
                        let batteryVal = "- %", statusText = "OFF", accentColor = "#666", statusIcon = "⚪", isPatrolling = false;

                        if (card) {
                            const cardText = card.innerText;
                            const batteryMatch = cardText.match(/(\d+)%/);
                            const isCharging = card.querySelector('svg[class*="text-tertiary-300"]') || cardText.includes('배터리');
                            isPatrolling = cardText.includes('순회');

                            if (batteryMatch) {
                                batteryVal = batteryMatch[0];
                                if (isPatrolling) { accentColor = "#3b82f6"; statusIcon = "🔵"; statusText = "순회 중"; }
                                else if (isCharging) { accentColor = "#22c55e"; statusIcon = "🟢"; statusText = "충전 중"; }
                                else { accentColor = "#888888"; statusIcon = "⚪"; statusText = "대기 중"; }
                            }
                        }
                        tempLastData.push({ shortName: config.shortName, battery: batteryVal, statusText: statusText });
                        finalHTML += `
                            <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.03); padding:12px 16px; border-radius:10px; margin-bottom:8px; border-left:5px solid ${accentColor};">
                                <span style="color:${(isPatrolling || statusText === '충전 중') ? '#fff' : '#aaa'};">${statusIcon} ${config.name}</span>
                                <span style="font-weight:bold; color:${accentColor};">${batteryVal}</span>
                            </div>`;
                    } catch (e) {
                        finalHTML += `<div style="padding:10px 15px; color:#444;">• ${config.name}: 연결 중...</div>`;
                    }
                });

                lastData = tempLastData;
                popup.innerHTML = finalHTML;
                const btn = document.getElementById('copy-btn');
                if(btn) btn.onclick = copyToClipboard;
            }

            window.addEventListener('keydown', (e) => {
                if (e.altKey && e.code === 'KeyB') {
                    if (popup.style.display === 'none') {
                        updateStatus();
                        popup.style.display = 'block';
                    } else {
                        popup.style.display = 'none';
                    }
                }
            });

            setInterval(() => { if (popup.style.display === 'block') updateStatus(); }, 10000);
        })();
    }

    // ==========================================
    // [기능 2] 맵 최적화 엔진 (Alt+M)
    // ==========================================
    (function initMapOptimization() {
        const targetIds = ['44', '56', '65', '109'];
        const checkTarget = () => targetIds.some(id => window.location.href.includes(`/monitoring/${id}`));
        let manualOff = sessionStorage.getItem('neubie-manual-off') === 'true';
        let isOptimized = !manualOff && checkTarget();

        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : args[0].url;
            if (isOptimized && url && (url.includes('nodes?') || url.includes('sites?') || url.includes('paths?'))) {
                return new Response(JSON.stringify({ data: [], items: [], total: 0 }), {
                    status: 200, headers: { 'Content-Type': 'application/json' }
                });
            }
            return originalFetch(...args);
        };

        const injectStyle = () => {
            let style = document.getElementById('neubie-v82-style');
            if (!style) {
                style = document.createElement('style');
                style.id = 'neubie-v82-style';
                document.head.appendChild(style);
            }
            if (!isOptimized) { style.textContent = ""; return; }
            style.textContent = `
                aside, [class*="card"], button { border-radius: 8px !important; }
                [data-qk^="node-marker"] { display: none !important; }
                gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) { display: block !important; visibility: visible !important; z-index: 500 !important; }
                gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) svg { transform: rotate(180deg) !important; }
                gmp-advanced-marker:has([data-qk*="robot"]), div[class*="MiniMap"] gmp-advanced-marker { display: block !important; visibility: visible !important; z-index: 1000 !important; }
            `;
        };

        window.addEventListener('keydown', (e) => {
            if (e.altKey && e.code === 'KeyM') {
                e.preventDefault();
                isOptimized = !isOptimized;
                sessionStorage.setItem('neubie-manual-off', !isOptimized);
                injectStyle();
                if (!isOptimized) location.reload();
            }
        });

        setInterval(() => {
            if (sessionStorage.getItem('neubie-manual-off') !== 'true') {
                const nowTarget = checkTarget();
                if (isOptimized !== nowTarget) { isOptimized = nowTarget; injectStyle(); }
            }
        }, 2000);

        injectStyle();
    })();
})();
