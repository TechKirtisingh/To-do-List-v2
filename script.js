// CHANGED (Where: API_BASE_URL): Fixed URL detection for local file protocol, localhost, and Netlify deployments.
// WHY: When opening index.html directly from file manager (file:// protocol) or running locally, hostname is empty or localhost, so it connects to http://localhost:3000. When deployed on Netlify, it uses /.netlify/functions.
const isLocalEnv = window.location.protocol === "file:" ||
                   window.location.hostname === "localhost" ||
                   window.location.hostname === "127.0.0.1" ||
                   window.location.hostname === "";

const API_BASE_URL = isLocalEnv ? "http://localhost:3000" : "/.netlify/functions";

const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");

async function addTask() {

    const text = inputBox.value.trim();

    if (text === "") {
        alert("Write something!");
        return;
    }

    const textLower = text.toLowerCase();

    if (
        textLower.includes("become") ||
        textLower.includes("study") ||
        textLower.includes("learn") ||
        textLower.includes("roadmap") ||
        textLower.includes("career") ||
        textLower.includes("data science") ||
        textLower.includes("machine learning") ||
        textLower.includes("ai")
    ) {

        await askAI(text);

    }
    else {

        addNormalTask(text);

    }

    inputBox.value = "";

    saveData();
}

// CHANGED (Where: getTaskTitle helper): Safely extracts title string from task parameter.
// WHY: Fixes 'name not shown while i add task'. If task is a string or object, ensures task title text is never undefined or empty.
function getTaskTitle(task) {
    if (typeof task === "string") return task;
    if (task && typeof task === "object") {
        return task.title || task.name || task.task || task.heading || "Untitled Task";
    }
    return String(task || "Untitled Task");
}

// CHANGED (Where: listContainer click listener): Passed target task li element to askAI.
// WHY: Allows askAI to attach newly generated AI flowchart subtasks right below that specific task instead of at the end of the list.
listContainer.addEventListener("click", function(e) {
    if (e.target.classList.contains("delete-btn")) {
        e.target.closest("li").remove();
        saveData();
    }
    else if (e.target.classList.contains("task-ai-btn")) {
        e.stopPropagation();
        const li = e.target.closest("li");
        const titleSpan = li.querySelector(".task-title");
        const taskText = titleSpan ? titleSpan.textContent.trim() : "";
        if (taskText) {
            askAI(taskText, li); // Pass targetLi
        }
    }
    else if (e.target.classList.contains("task-title")) {
        e.target.closest("li").classList.toggle("checked");
        saveData();
    }
    else if (e.target.tagName === "LI") {
        e.target.classList.toggle("checked");
        saveData();
    }
},false);

function saveData() {
    localStorage.setItem("data", listContainer.innerHTML);
}

function showTask() {
    listContainer.innerHTML = localStorage.getItem("data");
}
showTask();

// CHANGED (Where: addNormalTask function): Defined addNormalTask with getTaskTitle safety check.
// WHY: Fixes 'name not shown while i add task'. Ensures task name is properly assigned to titleSpan textContent.
function addNormalTask(text) {
    const taskTitle = text ? text.trim() : "Untitled Task";

    const li = document.createElement("li");
    li.classList.add("level-3"); // Normal level (normal font weight)

    // Task Title Span
    const titleSpan = document.createElement("span");
    titleSpan.className = "task-title";
    titleSpan.textContent = taskTitle;
    li.appendChild(titleSpan);

    // Ask AI Button for this task
    const aiBtn = document.createElement("button");
    aiBtn.className = "task-ai-btn";
    aiBtn.textContent = "Ask AI";
    li.appendChild(aiBtn);

    // Delete Button
    const deleteBtn = document.createElement("span");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "&times;";
    li.appendChild(deleteBtn);

    listContainer.appendChild(li);
}

// CHANGED (Where: createTaskTree function): Updated tree node rendering with getTaskTitle helper.
// WHY: Fixes 'name not shown while i add task'. Safely extracts title string so nodes display their text properly.
function createTaskTree(task, parent, level = 0) {

    const titleText = getTaskTitle(task);

    const li = document.createElement("li");

    li.classList.add("level-" + level);

    const titleSpan = document.createElement("span");
    titleSpan.className = "task-title";
    titleSpan.textContent = titleText;
    li.appendChild(titleSpan);

    // Ask AI Button for task node
    const aiBtn = document.createElement("button");
    aiBtn.className = "task-ai-btn";
    aiBtn.textContent = "Ask AI";
    li.appendChild(aiBtn);

    const deleteBtn = document.createElement("span");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "&times;";
    li.appendChild(deleteBtn);

    parent.appendChild(li);

    if (task && task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0) {

        const ul = document.createElement("ul");

        ul.classList.add("subtask-list");

        li.appendChild(ul);

        task.subtasks.forEach(sub => {

            createTaskTree(sub, ul, level + 1);

        });

    }

}


//==========================
// AI Function Starts Here
//==========================

// CHANGED (Where: askAI function): Added targetLi parameter and child subtask attachment logic.
// WHY: Fulfills 'add that new part generated with ask button right below that task'. If triggered from a task's Ask AI button, attaches the subtask flowchart directly under that target task item.
async function askAI(task, targetLi = null) {

    const taskQuery = typeof task === "string" ? task.trim() : (task?.title || task?.name || "");

    if (!taskQuery) {
        alert("Please enter a valid task for AI!");
        return;
    }

    try {

        const response = await fetch(`${API_BASE_URL}/ask-ai`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                task: taskQuery

            })

        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const msg = errData.answer || errData.error || `Server Error (${response.status})`;
            alert(`AI Error: ${msg}`);
            return;
        }

        const roadmap = await response.json();

        if (targetLi) {
            // Remove existing subtask list under target task if any
            const existingSub = targetLi.querySelector(".subtask-list");
            if (existingSub) existingSub.remove();

            // Append new subtasks directly right below the target task item
            if (roadmap && roadmap.subtasks && Array.isArray(roadmap.subtasks) && roadmap.subtasks.length > 0) {
                const ul = document.createElement("ul");
                ul.classList.add("subtask-list");
                targetLi.appendChild(ul);

                const currentLevelMatch = targetLi.className.match(/level-(\d+)/);
                const currentLevel = currentLevelMatch ? parseInt(currentLevelMatch[1], 10) : 0;

                roadmap.subtasks.forEach(sub => {
                    createTaskTree(sub, ul, currentLevel + 1);
                });
            }
        } else {
            createTaskTree(roadmap, listContainer);
        }

        saveData();

    }

    catch (error) {

        console.log(error);
        alert("Cannot connect to server at http://localhost:3000.\n\nPlease start your backend server by running:\nnode server.js\nin your terminal!");

    }

}

// =======================
// AI Assistant
// =======================

const aiInput = document.getElementById("ai-input");

const aiBtn = document.getElementById("ai-btn");

const aiResponse = document.getElementById("ai-response");

aiBtn.addEventListener("click", askQuestion);

// CHANGED (Where: formatAIResponse helper): Formats markdown headers into HTML styled headings.
// WHY: Fulfills 'add the heading coulur in the ai assistant also'. Displays main headings in Navy Blue (#002765) and subheadings in Deep Purple (#4e085f).
function formatAIResponse(text) {
    if (!text) return "";
    let html = text
        .replace(/^### (.*$)/gim, '<div class="ai-res-subheading">$1</div>')
        .replace(/^## (.*$)/gim, '<div class="ai-res-heading">$1</div>')
        .replace(/^# (.*$)/gim, '<div class="ai-res-heading">$1</div>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return html;
}

async function askQuestion(){

    const question = aiInput.value;

    if(question===""){

        alert("Ask something!");

        return;

    }

    aiResponse.innerHTML="Thinking...";

    try{

        const response = await fetch(`${API_BASE_URL}/ask-chat`,{

            method:"POST",

            headers:{

                "Content-Type":"application/json"

            },

            body:JSON.stringify({

                question:question

            })

        });

        const data=await response.json();

        const answerText = data.answer || data.response || "No response received.";
        aiResponse.innerHTML = formatAIResponse(answerText);

    }

    catch(err){

        aiResponse.innerHTML="Error";

    }

}