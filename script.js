const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");

/* =========================
   RASHIDSON AI VOICE OUTPUT
========================= */

function speak(text, onEnd = null) {

    if (!("speechSynthesis" in window)) {
        console.log("Speech synthesis is not supported.");
        if (onEnd) onEnd();
        return;
    }

    window.speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(text);

    voice.rate = 1;
    voice.pitch = 1;
    voice.volume = 1;
    voice.lang = "en-US";

    voice.onend = function () {
        if (onEnd) onEnd();
    };

    voice.onerror = function () {
        if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(voice);
}


/* =========================
   SPEECH RECOGNITION
========================= */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;
let isListening = false;
let voiceConversation = false;
let recognitionStarting = false;

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = function () {

        isListening = true;
        recognitionStarting = false;

        if (micButton) {
            micButton.textContent = "🔴";
            micButton.title = "Stop listening";
        }

        messageInput.placeholder =
            "Listening...";
    };


    recognition.onresult = function (event) {

        const spokenText =
            event.results[0][0].transcript.trim();

        if (!spokenText) {
            return;
        }

        messageInput.value = spokenText;

        /*
         * Send the spoken message automatically.
         */
        sendMessage();
    };


    recognition.onerror = function (event) {

        console.error(
            "Microphone error:",
            event.error
        );

        recognitionStarting = false;

        if (event.error === "not-allowed") {

            addMessage(
                "ai",
                "Microphone permission was blocked. Please allow microphone access in your browser and try again."
            );

            voiceConversation = false;
        }

        else if (event.error === "no-speech") {

            if (voiceConversation) {
                setTimeout(startListening, 500);
            }
        }

        else if (event.error === "audio-capture") {

            addMessage(
                "ai",
                "I couldn't access the microphone. Please check that your microphone is connected and available."
            );

            voiceConversation = false;
        }
    };


    recognition.onend = function () {

        isListening = false;
        recognitionStarting = false;

        if (micButton) {

            micButton.textContent =
                voiceConversation ? "🛑" : "🎤";

            micButton.title =
                voiceConversation
                    ? "Stop voice conversation"
                    : "Speak to Rashidson AI";
        }

        messageInput.placeholder =
            "Message Rashidson AI...";

        /*
         * In voice-conversation mode,
         * listening can start again after
         * Rashidson finishes speaking.
         */
    };

} else {

    console.log(
        "Speech recognition is not supported in this browser."
    );
}


/* =========================
   START MICROPHONE
========================= */

function startListening() {

    if (!recognition) {

        addMessage(
            "ai",
            "Voice input is not supported by this browser. Please use Microsoft Edge or Google Chrome."
        );

        return;
    }

    if (isListening || recognitionStarting) {
        return;
    }

    try {

        recognitionStarting = true;
        recognition.start();

    } catch (error) {

        recognitionStarting = false;

        console.error(
            "Could not start microphone:",
            error
        );
    }
}


/* =========================
   STOP MICROPHONE
========================= */

function stopListening() {

    if (recognition && isListening) {

        recognition.stop();
    }

    isListening = false;
    recognitionStarting = false;
}


/* =========================
   MICROPHONE BUTTON
========================= */

if (micButton) {

    micButton.addEventListener(
        "click",
        function () {

            /*
             * If already listening,
             * stop everything.
             */
            if (isListening) {

                voiceConversation = false;

                stopListening();

                window.speechSynthesis.cancel();

                micButton.textContent = "🎤";
                micButton.title =
                    "Speak to Rashidson AI";

                return;
            }


            /*
             * Start normal one-message
             * voice input.
             */
            voiceConversation = false;

            startListening();
        }
    );
}


/* =========================
   VOICE CONVERSATION BUTTON
========================= */

/*
 * We will create this button from JavaScript
 * so you don't have to change your HTML again.
 */

const callButton =
    document.createElement("button");

callButton.id = "callButton";
callButton.type = "button";
callButton.textContent = "📞";
callButton.title =
    "Start voice conversation";


/*
 * Put the call button beside
 * the microphone button.
 */

if (micButton) {

    micButton.parentNode.insertBefore(
        callButton,
        micButton
    );
}


/* =========================
   VOICE CONVERSATION
========================= */

callButton.addEventListener(
    "click",
    function () {

        if (!recognition) {

            addMessage(
                "ai",
                "Voice conversation is not supported by this browser. Please use Microsoft Edge or Google Chrome."
            );

            return;
        }


        /*
         * STOP VOICE CONVERSATION
         */
        if (voiceConversation) {

            voiceConversation = false;

            stopListening();

            window.speechSynthesis.cancel();

            callButton.textContent = "📞";
            callButton.title =
                "Start voice conversation";

            micButton.textContent = "🎤";
            micButton.title =
                "Speak to Rashidson AI";

            messageInput.placeholder =
                "Message Rashidson AI...";

            return;
        }


        /*
         * START VOICE CONVERSATION
         */

        voiceConversation = true;

        callButton.textContent = "🛑";
        callButton.title =
            "Stop voice conversation";

        startListening();
    }
);


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

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

    let formatted =
        escapeHTML(text);

    formatted =
        formatted.replace(
            /\n/g,
            "<br>"
        );

    codeBlocks.forEach(
        (block, index) => {

            const safeCode =
                escapeHTML(block.code);

            const codeHTML = `
                <div class="code-box">

                    <div class="code-header">

                        <span>
                            ${block.language}
                        </span>

                        <button
                            class="copy-code"
                            data-code-id="${block.id}"
                        >
                            Copy
                        </button>

                    </div>

                    <pre id="${block.id}"><code>${safeCode}</code></pre>

                </div>
            `;

            formatted =
                formatted.replace(
                    `___CODE_BLOCK_${index}___`,
                    codeHTML
                );
        }
    );

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


    /*
     * Copy code buttons
     */

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

async function sendMessage() {

    const message =
        messageInput.value.trim();


    if (!message) {
        return;
    }


    addMessage(
        "user",
        message
    );


    messageInput.value = "";


    sendButton.disabled = true;
    sendButton.style.opacity = "0.6";


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


        /*
         * Normal chat:
         * Rashidson speaks once.
         *
         * Voice conversation:
         * Rashidson speaks, then
         * listens again.
         */

        if (voiceConversation) {

            speak(
                reply,
                function () {

                    if (voiceConversation) {

                        setTimeout(
                            startListening,
                            400
                        );
                    }
                }
            );

        } else {

            speak(reply);
        }


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


        if (voiceConversation) {

            speak(
                errorMessage,
                function () {

                    if (voiceConversation) {

                        setTimeout(
                            startListening,
                            400
                        );
                    }
                }
            );

        } else {

            speak(errorMessage);
        }


    } finally {

        sendButton.disabled = false;
        sendButton.style.opacity = "1";

        /*
         * Don't focus the keyboard while
         * voice conversation is active.
         */

        if (!voiceConversation) {
            messageInput.focus();
        }
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
