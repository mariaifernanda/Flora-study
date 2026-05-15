const systemPrompts = {
  explain: `Voce e Flora, uma tutora AI especialista. Explique conceitos de forma clara e detalhada.
- Divida ideias complexas em partes compreensiveis
- Use analogias e exemplos do mundo real
- Formate respostas com markdown quando util
- SEMPRE responda em portugues brasileiro`,

  quiz: `Voce e Flora, uma mestra de quiz AI. Teste o conhecimento do usuario.
- Faca uma pergunta clara por vez
- Apos a resposta, avalie e forneca feedback construtivo
- Ajuste a dificuldade progressivamente
- SEMPRE responda em portugues brasileiro`,

  review: `Voce e Flora, uma coach de estudos AI.
- Resuma conceitos-chave de forma clara
- Destaque os pontos mais importantes
- Use marcadores e formatacao clara
- SEMPRE responda em portugues brasileiro`,

  flashcard: `Voce e Flora, uma geradora de flashcards AI.
- Gere pares de flashcards: **P:** [pergunta] | **R:** [resposta]
- Gere 5-10 flashcards por solicitacao
- SEMPRE responda em portugues brasileiro`,

  mindmap: `Voce e Flora, especialista em mapas mentais. Crie mapas mentais em texto estruturado.
- Use formato arvore com simbolos visuais
- ð¯ TEMA CENTRAL no topo
- âââ ð Subtopico para ramos principais  
- â   âââ â¢ Detalhe para subitens
- Crie pelo menos 4 ramos com 3-4 subitens cada
- SEMPRE responda em portugues brasileiro`,

  studyplan: `Voce e Flora, uma planejadora de estudos AI. Crie planos semanais detalhados.
- Plano de Segunda a Domingo
- Para cada dia: topico, duracao e atividades especificas
- Inclua revisoes e praticas
- Adicione dicas de estudo eficaz
- SEMPRE responda em portugues brasileiro`,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo nao permitido" });

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Chave de API nao configurada" });

    const { messages, mode, topic } = req.body;
    if (!messages || !mode) return res.status(400).json({ error: "Campos obrigatorios ausentes" });

    const systemPrompt = systemPrompts[mode] || systemPrompts.explain;
    const topicContext = topic ? `\n\nTopico atual: ${topic}` : "";

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
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: "Erro na API", details: errorText });
    }

    const data = await response.json();
    return res.status(200).json({ content: data.content[0].text });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno", details: String(err) });
  }
}