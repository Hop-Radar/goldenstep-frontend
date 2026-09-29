(() => {
  const timeRange = document.querySelector("#time-range");
  const selectedTime = document.querySelector("#selected-time");
  const searchBoardButton = document.querySelector("#search-board-button");

  const priorityList = document.querySelector("#priority-list");
  const completedPrioritySection = document.querySelector(
    "#completed-priority-section"
  );
  const completedPriorityList = document.querySelector(
    "#completed-priority-list"
  );

  const detailButtons = document.querySelectorAll(".detail-button");
  const detailDrawer = document.querySelector("#detail-drawer");
  const detailDrawerOverlay = document.querySelector(
    "#detail-drawer-overlay"
  );
  const detailCloseButton = document.querySelector("#detail-close-button");

  const detailPriorityBadge = document.querySelector(
    "#detail-priority-badge"
  );
  const detailPlaceName = document.querySelector("#detail-place-name");
  const detailAddress = document.querySelector("#detail-address");
  const detailDistance = document.querySelector("#detail-distance");
  const detailWalkingTime = document.querySelector(
    "#detail-walking-time"
  );

  const routeCheckButton = document.querySelector("#route-check-button");
  const drawerCompleteButton = document.querySelector(
    "#drawer-complete-button"
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
      label: "3시간",
      minutes: 180
    },
    {
      label: "6시간",
      minutes: 360
    }
  ];

  const DEFAULT_CENTER = {
    lat: 37.5665,
    lng: 126.978
  };

  const DEFAULT_ZOOM = 15;

  let resultMap = null;
  let detailMap = null;
  let resultCircles = [];
  let detailMarkers = [];
  let detailPolyline = null;
  let activeDetailLocation = null;
  let pendingCompleteItem = null;

  const getSearchLocation = () => {
    const storedLocation = sessionStorage.getItem(
      "goldenStepSearchLocation"
    );

    if (!storedLocation) {
      return DEFAULT_CENTER;
    }

    try {
      const parsedLocation = JSON.parse(storedLocation);

      const lat = Number(parsedLocation.lat);
      const lng = Number(parsedLocation.lng);

      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng)
      ) {
        return {
          lat,
          lng
        };
      }

      return DEFAULT_CENTER;
    } catch {
      return DEFAULT_CENTER;
    }
  };

  const SEARCH_LOCATION = getSearchLocation();

  const MOCK_ANALYSIS_RESULTS = [
    {
      minutes: 0,
      areas: [
        {
          id: "location-1",
          priorityId: "priority-1",
          name: "한강공원 산책로",
          address: "서울시 OO구 OO동",
          priority: "high",
          priorityLabel: "높은 우선도",
          distance: "약 450m",
          walkingTime: "약 6분",
          latOffset: 0.0022,
          lngOffset: -0.0018,
          radius: 180
        },
        {
          id: "location-2",
          priorityId: "priority-2",
          name: "중앙초등학교 주변",
          address: "서울시 OO구 OO동",
          priority: "medium",
          priorityLabel: "중간 우선도",
          distance: "약 720m",
          walkingTime: "약 10분",
          latOffset: -0.0024,
          lngOffset: 0.0022,
          radius: 220
        },
        {
          id: "location-3",
          priorityId: "priority-3",
          name: "OO공원",
          address: "서울시 OO구 OO동",
          priority: "low",
          priorityLabel: "낮은 우선도",
          distance: "약 980m",
          walkingTime: "약 14분",
          latOffset: 0.0006,
          lngOffset: 0.0044,
          radius: 260
        }
      ]
    },
    {
      minutes: 30,
      areas: [
        {
          id: "location-1",
          priorityId: "priority-1",
          name: "한강공원 산책로",
          address: "서울시 OO구 OO동",
          priority: "high",
          priorityLabel: "높은 우선도",
          distance: "약 650m",
          walkingTime: "약 9분",
          latOffset: 0.003,
          lngOffset: -0.0026,
          radius: 240
        },
        {
          id: "location-2",
          priorityId: "priority-2",
          name: "중앙초등학교 주변",
          address: "서울시 OO구 OO동",
          priority: "medium",
          priorityLabel: "중간 우선도",
          distance: "약 900m",
          walkingTime: "약 13분",
          latOffset: -0.0032,
          lngOffset: 0.003,
          radius: 280
        },
        {
          id: "location-3",
          priorityId: "priority-3",
          name: "OO공원",
          address: "서울시 OO구 OO동",
          priority: "low",
          priorityLabel: "낮은 우선도",
          distance: "약 1.2km",
          walkingTime: "약 17분",
          latOffset: 0.001,
          lngOffset: 0.0054,
          radius: 320
        }
      ]
    },
    {
      minutes: 60,
      areas: [
        {
          id: "location-1",
          priorityId: "priority-1",
          name: "한강공원 산책로",
          address: "서울시 OO구 OO동",
          priority: "high",
          priorityLabel: "높은 우선도",
          distance: "약 850m",
          walkingTime: "약 12분",
          latOffset: 0.0038,
          lngOffset: -0.0034,
          radius: 300
        },
        {
          id: "location-2",
          priorityId: "priority-2",
          name: "중앙초등학교 주변",
          address: "서울시 OO구 OO동",
          priority: "medium",
          priorityLabel: "중간 우선도",
          distance: "약 1.1km",
          walkingTime: "약 16분",
          latOffset: -0.004,
          lngOffset: 0.0038,
          radius: 350
        },
        {
          id: "location-3",
          priorityId: "priority-3",
          name: "OO공원",
          address: "서울시 OO구 OO동",
          priority: "low",
          priorityLabel: "낮은 우선도",
          distance: "약 1.5km",
          walkingTime: "약 21분",
          latOffset: 0.0014,
          lngOffset: 0.0064,
          radius: 400
        }
      ]
    },
    {
      minutes: 180,
      areas: [
        {
          id: "location-1",
          priorityId: "priority-1",
          name: "한강공원 산책로",
          address: "서울시 OO구 OO동",
          priority: "high",
          priorityLabel: "높은 우선도",
          distance: "약 1.5km",
          walkingTime: "약 22분",
          latOffset: 0.0058,
          lngOffset: -0.0054,
          radius: 460
        },
        {
          id: "location-2",
          priorityId: "priority-2",
          name: "중앙초등학교 주변",
          address: "서울시 OO구 OO동",
          priority: "medium",
          priorityLabel: "중간 우선도",
          distance: "약 1.9km",
          walkingTime: "약 27분",
          latOffset: -0.006,
          lngOffset: 0.0058,
          radius: 520
        },
        {
          id: "location-3",
          priorityId: "priority-3",
          name: "OO공원",
          address: "서울시 OO구 OO동",
          priority: "low",
          priorityLabel: "낮은 우선도",
          distance: "약 2.4km",
          walkingTime: "약 34분",
          latOffset: 0.0024,
          lngOffset: 0.0086,
          radius: 590
        }
      ]
    },
    {
      minutes: 360,
      areas: [
        {
          id: "location-1",
          priorityId: "priority-1",
          name: "한강공원 산책로",
          address: "서울시 OO구 OO동",
          priority: "high",
          priorityLabel: "높은 우선도",
          distance: "약 2.4km",
          walkingTime: "약 34분",
          latOffset: 0.0082,
          lngOffset: -0.0076,
          radius: 650
        },
        {
          id: "location-2",
          priorityId: "priority-2",
          name: "중앙초등학교 주변",
          address: "서울시 OO구 OO동",
          priority: "medium",
          priorityLabel: "중간 우선도",
          distance: "약 3.0km",
          walkingTime: "약 43분",
          latOffset: -0.0086,
          lngOffset: 0.008,
          radius: 720
        },
        {
          id: "location-3",
          priorityId: "priority-3",
          name: "OO공원",
          address: "서울시 OO구 OO동",
          priority: "low",
          priorityLabel: "낮은 우선도",
          distance: "약 3.8km",
          walkingTime: "약 54분",
          latOffset: 0.0038,
          lngOffset: 0.0118,
          radius: 800
        }
      ]
    }
  ];

  const LOCATION_DETAILS = {
    "location-1": {
      priorityId: "priority-1",
      priority: "high",
      priorityLabel: "높은 우선도",
      name: "한강공원 산책로",
      address: "서울시 OO구 OO동",
      distance: "약 450m",
      walkingTime: "약 6분",
      latOffset: 0.0022,
      lngOffset: -0.0018
    },
    "location-2": {
      priorityId: "priority-2",
      priority: "medium",
      priorityLabel: "중간 우선도",
      name: "중앙초등학교 주변",
      address: "서울시 OO구 OO동",
      distance: "약 720m",
      walkingTime: "약 10분",
      latOffset: -0.0024,
      lngOffset: 0.0022
    },
    "location-3": {
      priorityId: "priority-3",
      priority: "low",
      priorityLabel: "낮은 우선도",
      name: "OO공원",
      address: "서울시 OO구 OO동",
      distance: "약 980m",
      walkingTime: "약 14분",
      latOffset: 0.0006,
      lngOffset: 0.0044
    }
  };

  const getCompletedPriorityIds = () => {
    const storedValue = sessionStorage.getItem(
      "goldenStepCompletedPriorities"
    );

    if (!storedValue) {
      return [];
    }

    try {
      const parsedValue = JSON.parse(storedValue);

      return Array.isArray(parsedValue)
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

    const completedItems = Array.from(
      completedPriorityList.querySelectorAll(
        ".priority-item"
      )
    );

    const completedIds = completedItems
      .map((item) => item.dataset.priorityId)
      .filter(Boolean);

    sessionStorage.setItem(
      "goldenStepCompletedPriorities",
      JSON.stringify(completedIds)
    );
  };

  const getNaverLatLng = (lat, lng) => {
    return new naver.maps.LatLng(
      lat,
      lng
    );
  };

  const getPriorityColor = (priority) => {
    if (priority === "high") {
      return "#B98282";
    }

    if (priority === "medium") {
      return "#C2A16B";
    }

    return "#7FB7D8";
  };

  const clearResultPriorityAreas = () => {
    resultCircles.forEach((circle) => {
      circle.setMap(null);
    });

    resultCircles = [];
  };

  const renderPriorityAreas = (selectedIndex) => {
    if (
      !resultMap ||
      !MOCK_ANALYSIS_RESULTS[selectedIndex]
    ) {
      return;
    }

    clearResultPriorityAreas();

    const analysis =
      MOCK_ANALYSIS_RESULTS[selectedIndex];

    const completedPriorityIds =
      getCompletedPriorityIds();

    analysis.areas.forEach((area) => {
      if (
        completedPriorityIds.includes(
          area.priorityId
        )
      ) {
        return;
      }

      const lat =
        SEARCH_LOCATION.lat +
        area.latOffset;

      const lng =
        SEARCH_LOCATION.lng +
        area.lngOffset;

      const position =
        getNaverLatLng(
          lat,
          lng
        );

      const circle =
        new naver.maps.Circle({
          map: resultMap,
          center: position,
          radius: area.radius,
          strokeWeight: 1,
          strokeColor: getPriorityColor(
            area.priority
          ),
          strokeOpacity: 0.5,
          fillColor: getPriorityColor(
            area.priority
          ),
          fillOpacity: 0.22
        });

      resultCircles.push(circle);
    });
  };

  const initializeMap = () => {
    const mapElement =
      document.querySelector(
        "#result-map"
      );

    if (
      !mapElement ||
      typeof naver === "undefined" ||
      !naver.maps
    ) {
      return;
    }

    resultMap =
      new naver.maps.Map(
        mapElement,
        {
          center: getNaverLatLng(
            SEARCH_LOCATION.lat,
            SEARCH_LOCATION.lng
          ),
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
          zoomControlOptions: {
            position:
              naver.maps.Position.TOP_RIGHT
          }
        }
      );

    new naver.maps.Marker({
      map: resultMap,
      position: getNaverLatLng(
        SEARCH_LOCATION.lat,
        SEARCH_LOCATION.lng
      ),
      icon: {
        content: `
          <div class="search-origin-marker">
            <span></span>
          </div>
        `,
        anchor:
          new naver.maps.Point(
            20,
            40
          )
      }
    });
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
      TIME_POINTS[selectedIndex];

    if (!selectedPoint) {
      return;
    }

    selectedTime.textContent =
      selectedPoint.label;

    const maxValue =
      Number(timeRange.max);

    const progress =
      maxValue > 0
        ? (
          selectedIndex /
          maxValue
        ) * 100
        : 0;

    timeRange.style.setProperty(
      "--range-progress",
      `${progress}%`
    );

    renderPriorityAreas(
      selectedIndex
    );
  };

  const clearDetailMapObjects = () => {
    detailMarkers.forEach(
      (marker) => {
        marker.setMap(null);
      }
    );

    detailMarkers = [];

    if (detailPolyline) {
      detailPolyline.setMap(null);
      detailPolyline = null;
    }
  };

  const initializeDetailMap = () => {
    const detailMapElement =
      document.querySelector(
        "#detail-map"
      );

    if (
      !detailMapElement ||
      typeof naver === "undefined" ||
      !naver.maps
    ) {
      return;
    }

    if (!detailMap) {
      detailMap =
        new naver.maps.Map(
          detailMapElement,
          {
            center: getNaverLatLng(
              SEARCH_LOCATION.lat,
              SEARCH_LOCATION.lng
            ),
            zoom: 15,
            zoomControl: false
          }
        );
    }
  };

  const renderDetailRoute = (
    location
  ) => {
    if (!location) {
      return;
    }

    initializeDetailMap();

    if (!detailMap) {
      return;
    }

    clearDetailMapObjects();

    const startPosition =
      getNaverLatLng(
        SEARCH_LOCATION.lat,
        SEARCH_LOCATION.lng
      );

    const endPosition =
      getNaverLatLng(
        SEARCH_LOCATION.lat +
        location.latOffset,
        SEARCH_LOCATION.lng +
        location.lngOffset
      );

    const startMarker =
      new naver.maps.Marker({
        map: detailMap,
        position: startPosition,
        icon: {
          content: `
            <div class="detail-start-marker">
              <span></span>
            </div>
          `,
          anchor:
            new naver.maps.Point(
              15,
              30
            )
        }
      });

    const endMarker =
      new naver.maps.Marker({
        map: detailMap,
        position: endPosition,
        icon: {
          content: `
            <div class="detail-end-marker">
              <span></span>
            </div>
          `,
          anchor:
            new naver.maps.Point(
              15,
              30
            )
        }
      });

    detailPolyline =
      new naver.maps.Polyline({
        map: detailMap,
        path: [
          startPosition,
          endPosition
        ],
        strokeColor: "#2563EB",
        strokeWeight: 5,
        strokeOpacity: 0.85,
        strokeStyle: "solid"
      });

    detailMarkers.push(
      startMarker,
      endMarker
    );

    const bounds =
      new naver.maps.LatLngBounds();

    bounds.extend(startPosition);
    bounds.extend(endPosition);

    detailMap.fitBounds(
      bounds,
      {
        top: 60,
        right: 60,
        bottom: 60,
        left: 60
      }
    );
  };

  const updateDetailBadge = (
    location
  ) => {
    if (
      !detailPriorityBadge ||
      !location
    ) {
      return;
    }

    detailPriorityBadge.classList.remove(
      "is-high",
      "is-medium",
      "is-low"
    );

    detailPriorityBadge.textContent =
      location.priorityLabel;

    if (
      location.priority === "high"
    ) {
      detailPriorityBadge.classList.add(
        "is-high"
      );

      return;
    }

    if (
      location.priority === "medium"
    ) {
      detailPriorityBadge.classList.add(
        "is-medium"
      );

      return;
    }

    detailPriorityBadge.classList.add(
      "is-low"
    );
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

    updateDetailBadge(
      location
    );

    if (detailPlaceName) {
      detailPlaceName.textContent =
        location.name;
    }

    if (detailAddress) {
      detailAddress.textContent =
        location.address;
    }

    if (detailDistance) {
      detailDistance.textContent =
        location.distance;
    }

    if (detailWalkingTime) {
      detailWalkingTime.textContent =
        location.walkingTime;
    }

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

    document.body.style.overflow =
      "hidden";

    window.setTimeout(
      () => {
        renderDetailRoute(
          location
        );
      },
      250
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

    activeDetailLocation = null;

    if (
      completeModal &&
      !completeModal.hidden
    ) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow =
        "";
    }
  };

  const handleDetailClick = (
    event
  ) => {
    const button =
      event.currentTarget;

    const locationId =
      button.dataset.locationId;

    const location =
      LOCATION_DETAILS[
      locationId
      ];

    if (!location) {
      return;
    }

    openDetailDrawer(
      location
    );
  };

  const handleRouteCheck = () => {
    if (!activeDetailLocation) {
      return;
    }

    renderDetailRoute(
      activeDetailLocation
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

    status.appendChild(icon);
    status.appendChild(text);

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

    completeModal.hidden = false;

    document.body.style.overflow =
      "hidden";
  };

  const closeCompleteModal = () => {
    if (!completeModal) {
      return;
    }

    completeModal.hidden = true;

    pendingCompleteItem = null;

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
      completeModal.hidden = true;
    }

    pendingCompleteItem = null;

    moveItemToCompleted(
      completedItem
    );

    const selectedIndex =
      timeRange
        ? Number(timeRange.value)
        : 0;

    renderPriorityAreas(
      selectedIndex
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