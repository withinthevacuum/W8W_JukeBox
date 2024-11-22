document.addEventListener("DOMContentLoaded", async () => {
    const aboutModal = document.getElementById("about-modal");
    const closeAboutModal = document.getElementById("about-modal-close"); // Correct ID
    const questionMarkButton = document.createElement("button");

    // Create the question mark button
    questionMarkButton.className = "question-mark-button";
    questionMarkButton.innerText = "🎶 ? 🎶";
    document.body.appendChild(questionMarkButton);

    // Show modal on question mark click
    questionMarkButton.addEventListener("click", () => {
        aboutModal.classList.remove("hidden");
    });

    // Close modal on close button click
    closeAboutModal.addEventListener("click", () => {
        aboutModal.classList.add("hidden");
    });

    // Close modal on outside click
    window.addEventListener("click", (event) => {
        if (event.target === aboutModal) {
            aboutModal.classList.add("hidden");
        }
    });

    // Initialize the application
    try {
        const response = await fetch("./abi.json"); // Ensure correct path
        if (!response.ok) throw new Error("Failed to fetch ABI.");
        const contractABI = await response.json();

        const jukeboxContract = await initializeContract(contractAddress, contractABI);

        document.getElementById("connect-wallet").addEventListener("click", async () => {
            try {
                await connectWallet(contractAddress);
                displayContractAddress(contractAddress);
                setupUI(jukeboxContract);
            } catch (error) {
                console.error("Error during wallet connection:", error.message || error);
                alert("Failed to connect wallet. Please try again.");
            }
        });
    } catch (error) {
        console.error("Initialization error:", error.message || error);
        alert("Failed to initialize the application. Please refresh the page.");
    }
});