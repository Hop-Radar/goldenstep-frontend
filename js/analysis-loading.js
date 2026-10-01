const progressBar = document.querySelector("#progress-bar");
const progressValue = document.querySelector("#progress-value");
const progressTrack = document.querySelector(".progress-track");
const analysisSteps = document.querySelectorAll(".analysis-step");

const API_BASE_URL = "";
const STATUS_CHECK_INTERVAL = 1000;
const MAX_ANALYSIS_TIME = 120000;
const WAITING_PROGRESS_DURATION = 60000;
const MAX_WAITING_PROGRESS = 92;
const COMPLETION_DURATION = 600;
const COMPLETION_DELAY = 500;

let progress = 0;
let statusInterval = null;
let progressAnimationFrame = null;
let timeoutId = null;
let completionTimeoutId = null;
let loadingStartedAt = null;
let isCompleted = false;
let isCheckingStatus = false;
let isFinishing = false;

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
  const displayProgress = Math.floor(progress);

  progressBar.style.width = `${progress}%`;
  progressValue.textContent = `${displayProgress}%`;

  progressTrack.setAttribute(
    "aria-valuenow",
    String(displayProgress)
  );

  updateSteps();
};

const moveToSearchResult = () => {
  window.location.href = "./search-result.html";
};

const stopStatusCheck = () => {
  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }
};

const stopProgressAnimation = () => {
  if (progressAnimationFrame) {
    cancelAnimationFrame(progressAnimationFrame);
    progressAnimationFrame = null;
  }
};

const stopAnalysisTimeout = () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

const stopAllTimers = () => {
  stopStatusCheck();
  stopProgressAnimation();
  stopAnalysisTimeout();

  if (completionTimeoutId) {
    clearTimeout(completionTimeoutId);
    completionTimeoutId = null;
  }
};

const calculateWaitingProgress = (elapsedTime) => {
  const ratio = Math.min(
    elapsedTime / WAITING_PROGRESS_DURATION,
    1
  );

  const easedRatio =
    1 - Math.pow(1 - ratio, 2.4);

  return Math.min(
    easedRatio * MAX_WAITING_PROGRESS,
    MAX_WAITING_PROGRESS
  );
};

const animateWaitingProgress = (timestamp) => {
  if (isCompleted || isFinishing) {
    return;
  }

  if (!loadingStartedAt) {
    loadingStartedAt = timestamp;
  }

  const elapsedTime =
    timestamp - loadingStartedAt;

  progress = calculateWaitingProgress(
    elapsedTime
  );

  updateProgress();

  if (progress < MAX_WAITING_PROGRESS) {
    progressAnimationFrame =
      requestAnimationFrame(
        animateWaitingProgress
      );
  }
};

const finishProgress = () => {
  if (isFinishing || isCompleted) {
    return;
  }

  isFinishing = true;

  stopStatusCheck();
  stopProgressAnimation();
  stopAnalysisTimeout();

  const startProgress = progress;
  const startedAt = performance.now();

  const animateCompletion = (timestamp) => {
    const elapsedTime =
      timestamp - startedAt;

    const ratio = Math.min(
      elapsedTime / COMPLETION_DURATION,
      1
    );

    const easedRatio =
      1 - Math.pow(1 - ratio, 3);

    progress =
      startProgress +
      (100 - startProgress) * easedRatio;

    if (ratio >= 1) {
      progress = 100;
    }

    updateProgress();

    if (ratio < 1) {
      progressAnimationFrame =
        requestAnimationFrame(
          animateCompletion
        );

      return;
    }

    isCompleted = true;
    isFinishing = false;
    progressAnimationFrame = null;

    completionTimeoutId =
      window.setTimeout(
        moveToSearchResult,
        COMPLETION_DELAY
      );
  };

  progressAnimationFrame =
    requestAnimationFrame(
      animateCompletion
    );
};

const handleAnalysisFailure = (
  message = "탐색 분석 중 오류가 발생했습니다. 다시 시도해주세요."
) => {
  if (isCompleted) {
    return;
  }

  stopAllTimers();

  alert(message);

  window.location.href =
    "./search-form.html";
};

const handleAnalysisTimeout = () => {
  if (isCompleted || isFinishing) {
    return;
  }

  handleAnalysisFailure(
    "탐색 분석 시간이 초과되었습니다. 다시 시도해주세요."
  );
};

const checkAnalysisStatus = async () => {
  if (
    isCompleted ||
    isFinishing ||
    isCheckingStatus
  ) {
    return;
  }

  const runId =
    sessionStorage.getItem(
      "goldenStepRunId"
    );

  if (!runId) {
    handleAnalysisFailure(
      "분석 실행 정보를 찾을 수 없습니다. 탐색 정보를 다시 입력해주세요."
    );

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
      responseData =
        await response.json();
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
      finishProgress();
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

    handleAnalysisFailure(
      error.message ||
      "분석 상태를 확인하지 못했습니다."
    );
  } finally {
    isCheckingStatus = false;
  }
};

const initializeAnalysis = () => {
  updateProgress();

  progressAnimationFrame =
    requestAnimationFrame(
      animateWaitingProgress
    );

  checkAnalysisStatus();

  statusInterval =
    window.setInterval(
      checkAnalysisStatus,
      STATUS_CHECK_INTERVAL
    );

  timeoutId =
    window.setTimeout(
      handleAnalysisTimeout,
      MAX_ANALYSIS_TIME
    );
};

initializeAnalysis();