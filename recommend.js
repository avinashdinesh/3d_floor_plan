document.addEventListener("DOMContentLoaded", function () {
    const suggestButton = document.getElementById("suggestButton");
    const budgetInput = document.getElementById("budgetInput");
    const resultContainer = document.getElementById("recommendation-results");

    suggestButton.addEventListener("click", async function () {
        const budget = parseFloat(budgetInput.value);
        
        if (!budget || budget <= 0) {
            alert("Please enter a valid budget.");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:5001/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ budget })
            });

            const data = await response.json();
            resultContainer.innerHTML = ""; // Clear previous results

            if (response.status !== 200) {
                resultContainer.innerText = "Error: " + data.error;
                return;
            }

            // Create a list to display recommended items
            const list = document.createElement("ul");
            list.style.listStyleType = "none";
            list.style.padding = "0";

            data.recommendations.forEach(item => {
                const listItem = document.createElement("li");
                listItem.style.display = "flex";
                listItem.style.alignItems = "center";
                listItem.style.marginBottom = "10px";
                listItem.style.backgroundColor = "#f0f0f0";
                listItem.style.padding = "10px";
                listItem.style.borderRadius = "8px";
                listItem.style.cursor = "move";
                listItem.draggable = true;
                listItem.setAttribute('data-type', item);

                listItem.addEventListener('dragstart', (event) => {
                    event.dataTransfer.setData('text/plain', item);
                    console.log("Dragging:", item);
                });

                // Create icon
                const icon = document.createElement("img");
                icon.src = `icons/${item}.png`;
                icon.alt = item;
                icon.style.width = "40px";
                icon.style.height = "40px";
                icon.style.marginRight = "10px";
                icon.draggable = false;

                // Create text
                const text = document.createElement("span");
                text.innerText = item;
                text.style.fontSize = "18px";
                text.style.userSelect = "none";

                listItem.appendChild(icon);
                listItem.appendChild(text);
                list.appendChild(listItem);
            });

            resultContainer.appendChild(list);

            // Add helper message
            const helperMsg = document.createElement("p");
            helperMsg.textContent = "Drag recommended items to place them on your floor plan.";
            helperMsg.style.fontSize = "14px";
            helperMsg.style.fontStyle = "italic";
            helperMsg.style.marginTop = "10px";
            resultContainer.appendChild(helperMsg);

        } catch (error) {
            resultContainer.innerText = "Server error. Ensure the recommendation server is running.";
            console.error(error);
        }
    });
});