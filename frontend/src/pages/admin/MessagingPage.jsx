import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { PlusCircleFill } from "react-bootstrap-icons";
import ConversationList from "../../components/admin/messaging/ConversationList";
import ChatWindow from "../../components/admin/messaging/ChatWindow";
import NewConversationModal from "../../components/admin/messaging/NewConversationModal";
import { getConversations } from "../../services/messagingService";
import "../../styles/Messaging.css"; // We will create this file next

const MessagingPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to fetch conversations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    // Refresh conversation list to update unread counts
    fetchConversations();
  };

  const handleConversationStarted = (newConversationId) => {
    fetchConversations();
    setActiveConversationId(newConversationId);
  };

  return (
    <>
      <Container fluid className="messaging-layout h-100">
        <Row className="h-100">
          <Col md={4} className="conversation-sidebar">
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Conversations</h5>
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => setShowNewModal(true)}
                >
                  <PlusCircleFill size={24} />
                </Button>
              </Card.Header>
              <ConversationList
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelect={handleSelectConversation}
                loading={loading}
              />
            </Card>
          </Col>
          <Col md={8} className="chat-window-area">
            <Card className="h-100">
              <Card.Body className="p-0">
                <ChatWindow conversationId={activeConversationId} />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <NewConversationModal
        show={showNewModal}
        handleClose={() => setShowNewModal(false)}
        onConversationStarted={handleConversationStarted}
      />
    </>
  );
};

export default MessagingPage;
