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

  const DEFAULT_LOCATION = {
    latitude: 37.5665,
    longitude: 126.9780
  };

  const getStoredSearchData = () => {
    try {
      const storedData =
        sessionStorage.getItem(
          "goldenStepSearchData"
        );

      if (!storedData) {
        return {};
      }

      return JSON.parse(storedData);
    } catch {
      return {};
    }
  };

  const getLocation = () => {
    const searchData =
      getStoredSearchData();

    const latitude =
      Number(searchData.latitude);

    const longitude =
      Number(searchData.longitude);

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      return {
        latitude,
        longitude
      };
    }

    return DEFAULT_LOCATION;
  };

  const renderSearchInfo = () => {
    const searchData =
      getStoredSearchData();

    if (locationElement) {
      locationElement.textContent =
        searchData.address ||
        searchData.location ||
        "위치 정보가 없습니다.";
    }

    if (lastSeenTimeElement) {
      const lastSeenTime =
        searchData.lastSeenTime;

      lastSeenTimeElement.textContent =
        lastSeenTime
          ? `마지막 확인 시각 ${lastSeenTime}`
          : "마지막 확인 시각 정보가 없습니다.";
    }
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
      title: "마지막 확인 위치"
    });
  };

  const renderPriorityLocations = () => {
    if (!priorityList) {
      return;
    }

    priorityList.innerHTML = `
      <div class="share-empty-state">
        우선 확인 지역 분석 결과가 아직 없습니다.
      </div>
    `;
  };

  const handleShareClick = async () => {
    const shareData = {
      title: "Golden Step 탐색 정보",
      text: "현재 탐색 정보를 공유합니다.",
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(
          shareData
        );
      } catch {
        return;
      }

      return;
    }

    try {
      await navigator.clipboard.writeText(
        window.location.href
      );

      alert(
        "공유 링크가 복사되었습니다."
      );
    } catch {
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

  renderSearchInfo();
  renderPriorityLocations();
  initializeMap();
})();