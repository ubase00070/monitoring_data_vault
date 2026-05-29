(function() {
    'use strict';

    if (window.neubieEngineLoaded) return;
    window.neubieEngineLoaded = true;

    const currUrl = window.location.href;
    const isNeubieSite = currUrl.includes('go.neubie.ai');

    /* ============================================================
        SECTION 1. 상태 및 설정
       ============================================================ */
	   
	const isHandoverPage = () =>
        (location.href.includes('go.neubie.ai/ko/remote/multiple') ||
        location.href.includes('multimonitoring.vercel.app')) &&
        !location.href.includes('/driving');   
	   
    const config = {
        targetIds: ['44', '56', '65', '109'],
        batteryIds: [
            { id: '142', name: '성남판교 200', shortName: '판교 200' },
            { id: '145', name: '성남서현 201', shortName: '서현 201' },
            { id: '144', name: '성남율동 202', shortName: '율동 202' },
            { id: '143', name: '성남야탑 203', shortName: '야탑 203' }
        ],
        sheetId: "1tLo6Xeq6KJx6zW-fcw8H38jdjxyS2yre5oWY7cxky70"
    };

    // 기체 네이밍 매핑 데이터
    const ROBOT_MAP = {
        "20": { site: "송도 요기요", unit: "#013" }, // 1호기
        "86": { site: "송도 요기요", unit: "#055" }, // 2호기
        "80": { site: "송도 요기요", unit: "#091" }, // 3호기
        "29": { site: "송도 요기요", unit: "#023" }, // 4호기
        "32": { site: "송도 요기요", unit: "#026" }, // 5호기
        "87": { site: "송도 요기요", unit: "#056" }, // 6호기
        "7": { site: "송도 요기요", unit: "#043" }, // 7호기
        "57": { site: "송도 요기요", unit: "#061" }, // 8호기

        "2": { site: "송도 요기요", unit: "#081" }, // 10호기 고장
        "51": { site: "송도 요기요", unit: "#050" }, // 11호기 고장
        "71": { site: "송도 요기요", unit: "#075" }, // 15호기 고장
        "72": { site: "송도 요기요", unit: "#076" }, // 13호기
        "129": { site: "송도 요기요", unit: "#082" }, // 14호기

        "27": { site: "역삼 요기요", unit: "#021" }, // 3호기
        "152": { site: "역삼 요기요", unit: "#114" }, // 5호기
        "23": { site: "역삼 요기요", unit: "#017" }, // 11호기
        "173": { site: "역삼 요기요", unit: "#153" }, // 14호기
        "78": { site: "역삼 요기요", unit: "#086" }, // 2호기
        "153": { site: "역삼 요기요", unit: "#118" }, // 6호기
        "45": { site: "역삼 요기요", unit: "#044" }, // 9호기
        "174": { site: "역삼 요기요", unit: "#154" }, // 15호기

        "47": { site: "역삼 요기요", unit: "#046" }, // 1호기 고장
        "134": { site: "역삼 요기요", unit: "#098" }, // 4호기 고장
        "1": { site: "역삼 요기요", unit: "#016" }, // 7호기 고장
        "146": { site: "역삼 요기요", unit: "#084" }, // 12호기 고장

        "255": { site: "성수 요기요", unit: "#228" }, // 1호기
        "256": { site: "성수 요기요", unit: "#229" }, // 2호기
        "257": { site: "성수 요기요", unit: "#230" }, // 3호기
        "258": { site: "성수 요기요", unit: "#231" }, // 4호기
        "259": { site: "성수 요기요", unit: "#232" }, // 5호기
        "260": { site: "성수 요기요", unit: "#233" }, // 6호기
        "261": { site: "성수 요기요", unit: "#234" }, // 7호기
        "262": { site: "성수 요기요", unit: "#235" }, // 8호기

        "46": { site: "성남 삼평동", unit: "#045" },  // 1호기
        "53": { site: "성남 삼평동", unit: "#052" }, // 2호기
        "54": { site: "성남 삼평동", unit: "#053" }, // 3호기
        "55": { site: "성남 삼평동", unit: "#054" }, // 4호기
        "133": { site: "성남 삼평동", unit: "#087" }, // 5호기
        "132": { site: "성남 삼평동", unit: "#088" }, // 6호기
        "135": { site: "성남 삼평동", unit: "#092" }, // 7호기
        "136": { site: "성남 삼평동", unit: "#093" }, // 8호기

        "137": { site: "성남 서현동", unit: "#094" }, // 9호기
        "122": { site: "성남 서현동", unit: "#095" }, // 10호기

        "126": { site: "파주 LGD", unit: "#083" }, // 엘리 1호기
        "58": { site: "파주 LGD", unit: "#062" }, // 엘리 2호기
        "62": { site: "파주 LGD", unit: "#066" }, // 엘리 3호기
        "66": { site: "아산 스테이그린", unit: "#070" }, // 그린 1호기
        "67": { site: "아산 스테이그린", unit: "#071" }, // 그린 2호기
        "60": { site: "가평 니모 캠핌장", unit: "#064" }, // 가평 1호기
        "119": { site: "가평 니모 캠핑장", unit: "#085" }, // 가평 2호기
        "19": { site: "송도 국제캠핑장", unit: "#041" }, // 국캠 1호기
        "92": { site: "송도 국제캠핑장", unit: "#135" }, // 국캠 2호기
        "97": { site: "송도 국제캠핑장", unit: "#122" }, // 국캠 3호기
        "125": { site: "대관령 솔내음 캠핑장", unit: "#110" }, // 대관령 1호기
        "127": { site: "대관령 솔내음 캠핑장", unit: "#115" }, // 대관령 2호기
        "214": { site: "진천 힐사이드 캠핑장", unit: "#194" }, // 진천
        "99": { site: "삼성인력개발원", unit: "#124" }, // 인개원

        "158": { site: "에버랜드 장미축제", unit: "#140" }, // 에버랜드
    };

    const isAutoTarget = config.targetIds.some(id => currUrl.includes(`/monitoring/${id}`));
    const state = {
        isMapOpt: localStorage.getItem('neubie_opt_map') === 'true' || isAutoTarget,
        isQueueOpt: localStorage.getItem('neubie_opt_queue') === 'true',
        isTaskVisible: localStorage.getItem('neubie_opt_task') === 'true',
        lastBatteryData: [],
        myTodayTasks: JSON.parse(localStorage.getItem('neubie_my_tasks') || "[]"),
        insuData: null,
        attendanceData: null
    };

    const taskChannel = new BroadcastChannel('neubie_task_sync');

    /* ============================================================
        SECTION 2. 맵 최적화 코어 & 네이밍 유틸리티
       ============================================================ */
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        // 최적화 대상 URL 감지
        if (state.isMapOpt && url && (url.includes('nodes?') || url.includes('sites?') || url.includes('paths?'))) {
            // 데이터를 빈 배열로 반환하여 렌더링 방지
            return new Response(JSON.stringify({ data: [], items: [], total: 0 }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return originalFetch(...args);
    };

    function injectMapStyle() {
        // 타겟 사이트가 아니면 즉시 리턴
        const currentUrl = window.location.href;
        const isCurrentTarget = config.targetIds.some(id => currentUrl.includes(`/monitoring/${id}`));
        if (!isCurrentTarget) return;

        let style = document.getElementById('neubie-map-opt-style');
        if (!style) {
            style = document.createElement('style');
            style.id = 'neubie-map-opt-style';
            document.head.appendChild(style);
        }

        if (!state.isMapOpt) {
            style.textContent = "";
            return;
        }

        style.textContent = `
            /* [1] 노드(Path 점) 제거: 렌더링 부하의 주범 차단 */
            [data-qk^="node-marker"],
            gmp-advanced-marker:has([data-qk^="node-marker"]) {
                display: none !important;
            }

            /* [2] 대기장소 마커 반전 로직 (글자 방향 보존형) */
            gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) {
                display: block !important;
                visibility: visible !important;
                z-index: 500 !important;
            }

            /* 핀 아이콘(SVG)만 180도 회전 */
            gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) svg {
                transform: rotate(180deg) !important;
            }

            /* 레이아웃 구조만 반전시키고, 글자(span/div)의 회전은 방지 */
            gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) div.flex-col {
                display: flex !important;
                flex-direction: column-reverse !important; /* 아이콘과 글자 순서 바꿈 */
                transform: translateY(18px) !important;    /* 핀이 거꾸로 꽂히는 위치 보정 */
            }

            /* 글자(이름)는 정방향 유지 */
            gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) span,
            gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) div {
                transform: rotate(0deg) !important; 
            }

            /* [3] 기체 및 미니맵 마커 절대 보존 */
            gmp-advanced-marker:not(:has([data-qk])),
            gmp-advanced-marker:has([data-qk*="robot"]),
            div[class*="MiniMap"] gmp-advanced-marker {
                display: block !important;
                visibility: visible !important;
                z-index: 1000 !important;
            }

            /* [4] 렌더링 성능 가속 */
            .gm-style canvas { contain: strict !important; }
            aside { box-shadow: none !important; contain: layout paint !important; }
        `;
    }

    // 네이밍용 시간 보정 유틸리티
    const getFormattedDate = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}${m}${d}`;
    };
    const getFormattedHour = (dateObj) => String(dateObj.getHours()).padStart(2, '0');
    const getCalculatedTime = (offsetMinutes) => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - offsetMinutes);
        return now;
    };
    const isWeekend = () => {
        // return true;
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
            maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden'
        });
        return el;
    }

    const dashboard = createContainer('neubie-dashboard', '540px', '50%', '50%');
    const batteryPopup = createContainer('neubie-battery-popup', '380px', '20px', 'auto', '20px');

    function makeDraggable(handleEl, targetEl) {
        // handleEl: 드래그를 시작할 헤더 div
        // targetEl: 실제로 움직일 팝업 전체 div
        let isDragging = false, startX, startY, startLeft, startTop;

        handleEl.style.cursor = 'grab';

        handleEl.addEventListener('mousedown', (e) => {
            // input, button, select는 드래그 제외 — 클릭 기능 보존
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'A') return;

            isDragging = true;
            targetEl.dataset.dragging = 'true';

            // transform 제거 후 실제 픽셀 위치로 전환 (최초 1회)
            const rect = targetEl.getBoundingClientRect();
            targetEl.style.transform = 'none';
            targetEl.style.left = rect.left + 'px';
            targetEl.style.top = rect.top + 'px';
            targetEl.style.right = 'auto';

            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseFloat(targetEl.style.left);
            startTop = parseFloat(targetEl.style.top);

            handleEl.style.cursor = 'grabbing';
            e.preventDefault(); // 헤더에서만 실행 → input/button은 위에서 이미 return됨
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let newLeft = startLeft + (e.clientX - startX);
            let newTop  = startTop  + (e.clientY - startY);
            // 화면 밖 이탈 방지
            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth  - targetEl.offsetWidth));
            newTop  = Math.max(0, Math.min(newTop,  window.innerHeight - targetEl.offsetHeight));
            targetEl.style.left = newLeft + 'px';
            targetEl.style.top  = newTop  + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            targetEl.dataset.dragging = 'false';
            handleEl.style.cursor = 'grab';
        });
    }

    const injectUI = () => { 
        if (document.body) {
            document.body.append(dashboard, batteryPopup);
        } 
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectUI);
    else injectUI();

    const iframes = {};

    /* ============================================================
        SECTION 4. 배터리 및 업무 연동 로직
       ============================================================ */
    function updateBatteryStatus() {
        if (batteryPopup.dataset.dragging === 'true') return;
        batteryPopup.innerHTML = '';
        const header = document.createElement('div');
        header.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;";
        const titleB = document.createElement('b');
        titleB.textContent = "🔋 실시간 성남시 배터리";
        titleB.style.cssText = "color:#eee; font-size:18px;";
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '복사';
        // 260번 줄 수정
        Object.assign(copyBtn.style, { 
            background:'#3b82f6', color:'white', border:'none', 
            padding:'6px 14px',      // 6px 12px → 10px 20px
            borderRadius:'8px', cursor:'pointer', fontWeight:'bold', 
            fontSize:'15px',          
            transition:'0.2s', 
            width: '80px',
            flexShrink: '0',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
        });
        copyBtn.onclick = (e) => copyToClipboard(e.target);
        header.append(titleB, copyBtn);
        batteryPopup.appendChild(header);

        makeDraggable(header, batteryPopup);

        state.lastBatteryData = [];
        config.batteryIds.forEach(c => {
            // iframe이 아직 로딩 중이면 load 이벤트 후 재시도
            const ifr = iframes[c.id];
            if (ifr && ifr.contentDocument?.readyState !== 'complete') {
                ifr.addEventListener('load', () => updateBatteryStatus(), { once: true });
            }

            let batteryVal = "- %", statusText = "OFF", accentColor = "#666", statusIcon = "⚪";
            try {
                const doc = iframes[c.id]?.contentDocument || iframes[c.id]?.contentWindow.document;
                const card = doc?.querySelector('li[data-qk="robot-card"]');
                if (card) {
                    const cardText = card.innerText;
                    const batteryMatch = cardText.match(/(\d+)%/);

                    // 충전: SVG 아이콘만으로 판정 (텍스트 조건 제거)
                    const isCharging = !!card.querySelector('svg.size-10.text-tertiary-300');
                    const allSpans = [...card.querySelectorAll('span')];
                    const missionLabelIdx = allSpans.findIndex(s => s.textContent.trim() === '임무 진행');
                    const missionValue = missionLabelIdx !== -1
                        ? allSpans[missionLabelIdx + 1]?.textContent?.trim()
                        : '';
                    const isPatrolling = missionValue === '순찰';
                    if (batteryMatch) {
                        batteryVal = batteryMatch[0];
                        if (isPatrolling) { accentColor = "#3b82f6"; statusIcon = "🔵"; statusText = "순찰 중"; }
                        else if (isCharging) { accentColor = "#22c55e"; statusIcon = "🟢"; statusText = "충전 중"; }
                        else { accentColor = "#888888"; statusIcon = "⚪"; statusText = "대기 중"; }
                    }
                }
            } catch (e) {}
            state.lastBatteryData.push({ shortName: c.shortName, battery: batteryVal, statusText: statusText });
            const item = document.createElement('div');
            item.style.cssText = `
                display:flex; 
                justify-content:space-between; 
                align-items:center; /* 세로 정렬 맞춤 */
                background:rgba(255,255,255,0.05); 
                padding:15px 20px; /* 패딩을 늘려 높이를 확보 */
                border-radius:12px; 
                margin-bottom:10px; 
                border-left:5px solid ${accentColor};
                font-size: 16px !important; /* 전체 글씨 크기 (성남판교 200 등) */
            `;
            item.innerHTML = `
                <span style="font-weight:500;">${statusIcon} ${c.name}</span>
                <span style="font-weight:bold; color:${accentColor}; font-size: 20px;">${batteryVal}</span>
            `;
            batteryPopup.appendChild(item);
        });
    }

    function copyToClipboard(btn) {
        const now = new Date();
        let hour = now.getHours();
        if (now.getMinutes() >= 50) hour = (hour + 1) % 24;
        let copyText = `[${String(hour).padStart(2, '0')}시 성남 기체 배터리 현황]\n`;
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
    function syncTasksFromServer() {
        const myName = localStorage.getItem('neubie_user_name');
        if (!myName) return;

        const dataUrl = `https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/daily_tasks.json`;
        const insuUrl = `https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/insu_data.json`;
        const attendanceUrl = `https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/attendance_may2026.json`;

        // daily_tasks + insu_data 병렬 fetch
        Promise.all([
            fetch(dataUrl, {cache: 'no-store'}).then(r => r.json()),
            fetch(insuUrl, {cache: 'no-store'}).then(r => r.json()),
            fetch(attendanceUrl, {cache: 'no-store'}).then(r => r.json())
        ]).then(([data, insu, attendance]) => {
            state.insuData = insu;
            state.attendanceData = attendance;

            const myTasks = data.filter(t => {
                if (t.user !== myName) return false;
                // tomorrow_07 타입은 00:00~07:10 사이에만 표시
                if (t.type === 'tomorrow_07') {
                    return new Date().getHours() < 7;
                }
                return true;
            });
            window.currentMyTasks = myTasks;
            checkAndTriggerNotifications(myTasks);

            renderTaskList(myTasks);
        }).catch(err => console.log("Sync failed"));
    }

    // 레이아웃 노출 여부와 상관없이 알림만 전담하는 함수
    function checkAndTriggerNotifications(tasks) {
        const interval = parseInt(localStorage.getItem('neubie_remind_int') || '0');
        if (interval === 0) return;

        tasks.forEach(t => {
            const timeKey = t.rawTime || t.time;
            const status = getTaskStatus(timeKey); 
            
            const isMultiMon = t.content && t.content.includes("다중 모니터링");
            const targetInterval = isMultiMon ? (interval + 10) : interval;

            if (status.remainMin === targetInterval) {
                const taskKey = `${t.content}_${timeKey}_${targetInterval}`;
                const storageKey = `neubie_notified_${taskKey}`;
                const notifiedCount = parseInt(localStorage.getItem(storageKey) || '0');

                if (notifiedCount < 2) {
                    const displayMin = isMultiMon ? status.remainMin - 10 : status.remainMin;
                    triggerReminder(t.content, displayMin);
                    localStorage.setItem(storageKey, String(notifiedCount + 1));

                    const now = new Date();
                    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
                    setTimeout(() => localStorage.removeItem(storageKey), msUntilMidnight);
                }
            }
        });
    }

    /* ============================================================
        SECTION 4-2 시간 계산 및 상태 판단 (통합 버전)
       ============================================================ */
    function getTaskStatus(rawTime, isMonitoring) {
        const times = String(rawTime).match(/\d{2}:\d{2}/g);
        if (!times) return { isExpired: false, remainMin: 999, score: 0 };
        
        const now = new Date();
        const startTimeStr = times[0];
        const endTimeStr = times[times.length - 1];

        const [sH, sM] = startTimeStr.split(':').map(Number);
        const [eH, eM] = endTimeStr.split(':').map(Number);
        
        // 07시 기준 상대 점수 계산 (자정 전후 시간 역전 방지)
        const getRelativeScore = (h, m) => {
            let relHour = h - 7;
            if (relHour < 0) relHour += 24;
            return relHour * 60 + m;
        };

        const currScore = getRelativeScore(now.getHours(), now.getMinutes());
        const startScore = getRelativeScore(sH, sM);
        const endScore = getRelativeScore(eH, eM);

        let remainMin = startScore - currScore;
        
        // 다중 모니터링은 10분 일찍 알림이 오도록 계산
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

    // 리마인더 알림창 생성 함수
    function triggerReminder(content, remainMin) {
        const notifType = localStorage.getItem('neubie_notif_type') || 'type1';

        // ── Type 1: 점멸 ──────────────────────────────────────────
        if (notifType === 'type1') {
            if (!document.getElementById('neubie-alarm-style')) {
                const s = document.createElement('style');
                s.id = 'neubie-alarm-style';
                s.textContent = `
                    @keyframes neubie-alarm-blink {
                        0%, 100% { border-color: #000; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                        50% { border-color: #ff0000; box-shadow: 0 0 30px rgba(255,0,0,0.9); }
                    }
                    @keyframes neubie-fadein {
                        from { opacity:0; transform:translateX(-50%) translateY(-10px); }
                        to   { opacity:1; transform:translateX(-50%) translateY(0); }
                    }
                `;
                document.head.appendChild(s);
            }
            const alarmDiv = document.createElement('div');
            alarmDiv.style.cssText = `
                position:fixed; top:20px; left:50%; transform:translateX(-50%);
                background:linear-gradient(135deg,#fbbf24,#f59e0b);
                color:#000; padding:15px 30px; border-radius:14px;
                z-index:9999999; font-weight:bold; font-size:16px;
                border:3px solid #000; display:flex; align-items:center; gap:10px;
                box-shadow:0 8px 30px rgba(0,0,0,0.5);
                animation:neubie-fadein 0.3s ease, neubie-alarm-blink 0.5s step-end 0.3s infinite;
            `;
            alarmDiv.innerHTML = `⚠️ <b>[업무 알림]</b> ${content} 시작 ${remainMin}분 전입니다!`;
            document.body.appendChild(alarmDiv);
            setTimeout(() => {
                alarmDiv.style.opacity = '0';
                alarmDiv.style.transition = '0.5s';
                setTimeout(() => alarmDiv.remove(), 500);
            }, 7000);

        // ── Type 2: 지하철 자막 (좌→우) ─────────────────────────
        } else {
            if (!document.getElementById('neubie-ticker-style')) {
                const s = document.createElement('style');
                s.id = 'neubie-ticker-style';
                s.textContent = `
                    @keyframes neubie-ticker {
                        0%   { left: -100%; }
                        100% { left: 110%; }
                    }
                `;
                document.head.appendChild(s);
            }
            const bar = document.createElement('div');
            bar.style.cssText = `
                position:fixed; top:20px; left:-100%;
                background:linear-gradient(90deg,#1e3a5f,#2563eb,#1e3a5f);
                color:#fff; padding:13px 40px; border-radius:10px;
                z-index:9999999; font-weight:bold; font-size:16px;
                white-space:nowrap; letter-spacing:0.03em;
                box-shadow:0 4px 20px rgba(37,99,235,0.5);
                border-left:4px solid #60a5fa; border-right:4px solid #60a5fa;
                animation:neubie-ticker 10s linear forwards;
            `;
            bar.innerHTML = `🚇 &nbsp;[업무 알림]&nbsp; ${content} 시작 ${remainMin}분 전입니다!`;
            document.body.appendChild(bar);
            setTimeout(() => bar.remove(), 10200);
        }
    }

    /* ============================================================
    SECTION 4-3. UI 렌더링 및 07시 기준 정렬/알림 제어
   ============================================================ */
    function renderTaskList(tasks) {
        const currentInt = localStorage.getItem('neubie_remind_int') || '0';

        // 07시 기준 상대 시간 및 상태 계산 함수
        function getTaskStatus(rawTime) {
            if (!rawTime) return { isExpired: false, remainMin: -1, score: 0 };

            const now = new Date();
            // 문자열에서 시간(HH:mm)만 추출
            const timeMatch = String(rawTime).match(/\d{2}:\d{2}/);
            if (!timeMatch) return { isExpired: false, remainMin: -1, score: 0 };

            const [tHour, tMin] = timeMatch[0].split(':').map(Number);

            // 07시 기준 Relative Score 계산 (07:00 -> 0점, 익일 06:00 -> 1380점)
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

        // 노이즈 제거 및 07시 기준 정렬
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

        // 헤더 및 설정 UI 렌더링 — inline-task-container 사용
        const inlineContainer = document.getElementById('inline-task-container');
        if (inlineContainer) inlineContainer.innerHTML = '';
        const container = inlineContainer || document.createElement('div'); // fallback

        if (validTasks.length === 0) {
            if (inlineContainer) inlineContainer.innerHTML = `<div style="color:#666; ...">배정된 업무가 없습니다.</div>`;
            return;
        }

        // 리스트 생성 및 특수 알림 로직 적용
        validTasks.forEach(t => {
            const timeKey = t.rawTime || t.time;
            const interval = parseInt(localStorage.getItem('neubie_remind_int') || '0');

            // 다중 모니터링 업무 전용 오프셋 (+10분)
            const isMultiMon = t.content && t.content.includes("다중 모니터링");
            const targetInterval = isMultiMon ? (interval + 10) : interval;

            const item = document.createElement('div');
            const isMon = t.type === 'monitoring' || t.type === 'tomorrow_07';
            const status = t.type === 'tomorrow_07'
                ? { isExpired: false, remainMin: 999, score: 0 }
                : getTaskStatus(timeKey, isMon);
            const textStyle = status.isExpired 
                ? 'text-decoration: line-through; color: #777; opacity: 0.7;' 
                : 'color: #eee;';
            
            item.style.cssText = `
                background:${status.isExpired ? 'rgba(60, 60, 60, 0.1)' : (isMon ? 'rgba(59, 130, 246, 0.15)' : 'rgba(251, 191, 36, 0.15)')};
                border-left:4px solid ${status.isExpired ? '#555' : (isMon ? '#3b82f6' : '#fbbf24')};
                padding:10px; border-radius:8px; margin-bottom:8px; font-size:16px; transition: 0.3s;
                display: grid;
                grid-template-columns: auto 1fr auto;
                align-items: center;
                gap: 6px;
                overflow: hidden;
            `;

            const displayTime = (String(timeKey).length > 10) ? String(timeKey).match(/\d{2}:\d{2}/)?.[0] : timeKey;

            const needsMarquee = t.content.length > 40;
            const contentSpan = needsMarquee
                ? `<span class="marquee-text" style="${textStyle}">${t.content}</span>`
                : `<span style="${textStyle}">${t.content}</span>`;

            item.innerHTML = `
                <span style="color:${status.isExpired ? '#777' : '#fbbf24'}; white-space:nowrap;">${displayTime || ''}</span>
                <div class="marquee-wrap" style="${textStyle} font-weight:500;">
                    ${contentSpan}
                </div>
                <div style="font-size:14px; white-space:nowrap;">${status.isExpired ? '✅' : '⏳'}</div>
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

    const personnelData = [
        { name: "김지훈", time: "(0700-1600)(U)", break: "(1100-1200)" }, 
        { name: "오정훈", time: "(0700-1600)(U)", break: "(1100-1200)" }, 
        { name: "박계원", time: "(0700-1600)(U)", break: "(1100-1200)" }, 
        { name: "김경환", time: "(0800-1700)(U)", break: "(1200-1300)" }, 
        { name: "박효선", time: "(0800-1700)(U)", break: "(1200-1300)" }, 
        { name: "안혜림", time: "(0900-1800)(U)", break: "(1300-1400)" }, 
        { name: "이환", time: "(0900-1800)(U)", break: "(1300-1400)" }, 
        { name: "최윤혁", time: "(0900-1800)(U)", break: "(1300-1400)" }, 
        { name: "신현철", time: "(0900-1800)(U)", break: "(1300-1400)" },
        { name: "김동진", time: "(0900-1800)(U)", break: "(1300-1400)" }, 
        { name: "석승찬", time: "(1000-1900)(U)", break: "(1400-1500)" },
        { name: "이준", time: "(1000-1900)(U)", break: "(1400-1500)" },
        { name: "한승완", time: "(1000-1900)(U)", break: "(1400-1500)" },
        { name: "박은선", time: "(1100-2000)(U)", break: "(1400-1500)" }, 
        { name: "송주현", time: "(1100-2000)(U)", break: "(1500-1600)" }, 
        { name: "송태영", time: "(1100-2000)(U)", break: "(1500-1600)" },
        { name: "신은정", time: "(1100-2000)(U)", break: "(1500-1600)" }, 
        { name: "호덕진", time: "(1100-2000)(U)", break: "(1500-1600)" },
        { name: "장재원", time: "(1100-2000)(U)", break: "(1500-1600)" }, 
        { name: "박효빈", time: "(1400-2300)(U)", break: "(1700-1800)" }, 
        { name: "이기완", time: "(1400-2300)(U)", break: "(1700-1800)" },
        { name: "권재윤", time: "(1400-2300)(U)", break: "(1700-1800)" },
        { name: "김가은", time: "(1500-2400)(U)", break: "(1800-1900)" }, 
        { name: "서형민", time: "(1500-2400)(U)", break: "(1800-1900)" }, 
        { name: "최성환", time: "(1500-2400)(U)", break: "(1800-1900)" }, 
        { name: "이규순", time: "(1800-0300)(U)", break: "(2200-2300)" }, 
        { name: "강철환", time: "(1800-0300)(U)", break: "(2200-2300)" }, 
        { name: "박수연", time: "(1800-0300)(U)", break: "(2200-2300)" }, 
        { name: "신지섭", time: "(1800-0300)(U)", break: "(2300-2400)" },
        { name: "최선호", time: "(2000-0500)(U)", break: "(2300-2400)" }, 
        { name: "최정기", time: "(2000-0500)(U)", break: "(2300-2400)" }, 
        { name: "고상연", time: "(2000-0500)(U)", break: "(2300-2400)" }, 
        { name: "김소연", time: "(2200-0700)(U)", break: "(0100-0200)" }, 
        { name: "임다연", time: "(2200-0700)(U)", break: "(0200-0300)" }, 
        { name: "임아연", time: "(2200-0700)(U)", break: "(0300-0400)" }, 
        { name: "안대관", time: "(2330-0830)(U)", break: "(0400-0500)" }
    ];
    
    function injectConfigUI() {
        // 이미 스타일이 존재하면 중복 생성 방지
        if (document.getElementById('neubie-engine-popup-style')) return;

        const style = document.createElement('style');
        style.id = 'neubie-engine-popup-style';
        style.innerHTML = `
            /* 딜레이 안내 팝업 스타일 */
                .marquee-wrap {
                    overflow: hidden;
                    flex: 1;
                    min-width: 0;
                    white-space: nowrap;
                }
                .marquee-text {
                    display: inline-block;
                    white-space: nowrap;
                    animation: marquee-scroll 18s linear 2s infinite;
                }
                .marquee-static {
                    display: inline-block;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }
                @keyframes marquee-scroll {
                    0%   { transform: translateX(0); }
                    40%  { transform: translateX(-50%); }
                    60%  { transform: translateX(-50%); }
                    100% { transform: translateX(0); }
                }
        `;
        document.head.appendChild(style);
    }

    /* ============================================================
    SECTION 6. 개입카드 중복 감지 엔진
    ============================================================ */

    // ─ 브릿지 변수 ─────────────────────────────────────────────
    let pendingOverlapNames = []; // 클릭 시점에 스냅샷한 타인 이름들
    let cameFromIntervention = false; // 관제 시작 버튼으로 진입했는가
    let seenBadgeNames = new Set(); // driving 체류 중 누적된 뱃지 이름들
    let badgeWatchInterval = null;

    // ─ driving 페이지 진입 시 뱃지 누적 감시 시작 ───────────────
    function startBadgeWatch() {
        if (badgeWatchInterval) return;
        seenBadgeNames.clear();

        badgeWatchInterval = setInterval(() => {
            if (!location.href.includes('/driving')) {
                stopBadgeWatch();
                return;
            }
            // ⚠️ 선택자 미확정 — 출근 후 콘솔 확인 필요
            // 확인 방법: 개입카드 뜬 상태에서 콘솔에 아래 실행
            // [...document.querySelectorAll('*')].filter(el => el.children.length === 0 && /^[가-힣]{1,4}$/.test(el.textContent.trim())).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent.trim(), title: el.title, aria: el.getAttribute('aria-label') }))
            const BADGE_SELECTOR = 'FIXME'; // ← 여기에 확인된 선택자 입력
            
            if (BADGE_SELECTOR === 'FIXME') return; // 선택자 미입력 시 안전하게 스킵

            document.querySelectorAll(BADGE_SELECTOR).forEach(el => {
                // title > aria-label > textContent 순서로 전체 이름 시도
                const name = el.title?.trim() 
                    || el.getAttribute('aria-label')?.trim() 
                    || el.textContent?.trim();
                if (name && /[가-힣]/.test(name)) seenBadgeNames.add(name);
            });
        }, 300);
    }

    function stopBadgeWatch() {
        clearInterval(badgeWatchInterval);
        badgeWatchInterval = null;
    }

    // ─ executeIntervention (기존 유지) ───────────────────────────
    function executeIntervention(btn) {
        btn.dataset.intercepted = 'true';
        btn.click();
        setTimeout(() => { delete btn.dataset.intercepted; }, 200);
    }

    // ─ handleControlClick — 순열 제거, 스냅샷만 ─────────────────
    function handleControlClick(e) {
        const targetBtn = e.target.closest('button');
        if (!targetBtn || targetBtn.innerText.trim() !== '관제 시작') return;
        if (targetBtn.dataset.intercepted) return;

        const myName = localStorage.getItem('neubie_user_name') || '';

        // driving 체류 중 누적된 뱃지에서 내 이름 제외
        pendingOverlapNames = [...seenBadgeNames].filter(name => {
            // title/aria-label로 전체 이름이 잡혔을 때: 정확히 비교
            if (name.length > 1) return name !== myName;
            // 성씨 1글자만 잡혔을 때: 내 성씨와 다른 것만
            return name !== myName[0];
        });

        cameFromIntervention = true; // 플래그 ON
        executeIntervention(targetBtn); // 딜레이 없이 즉시 실행
    }

    // ─ 중복 배너 표시 ────────────────────────────────────────────
    function showOverlapBanner(names) {
        let banner = document.getElementById('neubie-overlap-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'neubie-overlap-banner';
            banner.style.cssText = `
                position: fixed;
                top: 64px; left: 50%;
                transform: translateX(-50%);
                background: rgba(220, 38, 38, 0.96);
                color: white;
                padding: 14px 32px;
                border-radius: 14px;
                z-index: 2147483647;
                font-family: Pretendard, sans-serif;
                font-weight: bold;
                font-size: 17px;
                box-shadow: 0 6px 30px rgba(220,38,38,0.5);
                border: 2px solid #fca5a5;
                pointer-events: none;
                text-align: center;
                line-height: 1.6;
                animation: neubie-fadein 0.3s ease;
            `;
            document.body.appendChild(banner);
        }
        const nameText = names.join(', ');
        banner.innerHTML = `⚠️ <b>${nameText}</b>와(과) 중복 개입 중입니다`;

        clearTimeout(banner._hideTimer);
        banner._hideTimer = setTimeout(() => {
            banner.style.transition = 'opacity 0.5s';
            banner.style.opacity = '0';
            setTimeout(() => banner.remove(), 500);
        }, 6000);
    }

    /* ============================================================
        SECTION 7. 스마트 네이밍 엔진 카드 생성
       ============================================================ */
    function createNamingCard() {
        const isWknd = isWeekend();
        const card = document.createElement('div');
        card.id = 'namingSection';
        card.style.cssText = 'background:#252525; padding:10px 15px; border-radius:15px; border:1px solid #333; margin-top:5px;';

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
            <div style="color:#3b82f6; font-weight:bold; font-size:18px; margin-bottom:10px;">🏷️ 영상 파일명 생성기 (날짜/시각 자동 반영)</div>
            <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                <select id="robotSelector" style="flex: 1.2; background: #333; color: white; border: 1px solid #555; border-radius: 4px; font-size: 15px; padding: 4px;">
                    ${dropdownOptions || '<option>최근 배달 기체 미감지</option>'}
                </select>
                <input type="text" id="taskInput" placeholder="주문번호를 붙여넣으세요." style="flex: 0 1 160px; background: #333; color: white; border: 1px solid #555; padding: 4px; border-radius: 4px; font-size: 15px;">
                <button id="copyFileName" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size:15px;">복사</button>
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
            style.textContent = `.sub-btn { background: #444; color: #ddd; border: 1px solid #666; padding: 6px 4px; border-radius: 6px; font-size: 15px; cursor: pointer; flex: 1; transition: 0.2s; } .sub-btn:hover { background: #555; border-color: #888; }`;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            // 개별 기체 파일명 복사
            const copyBtn = card.querySelector('#copyFileName');
            if (copyBtn) {
                copyBtn.onclick = (e) => {
                    const robotId = card.querySelector('#robotSelector').value;
                    const taskRaw = card.querySelector('#taskInput').value.trim();
                    const taskNo = taskRaw ? "_#" + taskRaw : "";
                    const info = ROBOT_MAP[robotId] || { site: "알수없음", unit: "#000" };
                    const time = new Date();
                    const finalName = `${getFormattedDate(time)}_${getFormattedHour(time)}_${info.site}_${info.unit}${taskNo}`;
                    navigator.clipboard.writeText(finalName);
                    applyCopyEffect(e.target);
                };
            }

            // 다중 관제 버튼
            const multiBtn = card.querySelector('#btnMulti');
            if (multiBtn) {
                multiBtn.onclick = (e) => {
                    const time = getCalculatedTime(10); 
                    const finalName = `${getFormattedDate(time)}_${getFormattedHour(time)}_다중모니터링`;
                    navigator.clipboard.writeText(finalName);
                    applyCopyEffect(e.target);
                };
            }

            // 평일/주말 동적 버튼 이벤트
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
        SECTION 8. 대시보드 및 초기화
       ============================================================ */
    function renderDashboard() {
        dashboard.innerHTML = '';
        
        // 헤더 컨테이너 (제목 + 성명 입력창 + X 버튼 인라인 배치)
        const headerContainer = document.createElement('div');
        headerContainer.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-right:5px;";

        const title = document.createElement('h2');
        title.textContent = "🫠 없으면 만들지 뭐";
        title.style.cssText = "color:#3b82f6; font-size:20px; margin:0; font-weight:bold; white-space:nowrap;";

        // 패치노트 버튼
        const patchBtn = document.createElement('button');
        patchBtn.textContent = '패치노트';
        patchBtn.title = '패치노트';
        patchBtn.style.cssText = `
            background:transparent; border:1px solid #555; color:#aaa;
            border-radius:6px; padding:2px 6px; cursor:pointer;
            font-size:12px; margin-left:6px; vertical-align:middle;
            transition:all 0.2s;
            animation: neubie-blink 1.5s ease-in-out infinite;
        `;
        patchBtn.onmouseenter = () => { patchBtn.style.borderColor='#3b82f6'; patchBtn.style.color='#3b82f6'; };
        patchBtn.onmouseleave = () => { patchBtn.style.borderColor='#555'; patchBtn.style.color='#aaa'; };
        patchBtn.onclick = () => {
            let patchOverlay = document.getElementById('neubie-patch-overlay');
            if (!patchOverlay) {
                patchOverlay = document.createElement('div');
                patchOverlay.id = 'neubie-patch-overlay';
                patchOverlay.style.cssText = `
                    position:fixed; inset:0; background:transparent; pointer-events:none;
                    z-index:2147483646; display:flex; align-items:center; justify-content:center;
                    font-family:Pretendard, sans-serif;
                `;
                const patchBox = document.createElement('div');
                patchBox.style.cssText = `
                    background:#1e1e2e; color:#e2e8f0; border-radius:18px; pointer-events:auto;
                    border:1.5px solid #3b82f6; padding:28px 32px 24px 32px;
                    max-width:560px; width:90%; max-height:80vh; overflow-y:auto;
                    position:relative; box-shadow:0 10px 50px rgba(0,0,0,0.7);
                `;
                const patchTitle = document.createElement('div');
                patchTitle.textContent = '📋 패치노트';
                patchTitle.style.cssText = `font-size:20px; font-weight:bold; margin-bottom:20px; color:#60a5fa;`;
                const patchClose = document.createElement('button');
                patchClose.textContent = '✕';
                patchClose.style.cssText = `
                    position:absolute; top:16px; right:18px;
                    background:transparent; border:none; color:#aaa;
                    font-size:20px; cursor:pointer; padding:4px 8px; border-radius:6px;
                `;
                patchClose.onmouseenter = () => { patchClose.style.color='#fff'; };
                patchClose.onmouseleave = () => { patchClose.style.color='#aaa'; };
                patchClose.onclick = () => { patchOverlay.style.display='none'; };

                // ── 패치노트 내용 ──────────────────────────────────────
                // 아래 patchItems 배열에 버전별 내용을 추가하세요
                const patchItems = [
                    {
                        version: 'v1.1',
                        date: '2026-05-24',
                        items: [
                            '크롬에서 맵 최적화 체크 시, 새로고침 없이 즉시 적용',
                            '줄을 서시오 레이아웃 미표시 해결',
                            '알림 타입1 & 2, 알림 테스트 기능 추가',
                            '명일 07시 다중 임무는 자정 이후 표기됨(07시 출근자에만 해당)',
                        ]
                    },
                ];
                // ────────────────────────────────────────────────────────

                const patchContent = document.createElement('div');
                patchContent.style.cssText = "display:grid; gap:16px;";
                patchItems.forEach(patch => {
                    const section = document.createElement('div');
                    section.style.cssText = "background:#252535; border:1px solid #333; border-radius:12px; padding:14px 16px;";
                    const versionRow = document.createElement('div');
                    versionRow.style.cssText = "display:flex; align-items:center; gap:8px; margin-bottom:10px;";
                    versionRow.innerHTML = `
                        <span style="font-size:15px; font-weight:bold; color:#60a5fa;">${patch.version}</span>
                        <span style="font-size:12px; color:#666;">${patch.date}</span>
                    `;
                    const itemList = document.createElement('ul');
                    itemList.style.cssText = "margin:0; padding-left:18px; display:grid; gap:6px;";
                    patch.items.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item;
                        li.style.cssText = "font-size:13px; color:#cbd5e1; line-height:1.5;";
                        itemList.appendChild(li);
                    });
                    section.appendChild(versionRow);
                    section.appendChild(itemList);
                    patchContent.appendChild(section);
                });

                patchBox.appendChild(patchClose);
                patchBox.appendChild(patchTitle);
                patchBox.appendChild(patchContent);
                patchOverlay.appendChild(patchBox);
                const r = dashboard.getBoundingClientRect();
                patchOverlay.style.position = 'fixed';
                patchOverlay.style.top = r.top + 'px';
                patchOverlay.style.left = r.left + 'px';
                patchOverlay.style.width = r.width + 'px';
                patchOverlay.style.height = r.height + 'px';
                document.body.appendChild(patchOverlay);
            } else {
                const r = dashboard.getBoundingClientRect();
                patchOverlay.style.top = r.top + 'px';
                patchOverlay.style.left = r.left + 'px';
                patchOverlay.style.width = r.width + 'px';
                patchOverlay.style.height = r.height + 'px';
                patchOverlay.style.display = 'flex';
            }
        };

        // 이름 입력 및 닫기 버튼 영역
        const nameArea = document.createElement('div');
        nameArea.style.cssText = "display:flex; align-items:center; gap:8px; font-size:15px; color:#64748b;";
        const currentName = localStorage.getItem('neubie_user_name') || "";
        
        nameArea.innerHTML = `
            <span>성명:</span>
            <input type="text" id="inline-name-input" value="${currentName}" placeholder="이름 입력"
                style="width:70px; border:1px solid #cbd5e1; outline:none; padding:2px 6px; 
                    font-size:15px; font-weight:bold; color:#1e293b; background:white; 
                    border-radius:4px; text-align:center;">
            <button id="all-close-btn" style="background:#ef4444; color:white; border:none; border-radius:4px; width:22px; height:22px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; font-size:14px;">✕</button>
        `;

        const titleWrap = document.createElement('div');
        titleWrap.style.cssText = "display:flex; align-items:center; gap:0;";
        titleWrap.appendChild(title);
        titleWrap.appendChild(patchBtn);
        headerContainer.appendChild(titleWrap);
        headerContainer.appendChild(nameArea);
        dashboard.appendChild(headerContainer);

        makeDraggable(headerContainer, dashboard);

        // 이벤트 바인딩
        setTimeout(() => {
            // 이름 입력창 로직
            const input = document.getElementById('inline-name-input');
            if (input) {
                input.onchange = () => {
                    const newName = input.value.trim();
                    localStorage.setItem('neubie_user_name', newName);
                    
                    // 이름 저장 시 현재 선택된 알림 시간도 강제로 한 번 더 저장
                    const intervalSelect = document.getElementById('remind-interval');
                    if (intervalSelect) {
                        localStorage.setItem('neubie_remind_int', intervalSelect.value);
                    }

                    syncTasksFromServer();
                    renderDashboard();
                };
            }

            // 알림 설정 드롭다운 선택 시 즉시 저장 로직
            const intervalSelect = document.getElementById('remind-interval');
            if (intervalSelect) {
                // 드롭다운 값이 바뀔 때마다 실행
                intervalSelect.onchange = () => {
                    const selectedValue = intervalSelect.value;
                    localStorage.setItem('neubie_remind_int', selectedValue);
                    
                    // 시각적 피드백 (선택하면 잠시 노랗게 변했다가 돌아옴)
                    intervalSelect.style.backgroundColor = '#fef9c3'; 
                    setTimeout(() => { intervalSelect.style.backgroundColor = 'white'; }, 300);
                    
                };
            }

            const remindInline = document.getElementById('remind-inline');
            if (remindInline) {
                remindInline.onchange = (e) => {
                    localStorage.setItem('neubie_remind_int', e.target.value);
                };
            }

            // X 버튼 클릭 시 통합 종료 실행
            const closeBtn = document.getElementById('all-close-btn');
            if (closeBtn) closeBtn.onclick = closeAllPopups;
        }, 0);

        const list = document.createElement('div');
        list.id = 'dashboard-list';
        list.style.cssText = "display:grid; gap:12px;";

        // 1. 업무 알림 설정 (태스크 리스트 인라인 삽입)
        const taskCard = document.createElement('div');
        taskCard.style.cssText = "background:#252525; padding:15px; border-radius:15px; border:1px solid #333;";
        const storedName = localStorage.getItem('neubie_user_name') || "사용자";
        const currentInt = localStorage.getItem('neubie_remind_int') || '0';
        taskCard.innerHTML = `
            <div style="margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px; flex-wrap:nowrap;">
				    <div style="font-weight:bold; font-size:17px; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📋 ${storedName}의 일일 업무</div>
				    <button id="btn-type1" style="padding:3px 8px; border-radius:20px; font-size:11px; font-weight:bold; cursor:pointer; border:2px solid #f59e0b; background:#f59e0b; color:#000;">알림1</button>
				    <button id="btn-type2" style="padding:3px 8px; border-radius:20px; font-size:11px; font-weight:bold; cursor:pointer; border:2px solid #2563eb; background:transparent; color:#60a5fa;">알림2</button>
				    <select id="remind-inline" style="background:#333; color:white; border:1px solid #555; font-size:13px; border-radius:4px; padding:2px;">
				        <option value="0" ${currentInt === '0' ? 'selected' : ''}>알림 없음</option>
				        <option value="3" ${currentInt === '3' ? 'selected' : ''}>3분 전(다중은 13분 전)</option>
				        <option value="5" ${currentInt === '5' ? 'selected' : ''}>5분 전(다중은 15분 전)</option>
				    </select>
				</div>
            </div>
        `;
        // 알림 타입 토글 + Test 버튼 이벤트
        setTimeout(() => {
            const savedType = localStorage.getItem('neubie_notif_type') || 'type1';
            const btn1 = document.getElementById('btn-type1');
            const btn2 = document.getElementById('btn-type2');
            if (!btn1 || !btn2) return;

            function applyTypeUI(type) {
                if (type === 'type1') {
                    // type1 ON
                    btn1.style.background = '#f59e0b';
                    btn1.style.borderColor = '#f59e0b';
                    btn1.style.color = '#000';
                    btn1.style.opacity = '1';
                    // type2 OFF
                    btn2.style.background = 'transparent';
                    btn2.style.borderColor = '#555';
                    btn2.style.color = '#555';
                    btn2.style.opacity = '0.45';
                } else {
                    // type2 ON
                    btn2.style.background = '#2563eb';
                    btn2.style.borderColor = '#2563eb';
                    btn2.style.color = '#fff';
                    btn2.style.opacity = '1';
                    // type1 OFF
                    btn1.style.background = 'transparent';
                    btn1.style.borderColor = '#555';
                    btn1.style.color = '#555';
                    btn1.style.opacity = '0.45';
                }
            }
            applyTypeUI(savedType);

            btn1.onclick = () => {
                localStorage.setItem('neubie_notif_type', 'type1');
                applyTypeUI('type1');
            };
            btn2.onclick = () => {
                localStorage.setItem('neubie_notif_type', 'type2');
                applyTypeUI('type2');
            };
        }, 0);
		
        const taskInline = document.createElement('div');
        taskInline.id = 'inline-task-container';
        taskCard.appendChild(taskInline);
        list.appendChild(taskCard);

        // syncTasksFromServer 결과를 인라인 컨테이너에 렌더링
        if (window.currentMyTasks && window.currentMyTasks.length > 0) {
            renderTaskList(window.currentMyTasks);
        } else {
            taskInline.innerHTML = `<div style="color:#666; font-size:14px; padding:8px 0;">배정된 업무가 없습니다.</div>`;
        }

        // 2. 맵 최적화 + 줄을 서시오 반반 행
        const twoCol = document.createElement('div');
        twoCol.style.cssText = "display:grid; grid-template-columns:1fr 1fr; gap:12px;";

        // 맵 최적화 (체크박스, 멘트 없이 이름만)
        const mapCard = document.createElement('div');
        mapCard.style.cssText = "background:#252525; padding:8px 12px; border-radius:15px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;";
        mapCard.innerHTML = `<span style="font-weight:bold; font-size:15px;">🗺️ 요기요/삼평동 맵 최적화</span>`;
        const mapChk = document.createElement('input');
        mapChk.type = 'checkbox'; mapChk.checked = state.isMapOpt;
        mapChk.style.cssText = "width:18px; height:18px; cursor:pointer;";
        mapChk.onchange = (e) => {
            state.isMapOpt = e.target.checked;
            localStorage.setItem('neubie_opt_map', state.isMapOpt);
            injectMapStyle();
        };
        mapCard.appendChild(mapChk);
        twoCol.appendChild(mapCard);

        // 줄을 서시오 (체크박스, 멘트 없이 이름만)
        const queueCard = document.createElement('div');
        queueCard.style.cssText = "background:#252525; padding:8px 12px; border-radius:15px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;";
        queueCard.innerHTML = `<span style="font-weight:bold; font-size:15px;">👁 중복 개입 감지</span>`;
        const queueChk = document.createElement('input');
        queueChk.type = 'checkbox'; queueChk.checked = state.isQueueOpt;
        queueChk.style.cssText = "width:18px; height:18px; cursor:pointer;";
        queueChk.onchange = (e) => {
            state.isQueueOpt = e.target.checked;
            localStorage.setItem('neubie_opt_queue', state.isQueueOpt);
        };

        if (!document.getElementById('neubie-blink-style')) {
            const blinkStyle = document.createElement('style');
            blinkStyle.id = 'neubie-blink-style';
            blinkStyle.textContent = `
                @keyframes neubie-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.15; }
                }
            `;
            document.head.appendChild(blinkStyle);
        }
        // ⓘ 정보 버튼 (체크박스 왼쪽에 배치)
        const queueInfoBtn = document.createElement('button');
        queueInfoBtn.textContent = 'i';
        queueInfoBtn.title = '원리 설명';
        queueInfoBtn.style.cssText = `
            width:22px; height:22px; border-radius:50%; border:2px solid #aaa;
            background:transparent; color:#aaa; font-size:13px; font-weight:bold;
            cursor:pointer; display:flex; align-items:center; justify-content:center;
            margin-right:8px; flex-shrink:0; line-height:1; padding:0;
            transition:border-color 0.2s, color 0.2s;
        `;
        queueInfoBtn.onmouseenter = () => { queueInfoBtn.style.borderColor='#60a5fa'; queueInfoBtn.style.color='#60a5fa'; };
        queueInfoBtn.onmouseleave = () => { queueInfoBtn.style.borderColor='#aaa'; queueInfoBtn.style.color='#aaa'; };
        queueInfoBtn.onclick = () => {
            let queueInfoOverlay = document.getElementById('neubie-queue-info-overlay');
            if (!queueInfoOverlay) {
                queueInfoOverlay = document.createElement('div');
                queueInfoOverlay.id = 'neubie-queue-info-overlay';
                queueInfoOverlay.style.cssText = `
                    position:fixed; inset:0; background:transparent; pointer-events:none;
                    z-index:2147483646; display:flex; align-items:center; justify-content:center;
                    font-family:Pretendard, sans-serif; border-radius:20px; overflow:hidden;
                `;
                const queueInfoBox = document.createElement('div');
                queueInfoBox.style.cssText = `
                    background:#1e1e2e; color:#e2e8f0; border-radius:18px; pointer-events:auto;
                    border:1.5px solid #3b82f6; padding:36px 40px 32px 40px;
                    max-width:600px; width:90%; max-height:80vh; overflow-y:auto;
                    position:relative; box-shadow:0 10px 50px rgba(0,0,0,0.7);
                `;
                const queueInfoTitle = document.createElement('div');
                queueInfoTitle.textContent = '원리 설명';
                queueInfoTitle.style.cssText = `font-size:22px; font-weight:bold; margin-bottom:20px; color:#93c5fd;`;
                const queueInfoClose = document.createElement('button');
                queueInfoClose.textContent = '✕';
                queueInfoClose.style.cssText = `
                    position:absolute; top:16px; right:18px;
                    background:transparent; border:none; color:#aaa;
                    font-size:20px; cursor:pointer; line-height:1; padding:4px 8px;
                    border-radius:6px; transition:color 0.2s;
                `;
                queueInfoClose.onmouseenter = () => { queueInfoClose.style.color='#fff'; };
                queueInfoClose.onmouseleave = () => { queueInfoClose.style.color='#aaa'; };
                queueInfoClose.onclick = () => { queueInfoOverlay.style.display='none'; };
                const queueInfoContent = document.createElement('div');
                queueInfoContent.id = 'neubie-queue-info-content';
                queueInfoContent.style.cssText = `font-size:12px; line-height:1.8; color:#cbd5e1; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;`;
                queueInfoContent.innerHTML = `
                결정론적 순열 분산 시스템입니다.<br>
                이전의 랜덤 5분할+지터 앞뒤 0.1 딜레이 방식은 결국 랜덤이라는 한계를 벗어나지 못했죠.<br>
                이 방식은 현재 시각 기준 '가용 인원'을 산출해서 딜레이 등수를 고정합니다.<br>
                가령 09:20에 휴무/연차/반차를 제외한 근무자가 총 8명이라면, 현 모니터링 인원을 제외한 나머지 7명에게 고정 등수가 배분됩니다.<br>
                총 7명이니까 각각 1~7등까지 딜레이가 나뉘겠지요. 이 등수 배분은 각 2분마다 변동되며, 근무자 출퇴근 및 식사시간에 맞춰서 배분 그룹이 매번 바뀝니다.<br>
                현재 '2분 슬롯 구간'에서 본인이 1등이라서 개입카드를 먼저 들어왔더라도, 이후 2분마다 변하는 등수는 예상할 길이 없습니다.<br>
                배분할 인원이 적으면 적을 수록 최대 1.5초 중에서 딜레이 간격은 더 넓게 설정됩니다.<br>
                즉, 이론적으로는 등수가 절대로 겹칠 수 없습니다. 이미 함수가 계산하는 순간 결정되니까요.<br>
                이러한 근무자 그룹 배분은 각자 PC환경에서 동일한 계산으로 동일한 등수를 계산합니다.<br>
                이 방법이 '서버 네트워크 문제'까지는 어떻게 하지 못합니다만, 적어도 클라이언트에서 할 수 있는 최대한의 해결책이라고 기대해봅니다.
                `;

                queueInfoBox.appendChild(queueInfoClose);
                queueInfoBox.appendChild(queueInfoTitle);
                queueInfoBox.appendChild(queueInfoContent);
                queueInfoOverlay.appendChild(queueInfoBox);
                const r0 = dashboard.getBoundingClientRect();
                queueInfoOverlay.style.position = 'fixed';
                queueInfoOverlay.style.top = r0.top + 'px';
                queueInfoOverlay.style.left = r0.left + 'px';
                queueInfoOverlay.style.width = r0.width + 'px';
                queueInfoOverlay.style.height = r0.height + 'px';
                document.body.appendChild(queueInfoOverlay);
            } else {
                const r = dashboard.getBoundingClientRect();
                queueInfoOverlay.style.top = r.top + 'px';
                queueInfoOverlay.style.left = r.left + 'px';
                queueInfoOverlay.style.width = r.width + 'px';
                queueInfoOverlay.style.height = r.height + 'px';
                queueInfoOverlay.style.display = 'flex';
            }
        };
        queueCard.appendChild(queueInfoBtn);
        queueCard.appendChild(queueChk);
        twoCol.appendChild(queueCard);
        list.appendChild(twoCol);

        // 3. 최적화 팁 + 배터리 현황 (반반 2열)
        const bottomRow = document.createElement('div');
        bottomRow.style.cssText = "display:grid; grid-template-columns:1fr 1fr; gap:12px;";

        // 3-1. 최적화 팁 (좌측)
        const tipsCard = document.createElement('div');
        tipsCard.style.cssText = "background:#252525; padding:8px 12px; border-radius:15px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;";
        tipsCard.innerHTML = `
            <div style="flex:1;">
                <div style="font-weight:bold; font-size:15px; margin-bottom:3px;">💡 최적화 팁</div>
            </div>`;
        const tipsOpenBtn = document.createElement('button');
        tipsOpenBtn.textContent = '열기';
        tipsOpenBtn.style.cssText = "background:#3b82f6; color:white; border:none; padding:5px 14px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px; white-space:nowrap;";
        tipsOpenBtn.onclick = () => {
            let tipsOverlay = document.getElementById('neubie-tips-overlay');
            if (!tipsOverlay) {
                tipsOverlay = document.createElement('div');
                tipsOverlay.id = 'neubie-tips-overlay';
                tipsOverlay.style.cssText = `
                    position:fixed; inset:0; background:transparent; pointer-events:none;
                    z-index:2147483646; display:flex; align-items:center; justify-content:center;
                    font-family:Pretendard, sans-serif; border-radius:20px; overflow:hidden;
                `;
                const tipsBox = document.createElement('div');
                tipsBox.style.cssText = `
                    background:#1e1e2e; color:#e2e8f0; border-radius:18px; pointer-events:auto;
                    border:1.5px solid #f59e0b; padding:28px 32px 24px 32px;
                    max-width:560px; width:90%; max-height:80vh; overflow-y:auto;
                    position:relative; box-shadow:0 10px 50px rgba(0,0,0,0.7);
                `;
                const tipsTitle = document.createElement('div');
                tipsTitle.textContent = '💡 최적화 팁';
                tipsTitle.style.cssText = `font-size:20px; font-weight:bold; margin-bottom:20px; color:#fcd34d;`;
                const tipsClose = document.createElement('button');
                tipsClose.textContent = '✕';
                tipsClose.style.cssText = `
                    position:absolute; top:16px; right:18px;
                    background:transparent; border:none; color:#aaa;
                    font-size:20px; cursor:pointer; line-height:1; padding:4px 8px;
                    border-radius:6px; transition:color 0.2s;
                `;
                tipsClose.onmouseenter = () => { tipsClose.style.color='#fff'; };
                tipsClose.onmouseleave = () => { tipsClose.style.color='#aaa'; };
                tipsClose.onclick = () => { tipsOverlay.style.display='none'; };

                const tipsItems = [
                    { title: "슬랙 PWA 버전 사용법(앱 버전보다 가벼움)", url: "https://telling-ink-a85.notion.site/PWA-366a8cf5ba7b80eebb43e017c095702c?pvs=74" },
                    { title: "OBS 최적화 및 클립 따기 설정법", url: "https://telling-ink-a85.notion.site/OBS-366a8cf5ba7b80dfb101cfa149eaefcf?pvs=74" },
                    { title: "CYH's 추천 프로그램 목록", url: "https://telling-ink-a85.notion.site/366a8cf5ba7b80958575eadb8809f313" },
                ];
                const tipsContent = document.createElement('div');
                tipsContent.style.cssText = "display:grid; gap:10px;";
                tipsItems.forEach(item => {
                    const row = document.createElement('div');
                    row.style.cssText = `
                        display:flex; justify-content:space-between; align-items:center;
                        background:#252535; border:1px solid #333; border-radius:12px;
                        padding:13px 16px; gap:12px;
                    `;
                    const rowTitle = document.createElement('span');
                    rowTitle.textContent = item.title;
                    rowTitle.style.cssText = "font-size:14px; font-weight:600; color:#e2e8f0; flex:1;";
                    const rowBtn = document.createElement('button');
                    rowBtn.textContent = '보기';
                    rowBtn.style.cssText = `
                        background:#f59e0b; color:#1a1a1a; border:none;
                        padding:7px 16px; border-radius:8px; cursor:pointer;
                        font-weight:bold; font-size:13px; white-space:nowrap;
                        transition:background 0.2s;
                    `;
                    rowBtn.onmouseenter = () => { rowBtn.style.background='#fbbf24'; };
                    rowBtn.onmouseleave = () => { rowBtn.style.background='#f59e0b'; };
                    rowBtn.onclick = () => { window.open(item.url, '_blank'); };
                    row.appendChild(rowTitle);
                    row.appendChild(rowBtn);
                    tipsContent.appendChild(row);
                });
                tipsBox.appendChild(tipsClose);
                tipsBox.appendChild(tipsTitle);
                tipsBox.appendChild(tipsContent);
                tipsOverlay.appendChild(tipsBox);
                const r0 = dashboard.getBoundingClientRect();
                tipsOverlay.style.position = 'fixed';
                tipsOverlay.style.top = r0.top + 'px';
                tipsOverlay.style.left = r0.left + 'px';
                tipsOverlay.style.width = r0.width + 'px';
                tipsOverlay.style.height = r0.height + 'px';
                document.body.appendChild(tipsOverlay);
            } else {
                const r = dashboard.getBoundingClientRect();
                tipsOverlay.style.top = r.top + 'px';
                tipsOverlay.style.left = r.left + 'px';
                tipsOverlay.style.width = r.width + 'px';
                tipsOverlay.style.height = r.height + 'px';
                tipsOverlay.style.display = 'flex';
            }
        };
        tipsCard.appendChild(tipsOpenBtn);
        bottomRow.appendChild(tipsCard);

        // 3-2. 배터리 현황 (우측)
        const isBatteryOpen = batteryPopup.style.display === 'block';
        const batteryCard = document.createElement('div');
        batteryCard.style.cssText = "background:#252525; padding:8px 12px; border-radius:15px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;";
        batteryCard.innerHTML = `
            <div style="flex:1;">
                <div style="font-weight:bold; font-size:15px; margin-bottom:3px;">🔋 성남 배터리 현황</div>
            </div>`;
        const batteryBtn = document.createElement('button');
        batteryBtn.textContent = isBatteryOpen ? '닫기' : '열기';
        batteryBtn.style.cssText = `background:${isBatteryOpen ? '#ef4444' : '#3b82f6'}; color:white; border:none; padding:5px 14px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px; white-space:nowrap;`; 
        batteryBtn.onclick = () => {
            toggleBattery();
            renderDashboard();
            if (window.currentMyTasks && window.currentMyTasks.length > 0) {
                renderTaskList(window.currentMyTasks);
            }
        };
        batteryCard.appendChild(batteryBtn);
        bottomRow.appendChild(batteryCard);

        list.appendChild(bottomRow);

        // 4. 영상 파일명 도우미
        list.appendChild(createNamingCard());

        dashboard.appendChild(list);
    }

    function createMenuCard(name, desc, stateKey, storageKey, action, btnLabel = '열기') {
        const card = document.createElement('div');
        card.style.cssText = "background:#252525; padding:15px; border-radius:15px; display:flex; justify-content:space-between; align-items:center; border:1px solid #333;";
        // 제목에 margin-bottom: 4px를 추가하여 설명과의 간격을 벌림
        card.innerHTML = `
            <div style="flex:1;">
                <div style="font-weight:bold; font-size:18px; margin-bottom:4px;">${name}</div>
                <div style="font-size:16px; color:#aaa;">${desc}</div>
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
        } else if (action) {
            const btn = document.createElement('button');
            btn.textContent = btnLabel;
            btn.style.cssText = `background:${btnLabel === '닫기' ? '#ef4444' : '#3b82f6'}; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold; min-width:70px; font-size:15px;`;            btn.onclick = action;
            card.appendChild(btn);
        }
        return card;
    }

    let batteryRefreshInterval = null;

    // 팝업 열 때만 생성
    function toggleBattery() {
        if (batteryPopup.style.display !== 'block') {

            // iframe이 없으면 그때 생성
            config.batteryIds.forEach(c => {
                if (!iframes[c.id]) {
                    const ifr = document.createElement('iframe');
                    ifr.src = `https://go.neubie.ai/ko/monitoring/${c.id}`;
                    Object.assign(ifr.style, { width:'0', height:'0', border:'none', position:'fixed', top:'-9999px' });
                    document.body.appendChild(ifr);
                    iframes[c.id] = ifr;
                }
            });

            updateBatteryStatus();
            batteryPopup.style.display = 'block';
            setTimeout(() => {
                if (batteryPopup.style.display === 'block') updateBatteryStatus();
            }, 1500);

            batteryRefreshInterval = setInterval(() => {
                if (batteryPopup.style.display === 'block') updateBatteryStatus();
                else clearInterval(batteryRefreshInterval);
            }, 5000);

        } else {
            batteryPopup.style.display = 'none';
            clearInterval(batteryRefreshInterval);

            // ✅ 닫을 때 iframe 전부 제거 → 부하 없음
            config.batteryIds.forEach(c => {
                if (iframes[c.id]) {
                    iframes[c.id].remove();
                    delete iframes[c.id];
                }
            });
        }
    }

    function closeAllPopups() {
        dashboard.style.display = 'none';
        batteryPopup.style.display = 'none';

		document.getElementById('ho-remote-peek')?.remove();
    	document.getElementById('ho-remote-panel')?.remove();
		
        const queueInfoOverlay = document.getElementById('neubie-queue-info-overlay');
        if (queueInfoOverlay) queueInfoOverlay.style.display = 'none';
        const tipsOverlay = document.getElementById('neubie-tips-overlay');
        if (tipsOverlay) tipsOverlay.style.display = 'none';
        const patchOverlay = document.getElementById('neubie-patch-overlay');
        if (patchOverlay) patchOverlay.style.display='none';
    }

	// ── 핸드오버 레이아웃 ──────────────────────────────────
	async function initHandoverLayout() {
		// 패널 생성
		let panel = document.getElementById('ho-remote-panel');
		if (panel) { panel.style.top = '0px'; return; }

		panel = document.createElement('div');
		panel.id = 'ho-remote-panel';
		Object.assign(panel.style, {
			position: 'fixed', top: '0px', left: '50%', transform: 'translateX(-50%)',
			zIndex: '2147483646', width: '700px',
			background: 'rgba(234,238,248,0.98)',
			borderRadius: '0 0 16px 16px', padding: '10px 14px 12px',
			fontFamily: 'Pretendard,sans-serif',
			boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
			border: '1px solid rgba(200,210,230,0.7)', borderTop: 'none',
			transition: 'top 0.28s cubic-bezier(0.4,0,0.2,1)',
		});
		document.body.appendChild(panel);

		// ── DP 상태 메시지 ──
		const dpMsg = document.createElement('span');
		dpMsg.id = 'ho-dp-msg';
		Object.assign(dpMsg.style, {
			fontSize: '11px', color: '#64748b', maxWidth: '200px',
			overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
		});
		dpMsg.textContent = '로딩 중...';

		const setDpMsg = (msg, color = '#64748b') => {
			dpMsg.textContent = msg;
			dpMsg.style.color = color;
		};

		// ── 그리드 셀 ──
		const MAX_UNITS = 12;
		let selectedCells = [];
		let gridUnits = []; // fetch된 기체 목록

		const cellIdle = c => {
			Object.assign(c.style, { background: 'rgba(255,255,255,0.85)', color: '#1e293b',
				border: '1.5px solid #93c5fd', cursor: 'pointer', fontWeight: '600' });
			c.dataset.selected = 'false';
		};
		const cellSel = c => {
			Object.assign(c.style, { background: 'rgba(59,130,246,0.13)', color: '#1d4ed8',
				border: '2px solid #3b82f6', cursor: 'pointer', fontWeight: '700' });
			c.dataset.selected = 'true';
		};
		const cellDone = c => {
			Object.assign(c.style, { background: 'rgba(203,213,225,0.35)', color: '#94a3b8',
				border: '1.5px solid #cbd5e1', cursor: 'default', fontWeight: '400' });
			c.dataset.done = 'true'; c.dataset.selected = 'false';
			selectedCells = selectedCells.filter(s => s !== c);
		};
		const cellEmpty = c => {
			c.textContent = '—';
			Object.assign(c.style, { background: 'rgba(255,255,255,0.45)', color: '#b0bec5',
				border: '1.5px dashed #c8d2e0', cursor: 'default', fontWeight: '400' });
			c.dataset.unit = ''; c.dataset.selected = 'false'; c.dataset.done = 'false';
		};

		// ── 레이아웃 빌드 ──
		// 상단 헤더 행
		const headerRow = document.createElement('div');
		Object.assign(headerRow.style, {
			display: 'flex', alignItems: 'center', gap: '8px',
			marginBottom: '8px', paddingBottom: '8px',
			borderBottom: '1px solid rgba(0,0,0,0.08)',
		});

		// 교대받기 버튼
		const fetchBtn = document.createElement('button');
		fetchBtn.textContent = '🔄 교대 받기';
		Object.assign(fetchBtn.style, {
			background: '#3b82f6', color: '#fff', border: 'none',
			padding: '5px 12px', borderRadius: '7px', fontSize: '12px',
			fontWeight: '700', cursor: 'pointer', fontFamily: 'Pretendard,sans-serif',
		});

		headerRow.appendChild(fetchBtn);
		headerRow.appendChild(dpMsg);

		// 우측 버튼들
		const rightBtns = document.createElement('div');
		Object.assign(rightBtns.style, { marginLeft: 'auto', display: 'flex', gap: '6px' });

		const autoBtn = document.createElement('button');
		autoBtn.textContent = '⚡ 자동 시작';
		Object.assign(autoBtn.style, {
			background: '#6366f1', color: '#fff', border: 'none',
			padding: '5px 14px', borderRadius: '7px', fontSize: '12px',
			fontWeight: '800', cursor: 'pointer', fontFamily: 'Pretendard,sans-serif',
		});

		const startBtn = document.createElement('button');
		startBtn.textContent = '🚀 수동 시작';
		Object.assign(startBtn.style, {
			background: '#22c55e', color: '#fff', border: 'none',
			padding: '5px 14px', borderRadius: '7px', fontSize: '12px',
			fontWeight: '800', cursor: 'pointer', opacity: '0.35',
			pointerEvents: 'none', fontFamily: 'Pretendard,sans-serif',
		});

		rightBtns.appendChild(autoBtn);
		rightBtns.appendChild(startBtn);
		headerRow.appendChild(rightBtns);
		panel.appendChild(headerRow);

		// 그리드 행 (좌측 버튼 | 그리드 | 우측 여백)
		const bodyRow = document.createElement('div');
		Object.assign(bodyRow.style, { display: 'flex', gap: '8px', alignItems: 'flex-start' });

		// 좌측 버튼 컬럼
		const leftCol = document.createElement('div');
		Object.assign(leftCol.style, { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '70px' });

		const multiBtn = document.createElement('button');
		multiBtn.textContent = '다중 관제';
		Object.assign(multiBtn.style, {
			background: '#444', color: '#ddd', border: '1px solid #666',
			padding: '6px 4px', borderRadius: '6px', fontSize: '11px',
			cursor: 'pointer', fontFamily: 'Pretendard,sans-serif',
		});
		multiBtn.onclick = () => {
			// 기존 다중관제 버튼 로직 그대로
			const time = getCalculatedTime(10);
			const finalName = `${getFormattedDate(time)}_${getFormattedHour(time)}_다중모니터링`;
			navigator.clipboard.writeText(finalName);
			multiBtn.textContent = '✅ 복사됨';
			setTimeout(() => { multiBtn.textContent = '다중 관제'; }, 1500);
		};

		const battBtn = document.createElement('button');
		battBtn.textContent = '성남 배터리\n열기';
		Object.assign(battBtn.style, {
			background: '#444', color: '#ddd', border: '1px solid #666',
			padding: '6px 4px', borderRadius: '6px', fontSize: '11px',
			cursor: 'pointer', fontFamily: 'Pretendard,sans-serif', whiteSpace: 'pre-line',
			lineHeight: '1.4',
		});
		battBtn.onclick = () => {
			toggleBattery();
			battBtn.textContent = batteryPopup.style.display === 'block' ? '성남 배터리\n닫기' : '성남 배터리\n열기';
		};

		leftCol.appendChild(multiBtn);
		leftCol.appendChild(battBtn);
		bodyRow.appendChild(leftCol);

		// 12칸 그리드
		const grid = document.createElement('div');
		Object.assign(grid.style, {
			display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '5px', flex: '1',
		});

		const cells = Array.from({ length: MAX_UNITS }, (_, i) => {
			const cell = document.createElement('button');
			cell.className = 'ho-remote-cell';
			cell.dataset.idx = i;
			cell.dataset.unit = '';
			cell.dataset.selected = 'false';
			cell.dataset.done = 'false';
			cell.textContent = '—';
			Object.assign(cell.style, {
				height: '42px', borderRadius: '8px', border: '1.5px dashed #c8d2e0',
				background: 'rgba(255,255,255,0.45)', color: '#b0bec5', fontSize: '11px',
				fontFamily: 'Pretendard,sans-serif', cursor: 'default',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				textAlign: 'center', lineHeight: '1.3', padding: '4px',
			});
			cell.addEventListener('click', () => {
				if (!cell.dataset.unit || cell.dataset.done === 'true') return;
				if (cell.dataset.selected === 'true') {
					cellIdle(cell);
					selectedCells = selectedCells.filter(c => c !== cell);
				} else {
					if (selectedCells.length >= 6) return;
					cellSel(cell);
					selectedCells.push(cell);
				}
				startBtn.style.opacity = selectedCells.length > 0 ? '1' : '0.35';
				startBtn.style.pointerEvents = selectedCells.length > 0 ? 'auto' : 'none';
			});
			grid.appendChild(cell);
			return cell;
		});

		bodyRow.appendChild(grid);
		panel.appendChild(bodyRow);

		// ── 그리드에 기체 렌더링 ──
		const renderGrid = (units) => {
			gridUnits = units;
			selectedCells = [];
			startBtn.style.opacity = '0.35';
			startBtn.style.pointerEvents = 'none';
			cells.forEach((cell, i) => {
				const name = units[i] || null;
				if (name) {
					cell.textContent = name;
					cell.dataset.unit = name;
					cell.dataset.done = 'false';
					cell.dataset.selected = 'false';
					cellIdle(cell);
				} else {
					cellEmpty(cell);
				}
			});
		};

		const githubGet = async () => {
			try {
				const token = localStorage.getItem('ho_github_token') || '';
				const res = await fetch(  // originalFetch → fetch
					'https://api.github.com/repos/ubase00070/monitoring_handover/contents/handover.json',
					{ headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
				);
				if (!res.ok) return null;
				const json = await res.json();
				const decoded = decodeURIComponent(
					atob(json.content.replace(/\n/g, ''))
						.split('')
						.map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
						.join('')
				);
				const data = JSON.parse(decoded);
				return { data };
			} catch(e) { return null; }
		};

		// ── 유효성 검증 (1시간 이내 데이터) ──
		const isDataValid = (updatedAt) => {
			if (!updatedAt) return false;
			const updated = new Date(updatedAt.replace(' ', 'T'));
			return (Date.now() - updated.getTime()) < 60 * 60 * 1000;
		};

		// ── 교대받기 버튼 ──
		fetchBtn.addEventListener('click', async () => {
			setDpMsg('데이터 확인 중...', '#3b82f6');
			const result = await githubGet();
			if (!result) { setDpMsg('Fetch 실패', '#ef4444'); return; }
			const { data } = result;
			if (!isDataValid(data.updatedAt)) {
				setDpMsg('이전 시간 교대 기체 데이터가 없습니다', '#f59e0b');
				return;
			}
			const units = data.units || [];
			if (!units.length) { setDpMsg('기체 데이터 없음', '#94a3b8'); return; }
			renderGrid(units);
			setDpMsg(`교대 기체 데이터 로드됨 (${data.handover_by || '?'} → ${units.length}대)`, '#22c55e');
		});

		// ── Auto select ──
		const runAutoSelect = async (units, targetCells) => {
			let modal = document.querySelector('[data-qk="remote-multiple-select-robot-dialog"]');
			if (!modal) {
				setDpMsg('모달 대기 중...', '#3b82f6');
				modal = await new Promise(resolve => {
					const t = setTimeout(() => resolve(null), 8000);
					const obs = new MutationObserver(() => {
						const el = document.querySelector('[data-qk="remote-multiple-select-robot-dialog"]');
						if (el) { clearTimeout(t); obs.disconnect(); resolve(el); }
					});
					obs.observe(document.body, { childList: true, subtree: true });
				});
			}
			if (!modal) { setDpMsg('모달 없음', '#ef4444'); return; }

			// ✅ React 체크박스를 강제로 체크하는 헬퍼
			const reactCheck = (label) => {
				if (!label) return false;
				const checkbox = label.querySelector('input[type="checkbox"]');
				if (checkbox?.checked) return true;
				const opts = { bubbles: true, cancelable: true, view: window };
				label.dispatchEvent(new MouseEvent('mouseover', opts));
				label.dispatchEvent(new MouseEvent('mousedown', opts));
				label.dispatchEvent(new MouseEvent('mouseup',   opts));
				label.dispatchEvent(new MouseEvent('click',     opts));
				return true;
			};

			let ok = 0;
			for (let i = 0; i < units.length; i++) {
				const name = units[i];
				const cell = targetCells[i];
				setDpMsg(`${name} (${i+1}/${units.length})`, '#3b82f6');
				let clicked = false;

				// 1단계: span[data-qk="robot-name"]으로 찾기
				const spans = document.querySelectorAll('span[data-qk="robot-name"]');
				for (const span of spans) {
					const text = span.textContent.trim();
					if (text === name || text.includes(name) || name.includes(text)) {
						const label = span.closest('label');
						if (label && reactCheck(label)) { clicked = true; break; }
					}
				}

				// 2단계 폴백: 모든 label 텍스트 검색
				if (!clicked) {
					for (const label of document.querySelectorAll('label')) {
						if (label.textContent.trim().replace(/\s+/g, ' ').includes(name)) {
							if (reactCheck(label)) { clicked = true; break; }
						}
					}
				}

				if (clicked) { ok++; if (cell) cellDone(cell); }
				await new Promise(r => setTimeout(r, 80)); // 30ms → 80ms로 여유 확보
			}

			setDpMsg(`${ok}/${units.length} 선택 완료, 시작하기 대기 중...`, '#22c55e');

			// ✅ 시작하기 버튼이 활성화될 때까지 폴링 (최대 3초)
			const confirmBtn = await new Promise(resolve => {
				const interval = setInterval(() => {
					const btn = document.querySelector('[data-qk="remote-multiple-select-robot-dialog-confirm-button"]');
					if (btn && !btn.disabled) { clearInterval(interval); resolve(btn); }
				}, 100);
				setTimeout(() => { clearInterval(interval); resolve(null); }, 3000);
			});

			if (confirmBtn) {
				confirmBtn.click();
				setDpMsg('완료! ✅', '#22c55e');
			} else {
				setDpMsg('시작하기 버튼을 직접 눌러주세요', '#f59e0b');
			}
		};

		autoBtn.addEventListener('click', async () => {
			const available = cells.filter(c => c.dataset.unit && c.dataset.done !== 'true');
			const targets = available.slice(0, 6);
			if (!targets.length) { setDpMsg('연결 가능한 기체 없음', '#f59e0b'); return; }
			targets.forEach(cellSel);
			selectedCells = [...targets];
			// ← 모달이 없으면 사용자에게 안내
			const modal = document.querySelector('[data-qk="remote-multiple-select-robot-dialog"]');
			if (!modal) { 
				setDpMsg('뉴비고에서 기체 선택 모달을 먼저 열어주세요', '#f59e0b'); 
				return; 
			}
			await runAutoSelect(targets.map(c => c.dataset.unit), targets);
		});

		startBtn.addEventListener('click', async () => {
			if (!selectedCells.length) return;
			await runAutoSelect(selectedCells.map(c => c.dataset.unit), [...selectedCells]);
		});

		// ── 자동 Fetch (패널 열릴 때 1회) ──
		setDpMsg('인계 데이터 확인 중...', '#3b82f6');
		const result = await githubGet();
		if (result && isDataValid(result.data.updatedAt)) {
			const units = result.data.units || [];
			if (units.length) {
				renderGrid(units);
				setDpMsg(`교대 기체 데이터 로드됨 (${result.data.handover_by || '?'} → ${units.length}대)`, '#22c55e');
			} else {
				setDpMsg('이전 시간 교대 기체 데이터가 없습니다', '#f59e0b');
			}
		} else {
			setDpMsg('이전 시간 교대 기체 데이터가 없습니다', '#f59e0b');
		}

		// 패널 외부 클릭 시 닫기
		document.addEventListener('mousedown', (e) => {
			const p = document.getElementById('ho-remote-panel');
			if (!p) return;
			if (p.contains(e.target)) return;
			if (e.target.closest('[data-qk="remote-multiple-select-robot-dialog"]')) return;
			p.style.top = '-300px';
		});
	}
	// ── 핸드오버 레이아웃 끝 ──────────────────────────────

    /* ============================================================
        SECTION 9. 전체 밝기 마스터 컨트롤
        - remote/multiple 페이지에서 고정 표시
        - 슬라이더 조작 시 모든 카메라 슬라이더에 동기화
        - ⚠️  FIXME_SLIDER_SELECTOR: 내일 Elements 확인 후 수정
       ============================================================ */

    // ── 상수 ──────────────────────────────────────────────
    // 내일 Elements에서 확인할 것:
    //   1) 각 카메라 슬라이더의 input[type=range] selector
    //   2) 슬라이더 값 범위 (min/max) 
    //   3) CSS filter로 동작하는지 여부
    const BRIGHTNESS = {
        SLIDER_SELECTOR: 'input[type="range"]', // ⚠️ FIXME: 실제 selector로 교체
        MIN: 0,
        MAX: 100,
        DEFAULT: 50,
        STORAGE_KEY: 'neubie_brightness',
    };

    // ── React friendly 값 주입 헬퍼 ──────────────────────
    function setSliderValue(input, value) {
        try {
            // React synthetic event 대응 (nativeInputValueSetter)
            const nativeSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
            ).set;
            nativeSetter.call(input, value);
            input.dispatchEvent(new Event('input',  { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        } catch(e) {
            // fallback: 직접 할당
            input.value = value;
            input.dispatchEvent(new Event('input',  { bubbles: true }));
        }
    }

    // ── 모든 카메라 슬라이더에 값 동기화 ──────────────────
    function applyBrightnessToAll(value) {
        const sliders = document.querySelectorAll(BRIGHTNESS.SLIDER_SELECTOR);
        sliders.forEach(s => {
            // 마스터 슬라이더 자신은 건너뜀
            if (s.id === 'neubie-master-brightness') return;
            setSliderValue(s, value);
        });
        localStorage.setItem(BRIGHTNESS.STORAGE_KEY, value);
    }

    // ── MutationObserver: 새 카메라 추가 시 자동 적용 ─────
    function startBrightnessObserver(masterValue) {
        const applied = new WeakSet();
        const observer = new MutationObserver(() => {
            const val = masterValue();
            if (val === null) return; // Auto 꺼져 있으면 스킵
            const sliders = document.querySelectorAll(BRIGHTNESS.SLIDER_SELECTOR);
            sliders.forEach(s => {
                if (s.id === 'neubie-master-brightness') return;
                if (applied.has(s)) return;
                applied.add(s);
                setSliderValue(s, val);
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return observer;
    }

    // ── UI 생성 ───────────────────────────────────────────
    function injectMasterBrightness() {
        if (document.getElementById('neubie-brightness-bar')) return;

        const savedVal = parseInt(localStorage.getItem(BRIGHTNESS.STORAGE_KEY) ?? BRIGHTNESS.DEFAULT);

        const bar = document.createElement('div');
        bar.id = 'neubie-brightness-bar';
        Object.assign(bar.style, {
            position: 'fixed',
            // multiple 페이지 상단 UI와 겹치지 않도록 우측 하단 고정
            bottom: '20px', right: '20px',
            zIndex: '2147483640',
            background: 'rgba(15,15,15,0.82)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: '999px',
            padding: '7px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            fontFamily: 'Pretendard, sans-serif',
            userSelect: 'none',
        });

        // ☀️ 아이콘
        const icon = document.createElement('span');
        icon.textContent = '☀️';
        icon.style.cssText = 'font-size:16px; line-height:1;';

        // 슬라이더 — 원본 UI와 동일한 pill 스타일
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = 'neubie-master-brightness';
        slider.min = BRIGHTNESS.MIN;
        slider.max = BRIGHTNESS.MAX;
        slider.value = savedVal;
        Object.assign(slider.style, {
            width: '120px',
            height: '4px',
            accentColor: '#ffffff',
            cursor: 'pointer',
            outline: 'none',
            border: 'none',
            background: 'transparent',
        });

        // 숫자 표시
        const label = document.createElement('span');
        label.style.cssText = 'color:#fff; font-size:13px; font-weight:600; min-width:28px; text-align:right;';
        label.textContent = savedVal;

        let autoOn = false;

        const autoBtn = document.createElement('button');
        autoBtn.textContent = 'Auto';
        Object.assign(autoBtn.style, {
            background: 'rgba(255,255,255,0.12)',
            color: '#aaa',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '999px',
            padding: '3px 10px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            flexShrink: '0',
            transition: '0.2s',
        });

        autoBtn.addEventListener('click', () => {
            autoOn = !autoOn;
            if (autoOn) {
                // 활성화: 초록 + 현재 값으로 즉시 전체 적용
                Object.assign(autoBtn.style, { background: '#22c55e', color: '#fff', border: '1px solid #22c55e' });
                applyBrightnessToAll(slider.value);
            } else {
                // 비활성화: 원래 스타일로
                Object.assign(autoBtn.style, { background: 'rgba(255,255,255,0.12)', color: '#aaa', border: '1px solid rgba(255,255,255,0.2)' });
            }
        });

        slider.addEventListener('input', () => {
            const v = slider.value;
            label.textContent = v;
            applyBrightnessToAll(v);
        });

        resetBtn.addEventListener('click', () => {
            slider.value = BRIGHTNESS.DEFAULT;
            label.textContent = BRIGHTNESS.DEFAULT;
            applyBrightnessToAll(BRIGHTNESS.DEFAULT);
        });

        bar.appendChild(icon);
        bar.appendChild(slider);
        bar.appendChild(label);
        bar.appendChild(autoBtn);
        document.body.appendChild(bar);

        // MutationObserver로 나중에 추가되는 카메라에도 자동 적용
        startBrightnessObserver(() => autoOn ? parseInt(slider.value) : null);

        // 초기 1회 적용 (페이지 로드 시 기존 카메라에)
        setTimeout(() => applyBrightnessToAll(savedVal), 800);
    }

    // ── multiple 페이지 진입 시 자동 주입 / 이탈 시 제거 ──
    function checkBrightnessBar() {
        const isMultiple = location.href.includes('go.neubie.ai/ko/remote/multiple') ||
                           location.href.includes('multimonitoring.vercel.app');
        const bar = document.getElementById('neubie-brightness-bar');
        if (isMultiple && !bar) {
            injectMasterBrightness();
        } else if (!isMultiple && bar) {
            bar.remove();
        }
    }

    // URL 변경 감지 (기존 setInterval과 연동)
    const _origCheckBrightness = checkBrightnessBar;
    setInterval(_origCheckBrightness, 1500);
    _origCheckBrightness(); // 최초 1회

    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'KeyQ') {
			e.preventDefault();

			// remote/multiple 페이지면 핸드오버 레이아웃
			if (isHandoverPage()) {
				const existing = document.getElementById('ho-remote-panel');
				if (existing) {
					const isOpen = existing.style.top === '0px';
					existing.style.top = isOpen ? '-300px' : '0px';
				} else {
					initHandoverLayout();
				}
				return;
			}

			// 그 외 페이지는 기존 대시보드
			const tipsOverlayEl = document.getElementById('neubie-tips-overlay');
			const isAnyOpen = (dashboard.style.display === 'block' || 
							batteryPopup.style.display === 'block' ||
							(tipsOverlayEl && tipsOverlayEl.style.display === 'flex'));
			
			if (isAnyOpen) {
				closeAllPopups();
			} else {
				renderDashboard();
				dashboard.style.display = 'block';
				syncTasksFromServer();
			}
		}
		
        // Alt + B (배터리) 단축키 로직
        if (e.altKey && e.code === 'KeyB') { 
            e.preventDefault(); 
            toggleBattery(); 
            if (dashboard.style.display === 'block') {
                renderDashboard();
                if (window.currentMyTasks && window.currentMyTasks.length > 0) {
                    renderTaskList(window.currentMyTasks);
                }
            }
        }
    });

    let lastUrl = location.href;

    // 브라우저의 뒤로가기/앞으로가기 대응 (이벤트 발생 시에만 작동)
    window.addEventListener('popstate', () => {
        closeAllPopups();
    });

    // 화면 어디든 클릭했을 때 주소 확인
    // 뉴비고에서 메뉴를 클릭해 이동할 때 즉각 닫히게 합니다.
    document.addEventListener('click', () => {
        setTimeout(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                closeAllPopups();
                updateRobotContext();
                // 맵 최적화 페이지 전환 시 재적용
                const isTarget = config.targetIds.some(id => location.href.includes(`/monitoring/${id}`));
                if (isTarget && state.isMapOpt) {
                    setTimeout(() => injectMapStyle(), 1000);
                    setTimeout(() => injectMapStyle(), 3000);
                    setTimeout(() => injectMapStyle(), 6000);
                }
            }
        }, 100);
    }, true);

    // 만약 클릭 없이 코드로만 주소가 바뀌는 경우를 대비 (간격 2초)
    setInterval(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            closeAllPopups();
            updateRobotContext();

            // ▼ 추가: driving 진입 시 뱃지 감시 시작
            if (location.href.includes('/driving') && !location.href.includes('robot-id=')) {
                startBadgeWatch();
            } else {
                stopBadgeWatch();
            }

            // ▼ 추가: robot-id 페이지 진입 + 관제 시작으로 들어온 경우만
            if (location.href.includes('robot-id=') && cameFromIntervention) {
                cameFromIntervention = false;
                const names = [...pendingOverlapNames];
                pendingOverlapNames = [];
                if (names.length > 0) {
                    setTimeout(() => showOverlapBanner(names), 400);
                }
            }

            // 맵 최적화 페이지 전환 시 재적용
            const isTarget = config.targetIds.some(id => location.href.includes(`/monitoring/${id}`));
            if (isTarget && state.isMapOpt) {
                setTimeout(() => injectMapStyle(), 1000);
                setTimeout(() => injectMapStyle(), 3000);
                setTimeout(() => injectMapStyle(), 6000);
            }
        }
    }, 2000); // 2초 정도면 충분히 여유로움

    document.addEventListener('click', handleControlClick, true);
    injectConfigUI();
    
    // 페이지 로드 시 이름이 설정되어 있다면 즉시 한 번 동기화
    if (localStorage.getItem('neubie_user_name')) {
        syncTasksFromServer();
    }

    // 백그라운드 리프레시 (1분마다 데이터만 몰래 가져옴)
    // 업무 방해를 주지 않기 위해 fetch만 수행하며, 화면 갱신은 위 sync 함수 내 안전장치에 의존함
    let lastNotifiedMin = -1; 

    setInterval(() => {
        const now = new Date();
        const currentFullMin = now.getHours() * 60 + now.getMinutes();

        // 이미 이번 '분'에 체크를 완료했다면 즉시 리턴
        if (lastNotifiedMin === currentFullMin) return;

        // 새로운 '분'이 시작될 때만 체크 실행 (로그 없음)
        lastNotifiedMin = currentFullMin; 
        syncTasksFromServer(); 
        
    }, 1000); // 1초마다 조용히 감시

})();
