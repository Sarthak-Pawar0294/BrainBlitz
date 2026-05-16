// ── BrainBlitz · js/ai.js ──

// Point the API URL to your new Vercel serverless function
const API_URL = "/api/generate";

// ── Generate quiz questions
async function generateQuiz(topic, difficulty, count) {
  const prompt = `Generate exactly ${count} multiple choice quiz questions about "${topic}" at ${difficulty} difficulty level.
Return ONLY a raw JSON array. No markdown. No code fences. No explanation. Just the JSON array.
Format exactly like this:
[
  {
    "question": "What is the capital of France?",
    "options": ["Paris", "London", "Berlin", "Madrid"],
    "answer": "Paris"
  }
]

Rules:
- Exactly 4 options per question
- The answer field must exactly match one of the options word for word
- Do NOT include A. B. C. D. or any letter/number prefix inside the option text
- Do NOT use apostrophes or special characters in any text
- Options must be plain text only, no punctuation prefixes
- Questions must be factual and clear`;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
      // Authorization header removed because the backend handles it now
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("API error:", errText);
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const raw  = data.choices[0].message.content;

  // Extract JSON array robustly
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("AI returned invalid format. Please try again.");

  // Fix common issues in AI JSON responses
  const cleaned = match[0]
    .replace(/[\u2018\u2019]/g, "'")   // smart single quotes
    .replace(/[\u201C\u201D]/g, '"')   // smart double quotes
    .replace(/\r?\n/g, ' ')            // newlines inside strings
    .trim();

  return JSON.parse(cleaned);
}

// ── Explain a wrong answer
async function explainAnswer(question, correctAnswer) {
  const prompt = `In 2 to 3 simple sentences, explain why "${correctAnswer}" is the correct answer to this question: "${question}". Be clear and educational. Use plain language.`;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 200
    })
  });

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// ── AI performance summary
async function getPerformanceSummary(topic, score, total, wrongQuestions) {
  const wrongList = wrongQuestions.length > 0
    ? `The student got these questions wrong: ${wrongQuestions.slice(0, 3).join(". ")}`
    : "The student answered all questions correctly.";

  const prompt = `A student scored ${score} out of ${total} on a quiz about "${topic}". ${wrongList}.
Write 2 to 3 sentences of encouraging feedback and suggest what to study next. Keep it friendly and motivating.`;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 200
    })
  });

  const data = await response.json();
  return data.choices[0].message.content.trim();
}