import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, CheckSquare, X } from 'lucide-react';

function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { list: tasks } = useSelector((s) => s.tasks);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 10);
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTasks = tasks.filter((t) => 
    t.title.toLowerCase().includes(query.toLowerCase()) || 
    t.description?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5); // show max 5 results

  const handleSelect = () => {
    setIsOpen(false);
    navigate('/tasks');
    // If we had task specific modals, we'd open it here. For now, navigate to the board.
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '15vh'
    }} onClick={() => setIsOpen(false)}>
      <div 
        style={{
          width: '90%', maxWidth: 500, background: 'var(--bg-card)',
          borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
          border: '1px solid var(--border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: 12 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks... (Type to filter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: '1rem', color: 'var(--text-primary)'
            }}
          />
          <button className="btn-icon" onClick={() => setIsOpen(false)}>
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>

        {/* Results */}
        <div style={{ padding: '8px 0', maxHeight: 300, overflowY: 'auto' }}>
          {query.length > 0 && filteredTasks.length === 0 ? (
            <p style={{ padding: '12px 24px', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
              No matching tasks found.
            </p>
          ) : query.length === 0 ? (
            <p style={{ padding: '12px 24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Start typing to search across your workspace...
            </p>
          ) : (
            filteredTasks.map((t) => (
              <div 
                key={t._id} 
                onClick={handleSelect}
                style={{
                  padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', transition: 'background 0.2s',
                  ':hover': { background: 'var(--alpha-bg)' }
                }}
                className="cmd-item"
              >
                <CheckSquare size={16} color="var(--accent)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.title}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status: {t.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Footer shortcuts */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)', display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ background: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: 4, border: '1px solid var(--border)' }}>ESC</span> to dismiss
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ background: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: 4, border: '1px solid var(--border)' }}>↵</span> to navigate
          </span>
        </div>
      </div>
      <style>{`
        .cmd-item:hover { background: var(--bg-hover) !important; }
      `}</style>
    </div>
  );
}

export default CommandPalette;
