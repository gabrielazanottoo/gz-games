const cards = document.querySelectorAll(".game-card");
const selectedTitle = document.querySelector("#selected-title");
const selectedText = document.querySelector("#selected-text");
const progressFill = document.querySelector("#progress-fill");
const progressText = document.querySelector("#progress-text");
const playButton = document.querySelector("#play-button");
const gameContainer = document.querySelector(".game-container");
const gameFrame = document.querySelector(".game-frame, #game-frame");

let selectedGame = 1;

function applyGameZoom() {
    if (gameContainer) {
        gameContainer.classList.add("is-zoomed");
    }

    if (gameFrame) {
        gameFrame.classList.add("is-zoomed");
    }
}

function selectGame(card) {
    selectedGame = Number(card.dataset.index);

    cards.forEach((item) => item.classList.remove("active"));
    card.classList.add("active");

    if (selectedTitle) {
        selectedTitle.textContent = card.dataset.title;
    }

    if (selectedText) {
        selectedText.textContent = card.dataset.desc;
    }

    if (progressFill) {
        progressFill.style.width = `${(selectedGame / cards.length) * 100}%`;
    }

    if (progressText) {
        progressText.textContent = `${selectedGame} de ${cards.length} slots`;
    }
}

cards.forEach((card) => {
    card.addEventListener("click", () => selectGame(card));
});

if (playButton) {
    playButton.addEventListener("click", () => {
        applyGameZoom();

        if (selectedText) {
            selectedText.textContent = `O slot ${String(selectedGame).padStart(2, "0")} esta pronto para receber o seu jogo.`;
        }
    });
}

const chatToggle = document.querySelector("#chat-toggle");
const chatWidget = document.querySelector("#chat-widget");
const chatClose = document.querySelector("#chat-close");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const chatMessages = document.querySelector("#chat-messages");

function scrollChatToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function addChatMessage(text, type) {
    const message = document.createElement("div");
    message.classList.add("chat-message", `chat-message-${type}`);
    message.textContent = text;

    chatMessages.appendChild(message);
    scrollChatToBottom();

    return message;
}

async function askGroq(userText) {
    const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userText })
    });

    if (!response.ok) {
        throw new Error("Nao foi possivel gerar a resposta agora.");
    }

    const data = await response.json();
    return data.reply;
}

function showChatTyping(userText) {
    const typingMessage = addChatMessage("Digitando...", "bot");
    typingMessage.classList.add("chat-message-typing");

    /*
        A integracao com IA real fica no backend em:
        netlify/functions/chat.js

        Coloque sua chave do Groq Cloud em uma variavel de ambiente chamada
        GROQ_API_KEY. Nao coloque chaves de API neste arquivo, pois o navegador
        mostra o JavaScript para qualquer visitante.
    */
    askGroq(userText)
        .then((reply) => {
            typingMessage.remove();
            addChatMessage(reply, "bot");
        })
        .catch(() => {
            typingMessage.remove();
            addChatMessage(
                "Nao consegui responder com a IA agora. Tente novamente em instantes.",
                "bot"
            );
        });
}

if (chatToggle && chatWidget) {
    chatToggle.addEventListener("click", () => {
        chatWidget.classList.toggle("is-open");

        if (chatWidget.classList.contains("is-open") && chatInput) {
            chatInput.focus();
        }
    });
}

if (chatClose && chatWidget) {
    chatClose.addEventListener("click", () => {
        chatWidget.classList.remove("is-open");
    });
}

if (chatForm && chatInput && chatMessages) {
    chatForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const userText = chatInput.value.trim();

        if (!userText) {
            return;
        }

        addChatMessage(userText, "user");
        chatInput.value = "";
        showChatTyping(userText);
    });
}
