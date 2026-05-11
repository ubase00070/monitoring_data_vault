(function() {
    'use strict';

    if (window.neubieEngineLoaded) return;
    window.neubieEngineLoaded = true;

    const currUrl = window.location.href;
    const isNeubieSite = currUrl.includes('go.neubie.ai');
    console.log("🛰️ 뉴비 통합 엔진 v1.4 로드 완료 (줄을 서시오: 뉴비고 최적화)");

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
        sheetId: "1tLo6Xeq6KJx6zW-fcw8H38jdjxyS2yre5oWY7cxky70"
    };

    const isAutoTarget = config.targetIds.some(id => currUrl.includes(`/monitoring/${id}`));
    const state = {
        isMapOpt: localStorage.getItem('neubie_opt_map') === 'true' || isAutoTarget,
        isQueueOpt: localStorage.getItem('neubie_opt_queue') === 'true',
        isTaskVisible: localStorage.getItem('neubie_opt_task') === 'true',
        lastBatteryData: [],
        myTodayTasks: JSON.parse(localStorage.getItem('neubie_my_tasks') || "[]")
    };

    const QUEUE_CONFIG = {
        SLOTS: [0, 350, 700, 1050, 1400], 
        JITTER: 100, 
        OVERLAY_DURATION: 2000,
        MIN_OVERLAY_SHOW: 500,
        STYLE: {
            position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'rgba(15, 23, 42, 0.98)', color: 'white', border: '3px solid #ffeb3b',
            padding: '25px 50px', borderRadius: '15px', zIndex: '2147483647', textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)', fontWeight: 'bold', pointerEvents: 'none',
            fontFamily: 'Pretendard, sans-serif', transition: 'opacity 0.2s ease-in-out'
        }
    };

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
    const taskPopup = createContainer('neubie-task-popup', '360px', '20px', '20px');

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
        SECTION 4. 일일 업무 연동 코어
       ============================================================ */
    if (currUrl.includes(config.sheetId)) {
        console.log("📋 업무 시트 데이터 동기화 활성화됨 (5분 주기)");
        setInterval(() => {
            const profileBtn = document.querySelector('a[aria-label*="Google 계정"], img[src*="googleusercontent.com"]');
            const myNameMatch = profileBtn?.getAttribute('aria-label') || profileBtn?.getAttribute('title') || "";
            const myName = myNameMatch.match(/[가-힣]+/)?.[0] || ""; 

            if (!myName) return;

            const foundTasks = [];
            const rows = document.querySelectorAll('tr');
            
            rows.forEach(row => {
                const text = row.innerText;
                if (text.includes(myName)) {
                    const cells = text.split('\t').map(c => c.trim());
                    if (cells[6] === myName && cells[5] && cells[5].includes(':')) {
                        foundTasks.push({ type: 'monitoring', content: `🖥️ 다중 모니터링 (${cells[5]})` });
                    } 
                    else if (cells[1] && (cells[1].includes('[') || cells[1].includes('시'))) {
                        foundTasks.push({ type: 'task', content: cells[1] });
                    }
                }
            });

            if (foundTasks.length > 0) {
                taskChannel.postMessage({ type: 'TASK_UPDATE', tasks: foundTasks, user: myName });
            }
        }, 300000);
    }

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
        SECTION 5. 줄을 서시오 (뉴비고 이식 버전)
       ============================================================ */
    function calculateDelay() {
        const base = QUEUE_CONFIG.SLOTS[Math.floor(Math.random() * QUEUE_CONFIG.SLOTS.length)];
        const jitter = Math.floor(Math.random() * (QUEUE_CONFIG.JITTER * 2 + 1)) - QUEUE_CONFIG.JITTER;
        return Math.max(0, base + jitter);
    }

    function createOverlay(finalDelay) {
        const overlay = document.createElement('div');
        overlay.innerHTML = `
            <div style="font-size: 20px; margin-bottom: 8px; letter-spacing: -0.5px;">📡 중복 관제 완화 시스템 v1.1</div>
            <div style="font-size: 17px; color: #ffeb3b; font-weight: 500;">
                딜레이 적용 중... (${(finalDelay/1000).toFixed(2)}s)
            </div>
        `;
        Object.assign(overlay.style, QUEUE_CONFIG.STYLE);
        return overlay;
    }

    function handleControlClick(e) {
        if (!state.isQueueOpt) return;

        // 1. 뉴비고 사이트가 아닌 경우 실행 차단
        if (!isNeubieSite) return;

        // 2. 버튼 요소 탐색 (Tailwind class 기반)
        const btn = e.target.closest('div.flex.justify-center.items-center.w-full') || e.target.closest('button');
        if (!btn || btn.dataset.intercepted) return;

        // 3. 텍스트 Exact Match 검사 (공백 제거 후 "관제시작" 확인)
        const btnText = btn.innerText.replace(/\s/g, "");
        const isTarget = btnText === "관제시작"; // '관제 화면 재시작' 등은 여기서 필터링됨
        
        // 버튼 상태 확인 (확인중, 종료 등이 아닐 때만)
        const isAvailable = !btnText.includes("확인중") && !btnText.includes("종료");

        if (isTarget && isAvailable) {
            e.preventDefault();
            e.stopPropagation();

            const finalDelay = calculateDelay();
            const overlay = createOverlay(finalDelay);
            document.body.appendChild(overlay);

            setTimeout(() => {
                btn.dataset.intercepted = 'true';
                btn.click(); // 실제 클릭 트리거

                setTimeout(() => {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                        delete btn.dataset.intercepted;
                    }, 200);
                }, Math.max(QUEUE_CONFIG.MIN_OVERLAY_SHOW, QUEUE_CONFIG.OVERLAY_DURATION - finalDelay));
            }, finalDelay);
        }
    }

    /* ============================================================
        SECTION 6. 대시보드 및 UI 컨트롤
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
        list.appendChild(createMenuCard("📡 줄을 서시오", "중복 관제 방지 (관제 시작 버튼)", 'isQueueOpt', 'neubie_opt_queue'));
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

    // 캡처링 단계에서 클릭 이벤트 가로채기
    document.addEventListener('click', handleControlClick, true);
    
    injectMapStyle();
    
    setInterval(() => { 
        if (batteryPopup.style.display === 'block') updateBatteryStatus(); 
    }, 10000);

    if (state.isTaskVisible) renderTaskList(state.myTodayTasks);

})();
