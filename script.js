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
        alert("Por favor, ingrese un tiempo válido."); // Muestra un mensaje de alerta si el tiempo es inválido
        return false;
    }

    timeLeft = minutes * 60 + seconds;
    return true;
}

// Función para validar la entrada del número de preguntas
function validateQuestionInput() {
    const numQuestions = parseInt(numQuestionsInput.value);

    if (isNaN(numQuestions) || numQuestions < 1 || numQuestions > 30) {
        alert("Por favor, ingrese un número de preguntas válido."); // Muestra un mensaje de alerta si el número de preguntas es inválido
        return false;
    }

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
        iframeAlert.style.display = 'block';  // Muestra la alerta previa al simulacro
    }
});

continueButton.addEventListener('click', () => {
    iframeAlert.style.display = 'none';
    document.getElementById('main-container').style.display = 'none';
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
    questionTitle.style.display = 'block';

    const literals = ['A', 'B', 'C', 'D'];
    const shuffledOptions = Object.entries(currentQuestion.options).sort(() => Math.random() - 0.5);
    questionElement.textContent = currentQuestion.question;
    optionsContainer.innerHTML = '';

    shuffledOptions.forEach(([key, value], index) => {
        const literal = literals[index];
        const label = document.createElement('label');
        label.classList.add('option-label');
        label.innerHTML = `
            <input type="radio" name="option" class="option-input" value="${literal}">
            <span class="option-text"><b>${literal}.</b> ${value}</span>
        `;
        label.dataset.key = key;
        label.dataset.literal = literal;
        label.addEventListener('click', () => handleAnswerSelection(literal, value, key));
        optionsContainer.appendChild(label);
    });
}

// Función para manejar la selección de respuesta y pasar a la siguiente pregunta
function handleAnswerSelection(literal, selectedOption, key) {
    const correctAnswer = questions[currentQuestionIndex].correctAnswer;

    // Almacenar la respuesta del usuario
    userAnswers.push({
        question: questions[currentQuestionIndex].question,
        selected: selectedOption,
        literal: literal,
        correct: key === correctAnswer,
        correctAnswer: questions[currentQuestionIndex].options[correctAnswer]
    });

    // Asegurarnos de que el checkbox seleccionado permanezca marcado
    const options = document.getElementsByName('option');
    options.forEach(option => {
        if (option.value === literal) {
            option.checked = true; // Marcar el checkbox seleccionado
        }
        option.disabled = true; // Deshabilitar todas las opciones
    });

    // Esperar 500 ms antes de avanzar a la siguiente pregunta
    setTimeout(() => {
        // Avanzar a la siguiente pregunta o mostrar resultados si es la última
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            clearInterval(timer); // Detener el temporizador
            showResults(); // Mostrar los resultados al final
        }
    }, 500); // Espera de 500 ms
}



// Inicia el temporizador
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

// Muestra mensaje de timeout
function showTimeoutMessage() {
    questionContainer.style.display = 'none';
    iframeTimeout.style.display = 'block';
    setTimeout(() => {
        iframeTimeout.style.display = 'none';
        showResults();
    }, 3000);
}

// Muestra los resultados
function showResults() {
    resultsBody.innerHTML = '';
    questionContainer.style.display = 'none';
    questionTitle.style.display = 'none';
    resultsContainer.style.display = 'block';

    let correctCount = 0;
    let incorrectCount = 0;

    userAnswers.forEach((answer) => {
        const row = document.createElement('tr');
        row.className = answer.correct ? 'correct' : 'incorrect';

        row.innerHTML = `
            <td>${answer.question}</td>
            <td>${answer.literal}. ${answer.selected}</td>
            <td>${answer.correct ? 'Sí' : 'No'}</td>
            <td>${answer.correct ? '' : answer.correctAnswer}</td>
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


restartButton.addEventListener('click', () => location.reload());
