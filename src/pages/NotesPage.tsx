import { useState, type FormEvent } from "react";
import { ErrorText, Pagination, usePaged } from "../components/common";
import { api, errorMessage, type Note } from "../services/api";

export function NotesPage() {
  const { data: notes, meta, loading, error, setPage, reload } = usePaged(api.listNotes);
  const [editing, setEditing] = useState<Note | null>(null);
  const [viewing, setViewing] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function startEdit(note: Note | null) {
    setEditing(note);
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setFormError(null);
  }

  async function open(id: string) {
    try {
      setViewing((await api.getNote(id)).data);
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      if (editing) await api.updateNote(editing.id, { title, content });
      else await api.createNote({ title, content });
      startEdit(null);
      setViewing(null);
      await reload();
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  async function remove(note: Note) {
    if (!confirm(`Delete "${note.title}"?`)) return;
    try {
      await api.deleteNote(note.id);
      if (viewing?.id === note.id) setViewing(null);
      await reload();
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  return (
    <section>
      <h2>My notes</h2>
      <form className="card" onSubmit={submit}>
        <h3>{editing ? "Edit note" : "New note"}</h3>
        <input placeholder="Title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Content" rows={4} value={content} onChange={(e) => setContent(e.target.value)} />
        <ErrorText error={formError} />
        <div className="row">
          <button type="submit">{editing ? "Save changes" : "Create note"}</button>
          {editing && (
            <button type="button" onClick={() => startEdit(null)}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {viewing && (
        <article className="card">
          <h3>{viewing.title}</h3>
          <p className="pre">{viewing.content || <em>(no content)</em>}</p>
          <small>Updated {new Date(viewing.updatedAt).toLocaleString()}</small>
          <div className="row">
            <button onClick={() => setViewing(null)}>Close</button>
          </div>
        </article>
      )}

      <ErrorText error={error} />
      {loading && <p>Loading…</p>}
      {!loading && notes?.length === 0 && <p>You have no notes yet.</p>}
      <ul className="list">
        {notes?.map((note) => (
          <li key={note.id}>
            <strong>{note.title}</strong>
            <small> · {new Date(note.createdAt).toLocaleString()}</small>
            <div className="row">
              <button onClick={() => open(note.id)}>Read</button>
              <button onClick={() => startEdit(note)}>Edit</button>
              <button className="danger" onClick={() => remove(note)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <Pagination meta={meta} onPage={setPage} />
    </section>
  );
}
