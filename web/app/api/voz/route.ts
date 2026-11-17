import { NextResponse } from "next/server";
import { gerarVoz } from "@/lib/voz/gerar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/voz: mede como o dono escreve nas mensagens que ele mesmo digitou e devolve a
 * skill de voz pronta (`skill`), o resumo e a triagem trabalho × pessoal. Só lê.
 * `antes=ISO` limita as mensagens sem origem; `trabalho=a,b` e `pessoal=c,d` corrigem a
 * triagem; `minimo=N` muda o piso de mensagens por chat; `nome` dá nome à skill.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const lista = (k: string) => (q.get(k) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const antes = q.get("antes") ?? undefined;
  if (antes && Number.isNaN(Date.parse(antes))) {
    return NextResponse.json({ erro: "antes precisa ser uma data ISO" }, { status: 400 });
  }
  const nome = q.get("nome") ?? undefined;
  if (nome && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(nome)) {
    return NextResponse.json({ erro: "nome precisa ser kebab-case (letras minúsculas, números e -)" }, { status: 400 });
  }
  const minimo = Number(q.get("minimo"));
  return NextResponse.json(
    await gerarVoz({
      ...(antes ? { antes: new Date(antes).toISOString() } : {}),
      trabalho: lista("trabalho"),
      pessoal: lista("pessoal"),
      ...(minimo > 0 ? { minimo } : {}),
      ...(nome ? { nome } : {}),
    }),
  );
}
