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
   VOICE RECOGNITION
===================================================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;

let isListening = false;
let voiceMode = false;
let processingVoice = false;


/* =====================================================
   CREATE SPEECH RECOGNITION
===================================================== */

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.continuous = false;

    recognition.interimResults = true;

    recognition.maxAlternatives = 1;


    recognition.onstart = function () {

        isListening = true;

        updateVoiceInterface(
            "Listening...",
            "I'm listening to you"
        );

    };


    recognition.onresult = function (event) {

        let finalText = "";
        let interimText = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            const transcript =
                event.results[i][0].transcript;

            if (event.results[i].isFinal) {

                finalText += transcript;

            } else {

                interimText += transcript;

            }

        }


        if (voiceMode) {

            voiceSubtitle.textContent =
                interimText ||
                finalText ||
                "I'm listening to you";

        } else {

            messageInput.value =
                interimText || finalText;

        }


        if (finalText.trim()) {

            if (voiceMode) {

                processVoiceMessage(
                    finalText.trim()
                );

            } else {

                messageInput.value =
                    finalText.trim();

                sendMessage();

            }

        }

    };


    recognition.onerror = function (event) {

        console.error(
            "Microphone error:",
            event.error
        );

        isListening = false;


        if (voiceMode) {

            if (event.error === "not-allowed") {

                updateVoiceInterface(
                    "Microphone blocked",
                    "Allow microphone permission in your browser"
                );

            } else if (event.error === "no-speech") {

                updateVoiceInterface(
                    "Ready",
                    "Tap the microphone to speak"
                );

            } else {

                updateVoiceInterface(
                    "Microphone error",
                    "Please try again"
                );

            }

        }

    };


    recognition.onend = function () {

        isListening = false;

        /*
         * In voice conversation mode,
         * we don't immediately restart here.
         * We restart after Rashidson AI finishes speaking.
         */

        if (!voiceMode && !processingVoice) {

            micButton.textContent = "🎤";

        }

    };

}


/* =====================================================
   TEXT TO SPEECH
===================================================== */

function speak(text, continueListening = false) {

    if (!("speechSynthesis" in window)) {

        if (continueListening) {
            startVoiceListening();
        }

        return;

    }


    window.speechSynthesis.cancel();


    const cleanText =
        text
            .replace(/```[\s\S]*?```/g, "code omitted")
            .replace(/[*#_`]/g, "")
            .replace(/\n+/g, ". ");


    const voice =
        new SpeechSynthesisUtterance(cleanText);


    voice.rate = 1;

    voice.pitch = 1;

    voice.volume = 1;


    voice.onstart = function () {

        if (voiceMode) {

            updateVoiceInterface(
                "Rashidson AI is speaking",
                "Listen to Rashidson AI"
            );

        }

    };


    voice.onend = function () {

        if (voiceMode && continueListening) {

            setTimeout(() => {

                if (voiceMode) {

                    startVoiceListening();

                }

            }, 300);

        }

    };


    voice.onerror = function () {

        if (voiceMode && continueListening) {

            startVoiceListening();

        }

    };


    window.speechSynthesis.speak(voice);

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(text) {

    const div =
        document.createElement("div");

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
        function (
            match,
            language,
            code
        ) {

            const id =
                "code-" +
                Date.now() +
                "-" +
                codeBlocks.length;


            codeBlocks.push({

                id: id,

                code: code.trim(),

                language:
                    language || "code"

            });


            return (
                "___CODE_BLOCK_" +
                codeBlocks.length +
                "___"
            );

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
        function (block, index) {

            const safeCode =
                escapeHTML(
                    block.code
                );


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

                    <pre id="${block.id}">
<code>${safeCode}</code>
</pre>

                </div>

            `;


            formatted =
                formatted.replace(
                    "___CODE_BLOCK_" +
                    (index + 1) +
                    "___",
                    codeHTML
                );

        }
    );


    return formatted;

}


/* =====================================================
   ADD MESSAGE
===================================================== */

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

        img.src =
            "icon.png";

        img.alt =
            "Rashidson AI";

        avatar.appendChild(img);

    } else {

        avatar.innerHTML =
            "👤";

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


    /* COPY CODE BUTTONS */

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

                        await navigator.clipboard.writeText(
                            code
                        );


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
   SEND NORMAL TEXT MESSAGE
===================================================== */

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


    messageInput.value =
        "";


    sendButton.disabled =
        true;


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

                        message:
                            message

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


/* =====================================================
   START MICROPHONE
===================================================== */

function startMicrophone() {

    if (!recognition) {

        alert(
            "Voice recognition is not supported by this browser. Please try Chrome or Edge."
        );

        return;

    }


    if (isListening) {

        recognition.stop();

        return;

    }


    try {

        recognition.start();

    } catch (error) {

        console.error(
            "Could not start microphone:",
            error
        );

    }

}


/* =====================================================
   NORMAL MIC BUTTON
===================================================== */

if (micButton) {

    micButton.addEventListener(
        "click",
        function () {

            voiceMode = false;

            startMicrophone();

        }
    );

}


/* =====================================================
   OPEN FULL VOICE MODE
===================================================== */

function openVoiceMode() {

    if (!voiceScreen) {

        return;

    }


    voiceMode = true;

    processingVoice = false;


    voiceScreen.classList.add(
        "active"
    );


    updateVoiceInterface(
        "Ready",
        "Tap the microphone to speak"
    );

}


/* =====================================================
   CALL BUTTON
===================================================== */

if (callButton) {

    callButton.addEventListener(
        "click",
        function () {

            openVoiceMode();

        }
    );

}


/* =====================================================
   VOICE MICROPHONE BUTTON
===================================================== */

if (voiceMicButton) {

    voiceMicButton.addEventListener(
        "click",
        function () {

            if (!voiceMode) {

                return;

            }


            if (isListening) {

                recognition.stop();

            } else {

                startVoiceListening();

            }

        }
    );

}


/* =====================================================
   START VOICE LISTENING
===================================================== */

function startVoiceListening() {

    if (!recognition) {

        updateVoiceInterface(
            "Microphone unavailable",
            "Try Chrome or Edge and allow microphone access"
        );

        return;

    }


    if (isListening) {

        return;

    }


    if (processingVoice) {

        return;

    }


    try {

        recognition.start();

    } catch (error) {

        console.error(
            "Voice start error:",
            error
        );

    }

}


/* =====================================================
   PROCESS VOICE MESSAGE
===================================================== */

async function processVoiceMessage(message) {

    if (!message || processingVoice) {

        return;

    }


    processingVoice = true;


    if (recognition && isListening) {

        try {

            recognition.stop();

        } catch (error) {}

    }


    updateVoiceInterface(
        "Thinking...",
        "Rashidson AI is preparing a response"
    );


    /*
     * Also place the conversation
     * in the normal chat history.
     */

    addMessage(
        "user",
        message
    );


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

                        message:
                            message

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


        processingVoice =
            false;


        /*
         * Speak to the user.
         *
         * When Rashidson finishes speaking,
         * microphone listening starts again.
         */

        speak(
            reply,
            true
        );


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


        processingVoice =
            false;


        speak(
            errorMessage,
            true
        );

    }

}


/* =====================================================
   UPDATE VOICE SCREEN
===================================================== */

function updateVoiceInterface(
    status,
    subtitle
) {

    if (voiceStatus) {

        voiceStatus.textContent =
            status;

    }


    if (voiceSubtitle) {

        voiceSubtitle.textContent =
            subtitle;

    }


    if (voiceMicButton) {

        if (status === "Listening...") {

            voiceMicButton.textContent =
                "⏹️";

        } else {

            voiceMicButton.textContent =
                "🎙️";

        }

    }

}


/* =====================================================
   END VOICE MODE
===================================================== */

function closeVoiceMode() {

    voiceMode = false;

    processingVoice = false;


    if (recognition) {

        try {

            recognition.stop();

        } catch (error) {}

    }


    if ("speechSynthesis" in window) {

        window.speechSynthesis.cancel();

    }


    isListening = false;


    if (voiceScreen) {

        voiceScreen.classList.remove(
            "active"
        );

    }

}


/* =====================================================
   END BUTTON
===================================================== */

if (voiceEndButton) {

    voiceEndButton.addEventListener(
        "click",
        closeVoiceMode
    );

}


/* =====================================================
   "ASK RASHIDSON AI" BUTTON
===================================================== */

if (voiceTextButton) {

    voiceTextButton.addEventListener(
        "click",
        function () {

            closeVoiceMode();

            setTimeout(() => {

                messageInput.focus();

            }, 100);

        }
    );

}


/* =====================================================
   SEND BUTTON
===================================================== */

if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );

}


/* =====================================================
   ENTER KEY
===================================================== */

if (messageInput) {

    messageInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


/* =====================================================
   BROWSER SUPPORT MESSAGE
===================================================== */

if (!recognition) {

    console.warn(
        "Speech Recognition is not supported in this browser."
    );

}


/* =====================================================
   INITIAL FOCUS
===================================================== */

if (messageInput) {

    messageInput.focus();

}
