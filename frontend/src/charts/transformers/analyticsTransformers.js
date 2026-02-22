export function getRatingCounts(ratings = []) {
  const counts = [0, 0, 0, 0, 0];

  ratings.forEach((rating) => {
    if (rating >= 1 && rating <= 5) {
      counts[rating - 1] += 1;
    }
  });

  return counts;
}

export function getRecommendationCounts(recommendList = []) {
  const yesCount = recommendList.filter((value) => value === "Yes").length;
  const noCount = recommendList.filter((value) => value === "No").length;
  return [yesCount, noCount];
}

export function getAverageRatingsPerEvent(ratingsPerEvent = {}) {
  const eventNames = Object.keys(ratingsPerEvent);

  const averages = eventNames.map((eventName) => {
    const ratings = ratingsPerEvent[eventName] || [];
    if (!ratings.length) return 0;

    const total = ratings.reduce((acc, value) => acc + value, 0);
    return Number((total / ratings.length).toFixed(2));
  });

  return { eventNames, averages };
}

export function getKeyValueData(dataObject = {}) {
  return {
    labels: Object.keys(dataObject),
    values: Object.values(dataObject),
  };
}
