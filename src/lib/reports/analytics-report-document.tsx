import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AnalyticsReportData } from "./analytics-report-data";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  title: { fontSize: 18, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 9, color: "#555555", marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "1pt solid #cccccc",
  },
  table: { display: "flex", flexDirection: "column", marginBottom: 8 },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #333333",
    paddingVertical: 4,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: { flexDirection: "row", borderBottom: "0.5pt solid #dddddd", paddingVertical: 4 },
  cell: { flex: 1.4, paddingRight: 4 },
  cellNarrow: { flex: 1, paddingRight: 4 },
  postBlock: { marginBottom: 10, paddingBottom: 8, borderBottom: "0.5pt solid #eeeeee" },
  postMeta: { fontSize: 9, color: "#555555", marginBottom: 2 },
  postCaption: { fontSize: 10, lineHeight: 1.4 },
  commentBlock: { marginBottom: 6, paddingLeft: 8, borderLeft: "2pt solid #dddddd" },
  commentMeta: { fontSize: 8, color: "#777777" },
  commentText: { fontSize: 9, marginTop: 1, lineHeight: 1.3 },
  pageNumber: { position: "absolute", bottom: 20, right: 32, fontSize: 8, color: "#999999" },
  emptyNotice: { fontSize: 9, color: "#777777", marginBottom: 8 },
});

const NETWORK_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  total: "Total",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
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

const numberFormatter = new Intl.NumberFormat("pt-BR");
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const timestampFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value));
}

function formatPercent(value: number | null): string {
  return value === null ? "N/D" : `${value.toFixed(2)}%`;
}

function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : "—";
}

function networkLabel(network: string): string {
  return NETWORK_LABELS[network] ?? network;
}

function contentTypeLabel(contentType: string): string {
  return CONTENT_TYPE_LABELS[contentType] ?? contentType;
}

export function AnalyticsReportDocument({ data }: { data: AnalyticsReportData }) {
  const generatedAt = timestampFormatter.format(new Date(data.generatedAt));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório de Analytics — Conteúdo Redes</Text>
        <Text style={styles.subtitle}>
          Gerado em {generatedAt} · Período: últimos {data.periodDays} dias
        </Text>

        <Text style={styles.sectionTitle}>
          1. Resumo geral (últimos {data.periodDays} dias)
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.cell}>Rede</Text>
            <Text style={styles.cellNarrow}>Posts</Text>
            <Text style={styles.cellNarrow}>Curtidas</Text>
            <Text style={styles.cellNarrow}>Comentários</Text>
            <Text style={styles.cellNarrow}>Views</Text>
            <Text style={styles.cellNarrow}>Alcance</Text>
            <Text style={styles.cellNarrow}>Taxa engaj.</Text>
          </View>
          {data.byNetwork.map((summary) => (
            <View style={styles.tableRow} key={summary.network}>
              <Text style={styles.cell}>{networkLabel(summary.network)}</Text>
              <Text style={styles.cellNarrow}>{formatNumber(summary.postsCount)}</Text>
              <Text style={styles.cellNarrow}>{formatNumber(summary.likes)}</Text>
              <Text style={styles.cellNarrow}>{formatNumber(summary.comments)}</Text>
              <Text style={styles.cellNarrow}>{formatNumber(summary.views)}</Text>
              <Text style={styles.cellNarrow}>{formatNumber(summary.reach)}</Text>
              <Text style={styles.cellNarrow}>{formatPercent(summary.engagementRate)}</Text>
            </View>
          ))}
          <View style={[styles.tableRow, { fontFamily: "Helvetica-Bold" }]}>
            <Text style={styles.cell}>Total</Text>
            <Text style={styles.cellNarrow}>{formatNumber(data.overall.postsCount)}</Text>
            <Text style={styles.cellNarrow}>{formatNumber(data.overall.likes)}</Text>
            <Text style={styles.cellNarrow}>{formatNumber(data.overall.comments)}</Text>
            <Text style={styles.cellNarrow}>{formatNumber(data.overall.views)}</Text>
            <Text style={styles.cellNarrow}>{formatNumber(data.overall.reach)}</Text>
            <Text style={styles.cellNarrow}>N/D</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          2. Posts do período ({data.periodPosts.length}), ordenados por engajamento
        </Text>
        {data.periodPosts.length === 0 && (
          <Text style={styles.emptyNotice}>Nenhum post publicado nesse período.</Text>
        )}
        {data.periodPosts.map((post, index) => (
          <View style={styles.postBlock} key={post.id} wrap={false}>
            <Text style={styles.postMeta}>
              {index + 1}. {networkLabel(post.network)} · {contentTypeLabel(post.content_type)} ·{" "}
              {formatDate(post.published_at)} · Curtidas: {formatNumber(post.metrics?.likes ?? 0)}{" "}
              · Comentários: {formatNumber(post.metrics?.comments_count ?? 0)} · Views:{" "}
              {formatNumber(post.metrics?.views ?? 0)}
            </Text>
            <Text style={styles.postCaption}>{post.caption || "(sem legenda)"}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle} break>
          3. Comentários dos {data.topPosts.length} posts mais engajados
        </Text>
        {data.topPosts.length === 0 && (
          <Text style={styles.emptyNotice}>Nenhum post no período pra listar comentários.</Text>
        )}
        {data.topPosts.map((post, index) => (
          <View key={post.id} wrap={false} style={{ marginBottom: 14 }}>
            <Text style={[styles.postMeta, { fontFamily: "Helvetica-Bold" }]}>
              Post #{index + 1} — {networkLabel(post.network)} · {formatDate(post.published_at)}
            </Text>
            <Text style={[styles.postCaption, { marginBottom: 4 }]}>
              {post.caption || "(sem legenda)"}
            </Text>
            {post.comments.length === 0 ? (
              <Text style={styles.commentMeta}>Nenhum comentário coletado para este post.</Text>
            ) : (
              post.comments.map((comment, commentIndex) => (
                <View style={styles.commentBlock} key={commentIndex}>
                  <Text style={styles.commentMeta}>
                    {comment.author ?? "Anônimo"} · {formatNumber(comment.likeCount)} curtida(s) ·{" "}
                    {formatDate(comment.commentedAt)}
                  </Text>
                  <Text style={styles.commentText}>{comment.text || "(sem texto)"}</Text>
                </View>
              ))
            )}
          </View>
        ))}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
