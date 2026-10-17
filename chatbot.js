(() => {
  const panel = document.getElementById("gndu-chat-panel");
  const launcher = document.getElementById("gndu-chat-launcher");
  const closeButton = document.getElementById("gndu-chat-close");
  const clearButton = document.getElementById("gndu-chat-clear");
  const form = document.getElementById("gndu-chat-form");
  const input = document.getElementById("gndu-chat-input");
  const sendButton = document.getElementById("gndu-chat-send");
  const messages = document.getElementById("gndu-chat-messages");
  const status = document.getElementById("gndu-chat-status");
  let submitting = false;

  function isSafeHttpUrl(urlValue) {
    try {
      const url = new URL(urlValue);
      return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname) &&
        !url.username && !url.password;
    } catch {
      return false;
    }
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
    else launcher.focus();
  }

  function appendLinkedText(container, text) {
    const urlPattern = /https?:\/\/[^\s<>"']+/giu;
    let previousIndex = 0;

    for (const match of text.matchAll(urlPattern)) {
      let urlText = match[0].replace(/[),.;!?}\]]+$/u, "");
      const trailingText = match[0].slice(urlText.length);
      if (!urlText || !isSafeHttpUrl(urlText)) continue;

      container.append(document.createTextNode(text.slice(previousIndex, match.index)));
      const link = document.createElement("a");
      link.href = urlText;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = urlText;
      container.append(link, document.createTextNode(trailingText));
      previousIndex = match.index + match[0].length;
    }

    container.append(document.createTextNode(text.slice(previousIndex)));
  }

  function appendMessage(role, text, sources = []) {
    const article = document.createElement("article");
    article.className = `chat-message chat-message-${role}`;
    const paragraph = document.createElement("p");
    appendLinkedText(paragraph, text);
    article.append(paragraph);

    const safeSources = sources.filter((source) => isSafeHttpUrl(source.url));

    if (safeSources.length) {
      const sourceList = document.createElement("div");
      sourceList.className = "chat-sources";
      const heading = document.createElement("strong");
      heading.textContent = "Official sources";
      sourceList.append(heading);

      for (const source of safeSources) {
        const link = document.createElement("a");
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = source.title || source.url;
        sourceList.append(link);
      }
      article.append(sourceList);
    }

    messages.append(article);
    messages.scrollTop = messages.scrollHeight;
    return article;
  }

  async function checkConnection() {
    try {
      const response = await fetch("/api/health", { headers: { Accept: "application/json" } });
      const result = await response.json();
      if (!response.ok || result.ready !== true) throw new Error("The FAQ service is unavailable.");
      status.textContent = "GNDU FAQ assistant ready";
    } catch {
      status.textContent = "FAQ assistant unavailable · Start the website server";
    }
  }

  launcher.addEventListener("click", () => setOpen(panel.hidden));
  closeButton.addEventListener("click", () => setOpen(false));

  clearButton.addEventListener("click", () => {
    if (submitting) return;
    messages.replaceChildren();
    appendMessage(
      "assistant",
      "Hello! I’m the GNDU Freshers Guide FAQ assistant. Ask me about admissions, courses, campus facilities, library, canteens, fees, student life, or events in English, Hindi, or Hinglish."
    );
    input.focus();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (submitting || !message) return;

    submitting = true;
    sendButton.disabled = true;
    clearButton.disabled = true;
    appendMessage("user", message);
    input.value = "";
    const thinking = appendMessage("assistant chat-message-thinking", "Thinking…");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "The assistant could not answer right now. Please try again.");
      }
      if (typeof result.answer !== "string" || !result.answer.trim()) {
        throw new Error("The assistant returned an empty answer. Please try again.");
      }

      thinking.remove();
      appendMessage("assistant", result.answer, Array.isArray(result.sources) ? result.sources : []);
      status.textContent = "GNDU FAQ assistant ready";
    } catch (error) {
      thinking.remove();
      const messageText = error.name === "TimeoutError" || error.name === "AbortError"
        ? "The request took too long. Please try again."
        : error instanceof TypeError
          ? "Could not reach the chatbot server. Start the backend and open this site through its local address."
          : error.message || "The assistant could not answer right now. Please try again.";
      appendMessage("error", messageText);
      if (error instanceof TypeError) status.textContent = "Connection error · Chatbot server unavailable";
    } finally {
      clearTimeout(timeoutId);
      submitting = false;
      sendButton.disabled = false;
      clearButton.disabled = false;
      input.focus();
    }
  });

  checkConnection();
})();
