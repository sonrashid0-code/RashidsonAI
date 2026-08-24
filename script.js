const input = document.getElementById("messageInput");
const button = document.getElementById("sendButton");
const chat = document.getElementById("chat");

function addMessage(text, type) {
    const message = document.createElement("div");
    message.className = "message " + type;
    message.textContent = text;
    chat.appendChild(message);
}

async function sendMessage() {
    const text = input.value.trim();

    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: text })
        });

        const data = await response.json();

        if (data.reply) {
            addMessage(data.reply, "ai");
        } else {
            addMessage("Server error: " + (data.error || "No reply"), "ai");
        }

    } catch (error) {
        console.error(error);
        addMessage("❌ Connection error.", "ai");
    }
}

button.addEventListener("click", sendMessage);

input.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});