const searchForm = document.querySelector("#search-form");
const lastLocation = document.querySelector("#last-location");
const locationSearchButton = document.querySelector("#location-search-button");
const lastSeenDate = document.querySelector("#last-seen-date");
const lastSeenHour = document.querySelector("#last-seen-hour");
const lastSeenMinute = document.querySelector("#last-seen-minute");
const lastSeenTime = document.querySelector("#last-seen-time");

const personCard = document.querySelector(".person-card");
const personToggle = document.querySelector("#person-toggle");
const personDetails = document.querySelector("#person-details");
const personSummary = document.querySelector("#person-summary");
const personAge = document.querySelector("#person-age");
const personCompleteButton = document.querySelector("#person-complete-button");

const PERSON_TYPE_LABELS = {
  child: "어린아이",
  teenager: "청소년",
  "adult-female": "성인 여성",
  "adult-male": "성인 남성",
  "senior-female": "노약자(여성)",
  "senior-male": "노약자(남성)"
};

const STATUS_LABELS = {
  none: "없음",
  yes: "있음",
  unknown: "알 수 없음"
};

const createHourOption = (hour) => {
  const value = String(hour).padStart(2, "0");
  const option = document.createElement("option");

  option.value = value;

  if (hour === 0) {
    option.textContent = "00시 (자정)";
  } else if (hour === 12) {
    option.textContent = "12시 (정오)";
  } else {
    option.textContent = `${value}시`;
  }

  return option;
};

const createMinuteOption = (minute) => {
  const value = String(minute).padStart(2, "0");
  const option = document.createElement("option");

  option.value = value;
  option.textContent = `${value}분`;

  return option;
};

const createAgeOption = (value, label) => {
  const option = document.createElement("option");

  option.value = value;
  option.textContent = label;

  return option;
};

const initializeTimeOptions = () => {
  for (let hour = 0; hour < 24; hour += 1) {
    lastSeenHour.appendChild(createHourOption(hour));
  }

  for (let minute = 0; minute < 60; minute += 5) {
    lastSeenMinute.appendChild(createMinuteOption(minute));
  }
};

const initializeAgeOptions = () => {
  personAge.appendChild(
    createAgeOption("under-10", "10세 이하")
  );

  for (let age = 11; age <= 84; age += 1) {
    personAge.appendChild(
      createAgeOption(String(age), `${age}세`)
    );
  }

  personAge.appendChild(
    createAgeOption("over-85", "85세 이상")
  );
};

const handleLocationSearch = () => {
  const keyword = lastLocation.value.trim();

  if (!keyword) {
    lastLocation.focus();
    return;
  }

  console.log("위치 검색:", keyword);
};

const updateLastSeenTime = () => {
  const date = lastSeenDate.value;
  const hour = lastSeenHour.value;
  const minute = lastSeenMinute.value;

  if (!date || !hour || !minute) {
    lastSeenTime.value = "";
    return;
  }

  lastSeenTime.value = `${date}T${hour}:${minute}`;
};

const getCheckedValue = (name) => {
  const checkedInput = document.querySelector(
    `input[name="${name}"]:checked`
  );

  return checkedInput ? checkedInput.value : "";
};

const getAgeLabel = () => {
  if (!personAge.value) {
    return "";
  }

  if (personAge.value === "under-10") {
    return "10세 이하";
  }

  if (personAge.value === "over-85") {
    return "85세 이상";
  }

  return `${personAge.value}세`;
};

const updatePersonSummary = () => {
  const personType = getCheckedValue("personType");
  const disabilityStatus = getCheckedValue("disabilityStatus");
  const diseaseStatus = getCheckedValue("diseaseStatus");

  if (!personType) {
    personSummary.textContent = "대상자의 특성을 입력해주세요.";
    return;
  }

  const summaryItems = [PERSON_TYPE_LABELS[personType]];
  const ageLabel = getAgeLabel();

  if (ageLabel) {
    summaryItems.push(ageLabel);
  }

  if (disabilityStatus) {
    summaryItems.push(`장애 ${STATUS_LABELS[disabilityStatus]}`);
  }

  if (diseaseStatus) {
    summaryItems.push(`질환 ${STATUS_LABELS[diseaseStatus]}`);
  }

  personSummary.textContent = summaryItems.join(" · ");
};

const openPersonDetails = () => {
  personDetails.hidden = false;
  personCard.classList.add("is-open");
  personToggle.setAttribute("aria-expanded", "true");
};

const closePersonDetails = () => {
  personDetails.hidden = true;
  personCard.classList.remove("is-open");
  personToggle.setAttribute("aria-expanded", "false");
};

const handlePersonToggle = () => {
  const isOpen = personToggle.getAttribute("aria-expanded") === "true";

  if (isOpen) {
    updatePersonSummary();
    closePersonDetails();
    return;
  }

  openPersonDetails();
};

const validatePersonInformation = () => {
  const personType = getCheckedValue("personType");
  const disabilityStatus = getCheckedValue("disabilityStatus");
  const diseaseStatus = getCheckedValue("diseaseStatus");

  return Boolean(
    personType &&
    disabilityStatus &&
    diseaseStatus
  );
};

const handlePersonComplete = () => {
  if (!validatePersonInformation()) {
    openPersonDetails();

    const invalidInput = personDetails.querySelector("input:invalid");

    if (invalidInput) {
      invalidInput.reportValidity();
    }

    return;
  }

  updatePersonSummary();
  closePersonDetails();
};

const handleSearchFormSubmit = (event) => {
  event.preventDefault();

  updateLastSeenTime();
  updatePersonSummary();

  if (!validatePersonInformation()) {
    openPersonDetails();

    const invalidPersonInput = personDetails.querySelector("input:invalid");

    if (invalidPersonInput) {
      invalidPersonInput.reportValidity();
    }

    return;
  }

  if (!searchForm.checkValidity()) {
    searchForm.reportValidity();
    return;
  }

  window.location.href = "./analysis-loading.html";
};

initializeTimeOptions();
initializeAgeOptions();

locationSearchButton.addEventListener("click", handleLocationSearch);

lastLocation.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleLocationSearch();
  }
});

lastSeenDate.addEventListener("change", updateLastSeenTime);
lastSeenHour.addEventListener("change", updateLastSeenTime);
lastSeenMinute.addEventListener("change", updateLastSeenTime);

personToggle.addEventListener("click", handlePersonToggle);
personCompleteButton.addEventListener("click", handlePersonComplete);
personDetails.addEventListener("change", updatePersonSummary);

searchForm.addEventListener("submit", handleSearchFormSubmit);