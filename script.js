// Variables globales y referencias a elementos del DOM
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let timer;
let timeLeft;

const questionTitle = document.getElementById('question-title');
const startButton = document.getElementById('start-button');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');
const numQuestionsInput = document.getElementById('num-questions');
const timeError = document.getElementById('time-error');
const questionError = document.getElementById('question-error');
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

// Función para validar la entrada de tiempo
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

// Función para validar la entrada del número de preguntas
function validateQuestionInput() {
    const numQuestions = parseInt(numQuestionsInput.value);

    if (isNaN(numQuestions) || numQuestions < 1 || numQuestions > 30) {
        questionError.style.display = 'block';
        return false;
    }

    questionError.style.display = 'none';
    return true;
}

// Función para cargar las preguntas desde un archivo JSON
function loadQuestions() {
    fetch('questions_chap01.json')
        .then(response => response.json())
        .then(data => {
            const numQuestions = parseInt(numQuestionsInput.value);
            questions = data.sort(() => 0.5 - Math.random()).slice(0, numQuestions);
            showQuestion();  // Muestra la primera pregunta solo después de cargar las preguntas
        })
        .catch(error => console.error('Error al cargar preguntas:', error));
}

// Configuración de eventos para los botones y el inicio del simulacro
startButton.addEventListener('click', () => {
    if (validateTimeInput() && validateQuestionInput()) {
        iframeAlert.style.display = 'block';
    }
});

continueButton.addEventListener('click', () => {
    iframeAlert.style.display = 'none';
    document.getElementById('time-setup').style.display = 'none';
    document.getElementById('question-setup').style.display = 'none';
    startButton.style.display = 'none';
    loadQuestions();
    questionContainer.style.display = 'block';
    startTimer();
});

cancelButton.addEventListener('click', () => {
    iframeAlert.style.display = 'none';
});

// Función para mostrar la pregunta actual
function showQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Actualizar el título de la pregunta
    questionTitle.textContent = `Pregunta ${currentQuestionIndex + 1}`;
    questionTitle.style.display = 'block'; // Asegura que el título se muestre

    // Mostrar la pregunta actual (sin el número)
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

// Manejar la selección de respuestas y almacenar solo la pregunta y la respuesta
optionsContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('option-input')) {
        const selectedOption = e.target.value;
        const selectedText = `<b>${selectedOption}.</b> ${questions[currentQuestionIndex].options[selectedOption]}`;
        const correctText = `<b>${questions[currentQuestionIndex].correctAnswer}.</b> ${questions[currentQuestionIndex].options[questions[currentQuestionIndex].correctAnswer]}`;
        
        // Guardar solo la pregunta y la respuesta, sin el título ni el número
        userAnswers.push({
            question: questions[currentQuestionIndex].question, // Solo la pregunta
            selected: selectedText,
            correct: selectedOption === questions[currentQuestionIndex].correctAnswer,
            correctAnswer: correctText
        });

        // Marcar la opción seleccionada
        e.target.checked = true;
        
        // Retraso de 500ms antes de avanzar a la siguiente pregunta
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                showQuestion();
            } else {
                clearInterval(timer);
                showResults();
            }
        }, 500);
    }
});



// Función para iniciar el temporizador
function startTimer() {
    // Muestra el tiempo inicial en el formato correcto
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `Tiempo restante: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
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

// Función para mostrar un mensaje de timeout
function showTimeoutMessage() {
    questionContainer.style.display = 'none';
    iframeTimeout.style.display = 'block';
    setTimeout(() => {
        iframeTimeout.style.display = 'none';
        showResults();
    }, 3000);
}

// Función para mostrar los resultados al finalizar el examen
function showResults() {
    resultsBody.innerHTML = '';
    questionContainer.style.display = 'none';
    resultsContainer.style.display = 'block';

    let correctCount = 0;
    let incorrectCount = 0;

    userAnswers.forEach((answer) => {
        const row = document.createElement('tr');
        row.className = answer.correct ? 'correct' : 'incorrect';

        row.innerHTML = `
            <td>${answer.question}</td> <!-- La pregunta -->
            <td>${answer.selected}</td> <!-- Respuesta seleccionada -->
            <td>${answer.correct ? 'Sí' : 'No'}</td> <!-- Correcto o incorrecto -->
            <td>${!answer.correct ? answer.correctAnswer : ''}</td> <!-- Respuesta correcta -->
        `;

        if (answer.correct) correctCount++;
        else incorrectCount++;

        resultsBody.appendChild(row);
    });

    const totalQuestions = userAnswers.length;
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

// Reinicio de la aplicación
restartButton.addEventListener('click', () => {
    location.reload();
});
