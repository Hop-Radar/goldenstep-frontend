(() => {
  const locationElement =
    document.querySelector(
      "#share-location"
    );

  const lastSeenTimeElement =
    document.querySelector(
      "#share-last-seen-time"
    );

  const additionalInfoSection =
    document.querySelector(
      "#share-additional-info"
    );

  const additionalInfoText =
    document.querySelector(
      "#share-additional-info-text"
    );

  const priorityList =
    document.querySelector(
      "#share-priority-list"
    );

  const shareButton =
    document.querySelector(
      "#share-button"
    );

  const backButton =
    document.querySelector(
      "#share-back-button"
    );

  const mapElement =
    document.querySelector(
      "#share-map"
    );

  const TOKEN_PATTERN =
    /^[A-Za-z0-9_-]{43}$/;

  const DEFAULT_CENTER = {
    lat: 37.5665,
    lng: 126.978
  };

  const DEFAULT_ZOOM = 15;

  let shareMap = null;
  let boundaryPolygon = null;
  let locationMarker = null;
  let priorityCircles = [];
  let shareToken = "";
  let originalShareUrl = "";
  let expirationTimer = null;

  const getTokenFromHash = () => {
    const hash =
      window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;

    if (!hash) {
      return "";
    }

    const params =
      new URLSearchParams(hash);

    return params.get("token") || "";
  };

  const getTokenFromQuery = () => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    return params.get("token") || "";
  };

  const getTokenFromHistory = () => {
    const token =
      window.history.state
        ?.goldenStepShareToken;

    return typeof token === "string"
      ? token
      : "";
  };

  const isValidToken = (token) => {
    return TOKEN_PATTERN.test(token);
  };

  const createShareUrl = (token) => {
    const url =
      new URL(
        window.location.href
      );

    url.search = "";
    url.hash = "";

    url.hash =
      `token=${token}`;

    return url.toString();
  };

  const saveTokenAndCleanUrl = (
    token
  ) => {
    const currentState =
      window.history.state || {};

    const cleanUrl =
      new URL(
        window.location.href
      );

    cleanUrl.searchParams.delete(
      "token"
    );

    cleanUrl.hash = "";

    window.history.replaceState(
      {
        ...currentState,
        goldenStepShareToken:
          token
      },
      "",
      cleanUrl.toString()
    );
  };

  const initializeShareToken = () => {
    const hashToken =
      getTokenFromHash();

    const queryToken =
      getTokenFromQuery();

    const historyToken =
      getTokenFromHistory();

    const token =
      hashToken ||
      queryToken ||
      historyToken;

    if (!isValidToken(token)) {
      return "";
    }

    originalShareUrl =
      createShareUrl(token);

    saveTokenAndCleanUrl(token);

    return token;
  };

  const formatDateTime = (
    value
  ) => {
    if (!value) {
      return "";
    }

    const normalizedValue =
      String(value).trim();

    if (!normalizedValue) {
      return "";
    }

    const match =
      normalizedValue.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/
      );

    if (!match) {
      return normalizedValue;
    }

    const [
      ,
      year,
      month,
      day,
      hour,
      minute
    ] = match;

    return `${year}.${month}.${day} ${hour}:${minute}`;
  };

  const getPriorityColor = (
    priorityRank
  ) => {
    const rank =
      Number(priorityRank);

    if (rank === 1) {
      return "#EF4444";
    }

    if (rank === 2) {
      return "#FFB000";
    }

    return "#1E90FF";
  };

  const getPriorityRadius = () => {
    return 250;
  };

  const createMarkerIcon = () => {
    return {
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
    };
  };

  const clearPriorityCircles = () => {
    priorityCircles.forEach(
      (circle) => {
        circle.setMap(null);
      }
    );

    priorityCircles = [];
  };

  const clearBoundaryPolygon = () => {
    if (!boundaryPolygon) {
      return;
    }

    boundaryPolygon.setMap(null);
    boundaryPolygon = null;
  };

  const clearLocationMarker = () => {
    if (!locationMarker) {
      return;
    }

    locationMarker.setMap(null);
    locationMarker = null;
  };

  const clearMapObjects = () => {
    clearPriorityCircles();
    clearBoundaryPolygon();
    clearLocationMarker();
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
            feature.geometry
              .coordinates
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

    const coordinates =
      feature.geometry
        .coordinates?.[0];

    if (
      !Array.isArray(
        coordinates
      )
    ) {
      return [];
    }

    return coordinates
      .map((coordinate) => {
        if (
          !Array.isArray(
            coordinate
          ) ||
          coordinate.length < 2
        ) {
          return null;
        }

        const longitude =
          Number(
            coordinate[0]
          );

        const latitude =
          Number(
            coordinate[1]
          );

        if (
          !Number.isFinite(
            latitude
          ) ||
          !Number.isFinite(
            longitude
          )
        ) {
          return null;
        }

        return new naver.maps
          .LatLng(
            latitude,
            longitude
          );
      })
      .filter(Boolean);
  };

  const createBoundaryPolygon = (
    boundaryZone
  ) => {
    if (
      !shareMap ||
      !boundaryZone
    ) {
      return;
    }

    clearBoundaryPolygon();

    const path =
      getBoundaryPath(
        boundaryZone
      );

    if (path.length < 3) {
      return;
    }

    boundaryPolygon =
      new naver.maps.Polygon({
        map: shareMap,
        paths: [path],
        strokeColor: "#2563EB",
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: "#E5E7EB",
        fillOpacity: 0.35
      });
  };

  const createPriorityCircles = (
    places
  ) => {
    if (
      !shareMap ||
      !Array.isArray(places)
    ) {
      return;
    }

    clearPriorityCircles();

    places.forEach(
      (place) => {
        if (place.checked) {
          return;
        }

        const latitude =
          Number(place.lat);

        const longitude =
          Number(place.lng);

        if (
          !Number.isFinite(
            latitude
          ) ||
          !Number.isFinite(
            longitude
          )
        ) {
          return;
        }

        const color =
          getPriorityColor(
            place.priorityRank
          );

        const circle =
          new naver.maps.Circle({
            map: shareMap,
            center:
              new naver.maps.LatLng(
                latitude,
                longitude
              ),
            radius:
              getPriorityRadius(),
            fillColor: color,
            fillOpacity: 0.22,
            strokeColor: color,
            strokeOpacity: 0.5,
            strokeWeight: 1
          });

        priorityCircles.push(
          circle
        );
      }
    );
  };

  const renderLocation = (
    data
  ) => {
    locationElement.textContent =
      data.address ||
      "위치 정보가 없습니다.";

    const formattedTime =
      formatDateTime(
        data.lastSeenTime
      );

    lastSeenTimeElement
      .textContent =
      formattedTime
        ? `마지막 확인 시각 ${formattedTime}`
        : "마지막 확인 시각 정보가 없습니다.";
  };

  const renderAdditionalInfo = (
    data
  ) => {
    const info =
      typeof data.additionalInfo ===
        "string"
        ? data.additionalInfo.trim()
        : "";

    if (!info) {
      additionalInfoSection.hidden =
        true;

      additionalInfoText
        .textContent = "";

      return;
    }

    additionalInfoText.textContent =
      info;

    additionalInfoSection.hidden =
      false;
  };

  const renderPriorityPlaces = (
    places
  ) => {
    priorityList.innerHTML = "";

    if (
      !Array.isArray(places) ||
      places.length === 0
    ) {
      const emptyState =
        document.createElement(
          "div"
        );

      emptyState.className =
        "share-empty-state";

      emptyState.textContent =
        "공유된 우선 확인 지역이 없습니다.";

      priorityList.appendChild(
        emptyState
      );

      return;
    }

    places.forEach(
      (place, index) => {
        const item =
          document.createElement(
            "div"
          );

        item.className =
          "share-priority-item";

        if (place.checked) {
          item.classList.add(
            "is-checked"
          );
        }

        const rank =
          document.createElement(
            "span"
          );

        rank.className =
          "share-priority-rank";

        rank.textContent =
          String(
            place.priorityRank ??
            index + 1
          );

        const content =
          document.createElement(
            "div"
          );

        content.className =
          "share-priority-content";

        const name =
          document.createElement(
            "strong"
          );

        name.textContent =
          place.name ||
          "장소 정보 없음";

        const address =
          document.createElement(
            "span"
          );

        address.textContent =
          place.address ||
          "주소 정보 없음";

        content.appendChild(name);
        content.appendChild(address);

        item.appendChild(rank);
        item.appendChild(content);

        if (place.checked) {
          const checked =
            document.createElement(
              "span"
            );

          checked.className =
            "share-priority-checked";

          checked.textContent =
            "확인 완료";

          item.appendChild(
            checked
          );
        }

        priorityList.appendChild(
          item
        );
      }
    );
  };

  const waitForNaverMaps = async (
    timeout = 5000
  ) => {
    if (window.naverMapsReady) {
      await window.naverMapsReady;
    }

    const startedAt = Date.now();

    while (!window.naver?.maps) {
      if (
        Date.now() - startedAt >=
        timeout
      ) {
        throw new Error(
          "Naver Maps SDK unavailable"
        );
      }

      await new Promise(
        (resolve) => {
          window.setTimeout(
            resolve,
            50
          );
        }
      );
    }
  };

  const initializeMap = async (
    data
  ) => {
    if (!mapElement) {
      return;
    }

    const latitude =
      Number(data.latitude);

    const longitude =
      Number(data.longitude);

    const center =
      Number.isFinite(latitude) &&
        Number.isFinite(longitude)
        ? {
          lat: latitude,
          lng: longitude
        }
        : DEFAULT_CENTER;

    try {
      await waitForNaverMaps();

      clearMapObjects();

      shareMap =
        new naver.maps.Map(
          mapElement,
          {
            center:
              new naver.maps.LatLng(
                center.lat,
                center.lng
              ),
            zoom: DEFAULT_ZOOM,
            zoomControl: true
          }
        );

      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
      ) {
        locationMarker =
          new naver.maps.Marker({
            position:
              new naver.maps.LatLng(
                latitude,
                longitude
              ),
            map: shareMap,
            icon:
              createMarkerIcon()
          });
      }

      createBoundaryPolygon(
        data.boundaryZone
      );

      createPriorityCircles(
        data.priorityPlaces
      );
    } catch (error) {
      console.error(
        "Share map initialization error:",
        error
      );

      mapElement.textContent =
        "지도를 불러오지 못했습니다. 우선 확인 지역 목록은 아래에서 확인할 수 있습니다.";
    }
  };

  const copyText = async (
    text
  ) => {
    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard
        .writeText(text);

      return;
    }

    const textArea =
      document.createElement(
        "textarea"
      );

    textArea.value = text;

    textArea.setAttribute(
      "readonly",
      ""
    );

    textArea.style.position =
      "fixed";

    textArea.style.left =
      "-9999px";

    textArea.style.opacity =
      "0";

    document.body.appendChild(
      textArea
    );

    textArea.select();

    const copied =
      document.execCommand(
        "copy"
      );

    textArea.remove();

    if (!copied) {
      throw new Error(
        "Clipboard copy failed"
      );
    }
  };

  const showShareToast = (
    message,
    isError = false
  ) => {
    const previousToast =
      document.querySelector(
        ".share-copy-toast"
      );

    if (previousToast) {
      previousToast.remove();
    }

    const toast =
      document.createElement(
        "div"
      );

    toast.className =
      "share-copy-toast";

    toast.setAttribute(
      "role",
      "status"
    );

    toast.setAttribute(
      "aria-live",
      "polite"
    );

    const icon =
      document.createElement(
        "span"
      );

    icon.textContent =
      isError ? "!" : "✓";

    const text =
      document.createElement(
        "span"
      );

    text.textContent =
      message;

    toast.appendChild(icon);
    toast.appendChild(text);

    Object.assign(
      toast.style,
      {
        position: "fixed",
        left: "50%",
        bottom: "40px",
        zIndex: "99999",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 18px",
        borderRadius: "10px",
        backgroundColor:
          isError
            ? "#7f1d1d"
            : "#0f172a",
        color: "#ffffff",
        fontFamily:
          '"Pretendard", sans-serif',
        fontSize: "14px",
        fontWeight: "600",
        lineHeight: "1.4",
        whiteSpace: "nowrap",
        boxShadow:
          "0 8px 24px rgb(15 23 42 / 24%)",
        transform:
          "translateX(-50%)"
      }
    );

    document.body.appendChild(
      toast
    );

    window.setTimeout(
      () => {
        toast.remove();
      },
      2400
    );
  };

  const hideSnapshotContent = () => {
    clearMapObjects();

    const locationCard =
      document.querySelector(
        ".last-location-card"
      );

    const mapSection =
      document.querySelector(
        ".share-map-section"
      );

    const prioritySection =
      document.querySelector(
        ".share-priority-section"
      );

    if (locationCard) {
      locationCard.hidden = true;
    }

    additionalInfoSection.hidden =
      true;

    if (mapSection) {
      mapSection.hidden = true;
    }

    if (prioritySection) {
      prioritySection.hidden =
        true;
    }

    if (shareButton) {
      shareButton.hidden = true;
    }
  };

  const showUnavailable = (
    message
  ) => {
    hideSnapshotContent();

    const heading =
      document.querySelector(
        ".share-heading h1"
      );

    const description =
      document.querySelector(
        ".share-heading p"
      );

    if (heading) {
      heading.textContent =
        "공유 정보를 확인할 수 없습니다.";
    }

    if (description) {
      description.textContent =
        message;
    }
  };

  const showSnapshotContent = () => {
    const locationCard =
      document.querySelector(
        ".last-location-card"
      );

    const mapSection =
      document.querySelector(
        ".share-map-section"
      );

    const prioritySection =
      document.querySelector(
        ".share-priority-section"
      );

    if (locationCard) {
      locationCard.hidden = false;
    }

    if (mapSection) {
      mapSection.hidden = false;
    }

    if (prioritySection) {
      prioritySection.hidden =
        false;
    }

    if (shareButton) {
      shareButton.hidden = false;
    }
  };

  const updateExpirationText = (
    expiresAt
  ) => {
    const expirationElement =
      document.querySelector(
        ".share-expiration"
      );

    if (!expirationElement) {
      return;
    }

    const formatted =
      formatDateTime(
        expiresAt
      );

    expirationElement.textContent =
      formatted
        ? `이 공유 링크는 ${formatted}까지 확인할 수 있습니다.`
        : "공유된 탐색 정보는 생성 후 12시간 동안 확인할 수 있습니다.";
  };

  const getLocalTimestamp = (
    value
  ) => {
    if (!value) {
      return NaN;
    }

    const match =
      String(value).match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/
      );

    if (!match) {
      return NaN;
    }

    const [
      ,
      year,
      month,
      day,
      hour,
      minute,
      second = "0",
      fraction = "0"
    ] = match;

    const milliseconds =
      Number(
        `0.${fraction}`
      ) * 1000;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      milliseconds
    ).getTime();
  };

  const startExpirationTimer = (
    expiresAt
  ) => {
    if (expirationTimer) {
      window.clearTimeout(
        expirationTimer
      );
    }

    const expiresTime =
      getLocalTimestamp(
        expiresAt
      );

    if (
      !Number.isFinite(
        expiresTime
      )
    ) {
      return;
    }

    const remaining =
      expiresTime - Date.now();

    if (remaining <= 0) {
      showUnavailable(
        "만료된 공유 링크입니다."
      );

      return;
    }

    expirationTimer =
      window.setTimeout(
        () => {
          showUnavailable(
            "만료된 공유 링크입니다."
          );
        },
        remaining
      );
  };

  const renderSnapshot = async (
    data
  ) => {
    showSnapshotContent();

    renderLocation(data);

    renderAdditionalInfo(data);

    renderPriorityPlaces(
      data.priorityPlaces
    );

    updateExpirationText(
      data.expiresAt
    );

    startExpirationTimer(
      data.expiresAt
    );

    await initializeMap(data);
  };

  const loadSnapshot = async () => {
    shareToken =
      initializeShareToken();

    updateBackButtonVisibility();

    if (!shareToken) {
      showUnavailable(
        "유효하지 않은 공유 링크입니다."
      );

      return;
    }

    try {
      const response =
        await fetch(
          window.GoldenStepApi
            .getApiUrl(
              `/api/snapshots/${encodeURIComponent(
                shareToken
              )}`
            ),
          {
            method: "GET",
            credentials: "omit",
            cache: "no-store",
            referrerPolicy:
              "no-referrer"
          }
        );

      if (response.status === 404) {
        showUnavailable(
          "존재하지 않는 공유 링크입니다."
        );

        return;
      }

      if (response.status === 410) {
        showUnavailable(
          "만료되었거나 더 이상 사용할 수 없는 공유 링크입니다."
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          `Snapshot request failed: ${response.status}`
        );
      }

      const data =
        await response.json();

      await renderSnapshot(
        data
      );
    } catch (error) {
      console.error(
        "Share snapshot load error:",
        error
      );

      showUnavailable(
        "공유 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
      );
    }
  };

  const handleShareClick =
    async () => {
      if (!originalShareUrl) {
        return;
      }

      try {
        if (
          navigator.share &&
          window.isSecureContext
        ) {
          await navigator.share({
            title:
              "Golden Step 탐색 정보",
            text:
              "Golden Step 공유 탐색 정보입니다.",
            url:
              originalShareUrl
          });

          return;
        }

        await copyText(
          originalShareUrl
        );

        showShareToast(
          "공유 링크가 복사되었습니다."
        );
      } catch (error) {
        if (
          error?.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "Share error:",
          error
        );

        showShareToast(
          "공유에 실패했습니다.",
          true
        );
      }
    };

  const updateBackButtonVisibility = () => {
    if (!backButton) {
      return;
    }

    const ownedShareToken =
      sessionStorage.getItem(
        "goldenStepOwnedShareToken"
      );

    backButton.hidden =
      !shareToken ||
      ownedShareToken !== shareToken;
  };

  const handleBackClick = () => {
    window.location.href =
      "./search-board.html";
  };

  if (shareButton) {
    shareButton.addEventListener(
      "click",
      handleShareClick
    );
  }

  if (backButton) {
    backButton.addEventListener(
      "click",
      handleBackClick
    );
  }

  loadSnapshot();
})();