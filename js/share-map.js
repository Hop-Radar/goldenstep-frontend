(() => {
  const mapElement =
    document.querySelector("#share-map");

  const locationElement =
    document.querySelector("#share-location");

  const lastSeenTimeElement =
    document.querySelector("#share-last-seen-time");

  const priorityList =
    document.querySelector("#share-priority-list");

  const shareButton =
    document.querySelector("#share-button");

  const additionalInfoSection =
    document.querySelector("#share-additional-info");

  const additionalInfoText =
    document.querySelector("#share-additional-info-text");

  const shareBackButton =
    document.querySelector("#share-back-button");

  const hasActiveSearch =
    sessionStorage.getItem(
      "goldenStepSearchData"
    );

  if (
    shareBackButton &&
    !hasActiveSearch
  ) {
    shareBackButton.hidden = true;
  }

  const DEFAULT_LOCATION = {
    latitude: 37.5665,
    longitude: 126.9780
  };

  const decodeShareData = (encodedData) => {
    if (!encodedData) {
      return null;
    }

    try {
      let base64 = encodedData
        .replaceAll("-", "+")
        .replaceAll("_", "/");

      while (base64.length % 4 !== 0) {
        base64 += "=";
      }

      const binary =
        atob(base64);

      const bytes =
        Uint8Array.from(
          binary,
          (character) =>
            character.charCodeAt(0)
        );

      const json =
        new TextDecoder().decode(
          bytes
        );

      const parsedData =
        JSON.parse(json);

      if (
        !parsedData ||
        typeof parsedData !== "object" ||
        Array.isArray(parsedData)
      ) {
        return null;
      }

      return parsedData;
    } catch (error) {
      console.error(
        "Share data decode error:",
        error
      );

      return null;
    }
  };

  const getUrlShareData = () => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const encodedData =
      params.get("data");

    return decodeShareData(
      encodedData
    );
  };

  const getSessionSearchData = () => {
    const storageKeys = [
      "goldenStepSearchData",
      "searchData",
      "searchFormData"
    ];

    for (const key of storageKeys) {
      const storedValue =
        sessionStorage.getItem(key);

      if (!storedValue) {
        continue;
      }

      try {
        const parsedValue =
          JSON.parse(storedValue);

        if (
          parsedValue &&
          typeof parsedValue ===
          "object"
        ) {
          return parsedValue;
        }
      } catch {
        continue;
      }
    }

    return {};
  };

  const getSearchData = () => {
    const urlData =
      getUrlShareData();

    if (urlData) {
      return urlData;
    }

    return getSessionSearchData();
  };

  const getCompletedPriorityIds = () => {
    const searchData =
      getSearchData();

    if (
      Array.isArray(
        searchData.completedPriorityIds
      )
    ) {
      return searchData.completedPriorityIds;
    }

    const storedValue =
      sessionStorage.getItem(
        "goldenStepCompletedPriorities"
      );

    if (!storedValue) {
      return [];
    }

    try {
      const parsedValue =
        JSON.parse(storedValue);

      return Array.isArray(parsedValue)
        ? parsedValue
        : [];
    } catch {
      return [];
    }
  };

  const getLocation = () => {
    const searchData =
      getSearchData();

    const latitude =
      Number(
        searchData.latitude ??
        searchData.lat ??
        searchData.lastLocationLat
      );

    const longitude =
      Number(
        searchData.longitude ??
        searchData.lng ??
        searchData.lastLocationLng
      );

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      return {
        latitude,
        longitude
      };
    }

    return DEFAULT_LOCATION;
  };

  const getLocationText = (
    searchData
  ) => {
    return (
      searchData.address ??
      searchData.location ??
      searchData.locationName ??
      searchData.lastLocationAddress ??
      "위치 정보가 없습니다."
    );
  };

  const formatLastSeenTime = (
    value
  ) => {
    if (!value) {
      return null;
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        date.getDate()
      ).padStart(2, "0");

    const hours =
      String(
        date.getHours()
      ).padStart(2, "0");

    const minutes =
      String(
        date.getMinutes()
      ).padStart(2, "0");

    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  const renderSearchInfo = () => {
    const searchData =
      getSearchData();

    if (locationElement) {
      locationElement.textContent =
        getLocationText(
          searchData
        );
    }

    if (lastSeenTimeElement) {
      const lastSeenTime =
        searchData.lastSeenTime ??
        searchData.missingTime ??
        searchData.time;

      const formattedTime =
        formatLastSeenTime(
          lastSeenTime
        );

      lastSeenTimeElement.textContent =
        formattedTime
          ? `마지막 확인 시각 ${formattedTime}`
          : "마지막 확인 시각 정보가 없습니다.";
    }

    const additionalInfo =
      typeof searchData.additionalInfo === "string"
        ? searchData.additionalInfo.trim()
        : "";

    if (
      additionalInfoSection &&
      additionalInfoText
    ) {
      if (additionalInfo) {
        additionalInfoText.textContent =
          additionalInfo;

        additionalInfoSection.hidden =
          false;
      } else {
        additionalInfoText.textContent =
          "";

        additionalInfoSection.hidden =
          true;
      }
    }
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
      anchor: new naver.maps.Point(20, 42)
    };
  };

  const createPriorityCircles = (
    map,
    latitude,
    longitude
  ) => {
    const completedPriorityIds =
      getCompletedPriorityIds();

    const priorityAreas = [
      {
        priorityId: "priority-1",
        latOffset: 0.0022,
        lngOffset: -0.0018,
        radius: 150,
        color: "#EF4444"
      },
      {
        priorityId: "priority-2",
        latOffset: -0.0016,
        lngOffset: 0.0024,
        radius: 130,
        color: "#FFB000"
      },
      {
        priorityId: "priority-3",
        latOffset: 0.0011,
        lngOffset: 0.0031,
        radius: 120,
        color: "#1E90FF"
      }
    ];

    priorityAreas.forEach(
      (area) => {
        if (
          completedPriorityIds.includes(
            area.priorityId
          )
        ) {
          return;
        }

        new naver.maps.Circle({
          map,
          center:
            new naver.maps.LatLng(
              latitude +
              area.latOffset,
              longitude +
              area.lngOffset
            ),
          radius: area.radius,
          fillColor: area.color,
          fillOpacity: 0.22,
          strokeColor: area.color,
          strokeOpacity: 0.5,
          strokeWeight: 1
        });
      }
    );
  };

  const initializeMap = () => {
    if (
      !mapElement ||
      typeof naver === "undefined" ||
      !naver.maps
    ) {
      return;
    }

    const location =
      getLocation();

    const center =
      new naver.maps.LatLng(
        location.latitude,
        location.longitude
      );

    const map =
      new naver.maps.Map(
        mapElement,
        {
          center,
          zoom: 16,
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

    new naver.maps.Marker({
      position: center,
      map,
      icon:
        createMarkerIcon(),
      title:
        "마지막 확인 위치"
    });

    createPriorityCircles(
      map,
      location.latitude,
      location.longitude
    );

    window.setTimeout(() => {
      naver.maps.Event.trigger(
        map,
        "resize"
      );

      map.setCenter(center);
    }, 100);
  };

  const getPriorityData = () => {
    const searchData =
      getSearchData();

    const candidates = [
      searchData.priorityLocations,
      searchData.priorityAreas,
      searchData.priorities,
      searchData.analysisResults
    ];

    for (
      let index = 0;
      index < candidates.length;
      index += 1
    ) {
      if (
        Array.isArray(
          candidates[index]
        ) &&
        candidates[index].length > 0
      ) {
        return candidates[index];
      }
    }

    return [];
  };

  const renderPriorityLocations = () => {
    if (!priorityList) {
      return;
    }

    const priorities =
      getPriorityData();

    if (
      priorities.length === 0
    ) {
      priorityList.innerHTML = `
        <div class="share-empty-state">
          우선 확인 지역 분석 결과가 아직 없습니다.
        </div>
      `;

      return;
    }

    priorityList.innerHTML = "";

    priorities.forEach(
      (priority, index) => {
        const item =
          document.createElement(
            "div"
          );

        item.className =
          "share-priority-item";

        const rank =
          document.createElement(
            "span"
          );

        rank.className =
          "share-priority-rank";

        rank.textContent =
          String(index + 1);

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
          priority.name ??
          priority.locationName ??
          priority.placeName ??
          `우선 확인 지역 ${index + 1}`;

        content.appendChild(name);

        const address =
          priority.address ??
          priority.location ??
          "";

        if (address) {
          const addressElement =
            document.createElement(
              "span"
            );

          addressElement.textContent =
            address;

          content.appendChild(
            addressElement
          );
        }

        item.appendChild(rank);
        item.appendChild(content);

        priorityList.appendChild(
          item
        );
      }
    );
  };

  const copyText = async (
    text
  ) => {
    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(
        text
      );

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
    message
  ) => {
    const previousToast =
      document.querySelector(
        ".share-page-toast"
      );

    if (previousToast) {
      previousToast.remove();
    }

    const toast =
      document.createElement(
        "div"
      );

    toast.className =
      "share-page-toast";

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

    icon.textContent = "✓";

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
          "#0f172a",
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
          "translateX(-50%)",
        opacity: "0",
        transition:
          "opacity 160ms ease, bottom 160ms ease"
      }
    );

    document.body.appendChild(
      toast
    );

    requestAnimationFrame(() => {
      toast.style.opacity =
        "1";

      toast.style.bottom =
        "48px";
    });

    window.setTimeout(() => {
      toast.style.opacity =
        "0";

      toast.style.bottom =
        "40px";

      window.setTimeout(() => {
        toast.remove();
      }, 180);
    }, 1800);
  };

  const handleShareClick = async () => {
    const currentUrl =
      window.location.href;

    const shareData = {
      title:
        "Golden Step 탐색 정보",
      text:
        "현재 탐색 정보를 공유합니다.",
      url:
        currentUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(
          shareData
        );

        return;
      } catch (error) {
        if (
          error &&
          error.name ===
          "AbortError"
        ) {
          return;
        }
      }
    }

    try {
      await copyText(
        currentUrl
      );

      showShareToast(
        "공유 링크가 복사되었습니다."
      );
    } catch (error) {
      console.error(
        "Share link copy error:",
        error
      );

      alert(
        "공유 링크를 복사하지 못했습니다."
      );
    }
  };

  if (shareButton) {
    shareButton.addEventListener(
      "click",
      handleShareClick
    );
  }

  if (shareBackButton) {
    shareBackButton.addEventListener(
      "click",
      () => {
        window.location.href =
          "./search-result.html";
      }
    );
  }

  renderSearchInfo();
  renderPriorityLocations();
  initializeMap();
})();