const progressBar = document.querySelector("#progress-bar");
const progressValue = document.querySelector("#progress-value");
const progressTrack = document.querySelector(".progress-track");
const analysisSteps = document.querySelectorAll(".analysis-step");

let progress = 0;

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

const increaseProgress = () => {
  if (progress >= 99) {
    return;
  }

  const increaseAmount = Math.floor(Math.random() * 3) + 1;

  progress = Math.min(progress + increaseAmount, 99);

  updateProgress();
};

updateProgress();

setInterval(increaseProgress, 650);