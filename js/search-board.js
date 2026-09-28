(() => {
  const boardMapElement = document.querySelector("#board-map");
  const resultButton = document.querySelector("#result-button");
  const newSearchButton = document.querySelector("#new-search-button");
  const elapsedTimeElement = document.querySelector("#elapsed-time");
  const shareMapButton = document.querySelector("#share-map-button");

  let boardMap = null;
  let locationMarker = null;

  const handleShareMapClick = () => {
    window.location.href =
      "./share-map.html";
  };

  if (shareMapButton) {
    shareMapButton.addEventListener(
      "click",
      handleShareMapClick
    );
  }

  const getStoredSearchData = () => {
    const storageKeys = [
      "goldenStepSearchData",
      "searchData",
      "searchFormData"
    ];

    for (const key of storageKeys) {
      const storedValue = sessionStorage.getItem(key);

      if (!storedValue) {
        continue;
      }

      try {
        const parsedValue = JSON.parse(storedValue);

        if (parsedValue) {
          return parsedValue;
        }
      } catch (error) {
        continue;
      }
    }

    return {};
  };

  const getStoredCoordinate = () => {
    const searchData = getStoredSearchData();

    const latitude = Number(
      searchData.latitude ??
      searchData.lat ??
      searchData.lastLocationLat ??
      sessionStorage.getItem("latitude") ??
      sessionStorage.getItem("lastLocationLat")
    );

    const longitude = Number(
      searchData.longitude ??
      searchData.lng ??
      searchData.lastLocationLng ??
      sessionStorage.getItem("longitude") ??
      sessionStorage.getItem("lastLocationLng")
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

    return null;
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

  const initializeBoardMap = () => {
    if (!boardMapElement) {
      return;
    }

    if (
      typeof naver === "undefined" ||
      !naver.maps
    ) {
      return;
    }

    const storedCoordinate = getStoredCoordinate();

    const defaultLatitude = 37.5665;
    const defaultLongitude = 126.9780;

    const latitude = storedCoordinate
      ? storedCoordinate.latitude
      : defaultLatitude;

    const longitude = storedCoordinate
      ? storedCoordinate.longitude
      : defaultLongitude;

    const centerPosition = new naver.maps.LatLng(
      latitude,
      longitude
    );

    boardMap = new naver.maps.Map(
      boardMapElement,
      {
        center: centerPosition,
        zoom: storedCoordinate ? 17 : 14,
        minZoom: 7,
        maxZoom: 21,
        zoomControl: true,
        zoomControlOptions: {
          position: naver.maps.Position.TOP_RIGHT
        },
        mapTypeControl: false,
        scaleControl: true,
        logoControl: true,
        mapDataControl: false
      }
    );

    if (storedCoordinate) {
      locationMarker = new naver.maps.Marker({
        position: centerPosition,
        map: boardMap,
        icon: createMarkerIcon(),
        title: "마지막 확인 위치"
      });
    }

    window.setTimeout(() => {
      naver.maps.Event.trigger(
        boardMap,
        "resize"
      );

      boardMap.setCenter(centerPosition);
    }, 100);
  };

  const calculateElapsedTime = () => {
    if (!elapsedTimeElement) {
      return;
    }

    const searchData = getStoredSearchData();

    const lastSeenTime =
      searchData.lastSeenTime ??
      sessionStorage.getItem("lastSeenTime");

    if (!lastSeenTime) {
      elapsedTimeElement.textContent = "-";
      return;
    }

    const lastSeenDate = new Date(lastSeenTime);
    const currentDate = new Date();

    if (Number.isNaN(lastSeenDate.getTime())) {
      elapsedTimeElement.textContent = "-";
      return;
    }

    const elapsedMilliseconds =
      currentDate.getTime() - lastSeenDate.getTime();

    if (elapsedMilliseconds < 0) {
      elapsedTimeElement.textContent = "-";
      return;
    }

    const elapsedMinutes = Math.floor(
      elapsedMilliseconds / 60000
    );

    const elapsedHours = Math.floor(
      elapsedMinutes / 60
    );

    const remainingMinutes =
      elapsedMinutes % 60;

    if (elapsedHours === 0) {
      elapsedTimeElement.textContent =
        `${remainingMinutes}분`;
      return;
    }

    elapsedTimeElement.textContent =
      `${elapsedHours}시간 ${remainingMinutes}분`;
  };

  const handleResultClick = () => {
    window.location.href =
      "./search-result.html";
  };

  const handleNewSearchClick = () => {
    window.location.href =
      "./search-form.html";
  };

  if (resultButton) {
    resultButton.addEventListener(
      "click",
      handleResultClick
    );
  }

  if (newSearchButton) {
    newSearchButton.addEventListener(
      "click",
      handleNewSearchClick
    );
  }

  initializeBoardMap();
  calculateElapsedTime();
})();