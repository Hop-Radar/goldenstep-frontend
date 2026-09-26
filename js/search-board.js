(() => {
  const resultButton =
    document.querySelector("#result-button");

  const newSearchButton =
    document.querySelector("#new-search-button");

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
})();