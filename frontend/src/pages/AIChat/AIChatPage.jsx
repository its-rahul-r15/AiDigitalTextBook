import { useState, useRef, useEffect } from 'react';
import styles from './AIChatPage.module.css';
import { tutorService } from '../../services/tutor.service';
import Spinner from '../../components/ui/Spinner/Spinner';

const INITIAL = [
    { id: 1, role: 'ai', text: "Hello! I'm your AI Tutor. What would you like to explore today? I can help explain concepts, quiz you, or show diagrams." },
];

const CHIPS = ['Explain ATP', 'Give a quiz', 'Show diagram', 'Summarize chapter'];

const AIChatPage = () => {
    const [messages, setMessages] = useState(INITIAL);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const endRef = useRef(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

    const sendMsg = async (text) => {
        if (!text.trim()) return;
        const userMsg = { id: Date.now(), role: 'user', text };
        setMessages((m) => [...m, userMsg]);
        setInput('');
        setTyping(true);
        try {
            const { data } = await tutorService.sendMessage({ message: text });
            setMessages((m) => [...m, { id: Date.now() + 1, role: 'ai', text: data.data?.reply || data.message || 'Let me think about that…' }]);
        } catch {
            setMessages((m) => [...m, { id: Date.now() + 1, role: 'ai', text: 'I encountered an issue. Let me try again in a moment.' }]);
        } finally {
            setTyping(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.aiAvatar}>✦</div>
                <div>
                    <h2 className={styles.title}>AI Tutor</h2>
                    <p className={styles.sub}>Context: Current Chapter</p>
                </div>
                <div className={styles.onlineDot} title="Online" />
            </div>

            <div className={styles.messages}>
                {messages.map((m) => (
                    <div key={m.id} className={[styles.row, m.role === 'user' ? styles.userRow : ''].join(' ')}>
                        {m.role === 'ai' && <div className={styles.aiAvatar2}>✦</div>}
                        <div className={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble].join(' ')}>
                            {m.role === 'ai' && <span className={styles.roleLbl}>AI TUTOR</span>}
                            {m.role === 'user' && <span className={[styles.roleLbl, styles.userLbl].join(' ')}>YOU</span>}
                            <p>{m.text}</p>
                        </div>
                        {m.role === 'user' && <div className={styles.userAvatar}>U</div>}
                    </div>
                ))}
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
