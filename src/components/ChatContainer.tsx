import React, { useState, useEffect, useRef } from 'react';
import { NarrativeNode, ChatMessage, OutlineItem } from '../types/game';
import { safeTypeset, parseDivChunks, extractOptionsAndCleanText } from '../engine/textParser';

interface ChatContainerProps {
  currentNode?: NarrativeNode;
  chatLog: ChatMessage[];
  outlineItems?: OutlineItem[];
  isOutlineOpen: boolean;
  onJumpTo: (nodeId: string) => void;
  onSubmitInput: (text: string) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  currentNode,
  chatLog,
  outlineItems = [],
  isOutlineOpen,
  onJumpTo,
  onSubmitInput,
}) => {
  const [inputValue, setInputValue] = useState('');
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  // Auto-scroll on new chat message or node change
  useEffect(() => {
    scrollToBottom();
    const timer1 = setTimeout(scrollToBottom, 50);
    const timer2 = setTimeout(scrollToBottom, 200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [chatLog, currentNode]);

  // MathJax typesetting trigger
  useEffect(() => {
    if (containerRef.current) {
      safeTypeset([containerRef.current]);
    }
  }, [currentNode, chatLog]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSubmitInput(inputValue);
    setInputValue('');
  };

  const handleOptionClick = (optionText: string) => {
    onSubmitInput(optionText);
  };

  // Helper to split text on '--' into separate div blocks, stripping any lingering <ol>/<ul> choice lists
  const renderTextContent = (text: string) => {
    const cleanDisplay = text
      .replace(/<ol\b[^>]*>[\s\S]*?<\/ol>/gi, '')
      .replace(/<ul\b[^>]*>[\s\S]*?<\/ul>/gi, '')
      .replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, '')
      .replace(/\([^)]*type the number[^)]*\)/gi, '')
      .replace(/\([^)]*type your answer[^)]*\)/gi, '')
      .trim();

    if (!cleanDisplay) return null;

    const chunks = parseDivChunks(cleanDisplay);
    if (chunks.length <= 1) {
      return <div dangerouslySetInnerHTML={{ __html: (chunks[0] || cleanDisplay).replace(/\n/g, '<br />') }} />;
    }
    return (
      <div className="story-chunks-group">
        {chunks.map((chunk, idx) => (
          <div
            key={idx}
            className="story-chunk-div"
            dangerouslySetInnerHTML={{ __html: chunk.replace(/\n/g, '<br />') }}
          />
        ))}
      </div>
    );
  };

  // Extract choices using engine parser (handles op1..op4 as well as <ol><li> items)
  const { choices } = extractOptionsAndCleanText(currentNode);

  return (
    <div id="chat-container" className="chat-card" ref={containerRef}>
      {/* Story Section Outline Drawer */}
      {isOutlineOpen && outlineItems.length > 0 && (
        <div className="outline-drawer">
          <h4 className="drawer-title">📜 Story Sections</h4>
          <p className="drawer-subtitle">Click any section to jump directly:</p>
          <div className="outline-buttons">
            {outlineItems.map(item => (
              <button
                key={item.div}
                type="button"
                className="btn-outline-item"
                onClick={() => onJumpTo(item.div)}
              >
                <span className="outline-ref">{item.reference_num}</span>
                <span className="outline-text">{item.content}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Log History */}
      <div className="chat-history" ref={chatHistoryRef}>
        {chatLog.map(msg => (
          <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
            {msg.sender === 'roll' && msg.rollData ? (
              <div className="dice-roll-notification">
                <div className="dice-result">
                  {msg.rollData.passed === true && <span className="dice-success">✨ Success! </span>}
                  {msg.rollData.passed === false && <span className="dice-failure">💀 Failure! </span>}
                  Rolled {msg.rollData.total}
                  {msg.rollData.stat && ` for ${msg.rollData.stat}`}
                </div>
                <div className="dice-detail">
                  [{msg.rollData.rolls.join('+')}]
                  {msg.rollData.modifier ? ` ${msg.rollData.modifier >= 0 ? '+' : ''}${msg.rollData.modifier}` : ''}
                  {msg.rollData.dc !== undefined && ` vs DC ${msg.rollData.dc}`}
                </div>
              </div>
            ) : (
              renderTextContent(msg.text)
            )}
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      {/* Active Node Choices */}
      {choices.length > 0 && (
        <div className="active-choices-container">
          <div className="choice-buttons-grid">
            {choices.map(c => (
              <button
                key={c.num}
                type="button"
                className="btn-choice"
                onClick={() => handleOptionClick(c.text)}
              >
                <span className="choice-badge">{c.num}</span>
                <span className="choice-text">{c.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form Bar */}
      <form id="responseform" className="input-form-bar" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <span className="input-icon">⌨️</span>
          <input
            type="text"
            id="response"
            name="response"
            alt="response"
            placeholder="Type your answer, choice, or command (e.g. 'help')..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-send" title="Send Response">
            Send ↵
          </button>
        </div>
      </form>
    </div>
  );
};
