
export async function askTajweed(question) {
  const response = await fetch("https://tajweed-rag-api.vercel.app/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });

  if (!response.ok) {
    throw new Error("Failed to get an answer from Jais.");
  }

  return response.json();
}

export function createChatbot() {
  const container = document.createElement("section");
  container.className = "chatbot-page";

  container.innerHTML = `
    <h2>المساعد الذكي للتجويد</h2>
    <p>اسأل عن أحكام التجويد وسنساعدك في فهمها.</p>
    <div class="chat-messages" id="chat-messages" dir="rtl"></div>
    <form id="chat-form" class="chat-form">
      <input id="chat-input" type="text" placeholder="اكتب سؤالك هنا..." required dir="rtl">
      <button type="submit">إرسال</button>
    </form>
  `;

  const messages = container.querySelector("#chat-messages");
  const form = container.querySelector("#chat-form");
  const input = container.querySelector("#chat-input");
  const button = form.querySelector("button");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;

    addMessage(question, "user");
    input.value = "";
    button.disabled = true;

    const loading = addMessage("جاري التفكير...", "assistant");

    try {
      const data = await askTajweed(question);
      loading.textContent = data.answer || "لم يتم العثور على إجابة.";
    } catch (error) {
      loading.textContent = "حدث خطأ في الاتصال. تأكد من تشغيل FastAPI.";
    } finally {
      button.disabled = false;
    }
  });

  function addMessage(text, role) {
    const message = document.createElement("div");
    message.className = `chat-message ${role}`;
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
    return message;
  }

  return container;
}
