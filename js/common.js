(() => {
  const emergencyButton =
    document.querySelector(
      ".emergency-button"
    );

  if (!emergencyButton) {
    return;
  }

  const modal =
    document.createElement("div");

  modal.className =
    "emergency-modal";

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

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

      <div
        class="emergency-modal-icon"
        aria-hidden="true"
      >
        112
      </div>

      <h2 id="emergency-modal-title">
        긴급 신고 안내
      </h2>

      <p class="emergency-modal-description">
        실종이 의심되거나 긴급한 상황이라면
        지체하지 말고 경찰에 신고해주세요.
      </p>

      <a
        class="emergency-call-button"
        href="tel:112"
      >
        <span
          class="emergency-call-icon"
          aria-hidden="true"
        >
          ☎
        </span>

        <span>
          112 신고하기
        </span>
      </a>

      <div class="emergency-divider">
        <span>또는</span>
      </div>

      <div class="emergency-web-guide">
        <strong>
          실종 관련 신고가 필요하신가요?
        </strong>

        <p class="emergency-report-number">
          <strong>실종아동등 신고</strong>
          <span>국번 없이 182</span>
        </p>

        <p>
          온라인 신고 및 실종 관련 정보는
          경찰청 안전Dream에서 확인할 수 있습니다.
        </p>
      </div>

      <a
        class="emergency-safedream-button"
        href="https://www.safe182.go.kr/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>
          경찰청 안전Dream 바로가기
        </span>

        <span
          class="emergency-external-icon"
          aria-hidden="true"
        >
          ↗
        </span>
      </a>

      <div class="emergency-service-notice">
        <strong>Golden Step은 신고 기관이 아닙니다.</strong>
          <p>
            신고를 직접 접수하지 않으며,
            수색을 위한 참고 정보를 제공합니다.
          </p>
      </div>

      <button
        class="emergency-cancel-button"
        type="button"
      >
        취소
      </button>
    </section>
  `;

  document.body.appendChild(
    modal
  );

  const backdrop =
    modal.querySelector(
      ".emergency-modal-backdrop"
    );

  const closeButton =
    modal.querySelector(
      ".emergency-modal-close"
    );

  const cancelButton =
    modal.querySelector(
      ".emergency-cancel-button"
    );

  const openModal = () => {
    modal.classList.add(
      "is-open"
    );

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "emergency-modal-open"
    );

    closeButton.focus();
  };

  const closeModal = () => {
    modal.classList.remove(
      "is-open"
    );

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "emergency-modal-open"
    );

    emergencyButton.focus();
  };

  emergencyButton.addEventListener(
    "click",
    openModal
  );

  closeButton.addEventListener(
    "click",
    closeModal
  );

  cancelButton.addEventListener(
    "click",
    closeModal
  );

  backdrop.addEventListener(
    "click",
    closeModal
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        modal.classList.contains(
          "is-open"
        )
      ) {
        closeModal();
      }
    }
  );
})();