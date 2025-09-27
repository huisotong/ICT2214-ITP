import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Tooltip from "../components/global/Tooltip";
import styles from "../styles/chatpage.module.css";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { FaRobot, FaCog } from "react-icons/fa";

function ChatPage() {
  const { id } = useParams();
  const isAgentChat = window.location.pathname.includes("/chat/agent/");
  const [moduleId] = useState(isAgentChat ? null : id);
  const [agentId] = useState(isAgentChat ? id : null);

  console.log("URL params - id:", id, "isAgentChat:", isAgentChat);
  const { auth } = useAuth();
  const user = auth.user;

  console.log("Auth context:", auth);
  console.log("User object:", user);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [input, setInput] = useState("");
  const [modelDetails, setModelDetails] = useState(null);
  const [agentDetails, setAgentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId] = useState(user.userID); // assume user.userID exists
  const [assignmentCredits, setAssignmentCredits] = useState(null);
  const [lastCost, setLastCost] = useState(null);
  const [userAgents, setUserAgents] = useState([]);
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch model details for modules or agent details for agents
  useEffect(() => {
    async function fetchDetails() {
      try {
        if (moduleId) {
          // Module-based chat
          const res = await fetch(
            `http://localhost:5000/api/get-module-model/${moduleId}`
          );
          const data = await res.json();
          if (res.ok) {
            setModelDetails(data);
          } else {
            console.error("Error fetching model details:", data.error);
          }
        } else if (agentId) {
          // Agent-based chat
          const res = await fetch(
            `http://localhost:5000/api/marketplace/agents/${agentId}`,
            { credentials: "include" }
          );
          const data = await res.json();
          if (data.success) {
            setAgentDetails(data.agent);
          } else {
            console.error("Error fetching agent details:", data.message);
          }
        }
      } catch (err) {
        console.error("Error fetching details:", err);
      }
    }
    fetchDetails();
  }, [moduleId, agentId]);

  // Fetch user's agents for agent selector
  useEffect(() => {
    async function fetchUserAgents() {
      try {
        const res = await fetch(
          "http://localhost:5000/api/marketplace/my-agents",
          {
            credentials: "include",
          }
        );
        const data = await res.json();
        if (data.success) {
          setUserAgents(data.agents);
        }
      } catch (err) {
        console.error("Error fetching user agents:", err);
      }
    }
    fetchUserAgents();
  }, []);

  // load existing chats.
  useEffect(() => {
    if (moduleId) {
      // Load module-based chats
      fetch(`http://localhost:5000/api/get-chat-history/${userId}/${moduleId}`)
        .then((res) => res.json())
        .then((data) => {
          const chatList = data.map((chat) => ({
            id: chat.historyID,
            title: chat.chatlog || "Chat " + chat.historyID,
            dateStarted: chat.dateStarted,
            messages: [],
          }));
          setChats(chatList);
        })
        .catch((err) => console.error("Error fetching chat list:", err));
    } else if (agentId) {
      // For agent-based chats, we'll start with an empty chat list
      // In a real implementation, you might want to store agent chat history separately
      setChats([]);
    }
  }, [userId, moduleId, agentId]);

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

  // Handle New Chat function
  const handleNewChat = () => {
    setSelectedChatId(null);
    setInput("");
    setLastCost(null);
  };

  // Handle Send function
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!user || !user.userID) {
      console.error("User not authenticated or userID missing");
      alert("Please log in to send messages");
      return;
    }

    let currentChatId = selectedChatId;
    if (!currentChatId) {
      const newChat = {
        id: null,
        title: "New Chat",
        messages: [],
      };
      setChats((prev) => [newChat, ...prev]);
    }
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
    setLoading(true);

    const payload = {
      chat_id: selectedChatId ? selectedChatId : null,
      user_id: userId,
      message: messageToSend,
    };

    // Only add module_id or agent_id if they exist and are not null
    if (moduleId && moduleId !== null) {
      payload.module_id = moduleId;
    }
    if (agentId && agentId !== null) {
      payload.agent_id = agentId;
    }

    console.log("Sending payload:", payload);
    console.log("User ID:", userId);
    console.log("Module ID:", moduleId, "Type:", typeof moduleId);
    console.log("Agent ID:", agentId, "Type:", typeof agentId);
    console.log("URL params - id:", id, "isAgentChat:", isAgentChat);

    try {
      // 1) Post to your (now-streaming) /send-message
      const response = await fetch("http://localhost:5000/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(
          `Server error: ${errorData.error || response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error("Stream failed to start - no response body");
      }

      // 2) Read the SSE stream and update the placeholder as tokens arrive
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      const applyChunk = (chunk) => {
        accumulated += chunk;
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === selectedChatId || (!chat.id && selectedChatId === null)
              ? {
                  ...chat,
                  messages: chat.messages.map((m) =>
                    m.placeholder ? { ...m, content: accumulated } : m
                  ),
                }
              : chat
          )
        );
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by a blank line
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;

          const msg = JSON.parse(line.slice(6)); // remove "data: "

          if (msg.type === "token") {
            applyChunk(msg.data);
          } else if (msg.type === "done") {
            // Optional: update credits if your backend included "cost"
            if (typeof msg.cost === "number") {
              setAssignmentCredits((prev) => prev - msg.cost);
              setLastCost(msg.cost);
            }

            // Finalize the placeholder message and set chat_id/title
            setChats((prev) =>
              prev.map((chat) => {
                const isNew = !chat.id && selectedChatId === null;
                const matches = isNew || chat.id === msg.chat_id;
                if (!matches) return chat;
                return {
                  ...chat,
                  id: msg.chat_id ?? chat.id,
                  title: msg.chat_title || chat.title,
                  messages: chat.messages.map((m) =>
                    m.placeholder
                      ? { ...m, content: msg.final, placeholder: false }
                      : m
                  ),
                };
              })
            );
            setSelectedChatId((prev) => prev || msg.chat_id);
            setInput(""); // clear input after success
          } else if (msg.type === "error") {
            // Surface server-side streaming errors to your existing error flow
            throw new Error(msg.message || "Streaming error");
          }
        }
      }
    } catch (error) {
      console.log(error);
      // keep your existing catch block unchanged
      alert(
        "❌ Network error: Failed to send message. Please check your connection and try again."
      );
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === selectedChatId || (!chat.id && selectedChatId === null)
            ? { ...chat, messages: chat.messages.slice(0, -2) }
            : chat
        )
      );
      console.error("Error while sending message:", error);
    }
    setLoading(false);
  };

  const handleSelectChat = (id) => {
    setSelectedChatId(id);
    setLastCost(null);
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  // Fetch assignment credits for this user and module
  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch(
          `http://localhost:5000/api/students-in-module/${moduleId}`
        );
        const data = await res.json();
        // Find the assignment for this user by comparing the correct IDs
        const assignment = data.find((a) => a.userID === userId);
        setAssignmentCredits(assignment ? assignment.studentCredits : null);
      } catch (err) {
        setAssignmentCredits(null);
      }
    }
    fetchCredits();
  }, [moduleId, userId]);

  return (
    <div className={styles.chatPageRoot}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <button className={styles.newChatButton} onClick={handleNewChat}>
          + New Chat
        </button>
        <div className={styles.chatList}>
          {chats.map((chat) => (
            <div
              key={chat.id || Math.random()}
              onClick={() => handleSelectChat(chat.id)}
              className={
                chat.id === selectedChatId
                  ? `${styles.chatListItem} ${styles.chatListItemSelected}`
                  : styles.chatListItem
              }
            >
              <div onClick={(e) => e.stopPropagation()}>{chat.title}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className={styles.mainSection}>
        {/* Top Bar: Model/Agent Selection */}
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
          {moduleId ? (
            <div>
              Model:{" "}
              <span style={{ fontWeight: "bold" }}>
                {modelDetails ? `${modelDetails.model_name}` : "Loading..."}
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FaRobot style={{ color: "#f97316" }} />
              <div>
                Agent:{" "}
                <span style={{ fontWeight: "bold" }}>
                  {agentDetails ? agentDetails.name : "Loading..."}
                </span>
              </div>
            </div>
          )}

          {/* Agent Selector for agent chats */}
          {!moduleId && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowAgentSelector(!showAgentSelector)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                <FaCog />
                Switch Agent
              </button>

              {showAgentSelector && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    zIndex: 10,
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {userAgents.map((userAgent) => (
                    <button
                      key={userAgent.agent.agentID}
                      onClick={() => {
                        window.location.href = `/chat/agent/${userAgent.agent.agentID}`;
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        textAlign: "left",
                        border: "none",
                        background: "white",
                        cursor: "pointer",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.background = "#f9fafb")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.background = "white")
                      }
                    >
                      <div style={{ fontWeight: "500" }}>
                        {userAgent.agent.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        {userAgent.agent.description || "No description"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Show assignment credits next to model */}
          {moduleId && (
            <span
              style={{
                marginLeft: 16,
                fontWeight: 500,
                color:
                  assignmentCredits !== null && assignmentCredits < 0
                    ? "#ea580c"
                    : "#000000",
              }}
            >
              {" "}
              {agentId ? (
                "Free to use"
              ) : (
                <>
                  Credits:{" "}
                  {assignmentCredits !== null
                    ? assignmentCredits.toFixed(5)
                    : "..."}{" "}
                  USD
                </>
              )}
              {!agentId ? (
                lastCost !== null &&
                lastCost > 0 && (
                  <span className={styles.creditsCost}>
                    (-{lastCost.toFixed(5)})
                  </span>
                )
              ) : (
                <span className={styles.creditsCost} style={{ color: "green" }}>
                  (Free)
                </span>
              )}
            </span>
          )}
        </div>
        {/* Chat messages area */}
        <div className={styles.messagesArea}>
          {selectedChat && selectedChat.messages.length > 0 ? (
            selectedChat.messages.map((msg, idx) => (
              <div
                key={idx}
                className={
                  msg.sender === "user"
                    ? `${styles.messageBubble} ${styles.messageBubbleUser}`
                    : styles.messageBubble
                }
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
            <div className={styles.emptyMessage}>Start chatting now</div>
          )}
          <div ref={messagesEndRef} />
        </div>{" "}
        {/* Input box / Form: pinned to bottom */}
        <form
          onSubmit={handleSend}
          className={`${styles.inputForm} ${
            loading ? styles.inputFormLoading : ""
          }`}
        >
          {assignmentCredits !== null && assignmentCredits < 0 && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: "1rem",
                right: "1rem",
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                padding: "8px 12px",
                borderRadius: "6px 6px 0 0",
                border: "1px solid #fecaca",
                borderBottom: "none",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              ⚠️ You have negative credits and cannot submit new prompts. Please
              request additional credits from your instructor.
            </div>
          )}
          <input
            type="text"
            disabled={
              loading || (assignmentCredits !== null && assignmentCredits < 0)
            }
            placeholder={
              assignmentCredits !== null && assignmentCredits < 0
                ? "Cannot send - negative credits"
                : "Type your message..."
            }
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={styles.inputBox}
            style={{
              opacity:
                assignmentCredits !== null && assignmentCredits < 0 ? 0.6 : 1,
            }}
          />
          <button
            type="submit"
            disabled={
              loading || (assignmentCredits !== null && assignmentCredits < 0)
            }
            className={styles.sendButton}
            style={{
              opacity:
                assignmentCredits !== null && assignmentCredits < 0 ? 0.6 : 1,
              cursor:
                assignmentCredits !== null && assignmentCredits < 0
                  ? "not-allowed"
                  : "pointer",
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
