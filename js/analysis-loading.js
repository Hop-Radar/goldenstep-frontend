const progressBar = document.querySelector("#progress-bar");
const progressValue = document.querySelector("#progress-value");
const progressTrack = document.querySelector(".progress-track");
const analysisSteps = document.querySelectorAll(".analysis-step");

const API_BASE_URL = "";
const STATUS_CHECK_INTERVAL = 1000;
const MAX_WAITING_PROGRESS = 92;

let progress = 0;
let progressInterval = null;
let statusInterval = null;
let isCompleted = false;
let isCheckingStatus = false;

const getActiveStep = () => {
  if (progress < 25) {
    return 1;
  }

  if (progress < 55) {
    return 2;
  }

  if (progress < 80) {
    return 3;
  }

  return 4;
};

const updateStepIcon = (step, state) => {
  const icon = step.querySelector(".step-icon");

  if (!icon) {
    return;
  }

  icon.innerHTML = "";

  if (state === "complete") {
    const check = document.createElement("span");

    check.className = "step-check";
    check.textContent = "✓";

    icon.appendChild(check);
    return;
  }

  if (state === "processing") {
    const spinner = document.createElement("span");

    spinner.className = "step-spinner";

    icon.appendChild(spinner);
  }
};

const updateSteps = () => {
  if (progress >= 100) {
    analysisSteps.forEach((step) => {
      step.classList.remove(
        "is-active",
        "is-processing"
      );

      step.classList.add("is-complete");

      updateStepIcon(step, "complete");
    });

    return;
  }

  const activeStep = getActiveStep();

  analysisSteps.forEach((step) => {
    const stepNumber = Number(step.dataset.step);

    step.classList.remove(
      "is-active",
      "is-processing",
      "is-complete"
    );

    if (stepNumber < activeStep) {
      step.classList.add("is-complete");
      updateStepIcon(step, "complete");
      return;
    }

    if (stepNumber === activeStep) {
      if (activeStep === 1) {
        step.classList.add("is-active");
        updateStepIcon(step, "complete");
      } else {
        step.classList.add("is-processing");
        updateStepIcon(step, "processing");
      }

      return;
    }

    updateStepIcon(step, "waiting");
  });
};

const updateProgress = () => {
  progressBar.style.width = `${progress}%`;
  progressValue.textContent = `${progress}%`;

  progressTrack.setAttribute(
    "aria-valuenow",
    String(progress)
  );

  updateSteps();
};

const moveToSearchResult = () => {
  window.location.href = "./search-result.html";
};

const stopIntervals = () => {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }

  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }
};

const completeAnalysis = () => {
  if (isCompleted) {
    return;
  }

  isCompleted = true;
  progress = 100;

  stopIntervals();
  updateProgress();

  window.setTimeout(
    moveToSearchResult,
    800
  );
};

const handleAnalysisFailure = () => {
  stopIntervals();

  alert(
    "탐색 분석 중 오류가 발생했습니다. 다시 시도해주세요."
  );

  window.location.href = "./search-form.html";
};

const increaseProgress = () => {
  if (
    isCompleted ||
    progress >= MAX_WAITING_PROGRESS
  ) {
    return;
  }

  const increaseAmount =
    Math.floor(Math.random() * 2) + 1;

  progress = Math.min(
    progress + increaseAmount,
    MAX_WAITING_PROGRESS
  );

  updateProgress();
};

const checkAnalysisStatus = async () => {
  if (isCompleted || isCheckingStatus) {
    return;
  }

  const runId =
    sessionStorage.getItem(
      "goldenStepRunId"
    );

  if (!runId) {
    stopIntervals();

    alert(
      "분석 실행 정보를 찾을 수 없습니다. 탐색 정보를 다시 입력해주세요."
    );

    window.location.href =
      "./search-form.html";

    return;
  }

  isCheckingStatus = true;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/search/analysis/${runId}`,
      {
        method: "GET",
        credentials: "include"
      }
    );

    let responseData = null;

    try {
      responseData = await response.json();
    } catch (error) {
      responseData = null;
    }

    if (!response.ok) {
      const message =
        responseData?.message ||
        "분석 상태를 확인하지 못했습니다.";

      throw new Error(message);
    }

    sessionStorage.setItem(
      "goldenStepAnalysisStatus",
      responseData.status
    );

    if (
      responseData.status ===
      "COMPLETED"
    ) {
      completeAnalysis();
      return;
    }

    if (
      responseData.status ===
      "FAILED"
    ) {
      handleAnalysisFailure();
    }
  } catch (error) {
    console.error(
      "Analysis status API error:",
      error
    );

    stopIntervals();

    alert(
      error.message ||
      "분석 상태를 확인하지 못했습니다."
    );
  } finally {
    isCheckingStatus = false;
  }
};

updateProgress();

progressInterval = window.setInterval(
  increaseProgress,
  120
);

checkAnalysisStatus();

statusInterval = window.setInterval(
  checkAnalysisStatus,
  STATUS_CHECK_INTERVAL
);