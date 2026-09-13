const express= require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) =>{
    res.json({
        message: "AI DRIVEN QUIZ GENERATOR BACKEND IS RUNNING!"
    });
});

// generate  quiz api
app.post("/api/quiz/generate", (req, res)=> {

    const{fileName, difficulty, feedbackMode, numberOfQuestions} = req.body;

    console.log("file:",fileName);
    console.log("Difficulty:", difficulty);
    console.log("explanation:", feedbackMode);
    console.log("noofquestions:", numberOfQuestions);



    res.json({
    success: true,
    message: "quiz request received!",
    quiz: {
        file: fileName,
        Difficulty: difficulty,
        explanation: feedbackMode,
        noofquestions: numberOfQuestions
    }
});
});

const PORT= 5000;

app.listen(PORT, () =>{
    console.log('server running on http://localhost:${PORT}');
});



//mysql connection
// const mysql = require("mysql2");

// const db = mysql.createPool({
//     host: "localhost",
//     user: "root",
//     password: "YOUR_MYSQL_PASSWORD",
//     database: "quizzy"
// });

// db.getConnection((err, connection) => {
//     if (err) {
//         console.error("MySQL connection failed:", err.message);
//         return;
//     }

//     console.log("MySQL connected successfully");
//     connection.release();
// });