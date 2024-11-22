import { displayContractAddress, initializeContract } from "./contract.js";
import { connectWallet } from "./wallet.js";
import { setupUI } from "./ui.js";

const contractAddress = "0x180Cf8CB681a083A73c997809FF60Df857010bF9";

document.addEventListener("DOMContentLoaded", async () => {
    
    const aboutModal = document.getElementById("about-modal");
    const closeAboutModal = document.getElementById("about-modal-close");
    const questionMarkButton = document.createElement("button");
    const connectWalletButton = document.getElementById("connect-wallet")
    const jukeboxHomeLink = document.getElementById("jukebox-home-link");

    // Create the question mark button
    questionMarkButton.className = "question-mark-button";
    questionMarkButton.innerText = "?";
    document.body.appendChild(questionMarkButton);

    
    // Show modal on question mark click
    questionMarkButton.addEventListener("click", () => {
        if (aboutModal.classList.contains("hidden")) {
            aboutModal.classList.remove("hidden"); // Show modal
            connectWalletButton.classList.add("hidden"); // Hide connect wallet button
        } else {
            aboutModal.classList.add("hidden"); // Hide modal
            connectWalletButton.classList.remove("hidden"); // Show connect wallet button
        }
    });

    // Close modal on close button click
    closeAboutModal.addEventListener("click", () => {
        aboutModal.classList.add("hidden");
        // show connect wallet button when about modal is closed
        connectWalletButton.classList.remove("hidden");
    });

    // Close modal on outside click
    window.addEventListener("click", (event) => {
        if (event.target === aboutModal) {
            aboutModal.classList.add("hidden");
            connectWalletButton.classList.remove("hidden");
        }
    });

    // Add event listener to the Back to Jukebox button
    jukeboxHomeLink.addEventListener("click", () => {
        aboutModal.classList.add("hidden"); // Hide the about modal
        connectWalletButton.classList.remove("hidden"); // Unhide the connect wallet button
    });

    try {
        // Fetch the ABI
        const response = await fetch("./abi.json"); // Ensure correct path
        if (!response.ok) throw new Error("Failed to fetch ABI.");
        const contractABI = await response.json();

        // Initialize the contract
        const jukeboxContract = await initializeContract(contractAddress, contractABI);

        // Handle wallet connection
        document.getElementById("connect-wallet").addEventListener("click", async () => {
            try {
                await connectWallet(contractAddress);
                displayContractAddress(contractAddress); // Show the contract address
                setupUI(jukeboxContract); // Set up the interface
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
