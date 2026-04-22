const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// ✅ FIX FETCH
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

// ✅ FIX PORT FOR DEPLOYMENT
const PORT = process.env.PORT || 5000;

// 🔥 CONNECT MONGODB
mongoose.connect("mongodb+srv://admin:12345@cluster0.n1te5aa.mongodb.net/?appName=Cluster0")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// 🔥 SCHEMA
const ScoreSchema = new mongoose.Schema({
  name: String,
  score: Number,
  topic: String,
  date: { type: Date, default: Date.now }
});

const Score = mongoose.model("Score", ScoreSchema);

// 🔥 CATEGORY MAPPING
function getCategory(topic) {
  if (!topic) return "";

  const t = topic.toLowerCase();

  if (t.includes("sport")) return 21;
  if (t.includes("history")) return 23;
  if (t.includes("geo")) return 22;
  if (t.includes("movie")) return 11;
  if (t.includes("music")) return 12;
  if (t.includes("science")) return 17;
  if (t.includes("math")) return 19;
  if (t.includes("computer") || t.includes("coding")) return 18;

  return "";
}

// 🔥 QUIZ API
app.post("/generate", async (req, res) => {
  const { difficulty, topic } = req.body;

  try {
    const category = getCategory(topic);

    const url = `https://opentdb.com/api.php?amount=5${
      category ? `&category=${category}` : ""
    }&difficulty=${difficulty}&type=multiple`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.results) {
      return res.status(500).json({ error: "No questions found" });
    }

    const formatted = data.results.map((q) => {
      const options = [...q.incorrect_answers, q.correct_answer]
        .sort(() => Math.random() - 0.5);

      return {
        question: q.question,
        options,
        answer: q.correct_answer,
      };
    });

    const text = formatted
      .map(
        (q) => `Question: ${q.question}
A) ${q.options[0]}
B) ${q.options[1]}
C) ${q.options[2]}
D) ${q.options[3]}
Answer: ${q.answer}`
      )
      .join("\n");

    res.json([{ generated_text: text }]);

  } catch (err) {
    console.log("🔥 ERROR:", err);
    res.status(500).json({ error: "Error fetching quiz" });
  }
});

// 🔥 SAVE SCORE
app.post("/save-score", async (req, res) => {
  const { name, score, topic } = req.body;

  try {
    const newScore = new Score({ name, score, topic });
    await newScore.save();
    res.json({ message: "Score saved" });
  } catch (err) {
    res.status(500).json({ error: "Error saving score" });
  }
});

// 🔥 LEADERBOARD
app.get("/leaderboard", async (req, res) => {
  const scores = await Score.find().sort({ score: -1 }).limit(10);
  res.json(scores);
});

app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});