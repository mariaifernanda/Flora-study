const systemPrompts = {
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Chave de API nao configurada" });
    }

    const { messages, mode, topic } = req.body;

    if (!messages || !mode) {
      return res.status(400).json({ error: "Campos obrigatorios ausentes" });
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
        model: "claude-haiku-4-5-20251001",
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
      return res.status(response.status).json({ error: "Erro na API de IA", details: errorText });
    }

    const data = await response.json();
    const content = data.content[0].text;

    return res.status(200).json({ content });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno do servidor", details: String(err) });
  }
}
