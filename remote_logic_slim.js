/* ============================================================
   remote_logic_slim.js  v2.0
   NCC 화면 보조 도구 (슬림판)

   ■ 원칙
     - NCC(core.neubie.ai)로 보내는 요청 0건. NCC 페이지의 DOM/CSS만 만진다.
     - 외부 통신은 본인 인프라만: GitHub raw(관리자 설정·insu_data) / Vercel(/api/handover).
     - 일일업무·알림·파일명·스케줄·게시판·배터리 보드 등은 웹사이트(multimonitoring.vercel.app)로 이전.

   ■ 기능
     1. 맵 최적화 (CSS 전용 · 역삼/송도/성수/삼평동 모니터링 화면)
     2. 원격조종(/new) 라이트 테마
     3. 전체 밝기 슬라이더 (다중 모니터링 페이지)
     4. 다중 모니터링 도우미 패널 (Alt+Q): 교대 기체 로드 · 자동 시작 · 남은 기체 대수 · 카메라 배치
     5. 모니터링 생성 모달 우측 고정 · 삭제 확인창 기체명 표기
     6. 개입 페이지 레이아웃 정리 + 다음 개입 요청 자동 OFF
     7. 게임패드 D-pad (↑ 프리셋 / 1초 홀드 설정 · ←→ 밝기 · ↓ 자동정지)
     8. Alt+Q (다중 모니터링 페이지 밖) = 간단 설정창

   ■ 자동화 중지 스위치(offline)
     켜지면 "사람 대신 NCC 화면을 눌러주는" 기능(자동 시작 · 개입 요청 자동 OFF · D-pad)이 멈춘다.
     화면만 바꾸는 기능(맵 최적화·테마·밝기·모달 고정)은 그대로.
       (1) 아래 OFFLINE_MODE 상수  (2) remote_admin_config.json 의 "offline": true
       (3) 이 브라우저만: 콘솔에서 neubieSetOffline(true / false)
   ============================================================ */
(function () {
    'use strict';

    // NCC 계열 호스트에서만 동작 (로더 @match 에 multimonitoring.vercel.app 이 남아 있어도 무시)
    const _host = location.hostname;
    if (!(_host === 'go.neubie.ai' || _host === 'neubility.ai' || _host.endsWith('.neubility.ai'))) return;

    // 구 remote_logic.js 와 같은 가드를 써서 둘이 동시에 돌지 않게 한다
    if (window.neubieEngineLoaded) return;
    window.neubieEngineLoaded = true;
    window.neubieSlimLoaded = true;

    const NEUBIE_HOSTS = ['go.neubie.ai', 'ncc.neubility.ai'];
    const config = {
        targetIds: ['44', '56', '65', '109'],   // 맵 최적화 대상: /monitoring/{siteId}
    };
    const state = { insuData: null };           // gist 폴백의 '인계자 이름' 표기용 (필요할 때만 로드)

    // ── 자동화 중지 스위치 ─────────────────────────────────────
    const OFFLINE_MODE = false;
    const OFFLINE_LS_KEY = 'neubie_offline_mode';

    // remote_admin_config.json — { "maxMonitorSlots": 6, "locked": false, "offline": false }
    // admin 이 이 파일만 고치면 모든 사용자가 새로고침 시 반영 (fetch 실패 시 안전 기본값)
    let ADMIN_CONFIG = { maxMonitorSlots: 6, locked: false, offline: false };
    const adminConfigReady = (async () => {
        try {
            const res = await fetch(
                `https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/remote_admin_config.json?t=${Date.now()}`,
                { cache: 'no-store' }
            );
            if (!res.ok) return;
            const cfg = await res.json();
            if (typeof cfg.maxMonitorSlots === 'number' && cfg.maxMonitorSlots > 0) ADMIN_CONFIG.maxMonitorSlots = cfg.maxMonitorSlots;
            if (typeof cfg.locked === 'boolean') ADMIN_CONFIG.locked = cfg.locked;
            if (typeof cfg.offline === 'boolean') ADMIN_CONFIG.offline = cfg.offline;
        } catch (e) {
            console.log('remote_admin_config 로드 실패, 기본값(6대 / 잠금 해제) 유지:', e);
        }
    })();

    function isOfflineMode() {
        if (OFFLINE_MODE || ADMIN_CONFIG.offline) return true;
        try { return localStorage.getItem(OFFLINE_LS_KEY) === 'true'; } catch (e) { return false; }
    }
    // 이 브라우저 전용 스위치(콘솔). 반환값 = 실제 오프라인 여부
    window.neubieSetOffline = (on) => {
        try { localStorage.setItem(OFFLINE_LS_KEY, on ? 'true' : 'false'); } catch (e) {}
        return isOfflineMode();
    };

    // 다중 모니터링 도우미 기능이 (사용자 토글 ON) && (관리자 잠금 아님) 인지
    const isHandoverFeatureOn = () =>
        !ADMIN_CONFIG.locked && localStorage.getItem('neubie_handover_enabled') !== 'false';

    // ── 이름 ─────────────────────────────────────────────────
    // 예외 사용자 판별('최정기' 상태바 / '오정훈' 패드 기본값)에만 쓴다.
    // 예전에 저장된 neubie_user_name 이 있으면 그걸, 없으면 NCC 로그인 정보(posthog)의 이름을 읽는다. (로컬 읽기만)
    function getMyName() {
        const saved = localStorage.getItem('neubie_user_name');
        if (saved) return saved;
        try {
            const k = Object.keys(localStorage).find(key => key.startsWith('ph_phc_') && key.endsWith('_posthog'));
            if (!k) return '';
            return JSON.parse(localStorage.getItem(k))?.$stored_person_properties?.name || '';
        } catch (e) { return ''; }
    }

    // gist 폴백이 '인계자 이름'을 붙일 때만 필요 — 폴백이 실제로 쓰일 때 1회(10분 캐시) 읽는다
    let _insuAt = 0;
    async function ensureInsuData() {
        if (state.insuData && Date.now() - _insuAt < 10 * 60 * 1000) return;
        try {
            const r = await fetchWithTimeout(
                `https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/insu_data.json?t=${Date.now()}`,
                { cache: 'no-store' }, 6000
            );
            if (r.ok) { state.insuData = await r.json(); _insuAt = Date.now(); }
        } catch (e) { /* 실패 시 '순찰 감지'로 표기 */ }
    }


    // ── 페이지 판별 ──
    const isHandoverPage = () =>
        (NEUBIE_HOSTS.some(h => location.href.includes(`${h}/ko/remote/multiple`)) &&
        !location.href.includes('/driving'));
    const isBrightnessPage = isHandoverPage;

	async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } finally {
            clearTimeout(timer);
        }
    }

    function getKSTDate() {
        const utcMs = Date.now() + (new Date().getTimezoneOffset() * 60000);
        return new Date(utcMs + 9 * 60 * 60000);
    }


    /* ============================================================
        맵 최적화 (CSS 전용)
        - 스타일은 한 번만 넣어 두고, <html data-nb-map-opt="1"> 속성이 있을 때만 적용된다.
        - 대상 사이트(/monitoring/{siteId}) 이고 사용자가 끄지 않았을 때만 속성을 켠다.
        - 요청(fetch) 차단은 하지 않는다 (실제 URL 이 'nodes/?…' 형태라 예전 패턴이 맞지 않았고, 레이스도 있었음).
       ============================================================ */
    const MAP_OPT_ATTR = 'data-nb-map-opt';

    function isTargetMonitoringUrl(url) {
        const m = url && url.match(/\/monitoring\/(\d+)/);
        return !!(m && config.targetIds.includes(m[1]));
    }
    // 대상 사이트 + 끄지 않음(neubie_opt_map !== 'false')
    function isMapOptOn() {
        return isTargetMonitoringUrl(location.href) && localStorage.getItem('neubie_opt_map') !== 'false';
    }

    function ensureMapOptStyle() {
        if (document.getElementById('neubie-map-opt-style')) return;
        const style = document.createElement('style');
        style.id = 'neubie-map-opt-style';
        const P = `html[${MAP_OPT_ATTR}="1"] `;
        style.textContent = `
            /* [1] 노드(Path 점) 제거: 렌더링 부하의 주범 차단 */
            ${P}[data-qk^="node-marker"],
            ${P}gmp-advanced-marker:has([data-qk^="node-marker"]) {
                display: none !important;
            }

            /* [1-1] data-qk가 아예 없는 마커(대부분 경로 위 흰 점) 제거.
               기체/대기장소/스테이션은 모두 data-qk를 갖고 있으므로 이 규칙에 걸리지 않음. */
            ${P}gmp-advanced-marker:not(:has([data-qk])) {
                display: none !important;
            }

            /* [2] 대기장소 마커 반전 (글자 방향 보존) */
            ${P}gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) {
                display: block !important;
                visibility: visible !important;
                z-index: 500 !important;
            }
            ${P}gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) svg {
                transform: rotate(180deg) !important;
            }
            ${P}gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) div.flex-col {
                display: flex !important;
                flex-direction: column-reverse !important;
                transform: translateY(18px) !important;
            }
            ${P}gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) span,
            ${P}gmp-advanced-marker:has([data-qk*="base-marker-대기장소"]) div {
                transform: rotate(0deg) !important;
            }

            /* [3] 기체·스테이션·미니맵 마커 절대 보존 */
            ${P}gmp-advanced-marker:has([data-qk*="robot"]),
            ${P}gmp-advanced-marker:has([data-qk*="station-marker"]),
            ${P}div[class*="MiniMap"] gmp-advanced-marker {
                display: block !important;
                visibility: visible !important;
                z-index: 1000 !important;
            }

            /* [4] 렌더링 성능 가속 */
            ${P}.gm-style canvas { contain: strict !important; }
            ${P}aside { box-shadow: none !important; contain: layout paint !important; }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    function syncMapOpt() {
        ensureMapOptStyle();
        const root = document.documentElement;
        if (isMapOptOn()) root.setAttribute(MAP_OPT_ATTR, '1');
        else root.removeAttribute(MAP_OPT_ATTR);
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
		return getMyName() === '오정훈';
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

			// 구글맵(미니맵) 전체 제외 — 기체 위치 마커 등 지도 자체 렌더링에 손대면 안 됨.
			// (카드 폭이 좁으면 driveThemeClimb가 지도까지 같은 카드로 묶어서 마커가
			//  진한 단색으로 뭉개져 큰 과녁처럼 보이는 문제가 있었음)
			if (c.closest && c.closest('.gm-style')) return;
			if (c.closest && c.closest('[data-qk="robot-location-marker"]')) return;

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


    /* ============================================================
        전체 밝기 마스터 컨트롤 (다중 모니터링 페이지)
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

        // 슬라이더 자체(트랙+손잡이) 커스텀 스타일 — 네온 그린 메탈릭 느낌.
        // 트랙을 두껍게(16px) 만들어서 '전체 밝기' 라벨이 그 안에 자연스럽게 스며들도록 함.
        if (!document.getElementById('neubie-brightness-style')) {
            const style = document.createElement('style');
            style.id = 'neubie-brightness-style';
            style.textContent = `
                #neubie-master-brightness {
                    -webkit-appearance: none;
                    appearance: none;
                    background: rgba(255,255,255,0.08);
                    border-radius: 999px;
                    height: 15px;
                    width: 100%;
                    margin: 0; padding: 0;
                    outline: none;
                    display: block;
                }
                #neubie-master-brightness::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 12px; height: 12px; border-radius: 50%;
                    background: linear-gradient(135deg, #d1fae5, #22c55e);
                    border: 1.5px solid #052e1c;
                    box-shadow: 0 0 6px rgba(34,197,94,0.9), 0 1px 2px rgba(0,0,0,0.4);
                    cursor: pointer;
                    margin-top: 1.5px;
                }
                #neubie-master-brightness::-moz-range-thumb {
                    width: 12px; height: 12px; border-radius: 50%;
                    background: linear-gradient(135deg, #d1fae5, #22c55e);
                    border: 1.5px solid #052e1c;
                    box-shadow: 0 0 6px rgba(34,197,94,0.9);
                    cursor: pointer;
                }
                #neubie-master-brightness::-moz-range-track {
                    background: rgba(255,255,255,0.08);
                    border-radius: 999px;
                    height: 15px;
                }
            `;
            document.head.appendChild(style);
        }

        const bar = document.createElement('div');
        bar.id = 'neubie-brightness-bar';
        Object.assign(bar.style, {
            position: 'fixed',
            top: '2px',
            left: '60px',
            zIndex: '2147483640',
            background: '#14161a',
            backgroundImage: 'linear-gradient(#14161a, #14161a), linear-gradient(90deg, #0e7490, #22c55e)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            border: '1px solid transparent',
            borderRadius: '8px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            width: '150px',
            boxSizing: 'border-box',
            boxShadow: '0 2px 14px rgba(0,0,0,0.5), 0 0 10px rgba(34,197,94,0.12)',
            fontFamily: 'Pretendard, sans-serif',
            userSelect: 'none',
        });

        // ── 슬라이더 + 그 위에 스며든 '전체 밝기' 라벨 ──
        const sliderWrap = document.createElement('div');
        Object.assign(sliderWrap.style, { position: 'relative', flex: '1', minWidth: '0', height: '15px' });

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = 'neubie-master-brightness';
        slider.min = BRIGHTNESS.MIN;
        slider.max = BRIGHTNESS.MAX;
        slider.value = savedVal;
        slider.style.cursor = 'pointer';

        // 라벨은 트랙 위에 얹히기만 하고, 클릭/드래그는 그대로 아래 슬라이더로 통과시킴
        const trackLabel = document.createElement('span');
        trackLabel.textContent = '전체 밝기 조절';
        Object.assign(trackLabel.style, {
            position: 'absolute', inset: '0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: '700', letterSpacing: '0.2px',
            color: '#fff',
            textShadow: '0 0 3px rgba(0,0,0,0.65), 0 1px 2px rgba(0,0,0,0.55)',
            pointerEvents: 'none',
        });

        sliderWrap.appendChild(slider);
        sliderWrap.appendChild(trackLabel);

        const infoBtn = document.createElement('span');
        infoBtn.textContent = 'i';
        Object.assign(infoBtn.style, {
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '12px', height: '12px', borderRadius: '50%', flexShrink: '0',
            background: '#3b82f6', color: '#fff', fontSize: '9px', fontWeight: '700',
            fontStyle: 'italic', fontFamily: 'Georgia, serif',
            cursor: 'pointer',
        });

        const valueLabel = document.createElement('span');
        valueLabel.style.cssText = 'color:#4ade80; font-size:12px; font-weight:700; min-width:20px; text-align:right; flex-shrink:0;';
        valueLabel.textContent = savedVal;

        // 슬라이더 값에 맞춰 채워진(초록) 구간과 안 채워진(어두운) 구간의 경계를 실시간 계산
        const updateSliderFill = (v) => {
            const pct = ((v - BRIGHTNESS.MIN) / (BRIGHTNESS.MAX - BRIGHTNESS.MIN)) * 100;
            slider.style.background =
                `linear-gradient(90deg, #10b981 0%, #6ee7b7 ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`;
        };
        updateSliderFill(savedVal);

        slider.addEventListener('input', () => {
            const v = slider.value;
            valueLabel.textContent = v;
            updateSliderFill(v);
            applyBrightnessToAll(v);
        });

        bar.appendChild(sliderWrap);
        bar.appendChild(valueLabel);
        bar.appendChild(infoBtn);
        document.body.appendChild(bar);

        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBrightnessInfoPopup();
        });

        setTimeout(() => applyBrightnessToAll(savedVal), 800);
    }

    // ── 밝기 인포 팝업 — 화면 좌상단 끝에 붙어서 뜨고, 바깥 클릭/자기 자신 클릭 시 닫힘 ──
    function toggleBrightnessInfoPopup() {
        const existing = document.getElementById('neubie-brightness-info');
        if (existing) { existing.remove(); return; }

        // 팝업 시작 위치를 '전체 기체 밝기' 바에 딱 맞춰 정렬 — 뷰포트 좌상단 모서리가 아니라
        // 실제 바의 위치를 실측해서 그 바로 아래, 왼쪽 끝을 맞춰 배치한다.
        const bar = document.getElementById('neubie-brightness-bar');
        const barRect = bar ? bar.getBoundingClientRect() : { left: 60, bottom: 45 };

        const popup = document.createElement('div');
        popup.id = 'neubie-brightness-info';
        Object.assign(popup.style, {
            position: 'fixed',
            top: `${barRect.bottom + 4}px`,
            left: `${barRect.left}px`,
            zIndex: '2147483641',
            background: '#dcfce7',
            color: '#14532d',
            fontSize: '10px', fontWeight: '500', lineHeight: '1.4',
            padding: '6px 10px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            maxWidth: '190px',
            fontFamily: 'Pretendard, sans-serif',
        });
        popup.innerHTML = 'ALT+Q로 교대 기체를 자동 시작하거나<br>카메라 배치를 변경해보세요.';
        popup.addEventListener('click', (e) => { e.stopPropagation(); popup.remove(); });
        document.body.appendChild(popup);

        setTimeout(() => {
            document.addEventListener('click', function outsideClose(ev) {
                if (!popup.contains(ev.target)) {
                    popup.remove();
                    document.removeEventListener('click', outsideClose);
                }
            });
        }, 0);
    }

    // ── multiple/driving 페이지 진입 시 자동 주입 / 이탈 시 제거 ──
    function checkBrightnessBar() {
		const enabled = isHandoverFeatureOn();
		const bar = document.getElementById('neubie-brightness-bar');
		if (isBrightnessPage() && !bar && enabled) {
			injectMasterBrightness();
		} else if ((!isBrightnessPage() || !enabled) && bar) {
			bar.remove();
		}
	}


    /* ============================================================
        다중 모니터링 도우미 패널 (Alt+Q)
       ============================================================ */
    // ── 유효성 검증 (1시간 이내 데이터) ──
	const isDataValid = (updatedAt) => {
        if (!updatedAt) return false;
        // +09:00 명시로 한국시간 고정
        const updated = new Date(updatedAt.replace(' ', 'T') + '+09:00');
        return (Date.now() - updated.getTime()) < 20 * 60 * 1000;
    };

    // ── 순찰 감지 Gist 폴백 (handover.json 데이터가 없을 때만 사용) ──
    const PATROL_LIVE_URL = 'https://gist.githubusercontent.com/ubase00070/bd7773a059217fb81b0be90c961fcc22/raw/patrol_watch_live.json';
    let _lastSrc = 'handover';
    // gist 폴백은 서버에 taken을 못 남기므로, 이 탭에서 시작한 기체를 교대 시각 단위로 보관 (6대 초과 시 다음 클릭에 나머지 진행)
    const _gistTaken = { key: '', set: new Set() };
    const gistTakenKey = () => { const k = getKSTDate(); return `${k.getDate()}-${(k.getMinutes() >= 40 ? k.getHours() + 1 : k.getHours()) % 24}`; };
    const gistTakenList = () => { const key = gistTakenKey(); if (_gistTaken.key !== key) { _gistTaken.key = key; _gistTaken.set.clear(); } return [..._gistTaken.set]; }; // 'handover' | 'gist' — 마지막 조회 결과의 출처
    const kstStamp = () => {
        const d = getKSTDate(), p = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    };
    // 표기용 이름: 교대 직전(=현시각 모니터링 요원) insu_data 스케줄. :00~:02엔 직전 시각 담당자가 인계자.
    const outgoingMonitorName = () => {
        const k = getKSTDate();
        const h = k.getMinutes() >= 40 ? k.getHours() : (k.getHours() + 23) % 24;
        return state.insuData?.schedule?.[`${String(h).padStart(2, '0')}:00`] || '순찰 감지';
    };
    const gistFallback = async () => {
        const k = getKSTDate(), min = k.getMinutes();
        if (!(min >= 40 || min <= 2)) return null; // 교대 시간대(:40~:02)에만
        try {
            const res = await fetchWithTimeout(`${PATROL_LIVE_URL}?t=${Date.now()}`, { cache: 'no-store' }, 6000);
            if (!res.ok) return null;
            const j = await res.json();
            if (!Array.isArray(j.records)) return null;
            const m = /^(\d{1,2}):(\d{2})/.exec(j.updated_at || '');
            if (!m) return null;
            const nowMin = k.getHours() * 60 + min;
            if (((nowMin - (+m[1] * 60 + +m[2])) + 1440) % 1440 > 10) return null; // 10분 넘게 갱신 없으면 신뢰 X
            const ongoing = j.records.filter(r => r && (r.status === 'ongoing' || r.status === 'anomaly') && r.robot_full);
            if (!ongoing.length) return null;
            // 가장 많은 기체를 순찰 중인 current_operator = 인계자
            const cnt = {};
            ongoing.forEach(r => { if (r.current_operator) cnt[r.current_operator] = (cnt[r.current_operator] || 0) + 1; });
            const outgoing = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
            const mine = outgoing ? ongoing.filter(r => r.current_operator === outgoing) : ongoing;
            const units = [...new Set(mine.map(r => r.robot_full.trim()))];
            if (!units.length) return null;
            await ensureInsuData();
            return { data: { updatedAt: kstStamp(), units, taken: gistTakenList(), handover_by: outgoingMonitorName(), _src: 'gist' } };
        } catch (e) { console.log('gistFallback error:', e); return null; }
    };
    // handover.json 우선 → 유효 데이터(20분 이내 + 기체 있음)가 없을 때만 gist
    const githubGet = async () => {
        let hand = null;
        try {
            const res = await fetchWithTimeout(`https://multimonitoring.vercel.app/api/handover?t=${Date.now()}`, { cache: 'no-store' }, 6000);
            if (res.ok) hand = { data: await res.json() };
        } catch (e) { console.log('githubGet error:', e); }
        if (hand && isDataValid(hand.data?.updatedAt) && (hand.data.units || []).length) {
            _lastSrc = 'handover';
            return hand;
        }
        const g = await gistFallback();
        if (g) {
            // 시크릿 탭 간 taken 공유를 위해 gist 결과를 handover.json에 승격(PUT). 다른 탭은 이후 정상 handover 데이터로 읽는다.
            try {
                const again = await fetchWithTimeout(`https://multimonitoring.vercel.app/api/handover?t=${Date.now()}`, { cache: 'no-store' }, 6000);
                if (again.ok) {
                    const cur = await again.json();
                    if (isDataValid(cur?.updatedAt) && (cur.units || []).length) { _lastSrc = 'handover'; return { data: cur }; } // 그 사이 다른 탭이 먼저 승격함
                }
                const put = await fetch('https://multimonitoring.vercel.app/api/handover', {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ handover_by: g.data.handover_by, units: g.data.units }),
                });
                if (put.ok) { _lastSrc = 'handover'; return { data: { ...g.data, taken: [] } }; }
                console.log('gist 승격 PUT 실패:', put.status);
            } catch (e) { console.log('gist 승격 오류:', e); }
            _lastSrc = 'gist'; return g; // 승격 실패 시 이 탭 로컬 taken으로만 동작
        }
        _lastSrc = 'handover';
        return hand; // 기존 '만료/없음' 메시지 흐름 유지
    };
    // 표시 문구: 이름 - (##대)
    const loadedMsg = (data) => `${data._src === 'gist' ? '순찰감지' : '로드됨'} (${data.handover_by || '?'} - ${(data.units || []).length}대)`;

    // ── 핸드오버 레이아웃 ──────────────────────────────────
	async function initHandoverLayout() {
		await adminConfigReady; // maxMonitorSlots 확정 후 진행
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
			background: '#1c1c1f',
			backgroundImage: 'linear-gradient(#1c1c1f, #1c1c1f), linear-gradient(90deg, #0e7490, #22c55e)',
			backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box',
			borderRadius: '0 0 14px 14px', padding: '7px 8px 9px',
			fontFamily: 'Pretendard,sans-serif',
			boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(34,197,94,0.12)',
			border: '1px solid transparent', borderTop: 'none',
			transition: 'top 0.28s cubic-bezier(0.4,0,0.2,1)',
		});
		document.body.appendChild(panel);

		// ── DP 상태 메시지 (로그 바 — 잘 안 보인다는 피드백으로 텍스트 확대) ──
		const dpMsg = document.createElement('span');
		dpMsg.id = 'ho-dp-msg';
		Object.assign(dpMsg.style, {
			fontSize: '12px', color: '#9ca3af',
			overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
			flex: '1', minWidth: '0',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '5px',
            padding: '3px 8px',
		});
		dpMsg.textContent = '로딩 중...';

		const setDpMsg = (msg, color = '#9ca3af') => {
			dpMsg.textContent = msg;
			dpMsg.style.color = color;
		};

		// ── 그리드 셀 ──
		const MAX_UNITS = ADMIN_CONFIG.maxMonitorSlots; // 관리자 설정값 (기본 6, 확장 시 9)

		const cellIdle = c => {
			Object.assign(c.style, { background: 'rgba(34,197,94,0.12)', color: '#e5f9ee',
				border: '1.5px solid #4ade80', cursor: 'pointer', fontWeight: '600' });
			c.dataset.selected = 'false';
		};
		const cellEmpty = c => {
			c.textContent = '—';
			Object.assign(c.style, { background: 'rgba(255,255,255,0.03)', color: '#6b7280',
				border: '1.5px dashed rgba(34,197,94,0.35)', cursor: 'default', fontWeight: '400' });
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
			borderBottom: '1px solid rgba(255,255,255,0.08)',
			flexWrap: 'nowrap',
		});

		// 카메라 배치 새로고침 버튼 (기존 '다중 파일명'/'성남 배터리' 자리로 이동)
		const posBtn = mkBtn('카메라 배치 새로고침', '#26292f', { border: '1px solid #22c55e', color: '#4ade80' });

		// 교대 받기 버튼
		const fetchBtn = mkBtn('교대 기체 로드', 'linear-gradient(135deg, #16a34a, #4ade80)',
			{ color: '#062e13', boxShadow: '0 0 10px rgba(74,222,128,0.55)' });

		headerRow.appendChild(posBtn);
		headerRow.appendChild(fetchBtn);
		headerRow.appendChild(dpMsg);

		// 우측: 자동 시작
		const rightBtns = document.createElement('div');
		Object.assign(rightBtns.style, { marginLeft: 'auto', display: 'flex', gap: '5px', flexShrink: '0' });

		const autoBtn = mkBtn('자동 시작', 'linear-gradient(135deg, #0f766e, #22c55e)',
			{ color: '#fff', boxShadow: '0 0 10px rgba(34,197,94,0.4)', padding: '4px 8px' });

		// [2026-09] 보라색 버튼 = '남은 기체 대수' 표시 버튼 (라벨/색/토스트는 아래 '남은 기체 대수' 블록에서 관리)
		const dispatchBtn = mkBtn('…대 남음', 'linear-gradient(135deg, #7c3aed, #a78bfa)',
			{ color: '#fff', boxShadow: '0 0 10px rgba(167,139,250,0.4)', padding: '4px 8px' });

		rightBtns.appendChild(autoBtn);
		rightBtns.appendChild(dispatchBtn);

		// ⚙ 간단 설정창 (슬림판에서 추가)
		const gearBtn = mkBtn('⚙', '#26292f', { border: '1px solid #4b5563', color: '#9ca3af', padding: '4px 7px' });
		gearBtn.title = '설정';
		gearBtn.dataset.nbGear = '1';
		gearBtn.addEventListener('click', () => toggleSettingsPopup());
		rightBtns.appendChild(gearBtn);
		headerRow.appendChild(rightBtns);
		panel.appendChild(headerRow);

		// ── 그리드 ──
		const grid = document.createElement('div');
		Object.assign(grid.style, {
			display: 'grid', gridTemplateColumns: `repeat(${MAX_UNITS},1fr)`, gap: '3px',
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
				height: '31px', borderRadius: '7px', border: '1.5px dashed rgba(34,197,94,0.35)',
				background: 'rgba(255,255,255,0.03)', color: '#6b7280', fontSize: '10px',
				fontFamily: 'Pretendard,sans-serif', cursor: 'default',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				textAlign: 'center', lineHeight: '1.3', padding: '3px',
			});
			grid.appendChild(cell);
			return cell;
		});

		panel.appendChild(grid);

		const patchTaken = async (names) => {
			if (_lastSrc === 'gist') { gistTakenList(); (names || []).forEach(n => _gistTaken.set.add(n)); return true; } // gist 폴백은 handover.json에 기록하지 않고 이 탭에만 보관
			try {
				const res = await fetch(`https://multimonitoring.vercel.app/api/handover`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ addTaken: names }),
				});
				if (!res.ok) { console.log('patchTaken 실패:', res.status); return false; }
				return true;
			} catch (e) {
				console.log('patchTaken 오류:', e);
				return false;
			}
		};

		// [2026-09] dispatchGet/patchDispatchTaken('예정기체 자동 시작' 전용 GET/PATCH)은
		// 해당 기능 비활성화와 함께 제거함.

		// ══ 남은 기체 대수 (보라색 버튼) ═══════════════════════════════════════
		// [성능/안전 설계]
		//  · 폴링·setInterval·MutationObserver 없음. 네트워크 요청은 아래 3시점에만 1회씩 발생한다.
		//      (1) 패널이 열릴 때   (2) 보라색 버튼 클릭 시   (3) 자동시작 taken 반영 직후
		//  · 조회는 동시에 1개만 진행(_inflight 공유) + 버튼 연타는 0.5초 간격으로 제한 → 요청 폭주 없음
		//  · 이 탭에서 카메라 연결이 확인된 기체(_localTaken)는 서버 응답이 늦거나 오래된 값이어도
		//    '시작됨'으로 유지한다(서버 반영 지연으로 대수가 되돌아가는 현상 방지).
		//  · 응답이 없거나 실패하면 0대가 아니라 '확인 불가'로 표시한다(거짓 0 방지).
		let _lastData = null;      // 마지막 서버 JSON (null = 조회 실패)
		let _loading = true;       // 첫 조회 전 / 패널 재오픈 직후
		let _inflight = null;      // 진행 중인 조회 Promise
		let _lastFetchAt = 0;
		let _toastOpen = false;
		let _shownKey = '';        // 버튼에 마지막으로 표시한 값 (값이 바뀔 때만 펄스 재생)
		const _localTaken = new Set();
		let _localSig = '';

		if (!document.getElementById('ho-dispatch-style')) {
			const st = document.createElement('style');
			st.id = 'ho-dispatch-style';
			st.textContent = `@keyframes ho-dispatch-pulse {
				0%, 100% { box-shadow: 0 0 10px rgba(167,139,250,0.4); transform: scale(1); }
				50% { box-shadow: 0 0 20px rgba(196,181,253,0.95); transform: scale(1.07); }
			}`;
			document.head.appendChild(st);
		}

		// 새 인계(units 목록이 달라짐)가 오면 이 탭의 로컬 taken 기록을 비운다
		const syncSig = (data) => {
			const units = Array.isArray(data?.units) ? data.units : [];
			const sig = units.join('|');
			if (sig !== _localSig) { _localSig = sig; _localTaken.clear(); }
			return units;
		};

		// state: loading | ok | done(전부 시작됨) | expired(20분 초과) | empty(기체 없음) | error(조회 실패)
		const calcRemaining = () => {
			try {
				if (_loading) return { state: 'loading', names: [] };
				if (!_lastData) return { state: 'error', names: [] };
				if (!isDataValid(_lastData.updatedAt)) return { state: 'expired', names: [] };
				const units = syncSig(_lastData);
				if (!units.length) return { state: 'empty', names: [] };
				const done = new Set(Array.isArray(_lastData.taken) ? _lastData.taken : []);
				_localTaken.forEach(n => done.add(n));
				const names = units.filter(u => !done.has(u));
				return { state: names.length ? 'ok' : 'done', names };
			} catch (e) {
				console.log('calcRemaining 오류:', e);
				return { state: 'error', names: [] };
			}
		};

		const BTN_ON  = 'linear-gradient(135deg, #7c3aed, #a78bfa)';
		const BTN_OFF = 'linear-gradient(135deg, #4b4270, #6b6390)';
		const BTN_ERR = 'linear-gradient(135deg, #374151, #4b5563)';

		const renderDispatchBtn = (rem) => {
			let text = '…대 남음', bg = BTN_ON, glow = '0 0 10px rgba(167,139,250,0.4)';
			let pulse = false, key = 'loading', disabled = false, title = '';
			if (rem.state === 'ok') {
				text = `${rem.names.length}대 남음`; pulse = true; key = 'ok:' + rem.names.join('|');
			} else if (rem.state === 'error') {
				text = '확인 불가'; bg = BTN_ERR; glow = 'none'; key = 'error';
			} else if (rem.state !== 'loading') {
				text = '0대 남음'; bg = BTN_OFF; glow = 'none'; key = 'zero:' + rem.state;
				if (rem.state === 'expired') {   // 20분 초과 데이터는 신뢰할 수 없으므로 버튼을 잠금
					disabled = true;
					title = '인계 데이터가 20분 넘게 갱신되지 않았어요. Alt+Q로 패널을 새로 열면 다시 확인합니다.';
				}
			}
			dispatchBtn.textContent = text;
			dispatchBtn.style.background = bg;
			dispatchBtn.style.boxShadow = glow;
			dispatchBtn.style.minWidth = '74px';
			dispatchBtn.disabled = disabled;
			dispatchBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
			dispatchBtn.style.opacity = disabled ? '0.55' : '1';
			dispatchBtn.title = title;
			if (key !== _shownKey) {          // 값이 실제로 바뀐 경우에만 강조(3회 깜빡 후 정지 — 무한 애니메이션 아님)
				_shownKey = key;
				dispatchBtn.style.animation = 'none';
				if (pulse) {
					void dispatchBtn.offsetWidth;   // 애니메이션 재시작용 리플로우(값 변경 시 1회)
					dispatchBtn.style.animation = 'ho-dispatch-pulse 1.1s ease-in-out 3';
				}
			}
		};

		// ── 우측으로 삐져나오는 토스트 (패널 자식이라 패널이 접히면 같이 사라짐) ──
		const toast = document.createElement('div');
		toast.id = 'ho-remain-toast';
		Object.assign(toast.style, {
			position: 'absolute', display: 'none', top: '6px', left: 'calc(100% + 8px)',
			minWidth: '130px', maxWidth: '230px', boxSizing: 'border-box',
			background: '#1c1c1f', border: '1px solid rgba(167,139,250,0.55)', borderRadius: '10px',
			padding: '8px 10px', fontFamily: 'Pretendard,sans-serif', color: '#e5e7eb',
			boxShadow: '0 6px 20px rgba(0,0,0,0.45), 0 0 12px rgba(167,139,250,0.18)',
			opacity: '0', transform: 'translateX(-10px)',
			transition: 'opacity .18s ease, transform .18s ease',
		});
		panel.appendChild(toast);

		const TOAST_DESC = {
			done:    '모두 시작되었어요',
			expired: '유효한 교대 데이터가 없어요 (20분 초과)',
			empty:   '교대 기체 데이터가 없어요',
			error:   '서버 조회에 실패했어요. 버튼을 다시 눌러 재시도해주세요',
		};

		const renderToast = (rem) => {
			const head = document.createElement('div');
			Object.assign(head.style, { fontSize: '11px', fontWeight: '700', color: '#c4b5fd', marginBottom: '5px' });
			const parts = [head];
			if (rem.state === 'loading') {
				head.textContent = '확인 중…';
			} else if (rem.state === 'ok') {
				head.textContent = `남은 기체 ${rem.names.length}대`;
				const list = document.createElement('div');
				Object.assign(list.style, { display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '150px', overflowY: 'auto' });
				rem.names.forEach(n => {
					const row = document.createElement('div');
					row.textContent = n;   // textContent만 사용 (서버 문자열을 HTML로 해석하지 않음)
					row.title = n;
					Object.assign(row.style, {
						fontSize: '12px', fontWeight: '600', color: '#f5f3ff', background: 'rgba(167,139,250,0.14)',
						borderRadius: '5px', padding: '2px 7px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
					});
					list.appendChild(row);
				});
				parts.push(list);
			} else {
				head.textContent = rem.state === 'error' ? '확인 불가' : '0대 남음';
				const desc = document.createElement('div');
				desc.textContent = TOAST_DESC[rem.state] || '';
				Object.assign(desc.style, { fontSize: '12px', color: '#9ca3af', lineHeight: '1.4' });
				parts.push(desc);
			}
			toast.replaceChildren(...parts);
		};

		// 오른쪽 공간이 모자라면(좁은 창) 패널 아래쪽 우측 정렬로 폴백
		const placeToast = () => {
			const r = panel.getBoundingClientRect();
			if (r.right + 8 + 232 <= window.innerWidth) {
				Object.assign(toast.style, { top: '6px', left: 'calc(100% + 8px)', right: 'auto' });
			} else {
				Object.assign(toast.style, { top: 'calc(100% + 6px)', left: 'auto', right: '0' });
			}
		};
		const showToast = () => {
			_toastOpen = true;
			renderToast(calcRemaining());
			placeToast();
			toast.style.display = 'block';
			void toast.offsetWidth;   // 슬라이드 인 트랜지션용 리플로우(열 때 1회)
			toast.style.opacity = '1';
			toast.style.transform = 'translateX(0)';
		};
		const hideToast = () => {
			_toastOpen = false;
			toast.style.display = 'none';
			toast.style.opacity = '0';
			toast.style.transform = 'translateX(-10px)';
		};

		const renderAll = () => {
			const rem = calcRemaining();
			renderDispatchBtn(rem);
			if (_toastOpen) renderToast(rem);
			return rem;
		};

		// 서버 조회 (동시에 1개만). 성공/실패와 무관하게 반드시 종료되고, 결과를 버튼·토스트에 반영한다.
		const refreshRemaining = () => {
			if (_inflight) return _inflight;
			_lastFetchAt = Date.now();
			_inflight = (async () => {
				let r = null;
				try { r = await githubGet(); } catch (e) { r = null; }
				_lastData = r ? r.data : null;
				_loading = false;
				try { renderAll(); } catch (e) { console.log('renderAll 오류:', e); }
				return r;
			})().finally(() => { _inflight = null; });
			return _inflight;
		};

		// 자동시작 직후: 카메라 연결이 확인된 기체를 즉시(0ms) 반영 — 서버 왕복을 기다리지 않는다
		const applyLocalTaken = (data, names) => {
			try {
				_lastData = data; _loading = false;
				syncSig(data);
				names.forEach(n => _localTaken.add(n));
				renderAll();
			} catch (e) { console.log('applyLocalTaken 오류:', e); }
		};

		// 패널이 (다시) 열릴 때 alt+q 핸들러가 호출: 토스트 닫고 → '…대 남음' → 최신값 조회
		panel._onOpen = () => { hideToast(); _lastData = null; _loading = true; renderAll(); refreshRemaining(); };
		panel._renderRemaining = () => { try { renderAll(); } catch (e) {} };

		dispatchBtn.addEventListener('click', () => {
			if (dispatchBtn.disabled) return;   // 20분 초과로 잠긴 상태에서는 아무 동작도 하지 않음
			if (_toastOpen) {
				if (calcRemaining().state === 'error') {   // 조회 실패 안내가 떠 있을 땐 '다시 누르면 재시도'
					_lastData = null; _loading = true; renderAll();
					refreshRemaining();
					return;
				}
				hideToast(); return;
			}
			showToast();                                            // 갖고 있는 값으로 즉시 표시
			if (Date.now() - _lastFetchAt > 500) refreshRemaining();  // 최신값 재조회 → 도착하면 자동 갱신 (연타 제한 0.5초)
		});
		// ══ 남은 기체 대수 끝 ═══════════════════════════════════════════════════

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
                setDpMsg(loadedMsg(data), '#22c55e');
            } finally {
                _fetchBtnRunning = false;
                fetchBtn.disabled = false;
                fetchBtn.style.opacity = '1';
            }
        });

		// ── Auto select ──
		// maxSuccesses: 이번 호출에서 "새로 체크"해도 되는 최대 개수(남은 모니터링 자리 수).
		// 이미 모달에서 체크돼 있던 기체는 이 예산을 소모하지 않는다. 기본값 Infinity면
		// 예산 제한 없이 후보 리스트를 끝까지 순서대로 시도한다(기존 자동시작/인계 버튼과 동일 동작).
		const runAutoSelect = async (units, maxSuccesses = Infinity) => {
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

            // 클릭 이벤트만 쐈다고 바로 성공 처리하지 않고, 실제로 checkbox.checked가 바뀌는지
            // 짧게 폴링해서 확인한다. "이미 실시간 모니터링 중"/"off 상태" 등으로 체크가 막혀있는
            // 기체는 클릭해도 checked가 안 바뀌므로 false를 반환 → 자연스럽게 스킵된다.
            const reactCheck = async (label) => {
				if (!label) return false;
				const checkbox = label.querySelector('input[type="checkbox"]');
				if (!checkbox) return false;
				if (checkbox.checked) return true;
				label.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
				for (let i = 0; i < 6; i++) {
					await new Promise(r => setTimeout(r, 50));
					if (checkbox.checked) return true;
				}
				return false; // 클릭해도 반영 안 됨 — 체크 불가 기체로 판단, 스킵
			};

			const checkedUnits = [];
			const skippedUnits = [];
			let remaining = maxSuccesses;
			for (let i = 0; i < units.length && remaining > 0; i++) {
				const name = units[i];
				setDpMsg(`${name} (${i+1}/${units.length}, 남은 자리 ${remaining === Infinity ? '-' : remaining})`, '#3b82f6');
				let clicked = false;
				let wasAlreadyChecked = false;

				const labels = document.querySelectorAll('label');
				for (const label of labels) {
					const text = label.querySelector('div.px-12 span')?.textContent.trim();
					if (!text) continue;
					if (text === name) {
						wasAlreadyChecked = !!label.querySelector('input[type="checkbox"]')?.checked;
						clicked = await reactCheck(label);
						break;
					}
				}

				if (clicked) {
					checkedUnits.push(name);
					if (!wasAlreadyChecked) remaining--; // 원래부터 체크돼 있던 건 자리를 새로 소모하지 않음
				} else {
					skippedUnits.push(name); // 체크 불가 — 자리 안 쓰고 다음 후보로
				}
				await new Promise(r => setTimeout(r, 80));
			}

			if (!checkedUnits.length) {
				setDpMsg(skippedUnits.length ? `선택된 기체 없음 (전부 체크 불가: ${skippedUnits.join(', ')})` : '선택된 기체 없음', '#ef4444');
				return { confirmed: false, checkedUnits: [] };
			}

			const attempted = checkedUnits.length + skippedUnits.length;
			setDpMsg(`${checkedUnits.length}/${attempted} 선택 완료, 시작하기 대기 중...`, '#22c55e');

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

				// [수정] "하나라도 뜨면 전부 성공"으로 뭉개지 않고, 시도한 기체 각각이 실제로
				// 카드로 나타났는지 개별 확인한다. taken 처리는 이 확인을 통과한 기체만 대상이 된다.
				const confirmedUnits = await new Promise(resolve => {
					const deadline = Date.now() + 4000;
					const check = () => {
						const cardNames = [...document.querySelectorAll('.flex.h-full.w-full.items-center.justify-center.overflow-hidden .p-3')]
							.map(el => el.textContent.trim());
						const appeared = checkedUnits.filter(name => cardNames.some(c => c.includes(name)));
						if (appeared.length === checkedUnits.length || Date.now() > deadline) {
							resolve(appeared);
						} else {
							setTimeout(check, 300);
						}
					};
					check();
				});

				if (confirmedUnits.length) {
					const rejected = checkedUnits.filter(n => !confirmedUnits.includes(n));
					if (rejected.length) {
						setDpMsg(`${confirmedUnits.length}/${checkedUnits.length}대 반영 완료 (거절: ${rejected.join(', ')})`, '#f59e0b');
					} else {
						setDpMsg('완료! ✅', '#22c55e');
					}
					return { confirmed: true, checkedUnits: confirmedUnits };  // ← 실제로 붙은 기체만 taken 대상으로 반환
				} else {
					setDpMsg(`거절됨 (이미 모니터링 중 등) — taken 처리 안 함, 다시 시도해주세요`, '#ef4444');
					return { confirmed: false, checkedUnits: [] };   // ← 실패 시 완전히 빈 배열 반환
				}
			} else {
				setDpMsg('시작하기 버튼을 직접 눌러주세요', '#f59e0b');
				return { confirmed: false, checkedUnits };
			}
		};

		// ── 예정기체 자동 시작 전용 상한값 ──
		// [수정] 원래 여기 있던 countCheckedInModal()(모달 안 체크된 라벨 전체를 세서
		// "남은 자리"를 미리 계산하던 함수)을 제거함. 실측 결과 이 카운트가 실제 라이브
		// 모니터링 대수와 안 맞아서, 자리가 남아있는데도 "이미 N대 모니터링 중"으로
		// 오탐 차단되는 버그가 있었음. 이제는 신뢰가 검증된 방식(후보 이름 하나하나를
		// 찾아서 그 라벨만 확인하는 reactCheck/wasAlreadyChecked)에만 의존한다.
		const MAX_MONITOR_SLOTS = ADMIN_CONFIG.maxMonitorSlots; // 관리자 설정값 (MAX_UNITS와 동일 값 공유)

		autoBtn.addEventListener('click', async () => {
			if (autoBtn.disabled) return;
			if (isOfflineMode()) { setDpMsg('오프라인 모드: 자동 시작이 차단되었습니다', '#f59e0b'); return; }
			autoBtn.disabled = true;
			setTimeout(() => { autoBtn.disabled = false; }, 2000);

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
			const available = units.filter(u => !taken.includes(u)).slice(0, MAX_MONITOR_SLOTS);

			if (!available.length) {
				setDpMsg('배정 가능한 기체가 없습니다 (전체 배정 완료)', '#94a3b8');
				return;
			}

			const { confirmed, checkedUnits } = await runAutoSelect(available);

			if (!checkedUnits.length) return;

			if (confirmed) {
				applyLocalTaken(result.data, checkedUnits); // 카메라 연결 확인 즉시 '##대 남음' 반영 (서버 왕복 대기 없음)
				let ok = await patchTaken(checkedUnits);
				if (!ok) ok = await patchTaken(checkedUnits); // 실패 시 1회 재시도
				if (ok) {
					refreshRemaining(); // 서버 기준 재확인 (기다리지 않음. 실패해도 로컬 반영값 유지)
					setDpMsg(`${checkedUnits.length}대 시작 및 서버 반영 완료`, '#22c55e');
				} else {
					setDpMsg(`${checkedUnits.join(', ')} 카메라는 연결됐지만 서버 반영에 실패했어요 — 다른 탭에서 중복 시도될 수 있으니 새로고침 후 확인해주세요`, '#ef4444');
				}
			} else {
				setDpMsg(`${checkedUnits.join(', ')} 체크됨 — 시작하기 버튼을 직접 누르면 taken 반영은 되지 않습니다`, '#f59e0b');
			}
		});

		// (보라색 버튼 클릭 핸들러는 위 '남은 기체 대수' 블록에 있음)

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
		const result = await refreshRemaining();
		if (result && isDataValid(result.data.updatedAt)) {
            const units = result.data.units || [];
            if (units.length) {
                setDpMsg(loadedMsg(result.data), '#22c55e');
            } else {
                setDpMsg('교대 기체 데이터가 없습니다', '#f59e0b');
            }
        } else if (result && result.data?.updatedAt) {
            setDpMsg('이미 20분이 지난 데이터입니다', '#ef4444');
        } else {
            setDpMsg('교대 기체 데이터가 없습니다', '#f59e0b');
        }

        // ── 20분 만료 감시 (30초마다) ──
        clearInterval(window.__hoExpiryTimer);   // 패널 재생성 시 이전 타이머 정리 (누적 방지)
        const expiryInterval = window.__hoExpiryTimer = setInterval(() => {
            if (!panel.isConnected) { clearInterval(expiryInterval); return; }   // 패널이 제거됐으면 타이머 종료
            if (panel.style.top !== '0px') return;   // 패널 닫혀있으면 스킵
            if (!isDataValid(result?.data?.updatedAt)) {
                setDpMsg('20분 초과, 기체 목록 만료됨', '#ef4444');
                panel._renderRemaining?.();   // 만료 순간 보라색 버튼도 '0대 남음'으로
                clearInterval(expiryInterval);
            }
        }, 30000);

		// 패널 외부 클릭 시 닫기 (패널이 재생성돼도 리스너는 document에 1번만 등록)
		if (!window.__hoOutsideBound) {
			window.__hoOutsideBound = true;
			document.addEventListener('mousedown', (e) => {
				const p = document.getElementById('ho-remote-panel');
				if (!p) return;
				if (p.contains(e.target)) return;
				if (e.target.closest('[data-qk="remote-multiple-select-robot-dialog"]')) return;
				p.style.top = '-300px';
			});
		}
	}
	// ── 핸드오버 레이아웃 끝 ──────────────────────────────


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
		const isStatusBarExceptionUser = getMyName() === '최정기';

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
					if (isOn && !isOfflineMode()) {
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
	
	    // ══════════════════════════════════════════════════════════
	    //  D-PAD ↑ 프리셋 — 짧게 누르면 저장된 값(밝기/화질/지도 확대/자동정지) 일괄 적용,
	    //  1초 홀드하면 화면 상단 중앙에 설정 토스트가 뜬다.
	    //  · 별도 타이머/루프 없음: 아래 기존 100ms 폴링이 handleDpadUpTick()만 호출한다.
	    //  · 토스트는 포커스를 가져가지 않으며(pointer 클릭 전까지), 조작이 없으면 3초 뒤 사라진다.
	    //  · 일반 접속(/remote/robot/N[/new])과 개입카드(/remote/multiple/driving/...) 모두 동일 경로.
	    // ══════════════════════════════════════════════════════════
	    const PRESET_KEY = 'neubie_dpad_up_preset';
	    const PRESET_HOLD_MS = 1000;
	    const PRESET_PANEL_AUTO_CLOSE_MS = 3000;   // 마지막 조작 후 이 시간이 지나면 자동 종료
	    const PRESET_SELECT_OPEN_GRACE_MS = 10000;  // 드롭다운 목록을 펼친 동안엔 고르는 시간을 넉넉히 준다
	    const QUALITY_LABELS = ['최소', '낮음', '중간', '높음', '최대'];
	    const presetSleep = ms => new Promise(r => setTimeout(r, ms));

	    // 주소로 페이지 종류/신버전 여부 판별 (신버전 = 경로에 /new 세그먼트)
	    const getPresetPageMode = () => {
	        const p = location.pathname;
	        return {
	            kind: /\/remote\/robot\/\d+/.test(p) ? 'robot'
	                : (p.includes('/remote/multiple/driving/') ? 'driving' : null),
	            isNew: /\/new(?:\/|$)/.test(p),
	        };
	    };

	    // ── 저장/불러오기 (localStorage) ──
	    const sanitizePreset = (o) => {
	        if (!o || typeof o !== 'object') return null;
	        let b = parseFloat(o.brightness);
	        b = Number.isFinite(b) ? Math.round(Math.min(3, Math.max(0.5, b)) * 10) / 10 : null;
	        let q = parseInt(o.quality, 10);
	        q = (q >= 1 && q <= 5) ? q : null;
	        let z = parseInt(o.zoom, 10);
	        z = (z >= 1 && z <= 5) ? z : 0;
	        const a = (o.adas === 'on' || o.adas === 'off') ? o.adas : null;   // 자동정지: 'on' | 'off' | null(변경 안 함)
	        return { brightness: b, quality: q, zoom: z, adas: a };   // null / 0 = "변경 안 함"
	    };
	    const loadPreset = () => {
	        try { return sanitizePreset(JSON.parse(localStorage.getItem(PRESET_KEY))); }
	        catch (e) { return null; }
	    };
	    const savePreset = (p) => {
	        try { localStorage.setItem(PRESET_KEY, JSON.stringify(p)); return true; }
	        catch (e) { return false; }
	    };

	    // ── 현재 화면 상태 읽기 ──
	    const getBrightnessRange = () => document.querySelector('input[type="range"][min="0.5"][max="3"]');
	    const getBrightnessWrapper = () => document.querySelector('[data-qk*="cam-brightness-select-select-wrapper"]');
	    // 오디오 select와 data-qk가 겹치므로 input value가 1~5인 것(=영상 화질)만 선택
	    const getQualityWrapper = () => [...document.querySelectorAll('[data-qk$="bitrate-select-select-wrapper"]')]
	        .find(el => { const i = el.querySelector('input'); return i && /^[1-5]$/.test(i.value); });
	    const readBrightness = () => {
	        const r = getBrightnessRange();
	        const raw = r ? r.value : getBrightnessWrapper()?.querySelector('input')?.value;
	        const v = parseFloat(raw);
	        return Number.isFinite(v) ? Math.round(v * 10) / 10 : null;
	    };
	    const readQuality = () => {
	        const v = parseInt(getQualityWrapper()?.querySelector('input')?.value, 10);
	        return (v >= 1 && v <= 5) ? v : null;
	    };

	    // ── 자동정지(ADAS) 스위치: 현재 상태 읽기 / 원하는 상태로 맞추기 (이미 같으면 건드리지 않음) ──
	    const getAdasSwitch = () => document.querySelector('[data-qk="remote-robot-cam-adas-switch"]')
	                             || document.querySelector('[data-qk="driving-robot-cam-adas-switch"]');
	    const readAdas = () => {
	        const el = getAdasSwitch();
	        if (el) {
	            const input = el.matches('input[type="checkbox"]') ? el : el.querySelector('input[type="checkbox"]');
	            if (input) return input.checked ? 'on' : 'off';
	            const aria = el.getAttribute('aria-checked') ?? el.querySelector('[aria-checked]')?.getAttribute('aria-checked');
	            if (aria === 'true') return 'on';
	            if (aria === 'false') return 'off';
	            return null;
	        }
	        const s = getLabelButtonState('자동정지');   // 신버전: data-qk 없는 라벨 버튼 ("자동정지 ON")
	        return s === 'ON' ? 'on' : (s === 'OFF' ? 'off' : null);
	    };
	    const clickAdas = () => {
	        const el = getAdasSwitch();
	        if (el) (el.querySelector('label') || el).click();
	        else findLabelButton('자동정지')?.click();
	    };
	    const setAdas = async (want) => {
	        const cur = readAdas();
	        if (cur == null) return 'fail';
	        if (cur === want) return 'same';
	        clickAdas();
	        await presetSleep(250);
	        return readAdas() === want ? 'changed' : 'fail';   // 클릭 후 실제로 바뀌었는지 확인
	    };


	    // ── 드롭다운에서 옵션 하나 선택 (열기 → 옵션 대기 → 클릭). 실패 시 열린 채 두지 않고 닫는다 ──
	    const pickFromDropdown = async (wrapper, optSel, match, fallbackIdx) => {
	        if (!wrapper) return false;
	        const waitOpts = async (maxMs) => {
	            for (let t = 0; t < maxMs; t += 50) {
	                const found = [...document.querySelectorAll(optSel)];
	                if (found.length) return found;
	                await presetSleep(50);
	            }
	            return [];
	        };
	        let opts = [...document.querySelectorAll(optSel)];   // 이미 열려 있으면 다시 누르지 않음(닫힘 방지)
	        if (!opts.length) {
	            wrapper.click();
	            opts = await waitOpts(500);
	            if (!opts.length) {                               // 폴백: 마우스 이벤트 전체 합성
	                const o = { bubbles: true, cancelable: true, view: window };
	                ['mousedown', 'mouseup', 'click'].forEach(t => wrapper.dispatchEvent(new MouseEvent(t, o)));
	                opts = await waitOpts(500);
	            }
	        }
	        if (!opts.length) return false;
	        const hit = opts.find(match) || (fallbackIdx != null ? opts[fallbackIdx] : null);
	        if (!hit) { wrapper.click(); return false; }          // 못 찾으면 목록 닫기
	        (hit.querySelector('span') || hit).click();
	        await presetSleep(200);
	        return true;
	    };

	    // ── 밝기: 신버전은 슬라이더, 구버전은 드롭다운. 주소(/new)로 우선순위를 정하고 안 되면 다른 방식으로 폴백 ──
	    // 반환: 'same'(이미 그 값) | 'changed' | 'fail' | null(이 방식 사용 불가)
	    const setBrightnessBySlider = (v) => {
	        const rng = getBrightnessRange();
	        if (!rng) return null;
	        if (Math.abs(parseFloat(rng.value) - v) < 0.001) return 'same';
	        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
	        nativeSetter.call(rng, String(v));
	        rng.dispatchEvent(new Event('input', { bubbles: true }));
	        rng.dispatchEvent(new Event('change', { bubbles: true }));
	        return 'changed';
	    };
	    const setBrightnessByDropdown = async (v) => {
	        const wrapper = getBrightnessWrapper();
	        if (!wrapper) return null;
	        const cur = parseFloat(wrapper.querySelector('input')?.value);
	        if (Math.abs(cur - v) < 0.001) return 'same';
	        const ok = await pickFromDropdown(wrapper, '[data-qk*="cam-brightness-select-option"]',
	            li => Math.abs(parseFloat(li.textContent.replace(/[^\d.]/g, '')) - v) < 0.001);
	        return ok ? 'changed' : 'fail';
	    };
	    const setBrightness = async (v, mode) => {
	        const bySlider = async () => setBrightnessBySlider(v);
	        const byDropdown = () => setBrightnessByDropdown(v);
	        for (const fn of (mode.isNew ? [bySlider, byDropdown] : [byDropdown, bySlider])) {
	            const r = await fn();
	            if (r === 'same' || r === 'changed') return r;
	        }
	        return 'fail';
	    };

	    // ── 화질: 신/구버전 공통 드롭다운 (1=최소 … 5=최대) ──
	    const setQuality = async (level) => {
	        const wrapper = getQualityWrapper();
	        if (!wrapper) return 'fail';
	        if (parseInt(wrapper.querySelector('input').value, 10) === level) return 'same';
	        const label = QUALITY_LABELS[level - 1];
	        const ok = await pickFromDropdown(wrapper, '[data-qk$="bitrate-select-option"]',
	            li => li.textContent.replace(/화질/g, '').trim() === label, level - 1);
	        return ok ? 'changed' : 'fail';
	    };

	    // ── 지도 확대: Google Map 인스턴스를 React fiber에서 1회 찾아 캐시 (이후엔 탐색 없음) ──
	    let cachedMap = null;
	    const findGoogleMapInstance = () => {
	        const isMap = o => { try { return o && typeof o === 'object' && typeof o.getZoom === 'function' && typeof o.setZoom === 'function' && typeof o.getCenter === 'function'; } catch (e) { return false; } };
	        const SKIP = new Set(['return', 'alternate', 'child', 'sibling', '_debugOwner', '_owner', '_debugHookTypes']);
	        let budget = 60000;
	        const search = (root, maxDepth = 5) => {
	            const seen = new WeakSet(), q = [[root, 0]];
	            while (q.length && budget-- > 0) {
	                const [o, d] = q.shift();
	                if (!o || (typeof o !== 'object' && typeof o !== 'function')) continue;
	                if (o instanceof Node || o === window || seen.has(o)) continue;
	                seen.add(o);
	                if (isMap(o)) return o;
	                if (d >= maxDepth) continue;
	                let keys; try { keys = Object.keys(o); } catch (e) { continue; }
	                for (const k of keys) {
	                    if (SKIP.has(k)) continue;
	                    let v; try { v = o[k]; } catch (e) { continue; }
	                    q.push([v, k === 'next' ? d : d + 1]);   // 훅 연결 리스트는 깊이에 안 셈
	                }
	            }
	            return null;
	        };
	        let node = document.querySelector('.gm-style') || document.querySelector('[aria-label="지도"]');
	        while (node) {
	            const fk = Object.keys(node).find(k => k.startsWith('__reactFiber$'));
	            if (fk) {
	                let f = node[fk];
	                while (f) {
	                    const m = search(f.memoizedProps) || search(f.memoizedState) ||
	                              (f.stateNode && !(f.stateNode instanceof Node) ? search(f.stateNode) : null);
	                    if (m) return m;
	                    f = f.return;
	                }
	            }
	            node = node.parentElement;
	        }
	        return null;
	    };
	    const getMapInstance = () => {
	        try { if (cachedMap && cachedMap.getDiv().isConnected) return cachedMap; } catch (e) {}
	        cachedMap = null;
	        try { cachedMap = findGoogleMapInstance(); } catch (e) {}
	        return cachedMap;
	    };
	    const zoomMapIn = (steps) => {
	        const map = getMapInstance();
	        if (!map) return 'fail';
	        map.setZoom(Math.min(21, map.getZoom() + steps));   // LT를 steps번 누른 것과 같은 상대 확대
	        return 'changed';
	    };

	    // ── 적용 결과 안내(포커스/클릭 영향 없음, 잠깐 표시 후 제거) ──
	    let presetNoticeEl = null, presetNoticeTimer = null;
	    const showPresetNotice = (text, ms = 2000, warn = false) => {
	        clearTimeout(presetNoticeTimer);
	        if (!presetNoticeEl || !presetNoticeEl.isConnected) {
	            presetNoticeEl = document.createElement('div');
	            presetNoticeEl.id = 'neubie-dpad-preset-notice';
	            document.body.appendChild(presetNoticeEl);
	        }
	        const top = (presetPanelEl && presetPanelEl.isConnected) ? presetPanelEl.getBoundingClientRect().bottom + 6 : 4;
	        presetNoticeEl.style.cssText = `
	            position:fixed; top:${top}px; left:50%; transform:translateX(-50%);
	            z-index:999999; pointer-events:none; white-space:nowrap;
	            background:rgba(18,18,36,0.95); border:1px solid ${warn ? '#f59e0b' : '#6a6aaa'};
	            border-radius:12px; padding:8px 18px; font-size:14px; font-weight:600;
	            font-family:'Pretendard','Noto Sans KR',sans-serif; color:${warn ? '#fcd34d' : '#e2e8f0'};
	            box-shadow:0 4px 20px rgba(0,0,0,0.5);
	        `;
	        presetNoticeEl.textContent = text;
	        presetNoticeTimer = setTimeout(() => { presetNoticeEl?.remove(); presetNoticeEl = null; }, ms);
	    };

	    // ── 프리셋 적용 ──
	    let presetBusy = false;
	    const applyPreset = async () => {
	        if (presetBusy) return;
	        if (isOfflineMode()) { showPresetNotice('오프라인 모드: 프리셋 적용이 차단되었습니다', 2000, true); return; }
	        const p = loadPreset();
	        if (!p) {                                   // 저장된 프리셋이 없으면 설정 토스트를 열어 안내
	            openPresetPanel();
	            showPresetNotice('저장된 프리셋이 없습니다. 값을 고르고 저장해 주세요', 2500, true);
	            return;
	        }
	        if (p.brightness == null && p.quality == null && !p.zoom && !p.adas) {
	            showPresetNotice('프리셋에 적용할 항목이 없습니다 (모두 변경 안 함)', 2000, true);
	            return;
	        }
	        presetBusy = true;
	        try {
	            const mode = getPresetPageMode();
	            const parts = [];
	            let anyFail = false;
	            const track = (label, r) => {
	                if (r === 'fail') anyFail = true;
	                parts.push(r === 'fail' ? `${label} ✕` : label);
	            };
	            if (p.brightness != null) track(`밝기 ${p.brightness}`, await setBrightness(p.brightness, mode));
	            if (p.quality != null)    track(`화질 ${QUALITY_LABELS[p.quality - 1]}`, await setQuality(p.quality));
	            if (p.adas)               track(`자동정지 ${p.adas.toUpperCase()}`, await setAdas(p.adas));
	            syncMap();                              // 다른 D-pad 동작과 동일하게, 값이 이미 같아도 항상 맵 헤드 방향 재동기화
	            if (p.zoom) await presetSleep(450);     // syncMap의 두 번째 클릭(400ms) 이후에 확대해야 되돌려지지 않음
	            if (p.zoom) track(`지도 +${p.zoom}`, zoomMapIn(p.zoom));
	            showPresetNotice(`프리셋 적용 · ${parts.join(' · ')}`, 2000, anyFail);
	        } catch (e) {
	            console.error('[neubie] D-pad 프리셋 적용 실패', e);
	        } finally {
	            presetBusy = false;
	        }
	    };

	    // ── 설정 토스트 (포커스를 가져가지 않음. 마우스 클릭 전에는 3초 뒤 자동 종료) ──
	    let presetPanelEl = null, presetPanelTimer = null;
	    const closePresetPanel = () => {
	        clearTimeout(presetPanelTimer);
	        presetPanelTimer = null;
	        if (presetPanelEl) { presetPanelEl.remove(); presetPanelEl = null; }
	    };
	    const openPresetPanel = () => {
	        closePresetPanel();
	        const saved = loadPreset();
	        const init = saved || { brightness: readBrightness(), quality: readQuality(), zoom: 0, adas: null };

	        const opt = (value, text, selected) => `<option value="${value}"${selected ? ' selected' : ''}>${text}</option>`;
	        let bOpts = opt('', '변경 안 함', init.brightness == null);
	        for (let i = 5; i <= 30; i++) {
	            const v = i / 10;
	            bOpts += opt(v, v, init.brightness != null && Math.abs(init.brightness - v) < 0.001);
	        }
	        let qOpts = opt('', '변경 안 함', init.quality == null);
	        QUALITY_LABELS.forEach((l, i) => { qOpts += opt(i + 1, l, init.quality === i + 1); });
	        let zOpts = opt('', '변경 안 함', !init.zoom);
	        for (let i = 1; i <= 5; i++) zOpts += opt(i, `${i}회 확대`, init.zoom === i);
	        const aOpts = opt('', '변경 안 함', !init.adas) + opt('on', 'ON', init.adas === 'on') + opt('off', 'OFF', init.adas === 'off');

	        const selCss = `background:#23233f; color:#e2e8f0; border:1px solid #4a4a7a; border-radius:6px; padding:2px 4px; font-size:12px; height:24px; color-scheme:dark; min-width:76px;`;
	        const lblCss = `display:flex; align-items:center; gap:5px; font-size:12px; color:#aab;`;
	        const panel = document.createElement('div');
	        panel.id = 'neubie-dpad-preset-panel';
	        panel.style.cssText = `
	            position:fixed; top:4px; left:50%; transform:translateX(-50%);
	            z-index:1000000; background:rgba(18,18,36,0.97); border:1px solid #6a6aaa; border-radius:10px;
	            padding:4px 8px 4px 12px; font-family:'Pretendard','Noto Sans KR',sans-serif; color:#e2e8f0;
	            box-shadow:0 4px 24px rgba(0,0,0,0.6); white-space:nowrap;
	            display:flex; align-items:center; gap:12px;
	        `;
	        panel.innerHTML = `
	            <span title="저장 후 짧게 누르면 적용 · 1초 홀드하면 이 설정창" style="font-size:12px; font-weight:700; cursor:default;">🎮 D-PAD ↑</span>
	            <label style="${lblCss}">밝기<select data-k="brightness" style="${selCss}">${bOpts}</select></label>
	            <label style="${lblCss}">화질<select data-k="quality" style="${selCss}">${qOpts}</select></label>
	            <label style="${lblCss}">지도 확대<select data-k="zoom" style="${selCss}">${zOpts}</select></label>
	            <label style="${lblCss}">자동정지<select data-k="adas" style="${selCss}">${aOpts}</select></label>
	            <button data-act="save" style="height:24px; padding:0 12px; border:none; border-radius:6px; background:#3b82f6; color:#fff; font-size:12px; font-weight:700; cursor:pointer;">저장</button>
	            <button data-act="close" style="width:22px; height:22px; border:none; border-radius:5px; background:transparent; color:#94a3b8; font-size:13px; cursor:pointer; line-height:1;">✕</button>
	        `;

	        // 조작이 없으면 3초 뒤 자동 종료. 클릭/선택/포커스 해제 때마다 3초를 다시 센다.
	        // (이벤트 리스너와 타이머는 이 패널이 떠 있는 동안에만 존재 — 상시 감시 없음)
	        let closing = false;
	        const bump = (ms = PRESET_PANEL_AUTO_CLOSE_MS) => {
	            if (closing) return;
	            clearTimeout(presetPanelTimer);
	            presetPanelTimer = setTimeout(closePresetPanel, ms);
	        };
	        panel.addEventListener('pointerenter', () => { if (!closing) clearTimeout(presetPanelTimer); });   // 마우스가 도착하는 동안은 대기
	        panel.addEventListener('pointerleave', () => bump());
	        panel.addEventListener('pointerdown', e => bump(e.target.closest?.('select') ? PRESET_SELECT_OPEN_GRACE_MS : undefined), true);
	        panel.addEventListener('focusout', () => bump());
	        panel.addEventListener('change', () => bump());

	        // 다른 입력창(예: 문장 송출)의 포커스를 빼앗지 않도록, 빈 곳 mousedown은 포커스 이동을 막는다
	        panel.addEventListener('mousedown', e => { if (!e.target.closest('select, button')) e.preventDefault(); });
	        // 패널 안 키 입력이 NCC 단축키로 새지 않게 차단 (Esc = 닫기)
	        panel.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') closePresetPanel(); });
	        // 값을 고른 뒤 포커스를 풀어, 이후 방향키 등이 select 값을 바꾸지 않게 함
	        panel.addEventListener('change', e => { e.target.blur?.(); });
	        panel.addEventListener('click', e => {
	            const act = e.target.closest('button')?.dataset.act;
	            if (act === 'close') { closePresetPanel(); return; }
	            if (act !== 'save') return;
	            const g = k => panel.querySelector(`[data-k="${k}"]`).value;
	            const ok = savePreset(sanitizePreset({ brightness: g('brightness'), quality: g('quality'), zoom: g('zoom'), adas: g('adas') }));
	            closing = true;
	            clearTimeout(presetPanelTimer);
	            panel.innerHTML = `<div style="padding:2px 10px; font-size:13px; font-weight:700; color:${ok ? '#86efac' : '#fca5a5'};">${ok ? '✓ 프리셋 저장됨' : '저장 실패 (브라우저 저장소 사용 불가)'}</div>`;
	            presetPanelTimer = setTimeout(closePresetPanel, 700);
	        });

	        document.body.appendChild(panel);   // focus() 호출 없음
	        presetPanelEl = panel;
	        bump();
	    };

	    // ── D-pad UP 상태 머신: 기존 100ms 폴링에서 매 틱 호출 (짧게 = 떼는 순간 적용 / 1초 = 설정 토스트) ──
	    const resetDpadUp = () => {
	        dpadWasPressed.up = false;
	        dpadUpHoldStart = null;
	        dpadUpTriggered = false;
	    };
	    const handleDpadUpTick = (pressed) => {
	        if (pressed) {
	            if (!dpadWasPressed.up) {
	                dpadWasPressed.up = true;
	                dpadUpHoldStart = performance.now();
	                dpadUpTriggered = false;
	            } else if (!dpadUpTriggered && performance.now() - dpadUpHoldStart >= PRESET_HOLD_MS) {
	                dpadUpTriggered = true;
	                try { openPresetPanel(); } catch (e) { console.error('[neubie] 프리셋 설정창 열기 실패', e); }
	            }
	        } else if (dpadWasPressed.up) {
	            const wasHold = dpadUpTriggered;
	            resetDpadUp();
	            if (!wasHold) applyPreset().catch(e => console.error('[neubie] 프리셋 적용 실패', e));
	        }
	    };
	    window.neubieDpadPreset = { open: openPresetPanel, apply: applyPreset, close: closePresetPanel };   // 콘솔 테스트용

	    setInterval(() => {
			if(isDpadBindingOff()) return;
			if (isOfflineMode()) { resetDpadUp(); return; }   // 오프라인: D-pad 단축키/프리셋(NCC 화면 조작) 전체 중지
	        const gp = (navigator.getGamepads ? navigator.getGamepads() : [])[0];
	        if (!gp) { resetDpadUp(); return; }
	        const isDrivingPage = location.href.includes('/remote/multiple/driving/')
	                           || location.href.includes('/remote/robot/');
	        if (!isDrivingPage) { closePresetPanel(); resetDpadUp(); return; }
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
	
	        // D-pad up (12) — 짧게: 저장된 프리셋(밝기/화질/지도 확대/자동정지) 적용 / 1.5초 홀드: 프리셋 설정 토스트
			handleDpadUpTick(!!gp.buttons[12]?.pressed);
	
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
            // 슬림판: 다중 모니터링 화면이 아니면 아무 것도 하지 않는다 (다른 페이지에서 DOM 전체 스캔 방지)
            if (!location.pathname.includes('/remote/multiple')) { document.getElementById(STYLE_ID)?.remove(); return; }
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

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-qk="monitoring-robots-dialog-delete-button"]');
            if (!btn) return;
            const row = btn.parentElement;
            const infoBlock = row && row.querySelector('.space-y-6');
            const nameEl = infoBlock && infoBlock.firstElementChild;
            const robotName = stripSerial(nameEl ? nameEl.textContent.trim() : null);
            if (!robotName) return;

            // 상시 옵저버 대신, 삭제 버튼을 누른 그 순간에만 짧게(최대 2초, 100ms 간격)
            // 확인 팝업이 뜨는지 지켜본다 — 평소엔 이 클릭 리스너 하나 말고 아무 비용이 없음.
            let attempts = 0;
            const poll = setInterval(() => {
                attempts++;
                const titleEl = [...document.querySelectorAll('div, p, span')].find(el =>
                    el.children.length === 0 && el.textContent.trim() === '로봇을 삭제하시겠습니까?'
                );
                if (titleEl && !titleEl.dataset.nbPatched) {
                    titleEl.textContent = `'${robotName}'${withEulReul(robotName).slice(robotName.length)} 삭제하시겠습니까?`;
                    titleEl.dataset.nbPatched = '1';
                    clearInterval(poll);
                } else if (attempts >= 20) {
                    clearInterval(poll); // 2초 내 못 찾으면 포기 (좀비 타이머 방지)
                }
            }, 100);
        }, true);
    }
    setupDeleteConfirmRobotName();


    /* ============================================================
        간단 설정창 — 켜기/끄기만 (Alt+Q: 다중 모니터링 페이지 밖 / 교대 패널의 ⚙ 버튼)
       ============================================================ */
    function closeSettingsPopup() {
        const el = document.getElementById('nb-settings-popup');
        if (el) { el._cleanup?.(); el.remove(); }
    }

    function toggleSettingsPopup() {
        if (document.getElementById('nb-settings-popup')) { closeSettingsPopup(); return; }

        const locked = ADMIN_CONFIG.locked;
        const rows = [
            {
                label: '🗺️ NCC 맵 최적화',
                sub: '역삼·송도·성수·삼평동 모니터링 화면 (흰 점 숨김, 대기장소 반전)',
                get: () => localStorage.getItem('neubie_opt_map') !== 'false',
                set: on => { localStorage.setItem('neubie_opt_map', on ? 'true' : 'false'); syncMapOpt(); },
            },
            {
                label: locked ? '🖥️ 다중 모니터링 도우미 (관리자 잠금)' : '🖥️ 다중 모니터링 도우미',
                sub: 'Alt+Q 교대 패널 · 전체 밝기 슬라이더',
                get: isHandoverFeatureOn,
                set: on => {
                    localStorage.setItem('neubie_handover_enabled', on ? 'true' : 'false');
                    if (!on) document.getElementById('ho-remote-panel')?.remove();
                    checkBrightnessBar();
                },
                disabled: locked,
            },
            {
                label: '🎮 패드 키 바인딩',
                sub: 'D-pad ↑ 프리셋(1초 홀드: 설정) · ←→ 밝기 · ↓ 자동정지',
                get: () => !isDpadBindingOff(),
                set: on => localStorage.setItem('neubie_dpad_binding', on ? 'on' : 'off'),
            },
            {
                label: '🎨 원격조종 라이트 테마',
                sub: '기체 원격조종(신형 /new) 화면',
                get: () => (localStorage.getItem(DRIVE_THEME_KEY) || 'dark') === 'light',
                set: on => {
                    const key = on ? 'light' : 'dark';
                    localStorage.setItem(DRIVE_THEME_KEY, key);
                    applyDriveTheme(key);
                },
            },
        ];

        const box = document.createElement('div');
        box.id = 'nb-settings-popup';
        box.style.cssText = `
            position:fixed; top:56px; right:20px; z-index:2147483647; width:340px; box-sizing:border-box;
            background:#1c1c1f; color:#e5e7eb; border:1px solid rgba(34,197,94,0.45); border-radius:14px;
            padding:12px 16px 10px; font-family:Pretendard,'Noto Sans KR',sans-serif;
            box-shadow:0 10px 40px rgba(0,0,0,0.6);
        `;

        const head = document.createElement('div');
        head.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:15px; font-weight:700;';
        const title = document.createElement('span');
        title.textContent = '🛰️ 뉴비고 도우미';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = 'width:24px; height:24px; border:none; border-radius:6px; background:transparent; color:#94a3b8; font-size:14px; cursor:pointer;';
        closeBtn.onclick = closeSettingsPopup;
        head.append(title, closeBtn);
        box.appendChild(head);

        rows.forEach(r => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 0; border-top:1px solid rgba(255,255,255,0.08);';

            const left = document.createElement('div');
            left.style.cssText = 'min-width:0;';
            const l1 = document.createElement('div');
            l1.style.cssText = 'font-size:13px; font-weight:600;';
            l1.textContent = r.label;
            const l2 = document.createElement('div');
            l2.style.cssText = 'font-size:11px; color:#9ca3af; margin-top:2px; line-height:1.35;';
            l2.textContent = r.sub;
            left.append(l1, l2);

            const sw = document.createElement('button');
            sw.style.cssText = 'min-width:52px; height:24px; border:none; border-radius:999px; font-size:11px; font-weight:800; cursor:pointer; flex-shrink:0;';
            const paint = () => {
                const on = !!r.get();
                sw.textContent = on ? 'ON' : 'OFF';
                sw.style.background = on ? '#22c55e' : '#55545c';
                sw.style.color = on ? '#062e13' : '#fff';
            };
            paint();
            if (r.disabled) { sw.disabled = true; sw.style.opacity = '0.45'; sw.style.cursor = 'not-allowed'; }
            sw.onclick = () => { r.set(!r.get()); paint(); };

            row.append(left, sw);
            box.appendChild(row);
        });

        const foot = document.createElement('div');
        foot.style.cssText = 'border-top:1px solid rgba(255,255,255,0.08); padding-top:8px; font-size:11px; color:#9ca3af; line-height:1.5;';
        foot.textContent = '패드 D-pad ↑ 1초 홀드: 프리셋 설정 · 다중 모니터링 페이지의 Alt+Q: 교대 패널';
        box.appendChild(foot);

        document.body.appendChild(box);

        // 바깥 클릭 / Esc 로 닫기 (패널의 ⚙ 버튼은 자체 토글이라 제외)
        const onDown = (ev) => {
            if (box.contains(ev.target)) return;
            if (ev.target.closest?.('[data-nb-gear]')) return;
            closeSettingsPopup();
        };
        const onKey = (ev) => { if (ev.key === 'Escape') closeSettingsPopup(); };
        setTimeout(() => {
            document.addEventListener('mousedown', onDown, true);
            document.addEventListener('keydown', onKey, true);
        }, 0);
        box._cleanup = () => {
            document.removeEventListener('mousedown', onDown, true);
            document.removeEventListener('keydown', onKey, true);
        };
    }


    /* ============================================================
        팝업 정리 · URL 변경 감지 · 단축키 · 초기화
       ============================================================ */
    function closeAllPopups() {
        document.getElementById('ho-remote-peek')?.remove();
        document.getElementById('ho-remote-panel')?.remove();
        closeSettingsPopup();
    }

    let lastUrl = location.href;

    // 주소가 바뀌었을 때(SPA 이동 포함) 한 번 실행
    function onUrlChange() {
        closeAllPopups();
        syncMapOpt();
        checkBrightnessBar();
        setTimeout(() => patchDrivingPageLayout(), 1500);
        setTimeout(() => patchDrivingPageLayout(), 3000);
        setTimeout(() => patchDrivingPageLayout(), 6000);
        setTimeout(() => initDriveTheme(), 1500);
        setTimeout(() => initDriveTheme(), 3000);
    }
    function checkUrlChange() {
        if (location.href === lastUrl) return;
        lastUrl = location.href;
        onUrlChange();
    }

    window.addEventListener('popstate', () => closeAllPopups());

    // NCC 메뉴를 클릭해 이동하면 즉시 반응 (클릭 직후 주소 확인)
    document.addEventListener('click', () => setTimeout(checkUrlChange, 100), true);

    // 클릭 없이 코드로만 주소가 바뀌는 경우 대비 (2초)
    setInterval(checkUrlChange, 2000);

    // Alt+Q — 다중 모니터링 페이지: 교대 패널 토글 / 그 외: 간단 설정창
    window.addEventListener('keydown', (e) => {
        if (!(e.altKey && e.code === 'KeyQ')) return;
        e.preventDefault();

        if (isHandoverPage() && isHandoverFeatureOn()) {
            const existing = document.getElementById('ho-remote-panel');
            if (existing) {
                const isOpen = existing.style.top === '0px';
                existing.style.top = isOpen ? '-300px' : '0px';
                if (!isOpen) existing._onOpen?.();   // 닫혀있다가 지금 여는 경우 — 남은 기체 대수 새로 조회
            } else {
                initHandoverLayout();
            }
            return;
        }
        toggleSettingsPopup();
    });

    // 초기화
    syncMapOpt();
    checkBrightnessBar();
    adminConfigReady.then(() => checkBrightnessBar());   // 관리자 잠금(locked) 확정 후 한 번 더
    setTimeout(() => initDriveTheme(), 1000);
    setTimeout(() => patchDrivingPageLayout(), 1500);
    setTimeout(() => patchDrivingPageLayout(), 3000);
    setTimeout(() => patchDrivingPageLayout(), 6000);

})();
