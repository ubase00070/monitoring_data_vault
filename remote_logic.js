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

    // [추가] 기체 네이밍 매핑 데이터
    const ROBOT_MAP = {
        "76": { site: "송도 요기요", unit: "#076" },
        "85": { site: "역삼 요기요", unit: "#085" },
        "124": { site: "가평 니모", unit: "#124" },
        "171": { site: "부산 국립과학관", unit: "#171" },
        "170": { site: "부산 국립과학관", unit: "#170" }
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
        SECTION 2. 맵 최적화 코어 & 네이밍 유틸리티
       ============================================================ */
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        // 최적화 대상 URL 감지
        if (url && (url.includes('nodes?') || url.includes('sites?') || url.includes('paths?'))) {
            // 데이터를 빈 배열로 반환하여 렌더링 방지
            return new Response(JSON.stringify({ data: [], items: [], total: 0 }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return originalFetch(...args);
    };

    function injectMapStyle() {
        const style = document.createElement('style');
        style.id = 'neubie-map-optimization';
        style.textContent = `
            /* 1. 불필요한 마커 및 경로 숨기기 (가속 핵심) */
            gmp-advanced-marker:has([data-qk*="base-marker"]),
            gmp-advanced-marker:has([data-qk*="node-marker"]),
            gmp-advanced-marker:has([data-qk*="site-marker"]),
            #map-container svg path[stroke-opacity],
            .gm-style img[src*="transparent"] { 
                display: none !important; 
            }

            /* 2. 대기장소 마커 반전 복구 (가독성) */
            gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) {
                display: block !important;
                transform: rotate(180deg) !important;
            }

            /* 3. 기체 및 미니맵 마커는 절대 보존 */
            gmp-advanced-marker:not(:has([data-qk])),
            gmp-advanced-marker:has([data-qk*="robot"]),
            div[class*="MiniMap"] gmp-advanced-marker {
                display: block !important;
                visibility: visible !important;
                z-index: 1000 !important;
            }

            /* 4. 브라우저 렌더링 가속 */
            .gm-style canvas { contain: strict !important; }
        `;
        document.head.appendChild(style);
    }

    // [추가] 네이밍용 시간 보정 유틸리티
    const getFormattedDate = (dateObj) => dateObj.toISOString().slice(0, 10).replace(/-/g, "");
    const getFormattedHour = (dateObj) => String(dateObj.getHours()).padStart(2, '0');
    const getCalculatedTime = (offsetMinutes) => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - offsetMinutes);
        return now;
    };
    const isWeekend = () => {
        const day = new Date().getDay();
        return (day === 6 || day === 0);
    };

    // [추가] 기체 트래킹 로직
    function updateRobotContext() {
        const path = window.location.href;
        if (path.includes('go.neubie.ai/ko/remote/robot/')) {
            const robotNum = path.split('/').pop().split('?')[0];
            if (ROBOT_MAP[robotNum]) {
                let history = JSON.parse(localStorage.getItem('neubie_robot_history') || '[]');
                const newData = { id: robotNum, timestamp: Date.now() };
                history = [newData, ...history.filter(h => h.id !== robotNum)].slice(0, 3);
                localStorage.setItem('neubie_robot_history', JSON.stringify(history));
            }
        }
    }
    updateRobotContext();

    /* ============================================================
        SECTION 3. UI 컴포넌트 생성
       ============================================================ */
    function createContainer(id, width, top, left, right = 'auto') {
        const el = document.createElement('div');
        el.id = id;
        Object.assign(el.style, {
            position: 'fixed', top: top, left: left, right: right,
            width: width, backgroundColor: 'rgba(15, 15, 15, 0.98)', color: '#fff',
            borderRadius: '24px', padding: '20px', zIndex: '1000000',
            fontFamily: 'Pretendard, sans-serif', boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            border: '1px solid #333', display: 'none', transform: left === '50%' ? 'translate(-50%, -50%)' : 'none',
            maxHeight: '90vh', overflowY: 'auto' // [수정] 레이아웃 가시성 확보를 위한 스크롤 추가
        });
        return el;
    }

    const dashboard = createContainer('neubie-dashboard', '420px', '50%', '50%');
    const batteryPopup = createContainer('neubie-battery-popup', '340px', '20px', 'auto', '20px');
    const taskPopup = createContainer('neubie-task-popup', '360px', '20px', '20px');

    const injectUI = () => { 
        if (document.body) {
            document.body.append(dashboard, batteryPopup, taskPopup);
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

    /* ============================================================
        SECTION 4. 배터리 및 업무 연동 로직
       ============================================================ */
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
        SECTION 4-1. [서버 동기화] GitHub JSON 기반 업무 로드 엔진
       ============================================================ */
    // 시트 탭이 아니더라도 모든 페이지(뉴비고 대시보드 등)에서 실행되어야 함
    function syncTasksFromServer() {
        const myName = localStorage.getItem('neubie_user_name');
        if (!myName) return;

        const buster = Math.floor(Date.now() / 60000); 
        const dataUrl = `https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/daily_tasks.json?v=${buster}`;

        fetch(dataUrl)
            .then(res => res.json())
            .then(data => {
                const myTasks = data.filter(t => t.user === myName);
                window.currentMyTasks = myTasks;
                
                console.log(`📥 데이터 동기화 완료: ${new Date().toLocaleTimeString()}`);

                // [핵심] 레이아웃이 닫혀있어도 알림 조건을 체크함
                checkAndTriggerNotifications(myTasks);

                // 업무 팝업이 열려있다면 리스트 갱신
                if (taskPopup && taskPopup.style.display === 'block') {
                    renderTaskList(myTasks);
                }
            })
            .catch(err => console.log("Sync failed"));
    }

    // 레이아웃 노출 여부와 상관없이 알림만 전담하는 함수
    function checkAndTriggerNotifications(tasks) {
        const interval = parseInt(localStorage.getItem('neubie_remind_int') || '0');
        if (interval === 0) return;

        tasks.forEach(t => {
            const timeKey = t.rawTime || t.time;
            // 기존에 만들어둔 getTaskStatus를 활용해 남은 시간 계산
            const status = getTaskStatus(timeKey); 
            
            const isMultiMon = t.content && t.content.includes("다중 모니터링");
            const targetInterval = isMultiMon ? (interval + 10) : interval;

            if (status.remainMin === targetInterval) {
                if (!window.state.notifiedTasks) window.state.notifiedTasks = new Set();
                
                const taskKey = `${t.content}_${timeKey}_${targetInterval}`;
                if (!window.state.notifiedTasks.has(taskKey)) {
                    triggerReminder(t.content, status.remainMin);
                    window.state.notifiedTasks.add(taskKey);
                }
            }
        });
    }

    /* ============================================================
        SECTION 3. 시간 계산 및 상태 판단 (통합 버전)
       ============================================================ */
    function getTaskStatus(rawTime, isMonitoring) {
        const times = String(rawTime).match(/\d{2}:\d{2}/g);
        if (!times) return { isExpired: false, remainMin: 999, score: 0 };
        
        const now = new Date();
        const startTimeStr = times[0];
        const endTimeStr = times[times.length - 1];

        const [sH, sM] = startTimeStr.split(':').map(Number);
        const [eH, eM] = endTimeStr.split(':').map(Number);
        
        // [핵심] 07시 기준 상대 점수 계산 (자정 전후 시간 역전 방지)
        const getRelativeScore = (h, m) => {
            let relHour = h - 7;
            if (relHour < 0) relHour += 24;
            return relHour * 60 + m;
        };

        const currScore = getRelativeScore(now.getHours(), now.getMinutes());
        const startScore = getRelativeScore(sH, sM);
        const endScore = getRelativeScore(eH, eM);

        let remainMin = startScore - currScore;
        
        // [요청 반영] 다중 모니터링은 10분 일찍 알림이 오도록 계산
        // (remainMin이 13일 때, 사용자가 설정한 interval 3과 일치하게 됨)
        if (isMonitoring) {
            remainMin -= 10; 
        }

        return {
            isExpired: currScore > endScore, // 업무 종료 시간이 지났으면 취소선
            remainMin: remainMin,
            score: startScore // 정렬용 점수
        };
    }

    // 리마인더 알림창 생성 함수 (5초 점멸)
    function triggerReminder(content, remainMin) {
        console.log(`[알림] ${content} 시작 ${remainMin}분 전!`);
        
        // 알림용 UI 엘리먼트 생성
        const alarmDiv = document.createElement('div');
        alarmDiv.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: #fbbf24; color: #000; padding: 15px 25px; border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5); 
            z-index: 9999999; /* 어떤 레이아웃보다도 위에 뜨도록 수정 */
            font-weight: bold; font-size: 16px; border: 2px solid #000;
            display: flex; align-items: center; gap: 10px; animation: fadeInDown 0.5s;
        `;
        alarmDiv.innerHTML = `⚠️ <b>[업무 알림]</b> ${content} 시작 ${remainMin}분 전입니다!`;
        
        document.body.appendChild(alarmDiv);

        // 5초 후 자동으로 사라짐
        setTimeout(() => {
            alarmDiv.style.opacity = '0';
            alarmDiv.style.transition = '0.5s';
            setTimeout(() => alarmDiv.remove(), 500);
        }, 5000);
    }

    /* ============================================================
    SECTION 4-2. UI 렌더링 및 07시 기준 정렬/알림 제어
   ============================================================ */
    function renderTaskList(tasks) {
        const currentInt = localStorage.getItem('neubie_remind_int') || '0';

        // 1. 07시 기준 상대 시간 및 상태 계산 함수
        function getTaskStatus(rawTime) {
            if (!rawTime) return { isExpired: false, remainMin: -1, score: 0 };

            const now = new Date();
            // 문자열에서 시간(HH:mm)만 추출
            const timeMatch = String(rawTime).match(/\d{2}:\d{2}/);
            if (!timeMatch) return { isExpired: false, remainMin: -1, score: 0 };

            const [tHour, tMin] = timeMatch[0].split(':').map(Number);

            // [핵심] 07시 기준 Relative Score 계산 (07:00 -> 0점, 익일 06:00 -> 1380점)
            const getRelativeScore = (h, m) => {
                let relHour = h - 7;
                if (relHour < 0) relHour += 24;
                return relHour * 60 + m;
            };

            const currScore = getRelativeScore(now.getHours(), now.getMinutes());
            const taskScore = getRelativeScore(tHour, tMin);

            const remainMin = taskScore - currScore;
            const isExpired = taskScore < currScore;

            return { isExpired, remainMin, score: taskScore };
        }

        // 2. 노이즈 제거 및 07시 기준 정렬
        const validTasks = tasks
            .filter(t => {
                const content = t.content || "";
                const rawTime = t.rawTime || "";
                return content.trim() !== "" && !String(rawTime).includes("1899");
            })
            .sort((a, b) => {
                const scoreA = getTaskStatus(a.rawTime || a.time).score;
                const scoreB = getTaskStatus(b.rawTime || b.time).score;
                return scoreA - scoreB;
            });

        // 3. 헤더 및 설정 UI 렌더링
        taskPopup.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #444; padding-bottom:10px;">
                <b style="color:#fbbf24; font-size:16px;">📋 리마인더 설정</b>
                <select id="remindSetter" style="background:#333; color:white; border:1px solid #555; font-size:11px; border-radius:4px; padding:2px;">
                    <option value="0" ${currentInt === '0' ? 'selected' : ''}>알림 없음</option>
                    <option value="3" ${currentInt === '3' ? 'selected' : ''}>3분 전 (다중 13분)</option>
                    <option value="5" ${currentInt === '5' ? 'selected' : ''}>5분 전 (다중 15분)</option>
                </select>
            </div>
            <div id="task-list-container"></div>
        `;

        const setter = taskPopup.querySelector('#remindSetter');
        const container = taskPopup.querySelector('#task-list-container');

        setter.onchange = (e) => {
            localStorage.setItem('neubie_remind_int', e.target.value);
            if (window.state) window.state.notifiedTasks = new Set(); // 알림 기록 초기화
            syncTasksFromServer();
        };
        
        if (validTasks.length === 0) {
            container.innerHTML = `<div style="color:#666; text-align:center; padding:20px; font-size:12px;">배정된 업무가 없습니다.</div>`;
            return;
        }

        // 4. 리스트 생성 및 특수 알림 로직 적용
        validTasks.forEach(t => {
            const timeKey = t.rawTime || t.time;
            const status = getTaskStatus(timeKey);
            const interval = parseInt(localStorage.getItem('neubie_remind_int') || '0');

            // [핵심] 다중 모니터링 업무 전용 오프셋 (+10분)
            const isMultiMon = t.content && t.content.includes("다중 모니터링");
            const targetInterval = isMultiMon ? (interval + 10) : interval;

            // 알림 발송 조건 (설정값이 0이 아니고, 계산된 남은 시간이 타겟 시간과 일치할 때)
            if (window.state && interval > 0 && status.remainMin === targetInterval) {
                if (!state.notifiedTasks) state.notifiedTasks = new Set();
                
                // 업무 내용과 시간을 조합해 고유 키 생성 (중복 알림 방지)
                const taskKey = `${t.content}_${timeKey}`;
                if (!state.notifiedTasks.has(taskKey)) {
                    // 알림창 띄우기 함수 호출
                    if (typeof triggerReminder === 'function') {
                        triggerReminder(t.content, status.remainMin);
                    }
                    state.notifiedTasks.add(taskKey);
                }
            }

            const item = document.createElement('div');
            const isMon = t.type === 'monitoring';
            const textStyle = status.isExpired 
                ? 'text-decoration: line-through; color: #777; opacity: 0.7;' 
                : 'color: #eee;';
            
            item.style.cssText = `
                background:${status.isExpired ? 'rgba(60, 60, 60, 0.1)' : (isMon ? 'rgba(59, 130, 246, 0.15)' : 'rgba(251, 191, 36, 0.15)')}; 
                border-left:4px solid ${status.isExpired ? '#555' : (isMon ? '#3b82f6' : '#fbbf24')}; 
                padding:10px; border-radius:8px; margin-bottom:8px; font-size:13px; transition: 0.3s;
                display: flex; justify-content: space-between; align-items: center;
            `;

            const displayTime = (String(timeKey).length > 10) ? String(timeKey).match(/\d{2}:\d{2}/)?.[0] : timeKey;

            item.innerHTML = `
                <div style="${textStyle} font-weight:500;">
                    <span style="color:${status.isExpired ? '#777' : '#fbbf24'}; margin-right:8px;">${displayTime || ''}</span>
                    ${t.content}
                </div>
                <div style="font-size:11px;">${status.isExpired ? '✅' : '⏳'}</div>
            `;
            container.appendChild(item);
        });
    }

    // 메시지 수신 시 처리
    taskChannel.onmessage = (e) => {
        if (e.data.type === 'TASK_UPDATE') {
            state.myTodayTasks = e.data.tasks;
            localStorage.setItem('neubie_my_tasks', JSON.stringify(e.data.tasks));
            renderTaskList(state.myTodayTasks);
        }
    };

    /* ============================================================
        SECTION 5. 줄을 서시오 & 중복 관제 완화
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
        if (!isNeubieSite) return;

        const btn = e.target.closest('div.flex.justify-center.items-center.w-full') || e.target.closest('button');
        if (!btn || btn.dataset.intercepted) return;

        const btnText = btn.innerText.trim(); // 양끝 공백만 제거
        const isTarget = (btnText === "관제 시작"); // 정확히 "관제 시작"일 때만 true
        const isAvailable = !btnText.includes("확인중") && !btnText.includes("종료");

        if (isTarget && isAvailable) {
            e.preventDefault();
            e.stopPropagation();

            const finalDelay = calculateDelay();
            const overlay = createOverlay(finalDelay);
            document.body.appendChild(overlay);

            setTimeout(() => {
                btn.dataset.intercepted = 'true';
                btn.click();

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
        SECTION 6. [수정] 스마트 네이밍 엔진 카드 생성
       ============================================================ */
    // [추가] 이름 저장/수정 함수
    function saveUserName(newName) {
        if (!newName.trim()) return;
        localStorage.setItem('neubie_user_name', newName.trim());
        syncTasksFromServer(); // 이름이 바뀌었으니 데이터를 다시 불러옴
        renderDashboard();    // UI 갱신
    }

    function createConfigCard() {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.style.cssText = "background:white; padding:15px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:10px;";

        const currentName = localStorage.getItem('neubie_user_name') || "미설정";

        card.innerHTML = `
            <div style="font-weight:bold; font-size:14px; color:#1e293b;">👤 사용자 설정</div>
            <div style="display:flex; gap:8px;">
                <input type="text" id="user-name-input" placeholder="이름 입력 (예: 안혜림)" 
                    style="flex:1; padding:6px 10px; border:1px solid #e2e8f0; border-radius:6px; font-size:13px;"
                    value="${currentName === "미설정" ? "" : currentName}">
                <button id="save-name-btn" style="background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px;">저장</button>
            </div>
            <div style="font-size:11px; color:#64748b;">현재 설정된 이름: <b id="display-name">${currentName}</b></div>
        `;

        // setTimeout 대신 card 내부 요소에 직접 접근하여 바인딩
        const btn = card.querySelector('#save-name-btn');
        const input = card.querySelector('#user-name-input');
        
        btn.onclick = () => {
            const newName = input.value.trim();
            if (newName) {
                localStorage.setItem('neubie_user_name', newName);
                console.log(`👤 사용자 변경: ${newName}`);
                syncTasksFromServer(); // 이름 변경 즉시 서버 데이터 재요청
                renderDashboard();    // UI 즉시 갱신
            }
        };

        return card;
    }

    function createNamingCard() {
        const isWknd = isWeekend();
        const card = document.createElement('div');
        card.id = 'namingSection';
        card.style.cssText = 'background:#252525; padding:15px; border-radius:15px; border:1px solid #333; margin-top:5px;';

        const history = JSON.parse(localStorage.getItem('neubie_robot_history') || '[]');
        let dropdownOptions = history.map(h => {
            const info = ROBOT_MAP[h.id] || { site: "미등록", unit: "#" + h.id };
            return `<option value="${h.id}">${info.site} ${info.unit}</option>`;
        }).join('');

        // 복사 효과 공통 함수
        const applyCopyEffect = (btn) => {
            const originalText = btn.textContent;
            const originalBg = btn.style.background || "#444";
            
            btn.textContent = '✅ 복사됨';
            btn.style.background = '#22c55e';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = originalBg;
            }, 1500);
        };

        card.innerHTML = `
            <div style="color:#3b82f6; font-weight:bold; font-size:14px; margin-bottom:10px;">🏷️ 영상 파일명 변경 도우미</div>
            <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                <select id="robotSelector" style="flex: 1.2; background: #333; color: white; border: 1px solid #555; border-radius: 4px; font-size: 12px; padding: 4px;">
                    ${dropdownOptions || '<option>최근 배달 기체 미감지</option>'}
                </select>
                <input type="text" id="taskInput" placeholder="F... 주문번호를 붙여넣으세요." style="flex: 1; background: #333; color: white; border: 1px solid #555; padding: 4px; border-radius: 4px; font-size: 12px;">
                <button id="copyFileName" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size:12px;">복사</button>
            </div>
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                <button id="btnMulti" class="sub-btn">다중 관제</button>
                ${isWknd ? `
                    <button id="btnDeli" class="sub-btn">배송 띠띠(주말)</button>
                    <button id="btnPatrol" class="sub-btn">순찰 띠띠(주말)</button>
                ` : `
                    <button id="btnCombined" class="sub-btn">배송/순찰 띠띠(평일)</button>
                `}
            </div>
        `;

        if (!document.getElementById('naming-btn-style')) {
            const style = document.createElement('style');
            style.id = 'naming-btn-style';
            style.textContent = `.sub-btn { background: #444; color: #ddd; border: 1px solid #666; padding: 6px 4px; border-radius: 6px; font-size: 12px; cursor: pointer; flex: 1; transition: 0.2s; } .sub-btn:hover { background: #555; border-color: #888; }`;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            // 1. 개별 기체 파일명 복사
            const copyBtn = card.querySelector('#copyFileName');
            if (copyBtn) {
                copyBtn.onclick = (e) => {
                    const robotId = card.querySelector('#robotSelector').value;
                    const taskRaw = card.querySelector('#taskInput').value.trim();
                    // 무엇을 입력하든 앞에 F를 붙임
                    const taskNo = taskRaw ? "_#F" + taskRaw.replace(/^F/i, "") : "";
                    const info = ROBOT_MAP[robotId] || { site: "알수없음", unit: "#000" };
                    const time = new Date();
                    const finalName = `${getFormattedDate(time)}_${getFormattedHour(time)}_${info.site}_${info.unit}${taskNo}`;
                    navigator.clipboard.writeText(finalName);
                    applyCopyEffect(e.target);
                };
            }

            // 2. 다중 관제 버튼
            const multiBtn = card.querySelector('#btnMulti');
            if (multiBtn) {
                multiBtn.onclick = (e) => {
                    const time = getCalculatedTime(10); 
                    const finalName = `${getFormattedDate(time)}_${getFormattedHour(time)}_다중관제영상`;
                    navigator.clipboard.writeText(finalName);
                    applyCopyEffect(e.target);
                };
            }

            // 3. 평일/주말 동적 버튼 이벤트
            if (isWknd) {
                const deliBtn = card.querySelector('#btnDeli');
                const patrolBtn = card.querySelector('#btnPatrol');
                
                if (deliBtn) deliBtn.onclick = (e) => {
                    // 배송 띠띠 (#171) - 10분 차감 적용
                    const time = getCalculatedTime(10);
                    const finalName = `${getFormattedDate(time)}_${getFormattedHour(time)}_부산 국립과학관_#171`;
                    navigator.clipboard.writeText(finalName);
                    applyCopyEffect(e.target);
                };
                
                if (patrolBtn) patrolBtn.onclick = (e) => {
                    // 순찰 띠띠 (#170) - 40분 차감 유지
                    const time = getCalculatedTime(40);
                    const finalName = `${getFormattedDate(time)}_${getFormattedHour(time)}_부산 국립과학관_#170`;
                    navigator.clipboard.writeText(finalName);
                    applyCopyEffect(e.target);
                };
            } else {
                const combinedBtn = card.querySelector('#btnCombined');
                if (combinedBtn) combinedBtn.onclick = (e) => {
                    // 평일 배송/순찰 합본 - 40분 차감 유지
                    const time = getCalculatedTime(40); 
                    const finalName = `${getFormattedDate(time)}_${getFormattedHour(time)}_부산 국립과학관_#171, #170`;
                    navigator.clipboard.writeText(finalName);
                    applyCopyEffect(e.target);
                };
            }
        }, 10);

        return card;
    }

    /* ============================================================
        SECTION 7. 대시보드 및 초기화
       ============================================================ */
    function renderDashboard() {
        dashboard.innerHTML = '';
        
        // 1. 헤더 컨테이너 (제목 + 성명 입력창 + X 버튼 인라인 배치)
        const headerContainer = document.createElement('div');
        headerContainer.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-right:5px;";

        const title = document.createElement('h2');
        title.textContent = "✨ 없으면 내가 만든다";
        title.style.cssText = "color:#3b82f6; font-size:18px; margin:0; font-weight:bold;";

        // 이름 입력 및 닫기 버튼 영역
        const nameArea = document.createElement('div');
        nameArea.style.cssText = "display:flex; align-items:center; gap:8px; font-size:13px; color:#64748b;";
        const currentName = localStorage.getItem('neubie_user_name') || "";
        
        nameArea.innerHTML = `
            <span>성명:</span>
            <input type="text" id="inline-name-input" value="${currentName}" placeholder="이름 입력"
                style="width:70px; border:1px solid #cbd5e1; outline:none; padding:2px 6px; 
                    font-size:13px; font-weight:bold; color:#1e293b; background:white; 
                    border-radius:4px; text-align:center;">
            <button id="all-close-btn" style="background:#ef4444; color:white; border:none; border-radius:4px; width:22px; height:22px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; font-size:14px;">✕</button>
        `;

        headerContainer.appendChild(title);
        headerContainer.appendChild(nameArea);
        dashboard.appendChild(headerContainer);

        // 이벤트 바인딩
        setTimeout(() => {
            const input = document.getElementById('inline-name-input');
            if (input) {
                input.onchange = () => {
                    const newName = input.value.trim();
                    localStorage.setItem('neubie_user_name', newName);
                    syncTasksFromServer();
                    renderDashboard();
                };
            }
            // X 버튼 클릭 시 통합 종료 실행
            const closeBtn = document.getElementById('all-close-btn');
            if (closeBtn) closeBtn.onclick = closeAllPopups;
        }, 0);

        const list = document.createElement('div');
        list.id = 'dashboard-list';
        list.style.display = "grid"; 
        list.style.gap = "12px";

        list.appendChild(createMenuCard("🗺️ 역삼/송도/성수 요기요, 성남 삼평동 맵 최적화", "흰색 마커 제거 및 대기장소 마커 회전", 'isMapOpt', 'neubie_opt_map', () => injectMapStyle()));
        list.appendChild(createMenuCard("📡 줄을 서시오", "중복 관제 완화 기능", 'isQueueOpt', 'neubie_opt_queue'));

        const storedName = localStorage.getItem('neubie_user_name') || "사용자";
        const isTaskOpen = taskPopup.style.display === 'block';
        const taskCount = (window.currentMyTasks && window.currentMyTasks.length) || 0;
        const taskDesc = taskCount > 0 ? `금일 ${taskCount}개의 배정 업무가 있습니다.` : "배정된 업무가 없습니다.";

        list.appendChild(createMenuCard(
            `📋 ${storedName}의 일일 업무`, 
            taskDesc, 
            null, null, 
            () => {
                if (taskPopup.style.display === 'none') {
                    syncTasksFromServer();
                    taskPopup.style.display = 'block';
                } else {
                    taskPopup.style.display = 'none';
                }
                renderDashboard(); 
            }, 
            isTaskOpen ? '닫기' : '열기'
        ));

        list.appendChild(createNamingCard());

        const isBatteryOpen = batteryPopup.style.display === 'block';
        list.appendChild(createMenuCard("🔋 실시간 성남시 기체 배터리 현황", "실시간으로 정보를 받아옵니다.", null, null, () => {
            toggleBattery();
            renderDashboard(); 
        }, isBatteryOpen ? '닫기' : '열기'));

        dashboard.appendChild(list);
    }

    function createMenuCard(name, desc, stateKey, storageKey, action, btnLabel = '열기') {
        const card = document.createElement('div');
        card.style.cssText = "background:#252525; padding:15px; border-radius:15px; display:flex; justify-content:space-between; align-items:center; border:1px solid #333;";
        // 제목에 margin-bottom: 4px를 추가하여 설명과의 간격을 벌림
        card.innerHTML = `
            <div style="flex:1;">
                <div style="font-weight:bold; font-size:15px; margin-bottom:4px;">${name}</div>
                <div style="font-size:12px; color:#aaa;">${desc}</div>
            </div>`;
        
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
            updateBatteryStatus(); // 열 때 데이터를 새로 가져옴 (리프레시)
            batteryPopup.style.display = 'block'; 
        } else { 
            batteryPopup.style.display = 'none'; 
        }
    }

    function closeAllPopups() {
        dashboard.style.display = 'none';
        batteryPopup.style.display = 'none';
        taskPopup.style.display = 'none';
    }

    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'KeyQ') {
            e.preventDefault();
            
            // [수정] 대시보드, 배터리, 업무 팝업 중 하나라도 열려있는지 확인
            const isAnyOpen = (dashboard.style.display === 'block' || 
                            batteryPopup.style.display === 'block' || 
                            taskPopup.style.display === 'block');
            
            if (isAnyOpen) {
                // 하나라도 열려있다면 통합 닫기 실행
                closeAllPopups();
            } else {
                // 모두 닫혀있다면 대시보드 열기
                renderDashboard(); 
                dashboard.style.display = 'block'; 
            }
        }
        
        // Alt + B (배터리) 단축키 로직
        if (e.altKey && e.code === 'KeyB') { 
            e.preventDefault(); 
            toggleBattery(); 
            if (dashboard.style.display === 'block') renderDashboard(); 
        }
    });

    document.addEventListener('click', handleControlClick, true);
    injectMapStyle();
    
    // 1. 페이지 로드 시 이름이 설정되어 있다면 즉시 한 번 동기화
    if (localStorage.getItem('neubie_user_name')) {
        syncTasksFromServer();
    }

    // 2. 백그라운드 리프레시 (1분마다 데이터만 몰래 가져옴)
    // 업무 방해를 주지 않기 위해 fetch만 수행하며, 화면 갱신은 위 sync 함수 내 안전장치에 의존함
    setInterval(() => {
        syncTasksFromServer();
    }, 60000);

})();
