import { useState } from "react";
import styles from "../styles/global.module.css";

// Mock data for chats and models
const mockChats = [
  { id: 1, title: "Math Homework", messages: [{ role: "assistant", content: "What can I help with?" }] },
  { id: 2, title: "Project Ideas", messages: [{ role: "assistant", content: "What can I help with?" }] },
];
const mockModels = ["GPT-3.5", "GPT-4", "GPT-4o"];

function ChatPage() {
  const [chats, setChats] = useState(mockChats);
  const [selectedChatId, setSelectedChatId] = useState(mockChats[0].id);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(mockModels[0]);
  const [showParams, setShowParams] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(1);
  const [presencePenalty, setPresencePenalty] = useState(0);
  const [frequencyPenalty, setFrequencyPenalty] = useState(0);

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    // Add user message
    const updatedChats = chats.map((chat) =>
      chat.id === selectedChatId
        ? {
            ...chat,
            messages: [
              ...chat.messages,
              { role: "user", content: input },
              // Mock assistant reply
              { role: "assistant", content: "This is a mock reply." },
            ],
          }
        : chat
    );
    setChats(updatedChats);
    setInput("");
  };

  const handleNewChat = () => {
    const newId = Date.now();
    const newChat = {
      id: newId,
      title: "New Chat",
      messages: [{ role: "assistant", content: "What can I help with?" }],
    };
    setChats([newChat, ...chats]);
    setSelectedChatId(newId);
  };

  const handleSelectChat = (id) => setSelectedChatId(id);

  const handleEditTitle = (id, newTitle) => {
    setChats(
      chats.map((chat) =>
        chat.id === id ? { ...chat, title: newTitle } : chat
      )
    );
  };

  return (
    <div style={{ display: "flex", flex: 1, background: "#f3f4f6" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          background: "#fff",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          onClick={handleNewChat}
          style={{
            margin: "1rem",
            padding: "0.75rem",
            background: "#4a90e2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          + New Chat
        </button>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              style={{
                padding: "0.75rem 1rem",
                background:
                  chat.id === selectedChatId ? "#e0e7ef" : "transparent",
                cursor: "pointer",
                borderBottom: "1px solid #f1f1f1",
                fontWeight: chat.id === selectedChatId ? "bold" : "normal",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                style={{
                  border: "none",
                  background: "transparent",
                  fontWeight: "inherit",
                  width: "100%",
                  outline: "none",
                }}
                value={chat.title}
                onChange={(e) => handleEditTitle(chat.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top bar: Model selection and parameters */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "1rem",
            borderBottom: "1px solid #e5e7eb",
            background: "#f9fafb",
            gap: 16,
            position: "relative",
          }}
        >
          <label>
            Model:{" "}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{ padding: "0.25rem 0.5rem", borderRadius: 4 }}
            >
              {mockModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => setShowParams((v) => !v)}
            style={{
              marginLeft: "auto",
              padding: "0.25rem 0.75rem",
              border: "1px solid #4a90e2",
              background: "#fff",
              color: "#4a90e2",
              borderRadius: 4,
              cursor: "pointer",
              position: "relative",
              zIndex: 2,
            }}
          >
            Adjust Parameters
          </button>
          {showParams && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                padding: "1rem 1.5rem",
                minWidth: 260,
                width: 300,
                zIndex: 10,
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <label>
                  <strong>Temperature</strong>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <span style={{ marginLeft: 8 }}>{temperature}</span>
                </label>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>
                  <strong>Top P</strong>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={topP}
                    onChange={(e) => setTopP(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <span style={{ marginLeft: 8 }}>{topP}</span>
                </label>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>
                  <strong>Presence Penalty</strong>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={presencePenalty}
                    onChange={(e) => setPresencePenalty(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <span style={{ marginLeft: 8 }}>{presencePenalty}</span>
                </label>
              </div>
              <div>
                <label>
                  <strong>Frequency Penalty</strong>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={frequencyPenalty}
                    onChange={(e) => setFrequencyPenalty(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <span style={{ marginLeft: 8 }}>{frequencyPenalty}</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Chat messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {selectedChat.messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                background:
                  msg.role === "user" ? "#4a90e2" : "#e5e7eb",
                color: msg.role === "user" ? "#fff" : "#222",
                padding: "0.75rem 1.25rem",
                borderRadius: 16,
                maxWidth: "70%",
                fontSize: 16,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              {msg.content}
            </div>
          ))}
        </div>

        {/* Input box */}
        <form
          onSubmit={handleSend}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "1rem",
            borderTop: "1px solid #e5e7eb",
            background: "#fff",
            gap: 12,
          }}
        >
          <input
            type="text"
            placeholder={
              selectedChat.messages.length === 1
                ? "What can I help with?"
                : "Type your message..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 16,
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.75rem 1.5rem",
              background: "#4a90e2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}

export default ChatPage;