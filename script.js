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

    if (isNaN(minutes) || minutes < 1 || minutes > 60) {
        alert("Por favor, ingrese un tiempo válido en minutos."); // Mensaje de error si el tiempo no es válido
        return false;
    }

    timeLeft = minutes * 60; // Convierte minutos a segundos
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
// Función para cargar las preguntas según el capítulo seleccionado
function loadQuestions() {
    const chapterSelect = document.getElementById('chapter-select');
    const selectedChapter = chapterSelect.value;
    const numQuestions = parseInt(numQuestionsInput.value);

    // Verifica si se seleccionaron todos los capítulos o uno específico
    let url = selectedChapter === "all" 
        ? `questions_chap${selectedChapter}.json` 
        : `questions_chap${selectedChapter}.json`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`No se encontraron datos sobre el capítulo ${selectedChapter}`);
            }
            return response.json();
        })
        .then(data => {
            // Si se seleccionan todos los capítulos, mezclamos preguntas de todos los archivos
            questions = selectedChapter === "all" 
                ? shuffleArray(data).slice(0, numQuestions)
                : shuffleArray(data).slice(0, numQuestions);

            showQuestion(); // Muestra la primera pregunta solo después de cargar las preguntas
        })
        .catch(error => {
            alert(error.message);
            resetToStart();
        });
}

// Función para volver a la pantalla de inicio
function resetToStart() {
    document.getElementById('main-container').style.display = 'block';
    questionContainer.style.display = 'none';
    resultsContainer.style.display = 'none';
}


// Función para mezclar un array aleatoriamente (algoritmo de Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Configuración de eventos para los botones y el inicio del simulacro
startButton.addEventListener('click', () => {
    if (validateTimeInput() && validateQuestionInput()) {
        const chapterSelect = document.getElementById('chapter-select');
        const selectedChapter = chapterSelect.value;
        let url = selectedChapter === "all" 
            ? `questions_chap${selectedChapter}.json` 
            : `questions_chap${selectedChapter}.json`;

        // Verificar si el archivo de preguntas existe antes de mostrar la alerta de inicio
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`No se encontraron datos sobre el capítulo ${selectedChapter}`);
                }
                return response.json();
            })
            .then(data => {
                questions = shuffleArray(data).slice(0, parseInt(numQuestionsInput.value));
                iframeAlert.style.display = 'block'; // Muestra la alerta de inicio del simulacro
            })
            .catch(error => {
                showErrorPopup(error.message); // Muestra el pop-up de error
            });
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

// Función para mostrar el pop-up de error
function showErrorPopup(message) {
    const errorPopup = document.getElementById('error-popup');
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    errorPopup.style.display = 'block'; // Muestra el pop-up
}

// Función para cerrar el pop-up de error y regresar a la pantalla de inicio
function closeErrorPopup() {
    document.getElementById('error-popup').style.display = 'none';
    resetToStart(); // Regresa a la pantalla de inicio
}

restartButton.addEventListener('click', () => location.reload());
