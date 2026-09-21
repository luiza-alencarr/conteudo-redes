import { ImageOff, ExternalLink } from "lucide-react";
import type { PostWithMetrics } from "@/app/dashboard/analytics/queries";
import { formatCompactNumber, formatDate } from "@/lib/format";

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

export function PostsTable({ posts }: { posts: PostWithMetrics[] }) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white p-12">
        <p className="max-w-md text-center text-sm text-neutral-500">
          Nenhum post sincronizado ainda. Use o botão acima para importar os dados do
          Instagram.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs text-neutral-500">
            <th className="px-4 py-3 font-medium">Post</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Publicado em</th>
            <th className="px-4 py-3 text-right font-medium">Curtidas</th>
            <th className="px-4 py-3 text-right font-medium">Comentários</th>
            <th className="px-4 py-3 text-right font-medium">Views</th>
            <th className="px-4 py-3 text-right font-medium">Alcance</th>
            <th className="px-4 py-3 font-medium">
              <span className="sr-only">Link</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {posts.map((post) => (
            <tr key={post.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
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
                  <p className="line-clamp-2 max-w-xs text-neutral-700" title={post.caption ?? ""}>
                    {post.caption ?? <span className="text-neutral-400">Sem legenda</span>}
                  </p>
                </div>
              </td>
              <td className="px-4 py-3 text-neutral-500">
                {CONTENT_TYPE_LABELS[post.content_type]}
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
              <td className="px-4 py-3">
                {post.url && (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-neutral-900"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">Abrir no Instagram</span>
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
