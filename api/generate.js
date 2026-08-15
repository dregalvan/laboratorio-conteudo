// Esta função roda no servidor (nunca no navegador do visitante).
// É ela quem guarda a chave da API em segredo e conversa com a Claude.
// O site (index.html) só fala com "/api/generate" — nunca com a Anthropic direto.

export default async function handler(req, res) {
  // Só aceitamos pedidos do tipo POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "A chave da API não foi configurada no servidor (variável ANTHROPIC_API_KEY ausente).",
    });
    return;
  }

  try {
    const { model, max_tokens, system, messages } = req.body || {};

    if (!messages) {
      res.status(400).json({ error: "Pedido inválido: faltam as mensagens." });
      return;
    }

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-6",
        max_tokens: max_tokens || 2048,
        system,
        messages,
      }),
    });

    const data = await anthropicResponse.json();

    if (!anthropicResponse.ok) {
      res.status(anthropicResponse.status).json({
        error: data?.error?.message || "Erro ao chamar a API da Anthropic.",
      });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno ao gerar o conteúdo." });
  }
}
