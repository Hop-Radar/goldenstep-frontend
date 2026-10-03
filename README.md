# Golden Step Frontend

Golden Step은 실종자의 마지막 확인 위치와 경과 시간 등의 데이터를 기반으로
이동 가능 범위와 우선 확인 지역을 안내하는 데이터 기반 탐색 지원 서비스입니다.

본 Repository는 Golden Step의 Frontend 영역을 담당합니다.

## 주요 기능

- 마지막 확인 위치 지도 검색 및 위치 선택
- 마지막 확인 시각 입력 및 유효성 검증
- 대상자 정보 입력 및 필수 항목 검증
- 탐색 분석 진행 상태 UI
- 지도 기반 우선 확인 지역 시각화
- 경과 시간별 탐색 범위 확인
- 우선 확인 장소 목록 제공
- 보행 경로 확인
- 탐색 정보 공유
- 탐색보드 제공
- 112 긴급 신고 안내
- 실종아동등 신고 182 안내
- 경찰청 안전Dream 연결
- 반응형 UI 지원

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- Naver Maps API

## 프로젝트 구조

```text
goldenstep-frontend/
├── assets/
│   ├── icons/
│   └── images/
├── css/
├── js/
├── index.html
├── search-form.html
└── ...