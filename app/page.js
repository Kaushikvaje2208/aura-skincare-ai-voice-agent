'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const GREETING = "Hi, I'm Aria from Aura Skincare. How can I help you today?";
const TEST_ORDERS = [
  { id: 'ORD-101', note: 'Shipped, in transit' },
  { id: 'ORD-102', note: 'Delivered, COD' },
  { id: 'ORD-103', note: 'Processing' },
];

export default function Home() {
  const [status, setStatus] = useState('idle'); // idle | listening | thinking | speaking
  const [inCall, setInCall] = useState(false);
  const [messages, setMessages] = useState([]);
  const [interim, setInterim] = useState('');
  const [outcome, setOutcome] = useState(null);
  const [summarising, setSummarising] = useState(false);
  const [supported, setSupported] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const messagesRef = useRef([]);
  const inCallRef = useRef(false);
  const voiceRef = useRef(null);
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    messagesRef.current = messages;
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, interim]);

  useEffect(() => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) setSupported(false);
    const pickVoice = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      voiceRef.current =
        voices.find((v) => v.lang === 'en-IN') || voices.find((v) => v.lang?.startsWith('en')) || null;
    };
    pickVoice();
    window.speechSynthesis?.addEventListener?.('voiceschanged', pickVoice);
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', pickVoice);
  }, []);

  const listen = useCallback(() => {
    if (!inCallRef.current || !recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setStatus('listening');
    } catch {}
  }, []);

  const speak = useCallback(
    (text) =>
      new Promise((resolve) => {
        if (!window.speechSynthesis) return resolve();
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-IN';
        if (voiceRef.current) u.voice = voiceRef.current;
        u.rate = 1.02;
        u.onend = resolve;
        u.onerror = resolve;
        setStatus('speaking');
        window.speechSynthesis.speak(u);
      }),
    []
  );

  const handleUserText = useCallback(
    async (text) => {
      const content = text.trim();
      if (!content) return;
      const next = [...messagesRef.current, { role: 'user', content }];
      messagesRef.current = next;
      setMessages(next);
      setStatus('thinking');
      setError('');
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: next }),
        });
        const data = await res.json();
        if (!res.ok) setError('The assistant had trouble responding.');
        const withReply = [...messagesRef.current, { role: 'assistant', content: data.reply, toolCalls: data.toolCalls }];
        messagesRef.current = withReply;
        setMessages(withReply);
        if (inCallRef.current) {
          await speak(data.reply);
          listen();
        } else {
          setStatus('idle');
        }
      } catch {
        setError('Network error — please try again.');
        setStatus('idle');
        listen();
      }
    },
    [listen, speak]
  );

  const startCall = async () => {
    setOutcome(null);
    setError('');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = 'en-IN';
      rec.interimResults = true;
      rec.continuous = false;
      let finalText = '';
      rec.onresult = (e) => {
        let interimText = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interimText += r[0].transcript;
        }
        setInterim(interimText);
      };
      rec.onend = () => {
        setInterim('');
        const said = finalText;
        finalText = '';
        if (!inCallRef.current) return;
        if (said.trim()) handleUserText(said);
        else listen();
      };
      rec.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setError('Microphone access was blocked. Allow it in your browser, or type below.');
          setSupported(false);
        }
      };
      recognitionRef.current = rec;
    }
    const initial = [{ role: 'assistant', content: GREETING }];
    messagesRef.current = initial;
    setMessages(initial);
    inCallRef.current = true;
    setInCall(true);
    await speak(GREETING);
    listen();
  };

  const endCall = async () => {
    inCallRef.current = false;
    setInCall(false);
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    setStatus('idle');
    setInterim('');
    const transcript = messagesRef.current;
    if (transcript.filter((m) => m.role === 'user').length === 0) return;
    setSummarising(true);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: transcript.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      setOutcome(data.outcome || { error: 'Could not generate a summary.' });
    } catch {
      setOutcome({ error: 'Could not generate a summary.' });
    } finally {
      setSummarising(false);
    }
  };

  const submitText = (e) => {
    e.preventDefault();
    if (!inCall || status === 'thinking') return;
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    const t = textInput;
    setTextInput('');
    handleUserText(t);
  };

  const statusLabel = {
    idle: inCall ? 'Ready' : 'Not in a call',
    listening: 'Listening…',
    thinking: 'Aria is thinking…',
    speaking: 'Aria is speaking…',
  }[status];

  return (
    <main className="shell">
      <header className="brand">
        <span className="logo">Aura</span>
        <span className="tag">Skincare · Customer Care</span>
      </header>

      <section className="grid">
        <div className="panel call">
          <div className={`orb ${status} ${inCall ? 'live' : ''}`}>
            <div className="orb-core" />
          </div>
          <h1>Talk to Aria</h1>
          <p className="status" aria-live="polite">{statusLabel}</p>

          {!inCall ? (
            <button className="btn primary" onClick={startCall}>Start Call</button>
          ) : (
            <button className="btn danger" onClick={endCall}>End Call</button>
          )}

          {!supported && (
            <p className="hint">Voice input isn&apos;t available in this browser — use Google Chrome, or type your message during the call.</p>
          )}
          {error && <p className="error">{error}</p>}

          <div className="orders">
            <h3>Test orders</h3>
            <ul>
              {TEST_ORDERS.map((o) => (
                <li key={o.id}><code>{o.id}</code><span>{o.note}</span></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="panel transcript">
          <h2>Live transcript</h2>
          <div className="messages">
            {messages.length === 0 && <p className="empty">Start a call and say something like “Where is order ORD-101?”</p>}
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <span className="who">{m.role === 'assistant' ? 'Aria' : 'You'}</span>
                <p>{m.content}</p>
                {m.toolCalls?.map((t, j) => (
                  <span key={j} className="tool">⚙ {t.name}({t.arguments?.order_id})</span>
                ))}
              </div>
            ))}
            {interim && (
              <div className="msg user interim">
                <span className="who">You</span>
                <p>{interim}</p>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>
          <form className="composer" onSubmit={submitText}>
            <input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={inCall ? 'Or type a message…' : 'Start a call to chat'}
              disabled={!inCall}
            />
            <button className="btn" disabled={!inCall || !textInput.trim() || status === 'thinking'}>Send</button>
          </form>

          {(summarising || outcome) && (
            <div className="outcome">
              <h2>Post-call outcome</h2>
              {summarising ? <p className="status">Generating summary…</p> : <pre>{JSON.stringify(outcome, null, 2)}</pre>}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
