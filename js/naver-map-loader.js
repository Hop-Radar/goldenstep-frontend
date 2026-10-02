(function () {
  const clientId = window.ENV?.NAVER_MAP_CLIENT_ID;

  window.naverMapsReady = new Promise((resolve, reject) => {
    if (!clientId) {
      reject(new Error("NAVER_MAP_CLIENT_ID가 설정되지 않았습니다."));
      return;
    }

    if (window.naver?.maps) {
      resolve(window.naver);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}&submodules=geocoder`;

    script.onload = () => {
      resolve(window.naver);
    };

    script.onerror = () => {
      reject(new Error("NAVER Maps API를 불러오지 못했습니다."));
    };

    document.head.appendChild(script);
  });
})();