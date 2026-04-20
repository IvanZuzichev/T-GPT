import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './Chat.scss';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const savedMessages = localStorage.getItem('t-gpt-chat-history');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (e) {
        console.error('Ошибка загрузки истории:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('t-gpt-chat-history', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputText;
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3001/api/chat', {
        message: currentMessage
      }, {
        timeout: 60000
      });

      const assistantMessage: Message = {
        id: Date.now() + 1,
        text: response.data.reply,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Ошибка при отправке:', error);
      
      let errorText = 'Извините, произошла ошибка. Пожалуйста, попробуйте позже.';
      
      if (error.code === 'ECONNABORTED') {
        errorText = 'Превышено время ожидания ответа от сервера.';
      } else if (error.response) {
        errorText = `Ошибка сервера: ${error.response.data?.error || error.response.statusText}`;
      } else if (error.request) {
        errorText = 'Сервер не отвечает. Убедитесь, что сервер запущен на порту 3001.';
      }
      
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setError(null);
    localStorage.removeItem('t-gpt-chat-history');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const MessageText = ({ text, sender }: { text: string; sender: string }) => {
    const isUser = sender === 'user';
    
    return (
      <div className={`message-text ${isUser ? 'user-message-text' : 'assistant-message-text'} markdown-body`}>
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
            h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
            h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
            p: ({ children }) => <p className="md-p">{children}</p>,
            strong: ({ children }) => <strong className="md-strong">{children}</strong>,
            em: ({ children }) => <em className="md-em">{children}</em>,
            ul: ({ children }) => <ul className="md-ul">{children}</ul>,
            ol: ({ children }) => <ol className="md-ol">{children}</ol>,
            li: ({ children }) => <li className="md-li">{children}</li>,
            code: ({ children }) => <code className="md-code">{children}</code>,
            pre: ({ children }) => <pre className="md-pre">{children}</pre>,
            a: ({ href, children }) => (
              <a href={href} className="md-link" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            ...(isUser && {
              strong: ({ children }) => <strong className="md-strong-user">{children}</strong>,
            }),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <h1>T-GPT</h1>
          <button onClick={clearHistory} className="clear-btn">
            Очистить историю
          </button>
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <p>Привет! Я T-GPT — Нейросеть от Т-Банка</p>
              <p>Задайте мне любой вопрос, и я постараюсь помочь!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <div className="message-avatar">
                  {/* лого пользователя с сайта Т-банка */}
                  {message.sender === 'user' ? (
                    <img 
                      src="https://cdn.tbank.ru/static/pages/files/96e5e7d8-8143-49c5-ac99-4411c030b90c.svg" 
                      alt="User Avatar" 
                      className="avatar-img"
                    />
                  ) : (
                    // лого т банка с сайта Т-банка, отвечает за гпт именно
                    <img 
                      src="https://cdn.tbank.ru/static/pfa-multimedia/images/1251baa4-02ab-4e6f-9bd6-8f8444bfa726.svg" 
                      alt="Bot Avatar" 
                      className="avatar-img"
                    />
                  )}
                </div>
                <div className="message-content">
                  <MessageText text={message.text} sender={message.sender} />
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="message assistant-message typing">
              <div className="message-avatar"></div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите ваше сообщение..."
            disabled={isLoading}
            rows={3}
          />
          <button 
            onClick={sendMessage} 
            disabled={!inputText.trim() || isLoading}
            className="send-btn"
          >
            {isLoading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;