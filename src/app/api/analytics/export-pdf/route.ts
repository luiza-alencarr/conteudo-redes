import { NextResponse } from "next/server";
import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getAnalyticsReportData } from "@/lib/reports/analytics-report-data";
import { AnalyticsReportDocument } from "@/lib/reports/analytics-report-document";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const data = await getAnalyticsReportData();
    const document = createElement(AnalyticsReportDocument, { data }) as ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(document);
    const filename = `analytics-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar o PDF." },
      { status: 500 },
    );
  }
}
