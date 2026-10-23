import { useState, type FormEvent } from "react";
import { ErrorText } from "../components/common";
import { useAuth } from "../context/AuthContext";
import { api, errorMessage, parseInterests } from "../services/api";

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [interests, setInterests] = useState(user?.interests.join(", ") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const { data } = await api.updateMe({ name, interests: parseInterests(interests) });
      setUser(data);
      setInterests(data.interests.join(", "));
      setSaved(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <section>
      <h2>My profile</h2>
      <dl className="card">
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Role</dt>
        <dd>{user.role}</dd>
        <dt>Interests</dt>
        <dd>{user.interests.length ? user.interests.join(", ") : <em>none</em>}</dd>
      </dl>
      <form className="card" onSubmit={submit}>
        <h3>Edit profile</h3>
        <label>
          Name
          <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Interests <small>(comma-separated)</small>
          <input value={interests} onChange={(e) => setInterests(e.target.value)} />
        </label>
        <ErrorText error={error} />
        {saved && <p className="notice">Saved.</p>}
        <button type="submit">Save</button>
      </form>
    </section>
  );
}
