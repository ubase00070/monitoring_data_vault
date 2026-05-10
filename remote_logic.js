/**
 * [뉴빌리티] 통합 관제 엔진 - Dashboard Edition (v14.0)
 * 단축키: Alt + / (설정창 토글)
 */
(function() {
    'use strict';

    // 🛡️ [보안 통과] Trusted Types 정책 생성 (구글 사이트 필수)
    let policy = { createHTML: (s) => s };
    if (window.trustedTypes && window.trustedTypes.createPolicy) {
        policy = window.trustedTypes.createPolicy('neubie-policy', {
            createHTML: (s) => s
        });
    }
    
    // 1. 상태 관리 (로컬 저장소와 연동)
    const state = {
        isMapOpt: localStorage.getItem('neubie_opt_map') === 'true',
        isBatteryVisible: false, // 배터리 팝업은 매번 새로 켜는 방식
    };

    // 2. UI 레이아웃 생성 (메인 설정창)
    const dashboard = document.createElement('div');
    dashboard.id = 'neubie-dashboard';
    Object.assign(dashboard.style, {
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '450px', backgroundColor: '#1a1a1a', color: '#fff',
        borderRadius: '20px', padding: '25px', zIndex: '1000000',
        fontFamily: 'Pretendard, sans-serif', boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        border: '1px solid #333', display: 'none'
    });
    document.body.appendChild(dashboard);

    // 3. UI 렌더링 함수 (기능 추가 시 여기만 수정)
    function renderDashboard() {
        dashboard.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="margin:0; font-size:20px; color:#3b82f6;">🛰️ Neubie Helper Panel</h2>
                <span style="font-size:12px; color:#666;">v14.0 | Alt + /</span>
            </div>
            
            <div style="display:grid; gap:15px;">
                <div style="background:#252525; padding:15px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:bold;">🗺️ 지도 렌더링 최적화</div>
                        <div style="font-size:12px; color:#aaa;">불필요한 노드를 제거하여 속도 향상</div>
                    </div>
                    <input type="checkbox" id="toggle-map-opt" ${state.isMapOpt ? 'checked' : ''} style="width:20px; height:20px; cursor:pointer;">
                </div>

                <div style="background:#252525; padding:15px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:bold;">🔋 성남 배터리 모니터링</div>
                        <div style="font-size:12px; color:#aaa;">실시간 배터리 현황 및 텍스트 복사</div>
                    </div>
                    <button id="btn-battery-pop" style="background:#3b82f6; color:#fff; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold;">열기</button>
                </div>

                <div style="background:#151515; padding:15px; border-radius:12px; border:1px dashed #333; color:#555; text-align:center;">
                    준비 중인 기능...
                </div>
            </div>
        `;

        // 🛡️ 수정 포인트: innerHTML 대신 정책을 거친 HTML 삽입
        if (window.trustedTypes && window.trustedTypes.createPolicy) {
            dashboard.innerHTML = policy.createHTML(rawHTML);
        } else {
            dashboard.innerHTML = rawHTML;
        }

        // 이벤트 리스너 연결
        document.getElementById('toggle-map-opt').onchange = (e) => {
            state.isMapOpt = e.target.checked;
            localStorage.setItem('neubie_opt_map', state.isMapOpt);
            location.reload(); // 맵 최적화는 새로고침 적용 권장
        };

        document.getElementById('btn-battery-pop').onclick = () => {
            toggleBatteryPopup(); // 배터리 팝업 함수 실행
            dashboard.style.display = 'none'; // 대시보드 닫기
        };
    }

    // 4. 배터리 팝업 로직 (기존 UI 유지하되 함수화)
    const batteryPopup = document.createElement('div');
    // ... (기존 배터리 팝업 스타일 및 초기 설정 동일) ...
    // 대시보드와 충돌 방지를 위해 별도 생성

    function toggleBatteryPopup() {
        if (batteryPopup.style.display === 'none') {
            updateStatus(); // 데이터 업데이트
            batteryPopup.style.display = 'block';
        } else {
            batteryPopup.style.display = 'none';
        }
    }

    // 5. 메인 단축키 리스너 (Alt + /)
    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'Slash') {
            e.preventDefault();
            if (dashboard.style.display === 'none') {
                renderDashboard();
                dashboard.style.display = 'block';
            } else {
                dashboard.style.display = 'none';
            }
        }
    });

    // 6. 초기 실행 (맵 최적화 등 백그라운드 로직)
    if (state.isMapOpt) {
        // ... 기존 맵 최적화 fetch 가속 및 style 주입 로직 ...
    }

})();
