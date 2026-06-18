const cards = document.querySelectorAll(".game-card");
const selectedTitle = document.querySelector("#selected-title");
const selectedText = document.querySelector("#selected-text");
const progressFill = document.querySelector("#progress-fill");
const progressText = document.querySelector("#progress-text");
const playButton = document.querySelector("#play-button");
const gameContainer = document.querySelector(".game-container");
const gameFrame = document.querySelector(".game-frame, #game-frame");
const authModal = document.querySelector("#auth-modal");
const authUser = document.querySelector("#auth-user");
const logoutButton = document.querySelector("#logout-button");
const authTabs = document.querySelectorAll(".auth-tab");
const authForms = document.querySelectorAll(".auth-form");
const authMessage = document.querySelector("#auth-message");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const forgotForm = document.querySelector("#forgot-form");

const USERS_KEY = "gz_users";
const SESSION_KEY = "gz_logged_user";

let selectedGame = 1;

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function normalizeUserName(name) {
    return name.trim().toLowerCase();
}

function setAuthMessage(message) {
    if (authMessage) {
        authMessage.textContent = message;
    }
}

function setActiveAuthTab(tabName) {
    authTabs.forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.authTab === tabName);
    });

    authForms.forEach((form) => {
        form.classList.toggle("active", form.id === `${tabName}-form`);
    });

    setAuthMessage("");
}

function updateAuthState() {
    const loggedUser = localStorage.getItem(SESSION_KEY);

    if (authUser) {
        authUser.textContent = loggedUser ? `Ola, ${loggedUser}` : "Visitante";
    }

    if (logoutButton) {
        logoutButton.hidden = !loggedUser;
    }

    if (authModal) {
        authModal.classList.toggle("is-open", !loggedUser);
    }
}

function loginUser(userName) {
    localStorage.setItem(SESSION_KEY, userName);
    updateAuthState();
}

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

authTabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveAuthTab(tab.dataset.authTab));
});

if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const userName = document.querySelector("#register-user").value.trim();
        const password = document.querySelector("#register-password").value;
        const recovery = document.querySelector("#register-recovery").value.trim();
        const normalizedName = normalizeUserName(userName);
        const users = getUsers();

        if (users.some((user) => user.normalizedName === normalizedName)) {
            setAuthMessage("Esse usuario ja existe.");
            return;
        }

        users.push({
            name: userName,
            normalizedName,
            password,
            recovery
        });

        saveUsers(users);
        registerForm.reset();
        loginUser(userName);
        setAuthMessage("Conta criada.");
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const userName = document.querySelector("#login-user").value.trim();
        const password = document.querySelector("#login-password").value;
        const normalizedName = normalizeUserName(userName);
        const user = getUsers().find((item) => item.normalizedName === normalizedName);

        if (!user || user.password !== password) {
            setAuthMessage("Usuario ou senha incorretos.");
            return;
        }

        loginForm.reset();
        loginUser(user.name);
    });
}

if (forgotForm) {
    forgotForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const userName = document.querySelector("#forgot-user").value.trim();
        const recovery = document.querySelector("#forgot-recovery").value.trim();
        const newPassword = document.querySelector("#forgot-password").value;
        const normalizedName = normalizeUserName(userName);
        const users = getUsers();
        const user = users.find((item) => item.normalizedName === normalizedName);

        if (!user || user.recovery !== recovery) {
            setAuthMessage("Usuario ou palavra de recuperacao incorretos.");
            return;
        }

        user.password = newPassword;
        saveUsers(users);
        forgotForm.reset();
        setActiveAuthTab("login");
        setAuthMessage("Senha alterada. Entre com a nova senha.");
    });
}

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem(SESSION_KEY);
        setActiveAuthTab("login");
        updateAuthState();
    });
}

const chatToggle = document.querySelector("#chat-toggle");
const chatWidget = document.querySelector("#chat-widget");
const chatClose = document.querySelector("#chat-close");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const chatMessages = document.querySelector("#chat-messages");
const chatSubmit = chatForm?.querySelector("button[type='submit']");
const chatHistory = [];

function setChatLoading(isLoading) {
    if (chatInput) {
        chatInput.disabled = isLoading;
    }

    if (chatSubmit) {
        chatSubmit.disabled = isLoading;
        chatSubmit.textContent = isLoading ? "Enviando" : "Enviar";
    }
}

function scrollChatToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function addChatMessage(text, type, saveToHistory = true) {
    const message = document.createElement("div");
    message.classList.add("chat-message", `chat-message-${type}`);
    message.textContent = text;

    chatMessages.appendChild(message);
    scrollChatToBottom();

    if (saveToHistory && (type === "user" || type === "bot")) {
        chatHistory.push({
            role: type === "user" ? "user" : "assistant",
            content: text
        });

        if (chatHistory.length > 8) {
            chatHistory.shift();
        }
    }

    return message;
}

async function askGroq(userText) {
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: userText,
            history: chatHistory.slice(0, -1)
        })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Nao foi possivel gerar a resposta agora.");
    }

    return data.reply || "Desculpe, nao consegui montar uma resposta agora.";
}

function showChatTyping(userText) {
    const typingMessage = addChatMessage("Digitando...", "bot", false);
    typingMessage.classList.add("chat-message-typing");
    setChatLoading(true);

    /*
        A integracao com IA real fica no backend em:
        api/chat.js

        Coloque sua chave do Groq Cloud em uma variavel de ambiente chamada
        GROQ_API_KEY. Nao coloque chaves de API neste arquivo, pois o navegador
        mostra o JavaScript para qualquer visitante.
    */
    askGroq(userText)
        .then((reply) => {
            typingMessage.remove();
            addChatMessage(reply, "bot");
        })
        .catch((error) => {
            typingMessage.remove();
            addChatMessage(
                error.message || "Nao consegui responder com a IA agora. Tente novamente em instantes.",
                "bot",
                false
            );
        })
        .finally(() => {
            setChatLoading(false);

            if (chatInput) {
                chatInput.focus();
            }
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

updateAuthState();
