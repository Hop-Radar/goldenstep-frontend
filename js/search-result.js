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
  const searchEndButton = document.querySelector("#search-end-button");
  const allCompleteModal = document.querySelector("#all-complete-modal");
  const allCompleteModalClose = document.querySelector(
    "#all-complete-modal-close"
  );
  const newSearchButton = document.querySelector("#new-search-button");
  const allCompleteEndButton = document.querySelector(
    "#all-complete-end-button"
  );
  const searchEndConfirmModal = document.querySelector(
    "#search-end-confirm-modal"
  );
  const continueSearchButton = document.querySelector(
    "#continue-search-button"
  );
  const confirmSearchEndButton = document.querySelector(
    "#confirm-search-end-button"
  );

  const API_BASE_URL = "http://127.0.0.1:8080";

  let currentSearchSession = null;

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

  const TIME_POINT_VALUES = [
    "NOW",
    "AFTER_30M",
    "AFTER_1H",
    "AFTER_3H",
    "AFTER_6H"
  ];

  const DEFAULT_CENTER = {
    lat: 37.5665,
    lng: 126.978
  };

  const DEFAULT_ZOOM = 15;

  const PRIORITY_CONFIG = {
    1: {
      priority: "high",
      priorityLabel: "높은 우선도",
      radius: 180
    },
    2: {
      priority: "medium",
      priorityLabel: "중간 우선도",
      radius: 220
    },
    3: {
      priority: "low",
      priorityLabel: "낮은 우선도",
      radius: 260
    }
  };

  let resultMap = null;
  let detailMap = null;
  let resultCircles = [];
  let detailMarkers = [];
  let detailPolyline = null;
  let activeDetailLocation = null;
  let pendingCompleteItem = null;
  let analysisResults = [];
  let locationDetails = {};

  const getSearchLocation = () => {
    const storedSearchData = sessionStorage.getItem(
      "goldenStepSearchData"
    );

    if (!storedSearchData) {
      return DEFAULT_CENTER;
    }

    try {
      const searchData = JSON.parse(storedSearchData);
      const lat = Number(searchData.latitude);
      const lng = Number(searchData.longitude);

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

  const getCurrentSearchLocation = () => {
    const lat = Number(
      currentSearchSession?.lastLat
    );

    const lng = Number(
      currentSearchSession?.lastLng
    );

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      return {
        lat,
        lng
      };
    }

    return SEARCH_LOCATION;
  };

  const getRunId = () => {
    const storedRunId =
      sessionStorage.getItem(
        "goldenStepRunId"
      );

    if (!storedRunId) {
      return null;
    }

    const runId =
      Number(storedRunId);

    if (!Number.isFinite(runId)) {
      return null;
    }

    return runId;
  };

  const getPriorityConfig = (priorityRank) => {
    const rank = Number(priorityRank);

    return (
      PRIORITY_CONFIG[rank] ||
      PRIORITY_CONFIG[3]
    );
  };

  const createLocationFromPlace = (place) => {
    const config = getPriorityConfig(
      place.priorityRank
    );

    const lat = Number(place.lat);
    const lng = Number(place.lng);

    return {
      id: `place-${place.placeId}`,
      priorityId: `place-${place.placeId}`,
      placeId: Number(place.placeId),
      poiId: place.poiId || "",
      priorityRank: Number(place.priorityRank),
      priority: config.priority,
      priorityLabel: config.priorityLabel,
      name: place.name || "장소 정보 없음",
      address: place.address || "",
      lat,
      lng,
      radius: config.radius,
      score: place.score ?? null,
      checked: Boolean(place.checked),
      checkedAt: place.checkedAt || null,
      distance: "경로 확인 필요",
      walkingTime: "경로 확인 필요"
    };
  };

  const convertTimeResult = (
    result,
    selectedIndex
  ) => {
    const places = Array.isArray(result?.places)
      ? result.places
      : [];

    const areas = places
      .map(createLocationFromPlace)
      .filter(
        (location) =>
          Number.isFinite(location.lat) &&
          Number.isFinite(location.lng)
      );

    areas.forEach((location) => {
      locationDetails[location.id] =
        location;
    });

    return {
      minutes:
        TIME_POINTS[selectedIndex]?.minutes ??
        0,
      timePoint:
        TIME_POINT_VALUES[selectedIndex],
      runId: result?.runId ?? null,
      resultId: result?.resultId ?? null,
      targetAt: result?.targetAt ?? null,
      boundaryZone:
        result?.boundaryZone ?? null,
      reliabilityStatus:
        result?.reliabilityStatus ?? null,
      areas
    };
  };

  const createTimeResult = async (
    runId,
    timePoint,
    selectedIndex
  ) => {
    const response = await fetch(
      `${API_BASE_URL}/api/search/analysis/${runId}/results/${timePoint}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );

    let responseData = null;

    try {
      responseData =
        await response.json();
    } catch {
      responseData = null;
    }

    if (!response.ok) {
      throw new Error(
        responseData?.message ||
        "시간점 분석 결과를 생성하지 못했습니다."
      );
    }

    const convertedResult =
      convertTimeResult(
        responseData,
        selectedIndex
      );

    analysisResults[selectedIndex] =
      convertedResult;

    return convertedResult;
  };

  const fetchTimeResult = async (
    selectedIndex
  ) => {
    const runId = getRunId();
    const timePoint =
      TIME_POINT_VALUES[selectedIndex];

    if (!runId || !timePoint) {
      throw new Error(
        "분석 실행 정보를 찾을 수 없습니다."
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/api/search/analysis/${runId}/results/${timePoint}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );

    let responseData = null;

    try {
      responseData =
        await response.json();
    } catch {
      responseData = null;
    }

    if (response.status === 404) {
      return createTimeResult(
        runId,
        timePoint,
        selectedIndex
      );
    }

    if (!response.ok) {
      throw new Error(
        responseData?.message ||
        "분석 결과를 불러오지 못했습니다."
      );
    }

    const convertedResult =
      convertTimeResult(
        responseData,
        selectedIndex
      );

    analysisResults[selectedIndex] =
      convertedResult;

    return convertedResult;
  };

  const fetchAllTimeResults = async () => {
    locationDetails = {};

    const requests =
      TIME_POINT_VALUES.map(
        async (timePoint, index) => {
          try {
            return await fetchTimeResult(
              index
            );
          } catch (error) {
            console.error(
              `${timePoint} result error:`,
              error
            );

            return {
              minutes:
                TIME_POINTS[index]
                  ?.minutes ?? 0,
              timePoint,
              areas: []
            };
          }
        }
      );

    analysisResults =
      await Promise.all(requests);
  };

  const getNaverLatLng = (lat, lng) => {
    return new naver.maps.LatLng(
      lat,
      lng
    );
  };

  const getPriorityColor = (
    priority
  ) => {
    if (priority === "high") {
      return "#EF4444";
    }

    if (priority === "medium") {
      return "#FFB000";
    }

    return "#1E90FF";
  };

  const clearResultPriorityAreas = () => {
    resultCircles.forEach((circle) => {
      circle.setMap(null);
    });

    resultCircles = [];
  };

  const renderPriorityAreas = (
    selectedIndex
  ) => {
    if (
      !resultMap ||
      !analysisResults[selectedIndex]
    ) {
      return;
    }

    clearResultPriorityAreas();

    const analysis =
      analysisResults[selectedIndex];

    analysis.areas.forEach((area) => {
      if (area.checked) {
        return;
      }

      const position = getNaverLatLng(
        area.lat,
        area.lng
      );

      const circle =
        new naver.maps.Circle({
          map: resultMap,
          center: position,
          radius: area.radius,
          strokeWeight: 1,
          strokeColor:
            getPriorityColor(
              area.priority
            ),
          strokeOpacity: 0.5,
          fillColor:
            getPriorityColor(
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

    const searchLocation =
      getCurrentSearchLocation();

    resultMap =
      new naver.maps.Map(
        mapElement,
        {
          center: getNaverLatLng(
            searchLocation.lat,
            searchLocation.lng
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
        searchLocation.lat,
        searchLocation.lng
      ),
      icon: {
        content: `
          <div class="board-location-marker">
            <div class="board-location-marker-pin">
              <span></span>
            </div>
          </div>
        `,
        anchor:
          new naver.maps.Point(
            20,
            42
          )
      }
    });
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

    const searchLocation =
      getCurrentSearchLocation();

    if (!detailMap) {
      detailMap =
        new naver.maps.Map(
          detailMapElement,
          {
            center: getNaverLatLng(
              searchLocation.lat,
              searchLocation.lng
            ),
            zoom: 15,
            zoomControl: false
          }
        );
    }
  };

  const getDestinationPosition = (
    location
  ) => {
    return {
      lat: Number(location.lat),
      lng: Number(location.lng)
    };
  };

  const createStartMarker = (
    position
  ) => {
    return new naver.maps.Marker({
      map: detailMap,
      position,
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
  };

  const createEndMarker = (
    position
  ) => {
    return new naver.maps.Marker({
      map: detailMap,
      position,
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
  };

  const renderDetailPoints = (
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

    const destination =
      getDestinationPosition(location);

    const searchLocation =
      getCurrentSearchLocation();

    const startPosition =
      getNaverLatLng(
        searchLocation.lat,
        searchLocation.lng
      );

    const endPosition =
      getNaverLatLng(
        destination.lat,
        destination.lng
      );

    const startMarker =
      createStartMarker(
        startPosition
      );

    const endMarker =
      createEndMarker(
        endPosition
      );

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

  const formatWalkingDistance = (
    meters
  ) => {
    const distance =
      Number(meters);

    if (!Number.isFinite(distance)) {
      return "거리 정보 없음";
    }

    if (distance >= 1000) {
      const kilometers =
        distance / 1000;

      return `약 ${kilometers.toFixed(
        1
      )}km`;
    }

    return `약 ${Math.round(
      distance
    )}m`;
  };

  const formatWalkingTime = (
    seconds
  ) => {
    const totalSeconds =
      Number(seconds);

    if (
      !Number.isFinite(totalSeconds)
    ) {
      return "시간 정보 없음";
    }

    const minutes = Math.max(
      1,
      Math.ceil(
        totalSeconds / 60
      )
    );

    return `약 ${minutes}분`;
  };

  const getRouteSummary = (
    features
  ) => {
    for (
      let index = 0;
      index < features.length;
      index += 1
    ) {
      const properties =
        features[index].properties;

      if (!properties) {
        continue;
      }

      const totalDistance =
        Number(
          properties.totalDistance
        );

      const totalTime =
        Number(
          properties.totalTime
        );

      if (
        Number.isFinite(
          totalDistance
        ) &&
        Number.isFinite(
          totalTime
        )
      ) {
        return {
          totalDistance,
          totalTime
        };
      }
    }

    return null;
  };

  const getRoutePath = (
    features
  ) => {
    const routePath = [];

    features.forEach((feature) => {
      if (
        !feature.geometry ||
        feature.geometry.type !==
        "LineString" ||
        !Array.isArray(
          feature.geometry.coordinates
        )
      ) {
        return;
      }

      feature.geometry.coordinates.forEach(
        (coordinate) => {
          if (
            !Array.isArray(
              coordinate
            ) ||
            coordinate.length < 2
          ) {
            return;
          }

          const lng =
            Number(coordinate[0]);

          const lat =
            Number(coordinate[1]);

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
          ) {
            return;
          }

          routePath.push(
            getNaverLatLng(
              lat,
              lng
            )
          );
        }
      );
    });

    return routePath;
  };

  const renderPedestrianRoute = (
    location,
    routePath
  ) => {
    initializeDetailMap();

    if (
      !detailMap ||
      !location ||
      routePath.length < 2
    ) {
      return;
    }

    clearDetailMapObjects();

    const destination =
      getDestinationPosition(location);

    const searchLocation =
      getCurrentSearchLocation();

    const startPosition =
      getNaverLatLng(
        searchLocation.lat,
        searchLocation.lng
      );

    const endPosition =
      getNaverLatLng(
        destination.lat,
        destination.lng
      );

    const startMarker =
      createStartMarker(
        startPosition
      );

    const endMarker =
      createEndMarker(
        endPosition
      );

    detailPolyline =
      new naver.maps.Polyline({
        map: detailMap,
        path: routePath,
        strokeColor: "#2563EB",
        strokeWeight: 6,
        strokeOpacity: 1,
        strokeStyle: "solid",
        strokeLineCap: "round",
        strokeLineJoin: "round",
        outlineColor: "#FFFFFF",
        outlineWeight: 3,
        outlineOpacity: 0.95
      });

    detailMarkers.push(
      startMarker,
      endMarker
    );

    const bounds =
      new naver.maps.LatLngBounds();

    routePath.forEach(
      (position) => {
        bounds.extend(position);
      }
    );

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

  const setRouteButtonLoading = (
    isLoading
  ) => {
    if (!routeCheckButton) {
      return;
    }

    routeCheckButton.disabled =
      isLoading;

    if (isLoading) {
      routeCheckButton.textContent =
        "경로 확인 중...";
      return;
    }

    routeCheckButton.innerHTML = `
      <span aria-hidden="true">➤</span>
      <span>경로 확인</span>
    `;
  };

  const requestPedestrianRoute =
    async (location) => {
      if (!location) {
        return;
      }

      const appKey =
        window.TMAP_CONFIG &&
        window.TMAP_CONFIG.appKey;

      if (!appKey) {
        alert(
          "TMAP AppKey를 확인해주세요."
        );
        return;
      }

      const destination =
        getDestinationPosition(
          location
        );

      const searchLocation =
        getCurrentSearchLocation();

      setRouteButtonLoading(true);

      try {
        const response =
          await fetch(
            "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1",
            {
              method: "POST",
              headers: {
                Accept:
                  "application/json",
                "Content-Type":
                  "application/json",
                appKey
              },
              body: JSON.stringify({
                startX: String(
                  searchLocation.lng
                ),
                startY: String(
                  searchLocation.lat
                ),
                endX: String(
                  destination.lng
                ),
                endY: String(
                  destination.lat
                ),
                reqCoordType:
                  "WGS84GEO",
                resCoordType:
                  "WGS84GEO",
                startName:
                  "마지막 확인 위치",
                endName:
                  location.name,
                searchOption: "0"
              })
            }
          );

        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            `TMAP API ${response.status}: ${errorText}`
          );
        }

        const data =
          await response.json();

        if (
          !data ||
          !Array.isArray(
            data.features
          ) ||
          data.features.length === 0
        ) {
          throw new Error(
            "TMAP 경로 데이터가 없습니다."
          );
        }

        const summary =
          getRouteSummary(
            data.features
          );

        if (!summary) {
          throw new Error(
            "TMAP 거리 및 시간 정보를 찾을 수 없습니다."
          );
        }

        const routePath =
          getRoutePath(
            data.features
          );

        if (
          routePath.length < 2
        ) {
          throw new Error(
            "TMAP 보행 경로 좌표를 찾을 수 없습니다."
          );
        }

        if (detailDistance) {
          detailDistance.textContent =
            formatWalkingDistance(
              summary.totalDistance
            );
        }

        if (detailWalkingTime) {
          detailWalkingTime.textContent =
            formatWalkingTime(
              summary.totalTime
            );
        }

        renderPedestrianRoute(
          location,
          routePath
        );
      } catch (error) {
        console.error(
          "TMAP pedestrian route error:",
          error
        );

        alert(
          "보행 경로를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
        );

        renderDetailPoints(
          location
        );
      } finally {
        setRouteButtonLoading(false);
      }
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

    updateDetailBadge(location);

    if (detailPlaceName) {
      detailPlaceName.textContent =
        location.name;
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

    window.setTimeout(() => {
      renderDetailPoints(
        location
      );
    }, 250);
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

    clearDetailMapObjects();

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
      locationDetails[
      locationId
      ];

    if (!location) {
      return;
    }

    openDetailDrawer(location);
  };

  const handleRouteCheck =
    async () => {
      if (
        !activeDetailLocation
      ) {
        return;
      }

      await requestPedestrianRoute(
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
    item
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
  };

  const createPriorityItem = (
    location,
    index
  ) => {
    const item =
      document.createElement(
        "li"
      );

    item.className =
      "priority-item";

    item.dataset.priorityId =
      location.priorityId;

    item.dataset.placeId =
      String(location.placeId);

    const rank =
      document.createElement(
        "span"
      );

    rank.className =
      "priority-rank";

    rank.textContent =
      String(index + 1);

    const info =
      document.createElement(
        "div"
      );

    info.className =
      "priority-info";

    const name =
      document.createElement(
        "strong"
      );

    name.textContent =
      location.name;

    const address =
      document.createElement(
        "span"
      );

    address.textContent =
      location.address ||
      "주소 정보 없음";

    info.appendChild(name);
    info.appendChild(address);

    const actions =
      document.createElement(
        "div"
      );

    actions.className =
      "priority-actions";

    const detailButton =
      document.createElement(
        "button"
      );

    detailButton.type = "button";

    detailButton.className =
      "detail-button";

    detailButton.dataset.locationId =
      location.id;

    detailButton.textContent =
      "상세보기";

    detailButton.addEventListener(
      "click",
      handleDetailClick
    );

    actions.appendChild(
      detailButton
    );

    item.appendChild(rank);
    item.appendChild(info);
    item.appendChild(actions);

    return item;
  };

  const renderPriorityList = (
    selectedIndex
  ) => {
    if (!priorityList) {
      return;
    }

    const analysis =
      analysisResults[
      selectedIndex
      ];

    if (!analysis) {
      return;
    }

    priorityList.replaceChildren();

    if (completedPriorityList) {
      completedPriorityList.replaceChildren();
    }

    if (completedPrioritySection) {
      completedPrioritySection.hidden =
        true;
    }

    [...analysis.areas]
      .sort(
        (a, b) =>
          a.priorityRank -
          b.priorityRank
      )
      .forEach(
        (location, index) => {
          const item =
            createPriorityItem(
              location,
              index
            );

          if (
            location.checked &&
            completedPriorityList &&
            completedPrioritySection
          ) {
            moveItemToCompleted(
              item
            );
            return;
          }

          priorityList.appendChild(
            item
          );
        }
      );

    if (
      completedPriorityList &&
      completedPriorityList
        .children.length > 0
    ) {
      completedPrioritySection.hidden =
        false;
    }

    updatePriorityRanks();
  };

  const updateTime = async () => {
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

    if (
      !analysisResults[
      selectedIndex
      ]
    ) {
      try {
        await fetchTimeResult(
          selectedIndex
        );
      } catch (error) {
        console.error(
          "Time result error:",
          error
        );
        return;
      }
    }

    renderPriorityList(
      selectedIndex
    );

    renderPriorityAreas(
      selectedIndex
    );
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

  const syncBodyOverflow = () => {
    const hasOpenModal = [
      completeModal,
      allCompleteModal,
      searchEndConfirmModal
    ].some(
      (modal) =>
        modal &&
        !modal.hidden
    );

    const hasOpenDrawer =
      detailDrawer &&
      detailDrawer.classList.contains(
        "is-open"
      );

    document.body.style.overflow =
      hasOpenModal ||
        hasOpenDrawer
        ? "hidden"
        : "";
  };

  const openAllCompleteModal = () => {
    if (!allCompleteModal) {
      return;
    }

    allCompleteModal.hidden =
      false;

    syncBodyOverflow();
  };

  const closeAllCompleteModal = () => {
    if (!allCompleteModal) {
      return;
    }

    allCompleteModal.hidden =
      true;

    syncBodyOverflow();
  };

  const openSearchEndConfirmModal =
    () => {
      if (allCompleteModal) {
        allCompleteModal.hidden =
          true;
      }

      if (
        !searchEndConfirmModal
      ) {
        return;
      }

      searchEndConfirmModal.hidden =
        false;

      syncBodyOverflow();
    };

  const closeSearchEndConfirmModal =
    () => {
      if (
        !searchEndConfirmModal
      ) {
        return;
      }

      searchEndConfirmModal.hidden =
        true;

      syncBodyOverflow();
    };

  const clearCurrentSearchData = () => {
    sessionStorage.removeItem(
      "goldenStepSearchData"
    );

    sessionStorage.removeItem(
      "goldenStepCompletedPriorities"
    );
  };

  const handleNewSearch = () => {
    clearCurrentSearchData();

    window.location.href =
      "./search-form.html";
  };

  const handleSearchEndConfirm =
    () => {
      clearCurrentSearchData();

      window.location.href =
        "./index.html";
    };

  const handleDrawerCompleteClick =
    () => {
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

  const checkPlace = async (
    placeId
  ) => {
    const response = await fetch(
      `${API_BASE_URL}/api/search/places/${placeId}/check`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );

    let responseData = null;

    try {
      responseData =
        await response.json();
    } catch {
      responseData = null;
    }

    if (!response.ok) {
      throw new Error(
        responseData?.message ||
        "추천 장소 확인 완료 처리에 실패했습니다."
      );
    }

    return responseData;
  };

  const handleCompleteConfirm =
    async () => {
      if (
        !pendingCompleteItem
      ) {
        return;
      }

      const completedItem =
        pendingCompleteItem;

      const placeId = Number(
        completedItem.dataset.placeId
      );

      if (
        !Number.isFinite(placeId)
      ) {
        alert(
          "장소 정보를 확인할 수 없습니다."
        );
        return;
      }

      if (completeModalConfirm) {
        completeModalConfirm.disabled =
          true;
      }

      try {
        const checkResult =
          await checkPlace(
            placeId
          );

        const selectedIndex =
          timeRange
            ? Number(
              timeRange.value
            )
            : 0;

        const analysis =
          analysisResults[
          selectedIndex
          ];

        const location =
          analysis?.areas.find(
            (area) =>
              area.placeId ===
              placeId
          );

        if (location) {
          location.checked =
            checkResult?.checked ??
            true;

          location.checkedAt =
            checkResult?.checkedAt ??
            new Date().toISOString();
        }

        if (completeModal) {
          completeModal.hidden =
            true;
        }

        pendingCompleteItem =
          null;

        moveItemToCompleted(
          completedItem
        );

        renderPriorityAreas(
          selectedIndex
        );

        closeDetailDrawer();

        document.body.style.overflow =
          "";

        const completedCount =
          analysis
            ? analysis.areas.filter(
              (area) =>
                area.checked
            ).length
            : 0;

        if (
          analysis &&
          analysis.areas.length >
          0 &&
          completedCount >=
          analysis.areas.length
        ) {
          openAllCompleteModal();
        }
      } catch (error) {
        console.error(
          "Place check error:",
          error
        );

        alert(
          error.message ||
          "탐색 완료 처리에 실패했습니다."
        );
      } finally {
        if (
          completeModalConfirm
        ) {
          completeModalConfirm.disabled =
            false;
        }
      }
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
        event.key === "Enter" &&
        completeModal &&
        !completeModal.hidden
      ) {
        event.preventDefault();
        handleCompleteConfirm();
        return;
      }

      if (
        event.key !== "Escape"
      ) {
        return;
      }

      if (
        searchEndConfirmModal &&
        !searchEndConfirmModal.hidden
      ) {
        closeSearchEndConfirmModal();
        return;
      }

      if (
        allCompleteModal &&
        !allCompleteModal.hidden
      ) {
        closeAllCompleteModal();
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

  if (searchEndButton) {
    searchEndButton.addEventListener(
      "click",
      openSearchEndConfirmModal
    );
  }

  if (allCompleteModalClose) {
    allCompleteModalClose.addEventListener(
      "click",
      closeAllCompleteModal
    );
  }

  if (newSearchButton) {
    newSearchButton.addEventListener(
      "click",
      handleNewSearch
    );
  }

  if (allCompleteEndButton) {
    allCompleteEndButton.addEventListener(
      "click",
      openSearchEndConfirmModal
    );
  }

  if (continueSearchButton) {
    continueSearchButton.addEventListener(
      "click",
      closeSearchEndConfirmModal
    );
  }

  if (confirmSearchEndButton) {
    confirmSearchEndButton.addEventListener(
      "click",
      handleSearchEndConfirm
    );
  }

  if (allCompleteModal) {
    allCompleteModal.addEventListener(
      "click",
      (event) => {
        if (
          event.target.hasAttribute(
            "data-close-all-complete-modal"
          )
        ) {
          closeAllCompleteModal();
        }
      }
    );
  }

  if (searchEndConfirmModal) {
    searchEndConfirmModal.addEventListener(
      "click",
      (event) => {
        if (
          event.target.hasAttribute(
            "data-close-search-end-modal"
          )
        ) {
          closeSearchEndConfirmModal();
        }
      }
    );
  }

  const fetchCurrentSearchSession =
    async () => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/search/current`,
            {
              method: "GET",
              credentials: "include"
            }
          );

        let responseData = null;

        try {
          responseData =
            await response.json();
        } catch {
          responseData = null;
        }

        if (!response.ok) {
          throw new Error(
            responseData?.message ||
            "현재 탐색 정보를 불러오지 못했습니다."
          );
        }

        currentSearchSession =
          responseData;

        console.log(
          "Current search session:",
          currentSearchSession
        );

        return currentSearchSession;
      } catch (error) {
        console.error(
          "Current search session API error:",
          error
        );

        return null;
      }
    };

  const initializeSearchResult =
    async () => {
      initializeMap();

      await fetchCurrentSearchSession();

      const runId = getRunId();

      if (!runId) {
        console.error(
          "분석 runId를 찾을 수 없습니다.",
          currentSearchSession
        );
        return;
      }

      try {
        await fetchAllTimeResults();
        await updateTime();
      } catch (error) {
        console.error(
          "Search result initialization error:",
          error
        );

        alert(
          "탐색 결과를 불러오지 못했습니다."
        );
      }
    };

  initializeSearchResult();
})();