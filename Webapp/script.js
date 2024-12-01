

// Store datasets
let datasets = {};

// Parse CSV file into JSON format
const parseCSVFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      Papa.parse(reader.result, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error),
      });
    };
    reader.readAsText(file);
  });
};

// Function to clean dataset rows
const cleanDataset = (data) => {
  return data.map(row => {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, value ? value.replace(/[^\w\s.,'-]/g, '') : ''])
    );
  });
};

// Toggle visibility based on selected model
document.querySelectorAll('input[name="model"]').forEach((radio) => {
  radio.addEventListener("change", (event) => {
    const selectedModel = event.target.value;
    document.querySelector(".prompt-section").style.display =
      selectedModel === "prompt" ? "block" : "none";
    document.querySelector(".dataset-selection").style.display =
      selectedModel === "prompt" ? "block" : "none";
    document.querySelector(".summarization-section").style.display =
      selectedModel === "summarization" ? "block" : "none";
      document.querySelector(".write-section").style.display =
      selectedModel === "write" ? "block" : "none";
      document.querySelector(".rewrite-section").style.display =
      selectedModel === "rewrite" ? "block" : "none";
      
  });
});

// Load datasets and dynamically create checkboxes
document.getElementById("all-datasets").addEventListener("change", async (event) => {
  const files = event.target.files;

  datasets = {};
  const checkboxesContainer = document.getElementById("dataset-checkboxes");
  checkboxesContainer.innerHTML = "";

  for (const file of files) {
    try {
      const data = await parseCSVFile(file);
      datasets[file.name] = data;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = file.name;
      checkbox.value = file.name;
      checkbox.checked = true;

      const label = document.createElement("label");
      label.htmlFor = file.name;
      label.textContent = file.name;

      checkboxesContainer.appendChild(checkbox);
      checkboxesContainer.appendChild(label);
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error);
    }
  }

  document.getElementById("generate-ai-prompt").disabled = Object.keys(datasets).length === 0;
});

// Summarization model logic
const handleSummarizationModel = async () => {
    
    const textToSummarize = document.getElementById("summarization-input").value;
    const selectedDatasets = Array.from(
      document.querySelectorAll("#dataset-checkboxes input:checked")
    ).map((checkbox) => checkbox.value);

    if (!textToSummarize) {
      alert("Please enter a prompt.");
      return;
    }

    if (selectedDatasets.length === 0) {
      alert("Please select at least one dataset.");
      return;
    }

    let datasetContent = selectedDatasets
      .map((name) => {
        const data = datasets[name];
        const cleanedData = cleanDataset(data);
        if (cleanedData && cleanedData.length > 0) {
          const sampleRows = cleanedData
            .slice(0, 5)
            .map((row, index) => `Row ${index + 1}: ${JSON.stringify(row)}`)
            .join("\n");
          return `Sample Data:\n${sampleRows}`;
        } else {
          return `Dataset: ${name}\nNo data available.`;
        }
      })
      .join("\n\n");
 fullsumm = `
      ${textToSummarize}
      for the below data
      "
      ${datasetContent}
      "
    `;
    console.log("Generated Prompt with Data:", fullsumm);


  if (!textToSummarize.trim()) {
    alert("Please enter text to summarize.");
    return;
  }

  try {
    const summarizer = await ai.summarizer.create();
    const summary = await summarizer.summarize(fullsumm);
    summarizer.destroy();

    document.getElementById("ai-response").innerHTML = `<pre>${summary}</pre>`;
    console.log("Summary:", summary);
  } catch (error) {
    console.error("Error summarizing text:", error);
    alert("An error occurred while summarizing the text.");
  }
};

// Generate AI response based on selected model
document.getElementById("generate-ai-prompt").addEventListener("click", async () => {
  const selectedModel = document.querySelector('input[name="model"]:checked').value;

  if (selectedModel === "prompt") {
    // Existing prompt-based logic
    const userPrompt = document.getElementById("user-prompt").value;
    const selectedDatasets = Array.from(
      document.querySelectorAll("#dataset-checkboxes input:checked")
    ).map((checkbox) => checkbox.value);

    if (!userPrompt) {
      alert("Please enter a prompt.");
      return;
    }

    if (selectedDatasets.length === 0) {
      alert("Please select at least one dataset.");
      return;
    }

    let datasetContent = selectedDatasets
      .map((name) => {
        const data = datasets[name];
        const cleanedData = cleanDataset(data);
        if (cleanedData && cleanedData.length > 0) {
          const sampleRows = cleanedData
            .slice(0, 2)
            .map((row, index) => ` ${JSON.stringify(row)}`)
            .join("\n");
          return `Sample Data:\n${sampleRows}`;
        } else {
          return `Dataset: ${name}\nNo data available.`;
        }
      })
      .join("\n\n");

    const fullPrompt = `
      ${userPrompt}

     generate only from the given below Sample data"
      ${datasetContent}"
    `;

    console.log("Generated Prompt with Data:", fullPrompt);

    const { available } = await ai.languageModel.capabilities();
    if (available === "no") {
      alert("AI model is not available.");
      return;
    }

    try {
      const session = await ai.languageModel.create();
      const result = await session.prompt(fullPrompt);

      document.getElementById("ai-response").innerHTML = `<pre>${result}</pre>`;
      console.log("AI Response:", result);
    } catch (error) {
      console.error("Error prompting AI:", error);
      alert("An error occurred while communicating with the AI model.");
    }
  } else if (selectedModel === "summarization") {
    handleSummarizationModel();
  }
  else if (selectedModel === "write") {
    handleWriteModel();
  }
  else if (selectedModel === "rewrite") {
    handlereWriteModel();
  }

});

const handleWriteModel = async () => {
  
  const taskContext = document.getElementById("task-context").value.trim();
  const userContent = document.getElementById("user-content").value.trim();
 
  const selectedDatasets = Array.from(
    document.querySelectorAll("#dataset-checkboxes input:checked")
  ).map((checkbox) => checkbox.value);

  if (!taskContext || !userContent) {
    alert("Please enter a prompt.");
    return;
  }

  if (selectedDatasets.length === 0) {
    alert("Please select at least one dataset.");
    return;
  }

  let datasetContent = selectedDatasets
    .map((name) => {
      const data = datasets[name];
      const cleanedData = cleanDataset(data);
      if (cleanedData && cleanedData.length > 0) {
        const sampleRows = cleanedData
          .slice(0, 1)
          .map((row) => `${JSON.stringify(row)}`)
          .join("\n");
        return `Data:${sampleRows}`;
      } else {
        return `Dataset: ${name}\nNo data available.`;
      }
    })
    .join("\n\n");
    sharedContext = `"
    ${datasetContent}"
  `;
  console.log("Generated Prompt with Data:", sharedContext);


  if (!sharedContext || !taskContext || !userContent) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    // Initialize the AI writer with shared context
    const writer = await ai.writer.create({
      sharedContext: sharedContext,
    });

    // Stream generated content using task-specific context
    const stream = await writer.writeStreaming("based on the given data alone"+userContent, { context: taskContext });
    const outputElement = document.getElementById("ai-response");

    
    outputElement.textContent = '';
    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse = chunk.trim();
      outputElement.innerHTML = DOMPurify.sanitize(
        fullResponse /*marked.parse(fullResponse)*/
);
    }
console.log(fullResponse)
    // Destroy the writer to release resources
    writer.destroy();
  } catch (error) {
    console.error("Error generating content:", error);
    alert("An error occurred while generating content. Please check the console for details.");
  }  
};



const handlereWriteModel = async () => {
  const taskContext = document.getElementById("task-rewrite").value.trim();
  const aiResponseContent = document.getElementById("ai-response").textContent.trim();

  if (!taskContext) {
    alert("Please enter a rewrite context.");
    return;
  }

  if (!aiResponseContent) {
    alert("No content available to rewrite.");
    return;
  }

  // Combine ai-response content with dataset content or other shared context
  const sharedContext = `
    Initial Content:
    ${aiResponseContent}

    Task Context:
    ${taskContext}
  `;

  console.log("Generated Shared Context:", sharedContext);

  try {
    // Initialize the AI rewriter with the shared context
    const rewriter = await ai.rewriter.create({
      sharedContext: sharedContext,
    });

    // Stream rewritten content using the task context
    const stream = rewriter.rewriteStreaming(aiResponseContent, {
      context: taskContext
    });
    const outputElement = document.getElementById("ai-response");
    outputElement.textContent = "Rewriting content..."; // Show temporary status

    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse = chunk.trim();
      outputElement.innerHTML = DOMPurify.sanitize(
        fullResponse /*marked.parse(fullResponse)*/
);
    }

    console.log("Final Rewritten Content:", fullResponse);

    // Destroy the rewriter to release resources
    rewriter.destroy();
  } catch (error) {
    console.error("Error generating content:", error);
    alert("An error occurred while rewriting content. Please check the console for details.");
  }
};

// Attach the event listener to the rewrite button

