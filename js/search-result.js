(() => {
  const timeRange = document.querySelector("#time-range");
  const selectedTime = document.querySelector("#selected-time");
  const drawerCompleteButton = document.querySelector("#drawer-complete-button");
  const detailButtons = document.querySelectorAll(".detail-button");
  const searchBoardButton = document.querySelector("#search-board-button");
  const resultMapElement = document.querySelector("#result-map");

  const detailDrawer = document.querySelector("#detail-drawer");
  const detailDrawerOverlay = document.querySelector("#detail-drawer-overlay");
  const detailCloseButton = document.querySelector("#detail-close-button");

  const detailPlaceName = document.querySelector("#detail-place-name");
  const detailAddress = document.querySelector("#detail-address");
  const detailPriorityBadge = document.querySelector("#detail-priority-badge");
  const detailDistance = document.querySelector("#detail-distance");
  const detailWalkingTime = document.querySelector("#detail-walking-time");
  const detailMapElement = document.querySelector("#detail-map");
  const routeCheckButton = document.querySelector("#route-check-button");

  const priorityList = document.querySelector("#priority-list");

  const completedPrioritySection = document.querySelector(
    "#completed-priority-section"
  );

  const completedPriorityList = document.querySelector(
    "#completed-priority-list"
  );

  const completeModal = document.querySelector("#complete-modal");

  const completeModalLocation = document.querySelector(
    "#complete-modal-location"
  );

  const completeModalCancel = document.querySelector(
    "#complete-modal-cancel"
  );

  const completeModalConfirm = document.querySelector(
    "#complete-modal-confirm"
  );

  let pendingCompleteItem = null;
  let activeDetailLocation = null;

  const TIME_POINTS = [
    {
      label: "현재",
      minutes: 0
    },
    {
      label: "30분",
      minutes: 30
    },
    {
      label: "1시간",
      minutes: 60
    },
    {
      label: "2시간",
      minutes: 120
    },
    {
      label: "3시간",
      minutes: 180
    },
    {
      label: "6시간",
      minutes: 360
    }
  ];

  const MOCK_ANALYSIS_RESULTS = [
    {
      minutes: 0,
      areas: [
        {
          latitude: 37.6067,
          longitude: 127.0415,
          priority: "high",
          radius: 120
        }
      ]
    },
    {
      minutes: 30,
      areas: [
        {
          latitude: 37.6067,
          longitude: 127.0415,
          priority: "high",
          radius: 180
        },
        {
          latitude: 37.6080,
          longitude: 127.0398,
          priority: "medium",
          radius: 140
        },
        {
          latitude: 37.6054,
          longitude: 127.0430,
          priority: "low",
          radius: 130
        }
      ]
    },
    {
      minutes: 60,
      areas: [
        {
          latitude: 37.6067,
          longitude: 127.0415,
          priority: "high",
          radius: 240
        },
        {
          latitude: 37.6085,
          longitude: 127.0390,
          priority: "medium",
          radius: 190
        },
        {
          latitude: 37.6048,
          longitude: 127.0440,
          priority: "low",
          radius: 170
        },
        {
          latitude: 37.6092,
          longitude: 127.0430,
          priority: "low",
          radius: 150
        }
      ]
    },
    {
      minutes: 120,
      areas: [
        {
          latitude: 37.6067,
          longitude: 127.0415,
          priority: "high",
          radius: 300
        },
        {
          latitude: 37.6090,
          longitude: 127.0385,
          priority: "medium",
          radius: 250
        },
        {
          latitude: 37.6040,
          longitude: 127.0448,
          priority: "medium",
          radius: 220
        },
        {
          latitude: 37.6100,
          longitude: 127.0438,
          priority: "low",
          radius: 210
        },
        {
          latitude: 37.6028,
          longitude: 127.0400,
          priority: "low",
          radius: 190
        }
      ]
    },
    {
      minutes: 180,
      areas: [
        {
          latitude: 37.6067,
          longitude: 127.0415,
          priority: "high",
          radius: 360
        },
        {
          latitude: 37.6095,
          longitude: 127.0378,
          priority: "medium",
          radius: 300
        },
        {
          latitude: 37.6035,
          longitude: 127.0455,
          priority: "medium",
          radius: 280
        },
        {
          latitude: 37.6110,
          longitude: 127.0445,
          priority: "low",
          radius: 260
        },
        {
          latitude: 37.6018,
          longitude: 127.0385,
          priority: "low",
          radius: 240
        }
      ]
    },
    {
      minutes: 360,
      areas: [
        {
          latitude: 37.6067,
          longitude: 127.0415,
          priority: "high",
          radius: 430
        },
        {
          latitude: 37.6100,
          longitude: 127.0370,
          priority: "medium",
          radius: 370
        },
        {
          latitude: 37.6030,
          longitude: 127.0465,
          priority: "medium",
          radius: 350
        },
        {
          latitude: 37.6120,
          longitude: 127.0455,
          priority: "low",
          radius: 330
        },
        {
          latitude: 37.6005,
          longitude: 127.0375,
          priority: "low",
          radius: 310
        },
        {
          latitude: 37.6090,
          longitude: 127.0490,
          priority: "low",
          radius: 280
        }
      ]
    }
  ];

  const MOCK_PRIORITY_LOCATIONS = [
    {
      id: "location-1",
      priorityId: "priority-1",
      name: "한강공원 산책로",
      address: "서울시 OO구 OO동",
      priority: "high",
      priorityLabel: "높은 우선도",
      latitudeOffset: 0.0022,
      longitudeOffset: -0.0018
    },
    {
      id: "location-2",
      priorityId: "priority-2",
      name: "중앙초등학교 주변",
      address: "서울시 OO구 OO동",
      priority: "medium",
      priorityLabel: "중간 우선도",
      latitudeOffset: -0.0017,
      longitudeOffset: 0.0026
    },
    {
      id: "location-3",
      priorityId: "priority-3",
      name: "OO공원",
      address: "서울시 OO구 OO동",
      priority: "low",
      priorityLabel: "낮은 우선도",
      latitudeOffset: 0.0031,
      longitudeOffset: 0.0021
    }
  ];

  const DEFAULT_LOCATION = {
    latitude: 37.6067,
    longitude: 127.0415
  };

  const PRIORITY_STYLES = {
    high: {
      strokeColor: "#B98282",
      fillColor: "#B98282",
      strokeOpacity: 0.75,
      fillOpacity: 0.34
    },
    medium: {
      strokeColor: "#C2A16B",
      fillColor: "#C2A16B",
      strokeOpacity: 0.7,
      fillOpacity: 0.28
    },
    low: {
      strokeColor: "#78BCE8",
      fillColor: "#78BCE8",
      strokeOpacity: 0.65,
      fillOpacity: 0.23
    }
  };

  let resultMap = null;
  let lastLocationMarker = null;
  let priorityCircles = [];

  let detailMap = null;
  let detailStartMarker = null;
  let detailDestinationMarker = null;
  let detailRouteLine = null;

  const getStoredLocation = () => {
    try {
      const storedData = sessionStorage.getItem(
        "goldenStepSearchData"
      );

      if (!storedData) {
        return DEFAULT_LOCATION;
      }

      const parsedData = JSON.parse(storedData);

      const latitude = Number(parsedData.latitude);
      const longitude = Number(parsedData.longitude);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return DEFAULT_LOCATION;
      }

      return {
        latitude,
        longitude
      };
    } catch {
      return DEFAULT_LOCATION;
    }
  };

  const getDestinationLocation = (location) => {
    const baseLocation = getStoredLocation();

    return {
      latitude:
        baseLocation.latitude +
        location.latitudeOffset,

      longitude:
        baseLocation.longitude +
        location.longitudeOffset
    };
  };

  const calculateDistance = (
    startLatitude,
    startLongitude,
    endLatitude,
    endLongitude
  ) => {
    const earthRadius = 6371000;

    const toRadians = (degree) =>
      degree * (Math.PI / 180);

    const latitudeDifference =
      toRadians(
        endLatitude - startLatitude
      );

    const longitudeDifference =
      toRadians(
        endLongitude - startLongitude
      );

    const startLatitudeRadians =
      toRadians(startLatitude);

    const endLatitudeRadians =
      toRadians(endLatitude);

    const value =
      Math.sin(latitudeDifference / 2) ** 2 +
      Math.cos(startLatitudeRadians) *
      Math.cos(endLatitudeRadians) *
      Math.sin(longitudeDifference / 2) ** 2;

    const angle =
      2 *
      Math.atan2(
        Math.sqrt(value),
        Math.sqrt(1 - value)
      );

    return Math.round(
      earthRadius * angle
    );
  };

  const getWalkingMinutes = (distance) => {
    const walkingMetersPerMinute = 67;

    return Math.max(
      1,
      Math.ceil(
        distance /
        walkingMetersPerMinute
      )
    );
  };

  const formatDistance = (distance) => {
    if (distance >= 1000) {
      return `약 ${(distance / 1000).toFixed(1)}km`;
    }

    return `약 ${distance}m`;
  };

  const initializeMap = () => {
    if (
      !resultMapElement ||
      typeof naver === "undefined" ||
      !naver.maps
    ) {
      return;
    }

    const location = getStoredLocation();

    const center =
      new naver.maps.LatLng(
        location.latitude,
        location.longitude
      );

    resultMap =
      new naver.maps.Map(
        resultMapElement,
        {
          center,
          zoom: 15,
          minZoom: 11,
          maxZoom: 19,

          zoomControl: true,

          zoomControlOptions: {
            position:
              naver.maps.Position.TOP_RIGHT
          },

          mapTypeControl: false,
          scaleControl: false,
          logoControl: true,
          mapDataControl: false
        }
      );

    lastLocationMarker =
      new naver.maps.Marker({
        position: center,
        map: resultMap,
        title: "마지막 확인 위치"
      });

    renderPriorityAreas(0);
  };

  const clearPriorityAreas = () => {
    priorityCircles.forEach(
      (circle) => {
        circle.setMap(null);
      }
    );

    priorityCircles = [];
  };

  const renderPriorityAreas = (
    selectedIndex
  ) => {
    if (!resultMap) {
      return;
    }

    clearPriorityAreas();

    const analysisResult =
      MOCK_ANALYSIS_RESULTS[
      selectedIndex
      ];

    if (!analysisResult) {
      return;
    }

    const baseLocation =
      getStoredLocation();

    const latitudeOffset =
      baseLocation.latitude -
      DEFAULT_LOCATION.latitude;

    const longitudeOffset =
      baseLocation.longitude -
      DEFAULT_LOCATION.longitude;

    analysisResult.areas.forEach(
      (area) => {
        const style =
          PRIORITY_STYLES[
          area.priority
          ];

        if (!style) {
          return;
        }

        const center =
          new naver.maps.LatLng(
            area.latitude +
            latitudeOffset,

            area.longitude +
            longitudeOffset
          );

        const circle =
          new naver.maps.Circle({
            map: resultMap,
            center,
            radius: area.radius,

            strokeColor:
              style.strokeColor,

            strokeOpacity:
              style.strokeOpacity,

            strokeWeight: 1,

            fillColor:
              style.fillColor,

            fillOpacity:
              style.fillOpacity,

            clickable: false
          });

        priorityCircles.push(
          circle
        );
      }
    );
  };

  const updateSliderBackground = () => {
    if (!timeRange) {
      return;
    }

    const value =
      Number(timeRange.value);

    const min =
      Number(timeRange.min);

    const max =
      Number(timeRange.max);

    const progress =
      ((value - min) /
        (max - min)) *
      100;

    timeRange.style.background = `
      linear-gradient(
        90deg,
        #1479ed 0%,
        #1479ed ${progress}%,
        #dce6f0 ${progress}%,
        #dce6f0 100%
      )
    `;
  };

  const updateTime = () => {
    if (
      !timeRange ||
      !selectedTime
    ) {
      return;
    }

    const selectedIndex =
      Number(timeRange.value);

    const selectedPoint =
      TIME_POINTS[
      selectedIndex
      ];

    if (!selectedPoint) {
      return;
    }

    selectedTime.textContent =
      selectedPoint.label;

    updateSliderBackground();

    renderPriorityAreas(
      selectedIndex
    );
  };

  const clearDetailMapObjects = () => {
    if (detailStartMarker) {
      detailStartMarker.setMap(null);
      detailStartMarker = null;
    }

    if (detailDestinationMarker) {
      detailDestinationMarker.setMap(null);
      detailDestinationMarker = null;
    }

    if (detailRouteLine) {
      detailRouteLine.setMap(null);
      detailRouteLine = null;
    }
  };

  const fitDetailRoute = (
    startPosition,
    destinationPosition
  ) => {
    if (!detailMap) {
      return;
    }

    const bounds =
      new naver.maps.LatLngBounds();

    bounds.extend(
      startPosition
    );

    bounds.extend(
      destinationPosition
    );

    detailMap.fitBounds(
      bounds,
      {
        top: 55,
        right: 55,
        bottom: 55,
        left: 55
      }
    );
  };

  const renderDetailMap = (
    location
  ) => {
    if (
      !detailMapElement ||
      typeof naver === "undefined" ||
      !naver.maps
    ) {
      return;
    }

    const start =
      getStoredLocation();

    const destination =
      getDestinationLocation(
        location
      );

    const startPosition =
      new naver.maps.LatLng(
        start.latitude,
        start.longitude
      );

    const destinationPosition =
      new naver.maps.LatLng(
        destination.latitude,
        destination.longitude
      );

    if (!detailMap) {
      detailMap =
        new naver.maps.Map(
          detailMapElement,
          {
            center:
              startPosition,

            zoom: 15,
            minZoom: 11,
            maxZoom: 20,

            zoomControl: true,

            zoomControlOptions: {
              position:
                naver.maps
                  .Position
                  .TOP_RIGHT
            },

            mapTypeControl: false,
            scaleControl: false,
            logoControl: true,
            mapDataControl: false
          }
        );
    }

    clearDetailMapObjects();

    detailStartMarker =
      new naver.maps.Marker({
        position:
          startPosition,

        map:
          detailMap,

        title:
          "마지막 확인 위치"
      });

    detailDestinationMarker =
      new naver.maps.Marker({
        position:
          destinationPosition,

        map:
          detailMap,

        title:
          location.name
      });

    detailRouteLine =
      new naver.maps.Polyline({
        map:
          detailMap,

        path: [
          startPosition,
          destinationPosition
        ],

        strokeColor:
          "#1479ed",

        strokeOpacity:
          0.9,

        strokeWeight:
          4
      });

    window.setTimeout(
      () => {
        naver.maps.Event.trigger(
          detailMap,
          "resize"
        );

        fitDetailRoute(
          startPosition,
          destinationPosition
        );
      },
      320
    );
  };

  const updateDetailInformation = (
    location
  ) => {
    const start =
      getStoredLocation();

    const destination =
      getDestinationLocation(
        location
      );

    const distance =
      calculateDistance(
        start.latitude,
        start.longitude,
        destination.latitude,
        destination.longitude
      );

    const walkingMinutes =
      getWalkingMinutes(
        distance
      );

    if (detailPlaceName) {
      detailPlaceName.textContent =
        location.name;
    }

    if (detailAddress) {
      detailAddress.textContent =
        location.address;
    }

    if (detailPriorityBadge) {
      detailPriorityBadge.textContent =
        location.priorityLabel;

      detailPriorityBadge.className =
        `detail-priority-badge is-${location.priority}`;
    }

    if (detailDistance) {
      detailDistance.textContent =
        formatDistance(
          distance
        );
    }

    if (detailWalkingTime) {
      detailWalkingTime.textContent =
        `약 ${walkingMinutes}분`;
    }
  };

  const openDetailDrawer = (
    location
  ) => {
    if (
      !location ||
      !detailDrawer ||
      !detailDrawerOverlay
    ) {
      return;
    }

    activeDetailLocation =
      location;

    updateDetailInformation(
      location
    );

    detailDrawer.classList.add(
      "is-open"
    );

    detailDrawerOverlay.classList.add(
      "is-open"
    );

    detailDrawer.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "detail-drawer-open"
    );

    renderDetailMap(
      location
    );
  };

  const closeDetailDrawer = () => {
    if (
      !detailDrawer ||
      !detailDrawerOverlay
    ) {
      return;
    }

    detailDrawer.classList.remove(
      "is-open"
    );

    detailDrawerOverlay.classList.remove(
      "is-open"
    );

    detailDrawer.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "detail-drawer-open"
    );

    activeDetailLocation = null;
  };

  const handleDetailClick = (
    event
  ) => {
    const button =
      event.currentTarget;

    const locationId =
      button.dataset.locationId;

    if (!locationId) {
      return;
    }

    const location =
      MOCK_PRIORITY_LOCATIONS.find(
        (item) =>
          item.id ===
          locationId
      );

    if (!location) {
      return;
    }

    openDetailDrawer(
      location
    );
  };

  const handleRouteCheck = () => {
    if (
      !activeDetailLocation ||
      !detailMap ||
      typeof naver === "undefined" ||
      !naver.maps
    ) {
      return;
    }

    const start =
      getStoredLocation();

    const destination =
      getDestinationLocation(
        activeDetailLocation
      );

    const startPosition =
      new naver.maps.LatLng(
        start.latitude,
        start.longitude
      );

    const destinationPosition =
      new naver.maps.LatLng(
        destination.latitude,
        destination.longitude
      );

    naver.maps.Event.trigger(
      detailMap,
      "resize"
    );

    fitDetailRoute(
      startPosition,
      destinationPosition
    );
  };

  const getCompletedPriorityIds = () => {
    try {
      const storedValue =
        sessionStorage.getItem(
          "goldenStepCompletedPriorities"
        );

      if (!storedValue) {
        return [];
      }

      const parsedValue =
        JSON.parse(
          storedValue
        );

      return Array.isArray(
        parsedValue
      )
        ? parsedValue
        : [];
    } catch {
      return [];
    }
  };

  const saveCompletedPriorityIds = () => {
    if (!completedPriorityList) {
      return;
    }

    const completedItems =
      Array.from(
        completedPriorityList
          .querySelectorAll(
            ".priority-item"
          )
      );

    const completedIds =
      completedItems
        .map(
          (item) =>
            item.dataset.priorityId
        )
        .filter(Boolean);

    sessionStorage.setItem(
      "goldenStepCompletedPriorities",
      JSON.stringify(
        completedIds
      )
    );
  };

  const updatePriorityRanks = () => {
    if (!priorityList) {
      return;
    }

    const activeItems =
      priorityList.querySelectorAll(
        ".priority-item"
      );

    activeItems.forEach(
      (item, index) => {
        const rank =
          item.querySelector(
            ".priority-rank"
          );

        if (rank) {
          rank.textContent =
            String(index + 1);
        }
      }
    );
  };

  const createCompletedStatus = () => {
    const status =
      document.createElement(
        "div"
      );

    const icon =
      document.createElement(
        "span"
      );

    const text =
      document.createElement(
        "span"
      );

    status.className =
      "completed-status";

    icon.className =
      "completed-status-icon";

    icon.textContent = "✓";

    text.textContent =
      "탐색 완료";

    status.appendChild(
      icon
    );

    status.appendChild(
      text
    );

    return status;
  };

  const moveItemToCompleted = (
    item,
    shouldSave = true
  ) => {
    if (
      !item ||
      !completedPriorityList ||
      !completedPrioritySection
    ) {
      return;
    }

    item.classList.add(
      "is-completed"
    );

    const rank =
      item.querySelector(
        ".priority-rank"
      );

    const actions =
      item.querySelector(
        ".priority-actions"
      );

    if (rank) {
      rank.textContent = "✓";
    }

    if (actions) {
      actions.replaceChildren(
        createCompletedStatus()
      );
    }

    completedPriorityList.appendChild(
      item
    );

    completedPrioritySection.hidden =
      false;

    updatePriorityRanks();

    if (shouldSave) {
      saveCompletedPriorityIds();
    }
  };

  const openCompleteModal = (
    item
  ) => {
    if (
      !item ||
      !completeModal ||
      !completeModalLocation
    ) {
      return;
    }

    const locationName =
      item.querySelector(
        ".priority-info strong"
      );

    pendingCompleteItem =
      item;

    completeModalLocation.textContent =
      locationName
        ? locationName.textContent.trim()
        : "선택한 지역";

    completeModal.hidden =
      false;

    document.body.style.overflow =
      "hidden";
  };

  const closeCompleteModal = () => {
    if (!completeModal) {
      return;
    }

    completeModal.hidden =
      true;

    pendingCompleteItem =
      null;

    if (
      detailDrawer &&
      detailDrawer.classList.contains(
        "is-open"
      )
    ) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow =
        "";
    }
  };

  const handleDrawerCompleteClick = () => {
    if (
      !activeDetailLocation ||
      !priorityList
    ) {
      return;
    }

    const priorityId =
      activeDetailLocation.priorityId;

    if (!priorityId) {
      return;
    }

    const targetItem =
      priorityList.querySelector(
        `[data-priority-id="${priorityId}"]`
      );

    if (!targetItem) {
      return;
    }

    openCompleteModal(
      targetItem
    );
  };

  const handleCompleteConfirm = () => {
    if (!pendingCompleteItem) {
      return;
    }

    const completedItem =
      pendingCompleteItem;

    if (completeModal) {
      completeModal.hidden =
        true;
    }

    pendingCompleteItem =
      null;

    moveItemToCompleted(
      completedItem
    );

    closeDetailDrawer();

    document.body.style.overflow =
      "";
  };

  const restoreCompletedPriorities = () => {
    if (!priorityList) {
      return;
    }

    const completedIds =
      getCompletedPriorityIds();

    completedIds.forEach(
      (id) => {
        const item =
          priorityList.querySelector(
            `[data-priority-id="${id}"]`
          );

        if (item) {
          moveItemToCompleted(
            item,
            false
          );
        }
      }
    );

    updatePriorityRanks();
  };

  const handleTimeInput = () => {
    updateTime();
  };

  const handleSearchBoardClick = () => {
    window.location.href =
      "./search-board.html";
  };

  if (timeRange) {
    timeRange.addEventListener(
      "input",
      handleTimeInput
    );
  }

  detailButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        handleDetailClick
      );
    }
  );

  if (detailCloseButton) {
    detailCloseButton.addEventListener(
      "click",
      closeDetailDrawer
    );
  }

  if (detailDrawerOverlay) {
    detailDrawerOverlay.addEventListener(
      "click",
      closeDetailDrawer
    );
  }

  if (routeCheckButton) {
    routeCheckButton.addEventListener(
      "click",
      handleRouteCheck
    );
  }

  if (drawerCompleteButton) {
    drawerCompleteButton.addEventListener(
      "click",
      handleDrawerCompleteClick
    );
  }

  if (completeModalCancel) {
    completeModalCancel.addEventListener(
      "click",
      closeCompleteModal
    );
  }

  if (completeModalConfirm) {
    completeModalConfirm.addEventListener(
      "click",
      handleCompleteConfirm
    );
  }

  if (completeModal) {
    completeModal.addEventListener(
      "click",
      (event) => {
        if (
          event.target.hasAttribute(
            "data-close-complete-modal"
          )
        ) {
          closeCompleteModal();
        }
      }
    );
  }

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key !== "Escape"
      ) {
        return;
      }

      if (
        completeModal &&
        !completeModal.hidden
      ) {
        closeCompleteModal();
        return;
      }

      if (
        detailDrawer &&
        detailDrawer.classList.contains(
          "is-open"
        )
      ) {
        closeDetailDrawer();
      }
    }
  );

  if (searchBoardButton) {
    searchBoardButton.addEventListener(
      "click",
      handleSearchBoardClick
    );
  }

  restoreCompletedPriorities();
  initializeMap();
  updateTime();
})();