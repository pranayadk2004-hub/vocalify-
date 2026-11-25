import { useState } from "react";
import "./App.css";

const languages = [
  { name: "English", code: "en" },
  { name: "Hindi", code: "hi" },
  { name: "Marathi", code: "mr" },
  { name: "Gujarati", code: "gu" },
  { name: "Spanish", code: "es" },
  { name: "French", code: "fr" },
  { name: "German", code: "de" },
];

function App() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en");
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateSpeech() {
    if (!text.trim()) {
      setError("Please enter some text first.");
      return;
    }

    setLoading(true);
    setError("");
    setAudioUrl("");

    try {
      const response = await fetch("http://127.0.0.1:5000/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Speech generation failed.");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (err) {
      setError(err.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  function clearText() {
    setText("");
    setAudioUrl("");
    setError("");
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <span className="brand-icon">◖</span>
          <span>Vocalify</span>
        </div>
        <span className="nav-tag">AI TEXT TO SPEECH</span>
      </header>

      <main className="main">
        <section className="hero">
          <div className="eyebrow">YOUR TEXT, SPOKEN BEAUTIFULLY</div>
          <h1>
            Turn words into
            <br />
            <span>natural speech.</span>
          </h1>
          <p>
            Transform your text into audio in seconds.
            Select a language and let your words come alive.
          </p>
        </section>

        <section className="workspace">
          <div className="section-title">
            <h2>Create your audio</h2>
            <span className="live">● READY</span>
          </div>

          <label htmlFor="text">Your text</label>

          <textarea
            id="text"
            placeholder="Type or paste your text here..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError("");
            }}
            maxLength={5000}
          />

          <div className="counter">
            {text.length} / 5000 characters
          </div>

          <div className="controls">
            <div className="language-control">
              <label htmlFor="language">Language</label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="generate"
              onClick={generateSpeech}
              disabled={loading}
            >
              {loading ? "Generating..." : "✦ Generate Speech"}
            </button>
          </div>

          {error && <div className="error">{error}</div>}

          {audioUrl && (
            <div className="audio-result">
              <h3>Your audio is ready!</h3>
              <audio controls src={audioUrl} />
              <a
                className="download"
                href={audioUrl}
                download="speech.mp3"
              >
                Download MP3
              </a>
            </div>
          )}

          <button className="clear" onClick={clearText}>
            Clear text
          </button>
        </section>

        <section className="features">
          <div className="feature">
            <span>🌍</span>
            <h3>Multiple languages</h3>
            <p>Convert text in several languages.</p>
          </div>
          <div className="feature">
            <span>⚡</span>
            <h3>Fast generation</h3>
            <p>Create speech with just one click.</p>
          </div>
          <div className="feature">
            <span>🎧</span>
            <h3>Listen & download</h3>
            <p>Play your audio or save it as MP3.</p>
          </div>
        </section>
      </main>

      <footer>
        Made with ♥ for your words
      </footer>
    </div>
  );
}

export default App;