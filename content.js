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
        messages: [{"role": "user", "content":
        `Please identify the sections of the text that assert facts. Please \
        reply with a json object containing a "facts" key with an array value \
        of exact string matches to the original text. The facts must be exact \
        matches of the sentence fragments from the original text. This json \
        will later be used by a chrome extension to mark spans of the original \
        text, so the fact strings must be exact matches of the original text.\
        \n\nText:\n"${text}"`}] ,
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
  
    for (let i = 0; i < paragraphs.length; i += 3) {
      const paragraphGroup = [];
      for (let j = 0; j < 3 && i + j < paragraphs.length; j++) {
        paragraphGroup.push(paragraphs[i + j]);
      }
  
      const originalParagraphs = paragraphGroup.map((paragraph) => {
        return document.evaluate(`//p[text()="${paragraph.textContent}"]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      });
  
      const combinedText = paragraphGroup.map((paragraph) => paragraph.textContent).join("\n\n");
  
      processText(apiKey, combinedText).then((processedText) => {
        const contentJson = JSON.parse(processedText.choices[0].message.content);
        const factSentences = contentJson.facts;
  
        originalParagraphs.forEach((originalParagraph, index) => {
          if (!originalParagraph) {
            return;
          }
  
          const regex = new RegExp(`(${factSentences.map((sentence) => sentence.trim()).join("|")})`, "g");
  
          originalParagraph.innerHTML = originalParagraph.textContent.replace(regex, (match) => `<span class="highlight-fact">${match}</span>`);
        });
      });
    }
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