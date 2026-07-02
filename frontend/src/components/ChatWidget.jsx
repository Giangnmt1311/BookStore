import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import getBaseUrl from '../utils/baseURL';

export default function ChatWidget({ isAdmin = false }) {
  const location = useLocation();
  const isAdminMode = isAdmin || location.pathname.startsWith('/dashboard');
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const initialMessage = isAdminMode 
    ? 'Hi! I\'m your admin assistant. Ask me about managing books, orders, users, or get store insights.'
    : 'Hi! Ask me about books, authors, or recommendations.';
  const [messages, setMessages] = useState([
    { role: 'assistant', content: initialMessage },
  ]);
  const scrollRef = useRef(null);
  const apiUrl = useMemo(() => {
    const baseUrl = `${getBaseUrl()}/api/chat`;
    return isAdminMode ? `${baseUrl}/admin` : baseUrl;
  }, [isAdminMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    const userMsg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      
      if (isAdminMode) {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: trimmed }),
        credentials: 'include',
      });
      let data = null;
      try {
        data = await res.json();
      } catch (_) {
      }
      if (!res.ok) {
        const msg = data?.error || `Request failed (${res.status})`;
        const detail = data?.detail ? `\n${data.detail}` : '';
        throw new Error(`${msg}${detail}`);
      }
      data = data || {};
      const reply = data?.reply || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply, sources: data?.sources || [] }]);
    } catch (e) {
      const msg = e?.message || 'Oops, something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessageContent = (content, sources, role, onLinkClick) => {
    if (!sources || sources.length === 0 || role === 'user') {
      return <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>;
    }

    const titleToBookMap = {};
    sources.forEach(book => {
      if (book.title) {
        titleToBookMap[book.title.toLowerCase()] = book;
      }
    });

    const parts = [];
    let lastIndex = 0;
    
    const quoteRegex = /"([^"]+)"/g;
    let match;
    
    while ((match = quoteRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }
      
      const quotedTitle = match[1];
      const matchedBook = titleToBookMap[quotedTitle.toLowerCase()];
      
      if (matchedBook) {
        parts.push({
          type: 'link',
          content: quotedTitle,
          bookId: matchedBook.id
        });
      } else {
        parts.push({
          type: 'text',
          content: `"${quotedTitle}"`
        });
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }
    
    if (parts.length === 0) {
      return <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>;
    }
    
    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {parts.map((part, partIdx) => {
          if (part.type === 'link') {
            return (
              <Link
                key={partIdx}
                to={`/books/${part.bookId}`}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                onClick={onLinkClick}
              >
                "{part.content}"
              </Link>
            );
          }
          return <span key={partIdx}>{part.content}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`rounded-full shadow-lg ${isAdminMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'} text-white w-14 h-14 flex items-center justify-center focus:outline-none`}
          aria-label="Open chat"
        >
          💬
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className={`px-4 py-3 ${isAdminMode ? 'bg-indigo-600' : 'bg-blue-600'} text-white flex items-center justify-between`}>
            <div className="font-semibold">{isAdminMode ? 'Admin Assistant' : 'Bookstore Assistant'}</div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/90 hover:text-white"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${m.role === 'user' ? (isAdminMode ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-blue-600 text-white border-blue-700') : 'bg-white text-gray-800'} max-w-[85%] px-3 py-2 rounded-lg shadow border ${m.role === 'user' ? '' : 'border-gray-200'}`}>
                  {renderMessageContent(m.content, m.sources, m.role, () => setIsOpen(false))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-xs text-gray-500">Assistant is typing…</div>
            )}
          </div>

          <div className="p-3 border-t bg-white">
            <div className="flex items-end gap-2">
              <textarea
                className={`flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isAdminMode ? 'focus:ring-indigo-500 focus:border-indigo-500' : 'focus:ring-blue-500 focus:border-blue-500'} max-h-24 overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
                rows={1}
                placeholder={isAdminMode ? "Ask about managing books, orders,..." : "Ask about books, authors, prices..."}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className={`rounded-md ${isAdminMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 text-sm font-medium shadow disabled:opacity-50`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


