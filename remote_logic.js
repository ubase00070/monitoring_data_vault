/**
 * [뉴빌리티] 통합 관제 엔진 - Remote Logic (v13.0)
 * 통합 기능: Alt+B (성남 배터리), Alt+M (맵 최적화)
 */
(function() {
    'use strict';

    const currUrl = window.location.href;
    console.log("🛰️ 뉴비 통합 엔진 로드 완료");

    // ==========================================
    // [기능 1] 성남 배터리 실시간 모니터링 (Alt+B)
    // ==========================================
    // 특정 페이지에서만 작동하도록 조건부 실행
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

            // 팝업 생성 및 iframe 로직 (사용자님의 기존 v12.0 코드 삽입)
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

            targetConfigs.forEach(config => {
                const ifr = document.createElement('iframe');
                ifr.src = `https://go.neubie.ai/ko/monitoring/${config.id}`;
                Object.assign(ifr.style, { width: '0', height: '0', border: 'none', display: 'none' });
                document.body.appendChild(ifr);
                iframes[config.id] = ifr;
            });

            function copyToClipboard() { /* 기존 복사 로직 */ }
            function updateStatus() { /* 기존 업데이트 로직 */ }

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
    // 이 기능은 주소 제한 없이 모든 go.neubie.ai에서 활성화 가능하도록 설정
    (function initMapOptimization() {
        const targetIds = ['44', '56', '65', '109'];
        const checkTarget = () => targetIds.some(id => window.location.href.includes(`/monitoring/${id}`));
        
        let manualOff = sessionStorage.getItem('neubie-manual-off') === 'true';
        let isOptimized = !manualOff && checkTarget();

        // fetch 가속 및 스타일 주입 로직 (사용자님의 기존 v8.2.3 코드 삽입)
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

        const injectStyle = () => { /* 기존 스타일 주입 로직 */ };

        window.addEventListener('keydown', (e) => {
            if (e.altKey && e.code === 'KeyM') {
                e.preventDefault();
                isOptimized = !isOptimized;
                sessionStorage.setItem('neubie-manual-off', !isOptimized);
                injectStyle();
                if (!isOptimized) location.reload();
            }
        });

        // 주소 변경 감지 로직
        setInterval(() => {
            if (!sessionStorage.getItem('neubie-manual-off') === 'true') {
                const nowTarget = checkTarget();
                if (isOptimized !== nowTarget) {
                    isOptimized = nowTarget;
                    injectStyle();
                }
            }
        }, 2000);

        injectStyle();
    })();
})();
