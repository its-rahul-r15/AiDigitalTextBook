import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './AIChatPage.module.css';
import { tutorService } from '../../services/tutor.service';
import Spinner from '../../components/ui/Spinner/Spinner';

const CHIPS = ['Explain ATP', 'Give a quiz', 'Show diagram', 'Summarize chapter'];

const AIChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [loading, setLoading] = useState(true);

    // Search state
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [highlightId, setHighlightId] = useState(null);

    const endRef = useRef(null);
    const messagesRef = useRef(null);
    const searchInputRef = useRef(null);

    // Load chat history on mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const { data } = await tutorService.getHistory(1, 200);
                const history = data.data?.messages || [];
                const formatted = [];

                // Add welcome message
                formatted.push({
                    id: 'welcome',
                    role: 'ai',
                    text: "Hello! I'm your AI Tutor. What would you like to explore today? I can help explain concepts, quiz you, or show diagrams.",
                    time: null,
                });

                for (const msg of history) {
                    formatted.push({
                        id: `${msg._id}_user`,
                        dbId: msg._id,
                        role: 'user',
                        text: msg.prompt,
                        time: msg.createdAt,
                    });
                    formatted.push({
                        id: `${msg._id}_ai`,
                        dbId: msg._id,
                        role: 'ai',
                        text: msg.response,
                        time: msg.createdAt,
                    });
                }

                setMessages(formatted);
            } catch (err) {
                console.error('Failed to load chat history:', err);
                setMessages([{
                    id: 'welcome',
                    role: 'ai',
                    text: "Hello! I'm your AI Tutor. What would you like to explore today?",
                    time: null,
                }]);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, []);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (!searchOpen) {
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, typing, searchOpen]);

    // Focus search input when opened
    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchOpen]);

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Group messages by date
    const getDateLabel = (msg, idx) => {
        if (!msg.time) return idx === 0 ? 'Welcome' : null;
        const currentDate = formatDate(msg.time);
        if (idx === 0) return currentDate;
        const prevMsg = messages[idx - 1];
        if (!prevMsg.time) return currentDate;
        return formatDate(prevMsg.time) !== currentDate ? currentDate : null;
    };

    const sendMsg = async (text) => {
        if (!text.trim()) return;
        const userMsg = { id: Date.now(), role: 'user', text, time: new Date().toISOString() };
        setMessages((m) => [...m, userMsg]);
        setInput('');
        setTyping(true);
        try {
            const { data } = await tutorService.sendMessage({ message: text });
            const reply = data.data?.reply || data.message || 'Let me think about that…';
            setMessages((m) => [...m, { id: Date.now() + 1, role: 'ai', text: reply, time: new Date().toISOString() }]);
        } catch {
            setMessages((m) => [...m, { id: Date.now() + 1, role: 'ai', text: 'I encountered an issue. Let me try again in a moment.', time: new Date().toISOString() }]);
        } finally {
            setTyping(false);
        }
    };

    // Search handler
    const handleSearch = useCallback(async (q) => {
        setSearchQuery(q);
        if (!q.trim()) {
            setSearchResults([]);
            setHighlightId(null);
            return;
        }
        setSearching(true);
        try {
            const { data } = await tutorService.searchHistory(q);
            setSearchResults(data.data?.results || []);
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim()) return;
        const timer = setTimeout(() => handleSearch(searchQuery), 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Jump to a search result message in the chat
    const jumpToResult = (result) => {
        const targetId = `${result._id}_user`;
        setHighlightId(targetId);
        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setHighlightId(null), 3000);
        }
    };

    if (loading) return (
        <div className={styles.page}>
            <div className={styles.loadingState}>
                <Spinner size="lg" />
                <p>Loading your chat history...</p>
            </div>
        </div>
    );

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.aiAvatar}>✦</div>
                <div className={styles.headerInfo}>
                    <h2 className={styles.title}>AI Tutor</h2>
                    <p className={styles.sub}>
                        {messages.length > 1
                            ? `${Math.floor((messages.length - 1) / 2)} messages`
                            : 'Start a conversation'
                        }
                    </p>
                </div>
                <button
                    className={`${styles.searchToggle} ${searchOpen ? styles.searchToggleActive : ''}`}
                    onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); setSearchResults([]); setHighlightId(null); }}
                    title="Search messages"
                >
                    🔍
                </button>
                <div className={styles.onlineDot} title="Online" />
            </div>

            {/* Search Bar */}
            {searchOpen && (
                <div className={styles.searchBar}>
                    <input
                        ref={searchInputRef}
                        className={styles.searchInput}
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searching && <Spinner size="sm" />}
                    {searchQuery && !searching && (
                        <span className={styles.searchCount}>
                            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                        </span>
                    )}
                    <button className={styles.searchClose} onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); setHighlightId(null); }}>✕</button>
                </div>
            )}

            {/* Search Results Dropdown */}
            {searchOpen && searchResults.length > 0 && (
                <div className={styles.searchResults}>
                    {searchResults.map((r) => (
                        <div key={r._id} className={styles.searchResultItem} onClick={() => jumpToResult(r)}>
                            <div className={styles.searchResultQ}>
                                <span className={styles.searchLabel}>You:</span> {r.prompt}
                            </div>
                            <div className={styles.searchResultA}>
                                <span className={styles.searchLabel}>AI:</span> {r.response?.substring(0, 80)}...
                            </div>
                            <span className={styles.searchResultTime}>{formatDate(r.createdAt)} · {formatTime(r.createdAt)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Messages */}
            <div className={styles.messages} ref={messagesRef}>
                {messages.map((m, idx) => {
                    const dateLabel = getDateLabel(m, idx);
                    return (
                        <div key={m.id}>
                            {dateLabel && (
                                <div className={styles.dateDivider}>
                                    <span>{dateLabel}</span>
                                </div>
                            )}
                            <div
                                id={m.id}
                                className={[
                                    styles.row,
                                    m.role === 'user' ? styles.userRow : '',
                                    highlightId === m.id ? styles.highlightRow : '',
                                ].join(' ')}
                            >
                                {m.role === 'ai' && <div className={styles.aiAvatar2}>✦</div>}
                                <div className={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble].join(' ')}>
                                    {m.role === 'ai' && <span className={styles.roleLbl}>AI TUTOR</span>}
                                    {m.role === 'user' && <span className={[styles.roleLbl, styles.userLbl].join(' ')}>YOU</span>}
                                    <p>{m.text}</p>
                                    {m.time && <span className={styles.msgTime}>{formatTime(m.time)}</span>}
                                </div>
                                {m.role === 'user' && <div className={styles.userAvatar}>U</div>}
                            </div>
                        </div>
                    );
                })}
                {typing && (
                    <div className={styles.row}>
                        <div className={styles.aiAvatar2}>✦</div>
                        <div className={styles.typingBubble}>
                            <span /><span /><span />
                            <em>AI is thinking…</em>
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <div className={styles.chips}>
                {CHIPS.map((c) => (
                    <button key={c} className={styles.chip} onClick={() => sendMsg(c)}>{c}</button>
                ))}
            </div>

            <form className={styles.inputRow} onSubmit={(e) => { e.preventDefault(); sendMsg(input); }}>
                <input
                    className={styles.input}
                    placeholder="Ask anything about this page…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button type="submit" className={styles.sendBtn} disabled={typing || !input.trim()}>✦</button>
            </form>
        </div>
    );
};

export default AIChatPage;
