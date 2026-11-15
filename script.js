const WORKER_URL = "https://loreal-chatbot.shuis-gigi.workers.dev/";

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

const systemPrompt = `
You are a L’Oréal beauty assistant. Help users discover L’Oréal makeup,
skincare, haircare, and fragrances. Suggest products or simple routines
based on their needs. Use the conversation history to answer follow-up
questions, including details the user has shared, such as their name or skin type.
For unrelated requests, politely redirect the user to L’Oréal products
and beauty routines. If you are unsure about a product detail, say so.
Use plain text and numbered lists. Avoid Markdown formatting.
`.trim();

const conversationHistory = [];
let isSending = false;

const latestQuestion = document.createElement("p");
latestQuestion.className = "latest-question";
latestQuestion.hidden = true;
chatWindow.before(latestQuestion);

chatWindow.setAttribute("role", "log");
chatWindow.setAttribute("aria-label", "Beauty assistant conversation");
chatWindow.replaceChildren();

function addMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `chat-message chat-message--${role}`;
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

addMessage(
  "assistant",
  "👋 Hi! How can I help with your beauty routine today?",
);

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = userInput.value.trim();
  if (!question || isSending) return;

  isSending = true;
  latestQuestion.textContent = `Latest question: ${question}`;
  latestQuestion.hidden = false;

  addMessage("user", question);
  userInput.value = "";
  const reply = addMessage("assistant", "Thinking…");

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory.slice(-12),
          { role: "user", content: question },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed (HTTP ${response.status}).`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error("The API returned no reply.");
    }

    reply.textContent = answer;
    conversationHistory.push(
      { role: "user", content: question },
      { role: "assistant", content: answer },
    );
  } catch (error) {
    reply.textContent = `Could not get a reply. ${error.message}`;
  } finally {
    isSending = false;
  }
});
