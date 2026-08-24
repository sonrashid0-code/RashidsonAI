const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const chat = document.getElementById("chat");

async function sendMessage() {
    const message = messageInput.value.trim();

    if (!message) return;

    // Show user's message
    addMessage("You", message, "user");

    messageInput.value = "";
    sendButton.disabled = true;

    // Thinking message
    const thinking = addMessage(
        "Rashidson AI",
        "Thinking...",
        "ai"
    );

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();

        thinking.remove();

        if (!response.ok) {
            throw new Error(data.error || "AI request failed");
        }

        addMessage(
            "Rashidson AI",
            data.reply || data.output || "I couldn't generate a reply.",
            "ai"
        );

    } catch (error) {
        thinking.remove();

        addMessage(
            "Rashidson AI",
            "Sorry, something went wrong. Please try again.",
            "ai"
        );

        console.error(error);

    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
}


function addMessage(sender, text, type) {

    const message = document.createElement("div");
    message.className = "message " + type;

    const avatar = document.createElement("div");
    avatar.className = "avatar";

    avatar.textContent =
        type === "ai" ? "R" : "You";

    const content = document.createElement("div");
    content.className = "message-content";

    const name = document.createElement("strong");
    name.textContent = sender;

    const paragraph = document.createElement("p");
    paragraph.textContent = text;

    content.appendChild(name);
    content.appendChild(paragraph);

    message.appendChild(avatar);
    message.appendChild(content);

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight;

    return message;
}


// Send button
sendButton.addEventListener("click", sendMessage);


// Press Enter to send
messageInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }

});
