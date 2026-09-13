 // App State
        let uploadedFileName = "";
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


function handleLogin(event) {
    event.preventDefault(); // Prevents page reload on form submit
    
    const login = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    //retrieve stored credentials
    const savedUsername= localStorage.getItem('savedUsername');
    const savedPassword= localStorage.getItem('savedPassword');

    // Simple authentication check
    if (login === savedUsername && password === savedPassword) {
        toggleAuth('dashboard-page');
    } else{
        alert("invalid username or password!")
    }
}

function handleSignup(event) {
    event.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;

    if ( username && password) {
       // saving credentials
       localstorage.setitem('savedUsername', username);
       localstorage.setitem('savedPassword', password);

       alert("signup successful!")
       toggleAuth('login');
    } else {
        alert('Please complete all fields to sign up.');
    }
}

        function toggleAuth(type) {
            if (type === 'signup') {
                document.getElementById('login-form').style.display = 'none';
                document.getElementById('signup-form').style.display = 'block';
            } else {
                document.getElementById('login-form').style.display = 'block';
                document.getElementById('signup-form').style.display = 'none';
            }
        }


        // File Upload Processing
        function handleFileUpload(event) {
            const file = event.target.files[0];
            if (file) {
                uploadedFileName = file.name;
                document.getElementById('file-title').innerText = `Configure Quiz for: ${uploadedFileName}`;
                navigateTo('config-page');
            }
        }



        // Mock AI Quiz Generation based on settings
                async function startQuiz(){

                const difficulty =document.getElementById('difficulty-select').value;

                const feedbackMode = document.getElementById('feedback-mode-select').value;

                try{
                    const response = await fetch(
                        "http://localhost:5000/api/quiz/generate",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({
                                fileName: uploadedFileName,
                                difficulty: difficulty,
                                feedbackMode: feedbackMode,
                                noofquestions: 10
                            })
                        }
                    );

                    const data =await response.json();
                    console.log("backend response:", data);

                    if(!data.success) {
                        alert("quiz generation failed:(");
                        return;
                    }

                    //store quiz from backend
                    currentQuiz= data.quiz.questions;

                    //continue with existing quiz display code
                    navigate('quiz-page');

                }catch (error){
                    console.error("backend error:", error);

                    alert("couldn't connect to backend. is the server running?");
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
            
            const isCorrect = selectedIndex === q.answer;
            if (isCorrect) score++;

            userAnswers.push({
                question: q.question,
                selected: q.options[selectedIndex],
                correct: q.options[q.answer],
                isCorrect: isCorrect,
                explanation: q.explanation
            });

            if (feedbackMode === 'per-question') {
                buttons[selectedIndex].classList.add(isCorrect ? 'correct' : 'incorrect');
                buttons[q.answer].classList.add('correct');

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

        function showResults() {
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

