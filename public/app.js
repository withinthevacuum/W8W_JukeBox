import { displayContractAddress, initializeContract } from "./scripts/contract.js";
import { connectWallet } from "./scripts/wallet.js";
import { setupUI } from "./scripts/setupUI.js";
import { showLoader, hideLoader } from "./scripts/utils.js";

const contractAddress = "0x180Cf8CB681a083A73c997809FF60Df857010bF9";

document.addEventListener("DOMContentLoaded", async () => {
    const aboutModal = document.getElementById("about-modal");
    const closeAboutModal = document.getElementById("about-modal-close");
    const questionMarkButton = document.createElement("button");
    const connectWalletButton = document.getElementById("connect-wallet");
    const jukeboxHomeLink = document.getElementById("jukebox-home-link");
    const creditsButton = document.getElementById("credits-button");
    const creditsContainer = document.getElementById("credits-container");
    const creditsVideo = document.getElementById("credits-video");
    const creditsLinks = document.getElementById("credits-links");
    const rollOutButton = document.getElementById("roll-out-button");

    creditsButton.addEventListener("click", () => {
        // Show the credits container
        creditsContainer.classList.add("visible");
        creditsVideo.src = "./assets/Credits_Roll_In.mp4";
        creditsVideo.play();
    
        // Delay showing the links by 6 seconds
        setTimeout(() => {
            if (!creditsVideo.paused) { // Ensure the video is still playing
                creditsLinks.classList.add("visible");
                console.log("Credits links are now visible.");
            }
        }, 5000); // 6000 milliseconds = 6 seconds
    
        // Hide the question mark button
        questionMarkButton.classList.add("hidden");
        creditsButton.classList.add("hidden");
    });
    
    // Handle the end of the credits video playback
    creditsVideo.addEventListener("ended", () => {
        console.log("Credits video finished. Waiting for user to click Roll Out.");
        creditsLinks.classList.add("visible"); // Ensure links are visible after video ends
    });

    // Handle Roll Out button click
    rollOutButton.addEventListener("click", () => {
        creditsLinks.classList.remove("visible");
        // Change the video source to the Roll Out animation
        creditsVideo.src = "./assets/Credits_Roll_Out.mp4";

        // Play the Roll Out animation
        creditsVideo.play();

        // Wait for the Roll Out animation to finish
        creditsVideo.onended = () => {
            // Hide the credits container
            creditsContainer.classList.remove("visible");

            // Transition back to the landing page
            const landingPage = document.getElementById("landing");
            landingPage.classList.remove("hidden");

            // Ensure all other views are hidden
            const controlsView = document.getElementById("controls");
            const recordView = document.getElementById("record");
            controlsView.classList.add("hidden");
            recordView.classList.add("hidden");

            // Reset the credits video to the initial state
            creditsVideo.src = "./assets/Credits_Roll_In.mp4";
            questionMarkButton.classList.remove("hidden");
            creditsButton.classList.remove("hidden");

        };
    });
    // Create the question mark button
    questionMarkButton.className = "question-mark-button";
    questionMarkButton.innerText = "?";
    document.body.appendChild(questionMarkButton);

    // Show modal on question mark click
    questionMarkButton.addEventListener("click", () => {
        aboutModal.classList.toggle("hidden");
        connectWalletButton.classList.toggle("hidden");
    });

    // Close modal on close button click
    closeAboutModal.addEventListener("click", () => {
        aboutModal.classList.add("hidden");
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
        aboutModal.classList.add("hidden");
        connectWalletButton.classList.remove("hidden");
    });

    try {
        // Fetch the ABI
        const response = await fetch("./assets/abi.json"); // Adjusted path to align with file structure
        if (!response.ok) throw new Error("Failed to fetch ABI.");
        const contractABI = await response.json();

        // Initialize the contract
        const jukeboxContract = await initializeContract(contractAddress, contractABI);

        // Handle wallet connection
        connectWalletButton.addEventListener("click", async () => {
            try {
                await connectWallet(contractAddress);
                displayContractAddress(); // Show the contract address
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