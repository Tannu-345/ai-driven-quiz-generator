const { GoogleGenAI } = require("@google/genai");
const {PDFParse}= require("pdf-parse");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const generateQuiz = async (req, res) => {
    let parser;
    try {
        const { fileName,topic, difficulty, noofquestions,feedbackMode } = req.body;
        const quizIdentifier= topic || fileName;
        const pdfFile= req.file;

        if (!difficulty || !noofquestions || !feedbackMode) {
            return res.status(400).json({
                success: false,
                message: "difficulty, feedbackMode and number of questions are required."
            });
        }

        let sourceText;

        //generate from pdf
        if(pdfFile){
            if(!pdfFile.buffer){
                return res.status(400).json({
                    success: false,
                    message: "the uploaded folder can't be read."
                });
           }

           parser= new PDFParse({
            data: pdfFile.buffer
           });

           const pdfData= await parser.getText();
           sourceText= pdfData.text;

           if(!sourceText || !sourceText.trim()){
            return res.status(400).json({
                success: false,
                message: "No readable text was found in the PDF. Scanned PDFs may require OCR."
            });
           }

           // Limit the amount of document text sent to Gemini
            sourceText = sourceText.slice(0, 40000);
        }

         // OPTION 2: Generate questions from a filename/topic
        else if (quizIdentifier && quizIdentifier.trim()) {
            sourceText = `Generate questions about the topic: ${quizIdentifier}`;
        }

        // Neither a PDF nor a filename was provided
        else {
            return res.status(400).json({
                success: false,
                message: "Please provide a topic or upload a PDF."
            });
        }

        const prompt = `
Generate ${noofquestions} multiple-choice quiz questions
at ${difficulty} difficulty.

Source material:
${sourceText}

Requirements:
- Base questions on the supplied source material.
- Each question must have exactly four options.
- Only one option must be correct.
- Include the correct answer for each question.
- Include a clear explaination of why the correct answer is right.
- Avoid repeating questions.
- Feedback mode: ${feedbackMode}.
- Return only valid JSON in this format:

{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation":"explain why option A is correct."
    }
  ]
}
`;


let response;
let retries = 3;

for (let attempt = 1; attempt <= retries; attempt++) {
    try {
        response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt
        });

        break;
    } catch (error) {
        const status = error.status || error.code;

        if (status !== 503 || attempt === retries) {
            throw error;
        }

        const delay = attempt * 5000;

        console.log(
            `Gemini is temporarily unavailable. Retrying in ${delay / 1000} seconds...`
        );

        await new Promise(resolve => setTimeout(resolve, delay));
    }
}


        const output = response.text;

        if (!output) {
            throw new Error("Gemini returned an empty response.");
        }

        let quiz;

          try {
            const start = output.indexOf("{");
            const end = output.lastIndexOf("}");

            if (start === -1 || end === -1 || end <= start) {
            throw new Error("Gemini did not return a valid JSON object.");
        }

         const cleanedOutput = output.slice(start, end + 1);

                // console.log("CLEANED GEMINI OUTPUT:",cleanedOutput);
            quiz = JSON.parse(cleanedOutput);

            if (!Array.isArray(quiz.questions)) {
                throw new Error("The response does not contain a questions array.");
            }
        } catch (parseError) {
            console.error("JSON parsing error:",parseError.message);
            console.error("Gemini returned invalid JSON:", output);

            return res.status(502).json({
                success: false,
                message: "The AI returned an invalid quiz format. Please try again."
            });
        }

        return res.json({
            success: true,
            quiz
        });

    } catch (error) {
        console.error("AI Quiz Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate quiz.",
            error: error.message
        });

    } finally {
        if (parser) {
            try {
                await parser.destroy();
            } catch (error) {
                console.error("PDF parser cleanup error:", error.message);
            }
        }
};
}
module.exports = { generateQuiz };