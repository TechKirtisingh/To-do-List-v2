const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const aiInput = document.getElementById("ai-input");
const aiBtn = document.getElementById("ai-btn");
const aiResponse = document.getElementById("ai-response");

// Helper to determine the API endpoint URL for local development or Vercel
function getApiUrl(endpoint) {
    const isVercel = window.location.hostname.endsWith("vercel.app");
    const isLocalServer = window.location.port === "3000";
    if (isLocalServer) return endpoint;
    if (isVercel) return `/api${endpoint}`;
    
    // For Live Server (e.g. 127.0.0.1:5500) or other local dev servers:
    const host = window.location.hostname || "localhost";
    return `http://${host}:3000${endpoint}`;
}

// -------------------------------------------------------------
// 1. Task Operations
// -------------------------------------------------------------

function addTask() {
    const text = inputBox.value.trim();
    if (!text) {
        alert("Please enter a task name!");
        return;
    }

    createTaskElement({ title: text }, listContainer, 3);
    inputBox.value = "";
    saveData();
}

// Allow adding task by pressing Enter key
if (inputBox) {
    inputBox.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addTask();
    });
}

// Create and append a task list item element
function createTaskElement(task, parentElement, level = 0) {
    const title = typeof task === "string" ? task : (task.title || "Untitled Task");

    const li = document.createElement("li");
    li.className = `level-${Math.min(level, 3)}`;

    // Task title
    const span = document.createElement("span");
    span.className = "task-title";
    span.textContent = title;
    li.appendChild(span);

    // Ask AI Button for task breakdown
    const aiButton = document.createElement("button");
    aiButton.className = "task-ai-btn";
    aiButton.textContent = "Ask AI";
    li.appendChild(aiButton);

    // Delete Button
    const deleteBtn = document.createElement("span");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "&times;";
    li.appendChild(deleteBtn);

    parentElement.appendChild(li);

    // Render nested subtasks if any
    if (task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
        const ul = document.createElement("ul");
        ul.className = "subtask-list";
        li.appendChild(ul);
        task.subtasks.forEach(sub => {
            createTaskElement(sub, ul, level + 1);
        });
    }
}

// Event Delegation for List Container (Check, Delete, and Ask AI)
listContainer.addEventListener("click", (e) => {
    const target = e.target;

    // Delete Task
    if (target.classList.contains("delete-btn")) {
        target.closest("li").remove();
        saveData();
        return;
    }

    // Ask AI to generate subtask roadmap
    if (target.classList.contains("task-ai-btn")) {
        e.stopPropagation();
        const li = target.closest("li");
        const titleSpan = li.querySelector(".task-title");
        const taskTitle = titleSpan ? titleSpan.textContent.trim() : "";
        if (taskTitle) {
            generateRoadmap(taskTitle, li, target);
        }
        return;
    }

    // Toggle Task Completed (Check/Uncheck)
    const li = target.closest("li");
    if (li && (target.classList.contains("task-title") || target.tagName === "LI")) {
        li.classList.toggle("checked");
        saveData();
    }
});

// -------------------------------------------------------------
// 2. AI Subtask Breakdown Generator
// -------------------------------------------------------------

async function generateRoadmap(taskTitle, liElement, buttonElement) {
    const originalText = buttonElement.textContent;
    buttonElement.textContent = "Generating...";
    buttonElement.disabled = true;

    try {
        const res = await fetch(getApiUrl("/ask-ai"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task: taskTitle })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || errData.answer || `Server error ${res.status}`);
        }

        const data = await res.json();

        // Remove old subtasks if re-generating
        const oldSubList = liElement.querySelector(".subtask-list");
        if (oldSubList) oldSubList.remove();

        if (data.subtasks && Array.isArray(data.subtasks) && data.subtasks.length > 0) {
            const ul = document.createElement("ul");
            ul.className = "subtask-list";
            liElement.appendChild(ul);

            const levelMatch = liElement.className.match(/level-(\d+)/);
            const parentLevel = levelMatch ? parseInt(levelMatch[1], 10) : 0;

            data.subtasks.forEach(sub => {
                createTaskElement(sub, ul, parentLevel + 1);
            });
        }

        saveData();
    } catch (error) {
        console.error("AI Generation Error:", error);
        alert(`AI Generation Error:\n${error.message}\n\n💡 Tip: Make sure backend server is running in terminal:\nnode server.js`);
    } finally {
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
    }
}

// -------------------------------------------------------------
// 3. AI Chat Assistant
// -------------------------------------------------------------

if (aiBtn) {
    aiBtn.addEventListener("click", askAssistant);
}

if (aiInput) {
    aiInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") askAssistant();
    });
}

async function askAssistant() {
    const question = aiInput ? aiInput.value.trim() : "";
    if (!question) {
        alert("Please enter a question!");
        return;
    }

    aiResponse.innerHTML = "<em>🤖 AI is thinking...</em>";

    try {
        const res = await fetch(getApiUrl("/ask-chat"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || errData.answer || `Server error ${res.status}`);
        }

        const data = await res.json();
        const formatted = (data.answer || "No response received.")
            .replace(/^### (.*$)/gim, '<div class="ai-res-subheading">$1</div>')
            .replace(/^## (.*$)/gim, '<div class="ai-res-heading">$1</div>')
            .replace(/^# (.*$)/gim, '<div class="ai-res-heading">$1</div>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        aiResponse.innerHTML = formatted;
    } catch (error) {
        console.error("Chat Error:", error);
        aiResponse.innerHTML = `
            <div style="color: #d9534f; font-weight: 600;">
                ⚠️ Unable to connect to backend server.
                <div style="font-size: 14px; font-weight: normal; margin-top: 6px; color: #555;">
                    ${error.message}<br><br>
                    💡 <strong>Tip:</strong> Start backend server by running: <code>node server.js</code>
                </div>
            </div>
        `;
    }
}

// -------------------------------------------------------------
// 4. LocalStorage Persistence
// -------------------------------------------------------------

function saveData() {
    localStorage.setItem("todo_data", listContainer.innerHTML);
}

function loadData() {
    const saved = localStorage.getItem("todo_data") || localStorage.getItem("data");
    if (saved) {
        listContainer.innerHTML = saved;
    }
}

loadData();