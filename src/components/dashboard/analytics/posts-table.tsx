"use client";

import { Fragment, useMemo, useState } from "react";
import { ImageOff, ExternalLink, ChevronRight, ChevronDown } from "lucide-react";
import type { PostWithMetrics } from "@/app/dashboard/analytics/queries";
import { formatCompactNumber, formatDate, formatDuration, extractHook } from "@/lib/format";
import { PostNotesEditor } from "./post-notes-editor";

const CONTENT_TYPE_LABELS: Record<PostWithMetrics["content_type"], string> = {
  image: "Imagem",
  carousel: "Carrossel",
  video: "Vídeo",
  reel: "Reel",
  short: "Short",
  story: "Story",
  live: "Live",
  article: "Artigo",
  text: "Texto",
};

const NETWORK_LABELS: Record<PostWithMetrics["network"], string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
};

const COLUMN_COUNT = 11;
const ALL_CATEGORIES = "all";

function CategoryChip({ category }: { category: string | null }) {
  if (!category) return <span className="text-xs text-neutral-400">—</span>;
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
      #{category}
    </span>
  );
}

export function PostsTable({ posts }: { posts: PostWithMetrics[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const post of posts) {
      if (post.category) unique.add(post.category);
    }
    return Array.from(unique).sort();
  }, [posts]);

  const filteredPosts =
    categoryFilter === ALL_CATEGORIES
      ? posts
      : posts.filter((post) => post.category === categoryFilter);

  if (posts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white p-12">
        <p className="max-w-md text-center text-sm text-neutral-500">
          Nenhum post sincronizado ainda. Use os botões acima para importar os dados do
          Instagram e do TikTok.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {categories.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="category-filter" className="text-xs font-medium text-neutral-500">
            Categoria
          </label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-lg border border-neutral-300 px-2 py-1 text-sm text-neutral-700"
          >
            <option value={ALL_CATEGORIES}>Todas</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                #{category}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs text-neutral-500">
              <th className="px-4 py-3 font-medium">Post</th>
              <th className="px-4 py-3 font-medium">Rede</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Publicado em</th>
              <th className="px-4 py-3 text-right font-medium">Curtidas</th>
              <th className="px-4 py-3 text-right font-medium">Comentários</th>
              <th className="px-4 py-3 text-right font-medium">Views</th>
              <th className="px-4 py-3 text-right font-medium">Alcance</th>
              <th className="px-4 py-3 text-right font-medium">Duração</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Link</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredPosts.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-4 py-8 text-center text-sm text-neutral-500">
                  Nenhum post na categoria selecionada.
                </td>
              </tr>
            )}
            {filteredPosts.map((post) => {
              const isExpanded = expandedId === post.id;
              const hook = extractHook(post.caption);

              return (
                <Fragment key={post.id}>
                  <tr
                    onClick={() => setExpandedId(isExpanded ? null : post.id)}
                    className="cursor-pointer hover:bg-neutral-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
                        )}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                          {post.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element -- URL de CDN externa, assinada e rotativa; não cabe em next/image.
                            <img
                              src={post.thumbnail_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageOff className="h-5 w-5 text-neutral-300" />
                          )}
                        </div>
                        <p
                          className="line-clamp-2 max-w-xs text-neutral-700"
                          title={post.caption ?? ""}
                        >
                          {post.caption ?? <span className="text-neutral-400">Sem legenda</span>}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
                        {NETWORK_LABELS[post.network]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {CONTENT_TYPE_LABELS[post.content_type]}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryChip category={post.category} />
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(post.published_at)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                      {formatCompactNumber(post.metrics?.likes ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                      {formatCompactNumber(post.metrics?.comments_count ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                      {formatCompactNumber(post.metrics?.views ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                      {formatCompactNumber(post.metrics?.reach ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                      {formatDuration(post.duration_seconds)}
                    </td>
                    <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                      {post.url && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-400 hover:text-neutral-900"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">Abrir post original</span>
                        </a>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-neutral-50">
                      <td colSpan={COLUMN_COUNT} className="px-4 py-4">
                        <div className="flex flex-col gap-4 pl-7">
                          <div>
                            <p className="text-xs font-medium text-neutral-500">Categoria</p>
                            <CategoryChip category={post.category} />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-500">Gancho</p>
                            <p className="text-sm font-semibold text-neutral-900">{hook ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-500">
                              Legenda completa
                            </p>
                            <p className="whitespace-pre-wrap text-sm text-neutral-700">
                              {post.caption || "Sem legenda"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-500">Duração</p>
                            <p className="text-sm text-neutral-700">
                              {formatDuration(post.duration_seconds)}
                            </p>
                          </div>
                          <PostNotesEditor postId={post.id} initialNotes={post.notes} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
