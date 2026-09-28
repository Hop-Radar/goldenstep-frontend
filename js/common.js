(() => {
  const emergencyButton = document.querySelector(".emergency-button");

  if (!emergencyButton) {
    return;
  }

  const modal = document.createElement("div");

  modal.className = "emergency-modal";
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
  <div class="emergency-modal-backdrop"></div>

  <section
    class="emergency-modal-content"
    role="dialog"
    aria-modal="true"
    aria-labelledby="emergency-modal-title"
  >
    <button
      class="emergency-modal-close"
      type="button"
      aria-label="신고 창 닫기"
    >
      ×
    </button>

    <h2 id="emergency-modal-title">
      112 긴급 신고
    </h2>

    <p class="emergency-modal-description">
      경찰에 긴급 신고가 필요한 경우 아래 버튼을 눌러주세요.
    </p>

    <a class="emergency-call-button" href="tel:112">
      <span class="emergency-call-icon">☎</span>
      <span>112 신고하기</span>
    </a>

    <button class="emergency-cancel-button" type="button">
      취소
    </button>
  </section>
`;

  document.body.appendChild(modal);

  const backdrop = modal.querySelector(".emergency-modal-backdrop");
  const closeButton = modal.querySelector(".emergency-modal-close");
  const cancelButton = modal.querySelector(".emergency-cancel-button");

  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("emergency-modal-open");
    closeButton.focus();
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("emergency-modal-open");
    emergencyButton.focus();
  };

  emergencyButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      modal.classList.contains("is-open")
    ) {
      closeModal();
    }
  });
})();