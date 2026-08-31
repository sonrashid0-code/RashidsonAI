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


/* =====================================================
   RASHIDSON AI VOICE SYSTEM
===================================================== */

let recognition = null;
let isListening = false;
let voiceMode = false;
let shouldContinueVoice = false;


/* =====================================================
   SPEAK — AI TALKS BACK
===================================================== */

function speak(text) {

    if (!("speechSynthesis" in window)) {
        console.warn("Speech synthesis is not supported.");
        return;
    }

    window.speechSynthesis.cancel();

    const cleanText = text
        .replace(/```[\s\S]*?```/g, "Code omitted.")
        .replace(/[*_#`]/g, "")
        .replace(/\n+/g, " ")
        .trim();

    if (!cleanText) return;

    const voice = new SpeechSynthesisUtterance(cleanText);

    voice.rate = 0.95;
    voice.pitch = 1;
    voice.volume = 1;

    voice.onstart = () => {

        if (voiceMode) {
            voiceStatus.textContent = "Rashidson AI is speaking...";
            voiceSubtitle.textContent = "Listen to Rashidson AI";
        }
    };

    voice.onend = () => {

        if (voiceMode && shouldContinueVoice) {

            voiceStatus.textContent = "Listening...";
            voiceSubtitle.textContent =
                "Speak naturally, I'm here to help.";

            setTimeout(() => {
                startListening();
            }, 300);
        }
    };

    window.speechSynthesis.speak(voice);
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


/* =====================================================
   FORMAT AI RESPONSE
===================================================== */

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

    formatted = formatted.replace(/\n/g, "<br>");

    codeBlocks.forEach((block, index) => {

        const safeCode = escapeHTML(block.code);

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


/* =====================================================
   ADD MESSAGE
===================================================== */

function addMessage(type, text) {

    const message = document.createElement("div");

    message.className =
        `message ${type}`;

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


    /* COPY CODE */

    message
        .querySelectorAll(".copy-code")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const codeId =
                        button.dataset.codeId;

                    const codeElement =
                        document.getElementById(codeId);

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


/* =====================================================
   SEND MESSAGE TO AI
===================================================== */

async function askRashidsonAI(message) {

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

    return (
        data.reply ||
        "Sorry, I couldn't generate a response."
    );
}


/* =====================================================
   NORMAL TEXT CHAT
===================================================== */

async function sendMessage() {

    const message =
        messageInput.value.trim();

    if (!message) return;

    addMessage(
        "user",
        message
    );

    messageInput.value = "";

    sendButton.disabled = true;

    sendButton.style.opacity =
        "0.6";

    try {

        const reply =
            await askRashidsonAI(message);

        addMessage(
            "ai",
            reply
        );

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

        sendButton.disabled =
            false;

        sendButton.style.opacity =
            "1";

        messageInput.focus();
    }
}


/* =====================================================
   SPEECH RECOGNITION
===================================================== */

function createRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        return null;
    }

    const recognizer =
        new SpeechRecognition();

    recognizer.lang = "en-US";

    recognizer.continuous = false;

    recognizer.interimResults = true;

    recognizer.maxAlternatives = 1;


    /* -------------------------
       START
    ------------------------- */

    recognizer.onstart = () => {

        isListening = true;

        if (voiceMode) {

            voiceStatus.textContent =
                "Listening...";

            voiceSubtitle.textContent =
                "Speak naturally, I'm here to help.";
        }
    };


    /* -------------------------
       RESULT
    ------------------------- */

    recognizer.onresult = event => {

        let finalText = "";
        let interimText = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            const transcript =
                event.results[i][0].transcript;

            if (
                event.results[i].isFinal
            ) {

                finalText += transcript;

            } else {

                interimText += transcript;
            }
        }


        /* NORMAL CHAT */

        if (!voiceMode) {

            if (interimText) {

                messageInput.value =
                    interimText;
            }

            if (finalText) {

                messageInput.value =
                    finalText;

                setTimeout(() => {
                    sendMessage();
                }, 150);
            }

            return;
        }


        /* VOICE MODE */

        if (voiceMode) {

            if (interimText) {

                voiceStatus.textContent =
                    "Hearing you...";

                voiceSubtitle.textContent =
                    interimText;
            }

            if (finalText) {

                const spokenMessage =
                    finalText.trim();

                if (spokenMessage) {

                    handleVoiceMessage(
                        spokenMessage
                    );
                }
            }
        }
    };


    /* -------------------------
       END
    ------------------------- */

    recognizer.onend = () => {

        isListening = false;

        if (
            voiceMode &&
            shouldContinueVoice &&
            !window.speechSynthesis.speaking
        ) {

            voiceStatus.textContent =
                "Ready";

            voiceSubtitle.textContent =
                "Tap the microphone to speak.";
        }
    };


    /* -------------------------
       ERROR
    ------------------------- */

    recognizer.onerror = event => {

        isListening = false;

        console.error(
            "Microphone error:",
            event.error
        );

        if (voiceMode) {

            if (event.error === "not-allowed") {

                voiceStatus.textContent =
                    "Microphone blocked";

                voiceSubtitle.textContent =
                    "Allow microphone permission in your browser.";
            }

            else if (
                event.error === "no-speech"
            ) {

                voiceStatus.textContent =
                    "Didn't hear you";

                voiceSubtitle.textContent =
                    "Tap the microphone and try again.";
            }

            else {

                voiceStatus.textContent =
                    "Microphone error";

                voiceSubtitle.textContent =
                    "Please try again.";
            }
        }
    };


    return recognizer;
}


/* =====================================================
   START LISTENING
===================================================== */

function startListening() {

    if (!recognition) {

        recognition =
            createRecognition();
    }

    if (!recognition) {

        const message =
            "Your browser does not support voice recognition. Try Chrome or Edge.";

        if (voiceMode) {

            voiceStatus.textContent =
                "Voice not supported";

            voiceSubtitle.textContent =
                message;

        } else {

            alert(message);
        }

        return;
    }

    if (isListening) return;

    /* Stop AI speaking before listening */

    window.speechSynthesis.cancel();

    try {

        recognition.start();

    } catch (error) {

        console.log(
            "Recognition already running."
        );
    }
}


/* =====================================================
   STOP LISTENING
===================================================== */

function stopListening() {

    if (
        recognition &&
        isListening
    ) {

        try {

            recognition.stop();

        } catch (error) {

            console.log(error);
        }
    }

    isListening = false;
}


/* =====================================================
   NORMAL MICROPHONE BUTTON
===================================================== */

if (micButton) {

    micButton.addEventListener(
        "click",
        () => {

            if (isListening) {

                stopListening();

                micButton.textContent =
                    "🎤";

                return;
            }

            startListening();

            micButton.textContent =
                "🔴";
        }
    );
}


/* =====================================================
   VOICE CONVERSATION
===================================================== */

async function handleVoiceMessage(message) {

    stopListening();

    if (!voiceMode) return;

    voiceStatus.textContent =
        "Thinking...";

    voiceSubtitle.textContent =
        message;


    /* Show the conversation in normal chat too */

    addMessage(
        "user",
        message
    );


    try {

        const reply =
            await askRashidsonAI(message);

        addMessage(
            "ai",
            reply
        );


        if (voiceMode) {

            voiceStatus.textContent =
                "Rashidson AI is speaking...";

            voiceSubtitle.textContent =
                "Please wait...";

            speak(reply);
        }

    } catch (error) {

        console.error(
            "Voice AI error:",
            error
        );

        const errorMessage =
            "Sorry, I couldn't connect to Rashidson AI right now.";

        addMessage(
            "ai",
            errorMessage
        );

        if (voiceMode) {

            speak(errorMessage);
        }
    }
}


/* =====================================================
   OPEN FULL-SCREEN VOICE MODE
===================================================== */

function openVoiceMode() {

    voiceMode = true;

    shouldContinueVoice = true;

    voiceScreen.classList.add(
        "active"
    );

    voiceStatus.textContent =
        "Ready";

    voiceSubtitle.textContent =
        "Tap the microphone to speak";

    window.speechSynthesis.cancel();
}


/* =====================================================
   CALL BUTTON
===================================================== */

if (callButton) {

    callButton.addEventListener(
        "click",
        () => {

            openVoiceMode();

        }
    );
}


/* =====================================================
   BIG VOICE MICROPHONE
===================================================== */

if (voiceMicButton) {

    voiceMicButton.addEventListener(
        "click",
        () => {

            if (isListening) {

                stopListening();

                voiceStatus.textContent =
                    "Paused";

                voiceSubtitle.textContent =
                    "Tap the microphone to speak";

                return;
            }

            startListening();

        }
    );
}


/* =====================================================
   END VOICE CONVERSATION
===================================================== */

if (voiceEndButton) {

    voiceEndButton.addEventListener(
        "click",
        () => {

            shouldContinueVoice =
                false;

            voiceMode =
                false;

            stopListening();

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


/* =====================================================
   ASK RASHIDSON AI BUTTON
===================================================== */

if (voiceTextButton) {

    voiceTextButton.addEventListener(
        "click",
        () => {

            shouldContinueVoice =
                false;

            voiceMode =
                false;

            stopListening();

            window.speechSynthesis.cancel();

            voiceScreen.classList.remove(
                "active"
            );

            messageInput.focus();
        }
    );
}


/* =====================================================
   SEND BUTTON
===================================================== */

sendButton.addEventListener(
    "click",
    sendMessage
);


/* =====================================================
   ENTER KEY
===================================================== */

messageInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);


/* =====================================================
   INITIALIZE
===================================================== */

recognition =
    createRecognition();

console.log(
    "Rashidson AI voice system ready."
);
