const express = require("express");
const multer = require("multer");

const router = express.Router();

const { generateQuiz } = require("../controllers/quizController");      //../ is important

const upload = multer({                           //multer
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024        // 50 MB
    },
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype === "application/pdf" ||
            file.originalname.toLowerCase().endsWith(".pdf")
        ) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed."));
        }
    }
});

router.post("/generate", upload.single("pdf"), generateQuiz);

module.exports = router;