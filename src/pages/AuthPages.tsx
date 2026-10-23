import { useState, type FormEvent } from "react";
import { ErrorText } from "../components/common";
import { useAuth } from "../context/AuthContext";
import { api, errorMessage, parseInterests } from "../services/api";

export function LoginPage({ onRegister }: { onRegister: () => void }) {
  const { login, notice } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>Log in</h2>
      {notice && <p className="notice">{notice}</p>}
      <label>
        Email
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Password
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <ErrorText error={error} />
      <button type="submit" disabled={busy}>
        {busy ? "Logging in…" : "Log in"}
      </button>
      <p>
        No account?{" "}
        <button type="button" className="link" onClick={onRegister}>
          Register
        </button>
      </p>
    </form>
  );
}

export function RegisterPage({ onLogin }: { onLogin: () => void }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", interests: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.register({ ...form, interests: parseInterests(form.interests) });
      await login(form.email, form.password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>Register</h2>
      <label>
        Name
        <input required maxLength={100} {...field("name")} />
      </label>
      <label>
        Email
        <input type="email" required {...field("email")} />
      </label>
      <label>
        Password <small>(8+ characters, at least one letter and one number)</small>
        <input type="password" required minLength={8} {...field("password")} />
      </label>
      <label>
        Interests <small>(optional, comma-separated)</small>
        <input placeholder="chess, reading" {...field("interests")} />
      </label>
      <ErrorText error={error} />
      <button type="submit" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </button>
      <p>
        Already registered?{" "}
        <button type="button" className="link" onClick={onLogin}>
          Log in
        </button>
      </p>
    </form>
  );
}
