module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Metodo nao permitido." });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "Configure a variavel GROQ_API_KEY." });
    }

    let message = "";

    try {
        const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
        message = String(body?.message || "").trim();
    } catch (error) {
        return res.status(400).json({ error: "JSON invalido." });
    }

    if (!message) {
        return res.status(400).json({ error: "Mensagem obrigatoria." });
    }

    try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: "Voce e um atendente virtual simpatico da GZ Games. Responda em portugues do Brasil, de forma curta, clara e prestativa."
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.5,
                max_completion_tokens: 220
            })
        });

        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            return res.status(groqResponse.status).json({ error: errorText });
        }

        const data = await groqResponse.json();
        const reply = data.choices?.[0]?.message?.content?.trim();

        return res.status(200).json({
            reply: reply || "Desculpe, nao consegui montar uma resposta agora."
        });
    } catch (error) {
        return res.status(500).json({ error: "Erro ao conectar com o Groq Cloud." });
    }
};
