import { displayContractAddress, initializeContract, loadAlbums } from "./contract.js";
import { setupAlbumModal, waitForRenderedAlbums } from "./setupUI.js";

export const contractVersions = {
    "v1.1": {
        address: "0x180Cf8CB681a083A73c997809FF60Df857010bF9",
        abiPath: "./assets/jukebox_v1.1_POL_abi.json",
    },
    "v1.2": {
        address: "0xACB7850f5836fD9981c7d01F2Ca64628a661f287",
        abiPath: "./assets/jukebox_v1.2_POL_abi.json",
    },
    "v1.2.1": {
        address: "0x327e6ACA46C2D32ED4F137bC3AfA41CB0513A45D",
        abiPath: "./assets/bobdub_jukebox_v1.2_POL_abi.json",
    },
    "v1.2.2": {
        address: "0x48c33Eb5843a6A84AB01f7d456F4Fd61EB1c3c92",
        abiPath: "./assets/bobdub_jukebox_v1.2.2_POL_abi.json",
    },
    "v1.2.3": {
        address: "0xbD01c10490BA3E99bCf7ab4B06dDa3A80B79AC7C",
        abiPath: "./assets/eclipse_jukebox_v1.2.3_POL_abi.json",
    },
    "v1.2.4": {
        address: "0xB789986181C864d16e89931E6520d8CeC159b152",
        abiPath: "./assets/jukebox_v1.2.4_OPT_abi.json",
    },

};


export const showLoader = () => {
    // console.log("Showing loader...");
    const loader = document.getElementById("loader");
    if (loader) loader.classList.add("visible");
};

export const hideLoader = () => {
    // console.log("Hiding loader...");
    const loader = document.getElementById("loader");
    if (loader) loader.classList.remove("visible");
};

export const resetTrackAndTokenSelectionModal = () => {
    const trackTokenModal = document.getElementById("track-token-selection-modal");
    const albumTokenModal = document.getElementById("token-selection-modal");

    if (trackTokenModal) {
        const trackTokenList = trackTokenModal.querySelector("#track-token-list");
        if (trackTokenList) trackTokenList.innerHTML = ""; // Clear track list
    }

    if (albumTokenModal) {
        const albumTokenList = albumTokenModal.querySelector("#album-token-list");
        if (albumTokenList) albumTokenList.innerHTML = ""; // Clear token list
    }

    // Remove any dynamically added classes
    [trackTokenModal, albumTokenModal].forEach((modal) => {
        if (modal) {
            modal.classList.remove("visible");
            modal.classList.add("hidden");
        }
    });

    // Remove lingering event listeners (if applicable)
    const confirmTrackButton = document.getElementById("confirm-selection-track");
    const cancelTrackButton = document.getElementById("cancel-selection-track");
    const confirmAlbumButton = document.getElementById("confirm-selection-album");
    const cancelAlbumButton = document.getElementById("cancel-selection-album");

    [confirmTrackButton, cancelTrackButton, confirmAlbumButton, cancelAlbumButton].forEach((button) => {
        if (button) {
            const clone = button.cloneNode(true); // Create a fresh clone
            button.parentNode.replaceChild(clone, button); // Replace the button
        }
    });
};

export const switchContractVersion = async (version) => {
    try {
        // Retrieve the selected version's contract details
        const selectedVersion = contractVersions[version];
        if (!selectedVersion) {
            throw new Error(`Contract version ${version} not found.`);
        }

        // Fetch the ABI for the selected version
        const response = await fetch(selectedVersion.abiPath);
        if (!response.ok) {
            throw new Error(`Failed to load ABI for version ${version}`);
        }
        const contractABI = await response.json();

        // Reinitialize the contract with the selected version
        const jukeboxContract = await initializeContract(
            selectedVersion.address,
            contractABI
        );
        window.jukeboxContract = jukeboxContract; // Store the contract globally
        console.log("Contract reinitialized:", selectedVersion.address);

        // Update the contract address in the display
        displayContractAddress(selectedVersion.address, window.chainId); // Pass chainId for additional context if needed

        // Reload the controls and albums
        const controlsView = document.getElementById("controls");
        const landingView = document.getElementById("landing");
        const leftLCD = document.getElementById("lcd-screen-left");

        controlsView.classList.add("hidden");
        landingView.classList.remove("hidden");

        document.getElementById("landing").classList.add("hidden");
        document.getElementById("controls").classList.remove("hidden");

        showLoader(); // Show loader before loading albums

        try {
            console.log("Loading albums...");

            // Load albums
            await loadAlbums(jukeboxContract);
            resetTrackAndTokenSelectionModal(); // Reset modal state when a new album is loaded

            // Wait for albums to render
            const lcdLeft = document.getElementById("lcd-screen-left");
            if (!lcdLeft) {
                throw new Error("Left LCD element not found.");
            }

            // Poll the LCD screen to check if albums are rendered
            await waitForRenderedAlbums(lcdLeft);

            console.log("Albums have been fully rendered.");
        } catch (error) {
            console.error("Error loading or rendering albums:", error);
        } finally {
            hideLoader(); // Always hide the loader
        }

        document.getElementById("controls-overlay").classList.remove("hidden");
        document.getElementById("controls-overlay").classList.add("visible");

        setupAlbumModal(jukeboxContract); // Set up album modal

        console.log(`Switched to contract version ${version}`);
    } catch (error) {
        console.error("Error switching contract version:", error.message || error);
        alert(`Failed to switch to version ${version}: ${error.message}`);
    }
};