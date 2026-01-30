import { useMemo, useRef, useState } from "react";
import { API_BASE, AIRPORT } from "../constants/flightConstants";
import { askAi } from "../services/aiService";

const INITIAL_MESSAGE = {
  role: "assistant",
  text: "Ask me about the latest ORD flights, gates, or trends.",
};

function ChatPanel() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !isSending,
    [input, isSending]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const question = (inputRef.current?.value || "").trim();
    if (!question || isSending) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setError(null);
    setIsSending(true);

    try {
      const result = await askAi({
        baseUrl: API_BASE,
        question,
        airport: AIRPORT,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: result.answer || "No response." },
      ]);
    } catch (err) {
      setError(err.message || "Unable to reach the AI assistant.");
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setError(null);
  };

  return (
    <section className="panel chat-panel">
      <div className="panel-head">
        <div>
          <h3>ORD Ops Assistant</h3>
          <p className="chat-subhead">Ask me anything about ORD</p>
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`chat-message ${message.role}`}
          >
            <span>{message.text}</span>
          </div>
        ))}
        {isSending ? (
          <div className="chat-message assistant">
            <span className="chat-loading">Thinking...</span>
          </div>
        ) : null}
      </div>
      {error ? <div className="error-banner chat-error">{error}</div> : null}
      <form className="chat-input" onSubmit={handleSubmit}>
        <textarea
          rows="2"
          ref={inputRef}
          onChange={(event) => setInput(event.target.value)}
          onInput={(event) => setInput(event.target.value)}
          placeholder="Ask about gates, delays, or next departures..."
        />
        <div className="chat-actions">
          <button
            type="button"
            onClick={handleClear}
            disabled={isSending}
            style={{ backgroundColor: "#2f6db3" }}
          >
            Clear
          </button>
          <button type="submit" disabled={!canSend}>
            Send
          </button>
        </div>
      </form>
    </section>
  );
}

export default ChatPanel;
