import { useState, type FormEvent } from "react";
import { ErrorText, Pagination, usePaged } from "../components/common";
import { useAuth } from "../context/AuthContext";
import { api, errorMessage, parseInterests, type Note, type Role, type User } from "../services/api";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const emptyForm = { name: "", email: "", password: "", role: "user" as Role, interests: "" };

export function AdminUsersPage({ onOpenPosts }: { onOpenPosts: (userId: string) => void }) {
  const { user: me } = useAuth();
  const { data: users, meta, loading, error, setPage, reload } = usePaged(api.adminListUsers);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function startEdit(user: User | null) {
    setEditing(user);
    setForm(
      user
        ? { name: user.name, email: user.email, password: "", role: user.role, interests: user.interests.join(", ") }
        : emptyForm,
    );
    setFormError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setMessage(null);
    const body = { ...form, interests: parseInterests(form.interests) };
    try {
      if (editing) {
        // Password is only sent when the admin typed a new one.
        const { password, ...rest } = body;
        await api.adminUpdateUser(editing.id, password ? body : rest);
        setMessage(`Updated ${body.email}.`);
      } else {
        await api.adminCreateUser(body);
        setMessage(`Created ${body.email}.`);
      }
      startEdit(null);
      await reload();
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  async function remove(user: User) {
    if (!confirm(`Delete ${user.email} and all of their notes and posts?`)) return;
    setMessage(null);
    try {
      await api.adminDeleteUser(user.id);
      setMessage(`Deleted ${user.email}.`);
      await reload();
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <section>
      <h2>Manage users</h2>
      <form className="card" onSubmit={submit}>
        <h3>{editing ? `Edit ${editing.email}` : "Add user"}</h3>
        <div className="grid">
          <input placeholder="Name" required {...field("name")} />
          <input placeholder="Email" type="email" required {...field("email")} />
          <input
            placeholder={editing ? "New password (leave blank to keep)" : "Password"}
            type="password"
            required={!editing}
            {...field("password")}
          />
          <select {...field("role")}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <input placeholder="Interests (comma-separated)" {...field("interests")} />
        </div>
        <ErrorText error={formError} />
        {message && <p className="notice">{message}</p>}
        <div className="row">
          <button type="submit">{editing ? "Save changes" : "Add user"}</button>
          {editing && (
            <button type="button" onClick={() => startEdit(null)}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <ErrorText error={error} />
      {loading && <p>Loading…</p>}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Interests</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr key={user.id}>
              <td>
                {user.name}
                {user.id === me?.id && <small> (you)</small>}
              </td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.interests.join(", ")}</td>
              <td className="row">
                <button onClick={() => startEdit(user)}>Edit</button>
                <button onClick={() => onOpenPosts(user.id)}>Posts</button>
                <button className="danger" onClick={() => remove(user)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination meta={meta} onPage={setPage} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// All notes (read-only)
// ---------------------------------------------------------------------------

export function AdminNotesPage() {
  const { data: notes, meta, loading, error, setPage } = usePaged(api.adminListNotes);
  const [viewing, setViewing] = useState<Note | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);

  async function open(note: Note) {
    setViewError(null);
    try {
      const { data } = await api.adminGetNote(note.id);
      setViewing({ ...data, owner: note.owner });
    } catch (e) {
      setViewError(errorMessage(e));
    }
  }

  return (
    <section>
      <h2>All users' notes (read-only)</h2>
      {viewing && (
        <article className="card">
          <h3>{viewing.title}</h3>
          <small>Owner: {viewing.owner ? `${viewing.owner.name} <${viewing.owner.email}>` : viewing.ownerId}</small>
          <p className="pre">{viewing.content || <em>(no content)</em>}</p>
          <button onClick={() => setViewing(null)}>Close</button>
        </article>
      )}
      <ErrorText error={error ?? viewError} />
      {loading && <p>Loading…</p>}
      {!loading && notes?.length === 0 && <p>No notes in the system.</p>}
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Owner</th>
            <th>Created</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {notes?.map((note) => (
            <tr key={note.id}>
              <td>{note.title}</td>
              <td>{note.owner ? note.owner.name : <em>unknown</em>}</td>
              <td>{new Date(note.createdAt).toLocaleString()}</td>
              <td>
                <button onClick={() => open(note)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination meta={meta} onPage={setPage} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Users grouped by interest (aggregation scenario 1)
// ---------------------------------------------------------------------------

export function AdminInterestsPage() {
  const { data: groups, meta, loading, error, setPage } = usePaged(api.adminInterestGroups);

  return (
    <section>
      <h2>Users grouped by interest</h2>
      <ErrorText error={error} />
      {loading && <p>Loading…</p>}
      {!loading && groups?.length === 0 && <p>No user has listed any interests yet.</p>}
      {groups?.map((group) => (
        <div className="card" key={group.interest}>
          <h3>
            {group.interest} <small>({group.totalUsers} {group.totalUsers === 1 ? "user" : "users"})</small>
          </h3>
          <p>{group.users.map((u) => u.name).join(", ")}</p>
        </div>
      ))}
      <Pagination meta={meta} onPage={setPage} />
    </section>
  );
}
