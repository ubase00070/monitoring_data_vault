(function() {
    'use strict';

    if (window.neubieEngineLoaded) return;
    window.neubieEngineLoaded = true;

    const currUrl = window.location.href;
    console.log("🛰️ 뉴비 통합 엔진 v1.3 로드 완료 (무결성 일일 업무 통합)");

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
        ],
        // 업무 시트 주소 식별자
        sheetId: "1tLo6Xeq6KJx6zW-fcw8H38jdjxyS2yre5oWY7cxky70"
    };

    const isAutoTarget = config.targetIds.some(id => currUrl.includes(`/monitoring/${id}`));
    const state = {
        isMapOpt: localStorage.getItem('neubie_opt_map') === 'true' || isAutoTarget,
        isQueueOpt: localStorage.getItem('neubie_opt_queue') === 'true',
        isTaskVisible: localStorage.getItem('neubie_opt_task') === 'true', // 업무창 표시 여부
        lastBatteryData: [],
        myTodayTasks: JSON.parse(localStorage.getItem('neubie_my_tasks') || "[]")
    };

    const QUEUE_CONFIG = {
        SLOTS: [0, 350, 700, 1050, 1400], 
        JITTER: 100, 
        STYLE: {
            position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'rgba(15, 23, 42, 0.98)', color: 'white', border: '3px solid #ffeb3b',
            padding: '25px 50px', borderRadius: '15px', zIndex: '2147483647', textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)', fontWeight: 'bold', pointerEvents: 'none',
            fontFamily: 'Pretendard, sans-serif'
        }
    };

    // 탭 간 통신을 위한 채널
    const taskChannel = new BroadcastChannel('neubie_task_sync');

    /* ============================================================
        SECTION 2. 맵 최적화 코어
       ============================================================ */
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        if (state.isMapOpt && url && (url.includes('nodes?') || url.includes('sites?') || url.includes('paths?'))) {
            return new Response(JSON.stringify({ data: [], items: [], total: 0 }), { 
                status: 200, 
                headers: { 'Content-Type': 'application/json' } 
            });
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
            .gm-style-cc { display: none !important; } 
        ` : "";
        if (!style.parentElement) document.head.appendChild(style);
    }

    /* ============================================================
        SECTION 3. UI 및 배터리 관제 로직
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
    const taskPopup = createContainer('neubie-task-popup', '360px', '20px', '20px'); // 업무 팝업 (좌상단)

    const injectUI = () => { 
        if (document.body) {
            document.body.append(dashboard, batteryPopup, taskPopup);
            if (state.isTaskVisible) taskPopup.style.display = 'block';
        } 
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectUI);
    else injectUI();

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
        Object.assign(copyBtn.style, { background:'#3b82f6', color:'white', border:'none', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', transition:'0.2s' });
        copyBtn.onclick = (e) => copyToClipboard(e.target);
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
            item.innerHTML = `<span>${statusIcon} ${c.name}</span><span style="font-weight:bold; color:${accentColor};">${batteryVal}</span>`;
            batteryPopup.appendChild(item);
        });
    }

    function copyToClipboard(btn) {
        const now = new Date();
        let hour = now.getHours();
        if (now.getMinutes() >= 50) hour = (hour + 1) % 24;
        let copyText = `[${hour}시 성남 기체 배터리 현황]\n`;
        state.lastBatteryData.forEach(item => { copyText += `• ${item.shortName}: ${item.battery} (${item.statusText})\n`; });
        
        navigator.clipboard.writeText(copyText).then(() => {
            const originalText = btn.textContent;
            const originalBg = btn.style.background;
            btn.textContent = '✅ 복사됨';
            btn.style.background = '#22c55e';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = originalBg;
            }, 2000);
        });
    }

    /* ============================================================
        SECTION 4. 일일 업무 연동 코어 (Sheet 스크래핑 & Sync)
       ============================================================ */
    // [구글 시트 탭 전용 데이터 수집 로직]
    if (currUrl.includes(config.sheetId)) {
        console.log("📋 업무 시트 데이터 동기화 활성화됨 (5분 주기)");
        setInterval(() => {
            // 1. 사용자 계정 이름 추출 (G열 매칭용)
            const profileBtn = document.querySelector('a[aria-label*="Google 계정"], img[src*="googleusercontent.com"]');
            const myNameMatch = profileBtn?.getAttribute('aria-label') || profileBtn?.getAttribute('title') || "";
            const myName = myNameMatch.match(/[가-힣]+/)?.[0] || ""; 

            if (!myName) return;

            const foundTasks = [];
            const rows = document.querySelectorAll('tr'); // 구글 시트의 행 구조 탐색
            
            rows.forEach(row => {
                const text = row.innerText;
                // 사용자의 이름이 포함되어 있고, 업무 내용이 있을법한 행 추출
                if (text.includes(myName)) {
                    const cells = text.split('\t').map(c => c.trim());
                    
                    // 정밀 수정 로직:
                    // 1) G열(인덱스 6)에 내 이름이 있고, F열(인덱스 5)에 시간표가 있는 '다중 모니터링' 배정
                    if (cells[6] === myName && cells[5] && cells[5].includes(':')) {
                        foundTasks.push({
                            type: 'monitoring',
                            content: `🖥️ 다중 모니터링 (${cells[5]})`
                        });
                    } 
                    // 2) B열(인덱스 1)에 내용이 있고, 특정 키워드([ ] 또는 '시')가 포함된 개별 임무
                    else if (cells[1] && (cells[1].includes('[') || cells[1].includes('시'))) {
                        foundTasks.push({
                            type: 'task',
                            content: cells[1]
                        });
                    }
                }
            });

            if (foundTasks.length > 0) {
                taskChannel.postMessage({ type: 'TASK_UPDATE', tasks: foundTasks, user: myName });
            }
        }, 300000); // 업데이트 주기를 5분(300,000ms)으로 변경
    }

    // [관제 탭 전용 데이터 수신 및 렌더링 로직]
    function renderTaskList(tasks) {
        taskPopup.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #444; padding-bottom:10px;">
                <b style="color:#fbbf24; font-size:17px;">📋 오늘의 업무</b>
                <span style="font-size:11px; color:#888;">5m Sync</span>
            </div>
        `;
        
        if (!tasks || tasks.length === 0) {
            taskPopup.innerHTML += `<div style="color:#666; text-align:center; padding:20px;">업무 시트 탭을 열어주세요.</div>`;
            return;
        }

        tasks.forEach(t => {
            const item = document.createElement('div');
            // 모니터링 배정은 파란색 계열, 일반 임무는 노란색 계열로 시인성 차별화
            const isMon = t.type === 'monitoring';
            item.style.cssText = `background:${isMon ? 'rgba(59, 130, 246, 0.1)' : 'rgba(251, 191, 36, 0.1)'}; 
                                  border-left:4px solid ${isMon ? '#3b82f6' : '#fbbf24'}; 
                                  padding:12px; border-radius:8px; margin-bottom:10px; font-size:14px; line-height:1.5;`;
            item.innerHTML = `<div style="color:#eee; font-weight:500;">${t.content}</div>`;
            taskPopup.appendChild(item);
        });
    }

    taskChannel.onmessage = (e) => {
        if (e.data.type === 'TASK_UPDATE') {
            state.myTodayTasks = e.data.tasks;
            localStorage.setItem('neubie_my_tasks', JSON.stringify(e.data.tasks));
            if (state.isTaskVisible) renderTaskList(state.myTodayTasks);
        }
    };

    /* ============================================================
        SECTION 5. 줄을 서시오 및 대시보드 토글
       ============================================================ */
    function renderDashboard() {
        dashboard.innerHTML = '';
        const title = document.createElement('h2');
        title.textContent = "🛰️ Neubie Helper Panel";
        title.style.cssText = "color:#3b82f6; margin-bottom:20px; font-size:20px;";
        dashboard.appendChild(title);
        const list = document.createElement('div');
        list.style.display = "grid"; list.style.gap = "12px";

        list.appendChild(createMenuCard("🗺️ 지도 최적화", "노드 제거 및 마커 회전", 'isMapOpt', 'neubie_opt_map', () => injectMapStyle()));
        list.appendChild(createMenuCard("📡 줄을 서시오", "중복 개입 방지 (Gemini/GitHub)", 'isQueueOpt', 'neubie_opt_queue'));
        
        // 일일 업무 메뉴 카드 추가
        list.appendChild(createMenuCard("📋 일일 업무", "좌측 상단 시트 연동 정보", 'isTaskVisible', 'neubie_opt_task', () => {
            if (state.isTaskVisible) {
                taskPopup.style.display = 'block';
                renderTaskList(state.myTodayTasks);
            } else {
                taskPopup.style.display = 'none';
            }
        }));

        const isBatteryOpen = batteryPopup.style.display === 'block';
        list.appendChild(createMenuCard("🔋 성남 배터리", "배터리 실시간 현황", null, null, () => {
            toggleBattery();
            renderDashboard(); 
        }, isBatteryOpen ? '닫기' : '열기'));

        dashboard.appendChild(list);
    }

    function createMenuCard(name, desc, stateKey, storageKey, action, btnLabel = '열기') {
        const card = document.createElement('div');
        card.style.cssText = "background:#252525; padding:15px; border-radius:15px; display:flex; justify-content:space-between; align-items:center; border:1px solid #333;";
        card.innerHTML = `<div style="flex:1;"><div style="font-weight:bold; font-size:15px;">${name}</div><div style="font-size:12px; color:#aaa;">${desc}</div></div>`;
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
            btn.textContent = btnLabel;
            btn.style.cssText = `background:${btnLabel === '닫기' ? '#ef4444' : '#3b82f6'}; color:white; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:bold; min-width:60px;`;
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
        SECTION 6. 제미나이 가로채기 로직 (원본 보존)
       ============================================================ */
    function calculateDelay() {
        const slots = QUEUE_CONFIG.SLOTS;
        const base = slots[Math.floor(Math.random() * slots.length)];
        return base + (Math.random() * QUEUE_CONFIG.JITTER * 2 - QUEUE_CONFIG.JITTER);
    }

    function createOverlay(delay) {
        const el = document.createElement('div');
        Object.assign(el.style, QUEUE_CONFIG.STYLE);
        el.style.opacity = '1';
        el.style.transition = 'opacity 0.2s';
        el.innerHTML = `
            <div style="font-size:28px; margin-bottom:10px;">📡 줄을 서시오!</div>
            <div style="font-size:18px; color:#ffeb3b;">다른 작업자와의 충돌 방지를 위해<br><span style="font-size:32px;">${(delay/1000).toFixed(2)}초</span> 후 자동 실행됩니다.</div>
        `;
        return el;
    }

    function handleControlClick(e) {
        const btn = e.target.closest('span.ng-star-inserted') || e.target.closest('div.model-selector');
        if (!btn || btn.dataset.intercepted || !state.isQueueOpt) return;
    
        const btnText = btn.innerText.replace(/\s/g, "");
        const isTarget = btnText.includes("빠른모델") || btnText.includes("Flash");
        
        if (isTarget) {
            e.preventDefault();
            e.stopPropagation();
    
            const finalDelay = calculateDelay();
            const overlay = createOverlay(finalDelay);
            document.body.appendChild(overlay);
    
            setTimeout(() => {
                btn.dataset.intercepted = 'true';
                btn.click();
                btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
                setTimeout(() => {
                    overlay.style.opacity = '0';
                    setTimeout(() => { overlay.remove(); delete btn.dataset.intercepted; }, 200);
                }, 1000);
            }, finalDelay);
        }
    }

    /* ============================================================
        SECTION 7. 초기화 및 이벤트 바인딩
       ============================================================ */
    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'KeyQ') {
            e.preventDefault();
            if (dashboard.style.display === 'none') { 
                renderDashboard(); 
                dashboard.style.display = 'block'; 
            } else { 
                dashboard.style.display = 'none'; 
            }
        }
        if (e.altKey && e.code === 'KeyB') { 
            e.preventDefault(); 
            toggleBattery(); 
            if (dashboard.style.display === 'block') renderDashboard(); 
        }
    });

    document.addEventListener('click', handleControlClick, true);
    injectMapStyle();
    
    // 주기적 업데이트 (배터리 & 업무창 리프레시)
    setInterval(() => { 
        if (batteryPopup.style.display === 'block') updateBatteryStatus(); 
    }, 10000);

    // 초기 실행 시 업무 데이터 로드
    if (state.isTaskVisible) renderTaskList(state.myTodayTasks);

})();
