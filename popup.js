const apiKeyForm = document.getElementById("api-key-form");
const apiKeyInput = document.getElementById("api-key-input");
const highlightFactsBtn = document.getElementById("highlight-facts-btn");

function saveAPIKey(e) {
  e.preventDefault();
  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    chrome.storage.sync.set({ OPENAI_API_KEY: apiKey }, () => {
      alert("API Key saved.");
    });
  } else {
    alert("Please enter a valid API Key.");
  }
}

function loadAPIKey() {
  chrome.storage.sync.get(["OPENAI_API_KEY"], (result) => {
    if (result.OPENAI_API_KEY) {
      apiKeyInput.value = result.OPENAI_API_KEY;
    }
  });
}

function highlightFacts() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "highlightFacts" });
  });
}

apiKeyForm.addEventListener("submit", saveAPIKey);
highlightFactsBtn.addEventListener("click", highlightFacts);
document.addEventListener("DOMContentLoaded", loadAPIKey);
