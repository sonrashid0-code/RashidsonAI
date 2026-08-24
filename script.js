const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const chat = document.getElementById("chat");

async function sendMessage() {
    const message = messageInput.value.trim();

    if (!message) return;

    addMessage("You", message, "user");

    messageInput.value = "";
    sendButton.disabled = true;

    const thinkingMessage = addMessage(
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

        thinkingMessage.remove();

        if (!response.ok) {
            throw new Error(data.error || "AI request failed");
        }

        addMessage(
            "Rashidson AI",
            data.reply || "I couldn't generate a response.",
            "ai"
        );

    } catch (error) {

        console.error("RSai error:", error);

        thinkingMessage.remove();

        addMessage(
            "Rashidson AI",
            "Sorry, I couldn't connect right now. Please try again.",
            "ai"
        );

    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
}


function addMessage(sender, text, type) {

    const message = document.createElement("div");
    message.className = `message ${type}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = type === "ai" ? "RS" : "You";

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


/* SEND BUTTON */

sendButton.addEventListener("click", sendMessage);


/* ENTER KEY */

messageInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }

});


/* PWA SERVICE WORKER */

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker.register("/service-worker.js")
            .then(() => {
                console.log("RSai service worker registered");
            })
            .catch(error => {
                console.error(
                    "RSai service worker registration failed:",
                    error
                );
            });

    });

}﻿
