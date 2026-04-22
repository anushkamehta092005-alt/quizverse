import React, { useState, useEffect } from "react";
import "./App.css";

const BASE_URL = "https://quizverse-backend-rt10.onrender.com";

function App() {
  const [screen, setScreen] = useState("start");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState("easy");
  const [time, setTime] = useState(60);
  const [topic, setTopic] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  // 🚀 FETCH QUESTIONS
  const fetchQuestions = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, difficulty }),
      });

      const data = await res.json();
      const text = data[0]?.generated_text;

      const parsed = parseQuestions(text);

      setQuestions(parsed);
      setCurrentQ(0);
      setScore(0);
      setTime(60);
      setUserAnswers([]);
      setScreen("quiz");
      setLoading(false);
    } catch (err) {
      alert("Error loading quiz 😥");
      setLoading(false);
    }
  };

  // 🧠 PARSE QUESTIONS
  const parseQuestions = (text) => {
    const blocks = text.split("Question:");
    const result = [];

    blocks.forEach((block) => {
      const lines = block.split("\n").filter(Boolean);

      if (lines.length >= 6) {
        result.push({
          question: lines[0],
          options: [
            lines[1]?.replace("A)", "").trim(),
            lines[2]?.replace("B)", "").trim(),
            lines[3]?.replace("C)", "").trim(),
            lines[4]?.replace("D)", "").trim(),
          ],
          answer: lines[5]?.replace("Answer:", "").trim(),
        });
      }
    });

    return result.slice(0, 5);
  };

  // ⏱ TIMER
  useEffect(() => {
    if (screen !== "quiz") return;

    if (time === 0) {
      handleAnswer(null);
      return;
    }

    const timer = setTimeout(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time, screen]);

  // 🎯 HANDLE ANSWER
  const handleAnswer = (option) => {
    setUserAnswers((prev) => [...prev, option]);

    if (option === questions[currentQ]?.answer) {
      setScore((prev) => prev + 1);
    }

    const next = currentQ + 1;

    if (next < questions.length) {
      setCurrentQ(next);
      setTime(60);
    } else {
      saveScore();
      fetchLeaderboard();
      setScreen("result");
    }
  };

  // 💾 SAVE SCORE
  const saveScore = async () => {
    try {
      await fetch(`${BASE_URL}/save-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, score, topic }),
      });
    } catch (err) {
      console.log(err);
    }
  };

  // 🏆 GET LEADERBOARD
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${BASE_URL}/leaderboard`);
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="container">

      {/* START SCREEN */}
      {screen === "start" && (
        <>
          <h1 className="title">QUIZVERSE 🚀</h1>

          <input
            className="input"
            placeholder="Enter your name"
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="input"
            placeholder="Enter topic"
            onChange={(e) => setTopic(e.target.value)}
          />

          <select
            className="input"
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <button className="button" onClick={fetchQuestions}>
            Start Quiz 🧠
          </button>

          {loading && <p>Loading...</p>}
        </>
      )}

      {/* QUIZ SCREEN */}
      {screen === "quiz" && (
        <>
          <h3>⏱️ Time Left: {time}s</h3>

          <h2 className="question">{questions[currentQ]?.question}</h2>

          {questions[currentQ]?.options.map((opt, i) => {
            const labels = ["A", "B", "C", "D"];

            return (
              <button
                key={i}
                className="option-btn"
                onClick={() => handleAnswer(opt)}
              >
                <span className="option-label">{labels[i]}.</span> {opt}
              </button>
            );
          })}

          <p>
            Question {currentQ + 1} / {questions.length}
          </p>
        </>
      )}

      {/* RESULT SCREEN */}
      {screen === "result" && (
        <>
          <h1>🎉 Quiz Completed!</h1>
          <h2>Score: {score} / {questions.length}</h2>

          {questions.map((q, i) => {
            const isCorrect = userAnswers[i] === q.answer;

            return (
              <div key={i} className="result-box">
                <p><b>Q{i + 1}:</b> {q.question}</p>
                <p>
                  Your Answer:
                  <span style={{ color: isCorrect ? "lightgreen" : "red" }}>
                    {" "}{userAnswers[i] || "Not answered"}
                  </span>
                </p>
                {!isCorrect && (
                  <p style={{ color: "lightgreen" }}>
                    Correct Answer: {q.answer}
                  </p>
                )}
              </div>
            );
          })}

          <h2>🏆 Leaderboard</h2>

          {leaderboard.map((user, i) => {
            let medal = "";
            if (i === 0) medal = "🥇";
            else if (i === 1) medal = "🥈";
            else if (i === 2) medal = "🥉";

            return (
              <div key={i} className="leaderboard-item">
                <span className="medal">
                  {medal || `${i + 1}.`}
                </span>
                {user.name} — {user.score}
              </div>
            );
          })}

          <button onClick={() => window.location.reload()}>
            Play Again 🔁
          </button>
        </>
      )}

    </div>
  );
}

export default App;
