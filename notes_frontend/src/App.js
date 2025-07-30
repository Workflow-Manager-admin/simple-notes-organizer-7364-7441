import React, { useState, useMemo } from 'react';
import './App.css';

// Define color scheme as CSS variables via style injection
const themeVars = {
  '--primary': '#1976d2',
  '--secondary': '#424242',
  '--accent': '#ffca28',
  '--bg-base': '#fff',
  '--bg-sidebar': '#f8f9fa',
  '--text-dark': '#282c34',
  '--border': '#e9ecef',
  '--shadow': 'rgba(70, 90, 130, 0.05)',
};
// Apply theme colors
Object.entries(themeVars).forEach(([k, v]) =>
  document.documentElement.style.setProperty(k, v)
);

// Helpers
const genId = () => Math.random().toString(36).slice(2, 11);

// Default demo content
const DEMO_FOLDERS = [
  { id: 'inbox', name: 'All Notes', builtin: true },
  { id: 'work',  name: 'Work',     builtin: false },
  { id: 'ideas', name: 'Ideas',    builtin: false },
];
const DEMO_TAGS = [
  { id: 'urgent', name: 'Urgent', color: '#ffca28' },
  { id: 'todo', name: 'Todo', color: '#1976d2' }
];
const DEMO_NOTES = [
  { id: genId(), title: "Welcome Note", folder: "inbox", tags: ["urgent"], content: "Welcome to Minimal Notes!\n\nTry editing or creating a note.", updated: Date.now() - 100000 },
  { id: genId(), title: "Work tasks",   folder: "work", tags: ["todo"], content: "Work tasks:\n- Complete proposal\n- Email John", updated: Date.now() - 200000 },
];

// PUBLIC_INTERFACE
function App() {
  // Notes state
  const [notes, setNotes] = useState([...DEMO_NOTES]);
  const [folders, setFolders] = useState([...DEMO_FOLDERS]);
  const [tags, setTags] = useState([...DEMO_TAGS]);
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [activeTag, setActiveTag] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState(notes.length > 0 ? notes[0].id : null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // New note values/editing state
  const selectedNote = notes.find(n => n.id === selectedNoteId) || null;

  // Filtering
  const filteredNotes = useMemo(() => {
    let filtered = notes;
    if (activeFolder && !folders.find(f => f.id === activeFolder)?.builtin) {
      filtered = filtered.filter(n => n.folder === activeFolder);
    }
    if (activeTag) {
      filtered = filtered.filter(n => n.tags.includes(activeTag));
    }
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }
    return filtered.sort((a, b) => b.updated - a.updated);
  }, [notes, activeFolder, activeTag, search, folders]);

  // PUBLIC_INTERFACE
  function createNote() {
    const note = {
      id: genId(),
      title: "Untitled",
      folder: activeFolder || "inbox",
      tags: [],
      content: "",
      updated: Date.now(),
    };
    setNotes(n => [note, ...n]);
    setSelectedNoteId(note.id);
  }

  // PUBLIC_INTERFACE
  function updateNote({ id, ...rest }) {
    setNotes(notes =>
      notes.map(n => (n.id === id ? { ...n, ...rest, updated: Date.now() } : n))
    );
  }

  // PUBLIC_INTERFACE
  function deleteNote(id) {
    setNotes(notes => notes.filter(n => n.id !== id));
    if (selectedNoteId === id) {
      const others = notes.filter(n => n.id !== id);
      setSelectedNoteId(others.length > 0 ? others[0].id : null);
    }
  }

  // PUBLIC_INTERFACE
  function createFolder(name) {
    name = name.trim();
    if (!name || folders.find(f => f.name.toLowerCase() === name.toLowerCase())) return;
    const f = { id: genId(), name, builtin: false };
    setFolders(folders => [...folders, f]);
    setActiveFolder(f.id);
  }
  
  // PUBLIC_INTERFACE
  function deleteFolder(id) {
    setFolders(folders => folders.filter(f => f.id !== id));
    setNotes(notes => notes.map(n => n.folder === id ? { ...n, folder: 'inbox' } : n));
    setActiveFolder('inbox');
  }

  // PUBLIC_INTERFACE
  function createTag(name, color) {
    name = name.trim();
    if (!name || tags.find(t => t.name.toLowerCase() === name.toLowerCase())) return;
    setTags(tags => [...tags, { id: genId(), name, color }]);
  }

  // PUBLIC_INTERFACE
  function deleteTag(id) {
    setTags(tags => tags.filter(t => t.id !== id));
    setNotes(notes => notes.map(n => ({
      ...n, tags: n.tags.filter(tagId => tagId !== id)
    })));
    setActiveTag(null);
  }

  // PUBLIC_INTERFACE
  function assignTag(noteId, tagId) {
    setNotes(notes => notes.map(n =>
      n.id === noteId && !n.tags.includes(tagId) ? { ...n, tags: [...n.tags, tagId] } : n
    ));
  }

  // PUBLIC_INTERFACE
  function removeTag(noteId, tagId) {
    setNotes(notes => notes.map(n =>
      n.id === noteId ? { ...n, tags: n.tags.filter(t => t !== tagId) } : n
    ));
  }

  // UI Components
  // Sidebar navigation
  function Sidebar() {
    const [newFolderName, setNewFolderName] = useState('');
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#1976d2');

    return (
      <aside className="sno-sidebar" data-testid="sidebar">
        <div className="sno-logo">Notes</div>
        <nav>
          <div className="sno-list-label">Folders</div>
          <ul className="sno-folder-list">
            {folders.map(folder => (
              <li
                key={folder.id}
                className={folder.id === activeFolder ? 'active' : ''}
                onClick={() => { setActiveFolder(folder.id); setActiveTag(null); }}
                tabIndex={0}
                aria-label={`Open folder ${folder.name}`}
                title={folder.name}
              >
                <span>{folder.name}</span>
                {!folder.builtin && (
                  <button
                    className="sno-remove-btn"
                    aria-label={`Delete folder ${folder.name}`}
                    onClick={e => { e.stopPropagation(); deleteFolder(folder.id); }}
                  >✕</button>
                )}
              </li>
            ))}
          </ul>
          <form
            className="sno-add-form"
            onSubmit={e => { e.preventDefault(); createFolder(newFolderName); setNewFolderName(''); }}>
            <input
              className="sno-add-input"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Add folder"
              maxLength={18}
              aria-label="Add folder"
            />
            <button
              className="sno-add-btn"
              type="submit"
              title="Add folder"
            >＋</button>
          </form>

          <div className="sno-list-label" style={{marginTop: 30}}>Tags</div>
          <ul className="sno-tag-list">
            {tags.map(tag => (
              <li
                key={tag.id}
                className={activeTag === tag.id ? 'active' : ''}
                onClick={() => { setActiveTag(tag.id); setActiveFolder(null); }}
                tabIndex={0}
                aria-label={`Filter by tag ${tag.name}`}
                title={tag.name}
              >
                <span className="tag-dot" style={{ background: tag.color }} />{tag.name}
                <button
                  className="sno-remove-btn"
                  aria-label={`Delete tag ${tag.name}`}
                  onClick={e => { e.stopPropagation(); deleteTag(tag.id); }}
                >✕</button>
              </li>
            ))}
          </ul>
          <form
            className="sno-add-form"
            style={{ marginBottom: 10 }}
            onSubmit={e => { e.preventDefault(); createTag(newTagName, newTagColor); setNewTagName(''); }}>
            <input
              className="sno-add-input"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              placeholder="Add tag"
              maxLength={14}
              aria-label="Add tag"
            />
            <input
              className="sno-color-input"
              type="color"
              value={newTagColor}
              onChange={e => setNewTagColor(e.target.value)}
              title="Tag color"
              aria-label="Tag color"
            />
            <button
              className="sno-add-btn"
              type="submit"
              title="Add tag"
            >＋</button>
          </form>
        </nav>
      </aside>
    );
  }

  // Search bar and note list
  function NoteList() {
    return (
      <section className="sno-list">
        <div className="sno-search-container">
          <input
            className="sno-search"
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            aria-label="Search notes"
          />
          <button className="sno-new-btn" onClick={createNote} title="Create new note" aria-label="Create new note">
            ＋ Note
          </button>
        </div>
        <ul className="sno-notes">
          {filteredNotes.length === 0 &&
            <li className="sno-empty">No notes found.</li>
          }
          {filteredNotes.map(note => (
            <li
              className={note.id === selectedNoteId ? 'active' : ''}
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              tabIndex={0}
              aria-label={`Open note: ${note.title || '(untitled)'}`}
              title={note.title || '(untitled)'}
            >
              <div className="sno-note-title">{note.title || 'Untitled'}</div>
              <div className="sno-note-meta">
                <span className="sno-note-date">{toShortDate(note.updated)}</span>
                <span className="sno-tag-chips">
                  {note.tags.map(tagId => {
                    const tag = tags.find(t => t.id === tagId);
                    return tag ? (
                      <span key={tag.id}
                        className="sno-chip"
                        style={{ background: tag.color }}>
                        {tag.name}
                      </span>
                    ) : null;
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // Note editor (view/edit selected note)
  function NoteEditor() {
    const [title, setTitle] = useState(selectedNote?.title || '');
    const [content, setContent] = useState(selectedNote?.content || '');

    React.useEffect(() => {
      setTitle(selectedNote?.title || '');
      setContent(selectedNote?.content || '');
    }, [selectedNoteId, selectedNote]);

    if (!selectedNote) {
      return (
        <section className="sno-editor-empty">
          <span>Select or create a note to start editing.</span>
        </section>
      );
    }

    function handleSave() {
      updateNote({ id: selectedNote.id, title, content });
    }
    function handleDelete() {
      if (window.confirm('Delete this note?')) {
        deleteNote(selectedNote.id);
      }
    }

    // Tag assignment/removal for current note
    function handleTagToggle(tagId) {
      if (selectedNote.tags.includes(tagId)) {
        removeTag(selectedNote.id, tagId);
      } else {
        assignTag(selectedNote.id, tagId);
      }
    }

    // Folder change handler
    function handleFolderChange(e) {
      updateNote({ id: selectedNote.id, folder: e.target.value });
    }

    return (
      <section className="sno-editor" aria-label="Note editor">
        <input
          className="sno-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          aria-label="Note title"
          onBlur={handleSave}
          maxLength={60}
        />
        <textarea
          className="sno-content"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Start typing your note..."
          aria-label="Note content"
          rows={12}
          onBlur={handleSave}
        />
        <div className="sno-bar">
          <div className="sno-meta">
            <select
              className="sno-folder-select"
              value={selectedNote.folder}
              onChange={handleFolderChange}
              aria-label="Choose folder"
            >
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <span className="sno-tag-pills">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  className={`sno-pill${selectedNote.tags.includes(tag.id) ? ' active' : ''}`}
                  style={{ background: tag.color }}
                  onClick={() => handleTagToggle(tag.id)}
                  aria-label={`Toggle tag ${tag.name}`}
                  type="button"
                >{tag.name}</button>
              ))}
            </span>
          </div>
          <button className="sno-delete-btn" onClick={handleDelete} title="Delete note" aria-label="Delete note">Delete</button>
        </div>
      </section>
    );
  }

  // Responsive toggle (for mobile)
  function SidebarToggle() {
    return (
      <button
        className="sno-sidebar-toggle"
        onClick={() => setSidebarOpen(x => !x)}
        aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
        title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >☰</button>
    );
  }

  // Main layout
  return (
    <div className="sno-root">
      <SidebarToggle />
      <div className={`sno-layout${isSidebarOpen ? '' : ' hide-sidebar'}`}>
        <Sidebar />
        <main className="sno-main">
          <NoteList />
          <NoteEditor />
        </main>
      </div>
    </div>
  );
}

// Date formatting
function toShortDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString([], {month:'short',day:'numeric'});
}

export default App;
