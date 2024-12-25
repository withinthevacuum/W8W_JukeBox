import { displayContractAddress, initializeContract,loadAlbums } from "./scripts/contract.js";
import { connectWallet } from "./scripts/wallet.js";
import { setupUI, setupAlbumModal } from "./scripts/setupUI.js";
import { showLoader, hideLoader, switchContractVersion } from "./scripts/utils.js";
import { tokenWhiteList } from "./scripts/icons.js";
import { updateTokensChart, updateFeesTicker } from "./scripts/modals.js";
import { setupEventListener } from "./scripts/events.js";

// import { setupAaveKissButton } from "./scripts/aave_kiss.js";


document.addEventListener("DOMContentLoaded", async () => {
    const versionSwitcher = document.getElementById("version-switcher");
    const aboutModal = document.getElementById("about-modal");
    const closeAboutModal = document.getElementById("about-modal-close");
    const questionMarkButton = document.createElement("button");
    const connectWalletButton = document.getElementById("connect-wallet");
    const enterControlsButton = document.getElementById("enter-controls");
    const jukeboxHomeLink = document.getElementById("jukebox-home-link");
    const creditsButton = document.getElementById("credits-button");
    const creditsContainer = document.getElementById("credits-container");
    const creditsVideo = document.getElementById("credits-video");
    const creditsAudio = document.getElementById("credits-audio");
    const creditsLinks = document.getElementById("credits-links");
    const rollOutButton = document.getElementById("roll-out-button");

    creditsLinks.classList.remove("visible");
    creditsLinks.classList.add("hidden");
    creditsAudio.pause();

    let currentVersion = "v1.2"; // Default version
    let contractAddress = "0xACB7850f5836fD9981c7d01F2Ca64628a661f287"; // Default address for v1.1
    let jukeboxContract;

    // Check if the session marker exists
    if (!sessionStorage.getItem("isRefreshed")) {
        // First load or hard refresh, clear local storage
        localStorage.clear();
        sessionStorage.setItem("isRefreshed", "true");
    }


    versionSwitcher.addEventListener("change", async (event) => {
        const selectedVersion = event.target.value;

        if (selectedVersion !== currentVersion) {
            const confirmSwitch = confirm(
                `You are about to switch to contract version ${selectedVersion}. This will reload the app. Do you wish to proceed?`
            );

            if (confirmSwitch) {
                currentVersion = selectedVersion;
                console.log("Switching to contract version:", selectedVersion);
                await switchContractVersion(selectedVersion);
            } else {
                versionSwitcher.value = currentVersion; // Reset dropdown to current version
            }
        }
    });

    // Check user state from localStorage
    const isWalletConnected = localStorage.getItem("walletConnected") === "true";
    const hasEnteredJukebox = localStorage.getItem("enteredJukebox") === "true";

    // Direct to controls view if both conditions are true
    if (isWalletConnected && hasEnteredJukebox) {
        document.getElementById("landing").classList.add("hidden");
        document.getElementById("controls").classList.remove("hidden");
        connectWalletButton.classList.add("hidden");
    }else if (isWalletConnected) {
        connectWalletButton.classList.add("hidden");
        connectWalletButton.classList.remove("visible");
        enterControlsButton.classList.add("visible");
        enterControlsButton.classList.remove("hidden");
    }

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

    // Event listener for "Enter Jukebox" button
    enterControlsButton.addEventListener("click", async () => {
        try {
            // Set local storage variabel to indicate user has entered the Jukebox
            localStorage.setItem("enteredJukebox", "true");

            // Transition to Controls View
            document.getElementById("landing").classList.add("hidden");
            document.getElementById("controls").classList.remove("hidden");

            // Show loader while loading albums
            showLoader();

            console.log("Entering Controls View and loading albums...");

            // Ensure the albums are loaded into the left LCD
            jukeboxContract = window.jukeboxContract;// await initializeContract();

            // await loadAlbums(jukeboxContract); // run in setupUI instead

            // Setup album modal functionality
            // await setupAlbumModal(jukeboxContract);

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
        creditsAudio.play();

        setTimeout(() => {
            creditsLinks.classList.add("visible");
            creditsLinks.classList.remove("hidden");
        }, 4800);

        aboutModal.classList.add("hidden");
        questionMarkButton.classList.add("hidden");
        creditsButton.classList.add("hidden");
    });

    // Roll Out button logic
    rollOutButton.addEventListener("click", () => {
        creditsLinks.classList.remove("visible");
        creditsVideo.src = "./assets/Credits_Roll_Out.mp4";
        creditsVideo.play();

        creditsVideo.onended = async () => {
            creditsAudio.pause();
            creditsContainer.classList.remove("visible");
            document.getElementById("landing").classList.remove("hidden");
            document.getElementById("controls").classList.add("hidden");
            creditsContainer.classList.add("hidden");
            creditsContainer.classList.remove("visible");
            creditsLinks.classList.remove("visible");
            creditsLinks.classList.add("hidden");
            questionMarkButton.classList.remove("hidden");
            creditsButton.classList.remove("hidden");
            if (localStorage.getItem("walletConnected") === "true" && localStorage.getItem("hasEnteredJukebox") === "false") {
                enterControlsButton.classList.remove("hidden");
                enterControlsButton.classList.add("visible");
            }else if (localStorage.getItem("walletConnected") === "true" && localStorage.getItem("hasEnteredJukebox") === "true") {
                connectWalletButton.classList.add("hidden");
                connectWalletButton.classList.remove("visible");
                enterControlsButton.classList.add("hidden");
                enterControlsButton.classList.remove("visible");
                document.getElementById("landing").classList.add("hidden");
                document.getElementById("landing").classList.remove("visible");

                document.getElementById("controls").classList.remove("hidden");
                document.getElementById("controls").classList.add("visible");

                try {
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
                

            }

        };
    });

    
    // About modal logic
    questionMarkButton.className = "question-mark-button";
    questionMarkButton.innerText = "?";
    document.body.appendChild(questionMarkButton);

    questionMarkButton.addEventListener("click", async () => {
        aboutModal.classList.toggle("hidden");
        connectWalletButton.classList.toggle("hidden");

        const network = window.chainId === 24734 ? "MintMe" : window.chainId === 137 ? "Polygon" : null;
    
        const tokenAddresses = Object.keys(tokenWhiteList[network]); // Fetch all token addresses from the white list
        console.log("Token addresses:", tokenAddresses);

        await updateFeesTicker(window.jukeboxContract);
        await updateTokensChart(window.jukeboxContract, tokenAddresses);
        // await setupAaveKissButton();

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

    document.getElementById('engagement-rewards-info-button').addEventListener('click', () => {
        document.getElementById('engagement-rewards-modal-overlay').classList.add('active');
    });
    
    document.getElementById('close-engagement-rewards-modal').addEventListener('click', () => {
        document.getElementById('engagement-rewards-modal-overlay').classList.remove('active');
    });


    


    // Initialize contract, connect wallet, and setup UI

    try {
       

        connectWalletButton.addEventListener("click", async () => {
        
            try {
                let {jukeboxContract, contractAddress, chainId} = await connectWallet();
                
                window.jukeboxContract = jukeboxContract;    
                // console.log("Jukebox contract initialized:", contractAddress);   
                // console.log("window.jukeboxContract:", window.jukeboxContract);

                localStorage.setItem("walletConnected", "true");
                connectWalletButton.classList.add("hidden");
                connectWalletButton.classList.remove("visible");
                enterControlsButton.classList.remove("hidden");
                enterControlsButton.classList.add("visible");

                displayContractAddress(contractAddress, chainId);
                setupUI(jukeboxContract);
                // Initialize the event listener
                setupEventListener(jukeboxContract);

            } catch (error) {
                console.error("Error during wallet connection:", error.message || error);
                alert("Failed to connect wallet. Please try again.");
           }

        });



    } catch (error) {
        console.error("Initialization error:", error.message || error);
        alert("Failed to initialize the application. Please make sure you have a metamask wallet and refresh the page.");
    }
});


window.addEventListener("beforeunload", () => {
    // Clear session marker on unload
    sessionStorage.removeItem("isRefreshed");
});