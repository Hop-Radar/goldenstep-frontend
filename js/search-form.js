const searchForm = document.querySelector("#search-form");

const lastLocation = document.querySelector("#last-location");
const locationSearchButton = document.querySelector("#location-search-button");
const locationSearchResults = document.querySelector("#location-search-results");

const lastLocationLat = document.querySelector("#last-location-lat");
const lastLocationLng = document.querySelector("#last-location-lng");

const selectedLocation = document.querySelector("#selected-location");
const selectedRoadAddress = document.querySelector("#selected-road-address");
const selectedJibunAddress = document.querySelector("#selected-jibun-address");
const confirmLocationButton = document.querySelector("#confirm-location-button");

const lastSeenDate = document.querySelector("#last-seen-date");
const lastSeenHour = document.querySelector("#last-seen-hour");
const lastSeenMinute = document.querySelector("#last-seen-minute");
const lastSeenTime = document.querySelector("#last-seen-time");

const personCard = document.querySelector(".person-card");
const personToggle = document.querySelector("#person-toggle");
const personDetails = document.querySelector("#person-details");
const personSummary = document.querySelector("#person-summary");
const personAge = document.querySelector("#person-age");
const personCompleteButton = document.querySelector("#person-complete-button");
const additionalInfo = document.querySelector("#additional-info");

const PERSON_TYPE_LABELS = {
  child: "어린아이",
  teenager: "청소년",
  "adult-female": "성인 여성",
  "adult-male": "성인 남성",
  "senior-female": "노약자(여성)",
  "senior-male": "노약자(남성)"
};

const STATUS_LABELS = {
  none: "없음",
  yes: "있음",
  unknown: "알 수 없음"
};

const DEFAULT_LATITUDE = 37.5666103;
const DEFAULT_LONGITUDE = 126.9783882;
const DEFAULT_ZOOM = 14;

let searchMap = null;
let locationMarker = null;

let pendingLatitude = null;
let pendingLongitude = null;
let pendingRoadAddress = "";
let pendingJibunAddress = "";
let isPersonInformationCompleted = false;

const MOCK_PLACES = [
  {
    name: "롯데월드",
    roadAddress: "서울특별시 송파구 올림픽로 240",
    jibunAddress: "서울특별시 송파구 잠실동 40-1",
    lat: 37.5111,
    lng: 127.0982
  },
  {
    name: "에버랜드",
    roadAddress: "경기도 용인시 처인구 포곡읍 에버랜드로 199",
    jibunAddress: "경기도 용인시 처인구 포곡읍 전대리 310",
    lat: 37.2933,
    lng: 127.2008
  },
  {
    name: "타임스퀘어",
    roadAddress: "서울특별시 영등포구 영중로 15",
    jibunAddress: "서울특별시 영등포구 영등포동4가 442",
    lat: 37.5170,
    lng: 126.9030
  },
  {
    name: "서울역 (고속철도)",
    roadAddress: "서울특별시 용산구 한강대로 405",
    jibunAddress: "서울특별시 용산구 동자동 43-205",
    lat: 37.5540730,
    lng: 126.9707021
  },
  {
    name: "고려대학교 서울캠퍼스",
    roadAddress: "서울특별시 성북구 안암로 145",
    jibunAddress: "서울특별시 성북구 안암동5가 1-2",
    lat: 37.5894,
    lng: 127.0325
  },
  {
    name: "연세대학교 신촌캠퍼스",
    roadAddress: "서울특별시 서대문구 연세로 50",
    jibunAddress: "서울특별시 서대문구 신촌동 134",
    lat: 37.5658,
    lng: 126.9386
  },
  {
    name: "서울대학교 관악캠퍼스",
    roadAddress: "서울특별시 관악구 관악로 1",
    jibunAddress: "서울특별시 관악구 신림동 산56-1",
    lat: 37.4599,
    lng: 126.9519
  },
  {
    name: "명동역 4호선",
    roadAddress: "서울특별시 중구 퇴계로 126",
    jibunAddress: "서울특별시 중구 충무로2가 109-2",
    lat: 37.5609,
    lng: 126.9862
  }
];

const getLocalDateString = (date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const createHourOption = (hour) => {
  const value = String(hour).padStart(2, "0");
  const option = document.createElement("option");

  option.value = value;

  if (hour === 0) {
    option.textContent = "00시 (자정)";
  } else if (hour === 12) {
    option.textContent = "12시 (정오)";
  } else {
    option.textContent = `${value}시`;
  }

  return option;
};

const createMinuteOption = (minute) => {
  const value = String(minute).padStart(2, "0");
  const option = document.createElement("option");

  option.value = value;
  option.textContent = `${value}분`;

  return option;
};

const createAgeOption = (value, label) => {
  const option = document.createElement("option");

  option.value = value;
  option.textContent = label;

  return option;
};

const initializeTimeOptions = () => {
  if (!lastSeenHour || !lastSeenMinute) {
    return;
  }

  for (let hour = 0; hour < 24; hour += 1) {
    lastSeenHour.appendChild(
      createHourOption(hour)
    );
  }

  for (let minute = 0; minute < 60; minute += 5) {
    lastSeenMinute.appendChild(
      createMinuteOption(minute)
    );
  }
};

const initializeAgeOptions = () => {
  if (!personAge) {
    return;
  }

  personAge.appendChild(
    createAgeOption(
      "under-10",
      "10세 이하"
    )
  );

  for (let age = 11; age <= 84; age += 1) {
    personAge.appendChild(
      createAgeOption(
        String(age),
        `${age}세`
      )
    );
  }

  personAge.appendChild(
    createAgeOption(
      "over-85",
      "85세 이상"
    )
  );
};

const initializeLastSeenDate = () => {
  if (!lastSeenDate) {
    return;
  }

  const now = new Date();

  lastSeenDate.max =
    getLocalDateString(now);
};

const updateAvailableTimeOptions = () => {
  if (
    !lastSeenDate ||
    !lastSeenHour ||
    !lastSeenMinute
  ) {
    return;
  }

  const selectedDate =
    lastSeenDate.value;

  const now = new Date();

  const today =
    getLocalDateString(now);

  const hourOptions =
    Array.from(
      lastSeenHour.options
    );

  const minuteOptions =
    Array.from(
      lastSeenMinute.options
    );

  hourOptions.forEach((option) => {
    if (!option.value) {
      return;
    }

    option.disabled = false;
  });

  minuteOptions.forEach((option) => {
    if (!option.value) {
      return;
    }

    option.disabled = false;
  });

  if (
    !selectedDate ||
    selectedDate !== today
  ) {
    return;
  }

  const currentHour =
    now.getHours();

  const currentMinute =
    now.getMinutes();

  hourOptions.forEach((option) => {
    if (!option.value) {
      return;
    }

    const hour =
      Number(option.value);

    option.disabled =
      hour > currentHour;
  });

  if (
    lastSeenHour.value &&
    Number(lastSeenHour.value) === currentHour
  ) {
    minuteOptions.forEach((option) => {
      if (!option.value) {
        return;
      }

      const minute =
        Number(option.value);

      option.disabled =
        minute > currentMinute;
    });
  }

  if (
    lastSeenHour.value &&
    Number(lastSeenHour.value) > currentHour
  ) {
    lastSeenHour.value = "";
    lastSeenMinute.value = "";
  }

  if (
    lastSeenHour.value &&
    Number(lastSeenHour.value) === currentHour &&
    lastSeenMinute.value &&
    Number(lastSeenMinute.value) > currentMinute
  ) {
    lastSeenMinute.value = "";
  }
};

const clearConfirmedLocation = () => {
  if (lastLocationLat) {
    lastLocationLat.value = "";
  }

  if (lastLocationLng) {
    lastLocationLng.value = "";
  }

  if (confirmLocationButton) {
    confirmLocationButton.classList.remove(
      "is-confirmed"
    );

    confirmLocationButton.textContent =
      "이 위치로 선택";
  }
};

const hideLocationSearchResults = () => {
  if (!locationSearchResults) {
    return;
  }

  locationSearchResults.innerHTML = "";
  locationSearchResults.hidden = true;
};

const showSearchMessage = (message) => {
  if (!locationSearchResults) {
    return;
  }

  locationSearchResults.innerHTML = "";

  const messageElement =
    document.createElement("div");

  messageElement.className =
    "location-search-message";

  messageElement.textContent =
    message;

  locationSearchResults.appendChild(
    messageElement
  );

  locationSearchResults.hidden = false;
};

const getResultAddress = (result) => {
  return (
    result.roadAddress ||
    result.jibunAddress ||
    result.englishAddress ||
    lastLocation.value.trim()
  );
};

const buildRoadAddress = (result) => {
  const region = result.region || {};
  const land = result.land || {};

  const area1 =
    region.area1?.name || "";

  const area2 =
    region.area2?.name || "";

  const roadName =
    land.name || "";

  const number1 =
    land.number1 || "";

  const number2 =
    land.number2 || "";

  if (!roadName || !number1) {
    return "";
  }

  const buildingNumber =
    number2
      ? `${number1}-${number2}`
      : number1;

  return [
    area1,
    area2,
    roadName,
    buildingNumber
  ]
    .filter(Boolean)
    .join(" ");
};

const buildJibunAddress = (result) => {
  const region = result.region || {};
  const land = result.land || {};

  const area1 =
    region.area1?.name || "";

  const area2 =
    region.area2?.name || "";

  const area3 =
    region.area3?.name || "";

  const area4 =
    region.area4?.name || "";

  const number1 =
    land.number1 || "";

  const number2 =
    land.number2 || "";

  const landNumber =
    number1
      ? number2
        ? `${number1}-${number2}`
        : number1
      : "";

  return [
    area1,
    area2,
    area3,
    area4,
    landNumber
  ]
    .filter(Boolean)
    .join(" ");
};

const renderSelectedLocation = () => {
  if (selectedRoadAddress) {
    selectedRoadAddress.textContent =
      pendingRoadAddress ||
      "도로명 주소가 없습니다.";
  }

  if (selectedJibunAddress) {
    selectedJibunAddress.textContent =
      pendingJibunAddress ||
      "지번 주소가 없습니다.";
  }

  if (selectedLocation) {
    selectedLocation.hidden = false;
  }

  if (confirmLocationButton) {
    confirmLocationButton.classList.remove(
      "is-confirmed"
    );

    confirmLocationButton.textContent =
      "이 위치로 선택";
  }
};

const updateLocationInformation = (
  latitude,
  longitude
) => {
  pendingLatitude = latitude;
  pendingLongitude = longitude;

  pendingRoadAddress = "";
  pendingJibunAddress = "";

  clearConfirmedLocation();

  if (
    typeof naver === "undefined" ||
    !naver.maps ||
    !naver.maps.Service
  ) {
    renderSelectedLocation();
    return;
  }

  const coordinate =
    new naver.maps.LatLng(
      latitude,
      longitude
    );

  naver.maps.Service.reverseGeocode(
    {
      coords: coordinate,
      orders: [
        naver.maps.Service.OrderType.ROAD_ADDR,
        naver.maps.Service.OrderType.ADDR
      ].join(",")
    },
    (status, response) => {
      if (
        status !==
        naver.maps.Service.Status.OK
      ) {
        renderSelectedLocation();
        return;
      }

      const results =
        response.v2.results || [];

      const roadResult =
        results.find(
          (result) =>
            result.name === "roadaddr"
        );

      const jibunResult =
        results.find(
          (result) =>
            result.name === "addr"
        );

      if (roadResult) {
        pendingRoadAddress =
          buildRoadAddress(
            roadResult
          );
      }

      if (jibunResult) {
        pendingJibunAddress =
          buildJibunAddress(
            jibunResult
          );
      }

      renderSelectedLocation();
    }
  );
};

const handleMarkerDragEnd = () => {
  if (!locationMarker) {
    return;
  }

  const position =
    locationMarker.getPosition();

  updateLocationInformation(
    position.lat(),
    position.lng()
  );
};

const setLocationMarker = (
  latitude,
  longitude
) => {
  if (!searchMap) {
    return;
  }

  const position =
    new naver.maps.LatLng(
      latitude,
      longitude
    );

  if (locationMarker) {
    locationMarker.setPosition(
      position
    );
  } else {
    locationMarker =
      new naver.maps.Marker({
        position,
        map: searchMap,
        draggable: true
      });

    naver.maps.Event.addListener(
      locationMarker,
      "dragend",
      handleMarkerDragEnd
    );
  }

  updateLocationInformation(
    latitude,
    longitude
  );
};

const handleMapClick = (event) => {
  if (!event.coord) {
    return;
  }

  const latitude =
    event.coord.lat();

  const longitude =
    event.coord.lng();

  setLocationMarker(
    latitude,
    longitude
  );

  hideLocationSearchResults();
};

const initializeMap = () => {
  const searchMapElement =
    document.querySelector("#search-map");

  if (!searchMapElement) {
    console.error(
      "#search-map 요소를 찾을 수 없습니다."
    );

    return;
  }

  if (
    typeof naver === "undefined" ||
    !naver.maps
  ) {
    console.error(
      "네이버 지도 API를 불러오지 못했습니다."
    );

    return;
  }

  const initialPosition =
    new naver.maps.LatLng(
      DEFAULT_LATITUDE,
      DEFAULT_LONGITUDE
    );

  searchMap =
    new naver.maps.Map(
      searchMapElement,
      {
        center: initialPosition,
        zoom: DEFAULT_ZOOM,
        minZoom: 7,
        maxZoom: 21,
        zoomControl: true,
        zoomControlOptions: {
          position:
            naver.maps.Position.TOP_RIGHT
        },
        mapTypeControl: false
      }
    );

  naver.maps.Event.addListener(
    searchMap,
    "click",
    handleMapClick
  );

  window.setTimeout(() => {
    naver.maps.Event.trigger(
      searchMap,
      "resize"
    );

    searchMap.setCenter(
      initialPosition
    );
  }, 100);
};

const selectLocationResult = (
  result
) => {
  const latitude =
    Number(result.y);

  const longitude =
    Number(result.x);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return;
  }

  if (!searchMap) {
    return;
  }

  const position =
    new naver.maps.LatLng(
      latitude,
      longitude
    );

  lastLocation.value =
    getResultAddress(result);

  searchMap.setCenter(
    position
  );

  searchMap.setZoom(15);

  setLocationMarker(
    latitude,
    longitude
  );

  hideLocationSearchResults();
};

const createLocationResultButton = (
  result
) => {
  const button =
    document.createElement("button");

  button.type = "button";

  button.className =
    "location-result-button";

  const mainAddress =
    document.createElement("span");

  mainAddress.className =
    "location-result-address";

  mainAddress.textContent =
    getResultAddress(result);

  button.appendChild(
    mainAddress
  );

  if (
    result.jibunAddress &&
    result.jibunAddress !==
    mainAddress.textContent
  ) {
    const jibunWrapper =
      document.createElement("span");

    const jibunLabel =
      document.createElement("span");

    const jibunAddress =
      document.createElement("span");

    jibunWrapper.className =
      "location-result-jibun";

    jibunLabel.className =
      "location-result-label";

    jibunLabel.textContent =
      "지번";

    jibunAddress.textContent =
      result.jibunAddress;

    jibunWrapper.appendChild(
      jibunLabel
    );

    jibunWrapper.appendChild(
      jibunAddress
    );

    button.appendChild(
      jibunWrapper
    );
  }

  button.addEventListener(
    "click",
    () => {
      selectLocationResult(
        result
      );
    }
  );

  return button;
};

const renderLocationSearchResults = (
  addresses
) => {
  if (!locationSearchResults) {
    return;
  }

  locationSearchResults.innerHTML =
    "";

  addresses.forEach(
    (result) => {
      const button =
        createLocationResultButton(
          result
        );

      locationSearchResults.appendChild(
        button
      );
    }
  );

  locationSearchResults.hidden =
    false;
};

const searchPlaces = async (query) => {
  const response = await fetch(
    `/api/maps/places?query=${encodeURIComponent(query)}`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  let responseData = null;

  try {
    responseData = await response.json();
  } catch (error) {
    responseData = null;
  }

  if (!response.ok) {
    const message =
      responseData?.message ||
      "장소 검색에 실패했습니다.";

    throw new Error(message);
  }

  return Array.isArray(responseData)
    ? responseData
    : [];
};

const selectMockPlace = (
  place
) => {
  if (!searchMap) {
    return;
  }

  const latitude =
    Number(place.lat);

  const longitude =
    Number(place.lng);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return;
  }

  const position =
    new naver.maps.LatLng(
      latitude,
      longitude
    );

  lastLocation.value =
    place.name;

  searchMap.setCenter(
    position
  );

  searchMap.setZoom(17);

  setLocationMarker(
    latitude,
    longitude
  );

  pendingRoadAddress =
    place.roadAddress || "";

  pendingJibunAddress =
    place.jibunAddress || "";

  renderSelectedLocation();

  hideLocationSearchResults();
};

const createMockPlaceButton = (
  place
) => {
  const button =
    document.createElement("button");

  button.type = "button";

  button.className =
    "location-result-button";

  const title =
    document.createElement("span");

  title.className =
    "location-result-address";

  title.textContent =
    place.name;

  button.appendChild(
    title
  );

  if (place.roadAddress) {
    const roadWrapper =
      document.createElement("span");

    roadWrapper.className =
      "location-result-jibun";

    const roadLabel =
      document.createElement("span");

    roadLabel.className =
      "location-result-label";

    roadLabel.textContent =
      "도로명";

    const roadAddress =
      document.createElement("span");

    roadAddress.textContent =
      place.roadAddress;

    roadWrapper.appendChild(
      roadLabel
    );

    roadWrapper.appendChild(
      roadAddress
    );

    button.appendChild(
      roadWrapper
    );
  }

  if (place.jibunAddress) {
    const jibunWrapper =
      document.createElement("span");

    jibunWrapper.className =
      "location-result-jibun";

    const jibunLabel =
      document.createElement("span");

    jibunLabel.className =
      "location-result-label";

    jibunLabel.textContent =
      "지번";

    const jibunAddress =
      document.createElement("span");

    jibunAddress.textContent =
      place.jibunAddress;

    jibunWrapper.appendChild(
      jibunLabel
    );

    jibunWrapper.appendChild(
      jibunAddress
    );

    button.appendChild(
      jibunWrapper
    );
  }

  button.addEventListener(
    "click",
    () => {
      selectMockPlace(
        place
      );
    }
  );

  return button;
};

const renderMockPlaceResults = (
  places
) => {
  if (!locationSearchResults) {
    return;
  }

  locationSearchResults.innerHTML =
    "";

  places.forEach(
    (place) => {
      const button =
        createMockPlaceButton(
          place
        );

      locationSearchResults.appendChild(
        button
      );
    }
  );

  locationSearchResults.hidden =
    false;
};

const handleLocationSearch = async () => {
  if (!lastLocation) {
    return;
  }

  const keyword =
    lastLocation.value.trim();

  if (!keyword) {
    hideLocationSearchResults();
    lastLocation.focus();
    return;
  }

  showSearchMessage(
    "장소 또는 주소를 검색하고 있습니다."
  );

  try {
    const places =
      await searchPlaces(keyword);

    if (places.length > 0) {
      renderMockPlaceResults(
        places
      );

      return;
    }

    showSearchMessage(
      "검색 결과를 찾을 수 없습니다."
    );
  } catch (error) {
    console.error(
      "Place search API error:",
      error
    );

    showSearchMessage(
      error.message ||
      "장소 검색 중 오류가 발생했습니다."
    );
  }
};

const handleConfirmLocation = () => {
  if (
    pendingLatitude === null ||
    pendingLongitude === null
  ) {
    return;
  }

  if (lastLocationLat) {
    lastLocationLat.value =
      String(
        pendingLatitude
      );
  }

  if (lastLocationLng) {
    lastLocationLng.value =
      String(
        pendingLongitude
      );
  }

  const confirmedAddress =
    pendingRoadAddress ||
    pendingJibunAddress;

  if (
    confirmedAddress &&
    lastLocation
  ) {
    lastLocation.value =
      confirmedAddress;
  }

  if (confirmLocationButton) {
    confirmLocationButton.classList.add(
      "is-confirmed"
    );

    confirmLocationButton.textContent =
      "위치 선택 완료";
  }
};

const updateLastSeenTime = () => {
  if (
    !lastSeenDate ||
    !lastSeenHour ||
    !lastSeenMinute ||
    !lastSeenTime
  ) {
    return;
  }

  const date =
    lastSeenDate.value;

  const hour =
    lastSeenHour.value;

  const minute =
    lastSeenMinute.value;

  if (
    !date ||
    !hour ||
    !minute
  ) {
    lastSeenTime.value = "";
    return;
  }

  const selectedDateTime =
    new Date(
      `${date}T${hour}:${minute}`
    );

  const now =
    new Date();

  if (
    Number.isNaN(
      selectedDateTime.getTime()
    )
  ) {
    lastSeenTime.value = "";
    return;
  }

  if (
    selectedDateTime.getTime() >
    now.getTime()
  ) {
    lastSeenTime.value = "";

    alert(
      "마지막 확인 시각은 현재 시각보다 미래로 설정할 수 없습니다."
    );

    return;
  }

  lastSeenTime.value =
    `${date}T${hour}:${minute}`;
};

const handleLastSeenDateChange = () => {
  if (!lastSeenDate) {
    return;
  }

  const now =
    new Date();

  const today =
    getLocalDateString(now);

  if (
    lastSeenDate.value >
    today
  ) {
    lastSeenDate.value = "";

    alert(
      "미래 날짜는 선택할 수 없습니다."
    );

    return;
  }

  updateAvailableTimeOptions();
  updateLastSeenTime();
};

const handleLastSeenHourChange = () => {
  updateAvailableTimeOptions();
  updateLastSeenTime();
};

const handleLastSeenMinuteChange = () => {
  updateLastSeenTime();
};

const getCheckedValue = (
  name
) => {
  const checkedInput =
    document.querySelector(
      `input[name="${name}"]:checked`
    );

  return checkedInput
    ? checkedInput.value
    : "";
};

const getAgeLabel = () => {
  if (
    !personAge ||
    !personAge.value
  ) {
    return "";
  }

  if (
    personAge.value ===
    "under-10"
  ) {
    return "10세 이하";
  }

  if (
    personAge.value ===
    "over-85"
  ) {
    return "85세 이상";
  }

  return `${personAge.value}세`;
};

const updatePersonSummary = () => {
  if (!personSummary) {
    return;
  }

  const personType =
    getCheckedValue(
      "personType"
    );

  const disabilityStatus =
    getCheckedValue(
      "disabilityStatus"
    );

  const diseaseStatus =
    getCheckedValue(
      "diseaseStatus"
    );

  if (!personType) {
    personSummary.textContent =
      "대상자의 특성을 입력해주세요.";

    return;
  }

  const summaryItems = [
    PERSON_TYPE_LABELS[
    personType
    ]
  ];

  const ageLabel =
    getAgeLabel();

  if (ageLabel) {
    summaryItems.push(
      ageLabel
    );
  }

  if (disabilityStatus) {
    summaryItems.push(
      `장애 ${STATUS_LABELS[disabilityStatus]}`
    );
  }

  if (diseaseStatus) {
    summaryItems.push(
      `질환 ${STATUS_LABELS[diseaseStatus]}`
    );
  }

  personSummary.textContent =
    summaryItems.join(" · ");
};

const openPersonDetails = () => {
  if (
    !personDetails ||
    !personCard ||
    !personToggle
  ) {
    return;
  }

  personDetails.hidden = false;

  personCard.classList.add(
    "is-open"
  );

  personToggle.setAttribute(
    "aria-expanded",
    "true"
  );
};

const closePersonDetails = () => {
  if (
    !personDetails ||
    !personCard ||
    !personToggle
  ) {
    return;
  }

  personDetails.hidden = true;

  personCard.classList.remove(
    "is-open"
  );

  personToggle.setAttribute(
    "aria-expanded",
    "false"
  );
};

const handlePersonToggle = () => {
  if (!personToggle) {
    return;
  }

  const isOpen =
    personToggle.getAttribute(
      "aria-expanded"
    ) === "true";

  if (isOpen) {
    updatePersonSummary();
    closePersonDetails();
    return;
  }

  openPersonDetails();
};

const getPersonInput = (
  name
) => {
  return document.querySelector(
    `input[name="${name}"]`
  );
};

const clearPersonValidity = (
  name
) => {
  const input =
    getPersonInput(name);

  if (!input) {
    return;
  }

  input.setCustomValidity("");
};

const showRequiredPersonMessage = (
  name
) => {
  const input =
    getPersonInput(name);

  if (!input) {
    return;
  }

  openPersonDetails();

  input.setCustomValidity(
    "필수 선택 항목입니다."
  );

  window.setTimeout(() => {
    input.reportValidity();
  }, 100);
};

const validatePersonType = () => {
  if (
    getCheckedValue(
      "personType"
    )
  ) {
    clearPersonValidity(
      "personType"
    );

    return true;
  }

  showRequiredPersonMessage(
    "personType"
  );

  return false;
};

const validateDisabilityStatus = () => {
  if (
    getCheckedValue(
      "disabilityStatus"
    )
  ) {
    clearPersonValidity(
      "disabilityStatus"
    );

    return true;
  }

  showRequiredPersonMessage(
    "disabilityStatus"
  );

  return false;
};

const validateDiseaseStatus = () => {
  if (
    getCheckedValue(
      "diseaseStatus"
    )
  ) {
    clearPersonValidity(
      "diseaseStatus"
    );

    return true;
  }

  showRequiredPersonMessage(
    "diseaseStatus"
  );

  return false;
};

const validatePersonInformation = () => {
  if (!validatePersonType()) {
    return false;
  }

  if (!validateDisabilityStatus()) {
    return false;
  }

  if (!validateDiseaseStatus()) {
    return false;
  }

  return true;
};

const showPersonCompleteMessage = () => {
  openPersonDetails();

  if (!personCompleteButton) {
    return;
  }

  const originalText =
    personCompleteButton.textContent;

  personCompleteButton.textContent =
    "입력 완료 버튼을 눌러주세요.";

  personCompleteButton.focus();

  personCompleteButton.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  window.setTimeout(() => {
    if (
      !isPersonInformationCompleted
    ) {
      personCompleteButton.textContent =
        originalText;
    }
  }, 2500);
};

const handlePersonComplete = () => {
  if (!validatePersonType()) {
    return;
  }

  if (
    !validateDisabilityStatus()
  ) {
    return;
  }

  if (!validateDiseaseStatus()) {
    return;
  }

  isPersonInformationCompleted =
    true;

  if (personCompleteButton) {
    personCompleteButton.textContent =
      "입력 완료";
  }

  updatePersonSummary();
  closePersonDetails();
};

const handlePersonInformationChange = (
  event
) => {
  const target = event.target;

  if (!target) {
    return;
  }

  if (
    target.name ===
    "personType"
  ) {
    clearPersonValidity(
      "personType"
    );
  }

  if (
    target.name ===
    "disabilityStatus"
  ) {
    clearPersonValidity(
      "disabilityStatus"
    );
  }

  if (
    target.name ===
    "diseaseStatus"
  ) {
    clearPersonValidity(
      "diseaseStatus"
    );
  }

  isPersonInformationCompleted =
    false;

  if (personCompleteButton) {
    personCompleteButton.textContent =
      "입력 완료";
  }

  updatePersonSummary();
};

const validateLastLocation = () => {
  if (
    lastLocation &&
    lastLocation.value.trim() &&
    lastLocationLat.value &&
    lastLocationLng.value
  ) {
    lastLocation.setCustomValidity(
      ""
    );

    return true;
  }

  if (!lastLocation) {
    return false;
  }

  lastLocation.setCustomValidity(
    "마지막 확인 위치를 선택해주세요."
  );

  lastLocation.reportValidity();

  return false;
};

const validateLastSeenDate = () => {
  if (lastSeenDate.value) {
    lastSeenDate.setCustomValidity(
      ""
    );

    return true;
  }

  lastSeenDate.setCustomValidity(
    "마지막 확인 날짜를 선택해주세요."
  );

  lastSeenDate.reportValidity();

  return false;
};

const validateLastSeenHour = () => {
  if (lastSeenHour.value) {
    lastSeenHour.setCustomValidity(
      ""
    );

    return true;
  }

  lastSeenHour.setCustomValidity(
    "마지막 확인 시간을 선택해주세요."
  );

  lastSeenHour.reportValidity();

  return false;
};

const validateLastSeenMinute = () => {
  if (lastSeenMinute.value) {
    lastSeenMinute.setCustomValidity(
      ""
    );

    return true;
  }

  lastSeenMinute.setCustomValidity(
    "마지막 확인 분을 선택해주세요."
  );

  lastSeenMinute.reportValidity();

  return false;
};

const PERSON_TYPE_API_VALUES = {
  child: "CHILD",
  teenager: "TEEN",
  "adult-male": "ADULT_MALE",
  "adult-female": "ADULT_FEMALE",
  "senior-male": "OLDER_ADULT",
  "senior-female": "OLDER_ADULT"
};

const CONDITION_STATUS_API_VALUES = {
  none: "NONE",
  yes: "YES",
  unknown: "UNKNOWN"
};

const getApiAge = () => {
  if (
    !personAge ||
    !personAge.value
  ) {
    return null;
  }

  if (
    personAge.value ===
    "under-10"
  ) {
    return 10;
  }

  if (
    personAge.value ===
    "over-85"
  ) {
    return 85;
  }

  const age =
    Number(personAge.value);

  return Number.isInteger(age)
    ? age
    : null;
};

const createSearchRequestData = (
  searchData
) => {
  return {
    lastLat:
      searchData.latitude,

    lastLng:
      searchData.longitude,

    lastAddress:
      searchData.roadAddress ||
      searchData.jibunAddress ||
      searchData.address ||
      null,

    lastSeenAt:
      `${searchData.lastSeenTime}:00`,

    personType:
      PERSON_TYPE_API_VALUES[
      searchData.personType
      ],

    age:
      getApiAge(),

    disabilityStatus:
      CONDITION_STATUS_API_VALUES[
      searchData.disabilityStatus
      ],

    diseaseStatus:
      CONDITION_STATUS_API_VALUES[
      searchData.diseaseStatus
      ],

    physicalFeatures:
      searchData.additionalInfo ||
      null
  };
};

const requestSearchAnalysis = async (
  searchData
) => {
  const requestData =
    createSearchRequestData(
      searchData
    );

  const response =
    await fetch(
      "/api/search/input",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        credentials: "include",
        body: JSON.stringify(
          requestData
        )
      }
    );

  let responseData = null;

  try {
    responseData =
      await response.json();
  } catch (error) {
    responseData = null;
  }

  if (!response.ok) {
    const message =
      responseData?.message ||
      "탐색 정보를 전송하지 못했습니다.";

    throw new Error(message);
  }

  return responseData;
};

const handleSearchFormSubmit = async (
  event
) => {
  event.preventDefault();

  updateLastSeenTime();

  if (!validateLastLocation()) {
    return;
  }

  if (!validateLastSeenDate()) {
    return;
  }

  if (!validateLastSeenHour()) {
    return;
  }

  if (!validateLastSeenMinute()) {
    return;
  }

  updateLastSeenTime();

  if (
    !lastSeenTime ||
    !lastSeenTime.value
  ) {
    return;
  }

  if (!validatePersonType()) {
    return;
  }

  if (
    !validateDisabilityStatus()
  ) {
    return;
  }

  if (!validateDiseaseStatus()) {
    return;
  }

  if (
    !isPersonInformationCompleted
  ) {
    showPersonCompleteMessage();
    return;
  }

  updatePersonSummary();

  const searchData = {
    address:
      lastLocation.value.trim(),

    roadAddress:
      pendingRoadAddress,

    jibunAddress:
      pendingJibunAddress,

    latitude:
      Number(
        lastLocationLat.value
      ),

    longitude:
      Number(
        lastLocationLng.value
      ),

    lastSeenDate:
      lastSeenDate.value,

    lastSeenHour:
      lastSeenHour.value,

    lastSeenMinute:
      lastSeenMinute.value,

    lastSeenTime:
      lastSeenTime.value,

    personType:
      getCheckedValue(
        "personType"
      ),

    personAge:
      personAge.value,

    disabilityStatus:
      getCheckedValue(
        "disabilityStatus"
      ),

    diseaseStatus:
      getCheckedValue(
        "diseaseStatus"
      ),

    additionalInfo:
      additionalInfo
        ? additionalInfo.value.trim()
        : ""
  };

  try {
    const responseData =
      await requestSearchAnalysis(
        searchData
      );

    sessionStorage.removeItem(
      "goldenStepCompletedPriorities"
    );

    sessionStorage.setItem(
      "goldenStepSearchData",
      JSON.stringify(
        searchData
      )
    );

    sessionStorage.setItem(
      "goldenStepSessionId",
      String(
        responseData.sessionId
      )
    );

    sessionStorage.setItem(
      "goldenStepRunId",
      String(
        responseData.runId
      )
    );

    sessionStorage.setItem(
      "goldenStepAnalysisStatus",
      responseData.status
    );

    sessionStorage.setItem(
      "goldenStepExpiresAt",
      responseData.expiresAt
    );

    window.location.href =
      "./analysis-loading.html";
  } catch (error) {
    console.error(
      "Search API error:",
      error
    );

    alert(
      error.message ||
      "탐색 정보를 전송하지 못했습니다. 잠시 후 다시 시도해주세요."
    );
  }
};

initializeTimeOptions();
initializeAgeOptions();
initializeLastSeenDate();
initializeMap();

if (locationSearchButton) {
  locationSearchButton.addEventListener(
    "click",
    handleLocationSearch
  );
}

if (lastLocation) {
  lastLocation.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter"
      ) {
        event.preventDefault();

        handleLocationSearch();
      }
    }
  );

  lastLocation.addEventListener(
    "input",
    () => {
      clearConfirmedLocation();
      hideLocationSearchResults();

      lastLocation.setCustomValidity(
        ""
      );
    }
  );
}

if (confirmLocationButton) {
  confirmLocationButton.addEventListener(
    "click",
    handleConfirmLocation
  );
}

if (lastSeenDate) {
  lastSeenDate.addEventListener(
    "change",
    () => {
      lastSeenDate.setCustomValidity(
        ""
      );

      handleLastSeenDateChange();
    }
  );
}

if (lastSeenHour) {
  lastSeenHour.addEventListener(
    "change",
    () => {
      lastSeenHour.setCustomValidity(
        ""
      );

      handleLastSeenHourChange();
    }
  );
}

if (lastSeenMinute) {
  lastSeenMinute.addEventListener(
    "change",
    () => {
      lastSeenMinute.setCustomValidity(
        ""
      );

      handleLastSeenMinuteChange();
    }
  );
}

if (personToggle) {
  personToggle.addEventListener(
    "click",
    handlePersonToggle
  );
}

if (personCompleteButton) {
  personCompleteButton.addEventListener(
    "click",
    handlePersonComplete
  );
}

if (personDetails) {
  personDetails.addEventListener(
    "change",
    handlePersonInformationChange
  );
}

if (searchForm) {
  searchForm.addEventListener(
    "submit",
    handleSearchFormSubmit
  );
}