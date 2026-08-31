const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const micButton = document.getElementById("micButton");
const callButton = document.getElementById("callButton");

const voiceScreen = document.getElementById("voiceScreen");
const voiceMicButton = document.getElementById("voiceMicButton");
const voiceEndButton = document.getElementById("voiceEndButton");
const voiceTextButton = document.getElementById("voiceTextButton");

const voiceStatus = document.getElementById("voiceStatus");
const voiceSubtitle = document.getElementById("voiceSubtitle");


/* =========================
   RASHIDSON AI VOICE
========================= */

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(text);

    voice.rate = 1;
    voice.pitch = 1;
    voice.volume = 1;

    voice.onstart = () => {

        if (voiceScreen.classList.contains("active")) {

            voiceStatus.textContent = "Speaking";
            voiceSubtitle.textContent =
                "Rashidson AI is responding...";
        }
    };

    voice.onend = () => {

        if (voiceScreen.classList.contains("active")) {

            voiceStatus.textContent = "Ready";
            voiceSubtitle.textContent =
                "Tap the microphone to speak";
        }
    };

    window.speechSynthesis.speak(voice);
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

    text = text.replace(
        /```(\w+)?\n?([\s\S]*?)```/g,
        function(match, language, code) {

            const id =
                "code-" +
                Date.now() +
                "-" +
                codeBlocks.length;

            codeBlocks.push({
                id: id,
                code: code.trim(),
                language: language || "code"
            });

            return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
        }
    );

    let formatted = escapeHTML(text);

    formatted = formatted.replace(
        /\n/g,
        "<br>"
    );

    codeBlocks.forEach((block, index) => {

        const safeCode =
            escapeHTML(block.code);

        const codeHTML = `
            <div class="code-box">

                <div class="code-header">

                    <span>${block.language}</span>

                    <button
                        class="copy-code"
                        data-code-id="${block.id}"
                    >
                        Copy
                    </button>

                </div>

                <pre id="${block.id}">
                    <code>${safeCode}</code>
                </pre>

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

    const message =
        document.createElement("div");

    message.className =
        `message ${type}`;

    const avatar =
        document.createElement("div");

    avatar.className =
        "avatar";

    const img =
        document.createElement("img");

    if (type === "ai") {

        img.src = "icon.png";
        img.alt = "Rashidson AI";

        avatar.appendChild(img);

    } else {

        avatar.innerHTML = "👤";
    }


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    const name =
        document.createElement("strong");

    name.textContent =
        type === "ai"
            ? "Rashidson AI"
            : "You";


    const paragraph =
        document.createElement("p");


    if (type === "ai") {

        paragraph.innerHTML =
            formatResponse(text);

    } else {

        paragraph.textContent =
            text;
    }


    content.appendChild(name);

    content.appendChild(paragraph);

    message.appendChild(avatar);

    message.appendChild(content);

    chat.appendChild(message);

    chat.scrollTop =
        chat.scrollHeight;


    /* Copy buttons */

    message
        .querySelectorAll(".copy-code")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const codeId =
                        button.dataset.codeId;

                    const codeElement =
                        document.getElementById(
                            codeId
                        );

                    const code =
                        codeElement.innerText;

                    try {

                        await navigator.clipboard
                            .writeText(code);

                        button.textContent =
                            "Copied ✓";

                        setTimeout(() => {

                            button.textContent =
                                "Copy";

                        }, 1500);

                    } catch (error) {

                        console.error(
                            "Copy failed:",
                            error
                        );
                    }
                }
            );
        });

    return message;
}


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage(customMessage = null) {

    const message =
        customMessage ||
        messageInput.value.trim();

    if (!message) {
        return;
    }


    addMessage(
        "user",
        message
    );


    if (!customMessage) {

        messageInput.value = "";

    }


    sendButton.disabled = true;

    sendButton.style.opacity =
        "0.6";


    try {

        const response =
            await fetch(
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


        addMessage(
            "ai",
            reply
        );


        speak(reply);


        return reply;


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


        speak(
            errorMessage
        );


    } finally {

        sendButton.disabled =
            false;

        sendButton.style.opacity =
            "1";

        messageInput.focus();
    }
}


/* =========================
   NORMAL SEND BUTTON
========================= */

sendButton.addEventListener(
    "click",
    () => sendMessage()
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


/* ==================================================
   SPEECH RECOGNITION
================================================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


let recognition = null;

let listening = false;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.lang = "en-US";


    recognition.onstart = () => {

        listening = true;

        if (voiceScreen.classList.contains("active")) {

            voiceStatus.textContent =
                "Listening";

            voiceSubtitle.textContent =
                "I'm listening...";
        }

        if (micButton) {

            micButton.textContent =
                "🔴";
        }
    };


    recognition.onresult =
        async function(event) {

            const transcript =
                event.results[0][0].transcript;

            console.log(
                "Speech:",
                transcript
            );


            if (voiceScreen.classList.contains("active")) {

                voiceStatus.textContent =
                    "Thinking";

                voiceSubtitle.textContent =
                    transcript;
            }


            await sendVoiceMessage(
                transcript
            );
        };


    recognition.onerror =
        function(event) {

            console.error(
                "Speech recognition error:",
                event.error
            );


            listening = false;


            if (voiceScreen.classList.contains("active")) {

                voiceStatus.textContent =
                    "Ready";

                voiceSubtitle.textContent =
                    "Tap the microphone to speak";
            }
        };


    recognition.onend =
        function() {

            listening = false;

            if (micButton) {

                micButton.textContent =
                    "🎤";
            }
        };
}


/* =========================
   START MICROPHONE
========================= */

function startListening() {

    if (!recognition) {

        alert(
            "Voice recognition is not supported by this browser. Try Chrome or Edge."
        );

        return;
    }


    if (listening) {

        recognition.stop();

        return;
    }


    try {

        recognition.start();

    } catch (error) {

        console.error(
            "Microphone error:",
            error
        );
    }
}


/* =========================
   VOICE MESSAGE
========================= */

async function sendVoiceMessage(text) {

    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: text
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
            "Sorry, I couldn't answer that.";


        /* Add conversation to normal chat */

        addMessage(
            "user",
            text
        );

        addMessage(
            "ai",
            reply
        );


        /* Speak AI response */

        speak(reply);


        if (voiceScreen.classList.contains("active")) {

            voiceStatus.textContent =
                "Speaking";

            voiceSubtitle.textContent =
                "Rashidson AI is responding...";
        }


    } catch (error) {

        console.error(
            "Voice AI error:",
            error
        );


        const errorMessage =
            "Sorry, I couldn't connect to Rashidson AI.";


        if (voiceScreen.classList.contains("active")) {

            voiceStatus.textContent =
                "Connection error";

            voiceSubtitle.textContent =
                "Please try again";
        }


        speak(
            errorMessage
        );
    }
}


/* =========================
   SMALL MIC BUTTON
========================= */

if (micButton) {

    micButton.addEventListener(
        "click",
        startListening
    );
}


/* =========================
   OPEN VOICE SCREEN
========================= */

if (callButton) {

    callButton.addEventListener(
        "click",
        function() {

            voiceScreen.classList.add(
                "active"
            );


            voiceStatus.textContent =
                "Ready";


            voiceSubtitle.textContent =
                "Tap the microphone to speak";
        }
    );
}


/* =========================
   BIG VOICE MIC
========================= */

if (voiceMicButton) {

    voiceMicButton.addEventListener(
        "click",
        startListening
    );
}


/* =========================
   END VOICE CALL
========================= */

if (voiceEndButton) {

    voiceEndButton.addEventListener(
        "click",
        function() {

            if (recognition && listening) {

                recognition.stop();
            }


            window.speechSynthesis.cancel();


            voiceScreen.classList.remove(
                "active"
            );


            voiceStatus.textContent =
                "Ready";


            voiceSubtitle.textContent =
                "Tap the microphone to speak";
        }
    );
}


/* =========================
   ASK RASHIDSON AI BUTTON
========================= */

if (voiceTextButton) {

    voiceTextButton.addEventListener(
        "click",
        function() {

            voiceScreen.classList.remove(
                "active"
            );

            messageInput.focus();
        }
    );
}
