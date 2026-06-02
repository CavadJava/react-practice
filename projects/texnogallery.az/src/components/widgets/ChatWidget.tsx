import { useState } from 'react';
import './ChatWidget.css';

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(true);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  if (!isOpen) {
    return (
      <button className="chat-toggle-button" onClick={toggleChat}>💬</button>
    );
  }

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <button className="chat-close-button" onClick={toggleChat}>X</button>
        <p>Mesaj yazın</p>
      </div>
      <div className="chat-body">
        <p className="chat-message-info">Salam. Suallarınız var? Cavab verməyə məmnun olarıq</p>
        {/* Future chat messages go here */}
      </div>
      <div className="chat-input-area">
        <input type="text" placeholder="Bura yazın" />
        <button className="chat-send-button">⬆️</button>
      </div>
    </div>
  );
}

export default ChatWidget;
