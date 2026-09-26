(() => {
  const timeRange = document.querySelector("#time-range");
  const selectedTime = document.querySelector("#selected-time");
  const detailButtons = document.querySelectorAll(".detail-button");
  const searchBoardButton = document.querySelector("#search-board-button");

  if (!timeRange || !selectedTime) {
    return;
  }

  const TIME_POINTS = [
    {
      position: 0,
      minutes: 0
    },
    {
      position: 100,
      minutes: 30
    },
    {
      position: 200,
      minutes: 60
    },
    {
      position: 300,
      minutes: 120
    },
    {
      position: 400,
      minutes: 180
    },
    {
      position: 500,
      minutes: 360
    }
  ];

  const getMinutesFromPosition = (position) => {
    const numericPosition = Number(position);

    for (let i = 0; i < TIME_POINTS.length - 1; i += 1) {
      const currentPoint = TIME_POINTS[i];
      const nextPoint = TIME_POINTS[i + 1];

      if (
        numericPosition >= currentPoint.position &&
        numericPosition <= nextPoint.position
      ) {
        const positionRange =
          nextPoint.position - currentPoint.position;

        const positionProgress =
          (numericPosition - currentPoint.position) /
          positionRange;

        const minuteRange =
          nextPoint.minutes - currentPoint.minutes;

        return (
          currentPoint.minutes +
          minuteRange * positionProgress
        );
      }
    }

    return 360;
  };

  const formatElapsedTime = (minutes) => {
    const roundedMinutes = Math.round(minutes);

    if (roundedMinutes <= 0) {
      return "현재";
    }

    if (roundedMinutes < 60) {
      return `${roundedMinutes}분`;
    }

    const hours = Math.floor(roundedMinutes / 60);
    const remainingMinutes = roundedMinutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}시간`;
    }

    return `${hours}시간 ${remainingMinutes}분`;
  };

  const updateSliderBackground = () => {
    const value = Number(timeRange.value);
    const min = Number(timeRange.min);
    const max = Number(timeRange.max);

    const progress =
      ((value - min) / (max - min)) * 100;

    timeRange.style.background = `
      linear-gradient(
        90deg,
        #1479ed 0%,
        #1479ed ${progress}%,
        #dce6f0 ${progress}%,
        #dce6f0 100%
      )
    `;
  };

  const updateTime = () => {
    const minutes =
      getMinutesFromPosition(timeRange.value);

    selectedTime.textContent =
      formatElapsedTime(minutes);

    updateSliderBackground();
  };

  const handleTimeInput = () => {
    updateTime();
  };

  const handleDetailClick = (event) => {
    const button = event.currentTarget;
    const location = button.dataset.location;

    if (!location) {
      return;
    }

    alert(
      `${location}의 상세 경로 정보는 백엔드 연동 후 제공됩니다.`
    );
  };

  timeRange.addEventListener(
    "input",
    handleTimeInput
  );

  detailButtons.forEach((button) => {
    button.addEventListener(
      "click",
      handleDetailClick
    );
  });

  updateTime();

  if (searchBoardButton) {
    searchBoardButton.addEventListener(
      "click",
      () => {
        window.location.href =
          "./search-board.html";
      }
    );
  }
})();