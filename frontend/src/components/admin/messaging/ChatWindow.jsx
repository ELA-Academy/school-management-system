import React, { useState, useEffect, useRef } from "react";
import { Form, Button, InputGroup, Spinner, Alert } from "react-bootstrap";
import { SendFill } from "react-bootstrap-icons";
import { getMessages, sendMessage } from "../../../services/messagingService";
import { useAuth } from "../../../context/AuthContext";
import { format, parseISO, isToday, isYesterday } from "date-fns";

const ChatWindow = ({ conversationId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        if (messages.length === 0) setLoading(true);
        const data = await getMessages(conversationId);
        setMessages(data);
      } catch (err) {
        setError("Failed to load messages.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const sentMessage = await sendMessage(conversationId, newMessage);
      setMessages((prevMessages) => [...prevMessages, sentMessage]);
      setNewMessage("");
    } catch (err) {
      setError("Failed to send message.");
    }
  };

  const formatMessageTime = (isoString) => {
    if (!isoString) return "";
    const date = parseISO(isoString);
    if (isToday(date)) return format(date, "p");
    if (isYesterday(date)) return `Yesterday at ${format(date, "p")}`;
    return format(date, "MMM d, yyyy 'at' p");
  };

  // --- THIS IS THE FINAL FIX ---
  // The logic now checks both the role AND the unique ID for a perfect match.
  const isMyMessage = (msg) => {
    if (!user || !msg) return false;
    return user.role === msg.sender_type && user.id === msg.sender_id;
  };
  // --- END OF FINAL FIX ---

  if (!conversationId) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-muted">
        Select a conversation to start chatting.
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="d-flex flex-column h-100">
      <div className="chat-messages grow">
        {messages.map((msg) => {
          const isMe = isMyMessage(msg);
          return (
            <div
              key={msg.id}
              className={`message-bubble ${isMe ? "sent" : "received"}`}
            >
              <div className="message-content">
                {!isMe && <div className="sender-name">{msg.sender_name}</div>}
                <p>{msg.content}</p>
                <div className="timestamp">
                  {formatMessageTime(msg.created_at)}
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
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              autoComplete="off"
            />
            <Button variant="primary" type="submit">
              <SendFill />
            </Button>
          </InputGroup>
        </Form>
      </div>
    </div>
  );
};

export default ChatWindow;
