import React, { useState, useEffect, useRef, useCallback } from "react";
import { Form, Button, InputGroup, Spinner, Alert } from "react-bootstrap";
import { SendFill } from "react-bootstrap-icons";
import { getMessages, sendMessage } from "../../../services/messagingService";
import { useAuth } from "../../../context/AuthContext";
import useAutosizeTextArea from "../../../hooks/useAutosizeTextArea";
import { format, parseISO, isToday, isYesterday } from "date-fns";

const ChatWindow = ({ conversationId, conversation }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const textAreaRef = useRef(null);

  useAutosizeTextArea(textAreaRef.current, newMessage);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(
    async (isInitialLoad = false) => {
      if (!conversationId) return;
      if (isInitialLoad) setLoading(true);
      try {
        const data = await getMessages(conversationId);
        setMessages((currentMessages) =>
          JSON.stringify(currentMessages) !== JSON.stringify(data)
            ? data
            : currentMessages
        );
      } catch (err) {
        setError("Failed to load messages.");
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    },
    [conversationId]
  );

  useEffect(() => {
    if (conversationId) {
      fetchMessages(true);
      const interval = setInterval(() => fetchMessages(false), 5000);
      return () => clearInterval(interval);
    }
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content: newMessage,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      sender_type: user.role,
      sender_name: user.name,
      status: "sending",
    };
    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
    setNewMessage("");
    try {
      const sentMessage = await sendMessage(
        conversationId,
        optimisticMessage.content
      );
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.id === tempId ? sentMessage : msg))
      );
    } catch (err) {
      setError("Failed to send message.");
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === tempId ? { ...msg, status: "failed" } : msg
        )
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatMessageTime = (isoString, status) => {
    if (status === "sending") return "Sending...";
    if (status === "failed") return "Failed to send";
    if (!isoString) return "";
    const date = parseISO(isoString);
    if (isToday(date)) return format(date, "p");
    if (isYesterday(date)) return `Yesterday at ${format(date, "p")}`;
    return format(date, "MMM d, yyyy 'at' p");
  };

  const isMyMessage = (msg) => {
    if (!user || !msg) return false;
    // THIS IS THE FIX: Check both sender_type AND sender_id
    return user.role === msg.sender_type && user.id === msg.sender_id;
  };

  if (!conversationId) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-muted">
        Select a conversation to start chatting.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      <div className="chat-header">
        <h5>{conversation?.participant_names || "Chat"}</h5>
      </div>
      <div className="chat-messages">
        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}
        {messages.map((msg) => {
          const isMe = isMyMessage(msg);
          return (
            <div
              key={msg.id}
              className={`message-bubble ${isMe ? "sent" : "received"} ${
                msg.status === "sending" ? "sending" : ""
              }`}
            >
              <div className="message-content">
                {!isMe && <div className="sender-name">{msg.sender_name}</div>}
                <p
                  style={{
                    color: msg.status === "failed" ? "red" : "inherit",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.content}
                </p>
                <div className="timestamp">
                  {formatMessageTime(msg.created_at, msg.status)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <Form onSubmit={handleSendMessage}>
          <InputGroup>
            <Form.Control
              as="textarea"
              ref={textAreaRef}
              rows={1}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              variant="primary"
              type="submit"
              className="rounded-circle ms-2"
            >
              <SendFill />
            </Button>
          </InputGroup>
        </Form>
      </div>
    </>
  );
};

export default ChatWindow;
