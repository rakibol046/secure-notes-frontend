import { useCallback, useState, type FormEvent } from "react";
import { ErrorText, Pagination, usePaged } from "../components/common";
import { useAuth } from "../context/AuthContext";
import { api, errorMessage, type Post } from "../services/api";

function PostView({ post, onClose }: { post: Post; onClose: () => void }) {
  return (
    <article className="card">
      <h3>{post.title}</h3>
      <p className="pre">{post.content}</p>
      <small>
        {post.author ? `by ${post.author.name} · ` : ""}
        {new Date(post.createdAt).toLocaleString()}
      </small>
      <div className="row">
        <button onClick={onClose}>Close</button>
      </div>
    </article>
  );
}

export function PostsPage({ onOpenAuthor }: { onOpenAuthor: (userId: string) => void }) {
  const { user } = useAuth();
  const { data: posts, meta, loading, error, setPage, reload } = usePaged(api.listPosts);
  const [viewing, setViewing] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      await api.createPost({ title, content });
      setTitle("");
      setContent("");
      await reload();
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  async function open(id: string) {
    try {
      setViewing((await api.getPost(id)).data);
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  return (
    <section>
      <h2>Public posts</h2>
      {user ? (
        <form className="card" onSubmit={submit}>
          <h3>New post (visible to everyone)</h3>
          <input placeholder="Title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea placeholder="Content" required rows={3} value={content} onChange={(e) => setContent(e.target.value)} />
          <ErrorText error={formError} />
          <button type="submit">Publish</button>
        </form>
      ) : (
        <p className="notice">Log in to write a post. Reading is public.</p>
      )}

      {viewing && <PostView post={viewing} onClose={() => setViewing(null)} />}

      <ErrorText error={error} />
      {loading && <p>Loading…</p>}
      {!loading && posts?.length === 0 && <p>No posts yet.</p>}
      <ul className="list">
        {posts?.map((post) => (
          <li key={post.id}>
            <strong>{post.title}</strong>
            <small>
              {" "}
              by{" "}
              {post.author ? (
                <button className="link" onClick={() => onOpenAuthor(post.author!.id)}>
                  {post.author.name}
                </button>
              ) : (
                "deleted user"
              )}
            </small>
            <div className="row">
              <button onClick={() => open(post.id)}>Read</button>
            </div>
          </li>
        ))}
      </ul>
      <Pagination meta={meta} onPage={setPage} />
    </section>
  );
}

/** Data comes from GET /api/users/:userId/posts, the single $lookup aggregation. */
export function UserPostsPage({ userId, onBack }: { userId: string; onBack: () => void }) {
  const load = useCallback((page: number) => api.userPosts(userId, page), [userId]);
  const { data, meta, loading, error, setPage } = usePaged(load);
  const [viewing, setViewing] = useState<Post | null>(null);

  return (
    <section>
      <button className="link" onClick={onBack}>
        ‹ All posts
      </button>
      <h2>Posts by {data?.user.name ?? "…"}</h2>
      {viewing && <PostView post={viewing} onClose={() => setViewing(null)} />}
      <ErrorText error={error} />
      {loading && <p>Loading…</p>}
      {!loading && data?.posts.length === 0 && <p>This user has not written any posts.</p>}
      <ul className="list">
        {data?.posts.map((post) => (
          <li key={post.id}>
            <strong>{post.title}</strong>
            <small> · {new Date(post.createdAt).toLocaleString()}</small>
            <div className="row">
              <button onClick={() => setViewing({ ...post, author: data.user })}>Read</button>
            </div>
          </li>
        ))}
      </ul>
      <Pagination meta={meta} onPage={setPage} />
    </section>
  );
}
