// src/features/orders/Messenger.jsx
import { useEffect, useState } from "react";
import io from "socket.io-client";
import {
  fetchConversations,
  fetchMessagesWithUser,
  sendMessage,
} from "./api";

import "bootstrap/dist/css/bootstrap.min.css";
import { BsPersonCircle, BsChatDotsFill, BsSendFill } from "react-icons/bs";

const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
  withCredentials: true,
});

export default function Messenger() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // Charger toutes les conversations
  useEffect(() => {
    fetchConversations().then(setConversations);

    // Réception temps réel
    socket.on("receiveMessage", (msg) => {
      if (msg.senderId === activeChat?.id || msg.receiverId === activeChat?.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [activeChat]);

  // Charger les messages d’un utilisateur sélectionné
  const openChat = async (user) => {
    setActiveChat(user);
    const msgs = await fetchMessagesWithUser(user.id);
    setMessages(msgs);
  };

  // Envoyer un message
  const handleSend = async () => {
    if (!text.trim() || !activeChat) return;

    const msg = await sendMessage(activeChat.id, text);
    setMessages((prev) => [...prev, msg]);
    setText("");

    // Emettre au serveur pour diffusion
    socket.emit("sendMessage", msg);
  };

  return (
    <div className="d-flex vh-100">
      {/* Sidebar conversations */}
      <div className="col-3 border-end bg-light overflow-auto">
        <h5 className="p-3 border-bottom d-flex align-items-center">
          <BsChatDotsFill className="me-2 text-primary" /> Conversations
        </h5>
        {conversations.map((c) => (
          <div
            key={c.userId}
            className={`p-3 d-flex align-items-center cursor-pointer ${
              activeChat?.id === c.userId ? "bg-primary text-white" : "hover-bg"
            }`}
            style={{ cursor: "pointer" }}
            onClick={() => openChat(c.user)}
          >
            <BsPersonCircle size={28} className="me-2" />
            <div>
              <div className="fw-bold">
                {c.user.firstName} {c.user.lastName}
              </div>
              <div className="text-truncate small">
                {c.lastMessage || "Aucun message"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Zone de chat */}
      <div className="col-9 d-flex flex-column">
        {activeChat ? (
          <>
            {/* Header chat */}
            <div className="p-3 border-bottom bg-white d-flex align-items-center">
              <BsPersonCircle size={32} className="me-2 text-secondary" />
              <h6 className="mb-0">
                {activeChat.firstName} {activeChat.lastName}
              </h6>
            </div>

            {/* Messages */}
            <div className="flex-grow-1 p-3 overflow-auto bg-light">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`d-flex mb-2 ${
                    m.isMine ? "justify-content-end" : "justify-content-start"
                  }`}
                >
                  <div
                    className={`p-2 rounded shadow-sm ${
                      m.isMine ? "bg-primary text-white" : "bg-white border"
                    }`}
                    style={{ maxWidth: "70%" }}
                  >
                    <div>{m.message}</div>
                    <div className="small text-muted mt-1 text-end">
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-top d-flex">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Écrire un message..."
                className="form-control me-2"
              />
              <button
                onClick={handleSend}
                className="btn btn-primary d-flex align-items-center"
              >
                <BsSendFill className="me-1" /> Envoyer
              </button>
            </div>
          </>
        ) : (
          <div className="d-flex flex-grow-1 align-items-center justify-content-center text-muted">
            Sélectionne une conversation
          </div>
        )}
      </div>
    </div>
  );
}
