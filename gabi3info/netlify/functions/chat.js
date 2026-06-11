exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Metodo nao permitido." })
        };
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Configure a variavel GROQ_API_KEY." })
        };
    }

    let message = "";

    try {
        const body = JSON.parse(event.body || "{}");
        message = String(body.message || "").trim();
    } catch (error) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "JSON invalido." })
        };
    }

    if (!message) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Mensagem obrigatoria." })
        };
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

            return {
                statusCode: groqResponse.status,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: errorText })
            };
        }

        const data = await groqResponse.json();
        const reply = data.choices?.[0]?.message?.content?.trim();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                reply: reply || "Desculpe, nao consegui montar uma resposta agora."
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Erro ao conectar com o Groq Cloud." })
        };
    }
};
