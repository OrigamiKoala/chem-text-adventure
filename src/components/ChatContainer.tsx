import React, { useState, useEffect, useRef } from 'react';
import { NarrativeNode, ChatMessage, OutlineItem } from '../types/game';
import { safeTypeset } from '../engine/textParser';

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
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new chat message or node change
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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

  const formattedText = currentNode?.text
    ? currentNode.text.replace(/\n/g, '<br />')
    : '';

  // Extract choices if node is MCQ
  const choices: { num: number; text: string }[] = [];
  if (currentNode && currentNode.type === 'mcq') {
    if (currentNode.op1) choices.push({ num: 1, text: currentNode.op1 });
    if (currentNode.op2) choices.push({ num: 2, text: currentNode.op2 });
    if (currentNode.op3) choices.push({ num: 3, text: currentNode.op3 });
    if (currentNode.op4) choices.push({ num: 4, text: currentNode.op4 });
  }

  return (
    <div id="chat-container" className="chat-container" ref={containerRef}>
      <div className="container" id="previous">
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
              <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
            )}
          </div>
        ))}

        {/* Current Active Story Prompt Card */}
        {currentNode && (
          <div className="story-card active-node">
            <div
              id="text"
              className="story-body"
              dangerouslySetInnerHTML={{ __html: formattedText }}
            />

            {/* Clickable MCQ Choice Buttons */}
            {choices.length > 0 && (
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
            )}
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
        <div ref={chatBottomRef} />
      </div>
    </div>
  );
};
