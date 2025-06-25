import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Tooltip from "../components/global/Tooltip";
import styles from "../styles/chatpage.module.css";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

function ChatPage() {
  const { id } = useParams();
  const [moduleId] = useState(id);
  const { auth } = useAuth();
  const user = auth.user;
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [input, setInput] = useState("");
  const [modelDetails, setModelDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId] = useState(user.userID); // assume user.userID exists
  const [assignmentCredits, setAssignmentCredits] = useState(null);
  const [lastCost, setLastCost] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    async function fetchModelDetails() {
      try {
        const res = await fetch(
          `http://localhost:5000/api/get-module-model/${moduleId}`
        );
        const data = await res.json();
        if (res.ok) {
          setModelDetails(data);
        } else {
          console.error("Error fetching model details:", data.error);
        }
      } catch (err) {
        console.error("Error fetching model details:", err);
      }
    }
    fetchModelDetails();
  }, [moduleId]);

  // load existing chats.
  useEffect(() => {
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
  }, [userId, moduleId]);

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
    setLastCost(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

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
    setInput("");
    setLoading(true);

    const payload = {
      chat_id: selectedChatId ? selectedChatId : null,
      user_id: userId,
      module_id: moduleId,
      message: messageToSend,
    };

    try {
      const response = await fetch("http://localhost:5000/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.cost) {
          setAssignmentCredits((prev) => prev - data.cost);
          setLastCost(data.cost);
        }
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

  const handleSelectChat = (id) => {
    setSelectedChatId(id);
    setLastCost(null);
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  // Fetch assignment credits for this user and module
  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch(`http://localhost:5000/api/students-in-module/${moduleId}`);
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
          <div>
            Model:{" "}
            <span style={{ fontWeight: "bold" }}>
              {modelDetails
                ? `${modelDetails.model_name}`
                : "Loading..."}
            </span>
          </div>
          {/* Show assignment credits next to model */}
          <span style={{ marginLeft: 16, fontWeight: 500, color: '#000000' }}>
            Credits: {assignmentCredits !== null ? assignmentCredits.toFixed(5) : '...'} USD
            {lastCost > 0 && (
              <span style={{ color: 'red', marginLeft: '8px' }}>
                (-{lastCost.toFixed(5)})
              </span>
            )}
          </span>
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
        </div>

        {/* Input box / Form: pinned to bottom */}
        <form
          onSubmit={handleSend}
          className={`${styles.inputForm} ${
            loading ? styles.inputFormLoading : ""
          }`}
        >
          <input
            type="text"
            disabled={loading}
            placeholder="Type your message..."
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={styles.inputBox}
          />
          <button
            type="submit"
            disabled={loading}
            className={styles.sendButton}
          >
            {loading ? "Generating..." : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default ChatPage;
