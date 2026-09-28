(() => {
  const searchStartButton =
    document.querySelector("#search-start-button");

  const safetyModal =
    document.querySelector("#safety-modal");

  const safetyConfirmButton =
    document.querySelector("#safety-confirm-button");

  if (
    !searchStartButton ||
    !safetyModal ||
    !safetyConfirmButton
  ) {
    return;
  }

  const openSafetyModal = () => {
    safetyModal.classList.add("is-open");
    safetyModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("safety-modal-open");

    safetyConfirmButton.focus();
  };

  const handleSafetyConfirm = () => {
    window.location.href =
      "./search-form.html";
  };

  searchStartButton.addEventListener(
    "click",
    openSafetyModal
  );

  safetyConfirmButton.addEventListener(
    "click",
    handleSafetyConfirm
  );
})();