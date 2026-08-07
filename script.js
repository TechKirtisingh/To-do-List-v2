const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");

function addTask() {
    if (inputBox.value === '') {
        alert("You must write something!");
    } else {
        let li = document.createElement("li");
        li.innerHTML = inputBox.value;
        listContainer.appendChild(li);  // li should be displayed in the listContainer
        let span = document.createElement("span"); //used to create a span element for the delete button
        span.innerHTML = "\u00d7"; // cross icon
        li.appendChild(span); // Append the span to the li element
    
        // ==============================
        // NEW CODE STARTS HERE
        // Create Ask AI Button
        // ==============================

        let aiBtn = document.createElement("button");

        aiBtn.innerHTML = "Ask AI";

        aiBtn.style.marginLeft = "10px";

        aiBtn.style.padding = "5px 10px";

        aiBtn.style.fontSize = "12px";

        li.appendChild(aiBtn);

        // When button is clicked

        aiBtn.addEventListener("click", function () {

            askAI(li.firstChild.textContent);

        });

        // ==============================
        // NEW CODE ENDS HERE
        // ==============================

    }

    inputBox.value = "";

    saveData();
}

listContainer.addEventListener("click", function(e) {
    if (e.target.tagName === "LI") {
        e.target.classList.toggle("checked"); // toggle is used to add or remove the "checked" list item
        saveData()
    }
    else if (e.target.tagName === "SPAN") {
        e.target.parentElement.remove();
        saveData();
    }
},false);

function saveData() {
    localStorage.setItem("data", listContainer.innerHTML);
}

function showTask() {
    listContainer.innerHTML = localStorage.getItem("data"); // cookie (local storage) is used to store the data in the local storage of the browser
}
showTask();


//==========================
// AI Function Starts Here
//==========================

async function askAI(task) {

    try {

        const response = await fetch("http://localhost:3000/ask-ai", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                task: task

            })

        });

        const data = await response.json();

        alert(data.answer);

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// AI Assistant
// =======================

const aiInput = document.getElementById("ai-input");

const aiBtn = document.getElementById("ai-btn");

const aiResponse = document.getElementById("ai-response");

aiBtn.addEventListener("click", askQuestion);

async function askQuestion(){

    const question = aiInput.value;

    if(question===""){

        alert("Ask something!");

        return;

    }

    aiResponse.innerHTML="Thinking...";

    try{

        const response = await fetch("http://localhost:3000/ask-chat",{

            method:"POST",

            headers:{

                "Content-Type":"application/json"

            },

// convert javascript object to JASON

            body:JSON.stringify({

                question:question

            })

        });

        const data=await response.json();

        aiResponse.innerHTML=data.answer;

    }

    catch(err){

        aiResponse.innerHTML="Error";

    }

}