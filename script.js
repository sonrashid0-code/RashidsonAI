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
   RASHIDSON AI SPEECH
===================================================== */

function speak(text) {

    if (!("speechSynthesis" in window)) {
        console.log("Speech synthesis is not supported.");
        return;
    }

    window.speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(text);

    voice.rate = 1;
    voice.pitch = 1;
    voice.volume = 1;

    voice.onstart = function () {

        if (voiceScreen.classList.contains("active")) {

            voiceStatus.textContent = "Speaking...";

            voiceSubtitle.textContent =
                "Rashidson AI is speaking";

        }

    };

    voice.onend = function () {

        if (voiceScreen.classList.contains("active")) {

            voiceStatus.textContent = "Ready";

            voiceSubtitle.textContent =
                "Tap the mic to speak";

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
   FORMAT RESPONSE
===================================================== */

function formatResponse(text) {

    const codeBlocks = [];

    text = text.replace(
        /```(\w+)?\n?([\s\S]*?)```/g,
        function (match, language, code) {

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
                    `___CODE_BLOCK_${index}___`,
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


    if (type === "ai") {

        const img =
            document.createElement("img");

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
                        document.getElementById(
                            codeId
                        );

                    if (!codeElement) {
                        return;
                    }

                    try {

                        await navigator.clipboard
                            .writeText(
                                codeElement.innerText
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
   SEND MESSAGE TO AI
===================================================== */

async function sendMessage(customMessage = null) {

    const message =
        customMessage !== null
            ? customMessage.trim()
            : messageInput.value.trim();


    if (!message) {
        return null;
    }


    addMessage(
        "user",
        message
    );


    if (customMessage === null) {

        messageInput.value = "";

    }


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


        return null;


    } finally {

        sendButton.disabled =
            false;

        sendButton.style.opacity =
            "1";

        messageInput.focus();

    }
}


/* =====================================================
   NORMAL SEND BUTTON
===================================================== */

sendButton.addEventListener(
    "click",
    () => {

        sendMessage();

    }
);


/* =====================================================
   ENTER KEY
===================================================== */

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


/* =====================================================
   SPEECH RECOGNITION
===================================================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;

let isListening = false;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.continuous =
        false;

    recognition.interimResults =
        false;

    recognition.lang =
        "en-US";


    recognition.onstart =
        function () {

            isListening = true;

            setListeningUI(true);

        };


    recognition.onresult =
        async function (event) {

            const transcript =
                event.results[0][0].transcript;

            console.log(
                "Recognized:",
                transcript
            );


            if (
                voiceScreen.classList.contains(
                    "active"
                )
            ) {

                voiceStatus.textContent =
                    "Thinking...";

                voiceSubtitle.textContent =
                    "Rashidson AI is thinking";


                await sendMessage(
                    transcript
                );


            } else {

                messageInput.value =
                    transcript;

            }

        };


    recognition.onerror =
        function (event) {

            console.error(
                "Speech recognition error:",
                event.error
            );

            setListeningUI(false);


            if (
                event.error ===
                "not-allowed"
            ) {

                if (
                    voiceScreen.classList.contains(
                        "active"
                    )
                ) {

                    voiceStatus.textContent =
                        "Microphone blocked";

                    voiceSubtitle.textContent =
                        "Allow microphone access in your browser";

                } else {

                    alert(
                        "Please allow microphone access for Rashidson AI."
                    );

                }

            } else {

                if (
                    voiceScreen.classList.contains(
                        "active"
                    )
                ) {

                    voiceStatus.textContent =
                        "Ready";

                    voiceSubtitle.textContent =
                        "Tap the mic to speak";

                }

            }

        };


    recognition.onend =
        function () {

            isListening = false;

            setListeningUI(false);

        };

}


/* =====================================================
   LISTENING UI
===================================================== */

function setListeningUI(active) {

    if (!voiceScreen.classList.contains("active")) {
        return;
    }


    if (active) {

        voiceStatus.textContent =
            "Listening...";

        voiceSubtitle.textContent =
            "Speak naturally, I'm here to help.";

        voiceMicButton.classList.add(
            "listening"
        );

    } else {

        voiceMicButton.classList.remove(
            "listening"
        );

    }

}


/* =====================================================
   START MICROPHONE
===================================================== */

function startListening() {

    if (!recognition) {

        alert(
            "Voice recognition is not supported by this browser. Try Google Chrome or Microsoft Edge."
        );

        return;

    }


    if (isListening) {

        recognition.stop();

        return;

    }


    try {

        window.speechSynthesis.cancel();

        recognition.start();

    } catch (error) {

        console.error(
            "Microphone start error:",
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

            startListening();

        }
    );

}


/* =====================================================
   OPEN VOICE CALL
===================================================== */

if (callButton) {

    callButton.addEventListener(
        "click",
        function () {

            openVoiceScreen();

        }
    );

}


/* =====================================================
   OPEN VOICE SCREEN
===================================================== */

function openVoiceScreen() {

    voiceScreen.classList.add(
        "active"
    );


    voiceStatus.textContent =
        "Ready";


    voiceSubtitle.textContent =
        "Tap the mic to speak";


    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CLOSE VOICE SCREEN
===================================================== */

function closeVoiceScreen() {

    if (recognition && isListening) {

        recognition.stop();

    }


    window.speechSynthesis.cancel();


    voiceScreen.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";


    voiceStatus.textContent =
        "Ready";


    voiceSubtitle.textContent =
        "Tap the mic to speak";

}


/* =====================================================
   VOICE MIC BUTTON
===================================================== */

voiceMicButton.addEventListener(
    "click",
    function () {

        startListening();

    }
);


/* =====================================================
   END CALL
===================================================== */

voiceEndButton.addEventListener(
    "click",
    function () {

        closeVoiceScreen();

    }
);


/* =====================================================
   TEXT BUTTON
===================================================== */

voiceTextButton.addEventListener(
    "click",
    function () {

        closeVoiceScreen();

        setTimeout(
            () => {

                messageInput.focus();

            },
            100
        );

    }
);


/* =====================================================
   TOP MENU
===================================================== */

const voiceMenuButton =
    document.getElementById(
        "voiceMenuButton"
    );


if (voiceMenuButton) {

    voiceMenuButton.addEventListener(
        "click",
        function () {

            console.log(
                "Rashidson AI menu"
            );

        }
    );

}


/* =====================================================
   TOP SETTINGS
===================================================== */

const voiceSettingsButton =
    document.getElementById(
        "voiceSettingsButton"
    );


if (voiceSettingsButton) {

    voiceSettingsButton.addEventListener(
        "click",
        function () {

            console.log(
                "Rashidson AI voice settings"
            );

        }
    );

}
