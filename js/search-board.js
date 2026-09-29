(() => {
  const boardMapElement = document.querySelector("#board-map");
  const resultButton = document.querySelector("#result-button");
  const newSearchButton = document.querySelector("#new-search-button");
  const elapsedTimeElement = document.querySelector("#elapsed-time");
  const shareMapButton = document.querySelector("#share-map-button");

  let boardMap = null;
  let locationMarker = null;
  let isSharing = false;

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
      } catch {
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

  const encodeShareData = (data) => {
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);

    let binary = "";

    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary)
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");
  };

  const createShareUrl = () => {
    const searchData = getStoredSearchData();
    const storedCoordinate = getStoredCoordinate();

    const shareData = {
      ...searchData
    };

    if (storedCoordinate) {
      shareData.latitude =
        storedCoordinate.latitude;

      shareData.longitude =
        storedCoordinate.longitude;
    }

    const encodedData =
      encodeShareData(shareData);

    const shareUrl = new URL(
      "./share-map.html",
      window.location.href
    );

    shareUrl.searchParams.set(
      "data",
      encodedData
    );

    return shareUrl.toString();
  };

  const copyText = async (text) => {
    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea =
      document.createElement("textarea");

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
      document.execCommand("copy");

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
      document.createElement("div");

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
      document.createElement("span");

    icon.textContent =
      isError ? "!" : "✓";

    const text =
      document.createElement("span");

    text.textContent = message;

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
        backgroundColor: isError
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
      toast.style.opacity = "1";
      toast.style.bottom = "48px";
    });

    return toast;
  };

  const handleShareMapClick = async () => {
    if (isSharing) {
      return;
    }

    isSharing = true;

    const shareUrl =
      createShareUrl();

    try {
      await copyText(shareUrl);

      showShareToast(
        "공유 링크가 복사되었습니다."
      );

      window.setTimeout(() => {
        window.location.href =
          shareUrl;
      }, 900);
    } catch (error) {
      console.error(
        "Share link copy error:",
        error
      );

      showShareToast(
        "링크 복사에 실패했습니다. 공유 화면으로 이동합니다.",
        true
      );

      window.setTimeout(() => {
        window.location.href =
          shareUrl;
      }, 1200);
    }
  };

  if (shareMapButton) {
    shareMapButton.addEventListener(
      "click",
      handleShareMapClick
    );
  }

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

    const storedCoordinate =
      getStoredCoordinate();

    const defaultLatitude =
      37.5665;

    const defaultLongitude =
      126.9780;

    const latitude =
      storedCoordinate
        ? storedCoordinate.latitude
        : defaultLatitude;

    const longitude =
      storedCoordinate
        ? storedCoordinate.longitude
        : defaultLongitude;

    const centerPosition =
      new naver.maps.LatLng(
        latitude,
        longitude
      );

    boardMap =
      new naver.maps.Map(
        boardMapElement,
        {
          center: centerPosition,
          zoom: storedCoordinate
            ? 17
            : 14,
          minZoom: 7,
          maxZoom: 21,
          zoomControl: true,
          zoomControlOptions: {
            position:
              naver.maps.Position.TOP_RIGHT
          },
          mapTypeControl: false,
          scaleControl: true,
          logoControl: true,
          mapDataControl: false
        }
      );

    if (storedCoordinate) {
      locationMarker =
        new naver.maps.Marker({
          position:
            centerPosition,
          map: boardMap,
          icon:
            createMarkerIcon(),
          title:
            "마지막 확인 위치"
        });
    }

    window.setTimeout(() => {
      naver.maps.Event.trigger(
        boardMap,
        "resize"
      );

      boardMap.setCenter(
        centerPosition
      );
    }, 100);
  };

  const calculateElapsedTime = () => {
    if (!elapsedTimeElement) {
      return;
    }

    const searchData =
      getStoredSearchData();

    const lastSeenTime =
      searchData.lastSeenTime ??
      sessionStorage.getItem(
        "lastSeenTime"
      );

    if (!lastSeenTime) {
      elapsedTimeElement.textContent =
        "-";
      return;
    }

    const lastSeenDate =
      new Date(lastSeenTime);

    const currentDate =
      new Date();

    if (
      Number.isNaN(
        lastSeenDate.getTime()
      )
    ) {
      elapsedTimeElement.textContent =
        "-";
      return;
    }

    const elapsedMilliseconds =
      currentDate.getTime() -
      lastSeenDate.getTime();

    if (
      elapsedMilliseconds < 0
    ) {
      elapsedTimeElement.textContent =
        "-";
      return;
    }

    const elapsedMinutes =
      Math.floor(
        elapsedMilliseconds / 60000
      );

    const elapsedHours =
      Math.floor(
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