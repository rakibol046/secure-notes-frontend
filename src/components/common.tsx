import { useCallback, useEffect, useState } from "react";
import { errorMessage, type PageMeta } from "../services/api";

export function ErrorText({ error }: { error: string | null }) {
  return error ? <p className="error">{error}</p> : null;
}

export function Pagination({ meta, onPage }: { meta: PageMeta | null; onPage: (page: number) => void }) {
  if (!meta) return null;
  return (
    <div className="pagination">
      <button disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        ‹ Prev
      </button>
      <span>
        Page {meta.page} of {Math.max(meta.totalPages, 1)} ({meta.total} total)
      </span>
      <button disabled={!meta.hasNext} onClick={() => onPage(meta.page + 1)}>
        Next ›
      </button>
    </div>
  );
}

/** Loads one page of a paginated endpoint and exposes reload/paging controls. */
export function usePaged<T>(load: (page: number) => Promise<{ data: T; meta: PageMeta }>) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await load(page);
      // Deleting the last item of a page leaves it empty: step back one page.
      if (page > 1 && result.meta.page > Math.max(result.meta.totalPages, 1)) {
        setPage(page - 1);
        return;
      }
      setData(result.data);
      setMeta(result.meta);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [load, page]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, meta, loading, error, setPage, reload };
}
