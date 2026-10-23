import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { AdminInterestsPage, AdminNotesPage, AdminUsersPage } from "./pages/AdminPages";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { NotesPage } from "./pages/NotesPage";
import { PostsPage, UserPostsPage } from "./pages/PostsPages";
import { ProfilePage } from "./pages/ProfilePage";

type View =
  | { name: "login" }
  | { name: "register" }
  | { name: "notes" }
  | { name: "posts" }
  | { name: "userPosts"; userId: string }
  | { name: "profile" }
  | { name: "adminUsers" }
  | { name: "adminNotes" }
  | { name: "adminInterests" };

const ADMIN_VIEWS = new Set<View["name"]>(["adminUsers", "adminNotes", "adminInterests"]);
const AUTH_VIEWS = new Set<View["name"]>(["notes", "profile", ...ADMIN_VIEWS]);

export function App() {
  const { user, logout } = useAuth();
  const [requested, setView] = useState<View>({ name: "posts" });

  // Client-side guard for UX only — the API enforces every permission itself.
  let view = requested;
  if (!user && AUTH_VIEWS.has(view.name)) view = { name: "login" };
  if (user && (view.name === "login" || view.name === "register")) view = { name: "notes" };
  if (user?.role !== "admin" && ADMIN_VIEWS.has(view.name)) view = { name: user ? "notes" : "login" };

  const nav = (name: Exclude<View["name"], "userPosts">) => (
    <button className={view.name === name ? "active" : ""} onClick={() => setView({ name } as View)}>
      {LABELS[name]}
    </button>
  );
  const openUserPosts = (userId: string) => setView({ name: "userPosts", userId });

  return (
    <div className="app">
      <header>
        <h1>Secure Notes</h1>
        <nav>
          {nav("posts")}
          {user && nav("notes")}
          {user && nav("profile")}
          {user?.role === "admin" && (
            <>
              <span className="sep">Admin:</span>
              {nav("adminUsers")}
              {nav("adminNotes")}
              {nav("adminInterests")}
            </>
          )}
        </nav>
        <div className="session">
          {user ? (
            <>
              <span>
                {user.name} ({user.role})
              </span>
              <button onClick={() => logout()}>Log out</button>
            </>
          ) : (
            <>
              {nav("login")}
              {nav("register")}
            </>
          )}
        </div>
      </header>

      <main>
        {view.name === "login" && <LoginPage onRegister={() => setView({ name: "register" })} />}
        {view.name === "register" && <RegisterPage onLogin={() => setView({ name: "login" })} />}
        {view.name === "notes" && <NotesPage />}
        {view.name === "posts" && <PostsPage onOpenAuthor={openUserPosts} />}
        {view.name === "userPosts" && (
          <UserPostsPage key={view.userId} userId={view.userId} onBack={() => setView({ name: "posts" })} />
        )}
        {view.name === "profile" && <ProfilePage />}
        {view.name === "adminUsers" && <AdminUsersPage onOpenPosts={openUserPosts} />}
        {view.name === "adminNotes" && <AdminNotesPage />}
        {view.name === "adminInterests" && <AdminInterestsPage />}
      </main>
    </div>
  );
}

const LABELS: Record<Exclude<View["name"], "userPosts">, string> = {
  login: "Log in",
  register: "Register",
  notes: "My notes",
  posts: "Posts",
  profile: "Profile",
  adminUsers: "Users",
  adminNotes: "All notes",
  adminInterests: "Interests",
};
