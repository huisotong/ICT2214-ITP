import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom"; // For route params
import Tooltip from "../components/global/Tooltip";
import styles from "../styles/global.module.css";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

const mockModels = ["GPT-3.5", "GPT-4", "GPT-4o"];

function ChatPage() {
  const { id } = useParams();
  const [moduleId] = useState(id);
  const { auth } = useAuth();
  const user = auth.user;
  const [chats, setChats] = useState([]); // Sidebar chat list
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(mockModels[0]);
  const [loading, setLoading] = useState(false);
  const [userId] = useState(user.userID); // assume user.userID exists

  // Ref for scrolling to bottom of the messages area
  const messagesEndRef = useRef(null);

  const inputRef = useRef(null);
  // Function to scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // load existing chats.
  useEffect(() => {
    fetch(`http://localhost:5000/api/get-chat-history/${userId}/${moduleId}`)
      .then((res) => res.json())
      .then((data) => {
        const chatList = data.map((chat) => ({
          id: chat.historyID,
          title: chat.chatlog || "Chat " + chat.historyID,
          dateStarted: chat.dateStarted,
          messages: [], // Will be loaded when chat is selected.
        }));
        setChats(chatList);
      })
      .catch((err) => console.error("Error fetching chat list:", err));
  }, [userId, moduleId]);

  // When a chat is selected, load its messages.
  useEffect(() => {
    if (selectedChatId) {
      fetch(`http://localhost:5000/api/get-chat-message/${selectedChatId}`)
        .then((res) => res.json())
        .then((data) => {
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === selectedChatId ? { ...chat, messages: data } : chat
            )
          );
        })
        .catch((err) => console.error("Error fetching chat messages:", err));
    }
  }, [selectedChatId]);

  
  useEffect(() => {
    scrollToBottom();
  }, [selectedChatId, chats]);

  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  
  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  
  const handleNewChat = () => {
    setSelectedChatId(null);
    setInput("");
  };

  // When sending a message.
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    let currentChatId = selectedChatId;
    if (!currentChatId) {
      // For new chat, create a temp chat.
      const newChat = {
        id: null, 
        title: "New Chat",
        messages: [],
      };
      setChats((prev) => [newChat, ...prev]);
    }
    // Append user's message and a placeholder for the AI response.
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === selectedChatId || (!chat.id && selectedChatId === null)
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  sender: "user",
                  content: input,
                  timestamp: new Date().toISOString(),
                },
                {
                  sender: "ai",
                  content: "Generating...",
                  timestamp: new Date().toISOString(),
                  placeholder: true,
                },
              ],
            }
          : chat
      )
    );
    const messageToSend = input;
    setInput("");
    setLoading(true);

    // Prepare payload: include user_id if no chat exists.
    const payload = {
      chat_id: selectedChatId ? selectedChatId : null,
      user_id: selectedChatId ? undefined : userId,
      module_id: moduleId,
      message: messageToSend,
      // model: selectedModel,
    };

    try {
      const response = await fetch("http://localhost:5000/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        const updatedChatId = data.chat_id;
        setChats((prevChats) =>
          prevChats.map((chat) => {
            if (!chat.id && selectedChatId === null) {
              return {
                ...chat,
                id: updatedChatId,
                title: data.chat_title ? data.chat_title : chat.title,
                messages: chat.messages.map((msg) =>
                  msg.placeholder
                    ? { ...msg, content: data.bot_response, placeholder: false }
                    : msg
                ),
              };
            } else if (chat.id === updatedChatId) {
              return {
                ...chat,
                title: data.chat_title ? data.chat_title : chat.title,
                messages: chat.messages.map((msg) =>
                  msg.placeholder
                    ? { ...msg, content: data.bot_response, placeholder: false }
                    : msg
                ),
              };
            }
            return chat;
          })
        );
        setSelectedChatId(updatedChatId);
      } else {
        console.error("Error sending message:", data.error);
      }
    } catch (error) {
      console.error("Error while sending message:", error);
    }
    setLoading(false);
  };

  const handleSelectChat = (id) => setSelectedChatId(id);

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        height: "calc(100vh - 64px)",
        background: "#f3f4f6",
      }}
    >
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
              key={chat.id || Math.random()}
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
              <div onClick={(e) => e.stopPropagation()}>{chat.title}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top Bar: Model Selection */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "1rem",
            borderBottom: "1px solid #e5e7eb",
            background: "#f9fafb",
            gap: 16,
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
        </div>

        {/* Chat messages area */}
        <div
          style={{
            flex: 1, 
            overflowY: "auto",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            justifyContent:
              selectedChat && selectedChat.messages.length
                ? "flex-start"
                : "center",
            alignItems: "center",
            textAlign: "center",
            background: "#F9FAFC",
          }}
        >
          {selectedChat && selectedChat.messages.length > 0 ? (
            selectedChat.messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  background: msg.sender === "user" ? "#4a90e2" : "#e5e7eb",
                  color: msg.sender === "user" ? "#fff" : "#222",
                  padding: "0.75rem 1.25rem",
                  borderRadius: 16,
                  maxWidth: "70%",
                  fontSize: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  textAlign: msg.sender === "user" ? "right" : "left",
                }}
                onClick={() => console.log("Boop", msg.content)}
              >
                {msg.sender === "ai" && !msg.placeholder ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      p: ({ node, children, ...props }) => {
                        const textContent =
                          React.Children.toArray(children).join("");
                        const hasNewline = textContent.includes("\n");
                        return (
                          <p
                            style={{ margin: hasNewline ? "0.5em 0" : "0" }}
                            {...props}
                          >
                            {children}
                          </p>
                        );
                      },
                      li: ({ node, children, ...props }) => {
                        const textContent =
                          React.Children.toArray(children).join("");
                        const hasNewline = textContent.includes("\n");
                        return (
                          <li
                            style={{ margin: hasNewline ? "0.5em 0" : "0" }}
                            {...props}
                          >
                            {children}
                          </li>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                )}
              </div>
            ))
          ) : (
            <div style={{ color: "#888", fontSize: 18 }}>
              Start chatting now
            </div>
          )}
          {/* Dummy div to anchor auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box / Form: pinned to bottom */}
        <form
          onSubmit={handleSend}
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            padding: "1rem",
            borderTop: "1px solid #e5e7eb",
            gap: 12,
            opacity: loading ? 0.6 : 1,
            background: loading ? "#f2f2f2" : "#fff",
          }}
        >
          <input
            type="text"
            disabled={loading}
            placeholder="Type your message..."
            ref={inputRef}
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
            disabled={loading}
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
            {loading ? "Generating..." : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default ChatPage;
