import { useState, useEffect, useCallback } from "react";

// ── Constants ────────────────────────────────────────────────────────────────

const INTERVALS = [1, 2, 4, 8, 16, 32, 64]; // days per level 1–7
const STORAGE_KEY = "leitner-v2";

const BOX_THEMES = [
  { accent: "#D4A853" },
  { accent: "#5BAFCE" },
  { accent: "#A07BE8" },
  { accent: "#5DCE8F" },
  { accent: "#E87070" },
  { accent: "#CE9A5B" },
];

const EMOJI_OPTIONS = ["📚","🧠","🌍","🔬","🎵","💻","🏛️","🌿","⚗️","🎨","🗣️","🦷","⚖️","🧪","📐","🐾"];
const LVL_LABELS = ["Daily","2 days","4 days","8 days","16 days","32 days","64 days"];

// ── Helpers ──────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split("T")[0];
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; };
const yesterdayStr = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split("T")[0]; };
const isDue = (c) => !c.nextReview || c.nextReview <= todayStr();
const uid = () => Math.random().toString(36).slice(2, 9);

const loadData = async () => {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
};
const saveData = async (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
};
// ── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#12100e;--surface:#1c1915;--surface2:#252118;--surface3:#2e2a22;
  --text:#f0e8d5;--muted:#7a7060;--border:#302c24;
}
body{background:var(--bg);}

.app{min-height:100vh;background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;max-width:430px;margin:0 auto;}
.screen{padding:28px 20px 60px;min-height:100vh;}

.home-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;}
.home-date{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:var(--muted);margin-bottom:5px;}
.home-title{font-family:'Lora',serif;font-size:26px;font-weight:700;line-height:1.1;}
.streak-pill{display:flex;flex-direction:column;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:10px 14px;min-width:58px;}
.streak-num{font-family:'Lora',serif;font-size:22px;font-weight:700;line-height:1;color:#D4A853;}
.streak-lbl{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-top:3px;}

.stats-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:32px;}
.stat-tile{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px 12px;text-align:center;}
.stat-num{font-family:'Lora',serif;font-size:30px;font-weight:700;line-height:1;}
.stat-lbl{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-top:5px;}

.section-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
.section-title{font-family:'Lora',serif;font-size:17px;font-weight:600;}
.icon-btn{width:32px;height:32px;border-radius:50%;background:var(--surface3);border:1px solid var(--border);color:var(--text);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s;}
.icon-btn:hover{background:var(--border);}

.box-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.box-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:18px 16px;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;position:relative;overflow:hidden;}
.box-card:hover{transform:translateY(-3px);}
.box-card-stripe{position:absolute;top:0;left:0;right:0;height:3px;border-radius:20px 20px 0 0;}
.box-card-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
.box-emoji{font-size:30px;line-height:1;}
.box-badge{font-size:11px;font-weight:700;border-radius:20px;padding:3px 8px;color:#12100e;}
.box-name{font-weight:600;font-size:14px;line-height:1.3;margin-bottom:4px;}
.box-sub{font-size:11px;color:var(--muted);margin-bottom:12px;}
.level-dots{display:flex;gap:3px;}
.level-dot{flex:1;height:3px;border-radius:2px;background:var(--border);}

.empty-wrap{grid-column:1/-1;text-align:center;padding:52px 24px;}
.empty-ico{font-size:44px;margin-bottom:14px;opacity:0.5;}
.empty-txt{color:var(--muted);font-size:14px;line-height:1.6;}

.nav{display:flex;align-items:center;gap:12px;margin-bottom:28px;}
.back-btn{background:none;border:none;color:var(--muted);font-size:14px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:4px;padding:0;}
.back-btn:hover{color:var(--text);}
.nav-spacer{flex:1;}
.nav-action{background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;padding:0;}
.nav-action:hover{color:var(--text);}

.box-hero{margin-bottom:28px;}
.box-hero-emoji{font-size:44px;display:block;margin-bottom:10px;}
.box-hero-name{font-family:'Lora',serif;font-size:30px;font-weight:700;margin-bottom:6px;}
.box-hero-sub{font-size:13px;color:var(--muted);}

.breakdown{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;margin-bottom:22px;}
.breakdown-title{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-bottom:14px;}
.lvl-row{display:flex;align-items:center;gap:10px;margin-bottom:9px;}
.lvl-row:last-child{margin-bottom:0;}
.lvl-lbl{font-size:11px;color:var(--muted);width:52px;flex-shrink:0;}
.lvl-track{flex:1;height:5px;background:var(--border);border-radius:3px;overflow:hidden;}
.lvl-fill{height:100%;border-radius:3px;transition:width 0.4s ease;}
.lvl-cnt{font-size:11px;color:var(--muted);width:18px;text-align:right;flex-shrink:0;}

.box-actions{display:flex;flex-direction:column;gap:10px;margin-bottom:28px;}
.btn-primary{padding:15px 24px;border:none;border-radius:14px;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity 0.15s,transform 0.1s;color:#12100e;}
.btn-primary:hover{opacity:0.88;transform:scale(0.99);}
.btn-primary:disabled{opacity:0.35;cursor:not-allowed;transform:none;}
.btn-secondary{padding:13px 24px;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:14px;font-size:14px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:border-color 0.15s;}
.btn-secondary:hover{border-color:var(--muted);}
.btn-secondary:disabled{opacity:0.35;cursor:not-allowed;}
.caught-up{text-align:center;padding:14px;font-size:14px;font-weight:500;border-radius:14px;background:rgba(93,206,143,0.08);color:#5DCE8F;}

.cards-list-title{font-family:'Lora',serif;font-size:16px;margin-bottom:12px;}
.card-row{display:flex;align-items:center;padding:11px 14px;background:var(--surface);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;gap:10px;}
.card-row-l{width:3px;height:36px;border-radius:2px;flex-shrink:0;}
.card-row-body{flex:1;min-width:0;}
.card-row-front{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.card-row-back{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}
.card-row-right{display:flex;align-items:center;gap:6px;flex-shrink:0;}
.card-row-lvl{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);}
.card-row-btn{background:none;border:none;color:var(--muted);font-size:14px;cursor:pointer;padding:3px 5px;line-height:1;border-radius:6px;}
.card-row-btn:hover{color:var(--text);background:var(--surface3);}
.card-row-btn.del:hover{color:#E87070;background:rgba(232,112,112,0.1);}

.study-screen{display:flex;flex-direction:column;min-height:100vh;padding:20px 20px 32px;}
.study-nav{display:flex;align-items:center;gap:12px;margin-bottom:36px;}
.prog-bar{flex:1;height:4px;background:var(--surface3);border-radius:2px;overflow:hidden;}
.prog-fill{height:100%;border-radius:2px;transition:width 0.3s ease;}
.study-ctr{font-size:12px;color:var(--muted);flex-shrink:0;}
.close-btn{background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;line-height:1;padding:0;}

.card-wrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;perspective:1200px;}
.flashcard{width:100%;max-width:360px;height:230px;position:relative;transform-style:preserve-3d;transition:transform 0.55s cubic-bezier(0.4,0,0.2,1);cursor:pointer;}
.flashcard.flipped{transform:rotateY(180deg);}
.card-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:var(--surface);border:1px solid var(--border);border-radius:22px;padding:28px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;}
.card-face-back{transform:rotateY(180deg);}
.card-side-lbl{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--muted);margin-bottom:16px;}
.card-main-txt{font-family:'Lora',serif;font-size:22px;font-weight:600;line-height:1.4;color:var(--text);}
.card-tap-hint{font-size:11px;color:var(--muted);position:absolute;bottom:18px;}
.card-top-bar{position:absolute;top:0;left:0;right:0;height:3px;border-radius:22px 22px 0 0;}

.answer-row{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;margin:26px 0 12px;}
.btn-miss{padding:15px;background:rgba(232,112,112,0.1);color:#E87070;border:1px solid rgba(232,112,112,0.25);border-radius:16px;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background 0.15s;}
.btn-got{padding:15px;background:rgba(93,206,143,0.1);color:#5DCE8F;border:1px solid rgba(93,206,143,0.25);border-radius:16px;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background 0.15s;}
.btn-skip{padding:15px 12px;background:var(--surface2);color:var(--muted);border:1px solid var(--border);border-radius:16px;font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap;}
.btn-miss:hover{background:rgba(232,112,112,0.18);}
.btn-got:hover{background:rgba(93,206,143,0.18);}
.btn-skip:hover{background:var(--surface3);color:var(--text);}
.study-hint{text-align:center;font-size:12px;color:var(--muted);}

.done-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:40px 24px;}
.done-ico{font-size:68px;margin-bottom:20px;}
.done-h{font-family:'Lora',serif;font-size:30px;font-weight:700;margin-bottom:8px;}
.done-sub{font-size:14px;color:var(--muted);margin-bottom:28px;}
.done-stats{display:flex;gap:12px;margin-bottom:36px;}
.done-stat{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px 20px;text-align:center;}
.done-stat-n{font-family:'Lora',serif;font-size:26px;font-weight:700;}
.done-stat-l{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-top:4px;}
.c-green{color:#5DCE8F;}.c-red{color:#E87070;}.c-muted{color:var(--muted);}

.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);display:flex;align-items:flex-end;z-index:200;backdrop-filter:blur(6px);}
.sheet{background:var(--surface);border:1px solid var(--border);border-radius:24px 24px 0 0;padding:28px 22px 36px;width:100%;max-height:88vh;overflow-y:auto;}
.sheet-handle{width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 22px;}
.sheet-title{font-family:'Lora',serif;font-size:22px;font-weight:700;margin-bottom:24px;}

.field{margin-bottom:18px;}
.field-lbl{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);display:block;margin-bottom:8px;}
.field-input{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:13px 14px;color:var(--text);font-size:15px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.15s;}
.field-input:focus{border-color:var(--muted);}
.field-input::placeholder{color:var(--muted);}

.emoji-grid{display:flex;flex-wrap:wrap;gap:8px;}
.emoji-btn{background:var(--surface2);border:2px solid transparent;border-radius:10px;width:42px;height:42px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.emoji-btn.sel{border-color:#D4A853;}

.color-row{display:flex;gap:10px;}
.color-dot{width:30px;height:30px;border-radius:50%;border:3px solid transparent;cursor:pointer;transition:transform 0.1s;}
.color-dot.sel{transform:scale(1.2);outline:2px solid var(--bg);outline-offset:2px;}

.modal-btns{display:flex;gap:10px;margin-top:24px;}
.modal-btns .btn-primary,.modal-btns .btn-secondary{flex:1;}

.queue{margin-top:20px;}
.queue-hdr{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-bottom:10px;}
.queue-item{background:var(--surface2);border-radius:12px;padding:13px 38px 13px 14px;margin-bottom:8px;position:relative;}
.queue-front{font-size:13px;font-weight:500;margin-bottom:3px;}
.queue-back{font-size:12px;color:var(--muted);}
.queue-rm{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer;padding:4px;line-height:1;}
.queue-rm:hover{color:#E87070;}

.danger-zone{margin-top:28px;padding-top:20px;border-top:1px solid var(--border);}
.danger-zone-title{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-bottom:12px;}
.btn-danger{width:100%;padding:13px;background:rgba(232,112,112,0.08);color:#E87070;border:1px solid rgba(232,112,112,0.2);border-radius:14px;font-size:14px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;}
.btn-danger:hover{background:rgba(232,112,112,0.16);}

.confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:300;padding:24px;}
.confirm-box{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:24px;width:100%;max-width:320px;text-align:center;}
.confirm-title{font-family:'Lora',serif;font-size:18px;font-weight:700;margin-bottom:8px;}
.confirm-sub{font-size:13px;color:var(--muted);margin-bottom:22px;line-height:1.5;}
.confirm-btns{display:flex;gap:10px;}
.confirm-btns .btn-secondary{flex:1;}
.confirm-btns .btn-danger{flex:1;padding:13px;}
`;

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [data, setData] = useState(null);
  const [view, setView] = useState("home");
  const [boxId, setBoxId] = useState(null);
  const [modal, setModal] = useState(null);
  const [editCard, setEditCard] = useState(null);

  useEffect(() => {
    loadData().then(d => setData(d || { boxes: [], streak: 0, lastStudied: null }));
  }, []);

  const save = useCallback((next) => { setData(next); saveData(next); }, []);

  if (!data) return (
    <div style={{ height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#12100e",color:"#7a7060",fontFamily:"sans-serif",fontSize:14 }}>
      Loading…
    </div>
  );

  const box = data.boxes.find(b => b.id === boxId);
  const dueCards = box ? box.cards.filter(isDue) : [];
  const totalDue = data.boxes.reduce((s, b) => s + b.cards.filter(isDue).length, 0);
  const totalCards = data.boxes.reduce((s, b) => s + b.cards.length, 0);

  const handleCreateBox = (name, emoji, themeIdx) => {
    save({ ...data, boxes: [...data.boxes, { id: uid(), name, emoji, theme: BOX_THEMES[themeIdx % BOX_THEMES.length], cards: [] }] });
    setModal(null);
  };

  const handleEditBox = (name, emoji, themeIdx) => {
    save({ ...data, boxes: data.boxes.map(b => b.id === boxId ? { ...b, name, emoji, theme: BOX_THEMES[themeIdx % BOX_THEMES.length] } : b) });
    setModal(null);
  };

  const handleDeleteBox = () => {
    save({ ...data, boxes: data.boxes.filter(b => b.id !== boxId) });
    setView("home"); setModal(null);
  };

  const handleAddCards = (cards) => {
    save({
      ...data,
      boxes: data.boxes.map(b => b.id === boxId
        ? { ...b, cards: [...b.cards, ...cards.map(c => ({ ...c, id: uid(), level: 1, nextReview: todayStr(), lastReviewed: null }))] }
        : b
      )
    });
    setModal(null);
  };

  const handleEditCard = (cardId, front, back) => {
    save({ ...data, boxes: data.boxes.map(b => b.id === boxId ? { ...b, cards: b.cards.map(c => c.id === cardId ? { ...c, front, back } : c) } : b) });
    setEditCard(null);
  };

  const handleDeleteCard = (cardId) => {
    save({ ...data, boxes: data.boxes.map(b => b.id === boxId ? { ...b, cards: b.cards.filter(c => c.id !== cardId) } : b) });
  };

  const handleResult = (cardId, correct) => {
    save({
      ...data,
      boxes: data.boxes.map(b => b.id === boxId
        ? { ...b, cards: b.cards.map(c => {
            if (c.id !== cardId) return c;
            const lvl = correct ? Math.min(c.level + 1, 7) : Math.max(c.level - 1, 1);
            return { ...c, level: lvl, nextReview: addDays(INTERVALS[lvl - 1]), lastReviewed: todayStr() };
          })}
        : b
      )
    });
  };

  const handleSessionDone = () => {
    const today = todayStr();
    let streak = data.streak || 0;
    if (data.lastStudied === yesterdayStr()) streak += 1;
    else if (data.lastStudied !== today) streak = 1;
    save({ ...data, streak, lastStudied: today });
    setView("box");
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {view === "home" && <HomeScreen boxes={data.boxes} totalDue={totalDue} totalCards={totalCards} streak={data.streak || 0} onOpen={(id) => { setBoxId(id); setView("box"); }} onNew={() => setModal("create-box")} />}
        {view === "box" && box && <BoxScreen box={box} dueCards={dueCards} onBack={() => setView("home")} onStudy={() => setView("study")} onAdd={() => setModal("add-card")} onEditBox={() => setModal("edit-box")} onEditCard={setEditCard} onDeleteCard={handleDeleteCard} />}
        {view === "study" && box && <StudyScreen box={box} cards={dueCards} onResult={handleResult} onDone={handleSessionDone} />}
        {modal === "create-box" && <BoxModal onClose={() => setModal(null)} onSave={handleCreateBox} />}
        {modal === "edit-box" && box && <BoxModal onClose={() => setModal(null)} onSave={handleEditBox} onDelete={handleDeleteBox} initial={{ name: box.name, emoji: box.emoji, themeIdx: BOX_THEMES.findIndex(t => t.accent === box.theme.accent) }} />}
        {modal === "add-card" && <AddCardModal onClose={() => setModal(null)} onAdd={handleAddCards} />}
        {editCard && <EditCardModal card={editCard} onClose={() => setEditCard(null)} onSave={(f, b) => handleEditCard(editCard.id, f, b)} />}
      </div>
    </>
  );
}

// ── Home ─────────────────────────────────────────────────────────────────────

function HomeScreen({ boxes, totalDue, totalCards, streak, onOpen, onNew }) {
  const dateStr = new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
  return (
    <div className="screen">
      <div className="home-top">
        <div>
          <div className="home-date">Today</div>
          <h1 className="home-title">{dateStr}</h1>
        </div>
        <div className="streak-pill">
          <div className="streak-num">{streak}</div>
          <div className="streak-lbl">🔥 streak</div>
        </div>
      </div>
      <div className="stats-strip">
        <div className="stat-tile"><div className="stat-num" style={{ color: totalDue > 0 ? "#D4A853" : "inherit" }}>{totalDue}</div><div className="stat-lbl">Due today</div></div>
        <div className="stat-tile"><div className="stat-num">{boxes.length}</div><div className="stat-lbl">Boxes</div></div>
        <div className="stat-tile"><div className="stat-num">{totalCards}</div><div className="stat-lbl">Cards</div></div>
      </div>
      <div className="section-row">
        <h2 className="section-title">Your Boxes</h2>
        <button className="icon-btn" onClick={onNew}>+</button>
      </div>
      <div className="box-grid">
        {boxes.map(b => <BoxCard key={b.id} box={b} onClick={() => onOpen(b.id)} />)}
        {boxes.length === 0 && <div className="empty-wrap"><div className="empty-ico">📭</div><div className="empty-txt">No boxes yet.<br/>Tap + to create your first one.</div></div>}
      </div>
    </div>
  );
}

function BoxCard({ box, onClick }) {
  const due = box.cards.filter(isDue).length;
  const total = box.cards.length;
  const levels = [1,2,3,4,5,6,7].map(l => box.cards.filter(c => c.level === l).length);
  return (
    <div className="box-card" style={{ boxShadow: due > 0 ? `0 0 0 1px ${box.theme.accent}50` : "none" }} onClick={onClick}>
      <div className="box-card-stripe" style={{ background: box.theme.accent }} />
      <div className="box-card-top">
        <span className="box-emoji">{box.emoji}</span>
        {due > 0 && <span className="box-badge" style={{ background: box.theme.accent }}>{due}</span>}
      </div>
      <div className="box-name">{box.name}</div>
      <div className="box-sub">{total} card{total !== 1 ? "s" : ""}</div>
      <div className="level-dots">
        {levels.map((count, i) => <div key={i} className="level-dot" style={{ background: count > 0 ? box.theme.accent : undefined, opacity: count > 0 ? 0.25 + i * 0.12 : 1 }} />)}
      </div>
    </div>
  );
}

// ── Box Screen ────────────────────────────────────────────────────────────────

function BoxScreen({ box, dueCards, onBack, onStudy, onAdd, onEditBox, onEditCard, onDeleteCard }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const total = box.cards.length;
  const levels = [1,2,3,4,5,6,7].map(l => box.cards.filter(c => c.level === l).length);
  return (
    <div className="screen">
      <div className="nav">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="nav-spacer" />
        <button className="nav-action" onClick={onEditBox}>Edit box</button>
      </div>
      <div className="box-hero">
        <span className="box-hero-emoji">{box.emoji}</span>
        <h1 className="box-hero-name" style={{ color: box.theme.accent }}>{box.name}</h1>
        <div className="box-hero-sub">{total} card{total !== 1 ? "s" : ""} total · {dueCards.length} due today</div>
      </div>
      {total > 0 && (
        <div className="breakdown">
          <div className="breakdown-title">Level Breakdown</div>
          {[1,2,3,4,5,6,7].map((l, i) => (
            <div key={l} className="lvl-row">
              <div className="lvl-lbl">{LVL_LABELS[i]}</div>
              <div className="lvl-track"><div className="lvl-fill" style={{ width:`${total ? (levels[i]/total)*100 : 0}%`, background:box.theme.accent }} /></div>
              <div className="lvl-cnt">{levels[i]}</div>
            </div>
          ))}
        </div>
      )}
      <div className="box-actions">
        {dueCards.length > 0
          ? <button className="btn-primary" style={{ background: box.theme.accent }} onClick={onStudy}>Study {dueCards.length} card{dueCards.length !== 1 ? "s" : ""} →</button>
          : total > 0 ? <div className="caught-up">✓ All caught up for today!</div> : null
        }
        <button className="btn-secondary" onClick={onAdd}>+ Add Cards</button>
      </div>
      {box.cards.length > 0 && (
        <>
          <div className="cards-list-title">All Cards</div>
          {box.cards.map(c => (
            <div key={c.id} className="card-row">
              <div className="card-row-l" style={{ background: box.theme.accent }} />
              <div className="card-row-body">
                <div className="card-row-front">{c.front}</div>
                <div className="card-row-back">{c.back}</div>
              </div>
              <div className="card-row-right">
                <div className="card-row-lvl">Lvl {c.level}</div>
                <button className="card-row-btn" onClick={() => onEditCard(c)}>✎</button>
                <button className="card-row-btn del" onClick={() => setConfirmDelete(c)}>✕</button>
              </div>
            </div>
          ))}
        </>
      )}
      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-title">Delete card?</div>
            <div className="confirm-sub">"{confirmDelete.front}" will be permanently removed.</div>
            <div className="confirm-btns">
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => { onDeleteCard(confirmDelete.id); setConfirmDelete(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Study Screen ──────────────────────────────────────────────────────────────

function StudyScreen({ box, cards: init, onResult, onDone }) {
  const [queue, setQueue] = useState([...init]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ got:0, miss:0, skip:0 });

  if (init.length === 0) { onDone(); return null; }
  const card = queue[idx];
  const progress = (idx / queue.length) * 100;

  const advance = () => {
    if (idx + 1 >= queue.length) setDone(true);
    else { setIdx(i => i + 1); setFlipped(false); }
  };

  const handleAnswer = (correct) => {
    onResult(card.id, correct);
    setStats(s => ({ ...s, [correct ? "got" : "miss"]: s[correct ? "got" : "miss"] + 1 }));
    advance();
  };

  const handleSkip = () => {
    setStats(s => ({ ...s, skip: s.skip + 1 }));
    const q = [...queue];
    const [skipped] = q.splice(idx, 1);
    q.push(skipped);
    setQueue(q);
    setFlipped(false);
  };

  if (done) return (
    <div className="done-screen">
      <div className="done-ico">🎉</div>
      <h2 className="done-h">Session done!</h2>
      <div className="done-sub">{box.name}</div>
      <div className="done-stats">
        <div className="done-stat"><div className="done-stat-n c-green">{stats.got}</div><div className="done-stat-l">Got it</div></div>
        <div className="done-stat"><div className="done-stat-n c-red">{stats.miss}</div><div className="done-stat-l">Missed</div></div>
        <div className="done-stat"><div className="done-stat-n c-muted">{stats.skip}</div><div className="done-stat-l">Skipped</div></div>
      </div>
      <button className="btn-primary" style={{ background:box.theme.accent, width:"100%", maxWidth:280 }} onClick={onDone}>Back to box</button>
    </div>
  );

  return (
    <div className="study-screen">
      <div className="study-nav">
        <button className="close-btn" onClick={onDone}>✕</button>
        <div className="prog-bar"><div className="prog-fill" style={{ width:`${progress}%`, background:box.theme.accent }} /></div>
        <div className="study-ctr">{idx + 1} / {queue.length}</div>
      </div>
      <div className="card-wrap">
        <div className={`flashcard${flipped ? " flipped" : ""}`} onClick={() => setFlipped(f => !f)}>
          <div className="card-face">
            <div className="card-top-bar" style={{ background:box.theme.accent }} />
            <div className="card-side-lbl">Question</div>
            <div className="card-main-txt">{card.front}</div>
            {!flipped && <div className="card-tap-hint">tap to reveal answer</div>}
          </div>
          <div className="card-face card-face-back">
            <div className="card-top-bar" style={{ background:box.theme.accent }} />
            <div className="card-side-lbl">Answer</div>
            <div className="card-main-txt">{card.back}</div>
          </div>
        </div>
      </div>
      {flipped ? (
        <div className="answer-row">
          <button className="btn-miss" onClick={() => handleAnswer(false)}>✕ Missed</button>
          <button className="btn-skip" onClick={handleSkip}>Skip</button>
          <button className="btn-got" onClick={() => handleAnswer(true)}>✓ Got it</button>
        </div>
      ) : <div style={{ height:66 }} />}
      <div className="study-hint">Level {card.level} · {LVL_LABELS[card.level - 1]}</div>
    </div>
  );
}

// ── Box Modal ─────────────────────────────────────────────────────────────────

function BoxModal({ onClose, onSave, onDelete, initial }) {
  const [name, setName] = useState(initial?.name || "");
  const [emoji, setEmoji] = useState(initial?.emoji || "📚");
  const [themeIdx, setThemeIdx] = useState(initial?.themeIdx ?? 0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = !!initial;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">{isEdit ? "Edit Box" : "New Box"}</div>
        <div className="field">
          <label className="field-lbl">Name</label>
          <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spanish Vocabulary" autoFocus />
        </div>
        <div className="field">
          <label className="field-lbl">Icon</label>
          <div className="emoji-grid">{EMOJI_OPTIONS.map(e => <button key={e} className={`emoji-btn${emoji===e?" sel":""}`} onClick={() => setEmoji(e)}>{e}</button>)}</div>
        </div>
        <div className="field">
          <label className="field-lbl">Color</label>
          <div className="color-row">{BOX_THEMES.map((t,i) => <button key={i} className={`color-dot${themeIdx===i?" sel":""}`} style={{ background:t.accent }} onClick={() => setThemeIdx(i)} />)}</div>
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ background:BOX_THEMES[themeIdx].accent }} disabled={!name.trim()} onClick={() => name.trim() && onSave(name.trim(), emoji, themeIdx)}>{isEdit ? "Save" : "Create"}</button>
        </div>
        {isEdit && onDelete && (
          <div className="danger-zone">
            <div className="danger-zone-title">Danger Zone</div>
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete this box</button>
          </div>
        )}
      </div>
      {confirmDelete && (
        <div className="confirm-overlay" onClick={e => e.stopPropagation()}>
          <div className="confirm-box">
            <div className="confirm-title">Delete box?</div>
            <div className="confirm-sub">All cards inside will be permanently lost. This can't be undone.</div>
            <div className="confirm-btns">
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn-danger" onClick={onDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Card Modal ────────────────────────────────────────────────────────────

function AddCardModal({ onClose, onAdd }) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [queue, setQueue] = useState([]);

  const addToQueue = () => {
    if (!front.trim() || !back.trim()) return;
    setQueue(q => [...q, { front:front.trim(), back:back.trim() }]);
    setFront(""); setBack("");
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">Add Cards</div>
        <div className="field">
          <label className="field-lbl">Front</label>
          <input className="field-input" value={front} onChange={e => setFront(e.target.value)} placeholder="Question or term" autoFocus />
        </div>
        <div className="field">
          <label className="field-lbl">Back</label>
          <input className="field-input" value={back} onChange={e => setBack(e.target.value)} placeholder="Answer or definition" onKeyDown={e => e.key === "Enter" && addToQueue()} />
        </div>
        <button className="btn-secondary" onClick={addToQueue} disabled={!front.trim() || !back.trim()}>+ Add to queue</button>
        {queue.length > 0 && (
          <div className="queue">
            <div className="queue-hdr">{queue.length} card{queue.length !== 1 ? "s" : ""} queued</div>
            {queue.map((c,i) => (
              <div key={i} className="queue-item">
                <div className="queue-front">{c.front}</div>
                <div className="queue-back">{c.back}</div>
                <button className="queue-rm" onClick={() => setQueue(q => q.filter((_,j) => j!==i))}>×</button>
              </div>
            ))}
          </div>
        )}
        <div className="modal-btns">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ background:"#D4A853" }} disabled={!queue.length} onClick={() => queue.length && onAdd(queue)}>
            Save {queue.length > 0 ? queue.length : ""} Card{queue.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Card Modal ───────────────────────────────────────────────────────────

function EditCardModal({ card, onClose, onSave }) {
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">Edit Card</div>
        <div className="field">
          <label className="field-lbl">Front</label>
          <input className="field-input" value={front} onChange={e => setFront(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label className="field-lbl">Back</label>
          <input className="field-input" value={back} onChange={e => setBack(e.target.value)} onKeyDown={e => e.key==="Enter" && front.trim() && back.trim() && onSave(front.trim(), back.trim())} />
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ background:"#D4A853" }} disabled={!front.trim() || !back.trim()} onClick={() => onSave(front.trim(), back.trim())}>Save</button>
        </div>
      </div>
    </div>
  );
}
 