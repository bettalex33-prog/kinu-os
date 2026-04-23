import React, { useState, useEffect } from 'react'

const THEMES = {
  'Coral Sunset': { primary: '#ff6b35', secondary: '#f7931e', accent: '#ff006e' },
  'Purple Magic': { primary: '#7c3aed', secondary: '#a855f7', accent: '#ec4899' },
  'Ocean Wave': { primary: '#0ea5e9', secondary: '#06b6d4', accent: '#6366f1' },
  'Forest Green': { primary: '#16a34a', secondary: '#22c55e', accent: '#84cc16' },
  'Neon Pink': { primary: '#ff006e', secondary: '#ff4d94', accent: '#ff99c8' },
  'Gold Rush': { primary: '#f59e0b', secondary: '#fbbf24', accent: '#fcd34d' },
  'Cyber Red': { primary: '#dc2626', secondary: '#ef4444', accent: '#f87171' },
  'Mint Fresh': { primary: '#10b981', secondary: '#34d399', accent: '#6ee7b7' },
}

const MISSIONS = [
  { id: 1, text: 'Chat with KINU 3 times', xp: 30, done: false },
  { id: 2, text: 'Log your mood today', xp: 20, done: false },
  { id: 3, text: 'Complete a focus session', xp: 50, done: false },
  { id: 4, text: 'Upload a track to visualizer', xp: 40, done: false },
]

const MOODS = [
  { label: 'Focused', emoji: '🎯', color: '#00ff88' },
  { label: 'Energized', emoji: '⚡', color: '#ffd700' },
  { label: 'Tired', emoji: '😴', color: '#6b7280' },
  { label: 'Stressed', emoji: '😤', color: '#ef4444' },
]

export default function App() {
  const [tab, setTab] = useState('home')
  const [theme, setTheme] = useState('Forest Green')
  const [xp, setXp] = useState(() => Number(localStorage.getItem('kinu_xp') || 0))
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('kinu_streak') || 1))
  const [mood, setMood] = useState(null)
  const [moodHistory, setMoodHistory] = useState(() => {
  try { return JSON.parse(localStorage.getItem('kinu_mood_history') || '[]') } catch { return [] }
})
const [xpHistory, setXpHistory] = useState(() => {
  try { return JSON.parse(localStorage.getItem('kinu_xp_history') || '[]') } catch { return [] }
})
  const [missions, setMissions] = useState(MISSIONS)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hey! I\'m KINU. How can I help you today?' }
  ])
  const [loading, setLoading] = useState(false)

  const colors = THEMES[theme]
  const level = Math.floor(xp / 50) + 1
  const xpInLevel = xp % 50
  const xpProgress = (xpInLevel / 50) * 100

  useEffect(() => {
    localStorage.setItem('kinu_xp', xp)
  }, [xp])

  const addXp = (amount) => {
    setXp(prev => {
      const newXp = prev + amount
      const entry = { xp: newXp, time: new Date().toISOString() }
      const hist = [...xpHistory, entry].slice(-50)
      setXpHistory(hist)
      localStorage.setItem('kinu_xp_history', JSON.stringify(hist))
      return newXp
    })
  }

  const completeMission = (id) => {
    setMissions(prev => prev.map(m => {
      if (m.id === id && !m.done) {
        addXp(m.xp)
        return { ...m, done: true }
      }
      return m
    }))
  }

  const selectMood = (m) => {
    setMood(m)
    addXp(20)
    completeMission(2)
    const entry = { mood: m.label, emoji: m.emoji, time: new Date().toISOString() }
    const updated = [...moodHistory, entry].slice(-30)
    setMoodHistory(updated)
    localStorage.setItem('kinu_mood_history', JSON.stringify(updated))
  }

  const sendMessage = async () => {
    if (!chatInput.trim() || loading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    addXp(10)
    completeMission(1)

    try {
      const res = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: [] })
      })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      setMessages(prev => [...prev, { role: 'ai', text: '' }])

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.token) {
                full += parsed.token
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'ai', text: full }
                  return updated
                })
              }
            } catch {}
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Start KINU server: python3 ~/ai-chatbot/app.py' }])
    }
    setLoading(false)
  }

  const styles = {
    app: {
      background: '#0a0a0a',
      color: '#e8e8e8',
      minHeight: '100vh',
      fontFamily: "'IBM Plex Mono', monospace",
      display: 'flex',
      flexDirection: 'column'
    },
    nav: {
      background: '#111',
      borderBottom: `1px solid ${colors.primary}33`,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    logo: {
      color: colors.primary,
      fontSize: '18px',
      fontWeight: 700,
      letterSpacing: '3px'
    },
    navTabs: {
      display: 'flex',
      gap: '8px'
    },
    navTab: (active) => ({
      background: active ? colors.primary + '22' : 'transparent',
      border: `1px solid ${active ? colors.primary : '#333'}`,
      color: active ? colors.primary : '#666',
      padding: '6px 14px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '11px',
      letterSpacing: '1px'
    }),
    xpBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '11px',
      color: '#666'
    },
    bar: {
      width: '80px',
      height: '6px',
      background: '#222',
      borderRadius: '3px',
      overflow: 'hidden'
    },
    barFill: {
      height: '100%',
      width: `${xpProgress}%`,
      background: colors.primary,
      borderRadius: '3px',
      transition: 'width 0.3s'
    },
    content: {
      flex: 1,
      padding: '28px',
      maxWidth: '1000px',
      margin: '0 auto',
      width: '100%'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '16px'
    },
    card: {
      background: '#111',
      border: '1px solid #222',
      borderRadius: '12px',
      padding: '20px'
    },
    cardTitle: {
      fontSize: '10px',
      letterSpacing: '2px',
      color: '#666',
      textTransform: 'uppercase',
      marginBottom: '12px'
    },
    statBig: {
      fontSize: '36px',
      fontWeight: 700,
      color: colors.primary
    },
    moodGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px'
    },
    moodBtn: (m) => ({
      background: mood?.label === m.label ? m.color + '22' : '#1a1a1a',
      border: `1px solid ${mood?.label === m.label ? m.color : '#333'}`,
      color: mood?.label === m.label ? m.color : '#888',
      padding: '10px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      textAlign: 'center'
    }),
    mission: (done) => ({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 12px',
      background: done ? colors.primary + '11' : '#1a1a1a',
      border: `1px solid ${done ? colors.primary + '44' : '#2a2a2a'}`,
      borderRadius: '8px',
      marginBottom: '8px',
      cursor: done ? 'default' : 'pointer',
      opacity: done ? 0.6 : 1
    }),
    chatWrap: {
      display: 'flex',
      flexDirection: 'column',
      height: '500px',
      background: '#111',
      border: '1px solid #222',
      borderRadius: '12px',
      overflow: 'hidden'
    },
    chatMessages: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    msg: (role) => ({
      background: role === 'user' ? colors.primary + '22' : '#1a1a1a',
      border: `1px solid ${role === 'user' ? colors.primary + '44' : '#2a2a2a'}`,
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '13px',
      lineHeight: '1.6',
      alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
      maxWidth: '80%'
    }),
    chatInput: {
      display: 'flex',
      gap: '8px',
      padding: '12px 16px',
      borderTop: '1px solid #222'
    },
    input: {
      flex: 1,
      background: '#1a1a1a',
      border: '1px solid #333',
      color: '#e8e8e8',
      padding: '10px 14px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '13px',
      outline: 'none'
    },
    sendBtn: {
      background: colors.primary,
      border: 'none',
      color: '#000',
      padding: '10px 18px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 700,
      fontSize: '16px'
    },
    themeGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '10px'
    },
    themeBtn: (name) => ({
      background: THEMES[name].primary + '22',
      border: `2px solid ${theme === name ? THEMES[name].primary : '#333'}`,
      color: THEMES[name].primary,
      padding: '12px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '11px',
      textAlign: 'center'
    })
  }

  return (
    <div style={styles.app}>
      {/* NAV */}
      <nav style={styles.nav}>
        <div style={styles.logo}>🤖 KINU OS</div>
        <div style={styles.navTabs}>
          {['home', 'chat', 'missions', 'visualizer', 'brain', 'themes'].map(t => (
            <button key={t} style={styles.navTab(tab === t)} onClick={() => setTab(t)}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={styles.xpBar}>
          <span style={{ color: colors.primary }}>LVL {level}</span>
          <div style={styles.bar}><div style={styles.barFill} /></div>
          <span>{xp} XP</span>
          <span>🔥 {streak}d</span>
        </div>
      </nav>

      <div style={styles.content}>

        {/* HOME */}
        {tab === 'home' && (
          <>
            <div style={styles.grid}>
              <div style={styles.card}>
                <div style={styles.cardTitle}>Level</div>
                <div style={styles.statBig}>{level}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{xp} XP total · {50 - xpInLevel} to next level</div>
              </div>
              <div style={styles.card}>
                <div style={styles.cardTitle}>Streak</div>
                <div style={styles.statBig}>🔥 {streak}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>days in a row</div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>How are you feeling?</div>
              <div style={styles.moodGrid}>
                {MOODS.map(m => (
                  <button key={m.label} style={styles.moodBtn(m)} onClick={() => selectMood(m)}>
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>
              {mood && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: colors.primary }}>
                  🧠 Noted! Feeling {mood.label.toLowerCase()} today. +20 XP
                </div>
              )}
            </div>
          </>
        )}

        {/* CHAT */}
        {tab === 'chat' && (
          <div style={styles.chatWrap}>
            <div style={styles.chatMessages}>
              {messages.map((m, i) => (
                <div key={i} style={styles.msg(m.role)}>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>
                    {m.role === 'ai' ? '🤖 KINU' : '👤 YOU'}
                  </div>
                  {m.text}
                </div>
              ))}
              {loading && (
                <div style={styles.msg('ai')}>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>🤖 KINU</div>
                  <span style={{ color: colors.primary }}>thinking...</span>
                </div>
              )}
            </div>
            <div style={styles.chatInput}>
              <input
                style={styles.input}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Message KINU..."
              />
              <button style={styles.sendBtn} onClick={sendMessage}>↑</button>
            </div>
          </div>
        )}

        {/* MISSIONS */}
        {tab === 'missions' && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Daily Missions</div>
            {missions.map(m => (
              <div key={m.id} style={styles.mission(m.done)} onClick={() => !m.done && completeMission(m.id)}>
                <span style={{ fontSize: '13px' }}>
                  {m.done ? '✅' : '⬜'} {m.text}
                </span>
                <span style={{ color: colors.primary, fontSize: '12px' }}>+{m.xp} XP</span>
              </div>
            ))}
          </div>
        )}
        
        {/* VISUALIZER */}
        {tab === 'visualizer' && (
          <div style={{ borderRadius: '12px', overflow: 'hidden', height: '600px', border: '1px solid #222' }}>
            <iframe
              src={window.location.protocol === 'file:' ? './visualizer.html' : '/visualizer.html'}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="CYMATICS Visualizer"
            />
          </div>
        )}

        {/* BRAIN ROOM */}
{tab === 'brain' && (
  <div>
    <div style={{...styles.card, marginBottom: '16px'}}>
      <div style={styles.cardTitle}>🧠 Brain Room — Your Stats</div>
      <div style={styles.grid}>
        <div style={{textAlign:'center'}}>
          <div style={styles.statBig}>{level}</div>
          <div style={{color:'#666', fontSize:'12px'}}>Current Level</div>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={styles.statBig}>{xp}</div>
          <div style={{color:'#666', fontSize:'12px'}}>Total XP</div>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={styles.statBig}>🔥{streak}</div>
          <div style={{color:'#666', fontSize:'12px'}}>Day Streak</div>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={styles.statBig}>{missions.filter(m=>m.done).length}/{missions.length}</div>
          <div style={{color:'#666', fontSize:'12px'}}>Missions Done</div>
        </div>
      </div>
    </div>

    <div style={{...styles.card, marginBottom: '16px'}}>
      <div style={styles.cardTitle}>😊 Mood History</div>
      {moodHistory.length === 0 ? (
        <div style={{color:'#666', fontSize:'13px'}}>No mood logs yet — log your mood on the home tab!</div>
      ) : (
        <div style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>
          {moodHistory.slice(-10).reverse().map((m, i) => (
            <div key={i} style={{
              background:'#1a1a1a', border:'1px solid #333',
              borderRadius:'8px', padding:'8px 12px', fontSize:'12px'
            }}>
              <div style={{fontSize:'20px'}}>{m.emoji}</div>
              <div style={{color:'#999'}}>{m.mood}</div>
              <div style={{color:'#555', fontSize:'10px'}}>
                {new Date(m.time).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <div style={styles.card}>
      <div style={styles.cardTitle}>📈 XP Progress</div>
      {xpHistory.length === 0 ? (
        <div style={{color:'#666', fontSize:'13px'}}>No XP history yet — complete missions to earn XP!</div>
      ) : (
        <div style={{display:'flex', alignItems:'flex-end', gap:'4px', height:'100px'}}>
          {xpHistory.slice(-20).map((entry, i, arr) => {
            const max = Math.max(...arr.map(e => e.xp))
            const height = Math.max(8, (entry.xp / max) * 90)
            return (
              <div key={i} style={{
                flex:1, height:`${height}px`,
                background: colors.primary,
                borderRadius:'3px 3px 0 0',
                opacity: 0.4 + (i/arr.length * 0.6)
              }} title={`${entry.xp} XP`}/>
            )
          })}
        </div>
      )}
      <div style={{marginTop:'8px', fontSize:'11px', color:'#666'}}>
        Last {Math.min(xpHistory.length, 20)} XP snapshots
      </div>
    </div>
  </div>
)}

        {/* THEMES */}
        {tab === 'themes' && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Color Themes</div>
            <div style={styles.themeGrid}>
              {Object.keys(THEMES).map(name => (
                <button key={name} style={styles.themeBtn(name)} onClick={() => setTheme(name)}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
