import React, { useState, useEffect, useCallback } from "react";
import { Button, Card } from "react-bootstrap";
import { PlusCircleFill } from "react-bootstrap-icons";
import ConversationList from "../../components/admin/messaging/ConversationList";
import ChatWindow from "../../components/admin/messaging/ChatWindow";
import NewConversationModal from "../../components/admin/messaging/NewConversationModal";
import { getConversations } from "../../services/messagingService";
import "../../styles/Messaging.css";

const MessagingPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to fetch conversations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchConversations();
  }, [fetchConversations]);

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    setTimeout(() => fetchConversations(), 1000);
  };

  const handleConversationStarted = (newConversationId) => {
    fetchConversations();
    setActiveConversationId(newConversationId);
  };

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  return (
    <>
      <div className="messaging-layout">
        <div className="conversation-sidebar">
          <Card.Header>
            <h5 className="mb-0">Conversations</h5>
            <Button
              variant="link"
              className="p-0 new-conversation-btn"
              onClick={() => setShowNewModal(true)}
              title="Start a new conversation"
            >
              <PlusCircleFill size={22} />
            </Button>
          </Card.Header>
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={handleSelectConversation}
            loading={loading}
          />
        </div>
        <div className="chat-window-area">
          <ChatWindow
            conversationId={activeConversationId}
            conversation={activeConversation}
            key={activeConversationId}
          />
        </div>
      </div>

      <NewConversationModal
        show={showNewModal}
        handleClose={() => setShowNewModal(false)}
        onConversationStarted={handleConversationStarted}
      />
    </>
  );
};

export default MessagingPage;
