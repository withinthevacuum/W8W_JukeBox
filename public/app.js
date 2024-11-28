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
    const enterControlsButton = document.getElementById("enter-controls");
    const jukeboxHomeLink = document.getElementById("jukebox-home-link");
    const creditsButton = document.getElementById("credits-button");
    const creditsContainer = document.getElementById("credits-container");
    const creditsVideo = document.getElementById("credits-video");
    const creditsLinks = document.getElementById("credits-links");
    const rollOutButton = document.getElementById("roll-out-button");
    creditsLinks.classList.remove("visible");
    creditsLinks.classList.add("hidden");

    // Check if the session marker exists
    if (!sessionStorage.getItem("isRefreshed")) {
        // First load or hard refresh, clear local storage
        localStorage.clear();
        sessionStorage.setItem("isRefreshed", "true");
    }

    // Check user state from localStorage
    const isWalletConnected = localStorage.getItem("walletConnected") === "true";
    const hasEnteredJukebox = localStorage.getItem("enteredJukebox") === "true";

    // Direct to controls view if both conditions are true
    if (isWalletConnected && hasEnteredJukebox) {
        document.getElementById("landing").classList.add("hidden");
        document.getElementById("controls").classList.remove("hidden");
    }

    // Connect Wallet button logic
    connectWalletButton.addEventListener("click", async () => {
        try {
            await connectWallet();
            localStorage.setItem("walletConnected", "true");
            connectWalletButton.classList.add("hidden");
            connectWalletButton.classList.remove("visible");
            enterControlsButton.classList.remove("hidden");
            enterControlsButton.classList.add("visible");
        } catch (error) {
            console.error("Error connecting wallet:", error);
            // alert("Failed to connect wallet. Please try again.");
        }
    });
    document.addEventListener("walletConnected", (event) => {
        const { walletAddress } = event.detail;
        console.log("Wallet connected event received:", walletAddress);
    
        // Perform actions on wallet connection
        // Example: Redirect to controls view if not already there
        const isOnLanding = document.getElementById("landing").classList.contains("visible");
        if (isOnLanding) {
            document.getElementById("landing").classList.add("hidden");
            document.getElementById("controls").classList.remove("hidden");
        }
    });
    // Enter Jukebox button logic

    // Event listener for "Enter Jukebox" button
    enterControlsButton.addEventListener("click", async () => {
        try {
            // Transition to Controls View
            document.getElementById("landing").classList.add("hidden");
            document.getElementById("controls").classList.remove("hidden");

            // Show loader while loading albums
            showLoader();

            console.log("Entering Controls View and loading albums...");

            // Ensure the albums are loaded into the left LCD
            const jukeboxContract = await initializeContract();
            await loadAlbums(jukeboxContract);

            // Setup album modal functionality
            await setupAlbumModal(jukeboxContract);

            // Show Add Album button and left LCD
            document.getElementById("lcd-screen-left").classList.add("visible");
            document.getElementById("add-album").classList.remove("hidden");

        } catch (error) {
            console.error("Error transitioning to Controls View:", error);
            // alert("An error occurred while loading the Controls View.");
        } finally {
            // Hide the loader
            hideLoader();
        }
    });

    // Credits button logic
    creditsButton.addEventListener("click", () => {
        creditsContainer.classList.add("visible");
        creditsContainer.classList.remove("hidden");
        creditsVideo.src = "./assets/Credits_Roll_In.mp4";
        creditsVideo.play();

        setTimeout(() => {
            creditsLinks.classList.add("visible");
            creditsLinks.classList.remove("hidden");
        }, 6000);

        questionMarkButton.classList.add("hidden");
        creditsButton.classList.add("hidden");
    });

    // Roll Out button logic
    rollOutButton.addEventListener("click", () => {
        creditsLinks.classList.remove("visible");
        creditsVideo.src = "./assets/Credits_Roll_Out.mp4";
        creditsVideo.play();

        creditsVideo.onended = () => {
            creditsContainer.classList.remove("visible");
            document.getElementById("landing").classList.remove("hidden");
            document.getElementById("controls").classList.add("hidden");

            creditsLinks.classList.remove("visible");
            creditsLinks.classList.add("hidden");

            localStorage.removeItem("enteredJukebox"); // Ensure fresh start
            // location.reload();
        };
    });

    // About modal logic
    questionMarkButton.className = "question-mark-button";
    questionMarkButton.innerText = "?";
    document.body.appendChild(questionMarkButton);

    questionMarkButton.addEventListener("click", () => {
        aboutModal.classList.toggle("hidden");
        connectWalletButton.classList.toggle("hidden");
    });

    closeAboutModal.addEventListener("click", () => {
        aboutModal.classList.add("hidden");
        connectWalletButton.classList.remove("hidden");
    });

    window.addEventListener("click", (event) => {
        if (event.target === aboutModal) {
            aboutModal.classList.add("hidden");
            connectWalletButton.classList.remove("hidden");
        }
    });

    jukeboxHomeLink.addEventListener("click", () => {
        aboutModal.classList.add("hidden");
        connectWalletButton.classList.remove("hidden");
    });

    // Initialize contract, connect wallet, and setup UI
    try {
        const response = await fetch("./assets/abi.json");
        if (!response.ok) throw new Error("Failed to fetch ABI.");
        const contractABI = await response.json();

        const jukeboxContract = await initializeContract(contractAddress, contractABI);

        connectWalletButton.addEventListener("click", async () => {
            try {
                await connectWallet(contractAddress);
                displayContractAddress();
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


window.addEventListener("beforeunload", () => {
    // Clear session marker on unload
    sessionStorage.removeItem("isRefreshed");
});