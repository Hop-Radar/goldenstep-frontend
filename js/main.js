(() => {
  const searchStartButton =
    document.querySelector("#search-start-button");

  const safetyModal =
    document.querySelector("#safety-modal");

  const safetyConfirmButton =
    document.querySelector("#safety-confirm-button");

  const safetyModalClose =
    document.querySelector("#safety-modal-close");

  const safetyModalBackdrop =
    safetyModal?.querySelector(".safety-modal-backdrop");

  if (
    !searchStartButton ||
    !safetyModal ||
    !safetyConfirmButton ||
    !safetyModalClose ||
    !safetyModalBackdrop
  ) {
    return;
  }

  const openSafetyModal = () => {
    safetyModal.classList.add("is-open");
    safetyModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("safety-modal-open");

    safetyConfirmButton.focus();
  };

  const closeSafetyModal = () => {
    safetyModal.classList.remove("is-open");
    safetyModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("safety-modal-open");

    searchStartButton.focus();
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

  safetyModalClose.addEventListener(
    "click",
    closeSafetyModal
  );

  safetyModalBackdrop.addEventListener(
    "click",
    closeSafetyModal
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        safetyModal.classList.contains("is-open")
      ) {
        closeSafetyModal();
      }
    }
  );
})();