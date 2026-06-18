const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const MAX_MESSAGE_LENGTH = 800;
const MAX_HISTORY_ITEMS = 8;

const systemPrompt = `
Voce e o assistente virtual da GZ Games, um portal com jogos infantis e casuais.
Responda sempre em portugues do Brasil, com tom simpatico, claro e objetivo.
Ajude visitantes a escolher jogos, encontrar links e tirar duvidas sobre o site.
Jogos disponiveis:
- A Branca de Neve
- Bob Esponja
- Sapinho e Frutinhas
- Netlands
- Fantasia
- Tartaruga
Se nao souber uma informacao, seja honesto e ofereca uma alternativa util.
Nao invente politicas, precos ou dados pessoais.
`.trim();

function parseBody(req) {
    if (typeof req.body === "string") {
        return JSON.parse(req.body || "{}");
    }

    return req.body || {};
}

function normalizeMessage(item) {
    const role = item?.role === "assistant" ? "assistant" : "user";
    const content = String(item?.content || "").trim().slice(0, MAX_MESSAGE_LENGTH);

    if (!content) {
        return null;
    }

    return { role, content };
}

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Metodo nao permitido." });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "Configure a variavel GROQ_API_KEY." });
    }

    let body;

    try {
        body = parseBody(req);
    } catch (error) {
        return res.status(400).json({ error: "JSON invalido." });
    }

    const message = String(body?.message || "").trim();

    if (!message) {
        return res.status(400).json({ error: "Mensagem obrigatoria." });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({
            error: `Mensagem muito longa. Use ate ${MAX_MESSAGE_LENGTH} caracteres.`
        });
    }

    const history = Array.isArray(body?.history)
        ? body.history
            .slice(-MAX_HISTORY_ITEMS)
            .map(normalizeMessage)
            .filter(Boolean)
        : [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
        const groqResponse = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
            method: "POST",
            signal: controller.signal,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history,
                    { role: "user", content: message }
                ],
                temperature: 0.45,
                max_completion_tokens: 260
            })
        });

        if (!groqResponse.ok) {
            let errorMessage = "Erro ao gerar resposta com o Groq Cloud.";

            try {
                const errorData = await groqResponse.json();
                errorMessage = errorData?.error?.message || errorData?.error || errorMessage;
            } catch (error) {
                errorMessage = await groqResponse.text() || errorMessage;
            }

            return res.status(groqResponse.status).json({ error: errorMessage });
        }

        const data = await groqResponse.json();
        const reply = data.choices?.[0]?.message?.content?.trim();

        return res.status(200).json({
            reply: reply || "Desculpe, nao consegui montar uma resposta agora."
        });
    } catch (error) {
        const message =
            error.name === "AbortError"
                ? "O Groq Cloud demorou para responder. Tente novamente."
                : "Erro ao conectar com o Groq Cloud.";

        return res.status(500).json({ error: message });
    } finally {
        clearTimeout(timeout);
    }
};
