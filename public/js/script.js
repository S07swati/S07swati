(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()


// Chatbot toggle
const toggleBtn = document.getElementById("chatbot-toggle");
const chatBox = document.getElementById("chatbot-box");

toggleBtn.addEventListener("click", () => {
  chatBox.style.display = chatBox.style.display === "none" ? "block" : "none";
});

function toggleChatbot() {
  chatBox.style.display = "none";
}

// Send message to backend
async function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  console.log("Sending message:", message); // add this

  if (!message) return;

  const chatMessages = document.getElementById("chat-messages");
  chatMessages.innerHTML += `<div><strong>You:</strong> ${message}</div>`;
  input.value = "";

  try {
    const res = await fetch("/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();

    chatMessages.innerHTML += `<div><strong>TripBot:</strong> ${data.reply}</div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (error) {
    chatMessages.innerHTML += `<div><strong>TripBot:</strong> Something went wrong. Please try again later.</div>`;
    console.error("Fetch error:", error);
  }
}