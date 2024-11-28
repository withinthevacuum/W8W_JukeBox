export const showLoader = () => {
    console.log("Showing loader...");
    const loader = document.getElementById("loader");
    if (loader) loader.classList.add("visible");
};

export const hideLoader = () => {
    console.log("Hiding loader...");
    const loader = document.getElementById("loader");
    if (loader) loader.classList.remove("visible");
};

export const resetTrackAndTokenSelectionModal = () => {
    const trackModal = document.getElementById("track-token-selection-modal");
    const tokenModal = document.getElementById("token-selection-modal");

    if (trackModal) {
        const trackList = trackModal.querySelector("#track-token-list");
        if (trackList) trackList.innerHTML = ""; // Clear track list
    }

    if (tokenModal) {
        const tokenList = tokenModal.querySelector("#album-token-list");
        if (tokenList) tokenList.innerHTML = ""; // Clear token list
    }

    // Remove any dynamically added classes
    [trackModal, tokenModal].forEach((modal) => {
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