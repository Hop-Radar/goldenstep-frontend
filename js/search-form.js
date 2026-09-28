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

const MOCK_PLACES = [
  {
    title: "롯데월드",
    roadAddress: "서울특별시 송파구 올림픽로 240",
    jibunAddress: "서울특별시 송파구 잠실동 40-1",
    latitude: 37.5111158,
    longitude: 127.098167
  },
  {
    title: "롯데월드타워",
    roadAddress: "서울특별시 송파구 올림픽로 300",
    jibunAddress: "서울특별시 송파구 신천동 29",
    latitude: 37.512558,
    longitude: 127.102535
  },
  {
    title: "에버랜드",
    roadAddress: "경기도 용인시 처인구 포곡읍 에버랜드로 199",
    jibunAddress: "경기도 용인시 처인구 포곡읍 전대리 310",
    latitude: 37.293884,
    longitude: 127.202393
  },
  {
    title: "서울역",
    roadAddress: "서울특별시 용산구 한강대로 405",
    jibunAddress: "서울특별시 용산구 동자동 43-205",
    latitude: 37.5546788,
    longitude: 126.9706069
  },
  {
    title: "동덕여자대학교",
    roadAddress: "서울특별시 성북구 화랑로13길 60",
    jibunAddress: "서울특별시 성북구 하월곡동 23-1",
    latitude: 37.606823,
    longitude: 127.041308
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

const searchMockPlaces = (
  keyword
) => {
  const normalizedKeyword =
    keyword
      .replace(/\s/g, "")
      .toLowerCase();

  return MOCK_PLACES.filter(
    (place) => {
      const title =
        place.title
          .replace(/\s/g, "")
          .toLowerCase();

      const roadAddress =
        place.roadAddress
          .replace(/\s/g, "")
          .toLowerCase();

      const jibunAddress =
        place.jibunAddress
          .replace(/\s/g, "")
          .toLowerCase();

      return (
        title.includes(
          normalizedKeyword
        ) ||
        roadAddress.includes(
          normalizedKeyword
        ) ||
        jibunAddress.includes(
          normalizedKeyword
        )
      );
    }
  );
};

const selectMockPlace = (
  place
) => {
  if (!searchMap) {
    return;
  }

  const position =
    new naver.maps.LatLng(
      place.latitude,
      place.longitude
    );

  lastLocation.value =
    place.title;

  searchMap.setCenter(
    position
  );

  searchMap.setZoom(17);

  setLocationMarker(
    place.latitude,
    place.longitude
  );

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
    place.title;

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
    title
  );

  button.appendChild(
    roadWrapper
  );

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

const handleLocationSearch = () => {
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

  if (
    typeof naver === "undefined" ||
    !naver.maps ||
    !naver.maps.Service
  ) {
    showSearchMessage(
      "지도 서비스를 불러오지 못했습니다."
    );

    return;
  }

  showSearchMessage(
    "장소 또는 주소를 검색하고 있습니다."
  );

  naver.maps.Service.geocode(
    {
      query: keyword
    },
    (status, response) => {
      if (
        status ===
        naver.maps.Service.Status.OK
      ) {
        const addresses =
          response.v2.addresses ||
          [];

        if (
          addresses.length > 0
        ) {
          renderLocationSearchResults(
            addresses
          );

          return;
        }
      }

      const places =
        searchMockPlaces(
          keyword
        );

      if (places.length > 0) {
        renderMockPlaceResults(
          places
        );

        return;
      }

      showSearchMessage(
        "검색 결과를 찾을 수 없습니다."
      );
    }
  );
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

  personDetails.hidden =
    false;

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

  personDetails.hidden =
    true;

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

const validatePersonInformation = () => {
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

  return Boolean(
    personType &&
    disabilityStatus &&
    diseaseStatus
  );
};

const handlePersonComplete = () => {
  if (
    !validatePersonInformation()
  ) {
    openPersonDetails();

    if (personDetails) {
      const invalidInput =
        personDetails.querySelector(
          "input:invalid"
        );

      if (invalidInput) {
        invalidInput.reportValidity();
      }
    }

    return;
  }

  updatePersonSummary();
  closePersonDetails();
};

const handleSearchFormSubmit = (
  event
) => {
  event.preventDefault();

  updateLastSeenTime();
  updatePersonSummary();

  if (
    !validatePersonInformation()
  ) {
    openPersonDetails();

    if (personDetails) {
      const invalidPersonInput =
        personDetails.querySelector(
          "input:invalid"
        );

      if (invalidPersonInput) {
        invalidPersonInput.reportValidity();
      }
    }

    return;
  }

  if (
    !searchForm.checkValidity()
  ) {
    searchForm.reportValidity();
    return;
  }

  if (
    !lastSeenTime ||
    !lastSeenTime.value
  ) {
    alert(
      "마지막 확인 시각을 확인해주세요."
    );

    return;
  }

  if (
    !lastLocationLat.value ||
    !lastLocationLng.value
  ) {
    alert(
      "지도에서 위치를 지정한 후 '이 위치로 선택' 버튼을 눌러주세요."
    );

    return;
  }

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

  sessionStorage.removeItem(
    "goldenStepCompletedPriorities"
  );

  sessionStorage.setItem(
    "goldenStepSearchData",
    JSON.stringify(
      searchData
    )
  );

  window.location.href =
    "./analysis-loading.html";
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
    handleLastSeenDateChange
  );
}

if (lastSeenHour) {
  lastSeenHour.addEventListener(
    "change",
    handleLastSeenHourChange
  );
}

if (lastSeenMinute) {
  lastSeenMinute.addEventListener(
    "change",
    handleLastSeenMinuteChange
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
    updatePersonSummary
  );
}

if (searchForm) {
  searchForm.addEventListener(
    "submit",
    handleSearchFormSubmit
  );
}