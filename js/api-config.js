(() => {
  const overrideBaseUrl =
    typeof window.GOLDENSTEP_API_BASE_URL === "string"
      ? window.GOLDENSTEP_API_BASE_URL.trim()
      : "";

  const isLocalStaticServer =
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1") &&
    window.location.port === "5500";

  let apiBaseUrl = "";

  if (overrideBaseUrl) {
    apiBaseUrl = overrideBaseUrl.replace(/\/+$/, "");
  } else if (isLocalStaticServer) {
    apiBaseUrl =
      `${window.location.protocol}//${window.location.hostname}:8080`;
  }

  const getApiUrl = (path) => {
    const normalizedPath =
      path.startsWith("/") ? path : `/${path}`;

    if (apiBaseUrl) {
      return `${apiBaseUrl}${normalizedPath}`;
    }

    return normalizedPath;
  };

  window.GoldenStepApi = Object.freeze({
    baseUrl: apiBaseUrl,
    getApiUrl
  });
})();