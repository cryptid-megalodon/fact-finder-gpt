function processText(apiKey, text) {
    return new Promise((resolve) => {
      // Use OpenAI API to process the text and identify factual assertions
      // Please replace OPENAI_API_KEY with your own key
      const xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
          resolve(JSON.parse(this.responseText));
        }
      };
      xhttp.open("POST", "https://api.openai.com/v1/chat/completions", true);
      xhttp.setRequestHeader("Content-Type", "application/json");
      xhttp.setRequestHeader("Authorization", `Bearer ${apiKey}`);
      xhttp.send(JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{"role": "user", "content": `Please present a list of sentences from the following article that are asserting facts. A fact is a statement or piece of information that is objectively true, accurate, and can be verified through evidence or reliable sources. Facts are based on empirical data, logical reasoning, or observation, and they remain consistent regardless of individual opinions, beliefs, or interpretations. In essence, a fact is an established reality or truth that is widely accepted and can be proven or demonstrated through various means, such as scientific experiments, historical records, or credible documentation. Put each raw sentence on a new line and do not prefix any bulleted list characters.\n"${text}"`}] ,
        max_tokens: 1000,
        n: 1,
        stop: null,
        temperature: 0.0
      }));
    });
  }

  function highlightFacts(apiKey) {
    const documentClone = document.cloneNode(true);
    const article = new Readability(documentClone).parse();
  
    if (!article || !article.content) {
      return;
    }
  
    const parser = new DOMParser();
    const articleDOM = parser.parseFromString(article.content, "text/html");
    const paragraphs = articleDOM.querySelectorAll("p");
  
    paragraphs.forEach(async (paragraph) => {
      const originalParagraph = document.evaluate(`//p[text()="${paragraph.textContent}"]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (!originalParagraph) {
        return;
      }
  
      const processedText = await processText(apiKey, paragraph.textContent);
  
      const factSentences = processedText.choices[0].message.content.split("\n");
      const regex = new RegExp(`(${factSentences.map((sentence) => sentence.trim()).join("|")})`, "g");
  
      originalParagraph.innerHTML = originalParagraph.textContent.replace(regex, (match) => `<span class="highlight-fact">${match}</span>`);
    });
  }
  
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "highlightFacts") {
      chrome.storage.sync.get(["OPENAI_API_KEY"], (result) => {
        if (result.OPENAI_API_KEY) {
          highlightFacts(result.OPENAI_API_KEY);
        } else {
          alert("Please enter your OpenAI API Key in the extension popup.");
        }
      });
    }
  });