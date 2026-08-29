(function() {
    'use strict';

    if (window.neubieEngineLoaded) return;
    window.neubieEngineLoaded = true;

	// ── Paperlogy 폰트 ──
    (function loadPaperlogyFont() {
        if (document.getElementById('neubie-paperlogy-font')) return;
        const link = document.createElement('link');
        link.id = 'neubie-paperlogy-font';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'https://cdn.jsdelivr.net/gh/fonts-archive/Paperlogy/subsets/Paperlogy-dynamic-subset.css';
        document.head.appendChild(link);
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

    // 오프라인 모드 — true로 바꾸면 이 도구의 NCC 외부 통신이 즉시 차단됩니다.
    const OFFLINE_MODE = false;

    const NB_THEMES = {
        light: { bg: '#ece5d4', card: '#f7f2e6', border: '#d9cdb0', text: '#2b2418', accent: '#1e3a5f', purple: '#7c3aed' },
        dark:  { bg: '#111111', card: '#252525', border: '#333333', text: '#e2e8f0', accent: '#3b82f6', purple: '#c4b5fd' }
    };

    function getNbTheme() {
        return NB_THEMES[localStorage.getItem('neubie_theme') || 'dark'];
    }

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
        "168": { site: "서산 뜨레 바베큐", unit: "#145" }, // 서산 뜨레 바베큐
		"173": { site: "자연스런캠핑장 1호기", unit: "#153" }, // 자연스런 1호기
		"262": { site: "자연스런캠핑장 2호기", unit: "#235" }, // 자연스런 2호기
    };

    // "/monitoring/56"이 "/monitoring/560"에도 부분매칭되는 걸 방지 — 숫자를 정확히 추출해서 완전일치로 비교
    function isTargetMonitoringUrl(url) {
        const m = url && url.match(/\/monitoring\/(\d+)/);
        return !!(m && config.targetIds.includes(m[1]));
    }
    const isAutoTarget = isTargetMonitoringUrl(currUrl);
    // 수동 토글(localStorage) 값은 그대로 존중하고, "현재 사이트가 대상인지"만 매번 새로 계산하는 헬퍼
    function computeIsMapOpt() {
        return localStorage.getItem('neubie_opt_map') === 'true' || isTargetMonitoringUrl(location.href);
    }
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
	
	async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } finally {
            clearTimeout(timer);
        }
    }
	
	async function fetchAllRobotsForHandover() {
        const res = await fetchWithTimeout('https://core.neubie.ai/robots/?limit=200', {   // ← fetch → fetchWithTimeout
            credentials: 'include',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`robots fetch failed: ${res.status}`);
        const data = await res.json();
        let all = data.results;
        let next = data.next;
        let guard = 0;
        while (next && guard < 10) {
            const r2 = await fetchWithTimeout(next, { credentials: 'include', headers: getAuthHeaders() });   // ← fetch → fetchWithTimeout
            if (!r2.ok) break;
            const d2 = await r2.json();
            all = all.concat(d2.results);
            next = d2.next;
            guard++;
        }
        return all;
    }

    function showHandoverToast(message, type) {
        const existing = document.getElementById('neubie-ho-toast');
        if (existing) existing.remove();

        const colors = {
            progress: { bg: '#1e293b', text: '#e2e8f0' },
            success:  { bg: '#166534', text: '#ffffff' },
            fail:     { bg: '#7f1d1d', text: '#ffffff' },
        };
        const c = colors[type] || colors.progress;

        const el = document.createElement('div');
        el.id = 'neubie-ho-toast';
        el.textContent = message;
        el.style.cssText = `
            position:fixed; top:12px; left:50%; transform:translateX(-50%);
            background:${c.bg}; color:${c.text};
            padding:8px 18px; border-radius:10px;
            font-size:13px; font-weight:700;
            z-index:99999999; pointer-events:none;
            box-shadow:0 4px 16px rgba(0,0,0,.4);
            transition:opacity .3s ease;
        `;
        document.body.appendChild(el);

        if (type !== 'progress') {
            setTimeout(() => {
                el.style.opacity = '0';
                setTimeout(() => el.remove(), 300);
            }, 3000);
        }
    }

    function getKSTDate() {
        const utcMs = Date.now() + (new Date().getTimezoneOffset() * 60000);
        return new Date(utcMs + 9 * 60 * 60000);
    }
    function getKSTMinutes() {
        return getKSTDate().getMinutes();
    }
    function isScheduledMonitorNow(myName) {
        if (!myName || !state.insuData || !state.insuData.schedule) return false;
        const hourKey = `${String(getKSTDate().getHours()).padStart(2, '0')}:00`;
        return state.insuData.schedule[hourKey] === myName;
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
        // 오프라인 모드: NCC(core.neubie.ai) API 호출만 차단. 본인 인프라(Vercel/GitHub)는 그대로 통과.
        if (OFFLINE_MODE && url && url.includes('core.neubie.ai')) {
            throw new Error('오프라인 모드: NCC API 요청이 차단되었습니다.');
        }
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
        const currentUrl = window.location.href;
        const isCurrentTarget = isTargetMonitoringUrl(currentUrl);
        let style = document.getElementById('neubie-map-opt-style');

        // 타겟 사이트가 아니거나 최적화가 꺼져있으면, 이전에 켜져 있던 스타일을 확실히 비워서 해제
        if (!isCurrentTarget || !state.isMapOpt) {
            if (style) style.textContent = "";
            return;
        }

        if (!style) {
            style = document.createElement('style');
            style.id = 'neubie-map-opt-style';
            document.head.appendChild(style);
        }

        style.textContent = `
            /* [1] 노드(Path 점) 제거: 렌더링 부하의 주범 차단 */
            [data-qk^="node-marker"],
            gmp-advanced-marker:has([data-qk^="node-marker"]) {
                display: none !important;
            }

            /* [1-1] data-qk가 아예 없는 마커(대부분 경로 위 흰 점) 제거.
               기체/대기장소/스테이션은 모두 data-qk를 갖고 있으므로 이 규칙에 걸리지 않음.
               미니맵은 아래 [3]에서 이 규칙보다 나중에(우선순위 높게) 다시 보존시킴. */
            gmp-advanced-marker:not(:has([data-qk])) {
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

            /* [3] 기체·스테이션·미니맵 마커 절대 보존 */
            gmp-advanced-marker:has([data-qk*="robot"]),
            gmp-advanced-marker:has([data-qk*="station-marker"]),
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

    // 기체 트래킹 로직 (/new 대응)
    function updateRobotContext() {
	    const path = window.location.href;
	    if (NEUBIE_HOSTS.some(h => path.includes(`${h}/ko/remote/robot/`))) {
	        const idMatch = path.match(/\/ko\/remote\/robot\/(\d+)/);
	        const robotNum = idMatch ? idMatch[1] : null;
	        if (robotNum && ROBOT_MAP[robotNum]) {
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

            #neubie-dashboard, #neubie-dashboard *,
            #neubie-battery-popup, #neubie-battery-popup *,
            #neubie-board-overlay, #neubie-board-overlay *,
            #neubie-secret-overlay, #neubie-secret-overlay *,
            #neubie-schedule-overlay, #neubie-schedule-overlay *,
            #neubie-shared-popup, #neubie-shared-popup * {
                font-family: 'Paperlogy', 'Pretendard', 'Noto Sans KR', sans-serif !important;
            }

            #nso-seat-grid, #nso-seat-grid * {
                font-family: 'Pretendard', 'Noto Sans KR', sans-serif !important;
            }
        `;
        document.head.appendChild(st);
    })();
	
    const batteryPopup = createContainer('neubie-battery-popup', '400px', '20px', 'auto', '20px');

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
            targetEl.style.bottom = 'auto';

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
        const T = getNbTheme();
        batteryPopup.style.backgroundColor = T.bg;
        batteryPopup.style.backgroundImage = `linear-gradient(${T.bg}, ${T.bg}), linear-gradient(135deg, #6366f1, #ec4899)`;
        batteryPopup.style.color = T.text;

        batteryPopup.innerHTML = '';
        const header = document.createElement('div');
        header.style.cssText = `display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid ${T.border}; padding-bottom:10px;`;
        const titleB = document.createElement('b');
        titleB.textContent = "🔋 실시간 성남 배터리";
        titleB.style.cssText = `color:${T.text}; font-size:18px;`;

        const headerRight = document.createElement('div');
        headerRight.style.cssText = `display:flex; align-items:center; gap:8px;`;

        const copyBtn = document.createElement('button');
        copyBtn.textContent = '복사';
        Object.assign(copyBtn.style, {
            background:'#3b82f6', color:'white', border:'none',
            height:'24px', padding:'0 14px',
            borderRadius:'6px', cursor:'pointer', fontWeight:'bold',
            fontSize:'13px',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'0.2s'
        });
        copyBtn.onclick = (e) => copyToClipboard(e.target);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `background:#ef4444; color:white; border:none; border-radius:4px; width:22px; height:22px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; font-size:14px;`;
        closeBtn.onclick = () => toggleBattery();

        headerRight.append(copyBtn, closeBtn);
        header.append(titleB, headerRight);
        batteryPopup.appendChild(header);
        makeDraggable(header, batteryPopup);

        const list = document.createElement('div');
        list.id = 'neubie-battery-list';
        batteryPopup.appendChild(list);

        config.batteryIds.forEach((c) => {
            const item = document.createElement('div');
            item.dataset.batteryId = c.id;
            item.style.cssText = `
                background:${T.bg === '#111111' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'};
                padding:6px 16px;
                border-radius:10px;
                margin-bottom:6px;
                border-left:5px solid #666;
                font-size: 16px !important;
            `;
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-weight:500;" class="bat-name">⚪ ${c.name}</span>
                    <span style="font-weight:bold; font-size: 16px;" class="bat-val">- %</span>
                </div>
                <div class="bat-bar-track" style="width:100%; height:6px; background:${T.bg === '#111111' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}; border-radius:3px; overflow:hidden;">
                    <div class="bat-bar-fill" style="height:100%; width:0%; background:#666; border-radius:3px; transition:width 0.3s ease, background 0.3s ease;"></div>
                </div>
            `;
            list.appendChild(item);
        });
        _batteryInitialized = true;
    }

    let _batteryFetching = false;
    let _lastBatteryFetchAt = 0;
    const BATTERY_REFRESH_MS = 2 * 60 * 1000;   // 2분: 이 안에 다시 열어도 새로 요청 안 함
    async function updateBatteryStatus() {
        if (batteryPopup.dataset.dragging === 'true') return;
        if (_batteryFetching) return;

        if (!_batteryInitialized || !batteryPopup.querySelector('#neubie-battery-list')) {
            buildBatteryShell();
        }

        // 마지막으로 실제 조회한 지 2분이 안 지났으면, 서버 요청 없이 기존 값 그대로 둠
        if (_lastBatteryFetchAt && (Date.now() - _lastBatteryFetchAt) < BATTERY_REFRESH_MS) return;

        _batteryFetching = true;
        try {
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

                let batteryVal = "- %", statusText = "OFF", accentColor = "#666", statusIcon = "⚪", batteryPct = 0;

                if (raw && rs.isConnecting) {
                    const battery = Math.round(raw.battery ?? rs.battery ?? 0);
                    batteryVal = `${battery}%`;
                    batteryPct = Math.min(100, Math.max(0, battery));

                    if (rs.isCharging || rs.isWirelessChargerConnected) {
                        accentColor = "#22c55e"; statusIcon = "🟢"; statusText = "충전 중";
                    } else if (raw.currentScenario) {
                        accentColor = "#3b82f6"; statusIcon = "🔵"; statusText = "순찰 중";
                    } else {
                        accentColor = "#888888"; statusIcon = "⚪"; statusText = "대기 중";
                    }

                    // 배터리 잔량 자체가 낮으면(20% 이하) 충전/순찰 여부와 무관하게 경고색으로 강조
                    if (battery <= 20 && !(rs.isCharging || rs.isWirelessChargerConnected)) {
                        accentColor = "#ef4444";
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

                    const fillEl = item.querySelector('.bat-bar-fill');
                    if (fillEl) {
                        fillEl.style.width = `${batteryPct}%`;
                        fillEl.style.background = accentColor;
                    }
                }
            });

            _lastBatteryFetchAt = Date.now();
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
        
        // 다중 모니터링은 10분 일찍 오도록 계산
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
        // notifType 체크 제거 — 항상 Type1(점멸)만 실행
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
            position:fixed; top:16px; left:50%; transform:translateX(-50%);
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
    }

    /* ============================================================
    SECTION 4-3. UI 렌더링 및 07시 기준 정렬/알림 제어
   ============================================================ */
    function renderTaskList(tasks) {
        const T = getNbTheme();
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
                : `color: ${T.text};`;
            
            item.style.cssText = `
                background:${status.isExpired ? 'rgba(60, 60, 60, 0.1)' : (isMon ? 'rgba(59, 130, 246, 0.15)' : 'rgba(251, 191, 36, 0.15)')};
                border-left:4px solid ${status.isExpired ? '#555' : (isMon ? '#3b82f6' : '#fbbf24')};
                padding:10px; border-radius:8px; margin-bottom:8px; font-size:16px; transition: 0.3s;
                display: grid;
                grid-template-columns: auto 1fr auto;
                align-items: center;
                gap: 6px;
                overflow: hidden;
                height: 39px;
                box-sizing: border-box;
            `;

            const displayTime = (String(timeKey).length > 10) ? String(timeKey).match(/\d{2}:\d{2}/)?.[0] : timeKey;

            const isLong = t.content.length > 40;
            const contentSpan = isLong
                ? `<span style="${textStyle} font-size:12px; line-height:1.15; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${t.content}</span>`
                : `<span style="${textStyle} font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.content}</span>`;

            item.innerHTML = `
                <span style="color:${status.isExpired ? '#777' : '#fbbf24'}; white-space:nowrap;">${displayTime || ''}</span>
                <div style="font-weight:500; min-width:0; overflow:hidden;">
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
        const T = getNbTheme();
        const card = document.createElement('div');
        card.id = 'namingSection';
        card.style.cssText = `
            padding:10px 15px; border-radius:15px; margin-top:5px; border:1px solid transparent;
            background-image: linear-gradient(${T.card}, ${T.card}), linear-gradient(135deg, #6366f1, #ec4899);
            background-origin: border-box; background-clip: padding-box, border-box;
            box-shadow:0 0 5px rgba(150,120,255,0.25);
        `;

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

        // ── 부산 국립과학관 배송/순찰 띠띠 설정 ──
        const TTIDDI_CONFIG = {
            site: '부산 국립과학관',
            units: { delivery: '#171', patrol: '#170' },  
            deliveryActive: true   // ← 배송 띠띠 기체 입고 중이면 false, 복귀하면 true로 한 글자만 바꾸면 끝
        };

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="color:${T.accent}; font-weight:bold; font-size:18px;">🏷️ 영상 파일명 생성기</span>
                <button id="openDriveTodayBtn" style="background:#444; color:#ddd; border:1px solid #666; padding:4px 8px; border-radius:6px; font-size:13px; cursor:pointer; white-space:nowrap;">📂 금일 구글 드라이브</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px 5px; margin-bottom: 10px;">
                <div style="position: relative; min-width: 0;">
                    <select id="robotSelector" style="width: 100%; background: #333; color: white; border: 1px solid #555; border-radius: 4px; font-size: 15px; padding: 0 20px 0 8px; height: 32px; line-height: 32px; box-sizing: border-box; appearance: none; -webkit-appearance: none; -moz-appearance: none;">
                        ${dropdownOptions || '<option>최근 배달 기체 미감지</option>'}
                    </select>
                    <span style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #aaa; font-size: 11px;">▾</span>
                </div>
                <div style="display: flex; gap: 5px; min-width: 0;">
                    <input type="text" id="taskInput" placeholder="주문번호를 붙여넣으세요." style="flex: 1; min-width: 0; background: #333; color: white; border: 1px solid #555; padding: 0 8px; border-radius: 4px; font-size: 15px; height: 32px; line-height: 32px; box-sizing: border-box;">
                    <button id="copyFileName" style="width: 70px; flex-shrink: 0; background: #007bff; color: white; border: none; padding: 0 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 15px; white-space: nowrap; overflow: hidden; height: 32px; line-height: 32px; box-sizing: border-box;">복사</button>
                </div>
                <button id="btnMulti" class="sub-btn">다중 모니터링</button>
                <button id="btnCombined" class="sub-btn">배송/순찰 띠띠</button>
            </div>
        `;

        if (!document.getElementById('naming-btn-style')) {
            const style = document.createElement('style');
            style.id = 'naming-btn-style';
            style.textContent = `.sub-btn { background: #444; color: #ddd; border: 1px solid #666; padding: 6px 4px; border-radius: 6px; font-size: 15px; cursor: pointer; flex: 1; min-width: 0; transition: 0.2s; } .sub-btn:hover { background: #555; border-color: #888; }`;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            // 배송 띠띠 활성 여부에 따라 버튼 라벨 갱신 (신규 추가)
            const combinedBtnLabel = card.querySelector('#btnCombined');
            if (combinedBtnLabel) {
                combinedBtnLabel.textContent = TTIDDI_CONFIG.deliveryActive ? '배송/순찰 띠띠' : '순찰 띠띠 (배송 띠띠 입고)';
            }

			// 영상 드라이브 열기 → 오늘 날짜 폴더로 이동 (없으면 루트 폴더로 폴백)
            const openDriveBtn = card.querySelector('#openDriveTodayBtn');
            if (openDriveBtn) {
                openDriveBtn.onclick = async () => {
                    const ROOT_FOLDER_URL = 'https://drive.google.com/drive/folders/0AJPzAP1RZ6FhUk9PVA';
                    const todayStr = getFormattedDate(new Date()); // 예: "20260721"

                    let targetUrl = ROOT_FOLDER_URL;

                    try {
                        const res = await fetch('https://multimonitoring.vercel.app/api/drive');
                        const data = await res.json();
                        if (data?.folders?.[todayStr]) {
                            targetUrl = data.folders[todayStr];
                        } else if (data?.root) {
                            targetUrl = data.root; // 오늘자 폴더 없으면 루트로 폴백
                        }
                    } catch (e) {
                        console.warn('[영상 드라이브] 폴더 정보 조회 실패 → 루트로 이동:', e);
                    }

                    window.open(targetUrl, '_blank');
                };
            }
			
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
				const unitsText = TTIDDI_CONFIG.deliveryActive
					? `${TTIDDI_CONFIG.units.delivery}, ${TTIDDI_CONFIG.units.patrol}`
					: TTIDDI_CONFIG.units.patrol;
				const finalName = `${getFormattedDate(time)}_${getFormattedHour(time)}_${TTIDDI_CONFIG.site}_${unitsText}${myName ? '_' + myName : ''}`;
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
        const T = getNbTheme();
        dashboard.style.backgroundColor = T.bg;
        dashboard.style.color = T.text;
        dashboard.style.backgroundImage = `linear-gradient(${T.bg}, ${T.bg}), linear-gradient(135deg, #6366f1, #ec4899)`;
        
        // 헤더 컨테이너 (제목 + 성명 입력창 + X 버튼 인라인 배치)
        const headerContainer = document.createElement('div');
        headerContainer.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-right:5px;";

        const title = document.createElement('h2');
        title.textContent = OFFLINE_MODE ? "오프라인 모드" : "NCC 도우미";
        title.style.cssText = `color:${T.accent}; font-size:20px; margin:0; font-weight:bold; white-space:nowrap;`;

        // ── 패치노트 NEW 뱃지 제어 ──────────────────────────────────
		// 문자열을 넣으면 패치노트에 빨간 '`' 뱃지가 점멸하며 뜸.
		// 빈 문자열('')로 비우면 뱃지가 사라짐.
		const PATCH_NOTE_NEW_CONTENT = '모달 우측 고정 및 삭제 기체명 표기';
		
        const patchBtn = document.createElement('button');
        patchBtn.textContent = '패치노트';
        patchBtn.title = '패치노트';
        patchBtn.style.cssText = `
			position:relative;
            background:transparent; border:1px solid ${T.border}; color:${T.text};
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
        patchBtn.onmouseleave = () => { patchBtn.style.borderColor=T.border; patchBtn.style.color=T.text; };
        patchBtn.onclick = () => {
            // 이미 열려있으면(패치노트 버튼 재클릭) 닫기만 하고 종료 — X버튼 없이도 닫는 방법
            if (isSharedPopupOpen('patch')) {
                hideSharedPopup();
                return;
            }

            const patchBox = document.createElement('div');
            patchBox.style.cssText = `
                background:${T.card}; color:${T.text}; border-radius:18px; pointer-events:auto;
                border:1.5px solid ${T.accent}; padding:28px 32px 24px 32px;
                width:100%; box-sizing:border-box; max-height:70vh; overflow-y:auto;
                position:relative; box-shadow:0 10px 50px rgba(0,0,0,0.7);
            `;
            const patchTitle = document.createElement('div');
            patchTitle.textContent = '패치노트';
            patchTitle.style.cssText = `font-size:20px; font-weight:bold; margin-bottom:20px; color:${T.accent};`;
            const patchClose = document.createElement('button');
            patchClose.textContent = '✕';
            patchClose.style.cssText = `
                position:absolute; top:16px; right:18px;
                background:transparent; border:none; color:#aaa;
                font-size:20px; cursor:pointer; padding:4px 8px; border-radius:6px;
            `;
            patchClose.onmouseenter = () => { patchClose.style.color='#fff'; };
            patchClose.onmouseleave = () => { patchClose.style.color='#aaa'; };
            patchClose.onclick = () => hideSharedPopup();

            // ── 패치노트 내용 ──────────────────────────────────────
            // 아래 patchItems 배열에 버전별 내용을 추가하세요
            const patchItems = [
                {
                    version: 'v1.4',
                    date: '2026-08-29',
                    items: [
						'다중 관제 휴지통 레이아웃에 삭제 중인 기체명 표기',
						'다중 관제 시 모니터링 생성 모달 우측 고정',
						'맵 최적화 속도 개선(Dot 제거, 비타겟 site 이동 반영)',
						'다음 개입 요청 자동 OFF',
                        '문제해결 페이지',
						'스트림덱 스타일 적용(길게 누르면 기능 ON/OFF됨)',
						'임무 종료된 리센츠/엘스/한성대/진천 페이지 이탈 5초 후 자동 사이드',
                        '게임패드 D-PAD 설명 / 게임패드 테스터',
						'다중 자동 교대시작 최대 12대까지',
                    ]
                },
            ];
            // ────────────────────────────────────────────────────────

            const patchContent = document.createElement('div');
            patchContent.style.cssText = "display:grid; gap:16px;";
            patchItems.forEach(patch => {
                const section = document.createElement('div');
                section.style.cssText = `background:${T.card}; border:1px solid ${T.border}; border-radius:12px; padding:14px 16px;`;
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
                    li.style.cssText = `font-size:13px; color:${T.text}; line-height:1.5;`;
                    itemList.appendChild(li);
                });
                section.appendChild(versionRow);
                section.appendChild(itemList);
                patchContent.appendChild(section);
            });

            patchBox.appendChild(patchClose);
            patchBox.appendChild(patchTitle);
            patchBox.appendChild(patchContent);
            weatherCard.style.outline = 'none';
            rouletteCard.style.outline = 'none';
            showSharedPopup('patch', patchBox);
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
        
        // 게시판 / 게임패드는 더 이상 헤더 탭이 아니라 아래 스트림덱 그리드의 타일로 들어감
        const boardBtn = document.createElement('button');
        boardBtn.style.cssText = `
            position:relative; overflow:hidden; aspect-ratio:2.0/1; border-radius:10px; cursor:pointer;
            display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
            padding:4px; box-sizing:border-box; background:${T.card}; border:1px solid #60a5fa;
            box-shadow:0 0 6px rgba(96,165,250,0.35), inset 0 0 8px rgba(96,165,250,0.1);
            transition:box-shadow 0.15s;
        `;
        boardBtn.innerHTML = `
            <span style="font-size:18px; margin-top:6px;">📌</span>
            <span style="font-size:14px; font-weight:500; white-space:nowrap; text-align:center; color:${T.text};">게시판</span>
        `;
        boardBtn.onclick = () => openBoardOverlay();
        attachStaticNeonHover(boardBtn, '96,165,250');

        const gamepadBtn = document.createElement('button');
        gamepadBtn.style.cssText = `
            position:relative; overflow:hidden; aspect-ratio:2.0/1; border-radius:10px; cursor:pointer;
            display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
            padding:4px; box-sizing:border-box;
        `;
        gamepadBtn.innerHTML = `
            <div style="position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:6px;">
                <span style="font-size:18px;">🎮</span>
                <span class="nb-onoff" style="font-size:12px; font-weight:bold; letter-spacing:0.5px;"></span>
            </div>
            <span style="position:relative; z-index:1; font-size:14px; font-weight:500; white-space:nowrap; text-align:center; color:${T.text};">패드 기능 & 테스터</span>
        `;
        const gamepadLabel = gamepadBtn.querySelector('.nb-onoff');
        gamepadLabel.textContent = isDpadBindingOff() ? 'OFF' : 'ON';
        paintToggleTile(gamepadBtn, !isDpadBindingOff(), T);
        attachNeonHover(gamepadBtn, () => !isDpadBindingOff());
        // 게임패드 가이드 오버레이(#gp-toggle)에서 토글해도 이 타일이 즉시 반영되도록 전역 sync 함수 노출
        window.syncGamepadTile = () => {
            gamepadLabel.textContent = isDpadBindingOff() ? 'OFF' : 'ON';
            paintToggleTile(gamepadBtn, !isDpadBindingOff(), T);
        };
        attachHoldToggle(gamepadBtn, {
            onShortClick: () => {
                if (window.isSharedPopupOpen && window.isSharedPopupOpen('gamepad-menu')) {
                    window.hideSharedPopup();
                } else {
                    openGamepadMenuOverlay();
                }
            },
            onHold: () => {
                localStorage.setItem('neubie_dpad_binding', isDpadBindingOff() ? 'on' : 'off');
                window.syncGamepadTile();
            },
        });

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
        taskCard.style.cssText = `
            padding:15px; border-radius:15px; border:1px solid transparent;
            background-image: linear-gradient(${T.card}, ${T.card}), linear-gradient(135deg, #6366f1, #ec4899);
            background-origin: border-box; background-clip: padding-box, border-box;
            box-shadow:0 0 5px rgba(150,120,255,0.25);
        `;
        const storedName = localStorage.getItem('neubie_user_name') || "사용자";
        const currentInt = localStorage.getItem('neubie_remind_int') || '0';
        taskCard.innerHTML = `
            <div style="margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px; flex-wrap:nowrap;">
                    <div style="font-weight:bold; font-size:17px; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📋 ${storedName}의 일일 업무</div>
                    <select id="remind-inline" style="background:#333; color:white; border:1px solid #555; font-size:13px; border-radius:4px; padding:2px;">
                        <option value="0" ${currentInt === '0' ? 'selected' : ''}>알림 없음</option>
                        <option value="3" ${currentInt === '3' ? 'selected' : ''}>3분 전</option>
                        <option value="5" ${currentInt === '5' ? 'selected' : ''}>5분 전</option>
                    </select>
                </div>
            </div>
        `;

        const taskInline = document.createElement('div');
        taskInline.id = 'inline-task-container';
        taskCard.appendChild(taskInline);
        list.appendChild(taskCard);

		// 스트림덱 스타일 홀드 토글: 짧게 클릭 = 기존 설명 동작, 2초 홀드(좌→우 채움) = ON/OFF 토글
        function attachHoldToggle(btn, { onHold, onShortClick }) {
            const HOLD_MS = 1500;
            const SHORT_CLICK_MS = 300; // 이 시간 안에 뗐을 때만 '짧은 클릭'으로 인정
            btn.style.position = 'relative';
            btn.style.overflow = 'hidden';

            const fill = document.createElement('div');
            fill.style.cssText = `
                position:absolute; top:0; left:0; height:100%; width:0%;
                background:rgba(245,158,11,0.55); border-right:2px solid rgba(245,158,11,0.9); pointer-events:none; z-index:0;
            `;
            btn.insertBefore(fill, btn.firstChild);

            let holdTimer = null, fired = false, pressStart = 0;

            const startHold = (e) => {
                e.preventDefault();
                fired = false;
                pressStart = Date.now();
                fill.style.transition = 'none';
                fill.style.width = '0%';
                requestAnimationFrame(() => {
                    fill.style.transition = `width ${HOLD_MS}ms linear`;
                    fill.style.width = '100%'; // 좌 → 우로 채워짐
                });
                holdTimer = setTimeout(() => {
                    fired = true;
                    onHold();
                    fill.style.transition = 'none';
                    fill.style.width = '0%';
                }, HOLD_MS);
            };
            const cancelHold = () => {
                clearTimeout(holdTimer);
                fill.style.transition = 'width 0.15s ease-out';
                fill.style.width = '0%';
            };

            btn.addEventListener('mousedown', startHold);
            btn.addEventListener('mouseup', () => {
                const wasFired = fired;
                const heldMs = Date.now() - pressStart;
                cancelHold();
                // 완주(wasFired)도 아니고, 빠른 탭(SHORT_CLICK_MS 이내)도 아니면 — 홀드하다 만 것이므로 아무 것도 하지 않음
                if (!wasFired && heldMs < SHORT_CLICK_MS) onShortClick?.();
            });
            btn.addEventListener('mouseleave', cancelHold);
        }

        // ON/OFF 상태에 맞춰 버튼 색(다크/라이트 대응) 칠하기
        function paintToggleTile(btn, isOn, T) {
            const isDark = T.bg === '#111111';
            btn.style.background = isOn
                ? (isDark ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.15)')
                : (isDark ? '#3a3a3a' : '#e2e2e2');
            btn.style.border = `1px solid ${isOn ? '#22c55e' : (isDark ? '#666' : '#999')}`;
            btn.style.color = isOn ? '#22c55e' : (isDark ? '#bbb' : '#555');
            btn.style.borderRadius = '6px';
            btn.style.boxShadow = isOn
                ? '0 0 6px rgba(34,197,94,0.4), inset 0 0 8px rgba(34,197,94,0.12)'
                : '0 0 4px rgba(255,255,255,0.12)';
            btn.style.transition = 'box-shadow 0.15s, border-color 0.15s';
        }

        // 호버 시 뚜렷한 네온 효과 (ON=초록 글로우, OFF=중립 글로우) — 평상시 은은한 글로우는 유지, 호버 시에만 확 밝아짐
        function attachNeonHover(btn, getIsOn) {
            const baseShadow = (on) => on
                ? '0 0 6px rgba(34,197,94,0.4), inset 0 0 8px rgba(34,197,94,0.12)'
                : '0 0 4px rgba(255,255,255,0.12)';
            const hoverShadow = (on) => on
                ? '0 0 18px 2px rgba(34,197,94,0.95), 0 0 5px rgba(34,197,94,0.8), inset 0 0 10px rgba(34,197,94,0.3)'
                : '0 0 16px 2px rgba(226,232,240,0.8), inset 0 0 8px rgba(226,232,240,0.2)';
            btn.onmouseenter = () => { btn.style.boxShadow = hoverShadow(getIsOn()); };
            btn.onmouseleave = () => { btn.style.boxShadow = baseShadow(getIsOn()); };
        }

        // ON/OFF가 없는 일반 타일용 — 고정 색상 네온 호버 (rgb 트리플렛만 전달, 예: '52,209,88')
        function attachStaticNeonHover(el, rgb) {
            const base = `0 0 6px rgba(${rgb},0.35), inset 0 0 8px rgba(${rgb},0.1)`;
            const hover = `0 0 18px 2px rgba(${rgb},0.95), 0 0 5px rgba(${rgb},0.8), inset 0 0 10px rgba(${rgb},0.3)`;
            el.onmouseenter = () => { el.style.boxShadow = hover; };
            el.onmouseleave = () => { el.style.boxShadow = base; };
        }

        // 맵최적화/다중모니터링/레이아웃색상/날씨&기타/패치노트 팝업을 '일일 업무 카드(taskCard) 바닥' 기준으로
        // 스트림덱 타일(bottomRow) 위쪽 틈에만 앉히기 위한 영역 계산 — 스트림덱 버튼을 절대 가리지 않음
        // ── 스트림덱 위 팝업들의 '공유 창' 시스템 ──────────────────────────────
        // 맵최적화/다중모니터링/레이아웃색상/날씨&기타/패치노트 — 이 5개는 모두
        // 하나의 오버레이(#neubie-shared-popup)를 공유한다. 즉 다른 트리거를 누르면
        // 새 창이 또 뜨는 게 아니라, 이미 떠있는 창의 '내용물만' 교체된다.
        // 폭은 메인 대시보드(dashboard) 폭에 맞추고, 높이는 내용에 따라 자동.
        // 위치는 스트림덱 상단에서 POPUP_GAP만큼 살짝 띄워서 붙인다(버튼과 완전히 안 붙게).
        const POPUP_GAP = 14;

        function getSharedPopupRect() {
            const d = dashboard.getBoundingClientRect();
            const t = bottomRow.getBoundingClientRect();
            return { left: d.left, width: d.width, bottom: (window.innerHeight - t.top) + POPUP_GAP };
        }

        function showSharedPopup(key, boxEl) {
            let overlay = document.getElementById('neubie-shared-popup');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'neubie-shared-popup';
                overlay.style.cssText = `
                    position:fixed; z-index:2147483646; background:transparent; pointer-events:none;
                    display:flex; align-items:flex-end; justify-content:center;
                    font-family:Pretendard, sans-serif;
                `;
                document.body.appendChild(overlay);
            }
            overlay.dataset.key = key;
            overlay.innerHTML = '';
            overlay.appendChild(boxEl);
            const r = getSharedPopupRect();
            overlay.style.top = 'auto';
            overlay.style.left = r.left + 'px';
            overlay.style.width = r.width + 'px';
            overlay.style.bottom = r.bottom + 'px';
            overlay.style.height = 'auto';
            overlay.style.display = 'flex';
        }

        function hideSharedPopup() {
            const overlay = document.getElementById('neubie-shared-popup');
            if (overlay) overlay.style.display = 'none';
        }

        function isSharedPopupOpen(key) {
            const overlay = document.getElementById('neubie-shared-popup');
            return !!(overlay && overlay.style.display === 'flex' && overlay.dataset.key === key);
        }

        // 다른 스코프(레이아웃색상/날씨&기타 오버레이 등)에서도 호출 가능하도록 전역 노출
        window.getSharedPopupRect = getSharedPopupRect;
        window.showSharedPopup = showSharedPopup;
        window.hideSharedPopup = hideSharedPopup;
        window.isSharedPopupOpen = isSharedPopupOpen;

        // 요기요 최적화 — 스트림덱 타일 (아이콘 + 라벨 + ON/OFF)
        const mapToggle = document.createElement('button');
        mapToggle.style.cssText = `
            position:relative; overflow:hidden; aspect-ratio:2.0/1; border-radius:10px; cursor:pointer;
            display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
            padding:4px; box-sizing:border-box;
        `;
        mapToggle.innerHTML = `
            <div style="position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:6px;">
                <span style="font-size:18px;">🗺️</span>
                <span class="nb-onoff" style="font-size:12px; font-weight:bold; letter-spacing:0.5px;"></span>
            </div>
            <span style="position:relative; z-index:1; font-size:14px; font-weight:500; white-space:nowrap; text-align:center; color:${T.text};">맵 최적화 기능</span>
        `;
        const mapLabel = mapToggle.querySelector('.nb-onoff');
        mapLabel.textContent = state.isMapOpt ? 'ON' : 'OFF';
        paintToggleTile(mapToggle, state.isMapOpt, T);
        attachNeonHover(mapToggle, () => state.isMapOpt);
        attachHoldToggle(mapToggle, {
            onShortClick: () => mapInfoBtn.click(), // 기존 설명 팝업 그대로 재사용
            onHold: () => {
                state.isMapOpt = !state.isMapOpt;
                localStorage.setItem('neubie_opt_map', state.isMapOpt);
                mapLabel.textContent = state.isMapOpt ? 'ON' : 'OFF';
                paintToggleTile(mapToggle, state.isMapOpt, T);
                injectMapStyle();
            },
        });

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

            // 같은 버튼 재클릭 시 닫기만 하고 종료 — X버튼 없이도 닫는 방법
            if (isSharedPopupOpen('map-info')) {
                hideSharedPopup();
                return;
            }

            const mapInfoBox = document.createElement('div');
            mapInfoBox.style.cssText = `
                background:${T.card}; color:${T.text}; border-radius:18px; pointer-events:auto;
                border:1.5px solid ${T.accent}; padding:36px 40px 32px 40px;
                width:100%; box-sizing:border-box; max-height:70vh; overflow-y:auto;
                position:relative; box-shadow:0 10px 50px rgba(0,0,0,0.7);
            `;
            const mapInfoTitle = document.createElement('div');
            mapInfoTitle.textContent = '기능 설명';
            mapInfoTitle.style.cssText = `font-size:22px; font-weight:bold; margin-bottom:20px; color:${T.accent};`;
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
            mapInfoClose.onclick = () => hideSharedPopup();
            const mapInfoContent = document.createElement('div');
            mapInfoContent.style.cssText = `font-size:13px; line-height:1.8; color:${T.text};`;
            mapInfoContent.innerHTML = `
                역삼 요기요 / 송도 요기요 / 성수 요기요 / 성남 삼평동<br>
                흰색 마커 및 Dot을 숨겨서 페이지 최적화.<br>
                비타겟 site로 이동 시 원래대로 보임.<br>
                대기장소 마커(주황)를 역방향으로 뒤집어서 식별하기 쉽도록 함.<br>
                기존 NCC 상의 아이콘 숨기기 기능은 여전히 작동.<br>
            `;
            mapInfoBox.appendChild(mapInfoClose);
            mapInfoBox.appendChild(mapInfoTitle);
            mapInfoBox.appendChild(mapInfoContent);
            weatherCard.style.outline = 'none';
            rouletteCard.style.outline = 'none';
            showSharedPopup('map-info', mapInfoBox);
        };

		// 다중 모니터링 기능 — 스트림덱 타일
        const queueEnabled = localStorage.getItem('neubie_handover_enabled') === 'true';
        const queueToggle = document.createElement('button');
        queueToggle.style.cssText = `
            position:relative; overflow:hidden; aspect-ratio:2.0/1; border-radius:10px; cursor:pointer;
            display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
            padding:4px; box-sizing:border-box;
        `;
        queueToggle.innerHTML = `
            <div style="position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:6px;">
                <span style="font-size:18px;">🖥️</span>
                <span class="nb-onoff" style="font-size:12px; font-weight:bold; letter-spacing:0.5px;"></span>
            </div>
            <span style="position:relative; z-index:1; font-size:14px; font-weight:500; white-space:nowrap; text-align:center; color:${T.text};">다중 모니터링 기능</span>
        `;
        const queueLabel = queueToggle.querySelector('.nb-onoff');
        queueLabel.textContent = queueEnabled ? 'ON' : 'OFF';
        paintToggleTile(queueToggle, queueEnabled, T);
        attachNeonHover(queueToggle, () => queueLabel.textContent === 'ON');
        attachHoldToggle(queueToggle, {
            onShortClick: () => queueInfoBtn.click(), // 기존 설명 팝업 그대로 재사용
            onHold: () => {
                const next = queueLabel.textContent === 'OFF';
                localStorage.setItem('neubie_handover_enabled', next);
                queueLabel.textContent = next ? 'ON' : 'OFF';
                paintToggleTile(queueToggle, next, T);
                const bar = document.getElementById('neubie-brightness-bar');
                if (!next && bar) {
                    bar.remove();
                } else if (next && !bar && isBrightnessPage()) {
                    injectMasterBrightness();
                }
            },
        });

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
            // 같은 버튼 재클릭 시 닫기만 하고 종료 — X버튼 없이도 닫는 방법
            if (isSharedPopupOpen('queue-info')) {
                hideSharedPopup();
                return;
            }

            const queueInfoBox = document.createElement('div');
            queueInfoBox.style.cssText = `
                background:${T.card}; color:${T.text}; border-radius:18px; pointer-events:auto;
                border:1.5px solid ${T.accent}; padding:36px 40px 32px 40px;
                width:100%; box-sizing:border-box; max-height:70vh; overflow-y:auto;
                position:relative; box-shadow:0 10px 50px rgba(0,0,0,0.7);
            `;
            const queueInfoTitle = document.createElement('div');
            queueInfoTitle.textContent = '기능 설명';
            queueInfoTitle.style.cssText = `font-size:22px; font-weight:bold; margin-bottom:20px; color:${T.accent};`;
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
            queueInfoClose.onclick = () => hideSharedPopup();
            const queueInfoContent = document.createElement('div');
            queueInfoContent.id = 'neubie-queue-info-content';
            queueInfoContent.style.cssText = `font-size:13px; line-height:1.8; color:${T.text}; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;`;
            queueInfoContent.innerHTML = `
				삭제 레이아웃 기체명 표기<br>
				모니터링 생성 모달 우측 고정<br>
				기체별 화질 조절<br>
                기체별 헤드램프 토글<br>
				기체 카메라 밝기 한 번에 조절<br>
				카메라 위치 스왑<br>
				'NCC 도우미'만 이용하더라도 교대 기체 받기는 가능<br>
            `;

            queueInfoBox.appendChild(queueInfoClose);
            queueInfoBox.appendChild(queueInfoTitle);
            queueInfoBox.appendChild(queueInfoContent);
            weatherCard.style.outline = 'none';
            rouletteCard.style.outline = 'none';
            showSharedPopup('queue-info', queueInfoBox);
        };

        // 스트림덱 스타일 4열 타일 그리드 (8개)
        const bottomRow = document.createElement('div');
        bottomRow.id = 'neubie-streamdeck-grid';
        bottomRow.style.cssText = "display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;";

        const scheduleCard = document.createElement('div');
        scheduleCard.style.cssText = `
            position:relative; aspect-ratio:2.0/1; border-radius:10px; cursor:pointer;
            background:${T.card}; border:1px solid #ff4fa3;
            box-shadow:0 0 6px rgba(255,79,163,0.35), inset 0 0 8px rgba(255,79,163,0.1);
            display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
            padding:4px; box-sizing:border-box; transition:box-shadow 0.15s;
        `;
        scheduleCard.innerHTML = `<span style="font-size:18px;">📅</span>
            <span style="font-size:14px; font-weight:500; white-space:nowrap; text-align:center; color:${T.text};">스케줄표 & 좌석도</span>`;
        window._neubieScheduleCard = scheduleCard;
        attachStaticNeonHover(scheduleCard, '255,79,163');
        scheduleCard.onclick = () => {
            const isActive = scheduleCard.style.outline !== 'none' && scheduleCard.style.outline !== '';
            scheduleCard.style.outline = isActive ? 'none' : '2px solid #ef4444';
            if (!isActive) openScheduleOverlay();
        };

        const rouletteCard = document.createElement('div');
        rouletteCard.style.cssText = `
            position:relative; aspect-ratio:2.0/1; border-radius:10px; cursor:pointer;
            background:${T.card}; border:1px solid #2ce6d9;
            box-shadow:0 0 6px rgba(44,230,217,0.35), inset 0 0 8px rgba(44,230,217,0.1);
            display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
            padding:4px; box-sizing:border-box; transition:box-shadow 0.15s;
        `;
        rouletteCard.innerHTML = `<span style="font-size:18px;">🧰</span>
            <span style="font-size:14px; font-weight:500; white-space:nowrap; text-align:center; color:${T.text};">SW & 헬프</span>`;
        window._neubieRouletteCard = rouletteCard;
        attachStaticNeonHover(rouletteCard, '44,230,217');
        rouletteCard.onclick = () => {
            const isActive = rouletteCard.style.outline !== 'none' && rouletteCard.style.outline !== '';
            rouletteCard.style.outline = isActive ? 'none' : '2px solid #ef4444';
            if (!isActive) {
                weatherCard.style.outline = 'none'; // 공유 창 — 다른 트리거의 활성 표시는 정리
                openMoreToolsOverlay();
            } else {
                hideSharedPopup();
            }
        };

        const isBatteryOpen = batteryPopup.style.display === 'block';
        const batteryCard = document.createElement('div');
        batteryCard.style.cssText = `
            position:relative; aspect-ratio:2.0/1; border-radius:10px; cursor:pointer;
            background:${T.card}; border:1px solid #facc15;
            box-shadow:0 0 6px rgba(250,204,21,0.35), inset 0 0 8px rgba(250,204,21,0.1);
            display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
            padding:4px; box-sizing:border-box; transition:box-shadow 0.15s;
        `;
        batteryCard.innerHTML = `<span style="font-size:18px;">🔋</span>
            <span style="font-size:14px; font-weight:500; white-space:nowrap; text-align:center; color:${T.text};">성남 배터리 현황</span>`;
        window._neubieBatteryCard = batteryCard;
        attachStaticNeonHover(batteryCard, '250,204,21');
        batteryCard.onclick = () => {
            const isActive = batteryCard.style.outline !== 'none' && batteryCard.style.outline !== '';
            batteryCard.style.outline = isActive ? 'none' : '2px solid #ef4444';
            toggleBattery();
            if (window.currentMyTasks && window.currentMyTasks.length > 0) {
                renderTaskList(window.currentMyTasks);
            }
        };

        const weatherCard = document.createElement('div');
        weatherCard.style.cssText = `
            position:relative; aspect-ratio:2.0/1; border-radius:10px; cursor:pointer;
            background:${T.card}; border:1px solid #9d5cff;
            box-shadow:0 0 6px rgba(157,92,255,0.35), inset 0 0 8px rgba(157,92,255,0.1);
            display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
            padding:4px; box-sizing:border-box; transition:box-shadow 0.15s;
        `;
        weatherCard.innerHTML = `<span style="font-size:18px;">🎨</span>
            <span style="font-size:14px; font-weight:500; white-space:nowrap; text-align:center; color:${T.text};">레이아웃 색상</span>`;
        window._neubieWeatherCard = weatherCard;
        attachStaticNeonHover(weatherCard, '157,92,255');
        weatherCard.onclick = () => {
            const isActive = weatherCard.style.outline !== 'none' && weatherCard.style.outline !== '';
            weatherCard.style.outline = isActive ? 'none' : '2px solid #ef4444';
            if (!isActive) {
                rouletteCard.style.outline = 'none'; // 공유 창 — 다른 트리거의 활성 표시는 정리
                openDriveThemeOverlay();
            } else {
                hideSharedPopup();
            }
        };

        // 1행: 요기요 최적화 - 다중 모니터링 - 게임패드 - 성남 배터리
        bottomRow.appendChild(mapToggle);    // 요기요 최적화 (ON/OFF)
        bottomRow.appendChild(queueToggle);  // 다중 모니터링 (ON/OFF)
        bottomRow.appendChild(gamepadBtn);   // 게임패드 (ON/OFF)
        bottomRow.appendChild(batteryCard);  // 성남 배터리

        // 2행: 레이아웃 색상 - SW & 헬프 - 게시판 - 스케줄 좌석
        bottomRow.appendChild(weatherCard);  // 레이아웃 색상
        bottomRow.appendChild(rouletteCard); // SW & 헬프
        bottomRow.appendChild(boardBtn);     // 게시판
        bottomRow.appendChild(scheduleCard); // 스케줄 좌석

        list.appendChild(bottomRow);

        // 영상 파일명 도우미
        list.appendChild(createNamingCard());

        dashboard.appendChild(list);

        if (window.currentMyTasks && window.currentMyTasks.length > 0) {
            renderTaskList(window.currentMyTasks);
        } else {
            taskInline.innerHTML = `<div style="color:#666; font-size:14px; padding:8px 0;">배정된 업무가 없습니다.</div>`;
        }
    }

    // 팝업 열 때만 생성
    function toggleBattery() {
        if (batteryPopup.style.display !== 'block') {

            // Alt+Q 메인 레이아웃이 떠있을 때만 스트림덱 바로 위(bottom 라인)에 맞춤,
            // 아니면(Alt+B 단독 호출 등) 기존 우상단 고정 위치 그대로
            if (dashboard.style.display === 'block' && typeof getSharedPopupRect === 'function') {
                const r = getSharedPopupRect();
                batteryPopup.style.top = 'auto';
                batteryPopup.style.left = r.left + 'px';
                batteryPopup.style.right = 'auto';
                batteryPopup.style.bottom = r.bottom + 'px';
            } else {
                batteryPopup.style.top = '20px';
                batteryPopup.style.left = 'auto';
                batteryPopup.style.right = '20px';
                batteryPopup.style.bottom = 'auto';
            }

            // 열 때마다 호출하지만, 실제 서버 요청은 updateBatteryStatus 내부의
            // 2분 게이트가 알아서 걸러줌 (2분 안 지났으면 기존 값 그대로 표시)
            updateBatteryStatus();
            batteryPopup.style.display = 'block';

        } else {
            batteryPopup.style.display = 'none';
            if (window._neubieBatteryCard) window._neubieBatteryCard.style.outline = 'none';
        }
    }

    function closeAllPopups() {
        dashboard.style.display = 'none';
        batteryPopup.style.display = 'none';
        if (window._neubieBatteryCard) window._neubieBatteryCard.style.outline = 'none';

		document.getElementById('ho-remote-peek')?.remove();
    	document.getElementById('ho-remote-panel')?.remove();
		
        const sharedPopup = document.getElementById('neubie-shared-popup');
        if (sharedPopup) sharedPopup.style.display = 'none';
        const boardOverlay = document.getElementById('neubie-board-overlay');
        if (boardOverlay) boardOverlay.style.display='none';
        document.getElementById('neubie-troubleshoot-overlay')?.remove();
        const secretOverlay = document.getElementById('neubie-secret-overlay');
        if (secretOverlay) secretOverlay.style.display='none';
        if (window._neubieWeatherCard) window._neubieWeatherCard.style.outline = 'none';
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
			zIndex: '2147483646', width: '616px',
			background: 'rgba(200, 200, 200, 0.98)',
			borderRadius: '0 0 14px 14px', padding: '7px 8px 9px',
			fontFamily: 'Pretendard,sans-serif',
			boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
			border: '1px solid rgba(200,210,230,0.7)', borderTop: 'none',
			transition: 'top 0.28s cubic-bezier(0.4,0,0.2,1)',
		});
		document.body.appendChild(panel);

		// ── DP 상태 메시지 (로그 바 — 잘 안 보인다는 피드백으로 텍스트 확대) ──
		const dpMsg = document.createElement('span');
		dpMsg.id = 'ho-dp-msg';
		Object.assign(dpMsg.style, {
			fontSize: '12px', color: '#64748b',
			overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
			flex: '1', minWidth: '0',
            background: 'rgba(255,255,255,0.85)',
            borderRadius: '5px',
            padding: '3px 8px',
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
				padding: '4px 10px', borderRadius: '6px', fontSize: '13px',
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
			marginBottom: '5px', paddingBottom: '5px',
			borderBottom: '1px solid rgba(0,0,0,0.08)',
			flexWrap: 'nowrap',
		});

		// 카메라 위치 새로고침 버튼 (기존 '다중 파일명'/'성남 배터리' 자리로 이동)
		const posBtn = mkBtn('카메라 위치 새로고침', '#64748b');

		// 교대 받기 버튼
		const fetchBtn = mkBtn('교대 기체 로드', '#3b82f6');

		headerRow.appendChild(posBtn);
		headerRow.appendChild(fetchBtn);
		headerRow.appendChild(dpMsg);

		// 우측: 자동 시작
		const rightBtns = document.createElement('div');
		Object.assign(rightBtns.style, { marginLeft: 'auto', display: 'flex', gap: '5px', flexShrink: '0' });

		const autoBtn = mkBtn('자동 시작', '#6366f1');

		rightBtns.appendChild(autoBtn);
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
				height: '31px', borderRadius: '7px', border: '1.5px dashed #c8d2e0',
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
				setDpMsg('추가 확인 중...', '#3b82f6');

				// 전부 아니면 전무이므로, 대표로 하나라도 카드가 뜨는지만 확인 (최대 4초)
				const success = await new Promise(resolve => {
					const deadline = Date.now() + 4000;
					const check = () => {
						const cardNames = [...document.querySelectorAll('.flex.h-full.w-full.items-center.justify-center.overflow-hidden .p-3')]
							.map(el => el.textContent.trim());
						const anyAppeared = checkedUnits.some(name => cardNames.some(c => c.includes(name)));
						if (anyAppeared) {
							resolve(true);
						} else if (Date.now() > deadline) {
							resolve(false);
						} else {
							setTimeout(check, 300);
						}
					};
					check();
				});

				if (success) {
					setDpMsg('완료! ✅', '#22c55e');
					return { confirmed: true, checkedUnits };
				} else {
					setDpMsg(`거절됨 (이미 모니터링 중 등) — taken 처리 안 함, 다시 시도해주세요`, '#ef4444');
					return { confirmed: false, checkedUnits: [] };   // ← 실패 시 완전히 빈 배열 반환
				}
			} else {
				setDpMsg('시작하기 버튼을 직접 눌러주세요', '#f59e0b');
				return { confirmed: false, checkedUnits };
			}
		};

		autoBtn.addEventListener('click', async () => {
			const modal = document.querySelector('[data-qk="remote-multiple-select-robot-dialog"]');
			if (!modal) {
				setDpMsg('NCC에서 기체 선택 모달을 먼저 열어주세요', '#f59e0b');
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
    SECTION 화질 조절 버튼 (모니터링 페이지 전용)
   ============================================================ */
	const LEVEL_LABELS = ['', '최소', '낮음', '중간', '높음', '최대'];

	function isMonitoringPage() {
		return NEUBIE_HOSTS.some(h => location.href.includes(`${h}/ko/remote/multiple/monitoring`));
	}

    function isNewDrivingPage() {
		const isNeubieHost = NEUBIE_HOSTS.some(h => location.href.includes(h));
		if (!isNeubieHost || !location.href.includes('/new')) return false;
		// 기체 원격조종(단일) + 개입 페이지(다중, 리뉴얼) 둘 다 동일 라이트 테마 대상
		return location.href.includes('/ko/remote/robot/') || location.href.includes('/ko/remote/multiple/driving/');
	}

    // 게임패드 커스텀 바인딩 — 명시적으로 켜거나 끈 적이 없으면 이름으로 기본값 결정 ('오정훈'만 기본 OFF)
	function isDpadBindingOff() {
		const stored = localStorage.getItem('neubie_dpad_binding');
		if (stored === 'off') return true;
		if (stored === 'on') return false;
		return (localStorage.getItem('neubie_user_name') || '') === '오정훈';
	}

    /* ============================================================
	   SECTION 기체 원격조종(/new) 레이아웃 색상 테마
	   ============================================================ */
	const DRIVE_THEME_KEY = 'neubie_drive_theme';
	const DRIVE_THEMES = {
		light: { card: '#ffffff', border: '#cccccc', text: '#111111', label: '☀️ 라이트' },   // card 흰색, track 필드 삭제
	};
	const DRIVE_TARGETS = ['적재함', '헤드램프', '게임패드', '자동정지', '임무 받기 중지', '임무 시작 시 알림이 여기에 표시됩니다.', '임무 설정', '도착 처리'];   

	function driveThemeClimb(startEl, maxWidth = 320) {
		let best = startEl, node = startEl;
		for (let i = 0; i < 10 && node.parentElement; i++) {
			node = node.parentElement;
			if (node.getBoundingClientRect().width > maxWidth) break;
			const m = getComputedStyle(node).backgroundColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
			if (m && (m[4] === undefined ? 1 : parseFloat(m[4])) > 0.15) best = node;
		}
		return best;
	}

	function driveThemeFindByText(label) {
		const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === label);
		return el ? driveThemeClimb(el) : null;
	}

	function driveThemeMark(el, t) {
		if (!el) return;
		const cardRgb = t.card.match(/[a-f\d]{2}/gi).map(h => parseInt(h, 16)).join(', ');
		const paint = (n) => {
			n.style.setProperty('background-color', t.card, 'important');
			n.style.setProperty('border', `1px solid ${t.border}`, 'important');
			n.style.setProperty('box-shadow', 'none', 'important');
			if (!(n.closest && n.closest('.text-warning'))) {
				n.style.setProperty('color', t.text, 'important');
			} else {
				n.style.removeProperty('color');   // ON 전환 시 이전에 박힌 검정을 확실히 제거
			}
			n.setAttribute('data-neubie-theme-touched', '1');
		};
		paint(el);
		el.querySelectorAll('*').forEach(c => {
			// 닫기(X) 버튼 레드 원본 유지
			if (c.closest && c.closest('.bg-red-400')) return;

			// 신규 추가 — 시나리오 진행바(체크포인트 완료 표시)는 상태색이 의미를 가지므로 원본 그대로 유지
			if (typeof c.className === 'string' && c.className.includes('bg-primary')) return;
			
			// 배터리 아이콘 내부 채우기(bg-mono-200) — 카드색이 아니라 글자색(진한 톤)으로. 안 그러면 흰 배경에 묻힘
			if (typeof c.className === 'string' && c.className.includes('bg-mono-200')) {
				c.style.setProperty('background-color', t.text, 'important');
				c.setAttribute('data-neubie-theme-touched', '1');
				return;
			}

			const cs = getComputedStyle(c);
			const m = cs.backgroundColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
			const alpha = m ? (m[4] === undefined ? 1 : parseFloat(m[4])) : 0;
			const hasGradient = cs.backgroundImage && cs.backgroundImage.includes('gradient');
			const isWarning = c.closest && c.closest('.text-warning');   // ON 상태(주황) 여부 — 한 번만 계산해 재사용

			if (alpha > 0.15) {
				paint(c);
			} else if (hasGradient) {
				// rgba(38,38,38,0) 같은 투명 끝단도 놓치지 않도록 rgb/rgba 둘 다 치환
				const newBg = cs.backgroundImage.replace(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g, (match) => {
					const isTransparentEnd = /,\s*0\s*\)$/.test(match);
					return isTransparentEnd ? `rgba(${cardRgb}, 0)` : `rgb(${cardRgb})`;
				});
				c.style.setProperty('background-image', newBg, 'important');
				if (!isWarning) {
					c.style.setProperty('color', t.text, 'important');
				} else {
					c.style.removeProperty('color');
				}
				c.setAttribute('data-neubie-theme-touched', '1');
			} else {
				if (!isWarning) {
					c.style.setProperty('color', t.text, 'important');
				} else {
					c.style.removeProperty('color');
				}
				c.setAttribute('data-neubie-theme-touched', '1');
			}

			// 아이콘(svg/path/circle/rect) — 텍스트와 동일한 규칙으로 fill/stroke 처리
			if (c.tagName === 'svg' || c.tagName === 'path' || c.tagName === 'circle' || c.tagName === 'rect') {
				if (!isWarning) {
					c.style.setProperty('fill', t.text, 'important');
					c.style.setProperty('stroke', t.text, 'important');
				} else {
					c.style.removeProperty('fill');
					c.style.removeProperty('stroke');
				}
				c.setAttribute('data-neubie-theme-touched', '1');
			}
		});
	}

    function watchSoundInputCard() {
		const inputEl = document.querySelector('input[placeholder="문장 입력 송출"]');
		const card = inputEl?.closest('.border-1.rounded-small.flex.w-full.shrink-0.flex-col');
		if (!card) return;

		if (window._soundInputThemeObserver) window._soundInputThemeObserver.disconnect();

		let selfWriting = false;   // ← 재진입 방지 플래그
		window._soundInputThemeObserver = new MutationObserver(() => {
			if (selfWriting) return;   // 우리가 방금 쓴 변경이면 무시
			const saved = localStorage.getItem(DRIVE_THEME_KEY) || 'dark';
			if (saved !== 'light') return;

			selfWriting = true;
			driveThemeMark(card, DRIVE_THEMES.light);
			const freshInput = document.querySelector('input[placeholder="문장 입력 송출"]');
			if (freshInput) driveThemeMark(driveThemeClimb(freshInput), DRIVE_THEMES.light);
			requestAnimationFrame(() => { selfWriting = false; });   // 다음 프레임부터 다시 감시 활성화
		});
		window._soundInputThemeObserver.observe(card, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
	}
	
	function watchMissionProgressCard() {
		const missionCard = driveThemeFindByText('도착 처리');
		if (!missionCard) return;

		if (window._missionThemeObserver) window._missionThemeObserver.disconnect();

		const watchTarget = missionCard.parentElement || missionCard;   // ← 카드 자신이 아니라 부모를 감시
		let selfWriting = false;
		window._missionThemeObserver = new MutationObserver(() => {
			if (selfWriting) return;
			const saved = localStorage.getItem(DRIVE_THEME_KEY) || 'dark';
			if (saved !== 'light') return;

			selfWriting = true;
			const freshCard = driveThemeFindByText('도착 처리');   // ← 매번 다시 찾음 (교체됐어도 최신 노드 확보)
			if (freshCard) driveThemeMark(freshCard, DRIVE_THEMES.light);
			requestAnimationFrame(() => {
				selfWriting = false;
				watchMissionProgressCard();   // ← 감시 대상이 바뀌었을 수 있으니 스스로 재등록
			});
		});
		window._missionThemeObserver.observe(watchTarget, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
	}

	function watchMissionSettingCard() {
		// "임무 설정" 버튼 기준으로 상위 .contents 래퍼까지 올라가서 감시
		// (상태 텍스트/알림 내용이 갱신될 때 이 래퍼 하위가 다시 그려지며 칠한 스타일이 날아감)
		const missionBtn = driveThemeFindByText('임무 설정');
		const wrap = missionBtn ? (missionBtn.closest('.contents') || missionBtn.parentElement) : null;
		if (!wrap) return;

		if (window._missionSettingThemeObserver) window._missionSettingThemeObserver.disconnect();

		let selfWriting = false;
		window._missionSettingThemeObserver = new MutationObserver(() => {
			if (selfWriting) return;
			const saved = localStorage.getItem(DRIVE_THEME_KEY) || 'dark';
			if (saved !== 'light') return;

			selfWriting = true;
			driveThemeMark(wrap, DRIVE_THEMES.light);
			requestAnimationFrame(() => {
				selfWriting = false;
				watchMissionSettingCard();   // 감시 대상이 교체됐을 수 있으니 스스로 재등록
			});
		});
		window._missionSettingThemeObserver.observe(wrap, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
	}

	function watchLogPanel() {
		const logPanel = document.querySelector('.rounded-small.bg-mono-100.w-full.min-h-50');
		if (!logPanel) return;

		if (window._logPanelThemeObserver) window._logPanelThemeObserver.disconnect();

		let selfWriting = false;
		window._logPanelThemeObserver = new MutationObserver(() => {
			if (selfWriting) return;
			const saved = localStorage.getItem(DRIVE_THEME_KEY) || 'dark';
			if (saved !== 'light') return;

			selfWriting = true;
			driveThemeMark(logPanel, DRIVE_THEMES.light);
			requestAnimationFrame(() => { selfWriting = false; });
		});
		window._logPanelThemeObserver.observe(logPanel, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
	}
	
	function watchToggleButtons() {
		if (window._toggleThemeObservers) {
			window._toggleThemeObservers.forEach(obs => obs.disconnect());
		}
		window._toggleThemeObservers = [];

		let selfWriting = false;
		const targets = ['헤드램프', '게임패드', '자동정지', '적재함'];
		targets.forEach(label => {
			const card = driveThemeFindByText(label);
			if (!card) return;
			const obs = new MutationObserver(() => {
				if (selfWriting) return;
				const saved = localStorage.getItem(DRIVE_THEME_KEY) || 'dark';
				if (saved !== 'light') return;

				selfWriting = true;
				driveThemeMark(card, DRIVE_THEMES.light);
				requestAnimationFrame(() => { selfWriting = false; });
			});
			obs.observe(card, { subtree: true, attributes: true, attributeFilter: ['class'] });
			window._toggleThemeObservers.push(obs);
		});
	}

	function clearDriveTheme() {
		document.getElementById('neubie-drive-theme-style')?.remove();
		if (window._soundInputThemeObserver) { window._soundInputThemeObserver.disconnect(); window._soundInputThemeObserver = null; }
        if (window._missionThemeObserver) { window._missionThemeObserver.disconnect(); window._missionThemeObserver = null; }
		if (window._missionSettingThemeObserver) { window._missionSettingThemeObserver.disconnect(); window._missionSettingThemeObserver = null; }
		if (window._logPanelThemeObserver) { window._logPanelThemeObserver.disconnect(); window._logPanelThemeObserver = null; }
		if (window._toggleThemeObservers) { window._toggleThemeObservers.forEach(obs => obs.disconnect()); window._toggleThemeObservers = null; }
		document.querySelectorAll('[data-neubie-theme-touched]').forEach(el => {
			el.style.removeProperty('background-color');
			el.style.removeProperty('background-image');
			el.style.removeProperty('border');
			el.style.removeProperty('border-bottom');
			el.style.removeProperty('box-shadow');
			el.style.removeProperty('color');
			el.style.removeProperty('fill');  
			el.style.removeProperty('stroke');
			el.removeAttribute('data-neubie-theme-touched');
		});
	}

	function applyDriveTheme(themeKey) {
		if (!isNewDrivingPage()) return;   // 안전장치: 이 페이지가 아니면 절대 실행 안 함
		clearDriveTheme();
		if (themeKey !== 'light') return;   // dark(원본)는 그냥 초기화 상태로 끝

		const t = DRIVE_THEMES.light;
		const style = document.createElement('style');
		style.id = 'neubie-drive-theme-style';
		style.textContent = `
			div.bg-mono-800.dark.flex-col { background-color: ${t.card} !important; background-image: none !important; }
			input[placeholder="문장 입력 송출"]::placeholder { color: ${t.text} !important; opacity: 0.6 !important; }
		`;
		document.head.appendChild(style);

		DRIVE_TARGETS.forEach(label => driveThemeMark(driveThemeFindByText(label), t));
		watchToggleButtons();
		const inputEl = document.querySelector('input[placeholder="문장 입력 송출"]');
		if (inputEl) driveThemeMark(driveThemeClimb(inputEl), t);
        watchSoundInputCard();
		watchMissionProgressCard();
		watchMissionSettingCard();

        // 주행 로그 패널 — 텍스트가 매번 바뀌어(시간값) 라벨 매칭이 불가능해 클래스로 직접 지정
		// ※ 사이트 개편 시 이 클래스 조합이 바뀌면 재확인 필요
		const logPanel = document.querySelector('.rounded-small.bg-mono-100.w-full.min-h-50');
		if (logPanel) driveThemeMark(logPanel, t);
		watchLogPanel();

		const header = document.querySelector('header');
		if (header) {
			driveThemeMark(header, t);
			header.style.setProperty('border', 'none', 'important');
			header.style.setProperty('border-bottom', `2px solid ${t.border}`, 'important');
		}
	}

	function initDriveTheme() {
		if (!isNewDrivingPage()) return;
		const saved = localStorage.getItem(DRIVE_THEME_KEY) || 'dark';
		applyDriveTheme(saved);
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
							setTimeout(() => { isCooling = false; btn.style.opacity = '1'; }, 2000);
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
						setTimeout(() => isLampCooling = false, 5000);
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
						font-family: 'Paperlogy', 'Pretendard', sans-serif !important;   // ← 'BMJUA' → 'Paperlogy'로 교체
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
				transform: 'scale(1.275)', // 기존 1.5에서 15% 축소
				transformOrigin: 'center center',
			});

            overlay.innerHTML = `
            <div style="width:100%; height:100%; background:rgba(10,10,30,0.72); backdrop-filter:blur(2px); display:flex; flex-direction:column; border-radius:24px;">
                <div id="nb-board-header" style="display:flex; align-items:center; gap:8px; padding:12px 16px; border-bottom:0.5px solid rgba(255,255,255,0.12); cursor:grab;">
                    <span style="font-size:15px; font-weight:600; color:#fff; flex:1;"><span class="nb-emoji">📋</span> NCC 게시판</span>
                    <button id="nb-refresh-btn" style="height:28px; width:28px; background:rgba(255,255,255,0.1); color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;" title="새로고침">↺</button>
					<button id="nb-write-btn" style="height:28px; padding:0 12px; font-size:12px; font-weight:500; background:#6366f1; color:white; border:none; border-radius:6px; cursor:pointer;">✏️ 글쓰기</button>
                    <button id="nb-board-close" style="background:rgba(255,255,255,0.1); border:none; color:#fff; width:26px; height:26px; border-radius:50%; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center;">✕</button>
                </div>

                <div style="height:2px; background:#6366f1; opacity:0.5; margin:0 16px;"></div>

                <div id="nb-screen-list" style="flex:1; overflow-y:auto; padding:4px 0;"></div>

                <div id="nb-list-toolbar" style="padding:8px 16px; display:flex; align-items:center; justify-content:space-between; gap:8px; border-top:0.5px solid rgba(255,255,255,0.1);">
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
                document.getElementById('nb-list-toolbar').style.display = 'flex';
                renderList(allPosts, false)
            }

            function showWriteScreen() {
                document.getElementById('nb-screen-list').style.display = 'none';
                document.getElementById('nb-screen-detail').style.display = 'none';
                document.getElementById('nb-screen-write').style.display = 'flex';
                document.getElementById('nb-list-toolbar').style.display = 'none';
                document.getElementById('nb-write-title').value = '';
                document.getElementById('nb-write-content').value = '';
            }

            function showDetail(post) {
                document.getElementById('nb-screen-list').style.display = 'none';
                document.getElementById('nb-screen-write').style.display = 'none';
				document.getElementById('nb-screen-edit').style.display = 'none';
				document.getElementById('nb-list-toolbar').style.display = 'none';
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
                    <div onclick="window._nbOpenPost('${p.id}')" style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 16px; border-bottom:0.5px solid rgba(255,255,255,0.07); cursor:pointer; transition:background 0.12s;" onmouseenter="this.style.background='rgba(255,255,255,0.06)'" onmouseleave="this.style.background='transparent'">
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
				document.getElementById('nb-list-toolbar').style.display = 'none';
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
                    const isLeave1=d1?.status==='annual'||d1?.status==='public'||d1?.status==='dispatch';
                    const isLeave2=d2?.status==='annual'||d2?.status==='public'||d2?.status==='dispatch';
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
                        isOff1&&st==='dispatch'?`${n1v}(파견)`:n1v;
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
                        isOff2&&st==='dispatch'?`${n2v}(파견)`:n2v;
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
                if(!p1||(d1?.status==='annual'||d1?.status==='public'||d1?.status==='dispatch')) off1++;
                if(!p2||(d2?.status==='annual'||d2?.status==='public'||d2?.status==='dispatch')) off2++;
                if((!p1||(d1?.status==='annual'||d1?.status==='public'||d1?.status==='dispatch'))&&
                    (!p2||(d2?.status==='annual'||d2?.status==='public'||d2?.status==='dispatch'))) offOv++;
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
                if(d&&(d.status==='annual'||d.status==='public'||d.status==='dispatch')) leaveMap[s.name]=d.status;
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
                        bd.textContent=leaveMap[name]==='annual'?'연차':leaveMap[name]==='dispatch'?'파견':'공가'; sp.appendChild(bd);
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
                        bd.textContent=leaveMap[raw]==='annual'?'연차':leaveMap[raw]==='dispatch'?'파견':'공가'; el.appendChild(bd);
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
                        const ko={work:'출근',half:'반차','half-half':'반반차',annual:'연차',public:'공가',dispatch:'파견',off:'휴무',empty:'미출근'};
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

            window.openDriveThemeOverlay = function() {
                const T = getNbTheme();
                const nbThemeName = localStorage.getItem('neubie_theme') || 'dark';
                const driveTheme = localStorage.getItem(DRIVE_THEME_KEY) || 'dark';

                const box = document.createElement('div');
                box.style.cssText = `background:${T.card}; color:${T.text}; border-radius:16px; padding:20px; width:100%; box-sizing:border-box; box-shadow:0 4px 40px rgba(0,0,0,0.7); pointer-events:auto;`;
                box.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                        <span style="font-size:16px;font-weight:700;">🎨 레이아웃 색상 설정</span>
                        <button id="dto-close" style="width:28px;height:28px;border:none;border-radius:5px;background:#3b0000;border:1px solid #ef4444;color:#ef4444;font-size:16px;cursor:pointer;">✕</button>
                    </div>

                    <div style="font-size:13px;font-weight:600;margin-bottom:6px;">ALT+Q 레이아웃</div>
                    <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">핸드오버/대시보드 등 도구 전반의 화면 톤입니다.</div>
                    <div style="display:flex; gap:8px; margin-bottom:18px;">
                        <button data-nbt="dark" style="flex:1; padding:10px; border-radius:8px; border:1px solid ${nbThemeName==='dark'?'#4f8ef7':T.border}; background:${nbThemeName==='dark'?'#1e3a8a33':'transparent'}; color:${T.text}; cursor:pointer; font-size:13px;">🌙 다크</button>
                        <button data-nbt="light" style="flex:1; padding:10px; border-radius:8px; border:1px solid ${nbThemeName==='light'?'#4f8ef7':T.border}; background:${nbThemeName==='light'?'#1e3a8a33':'transparent'}; color:${T.text}; cursor:pointer; font-size:13px;">☀️ 라이트</button>
                    </div>

                    <div style="border-top:1px solid ${T.border}; margin-bottom:14px;"></div>

                    <div style="font-size:13px;font-weight:600;margin-bottom:6px;">원격조종 페이지</div>
                    <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">기체 원격조종(신형, /new) 화면에만 적용됩니다.</div>
                    <div style="display:flex; gap:8px;">
                        <button data-dt="dark" style="flex:1; padding:10px; border-radius:8px; border:1px solid ${driveTheme==='dark'?'#4f8ef7':T.border}; background:${driveTheme==='dark'?'#1e3a8a33':'transparent'}; color:${T.text}; cursor:pointer; font-size:13px;">🌙 원본</button>
                        <button data-dt="light" style="flex:1; padding:10px; border-radius:8px; border:1px solid ${driveTheme==='light'?'#4f8ef7':T.border}; background:${driveTheme==='light'?'#1e3a8a33':'transparent'}; color:${T.text}; cursor:pointer; font-size:13px;">☀️ 라이트</button>
                    </div>
                    <div style="font-size:11px;color:#64748b;margin-top:10px;">추후 다른 색상 테마도 여기에 추가될 예정입니다.</div>
                `;
                box.querySelector('#dto-close').onclick = () => {
                    window.hideSharedPopup();
                    if (window._neubieWeatherCard) window._neubieWeatherCard.style.outline = 'none';
                };

                // ALT+Q 레이아웃 색상 토글 (기존 themeBtn 로직 그대로 이식)
                box.querySelectorAll('[data-nbt]').forEach(btn => {
                    btn.onclick = () => {
                        const next = btn.dataset.nbt;
                        localStorage.setItem('neubie_theme', next);
                        ['neubie-shared-popup', 'neubie-secret-overlay'].forEach(id => {
                            const el = document.getElementById(id);
                            if (el) el.remove();
                        });
                        buildBatteryShell();
                        renderDashboard();
                        openDriveThemeOverlay();   // 자기 자신은 유지한 채 선택 표시만 갱신
                    };
                });

                // 원격조종 페이지 색상 토글 (기존 로직 그대로)
                box.querySelectorAll('[data-dt]').forEach(btn => {
                    btn.onclick = () => {
                        const key = btn.dataset.dt;
                        localStorage.setItem(DRIVE_THEME_KEY, key);
                        applyDriveTheme(key);
                        openDriveThemeOverlay();
                    };
                });

                window.showSharedPopup('drivetheme', box);
            };

            window.openMoreToolsOverlay = function() {
                const T = getNbTheme();
                const box = document.createElement('div');
                box.style.cssText = `background:${T.card}; color:${T.text}; border-radius:16px; padding:20px; width:100%; box-sizing:border-box; box-shadow:0 4px 40px rgba(0,0,0,0.7); pointer-events:auto;`;
                box.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                        <span style="font-size:16px;font-weight:700;">🧰 SW & 헬프</span>
                        <button id="mto-close" style="width:28px;height:28px;border:none;border-radius:5px;background:#3b0000;border:1px solid #ef4444;color:#ef4444;font-size:16px;cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <button id="mto-tips" style="padding:10px; border-radius:8px; border:1px solid ${T.border}; background:transparent; color:${T.text}; cursor:pointer; text-align:left; font-size:14px;">💡 SW 설정</button>
                        <button id="mto-trouble" style="padding:10px; border-radius:8px; border:1px solid ${T.border}; background:transparent; color:${T.text}; cursor:pointer; text-align:left; font-size:14px;">🛠️ 문제해결</button>
                    </div>
                `;
                box.querySelector('#mto-close').onclick = () => {
                    window.hideSharedPopup();
                    if (window._neubieRouletteCard) window._neubieRouletteCard.style.outline = 'none';
                };
                box.querySelector('#mto-tips').onclick = () => openTipsOverlay();
                box.querySelector('#mto-trouble').onclick = () => { window.hideSharedPopup(); openTroubleshootOverlay(); };
                window.showSharedPopup('moretools', box);
            };

            // ── 문제해결 게시판 ──────────────────────────────────────
            // links에 넣은 url은 게시글 안에서 클릭하면 바로 새 탭으로 열립니다 (구글드라이브 .reg 등 파일 링크 가능)
            const troubleshootPosts = [
                {
                    id: '바탕화면',
                    title: '바탕화면 [이 사진에 대한...] 아이콘 없애기',
                    body: '바탕화면에 [이 사진에 대한 자세한 정보]라는 아이콘이 떠 있는 경우, 아래의 파일을 다운받고 실행하고 새로고침하세요.',
                    images: [
                        'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/ego_trippin/desktop_weirdo.png',
                    ],
                    links: [
                        { label: '[이 사진에 대한 자세한 정보] 아이콘 없애기.reg', url: 'https://drive.google.com/file/d/1IjWGiN__VT1hmZdfm7YkYUpa4Wd89A9f/view?usp=drive_link' },
                        { label: '[이 사진에 대한 자세한 정보] 아이콘 되돌리기.reg', url: 'https://drive.google.com/file/d/1Vuqf8nWPLi5KuTnLLkJ3WJdHAgD8F-xz/view?usp=drive_link' },
                    ],
                },
                {
                    id: 'VPN',
                    title: 'FortiClientVPN 접속 불가 시',
                    body: 'VPN 설정을 스샷과 같이 설정해보세요. 미해결시 아래 파일로 재설치 후 시도바랍니다.',
                    images: [
                        'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/ego_trippin/forticlientvpn.png',
                    ],
                    links: [
						{ label: 'FortiClientVPN 설치파일', url: 'https://drive.google.com/file/d/1pjHTVSYomXSGTYLf4OVGk3g3QvzRJSMd/view?usp=drive_link' },
					],
                },
				{
                    id: 'Refresh',
                    title: '멀티플 계정 새로고침 불가 시',
                    body: 'NCC 도메인 변경 이후, 크롬 시크릿 탭에서 새로고침하면 계정로그인이 풀리는 현상 수정. 하단 주소에 접속하셔서 서드 파티 쿠키 사용이 허용된 사이트 ->  추가 버튼 [*.]neubility.ai 추가하시면 시크릿 탭에서 새로고침해도 세션이 튕기지 않습니다(현재 시크릿 탭에서는 본인 계정이든 멀티플 계정이든 새로고침하면 튕깁니다).',
                    images: [
                        'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/ego_trippin/domain_refresh.png',
                    ],
                    links: [
						{ label: '크롬 서드파티 쿠키 설정', url: 'chrome://settings/cookies' },
					],
                },
            ];

            // ── 사진 원본 크기 보기 (클릭 시 확대, 다시 클릭 시 닫힘) ──
            function openImageLightbox(src) {
                const existing = document.getElementById('neubie-img-lightbox');
                if (existing) { existing.remove(); return; }

                const lb = document.createElement('div');
                lb.id = 'neubie-img-lightbox';
                Object.assign(lb.style, {
                    position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.88)', zIndex: '2147483647',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'zoom-out',
                });

                const fullImg = document.createElement('img');
                fullImg.src = src;
                fullImg.style.cssText = 'max-width:95vw; max-height:95vh; width:auto; height:auto; object-fit:contain; border-radius:6px; box-shadow:0 10px 60px rgba(0,0,0,0.6); cursor:zoom-out;';

                lb.appendChild(fullImg);
                lb.onclick = () => lb.remove();
                document.body.appendChild(lb);
            }

            window.openTroubleshootOverlay = function() {
                const T = getNbTheme();
                const dashboardEl = document.getElementById('neubie-dashboard');
                const r = dashboardEl.getBoundingClientRect();

                const overlay = document.createElement('div');
                overlay.id = 'neubie-troubleshoot-overlay';
                Object.assign(overlay.style, {
                    position: 'fixed',
                    top: r.top + 'px',
                    left: r.left + 'px',
                    width: r.width + 'px',
                    height: '560px',
                    zIndex: '1000001',
                    borderRadius: '16px',
                    overflow: 'hidden',
                });

                const box = document.createElement('div');
                box.style.cssText = `background:${T.card}; color:${T.text}; border-radius:16px; padding:20px; width:100%; height:100%; box-sizing:border-box; overflow-y:auto; box-shadow:0 10px 50px rgba(0,0,0,0.7); pointer-events:auto;`;
                overlay.appendChild(box);
                document.body.appendChild(overlay);

                function renderGrid() {
                    box.innerHTML = '';
                    const header = document.createElement('div');
                    header.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;';
                    header.innerHTML = `<span style="font-size:16px; font-weight:700;">🛠️ 문제해결</span>`;
                    const closeBtn = document.createElement('button');
                    closeBtn.textContent = '✕';
                    closeBtn.style.cssText = 'width:28px; height:28px; border:none; border-radius:5px; background:#3b0000; border:1px solid #ef4444; color:#ef4444; font-size:16px; cursor:pointer;';
                    closeBtn.onclick = () => overlay.remove();
                    header.appendChild(closeBtn);

                    const grid = document.createElement('div');
                    grid.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:8px;';
                    troubleshootPosts.forEach(post => {
                        const btn = document.createElement('button');
                        btn.textContent = post.title;
                        btn.style.cssText = `padding:14px 10px; border-radius:8px; border:1px solid ${T.border}; background:transparent; color:${T.text}; cursor:pointer; text-align:center; font-size:14px;`;
                        btn.onmouseenter = () => { btn.style.borderColor = '#3b82f6'; btn.style.color = '#3b82f6'; };
                        btn.onmouseleave = () => { btn.style.borderColor = T.border; btn.style.color = T.text; };
                        btn.onclick = () => renderPost(post);
                        grid.appendChild(btn);
                    });

                    box.appendChild(header);
                    box.appendChild(grid);
                }

                function renderPost(post) {
                    box.innerHTML = '';
                    const header = document.createElement('div');
                    header.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;';
                    header.innerHTML = `<span style="font-size:16px; font-weight:700;">${post.title}</span>`;
                    const closeBtn = document.createElement('button');
                    closeBtn.textContent = '✕';
                    closeBtn.title = '목록으로';
                    closeBtn.style.cssText = 'width:28px; height:28px; border:none; border-radius:5px; background:#3b0000; border:1px solid #ef4444; color:#ef4444; font-size:16px; cursor:pointer;';
                    closeBtn.onclick = () => renderGrid();
                    header.appendChild(closeBtn);

                    const body = document.createElement('div');
                    body.style.cssText = `font-size:14px; line-height:1.7; color:${T.text}; white-space:pre-wrap;`;
                    body.textContent = post.body;

                    box.appendChild(header);
                    box.appendChild(body);

                    if (post.images && post.images.length) {
                        const imgWrap = document.createElement('div');
                        imgWrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px; margin-top:14px;';
                        post.images.forEach(src => {
                            const img = document.createElement('img');
                            img.src = src;
                            img.loading = 'lazy';
                            img.title = '클릭하면 원본 크기로 보기';
                            img.style.cssText = 'max-width:100%; max-height:360px; width:auto; height:auto; object-fit:contain; border-radius:8px; display:block; margin:0 auto; cursor:zoom-in;';
                            img.onclick = () => openImageLightbox(src);
                            imgWrap.appendChild(img);
                        });
                        box.appendChild(imgWrap);
                    }

                    if (post.links && post.links.length) {
                        const linkWrap = document.createElement('div');
                        linkWrap.style.cssText = 'display:flex; flex-direction:column; gap:8px; margin-top:16px;';
                        post.links.forEach(link => {
                            if (link.url.startsWith('chrome://')) {
                                // chrome:// 내부 페이지는 브라우저 정책상 웹페이지(및 유저스크립트)에서
                                // <a> 클릭이나 window.open으로 절대 이동시킬 수 없음 → 주소 복사로 대체
                                const btn = document.createElement('button');
                                const defaultLabel = '📋 ' + link.label + ' 주소 복사 (새 탭에 직접 붙여넣기)';
                                btn.textContent = defaultLabel;
                                btn.style.cssText = `display:block; width:100%; padding:10px 12px; border-radius:8px; border:1px solid #3b82f6; background:transparent; color:#3b82f6; text-decoration:none; font-size:13px; text-align:center; cursor:pointer; font-family:inherit;`;
                                btn.onclick = () => {
                                    navigator.clipboard.writeText(link.url);
                                    btn.textContent = '✅ 복사됨! 새 탭 열고 주소창에 붙여넣기(Ctrl+V) 하세요';
                                    btn.style.borderColor = '#22c55e';
                                    btn.style.color = '#22c55e';
                                    setTimeout(() => {
                                        btn.textContent = defaultLabel;
                                        btn.style.borderColor = '#3b82f6';
                                        btn.style.color = '#3b82f6';
                                    }, 2500);
                                };
                                linkWrap.appendChild(btn);
                            } else {
                                const a = document.createElement('a');
                                a.href = link.url;
                                a.target = '_blank';
                                a.rel = 'noopener noreferrer';
                                a.textContent = '📎 ' + link.label;
                                a.style.cssText = `display:block; padding:10px 12px; border-radius:8px; border:1px solid #3b82f6; color:#3b82f6; text-decoration:none; font-size:13px; text-align:center;`;
                                linkWrap.appendChild(a);
                            }
                        });
                        box.appendChild(linkWrap);
                    }
                }

                renderGrid();
            };

            window.openGamepadMenuOverlay = function() {
                const T = getNbTheme();
                const box = document.createElement('div');
                box.style.cssText = `background:${T.card}; color:${T.text}; border-radius:16px; padding:20px; width:100%; box-sizing:border-box; box-shadow:0 4px 40px rgba(0,0,0,0.7); pointer-events:auto;`;
                box.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                        <span style="font-size:16px;font-weight:700;">🎮 패드 기능 & 테스터</span>
                        <button id="gpm-close" style="width:28px;height:28px;border:none;border-radius:5px;background:#3b0000;border:1px solid #ef4444;color:#ef4444;font-size:16px;cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <button id="gpm-guide" style="padding:10px; border-radius:8px; border:1px solid ${T.border}; background:transparent; color:${T.text}; cursor:pointer; text-align:left; font-size:14px;">🕹️ D-PAD 기능 변경점 설명</button>
                        <button id="gpm-tester" style="padding:10px; border-radius:8px; border:1px solid ${T.border}; background:transparent; color:${T.text}; cursor:pointer; text-align:left; font-size:14px;">🎮 컨트롤러 기능 작동 테스터</button>
                    </div>
                `;
                box.querySelector('#gpm-close').onclick = () => window.hideSharedPopup();
                box.querySelector('#gpm-guide').onclick = () => openGamepadGuideOverlay();
                box.querySelector('#gpm-tester').onclick = () => openGamepadTesterOverlay();
                window.showSharedPopup('gamepad-menu', box);
            };

            // 실시간 컨트롤러 테스터 — 사용자가 벡터화한 xbox_skeleton.svg 원본(여백 크롭) + 버튼별 투명 오버레이 + 스틱 기울임 시 캡 이동
            window.openGamepadTesterOverlay = function() {
                const box = document.createElement('div');
                box.style.cssText = `background:#1e1e2e; color:#e2e8f0; border-radius:16px; padding:12px; width:100%; box-sizing:border-box; max-height:78vh; overflow-y:auto; box-shadow:0 10px 50px rgba(0,0,0,0.7); pointer-events:auto;`;
                box.innerHTML = `
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; gap:10px;">
                        <span style="font-size:15px; font-weight:700;">🎮 컨트롤러 기능 작동 테스터</span>
                        <button id="gpt-close" style="width:26px; height:26px; border:none; border-radius:5px; background:#3b0000; border:1px solid #ef4444; color:#ef4444; font-size:14px; cursor:pointer;">✕</button>
                    </div>
                    <div id="gpt-status" style="text-align:center; font-size:11px; color:#94a3b8; margin-bottom:6px;">컨트롤러의 아무 버튼이나 눌러 연결하세요</div>
                    <div style="background:#f4ede0; border-radius:10px; padding:8px; max-width:400px; margin:0 auto; box-sizing:border-box;">
                    <svg viewBox="71 229 1251 930" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto; display:block;">
<path d="M0 0 C17.02 14.78 28.91 33.44 34.51 55.31 C34.81 56.29 35.11 57.27 35.41 58.28 C41.36 80.44 38.7 106.8 28.51 127.31 C28.23 127.89 27.95 128.47 27.67 129.06 C14.18 156.81 -7.86 175 -36.3 186.12 C-62.17 194.83 -91.15 193.22 -115.75 181.46 C-146.03 166.39 -164.89 143.27 -175.63 111.42 C-178.14 102.33 -178.8 93.86 -178.74 84.44 C-178.75 83.25 -178.75 82.06 -178.76 80.83 C-178.7 51.36 -166.63 26.24 -146.49 5.31 C-145.63 4.34 -145.63 4.34 -144.75 3.35 C-107.92 -37.09 -39.44 -33.37 0 0 Z " fill="#FDFDFD" transform="translate(1069.48876953125,444.68798828125)"/>
<path d="M0 0 C0.74 0.59 1.47 1.18 2.23 1.79 C21.3 17.65 33.82 42.58 37 67 C38.5 90.55 36.07 109.77 26 131 C25.52 132.04 25.03 133.08 24.53 134.15 C11.41 160.12 -12.6 176.82 -39.38 186.44 C-67.86 194.91 -98.01 191.08 -123.89 177.18 C-151.24 161.85 -168.06 136.95 -177.1 107.4 C-183.94 79.09 -177.99 49.25 -163.27 24.61 C-160.23 19.7 -156.9 15.26 -153 11 C-152.27 10.2 -152.27 10.2 -151.53 9.38 C-111.59 -33.94 -45.08 -38.44 0 0 Z " fill="#FDFDFD" transform="translate(617,662)"/>
<path d="M0 0 C2.3 -0 4.61 -0.01 6.91 -0.01 C13.17 -0.02 19.43 -0.01 25.69 0 C31.77 0.01 37.85 0.01 43.93 0.01 C56.35 -0 68.77 0 81.19 0.02 C93.49 0.03 105.78 0.04 118.07 0.04 C118.84 0.04 119.61 0.04 120.4 0.04 C123.51 0.04 126.63 0.04 129.74 0.04 C158.07 0.05 186.4 0.06 214.74 0.09 C241.45 0.11 268.16 0.12 294.88 0.13 C295.7 0.13 296.53 0.13 297.37 0.13 C300.7 0.13 304.02 0.13 307.34 0.13 C308.99 0.13 310.65 0.13 312.3 0.13 C313.95 0.13 315.61 0.13 317.26 0.13 C343.57 0.13 369.89 0.15 396.21 0.16 C403.9 0.16 411.59 0.17 419.29 0.17 C435.45 0.17 451.62 0.18 467.79 0.2 C474.47 0.2 481.16 0.21 487.84 0.21 C493.96 0.21 500.08 0.21 506.21 0.22 C508.42 0.23 510.63 0.23 512.84 0.23 C527.58 0.22 542.14 0.24 556.66 3.18 C557.56 3.36 558.45 3.53 559.38 3.72 C602.17 12.36 641.32 31.41 673.22 61.37 C673.75 61.86 674.28 62.36 674.83 62.87 C687.82 75.13 698.42 88.8 707.22 104.37 C707.61 105.04 708 105.72 708.4 106.41 C718.23 123.58 725.15 141.95 732.22 160.37 C732.67 161.53 732.67 161.53 733.13 162.72 C741.37 184.19 749.39 205.75 757.22 227.37 C757.51 228.16 757.79 228.95 758.09 229.76 C759.99 235.01 761.89 240.25 763.78 245.5 C764.4 247.22 765.02 248.94 765.64 250.66 C768.46 258.46 771.25 266.22 773.54 274.19 C774.25 276.47 775.11 278.63 776.03 280.83 C779.27 288.71 781.69 296.88 784.28 304.99 C785.08 307.48 785.88 309.97 786.68 312.46 C787.17 314 787.66 315.54 788.15 317.08 C789.5 321.28 790.96 325.42 792.53 329.54 C793.45 331.99 794.29 334.46 795.12 336.94 C795.45 337.93 795.78 338.92 796.13 339.94 C796.47 340.97 796.81 342 797.16 343.05 C797.51 344.13 797.87 345.2 798.24 346.31 C801.49 356.14 804.56 366.01 807.38 375.98 C807.63 376.89 807.89 377.8 808.16 378.74 C808.42 379.66 808.67 380.57 808.94 381.51 C810.41 386.66 811.98 391.74 813.72 396.8 C816.76 405.71 819.12 414.8 821.55 423.88 C822.41 427.05 823.31 430.21 824.22 433.37 C826.2 440.23 828.07 447.12 829.94 454.01 C831.09 458.26 832.25 462.5 833.47 466.73 C839.97 489.28 844.78 512.34 849.58 535.31 C850.14 537.99 850.72 540.66 851.31 543.33 C854.85 559.84 857.05 576.63 859.22 593.37 C859.31 594.03 859.41 594.69 859.5 595.37 C860.39 602.27 860.38 609.13 860.39 616.07 C860.39 617.38 860.4 618.7 860.4 620.05 C860.4 622.83 860.41 625.61 860.41 628.38 C860.41 631.18 860.41 633.99 860.43 636.79 C860.5 652.39 860.3 667.83 858.45 683.34 C858.14 686.06 857.94 688.79 857.74 691.52 C857.26 696.78 856.19 701.85 854.97 706.99 C854.75 707.94 854.53 708.89 854.3 709.87 C847.09 740.22 835.34 769.01 807.97 786.55 C785.29 799.93 761.17 803.48 735.28 803.68 C734.02 803.71 732.75 803.74 731.44 803.77 C705.62 803.94 685.54 788.17 667.85 770.99 C659.09 762.31 651.17 753.08 643.69 743.28 C642.11 741.23 640.52 739.19 638.92 737.15 C628.77 724.23 619.01 711.05 609.43 697.7 C601.57 686.76 593.45 676.03 585.22 665.37 C584.69 664.68 584.16 663.99 583.62 663.29 C574.3 651.22 564.49 639.63 554.22 628.37 C553.37 627.41 552.52 626.45 551.64 625.47 C526.34 597.19 493.12 573.83 454.22 571.37 C448.74 571.22 443.27 571.22 437.79 571.23 C436.14 571.22 434.49 571.22 432.83 571.22 C428.32 571.21 423.81 571.21 419.29 571.21 C414.41 571.21 409.53 571.2 404.66 571.19 C394 571.18 383.35 571.17 372.69 571.17 C366.03 571.16 359.37 571.16 352.71 571.16 C334.26 571.14 315.8 571.13 297.35 571.13 C296.17 571.13 294.99 571.13 293.77 571.13 C292 571.13 292 571.13 290.19 571.13 C287.79 571.13 285.39 571.13 283 571.13 C281.81 571.13 280.62 571.13 279.4 571.13 C260.14 571.12 240.89 571.11 221.63 571.08 C201.84 571.06 182.05 571.05 162.25 571.04 C151.15 571.04 140.05 571.04 128.95 571.02 C119.49 571 110.04 571 100.58 571.01 C95.76 571.01 90.94 571.01 86.13 571 C81.7 570.98 77.28 570.98 72.86 571 C71.27 571 69.68 571 68.09 570.99 C54.38 570.92 40.53 572.17 27.6 577.05 C26.9 577.31 26.2 577.57 25.49 577.83 C-4.68 589.35 -31.94 613.51 -51.64 638.66 C-53.66 641.21 -55.76 643.65 -57.9 646.09 C-65.38 654.62 -72.11 663.65 -78.85 672.76 C-81.38 676.18 -83.95 679.58 -86.51 682.98 C-91.83 690.03 -97.07 697.13 -102.22 704.3 C-109.52 714.49 -117.13 724.44 -124.78 734.37 C-125.3 735.05 -125.83 735.73 -126.37 736.43 C-129.46 740.45 -132.59 744.43 -135.78 748.37 C-136.43 749.18 -136.43 749.18 -137.1 750.01 C-155.63 772.77 -179.18 798.87 -209.78 803.37 C-214.65 803.61 -219.53 803.61 -224.4 803.62 C-225.44 803.62 -225.44 803.62 -226.5 803.62 C-238.15 803.6 -249.39 802.88 -260.78 800.37 C-261.55 800.2 -262.31 800.03 -263.1 799.86 C-288.1 794.21 -309.54 780.5 -323.69 758.78 C-338.08 735.8 -343.59 709.82 -346.47 683.21 C-346.67 681.39 -346.88 679.56 -347.1 677.74 C-354.13 618.95 -344.3 560.53 -330.53 503.51 C-329.49 499.14 -328.54 494.76 -327.59 490.37 C-326.25 484.2 -324.63 478.15 -322.84 472.1 C-321.59 467.69 -320.49 463.25 -319.4 458.8 C-317.03 449.17 -314.36 439.65 -311.58 430.13 C-310.76 427.29 -309.94 424.46 -309.12 421.62 C-304.85 406.82 -300.37 392.08 -295.78 377.37 C-295.56 376.68 -295.35 375.99 -295.13 375.28 C-288.14 352.86 -280.95 330.52 -273.43 308.27 C-272.29 304.88 -271.15 301.49 -270.02 298.1 C-207.14 110.32 -207.14 110.32 -172.85 73.59 C-170.98 71.59 -169.22 69.53 -167.47 67.43 C-154.95 53.17 -139.12 41.83 -122.78 32.37 C-122.17 32.01 -121.55 31.64 -120.92 31.27 C-101.71 19.95 -81.33 12.04 -59.78 6.37 C-58.81 6.1 -57.83 5.84 -56.83 5.56 C-38.18 0.83 -19.15 -0.08 0 0 Z M-57.28 14.24 C-58.28 14.5 -59.28 14.76 -60.3 15.03 C-113.11 29.08 -160.32 61.27 -188.2 108.78 C-196.15 122.75 -202.2 137.45 -208.02 152.41 C-208.79 154.4 -209.57 156.38 -210.35 158.37 C-234.21 218.96 -255.7 280.51 -276.03 342.37 C-276.25 343.05 -276.48 343.74 -276.71 344.44 C-281.71 359.66 -286.64 374.89 -291.16 390.26 C-292.12 393.51 -293.1 396.76 -294.09 400 C-301.84 425.65 -308.98 451.45 -315.78 477.37 C-316.07 478.46 -316.36 479.55 -316.65 480.67 C-325.58 514.55 -332.98 548.88 -337.31 583.66 C-337.79 587.43 -338.31 591.2 -338.84 594.96 C-344.58 638.13 -342.8 689.14 -327.78 730.37 C-327.5 731.13 -327.23 731.89 -326.94 732.67 C-323.52 741.89 -319.61 750.39 -313.78 758.37 C-313.12 759.28 -312.47 760.19 -311.8 761.13 C-295.59 782.33 -270.77 790.99 -245.18 794.54 C-229.71 796.38 -212.27 798.01 -197.78 791.37 C-196.8 790.95 -195.82 790.54 -194.8 790.12 C-172.54 779.99 -154.64 759.18 -139.78 740.37 C-139.28 739.73 -138.77 739.09 -138.25 738.44 C-129.17 726.93 -120.43 715.2 -111.78 703.37 C-103.83 692.5 -95.8 681.7 -87.61 671.01 C-84.04 666.34 -80.5 661.65 -77 656.92 C-68.43 645.34 -59.02 634.61 -49.24 624.05 C-47.15 621.77 -45.11 619.46 -43.09 617.12 C-36.32 609.35 -28.86 602.75 -20.78 596.37 C-20.27 595.96 -19.76 595.55 -19.23 595.12 C-0.57 580.2 21.87 566.64 46.1 564.25 C46.93 564.17 47.75 564.08 48.61 564 C57.02 563.21 65.38 563.08 73.82 563.09 C75.5 563.09 77.18 563.08 78.86 563.08 C83.41 563.06 87.97 563.06 92.53 563.06 C97.46 563.06 102.4 563.05 107.34 563.04 C118.11 563.01 128.87 563.01 139.64 563 C146.37 563 153.11 562.99 159.84 562.98 C178.53 562.96 197.21 562.95 215.89 562.94 C217.08 562.94 218.28 562.94 219.5 562.94 C221.92 562.94 224.34 562.94 226.75 562.94 C227.95 562.94 229.15 562.94 230.39 562.94 C231.59 562.94 232.79 562.94 234.03 562.94 C253.49 562.94 272.96 562.91 292.42 562.87 C312.46 562.84 332.49 562.82 352.52 562.82 C363.75 562.82 374.98 562.81 386.21 562.78 C395.76 562.75 405.32 562.75 414.88 562.76 C419.75 562.77 424.61 562.77 429.48 562.74 C477.07 562.53 512.84 575.81 547.22 609.37 C548.24 610.36 548.24 610.36 549.29 611.37 C556.96 618.84 564.51 626.27 571.12 634.7 C573.11 637.22 575.16 639.66 577.24 642.09 C583.16 648.99 588.75 656.11 594.22 663.37 C594.9 664.27 594.9 664.27 595.6 665.19 C605.09 677.76 614.43 690.45 623.73 703.16 C631.7 714.05 639.87 724.77 648.22 735.37 C648.96 736.31 649.7 737.25 650.45 738.22 C652.35 740.63 654.28 743 656.22 745.37 C656.63 745.87 657.05 746.38 657.47 746.89 C673.88 766.77 695.85 792.43 723.22 795.37 C754.44 797.05 789.01 792.75 813.59 771.77 C844.9 743.11 850.53 695.58 852.36 655.31 C852.6 648.02 852.66 640.73 852.66 633.43 C852.66 632.31 852.66 631.19 852.66 630.04 C852.64 608.51 850.75 587.59 847.22 566.37 C846.93 564.6 846.93 564.6 846.64 562.79 C845.38 555.27 843.86 547.82 842.22 540.37 C842.06 539.62 841.89 538.87 841.72 538.1 C838.19 521.95 834.64 505.81 830.58 489.78 C829.48 485.44 828.45 481.08 827.45 476.72 C825.28 467.27 822.72 457.97 819.95 448.68 C817.7 441.09 815.62 433.46 813.6 425.8 C811.47 417.79 809.18 409.93 806.45 402.09 C804.96 397.59 803.68 393.05 802.41 388.49 C799.37 377.68 795.97 367.01 792.5 356.33 C791.49 353.21 790.5 350.09 789.51 346.97 C784.48 331.18 779.29 315.44 773.97 299.74 C773.76 299.12 773.55 298.49 773.33 297.85 C764.1 270.58 754.35 243.5 744.38 216.5 C743.25 213.45 742.13 210.41 741.02 207.37 C732.15 183.2 723.03 159.16 713.22 135.37 C712.82 134.39 712.42 133.41 712 132.41 C705.6 116.95 697.52 102.58 687.22 89.37 C686.61 88.55 685.99 87.73 685.36 86.89 C670.29 67.54 651.46 51.53 630.22 39.37 C629.56 38.98 628.9 38.59 628.22 38.19 C606.51 25.47 584 17.26 559.41 12.05 C558.22 11.8 557.02 11.55 555.8 11.28 C554.05 10.93 554.05 10.93 552.26 10.57 C551.24 10.36 550.22 10.15 549.17 9.94 C535.75 8 522.22 8.22 508.7 8.23 C506.42 8.22 504.14 8.22 501.87 8.22 C495.64 8.21 489.41 8.21 483.18 8.21 C477.14 8.21 471.11 8.2 465.07 8.19 C448.91 8.18 432.75 8.17 416.59 8.17 C408.94 8.16 401.29 8.16 393.64 8.16 C367.41 8.14 341.18 8.13 314.96 8.13 C313.31 8.13 311.67 8.13 310.02 8.13 C308.37 8.13 306.73 8.13 305.08 8.13 C301.77 8.13 298.47 8.13 295.16 8.13 C294.34 8.13 293.52 8.13 292.68 8.13 C266.11 8.12 239.54 8.11 212.98 8.08 C184.85 8.06 156.72 8.05 128.59 8.04 C125.5 8.04 122.41 8.04 119.31 8.04 C118.17 8.04 118.17 8.04 117.01 8.04 C104.8 8.04 92.59 8.03 80.37 8.02 C68.09 8 55.8 8 43.51 8.01 C36.86 8.01 30.21 8.01 23.56 8 C17.46 7.98 11.36 7.98 5.26 8 C3.07 8 0.88 8 -1.32 7.99 C-20.19 7.92 -38.99 9.29 -57.28 14.24 Z " fill="#C7D9EC" transform="translate(440.77955627441406,334.63250732421875)"/>
<path d="M0 0 C0.85 0.63 1.69 1.25 2.56 1.9 C22.24 17.08 37.46 39.02 41.31 64 C44.96 93.09 39.34 120.46 21.31 143.94 C4.24 164.52 -18.24 178.29 -45 182 C-73.98 184.39 -100.56 177.27 -122.94 158.5 C-135.52 147.56 -144.8 134.48 -151 119 C-151.36 118.17 -151.71 117.33 -152.08 116.47 C-161.4 93.27 -160.12 66.94 -150.78 44.04 C-139.45 17.68 -120.04 -0.04 -94.12 -11.81 C-63.41 -23.68 -26.63 -19.89 0 0 Z M-112 32 C-112.59 32.58 -113.18 33.17 -113.79 33.77 C-126.9 47.68 -131.72 65.81 -131.46 84.41 C-131.22 91.6 -130.55 98.23 -128 105 C-127.47 106.48 -127.47 106.48 -126.93 107.99 C-119.47 127.37 -105.92 141.2 -87.42 150.27 C-69.58 157.99 -49.52 158.35 -31.44 151.31 C-12.42 143.49 2.6 129.5 10.71 110.46 C17.88 91.16 18.56 72.03 10.27 52.9 C4.17 39.6 -4.21 29.73 -16 21 C-16.95 20.28 -16.95 20.28 -17.91 19.54 C-47.58 -1.04 -88.09 7.46 -112 32 Z " fill="#FCFDFD" transform="translate(915,662)"/>
<path d="M0 0 C1.41 0.52 2.83 1.03 4.24 1.54 C17.77 6.63 28.55 14.01 39 24 C40.01 24.9 40.01 24.9 41.05 25.82 C54.73 38.46 62.64 56.22 67 74 C67.23 74.88 67.45 75.76 67.69 76.66 C73.16 101.27 66.66 128.61 53.62 149.78 C39.09 172.05 15.38 188.19 -10.5 194.09 C-16.76 195.3 -22.95 195.29 -29.31 195.25 C-31.01 195.26 -31.01 195.26 -32.75 195.27 C-43.6 195.25 -54.21 194.15 -64.44 190.38 C-65.15 190.12 -65.86 189.86 -66.59 189.59 C-91 180.36 -111.16 161.44 -121.96 137.78 C-123.38 134.54 -124.7 131.28 -126 128 C-126.51 126.72 -126.51 126.72 -127.03 125.41 C-134.99 103.5 -132.88 76.91 -123.39 55.88 C-122.93 54.93 -122.47 53.98 -122 53 C-121.26 51.45 -121.26 51.45 -120.51 49.87 C-107.63 24.35 -85.79 8.11 -59.3 -1.32 C-41.74 -6.74 -17.08 -6.79 0 0 Z M-41.54 22.05 C-57.87 23.12 -72.74 32.79 -84 44 C-84.69 44.65 -85.37 45.3 -86.08 45.98 C-98.38 58.54 -105.04 76.29 -105.38 93.69 C-104.6 116.78 -96.32 134.65 -80.07 150.94 C-64.17 165.75 -44.4 169.77 -23.38 169.14 C-18.32 168.85 -13.75 167.7 -9 166 C-8.01 165.65 -7.02 165.3 -6 164.93 C13.64 157.34 27.73 143.78 36.75 124.86 C44.1 108.05 45.18 86.58 38.48 69.38 C34.45 60.2 29.6 52.56 23 45 C22.48 44.39 21.96 43.77 21.43 43.14 C10.42 31.08 -6.79 23.17 -23 22 C-29.19 21.79 -35.36 21.93 -41.54 22.05 Z " fill="#FCFDFD" transform="translate(430,432)"/>
<path d="M0 0 C11.4 6.61 17.81 14.87 21.51 27.49 C22.94 34.04 22.89 40.57 22.84 47.23 C22.85 48.74 22.85 50.25 22.86 51.75 C22.86 54.89 22.85 58.02 22.83 61.15 C22.81 65.15 22.82 69.14 22.85 73.13 C22.86 76.23 22.86 79.34 22.85 82.44 C22.85 83.91 22.85 85.38 22.86 86.85 C22.9 95.03 22.62 102.01 18.31 109.19 C17.78 110.09 17.24 111 16.69 111.94 C11.12 117.22 3.66 120.23 -3.99 120.4 C-4.83 120.42 -5.67 120.43 -6.54 120.45 C-10.4 120.51 -14.27 120.56 -18.13 120.59 C-20.15 120.61 -22.18 120.65 -24.2 120.7 C-46.86 121.22 -46.86 121.22 -55.69 114.19 C-62.18 106.97 -63.79 101.14 -63.85 91.51 C-63.86 90.21 -63.87 88.9 -63.88 87.55 C-63.88 86.13 -63.89 84.71 -63.89 83.3 C-63.89 82.58 -63.9 81.85 -63.9 81.11 C-63.91 77.29 -63.92 73.48 -63.93 69.66 C-63.93 65.74 -63.96 61.82 -63.99 57.91 C-64 54.87 -64.01 51.83 -64.01 48.8 C-64.01 47.36 -64.02 45.91 -64.04 44.47 C-64.16 29.61 -61.4 17.95 -51 6.94 C-46.35 2.48 -41.68 -0.49 -35.69 -2.81 C-34.75 -3.18 -33.81 -3.54 -32.85 -3.92 C-21.99 -6.98 -9.85 -5.14 0 0 Z " fill="#FCFCFC" transform="translate(1079.9875,260.0125)"/>
<path d="M0 0 C17.02 14.78 28.91 33.44 34.51 55.31 C34.81 56.29 35.11 57.27 35.41 58.28 C41.36 80.44 38.7 106.8 28.51 127.31 C28.23 127.89 27.95 128.47 27.67 129.06 C14.18 156.81 -7.86 175 -36.3 186.12 C-62.17 194.83 -91.15 193.22 -115.75 181.46 C-146.03 166.39 -164.89 143.27 -175.63 111.42 C-178.14 102.33 -178.8 93.86 -178.74 84.44 C-178.75 83.25 -178.75 82.06 -178.76 80.83 C-178.7 51.36 -166.63 26.24 -146.49 5.31 C-145.63 4.34 -145.63 4.34 -144.75 3.35 C-107.92 -37.09 -39.44 -33.37 0 0 Z M-130.49 2.31 C-131.02 2.71 -131.54 3.11 -132.09 3.51 C-149.48 16.82 -160.83 34.55 -167.49 55.31 C-167.83 56.37 -168.17 57.44 -168.53 58.53 C-175.24 83.86 -169.79 110.48 -157.5 133.06 C-153.26 140.26 -148.3 146.33 -142.49 152.31 C-141.48 153.43 -141.48 153.43 -140.45 154.58 C-125.72 170.38 -103.11 181.43 -81.49 182.45 C-52.11 183.27 -27.04 178.53 -4.49 158.31 C-3.98 157.86 -3.47 157.41 -2.95 156.95 C9.44 145.8 17.57 132.82 23.51 117.31 C23.82 116.62 24.12 115.93 24.43 115.22 C33.61 93.84 31.14 67.13 22.91 45.97 C14.07 24.28 -1.19 6.83 -21.49 -4.69 C-22.47 -5.25 -23.46 -5.81 -24.48 -6.4 C-57.82 -24.22 -100.51 -20.31 -130.49 2.31 Z " fill="#C7DAEC" transform="translate(1069.48876953125,444.68798828125)"/>
<path d="M0 0 C17.01 14.77 28.93 33.45 34.51 55.31 C34.81 56.33 35.11 57.34 35.41 58.39 C40.44 77.61 38.96 100.85 31.51 119.31 C31.15 120.24 30.79 121.17 30.42 122.13 C18.3 152.46 -3.44 172.01 -32.95 184.81 C-58.14 194.67 -87.64 193.84 -112.49 183.31 C-140.17 170.81 -161.04 149.67 -172.29 121.3 C-176.9 108.93 -178.82 97.62 -178.74 84.44 C-178.75 83.25 -178.75 82.06 -178.76 80.83 C-178.7 51.36 -166.63 26.24 -146.49 5.31 C-145.63 4.34 -145.63 4.34 -144.75 3.35 C-132.5 -10.11 -113.69 -18.33 -96.49 -22.69 C-95.36 -23.03 -94.24 -23.38 -93.08 -23.73 C-61.36 -32.19 -24.5 -20.73 0 0 Z M-130.49 2.31 C-131.02 2.71 -131.54 3.11 -132.09 3.51 C-152.58 19.19 -164.57 41.07 -170.09 66.05 C-173.31 92.6 -168.19 119.31 -152.49 141.31 C-149.05 145.54 -145.29 149.42 -141.49 153.31 C-140.84 154.03 -140.2 154.75 -139.53 155.49 C-124.51 171.79 -101.35 181.41 -79.49 182.45 C-48.57 183.37 -24.07 175.67 -0.77 154.88 C10.52 144.18 18.09 131.85 23.51 117.31 C23.9 116.31 24.29 115.3 24.69 114.26 C33.96 88.72 30.32 61.44 19.1 37.28 C7.98 15.75 -9.98 -0.61 -32.11 -10.13 C-33.22 -10.6 -33.22 -10.6 -34.35 -11.09 C-45.96 -15.79 -57.28 -17.22 -69.74 -17.13 C-70.42 -17.12 -71.1 -17.12 -71.8 -17.12 C-93.75 -16.96 -112.85 -11 -130.49 2.31 Z " fill="#C7DAEC" transform="translate(469.48876953125,444.68798828125)"/>
<path d="M0 0 C0.74 0.59 1.47 1.18 2.23 1.79 C21.3 17.65 33.82 42.58 37 67 C38.5 90.55 36.07 109.77 26 131 C25.52 132.04 25.03 133.08 24.53 134.15 C11.41 160.12 -12.6 176.82 -39.38 186.44 C-67.86 194.91 -98.01 191.08 -123.89 177.18 C-151.24 161.85 -168.06 136.95 -177.1 107.4 C-183.94 79.09 -177.99 49.25 -163.27 24.61 C-160.23 19.7 -156.9 15.26 -153 11 C-152.27 10.2 -152.27 10.2 -151.53 9.38 C-111.59 -33.94 -45.08 -38.44 0 0 Z M-135 5 C-135.92 5.75 -136.84 6.49 -137.79 7.26 C-154.84 21.78 -165.53 42.22 -170 64 C-170.19 64.9 -170.38 65.8 -170.57 66.72 C-173.26 87.26 -170.1 107.41 -161 126 C-160.57 126.89 -160.14 127.79 -159.7 128.71 C-147.93 151.79 -127.01 169.43 -102.45 177.57 C-76.16 185.73 -48.3 183.49 -23.75 170.94 C-13.94 165.68 -5.87 158.76 2 151 C2.73 150.28 3.46 149.56 4.21 148.82 C21.7 130.44 29.71 105.04 29.4 80.07 C28.5 50.95 16.57 26.66 -4.38 6.69 C-17.44 -4.77 -33.21 -11.96 -50 -16 C-50.93 -16.23 -51.86 -16.45 -52.81 -16.69 C-81.95 -22.65 -112.5 -14.17 -135 5 Z " fill="#C7DAEC" transform="translate(617,662)"/>
<path d="M0 0 C1.57 1.34 3.14 2.7 4.69 4.06 C5.49 4.73 6.3 5.39 7.13 6.07 C24.14 20.5 34.83 39.77 40.69 61.06 C40.88 61.72 41.08 62.39 41.28 63.07 C43.03 69.7 43.03 76.33 43 83.16 C43 85.16 43.02 87.16 43.05 89.16 C43.06 101.89 41.01 113.85 36.44 125.75 C36.13 126.55 35.83 127.36 35.51 128.18 C25.03 155.03 3.76 175.55 -22.31 187.21 C-47.58 197.98 -78.11 199.11 -103.77 189.1 C-114.96 184.5 -124.86 178.59 -134.31 171.06 C-135.15 170.39 -135.99 169.73 -136.86 169.04 C-151.97 156.3 -161.65 139.37 -168.31 121.06 C-168.65 120.14 -168.99 119.21 -169.34 118.25 C-177.76 92.75 -174.66 63.53 -163.13 39.58 C-149.6 13.39 -126.97 -7.05 -98.81 -16.25 C-96.65 -16.84 -94.49 -17.41 -92.31 -17.94 C-90.54 -18.38 -90.54 -18.38 -88.72 -18.84 C-58.58 -25.48 -24.55 -19.24 0 0 Z M-141.9 21.99 C-152.39 34.68 -159.23 49.19 -163.31 65.06 C-163.56 65.97 -163.8 66.87 -164.05 67.8 C-169.53 91.88 -163.25 117.75 -151.34 138.84 C-135.99 163.18 -113.3 179.11 -85.38 185.94 C-57.89 190.75 -29.96 185.23 -7.06 169.17 C-2.56 165.72 1.6 161.98 5.69 158.06 C6.32 157.48 6.96 156.89 7.62 156.29 C22.8 141.91 33.53 117.9 34.88 97.14 C34.95 94.15 34.97 91.18 34.94 88.19 C34.93 87.13 34.92 86.08 34.91 84.99 C34.53 57.42 23.67 34.58 4.88 14.81 C-14.98 -4.3 -41.2 -13.54 -68.46 -13.42 C-96.85 -12.65 -123.17 0.82 -141.9 21.99 Z " fill="#C7DAEC" transform="translate(922.3125,656.9375)"/>
<path d="M0 0 C1.3 -0.01 1.3 -0.01 2.62 -0.03 C5.47 -0.06 8.33 -0.08 11.19 -0.1 C12.17 -0.11 13.14 -0.11 14.15 -0.12 C19.33 -0.15 24.51 -0.18 29.69 -0.2 C33.96 -0.21 38.24 -0.25 42.52 -0.3 C47.69 -0.36 52.86 -0.39 58.03 -0.4 C60 -0.41 61.96 -0.43 63.93 -0.46 C82.49 -0.72 82.49 -0.72 88.88 4.56 C95.07 11.15 96.81 16.45 96.7 25.39 C96.15 31.05 93.78 35.27 89.55 39.02 C83.38 43.34 79 44.66 71.63 44.63 C70.33 44.64 70.33 44.64 69.01 44.65 C66.16 44.68 63.32 44.68 60.47 44.68 C58.48 44.68 56.49 44.69 54.51 44.7 C50.34 44.71 46.18 44.72 42.02 44.71 C36.7 44.7 31.38 44.73 26.06 44.77 C21.95 44.8 17.85 44.8 13.74 44.8 C11.78 44.8 9.82 44.81 7.86 44.83 C-12.08 44.99 -12.08 44.99 -18.57 39.21 C-20.73 36.86 -20.73 36.86 -22.07 34.58 C-22.54 33.83 -23 33.07 -23.48 32.29 C-26.2 27.1 -26.23 21.94 -25.57 16.21 C-23.3 9.37 -18.83 4.69 -12.57 1.21 C-8.42 -0.02 -4.3 0.03 0 0 Z " fill="#FBFBFB" transform="translate(910.572998046875,249.791259765625)"/>
<path d="M0 0 C0.86 -0.01 1.72 -0.02 2.61 -0.03 C5.47 -0.05 8.32 -0.06 11.17 -0.06 C13.16 -0.07 15.15 -0.08 17.13 -0.09 C21.31 -0.11 25.48 -0.12 29.65 -0.12 C34.97 -0.12 40.3 -0.16 45.63 -0.21 C49.73 -0.24 53.84 -0.24 57.95 -0.25 C59.92 -0.25 61.88 -0.26 63.84 -0.28 C83.96 -0.48 83.96 -0.48 91.44 5.31 C93.7 7.66 93.7 7.66 95.01 9.93 C95.46 10.69 95.92 11.44 96.38 12.22 C99.13 17.64 99.47 23.65 97.83 29.49 C95.13 35.59 90.27 40.34 84.35 43.38 C80.5 44.61 76.83 44.6 72.83 44.6 C71.98 44.6 71.12 44.61 70.24 44.62 C67.41 44.64 64.59 44.64 61.77 44.64 C59.8 44.65 57.83 44.66 55.86 44.66 C51.73 44.67 47.61 44.68 43.48 44.68 C38.2 44.68 32.93 44.7 27.65 44.74 C23.59 44.76 19.52 44.76 15.45 44.76 C13.51 44.77 11.56 44.77 9.62 44.79 C6.89 44.81 4.17 44.8 1.44 44.79 C0.65 44.8 -0.15 44.81 -0.97 44.83 C-7.46 44.75 -12.67 42.85 -17.58 38.53 C-18.03 37.96 -18.47 37.39 -18.93 36.81 C-19.39 36.24 -19.86 35.67 -20.33 35.09 C-24.59 28.9 -24.36 22.65 -23.56 15.31 C-21.24 8.91 -16.42 4.91 -10.91 1.19 C-7.34 -0.15 -3.76 0 0 0 Z " fill="#FCFCFC" transform="translate(414.55712890625,249.693603515625)"/>
<g id="gpt-stick-rs-cap" transform="translate(0,0)"><path d="M0 0 C0.68 0.47 1.36 0.94 2.05 1.42 C16.85 12.89 26.87 32.45 29.73 50.69 C31.02 61.61 30.94 73.37 28 84 C27.54 85.72 27.54 85.72 27.07 87.46 C20.48 109.48 6.7 125.53 -13.14 136.78 C-19.24 139.97 -25.31 142.38 -32 144 C-32.65 144.17 -33.31 144.34 -33.98 144.51 C-39.47 145.86 -44.61 146.32 -50.25 146.25 C-51.08 146.24 -51.91 146.24 -52.76 146.23 C-76.76 145.81 -96.85 135.92 -113.51 118.87 C-128.73 101.34 -135.76 79.34 -134.23 56.27 C-131.98 33.82 -120.09 13.36 -102.78 -0.82 C-70.47 -24.87 -32.29 -22.5 0 0 Z M-106 14 C-106.59 14.58 -107.18 15.17 -107.79 15.77 C-120.9 29.68 -125.72 47.81 -125.46 66.41 C-125.22 73.6 -124.55 80.23 -122 87 C-121.47 88.48 -121.47 88.48 -120.93 89.99 C-113.47 109.37 -99.92 123.2 -81.42 132.27 C-63.58 139.99 -43.52 140.35 -25.44 133.31 C-6.42 125.49 8.6 111.5 16.71 92.46 C23.88 73.16 24.56 54.03 16.27 34.9 C10.17 21.6 1.79 11.73 -10 3 C-10.95 2.28 -10.95 2.28 -11.91 1.54 C-41.58 -19.04 -82.09 -10.54 -106 14 Z " fill="#090909" transform="translate(909,680)"/></g>
<g id="gpt-stick-ls-cap" transform="translate(0,0)"><path d="M0 0 C14.37 13.29 24.35 34.26 25.36 53.69 C25.99 74.95 20.24 96.03 6.09 112.4 C5.51 113.12 4.93 113.84 4.33 114.59 C-7.81 129.14 -27.04 139.38 -45.91 141.4 C-72.41 142.79 -93.84 137.23 -114.11 119.47 C-129.56 104.79 -138.78 83.53 -139.4 62.29 C-139.49 39.43 -131.79 18.66 -115.74 2.16 C-82.64 -30.12 -34.52 -28.94 0 0 Z M-67.45 -13.55 C-83.78 -12.48 -98.65 -2.81 -109.91 8.4 C-110.6 9.05 -111.28 9.7 -111.99 10.38 C-124.29 22.94 -130.95 40.69 -131.29 58.09 C-130.51 81.18 -122.23 99.05 -105.98 115.34 C-90.08 130.14 -70.31 134.17 -49.29 133.53 C-44.23 133.25 -39.66 132.1 -34.91 130.4 C-33.92 130.05 -32.93 129.69 -31.91 129.33 C-12.27 121.73 1.82 108.18 10.84 89.26 C18.19 72.45 19.27 50.98 12.57 33.77 C8.54 24.59 3.69 16.96 -2.91 9.4 C-3.43 8.78 -3.95 8.17 -4.48 7.54 C-15.49 -4.52 -32.7 -12.43 -48.91 -13.6 C-55.1 -13.81 -61.27 -13.67 -67.45 -13.55 Z " fill="#080808" transform="translate(455.91015625,467.6015625)"/></g>
<path d="M0 0 C3.62 3.62 4.25 6.47 4.44 11.44 C4.05 20.5 0.06 25.71 -6 32 C-6.53 32.55 -7.05 33.09 -7.6 33.66 C-9.41 35.53 -11.23 37.39 -13.06 39.25 C-13.65 39.85 -14.24 40.46 -14.85 41.08 C-22.29 48.53 -27.87 50.99 -38.4 51.33 C-47.07 50.23 -53.01 42.74 -59 37 C-59.93 36.12 -60.86 35.24 -61.82 34.34 C-68.45 27.94 -74.53 21.72 -75.31 12.19 C-75.25 7.8 -73.85 5.39 -71 2 C-67.01 -1.67 -63.02 -3.4 -58 -5.19 C-57.3 -5.45 -56.6 -5.71 -55.88 -5.97 C-38.65 -12.27 -15.38 -10.59 0 0 Z " fill="#FBFBFB" transform="translate(1033,457)"/>
<path d="M0 0 C5.27 3.06 9.58 7.36 13.94 11.56 C14.82 12.4 15.71 13.23 16.62 14.09 C23.5 20.73 29.86 27.28 30.38 37.25 C30.29 42.17 29.16 45.09 25.96 48.81 C22.08 52.17 17.74 53.89 12.94 55.56 C12.04 55.88 11.15 56.2 10.23 56.53 C-6.13 61.48 -24.44 59.21 -39.81 52.12 C-44.56 49.53 -47.33 46.76 -49.06 41.56 C-49.34 39.36 -49.34 39.36 -49.44 36.88 C-49.49 36.07 -49.54 35.26 -49.59 34.43 C-47.94 25.43 -39.94 18.95 -33.75 12.81 C-32.84 11.88 -31.93 10.95 -30.99 9.99 C-22.27 1.28 -12.61 -5.53 0 0 Z " fill="#F9F9F9" transform="translate(556.0625,764.4375)"/>
<path d="M0 0 C5.23 4.6 7.45 8.83 9.31 15.38 C9.63 16.44 9.63 16.44 9.96 17.52 C14.43 32.57 13.24 46.47 8.62 61.31 C8.25 62.6 8.25 62.6 7.87 63.91 C6.03 69.56 2.88 72.55 -1.69 76.12 C-6.21 78.13 -10.04 78.15 -14.62 76.51 C-21.9 73.07 -27.09 68.35 -32.69 62.62 C-33.99 61.35 -33.99 61.35 -35.31 60.06 C-41.39 53.93 -46.28 47.79 -48 39.18 C-47.62 24.51 -35.74 15.6 -26.05 5.76 C-18.65 -1.01 -9.58 -4.79 0 0 Z " fill="#FBFBFB" transform="translate(612.375,705.6875)"/>
<path d="M0 0 C4.67 2.32 8.33 6.01 12.05 9.6 C13.13 10.65 14.22 11.68 15.31 12.7 C17.2 14.48 19.07 16.27 20.94 18.06 C21.53 18.62 22.13 19.18 22.74 19.75 C28.01 24.92 31.64 30.99 32.12 38.5 C31.52 49.31 23.56 56.82 16.25 63.94 C15.34 64.86 14.43 65.78 13.49 66.73 C7.85 72.31 2.84 77.03 -5.16 78.59 C-10.71 78.52 -15.36 78.12 -19.44 74.06 C-29.13 59.35 -31.13 38.84 -27.72 21.79 C-25.35 12.98 -22.2 5.3 -14.44 0.06 C-10 -2.16 -4.63 -1.26 0 0 Z " fill="#FCFCFC" transform="translate(495.4375,705.9375)"/>
<path d="M0 0 C2.98 2.55 4.7 5.17 5.34 9.08 C5.51 18.85 1.08 24.39 -5.43 31.34 C-6.28 32.22 -7.13 33.1 -8 34 C-8.45 34.48 -8.91 34.96 -9.38 35.45 C-14.47 40.83 -19.22 45.82 -26 49 C-26.63 49.35 -27.25 49.7 -27.89 50.07 C-30.32 51.14 -32.1 51.33 -34.75 51.38 C-35.55 51.4 -36.35 51.43 -37.17 51.46 C-46.32 49.97 -52.07 43.52 -58.27 37.2 C-59.81 35.62 -61.38 34.06 -62.95 32.51 C-74.43 20.96 -74.43 20.96 -74.44 12 C-74.27 6.83 -73.78 3.78 -70 0 C-51.48 -14.37 -18.58 -12.43 0 0 Z " fill="#FCFCFC" transform="translate(580,674)"/>
<path d="M0 0 C7.3 3.94 9.49 10.27 12 17.81 C17.2 35.22 15.9 52.23 8.5 68.86 C6.09 73.24 3.55 76.39 -1.19 78.23 C-7.77 79.56 -13.13 78.05 -18.91 74.82 C-21.83 72.79 -23.86 70.53 -26.07 67.74 C-27.85 65.64 -29.65 63.76 -31.63 61.85 C-32.25 61.25 -32.88 60.64 -33.52 60.02 C-34.78 58.81 -36.04 57.61 -37.31 56.42 C-42.06 51.81 -44.72 47.88 -45.59 41.14 C-45.58 40.16 -45.57 39.18 -45.57 38.17 C-45.57 37.19 -45.58 36.21 -45.59 35.2 C-44.5 27.1 -38.58 21.89 -33.19 16.23 C-32.74 15.76 -32.29 15.28 -31.83 14.79 C-23.41 5.9 -13.35 -4.66 0 0 Z " fill="#FBFBFB" transform="translate(1063.19140625,487.765625)"/>
<path d="M0 0 C1.48 0.07 1.48 0.07 2.98 0.13 C12.02 2.19 18.19 9.33 24.5 15.69 C25.38 16.55 26.27 17.42 27.18 18.31 C32.84 23.98 38.27 29.51 38.69 37.94 C38.01 44.02 36.56 48.12 31.81 52.06 C18.77 61.06 -0.62 61.9 -15.91 59.54 C-19.68 58.7 -23.21 57.4 -26.75 55.88 C-27.54 55.56 -28.32 55.25 -29.13 54.93 C-34.54 52.55 -38.07 49.23 -40.75 43.88 C-40.99 41.77 -40.99 41.77 -41.06 39.25 C-41.1 38.43 -41.14 37.62 -41.18 36.77 C-39.85 27.74 -33.57 22.13 -27.32 16.04 C-25.81 14.56 -24.31 13.07 -22.81 11.57 C-15.66 4.49 -10.45 -0.62 0 0 Z " fill="#FCFCFC" transform="translate(1000.75,546.125)"/>
<path d="M0 0 C6.54 2.82 11.55 8.2 16.6 13.09 C17.93 14.38 19.29 15.64 20.64 16.89 C27.85 23.73 32.24 29.32 32.74 39.49 C32.94 48.59 27.27 54.37 21.3 60.64 C19.56 62.39 17.81 64.13 16.05 65.87 C15.17 66.76 14.3 67.64 13.39 68.56 C12.54 69.41 11.68 70.26 10.8 71.14 C10.03 71.91 9.26 72.67 8.47 73.46 C2.85 78.18 -1.97 79.07 -9.11 78.82 C-13.24 78.34 -15.03 77.48 -17.95 74.49 C-25.38 63.39 -27.47 52.87 -27.39 39.68 C-27.41 38.5 -27.43 37.32 -27.45 36.1 C-27.44 24.87 -25.23 13.4 -17.95 4.49 C-12.36 -0.58 -7.41 -1.93 0 0 Z " fill="#FBFBFB" transform="translate(946.94921875,488.5078125)"/>
<path d="M0 0 C6.94 4.64 12.08 12.56 13.75 20.75 C14.82 31.2 12.24 40.75 5.58 48.96 C-1.31 55.67 -9.66 58.74 -19.13 59.12 C-28.33 58.94 -35.53 54.88 -42.25 48.75 C-49.11 41.18 -50.85 33.24 -50.6 23.22 C-49.72 14.37 -45.78 7.7 -39.25 1.75 C-26.96 -7.6 -13.32 -7.38 0 0 Z " fill="#FBFBFB" transform="translate(617.25390625,506.25)"/>
<path d="M0 0 C7.32 5.19 13.32 11.95 15 21 C15.97 31.27 15.14 39.38 9 48 C3 54.96 -3.99 59.29 -13.17 60.38 C-23.37 60.76 -30.49 58.4 -38.31 51.88 C-45.76 44.61 -48.45 38.31 -48.62 28 C-48.5 18.63 -46.12 12.16 -39.75 5.19 C-28.79 -4.96 -13.21 -7.8 0 0 Z " fill="#FDFDFD" transform="translate(821,505)"/>
<path d="M0 0 C8.99 7.53 14.22 16.45 17.09 27.75 C17.36 31.07 17.36 31.07 17.38 34.52 C17.4 35.83 17.41 37.14 17.42 38.48 C17.43 39.89 17.43 41.3 17.43 42.71 C17.44 44.17 17.44 45.64 17.45 47.1 C17.46 50.17 17.47 53.24 17.46 56.3 C17.46 60.2 17.49 64.1 17.53 68.01 C17.55 71.03 17.55 74.06 17.55 77.09 C17.55 78.52 17.56 79.96 17.58 81.4 C17.68 91.8 17.04 101.49 10.03 109.69 C0.26 118.19 -12.21 117.41 -24.41 117.33 C-27.47 117.32 -30.52 117.35 -33.57 117.39 C-35.54 117.39 -37.5 117.39 -39.47 117.38 C-40.37 117.4 -41.27 117.41 -42.19 117.42 C-49.67 117.31 -56.19 115.09 -61.83 110.03 C-69.82 101.66 -69.38 91.51 -69.38 80.64 C-69.38 79.07 -69.39 77.5 -69.4 75.92 C-69.41 72.63 -69.41 69.34 -69.41 66.05 C-69.4 61.86 -69.43 57.67 -69.47 53.49 C-69.5 50.24 -69.5 46.99 -69.5 43.74 C-69.5 42.2 -69.51 40.65 -69.53 39.11 C-69.67 25.31 -66.71 13.99 -56.91 3.75 C-40.92 -11 -17.91 -12.94 0 0 Z M-53.91 12.75 C-58.9 20.26 -61.01 26.36 -61.08 35.36 C-61.1 36.68 -61.11 38 -61.12 39.36 C-61.13 40.79 -61.14 42.22 -61.14 43.65 C-61.15 44.38 -61.15 45.1 -61.16 45.85 C-61.18 49.69 -61.19 53.53 -61.2 57.37 C-61.21 61.33 -61.25 65.28 -61.29 69.23 C-61.31 72.28 -61.32 75.34 -61.32 78.39 C-61.33 79.85 -61.34 81.3 -61.36 82.76 C-61.61 93.45 -61.61 93.45 -56.91 102.75 C-52.99 106.29 -50.6 107.87 -45.37 107.93 C-44.43 107.94 -43.49 107.96 -42.52 107.97 C-40.98 107.98 -40.98 107.98 -39.42 107.99 C-38.37 108 -37.33 108.01 -36.25 108.02 C-34.02 108.03 -31.8 108.04 -29.58 108.05 C-26.18 108.07 -22.79 108.11 -19.4 108.15 C-17.24 108.16 -15.08 108.17 -12.92 108.18 C-11.91 108.2 -10.9 108.21 -9.85 108.23 C-4.04 108.21 -0.38 107.85 4.09 103.75 C7.62 99.27 8.6 96.33 8.64 90.65 C8.65 89.97 8.66 89.29 8.67 88.58 C8.7 86.33 8.7 84.09 8.7 81.84 C8.7 80.26 8.71 78.69 8.72 77.11 C8.74 73.81 8.74 70.5 8.73 67.2 C8.71 63 8.75 58.79 8.79 54.59 C8.82 51.33 8.82 48.07 8.82 44.82 C8.82 43.27 8.83 41.72 8.85 40.17 C8.99 28 6.7 18.63 -1.66 9.32 C-9.74 1.85 -18.62 -0.7 -29.39 -0.58 C-39.19 0.35 -47.57 5.32 -53.91 12.75 Z " fill="#0A0A0A" transform="translate(330.00625,259.99609375)"/>
<path d="M0 0 C11.4 6.61 17.81 14.87 21.51 27.49 C22.94 34.04 22.89 40.57 22.84 47.23 C22.85 48.74 22.85 50.25 22.86 51.75 C22.86 54.89 22.85 58.02 22.83 61.15 C22.81 65.15 22.82 69.14 22.85 73.13 C22.86 76.23 22.86 79.34 22.85 82.44 C22.85 83.91 22.85 85.38 22.86 86.85 C22.9 95.03 22.62 102.01 18.31 109.19 C17.78 110.09 17.24 111 16.69 111.94 C11.12 117.22 3.66 120.23 -3.99 120.4 C-4.83 120.42 -5.67 120.43 -6.54 120.45 C-10.4 120.51 -14.27 120.56 -18.13 120.59 C-20.15 120.61 -22.18 120.65 -24.2 120.7 C-46.86 121.22 -46.86 121.22 -55.69 114.19 C-62.18 106.97 -63.79 101.14 -63.85 91.51 C-63.86 90.21 -63.87 88.9 -63.88 87.55 C-63.88 86.13 -63.89 84.71 -63.89 83.3 C-63.89 82.58 -63.9 81.85 -63.9 81.11 C-63.91 77.29 -63.92 73.48 -63.93 69.66 C-63.93 65.74 -63.96 61.82 -63.99 57.91 C-64 54.87 -64.01 51.83 -64.01 48.8 C-64.01 47.36 -64.02 45.91 -64.04 44.47 C-64.16 29.61 -61.4 17.95 -51 6.94 C-46.35 2.48 -41.68 -0.49 -35.69 -2.81 C-34.75 -3.18 -33.81 -3.54 -32.85 -3.92 C-21.99 -6.98 -9.85 -5.14 0 0 Z M-46.69 14.19 C-52.62 21.87 -55.91 29.09 -55.98 38.91 C-55.99 40.21 -56 41.5 -56.02 42.84 C-56.02 44.23 -56.02 45.63 -56.02 47.03 C-56.03 48.48 -56.04 49.93 -56.04 51.38 C-56.06 54.41 -56.06 57.44 -56.06 60.47 C-56.06 64.34 -56.09 68.21 -56.12 72.08 C-56.14 75.07 -56.15 78.06 -56.14 81.06 C-56.15 82.48 -56.16 83.91 -56.17 85.33 C-56.25 93.34 -56.19 99.41 -51.69 106.19 C-47.86 109.74 -45.41 111.31 -40.24 111.35 C-39.32 111.36 -38.4 111.37 -37.45 111.38 C-36.45 111.38 -35.45 111.39 -34.42 111.39 C-32.88 111.4 -32.88 111.4 -31.31 111.41 C-29.14 111.42 -26.96 111.42 -24.79 111.43 C-21.46 111.44 -18.14 111.47 -14.82 111.5 C-12.71 111.51 -10.6 111.51 -8.48 111.52 C-7.49 111.53 -6.5 111.54 -5.48 111.55 C0.84 111.53 5.31 111.21 9.98 106.51 C15.44 99.7 15.14 92.6 15 84.22 C15 82.78 15 81.34 15 79.89 C15 76.88 14.97 73.87 14.93 70.86 C14.88 67.03 14.87 63.19 14.87 59.36 C14.87 56.38 14.85 53.41 14.83 50.43 C14.82 49.02 14.82 47.61 14.81 46.19 C14.77 34 13.4 23.71 5.31 14.19 C-2.17 6.81 -10.76 3.07 -21.25 2.69 C-31.32 3.06 -39.59 7.05 -46.69 14.19 Z " fill="#060606" transform="translate(1079.9875,260.0125)"/>
<path d="M0 0 C0.86 -0.01 1.72 -0.02 2.61 -0.03 C5.47 -0.05 8.32 -0.06 11.17 -0.06 C13.16 -0.07 15.15 -0.08 17.13 -0.09 C21.31 -0.11 25.48 -0.12 29.65 -0.12 C34.97 -0.12 40.3 -0.16 45.63 -0.21 C49.73 -0.24 53.84 -0.24 57.95 -0.25 C59.92 -0.25 61.88 -0.26 63.84 -0.28 C83.96 -0.48 83.96 -0.48 91.44 5.31 C93.7 7.66 93.7 7.66 95.01 9.93 C95.46 10.69 95.92 11.44 96.38 12.22 C99.13 17.64 99.47 23.65 97.83 29.49 C95.13 35.59 90.27 40.34 84.35 43.38 C80.5 44.61 76.83 44.6 72.83 44.6 C71.98 44.6 71.12 44.61 70.24 44.62 C67.41 44.64 64.59 44.64 61.77 44.64 C59.8 44.65 57.83 44.66 55.86 44.66 C51.73 44.67 47.61 44.68 43.48 44.68 C38.2 44.68 32.93 44.7 27.65 44.74 C23.59 44.76 19.52 44.76 15.45 44.76 C13.51 44.77 11.56 44.77 9.62 44.79 C6.89 44.81 4.17 44.8 1.44 44.79 C0.65 44.8 -0.15 44.81 -0.97 44.83 C-7.46 44.75 -12.67 42.85 -17.58 38.53 C-18.03 37.96 -18.47 37.39 -18.93 36.81 C-19.39 36.24 -19.86 35.67 -20.33 35.09 C-24.59 28.9 -24.36 22.65 -23.56 15.31 C-21.24 8.91 -16.42 4.91 -10.91 1.19 C-7.34 -0.15 -3.76 0 0 0 Z M-14.56 15.31 C-16.16 18.51 -15.91 21.82 -15.56 25.31 C-13.6 30.65 -10.64 33.76 -5.56 36.31 C-2.95 36.42 -0.36 36.47 2.25 36.48 C3.06 36.49 3.87 36.5 4.7 36.5 C7.38 36.52 10.05 36.53 12.73 36.54 C13.65 36.55 14.56 36.55 15.5 36.56 C20.35 36.58 25.2 36.59 30.04 36.6 C35.04 36.61 40.04 36.65 45.03 36.69 C48.88 36.71 52.73 36.72 56.58 36.72 C58.42 36.73 60.26 36.74 62.1 36.76 C64.69 36.78 67.27 36.78 69.86 36.78 C70.61 36.79 71.36 36.8 72.14 36.82 C77.65 36.76 81.8 35.3 86.44 32.31 C89.51 29.14 89.71 26.13 89.94 21.87 C89.84 18.12 89.55 15.7 87.19 12.74 C82.28 8.39 78.59 8 72.13 7.97 C71.29 7.96 70.46 7.95 69.6 7.93 C66.83 7.9 64.07 7.88 61.3 7.86 C60.36 7.86 59.41 7.85 58.44 7.84 C53.43 7.81 48.42 7.78 43.41 7.77 C38.25 7.75 33.09 7.7 27.92 7.63 C23.94 7.58 19.97 7.57 15.99 7.56 C14.08 7.56 12.18 7.54 10.28 7.51 C-3.96 6.84 -3.96 6.84 -14.56 15.31 Z " fill="#030303" transform="translate(414.55712890625,249.693603515625)"/>
<path d="M0 0 C1.3 -0.01 1.3 -0.01 2.62 -0.03 C5.47 -0.06 8.33 -0.08 11.19 -0.1 C12.17 -0.11 13.14 -0.11 14.15 -0.12 C19.33 -0.15 24.51 -0.18 29.69 -0.2 C33.96 -0.21 38.24 -0.25 42.52 -0.3 C47.69 -0.36 52.86 -0.39 58.03 -0.4 C60 -0.41 61.96 -0.43 63.93 -0.46 C82.49 -0.72 82.49 -0.72 88.88 4.56 C95.07 11.15 96.81 16.45 96.7 25.39 C96.15 31.05 93.78 35.27 89.55 39.02 C83.38 43.34 79 44.66 71.63 44.63 C70.33 44.64 70.33 44.64 69.01 44.65 C66.16 44.68 63.32 44.68 60.47 44.68 C58.48 44.68 56.49 44.69 54.51 44.7 C50.34 44.71 46.18 44.72 42.02 44.71 C36.7 44.7 31.38 44.73 26.06 44.77 C21.95 44.8 17.85 44.8 13.74 44.8 C11.78 44.8 9.82 44.81 7.86 44.83 C-12.08 44.99 -12.08 44.99 -18.57 39.21 C-20.73 36.86 -20.73 36.86 -22.07 34.58 C-22.54 33.83 -23 33.07 -23.48 32.29 C-26.2 27.1 -26.23 21.94 -25.57 16.21 C-23.3 9.37 -18.83 4.69 -12.57 1.21 C-8.42 -0.02 -4.3 0.03 0 0 Z M-15.95 15.02 C-17.93 18.91 -18.24 20.89 -17.57 25.21 C-15.25 30.38 -12.75 33.71 -7.57 36.21 C-4.71 36.5 -2.07 36.63 0.79 36.61 C1.62 36.62 2.45 36.63 3.31 36.63 C6.04 36.65 8.78 36.65 11.52 36.64 C13.42 36.65 15.33 36.65 17.24 36.66 C21.23 36.67 25.22 36.66 29.22 36.65 C34.33 36.64 39.44 36.66 44.55 36.69 C48.49 36.71 52.43 36.71 56.36 36.71 C58.25 36.7 60.13 36.71 62.02 36.72 C64.66 36.74 67.29 36.73 69.93 36.71 C70.71 36.72 71.48 36.73 72.28 36.74 C77.48 36.67 80.41 35.47 84.43 32.21 C87.32 28.91 88.32 26.3 88.74 21.9 C88.36 17.44 87.29 15.6 84.43 12.21 C79.69 8.33 75.89 7.63 69.95 7.69 C69.12 7.68 68.29 7.68 67.43 7.67 C64.7 7.65 61.97 7.66 59.24 7.68 C57.33 7.67 55.43 7.67 53.52 7.67 C49.54 7.66 45.55 7.67 41.56 7.69 C36.46 7.71 31.35 7.7 26.25 7.67 C22.32 7.66 18.38 7.66 14.45 7.67 C12.57 7.68 10.69 7.67 8.8 7.66 C6.17 7.65 3.54 7.67 0.91 7.69 C0.13 7.68 -0.64 7.67 -1.44 7.67 C-8.07 7.77 -11.73 10.03 -15.95 15.02 Z " fill="#030303" transform="translate(910.572998046875,249.791259765625)"/>
<path d="M0 0 C1.48 0.07 1.48 0.07 2.98 0.13 C12.02 2.19 18.19 9.33 24.5 15.69 C25.38 16.55 26.27 17.42 27.18 18.31 C32.84 23.98 38.27 29.51 38.69 37.94 C38.01 44.02 36.56 48.12 31.81 52.06 C18.77 61.06 -0.62 61.9 -15.91 59.54 C-19.68 58.7 -23.21 57.4 -26.75 55.88 C-27.54 55.56 -28.32 55.25 -29.13 54.93 C-34.54 52.55 -38.07 49.23 -40.75 43.88 C-40.99 41.77 -40.99 41.77 -41.06 39.25 C-41.1 38.43 -41.14 37.62 -41.18 36.77 C-39.85 27.74 -33.57 22.13 -27.32 16.04 C-25.81 14.56 -24.31 13.07 -22.81 11.57 C-15.66 4.49 -10.45 -0.62 0 0 Z M-10.55 11.89 C-11.24 12.53 -11.92 13.16 -12.63 13.82 C-13.33 14.5 -14.03 15.18 -14.75 15.88 C-15.45 16.54 -16.14 17.21 -16.86 17.9 C-18.97 19.96 -21.05 22.04 -23.12 24.12 C-23.84 24.83 -24.55 25.54 -25.28 26.27 C-26.3 27.29 -26.3 27.29 -27.34 28.33 C-27.94 28.94 -28.55 29.55 -29.18 30.18 C-31.72 32.93 -32.71 34.55 -33.12 38.31 C-32.68 42.57 -31.99 43.22 -28.75 45.88 C-25.75 47.39 -25.75 47.39 -22.44 48.56 C-21.35 48.98 -20.26 49.4 -19.14 49.82 C-5.41 54.08 10.97 53.04 23.94 46.81 C27.2 45.09 27.2 45.09 29.25 42.88 C30.13 39.11 30.14 35.45 28.21 32.03 C26.34 29.84 24.32 27.88 22.25 25.88 C21.03 24.62 19.8 23.37 18.59 22.11 C17.25 20.74 15.9 19.37 14.56 18 C13.91 17.33 13.26 16.67 12.58 15.98 C11.95 15.35 11.32 14.72 10.68 14.07 C10.11 13.5 9.55 12.94 8.97 12.35 C4.95 8.9 1.15 8.22 -4.04 8.4 C-7.16 8.95 -8.27 9.75 -10.55 11.89 Z " fill="#080808" transform="translate(1000.75,546.125)"/>
<path d="M0 0 C2.98 2.55 4.7 5.17 5.34 9.08 C5.51 18.85 1.08 24.39 -5.43 31.34 C-6.28 32.22 -7.13 33.1 -8 34 C-8.45 34.48 -8.91 34.96 -9.38 35.45 C-14.47 40.83 -19.22 45.82 -26 49 C-26.63 49.35 -27.25 49.7 -27.89 50.07 C-30.32 51.14 -32.1 51.33 -34.75 51.38 C-35.55 51.4 -36.35 51.43 -37.17 51.46 C-46.32 49.97 -52.07 43.52 -58.27 37.2 C-59.81 35.62 -61.38 34.06 -62.95 32.51 C-74.43 20.96 -74.43 20.96 -74.44 12 C-74.27 6.83 -73.78 3.78 -70 0 C-51.48 -14.37 -18.58 -12.43 0 0 Z M-58 3 C-58.85 3.35 -59.7 3.7 -60.57 4.06 C-63.46 5.51 -65.54 6.73 -66.67 9.86 C-67 13.98 -66.54 16.26 -64.07 19.65 C-61.38 22.51 -58.57 25.21 -55.69 27.88 C-54.7 28.82 -53.71 29.76 -52.73 30.71 C-50.92 32.44 -49.1 34.16 -47.27 35.87 C-45.93 37.13 -44.6 38.41 -43.32 39.72 C-40.92 42.04 -38.97 42.18 -35.75 42.25 C-34.63 42.29 -34.63 42.29 -33.48 42.33 C-27.84 41.58 -23.96 38.34 -20.07 34.4 C-19.2 33.52 -18.32 32.64 -17.41 31.72 C-16.51 30.8 -15.61 29.89 -14.69 28.94 C-13.31 27.55 -13.31 27.55 -11.9 26.14 C-5.71 20.38 -5.71 20.38 -3.62 12.62 C-3.58 11.85 -3.53 11.08 -3.48 10.29 C-4.28 6.8 -6.02 5.9 -9 4 C-24.7 -2.59 -42.16 -3.82 -58 3 Z " fill="#080808" transform="translate(580,674)"/>
<path d="M0 0 C4.67 2.32 8.33 6.01 12.05 9.6 C13.13 10.65 14.22 11.68 15.31 12.7 C17.2 14.48 19.07 16.27 20.94 18.06 C21.53 18.62 22.13 19.18 22.74 19.75 C28.01 24.92 31.64 30.99 32.12 38.5 C31.52 49.31 23.56 56.82 16.25 63.94 C15.34 64.86 14.43 65.78 13.49 66.73 C7.85 72.31 2.84 77.03 -5.16 78.59 C-10.71 78.52 -15.36 78.12 -19.44 74.06 C-29.13 59.35 -31.13 38.84 -27.72 21.79 C-25.35 12.98 -22.2 5.3 -14.44 0.06 C-10 -2.16 -4.63 -1.26 0 0 Z M-14.38 10.07 C-21.48 23.44 -22.79 41.59 -18.44 56.06 C-15.98 64.11 -15.98 64.11 -10.44 70.06 C-6.59 70.73 -4.91 70.35 -1.55 68.32 C1.41 66.17 3.91 63.96 6.49 61.37 C7.37 60.49 8.25 59.61 9.15 58.7 C10.05 57.79 10.95 56.88 11.88 55.94 C12.79 55.02 13.71 54.1 14.66 53.15 C21.05 47.1 21.05 47.1 23.06 38.94 C23.13 38.03 23.21 37.12 23.28 36.18 C22.16 31.32 18.96 28.58 15.56 25.06 C14.89 24.33 14.23 23.6 13.54 22.85 C11.45 20.57 9.33 18.35 7.19 16.12 C6.48 15.36 5.78 14.59 5.05 13.8 C0.76 9.38 -2.25 7.17 -8.5 6.84 C-11.08 7.14 -12.73 8.05 -14.38 10.07 Z " fill="#070707" transform="translate(495.4375,705.9375)"/>
<path d="M0 0 C3.62 3.62 4.25 6.47 4.44 11.44 C4.05 20.5 0.06 25.71 -6 32 C-6.53 32.55 -7.05 33.09 -7.6 33.66 C-9.41 35.53 -11.23 37.39 -13.06 39.25 C-13.65 39.85 -14.24 40.46 -14.85 41.08 C-22.29 48.53 -27.87 50.99 -38.4 51.33 C-47.07 50.23 -53.01 42.74 -59 37 C-59.93 36.12 -60.86 35.24 -61.82 34.34 C-68.45 27.94 -74.53 21.72 -75.31 12.19 C-75.25 7.8 -73.85 5.39 -71 2 C-67.01 -1.67 -63.02 -3.4 -58 -5.19 C-57.3 -5.45 -56.6 -5.71 -55.88 -5.97 C-38.65 -12.27 -15.38 -10.59 0 0 Z M-66 8 C-66.72 12.55 -67.04 15.4 -64.48 19.33 C-62.57 21.47 -60.59 23.51 -58.52 25.51 C-56.8 27.2 -55.13 28.93 -53.46 30.68 C-52.23 31.95 -50.99 33.23 -49.75 34.5 C-49.16 35.11 -48.57 35.72 -47.96 36.35 C-43.76 40.59 -40.64 42.71 -34.56 43.38 C-28.34 42.72 -24.36 38.61 -20.07 34.3 C-19.2 33.42 -18.32 32.54 -17.41 31.64 C-16.51 30.73 -15.61 29.81 -14.69 28.88 C-13.77 27.96 -12.85 27.04 -11.9 26.09 C-5.71 20.36 -5.71 20.36 -3.56 12.62 C-3.64 9.04 -3.65 8.35 -6.25 5.69 C-22.39 -2.69 -51.65 -6.35 -66 8 Z " fill="#070707" transform="translate(1033,457)"/>
<path d="M0 0 C7.3 3.94 9.49 10.27 12 17.81 C17.2 35.22 15.9 52.23 8.5 68.86 C6.09 73.24 3.55 76.39 -1.19 78.23 C-7.77 79.56 -13.13 78.05 -18.91 74.82 C-21.83 72.79 -23.86 70.53 -26.07 67.74 C-27.85 65.64 -29.65 63.76 -31.63 61.85 C-32.25 61.25 -32.88 60.64 -33.52 60.02 C-34.78 58.81 -36.04 57.61 -37.31 56.42 C-42.06 51.81 -44.72 47.88 -45.59 41.14 C-45.58 40.16 -45.57 39.18 -45.57 38.17 C-45.57 37.19 -45.58 36.21 -45.59 35.2 C-44.5 27.1 -38.58 21.89 -33.19 16.23 C-32.74 15.76 -32.29 15.28 -31.83 14.79 C-23.41 5.9 -13.35 -4.66 0 0 Z M-27.07 21.86 C-28.2 22.98 -28.2 22.98 -29.36 24.13 C-30.45 25.22 -30.45 25.22 -31.56 26.34 C-32.21 26.99 -32.86 27.64 -33.53 28.31 C-36.77 32.05 -37.43 34.99 -37.65 39.94 C-36.12 47.55 -30.13 52.72 -24.82 57.92 C-24.07 58.67 -23.33 59.41 -22.57 60.18 C-15.83 67.21 -15.83 67.21 -7.07 70.67 C-3.71 70.16 -2.65 69.53 -0.19 67.23 C7.38 54.13 8.14 37.63 5.04 23.02 C3.46 17.53 1.48 12.64 -2.19 8.23 C-11.94 3.36 -20.94 15.67 -27.07 21.86 Z " fill="#070707" transform="translate(1063.19140625,487.765625)"/>
<path d="M0 0 C5.23 4.6 7.45 8.83 9.31 15.38 C9.63 16.44 9.63 16.44 9.96 17.52 C14.43 32.57 13.24 46.47 8.62 61.31 C8.25 62.6 8.25 62.6 7.87 63.91 C6.03 69.56 2.88 72.55 -1.69 76.12 C-6.21 78.13 -10.04 78.15 -14.62 76.51 C-21.9 73.07 -27.09 68.35 -32.69 62.62 C-33.99 61.35 -33.99 61.35 -35.31 60.06 C-41.39 53.93 -46.28 47.79 -48 39.18 C-47.62 24.51 -35.74 15.6 -26.05 5.76 C-18.65 -1.01 -9.58 -4.79 0 0 Z M-23.38 15.31 C-24.51 16.42 -25.65 17.53 -26.8 18.63 C-27.97 19.77 -29.14 20.92 -30.31 22.06 C-30.87 22.6 -31.42 23.15 -32 23.71 C-35.95 27.65 -39.12 30.99 -39.75 36.75 C-39.09 42.99 -36.19 46.88 -31.81 51.2 C-30.93 52.08 -30.05 52.95 -29.15 53.85 C-27.78 55.19 -27.78 55.19 -26.38 56.56 C-25.46 57.47 -24.54 58.38 -23.6 59.32 C-17.35 66.14 -17.35 66.14 -8.94 68.81 C-5.43 68.69 -4.7 68.62 -2.06 66.12 C5.19 52.21 6.89 35.12 2.62 20.12 C0.1 12.07 0.1 12.07 -5.38 6.31 C-14.03 4.77 -17.58 9.41 -23.38 15.31 Z " fill="#070707" transform="translate(612.375,705.6875)"/>
<path d="M0 0 C6.54 2.82 11.55 8.2 16.6 13.09 C17.93 14.38 19.29 15.64 20.64 16.89 C27.85 23.73 32.24 29.32 32.74 39.49 C32.94 48.59 27.27 54.37 21.3 60.64 C19.56 62.39 17.81 64.13 16.05 65.87 C15.17 66.76 14.3 67.64 13.39 68.56 C12.54 69.41 11.68 70.26 10.8 71.14 C10.03 71.91 9.26 72.67 8.47 73.46 C2.85 78.18 -1.97 79.07 -9.11 78.82 C-13.24 78.34 -15.03 77.48 -17.95 74.49 C-25.38 63.39 -27.47 52.87 -27.39 39.68 C-27.41 38.5 -27.43 37.32 -27.45 36.1 C-27.44 24.87 -25.23 13.4 -17.95 4.49 C-12.36 -0.58 -7.41 -1.93 0 0 Z M-12.76 10.68 C-20.52 22.4 -20.66 38.28 -18.6 51.75 C-17.2 58.61 -15.02 65.42 -9.95 70.49 C-4.81 70.89 -2.16 70.4 2.05 67.49 C3.78 65.93 5.46 64.32 7.1 62.68 C8.02 61.75 8.95 60.82 9.91 59.86 C10.38 59.38 10.86 58.9 11.35 58.4 C12.81 56.93 14.27 55.46 15.74 53.99 C22.19 48.15 22.19 48.15 24.3 40.24 C24.34 39.12 24.34 39.12 24.38 37.98 C23.63 32.33 20.39 28.46 16.45 24.57 C15.57 23.69 14.69 22.81 13.78 21.9 C12.86 21.01 11.94 20.11 10.99 19.18 C10.06 18.26 9.14 17.34 8.19 16.4 C2.45 10.23 2.45 10.23 -5.26 8.05 C-8.92 8.14 -9.75 8.33 -12.76 10.68 Z " fill="#080808" transform="translate(946.94921875,488.5078125)"/>
<path d="M0 0 C5.27 3.06 9.58 7.36 13.94 11.56 C14.82 12.4 15.71 13.23 16.62 14.09 C23.5 20.73 29.86 27.28 30.38 37.25 C30.29 42.17 29.16 45.09 25.96 48.81 C22.08 52.17 17.74 53.89 12.94 55.56 C12.04 55.88 11.15 56.2 10.23 56.53 C-6.13 61.48 -24.44 59.21 -39.81 52.12 C-44.56 49.53 -47.33 46.76 -49.06 41.56 C-49.34 39.36 -49.34 39.36 -49.44 36.88 C-49.49 36.07 -49.54 35.26 -49.59 34.43 C-47.94 25.43 -39.94 18.95 -33.75 12.81 C-32.84 11.88 -31.93 10.95 -30.99 9.99 C-22.27 1.28 -12.61 -5.53 0 0 Z M-30.94 21.19 C-31.59 21.83 -32.25 22.48 -32.92 23.14 C-38.94 29.18 -38.94 29.18 -41.56 37.12 C-41.37 40.6 -41.37 40.6 -39.19 42.75 C-25.96 50.42 -10.78 52.76 4.19 49.38 C10.46 47.61 17.25 45.25 21.94 40.56 C22.47 37.22 22.62 34.72 20.86 31.73 C16.88 26.55 12.56 21.85 7.94 17.25 C7.25 16.55 6.57 15.85 5.86 15.12 C1.04 10.3 -2.97 7.07 -9.88 5.94 C-18.58 6.41 -25.12 15.46 -30.94 21.19 Z " fill="#060606" transform="translate(556.0625,764.4375)"/>
<path d="M0 0 C7.32 5.19 13.32 11.95 15 21 C15.97 31.27 15.14 39.38 9 48 C3 54.96 -3.99 59.29 -13.17 60.38 C-23.37 60.76 -30.49 58.4 -38.31 51.88 C-45.76 44.61 -48.45 38.31 -48.62 28 C-48.5 18.63 -46.12 12.16 -39.75 5.19 C-28.79 -4.96 -13.21 -7.8 0 0 Z M-34.81 12.88 C-39.57 18.69 -40.49 23.85 -40.3 31.26 C-39.48 38.66 -35.54 42.9 -30 47.55 C-23.75 52.07 -17.53 51.66 -10 51 C-3.27 49.3 1.09 44.53 5 39 C7.69 33.74 7.77 27.79 7 22 C4.48 14.8 -0.47 9.25 -7.29 5.86 C-18.28 2.36 -27.18 4.74 -34.81 12.88 Z " fill="#090909" transform="translate(821,505)"/>
<path d="M0 0 C6.94 4.64 12.08 12.56 13.75 20.75 C14.82 31.2 12.24 40.75 5.58 48.96 C-1.31 55.67 -9.66 58.74 -19.13 59.12 C-28.33 58.94 -35.53 54.88 -42.25 48.75 C-49.11 41.18 -50.85 33.24 -50.6 23.22 C-49.72 14.37 -45.78 7.7 -39.25 1.75 C-26.96 -7.6 -13.32 -7.38 0 0 Z M-37.09 12.05 C-41.6 18.53 -43.23 23.85 -42.25 31.75 C-39.7 39.57 -35.31 44.47 -28.52 48.88 C-22.36 51.25 -13.46 51.04 -7.34 48.58 C-1.27 44.64 3.17 39.96 4.75 32.75 C5.46 23.73 4.75 18 -0.5 10.56 C-6.14 4.8 -10.13 3.31 -18.13 3.12 C-26.61 3.2 -31.79 5.42 -37.09 12.05 Z " fill="#090909" transform="translate(617.25390625,506.25)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C-6.25 9.25 -14.5 17.5 -23 26 C-23.66 25.67 -24.32 25.34 -25 25 C-6.76 4.82 -6.76 4.82 0 0 Z " fill="#181818" transform="translate(1045,490)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C-0.64 3.64 -3.28 6.28 -6 9 C-6.66 8.67 -7.32 8.34 -8 8 C-3.38 2.25 -3.38 2.25 0 0 Z " fill="#E0E0E0" transform="translate(1039.3,269.2)"/>
<path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C0.88 2.17 -0.25 3.34 -1.38 4.5 C-2 5.15 -2.63 5.8 -3.27 6.47 C-5 8 -5 8 -7 8 C-5.51 4.2 -3.24 2.39 0 0 Z " fill="#1F1F1F" transform="translate(896,252)"/>
<path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C2.53 1.35 2.05 1.7 1.56 2.06 C-0.68 4.84 -0.67 7.51 -1 11 C-1.33 11 -1.66 11 -2 11 C-2.05 9.54 -2.09 8.08 -2.12 6.62 C-2.16 5.41 -2.16 5.41 -2.2 4.16 C-2 2 -2 2 0 0 Z " fill="#E5E5E5" transform="translate(969,463)"/>
<g id="gpt-marks">
<circle id="gpt-mark-ls" cx="399" cy="528" r="70" fill="none" opacity="0"/>
<circle id="gpt-mark-rs" cx="857" cy="744" r="70" fill="none" opacity="0"/>
<ellipse id="gpt-mark-y" cx="998" cy="478" rx="38" ry="29" fill="none" opacity="0"/>
<ellipse id="gpt-mark-b" cx="1048" cy="526" rx="29" ry="38" fill="none" opacity="0"/>
<ellipse id="gpt-mark-x" cx="950" cy="528" rx="28" ry="38" fill="none" opacity="0"/>
<ellipse id="gpt-mark-a" cx="1000" cy="576" rx="38" ry="28" fill="none" opacity="0"/>
<ellipse id="gpt-mark-up" cx="546" cy="694" rx="38" ry="29" fill="none" opacity="0"/>
<ellipse id="gpt-mark-right" cx="595" cy="744" rx="29" ry="38" fill="none" opacity="0"/>
<ellipse id="gpt-mark-left" cx="497" cy="744" rx="29" ry="38" fill="none" opacity="0"/>
<ellipse id="gpt-mark-down" cx="546" cy="793" rx="38" ry="29" fill="none" opacity="0"/>
<circle id="gpt-mark-view" cx="599" cy="533" r="31" fill="none" opacity="0"/>
<circle id="gpt-mark-menu" cx="804" cy="533" r="31" fill="none" opacity="0"/>
<rect id="gpt-mark-lt" x="269" y="259" width="70" height="110" rx="35" fill="none" opacity="0"/>
<rect id="gpt-mark-rt" x="1024" y="262" width="70" height="110" rx="35" fill="none" opacity="0"/>
<rect id="gpt-mark-lb" x="397" y="252" width="110" height="40" rx="18" fill="none" opacity="0"/>
<rect id="gpt-mark-rb" x="891" y="252" width="110" height="40" rx="18" fill="none" opacity="0"/>
</g>
</svg>
                    </div>
                `;
                box.querySelector('#gpt-close').onclick = () => window.hideSharedPopup();
                window.showSharedPopup('gamepad-tester', box);

                // 버튼 index → 오버레이 id 매핑 (xbox_skeleton.svg 좌표 분석 기준)
                const btnMap = {
                    0: 'gpt-mark-a', 1: 'gpt-mark-b', 2: 'gpt-mark-x', 3: 'gpt-mark-y',
                    4: 'gpt-mark-lb', 5: 'gpt-mark-rb',
                    8: 'gpt-mark-view', 9: 'gpt-mark-menu',
                    12: 'gpt-mark-up', 13: 'gpt-mark-down', 14: 'gpt-mark-left', 15: 'gpt-mark-right'
                };
                let connected = false;
                const STICK_DEADZONE = 0.15;
                const STICK_MOVE_RANGE = 34; // svg 좌표계(1378 기준) 안에서 캡이 움직이는 최대 거리

                function mark(id, on) {
                    const el = box.querySelector('#' + id);
                    if (!el) return;
                    el.setAttribute('fill', on ? '#000' : 'none');
                    el.setAttribute('opacity', on ? '0.85' : '0');
                }

                function moveStick(capId, x, y) {
                    const g = box.querySelector('#' + capId);
                    if (!g) return;
                    g.setAttribute('transform', `translate(${(x * STICK_MOVE_RANGE).toFixed(1)},${(y * STICK_MOVE_RANGE).toFixed(1)})`);
                }

                function gpTesterLoop() {
                    if (!document.body.contains(box)) return; // 팝업이 다른 내용으로 교체/닫힘 → 루프 자동 종료
                    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
                    const gp = pads[0];
                    const statusEl = box.querySelector('#gpt-status');
                    if (gp) {
                        if (!connected) { connected = true; if (statusEl) statusEl.textContent = '✅ ' + gp.id; }
                        for (const idx in btnMap) {
                            mark(btnMap[idx], gp.buttons[idx] && gp.buttons[idx].pressed);
                        }
                        mark('gpt-mark-lt', gp.buttons[6] && gp.buttons[6].value > 0.5);
                        mark('gpt-mark-rt', gp.buttons[7] && gp.buttons[7].value > 0.5);

                        const lx = gp.axes[0] || 0, ly = gp.axes[1] || 0;
                        const rx = gp.axes[2] || 0, ry = gp.axes[3] || 0;
                        const lsTilted = Math.abs(lx) > STICK_DEADZONE || Math.abs(ly) > STICK_DEADZONE;
                        const rsTilted = Math.abs(rx) > STICK_DEADZONE || Math.abs(ry) > STICK_DEADZONE;
                        const lsClicked = gp.buttons[10] && gp.buttons[10].pressed;
                        const rsClicked = gp.buttons[11] && gp.buttons[11].pressed;
                        mark('gpt-mark-ls', lsTilted || lsClicked);
                        mark('gpt-mark-rs', rsTilted || rsClicked);
                        moveStick('gpt-stick-ls-cap', lx, ly);
                        moveStick('gpt-stick-rs-cap', rx, ry);
                    } else if (connected) {
                        connected = false;
                        if (statusEl) statusEl.textContent = '컨트롤러의 아무 버튼이나 눌러 연결하세요';
                        moveStick('gpt-stick-ls-cap', 0, 0);
                        moveStick('gpt-stick-rs-cap', 0, 0);
                    }
                    requestAnimationFrame(gpTesterLoop);
                }
                requestAnimationFrame(gpTesterLoop);
            };

            window.openGamepadGuideOverlay = function() {
                const box = document.createElement('div');
                box.style.cssText = `background:#1e1e2e; color:#e2e8f0; border-radius:16px; padding:16px; width:100%; box-sizing:border-box; max-height:90vh; overflow-y:auto; box-shadow:0 10px 50px rgba(0,0,0,0.7); pointer-events:auto; display:flex; flex-direction:column;`;
                box.innerHTML = `
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; gap:10px;">
                        <span style="font-size:16px; font-weight:700;">🎮 D-PAD 기능 변경점 설명</span>
                        <button id="gp-close" style="width:28px; height:28px; border:none; border-radius:5px; background:#3b0000; border:1px solid #ef4444; color:#ef4444; font-size:16px; cursor:pointer;">✕</button>
                    </div>
                    <img src="https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/ego_trippin/xbox_binding.jpg"
                         style="border-radius:8px; display:block; width:100%; height:auto;" />
                `;
                box.querySelector('#gp-close').onclick = () => window.hideSharedPopup();
                window.showSharedPopup('gamepad-guide', box);
            };

            window.openTipsOverlay = function() {
                const T = getNbTheme();
                const box = document.createElement('div');
                box.style.cssText = `
                    background:${T.card}; color:${T.text}; border-radius:18px;
                    border:1.5px solid #f59e0b; padding:28px 32px 24px 32px;
                    width:100%; box-sizing:border-box; max-height:80vh; overflow-y:auto;
                    position:relative; box-shadow:0 10px 50px rgba(0,0,0,0.7); pointer-events:auto;
                `;
                const tipsTitle = document.createElement('div');
                tipsTitle.textContent = 'SW 설정';
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
                tipsClose.onclick = () => {
                    window.hideSharedPopup();
                    if (window._neubieRouletteCard) window._neubieRouletteCard.style.outline = 'none';
                };

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
                        background:${T.bg === '#111111' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'};
                        border:1px solid ${T.border}; border-radius:12px;
                        padding:13px 16px; gap:12px;
                    `;
                    const rowTitle = document.createElement('span');
                    rowTitle.textContent = item.title;
                    rowTitle.style.cssText = `font-size:14px; font-weight:600; color:${T.text}; flex:1;`;
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
                box.appendChild(tipsClose);
                box.appendChild(tipsTitle);
                box.appendChild(tipsContent);
                window.showSharedPopup('tips', box);
            };

			// 그 외 페이지는 기존 대시보드
			const sharedPopupEl = document.getElementById('neubie-shared-popup');
			const scheduleOverlayEl = document.getElementById('neubie-schedule-overlay');
              const isAnyOpen = (dashboard.style.display === 'block' || 
              batteryPopup.style.display === 'block' ||
              (sharedPopupEl && sharedPopupEl.style.display === 'flex') ||
              (scheduleOverlayEl && scheduleOverlayEl.style.display === 'flex') ||
              !!document.getElementById('neubie-troubleshoot-overlay'));
			
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

	let neubieInterventionEntry = { time: null, scenario: null };

    let lastUrl = location.href;

    // 브라우저의 뒤로가기/앞으로가기 대응 (이벤트 발생 시에만)
    window.addEventListener('popstate', () => {
        closeAllPopups();
    });

    // 화면 어디든 클릭했을 때 주소 확인
    // NCC에서 메뉴를 클릭해 이동 시 즉각 닫히게
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
                state.isMapOpt = computeIsMapOpt();
                // 맵 최적화 재적용/해제 — 타겟 여부와 무관하게 항상 호출 (비타겟이면 함수 내부에서 스타일을 비움)
                injectMapStyle();
                setTimeout(() => injectMapStyle(), 1000);
                setTimeout(() => injectMapStyle(), 3000);
                setTimeout(() => injectMapStyle(), 6000);
				
				setTimeout(() => patchDrivingPageLayout(), 1500);
                setTimeout(() => patchDrivingPageLayout(), 3000);
				setTimeout(() => patchDrivingPageLayout(), 6000);
                setTimeout(() => initDriveTheme(), 1500);  
                setTimeout(() => initDriveTheme(), 3000);

                if (/\/driving\/\d+/.test(location.pathname)) {
                    _startOperatorWatch();
					setTimeout(() => captureInterventionEntry(), 1500);
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

            state.isMapOpt = computeIsMapOpt();
            // 맵 최적화 재적용/해제 — 타겟 여부와 무관하게 항상 호출 (비타겟이면 함수 내부에서 스타일을 비움)
            injectMapStyle();
            setTimeout(() => injectMapStyle(), 1000);
            setTimeout(() => injectMapStyle(), 3000);
            setTimeout(() => injectMapStyle(), 6000);
			
			setTimeout(() => patchDrivingPageLayout(), 1500);
            setTimeout(() => patchDrivingPageLayout(), 3000);
			setTimeout(() => patchDrivingPageLayout(), 6000);
            setTimeout(() => initDriveTheme(), 1500); 
            setTimeout(() => initDriveTheme(), 3000);

            if (/\/driving\/\d+/.test(location.pathname)) {
                _startOperatorWatch();
				setTimeout(() => captureInterventionEntry(), 1500);
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
		214: '진천 힐사이드 캠핑장 1호기',
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
	
	// ── 개입 카드 진입 정보 캡처 + 표시 ──
    function captureInterventionEntry() {
        if (!/\/driving\/\d+/.test(location.pathname)) return;
        const scenarioEl = document.querySelector('.max-w-190.font-size-14.truncate.font-medium.text-mono-800');
        neubieInterventionEntry = {
            time: Date.now(),
            scenario: scenarioEl ? scenarioEl.textContent.trim() : null
        };
    }

    function showInterventionInfoOverlay() {
        const entry = neubieInterventionEntry;
        if (!entry.time) return;

        document.getElementById('neubie-intervention-info')?.remove();
        const panel = document.createElement('div');
        panel.id = 'neubie-intervention-info';
        panel.style.cssText = `
            position:fixed; top:4px; left:50%; transform:translateX(-50%);
            z-index:999999; pointer-events:none;
            display:flex; align-items:center; gap:20px;
            background:rgba(18,18,36,0.95); border:1px solid #6a6aaa; border-radius:14px;
            padding:12px 28px; font-family:'Pretendard','Noto Sans KR',sans-serif;
            color:#e2e8f0; white-space:nowrap; box-shadow:0 4px 20px rgba(0,0,0,0.5);
        `;
        const timeStr = new Date(entry.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        panel.innerHTML = `
            <div style="text-align:center;">
                <div style="font-size:11px; color:#aab; margin-bottom:2px;">진입 시각</div>
                <div style="font-size:16px; font-weight:700;">${timeStr}</div>
            </div>
            <div style="width:1px; height:28px; background:#3a3a5a;"></div>
            <div style="text-align:center;">
                <div style="font-size:11px; color:#aab; margin-bottom:2px;">진입 당시 시나리오</div>
                <div style="font-size:15px; font-weight:600; color:#ffd080;">${entry.scenario || '(확인 안 됨)'}</div>
            </div>
        `;
        document.body.appendChild(panel);
        setTimeout(() => panel.remove(), 3000);
    }
	
	// ── 개입 페이지 레이아웃 ──
    function patchDrivingPageLayout() {
        if (!location.href.includes('/remote/multiple/driving/')) return;

        // 구버전 전용 마커 확인 — 신버전(리뉴얼)이면 이 패치 전체를 건너뜀
        // (header 태그나 범용 flex 유틸만으로는 신/구 구분이 안 돼서, 구버전에만 있는 고유 클래스로 게이트)
        const isLegacyLayout = document.querySelector('.rounded-8.flex.flex-row.items-center.justify-between.truncate.bg-red-50.px-8')
                             || document.querySelector('.relative.overflow-hidden.w-full.h-58');
        if (!isLegacyLayout) return;

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

		// 예외 사용자('최정기')는 상태바 재배치(위로 올리기)만 건너뜀 — 다음 개입 요청 자동 OFF / 지도(레이아웃) 정렬은 그대로 수행
		const isStatusBarExceptionUser = (localStorage.getItem('neubie_user_name') || '') === '최정기';

		if (statusBar && redBadge) {
			if (!isStatusBarExceptionUser) {
				redBadge.parentElement.insertBefore(statusBar, redBadge.nextSibling);
				statusBar.style.marginLeft = '';
			}

			// 신규 추가 — 상태바가 확실히 상단으로 이동(=개입 해결 확인)되면 "다음 개입 요청"을 자동 OFF
			try {
				const switchEl = document.querySelector('[data-qk="auto-intervention-change-switch"]');
				if (switchEl) {
					const input = switchEl.querySelector('input[type="checkbox"]');
					const isOn = input ? input.checked : switchEl.getAttribute('aria-checked') === 'true';
					if (isOn) {
						switchEl.querySelector('label')?.click() || switchEl.click();
					}
				}
			} catch (e) { /* 상태 판별 실패 시 아무 것도 안 하고 조용히 넘어감 (안전) */ }
			
		} else if (statusBar && resolveBtn) {
			if (!isStatusBarExceptionUser) {
				resolveBtn.parentElement.insertBefore(statusBar, resolveBtn);
				statusBar.style.marginLeft = '-240px';
			}
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
		let dpadUpHoldStart = null;
	    let dpadUpTriggered = false;
	
        // ── 신버전 대응: data-qk 없는 라벨 버튼 하이브리드 파인더 ──
        function findLabelButton(label) {
            const aside = document.querySelector('aside');
            const scope = aside || document;
            return [...scope.querySelectorAll('button')]
                .find(b => b.textContent.trim().startsWith(label));
        }
        function getLabelButtonState(label) {
            const btn = findLabelButton(label);
            if (!btn) return null;
            return btn.textContent.trim().slice(label.length).trim();
        }

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
            // 신버전: hover 슬라이더
            const rangeInput = document.querySelector('input[type="range"][min="0.5"][max="3"]');
            if (rangeInput) {
                const BRIGHTNESS_STEP = 0.1;
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                let val = parseFloat(rangeInput.value);
                val = direction === 'up' ? Math.min(val + BRIGHTNESS_STEP, 3) : Math.max(val - BRIGHTNESS_STEP, 0.5);
                val = Math.round(val * 10) / 10;
                nativeSetter.call(rangeInput, val);
                rangeInput.dispatchEvent(new Event('input', { bubbles: true }));
                rangeInput.dispatchEvent(new Event('change', { bubbles: true }));
                syncMap();
                return;
            }

            // 구버전: 드롭다운 방식 (폴백)
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
                syncMap();
            }, 150);
        };

        // 화질 조절 헬퍼 (신규 — 오디오 select와 data-qk 중복이라 input value로 필터링)
        const changeQuality = (direction) => {
            const wrapper = [...document.querySelectorAll('[data-qk$="bitrate-select-select-wrapper"]')]
                .find(el => {
                    const inp = el.querySelector('input');
                    return inp && /^[1-5]$/.test(inp.value);
                });
            if (!wrapper) return;

            const input = wrapper.querySelector('input');
            const labels = ['최소', '낮음', '중간', '높음', '최대'];
            const currentIdx = parseInt(input.value, 10) - 1;

            wrapper.click();
            setTimeout(() => {
                const options = [...document.querySelectorAll('[data-qk$="bitrate-select-option"]')];
                const nextIdx = direction === 'up'
                    ? Math.min(currentIdx + 1, labels.length - 1)
                    : Math.max(currentIdx - 1, 0);
                options[nextIdx]?.click();
                syncMap();
            }, 150);
        };
	
	    setInterval(() => {
			if(isDpadBindingOff()) return;
	        const gp = navigator.getGamepads()[0];
	        if (!gp) return;
	        const isDrivingPage = location.href.includes('/remote/multiple/driving/')
	                           || location.href.includes('/remote/robot/');
	        if (!isDrivingPage) return;
	        const padOnBtn = document.querySelector('[data-qk="remote-robot-controller-game-pad-segmented-control-ON"]')
                            || document.querySelector('[data-qk="remote-robot-game-pad-segmented-control-ON"]');
            const isGamepadOn = padOnBtn
                ? padOnBtn.classList.contains('bg-white')
                : getLabelButtonState('게임패드') === 'ON';
	        if (!isGamepadOn) {
	            dpadWasPressed = { up: false, right: false, down: false, left: false };
	            dpadUpHoldStart = null; 
				dpadUpTriggered = false;
				return;
	        }
	
	        // D-pad up (12) — 누르면 진입 시각/시나리오 정보 3초간 표시 + 맵 재동기화
			const upBtn = gp.buttons[12];
			if (upBtn?.pressed && !dpadWasPressed.up) {
				dpadWasPressed.up = true;
				showInterventionInfoOverlay();
				const syncBtn = document.querySelector('[data-qk="location-robot-sync-button"]');
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
                if (el) {
                    el.querySelector('label')?.click();
                } else {
                    findLabelButton('자동정지')?.click();
                }
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

	const NON_TOOL_USER = '이도연';

    async function runAutoHandoverUpload() {
        if (localStorage.getItem('neubie_handover_enabled') === 'false') return;

        const myName = _getMyName();
        if (!myName) return;

        if (!state.insuData?.schedule) return;
        const schedule = state.insuData.schedule;

        const kstHour = getKSTDate().getHours();
        const kstMin = getKSTMinutes();

        let targetName = null;

        if (kstHour === 7 && kstMin === 57 && schedule['07:00'] === NON_TOOL_USER) {
		    targetName = schedule['08:00'];
		} else if (kstHour === 8 && kstMin === 47 && schedule['08:00'] === NON_TOOL_USER) {
		    targetName = schedule['07:00'];
		} else if (kstHour === 9 && kstMin === 47 && schedule['09:00'] === NON_TOOL_USER) {
		    targetName = schedule['08:00'];
		} else {
		    return; // 조건 불충족 - skip
		}

        if (!targetName || targetName !== myName) return; // 선정자 아니면 skip

        const now = new Date();
        const fireKey = `neubie_ho_fired_${now.getFullYear()}${now.getMonth()}${now.getDate()}`;
        if (localStorage.getItem(fireKey)) return;
        localStorage.setItem(fireKey, '1');

        try {
            const beforeRes = await fetchWithTimeout('https://multimonitoring.vercel.app/api/handover');
            const before = beforeRes.ok ? await beforeRes.json() : null;

            if (before) {
                const secondsSinceUpdate = (Date.now() - new Date(before.updatedAt).getTime()) / 1000;
                if (secondsSinceUpdate < 180) return;
            }
            const preservedTaken = before?.taken || [];

            const allRobots = await fetchAllRobotsForHandover();
            const units = allRobots
                .filter(r => r.isMonitoring === true)
                .map(r => r.nickname || r.name);

            if (!units.length) return;

            const res = await fetchWithTimeout('https://multimonitoring.vercel.app/api/handover', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ handover_by: NON_TOOL_USER, units })
            });

            if (!res.ok) return;

            if (preservedTaken.length) {
                await fetchWithTimeout('https://multimonitoring.vercel.app/api/handover', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ addTaken: preservedTaken })
                });
            }
        } catch (e) {
            // 조용히 종료 후 다음날 자연 회복
        }
    }

    // ══════════════════════════════════════════════════════════
    //  모니터링 생성 모달 위치 조정
    //  — 기체가 1대 이상 연결돼 있으면 우측 "로봇 (n)" 패널 자리에 맞춰 도킹
    //    (기체 카메라 화면을 가리지 않도록), 0대(패널 없음)면 NCC 기본(중앙) 유지
    // ══════════════════════════════════════════════════════════
    function setupMonitoringDialogReposition() {
        const STYLE_ID = 'nb-modal-reposition';
        let cachedPanel = null;   // 이미 찾은 패널을 재사용 — 매번 전체 DOM을 다시 스캔하지 않기 위함

        // "로봇 (n)" 헤더 텍스트를 가진 우측 패널 DOM을 찾는다 (캐시 우선)
        function findRobotPanel() {
            if (cachedPanel && cachedPanel.isConnected) return cachedPanel;

            const headers = [...document.querySelectorAll('span, div')].filter(el =>
                el.children.length === 0 && /^로봇\s*\(\d+\)$/.test(el.textContent.trim())
            );
            if (!headers.length) { cachedPanel = null; return null; }

            let headerBlock = headers[0];
            while (headerBlock && !(headerBlock.className && headerBlock.className.includes('border-b'))) {
                headerBlock = headerBlock.parentElement;
            }
            if (!headerBlock) headerBlock = headers[0].parentElement;

            const headerRect = headerBlock.getBoundingClientRect();
            let panel = headerBlock, guard = 0;
            while (panel.parentElement && guard++ < 15) {
                const parent = panel.parentElement;
                const pRect = parent.getBoundingClientRect();
                if (pRect.width - headerRect.width > 100) break;   // 너비가 갑자기 커지면 오버슈트 → 직전 걸로 확정
                panel = parent;
                if (pRect.height > headerRect.height * 1.3) break; // 헤더보다 확실히 커지면 여기가 패널
            }
            cachedPanel = panel;
            return panel;
        }

        function applyModalPosition() {
            const panel = findRobotPanel();
            let style = document.getElementById(STYLE_ID);

            if (!panel) { if (style) style.remove(); return; }  // 기체 0대 → NCC 기본(중앙) 유지

            const rect = panel.getBoundingClientRect();
            if (!style) {
                style = document.createElement('style');
                style.id = STYLE_ID;
                document.head.appendChild(style);
            }
            style.textContent = `
                div:has(> [data-qk="remote-multiple-select-robot-dialog"]) {
                    left: auto !important;
                    right: ${window.innerWidth - rect.right}px !important;
                    top: ${rect.top}px !important;
                    height: ${rect.height}px !important;
                    bottom: auto !important;
                    transform: none !important;
                }
                [data-qk="remote-multiple-select-robot-dialog"] {
                    width: clamp(260px, ${rect.width}px, 38vw) !important;
                    max-width: clamp(260px, ${rect.width}px, 38vw) !important;
                    height: 100% !important;
                    max-height: 100% !important;
                    border-radius: 10px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    overflow-y: auto !important;
                }
            `;
        }

        let debounceTimer = null;
        const scheduleApply = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyModalPosition, 80);
        };

        // ── "모달이 뜨는 걸 감지해서 반응"하지 않고, 로봇 목록 패널의 상태를
        //    항상 미리 CSS 규칙에 반영해둔다. 이러면 모달이 언제 태어나든
        //    그 순간 이미 우측 도킹용 규칙이 스타일시트에 있어서, 중앙에 잠깐
        //    그려졌다가 우측으로 튀는 깜빡임 없이 처음부터 최종 위치로 그려진다.
        //    (감시 범위는 body 전체지만, 콜백 자체는 setTimeout 재설정뿐이라 가볍고
        //    실제 무거운 연산(findRobotPanel 전체 스캔)은 캐시 덕분에 패널이 이미
        //    확보돼 있으면 건너뛰므로 지속적인 부담은 없다) ──
        const obs = new MutationObserver(scheduleApply);
        obs.observe(document.body, { childList: true, subtree: true });
        window._nbMonitoringDialogObserver = obs;

        applyModalPosition();   // 스크립트 로드 시 이미 기체가 연결돼 있을 수 있으므로 최초 1회 즉시 동기화

        // 창 크기 변경(윈도우 스냅 등) 시 항상 재계산 — 모달 열림 여부와 무관하게
        // 규칙을 최신 상태로 유지해야 다음에 모달이 열릴 때도 깜빡임이 없다
        window.addEventListener('resize', scheduleApply);
    }
    setupMonitoringDialogReposition();

    // ══════════════════════════════════════════════════════════
    //  로봇 삭제 확인 팝업에 대상 기체명 표기
    //  — "로봇을 삭제하시겠습니까?"만 뜨면 어떤 기체인지 헷갈리므로,
    //    휴지통 버튼을 누른 시점의 기체명을 캡처해뒀다가 팝업 제목에 삽입
    // ══════════════════════════════════════════════════════════
    function setupDeleteConfirmRobotName() {
        // 한글 종성(받침) 유무에 따라 '을/를' 조사 선택
        // (이름 끝에 괄호 등 비한글 문자가 붙는 경우를 대비해, 마지막 '한글' 글자를 기준으로 판단)
        function withEulReul(word) {
            if (!word) return word;
            const match = word.trim().match(/[가-힣](?=[^가-힣]*$)/);
            if (!match) return word; // 한글 완성형 글자가 없으면(영문/숫자만) 그대로
            const code = match[0].charCodeAt(0);
            const hasBatchim = (code - 0xAC00) % 28 !== 0;
            return word + (hasBatchim ? '을' : '를');
        }

        // 기체명 뒤에 붙는 시리얼번호 제거
        // - 자체 기체: N + 영숫자 5~8자리 (예: N15021L9)
        // - 제휴사(요기요 등) 기체: N + 영문 + '-' + 숫자 (예: NAAAKA1-1221226038)
        function stripSerial(text) {
            return text ? text.replace(/\s*N[0-9A-Z]{4,20}(-[0-9A-Z]+)?\s*$/i, '').trim() : text;
        }

        let lastDeleteRobotName = null;

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-qk="monitoring-robots-dialog-delete-button"]');
            if (!btn) return;
            const row = btn.parentElement;
            const infoBlock = row && row.querySelector('.space-y-6');
            const nameEl = infoBlock && infoBlock.firstElementChild;
            lastDeleteRobotName = stripSerial(nameEl ? nameEl.textContent.trim() : null);
        }, true);

        const obs = new MutationObserver(() => {
            const titleEl = [...document.querySelectorAll('div, p, span')].find(el =>
                el.children.length === 0 && el.textContent.trim() === '로봇을 삭제하시겠습니까?'
            );
            if (titleEl && lastDeleteRobotName && !titleEl.dataset.nbPatched) {
                titleEl.textContent = `'${lastDeleteRobotName}'${withEulReul(lastDeleteRobotName).slice(lastDeleteRobotName.length)} 삭제하시겠습니까?`;
                titleEl.dataset.nbPatched = '1';
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
        window._nbDeleteConfirmObserver = obs;
    }
    setupDeleteConfirmRobotName();

    injectConfigUI();
    // 맵 최적화 초기 적용 (기존엔 SPA 라우트 전환 시에만 호출되어, 새로고침/최초 진입 시
    // fetch 차단이 레이스에서 밀리면 CSS 백업이 한 번도 안 걸리는 경우가 있었음)
    if (state.isMapOpt) {
        setTimeout(() => injectMapStyle(), 300);
        setTimeout(() => injectMapStyle(), 1000);
        setTimeout(() => injectMapStyle(), 3000);
        setTimeout(() => injectMapStyle(), 6000);
    }
    setTimeout(() => initDriveTheme(), 1000);
    
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
	
	    runAutoHandoverUpload();
	    
	}, 1000);

})();
