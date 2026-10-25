 // App State
        let uploadedFileName = "";
        let selectedTopic="";
        let selectedFile= null;
        let uploadedPdfFile= null;
        let currentQuiz = [];
        let currentQuestionIndex = 0;
        let score = 0;
        let userAnswers = [];
        let feedbackMode = "per-question";

        // Navigation Helper
        function navigateTo(pageId) {
            document.querySelectorAll('.container').forEach(el => el.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
        }

// ............................................................................................................................................
// 1. Toggle between Login and Sign Up forms
function toggleAuth(viewType) {
    const authPage = document.getElementById('auth-page');
    const dashboardPage = document.getElementById('dashboard-page'); 
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (viewType === 'signup') {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    } else if (viewType === 'login') {
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    } else if (viewType === 'dashboard-page') {
        // Hide the authentication container and show the dashboard container
        if (authPage) authPage.style.display = 'none';
        if (dashboardPage) dashboardPage.style.display = 'block';
    }
}

// 2. Handle Sign Up (Checks if user exists, then registers)
function handleSignup(event) {
    event.preventDefault();
    
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    
    // Get existing users from localStorage or create an empty array
    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if the user already exists
    const userExists = users.some(user => user.username === username);
    if (userExists) {
        alert('Username already exists! Please log in instead.');
        return;
    }
    
    // Save new user profile
    users.push({ username, password });
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Sign up successful! Please log in.');
    toggleAuth('login'); // Switch back to the login view
}

// 3. Handle Login (Authenticates and navigates to the dashboard)
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Get stored users
    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Verify credentials
    const validUser = users.find(user => user.username === username && user.password === password);
    
    if (validUser) {
        // Store current active session
        localStorage.setItem('currentUser', username);
        
        alert('Login successful! Taking you to the dashboard...');
        
        // Redirect to your dashboard page (or change view visibility if it's a single-page app)
        // window.location.href ='miniproj\index.html'; 
        toggleAuth('dashboard-page');

    } else {
        alert('Invalid username or password. Please try again.');
    }
}

// .......................................................................................................................................

        // File Upload Processing
        function handleFileUpload(event) {
    const file = event.target.files[0];

    if (file) {
        if (file.type !== "application/pdf" &&
            !file.name.toLowerCase().endsWith(".pdf")) {
            alert("Please select a PDF file.");
            event.target.value = "";
            return;
        }

        uploadedPdfFile = file;
        uploadedFileName = file.name;

        document.getElementById("file-title").innerText =
            `Configure Quiz for: ${uploadedFileName}`;

        navigateTo("config-page");
    }
}

        //file upload
        function handleTopicInput(event) {
    if (event.key === "Enter") {
        const topicVal = event.target.value.trim();

        if (topicVal) {
            selectedTopic = topicVal;
            uploadedFileName = "";
            selectedFile = null;

            document.getElementById("file-title").innerText =
                `Configure Quiz for: ${selectedTopic}`;

            navigateTo("config-page");
        }
    }
}

        
        // Mock AI Quiz Generation based on settings
                async function startQuiz() {
    const difficulty =
        document.getElementById("difficulty-select").value;

    const noofquestions =
        document.getElementById("noofquestions").value;

    const feedbackMode =
        document.getElementById("feedback-mode-select").value;

    const formData = new FormData();

    formData.append("difficulty", difficulty);
    formData.append("noofquestions", noofquestions);
    formData.append("feedbackMode", feedbackMode);

    // PDF mode
    if (uploadedPdfFile) {
        formData.append("pdf", uploadedPdfFile);
        formData.append("fileName", uploadedPdfFile.name);
    }

    // Topic mode
    else if (selectedTopic) {
        formData.append("fileName", selectedTopic);
    }

    // Validate input
    else {
        alert("Please upload a PDF or enter a topic.");
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/quiz/generate",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        console.log("Backend response:", data);

        if (!response.ok) {
            throw new Error(
                data.message || `HTTP Error: ${response.status}`
            );
        }

        if (
            !data.quiz ||
            !Array.isArray(data.quiz.questions) ||
            data.quiz.questions.length === 0
        ) {
            throw new Error("The backend did not return a valid quiz.");
        }

        currentQuiz = data.quiz.questions;

        // Reset quiz state for a new quiz
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = [];

        navigateTo("quiz-page");
        renderQuestion();

    } catch (error) {
        console.error("Quiz generation error:", error);
        alert(error.message);
    }
}

        function renderQuestion() {
            const q = currentQuiz[currentQuestionIndex];
            document.getElementById('quiz-progress').innerText = `Question ${currentQuestionIndex + 1} of ${currentQuiz.length}`;
            document.getElementById('question-text').innerText = q.question;
            
            const optionsContainer = document.getElementById('options-container');
            const explanationBox = document.getElementById('explanation-container');
            const nextBtn = document.getElementById('next-btn');
            
            optionsContainer.innerHTML = '';
            explanationBox.style.display = 'none';
            nextBtn.style.display = 'none';

            q.options.forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerText = opt;
                btn.onclick = () => selectAnswer(idx);
                optionsContainer.appendChild(btn);
            });
        }

        function selectAnswer(selectedIndex) {
            const q = currentQuiz[currentQuestionIndex];
            const buttons = document.querySelectorAll('.option-btn');
            
            // Disable all option buttons after click
            buttons.forEach(btn => btn.disabled = true);

            const selectedOptionText=q.options[selectedIndex];
            
            const isCorrect = selectedOptionText === q.correctAnswer;
            if (isCorrect) score++;

            userAnswers.push({
                question: q.question,
                selected: selectedOptionText,
                correct: q.correctAnswer,
                isCorrect: isCorrect,
                explanation: q.explanation
            });

            if (feedbackMode === 'per-question') {
                buttons[selectedIndex].classList.add(isCorrect ? 'correct' : 'incorrect');
                // buttons[q.answer].classList.add('correct');

                buttons.forEach(btn =>{
                    if (btn.innerText === q.correctAnswer){
                        btn.classList.add('correct');
                    }
                });

                const expBox = document.getElementById('explanation-container');
                expBox.innerText = `Explanation: ${q.explanation}`;
                expBox.style.display = 'block';
            } else {
                buttons[selectedIndex].style.background = '#e0e7ff';
                buttons[selectedIndex].style.borderColor = 'var(--primary)';
            }

            document.getElementById('next-btn').style.display = 'block';
        }

        function nextQuestion() {
            currentQuestionIndex++;
            if (currentQuestionIndex < currentQuiz.length) {
                renderQuestion();
            } else {
                showResults();
            }
        }

        function showResults(){
            navigateTo('results-page');
            document.getElementById('score-text').innerText = `You scored ${score} / ${currentQuiz.length}`;
            
            const summaryContainer = document.getElementById('summary-container');
            summaryContainer.innerHTML = '';

            userAnswers.forEach((res, i) => {
                const item = document.createElement('div');
                item.className = 'result-item';
                item.innerHTML = `
                    <p style="font-weight: 600; margin-bottom: 5px;">${i + 1}. ${res.question}</p>
                    <p style="font-size: 14px;">Your answer: <b>${res.selected}</b> 
                       <span class="badge ${res.isCorrect ? 'badge-success' : 'badge-danger'}">
                           ${res.isCorrect ? 'Correct' : 'Incorrect'}
                       </span>
                    </p>
                    ${!res.isCorrect ? `<p style="font-size: 14px; color: var(--text-light);">Correct answer: <b>${res.correct}</b></p>` : ''}
                    <div class="explanation-box" style="margin-top: 8px;">${res.explanation}</div>
                `;
                summaryContainer.appendChild(item);
            });
        }

