(() => {

  console.log("NEW SEARCH RESULT JS LOADED");

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
      priorityLabel: "1순위",
      radius: 250
    },
    2: {
      priority: "medium",
      priorityLabel: "2순위",
      radius: 250
    },
    3: {
      priority: "low",
      priorityLabel: "3순위",
      radius: 250
    }
  };

  let resultMap = null;

  let detailMap = null;

  let resultCircles = [];

  let resultBoundaryPolygon = null;

  let detailMarkers = [];

  let detailPolyline = null;

  let activeDetailLocation = null;

  let pendingCompleteItem = null;

  let analysisResults = [];

  let locationDetails = {};

  let lastRenderedTimeIndex = 0;

  let isTimeResultLoading = false;

  const timeResultRequests = new Map();

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
      window.GoldenStepApi.getApiUrl(
        `/api/search/analysis/${runId}/results/${timePoint}`
      ),
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
      window.GoldenStepApi.getApiUrl(
        `/api/search/analysis/${runId}/results/${timePoint}`
      ),
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

  const getTimeLoadingOverlay = () => {
    let overlay = document.querySelector(
      "#time-result-loading-overlay"
    );

    if (overlay) {
      return overlay;
    }

    overlay = document.createElement("div");

    overlay.id =
      "time-result-loading-overlay";

    overlay.setAttribute(
      "role",
      "status"
    );

    overlay.setAttribute(
      "aria-live",
      "polite"
    );

    overlay.setAttribute(
      "aria-busy",
      "true"
    );

    const spinner =
      document.createElement("span");

    spinner.className =
      "time-result-loading-spinner";

    const message =
      document.createElement("p");

    message.textContent =
      "예측 데이터를 분석하고 있습니다.";

    overlay.appendChild(spinner);

    overlay.appendChild(message);

    Object.assign(
      overlay.style,
      {
        position: "fixed",
        inset: "0",
        zIndex: "100000",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
        background:
          "rgb(15 23 42 / 28%)",
        backdropFilter:
          "blur(2px)",
        WebkitBackdropFilter:
          "blur(2px)",
        cursor: "wait"
      }
    );

    Object.assign(
      spinner.style,
      {
        width: "44px",
        height: "44px",
        border:
          "4px solid rgb(255 255 255 / 45%)",
        borderTopColor:
          "#ffffff",
        borderRadius: "50%",
        animation:
          "goldenStepTimeLoadingSpin 0.8s linear infinite"
      }
    );

    Object.assign(
      message.style,
      {
        margin: "0",
        padding: "10px 16px",
        borderRadius: "10px",
        background:
          "rgb(15 23 42 / 82%)",
        color: "#ffffff",
        fontFamily:
          '"Pretendard", sans-serif',
        fontSize: "14px",
        fontWeight: "600",
        lineHeight: "1.5"
      }
    );

    if (
      !document.querySelector(
        "#time-result-loading-style"
      )
    ) {
      const style =
        document.createElement(
          "style"
        );

      style.id =
        "time-result-loading-style";

      style.textContent = `
        @keyframes goldenStepTimeLoadingSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }
      `;

      document.head.appendChild(
        style
      );
    }

    document.body.appendChild(
      overlay
    );

    return overlay;
  };

  const blockLoadingKeyboardInput = (
    event
  ) => {
    if (!isTimeResultLoading) {
      return;
    }

    event.preventDefault();

    event.stopPropagation();
  };

  const setTimeResultLoading = (
    loading
  ) => {
    isTimeResultLoading = loading;

    const overlay =
      getTimeLoadingOverlay();

    overlay.style.display =
      loading ? "flex" : "none";

    document.body.style.overflow =
      loading ? "hidden" : "";

    if (timeRange) {
      timeRange.disabled =
        loading;
    }
  };

  const fetchTimeResultOnce = async (
    selectedIndex
  ) => {
    if (
      analysisResults[
      selectedIndex
      ]
    ) {
      return analysisResults[
        selectedIndex
      ];
    }

    if (
      timeResultRequests.has(
        selectedIndex
      )
    ) {
      return timeResultRequests.get(
        selectedIndex
      );
    }

    const request =
      fetchTimeResult(
        selectedIndex
      ).finally(() => {
        timeResultRequests.delete(
          selectedIndex
        );
      });

    timeResultRequests.set(
      selectedIndex,
      request
    );

    return request;
  };

  const getNaverLatLng = (
    lat,
    lng
  ) => {
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

  const clearResultPriorityAreas =
    () => {
      resultCircles.forEach(
        (circle) => {
          circle.setMap(null);
        }
      );

      resultCircles = [];
    };

  const clearResultBoundary = () => {
    if (!resultBoundaryPolygon) {
      return;
    }

    resultBoundaryPolygon.setMap(
      null
    );

    resultBoundaryPolygon = null;
  };

  const getBoundaryFeature = (
    boundaryZone
  ) => {
    if (
      !boundaryZone ||
      !Array.isArray(
        boundaryZone.features
      )
    ) {
      return null;
    }

    return (
      boundaryZone.features.find(
        (feature) =>
          feature?.geometry?.type ===
          "Polygon" &&
          Array.isArray(
            feature.geometry.coordinates
          )
      ) || null
    );
  };

  const getBoundaryPath = (
    boundaryZone
  ) => {
    const feature =
      getBoundaryFeature(
        boundaryZone
      );

    if (!feature) {
      return [];
    }

    const polygonCoordinates =
      feature.geometry.coordinates[0];

    if (
      !Array.isArray(
        polygonCoordinates
      )
    ) {
      return [];
    }

    return polygonCoordinates
      .map((coordinate) => {
        if (
          !Array.isArray(
            coordinate
          ) ||
          coordinate.length < 2
        ) {
          return null;
        }

        const lng =
          Number(coordinate[0]);

        const lat =
          Number(coordinate[1]);

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng)
        ) {
          return null;
        }

        return getNaverLatLng(
          lat,
          lng
        );
      })
      .filter(Boolean);
  };

  const renderBoundaryZone = (
    selectedIndex
  ) => {
    if (
      !resultMap ||
      !analysisResults[
      selectedIndex
      ]
    ) {
      return;
    }

    clearResultBoundary();

    const analysis =
      analysisResults[
      selectedIndex
      ];

    const boundaryZone =
      analysis.boundaryZone;

    const feature =
      getBoundaryFeature(
        boundaryZone
      );

    if (!feature) {
      return;
    }

    const path =
      getBoundaryPath(
        boundaryZone
      );

    if (path.length < 3) {
      return;
    }

    const properties =
      feature.properties || {};

    const fillColor =
      properties.fillColor ||
      properties.fill_color ||
      "#2563EB";

    const rawFillOpacity =
      properties.fillOpacity ??
      properties.fill_opacity ??
      0.25;

    const fillOpacity =
      Number(rawFillOpacity);

    resultBoundaryPolygon =
      new naver.maps.Polygon({
        map: resultMap,
        paths: [path],
        strokeColor: "#2563EB",
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: "#E5E7EB",
        fillOpacity: 0.35
      });
  };

  const renderPriorityAreas = (
    selectedIndex
  ) => {
    if (
      !resultMap ||
      !analysisResults[
      selectedIndex
      ]
    ) {
      return;
    }

    clearResultPriorityAreas();

    renderBoundaryZone(
      selectedIndex
    );

    const analysis =
      analysisResults[
      selectedIndex
      ];

    analysis.areas.forEach(
      (area) => {
        if (area.checked) {
          return;
        }

        const position =
          getNaverLatLng(
            area.lat,
            area.lng
          );

        const circle =
          new naver.maps.Circle({
            map: resultMap,
            center: position,
            radius: 250,
            strokeWeight: 1,
            strokeColor:
              getPriorityColor(
                area.priority
              ),
            strokeOpacity: 0.65,
            fillColor:
              getPriorityColor(
                area.priority
              ),
            fillOpacity: 0.22
          });

        resultCircles.push(
          circle
        );
      }
    );
  };

  const initializeMap = () => {
    const mapElement =
      document.querySelector(
        "#result-map"
      );

    if (
      !mapElement ||
      typeof naver ===
      "undefined" ||
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
          center:
            getNaverLatLng(
              searchLocation.lat,
              searchLocation.lng
            ),
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
          zoomControlOptions: {
            position:
              naver.maps
                .Position
                .TOP_RIGHT
          }
        }
      );

    new naver.maps.Marker({
      map: resultMap,
      position:
        getNaverLatLng(
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

  const clearDetailMapObjects =
    () => {
      detailMarkers.forEach(
        (marker) => {
          marker.setMap(null);
        }
      );

      detailMarkers = [];

      if (detailPolyline) {
        detailPolyline.setMap(
          null
        );

        detailPolyline = null;
      }
    };

  const initializeDetailMap =
    () => {
      const detailMapElement =
        document.querySelector(
          "#detail-map"
        );

      if (
        !detailMapElement ||
        typeof naver ===
        "undefined" ||
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
              center:
                getNaverLatLng(
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
      getDestinationPosition(
        location
      );

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
      new naver.maps
        .LatLngBounds();

    bounds.extend(
      startPosition
    );

    bounds.extend(
      endPosition
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

  const formatWalkingDistance = (
    meters
  ) => {
    const distance =
      Number(meters);

    if (
      !Number.isFinite(
        distance
      )
    ) {
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
      !Number.isFinite(
        totalSeconds
      )
    ) {
      return "시간 정보 없음";
    }

    const minutes =
      Math.max(
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
        features[index]
          .properties;

      if (!properties) {
        continue;
      }

      const totalDistance =
        Number(
          properties
            .totalDistance
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

    features.forEach(
      (feature) => {
        if (
          !feature.geometry ||
          feature.geometry.type !==
          "LineString" ||
          !Array.isArray(
            feature.geometry
              .coordinates
          )
        ) {
          return;
        }

        feature.geometry
          .coordinates
          .forEach(
            (coordinate) => {
              if (
                !Array.isArray(
                  coordinate
                ) ||
                coordinate.length <
                2
              ) {
                return;
              }

              const lng =
                Number(
                  coordinate[0]
                );

              const lat =
                Number(
                  coordinate[1]
                );

              if (
                !Number.isFinite(
                  lat
                ) ||
                !Number.isFinite(
                  lng
                )
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
      }
    );

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
      getDestinationPosition(
        location
      );

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
        strokeColor:
          "#2563EB",
        strokeWeight: 6,
        strokeOpacity: 1,
        strokeStyle: "solid",
        strokeLineCap:
          "round",
        strokeLineJoin:
          "round",
        outlineColor:
          "#FFFFFF",
        outlineWeight: 3,
        outlineOpacity: 0.95
      });

    detailMarkers.push(
      startMarker,
      endMarker
    );

    const bounds =
      new naver.maps
        .LatLngBounds();

    routePath.forEach(
      (position) => {
        bounds.extend(
          position
        );
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
        window.ENV?.TMAP_APP_KEY;

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

      setRouteButtonLoading(
        true
      );

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
              body:
                JSON.stringify({
                  startX:
                    String(
                      searchLocation.lng
                    ),
                  startY:
                    String(
                      searchLocation.lat
                    ),
                  endX:
                    String(
                      destination.lng
                    ),
                  endY:
                    String(
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
                  searchOption:
                    "0"
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
          data.features
            .length === 0
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
          detailDistance
            .textContent =
            formatWalkingDistance(
              summary
                .totalDistance
            );
        }

        if (
          detailWalkingTime
        ) {
          detailWalkingTime
            .textContent =
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
        setRouteButtonLoading(
          false
        );
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

    detailPriorityBadge
      .classList.remove(
        "is-high",
        "is-medium",
        "is-low"
      );

    detailPriorityBadge
      .textContent =
      location.priorityLabel;

    if (
      location.priority ===
      "high"
    ) {
      detailPriorityBadge
        .classList.add(
          "is-high"
        );

      return;
    }

    if (
      location.priority ===
      "medium"
    ) {
      detailPriorityBadge
        .classList.add(
          "is-medium"
        );

      return;
    }

    detailPriorityBadge
      .classList.add(
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
      detailPlaceName
        .textContent =
        location.name;
    }

    if (detailDistance) {
      detailDistance
        .textContent =
        location.distance;
    }

    if (
      detailWalkingTime
    ) {
      detailWalkingTime
        .textContent =
        location.walkingTime;
    }

    detailDrawer
      .classList.add(
        "is-open"
      );

    detailDrawerOverlay
      .classList.add(
        "is-open"
      );

    detailDrawer.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style
      .overflow =
      "hidden";

    window.setTimeout(
      () => {
        renderDetailPoints(
          location
        );
      },
      250
    );
  };

  const closeDetailDrawer =
    () => {
      if (
        !detailDrawer ||
        !detailDrawerOverlay
      ) {
        return;
      }

      detailDrawer
        .classList.remove(
          "is-open"
        );

      detailDrawerOverlay
        .classList.remove(
          "is-open"
        );

      detailDrawer.setAttribute(
        "aria-hidden",
        "true"
      );

      activeDetailLocation =
        null;

      clearDetailMapObjects();

      if (
        completeModal &&
        !completeModal.hidden
      ) {
        document.body.style
          .overflow =
          "hidden";
      } else {
        document.body.style
          .overflow = "";
      }
    };

  const handleDetailClick = (
    event
  ) => {
    const button =
      event.currentTarget;

    const locationId =
      button.dataset
        .locationId;

    const location =
      locationDetails[
      locationId
      ];

    if (!location) {
      return;
    }

    openDetailDrawer(
      location
    );
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

  const updatePriorityRanks =
    () => {
      if (!priorityList) {
        return;
      }

      const activeItems =
        priorityList
          .querySelectorAll(
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

  const createCompletedStatus =
    () => {
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

    completedPriorityList
      .appendChild(
        item
      );

    completedPrioritySection
      .hidden = false;

    updatePriorityRanks();
  };

  const getPriorityDescription = (
    priorityRank
  ) => {
    const rank =
      Number(priorityRank);

    if (rank === 1) {
      return "가장 먼저 확인이 필요한 지역입니다.";
    }

    if (rank === 2) {
      return "두 번째로 확인이 필요한 지역입니다.";
    }

    return "세 번째로 확인이 필요한 지역입니다.";
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
      String(
        location.placeId
      );

    const rank =
      document.createElement(
        "span"
      );

    const priorityRank =
      Number(
        location.priorityRank
      );

    rank.className =
      `priority-rank priority-rank-${priorityRank}`;

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

    info.appendChild(
      address
    );

    const description =
      document.createElement(
        "p"
      );

    description.className =
      "priority-description";

    description.textContent =
      getPriorityDescription(
        location.priorityRank
      );

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

    detailButton.type =
      "button";

    detailButton.className =
      "detail-button";

    detailButton.dataset
      .locationId =
      location.id;

    detailButton.textContent =
      "상세보기";

    detailButton
      .addEventListener(
        "click",
        handleDetailClick
      );

    actions.appendChild(
      detailButton
    );

    item.appendChild(rank);

    item.appendChild(info);

    item.appendChild(
      description
    );

    item.appendChild(
      actions
    );

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

    priorityList
      .replaceChildren();

    if (
      completedPriorityList
    ) {
      completedPriorityList
        .replaceChildren();
    }

    if (
      completedPrioritySection
    ) {
      completedPrioritySection
        .hidden = true;
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

          priorityList
            .appendChild(
              item
            );
        }
      );

    if (
      completedPriorityList &&
      completedPriorityList
        .children.length > 0
    ) {
      completedPrioritySection
        .hidden = false;
    }

    updatePriorityRanks();
  };

  const getSelectedTimeIndex =
    () => {
      if (!timeRange) {
        return 0;
      }

      const selectedIndex =
        Number(
          timeRange.value
        );

      if (
        !Number.isInteger(
          selectedIndex
        ) ||
        selectedIndex < 0 ||
        selectedIndex >=
        TIME_POINTS.length
      ) {
        return 0;
      }

      return selectedIndex;
    };

  const updateSelectedTimeText = (
    selectedIndex
  ) => {
    if (!selectedTime) {
      return;
    }

    const timePoint =
      TIME_POINTS[
      selectedIndex
      ];

    selectedTime.textContent =
      timePoint?.label ||
      "현재";
  };

  const saveSelectedTime = (
    selectedIndex
  ) => {
    const timePoint =
      TIME_POINTS[
      selectedIndex
      ];

    if (!timePoint) {
      return;
    }

    sessionStorage.setItem(
      "goldenStepSelectedMinutes",
      String(
        timePoint.minutes
      )
    );

    sessionStorage.setItem(
      "goldenStepSelectedTimePoint",
      TIME_POINT_VALUES[
      selectedIndex
      ]
    );
  };

  const getMapBounds = (
    analysis
  ) => {
    if (
      !analysis ||
      typeof naver ===
      "undefined" ||
      !naver.maps
    ) {
      return null;
    }

    const bounds =
      new naver.maps
        .LatLngBounds();

    let hasPoint = false;

    const boundaryPath =
      getBoundaryPath(
        analysis.boundaryZone
      );

    boundaryPath.forEach(
      (point) => {
        bounds.extend(point);

        hasPoint = true;
      }
    );

    analysis.areas.forEach(
      (area) => {
        if (
          area.checked ||
          !Number.isFinite(
            area.lat
          ) ||
          !Number.isFinite(
            area.lng
          )
        ) {
          return;
        }

        bounds.extend(
          getNaverLatLng(
            area.lat,
            area.lng
          )
        );

        hasPoint = true;
      }
    );

    return hasPoint
      ? bounds
      : null;
  };

  const fitResultMap = (
    selectedIndex
  ) => {
    if (!resultMap) {
      return;
    }

    const analysis =
      analysisResults[
      selectedIndex
      ];

    if (!analysis) {
      return;
    }

    const bounds =
      getMapBounds(
        analysis
      );

    if (bounds) {
      resultMap.fitBounds(
        bounds,
        {
          top: 70,
          right: 70,
          bottom: 70,
          left: 70
        }
      );

      return;
    }

    const searchLocation =
      getCurrentSearchLocation();

    resultMap.setCenter(
      getNaverLatLng(
        searchLocation.lat,
        searchLocation.lng
      )
    );

    resultMap.setZoom(
      DEFAULT_ZOOM
    );
  };

  const renderTimeResult = (
    selectedIndex
  ) => {
    const analysis =
      analysisResults[
      selectedIndex
      ];

    if (!analysis) {
      return;
    }

    lastRenderedTimeIndex =
      selectedIndex;

    if (timeRange) {
      timeRange.value =
        String(
          selectedIndex
        );
    }

    updateSelectedTimeText(
      selectedIndex
    );

    saveSelectedTime(
      selectedIndex
    );

    renderPriorityAreas(
      selectedIndex
    );

    renderPriorityList(
      selectedIndex
    );

    window.setTimeout(
      () => {
        if (!resultMap) {
          return;
        }

        naver.maps.Event.trigger(
          resultMap,
          "resize"
        );

        fitResultMap(
          selectedIndex
        );
      },
      100
    );
  };

  const restorePreviousTime = (
    selectedIndex
  ) => {
    if (!timeRange) {
      return;
    }

    timeRange.value =
      String(
        selectedIndex
      );

    updateSelectedTimeText(
      selectedIndex
    );
  };

  const updateTime = async () => {
    if (
      !timeRange ||
      isTimeResultLoading
    ) {
      return;
    }

    const selectedIndex =
      getSelectedTimeIndex();

    updateSelectedTimeText(
      selectedIndex
    );

    if (
      analysisResults[
      selectedIndex
      ]
    ) {
      renderTimeResult(
        selectedIndex
      );

      return;
    }

    const previousIndex =
      lastRenderedTimeIndex;

    setTimeResultLoading(
      true
    );

    try {
      await fetchTimeResultOnce(
        selectedIndex
      );

      renderTimeResult(
        selectedIndex
      );
    } catch (error) {
      console.error(
        "Time result API error:",
        error
      );

      restorePreviousTime(
        previousIndex
      );

      alert(
        error.message ||
        "선택한 시간대의 예측 데이터를 불러오지 못했습니다."
      );
    } finally {
      setTimeResultLoading(
        false
      );
    }
  };

  const getCurrentAnalysis =
    () => {
      return (
        analysisResults[
        lastRenderedTimeIndex
        ] ||
        null
      );
    };

  const updateLocationCheckedState = (
    placeId,
    checked,
    checkedAt = null
  ) => {
    analysisResults.forEach(
      (analysis) => {
        if (
          !analysis ||
          !Array.isArray(
            analysis.areas
          )
        ) {
          return;
        }

        analysis.areas.forEach(
          (location) => {
            if (
              Number(
                location.placeId
              ) !==
              Number(placeId)
            ) {
              return;
            }

            location.checked =
              checked;

            location.checkedAt =
              checkedAt;
          }
        );
      }
    );

    Object.values(
      locationDetails
    ).forEach(
      (location) => {
        if (
          Number(
            location.placeId
          ) !==
          Number(placeId)
        ) {
          return;
        }

        location.checked =
          checked;

        location.checkedAt =
          checkedAt;
      }
    );
  };

  const markPriorityPlaceChecked =
    async (location) => {
      if (!location?.placeId) {
        throw new Error(
          "탐색 완료 정보를 확인할 수 없습니다."
        );
      }

      const response =
        await fetch(
          window.GoldenStepApi.getApiUrl(
            `/api/search/places/${location.placeId}/check`
          ),
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

  const openCompleteModal = (
    location
  ) => {
    if (
      !completeModal ||
      !location
    ) {
      return;
    }

    pendingCompleteItem =
      location;

    if (
      completeModalLocation
    ) {
      completeModalLocation
        .textContent =
        location.name;
    }

    completeModal.hidden =
      false;

    document.body.style
      .overflow =
      "hidden";
  };

  const closeCompleteModal =
    () => {
      if (!completeModal) {
        return;
      }

      completeModal.hidden =
        true;

      pendingCompleteItem =
        null;

      if (
        detailDrawer &&
        detailDrawer
          .classList
          .contains(
            "is-open"
          )
      ) {
        document.body.style
          .overflow =
          "hidden";

        return;
      }

      document.body.style
        .overflow = "";
    };

  const handleDrawerComplete =
    () => {
      if (
        !activeDetailLocation
      ) {
        return;
      }

      openCompleteModal(
        activeDetailLocation
      );
    };

  const setCompleteModalLoading = (
    isLoading
  ) => {
    if (
      completeModalCancel
    ) {
      completeModalCancel
        .disabled =
        isLoading;
    }

    if (
      completeModalConfirm
    ) {
      completeModalConfirm
        .disabled =
        isLoading;

      completeModalConfirm
        .textContent =
        isLoading
          ? "저장 중..."
          : "완료";
    }
  };

  const handleCompleteConfirm =
    async () => {
      if (
        !pendingCompleteItem
      ) {
        return;
      }

      const location =
        pendingCompleteItem;

      setCompleteModalLoading(
        true
      );

      try {
        const responseData =
          await markPriorityPlaceChecked(
            location
          );

        const checkedAt =
          responseData?.checkedAt ||
          new Date()
            .toISOString();

        updateLocationCheckedState(
          location.placeId,
          true,
          checkedAt
        );

        closeCompleteModal();

        closeDetailDrawer();

        renderTimeResult(
          lastRenderedTimeIndex
        );

        checkAllPriorityCompleted();
      } catch (error) {
        console.error(
          "Priority place check error:",
          error
        );

        alert(
          error.message ||
          "탐색 완료 상태를 저장하지 못했습니다."
        );
      } finally {
        setCompleteModalLoading(
          false
        );
      }
    };

  const isAllPriorityCompleted =
    () => {
      const analysis =
        getCurrentAnalysis();

      if (
        !analysis ||
        !Array.isArray(
          analysis.areas
        ) ||
        analysis.areas.length ===
        0
      ) {
        return false;
      }

      return analysis.areas
        .every(
          (location) =>
            location.checked
        );
    };

  const openAllCompleteModal =
    () => {
      if (!allCompleteModal) {
        return;
      }

      allCompleteModal.hidden =
        false;

      document.body.style
        .overflow =
        "hidden";
    };

  const closeAllCompleteModal =
    () => {
      if (!allCompleteModal) {
        return;
      }

      allCompleteModal.hidden =
        true;

      document.body.style
        .overflow = "";
    };

  const checkAllPriorityCompleted =
    () => {
      if (
        isAllPriorityCompleted()
      ) {
        openAllCompleteModal();
      }
    };

  const openSearchEndConfirmModal =
    () => {
      if (
        !searchEndConfirmModal
      ) {
        return;
      }

      searchEndConfirmModal.hidden =
        false;

      document.body.style
        .overflow =
        "hidden";
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

      document.body.style
        .overflow = "";
    };

  const clearSearchSession =
    () => {
      sessionStorage.removeItem(
        "goldenStepRunId"
      );

      sessionStorage.removeItem(
        "goldenStepAnalysisStatus"
      );

      sessionStorage.removeItem(
        "goldenStepSelectedMinutes"
      );

      sessionStorage.removeItem(
        "goldenStepSelectedTimePoint"
      );

      sessionStorage.removeItem(
        "goldenStepSearchData"
      );
    };

  const moveToSearchForm =
    () => {
      clearSearchSession();

      window.location.href =
        "./search-form.html";
    };

  const handleSearchEnd =
    () => {
      openSearchEndConfirmModal();
    };

  const handleSearchEndConfirm =
    () => {
      moveToSearchForm();
    };

  const handleNewSearch =
    () => {
      moveToSearchForm();
    };

  const handleAllCompleteEnd =
    () => {
      moveToSearchForm();
    };

  const getBoardPriorityPlaces =
    () => {
      const analysis =
        getCurrentAnalysis();

      if (!analysis) {
        return [];
      }

      return analysis.areas.map(
        (location) => ({
          id: location.id,
          priorityId:
            location.priorityId,
          placeId:
            location.placeId,
          poiId:
            location.poiId,
          priorityRank:
            location.priorityRank,
          priority:
            location.priority,
          priorityLabel:
            location.priorityLabel,
          name:
            location.name,
          address:
            location.address,
          lat:
            location.lat,
          lng:
            location.lng,
          radius: 250,
          score:
            location.score,
          checked:
            location.checked,
          checkedAt:
            location.checkedAt
        })
      );
    };

  const saveBoardState =
    () => {
      const analysis =
        getCurrentAnalysis();

      if (!analysis) {
        return false;
      }

      const searchDataRaw =
        sessionStorage.getItem(
          "goldenStepSearchData"
        );

      let searchData = {};

      if (searchDataRaw) {
        try {
          searchData =
            JSON.parse(
              searchDataRaw
            ) || {};
        } catch {
          searchData = {};
        }
      }

      const selectedTime =
        TIME_POINTS[
        lastRenderedTimeIndex
        ];

      const nextSearchData = {
        ...searchData,
        selectedMinutes:
          selectedTime?.minutes ??
          0,
        timePoint:
          analysis.timePoint,
        resultId:
          analysis.resultId,
        targetAt:
          analysis.targetAt,
        boundaryZone:
          analysis.boundaryZone,
        priorityPlaces:
          getBoardPriorityPlaces()
      };

      sessionStorage.setItem(
        "goldenStepSearchData",
        JSON.stringify(
          nextSearchData
        )
      );

      sessionStorage.setItem(
        "goldenStepSelectedMinutes",
        String(
          selectedTime?.minutes ??
          0
        )
      );

      sessionStorage.setItem(
        "goldenStepSelectedTimePoint",
        analysis.timePoint
      );

      return true;
    };

  const handleSearchBoard =
    () => {
      if (!saveBoardState()) {
        alert(
          "탐색보드에 전달할 분석 결과가 없습니다."
        );

        return;
      }

      window.location.href =
        "./search-board.html";
    };

  const fetchSearchSession =
    async () => {
      const runId =
        getRunId();

      if (!runId) {
        return null;
      }

      try {
        const response =
          await fetch(
            window.GoldenStepApi.getApiUrl(
              `/api/search/analysis/${runId}`
            ),
            {
              method: "GET",
              credentials:
                "include",
              headers: {
                Accept:
                  "application/json"
              }
            }
          );

        if (!response.ok) {
          return null;
        }

        const responseData =
          await response.json();

        return responseData;
      } catch (error) {
        console.error(
          "Search session API error:",
          error
        );

        return null;
      }
    };

  const initializeCurrentResult =
    async () => {
      setTimeResultLoading(
        true
      );

      try {
        await fetchTimeResultOnce(
          0
        );

        renderTimeResult(
          0
        );
      } catch (error) {
        console.error(
          "Initial NOW result API error:",
          error
        );

        alert(
          error.message ||
          "현재 시점의 탐색 결과를 불러오지 못했습니다."
        );
      } finally {
        setTimeResultLoading(
          false
        );
      }
    };

  const handleEscapeKey = (
    event
  ) => {
    if (
      event.key !==
      "Escape"
    ) {
      return;
    }

    if (isTimeResultLoading) {
      event.preventDefault();

      event.stopPropagation();

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
      searchEndConfirmModal &&
      !searchEndConfirmModal
        .hidden
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
      detailDrawer &&
      detailDrawer
        .classList
        .contains(
          "is-open"
        )
    ) {
      closeDetailDrawer();
    }
  };

  const registerEventListeners =
    () => {
      if (timeRange) {
        timeRange
          .addEventListener(
            "change",
            updateTime
          );
      }

      if (
        searchBoardButton
      ) {
        searchBoardButton
          .addEventListener(
            "click",
            handleSearchBoard
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

      if (
        detailCloseButton
      ) {
        detailCloseButton
          .addEventListener(
            "click",
            closeDetailDrawer
          );
      }

      if (
        detailDrawerOverlay
      ) {
        detailDrawerOverlay
          .addEventListener(
            "click",
            closeDetailDrawer
          );
      }

      if (
        routeCheckButton
      ) {
        routeCheckButton
          .addEventListener(
            "click",
            handleRouteCheck
          );
      }

      if (
        drawerCompleteButton
      ) {
        drawerCompleteButton
          .addEventListener(
            "click",
            handleDrawerComplete
          );
      }

      if (
        completeModalCancel
      ) {
        completeModalCancel
          .addEventListener(
            "click",
            closeCompleteModal
          );
      }

      if (
        completeModalConfirm
      ) {
        completeModalConfirm
          .addEventListener(
            "click",
            handleCompleteConfirm
          );
      }

      if (searchEndButton) {
        searchEndButton
          .addEventListener(
            "click",
            handleSearchEnd
          );
      }

      if (
        continueSearchButton
      ) {
        continueSearchButton
          .addEventListener(
            "click",
            closeSearchEndConfirmModal
          );
      }

      if (
        confirmSearchEndButton
      ) {
        confirmSearchEndButton
          .addEventListener(
            "click",
            handleSearchEndConfirm
          );
      }

      if (
        allCompleteModalClose
      ) {
        allCompleteModalClose
          .addEventListener(
            "click",
            closeAllCompleteModal
          );
      }

      if (newSearchButton) {
        newSearchButton
          .addEventListener(
            "click",
            handleNewSearch
          );
      }

      if (
        allCompleteEndButton
      ) {
        allCompleteEndButton
          .addEventListener(
            "click",
            handleAllCompleteEnd
          );
      }

      document.addEventListener(
        "keydown",
        handleEscapeKey
      );

      document.addEventListener(
        "keydown",
        blockLoadingKeyboardInput,
        true
      );

      document.addEventListener(
        "keyup",
        blockLoadingKeyboardInput,
        true
      );

      document.addEventListener(
        "keypress",
        blockLoadingKeyboardInput,
        true
      );
    };

  const initializeSearchResult =
    async () => {
      registerEventListeners();

      updateSelectedTimeText(0);

      if (timeRange) {
        timeRange.value = "0";
      }

      sessionStorage.setItem(
        "goldenStepSelectedMinutes",
        "0"
      );

      sessionStorage.setItem(
        "goldenStepSelectedTimePoint",
        "NOW"
      );

      currentSearchSession =
        await fetchSearchSession();

      try {
        await window.naverMapsReady;
        initializeMap();
      } catch (error) {
        console.error(
          "네이버 지도 초기화 실패:",
          error
        );

        return;
      }

      await initializeCurrentResult();
    };

  initializeSearchResult();

})();