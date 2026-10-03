/* ============================================================
   battery_collector.js v1.0 — NCC 기체 수집기 (iframe 순회 + 응답 가로채기)
   NCC 에 "우리가" 보내는 요청은 0. 사이트 페이지를 숨김 iframe 으로 열면 NCC 페이지가 스스로
   robots/?...&sites=N 을 요청하는데, 그 응답을 수집 훅(battery_probe_hook.user.js)이 복사해 넘긴다.
   응답이 오면 iframe 은 즉시 제거. 한 사이클에서 같은 사이트를 다시 시도하지 않는다.

   두 가지 모드 (같은 파일):
     · 수집 탭  : admin(bb_is_cyh=1) 이고 주소가 #bb-collector 로 열린 탭(이후 탭 안에서 유지) — 순회·병합·배포
     · 그 외 탭 : 수집 탭이 BroadcastChannel 로 보내는 결과를 bb_robots_data 로 보드에 전달만 한다
   설정(콘솔에서 바꿀 수 있음):  localStorage.setItem('bb_collect_cfg', JSON.stringify({limit:0, pool:4, publish:true}))
   ============================================================ */
(function () {
    'use strict';
    if (window.__nbBattCollectorLoaded) return;
    window.__nbBattCollectorLoaded = true;

    // ── 사이트 목록 (battery_board.js 의 SITE_IDS 와 동일하게 유지) ──
    const SITE_IDS = [
        24,27,36,37,44,46,47,48,51,53,56,57,
        65,66,72,75,82,86,105,108,109,111,117,118,126,131,
        132,134,137,138,140,141,142,143,144,145,146,150,151,171,
        177,178,179,180,181,182,187,193,196,202,203,207,214,216,224,230,235,240,241,244,245,246,247,250,256,257,265
    ];

    // ── 기본 설정 ──
    //  limit  : 0 = 전체 사이트 / N = 앞에서 N개만 (시험용). 시험 중에는 보드로 보내지 않고 콘솔에만 출력한다.
    //  pool   : 동시에 띄우는 iframe 수
    //  publish: true 면 서버(api/battery)에 배포 (전체 사이트를 다 받았을 때만)
    const DEFAULTS = {
        limit: 8,
        pool: 4,
        staggerMs: 400,          // 같은 순간에 몰리지 않게 iframe 시작 간격
        siteTimeoutMs: 20000,    // 이 안에 응답이 안 오면 그 사이트는 이번 사이클 실패 (재시도 없음)
        cycleMs: 2 * 60 * 1000,  // 사이클 시작 간격 (사이클이 더 오래 걸리면 끝나는 즉시 다음 사이클)
        publish: false,
        publishName: 'robots_live',
        publishMinIntervalMs: 2 * 60 * 1000,   // 값이 바뀌었을 때 최소 배포 간격
        publishHeartbeatMs: 10 * 60 * 1000,    // 값이 안 바뀌어도 이 간격마다 1회 (수집 중단 감지용)
        staleWarnMs: 10 * 60 * 1000,           // 이보다 오래된 사이트는 stale 로 표시
        dispatchGapMs: 121000,                 // 보드는 직전 처리 후 2분 안에 온 이벤트를 무시한다 → 전달 간격 하한
    };
    const BACKUP_BASE = 'https://multimonitoring.vercel.app/api/battery';
    const CFG_URL = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/remote_admin_config.json';
    const BC_NAME = 'bb_robots';

    function cfg() {
        let o = {};
        try { o = JSON.parse(localStorage.getItem('bb_collect_cfg') || '{}') || {}; } catch (e) {}
        return Object.assign({}, DEFAULTS, o);
    }
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const log = (...a) => console.log('[BB-COLLECT]', ...a);

    // ══ 슬림 변환 (배포용) ══
    // 보드가 실제로 읽는 필드만 남긴다. inflate() 는 보드가 기대하는 raw 모양으로 되돌린다.
    function compact(raw) {
        const rs = raw.robotStatus || {};
        const v = raw.version || {};
        return {
            i: raw.id, n: raw.name, k: raw.nickname, s: raw.serialNumber,
            b: raw.battery, c: raw.isConnecting ? 1 : 0, d: raw.canDispatch === false ? 0 : 1,
            m: raw.currentScenarioTypeText || (raw.currentScenario ? 1 : 0),
            si: raw.site && raw.site.id, sn: raw.site && raw.site.name,
            st: raw.service && raw.service.serviceType,
            v: [v.softwareVersion && v.softwareVersion.swVersion,
                v.mechanicalDesignVersion && v.mechanicalDesignVersion.mdVer,
                v.relayVersion && v.relayVersion.relayFwMajor,
                v.relayVersion && v.relayVersion.relayFwMinor],
            r: {
                bt: rs.battery, cn: rs.isConnecting ? 1 : 0, ch: rs.isCharging ? 1 : 0,
                wc: rs.isWirelessChargerConnected ? 1 : 0, dk: rs.isOnWirelessChargerDock ? 1 : 0,
                wd: rs.isWiredChargerConnected ? 1 : 0,
                ac: rs.navpvtHorzAccuracy, ve: rs.velocity,
                lo: rs.lastOperatedAt, lu: rs.lastOperatedUserName, lc: rs.lastConnectedAt,
                ad: rs.isOnAdas ? 1 : 0, cp: rs.cpuUsage, tl: rs.chassisLeftTemperature, tr: rs.chassisRightTemperature,
                cam: [rs.isOnCamF, rs.isOnCamFd, rs.isOnCamFl, rs.isOnCamFr, rs.isOnCamBl, rs.isOnCamBr].map(x => x ? 1 : 0),
            },
        };
    }
    function inflate(c) {
        const r = c.r || {}, cam = r.cam || [];
        const v = c.v || [];
        return {
            id: c.i, name: c.n, nickname: c.k, serialNumber: c.s,
            battery: c.b, isConnecting: !!c.c, canDispatch: !!c.d,
            currentScenario: c.m ? { text: c.m === 1 ? '' : c.m } : null,
            currentScenarioTypeText: typeof c.m === 'string' ? c.m : null,
            site: { id: c.si, name: c.sn },
            service: { serviceType: c.st },
            version: {
                softwareVersion: { swVersion: v[0] },
                mechanicalDesignVersion: { mdVer: v[1] },
                relayVersion: { relayFwMajor: v[2], relayFwMinor: v[3] },
            },
            robotStatus: {
                battery: r.bt, isConnecting: !!r.cn, isCharging: !!r.ch,
                isWirelessChargerConnected: !!r.wc, isOnWirelessChargerDock: !!r.dk, isWiredChargerConnected: !!r.wd,
                navpvtHorzAccuracy: r.ac, velocity: r.ve,
                lastOperatedAt: r.lo, lastOperatedUserName: r.lu, lastConnectedAt: r.lc,
                isOnAdas: !!r.ad, cpuUsage: r.cp, chassisLeftTemperature: r.tl, chassisRightTemperature: r.tr,
                isOnCamF: !!cam[0], isOnCamFd: !!cam[1], isOnCamFl: !!cam[2], isOnCamFr: !!cam[3], isOnCamBl: !!cam[4], isOnCamBr: !!cam[5],
            },
        };
    }
    window.nbBattCompact = compact;
    window.nbBattInflate = inflate;   // 사용자용 웹이 배포본을 받아 보드 raw 모양으로 되돌릴 때 사용

    // ══ 보드로 전달 ══
    // partial = "일부 사이트만 받은 데이터". 보드는 부분 데이터면 목록 정리(없는 기체 삭제)를 건너뛴다 (data-bb-partial 속성으로 신호).
    function dispatchToBoard(jsonStr, partial) {
        const root = document.documentElement;
        if (partial) root.setAttribute('data-bb-partial', '1'); else root.removeAttribute('data-bb-partial');
        document.dispatchEvent(new CustomEvent('bb_robots_data', { detail: jsonStr }));
    }

    // ══ 수신 전용 탭: 수집 탭이 보낸 결과를 보드에 넘긴다 ══
    function startReceiver() {
        if (typeof BroadcastChannel === 'undefined') return;
        const bc = new BroadcastChannel(BC_NAME);
        let warned = false, first = true;
        bc.onmessage = e => {
            const m = e.data;
            const json = typeof m === 'string' ? m : (m && m.json);
            const partial = !!(m && typeof m === 'object' && m.partial);
            if (typeof json !== 'string') return;
            // 예전 보드(부분 데이터를 모름)에 부분 데이터를 넘기면 목록이 지워질 수 있다 → 지원하는 보드일 때만 전달
            if (partial && !window.__bbPartialOk) {
                if (!warned) { warned = true; log('⚠️ 일부 사이트만 받은 데이터라 전달하지 않았습니다 — battery_board.js 를 최신 버전으로 갱신해야 합니다(또는 전체 사이트 수신을 기다리는 중)'); }
                return;
            }
            if (first) { first = false; log(`수신 완료 — ${partial ? '부분' : '전체'} 데이터를 보드로 전달했습니다`); }
            dispatchToBoard(json, partial);
        };
        log('수신 모드 — 수집 탭의 결과를 보드로 전달합니다');
    }

    // ══ 수집 탭 ══
    function startCollector() {
        const bc = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel(BC_NAME) : null;
        const pending = new Map();           // siteId → resolve(robots[])
        const store = {};                    // siteId → { at, robots }
        let lastPubHash = '', lastPubAt = 0, cycleNo = 0, running = false;

        // 훅이 부르는 함수. sitesParam = "241" 또는 "241,242", text = 응답 본문(문자열)
        window.__nbBattCapture = function (sitesParam, text) {
            let d;
            try { d = JSON.parse(text); } catch (e) { return; }
            const list = d && d.results;
            if (!Array.isArray(list)) return;
            if (d.next) log('⚠️ 응답이 한 번에 다 오지 않았습니다(next 있음) — sites=' + sitesParam);
            const ids = String(sitesParam).split(',').map(s => Number(s)).filter(n => n > 0);
            ids.forEach(id => {
                const fn = pending.get(id);
                if (fn) fn(list.filter(r => r && r.site && r.site.id === id));
            });
        };

        // ── 배지 (수집 탭 상태 표시) ──
        const badge = document.createElement('div');
        badge.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#111c;color:#9fe;font:12px/1.4 monospace;padding:6px 10px;border-radius:8px;pointer-events:none;white-space:pre';
        const mountBadge = () => { if (!badge.isConnected && document.body) document.body.appendChild(badge); };
        let badgeNote = '';
        const setBadge = t => { mountBadge(); badge.textContent = t + (badgeNote ? '\n' + badgeNote : '') + (document.hidden ? '\n⚠ 탭이 가려져 있으면 수집이 느려질 수 있습니다' : ''); };

        function makeFrame(id) {
            const f = document.createElement('iframe');
            f.setAttribute('data-nb-batt-probe', '1');
            f.setAttribute('aria-hidden', 'true');
            f.tabIndex = -1;
            f.style.cssText = 'position:fixed;left:0;top:0;width:1440px;height:900px;opacity:0;pointer-events:none;border:0;z-index:-1';
            f.src = `${location.origin}/ko/monitoring/${id}`;
            return f;
        }
        function killFrame(f) {
            try { f.contentWindow && f.contentWindow.stop && f.contentWindow.stop(); } catch (e) {}
            try { f.src = 'about:blank'; } catch (e) {}
            try { f.remove(); } catch (e) {}
        }

        // 한 사이트: 응답이 오면 즉시 iframe 제거. 타임아웃이면 제거하고 실패 (재시도 없음)
        function probeSite(id, timeoutMs) {
            return new Promise(resolve => {
                const t0 = Date.now();
                const f = makeFrame(id);
                let done = false;
                const finish = (robots, err) => {
                    if (done) return; done = true;
                    clearTimeout(timer); pending.delete(id); killFrame(f);
                    resolve({ id, robots, err, ms: Date.now() - t0 });
                };
                const timer = setTimeout(() => finish(null, 'timeout'), timeoutMs);
                pending.set(id, robots => finish(robots, null));
                (document.body || document.documentElement).appendChild(f);
            });
        }

        // 수집기 전용 일시정지 스위치. (보드/remote 의 "오프라인 모드"와는 별개 — 그 스위치는 NCC API 호출을 막으려는 것이고,
        // 이 수집기는 NCC 로 요청을 보내지 않으므로 오프라인 모드가 켜져 있어도 돈다.)
        //   · 이 PC:  localStorage.setItem('bb_collect_pause','1')   (해제: removeItem)
        //   · 원격:   remote_admin_config.json 의 "collector_off": true
        async function isPaused() {
            try { if (localStorage.getItem('bb_collect_pause') === '1') return true; } catch (e) {}
            try {
                const res = await fetch(`${CFG_URL}?t=${Date.now()}`, { cache: 'no-store', signal: (AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined) });
                if (res.ok) { const c = await res.json(); if (c && c.collector_off === true) return true; }
            } catch (e) {}
            return false;
        }

        async function runCycle() {
            if (running) return;
            running = true;
            const C = cfg();
            const t0 = Date.now();
            cycleNo++;
            try {
                if (await isPaused()) { log('일시정지 — 이번 사이클 건너뜀'); setBadge('수집 일시정지 중'); return; }

                const sites = C.limit > 0 ? SITE_IDS.slice(0, C.limit) : SITE_IDS.slice();
                const queue = sites.slice();
                const stats = { ok: 0, fail: [], ms: [] };
                let started = 0;
                const worker = async w => {
                    await sleep(w * C.staggerMs);
                    while (queue.length) {
                        const id = queue.shift();
                        started++;
                        setBadge(`수집 중 ${started}/${sites.length}  (사이클 ${cycleNo})`);
                        const r = await probeSite(id, C.siteTimeoutMs);
                        if (r.robots) { store[id] = { at: Date.now(), robots: r.robots }; stats.ok++; stats.ms.push(r.ms); }
                        else stats.fail.push(id + ':' + r.err);
                        await sleep(C.staggerMs);
                    }
                };
                await Promise.all(Array.from({ length: Math.max(1, C.pool) }, (_, w) => worker(w)));

                const elapsed = Date.now() - t0;
                const avg = stats.ms.length ? Math.round(stats.ms.reduce((a, b) => a + b, 0) / stats.ms.length) : 0;
                log(`사이클 ${cycleNo}: ${stats.ok}/${sites.length} 성공, ${Math.round(elapsed / 1000)}초, 사이트당 평균 ${avg}ms` +
                    (stats.fail.length ? `, 실패: ${stats.fail.join(', ')}` : ''));
                finalize(C, sites);
                setBadge(`마지막 완료 ${new Date().toTimeString().slice(0, 8)}  (${stats.ok}/${sites.length}, ${Math.round(elapsed / 1000)}초)`);
            } catch (e) {
                log('사이클 오류:', e && e.message);
            } finally {
                running = false;
                const wait = Math.max(0, C.cycleMs - (Date.now() - t0));
                setTimeout(runCycle, wait);
            }
        }

        const currentAll = () => {
            const all = [];
            SITE_IDS.forEach(id => { if (store[id]) store[id].robots.forEach(r => all.push(r)); });
            return all;
        };
        // 보드는 직전 처리 후 2분 안에 온 이벤트를 무시한다 → 사이클 소요 시간이 들쭉날쭉해도 전달 간격은 dispatchGapMs(121초) 이상 유지.
        // 예약돼 있으면 예약 시점에 "그때 가장 최신" 데이터를 보낸다.
        let lastDispatchAt = 0, dispatchTimer = null;
        function queueDispatch() {
            if (dispatchTimer) return;
            const wait = Math.max(0, lastDispatchAt + cfg().dispatchGapMs - Date.now());
            dispatchTimer = setTimeout(() => {
                dispatchTimer = null;
                const all = currentAll();
                if (!all.length) return;
                const partial = SITE_IDS.some(id => !store[id]);   // 예약 시점 기준으로 다시 판단
                const json = JSON.stringify(all);
                lastDispatchAt = Date.now();
                dispatchToBoard(json, partial);                                      // 이 탭의 보드(있으면)
                try { bc && bc.postMessage({ json, partial }); } catch (e) {}        // 같은 PC 의 다른 보드 탭
            }, wait);
        }

        // 사이클 결과 처리: 받은 만큼 보드로 전달한다. 일부 사이트만 받았으면 partial 로 표시 → 보드가 목록 정리를 건너뛴다.
        // (못 받은 사이트 하나 때문에 전체가 멈추지 않고, 시험 모드에서도 보드에 결과가 보인다)
        function finalize(C, sitesThisRun) {
            const missing = SITE_IDS.filter(id => !store[id]);
            const all = currentAll();
            window.__nbBattLast = { at: Date.now(), robots: all, missing };

            if (C.limit > 0) {
                log(`시험 모드(limit=${C.limit}) — 앞 ${C.limit}개 사이트만 수집 중. 기체 ${all.length}대:`);
                try {
                    console.table(all.map(r => ({
                        site: r.site && r.site.id, name: r.nickname || r.name, battery: r.battery,
                        conn: r.isConnecting, charging: r.robotStatus && r.robotStatus.isCharging,
                        dock: r.robotStatus && r.robotStatus.isOnWirelessChargerDock, scenario: !!r.currentScenario,
                    })));
                } catch (e) {}
                badgeNote = `⚠ 시험 모드(limit=${C.limit}) — 전체: localStorage.setItem('bb_collect_cfg',JSON.stringify({limit:0}))`;
            } else if (missing.length) {
                log(`아직 받지 못한 사이트 ${missing.length}곳(${missing.join(',')}) — 받은 만큼 부분 데이터로 전달합니다(목록은 지워지지 않음)`);
                badgeNote = `⚠ 미수신 사이트 ${missing.length}곳: ${missing.slice(0, 8).join(',')}${missing.length > 8 ? '…' : ''}`;
            } else badgeNote = '';

            if (!all.length) { log('받은 기체가 없어 전달하지 않습니다'); return; }

            const now = Date.now();
            const stale = SITE_IDS.filter(id => store[id] && now - store[id].at > C.staleWarnMs);
            if (stale.length) log(`⚠️ 오래된 사이트(최근 ${Math.round(C.staleWarnMs / 60000)}분 내 갱신 실패): ${stale.join(',')}`);

            queueDispatch();

            if (C.publish) publish(C, all, stale, missing);
        }

        async function publish(C, all, stale, missing) {
            const robots = all.map(compact);
            const body = JSON.stringify(robots);
            let h = 0; for (let i = 0; i < body.length; i++) h = (h * 31 + body.charCodeAt(i)) | 0;
            const hash = String(h) + ':' + body.length;
            const now = Date.now();
            const changed = hash !== lastPubHash;
            if (changed && now - lastPubAt < C.publishMinIntervalMs) return;
            if (!changed && now - lastPubAt < C.publishHeartbeatMs) return;
            try {
                const res = await fetch(BACKUP_BASE, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: C.publishName, data: { v: 1, at: new Date().toISOString(), stale, missing, robots } }),
                });
                if (res.ok) { lastPubHash = hash; lastPubAt = now; log(`배포 완료 (${robots.length}대, ${Math.round(body.length / 1024)}KB${changed ? '' : ', 하트비트'})`); }
                else log('배포 실패 HTTP', res.status);
            } catch (e) { log('배포 실패:', e && e.message); }
        }

        log(`수집 탭 시작 — 사이트 ${SITE_IDS.length}곳, ${JSON.stringify({ limit: cfg().limit, pool: cfg().pool, publish: cfg().publish })}`);
        setBadge('수집 준비 중…');
        setTimeout(runCycle, 1500);
    }

    // ══ 모드 결정 ══
    function isCollectorTab() {
        try {
            if (location.hash.indexOf('bb-collector') >= 0) { sessionStorage.setItem('bb_collector_tab', '1'); return true; }
            return sessionStorage.getItem('bb_collector_tab') === '1';
        } catch (e) { return false; }
    }
    let admin = false;
    try { admin = localStorage.getItem('bb_is_cyh') === '1'; } catch (e) {}

    if (isCollectorTab() && admin) {
        if (navigator.locks && navigator.locks.request) {
            // 수집 탭이 둘이 되지 않도록 (이 탭이 살아 있는 동안 락을 쥔다)
            navigator.locks.request('bb_collector', { ifAvailable: true }, lock => {
                if (!lock) { log('다른 탭이 이미 수집 중입니다 — 이 탭은 수집하지 않습니다'); return; }
                startCollector();
                return new Promise(() => {});   // 탭이 닫힐 때까지 락 유지
            });
        } else startCollector();
    } else {
        startReceiver();
    }
})();
