import { icons, loadIcons } from "./icons.js";
import { showLoader, hideLoader } from "./utils.js";

export const showTrackAndTokenSelectionModal = async (trackList, paymentTokens) => {
    return new Promise(async (resolve, reject) => {
        showLoader(); // Show loader while processing
        const modal = document.getElementById("track-token-selection-modal");
        const overlay = document.getElementById("modal-overlay");
        const trackListContainer = document.getElementById("track-list");
        const tokenListContainer = document.getElementById("track-token-list");
        const confirmButton = document.getElementById("confirm-selection-track");
        const cancelButton = document.getElementById("cancel-selection-track");

        // Clear existing content
        trackListContainer.innerHTML = "";
        tokenListContainer.innerHTML = "";

        // Filter out album play price if applicable
        const filteredTrackList = trackList.filter(
            (track) => !track.toLowerCase().includes("album play price")
        );

        // Populate the track list
        filteredTrackList.forEach((track, index) => {
            const trackItem = document.createElement("div");
            trackItem.className = "track-item";
            trackItem.dataset.trackNumber = index;
            trackItem.innerText = `${track}`;
            trackItem.addEventListener("click", () => {
                document.querySelectorAll(".track-item").forEach((item) => item.classList.remove("selected"));
                trackItem.classList.add("selected");
            });
            trackListContainer.appendChild(trackItem);
        });

        // Load and populate token icons
        const fetchedIcons = await Promise.all(
            Object.entries(icons).map(async ([token, url]) => {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch icon for ${token}: ${response.statusText}`);
                    }
                    return { token, url };
                } catch (error) {
                    console.error(`Error fetching icon for ${token}:`, error);
                    return { token, url: "" }; // Return an empty string if fetching fails
                }
            })
        );
        fetchedIcons.forEach(({ token, url }) => {
            // Restrict payments to SHT token while testing
            const shtToken = "0x81ccef6414d4cdbed9fd6ea98c2d00105800cd78"; // Ensure lowercase
            if (token.toLowerCase() !== shtToken) {
                return; // Skip other tokens
            }
        
            // Create HTML for the SHT token
            const tokenItem = document.createElement("div");
            tokenItem.className = "token-item";
            tokenItem.dataset.tokenAddress = token;
            tokenItem.innerHTML = `
                <img src="${url}" alt="${token}" style="width: 30px; height: 30px; margin-right: 10px;">
                <span>${token}</span>
            `;
            tokenItem.addEventListener("click", () => {
                document.querySelectorAll(".token-item").forEach((item) => item.classList.remove("selected"));
                tokenItem.classList.add("selected");
            });
            tokenListContainer.appendChild(tokenItem);
        });
        hideLoader(); // Show loader while processing
        // Show the modal and overlay
        modal.classList.remove("hidden");
        overlay.classList.add("active");

        // Handle confirm button
        confirmButton.addEventListener("click", () => {
            const selectedTrack = document.querySelector(".track-item.selected");
            const selectedToken = document.querySelector(".token-item.selected");
            if (!selectedTrack || !selectedToken) {
                alert("Please select both a track and a token.");
                return;
            }
            modal.classList.add("hidden");
            overlay.classList.remove("active");
            resolve({
                trackNumber: parseInt(selectedTrack.dataset.trackNumber, 10),
                token: selectedToken.dataset.tokenAddress,
            });
        });

        // Handle cancel button
        cancelButton.addEventListener("click", () => {
            modal.classList.add("hidden");
            overlay.classList.remove("active");
            reject("Selection canceled");
        });

        // Handle outside click
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                modal.classList.add("hidden");
                overlay.classList.remove("active");
                reject("Selection canceled");
            }
        });
    });
};


export const ShowTokenSelectionModal = async (paymentTokens) => {
    return new Promise(async (resolve, reject) => {
        const modal = document.getElementById("token-selection-modal");
        const overlay = document.getElementById("modal-overlay");
        const tokenListContainer = document.getElementById("album-token-list");
        const confirmButton = document.getElementById("confirm-selection-album");
        const cancelButton = document.getElementById("cancel-selection-album");

        console.log("Initializing token selection modal...");

        // Clear existing content
        tokenListContainer.innerHTML = "";

        console.log("Payment tokens provided:", paymentTokens);

        // Load and populate token icons
        const fetchedIcons = await Promise.all(
            Object.entries(icons).map(async ([token, url]) => {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch icon for ${token}: ${response.statusText}`);
                    }
                    return { token, url };
                } catch (error) {
                    console.error(`Error fetching icon for ${token}:`, error);
                    return { token, url: "" }; // Return an empty string if fetching fails
                }
            })
        );

        console.log("Fetched Icons:", fetchedIcons);

        fetchedIcons.forEach(({ token, url }) => {
            console.log("Processing token:", token, "with URL:", url);
            // Restrict payments to SHT token while testing
            const shtToken = "0x81ccef6414d4cdbed9fd6ea98c2d00105800cd78"; // Ensure lowercase
            if (token.toLowerCase() !== shtToken) {
                return; // Skip other tokens
            }

            const tokenItem = document.createElement("div");
            tokenItem.className = "token-item";
            tokenItem.dataset.tokenAddress = token;
            tokenItem.innerHTML = `
                <img src="${url}" alt="${token}" style="width: 30px; height: 30px; margin-right: 10px;">
                <span>${token}</span>
            `;
            document.body.appendChild(tokenItem); // Append directly to the body for testing
            tokenItem.addEventListener("click", () => {
                document.querySelectorAll(".token-item").forEach((item) => item.classList.remove("selected"));
                tokenItem.classList.add("selected");
            });

            console.log("Appending token-item to token-list-container:", tokenItem);
            tokenListContainer.appendChild(tokenItem);
        });

        console.log("Token list container children after appending:", tokenListContainer.children);

        // Show the modal and overlay
        modal.classList.remove("hidden");
        modal.classList.add("visible");
        overlay.classList.add("active");
        tokenListContainer.classList.add("visible");
        tokenListContainer.classList.remove("hidden");

        console.log("Token list container is now visible:", tokenListContainer.className);

        // Confirm selection
        confirmButton.addEventListener("click", () => {
            const selectedToken = document.querySelector(".token-item.selected");
            if (!selectedToken) {
                alert("Please select a token.");
                return;
            }
            modal.classList.add("hidden");
            modal.classList.remove("visible");
            overlay.classList.remove("active");
            resolve({
                token: selectedToken.dataset.tokenAddress,
            });
        });

        // Cancel selection
        cancelButton.addEventListener("click", () => {
            modal.classList.add("hidden");
            modal.classList.remove("visible");
            overlay.classList.remove("active");
            reject("Selection canceled");
        });

        // Handle outside click
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                modal.classList.add("hidden");
                modal.classList.remove("visible");
                overlay.classList.remove("active");
                reject("Selection canceled");
            }
        });
    });
};