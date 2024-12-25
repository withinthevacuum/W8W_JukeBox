const { ethers } = window;

export const setupEventListener = (contract) => {
    const eventContainer = document.createElement("div");
    eventContainer.id = "event-popup-container";
    document.body.appendChild(eventContainer);

    // Listen for all events emitted by the contract
    contract.on("*", (...args) => {
        const event = args.pop(); // Last argument contains the event metadata
        const eventName = event.event || "UnknownEvent";
        const eventArgs = event.args || {};

        console.log(`Event ${eventName} detected`, eventArgs);

        // Extract relevant fields with fallback for undefined values
        const address1 = eventArgs.player || eventArgs[0] || "Unknown";
        const albumName = eventArgs.albumName || eventArgs[1] || "Unknown Album";
        const trackNumber = eventArgs.trackNumber || eventArgs[2];
        const tokenUsed = eventArgs.tokenUsed || eventArgs[3] || "Unknown";
        const bigNumber2 = eventArgs.amountPaid || eventArgs[4];

        // Format wallet addresses
        const formatAddress = (address) => {
            // if address is 0x81cCeF6414D4CDbed9FD6Ea98c2D00105800cd78, use decent smart home icon, else use default icon
            if (address === "0x81cCeF6414D4CDbed9FD6Ea98c2D00105800cd78") {
                const favicons = Array(4)
                    .fill('<img src="./assets/DecentSmartHome_Logo.png" alt="icon" style="width: 12px; height: 12px;">')
                    .join("");
                return `${address.slice(0, 6)}...${favicons}...${address.slice(-4)}`;
            }else {
                const favicons = Array(4)
                    .fill('<img src="https://bafybeifej4defs5s5wryxylmps42c7xkbzle3fxjgnsbb5hcfnd5b77zwa.ipfs.w3s.link/Ens_Eth_Breathe.gif" alt="icon" style="width: 12px; height: 12px;">')
                    .join("");
                return `${address.slice(0, 6)}...${favicons}...${address.slice(-4)}`;
            }
        };

        // Convert BigNumbers to human-readable format with safe fallback
        const formatBigNumber = (bigNumber) => {
            if (!bigNumber || !bigNumber._hex) return "N/A";
            try {
                return ethers.utils.formatEther(bigNumber._hex);
            } catch (error) {
                console.error("Error formatting BigNumber:", bigNumber, error);
                return "Invalid Number";
            }
        };

        // Create a popup for the event
        const eventPopup = document.createElement("div");
        eventPopup.className = "event-popup";

        eventPopup.innerHTML = `
            <div class="event-header">${eventName}</div>
            <div class="event-content">
                <p><strong>From:</strong> <span class="event-wallet-address"> ${formatAddress(address1)} </span></p>
                <p><strong>Album:</strong> <span class="event-album-name"> ${albumName} </span></p>
                <p><strong>Track Number:</strong> <span class="event-track-number"> ${trackNumber} </span></p>
                <p><strong>Token Used:</strong> <span class="event-token-used"> ${formatAddress(tokenUsed)} </span></p>
                <p><strong>Amount Paid:</strong> <span class="event-tx-price"> ${formatBigNumber(bigNumber2)} </span></p>
            </div>
        `;

        // Append the popup to the container
        eventContainer.appendChild(eventPopup);

        // Remove the popup after 60 seconds
        setTimeout(() => {
            eventPopup.remove();
        }, 60000);
    });
};