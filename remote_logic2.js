(function() {
    'use strict';

    if (window.neubieEngineLoaded) return;
    window.neubieEngineLoaded = true;

	// ── 배민 주아 웹폰트 (게시판) ──
    (function loadJuaFont() {
        if (document.getElementById('neubie-jua-font')) return;
        const st = document.createElement('style');
        st.id = 'neubie-jua-font';
        st.textContent = `
            @font-face {
                font-family: 'BMJUA';
                src: url('https://cdn.jsdelivr.net/gh/fonts-archive/BMJUA/BMJUA.woff2') format('woff2');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
            }
        `;
        document.head.appendChild(st);
    })();

    const currUrl = window.location.href;
    const NEUBIE_HOSTS = ['go.neubie.ai', 'ncc.neubility.ai'];
    const isNeubieSite = NEUBIE_HOSTS.some(h => currUrl.includes(h));

    /* ============================================================
        SECTION 1. 상태 및 설정
       ============================================================ */
    const isHandoverPage = () =>
        (NEUBIE_HOSTS.some(h => location.href.includes(`${h}/ko/remote/multiple`)) &&
        !location.href.includes('/driving'));

    const isBrightnessPage = isHandoverPage;
    
       const config = {
        targetIds: ['44', '56', '65', '109'],
        batteryIds: [
			{ id: '221', name: '성남 판교', shortName: '성남 판교' },
			{ id: '222', name: '성남 서현', shortName: '성남 서현' },
			{ id: '224', name: '성남 율동', shortName: '성남 율동' },
			{ id: '223', name: '성남 야탑', shortName: '성남 야탑' }
		],
        sheetId: "1tLo6Xeq6KJx6zW-fcw8H38jdjxyS2yre5oWY7cxky70"
    };

    // 날씨 위젯 설정 (근무지: 뉴코아중동백화점 기준 격자좌표)
    const WEATHER_CONFIG = {
        nx: 57, ny: 126,
        proxyUrl: 'https://multimonitoring.vercel.app/api/weather'
    };

    fetch(WEATHER_CONFIG.proxyUrl).catch(() => {});

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

        "68": { site: "파주 LGD", unit: "#072" }, // 엘리 1호기
        "106": { site: "파주 LGD", unit: "#078" }, // 엘리 2호기
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
		"107": { site: "광주 낭만글램핑", unit: "#080" }, // 낭만글램핑 1호기
		"121": { site: "광주 낭만글램핑", unit: "#090" }, // 낭만글램핑 2호기

        "158": { site: "에버랜드 장미축제", unit: "#140" }, // 에버랜드
        "236": { site: "Hitachi Building Systems", unit: "#178" }, // 히타치 배달
    };

    const isAutoTarget = config.targetIds.some(id => currUrl.includes(`/monitoring/${id}`));
    const state = {
        isMapOpt: localStorage.getItem('neubie_opt_map') === 'true' || isAutoTarget,
        isQueueOpt: localStorage.getItem('neubie_opt_queue') === 'true',
        isTaskVisible: localStorage.getItem('neubie_opt_task') === 'true',
        lastBatteryData: [],
        myTodayTasks: JSON.parse(localStorage.getItem('neubie_my_tasks') || "[]"),
        insuData: null,
    };

    function getAuthHeaders() {
        try {
            const token = JSON.parse(localStorage.getItem('AccessToken'));
            return token ? { 'Authorization': `Bearer ${token}` } : {};
        } catch (e) {
            return {};
        }
    }

    /* ============================================================
    SECTION 조작자 감시 (개입 페이지 전용)
   ============================================================ */
    const OPERATOR_FETCH_INTERVAL = 10000;
    const OPERATOR_FETCH_COUNT = 2;
    const OPERATOR_PANEL_DURATION = 5000;
    const OPERATOR_PANEL_ID = 'neubie-operator-watch-panel';
    let _operatorFetchTimer = null;
    let _operatorFetchDone = false;

    function _getMyName() {
        return localStorage.getItem('neubie_user_name') || null;
    }
    function _getRobotIdFromUrl() {
        return new URLSearchParams(location.search).get('robot-id');
    }
    async function _fetchSingleRobot(robotId) {
        const res = await fetch(`https://core.neubie.ai/robots/${robotId}/`, {
            credentials: 'include',
            headers: getAuthHeaders()
        });
        return await res.json();
    }
    function _showOperatorPanel(name) {
        _removeOperatorPanel();
        const panel = document.createElement('div');
        panel.id = OPERATOR_PANEL_ID;
        panel.style.cssText = `
            position:fixed; top:16px; left:70%; transform:translateX(-50%);
            z-index:999999; pointer-events:none;
            animation: _opFadeIn 0.2s ease;
        `;
        panel.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;
                background:rgba(18,18,36,0.97);border:1px solid #6a6aaa;
                border-radius:24px;padding:10px 24px;
                box-shadow:0 4px 20px rgba(0,0,0,0.5);
                font-family:'Pretendard','Noto Sans KR',sans-serif;">
                <span style="font-size:14px;color:#aab;">⚠️ 조작자</span>
                <span style="font-size:18px;font-weight:700;color:#ffd080;">${name}</span>
            </div>
        `;
        document.body.appendChild(panel);
        clearTimeout(panel._hideTimer);
        panel._hideTimer = setTimeout(() => _removeOperatorPanel(), OPERATOR_PANEL_DURATION);
    }
    function _removeOperatorPanel() {
        const panel = document.getElementById(OPERATOR_PANEL_ID);
        if (panel) { clearTimeout(panel._hideTimer); panel.remove(); }
    }
    function _stopOperatorWatch() {
        if (_operatorFetchTimer) { clearInterval(_operatorFetchTimer); _operatorFetchTimer = null; }
        _operatorFetchDone = true;
        _removeOperatorPanel();
    }
    async function _startOperatorWatch() {
        const robotId = _getRobotIdFromUrl();
        if (!robotId) return;
        _stopOperatorWatch();
        _operatorFetchDone = false;

        let baselineName = null;
        try {
            const robot = await _fetchSingleRobot(robotId);
            baselineName = robot?.robotStatus?.lastOperatedUserName || null;
        } catch(e) {}

        if (_operatorFetchDone) return;

        let fetchCount = 0;
        const myName = _getMyName();

        const doFetch = async () => {
            if (_operatorFetchDone) { clearInterval(_operatorFetchTimer); return; }
            fetchCount++;
            try {
                const robot = await _fetchSingleRobot(robotId);
                if (_operatorFetchDone) return;
                const currentName = robot?.robotStatus?.lastOperatedUserName || null;
                if (currentName && currentName !== baselineName && currentName !== myName) {
                    _showOperatorPanel(currentName);
                    baselineName = currentName;
                }
            } catch(e) {}
            if (fetchCount >= OPERATOR_FETCH_COUNT) {
                clearInterval(_operatorFetchTimer);
                _operatorFetchTimer = null;
            }
        };

        _operatorFetchTimer = setInterval(doFetch, OPERATOR_FETCH_INTERVAL);
    }

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

            /* [2] 대기장소 마커 반전 로직 (글자 방향 보존) */
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

    // 기체 트래킹 로직
    function updateRobotContext() {
        const path = window.location.href;
        if (NEUBIE_HOSTS.some(h => path.includes(`${h}/ko/remote/robot/`))) {
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
            width: width, backgroundColor: '#111111', color: '#fff',
            borderRadius: '24px', padding: '20px', zIndex: '1000000',
            fontFamily: 'Pretendard, sans-serif', boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            border: '4px solid transparent', display: 'none', transform: left === '50%' ? 'translate(-50%, -50%)' : 'none',
            backgroundImage: 'linear-gradient(#111111, #111111), linear-gradient(135deg, #6366f1, #ec4899)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden',
            boxSizing: 'border-box',
        });
        return el;
    }

    const dashboard = createContainer('neubie-dashboard', 'min(580px, 94vw)', '50%', '50%');
	
    (function ensureNoOverflowForUser() {
        const userName = localStorage.getItem('neubie_user_name');
        const styleId = 'neubie-dash-overflow-fix';
        if (document.getElementById(styleId)) return;
        const st = document.createElement('style');
        st.id = styleId;
        st.textContent = `
            #neubie-dashboard, #neubie-dashboard * {
                max-width: 100% !important;
                box-sizing: border-box !important;
            }
            #neubie-dashboard select,
            #neubie-dashboard input,
            #neubie-dashboard button {
                min-width: 0 !important;
            }
        `;
        document.head.appendChild(st);
    })();
	
    const batteryPopup = createContainer('neubie-battery-popup', '380px', '20px', 'auto', '20px');

    function makeDraggable(handleEl, targetEl) {
        let isDragging = false, startX, startY, startLeft, startTop;

        handleEl.style.cursor = 'grab';

        handleEl.addEventListener('mousedown', (e) => {
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'A') return;

            isDragging = true;
            targetEl.dataset.dragging = 'true';

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
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let newLeft = startLeft + (e.clientX - startX);
            let newTop  = startTop  + (e.clientY - startY);

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

    /* ============================================================
        SECTION 4. 배터리 및 업무 연동 로직
       ============================================================ */
    let _batteryInitialized = false;

    function buildBatteryShell() {
        batteryPopup.innerHTML = '';
        const header = document.createElement('div');
        header.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #333333; padding-bottom:10px;";
        const titleB = document.createElement('b');
        titleB.textContent = "🔋 실시간 성남 배터리 현황";
        titleB.style.cssText = "color:#eee; font-size:18px;";
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '복사';
        Object.assign(copyBtn.style, {
            background:'#3b82f6', color:'white', border:'none',
            padding:'10px 20px',
            borderRadius:'8px', cursor:'pointer', fontWeight:'bold',
            fontSize:'15px',
            transition:'0.2s'
        });
        copyBtn.onclick = (e) => copyToClipboard(e.target);
        header.append(titleB, copyBtn);
        batteryPopup.appendChild(header);
        makeDraggable(header, batteryPopup);

        const list = document.createElement('div');
        list.id = 'neubie-battery-list';
        batteryPopup.appendChild(list);

        config.batteryIds.forEach((c) => {
            const item = document.createElement('div');
            item.dataset.batteryId = c.id;
            item.style.cssText = `
                display:flex;
                justify-content:space-between;
                align-items:center;
                background:rgba(255,255,255,0.05);
                padding:15px 20px;
                border-radius:12px;
                margin-bottom:10px;
                border-left:5px solid #666;
                font-size: 16px !important;
            `;
            item.innerHTML = `
                <span style="font-weight:500;" class="bat-name">⚪ ${c.name}</span>
                <span style="font-weight:bold; font-size: 20px;" class="bat-val">- %</span>
            `;
            list.appendChild(item);
        });
        _batteryInitialized = true;
    }

    let _batteryFetching = false;
    async function updateBatteryStatus() {
        if (batteryPopup.dataset.dragging === 'true') return;
        if (_batteryFetching) return;
        _batteryFetching = true;
        try {
            if (!_batteryInitialized || !batteryPopup.querySelector('#neubie-battery-list')) {
                buildBatteryShell();
            }

            state.lastBatteryData = [];

            const results = await Promise.all(
                config.batteryIds.map(c =>
                    fetch(`https://core.neubie.ai/robots/${c.id}/`, {
                        credentials: 'include',
                        headers: getAuthHeaders()
                    })
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null)
                )
            );

            config.batteryIds.forEach((c, i) => {
                const raw = results[i];
                const rs  = raw?.robotStatus ?? {};

                let batteryVal = "- %", statusText = "OFF", accentColor = "#666", statusIcon = "⚪";

                if (raw && rs.isConnecting) {
                    const battery = Math.round(raw.battery ?? rs.battery ?? 0);
                    batteryVal = `${battery}%`;

                    if (rs.isCharging || rs.isWirelessChargerConnected) {
                        accentColor = "#22c55e"; statusIcon = "🟢"; statusText = "충전 중";
                    } else if (raw.currentScenario) {
                        accentColor = "#3b82f6"; statusIcon = "🔵"; statusText = "순찰 중";
                    } else {
                        accentColor = "#888888"; statusIcon = "⚪"; statusText = "대기 중";
                    }
                }

                state.lastBatteryData.push({ shortName: c.shortName, battery: batteryVal, statusText });

                const item = batteryPopup.querySelector(`[data-battery-id="${c.id}"]`);
                if (item) {
                    item.style.borderLeft = `5px solid ${accentColor}`;
                    item.querySelector('.bat-name').textContent = `${statusIcon} ${c.name}`;
                    const valEl = item.querySelector('.bat-val');
                    valEl.textContent = batteryVal;
                    valEl.style.color = accentColor;
                }
            });
        } finally {
            _batteryFetching = false;
        }
    }

    function copyToClipboard(btn) {
        const now = new Date();
        let hour = now.getHours();
        if (now.getMinutes() >= 50) hour = (hour + 1) % 24;
        let copyText = `[${String(hour).padStart(2,'0')}시 성남 기체 배터리 현황]\n`;
        state.lastBatteryData.forEach(item => {
            copyText += `• ${item.shortName}: ${item.battery} (${item.statusText})\n`;
        });
        navigator.clipboard.writeText(copyText).then(() => {
            const originalText = btn.textContent;
            const originalBg   = btn.style.background;
            btn.textContent    = '복사됨';
            btn.style.background = '#22c55e';
            setTimeout(() => {
                btn.textContent    = originalText;
                btn.style.background = originalBg;
            }, 1500);
        }).catch(() => {
            alert('복사 실패 — 클립보드 권한을 확인해주세요.');
        });
    }

    /* ============================================================
        SECTION 4-1. [서버 동기화] GitHub JSON 기반 업무 로드
       ============================================================ */
    function syncTasksFromServer() {
        const myName = localStorage.getItem('neubie_user_name');
        if (!myName) return;

        const dataUrl = `https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/daily_tasks.json?t=${Date.now()}`;
		const insuUrl = `https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/insu_data.json?t=${Date.now()}`;

        // daily_tasks + insu_data 병렬 fetch
        Promise.all([
            fetch(dataUrl, {cache: 'no-store'}).then(r => r.json()),
            fetch(insuUrl, {cache: 'no-store'}).then(r => r.json()),
        ]).then(([data, insu]) => {
            state.insuData = insu;

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
        SECTION 4-2 시간 계산 및 상태 판단
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
        if (isMonitoring) {
            remainMin -= 10; 
        }

        return {
            isExpired: currScore > endScore,
            remainMin: remainMin,
            score: startScore
        };
    }

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

        // ── Type 2: 지하철 스타일 ─────────────────────────
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

        function getTaskStatus(rawTime) {
            if (!rawTime) return { isExpired: false, remainMin: -1, score: 0 };

            const now = new Date();
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

        const inlineContainer = document.getElementById('inline-task-container');
        if (inlineContainer) inlineContainer.innerHTML = '';
        const container = inlineContainer || document.createElement('div'); // fallback

        if (validTasks.length === 0) {
            if (inlineContainer) inlineContainer.innerHTML = `<div style="color:#666; ...">배정된 업무가 없습니다.</div>`;
            return;
        }

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

    taskChannel.onmessage = (e) => {
        if (e.data.type === 'TASK_UPDATE') {
            state.myTodayTasks = e.data.tasks;
            localStorage.setItem('neubie_my_tasks', JSON.stringify(e.data.tasks));
            renderTaskList(state.myTodayTasks);
        }
    };

    /* ============================================================
        SECTION 5. 줄을 서시오 & 중복 관제 완화(구버전 잔여물 style)
       ============================================================ */

    function injectConfigUI() {
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
        SECTION 7. 스마트 네이밍 엔진 카드
       ============================================================ */
    function createNamingCard() {
        const isWknd = isWeekend();
        const card = document.createElement('div');
        card.id = 'namingSection';
        card.style.cssText = 'background:#252525; padding:10px 15px; border-radius:15px; border:1px solid #333333; margin-top:5px;';

        const history = JSON.parse(localStorage.getItem('neubie_robot_history') || '[]');
        let dropdownOptions = history.map(h => {
            const info = ROBOT_MAP[h.id] || { site: "미등록", unit: "#" + h.id };
            return `<option value="${h.id}">${info.site} ${info.unit}</option>`;
        }).join('');

        // 복사 효과 공통 함수
        const applyCopyEffect = (btn) => {
            const originalText = btn.textContent;
            const originalBg = btn.style.background || "#444";
            
            btn.textContent = '복사됨';
            btn.style.background = '#22c55e';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = originalBg;
            }, 1500);
        };

        card.innerHTML = `
            <div style="color:#3b82f6; font-weight:bold; font-size:18px; margin-bottom:10px;">🏷️ 영상 파일명 생성기</div>
            <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                <select id="robotSelector" style="flex: 1.2; background: #333; color: white; border: 1px solid #555; border-radius: 4px; font-size: 15px; padding: 4px;">
                    ${dropdownOptions || '<option>최근 배달 기체 미감지</option>'}
                </select>
                <input type="text" id="taskInput" placeholder="주문번호를 붙여넣으세요." style="flex: 0 1 160px; background: #333; color: white; border: 1px solid #555; padding: 4px; border-radius: 4px; font-size: 15px;">
                <span style="width: 70px; flex-shrink: 0; display: inline-flex;">
                    <button id="copyFileName" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 15px; width: 100%; white-space: nowrap; overflow: hidden;">복사</button>
                </span>
            </div>
            <div style="display: flex; gap: 5px; flex-wrap: nowrap;">
                <button id="btnMulti" class="sub-btn">다중 모니터링</button>
                <button id="btnCombined" class="sub-btn">배송/순찰 띠띠</button>
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
                    const myName = localStorage.getItem('neubie_user_name') || '';
					const finalName = `${getFormattedDate(time)}_${getFormattedHour(time)}_${info.site}_${info.unit}${taskNo}${myName ? '_' + myName : ''}`;
                    navigator.clipboard.writeText(finalName);
                    applyCopyEffect(e.target);
                };
            }

            // 다중 모니터링 버튼
            const multiBtn = card.querySelector('#btnMulti');
            if (multiBtn) {
                multiBtn.onclick = (e) => {
                    const time = getCalculatedTime(10); 
                    const myName = localStorage.getItem('neubie_user_name') || '';
					const finalName = `${getFormattedDate(time)}_${getFormattedHour(time)}_다중모니터링${myName ? '_' + myName : ''}`;
                    navigator.clipboard.writeText(finalName);
                    applyCopyEffect(e.target);
                };
            }

            // 배송/순찰 띠띠 버튼
            const combinedBtn = card.querySelector('#btnCombined');
			if (combinedBtn) combinedBtn.onclick = (e) => {
				const time = getCalculatedTime(40);
				const myName = localStorage.getItem('neubie_user_name') || '';
				const finalName = `${getFormattedDate(time)}_${getFormattedHour(time)}_부산 국립과학관_#171, #170${myName ? '_' + myName : ''}`;
				navigator.clipboard.writeText(finalName);
				applyCopyEffect(e.target);
			};
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
        title.textContent = "뉴비고 도우미";
        title.style.cssText = "color:#3b82f6; font-size:20px; margin:0; font-weight:bold; white-space:nowrap;";

        // ── 패치노트 NEW 뱃지 제어 ──────────────────────────────────
		// 문자열을 넣으면 패치노트 버튼에 빨간 '`' 뱃지가 점멸하며 뜸.
		// 빈 문자열('')로 비우면 뱃지가 사라짐.
		const PATCH_NOTE_NEW_CONTENT = '260705_다중12대';
		
        const patchBtn = document.createElement('button');
        patchBtn.textContent = '패치노트';
        patchBtn.title = '패치노트';
        patchBtn.style.cssText = `
			position:relative;
            background:transparent; border:1px solid #555; color:#aaa;
            border-radius:6px; padding:4px 10px; cursor:pointer;
            font-size:14px; margin-left:6px; vertical-align:middle;
            transition:all 0.2s;
        `;
		
		if (PATCH_NOTE_NEW_CONTENT.trim()) {
			const newBadge = document.createElement('span');
			newBadge.textContent = 'NEW';
			newBadge.title = PATCH_NOTE_NEW_CONTENT; // 마우스 올리면 내용 미리보기(선택사항)
			newBadge.style.cssText = `
				position:absolute; top:-8px; right:-4px;
				background:#ef4444; color:#fff; font-size:9px; font-weight:bold;
				padding:1px 4px; border-radius:8px; line-height:1.4;
				pointer-events:none; white-space:nowrap;
				animation: neubie-blink 1.5s ease-in-out infinite;
			`;
			patchBtn.appendChild(newBadge);
		}
		
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
                patchTitle.textContent = '패치노트';
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
                        version: 'v1.3',
                        date: '2026-07-08',
                        items: [
                            '룰렛 돌리기 & 동전 던지기 & 개인 메모 기능',
                            '실시간 날씨(기상청 데이터)',
							'다중 자동교대 12대로 확장 / 다중페이지 기체 뜨면 ALT+Q -> 자동시작)',
                            '',
                            '1:1 문의 기능(익명 가능)',
                            '임무 종료된 리센츠/엘스/한성대 페이지 이탈 시 5초 후 자동 사이드',
							'불규칙 순찰 기체 모니터링 미추가 시 알림 기능',
							'개입카드 현재 조작자 표기 / 상태 바 재배치(스크롤 제거)',
							'D-PAD UP/DOWN: 다음 개입 요청받기 / 자동 긴급 정지 ON OFF',
							'D-PAD LEFT/RIGHT: 카메라 밝기 내리기/올리기',
                        ]
                    },
                ];
                // ────────────────────────────────────────────────────────

                const patchContent = document.createElement('div');
                patchContent.style.cssText = "display:grid; gap:16px;";
                patchItems.forEach(patch => {
                    const section = document.createElement('div');
                    section.style.cssText = "background:#252525; border:1px solid #333333; border-radius:12px; padding:14px 16px;";
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
                style="width:60px; border:1px solid #cbd5e1; outline:none; padding:2px 6px; 
                    font-size:15px; font-weight:bold; color:#252525; background:white; 
                    border-radius:4px; text-align:center;">
            <button id="all-close-btn" style="background:#ef4444; color:white; border:none; border-radius:4px; width:22px; height:22px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; font-size:14px;">✕</button>
        `;

        const titleWrap = document.createElement('div');
        titleWrap.style.cssText = "display:flex; align-items:center; gap:0;";
        titleWrap.appendChild(title);
        titleWrap.appendChild(patchBtn);
        
        const boardBtn = document.createElement('button');
        boardBtn.textContent = '게시판';
        boardBtn.style.cssText = "background:transparent; border:1px solid #475569; color:#ffffff; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:14px; margin-left:4px;";
        boardBtn.onclick = () => openBoardOverlay();
        titleWrap.appendChild(boardBtn);

        const secretBtn = document.createElement('button');
        secretBtn.textContent = '🔒 문의';
        secretBtn.style.cssText = "background:transparent; border:1px solid #a78bfa; color:#c4b5fd; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:14px; margin-left:4px;";
        secretBtn.onmouseenter = () => { secretBtn.style.background='rgba(167,139,250,0.15)'; };
        secretBtn.onmouseleave = () => { secretBtn.style.background='transparent'; };
        secretBtn.onclick = () => openSecretOverlay();
        titleWrap.appendChild(secretBtn);

        headerContainer.appendChild(titleWrap);
        headerContainer.appendChild(nameArea);
        dashboard.appendChild(headerContainer);

        makeDraggable(headerContainer, dashboard);

        setTimeout(() => {
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
                intervalSelect.onchange = () => {
                    const selectedValue = intervalSelect.value;
                    localStorage.setItem('neubie_remind_int', selectedValue);
                    
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
        list.style.cssText = "display:grid; gap:8px; width:100%; box-sizing:border-box;";

        // 1. 업무 알림 설정 (태스크 리스트 인라인 삽입)
        const taskCard = document.createElement('div');
        taskCard.style.cssText = "background:#252525; padding:15px; border-radius:15px; border:1px solid #333333;";
        const storedName = localStorage.getItem('neubie_user_name') || "사용자";
        const currentInt = localStorage.getItem('neubie_remind_int') || '0';
        taskCard.innerHTML = `
            <div style="margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px; flex-wrap:nowrap;">
                    <div style="font-weight:bold; font-size:17px; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📋 ${storedName}의 일일 업무</div>
                    <button id="btn-type1" style="padding:3px 8px; border-radius:4px; font-size:12px; font-weight:bold; cursor:pointer; border:2px solid #f59e0b; background:#f59e0b; color:#000;">알림1</button>
                    <button id="btn-type2" style="padding:3px 8px; border-radius:4px; font-size:12px; font-weight:bold; cursor:pointer; border:2px solid #2563eb; background:transparent; color:#60a5fa;">알림2</button>
                    <select id="remind-inline" style="background:#333; color:white; border:1px solid #555; font-size:13px; border-radius:4px; padding:2px;">
                        <option value="0" ${currentInt === '0' ? 'selected' : ''}>알림 없음</option>
                        <option value="3" ${currentInt === '3' ? 'selected' : ''}>3분 전</option>
                        <option value="5" ${currentInt === '5' ? 'selected' : ''}>5분 전</option>
                    </select>
                </div>
            </div>
        `;
        // 알림 타입 토글
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

        if (window.currentMyTasks && window.currentMyTasks.length > 0) {
            renderTaskList(window.currentMyTasks);
        } else {
            taskInline.innerHTML = `<div style="color:#666; font-size:14px; padding:8px 0;">배정된 업무가 없습니다.</div>`;
        }

        // 맵 최적화 카드
        const mapCard = document.createElement('div');
        mapCard.style.cssText = "background:#252525; padding:8px 12px; border-radius:15px; border:1px solid #333333; display:flex; justify-content:space-between; align-items:center;";
        mapCard.innerHTML = `<span style="font-weight:bold; font-size:15px;">🗺️ 요기요 페이지 최적화</span>`;

        // 맵 최적화 (체크박스, 멘트 없이 이름만)
        const mapToggle = document.createElement('button');
        mapToggle.textContent = state.isMapOpt ? 'ON' : 'OFF';
        mapToggle.style.cssText = `background:${state.isMapOpt ? '#2563eb' : '#444'}; color:white; border:none; padding:4px 0; border-radius:6px; cursor:pointer; font-weight:bold; font-size:13px; width:44px; text-align:center;`;
        mapToggle.onclick = () => {
            state.isMapOpt = !state.isMapOpt;
            localStorage.setItem('neubie_opt_map', state.isMapOpt);
            mapToggle.textContent = state.isMapOpt ? 'ON' : 'OFF';
            mapToggle.style.background = state.isMapOpt ? '#2563eb' : '#444';
            injectMapStyle();
        };

        // ⓘ 요기요 페이지 최적화 기능 설명 버튼
        const mapInfoBtn = document.createElement('button');
        mapInfoBtn.textContent = 'i';
        mapInfoBtn.title = '기능 설명';
        mapInfoBtn.style.cssText = `
            width:22px; height:22px; border-radius:50%; border:2px solid #aaa;
            background:transparent; color:#aaa; font-size:13px; font-weight:bold;
            cursor:pointer; display:flex; align-items:center; justify-content:center;
            margin-right:8px; flex-shrink:0; line-height:1; padding:0;
            transition:border-color 0.2s, color 0.2s;
        `;
        mapInfoBtn.onmouseenter = () => { mapInfoBtn.style.borderColor='#60a5fa'; mapInfoBtn.style.color='#60a5fa'; };
        mapInfoBtn.onmouseleave = () => { mapInfoBtn.style.borderColor='#aaa'; mapInfoBtn.style.color='#aaa'; };
        mapInfoBtn.onclick = (e) => {
            e.stopPropagation();
            let mapInfoOverlay = document.getElementById('neubie-map-info-overlay');
            if (!mapInfoOverlay) {
                mapInfoOverlay = document.createElement('div');
                mapInfoOverlay.id = 'neubie-map-info-overlay';
                mapInfoOverlay.style.cssText = `
                    position:fixed; inset:0; background:transparent; pointer-events:none;
                    z-index:2147483646; display:flex; align-items:center; justify-content:center;
                    font-family:Pretendard, sans-serif;
                `;
                const mapInfoBox = document.createElement('div');
                mapInfoBox.style.cssText = `
                    background:#1e1e2e; color:#e2e8f0; border-radius:18px; pointer-events:auto;
                    border:1.5px solid #3b82f6; padding:36px 40px 32px 40px;
                    max-width:600px; width:90%; max-height:80vh; overflow-y:auto;
                    position:relative; box-shadow:0 10px 50px rgba(0,0,0,0.7);
                `;
                const mapInfoTitle = document.createElement('div');
                mapInfoTitle.textContent = '기능 설명';
                mapInfoTitle.style.cssText = `font-size:22px; font-weight:bold; margin-bottom:20px; color:#93c5fd;`;
                const mapInfoClose = document.createElement('button');
                mapInfoClose.textContent = '✕';
                mapInfoClose.style.cssText = `
                    position:absolute; top:16px; right:18px;
                    background:transparent; border:none; color:#aaa;
                    font-size:20px; cursor:pointer; line-height:1; padding:4px 8px;
                    border-radius:6px; transition:color 0.2s;
                `;
                mapInfoClose.onmouseenter = () => { mapInfoClose.style.color='#fff'; };
                mapInfoClose.onmouseleave = () => { mapInfoClose.style.color='#aaa'; };
                mapInfoClose.onclick = () => { mapInfoOverlay.style.display='none'; };
                const mapInfoContent = document.createElement('div');
                mapInfoContent.style.cssText = `font-size:13px; line-height:1.8; color:#cbd5e1;`;
                mapInfoContent.innerHTML = `
                    역삼 요기요 / 송도 요기요 / 성수 요기요 / 성남 삼평동<br>
                    페이지에서 흰색 마커를 숨겨서 최적화.<br>
                    대기장소 마커(주황)를 역방향으로 뒤집어서 보기 쉽도록 함.<br>
                    기존 뉴비고 상의 아이콘 숨기기 기능은 여전히 작동.<br>
                `;
                mapInfoBox.appendChild(mapInfoClose);
                mapInfoBox.appendChild(mapInfoTitle);
                mapInfoBox.appendChild(mapInfoContent);
                mapInfoOverlay.appendChild(mapInfoBox);
                const r0 = dashboard.getBoundingClientRect();
                mapInfoOverlay.style.top = r0.top + 'px';
                mapInfoOverlay.style.left = r0.left + 'px';
                mapInfoOverlay.style.width = r0.width + 'px';
                mapInfoOverlay.style.height = r0.height + 'px';
                document.body.appendChild(mapInfoOverlay);
            } else {
                const r = dashboard.getBoundingClientRect();
                mapInfoOverlay.style.top = r.top + 'px';
                mapInfoOverlay.style.left = r.left + 'px';
                mapInfoOverlay.style.width = r.width + 'px';
                mapInfoOverlay.style.height = r.height + 'px';
                mapInfoOverlay.style.display = 'flex';
            }
        };
        mapCard.appendChild(mapInfoBtn);
        mapCard.appendChild(mapToggle);

        const queueCard = document.createElement('div');
        queueCard.style.cssText = "background:#252525; padding:8px 12px; border-radius:15px; border:1px solid #333333; display:flex; justify-content:space-between; align-items:center;";
        queueCard.innerHTML = `<span style="font-weight:bold; font-size:15px;">🖥️ 다중 모니터링 도우미</span>`;
        const queueEnabled = localStorage.getItem('neubie_handover_enabled') === 'true';
        const queueToggle = document.createElement('button');
        queueToggle.textContent = queueEnabled ? 'ON' : 'OFF';
        queueToggle.style.cssText = `background:${queueEnabled ? '#2563eb' : '#444'}; color:white; border:none; padding:4px 0; border-radius:6px; cursor:pointer; font-weight:bold; font-size:13px; width:44px; text-align:center;`;
        queueToggle.onclick = () => {
            const next = queueToggle.textContent === 'OFF';
            localStorage.setItem('neubie_handover_enabled', next);
            queueToggle.textContent = next ? 'ON' : 'OFF';
            queueToggle.style.background = next ? '#2563eb' : '#444';
            const bar = document.getElementById('neubie-brightness-bar');
            if (!next && bar) {
                bar.remove();
            } else if (next && !bar && isBrightnessPage()) {
                injectMasterBrightness();
            }
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
        // ⓘ 정보 버튼
        const queueInfoBtn = document.createElement('button');
        queueInfoBtn.textContent = 'i';
        queueInfoBtn.title = '기능 설명';
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
                queueInfoTitle.textContent = '기능 설명';
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
                queueInfoContent.style.cssText = `font-size:13px; line-height:1.8; color:#cbd5e1; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;`;
                queueInfoContent.innerHTML = `
				기체별 화질 조절<br>
                기체별 헤드램프 토글<br>
				기체 카메라 밝기 한 번에 조절<br>
				카메라 위치 스왑<br>
				multimonitoring.vercel.app 이용 시 교대 기체 업로드<br>
				업로드된 교대 기체 받기(최근 20분까지만 유효) -> 자동 시작(12대까지)<br>
				'뉴비고 도우미'만 이용하더라도 교대 기체 받기 가능<br>
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
        queueCard.appendChild(queueToggle);

        // 반반 2열
        const bottomRow = document.createElement('div');
        bottomRow.style.cssText = "display:grid; grid-template-columns:1fr 1fr; gap:8px;";

        // 스케줄 비교 카드
        const scheduleCard = document.createElement('div');
        scheduleCard.style.cssText = "background:#252525; padding:8px 12px; border-radius:15px; border:1px solid #333333; cursor:pointer; display:flex; align-items:center;";
        scheduleCard.innerHTML = `<div style="font-weight:bold; font-size:15px;">📅 스케줄표 + 좌석 배치도</div>`;
        window._neubieScheduleCard = scheduleCard;
        scheduleCard.onclick = () => {
            const isActive = scheduleCard.style.outline !== 'none' && scheduleCard.style.outline !== '';
            scheduleCard.style.outline = isActive ? 'none' : '2px solid #ef4444';
            if (!isActive) openScheduleOverlay();
        };

        const rouletteCard = document.createElement('div');
        rouletteCard.style.cssText = "background:#252525; padding:8px 12px; border-radius:15px; border:1px solid #333333; cursor:pointer; display:flex; align-items:center;";
        rouletteCard.innerHTML = `<div style="font-weight:bold; font-size:15px;">🎡 룰렛 & 동전 & 메모</div>`;
        window._neubieRouletteCard = rouletteCard;
        rouletteCard.onclick = () => {
            const isActive = rouletteCard.style.outline !== 'none' && rouletteCard.style.outline !== '';
            rouletteCard.style.outline = isActive ? 'none' : '2px solid #ef4444';
            if (!isActive) {
                openRouletteOverlay();
            } else {
                const rouletteOverlay = document.getElementById('neubie-roulette-overlay');
                if (rouletteOverlay) rouletteOverlay.style.display = 'none';
            }
        };

        // 배터리 현황
        const isBatteryOpen = batteryPopup.style.display === 'block';
        const batteryCard = document.createElement('div');
        batteryCard.style.cssText = "background:#252525; padding:8px 12px; border-radius:15px; border:1px solid #333333; display:flex; justify-content:space-between; align-items:center;";
        batteryCard.innerHTML = `
            <div style="flex:1;">
                <div style="font-weight:bold; font-size:15px; margin-bottom:3px;">실시간 성남 배터리 현황</div>
            </div>`;
        batteryCard.style.cursor = 'pointer';
        window._neubieBatteryCard = batteryCard;
        batteryCard.onclick = () => {
            const isActive = batteryCard.style.outline !== 'none' && batteryCard.style.outline !== '';
            batteryCard.style.outline = isActive ? 'none' : '2px solid #ef4444';
            toggleBattery();
            if (window.currentMyTasks && window.currentMyTasks.length > 0) {
                renderTaskList(window.currentMyTasks);
            }
        };

        const weatherCard = document.createElement('div');
        weatherCard.style.cssText = "background:#252525; padding:8px 12px; border-radius:15px; border:1px solid #333333; cursor:pointer; display:flex; align-items:center;";
        weatherCard.innerHTML = `<div style="font-weight:bold; font-size:15px;">☀️ 송내 현재 날씨 (기상청 API)</div>`;
        window._neubieWeatherCard = weatherCard;
        weatherCard.onclick = () => {
            const isActive = weatherCard.style.outline !== 'none' && weatherCard.style.outline !== '';
            weatherCard.style.outline = isActive ? 'none' : '2px solid #ef4444';
            if (!isActive) {
                openWeatherOverlay();
            } else {
                const weatherOverlay = document.getElementById('neubie-weather-overlay');
                if (weatherOverlay) weatherOverlay.style.display = 'none';
            }
        };

        bottomRow.appendChild(mapCard);      // 지도 최적화
        bottomRow.appendChild(batteryCard);  // 성남 배터리
        bottomRow.appendChild(queueCard);    // 다중 도우미
        bottomRow.appendChild(scheduleCard); // 스케줄표
        bottomRow.appendChild(weatherCard); // 날씨
        bottomRow.appendChild(rouletteCard);     // 최적화 팁

        list.appendChild(bottomRow);

        // 영상 파일명 도우미
        list.appendChild(createNamingCard());

        dashboard.appendChild(list);
    }

    let batteryRefreshInterval = null;

    // 팝업 열 때만 생성
    function toggleBattery() {
        if (batteryPopup.style.display !== 'block') {

            updateBatteryStatus();  
            batteryPopup.style.display = 'block';

            // 5초 후 1회 갱신 → 필요없으니 삭제, 바로 1분 간격으로
			if (batteryRefreshInterval) clearInterval(batteryRefreshInterval); // 중복 방지
            batteryRefreshInterval = setInterval(() => {
                if (batteryPopup.style.display === 'block') updateBatteryStatus();
                else clearInterval(batteryRefreshInterval);
            }, 60000);

        } else {
            batteryPopup.style.display = 'none';
            if (window._neubieBatteryCard) window._neubieBatteryCard.style.outline = 'none';
            clearInterval(batteryRefreshInterval);
        }
    }

    function closeAllPopups() {
        dashboard.style.display = 'none';
        batteryPopup.style.display = 'none';
        if (window._neubieBatteryCard) window._neubieBatteryCard.style.outline = 'none';

		document.getElementById('ho-remote-peek')?.remove();
    	document.getElementById('ho-remote-panel')?.remove();
		
        const queueInfoOverlay = document.getElementById('neubie-queue-info-overlay');
        if (queueInfoOverlay) queueInfoOverlay.style.display = 'none';
        const mapInfoOverlay = document.getElementById('neubie-map-info-overlay');
        if (mapInfoOverlay) mapInfoOverlay.style.display = 'none';
        const tipsOverlay = document.getElementById('neubie-tips-overlay');
        if (tipsOverlay) tipsOverlay.style.display = 'none';
        const patchOverlay = document.getElementById('neubie-patch-overlay');
        if (patchOverlay) patchOverlay.style.display='none';
        const boardOverlay = document.getElementById('neubie-board-overlay');
        if (boardOverlay) boardOverlay.style.display='none';
        const secretOverlay = document.getElementById('neubie-secret-overlay');
        if (secretOverlay) secretOverlay.style.display='none';
        const weatherOverlay = document.getElementById('neubie-weather-overlay');
        if (weatherOverlay) weatherOverlay.style.display='none';
        if (window._neubieWeatherCard) window._neubieWeatherCard.style.outline = 'none';
        const rouletteOverlay = document.getElementById('neubie-roulette-overlay');
        if (rouletteOverlay) rouletteOverlay.style.display = 'none';
        if (window._neubieRouletteCard) window._neubieRouletteCard.style.outline = 'none';
    }

    // ── 유효성 검증 (1시간 이내 데이터) ──
	const isDataValid = (updatedAt) => {
        if (!updatedAt) return false;
        // +09:00 명시로 한국시간 고정
        const updated = new Date(updatedAt.replace(' ', 'T') + '+09:00');
        return (Date.now() - updated.getTime()) < 20 * 60 * 1000;
    };

    // ── 핸드오버 레이아웃 ──────────────────────────────────
	async function initHandoverLayout() {
		let panel = document.getElementById('ho-remote-panel');
        if (panel) {
            panel.style.top = '0px';
            const r = await githubGet();
            const dpMsgEl = document.getElementById('ho-dp-msg');
            if (dpMsgEl) {
                if (r && !isDataValid(r.data?.updatedAt)) {
                    dpMsgEl.textContent = '20분 초과로 로드 실패';
                    dpMsgEl.style.color = '#ef4444';
                    document.querySelectorAll('.ho-remote-cell').forEach(c => {
                        c.textContent = '—';
                        Object.assign(c.style, { background: 'rgba(255,255,255,0.45)', color: '#b0bec5',
                            border: '1.5px dashed #c8d2e0', cursor: 'default' });
                        c.dataset.unit = ''; c.dataset.selected = 'false'; c.dataset.done = 'false';
                    });
                }
            }
            return;
        }

		panel = document.createElement('div');
		panel.id = 'ho-remote-panel';
		Object.assign(panel.style, {
			position: 'fixed', top: '0px', left: '50%', transform: 'translateX(-50%)',
			zIndex: '2147483646', width: '560px',
			background: 'rgba(200, 200, 200, 0.98)',
			borderRadius: '0 0 14px 14px', padding: '5px 8px 7px',
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
			fontSize: '10px', color: '#64748b',
			overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
			flex: '1', minWidth: '0',
            background: 'rgba(255,255,255,0.85)',
            borderRadius: '5px',
            padding: '2px 7px',
		});
		dpMsg.textContent = '로딩 중...';

		const setDpMsg = (msg, color = '#64748b') => {
			dpMsg.textContent = msg;
			dpMsg.style.color = color;
		};

		// ── 그리드 셀 ──
		const MAX_UNITS = 6;

		const cellIdle = c => {
			Object.assign(c.style, { background: 'rgba(255,255,255,0.85)', color: '#252525',
				border: '1.5px solid #93c5fd', cursor: 'pointer', fontWeight: '600' });
			c.dataset.selected = 'false';
		};
		const cellEmpty = c => {
			c.textContent = '—';
			Object.assign(c.style, { background: 'rgba(255,255,255,0.45)', color: '#b0bec5',
				border: '1.5px dashed #c8d2e0', cursor: 'default', fontWeight: '400' });
			c.dataset.unit = ''; c.dataset.selected = 'false'; c.dataset.done = 'false';
		};

		// ── 공통 버튼 스타일 헬퍼 ──
		const mkBtn = (text, bg, extra = {}) => {
			const b = document.createElement('button');
			b.textContent = text;
			Object.assign(b.style, {
				background: bg, color: '#fff', border: 'none',
				padding: '3px 9px', borderRadius: '6px', fontSize: '11px',
				fontWeight: '700', cursor: 'pointer', fontFamily: 'Pretendard,sans-serif',
				whiteSpace: 'nowrap', flexShrink: '0',
				...extra,
			});
			return b;
		};

		// ── 헤더 행 (1줄로 모든 버튼 + 로그) ──
		const headerRow = document.createElement('div');
		Object.assign(headerRow.style, {
			display: 'flex', alignItems: 'center', gap: '5px',
			marginBottom: '4px', paddingBottom: '4px',
			borderBottom: '1px solid rgba(0,0,0,0.08)',
			flexWrap: 'nowrap',
		});

		// 다중 모니터링 버튼
		const multiBtn = mkBtn('다중 파일명', '#475569', { minWidth: '70px' });
		multiBtn.onclick = () => {
			const time = getCalculatedTime(10);
			const finalName = `${getFormattedDate(time)}_${getFormattedHour(time)}_다중모니터링`;
			navigator.clipboard.writeText(finalName);
			multiBtn.textContent = '복사됨';
            multiBtn.style.background = '#22c55e';
			setTimeout(() => {
                multiBtn.textContent = '다중 파일명';
                multiBtn.style.background = '#475569';
            }, 1500);
		};

		// 성남 배터리 버튼
		const battBtn = mkBtn('성남 배터리', '#475569');
		battBtn.id = 'ho-batt-btn';
		battBtn.onclick = () => {
			toggleBattery();
			const isOpen = batteryPopup.style.display === 'block';
            battBtn.textContent = isOpen ? '배터리 닫기' : '성남 배터리';
            battBtn.style.background = isOpen ? '#ef4444' : '#475569';
		};

		// 교대 받기 버튼
		const fetchBtn = mkBtn('교대 기체 로드', '#3b82f6');

		headerRow.appendChild(multiBtn);
		headerRow.appendChild(battBtn);
		headerRow.appendChild(fetchBtn);
		headerRow.appendChild(dpMsg);

		// 우측: 자동/수동 시작
		const rightBtns = document.createElement('div');
		Object.assign(rightBtns.style, { marginLeft: 'auto', display: 'flex', gap: '5px', flexShrink: '0' });

		const autoBtn = mkBtn('자동 시작', '#6366f1');
		const posBtn = mkBtn('기체 위치', '#64748b');

		rightBtns.appendChild(autoBtn);
		rightBtns.appendChild(posBtn);
		headerRow.appendChild(rightBtns);
		panel.appendChild(headerRow);

		// ── 그리드 ──
		const grid = document.createElement('div');
		Object.assign(grid.style, {
			display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '3px',
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
				height: '26px', borderRadius: '7px', border: '1.5px dashed #c8d2e0',
				background: 'rgba(255,255,255,0.45)', color: '#b0bec5', fontSize: '10px',
				fontFamily: 'Pretendard,sans-serif', cursor: 'default',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				textAlign: 'center', lineHeight: '1.3', padding: '3px',
			});
			grid.appendChild(cell);
			return cell;
		});

		panel.appendChild(grid);

		const githubGet = async () => {
            try {
                const res = await fetch(
                    `https://multimonitoring.vercel.app/api/handover?t=${Date.now()}`,
                    { cache: 'no-store' }
                );
                if (!res.ok) return null;
                const data = await res.json();
                return { data };
            } catch(e) { console.log('githubGet error:', e); return null; }
        };
		
		const patchTaken = async (names) => {
			try {
				const res = await fetch(`https://multimonitoring.vercel.app/api/handover`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ addTaken: names }),
				});
				if (!res.ok) console.log('patchTaken 실패:', res.status);
			} catch (e) {
				console.log('patchTaken 오류:', e);
			}
		};

		// ── 교대받기 버튼 ──
		let _fetchBtnRunning = false;
        fetchBtn.addEventListener('click', async () => {
            if (_fetchBtnRunning) return;
            _fetchBtnRunning = true;
            fetchBtn.disabled = true;
            fetchBtn.style.opacity = '0.5';
            try {
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
                setDpMsg(`교대 기체 로드됨 (${data.handover_by || '?'} - ${units.length}대)`, '#22c55e');
            } finally {
                _fetchBtnRunning = false;
                fetchBtn.disabled = false;
                fetchBtn.style.opacity = '1';
            }
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
			if (!modal) { setDpMsg('모달 없음', '#ef4444'); return { confirmed: false, checkedUnits: [] }; }

            // ── 체크박스가 실제로 나타날 때까지 대기 (최대 15초) ──
            setDpMsg('기체 목록 로딩 대기 중...', '#94a3b8');
            const isReady = await new Promise(resolve => {
                // 이미 있으면 즉시 통과
                if (modal.querySelector('input[type="checkbox"]')) { resolve(true); return; }
                const t = setTimeout(() => { obs.disconnect(); resolve(false); }, 15000);
                const obs = new MutationObserver(() => {
                    if (modal.querySelector('input[type="checkbox"]')) {
                        clearTimeout(t); obs.disconnect(); resolve(true);
                    }
                });
                obs.observe(modal, { childList: true, subtree: true });
            });
            if (!isReady) { setDpMsg('기체 목록 로딩 실패 (타임아웃)', '#ef4444'); return { confirmed: false, checkedUnits: [] }; }

            const reactCheck = (label) => {
				if (!label) return false;
				const checkbox = label.querySelector('input[type="checkbox"]');
				if (checkbox?.checked) return true;
				label.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
				return true;
			};

			const checkedUnits = [];
			for (let i = 0; i < units.length; i++) {
				const name = units[i];
				setDpMsg(`${name} (${i+1}/${units.length})`, '#3b82f6');
				let clicked = false;

				const labels = document.querySelectorAll('label');
				for (const label of labels) {
					const text = label.querySelector('div.px-12 span')?.textContent.trim();
					if (!text) continue;
					if (text === name) {
						if (reactCheck(label)) { clicked = true; break; }
					}
				}

				if (clicked) checkedUnits.push(name);
				await new Promise(r => setTimeout(r, 80));
			}

			if (!checkedUnits.length) {
				setDpMsg('선택된 기체 없음', '#ef4444');
				return { confirmed: false, checkedUnits: [] };
			}

			setDpMsg(`${checkedUnits.length}/${units.length} 선택 완료, 시작하기 대기 중...`, '#22c55e');

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
				return { confirmed: true, checkedUnits };
			} else {
				setDpMsg('시작하기 버튼을 직접 눌러주세요', '#f59e0b');
				return { confirmed: false, checkedUnits };
			}
		};

		autoBtn.addEventListener('click', async () => {
			const modal = document.querySelector('[data-qk="remote-multiple-select-robot-dialog"]');
			if (!modal) {
				setDpMsg('뉴비고에서 기체 선택 모달을 먼저 열어주세요', '#f59e0b');
				return;
			}

			const result = await githubGet();
			if (!result || !isDataValid(result.data?.updatedAt)) {
				setDpMsg('교대 기체 데이터가 없습니다. 로드 먼저 해주세요', '#f59e0b');
				return;
			}

			const { units = [], taken = [] } = result.data;
			const available = units.filter(u => !taken.includes(u)).slice(0, 6);

			if (!available.length) {
				setDpMsg('배정 가능한 기체가 없습니다 (전체 배정 완료)', '#94a3b8');
				return;
			}

			const { confirmed, checkedUnits } = await runAutoSelect(available, new Array(available.length).fill(null));

			if (!checkedUnits.length) return;

			if (confirmed) {
				await patchTaken(checkedUnits);
				setDpMsg(`${checkedUnits.length}대 시작 및 서버 반영 완료`, '#22c55e');
			} else {
				setDpMsg(`${checkedUnits.join(', ')} 체크됨 — 시작하기 버튼을 직접 누르면 taken 반영은 되지 않습니다`, '#f59e0b');
			}
		});

		posBtn.addEventListener('click', () => {
			const cards = [...document.querySelectorAll(
				'.flex.h-full.w-full.items-center.justify-center.overflow-hidden .p-3'
			)];
			if (!cards.length) {
				setDpMsg('현재 추가된 기체가 없습니다', '#f59e0b');
				return;
			}

			cards.sort((a, b) => parseInt(a.style.order || '0') - parseInt(b.style.order || '0'));

			const names = cards.map(c =>
				c.querySelector('.bg-prmary-50')?.textContent?.trim() || '—'
			);

			cells.forEach((cell, i) => {
				if (names[i]) {
					cell.textContent = names[i];
					cell.dataset.unit = names[i];
					cell.dataset.done = 'false';
					cell.dataset.selected = 'false';
					cell.draggable = true;
					cellIdle(cell);
				} else {
					cellEmpty(cell);
				}
			});

			// 드래그 이벤트 중복 방지 — 최초 1회만
			if (!cells[0]._dragRegistered) {
				let dragSrc = null;
				cells.forEach(cell => {
					cell._dragRegistered = true;
					cell.addEventListener('dragstart', () => { dragSrc = cell; cell.style.opacity = '0.4'; });
					cell.addEventListener('dragend', () => { cell.style.opacity = '1'; });
					cell.addEventListener('dragover', e => e.preventDefault());
					cell.addEventListener('drop', () => {
						if (!dragSrc || dragSrc === cell) return;
						[dragSrc.textContent, cell.textContent] = [cell.textContent, dragSrc.textContent];
						[dragSrc.dataset.unit, cell.dataset.unit] = [cell.dataset.unit, dragSrc.dataset.unit];
						const allCards = [...document.querySelectorAll(
							'.flex.h-full.w-full.items-center.justify-center.overflow-hidden .p-3'
						)];
						cells.forEach((c, idx) => {
							const targetCard = allCards.find(ac =>
								ac.querySelector('.bg-prmary-50')?.textContent?.trim() === c.dataset.unit
							);
							if (targetCard) targetCard.style.order = String(idx);
						});
						const order = cells.filter(c => c.dataset.unit).map(c => c.dataset.unit);
						localStorage.setItem('neubie_card_order', JSON.stringify(order));
						setDpMsg('순서 저장됨', '#22c55e');
					});
				});
			}

			setDpMsg('드래그로 순서를 변경하세요', '#3b82f6');
		});

		// ── 자동 Fetch (패널 열릴 때 1회) ──
		setDpMsg('인계 데이터 확인 중...', '#3b82f6');
		const result = await githubGet();
		if (result && isDataValid(result.data.updatedAt)) {
            const units = result.data.units || [];
            if (units.length) {
                setDpMsg(`교대 기체 로드됨 (${result.data.handover_by || '?'} - ${units.length}대)`, '#22c55e');
            } else {
                setDpMsg('교대 기체 데이터가 없습니다', '#f59e0b');
            }
        } else if (result && result.data?.updatedAt) {
            setDpMsg('이미 20분이 지난 데이터입니다', '#ef4444');
        } else {
            setDpMsg('교대 기체 데이터가 없습니다', '#f59e0b');
        }

        // ── 20분 만료 감시 (30초마다) ──
        const expiryInterval = setInterval(() => {
            if (panel.style.top !== '0px') return;   // 패널 닫혀있으면 스킵
            if (!isDataValid(result?.data?.updatedAt)) {
                setDpMsg('20분 초과, 기체 목록 만료됨', '#ef4444');
                clearInterval(expiryInterval);
            }
        }, 30000);

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
    SECTION 미모니터링 순찰 감지
   ============================================================ */
	const UNMONITORED_WATCH = [
		{ id: 219, name: '경희대 1호기' },
		{ id: 234, name: 'DMZ' },
		{ id: 76, name: '부산 서면 1호기' },
		{ id: 74, name: '부천 위브 1호기' },
	];
	const UNMONITORED_PANEL_ID = 'neubie-unmonitored-panel';

    let _unmonitoredRunning = false;
    async function checkUnmonitoredRobots() {
        if (!isHandoverPage()) return;
        if (_unmonitoredRunning) return;
        _unmonitoredRunning = true;
        try {
            const alerts = [];
            for (const robot of UNMONITORED_WATCH) {
                try {
                    const res = await fetch(
                        `https://core.neubie.ai/robots/${robot.id}/`,
                        { credentials: 'include',
                          headers: getAuthHeaders()
                        }
                    );
                    const data = await res.json();
                    if (data.currentScenario !== null && data.isMonitoring === false) {
                        alerts.push(`${robot.name} ${data.currentScenarioTypeText || '임무'} 중!`);
                    }
                } catch(e) {}
            }
            const panel = document.getElementById(UNMONITORED_PANEL_ID);
            if (alerts.length > 0) {
                _showUnmonitoredPanel(alerts);
            } else if (panel) {
                panel.remove();
            }
        } finally {
            _unmonitoredRunning = false;
        }
    }

	function _showUnmonitoredPanel(alerts) {
		let panel = document.getElementById(UNMONITORED_PANEL_ID);
		if (!panel) {
			panel = document.createElement('div');
			panel.id = UNMONITORED_PANEL_ID;
			panel.style.cssText = `
				position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
				z-index:999999; pointer-events:none;
				display:flex; flex-direction:column; gap:4px; align-items:center;
			`;
			document.body.appendChild(panel);
		}

		// 2개씩 묶어서 행으로
		const rows = [];
		for (let i = 0; i < Math.min(alerts.length, 4); i += 2) {
			rows.push(alerts.slice(i, i + 2));
		}

		panel.innerHTML = rows.map(row => `
			<div style="display:flex; gap:6px;">
				${row.map(msg => `
					<div style="
						display:flex; align-items:center; gap:8px;
						background:rgba(30,20,60,0.92); border:1px solid #a78bfa;
						border-radius:20px; padding:7px 18px;
						box-shadow:0 4px 16px rgba(0,0,0,0.4);
						font-family:'Pretendard','Noto Sans KR',sans-serif;
						white-space:nowrap;
					">
						<span style="font-size:12px;color:#c4b5fd;">⚠️</span>
						<span style="font-size:14px;font-weight:700;color:#ede9fe;">${msg}</span>
					</div>
				`).join('')}
			</div>
		`).join('');
	}

	if (isHandoverPage() && localStorage.getItem('neubie_handover_enabled') !== 'false') {
		checkUnmonitoredRobots();
		setInterval(checkUnmonitoredRobots, 30000);
	}

	/* ============================================================
    SECTION 화질 조절 버튼 (모니터링 페이지 전용)
   ============================================================ */
	const LEVEL_LABELS = ['', '최소', '낮음', '중간', '높음', '최대'];

	function isMonitoringPage() {
		return NEUBIE_HOSTS.some(h => location.href.includes(`${h}/ko/remote/multiple/monitoring`));
	}

	let _bitrateRunning = false;

	async function injectBitrateButtons() {
		if (!isMonitoringPage()) return;
		if (_bitrateRunning) return;
		_bitrateRunning = true;

		try {
			const cards = document.querySelectorAll('.rounded-8.relative.flex.overflow-hidden');

			// forEach async (병렬) + 방어는 Promise.all
			const promises = [...cards].map(async (card) => {
				if (card.dataset.bitrateInjected) return;
				card.dataset.bitrateInjected = 'true';

				const nameEl = card.querySelector('span.font-size-14.max-w-fit.truncate.font-bold.text-white');
				const robotName = nameEl?.innerText.trim();
				if (!robotName) return;

				try {
					const res = await fetch(
                        `https://core.neubie.ai/robots/?nickname=${encodeURIComponent(robotName)}`,
                        { credentials: 'include', headers: getAuthHeaders() }
                    );
					if (!res.ok) { card.dataset.bitrateInjected = ''; return; }
					const json = await res.json();
					const robot = json.results?.[0];
					if (!robot) { card.dataset.bitrateInjected = ''; return; }

					let currentLevel = robot.robotStatus.bitrateLevel;
					let isHeadLightOn = robot.robotStatus?.isHeadLightOn ?? false;

					const wrapper = document.createElement('div');
					wrapper.style.cssText = `
						position: absolute;
						top: 8px; left: 8px;
						z-index: 999;
						pointer-events: auto;
						display: flex;
						flex-direction: row;
						align-items: center;
						gap: 3px;
						opacity: 0;
						transition: opacity 0.2s;
						background: rgba(20,20,20,0.8);
						border-radius: 8px;
						padding: 3px 6px;
					`;

					card.addEventListener('mouseenter', () => wrapper.style.opacity = '1');
					card.addEventListener('mouseleave', () => wrapper.style.opacity = '0');

					const labelEl = document.createElement('span');
					labelEl.innerText = `화질 ${LEVEL_LABELS[currentLevel]}`;
					labelEl.style.cssText = `
						color: white;
						font-size: 11px;
						font-weight: 600;
						font-family: 'Pretendard', sans-serif;
						white-space: nowrap;
					`;

					let isCooling = false;

					const makeBtn = (label, delta) => {
						const btn = document.createElement('div');
						btn.innerHTML = label;
						btn.style.cssText = `
							color: white;
							font-size: 11px;
							font-weight: 700;
							cursor: pointer;
							user-select: none;
							display: flex;
							align-items: center;
							justify-content: center;
							width: 14px;
							height: 14px;
							border-radius: 4px;
							background: rgba(80,80,80,0.8);
							transition: opacity 0.15s;
						`;
						btn.addEventListener('click', async (e) => {
							e.stopPropagation();
							if (isCooling) return;
							const newLevel = currentLevel + delta;
							if (newLevel < 1 || newLevel > 5) return;
							isCooling = true;
							btn.style.opacity = '0.4';
							try {
								await fetch(`https://core.neubie.ai/robots/${robot.id}/video-bitrate-level/`, {
                                    method: 'PUT',
                                    credentials: 'include',
                                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                                    body: JSON.stringify({ level: newLevel })
                                });
								currentLevel = newLevel;
								labelEl.innerText = `화질 ${LEVEL_LABELS[currentLevel]}`;
							} catch(e) {}
							setTimeout(() => { isCooling = false; btn.style.opacity = '1'; }, 1000);
						});
						return btn;
					};

					const sep = document.createElement('span');
					sep.style.cssText = `color:rgba(255,255,255,0.2);font-size:11px;display:flex;align-items:center;padding:0 3px;`;
					sep.textContent = '|';

					// 헤드 램프 버튼
					let isLampCooling = false;
					const lampBtn = document.createElement('span');
					lampBtn.textContent = '램프';
					lampBtn.style.cssText = `
						color: ${isHeadLightOn ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.25)'};
						font-size: 11px;
						font-weight: ${isHeadLightOn ? '700' : '400'};
						cursor: pointer;
						user-select: none;
						display: flex;
						align-items: center;
						justify-content: center;
						padding: 0 2px;
						transition: color 0.2s, font-weight 0.2s;
						white-space: nowrap;
						height: 100%;
					`;
					lampBtn.addEventListener('click', async (e) => {
						e.stopPropagation();
						if (isLampCooling) return;
						isLampCooling = true;
						lampBtn.style.opacity = '0.4';
						try {
							const r = await fetch(`https://core.neubie.ai/robots/${robot.id}/head-light/`, {
                                method: 'PUT',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                                body: JSON.stringify({ isOn: !isHeadLightOn })
                            });
							if (r.ok) {
								isHeadLightOn = !isHeadLightOn;
								lampBtn.style.color = isHeadLightOn ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.25)';
								lampBtn.style.fontWeight = isHeadLightOn ? '700' : '400';
							}
						} catch(e) {}
						lampBtn.style.opacity = '1';
						setTimeout(() => isLampCooling = false, 1000);
					});

					wrapper.appendChild(makeBtn('▲', 1));
					wrapper.appendChild(labelEl);
					wrapper.appendChild(makeBtn('▼', -1));
					wrapper.appendChild(sep);
					wrapper.appendChild(lampBtn);
					card.style.position = 'relative';
					card.appendChild(wrapper);

				} catch(e) {
					console.warn('화질 버튼 삽입 실패:', e);
					card.dataset.bitrateInjected = '';
				}
			});

			await Promise.all(promises);

		} finally {
			_bitrateRunning = false;

			const remaining = document.querySelectorAll(
				'.rounded-8.relative.flex.overflow-hidden:not([data-bitrate-injected="true"])'
			);
			if (remaining.length > 0) {
		        window._bitrateRetryCount = (window._bitrateRetryCount || 0) + 1;
		        if (window._bitrateRetryCount <= 5) {  // 최대 5회 (10초)
		            setTimeout(injectBitrateButtons, 2000);
		        } else {
		            window._bitrateRetryCount = 0;  // 초기화
		        }
		    } else {
		        window._bitrateRetryCount = 0;  // 성공 시 초기화
		    }
		}
	}

	function registerBitrateObserver() {
		if (!isMonitoringPage()) return;
		if (localStorage.getItem('neubie_handover_enabled') === 'false') return;
		if (window._bitrateObserver) window._bitrateObserver.disconnect();
		let _bitrateThrottle = null;
        window._bitrateObserver = new MutationObserver(() => {
            if (!isMonitoringPage()) return;
            if (_bitrateThrottle) return;  
            _bitrateThrottle = setTimeout(() => {
                injectBitrateButtons();
                _bitrateThrottle = null;
            }, 1500);
        });
		window._bitrateObserver.observe(document.body, { childList: true, subtree: true });
	}

	if (isMonitoringPage() && localStorage.getItem('neubie_handover_enabled') !== 'false') {
		registerBitrateObserver();
	}

    /* ============================================================
        SECTION 9. 전체 밝기 마스터 컨트롤
       ============================================================ */
    const BRIGHTNESS = {
        MIN: 20,
        MAX: 100,
        DEFAULT: 50,
        STORAGE_KEY: 'neubie_brightness',
    };

	function applyBrightnessToAll(value) {
		const brightnessVal = value / 50; // 20~100 → 0.0~2.0 (50이 기준 1.0)
		document.querySelectorAll('video[data-qk="remote-multiple-front-cam"]').forEach(v => {
			v.style.filter = `brightness(${brightnessVal})`;
		});
		localStorage.setItem(BRIGHTNESS.STORAGE_KEY, value);
	}

    // ── UI 생성 ───────────────────────────────────────────
    function injectMasterBrightness() {
        if (document.getElementById('neubie-brightness-bar')) return;

        const savedVal = parseInt(localStorage.getItem(BRIGHTNESS.STORAGE_KEY) ?? BRIGHTNESS.DEFAULT);

        const bar = document.createElement('div');
        bar.id = 'neubie-brightness-bar';
        Object.assign(bar.style, {
            position: 'fixed',
            top: '4px',
            left: '60px',
            zIndex: '2147483640',
            background: 'rgba(15,15,15,0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: '8px',
            padding: '3px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            fontFamily: 'Pretendard, sans-serif',
            userSelect: 'none',
        });

        const icon = document.createElement('span');
        icon.textContent = '☀️';
        icon.style.cssText = 'font-size:14px; line-height:1;';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = 'neubie-master-brightness';
        slider.min = BRIGHTNESS.MIN;
        slider.max = BRIGHTNESS.MAX;
        slider.value = savedVal;
        Object.assign(slider.style, {
            width: '76px',
            height: '4px',
            accentColor: '#ffffff',
            cursor: 'pointer',
            outline: 'none',
            border: 'none',
            background: 'rgba(255,255,255,0.4)',
        });

        const label = document.createElement('span');
        label.style.cssText = 'color:#fff; font-size:13px; font-weight:600; min-width:22px; text-align:right;';
        label.textContent = savedVal;

        slider.addEventListener('input', () => {
            const v = slider.value;
            label.textContent = v;
            applyBrightnessToAll(v);
        });

        bar.appendChild(icon);
        bar.appendChild(slider);
        bar.appendChild(label);
        document.body.appendChild(bar);

        setTimeout(() => applyBrightnessToAll(savedVal), 800);
    }

    // ── multiple/driving 페이지 진입 시 자동 주입 / 이탈 시 제거 ──
    function checkBrightnessBar() {
		const enabled = localStorage.getItem('neubie_handover_enabled') !== 'false';
		const bar = document.getElementById('neubie-brightness-bar');
		if (isBrightnessPage() && !bar && enabled) {
			injectMasterBrightness();
		} else if ((!isBrightnessPage() || !enabled) && bar) {
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
			if (isHandoverPage() && localStorage.getItem('neubie_handover_enabled') !== 'false') {
				const existing = document.getElementById('ho-remote-panel');
				if (existing) {
					const isOpen = existing.style.top === '0px';
					existing.style.top = isOpen ? '-300px' : '0px';
				} else {
					initHandoverLayout();
				}
				return;
			}

            window.openBoardOverlay = async function() {
            const BOARD_API = 'https://multimonitoring.vercel.app/api/board';
            const BG_IMG = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/ego_trippin/animal_crossing_isabelle.png';

            function getMyEmail() {
                try {
                    const lsKey = Object.keys(localStorage).find(k => k.startsWith('ph_phc_') && k.endsWith('_posthog'));
                    if (!lsKey) return '';
                    const ph = JSON.parse(localStorage.getItem(lsKey));
                    const email = ph?.distinct_id || '';
                    return (email.startsWith('ubase') && email.endsWith('@gmail.com')) ? email : '';
                } catch(e) { return ''; }
            }

            function getMyName() { return localStorage.getItem('neubie_user_name') || '익명'; }
            function initials(name) { return name ? name.slice(0,1) : '?'; }
            function formatDate(iso) {
                const d = new Date(iso);
                return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            }

            let overlay = document.getElementById('neubie-board-overlay');
            if (overlay) {
				overlay.remove();
			}

            const dashboard = document.getElementById('neubie-dashboard');
            overlay = document.createElement('div');
            overlay.id = 'neubie-board-overlay';
			const boardFontStyle = document.createElement('style');
			(function applyBoardFont() {
				if (document.getElementById('neubie-board-font-style')) return;
				const boardFontStyle = document.createElement('style');
				boardFontStyle.id = 'neubie-board-font-style';
				boardFontStyle.textContent = `
					#neubie-board-overlay, #neubie-board-overlay * {
						font-family: 'BMJUA', 'Pretendard', sans-serif !important;
					}
					#neubie-board-overlay .nb-emoji {
						font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif !important;
					}
				`;
				document.head.appendChild(boardFontStyle);
			})();
            const r = dashboard.getBoundingClientRect();
			Object.assign(overlay.style, {
				position: 'fixed',
				top: r.top + 'px',
				left: r.left + 'px',
				width: r.width + 'px',
				height: '560px',
				zIndex: '1000001', display: 'flex',
				alignItems: 'center', justifyContent: 'center',
				backgroundImage: `url(${BG_IMG})`,
				backgroundSize: 'cover', backgroundPosition: 'center',
				borderRadius: '24px', overflow: 'hidden',
				transform: 'scale(1.5)',
				transformOrigin: 'center center',
			});

            overlay.innerHTML = `
            <div style="width:100%; height:100%; background:rgba(10,10,30,0.72); backdrop-filter:blur(2px); display:flex; flex-direction:column; border-radius:24px;">
                <div id="nb-board-header" style="display:flex; align-items:center; gap:8px; padding:12px 16px; border-bottom:0.5px solid rgba(255,255,255,0.12); cursor:grab;">
                    <span style="font-size:15px; font-weight:600; color:#fff; flex:1;"><span class="nb-emoji">📋</span> 뉴비고 게시판</span>
                    <button id="nb-tips-btn" style="height:28px; padding:0 10px; font-size:12px; font-weight:500; background:#f59e0b; color:#1a1a1a; border:none; border-radius:6px; cursor:pointer;" title="최적화 팁">💡 최적화 팁</button>
                    <button id="nb-refresh-btn" style="height:28px; width:28px; background:rgba(255,255,255,0.1); color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;" title="새로고침">↺</button>
					<button id="nb-write-btn" style="height:28px; padding:0 12px; font-size:12px; font-weight:500; background:#6366f1; color:white; border:none; border-radius:6px; cursor:pointer;">✏️ 글쓰기</button>
                    <button id="nb-board-close" style="background:rgba(255,255,255,0.1); border:none; color:#fff; width:26px; height:26px; border-radius:50%; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center;">✕</button>
                </div>

                <div style="height:2px; background:#6366f1; opacity:0.5; margin:0 16px;"></div>

                <div id="nb-screen-list" style="flex:1; overflow-y:auto; padding:4px 0;"></div>

                <div style="padding:8px 16px; display:flex; align-items:center; justify-content:space-between; gap:8px; border-top:0.5px solid rgba(255,255,255,0.1);">
                    <div style="display:flex; gap:8px; flex:1; min-width:0;">
                        <select id="nb-search-type" style="height:28px; font-size:12px; padding:0 6px; border-radius:6px; border:0.5px solid rgba(255,255,255,0.2); background:#1e1e3a; color:#e2e8f0; outline:none;">
                            <option value="all">전체</option>
                            <option value="title">제목</option>
                            <option value="author">작성자</option>
                        </select>
                        <input id="nb-search-input" type="text" placeholder="검색..." style="flex:1; height:28px; font-size:12px; padding:0 10px; border-radius:6px; border:0.5px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.1); color:#fff; outline:none;">
                    </div>
                    <div id="nb-pagination" style="display:flex; align-items:center; gap:8px; flex-shrink:0;"></div>
                </div>

                <div id="nb-screen-detail" style="display:none; flex:1; overflow-y:auto; flex-direction:column;">
                    <div style="padding:10px 16px; border-bottom:0.5px solid rgba(255,255,255,0.1); display:flex; align-items:center; gap:8px;">
                        <button id="nb-back-btn" style="background:rgba(255,255,255,0.1); border:none; color:#fff; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px;"><span class="nb-emoji">←</span> 목록</button>
                        <span id="nb-detail-title-header" style="font-size:13px; color:#e2e8f0; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"></span>
						<button id="nb-edit-post-btn" style="display:none; background:rgba(99,102,241,0.2); border:1px solid rgba(99,102,241,0.4); color:#a5b4fc; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px;">수정</button>
                        <button id="nb-delete-post-btn" style="display:none; background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.4); color:#fca5a5; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px;">삭제</button>
                    </div>
                    <div id="nb-detail-body" style="padding:16px; flex:1; overflow-y:auto;"></div>
                </div>

                <div id="nb-screen-write" style="display:none; flex-direction:column; flex:1;">
                    <div style="padding:10px 16px; border-bottom:0.5px solid rgba(255,255,255,0.1); display:flex; align-items:center; gap:8px;">
                        <button id="nb-write-cancel" style="background:rgba(255,255,255,0.1); border:none; color:#fff; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px;">← 취소</button>
                        <span style="font-size:13px; color:#e2e8f0; flex:1;">새 글 작성</span>
                        <button id="nb-write-submit" style="background:#6366f1; border:none; color:white; padding:4px 14px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:500;">등록</button>
                    </div>
                    <div style="padding:16px; display:flex; flex-direction:column; gap:10px; flex:1;">
                        <input id="nb-write-title" type="text" placeholder="제목" style="height:36px; font-size:13px; padding:0 10px; border-radius:6px; border:0.5px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.08); color:#fff; outline:none;">
                        <textarea id="nb-write-content" placeholder="내용을 입력하세요..." style="flex:1; min-height:100px; font-size:13px; padding:10px; border-radius:6px; border:0.5px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.08); color:#fff; outline:none; resize:none; font-family:inherit;"></textarea>
						<label style="display:flex; align-items:center; gap:6px; font-size:12px; color:rgba(255,255,255,0.6); cursor:pointer; user-select:none;">
                            <input type="checkbox" id="nb-write-anon" style="width:14px; height:14px; cursor:pointer;">
                            익명으로 작성
                        </label>
                    </div>
                </div>
				
				<div id="nb-screen-edit" style="display:none; flex-direction:column; flex:1;">
                    <div style="padding:10px 16px; border-bottom:0.5px solid rgba(255,255,255,0.1); display:flex; align-items:center; gap:8px;">
                        <button id="nb-edit-cancel" style="background:rgba(255,255,255,0.1); border:none; color:#fff; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px;">← 취소</button>
                        <span style="font-size:13px; color:#e2e8f0; flex:1;">글 수정</span>
                        <button id="nb-edit-submit" style="background:#6366f1; border:none; color:white; padding:4px 14px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:500;">저장</button>
                    </div>
                    <div style="padding:16px; display:flex; flex-direction:column; gap:10px; flex:1;">
                        <input id="nb-edit-title" type="text" placeholder="제목" style="height:36px; font-size:13px; padding:0 10px; border-radius:6px; border:0.5px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.08); color:#fff; outline:none;">
                        <textarea id="nb-edit-content" placeholder="내용" style="flex:1; min-height:100px; font-size:13px; padding:10px; border-radius:6px; border:0.5px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.08); color:#fff; outline:none; resize:none; font-family:inherit;"></textarea>
                    </div>
                </div>

                <div style="padding:6px 16px; border-top:0.5px solid rgba(255,255,255,0.1); text-align:right;">
                    <span id="nb-user-badge" style="font-size:11px; color:rgba(255,255,255,0.5);"></span>
                </div>
            </div>`;

            document.body.appendChild(overlay);

            let allPosts = [];
            let currentPostId = null;
            const myEmail = getMyEmail();
            const myName = getMyName();

            // ── 게시판 드래그 (scale 유지) ──
            (function makeBoardDraggable() {
                const handle = document.getElementById('nb-board-header');
                if (!handle) return;
                let dragging = false, sx, sy, sLeft, sTop;
                handle.addEventListener('mousedown', (e) => {
                    const tag = e.target.tagName;
                    if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'A') return;
                    dragging = true;
                    sx = e.clientX; sy = e.clientY;
                    sLeft = parseFloat(overlay.style.left);
                    sTop = parseFloat(overlay.style.top);
                    handle.style.cursor = 'grabbing';
                    e.preventDefault();
                });
                document.addEventListener('mousemove', (e) => {
                    if (!dragging) return;
                    overlay.style.left = (sLeft + (e.clientX - sx)) + 'px';
                    overlay.style.top  = (sTop  + (e.clientY - sy)) + 'px';
                });
                document.addEventListener('mouseup', () => {
                    if (!dragging) return;
                    dragging = false;
                    handle.style.cursor = 'grab';
                });
            })();

            document.getElementById('nb-user-badge').textContent = myEmail ? `${myName} (${myEmail})` : '⚠️ 로그인 정보 없음 — 읽기 전용';
            document.getElementById('nb-board-close').onclick = () => { overlay.style.display = 'none'; };
            document.getElementById('nb-back-btn').onclick = () => showList();
            document.getElementById('nb-write-cancel').onclick = () => showList();
			document.getElementById('nb-edit-cancel').onclick = () => {
				const post = allPosts.find(p => p.id === currentPostId);
				if (post) showDetail(post);
			};
			document.getElementById('nb-edit-submit').onclick = submitEdit;
			document.getElementById('nb-refresh-btn').onclick = () => loadPosts();
            document.getElementById('nb-tips-btn').onclick = () => openTipsOverlay();
            document.getElementById('nb-write-btn').onclick = () => {
                if (!myEmail) return alert('로그인 정보가 없어 글쓰기가 불가합니다.');
                showWriteScreen();
            };
            document.getElementById('nb-write-submit').onclick = submitPost;
            document.getElementById('nb-search-input').oninput = filterPosts;
            document.getElementById('nb-search-type').onchange = filterPosts;

            function showList() {
                document.getElementById('nb-screen-list').style.display = 'block';
                document.getElementById('nb-screen-detail').style.display = 'none';
                document.getElementById('nb-screen-write').style.display = 'none';
                renderList(allPosts, false)
            }

            function showWriteScreen() {
                document.getElementById('nb-screen-list').style.display = 'none';
                document.getElementById('nb-screen-detail').style.display = 'none';
                document.getElementById('nb-screen-write').style.display = 'flex';
                document.getElementById('nb-write-title').value = '';
                document.getElementById('nb-write-content').value = '';
            }

            function showDetail(post) {
                document.getElementById('nb-screen-list').style.display = 'none';
                document.getElementById('nb-screen-write').style.display = 'none';
				document.getElementById('nb-screen-edit').style.display = 'none';
				const editBtn = document.getElementById('nb-edit-post-btn');
				editBtn.style.display = (myEmail && post.email === myEmail) ? 'block' : 'none';
				editBtn.onclick = () => showEditScreen(post);
                const det = document.getElementById('nb-screen-detail');
                det.style.display = 'flex';
                document.getElementById('nb-detail-title-header').textContent = post.title;
                const delBtn = document.getElementById('nb-delete-post-btn');
                delBtn.style.display = (myEmail && post.email === myEmail) ? 'block' : 'none';
                delBtn.onclick = () => deletePost(post.id);
                renderDetailBody(post);
            }

            let _currentPage = 1;
            const PAGE_SIZE = 10;

            function renderList(posts, resetPage) {
                if (resetPage) _currentPage = 1;
                const el = document.getElementById('nb-screen-list');
                if (!posts.length) {
                    el.innerHTML = `<div style="text-align:center; padding:40px 16px; color:rgba(255,255,255,0.4); font-size:13px;">게시글이 없습니다</div>`;
                    document.getElementById('nb-pagination').innerHTML = '';
                    return;
                }
                const totalPages = Math.ceil(posts.length / PAGE_SIZE);
                const start = (_currentPage - 1) * PAGE_SIZE;
                const paged = posts.slice(start, start + PAGE_SIZE);
                const isPaged = posts === allPosts; // 검색 중엔 페이지네이션 숨김

                el.innerHTML = paged.map(p => `
                    <div onclick="window._nbOpenPost('${p.id}')" style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 16px; border-bottom:0.5px solid rgba(255,255,255,0.07); cursor:pointer; transition:background 0.12s;" onmouseenter="this.style.background='rgba(255,255,255,0.06)'" onmouseleave="this.style.background='transparent'">
                        <div style="font-size:13px; font-weight:500; color:#f1f5f9; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0;">${p.title}</div>
                        <div style="font-size:11px; color:rgba(255,255,255,0.45); white-space:nowrap; flex-shrink:0; display:flex; align-items:center; gap:6px;">
                            <span>${p.author}</span>
                            <span>${formatDate(p.createdAt)}</span>
                            ${(p.commentCount||0) > 0 ? `<span style="color:#a5b4fc;">💬 ${p.commentCount}</span>` : ''}
                        </div>
                    </div>
                `).join('');

                const pagerEl = document.getElementById('nb-pagination');
                if (isPaged && totalPages > 1) {
                    pagerEl.innerHTML = `
                        <button onclick="window._nbPrevPage()" ${_currentPage <= 1 ? 'disabled' : ''} style="height:24px; padding:0 10px; font-size:11px; background:rgba(255,255,255,0.08); border:0.5px solid rgba(255,255,255,0.15); color:${_currentPage <= 1 ? 'rgba(255,255,255,0.2)' : '#e2e8f0'}; border-radius:6px; cursor:${_currentPage <= 1 ? 'default' : 'pointer'};"><span class="nb-emoji">←</span> 이전</button>
                        <span style="font-size:12px; color:rgba(255,255,255,0.5);">${_currentPage} / ${totalPages}</span>
                        <button onclick="window._nbNextPage()" ${_currentPage >= totalPages ? 'disabled' : ''} style="height:24px; padding:0 10px; font-size:11px; background:rgba(255,255,255,0.08); border:0.5px solid rgba(255,255,255,0.15); color:${_currentPage >= totalPages ? 'rgba(255,255,255,0.2)' : '#e2e8f0'}; border-radius:6px; cursor:${_currentPage >= totalPages ? 'default' : 'pointer'};">다음 <span class="nb-emoji">→</span></button>
                    `;
                } else {
                    pagerEl.innerHTML = '';
                }
            }

            window._nbPrevPage = () => { _currentPage--; renderList(allPosts); document.getElementById('nb-screen-list').scrollTop = 0; };
            window._nbNextPage = () => { _currentPage++; renderList(allPosts); document.getElementById('nb-screen-list').scrollTop = 0; };

            function renderDetailBody(post) {
                const comments = post.comments || [];
                const totalComments = comments.reduce((a,c) => a + 1 + (c.replies||[]).length, 0);
                document.getElementById('nb-detail-body').innerHTML = `
                    <h2 style="font-size:15px; font-weight:600; color:#f1f5f9; margin:0 0 8px;">${post.title}</h2>
                    <div style="font-size:12px; color:rgba(255,255,255,0.45); margin-bottom:14px; display:flex; align-items:center; justify-content:space-between;">
                        <span>👤 ${post.author}</span>
                        <span>📅 ${formatDate(post.createdAt)}</span>
                    </div>
                    <div style="font-size:13px; color:#e2e8f0; line-height:1.7; padding:14px; background:rgba(255,255,255,0.07); border-radius:10px; margin-bottom:20px; white-space:pre-wrap;">${post.content}</div>
                    <div style="font-size:13px; font-weight:500; color:rgba(255,255,255,0.6); margin-bottom:12px;">💬 댓글 ${totalComments}개</div>
                    ${comments.map(c => `
                        <div style="display:flex; gap:8px; margin-bottom:14px;">
                            <div style="width:26px; height:26px; border-radius:50%; background:rgba(99,102,241,0.25); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; color:#a5b4fc; flex-shrink:0;">${initials(c.author)}</div>
                            <div style="flex:1;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <div style="font-size:12px; font-weight:500; color:#f1f5f9;">${c.author}</div>
                                    <span style="font-size:11px; color:rgba(255,255,255,0.35);">${formatDate(c.createdAt)}</span>
                                </div>
                                <div style="font-size:13px; color:#e2e8f0; margin:3px 0; line-height:1.6;">${c.text}</div>
                                <div style="display:flex; align-items:center; gap:10px; margin-top:4px;">
                                    ${myEmail ? `<button onclick="window._nbToggleReply('${c.id}')" style="background:none;border:none;font-size:11px;color:#a5b4fc;cursor:pointer;padding:0;">↩ 답글</button>` : ''}
                                    ${(myEmail && c.email === myEmail) ? `<button onclick="window._nbDeleteComment('${c.id}')" style="background:none;border:none;font-size:11px;color:rgba(239,68,68,0.7);cursor:pointer;padding:0;">삭제</button><button onclick="window._nbToggleEditComment('${c.id}','${c.text}')" style="background:none;border:none;font-size:11px;color:#a5b4fc;cursor:pointer;padding:0;">수정</button>` : ''}
                                </div>
                                ${(c.replies||[]).map(r => `
                                    <div style="display:flex; gap:8px; margin-top:10px; padding-left:8px; border-left:2px solid rgba(99,102,241,0.3);">
                                        <div style="width:20px; height:20px; border-radius:50%; background:rgba(99,102,241,0.2); display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:600; color:#a5b4fc; flex-shrink:0;">${initials(r.author)}</div>
                                        <div style="flex:1;">
                                            <div style="display:flex; align-items:center; gap:8px;">
                                                <div style="font-size:11px; font-weight:500; color:#f1f5f9;">${r.author}</div>
                                                <span style="font-size:10px; color:rgba(255,255,255,0.3);">${formatDate(r.createdAt)}</span>
                                            </div>
                                            <div style="font-size:12px; color:#e2e8f0; margin:2px 0;">${r.text}</div>
                                            <div style="display:flex; align-items:center; gap:8px; margin-top:3px;">
                                                ${(myEmail && r.email === myEmail) ? `<button onclick="window._nbDeleteReply('${c.id}','${r.id}')" style="background:none;border:none;font-size:10px;color:rgba(239,68,68,0.6);cursor:pointer;padding:0;">삭제</button><button onclick="window._nbToggleEditReply('${c.id}','${r.id}','${r.text}')" style="background:none;border:none;font-size:10px;color:#a5b4fc;cursor:pointer;padding:0;">수정</button>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                                <div id="nb-reply-box-${c.id}" style="display:none; margin-top:8px;">
                                    <textarea id="nb-reply-text-${c.id}" placeholder="답글..." style="width:100%; height:52px; font-size:12px; padding:6px 8px; border-radius:6px; border:0.5px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.08); color:#fff; outline:none; resize:none; box-sizing:border-box; font-family:inherit;"></textarea>
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
                                        <label style="display:flex; align-items:center; gap:5px; font-size:10px; color:rgba(255,255,255,0.5); cursor:pointer; user-select:none;">
                                            <input type="checkbox" id="nb-reply-anon-${c.id}" style="width:12px; height:12px; cursor:pointer;">
                                            익명
                                        </label>
                                        <div style="display:flex; gap:6px;">
                                        <button onclick="window._nbToggleReply('${c.id}')" style="height:26px;padding:0 10px;font-size:11px;background:rgba(255,255,255,0.1);border:none;color:#fff;border-radius:6px;cursor:pointer;">취소</button>
                                        <button onclick="window._nbSubmitReply('${c.id}', this)" style="height:26px;padding:0 10px;font-size:11px;background:#6366f1;border:none;color:white;border-radius:6px;cursor:pointer;font-weight:500;">등록</button>
										</div>
									</div>
                                </div>
								<div id="nb-edit-reply-box-${r.id}" style="display:none; margin-top:6px;">
									<textarea id="nb-edit-reply-text-${r.id}" style="width:100%; height:46px; font-size:11px; padding:6px 8px; border-radius:6px; border:0.5px solid rgba(99,102,241,0.4); background:rgba(255,255,255,0.08); color:#fff; outline:none; resize:none; box-sizing:border-box; font-family:inherit;"></textarea>
									<div style="display:flex; justify-content:flex-end; gap:6px; margin-top:4px;">
										<button onclick="window._nbToggleEditReply('${c.id}','${r.id}')" style="height:24px;padding:0 8px;font-size:10px;background:rgba(255,255,255,0.1);border:none;color:#fff;border-radius:6px;cursor:pointer;">취소</button>
										<button onclick="window._nbSubmitEditReply('${c.id}','${r.id}', this)" style="height:24px;padding:0 8px;font-size:10px;background:#6366f1;border:none;color:white;border-radius:6px;cursor:pointer;font-weight:500;">저장</button>
									</div>
								</div>
								<div id="nb-edit-comment-box-${c.id}" style="display:none; margin-top:8px;">
									<textarea id="nb-edit-comment-text-${c.id}" style="width:100%; height:52px; font-size:12px; padding:6px 8px; border-radius:6px; border:0.5px solid rgba(99,102,241,0.4); background:rgba(255,255,255,0.08); color:#fff; outline:none; resize:none; box-sizing:border-box; font-family:inherit;"></textarea>
									<div style="display:flex; justify-content:flex-end; gap:6px; margin-top:6px;">
										<button onclick="window._nbToggleEditComment('${c.id}')" style="height:26px;padding:0 10px;font-size:11px;background:rgba(255,255,255,0.1);border:none;color:#fff;border-radius:6px;cursor:pointer;">취소</button>
										<button onclick="window._nbSubmitEditComment('${c.id}', this)" style="height:26px;padding:0 10px;font-size:11px;background:#6366f1;border:none;color:white;border-radius:6px;cursor:pointer;font-weight:500;">저장</button>
									</div>
								</div>
                            </div>
                        </div>
                    `).join('')}
                    ${myEmail ? `
                    <div style="margin-top:16px; border-top:0.5px solid rgba(255,255,255,0.1); padding-top:14px;">
                        <textarea id="nb-comment-input" placeholder="댓글을 입력하세요..." style="width:100%; height:64px; font-size:13px; padding:8px 10px; border-radius:6px; border:0.5px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.08); color:#fff; outline:none; resize:none; box-sizing:border-box; font-family:inherit;"></textarea>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                            <label style="display:flex; align-items:center; gap:5px; font-size:11px; color:rgba(255,255,255,0.55); cursor:pointer; user-select:none;">
                                <input type="checkbox" id="nb-comment-anon" style="width:13px; height:13px; cursor:pointer;">
                                익명
                            </label>
                            <button onclick="window._nbSubmitComment(this)" style="height:30px;padding:0 16px;font-size:12px;font-weight:500;background:#6366f1;border:none;color:white;border-radius:6px;cursor:pointer;">댓글 등록</button>
                        </div>
                    </div>` : `<div style="text-align:center; padding:16px; font-size:12px; color:rgba(255,255,255,0.35); border-top:0.5px solid rgba(255,255,255,0.1); margin-top:16px;">로그인 정보가 없어 댓글을 달 수 없습니다</div>`}
                `;
            }

            function filterPosts() {
                const q = document.getElementById('nb-search-input').value.trim().toLowerCase();
                const type = document.getElementById('nb-search-type').value;
                if (!q) { renderList(allPosts); return; }
                const filtered = allPosts.filter(p => {
                    if (type === 'title') return p.title.toLowerCase().includes(q);
                    if (type === 'author') return p.author.toLowerCase().includes(q);
                    return p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q);
                });
                renderList(filtered);
            }

            async function loadPosts() {
				const listEl = document.getElementById('nb-screen-list');
				if (!listEl) return;
				listEl.innerHTML = `<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.4); font-size:13px;">불러오는 중...</div>`;
				try {
					const res = await fetch('https://multimonitoring.vercel.app/api/board?t=' + Date.now() + '&email=' + encodeURIComponent(myEmail));
					const data = await res.json();
					allPosts = data.posts || [];
					showList();
				} catch(e) {
					document.getElementById('nb-screen-list').innerHTML = `<div style="text-align:center; padding:40px; color:rgba(239,68,68,0.7); font-size:13px;">불러오기 실패: ${e.message}</div>`;
				}
			}

            async function submitPost() {
                const title = document.getElementById('nb-write-title').value.trim();
                const content = document.getElementById('nb-write-content').value.trim();
                if (!title || !content) return;
				const isAnon = document.getElementById('nb-write-anon')?.checked;
                const btn = document.getElementById('nb-write-submit');
                btn.disabled = true; btn.textContent = '등록 중...';
                try {
                    await fetch('https://multimonitoring.vercel.app/api/board', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: myEmail, author: isAnon ? '익명' : myName, anon: isAnon, title, content })
                    });
                    await loadPosts();
                } catch(e) { alert('등록 실패'); }
                finally { btn.disabled = false; btn.textContent = '등록'; }
            }
			
			function showEditScreen(post) {
				document.getElementById('nb-screen-list').style.display = 'none';
				document.getElementById('nb-screen-detail').style.display = 'none';
				document.getElementById('nb-screen-write').style.display = 'none';
				document.getElementById('nb-screen-edit').style.display = 'flex';
				document.getElementById('nb-edit-title').value = post.title;
				document.getElementById('nb-edit-content').value = post.content;
			}

			async function submitEdit() {
				const title = document.getElementById('nb-edit-title').value.trim();
				const content = document.getElementById('nb-edit-content').value.trim();
				if (!title || !content) return;
				const btn = document.getElementById('nb-edit-submit');
				btn.disabled = true; btn.textContent = '저장 중...';
				try {
					await fetch('https://multimonitoring.vercel.app/api/board', {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ email: myEmail, id: currentPostId, title, content })
					});
					await loadPosts();
					const post = allPosts.find(p => p.id === currentPostId);
					if (post) showDetail(post);
				} catch(e) { alert('수정 실패'); }
				finally { btn.disabled = false; btn.textContent = '저장'; }
			}

            async function deletePost(id) {
                if (!confirm('삭제하시겠습니까?')) return;
                const btn = document.getElementById('nb-delete-post-btn');
                btn.disabled = true; btn.textContent = '삭제 중...';
                try {
                    await fetch('https://multimonitoring.vercel.app/api/board', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: myEmail, id })
                    });
                    await loadPosts();
                } catch(e) { alert('삭제 실패'); }
                finally { btn.disabled = false; btn.textContent = '삭제'; }
            }

            window._nbOpenPost = (id) => {
                currentPostId = id;
                const post = allPosts.find(p => p.id === id);
                if (post) showDetail(post);
            };

            window._nbToggleReply = (cId) => {
                const box = document.getElementById('nb-reply-box-' + cId);
                if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
            };

            window._nbSubmitComment = async (btn) => {
                const text = document.getElementById('nb-comment-input')?.value.trim();
                if (!text) return;
				const isAnon = document.getElementById('nb-comment-anon')?.checked;
                btn.disabled = true; btn.textContent = '등록 중...';
                try {
                    await fetch('https://multimonitoring.vercel.app/api/comment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: myEmail, author: isAnon ? '익명' : myName, anon: isAnon, postId: currentPostId, text })
                    });
                    const res = await fetch('https://multimonitoring.vercel.app/api/board?t=' + Date.now() + '&email=' + encodeURIComponent(myEmail));
                    const data = await res.json();
                    allPosts = data.posts || [];
                    const post = allPosts.find(p => p.id === currentPostId);
                    if (post) renderDetailBody(post);
                } catch(e) { alert('댓글 등록 실패'); }
                finally { btn.disabled = false; btn.textContent = '댓글 등록'; }
            };

            window._nbSubmitReply = async (cId, btn) => {
                const text = document.getElementById('nb-reply-text-' + cId)?.value.trim();
                if (!text) return;
				const isAnon = document.getElementById('nb-reply-anon-' + cId)?.checked;
                btn.disabled = true; btn.textContent = '등록 중...';
                try {
                    await fetch('https://multimonitoring.vercel.app/api/comment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: myEmail, author: isAnon ? '익명' : myName, anon: isAnon, postId: currentPostId, commentId: cId, text })
                    });
                    const res = await fetch('https://multimonitoring.vercel.app/api/board?t=' + Date.now() + '&email=' + encodeURIComponent(myEmail));
                    const data = await res.json();
                    allPosts = data.posts || [];
                    const post = allPosts.find(p => p.id === currentPostId);
                    if (post) renderDetailBody(post);
                } catch(e) { alert('답글 등록 실패'); }
                finally { btn.disabled = false; btn.textContent = '등록'; }
            };

            window._nbDeleteComment = async (cId) => {
                if (!confirm('댓글을 삭제하시겠습니까?')) return;
                try {
                    await fetch('https://multimonitoring.vercel.app/api/comment', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: myEmail, postId: currentPostId, commentId: cId })
                    });
                    const res = await fetch('https://multimonitoring.vercel.app/api/board?t=' + Date.now() + '&email=' + encodeURIComponent(myEmail));
                    const data = await res.json();
                    allPosts = data.posts || [];
                    const post = allPosts.find(p => p.id === currentPostId);
                    if (post) renderDetailBody(post);
                } catch(e) { alert('삭제 실패'); }
            };

            window._nbDeleteReply = async (cId, rId) => {
                if (!confirm('답글을 삭제하시겠습니까?')) return;
                try {
                    await fetch('https://multimonitoring.vercel.app/api/comment', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: myEmail, postId: currentPostId, commentId: cId, replyId: rId })
                    });
                    const res = await fetch('https://multimonitoring.vercel.app/api/board?t=' + Date.now() + '&email=' + encodeURIComponent(myEmail));
                    const data = await res.json();
                    allPosts = data.posts || [];
                    const post = allPosts.find(p => p.id === currentPostId);
                    if (post) renderDetailBody(post);
                } catch(e) { alert('삭제 실패'); }
            };
			
			window._nbToggleEditComment = (cId, originalText) => {
				const box = document.getElementById('nb-edit-comment-box-' + cId);
				if (!box) return;
				const isOpen = box.style.display !== 'none';
				box.style.display = isOpen ? 'none' : 'block';
				if (!isOpen && originalText) {
					document.getElementById('nb-edit-comment-text-' + cId).value = originalText;
				}
			};

			window._nbSubmitEditComment = async (cId, btn) => {
				const text = document.getElementById('nb-edit-comment-text-' + cId)?.value.trim();
				if (!text) return;
				btn.disabled = true; btn.textContent = '저장 중...';
				try {
					await fetch('https://multimonitoring.vercel.app/api/comment', {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ email: myEmail, postId: currentPostId, commentId: cId, text })
					});
					const res = await fetch('https://multimonitoring.vercel.app/api/board?t=' + Date.now() + '&email=' + encodeURIComponent(myEmail));
					const data = await res.json();
					allPosts = data.posts || [];
					const post = allPosts.find(p => p.id === currentPostId);
					if (post) renderDetailBody(post);
				} catch(e) { alert('수정 실패'); }
				finally { btn.disabled = false; btn.textContent = '저장'; }
			};

			window._nbToggleEditReply = (cId, rId, originalText) => {
				const box = document.getElementById('nb-edit-reply-box-' + rId);
				if (!box) return;
				const isOpen = box.style.display !== 'none';
				box.style.display = isOpen ? 'none' : 'block';
				if (!isOpen && originalText) {
					document.getElementById('nb-edit-reply-text-' + rId).value = originalText;
				}
			};

			window._nbSubmitEditReply = async (cId, rId, btn) => {
				const text = document.getElementById('nb-edit-reply-text-' + rId)?.value.trim();
				if (!text) return;
				btn.disabled = true; btn.textContent = '저장 중...';
				try {
					await fetch('https://multimonitoring.vercel.app/api/comment', {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ email: myEmail, postId: currentPostId, commentId: cId, replyId: rId, text })
					});
					const res = await fetch('https://multimonitoring.vercel.app/api/board?t=' + Date.now() + '&email=' + encodeURIComponent(myEmail));
					const data = await res.json();
					allPosts = data.posts || [];
					const post = allPosts.find(p => p.id === currentPostId);
					if (post) renderDetailBody(post);
				} catch(e) { alert('수정 실패'); }
				finally { btn.disabled = false; btn.textContent = '저장'; }
			};

            loadPosts();
        };

        // ══════════════════════════════════════════════
        //  1:1 비밀 문의함 (관리자 문의)
        // ══════════════════════════════════════════════
        let _secretAdminPw = null;  // 관리자 세션 비번 (열람 중에만 메모리 보관)

        window.openSecretOverlay = async function() {
            const SECRET_API = 'https://multimonitoring.vercel.app/api/secret';
            const ITEMS_PER_PAGE = 5;
            let currentPage = 1;
            const getMyEmail = () => {
                try {
                    const lsKey = Object.keys(localStorage).find(k => k.startsWith('ph_phc_') && k.endsWith('_posthog'));
                    if (!lsKey) return '';
                    const ph = JSON.parse(localStorage.getItem(lsKey));
                    const email = ph?.distinct_id || '';
                    return (email.startsWith('ubase') && email.endsWith('@gmail.com')) ? email : '';
                } catch(e) { return ''; }
            };
            const myEmail = getMyEmail();
            const myName = localStorage.getItem('neubie_user_name') || '익명';

            let overlay = document.getElementById('neubie-secret-overlay');
            if (overlay) { overlay.style.display = 'flex'; }
            else {
                overlay = document.createElement('div');
                overlay.id = 'neubie-secret-overlay';
                overlay.style.cssText = `
                    position:fixed; inset:0; z-index:2147483647;
                    background:rgba(0,0,0,0.6); display:flex;
                    align-items:center; justify-content:center;
                    font-family:'Paperlogy','Pretendard',sans-serif;
                `;
                const box = document.createElement('div');
                box.style.cssText = `
                    width:min(560px,94vw); max-height:82vh; overflow:hidden;
                    background:#1a1a24; border:1.5px solid #a78bfa; border-radius:16px;
                    display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,0.6);
                `;
                box.innerHTML = `
                    <div style="display:flex; align-items:center; padding:16px 18px; border-bottom:1px solid #333; gap:8px;">
                        <span id="nb-secret-title-lock" style="font-size:16px; font-weight:700; color:#c4b5fd; flex:1; cursor:default; user-select:none;">🔒 1:1 문의</span>
                        <button id="nb-secret-close" style="background:transparent; border:none; color:#aaa; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <div id="nb-secret-body" style="padding:16px 18px; overflow-y:auto; flex:1;"></div>
                `;
                overlay.appendChild(box);
                document.body.appendChild(overlay);

                document.getElementById('nb-secret-close').onclick = () => { overlay.style.display = 'none'; };

                // 자물쇠(제목) 2초 내 5회 클릭 → 관리자 진입
                let _secretLockClicks = 0;
                let _secretLockTimer = null;
                document.getElementById('nb-secret-title-lock').addEventListener('click', async () => {
                    _secretLockClicks++;
                    clearTimeout(_secretLockTimer);
                    _secretLockTimer = setTimeout(() => { _secretLockClicks = 0; }, 2000);
                    if (_secretLockClicks >= 5) {
                        _secretLockClicks = 0;
                        clearTimeout(_secretLockTimer);
                        // 이미 관리자면 해제
                        if (_secretAdminPw) {
                            _secretAdminPw = null;
                            loadSecretPosts();
                            return;
                        }
                        const pw = prompt('관리자 비밀번호를 입력하세요');
                        if (!pw) return;
                        const res = await fetch(`${SECRET_API}?admin=${encodeURIComponent(pw)}`);
                        const data = await res.json();
                        if (data.isAdmin) {
                            _secretAdminPw = pw;
                            loadSecretPosts();
                        } else {
                            alert('비밀번호가 일치하지 않습니다.');
                        }
                    }
                });
            }

            // ── 목록 로드 ──
            async function loadSecretPosts() {
                const body = document.getElementById('nb-secret-body');
                body.innerHTML = `<div style="text-align:center; padding:30px; color:#666;">불러오는 중...</div>`;
                try {
                    let url = `${SECRET_API}?t=${Date.now()}`;
                    if (_secretAdminPw) url += `&admin=${encodeURIComponent(_secretAdminPw)}`;
                    else url += `&email=${encodeURIComponent(myEmail)}`;
                    const res = await fetch(url);
                    const data = await res.json();
                    renderSecretList(data.posts || [], data.isAdmin);
                } catch(e) {
                    body.innerHTML = `<div style="text-align:center; padding:30px; color:#e57;">불러오기 실패</div>`;
                }
            }
            window._loadSecretPosts = loadSecretPosts;

            // ── 목록 렌더 ──
            function renderSecretList(posts, isAdmin) {
                const body = document.getElementById('nb-secret-body');
                const writeBtn = `
                    <button id="nb-secret-write-btn" style="width:100%; padding:10px; margin-bottom:12px; background:#7c3aed; border:none; color:#fff; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600;">✏️ 새 문의 작성</button>
                `;
                if (!posts.length) {
                    body.innerHTML = writeBtn + `<div style="text-align:center; padding:30px; color:#666; font-size:13px;">${isAdmin ? '문의가 없습니다.' : '내 문의가 없습니다. 위 버튼으로 작성하세요.'}</div>`;
                } else {
                    const totalPages = Math.max(1, Math.ceil(posts.length / ITEMS_PER_PAGE));
                    if (currentPage > totalPages) currentPage = totalPages;
                    const start = (currentPage - 1) * ITEMS_PER_PAGE;
                    const pagePosts = posts.slice(start, start + ITEMS_PER_PAGE);

                    const listHtml = pagePosts.map(p => `
                        <div class="nb-secret-item" data-id="${p.id}" style="background:rgba(255,255,255,0.04); border:1px solid #333; border-radius:8px; padding:12px; margin-bottom:8px; cursor:pointer;">
                            <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                                <span style="font-size:13px; font-weight:600; color:#fff; flex:1;">${escapeHtml(p.title)}</span>
                                ${(p.comments||[]).some(c=>c.byAdmin) ? '<span style="font-size:10px; color:#4ade80;">✔ 답변완료</span>' : '<span style="font-size:10px; color:#888;">대기중</span>'}
                            </div>
                            <div style="font-size:11px; color:#888;">${isAdmin ? escapeHtml(p.author) + ' · ' : ''}${new Date(p.createdAt).toLocaleString('ko-KR')}</div>
                        </div>
                    `).join('');

                    const pagerHtml = totalPages > 1 ? `
                        <div style="display:flex; align-items:center; justify-content:center; gap:12px; margin-top:12px;">
                            <button id="nb-secret-prev" ${currentPage === 1 ? 'disabled' : ''} style="padding:6px 14px; background:#333; border:none; color:#fff; border-radius:6px; cursor:pointer; font-size:12px; opacity:${currentPage === 1 ? '0.4' : '1'};">이전</button>
                            <span style="font-size:12px; color:#aaa;">${currentPage} / ${totalPages}</span>
                            <button id="nb-secret-next" ${currentPage === totalPages ? 'disabled' : ''} style="padding:6px 14px; background:#333; border:none; color:#fff; border-radius:6px; cursor:pointer; font-size:12px; opacity:${currentPage === totalPages ? '0.4' : '1'};">다음</button>
                        </div>
                    ` : '';

                    body.innerHTML = writeBtn + listHtml + pagerHtml;

                    body.querySelectorAll('.nb-secret-item').forEach(el => {
                        el.onclick = () => renderSecretDetail(posts.find(p => p.id === el.dataset.id), isAdmin);
                    });

                    if (totalPages > 1) {
                        document.getElementById('nb-secret-prev').onclick = () => { currentPage--; renderSecretList(posts, isAdmin); };
                        document.getElementById('nb-secret-next').onclick = () => { currentPage++; renderSecretList(posts, isAdmin); };
                    }
                }
                document.getElementById('nb-secret-write-btn').onclick = () => renderSecretWrite();
            }

            // ── 작성 화면 ──
            function renderSecretWrite() {
                const body = document.getElementById('nb-secret-body');
                body.innerHTML = `
                    <input id="nb-secret-title" placeholder="제목" style="width:100%; height:38px; padding:0 10px; margin-bottom:8px; box-sizing:border-box; background:rgba(255,255,255,0.08); border:1px solid #444; border-radius:6px; color:#fff; font-size:13px;">
                    <textarea id="nb-secret-content" placeholder="관리자에게 전달할 내용을 입력하세요" style="width:100%; height:140px; padding:10px; box-sizing:border-box; background:rgba(255,255,255,0.08); border:1px solid #444; border-radius:6px; color:#fff; font-size:13px; resize:none; font-family:inherit;"></textarea>
                    <label style="display:flex; align-items:center; gap:6px; margin:8px 0; font-size:12px; color:#aaa; cursor:pointer;">
                        <input type="checkbox" id="nb-secret-anon"> 익명으로 (저도 누가 썼는지 확인불가합니다.)
                    </label>
                    <div style="display:flex; gap:8px;">
                        <button id="nb-secret-cancel" style="flex:1; padding:10px; background:rgba(255,255,255,0.1); border:none; color:#fff; border-radius:6px; cursor:pointer;">취소</button>
                        <button id="nb-secret-submit" style="flex:2; padding:10px; background:#7c3aed; border:none; color:#fff; border-radius:6px; cursor:pointer; font-weight:600;">문의 보내기</button>
                    </div>
                `;
                document.getElementById('nb-secret-cancel').onclick = () => loadSecretPosts();
                document.getElementById('nb-secret-submit').onclick = async (e) => {
                    const title = document.getElementById('nb-secret-title').value.trim();
                    const content = document.getElementById('nb-secret-content').value.trim();
                    if (!title || !content) return;
                    const isAnon = document.getElementById('nb-secret-anon').checked;
                    if (!myEmail) return alert('로그인 정보가 없어 문의할 수 없습니다.');
                    e.target.disabled = true; e.target.textContent = '전송 중...';
                    try {
                        await fetch(SECRET_API, {
                            method:'POST', headers:{'Content-Type':'application/json'},
                            body: JSON.stringify({ email:myEmail, author: isAnon ? '익명' : myName, anon:isAnon, title, content })
                        });
                        await new Promise(r => setTimeout(r, 400));
                        await loadSecretPosts();
                    } catch(err) { alert('전송 실패'); e.target.disabled=false; e.target.textContent='문의 보내기'; }
                };
            }

            // ── 상세 화면 ──
            function renderSecretDetail(post, isAdmin) {
                if (!post) return;
                const body = document.getElementById('nb-secret-body');
                const canComment = isAdmin || (myEmail && post.email === myEmail);
                const comments = (post.comments||[]).map(c => `
                    <div style="background:${c.byAdmin?'rgba(124,58,237,0.15)':'rgba(255,255,255,0.04)'}; border-radius:6px; padding:8px 10px; margin-bottom:6px;">
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                            <span style="font-size:11px; color:${c.byAdmin?'#c4b5fd':'#888'}; flex:1;">${c.byAdmin?'👑 최윤혁':escapeHtml(c.author)}</span>
                            ${c.mine ? `
                                <button class="nb-cmt-edit" data-cid="${c.id}" style="background:transparent; border:none; color:#888; cursor:pointer; font-size:10px;">수정</button>
                                <button class="nb-cmt-del" data-cid="${c.id}" style="background:transparent; border:none; color:#f87171; cursor:pointer; font-size:10px;">삭제</button>
                            ` : ''}
                        </div>
                        <div class="nb-cmt-text" data-cid="${c.id}" style="font-size:13px; color:#eee; white-space:pre-wrap;">${escapeHtml(c.text)}</div>
                    </div>
                `).join('') || '<div style="color:#666; font-size:12px; padding:8px 0;">아직 답변이 없습니다.</div>';

                body.innerHTML = `
                    <button id="nb-secret-back" style="background:transparent; border:none; color:#a78bfa; cursor:pointer; font-size:13px; margin-bottom:10px;">← 목록</button>
                    <div style="font-size:15px; font-weight:700; color:#fff; margin-bottom:4px;">${escapeHtml(post.title)}</div>
                    <div style="font-size:11px; color:#888; margin-bottom:10px;">${isAdmin?escapeHtml(post.author)+' · ':''}${new Date(post.createdAt).toLocaleString('ko-KR')}</div>
                    ${(post.mine && !isAdmin) ? `
                        <div style="display:flex; gap:6px; margin-bottom:10px;">
                            <button id="nb-secret-edit" style="padding:4px 10px; background:rgba(255,255,255,0.1); border:none; color:#fff; border-radius:6px; cursor:pointer; font-size:11px;">✏️ 수정</button>
                            <button id="nb-secret-del" style="padding:4px 10px; background:rgba(239,68,68,0.2); border:none; color:#fca5a5; border-radius:6px; cursor:pointer; font-size:11px;">🗑 삭제</button>
                        </div>
                    ` : ''}
                    <div style="font-size:13px; color:#ddd; white-space:pre-wrap; padding:12px; background:rgba(255,255,255,0.03); border-radius:8px; margin-bottom:14px;">${escapeHtml(post.content)}</div>
                    <div style="font-size:12px; color:#aaa; margin-bottom:6px;">💬 답변</div>
                    ${comments}
                    ${canComment ? `
                        <div style="margin-top:10px;">
                            <textarea id="nb-secret-reply" placeholder="${isAdmin?'답변 작성...':'추가 문의...'}" style="width:100%; height:60px; padding:8px; box-sizing:border-box; background:rgba(255,255,255,0.08); border:1px solid #444; border-radius:6px; color:#fff; font-size:12px; resize:none; font-family:inherit;"></textarea>
                            <button id="nb-secret-reply-btn" style="width:100%; padding:8px; margin-top:6px; background:#7c3aed; border:none; color:#fff; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;">${isAdmin?'답변 등록':'등록'}</button>
                        </div>
                    ` : ''}
                `;

                async function refreshDetail() {
                    await new Promise(r => setTimeout(r, 400));
                    let url = `${SECRET_API}?t=${Date.now()}`;
                    if (_secretAdminPw) url += `&admin=${encodeURIComponent(_secretAdminPw)}`;
                    else url += `&email=${encodeURIComponent(myEmail)}`;
                    const res = await fetch(url);
                    const data = await res.json();
                    const updated = (data.posts||[]).find(p => p.id === post.id);
                    if (updated) renderSecretDetail(updated, data.isAdmin);
                }

                document.getElementById('nb-secret-back').onclick = () => loadSecretPosts();
                const editBtn = document.getElementById('nb-secret-edit');
                if (editBtn) editBtn.onclick = () => renderSecretEdit(post);
                const delBtn = document.getElementById('nb-secret-del');
                if (delBtn) delBtn.onclick = async () => {
                    if (!confirm('이 문의를 삭제하시겠습니까?')) return;
                    try {
                        await fetch(SECRET_API, {
                            method:'DELETE', headers:{'Content-Type':'application/json'},
                            body: JSON.stringify({ email: myEmail, id: post.id })
                        });
                        await new Promise(r => setTimeout(r, 400));
                        await loadSecretPosts();
                    } catch(err) { alert('삭제 실패'); }
                };
                const replyBtn = document.getElementById('nb-secret-reply-btn');
                if (replyBtn) replyBtn.onclick = async (e) => {
                    const text = document.getElementById('nb-secret-reply').value.trim();
                    if (!text) return;
                    e.target.disabled = true; e.target.textContent = '등록 중...';
                    try {
                        const payload = { action:'comment', postId:post.id, text };
                        if (_secretAdminPw) payload.adminPw = _secretAdminPw;
                        else { payload.email = myEmail; payload.author = post.anon ? '익명' : myName; payload.anon = post.anon; }
                        await fetch(SECRET_API, {
                            method:'POST', headers:{'Content-Type':'application/json'},
                            body: JSON.stringify(payload)
                        });
                        await new Promise(r => setTimeout(r, 400));
                        // 최신 데이터 다시 받아서 상세 갱신
                        let url = `${SECRET_API}?t=${Date.now()}`;
                        if (_secretAdminPw) url += `&admin=${encodeURIComponent(_secretAdminPw)}`;
                        else url += `&email=${encodeURIComponent(myEmail)}`;
                        const res = await fetch(url);
                        const data = await res.json();
                        const updated = (data.posts||[]).find(p => p.id === post.id);
                        if (updated) renderSecretDetail(updated, data.isAdmin);
                    } catch(err) { alert('등록 실패'); e.target.disabled=false; }
                };
                // 댓글 수정
                body.querySelectorAll('.nb-cmt-edit').forEach(btn => {
                    btn.onclick = () => {
                        const cid = btn.dataset.cid;
                        const textEl = body.querySelector(`.nb-cmt-text[data-cid="${cid}"]`);
                        const old = textEl.textContent;
                        const newText = prompt('댓글 수정', old);
                        if (newText === null || !newText.trim() || newText === old) return;
                        fetch(SECRET_API, {
                            method:'PUT', headers:{'Content-Type':'application/json'},
                            body: JSON.stringify({ email: myEmail, id: post.id, commentId: cid, text: newText.trim() })
                        }).then(() => refreshDetail());
                    };
                });
                // 댓글 삭제
                body.querySelectorAll('.nb-cmt-del').forEach(btn => {
                    btn.onclick = () => {
                        if (!confirm('댓글을 삭제하시겠습니까?')) return;
                        fetch(SECRET_API, {
                            method:'DELETE', headers:{'Content-Type':'application/json'},
                            body: JSON.stringify({ email: myEmail, id: post.id, commentId: btn.dataset.cid })
                        }).then(() => refreshDetail());
                    };
                });
            }

            function renderSecretEdit(post) {
                const body = document.getElementById('nb-secret-body');
                body.innerHTML = `
                    <button id="nb-secret-edit-back" style="background:transparent; border:none; color:#a78bfa; cursor:pointer; font-size:13px; margin-bottom:10px;">← 취소</button>
                    <input id="nb-secret-edit-title" value="${escapeHtml(post.title)}" style="width:100%; height:38px; padding:0 10px; margin-bottom:8px; box-sizing:border-box; background:rgba(255,255,255,0.08); border:1px solid #444; border-radius:6px; color:#fff; font-size:13px;">
                    <textarea id="nb-secret-edit-content" style="width:100%; height:140px; padding:10px; box-sizing:border-box; background:rgba(255,255,255,0.08); border:1px solid #444; border-radius:6px; color:#fff; font-size:13px; resize:none; font-family:inherit;">${escapeHtml(post.content)}</textarea>
                    <button id="nb-secret-edit-save" style="width:100%; padding:10px; margin-top:8px; background:#7c3aed; border:none; color:#fff; border-radius:6px; cursor:pointer; font-weight:600;">수정 완료</button>
                `;
                document.getElementById('nb-secret-edit-back').onclick = () => renderSecretDetail(post, false);
                document.getElementById('nb-secret-edit-save').onclick = async (e) => {
                    const title = document.getElementById('nb-secret-edit-title').value.trim();
                    const content = document.getElementById('nb-secret-edit-content').value.trim();
                    if (!title || !content) return;
                    e.target.disabled = true; e.target.textContent = '수정 중...';
                    try {
                        await fetch(SECRET_API, {
                            method:'PUT', headers:{'Content-Type':'application/json'},
                            body: JSON.stringify({ email: myEmail, id: post.id, title, content })
                        });
                        loadSecretPosts();
                    } catch(err) { alert('수정 실패'); e.target.disabled=false; e.target.textContent='수정 완료'; }
                };
            }

            function escapeHtml(s) {
                return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            }

            // 초기 로드
            loadSecretPosts();
        };

            window.openScheduleOverlay = async function() {
            const now = new Date();
            const curKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
            const SCHEDULE_URL = `https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/monthly_schedule/schedule_for_mobile_${curKey}.json`;
            
            let overlay = document.getElementById('neubie-schedule-overlay');
            if (overlay) {
			  // 좌석모달 닫기
			  const m = overlay.querySelector('#nso-seat-modal');
			  if(m){ m.style.opacity='0'; m.style.pointerEvents='none'; }
			  const b = overlay.firstElementChild;
			  if(b) b.style.filter='';
			  overlay.style.display='flex';
              // 재열기 시에도 fetch
              fetch(SCHEDULE_URL+'?t='+Date.now())
                .then(r=>r.json())
                .then(data=>{
                  const key=monthKey(data);
                  if(key){ setCache(key,data); currentMonthKey=key; }
                  scheduleData=data;
                  const updated=overlay.querySelector('#nso-updated');
                  if(updated&&data.updatedAt) updated.textContent=new Date(data.updatedAt).toLocaleString('ko-KR')+' 데이터 기준';
                  renderCal();
                  const n1=overlay.querySelector('#nso-name1')?.value.trim();
                  const n2=overlay.querySelector('#nso-name2')?.value.trim();
                  if(n1||n2) runCompare();
                }).catch(()=>{});
			  return;
			}

            let SEAT_MAP = null;
            const seatRes = await fetch('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/monthly_schedule/seat_map.json?t='+Date.now());
            SEAT_MAP = await seatRes.json();
            const PARTITION_AFTER = 1;

            overlay = document.createElement('div');
            overlay.id = 'neubie-schedule-overlay';
            overlay.style.cssText = `
                position:fixed; inset:0; z-index:2147483646;
                background:transparent;
                display:flex; align-items:flex-start; justify-content:center; padding-top:20px;
                font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;
            `;

            const box = document.createElement('div');
            box.style.cssText = `
                background:#0f1117; color:#e2e8f0;
                border-radius:16px; padding:20px;
                width:min(96vw,820px); max-height:92vh;
				margin-top:0;
                overflow-y:auto; position:relative;
                background-image: linear-gradient(to bottom, #1a2240 0%, transparent 30%),
                url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/ego_trippin/snoopy_camping.jpg');
                background-size: 100% auto;
                background-position: center bottom;
                background-repeat: no-repeat;
                background-color: #1a2240;
                box-shadow: 0 4px 40px rgba(0,0,0,0.7);
            `;

            let nsoZoom = parseInt(localStorage.getItem('nv_nso_zoom') || '100');
            let scheduleData = null, compareResult = null;
            let calMode = localStorage.getItem('nv_nso_cal_mode') || 'work';
            let currentMonthKey = '', sel1 = '', sel2 = '';

            const LS = 'nv_data_cache';
            const getCache = () => { try{ return JSON.parse(localStorage.getItem(LS)||'{}'); }catch(e){ return {}; } };
            const setCache = (k,v) => { try{ const c=getCache(); c[k]=v; localStorage.setItem(LS,JSON.stringify(c)); }catch(e){} };
            const monthKey = d => { if(!d?.dates?.length) return ''; const [m]=d.dates[0].split('/').map(Number); return `${new Date().getFullYear()}-${String(m).padStart(2,'0')}`; };

            box.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:20px;font-weight:700;color:#4f8ef7;">📅 스케줄표 + 좌석 배치도</span>
                    <span id="nso-status" style="font-size:12px;color:#94a3b8;">로딩 중...</span>
                    <span id="nso-dot" style="width:7px;height:7px;border-radius:50%;background:#eab308;display:inline-block;"></span>
                    <span id="nso-updated" style="font-size:12px;color:#64748b;"></span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <button id="nso-zoom-out" style="width:26px;height:26px;border:none;border-radius:5px;background:#22263a;color:#94a3b8;font-size:14px;cursor:pointer;">-</button>
                  <span id="nso-zoom-label" style="font-size:12px;color:#94a3b8;min-width:36px;text-align:center;">100%</span>
                  <button id="nso-zoom-in" style="width:26px;height:26px;border:none;border-radius:5px;background:#22263a;color:#94a3b8;font-size:14px;cursor:pointer;">+</button>
                  <button id="nso-close" style="width:28px;height:28px;border:none;border-radius:5px;background:#3b0000;border:1px solid #ef4444;color:#ef4444;font-size:16px;cursor:pointer;">✕</button>
                </div>
                </div>

                <!-- 달력 -->
                <div style="margin-bottom:120px;background:rgba(15,17,23,.3);border-radius:12px;padding:12px;">
                <div style="display:flex;align-items:center;margin-bottom:10px;position:relative;">
                  <div style="font-size:11px;color:#475569;position:absolute;left:0;">(날짜 클릭 → 좌석 배치도)</div>
                  <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;">
                    <button id="nso-prev" style="width:28px;height:28px;border:1px solid #2e3347;border-radius:5px;background:#22263a;color:#94a3b8;font-size:14px;cursor:pointer;">◀</button>
                    <div id="nso-cal-title" style="font-size:16px;font-weight:700;color:#e2e8f0;">로딩 중...</div>
                    <button id="nso-next" style="width:28px;height:28px;border:1px solid #2e3347;border-radius:5px;background:#22263a;color:#94a3b8;font-size:14px;cursor:pointer;">▶</button>
                  </div>
                  <button id="nso-cal-mode" style="position:absolute;right:0;font-size:12px;padding:3px 8px;border-radius:6px;border:1px solid #f97316;background:rgba(249,115,22,0.1);color:#f97316;cursor:pointer;white-space:nowrap;">근무 기준</button>
                </div>
                <div id="nso-cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;"></div>
                </div>

                <!-- 검색 패널 -->
                <div style="position:sticky;bottom:0;background:#1a1d27;border:1px solid #2e3347;border-radius:9px;padding:12px 14px;margin-top:12px;">
                <div style="font-size:14px;color:#94a3b8;margin-bottom:9px;">👥 스케줄 비교(입력 시 저장됨)</div>
                <div style="display:flex;gap:6px;align-items:center;width:100%;">
                    <div style="flex:1;min-width:0;">
                    <input id="nso-name1" type="text" placeholder="이름..." autocomplete="off"
                        style="width:100%;background:#0f1117;border:1.5px solid #f97316;border-radius:5px;padding:8px 10px;color:#e2e8f0;font-size:14px;box-sizing:border-box;"/>
                    </div>
                    <div style="flex:1;min-width:0;">
                    <input id="nso-name2" type="text" placeholder="이름..." autocomplete="off"
                        style="width:100%;background:#0f1117;border:1.5px solid #a855f7;border-radius:5px;padding:8px 10px;color:#e2e8f0;font-size:14px;box-sizing:border-box;"/>
                    </div>
                    <button id="nso-compare" style="flex-shrink:0;padding:6px 14px;border:none;border-radius:5px;cursor:pointer;font-size:14px;font-weight:600;background:#4f8ef7;color:#fff;white-space:nowrap;">비교</button>
                    <button id="nso-clear" style="flex-shrink:0;padding:6px 14px;border:none;border-radius:5px;cursor:pointer;font-size:14px;font-weight:600;background:#22263a;color:#94a3b8;border:1px solid #2e3347;white-space:nowrap;">초기화</button>
                </div>
                <div id="nso-overlap" style="font-size:13px;color:#94a3b8;padding:5px 10px;background:#22263a;border-radius:5px;margin-top:7px;display:none;"></div>
                </div>

                <!-- 좌석 모달 -->
                <div id="nso-seat-modal" style="position:fixed;inset:0;background:transparent;display:flex;align-items:center;justify-content:center;z-index:2147483647;opacity:0;pointer-events:none;transition:opacity .18s;">
                <div style="background:#1a1d27;border:1px solid #2e3347;border-radius:12px;padding:18px;width:min(96vw,900px);max-height:92vh;overflow-y:auto;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                      <div style="font-size:16px;font-weight:700;color:#ffffff;">🪑 좌석 배치 — <span id="nso-seat-date" style="color:#4f8ef7;"></span></div>
                      <div style="font-size:16px;color:#475569;">(아무 데나 클릭하면 닫힘)</div>
                    </div>
                    </div>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:11px;font-size:12px;color:#94a3b8;">
                    <span><span style="width:8px;height:8px;border-radius:2px;background:#22c55e;display:inline-block;margin-right:3px;"></span>출근</span>
                    <span><span style="width:8px;height:8px;border-radius:2px;background:#eab308;display:inline-block;margin-right:3px;"></span>연차/반차/반반차/공가</span>
                    <span><span style="width:8px;height:8px;border-radius:2px;background:#22263a;border:1px solid #2e3347;display:inline-block;margin-right:3px;"></span>미출근</span>
                    </div>
                    <div id="nso-seat-grid" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;"></div>
                </div>
                </div>
            `;

            overlay.appendChild(box);
            document.body.appendChild(overlay);

            const DOW=['일','월','화','수','목','금','토'];
            const DOW_CLS=['#f87171','#94a3b8','#94a3b8','#94a3b8','#94a3b8','#94a3b8','#60a5fa'];

            function renderCal() {
                const grid = box.querySelector('#nso-cal-grid');
                const title = box.querySelector('#nso-cal-title');
                if(!grid||!title||!scheduleData?.dates?.length) return;
                const [m0]=scheduleData.dates[0].split('/').map(Number);
                const year=new Date().getFullYear();
                title.textContent=`${year}년 ${m0}월`;
                const dim=new Date(year,m0,0).getDate();
                const today=new Date();
                grid.innerHTML='';
                DOW.forEach((d,i)=>{
                const el=document.createElement('div');
                el.style.cssText=`text-align:center;font-size:14px;font-weight:600;padding:4px 0;color:${DOW_CLS[i]};background:rgba(15,17,23,.7);border-radius:3px;`;
                el.textContent=d; grid.appendChild(el);
                });
                const firstDow=new Date(year,m0-1,1).getDay();
                for(let i=0;i<firstDow;i++){
                const el=document.createElement('div'); grid.appendChild(el);
                }
                for(let d=1;d<=dim;d++){
                const dow=new Date(year,m0-1,d).getDay();
                const label=`${m0}/${d}`;
                const info=compareResult?compareResult[label]:null;
                const isToday=today.getFullYear()===year&&today.getMonth()===m0-1&&today.getDate()===d;
                const el=document.createElement('div');
                el.style.cssText=`background:#1a1d27;border:1px solid ${isToday?'#4f8ef7':'#2e3347'};border-radius:6px;padding:5px 4px;min-height:70px;cursor:pointer;transition:all .12s;position:relative;`;
                const numEl=document.createElement('div');
                numEl.style.cssText=`font-size:14px;font-weight:600;color:${dow===0?'#f87171':dow===6?'#60a5fa':isToday?'#4f8ef7':'#64748b'};margin-bottom:3px;`;
                numEl.textContent=d; el.appendChild(numEl);
                if(info){
                    const {d1,d2,w1,w2}=info;
                    const isLeave1=d1?.status==='annual'||d1?.status==='public';
                    const isLeave2=d2?.status==='annual'||d2?.status==='public';
                    const show1 = calMode==='work' ? (w1 && !isLeave1) : (d1 ? (!w1||isLeave1) : false);
                    const show2 = calMode==='work' ? (w2 && !isLeave2) : (d2 ? (!w2||isLeave2) : false);

                    if(show1){
                      const b=document.createElement('div');
                      const st=d1?.status||'work';
                      const isOff1 = calMode!=='work';
                      b.style.cssText=`font-size:13px;border-radius:3px;padding:1px 4px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4;
                        background:rgba(249,115,22,.18);
                        color:#f97316;
                        ${st==='half'||st==='half-half'?'border:1px dashed #f97316;':''}`;
                      const n1v=box.querySelector('#nso-name1').value.trim();
                      b.textContent=st==='half'?`${n1v}(반차)`:st==='half-half'?`${n1v}(반반차)`:
                        isOff1&&st==='annual'?`${n1v}(연차)`:
                        isOff1&&st==='public'?`${n1v}(공가)`:n1v;
                      el.appendChild(b);
                    }
                    if(show2){
                      const b=document.createElement('div');
                      const st=d2?.status||'work';
                      const isOff2 = calMode!=='work';
                      b.style.cssText=`font-size:13px;border-radius:3px;padding:1px 4px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4;
                        background:rgba(168,85,247,.18);
                        color:#a855f7;
                        ${st==='half'||st==='half-half'?'border:1px dashed #a855f7;':''}`;
                      const n2v=box.querySelector('#nso-name2').value.trim();
                      b.textContent=st==='half'?`${n2v}(반차)`:st==='half-half'?`${n2v}(반반차)`:
                        isOff2&&st==='annual'?`${n2v}(연차)`:
                        isOff2&&st==='public'?`${n2v}(공가)`:n2v;
                      el.appendChild(b);
                    }
                }
                el.addEventListener('click',()=>openSeat(label));
                grid.appendChild(el);
                }
            }

            // 비교
            function runCompare(){
                sel1=box.querySelector('#nso-name1').value.trim();
                sel2=box.querySelector('#nso-name2').value.trim();
                if(!scheduleData||(!sel1&&!sel2)) return;
                const s1=scheduleData.staff.find(s=>s.name===sel1);
                const s2=scheduleData.staff.find(s=>s.name===sel2);
                if(!s1&&!s2) return;
                try{ localStorage.setItem('nv_name1',sel1); localStorage.setItem('nv_name2',sel2); }catch(e){}
                compareResult={};
                let c1=0,c2=0,ov=0;
                let off1=0,off2=0,offOv=0;
                for(const date of scheduleData.dates){
                const d1=s1?s1.schedule[date]:null, d2=s2?s2.schedule[date]:null;
                const w1=d1?d1.working:false, w2=d2?d2.working:false;
                const p1=d1?d1.present:false, p2=d2?d2.present:false;
                if(p1)c1++; if(p2)c2++; if(p1&&p2)ov++;
                if(!p1||(d1?.status==='annual'||d1?.status==='public')) off1++;
                if(!p2||(d2?.status==='annual'||d2?.status==='public')) off2++;
                if((!p1||(d1?.status==='annual'||d1?.status==='public'))&&
                    (!p2||(d2?.status==='annual'||d2?.status==='public'))) offOv++;
                compareResult[date]={d1,d2,w1,w2};
                }
                const d1Show=calMode==='work'?c1:off1;
                const d2Show=calMode==='work'?c2:off2;
                const ovShow=calMode==='work'?ov:offOv;
                const modeLabel=calMode==='work'?'근무':'휴무';
                const ov2=box.querySelector('#nso-overlap');
                if(ov2){
                ov2.style.display='block';
                ov2.innerHTML=
                    (s1?`<span style="color:#f97316;font-weight:700">${sel1}</span> <strong>${d1Show}일</strong>`:'') +
                    (s1&&s2?' | ':'') +
                    (s2?`<span style="color:#a855f7;font-weight:700">${sel2}</span> <strong>${d2Show}일</strong>`:'') +
                    (s1&&s2?` | ${modeLabel}겹침 <strong style="color:#4f8ef7">${ovShow}일</strong>`:'');
                }
                renderCal();
            }

            // 좌석 배치
            function openSeat(dateLabel){
              if(!scheduleData) return;
              const modal = box.querySelector('#nso-seat-modal') || overlay.querySelector('#nso-seat-modal');
              if(!modal) return;

              if(modal.parentNode === box) overlay.appendChild(modal);

              overlay.querySelector('#nso-seat-date').textContent=dateLabel;
            
              const pw=scheduleData.staff
                .filter(s=>s.schedule[dateLabel]?.present)
                .map(s=>({name:s.name,shiftType:s.shiftType,workTime:s.workTime,status:s.schedule[dateLabel].status}));
              const leaveMap={};
              scheduleData.staff.forEach(s=>{
                const d=s.schedule[dateLabel];
                if(d&&(d.status==='annual'||d.status==='public')) leaveMap[s.name]=d.status;
              });
              renderSeat(pw,leaveMap);
              modal.style.opacity='1'; modal.style.pointerEvents='all';
              box.style.filter='blur(4px)';

              modal.onclick = () => {
                modal.style.opacity='0'; modal.style.pointerEvents='none';
                box.style.filter='';
              };
            }

            function renderSeat(pw,leaveMap){
                const pMap=Object.fromEntries(pw.map(w=>[w.name,w]));
                const grid=overlay.querySelector('#nso-seat-grid')
                if(!grid) return;
                grid.innerHTML='';
                let idx=0;
                for(let row=0;row<SEAT_MAP.length;row++){
                if(row===PARTITION_AFTER+1){
                    const pl=document.createElement('div');
                    pl.style.cssText='grid-column:1/-1;height:2px;background:linear-gradient(90deg,transparent,#64748b 20%,#64748b 80%,transparent);border-radius:1px;margin:3px 0;opacity:.35;';
                    grid.appendChild(pl);
                }
                for(let col=0;col<SEAT_MAP[row].length;col++){
                    const raw=SEAT_MAP[row][col]; idx++;
                    const el=document.createElement('div');
                    if(!raw){
                    el.style.cssText='background:#0f1117;border:1px dashed #2e3347;border-radius:6px;padding:6px 2px;min-height:100px;';
                    el.innerHTML=`<span style="position:absolute;top:2px;right:3px;font-size:12px;color:#333333;">${idx}</span>`;
                    grid.appendChild(el); continue;
                    }
                    const occ=raw.split('/').map(n=>n.trim());
                    const onPpl=occ.filter(n=>pMap[n]);
                    const isOn=onPpl.length>0;
                    const isHalf=isOn&&onPpl.some(n=>pMap[n].status==='half'||pMap[n].status==='half-half');
                    const bg=isOn?(isHalf?'rgba(234,179,8,.12)':'rgba(34,197,94,.15)'):'#22263a';
                    const bc=isOn?(isHalf?'#eab308':'#22c55e'):'#2e3347';
                    el.style.cssText=`background:${bg};border:1px solid ${bc};border-radius:6px;padding:6px 2px;text-align:center;font-size:.62rem;font-weight:600;min-height:100px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;position:relative;${isOn?'':`opacity:.35;`}`;
                    el.innerHTML=`<span style="position:absolute;top:2px;right:3px;font-size:.48rem;color:#333333;">${idx}</span>`;
                    if(occ.length>1){
                    const sd=document.createElement('div');
                    sd.style.cssText='display:flex;flex-direction:column;align-items:center;width:100%;gap:0;';
                    occ.forEach((name,i)=>{
                        const w=pMap[name];
                        const sp=document.createElement('div');
                        sp.style.cssText='display:flex;flex-direction:column;align-items:center;';
                        const ne=document.createElement('div');
                        ne.style.cssText=`font-size:13px;line-height:1.25;font-weight:700;color:${w?(isHalf?'#eab308':'#22c55e'):'#64748b'};`;
                        ne.textContent=name; sp.appendChild(ne);
                        if(leaveMap[name]){
                        const bd=document.createElement('div');
                        bd.style.cssText='font-size:12px;border-radius:2px;padding:0 3px;margin-top:1px;font-weight:700;background:rgba(234,179,8,.25);color:#eab308;';
                        bd.textContent=leaveMap[name]==='annual'?'연차':'공가'; sp.appendChild(bd);
                        }
                        if(w&&(w.status==='half'||w.status==='half-half')){
                        const bd=document.createElement('div');
                        bd.style.cssText='font-size:12px;border-radius:2px;padding:0 3px;margin-top:1px;font-weight:700;background:rgba(234,179,8,.25);color:#eab308;';
                        bd.textContent=w.status==='half'?'반차':'반반차'; sp.appendChild(bd);
                        }
                        if(w){
                        const te=document.createElement('div');
                        te.style.cssText=`font-size:13px;color:${isHalf?'rgba(234,179,8,.75)':'rgba(34,197,94,.65)'};line-height:1.2;margin-top:1px;`;
                        te.textContent=w.workTime||w.shiftType||''; sp.appendChild(te);
                        }
                        sd.appendChild(sp);
                        if(i<occ.length-1){
                        const dv=document.createElement('div');
                        dv.style.cssText='font-size:.46rem;color:#64748b;line-height:1;';
                        dv.textContent='/'; sd.appendChild(dv);
                        }
                    });
                    el.appendChild(sd);
                    } else {
                    const w=pMap[raw];
                    const ne=document.createElement('div');
                    ne.style.cssText=`font-size:13px;line-height:1.25;font-weight:700;color:${isOn?(isHalf?'#eab308':'#22c55e'):'#94a3b8'};`;
                    ne.textContent=raw; el.appendChild(ne);
                    if(leaveMap[raw]){
                        const bd=document.createElement('div');
                        bd.style.cssText='font-size:12px;border-radius:2px;padding:0 3px;margin-top:1px;font-weight:700;background:rgba(234,179,8,.25);color:#eab308;';
                        bd.textContent=leaveMap[raw]==='annual'?'연차':'공가'; el.appendChild(bd);
                    }
                    if(w){
                        if(w.status==='half'||w.status==='half-half'){
                        const bd=document.createElement('div');
                        bd.style.cssText='font-size:12px;border-radius:2px;padding:0 3px;margin-top:1px;font-weight:700;background:rgba(234,179,8,.25);color:#eab308;';
                        bd.textContent=w.status==='half'?'반차':'반반차'; el.appendChild(bd);
                        }
                        const te=document.createElement('div');
                        te.style.cssText=`font-size:13px;color:${isHalf?'rgba(234,179,8,.75)':'rgba(34,197,94,.65)'};line-height:1.2;margin-top:1px;`;
                        te.textContent=w.workTime||w.shiftType||''; el.appendChild(te);
                    }
                    }
                    el.addEventListener('mouseenter', ev=>{
                    let tip=document.getElementById('nso-tooltip');
                    if(!tip){ tip=document.createElement('div'); tip.id='nso-tooltip';
                        tip.style.cssText='position:fixed;background:#1a1d27;border:1px solid #2e3347;border-radius:7px;padding:9px 12px;font-size:12px;z-index:2147483647;pointer-events:none;max-width:210px;line-height:1.55;box-shadow:0 4px 24px rgba(0,0,0,.45);';
                        document.body.appendChild(tip);
                    }
                    let html='';
                    occ.forEach((name,i)=>{
                        const w=pMap[name];
                        html+=`<div style="font-weight:700;color:#e2e8f0;margin-bottom:2px;">${name}</div>`;
                        if(w){
                        const ko={work:'출근',half:'반차','half-half':'반반차',annual:'연차',public:'공가',off:'휴무',empty:'미출근'};
                        html+=`<div style="color:#94a3b8;">근무조: <span style="color:#e2e8f0;">${w.shiftType}</span></div>`;
                        html+=`<div style="color:#94a3b8;">시간: <span style="color:#e2e8f0;">${w.workTime}</span></div>`;
                        html+=`<div style="color:#94a3b8;">상태: <span style="color:#e2e8f0;">${ko[w.status]||w.status}</span></div>`;
                        } else { html+=`<div style="color:#64748b;">미출근</div>`; }
                        if(i<occ.length-1) html+=`<hr style="border:none;border-top:1px solid #2e3347;margin:4px 0;">`;
                    });
                    tip.innerHTML=html;
                    tip.style.display='block';
                    let x=ev.clientX+13, y=ev.clientY+13;
                    if(x+210>window.innerWidth) x=ev.clientX-220;
                    if(y+130>window.innerHeight) y=ev.clientY-140;
                    tip.style.left=x+'px'; tip.style.top=y+'px';
                    });
                    el.addEventListener('mouseleave',()=>{ const t=document.getElementById('nso-tooltip'); if(t) t.style.display='none'; });
                    grid.appendChild(el);
                }
                }
            }

            // 줌 버튼
            const updateZoom = (z) => {
			  nsoZoom = Math.max(100, Math.min(150, z));
			  localStorage.setItem('nv_nso_zoom', nsoZoom);
			  box.style.zoom = `${nsoZoom}%`; 
			  box.style.transform = '';      
			  box.querySelector('#nso-zoom-label').textContent = nsoZoom + '%';
			};
              box.querySelector('#nso-zoom-in').onclick = () => updateZoom(nsoZoom+10);
              box.querySelector('#nso-zoom-out').onclick = () => updateZoom(nsoZoom-10);
              box.querySelector('#nso-zoom-label').textContent = nsoZoom + '%';
			  box.style.zoom = `${nsoZoom}%`;

            box.querySelector('#nso-cal-mode').textContent = calMode==='work'?'근무 기준':'휴무 기준';
            
            const updateCalModeBtn = () => {
              const btn = box.querySelector('#nso-cal-mode');
              btn.textContent = calMode==='work'?'근무 기준':'휴무 기준';
              btn.style.borderColor = calMode==='work'?'#f97316':'#a855f7';
              btn.style.color = calMode==='work'?'#f97316':'#a855f7';
            };
            updateCalModeBtn();
            box.querySelector('#nso-cal-mode').onclick = () => {
              calMode = calMode==='work'?'off':'work';
              localStorage.setItem('nv_nso_cal_mode', calMode);
              updateCalModeBtn();
              if(sel1||sel2) runCompare(); else renderCal();
            };

            box.querySelector('#nso-close').onclick = () => {
                overlay.style.display = 'none';
                if (window._neubieScheduleCard) window._neubieScheduleCard.style.outline = 'none';
            };
            const BASE_URL = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/monthly_schedule/';

            async function loadMonthFromGithub(newKey) {
            const c = getCache();
            if(c[newKey] && new Date(c[newKey].updatedAt).toDateString()===new Date().toDateString()){
                currentMonthKey=newKey; scheduleData=c[newKey]; renderCal();
                if(sel1||sel2) runCompare();
                return;
            }
            status.textContent='로딩 중...'; dot.style.background='#eab308';
            try {
                const url = `${BASE_URL}schedule_for_mobile_${newKey}.json?t=${Date.now()}`;
                const res = await fetch(url);
                if(!res.ok) throw new Error('없음');
                const data = await res.json();
                setCache(newKey, data);
                currentMonthKey=newKey; scheduleData=data;
                status.textContent='완료'; dot.style.background='#22c55e';
                renderCal();
                if(sel1||sel2) runCompare();
            } catch(e) {
                status.textContent=`${newKey} 데이터 없음`; dot.style.background='#ef4444';
            }
            }

            box.querySelector('#nso-prev').onclick = () => {
            if(!currentMonthKey) return;
            const [y,m]=currentMonthKey.split('-').map(Number);
            const d=new Date(y,m-2,1);
            const newKey=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            loadMonthFromGithub(newKey);
            };

            box.querySelector('#nso-next').onclick = () => {
            if(!currentMonthKey) return;
            const [y,m]=currentMonthKey.split('-').map(Number);
            const d=new Date(y,m,1);
            const newKey=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            loadMonthFromGithub(newKey);
            };
            box.querySelector('#nso-compare').onclick = runCompare;
            box.querySelector('#nso-name1').addEventListener('keydown',e=>{ if(e.key==='Enter') box.querySelector('#nso-name2').focus(); });
            box.querySelector('#nso-name2').addEventListener('keydown',e=>{ if(e.key==='Enter') runCompare(); });
            box.querySelector('#nso-clear').onclick = () => {
                box.querySelector('#nso-name1').value=''; box.querySelector('#nso-name2').value='';
                sel1=''; sel2=''; compareResult=null;
                box.querySelector('#nso-overlap').style.display='none';
                renderCal();
            };

            try{
                const n1=localStorage.getItem('nv_name1')||'';
                const n2=localStorage.getItem('nv_name2')||'';
                if(n1) box.querySelector('#nso-name1').value=n1;
                if(n2) box.querySelector('#nso-name2').value=n2;
            }catch(e){}

            const status = box.querySelector('#nso-status');
            const dot = box.querySelector('#nso-dot');
            const updated = box.querySelector('#nso-updated');

            status.textContent='로딩 중...'; dot.style.background='#eab308';
            fetch(SCHEDULE_URL+'?t='+Date.now())
                .then(r=>r.json())
                .then(data=>{
                const key=monthKey(data);
                if(key){ setCache(key,data); currentMonthKey=key; }
                scheduleData=data;
                status.textContent='갱신 완료'; dot.style.background='#22c55e';
                if(data.updatedAt) updated.textContent=new Date(data.updatedAt).toLocaleString('ko-KR') + ' 데이터 기준';
                renderCal();
                const n1=box.querySelector('#nso-name1').value.trim();
                const n2=box.querySelector('#nso-name2').value.trim();
                if(n1||n2) runCompare();
                })
                .catch(()=>{ status.textContent='로드 실패'; dot.style.background='#ef4444'; });
            }

            window.openWeatherOverlay = async function() {
                let overlay = document.getElementById('neubie-weather-overlay');
                if (overlay) { overlay.style.display = 'flex'; renderWeather(overlay); return; }

                overlay = document.createElement('div');
                overlay.id = 'neubie-weather-overlay';
                overlay.style.cssText = `
                    position:fixed; inset:0; z-index:2147483646;
                    background:transparent;
                    display:flex; align-items:flex-start; justify-content:center; padding-top:20px;
                    font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;
                    pointer-events:none;
                `;
                const box = document.createElement('div');
                box.style.cssText = `
                    background:#0f1117; color:#e2e8f0;
                    border-radius:16px; padding:20px;
                    width:min(96vw,720px);
                    box-shadow:0 4px 40px rgba(0,0,0,0.7);
                    pointer-events:auto;
                `;
                box.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                        <span style="font-size:18px;font-weight:700;color:#4f8ef7;">☀️ 송내 현재 날씨 (기상청 API)</span>
                        <button id="nwo-close" style="width:28px;height:28px;border:none;border-radius:5px;background:#3b0000;border:1px solid #ef4444;color:#ef4444;font-size:16px;cursor:pointer;">✕</button>
                    </div>
                    <div id="nwo-body" style="font-size:13px;color:#64748b;">불러오는 중...</div>
                `;
                overlay.appendChild(box);
                document.body.appendChild(overlay);
                box.querySelector('#nwo-close').onclick = () => {
                    overlay.style.display = 'none';
                    window._neubieWeatherCard.style.outline = 'none';
                };

                renderWeather(overlay);
            };

            async function renderWeather(overlay) {
                const data = await fetchWeatherReal(); // TODO: 실제 API 연결 시 await fetch(...)
                const body = overlay.querySelector('#nwo-body');

                const hourlyHtml = data.hourly.map((h, i) => `
                    <div style="flex:1;min-width:0;text-align:center;padding:6px 0;${i < 6 ? 'opacity:1;' : 'opacity:0.65;'}${i === 0 ? 'background:#1e3a5f;border-radius:8px;' : ''}">
                        <div style="font-size:11px;color:#94a3b8;">${i === 0 ? '지금' : h.hour + '시'}</div>
                        <div style="font-size:16px;margin:4px 0;">${h.icon}</div>
                        <div style="font-size:13px;">${h.temp}°</div>
                        ${h.pop > 0 ? `<div style="font-size:10px;color:#4f8ef7;">💧${h.pop}%</div>` : ''}
                    </div>`).join('');

                const dailyHtml = data.daily.map(d => `
                    <div style="background:#1a1c24;border-radius:10px;padding:10px 6px;text-align:center;flex:1;">
                        <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">${formatDailyLabel(d.date)}</div>
                        <div style="font-size:18px;">${d.icon}</div>
                        <div style="font-size:13px;font-weight:700;margin-top:6px;">${d.min}° / ${d.max}°</div>
                        <div style="font-size:11px;color:${d.pop > 0 ? '#4f8ef7' : '#64748b'};margin-top:2px;">${d.pop > 0 ? '강수 ' + d.pop + '%' : '강수 없음'}</div>
                    </div>`).join('');

                body.innerHTML = `
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                        <div style="font-size:24px;">${data.current.icon}</div>
                        <div>
                            <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">오늘 · ${data.updatedAt.getMonth()+1}/${data.updatedAt.getDate()}(${['일','월','화','수','목','금','토'][data.updatedAt.getDay()]})</div>
                            <div style="font-size:22px;font-weight:700;line-height:1.1;">${data.current.temp}°</div>
                            <div style="font-size:11px;color:#64748b;">${data.updatedAt.toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit', hour12:false})} 기준</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:4px;margin-bottom:10px;">${hourlyHtml}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
                        <span style="font-size:10px;color:#64748b;">0~6h 정밀</span>
                        <div style="flex:1;height:1px;background:#2e3347;"></div>
                        <span style="font-size:10px;color:#64748b;">6~12h 예상</span>
                    </div>
                    <div style="border-top:1px solid #2e3347;padding-top:10px;display:flex;gap:8px;">${dailyHtml}</div>
                `;
            }

            function formatDailyLabel(dateStr) {
                const y = Number(dateStr.slice(0, 4)), m = Number(dateStr.slice(4, 6)), d = Number(dateStr.slice(6, 8));
                const dow = ['일', '월', '화', '수', '목', '금', '토'][new Date(y, m - 1, d).getDay()];
                return `${m}/${d}(${dow})`;
            }

            async function fetchWeatherReal() {
                const res = await fetch(WEATHER_CONFIG.proxyUrl);
                const data = await res.json();
                data.updatedAt = new Date(data.updatedAt);
                return data;
            }

            window.openTipsOverlay = function() {
                const dashboardEl = document.getElementById('neubie-dashboard');
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
                    tipsTitle.textContent = '최적화 팁';
                    tipsTitle.style.cssText = `font-size:20px; font-weight:bold; margin-bottom:20px; color:#fcd34d; cursor:pointer;`;

                    const padIndicator = document.createElement('span');
                    padIndicator.style.cssText = 'font-size:12px;color:#ef4444;margin-left:8px;font-weight:700;';
                    padIndicator.textContent = '패드기능 OFF';
                    padIndicator.style.display = localStorage.getItem('neubie_dpad_binding')==='off' ? 'inline' : 'none';
                    tipsTitle.appendChild(padIndicator);

                    let tipClickCount = 0;
                    let tipClickTimer = null;
                    tipsTitle.addEventListener('click', () => {
                    tipClickCount++;
                    clearTimeout(tipClickTimer);
                    tipClickTimer = setTimeout(() => { tipClickCount = 0; }, 2000);
                    if(tipClickCount >= 5){
                        tipClickCount = 0;
                        clearTimeout(tipClickTimer);
                        if(localStorage.getItem('neubie_dpad_binding')==='off'){
                        localStorage.removeItem('neubie_dpad_binding');
                        padIndicator.style.display='none';
                        } else {
                        localStorage.setItem('neubie_dpad_binding','off');
                        padIndicator.style.display='inline';
                        }
                    }
                    });

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
                    tipsClose.onclick = () => { tipsOverlay.style.display = 'none'; };

                    const tipsItems = [
                        { title: "슬랙 PWA 버전 사용법", url: "https://telling-ink-a85.notion.site/PWA-366a8cf5ba7b80eebb43e017c095702c?pvs=74" },
                        { title: "OBS 설정법", url: "https://telling-ink-a85.notion.site/OBS-366a8cf5ba7b80dfb101cfa149eaefcf?pvs=74" },
                        { title: "CYH's 추천 프로그램", url: "https://telling-ink-a85.notion.site/366a8cf5ba7b80958575eadb8809f313" },
                    ];
                    const tipsContent = document.createElement('div');
                    tipsContent.style.cssText = "display:grid; gap:10px;";
                    tipsItems.forEach(item => {
                        const row = document.createElement('div');
                        row.style.cssText = `
                            display:flex; justify-content:space-between; align-items:center;
                            background:#252525; border:1px solid #333333; border-radius:12px;
                            padding:13px 16px; gap:12px;
                        `;
                        const rowTitle = document.createElement('span');
                        rowTitle.textContent = item.title;
                        rowTitle.style.cssText = "font-size:14px; font-weight:600; color:#e2e8f0; flex:1;";
                        const rowBtn = document.createElement('button');
                        rowBtn.textContent = '열기';
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
                    document.body.appendChild(tipsOverlay);
                }
                const r0 = dashboardEl.getBoundingClientRect();
                tipsOverlay.style.top = r0.top + 'px';
                tipsOverlay.style.left = r0.left + 'px';
                tipsOverlay.style.width = r0.width + 'px';
                tipsOverlay.style.height = r0.height + 'px';
                tipsOverlay.style.display = 'flex';
            };

            window.openRouletteOverlay = function() {
                let overlay = document.getElementById('neubie-roulette-overlay');
                if (overlay) { overlay.style.display = 'flex'; return; }

                overlay = document.createElement('div');
                overlay.id = 'neubie-roulette-overlay';
                overlay.style.cssText = `
                    position:fixed; inset:0; z-index:2147483646;
                    background:transparent; pointer-events:none;
                    display:flex; align-items:center; justify-content:center;
                    font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;
                `;
                const box = document.createElement('div');
                box.style.cssText = `
                    background:#0f1117; color:#e2e8f0;
                    border-radius:16px; padding:20px;
                    width:min(94vw,620px);
                    box-shadow:0 4px 40px rgba(0,0,0,0.7);
                    pointer-events:auto;
                `;
                box.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                        <span style="font-size:18px;font-weight:700;color:#4f8ef7;">룰렛 & 동전 & 메모</span>
                        <button id="rc-close" style="width:28px;height:28px;border:none;border-radius:5px;background:#3b0000;border:1px solid #ef4444;color:#ef4444;font-size:16px;cursor:pointer;">✕</button>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                        <div style="background:#1a1c24;border-radius:12px;padding:14px;">
                            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                                <span style="font-size:14px;font-weight:700;color:#94a3b8;">룰렛</span>
                                <div style="display:flex;gap:6px;">
                                    <button id="rc-preset-lunch" style="font-size:11px;padding:4px 8px;background:#252525;border:1px solid #333;color:#e2e8f0;border-radius:6px;cursor:pointer;">식사 메뉴</button>
                                    <button id="rc-preset-people" style="font-size:11px;padding:4px 8px;background:#252525;border:1px solid #333;color:#e2e8f0;border-radius:6px;cursor:pointer;">사람 이름</button>
                                    <button id="rc-preset-etc" style="font-size:11px;padding:4px 8px;background:#252525;border:1px solid #333;color:#e2e8f0;border-radius:6px;cursor:pointer;">기타</button>
                                </div>
                            </div>
                            <textarea id="rc-input" rows="6" style="width:100%;box-sizing:border-box;resize:none;font-size:12px;background:#111319;color:#e2e8f0;border:1px solid #333;border-radius:8px;padding:6px 8px;">한식
        중식
        일식</textarea>
                            <button id="rc-build" style="width:100%;margin-top:6px;padding:6px;background:#252525;border:1px solid #333;color:#e2e8f0;border-radius:8px;cursor:pointer;font-size:12px;">룰렛 만들기 (엔터로 구분)</button>
                            <div id="rc-capture-area" style="background:#0f1117;border-radius:12px;padding:8px 0;">
                                <div style="position:relative;width:190px;height:190px;margin:16px auto 6px;">
                                    <div id="rc-pointer" style="position:absolute;top:-4px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:13px solid #e2e8f0;z-index:3;transition:transform .15s ease;"></div>
                                    <div id="rc-wheel-wrap" style="position:relative;width:190px;height:190px;transition:transform 5s cubic-bezier(.13,.72,.1,1);">
                                        <canvas id="rc-canvas" width="190" height="190" style="display:block;position:relative;z-index:1;pointer-events:none;"></canvas>
                                        <div id="rc-labels" style="position:absolute;inset:0;z-index:2;pointer-events:none;"></div>
                                    </div>
                                    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:30px;height:30px;border-radius:50%;background:#1a1c24;border:2px solid #0f1117;z-index:3;"></div>
                                </div>
                                <div style="text-align:center;min-height:28px;margin-top:8px;">
                                    <span id="rc-result" style="display:none;font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;background:#1e3a5f;color:#4f8ef7;"></span>
                                </div>
                            </div>
                            <button id="rc-spin" style="width:100%;padding:8px;background:#4f8ef7;border:none;color:#0f1117;font-weight:700;border-radius:8px;cursor:pointer;font-size:13px;">돌리기</button>
                            <button id="rc-copy-img" style="visibility:hidden;width:100%;margin-top:8px;padding:6px;background:#252525;border:1px solid #333;color:#e2e8f0;border-radius:8px;cursor:pointer;font-size:12px;">📋 결과 이미지 복사</button>
                        </div>
                        <div style="background:#1a1c24;border-radius:12px;padding:14px;display:flex;flex-direction:column;align-items:center;height:100%;box-sizing:border-box;">
                            <div style="font-size:14px;font-weight:700;margin-bottom:12px;color:#94a3b8;align-self:flex-start;">동전 던지기</div>
                            <div style="width:65px;height:65px;perspective:500px;margin:10px 0 12px;">
                                <div id="rc-coin" style="width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform 2.6s cubic-bezier(.17,.67,.2,1);">
                                    <div style="position:absolute;inset:0;border-radius:50%;background:#3a2a10;border:2px solid #f59e0b;display:flex;align-items:center;justify-content:center;backface-visibility:hidden;">
                                        <div style="width:80%;height:80%;border-radius:50%;border:1px dashed #f59e0b;display:flex;align-items:center;justify-content:center;">
                                            <span style="font-size:14px;font-weight:700;color:#fbbf24;">앞</span>
                                        </div>
                                    </div>
                                    <div style="position:absolute;inset:0;border-radius:50%;background:#12233b;border:2px solid #4f8ef7;display:flex;align-items:center;justify-content:center;backface-visibility:hidden;transform:rotateY(180deg);">
                                        <div style="width:80%;height:80%;border-radius:50%;border:1px dashed #4f8ef7;display:flex;align-items:center;justify-content:center;">
                                            <span style="font-size:14px;font-weight:700;color:#4f8ef7;">뒤</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button id="rc-flip" style="width:100%;padding:8px;background:#4f8ef7;border:none;color:#0f1117;font-weight:700;border-radius:8px;cursor:pointer;font-size:13px;">던지기</button>
                            <div style="text-align:center;min-height:28px;margin-top:8px;">
                                <span id="rc-coin-result" style="display:none;font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;"></span>
                            </div>
                            <div style="width:100%;margin-top:14px;border-top:1px solid #2e3347;padding-top:12px;flex:1;display:flex;flex-direction:column;min-height:0;">
                                <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">개인 메모</div>
                                <textarea id="rc-memo" maxlength="500" style="width:100%;box-sizing:border-box;resize:none;overflow-y:auto;font-size:12px;background:#111319;color:#e2e8f0;border:1px solid #333;border-radius:8px;padding:6px 8px;flex:1;min-height:0;" placeholder="메모를 입력하세요..."></textarea>
                                <div id="rc-memo-count" style="text-align:right;font-size:10px;color:#64748b;margin-top:2px;">0/500</div>
                            </div>
                        </div>
                    </div>
                `;
                overlay.appendChild(box);
                document.body.appendChild(overlay);

                box.querySelector('#rc-close').onclick = () => {
                    overlay.style.display = 'none';
                    if (window._neubieRouletteCard) window._neubieRouletteCard.style.outline = 'none';
                };

                const palette = ['#7F77DD','#1D9E75','#D85A30','#D4537E'];
                const canvas = box.querySelector('#rc-canvas');
                const ctx = canvas.getContext('2d');
                let rcItems = [];
                let rcRotation = 0;
                let rcSpinning = false;
                const RC_KEYS = { lunch: 'neubie_roulette_lunch', people: 'neubie_roulette_people', etc: 'neubie_roulette_etc' };
                let rcCategory = 'lunch';

                function rcDraw() {
                    const n = rcItems.length || 1;
                    const cx = 95, cy = 95, r = 90;
                    ctx.clearRect(0, 0, 190, 190);
                    const slice = 2 * Math.PI / n;
                    for (let i = 0; i < n; i++) {
                        const start = i * slice - Math.PI / 2;
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.arc(cx, cy, r, start, start + slice);
                        ctx.closePath();
                        ctx.fillStyle = palette[i % palette.length];
                        ctx.fill();
                        ctx.strokeStyle = '#1a1c24';
                        ctx.lineWidth = 3;
                        ctx.stroke();
                    }
                    const labelsEl = box.querySelector('#rc-labels');
                    labelsEl.innerHTML = '';
                    const labelR = 58;
                    for (let i = 0; i < n; i++) {
                        const angle = i * slice + slice / 2 - Math.PI / 2;
                        const x = cx + labelR * Math.cos(angle);
                        const y = cy + labelR * Math.sin(angle);
                        const lab = document.createElement('div');
                        lab.className = 'rc-label';
                        lab.style.cssText = `position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%) rotate(${-rcRotation}deg);color:#fff;font-size:11px;font-weight:500;white-space:nowrap;transition:transform 5s cubic-bezier(.13,.72,.1,1);`;
                        lab.textContent = (rcItems[i] || '').slice(0, 7);
                        labelsEl.appendChild(lab);
                    }
                }

                function rcRebuild() {
                    rcItems = box.querySelector('#rc-input').value.split('\n').map(s => s.trim()).filter(Boolean);
                    box.querySelector('#rc-result').style.display = 'none';
                    rcDraw();
                }

                box.querySelector('#rc-build').onclick = rcRebuild;

                function rcSetActiveButton(cat) {
                    ['lunch', 'people', 'etc'].forEach(c => {
                        const btn = box.querySelector('#rc-preset-' + c);
                        if (c === cat) {
                            btn.style.background = '#4f8ef7';
                            btn.style.color = '#0f1117';
                            btn.style.borderColor = '#4f8ef7';
                        } else {
                            btn.style.background = '#252525';
                            btn.style.color = '#e2e8f0';
                            btn.style.borderColor = '#333';
                        }
                    });
                }

                function rcSetControlsDisabled(disabled) {
                    ['rc-preset-lunch', 'rc-preset-people', 'rc-preset-etc', 'rc-build', 'rc-spin'].forEach(id => {
                        const el = box.querySelector('#' + id);
                        el.disabled = disabled;
                        el.style.opacity = disabled ? '0.5' : '1';
                        el.style.cursor = disabled ? 'not-allowed' : 'pointer';
                    });
                    box.querySelector('#rc-input').disabled = disabled;
                }

                function rcLoadHtml2Canvas() {
                    return new Promise((resolve, reject) => {
                        if (window.html2canvas) return resolve();
                        const s = document.createElement('script');
                        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                        s.onload = () => resolve();
                        s.onerror = reject;
                        document.head.appendChild(s);
                    });
                }

                box.querySelector('#rc-copy-img').onclick = async () => {
                    const btn = box.querySelector('#rc-copy-img');
                    const original = btn.textContent;
                    btn.textContent = '캡처 중...';
                    btn.disabled = true;
                    try {
                        await rcLoadHtml2Canvas();
                        const target = box.querySelector('#rc-capture-area');
                        const blobPromise = window.html2canvas(target, { backgroundColor: '#0f1117' })
                            .then(canvas => new Promise(resolve => canvas.toBlob(resolve, 'image/png')));
                        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
                        btn.textContent = '복사됨!';
                    } catch (e) {
                        console.error(e);
                        btn.textContent = '복사 실패';
                    }
                    setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 1500);
                };

                function rcLoadCategory(cat, fallback) {
                    rcCategory = cat;
                    rcSetActiveButton(cat);
                    const saved = localStorage.getItem(RC_KEYS[cat]);
                    box.querySelector('#rc-input').value = (saved !== null && saved !== '') ? saved : fallback;
                    rcRebuild();
                }
                box.querySelector('#rc-preset-lunch').onclick = () => rcLoadCategory('lunch', '한식\n중식\n일식\n분식');
                box.querySelector('#rc-preset-people').onclick = () => rcLoadCategory('people', '유재석\n김연아\n손흥민\n김용욱');
                box.querySelector('#rc-preset-etc').onclick = () => rcLoadCategory('etc', '');
                box.querySelector('#rc-input').addEventListener('input', () => {
                    localStorage.setItem(RC_KEYS[rcCategory], box.querySelector('#rc-input').value);
                });

                box.querySelector('#rc-spin').onclick = () => {
                    if (rcSpinning || rcItems.length === 0) return;
                    rcSpinning = true;
                    rcSetControlsDisabled(true);
                    box.querySelector('#rc-copy-img').style.visibility = 'hidden';
                    const n = rcItems.length;
                    const sliceDeg = 360 / n;
                    const targetIndex = Math.floor(Math.random() * n);
                    const targetCenterDeg = targetIndex * sliceDeg + sliceDeg / 2;
                    const extraSpins = 5 * 360;
                    rcRotation = rcRotation - (rcRotation % 360) + extraSpins + (360 - targetCenterDeg);
                    const wheelWrap = box.querySelector('#rc-wheel-wrap');
                    wheelWrap.style.transition = 'transform 5s cubic-bezier(.13,.72,.1,1)';
                    wheelWrap.style.transform = `rotate(${rcRotation}deg)`;
                    box.querySelectorAll('.rc-label').forEach(lab => {
                        lab.style.transition = 'transform 5s cubic-bezier(.13,.72,.1,1)';
                        lab.style.transform = `translate(-50%,-50%) rotate(${-rcRotation}deg)`;
                    });
                    const pointer = box.querySelector('#rc-pointer');
                    const badge = box.querySelector('#rc-result');
                    badge.style.display = 'none';
                    setTimeout(() => {
                        pointer.style.transform = 'translateX(-50%) rotate(-14deg)';
                        setTimeout(() => { pointer.style.transform = 'translateX(-50%) rotate(10deg)'; }, 110);
                        setTimeout(() => { pointer.style.transform = 'translateX(-50%) rotate(0deg)'; }, 220);
                        badge.textContent = '당첨: ' + rcItems[targetIndex];
                        badge.style.display = 'inline-block';
                        box.querySelector('#rc-copy-img').style.visibility = 'visible';
                        rcSpinning = false;
                        rcSetControlsDisabled(false);
                    }, 5050);
                };

                const savedLunch = localStorage.getItem(RC_KEYS.lunch);
                if (savedLunch) box.querySelector('#rc-input').value = savedLunch;
                rcRebuild();
                rcSetActiveButton('lunch');

                let coinRot = 0;
                box.querySelector('#rc-flip').onclick = () => {
                    const isHeads = Math.random() < 0.5;
                    coinRot += 6 * 360 + (isHeads ? 0 : 180);
                    box.querySelector('#rc-coin').style.transform = `rotateY(${coinRot}deg)`;
                    const badge = box.querySelector('#rc-coin-result');
                    badge.style.display = 'none';
                    setTimeout(() => {
                        badge.textContent = isHeads ? '앞면' : '뒷면';
                        badge.style.background = isHeads ? '#3a2a10' : '#12233b';
                        badge.style.color = isHeads ? '#fbbf24' : '#4f8ef7';
                        badge.style.display = 'inline-block';
                    }, 2650);
                };
                
                const RC_MEMO_KEY = 'neubie_roulette_memo';
                const memoEl = box.querySelector('#rc-memo');
                const memoCountEl = box.querySelector('#rc-memo-count');
                const savedMemo = localStorage.getItem(RC_MEMO_KEY);
                if (savedMemo) {
                    memoEl.value = savedMemo;
                    memoCountEl.textContent = savedMemo.length + '/500';
                }
                memoEl.addEventListener('input', () => {
                    localStorage.setItem(RC_MEMO_KEY, memoEl.value);
                    memoCountEl.textContent = memoEl.value.length + '/500';
                });
            };

			// 그 외 페이지는 기존 대시보드
			const tipsOverlayEl = document.getElementById('neubie-tips-overlay');
			const scheduleOverlayEl = document.getElementById('neubie-schedule-overlay');
              const isAnyOpen = (dashboard.style.display === 'block' || 
              batteryPopup.style.display === 'block' ||
              (tipsOverlayEl && tipsOverlayEl.style.display === 'flex') ||
              (scheduleOverlayEl && scheduleOverlayEl.style.display === 'flex'));
			
			if (isAnyOpen) {
				closeAllPopups();
                if(scheduleOverlayEl){
				  scheduleOverlayEl.style.display='none';
				  const m = scheduleOverlayEl.querySelector('#nso-seat-modal');
				  if(m){ m.style.opacity='0'; m.style.pointerEvents='none'; }
				  const b = scheduleOverlayEl.querySelector('.schedule-box');
				  if(b) b.style.filter='';
				}
			} else {
				renderDashboard();
				dashboard.style.display = 'block';
				syncTasksFromServer();
			}
		}

        // Alt + B (배터리) 단축키
        if (e.altKey && e.code === 'KeyB') { 
            e.preventDefault(); 
            toggleBattery();
            const battBtnEl = document.getElementById('ho-batt-btn');
            if (battBtnEl) {
                const isOpen = batteryPopup.style.display === 'block';
                battBtnEl.textContent = isOpen ? '배터리 닫기' : '성남 배터리';
                battBtnEl.style.background = isOpen ? '#ef4444' : '#475569';
            }
            if (dashboard.style.display === 'block') {
                renderDashboard();
                if (window.currentMyTasks && window.currentMyTasks.length > 0) {
                    renderTaskList(window.currentMyTasks);
                }
            }
            // renderDashboard 이후에 outline 적용
            if (window._neubieBatteryCard) {
                const isOpen = batteryPopup.style.display === 'block';
                window._neubieBatteryCard.style.outline = isOpen ? '2px solid #ef4444' : 'none';
            }
        }
    });

    let lastUrl = location.href;

    // 브라우저의 뒤로가기/앞으로가기 대응 (이벤트 발생 시에만)
    window.addEventListener('popstate', () => {
        closeAllPopups();
    });

    // 화면 어디든 클릭했을 때 주소 확인
    // 뉴비고에서 메뉴를 클릭해 이동할 때 즉각 닫히게
    document.addEventListener('click', () => {
        setTimeout(() => {
            if (location.href !== lastUrl) {
                const prevUrl = lastUrl;  // ← 이전 URL 먼저 저장
                lastUrl = location.href;

                // 자동 사이드브레이크 - 이탈 감지
				const prevRobotId = getAutoSideRobotId(prevUrl);
				if (prevRobotId && AUTO_SIDE_ROBOTS[prevRobotId]) {
					triggerAutoSide(prevRobotId);
				}
				
				if (!location.href.includes('/monitoring')) {
					document.getElementById('neubie-unmonitored-panel')?.remove();
				}


                closeAllPopups();
                updateRobotContext();
                // 맵 최적화 페이지 전환 시 재적용
                const isTarget = config.targetIds.some(id => location.href.includes(`/monitoring/${id}`));
                if (isTarget && state.isMapOpt) {
                    setTimeout(() => injectMapStyle(), 1000);
                    setTimeout(() => injectMapStyle(), 3000);
                    setTimeout(() => injectMapStyle(), 6000);
                }
				
				setTimeout(() => patchDrivingPageLayout(), 1500);
                setTimeout(() => patchDrivingPageLayout(), 3000);
				setTimeout(() => patchDrivingPageLayout(), 6000);

                if (/\/driving\/\d+/.test(location.pathname)) {
                    _startOperatorWatch();
                } else {
                    _stopOperatorWatch();
                }
				if (isMonitoringPage() && localStorage.getItem('neubie_handover_enabled') !== 'false') {
					registerBitrateObserver();
				}
            }
        }, 100);
    }, true);

    // 클릭 없이 코드로만 주소가 바뀌는 경우를 대비 (간격 2초)
    setInterval(() => {
        if (location.href !== lastUrl) {
            const prevUrl = lastUrl;  // ← 이전 URL 먼저 저장
            lastUrl = location.href;

            // 자동 사이드브레이크 - 이탈 감지
			const prevRobotId = getAutoSideRobotId(prevUrl);
			if (prevRobotId && AUTO_SIDE_ROBOTS[prevRobotId]) {
				triggerAutoSide(prevRobotId);
			}

			if (!location.href.includes('/monitoring')) {
				document.getElementById('neubie-unmonitored-panel')?.remove();
			}

            closeAllPopups();
            updateRobotContext();

            // 맵 최적화 페이지 전환 시 재적용
            const isTarget = config.targetIds.some(id => location.href.includes(`/monitoring/${id}`));
            if (isTarget && state.isMapOpt) {
                setTimeout(() => injectMapStyle(), 1000);
                setTimeout(() => injectMapStyle(), 3000);
                setTimeout(() => injectMapStyle(), 6000);
            }
			
			setTimeout(() => patchDrivingPageLayout(), 1500);
            setTimeout(() => patchDrivingPageLayout(), 3000);
			setTimeout(() => patchDrivingPageLayout(), 6000);

            if (/\/driving\/\d+/.test(location.pathname)) {
                _startOperatorWatch();
            } else {
                _stopOperatorWatch();
            }
			if (isMonitoringPage() && localStorage.getItem('neubie_handover_enabled') !== 'false') {
				registerBitrateObserver();
			}
        }
    }, 2000);
    
    // ── 자동 사이드브레이크 ──
	const AUTO_SIDE_ROBOTS = {
		128: '잠실 리센츠 1호기',
		82:  '잠실 리센츠 2호기',
		156: '잠실 엘스 1호기',
		157: '잠실 엘스 2호기',
		249: '한성대 1호기',
	};

	function getAutoSideRobotId(url) {
		const robotMatch = url.match(/\/ko\/remote\/robot\/(\d+)/);
		if (robotMatch) return parseInt(robotMatch[1]);
		const params = new URLSearchParams(url.split('?')[1] || '');
		const robotId = params.get('robot-id');
		return robotId ? parseInt(robotId) : null;
	}

	function showAutoSideNotice(msg, color) {
		const existing = document.getElementById('neubie-auto-side-notice');
		if (existing) existing.remove();
		const el = document.createElement('div');
		el.id = 'neubie-auto-side-notice';
		el.style.cssText = `
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			z-index: 9999;
			background: ${color};
			color: white;
			font-size: 14px;
			font-weight: 700;
			padding: 14px 28px;
			border-radius: 12px;
			font-family: 'Pretendard', sans-serif;
			box-shadow: 0 4px 16px rgba(0,0,0,0.4);
			white-space: nowrap;
			pointer-events: none;
		`;
		el.innerText = msg;
		document.body.appendChild(el);
		setTimeout(() => el.remove(), 4000);
	}

    const _autoSideInProgress = new Set();

	async function triggerAutoSide(robotId) {
		const robotName = AUTO_SIDE_ROBOTS[robotId];

        if (_autoSideInProgress.has(robotId)) return;
		_autoSideInProgress.add(robotId);

		try {
			await new Promise(r => setTimeout(r, 2000));
			
			const res = await fetch(`https://core.neubie.ai/robots/${robotId}/`, {
                credentials: 'include',
                headers: getAuthHeaders()
            });
			const data = await res.json();
			if (data.currentScenario) { _autoSideInProgress.delete(robotId); return; }
            if (!data.robotStatus.isMovable) { _autoSideInProgress.delete(robotId); return; }

			// 5초 예고 레이아웃
			showAutoSideNotice(`5초 후 ${robotName}의 사이드 브레이크를 ON으로 변경합니다.`, 'rgba(59,130,246,0.92)');

			setTimeout(async () => {
				// 5초 후 다시 확인
				try {
					const res2 = await fetch(`https://core.neubie.ai/robots/${robotId}/`, {
                        credentials: 'include',
                        headers: getAuthHeaders()
                    });
					const data2 = await res2.json();
					if (data2.currentScenario) { _autoSideInProgress.delete(robotId); return; }
					if (!data2.robotStatus.isMovable) { _autoSideInProgress.delete(robotId); return; }

					const res3 = await fetch(`https://core.neubie.ai/robots/${robotId}/control/`, {
						method: 'PUT',
						credentials: 'include',
						headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
						body: JSON.stringify({ action: 'WAIT' })
					});
					if (res3.ok) {
						showAutoSideNotice(`✅ ${robotName} 사이드 브레이크 ON`, 'rgba(22,163,74,0.92)');
						_autoSideInProgress.delete(robotId);
					} else {
						showAutoSideNotice(`❌ ${robotName} 사이드 브레이크 명령 전송 실패`, 'rgba(220,38,38,0.92)');
						_autoSideInProgress.delete(robotId);
					}
				} catch(e) {
                    _autoSideInProgress.delete(robotId);
                    showAutoSideNotice(`❌ ${robotName} 사이드 브레이크 명령 전송 실패`, 'rgba(220,38,38,0.92)');
                }
			}, 5000);

		} catch(e) {
            _autoSideInProgress.delete(robotId);
            showAutoSideNotice(`❌ ${robotName} 사이드 브레이크 명령 전송 실패`, 'rgba(220,38,38,0.92)');
        }
	}
	
	// ── 개입 페이지 레이아웃 ──
    function patchDrivingPageLayout() {
        if (!location.href.includes('/remote/multiple/driving/')) return;

        // 헤더 flex-col 재구성
        const header = document.querySelector('header');
        if (header) {
            header.style.flexDirection = 'column';
            header.style.alignItems = 'flex-start';
            header.style.justifyContent = 'center';
            header.style.paddingTop = '2px';
            header.style.paddingBottom = '2px';
            header.style.gap = '1px';
        }

        // 상태바를 빨간뱃지 아래로 이동 (없으면 해결완료 버튼 앞 fallback)
		const redBadge = document.querySelector(
			'.rounded-8.flex.flex-row.items-center.justify-between.truncate.bg-red-50.px-8'
		);
		const statusBar = Array.from(document.querySelectorAll('div.flex.items-center.justify-between'))
			.find(el => el.textContent.includes('LTE') && !el.querySelector('.bg-red-50') && el.getBoundingClientRect().height < 60);
		const resolveBtn = Array.from(document.querySelectorAll('button'))
			.find(el => el.textContent.trim() === '해결 완료' || el.textContent.trim() === '해결완료');
		if (statusBar && redBadge) {
			redBadge.parentElement.insertBefore(statusBar, redBadge.nextSibling);
			statusBar.style.marginLeft = '';
		} else if (statusBar && resolveBtn) {
			resolveBtn.parentElement.insertBefore(statusBar, resolveBtn);
			statusBar.style.marginLeft = '-240px';
		}

        // 임무 바 높이 조정
        const missionWrapper = document.querySelector('.relative.overflow-hidden.w-full.h-58');
        if (missionWrapper) {
            missionWrapper.style.height = '64px';
            missionWrapper.style.paddingTop = '4px';
            missionWrapper.style.paddingBottom = '4px';
        }

        // 컨테이너 gap/padding 압축
        const container = document.querySelector('.flex.h-full.w-full.flex-col[class*="gap-16"][class*="pt-14"]');
        if (container) {
            container.style.gap = '6px';
            container.style.paddingTop = '6px';
        }
    }

    // 페이지 진입 시 + URL 변경 시 자동 실행 (DOM 렌더링 대기)
    setTimeout(() => patchDrivingPageLayout(), 1500);
    setTimeout(() => patchDrivingPageLayout(), 3000);
    setTimeout(() => patchDrivingPageLayout(), 6000);

	// ── 게임패드 바인딩 ──
	if (!window.neubieGamepadBound) {
	    window.neubieGamepadBound = true;
	    let dpadWasPressed = { up: false, right: false, down: false, left: false };
	
	    // 맵 헤드 방향 일치
	    const syncMap = () => {
	        const btn = document.querySelector('[data-qk="location-robot-sync-button"]');
	        if (!btn) return;
	        const opts = { bubbles: true, cancelable: true, view: window };
	        btn.dispatchEvent(new MouseEvent('mousedown', opts));
	        btn.dispatchEvent(new MouseEvent('mouseup', opts));
	        btn.dispatchEvent(new MouseEvent('click', opts));
	        setTimeout(() => {
	            btn.dispatchEvent(new MouseEvent('mousedown', opts));
	            btn.dispatchEvent(new MouseEvent('mouseup', opts));
	            btn.dispatchEvent(new MouseEvent('click', opts));
	        }, 400);
	    };
	
	    // 밝기 조절 헬퍼
	    const changeBrightness = (direction) => {
	        const wrapper = document.querySelector('[data-qk="remote-robot-cam-brightness-select-select-wrapper"]')
	                     || document.querySelector('[data-qk="driving-robot-cam-brightness-select-select-wrapper"]');
	        const input = document.querySelector('[data-qk="remote-robot-cam-brightness-select"]')
	                   || document.querySelector('[data-qk="driving-robot-cam-brightness-select"]');
	        wrapper?.click();
	        setTimeout(() => {
	            const options = [...document.querySelectorAll(
	                '[data-qk="remote-robot-cam-brightness-select-option"], [data-qk="driving-robot-cam-brightness-select-option"]'
	            )];
	            const currentVal = parseFloat(input?.value || '1');
	            const currentIdx = options.findIndex(o => parseFloat(o.textContent.replace('밝기 ', '')) === currentVal);
	            const nextIdx = direction === 'up'
	                ? Math.min(currentIdx + 1, options.length - 1)
	                : Math.max(currentIdx - 1, 0);
	            options[nextIdx]?.click();
	            syncMap(); // ← 밝기 조절 후 맵 재동기화
	        }, 150);
	    };
	
	    setInterval(() => {
			if(localStorage.getItem('neubie_dpad_binding')==='off') return;
	        const gp = navigator.getGamepads()[0];
	        if (!gp) return;
	        const isDrivingPage = location.href.includes('/remote/multiple/driving/')
	                           || location.href.includes('/remote/robot/');
	        if (!isDrivingPage) return;
	        const padOnBtn = document.querySelector('[data-qk="remote-robot-controller-game-pad-segmented-control-ON"]')
	                      || document.querySelector('[data-qk="remote-robot-game-pad-segmented-control-ON"]');
	        const isGamepadOn = padOnBtn?.classList.contains('bg-white');
	        if (!isGamepadOn) {
	            dpadWasPressed = { up: false, right: false, down: false, left: false };
	            return;
	        }
	
	        // D-pad up (12) — 다음 개입 요청 받기 토글 + 맵 재동기화
	        const upBtn = gp.buttons[12];
	        if (upBtn?.pressed && !dpadWasPressed.up) {
	            dpadWasPressed.up = true;
	            const el = document.querySelector('[data-qk="auto-intervention-change-switch"]');
	            el?.querySelector('label')?.click() || el?.click();
	            syncMap();
	        } else if (!upBtn?.pressed) {
	            dpadWasPressed.up = false;
	        }
	
	        // D-pad right (15) — 밝기 올리기 + 맵 재동기화
	        const rightBtn = gp.buttons[15];
	        if (rightBtn?.pressed && !dpadWasPressed.right) {
	            dpadWasPressed.right = true;
	            changeBrightness('up');
	        } else if (!rightBtn?.pressed) {
	            dpadWasPressed.right = false;
	        }
	
	        // D-pad down (13) — 자동 긴급 정지 토글 + 맵 재동기화
	        const downBtn = gp.buttons[13];
	        if (downBtn?.pressed && !dpadWasPressed.down) {
	            dpadWasPressed.down = true;
	            const el = document.querySelector('[data-qk="remote-robot-cam-adas-switch"]')
	                    || document.querySelector('[data-qk="driving-robot-cam-adas-switch"]');
	            el?.querySelector('label')?.click();
	            syncMap();
	        } else if (!downBtn?.pressed) {
	            dpadWasPressed.down = false;
	        }
	
	        // D-pad left (14) — 밝기 내리기 + 맵 재동기화
	        const leftBtn = gp.buttons[14];
	        if (leftBtn?.pressed && !dpadWasPressed.left) {
	            dpadWasPressed.left = true;
	            changeBrightness('down');
	        } else if (!leftBtn?.pressed) {
	            dpadWasPressed.left = false;
	        }
	
	    }, 100);
	}

    injectConfigUI();
    
    if (localStorage.getItem('neubie_user_name')) {
        syncTasksFromServer();
    }

    let lastNotifiedMin = -1; 

    setInterval(() => {
        const now = new Date();
        const currentFullMin = now.getHours() * 60 + now.getMinutes();

        if (lastNotifiedMin === currentFullMin) return;

        lastNotifiedMin = currentFullMin; 
        syncTasksFromServer(); 
        
    }, 1000);

})();
