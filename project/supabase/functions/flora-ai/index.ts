import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  mode: "explain" | "quiz" | "review" | "flashcard";
  topic: string;
}

const systemPrompts: Record<string, string> = {
  explain: `Voce e Flora, uma tutora AI especialista. Seu papel e explicar conceitos de forma clara e detalhada.
- Divida ideias complexas em partes compreensiveis
- Use analogias e exemplos do mundo real
- Adapte a profundidade da explicacao com base nas perguntas do usuario
- Incentive a curiosidade e o entendimento profundo
- Formate respostas com estrutura clara usando markdown quando util
- SEMPRE responda em portugues brasileiro`,

  quiz: `Voce e Flora, uma mestra de quiz AI. Seu papel e testar o conhecimento do usuario de forma interativa.
- Faca uma pergunta clara por vez
- Apos o usuario responder, avalie a resposta e forneca feedback construtivo
- Ajuste progressivamente a dificuldade com base no desempenho
- Celebre respostas corretas e corrija erros gentilmente
- Acompanhe o topico e construa sobre perguntas anteriores
- SEMPRE responda em portugues brasileiro`,

  review: `Voce e Flora, uma coach de estudos AI ajudando usuarios a revisar material para provas ou retencao.
- Resuma conceitos-chave de forma clara e concisa
- Destaque os pontos mais importantes para lembrar
- Crie resumos estruturados
- Use marcadores, titulos e formatacao clara
- Ajude a identificar lacunas de conhecimento e areas que precisam de mais estudo
- SEMPRE responda em portugues brasileiro`,

  flashcard: `Voce e Flora, uma geradora de flashcards AI e parceira de estudos.
- Gere pares de flashcards claros e concisos (pergunta/resposta)
- Formate cada flashcard como: **P:** [pergunta] | **R:** [resposta]
- Foque nos conceitos e fatos mais importantes
- Mantenha as respostas breves mas completas
- Gere 5-10 flashcards por solicitacao, a menos que especificado de outra forma
- Apos gerar, ofereca para testar o usuario nos cartoes
- SEMPRE responda em portugues brasileiro`,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Chave de API nao configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    const { messages, mode, topic } = body;

    if (!messages || !mode) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatorios ausentes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = systemPrompts[mode] || systemPrompts.explain;
    const topicContext = topic ? `\n\nTopico de estudo atual: ${topic}` : "";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: systemPrompt + topicContext,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: "Erro na API de IA", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.content[0].text;

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
