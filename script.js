const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

/* =========================
   RASHIDSON AI VOICE
========================= */

function speak(text) {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();

        const voice = new SpeechSynthesisUtterance(text);

        voice.rate = 1;
        voice.pitch = 1;
        voice.volume = 1;

        window.speechSynthesis.speak(voice);
    }
}

/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/* =========================
   FORMAT AI RESPONSE
========================= */

function formatResponse(text) {

    const codeBlocks = [];

    // Temporarily replace code blocks
    text = text.replace(
        /```(\w+)?\n?([\s\S]*?)```/g,
        function(match, language, code) {

            const id = "code-" + Date.now() + "-" + codeBlocks.length;

            codeBlocks.push({
                id: id,
                code: code.trim(),
                language: language || "code"
            });

            return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
        }
    );

    let formatted = escapeHTML(text);

    // Convert simple line breaks
    formatted = formatted.replace(/\n/g, "<br>");

    // Put code blocks back
    codeBlocks.forEach((block, index) => {

        const safeCode = escapeHTML(block.code);

        const codeHTML = `
            <div class="code-box">
                <div class="code-header">
                    <span>${block.language}</span>
                    <button class="copy-code"
                        data-code-id="${block.id}">
                        Copy
                    </button>
                </div>

                <pre id="${block.id}"><code>${safeCode}</code></pre>
            </div>
        `;

        formatted = formatted.replace(
            `___CODE_BLOCK_${index}___`,
            codeHTML
        );
    });

    return formatted;
}

/* =========================
   ADD MESSAGE
========================= */

function addMessage(type, text) {

    const message = document.createElement("div");
    message.className = `message ${type}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";

    const img = document.createElement("img");

    if (type === "ai") {

        img.src = "icon.png";
        img.alt = "Rashidson AI";

        avatar.appendChild(img);

    } else {

        avatar.innerHTML = "👤";
    }

    const content = document.createElement("div");
    content.className = "message-content";

    const name = document.createElement("strong");

    name.textContent =
        type === "ai"
            ? "Rashidson AI"
            : "You";

    const paragraph = document.createElement("p");

    if (type === "ai") {
        paragraph.innerHTML = formatResponse(text);
    } else {
        paragraph.textContent = text;
    }

    content.appendChild(name);
    content.appendChild(paragraph);

    message.appendChild(avatar);
    message.appendChild(content);

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight;

    /* Copy buttons */

    message
        .querySelectorAll(".copy-code")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const codeId =
                    button.dataset.codeId;

                const codeElement =
                    document.getElementById(codeId);

                const code =
                    codeElement.innerText;

                try {

                    await navigator.clipboard.writeText(code);

                    button.textContent = "Copied ✓";

                    setTimeout(() => {
                        button.textContent = "Copy";
                    }, 1500);

                } catch (error) {

                    console.error(
                        "Copy failed:",
                        error
                    );
                }
            });
        });

    return message;
}

/* =========================
   SEND MESSAGE
========================= */

async function sendMessage() {

    const message =
        messageInput.value.trim();

    if (!message) {
        return;
    }

    addMessage("user", message);

    messageInput.value = "";

    sendButton.disabled = true;
    sendButton.style.opacity = "0.6";

    try {

        const response = await fetch(
            "/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    message: message
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "AI request failed"
            );
        }

        const reply =
            data.reply ||
            "Sorry, I couldn't generate a response.";

        addMessage("ai", reply);

        speak(reply);

    } catch (error) {

        console.error(
            "Chat error:",
            error
        );

        const errorMessage =
            "Sorry, I couldn't connect to Rashidson AI right now.";

        addMessage(
            "ai",
            errorMessage
        );

        speak(errorMessage);

    } finally {

        sendButton.disabled = false;
        sendButton.style.opacity = "1";

        messageInput.focus();
    }
}

/* =========================
   SEND BUTTON
========================= */

sendButton.addEventListener(
    "click",
    sendMessage
);

/* =========================
   ENTER KEY
========================= */

messageInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);