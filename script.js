let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let timer;
let timeLeft;

const startButton = document.getElementById('start-button');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');
const timeError = document.getElementById('time-error');
const iframeAlert = document.getElementById('iframe-alert');
const iframeTimeout = document.getElementById('iframe-timeout');
const continueButton = document.getElementById('continue-button');
const cancelButton = document.getElementById('cancel-button');
const questionContainer = document.getElementById('question-container');
const questionElement = document.getElementById('question');
const optionsContainer = document.getElementById('options-container');
const timerElement = document.getElementById('timer');
const resultsContainer = document.getElementById('results-container');
const resultsBody = document.getElementById('results-body');
const restartButton = document.getElementById('restart-button');
const correctCountElement = document.getElementById('correct-count');
const incorrectCountElement = document.getElementById('incorrect-count');
const percentageElement = document.getElementById('percentage');
const statusElement = document.getElementById('status');

function validateTimeInput() {
    const minutes = parseInt(minutesInput.value);
    const seconds = parseInt(secondsInput.value);

    if (
        isNaN(minutes) || isNaN(seconds) ||
        minutes < 0 || minutes > 60 ||
        (minutes === 0 && (seconds < 5 || seconds > 60)) ||
        (minutes >= 1 && (seconds < 0 || seconds > 60))
    ) {
        timeError.style.display = 'block';
        return false;
    }

    timeError.style.display = 'none';
    timeLeft = minutes * 60 + seconds;
    return true;
}

function loadQuestions() {
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            questions = data.sort(() => 0.5 - Math.random()).slice(0, 3);
        })
        .catch(error => console.error('Error al cargar preguntas:', error));
}

loadQuestions();

startButton.addEventListener('click', () => {
    if (validateTimeInput()) {
        iframeAlert.style.display = 'block';
    }
});

continueButton.addEventListener('click', () => {
    iframeAlert.style.display = 'none';
    document.getElementById('time-setup').style.display = 'none';
    startButton.style.display = 'none';
    questionContainer.style.display = 'block';
    showQuestion();
    startTimer();
});

cancelButton.addEventListener('click', () => {
    iframeAlert.style.display = 'none';
});

function showQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    questionElement.textContent = currentQuestion.question;
    optionsContainer.innerHTML = '';
    for (let option in currentQuestion.options) {
        const label = document.createElement('label');
        label.classList.add('option-label');
        label.innerHTML = `
            <input type="radio" name="option" class="option-input" value="${option}">
            <span class="option-text"><b>${option}.</b> ${currentQuestion.options[option]}</span>
        `;
        optionsContainer.appendChild(label);
    }
}

optionsContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('option-input')) {
        const selectedOption = e.target.value;
        const selectedText = `<b>${selectedOption}.</b> ${questions[currentQuestionIndex].options[selectedOption]}`;
        const correctText = `<b>${questions[currentQuestionIndex].correctAnswer}.</b> ${questions[currentQuestionIndex].options[questions[currentQuestionIndex].correctAnswer]}`;
        
        userAnswers.push({
            question: questions[currentQuestionIndex].question,
            selected: selectedText,
            correct: selectedOption === questions[currentQuestionIndex].correctAnswer,
            correctAnswer: correctText
        });

        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            clearInterval(timer);
            showResults();
        }
    }
});

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `Tiempo restante: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            showTimeoutMessage();
        }
    }, 1000);
}

function showTimeoutMessage() {
    questionContainer.style.display = 'none';
    iframeTimeout.style.display = 'block';
    setTimeout(() => {
        iframeTimeout.style.display = 'none';
        showResults();
    }, 3000);
}

function showResults() {
    resultsBody.innerHTML = '';
    questionContainer.style.display = 'none';
    resultsContainer.style.display = 'block';

    let correctCount = 0;
    let incorrectCount = 0;

    questions.forEach((question, index) => {
        const answer = userAnswers[index];
        const row = document.createElement('tr');
        
        if (answer) {
            row.className = answer.correct ? 'correct' : 'incorrect';
            if (answer.correct) correctCount++;
            else incorrectCount++;
            row.innerHTML = `
                <td>${answer.question}</td>
                <td>${answer.selected}</td>
                <td>${answer.correct ? 'Sí' : 'No'}</td>
                <td>${!answer.correct ? answer.correctAnswer : ''}</td>
            `;
        } else {
            incorrectCount++;
            row.className = 'incorrect';
            row.innerHTML = `
                <td>${question.question}</td>
                <td>Sin responder</td>
                <td></td>
                <td></td>
            `;
        }

        resultsBody.appendChild(row);
    });

    const totalQuestions = questions.length;
    const percentage = (correctCount / totalQuestions) * 100;
    correctCountElement.textContent = correctCount;
    incorrectCountElement.textContent = incorrectCount;
    percentageElement.textContent = percentage.toFixed(2);

    if (percentage >= 65) {
        statusElement.style.color = '#68ff07';
        statusElement.textContent = 'Aprobado';
    } else {
        statusElement.style.color = '#ff0000';
        statusElement.textContent = 'Reprobado';
    }
}

restartButton.addEventListener('click', () => {
    location.reload();
});
