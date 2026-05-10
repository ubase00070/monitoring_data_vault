// ==UserScript==
// @name         🛰️ 뉴비 통합 모니터링 (v12.0 - Alt+B & 지능형 시간복사)
// @namespace    http://tampermonkey.net/
// @version      12.0
// @author       ubase00070
// @match        https://go.neubie.ai/ko/remote/multiple/driving*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. 설정: 순서 고정
    const targetConfigs = [
        { id: '142', name: '성남판교 200', shortName: '판교 200' },
        { id: '145', name: '성남서현 201', shortName: '서현 201' },
        { id: '144', name: '성남율동 202', shortName: '율동 202' },
        { id: '155', name: '성남야탑 203', shortName: '야탑 203' }
    ];
    const iframes = {};
    let lastData = [];

    // 2. 팝업 UI 생성
    const popup = document.createElement('div');
    Object.assign(popup.style, {
        position: 'fixed', top: '20px', right: '20px',
        backgroundColor: 'rgba(10, 10, 10, 0.98)', color: '#ffffff', padding: '20px',
        borderRadius: '15px', zIndex: '999999', fontSize: '17px',
        border: '1px solid #444', minWidth: '340px',
        fontFamily: 'Pretendard, sans-serif',
        display: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', lineHeight: '1.8'
    });
    document.body.appendChild(popup);

    // 3. iframe 생성
    targetConfigs.forEach(config => {
        const ifr = document.createElement('iframe');
        ifr.src = `https://go.neubie.ai/ko/monitoring/${config.id}`;
        Object.assign(ifr.style, { width: '0', height: '0', border: 'none', display: 'none' });
        document.body.appendChild(ifr);
        iframes[config.id] = ifr;
    });

    // 4. 복사 기능 (시간 올림 로직 포함)
    function copyToClipboard() {
        const now = new Date();
        let hour = now.getHours();
        const minutes = now.getMinutes();

        // 50분 이상이면 다음 시간으로 올림
        if (minutes >= 50) {
            hour = (hour + 1) % 24;
        }

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

    // 5. 데이터 업데이트
    function updateStatus() {
        let tempLastData = [];
        let finalHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
            <b style="color:#eee; font-size:19px;">🛰️ 성남 배터리 모니터링</b>
            <button id="copy-btn" style="background:#3b82f6; color:white; border:none; padding:6px 14px; border-radius:6px; cursor:pointer; font-size:14px; font-weight:bold;">📋 복사</button>
        </div>`;

        targetConfigs.forEach(config => {
            try {
                const doc = iframes[config.id].contentDocument || iframes[config.id].contentWindow.document;
                const card = doc.querySelector('li[data-qk="robot-card"]');

                let batteryVal = "- %"; // OFF 시 표기 변경
                let statusText = "OFF";
                let accentColor = "#666";
                let statusIcon = "⚪";
                let isPatrolling = false;

                if (card) {
                    const cardText = card.innerText;
                    const batteryMatch = cardText.match(/(\d+)%/);
                    const isCharging = card.querySelector('svg[class*="text-tertiary-300"]') || cardText.includes('배터리');
                    isPatrolling = cardText.includes('순회');

                    if (batteryMatch) {
                        batteryVal = batteryMatch[0];
                        if (isPatrolling) {
                            accentColor = "#3b82f6";
                            statusIcon = "🔵";
                            statusText = "순회 중";
                        } else if (isCharging) {
                            accentColor = "#22c55e";
                            statusIcon = "🟢";
                            statusText = "충전 중";
                        } else {
                            accentColor = "#888888";
                            statusIcon = "⚪";
                            statusText = "대기 중";
                        }
                    }
                }

                tempLastData.push({ shortName: config.shortName, battery: batteryVal, statusText: statusText });

                finalHTML += `
                <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.03); padding:12px 16px; border-radius:10px; margin-bottom:8px; border-left:5px solid ${accentColor};">
                    <span style="color:${(isPatrolling || statusText === '충전 중') ? '#fff' : '#aaa'}; font-weight:${isPatrolling ? 'bold' : 'normal'};">
                        ${statusIcon} ${config.name}
                    </span>
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

    // 6. 단축키 핸들러 (Alt + B)
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

    // 10초마다 데이터 동기화
    setInterval(() => {
        if (popup.style.display === 'block') updateStatus();
    }, 30000);

})();
