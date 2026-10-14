const startScreen = document.querySelector("#start-screen");
const questionScreen = document.querySelector("#question-screen");
const analysisScreen = document.querySelector("#analysis-screen");
const resultScreen = document.querySelector("#result-screen");
const startButton = document.querySelector("#start-test");
const headerNote = document.querySelector(".header-note");
const questionCounter = document.querySelector("#question-counter");
const progressTrack = document.querySelector("#progress-track");
const progressFill = document.querySelector("#progress-fill");
const questionCharacter = document.querySelector("#question-character");
const questionLabel = document.querySelector("#question-label");
const questionText = document.querySelector("#question-text");
const answerOptions = document.querySelector("#answer-options");
const previousButton = document.querySelector("#previous-question");
const nextButton = document.querySelector("#next-question");
const nextButtonLabel = nextButton.querySelector(".button-label");
const questionError = document.querySelector("#question-error");
const analysisTitle = document.querySelector("#analysis-title");
const resultType = document.querySelector("#result-type");
const axisResults = document.querySelector("#axis-results");
const openResultButton = document.querySelector("#open-result");
const resultPageType = document.querySelector("#result-page-type");
const resultPageTitle = document.querySelector("#result-page-title");
const resultPageSummary = document.querySelector("#result-page-summary");
const resultKeywords = document.querySelector("#result-keywords");
const resultCharacter = document.querySelector("#result-character");
const profileResultSections = document.querySelector("#profile-result-sections");
const resultStrengths = document.querySelector("#result-strengths");
const resultGrowthPoints = document.querySelector("#result-growth-points");
const resultRelationships = document.querySelector("#result-relationships");
const resultWork = document.querySelector("#result-work");
const resultStress = document.querySelector("#result-stress");
const resultActionTip = document.querySelector("#result-action-tip");
const boundaryResultSection = document.querySelector("#boundary-result-section");
const boundaryAxisList = document.querySelector("#boundary-axis-list");
const backToAnalysisButton = document.querySelector("#back-to-analysis");
const restartButton = document.querySelector("#restart-test");
const resultDisclaimer = document.querySelector("#result-disclaimer");

const answerFaces = ["😣", "🙁", "😐", "🙂", "😄"];
const questionCharacters = [
  "./assets/character-01.png",
  "./assets/character-02.png",
  "./assets/character-03.png",
  "./assets/character-04.png",
];
const temperamentCharacters = {
  NT: "./assets/character-01.png",
  SJ: "./assets/character-02.png",
  SP: "./assets/character-03.png",
  NF: "./assets/character-04.png",
};
const axisDefinitions = [
  { axis: "EI", left: "E", right: "I" },
  { axis: "SN", left: "S", right: "N" },
  { axis: "TF", left: "T", right: "F" },
  { axis: "JP", left: "J", right: "P" },
];
const axisAnimationDuration = 550;
const axisAnimationGap = 80;
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const answers = new Map();

let questionData = null;
let resultData = null;
let currentQuestionIndex = 0;
let latestResults = null;

function createAnswerChoice(option, index, selectedValue) {
  const choice = document.createElement("label");
  choice.className = `answer-choice answer-choice-${index + 1}`;

  const input = document.createElement("input");
  input.type = "radio";
  input.name = "answer";
  input.value = String(option.value);
  input.checked = option.value === selectedValue;

  const content = document.createElement("span");
  content.className = "answer-option-content";

  const face = document.createElement("span");
  face.className = "answer-face";
  face.setAttribute("aria-hidden", "true");
  face.textContent = answerFaces[index];

  const label = document.createElement("span");
  label.className = "answer-label";
  label.textContent = option.label;

  content.append(face, label);
  choice.append(input, content);

  return choice;
}

function renderQuestion({ moveFocus = false } = {}) {
  const question = questionData.questions[currentQuestionIndex];
  const totalQuestions = questionData.questions.length;
  const displayNumber = String(currentQuestionIndex + 1).padStart(2, "0");
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const selectedValue = answers.get(question.id);

  questionCounter.textContent = `${displayNumber} / ${totalQuestions}`;
  questionLabel.textContent = `질문 ${displayNumber}`;
  questionText.textContent = question.text;
  questionCharacter.src = questionCharacters[currentQuestionIndex % questionCharacters.length];
  progressTrack.setAttribute("aria-valuemax", String(totalQuestions));
  progressTrack.setAttribute("aria-valuenow", String(currentQuestionIndex + 1));
  progressFill.style.width = `${progress}%`;

  answerOptions.replaceChildren(
    ...questionData.answerScale.map((option, index) =>
      createAnswerChoice(option, index, selectedValue),
    ),
  );

  previousButton.disabled = currentQuestionIndex === 0;
  nextButton.disabled = selectedValue === undefined;
  nextButtonLabel.textContent = currentQuestionIndex === totalQuestions - 1 ? "분석하기" : "다음";

  if (moveFocus) {
    questionText.focus();
  }
}

function calculateResults() {
  const maxAnswerMagnitude = Math.max(
    ...questionData.answerScale.map((option) => Math.abs(option.value)),
  );

  return axisDefinitions.map(({ axis, left, right }) => {
    const axisQuestions = questionData.questions.filter((question) => question.axis === axis);
    const maxScore = axisQuestions.length * maxAnswerMagnitude;
    const score = axisQuestions.reduce((total, question) => {
      const answer = answers.get(question.id);
      const direction = question.favoredPole === left ? 1 : -1;

      return total + answer * direction;
    }, 0);
    const leftPercentage = Math.round(((score + maxScore) / (maxScore * 2)) * 100);
    const rightPercentage = 100 - leftPercentage;
    const typeSegment = score === 0 ? `(${left}/${right})` : score > 0 ? left : right;
    const tendency = score === 0 ? "동점" : `${score > 0 ? left : right} 우세`;

    return {
      axis,
      left,
      right,
      score,
      maxScore,
      leftPercentage,
      rightPercentage,
      typeSegment,
      tendency,
    };
  });
}

function renderAxisPercentages(item, result, progress) {
  const leftValue = item.querySelector(".axis-percentage-left");
  const rightValue = item.querySelector(".axis-percentage-right");

  leftValue.textContent = `${Math.round(result.leftPercentage * progress)}%`;
  rightValue.textContent = `${Math.round(result.rightPercentage * progress)}%`;
}

function animateAxisPercentage(item, result) {
  return new Promise((resolve) => {
    let startTime;

    const updateValues = (currentTime) => {
      startTime ??= currentTime;

      const elapsed = Math.min((currentTime - startTime) / axisAnimationDuration, 1);
      const easedProgress = 1 - (1 - elapsed) ** 3;

      renderAxisPercentages(item, result, easedProgress);

      if (elapsed < 1) {
        window.requestAnimationFrame(updateValues);
        return;
      }

      resolve();
    };

    window.requestAnimationFrame(updateValues);
  });
}

function wait(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function createTypeSegment(result) {
  const segment = document.createElement("span");
  segment.className = "type-segment";
  segment.textContent = "·";
  segment.setAttribute("aria-hidden", "true");

  if (result.score === 0) {
    segment.classList.add("type-segment-tie");
  }

  return segment;
}

function revealTypeSegment(segment, result) {
  segment.textContent = result.typeSegment;
  segment.classList.add("is-revealed");
}

async function animateAnalysisResults(results) {
  const items = [...axisResults.querySelectorAll(".axis-result")];
  const typeSegments = [...resultType.querySelectorAll(".type-segment")];

  if (reducedMotionQuery.matches) {
    items.forEach((item, index) => {
      item.classList.add("is-active");
      renderAxisPercentages(item, results[index], 1);
      revealTypeSegment(typeSegments[index], results[index]);
    });
    return;
  }

  axisResults.getBoundingClientRect();
  await new Promise((resolve) => window.requestAnimationFrame(resolve));

  for (let index = 0; index < items.length; index += 1) {
    items[index].classList.add("is-active");
    await animateAxisPercentage(items[index], results[index]);
    revealTypeSegment(typeSegments[index], results[index]);

    if (index < items.length - 1) {
      await wait(axisAnimationGap);
    }
  }
}

function createAxisResult(result) {
  const item = document.createElement("div");
  item.className = "axis-result";
  item.dataset.axis = result.axis;
  item.dataset.dominant = result.score === 0 ? "tie" : result.score > 0 ? "left" : "right";

  const term = document.createElement("dt");
  term.className = "axis-heading";

  const leftPole = document.createElement("span");
  leftPole.className = "axis-pole axis-pole-left";

  const leftLetter = document.createElement("strong");
  leftLetter.textContent = result.left;

  const leftValue = document.createElement("span");
  leftValue.className = "axis-percentage axis-percentage-left";
  leftValue.textContent = reducedMotionQuery.matches ? `${result.leftPercentage}%` : "0%";

  leftPole.append(leftLetter, leftValue);

  const axisName = document.createElement("span");
  axisName.className = "axis-name";
  axisName.textContent = `${result.left} / ${result.right}`;

  const rightPole = document.createElement("span");
  rightPole.className = "axis-pole axis-pole-right";

  const rightValue = document.createElement("span");
  rightValue.className = "axis-percentage axis-percentage-right";
  rightValue.textContent = reducedMotionQuery.matches ? `${result.rightPercentage}%` : "0%";

  const rightLetter = document.createElement("strong");
  rightLetter.textContent = result.right;

  rightPole.append(rightValue, rightLetter);
  term.append(leftPole, axisName, rightPole);

  const description = document.createElement("dd");
  description.className = "axis-result-detail";
  const scorePrefix = result.score > 0 ? "+" : "";

  const bar = document.createElement("div");
  bar.className = "axis-bar";
  bar.setAttribute("role", "img");
  bar.setAttribute(
    "aria-label",
    `${result.left} ${result.leftPercentage}%, ${result.right} ${result.rightPercentage}%, 원점수 ${scorePrefix}${result.score} / ${result.maxScore}, ${result.tendency}`,
  );

  const leftFill = document.createElement("span");
  leftFill.className = "axis-fill axis-fill-left";
  leftFill.style.width = `${result.leftPercentage}%`;

  const rightFill = document.createElement("span");
  rightFill.className = "axis-fill axis-fill-right";
  rightFill.style.width = `${result.rightPercentage}%`;

  const centerLine = document.createElement("span");
  centerLine.className = "axis-center-line";
  centerLine.setAttribute("aria-hidden", "true");

  bar.append(leftFill, rightFill, centerLine);

  const caption = document.createElement("p");
  caption.className = "axis-caption";
  caption.textContent = `원점수 ${scorePrefix}${result.score} / ${result.maxScore} · ${result.tendency}`;

  description.append(bar, caption);
  item.append(term, description);
  return item;
}

function replaceTextList(list, items) {
  list.replaceChildren(
    ...items.map((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }),
  );
}

function getTemperament(type) {
  return type[1] === "N" ? `${type[1]}${type[2]}` : `${type[1]}${type[3]}`;
}

function createBoundaryAxisCard(result) {
  const boundary = resultData.boundaryResult.axes[result.axis];
  const card = document.createElement("article");
  card.className = "boundary-axis-card";

  const label = document.createElement("p");
  label.className = "boundary-axis-label";
  label.textContent = boundary.label;

  const title = document.createElement("h3");
  title.textContent = `${result.left}와 ${result.right}, 두 방식을 함께 사용해요`;

  const summary = document.createElement("p");
  summary.className = "boundary-axis-summary";
  summary.textContent = boundary.summary;

  const tip = document.createElement("p");
  tip.className = "boundary-axis-tip";

  const tipLabel = document.createElement("strong");
  tipLabel.textContent = "작은 팁";

  tip.append(tipLabel, document.createTextNode(boundary.tip));
  card.append(label, title, summary, tip);
  return card;
}

function renderProfileResult(type, profile) {
  resultPageTitle.textContent = profile.title;
  resultPageSummary.textContent = profile.summary;
  replaceTextList(resultKeywords, profile.keywords);
  replaceTextList(resultStrengths, profile.strengths);
  replaceTextList(resultGrowthPoints, profile.growthPoints);
  resultRelationships.textContent = profile.guide.relationships;
  resultWork.textContent = profile.guide.work;
  resultStress.textContent = profile.guide.stress;
  resultActionTip.textContent = profile.actionTip;
  resultCharacter.src = temperamentCharacters[getTemperament(type)];
  profileResultSections.hidden = false;
  boundaryResultSection.hidden = true;
}

function renderBoundaryResult(results, boundaryAxes) {
  const boundary = resultData.boundaryResult;

  resultPageTitle.textContent = boundary.title;
  resultPageSummary.textContent = boundary.summary;
  replaceTextList(
    resultKeywords,
    results.map((result) =>
      result.score === 0
        ? `${result.left}/${result.right} 균형`
        : `${result.score > 0 ? result.left : result.right} 성향`,
    ),
  );
  resultCharacter.src = "./assets/personality-characters.png";
  boundaryAxisList.replaceChildren(...boundaryAxes.map(createBoundaryAxisCard));
  profileResultSections.hidden = true;
  boundaryResultSection.hidden = false;
}

function renderResultScreen() {
  const type = latestResults.map((result) => result.typeSegment).join("");
  const boundaryAxes = latestResults.filter((result) => result.score === 0);

  resultPageType.textContent = type;
  resultPageType.classList.toggle("is-boundary-type", boundaryAxes.length > 0);
  resultDisclaimer.textContent = resultData.disclaimer;

  if (boundaryAxes.length === 0) {
    renderProfileResult(type, resultData.types[type]);
  } else {
    renderBoundaryResult(latestResults, boundaryAxes);
  }
}

async function showAnalysisScreen() {
  const results = calculateResults();
  const calculatedType = results.map((result) => result.typeSegment).join("");
  const typeResult = resultType.closest(".type-result");

  latestResults = results;
  openResultButton.hidden = true;
  resultType.replaceChildren(...results.map(createTypeSegment));
  typeResult.setAttribute("aria-label", `계산된 성격유형 ${calculatedType}`);
  axisResults.replaceChildren(...results.map(createAxisResult));
  questionScreen.hidden = true;
  analysisScreen.hidden = false;
  headerNote.textContent = "나를 이해하는 결과";
  window.scrollTo({ top: 0, behavior: "smooth" });
  analysisTitle.focus({ preventScroll: true });
  await animateAnalysisResults(results);
  openResultButton.hidden = false;
}

function showResultScreen() {
  if (!latestResults) {
    return;
  }

  renderResultScreen();
  analysisScreen.hidden = true;
  resultScreen.hidden = false;
  headerNote.textContent = "나를 이해하는 결과";
  window.scrollTo({ top: 0, behavior: "smooth" });
  resultPageType.focus({ preventScroll: true });
}

function showAnalysisFromResult() {
  resultScreen.hidden = true;
  analysisScreen.hidden = false;
  headerNote.textContent = "나를 이해하는 결과";
  window.scrollTo({ top: 0, behavior: "smooth" });
  analysisTitle.focus({ preventScroll: true });
}

function restartTest() {
  answers.clear();
  latestResults = null;
  currentQuestionIndex = 0;
  resultScreen.hidden = true;
  analysisScreen.hidden = true;
  questionScreen.hidden = true;
  startScreen.hidden = false;
  openResultButton.hidden = true;
  headerNote.textContent = "나를 이해하는 첫걸음";
  window.scrollTo({ top: 0, behavior: "smooth" });
  startButton.focus({ preventScroll: true });
}

function showQuestionScreen() {
  startScreen.hidden = true;
  questionScreen.hidden = false;
  headerNote.textContent = "나를 발견하는 중";
  renderQuestion();
  window.scrollTo({ top: 0, behavior: "smooth" });
  questionText.focus({ preventScroll: true });
}

async function loadData() {
  try {
    const [questionResponse, resultResponse] = await Promise.all([
      fetch("./data/questions.json"),
      fetch("./data/results.json"),
    ]);

    if (!questionResponse.ok || !resultResponse.ok) {
      throw new Error(
        `Data request failed: questions ${questionResponse.status}, results ${resultResponse.status}`,
      );
    }

    [questionData, resultData] = await Promise.all([
      questionResponse.json(),
      resultResponse.json(),
    ]);
    questionCharacters.forEach((source) => {
      const image = new Image();
      image.src = source;
    });
    startButton.disabled = false;
  } catch (error) {
    console.error(error);
    questionError.hidden = false;
  }
}

startButton.addEventListener("click", showQuestionScreen);

answerOptions.addEventListener("change", (event) => {
  if (!(event.target instanceof HTMLInputElement) || !event.target.matches('input[name="answer"]')) {
    return;
  }

  const question = questionData.questions[currentQuestionIndex];
  answers.set(question.id, Number(event.target.value));
  nextButton.disabled = false;
});

previousButton.addEventListener("click", () => {
  if (currentQuestionIndex === 0) {
    return;
  }

  currentQuestionIndex -= 1;
  renderQuestion({ moveFocus: true });
});

nextButton.addEventListener("click", () => {
  const isLastQuestion = currentQuestionIndex === questionData.questions.length - 1;

  if (isLastQuestion) {
    void showAnalysisScreen();
    return;
  }

  currentQuestionIndex += 1;
  renderQuestion({ moveFocus: true });
});

openResultButton.addEventListener("click", showResultScreen);
backToAnalysisButton.addEventListener("click", showAnalysisFromResult);
restartButton.addEventListener("click", restartTest);

loadData();
