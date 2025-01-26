import { tokenWhiteList, paymentTokensDict, loadIcons } from "./icons.js";
import { showLoader, hideLoader, resetTrackAndTokenSelectionModal } from "./utils.js";


export const showTrackAndTokenSelectionModal = async (trackList, paymentTokens) => {
    return new Promise(async (resolve, reject) => {
        resetTrackAndTokenSelectionModal(); // Reset modal state
        showLoader(); // Show loader while processing
        const modal = document.getElementById("track-token-selection-modal");
        const overlay = document.getElementById("modal-overlay");
        const trackListContainer = document.getElementById("track-list");
        const tokenListContainer = document.getElementById("track-token-list");
        const confirmButton = document.getElementById("confirm-selection-track");
        const cancelButton = document.getElementById("cancel-selection-track");
        const selectedPaymentTokens = {};
        const networkTokens = window.chainId === 24734 ? tokenWhiteList.MintMe : tokenWhiteList.Polygon;

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
            Object.entries(paymentTokens).map(async ([token, url]) => {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch icon for ${token}: ${response.statusText}`);
                    }
                    return { token, url };
                } catch (error) {
                    console.error(`Error fetching icon for ${token}:`, error);
                    return { token, url: "" }; // Fallback for failed fetch
                }
            })
        );

        fetchedIcons.forEach(({ token, url }) => {
            // Check if the token is already in the list
            const existingToken = tokenListContainer.querySelector(`[data-token-address="${token}"]`);
            if (existingToken) {
                console.log(`Token ${token} is already in the list, skipping.`);
                return; // Skip if the token already exists
            }
            

            // Create token item
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

        hideLoader();

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
            //  clear fetched icons
            fetchedIcons = [];
            resetTrackAndTokenSelectionModal();
        });

        // Handle cancel button
        cancelButton.addEventListener("click", () => {
            modal.classList.add("hidden");
            overlay.classList.remove("active");
            fetchedIcons = [];
            resetTrackAndTokenSelectionModal();
            reject("Selection canceled");
        });

        // Handle outside click
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                modal.classList.add("hidden");
                overlay.classList.remove("active");
                fetchedIcons = [];
                resetTrackAndTokenSelectionModal();
                reject("Selection canceled");
            }
        });
    });
};


export const ShowTokenSelectionModal = async (paymentTokens) => {
    return new Promise(async (resolve, reject) => {
        resetTrackAndTokenSelectionModal(); // Reset modal state
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
            Object.entries(paymentTokens).map(async ([token, url]) => {
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
            // Check if the token is already in the list
            const existingToken = tokenListContainer.querySelector(`[data-token-address="${token}"]`);
            if (existingToken) {
                console.log(`Token ${token} is already in the list, skipping.`);
                return; // Skip if the token already exists
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
            resetTrackAndTokenSelectionModal();
        });

        // Cancel selection
        cancelButton.addEventListener("click", () => {
            modal.classList.add("hidden");
            modal.classList.remove("visible");
            overlay.classList.remove("active");
            resetTrackAndTokenSelectionModal(); 
            reject("Selection canceled");
        });

        // Handle outside click
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                modal.classList.add("hidden");
                modal.classList.remove("visible");
                overlay.classList.remove("active");
                resetTrackAndTokenSelectionModal();
                reject("Selection canceled");
            }
        });
    });
};


export const updateTokensChart = async (jukeboxContract, tokenAddresses) => {
    const tableBody = document.getElementById("tokens-table")?.querySelector("tbody");
    if (!tableBody) {
        console.error("Tokens table body not found.");
        return;
    }
    tableBody.innerHTML = ""; // Clear existing rows

    try {
        console.log("Updating tokens chart with addresses:", tokenAddresses);

        const networkTokens = 
        window.chainId === 24734 
            ? tokenWhiteList.MintMe 
            : window.chainId === 10 
                ? tokenWhiteList.Optimism 
                : tokenWhiteList.Polygon;
        // Normalize the whitelist for easier lookups
        const normalizedNetworkTokens = Object.keys(networkTokens).reduce((acc, key) => {
            acc[key.toLowerCase()] = networkTokens[key];
            return acc;
        }, {});

        for (const token of tokenAddresses) {
            const normalizedToken = token.toLowerCase();
            const tokenInfo = normalizedNetworkTokens[normalizedToken];

            if (!tokenInfo) {
                console.warn(`Token ${token} is not found in the whitelist. Skipping.`);
                continue;
            }

            console.log("Processing token:", token);

            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const tokenContract = new ethers.Contract(token, window.erc20ABI, signer);

                const balance = await tokenContract.balanceOf(jukeboxContract.address);
                if (balance.isZero()) {
                    console.log(`Skipping token ${token} with balance 0.`);
                    continue;
                }

                const decimals = await tokenContract.decimals();
                const formattedBalance = ethers.utils.formatUnits(balance, decimals);

                // Use the token info from the whitelist
                const { name: tokenName, symbol: tokenSymbol, icon: tokenIcon } = tokenInfo;

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td class="token-details">
                        <img class="token-icon" src="${tokenIcon}" alt="${tokenSymbol}">
                        <span class="token-name">${tokenName}</span>
                        <span class="token-symbol">(${tokenSymbol})</span>
                    </td>
                    <td class="token-balance">${formattedBalance}</td>
                    <td class="actions">
                        <button class="collect-fees-btn" data-token="${token}" data-amount="${balance}">
                            Collect Fees
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            } catch (error) {
                console.error(`Error fetching details for token ${token}:`, error);
            }
        }

        // Add event listeners to the "Collect Fees" buttons
        document.querySelectorAll(".collect-fees-btn").forEach((button) => {
            button.addEventListener("click", async () => {
                const tokenAddress = button.dataset.token;
                const amount = button.dataset.amount;

                if (!tokenAddress || !amount) {
                    alert("Token address and amount are required.");
                    return;
                }

                try {
                    console.log(`Withdrawing ${amount} tokens from ${tokenAddress}...`);
                    const tx = await jukeboxContract.withdrawToken(tokenAddress, amount, {
                        gasLimit: ethers.utils.hexlify(300000),
                    });
                    console.log("Transaction sent:", tx.hash);
                    await tx.wait();
                    alert("Tokens withdrawn successfully!");
                } catch (error) {
                    console.error("Error withdrawing tokens:", error);
                    alert("Failed to withdraw tokens. Check the console for details.");
                }
            });
        });
    } catch (error) {
        console.error("Error updating tokens chart:", error);
    }
};


export const updateFeesTicker = async (jukeboxContract) => {
    try {
        let tokenIcon;
        let decimal;

        // Select appropriate icon and decimal based on network
        if (window.chainId === 24734) { // MintMe network
            tokenIcon = "<img src='./assets/MintMeLogo.png' alt='MintMe' style='width: 20px; height: 20px; vertical-align: middle; margin-left: 5px;'>";
            decimal = 18;
        } else if (window.chainId === 137) { // Polygon network
            tokenIcon = "<img src='./assets/Polygon_Logo.png' alt='Polygon' style='width: 20px; height: 20px; vertical-align: middle; margin-left: 5px;'>";
            decimal = 18;
        } else if (window.chainId === 10) { // Optimism network
            tokenIcon = "<img src='./assets/Optimism_Logo.png' alt='Optimism' style='width: 20px; height: 20px; vertical-align: middle; margin-left: 5px;'>";
            decimal = 18;
        }

        // Fetch accumulated fees
        const fees = await jukeboxContract.collectedFees();
        const formattedFees = ethers.utils.formatUnits(fees, decimal); // Format fees using the correct decimal

        console.log("Fees fetched successfully:", formattedFees);

        // Update the ticker with fees and icon
        document.getElementById("total-fees").innerHTML = `
            <span>${formattedFees}</span>
            ${tokenIcon}
            <button id="collect-album-fees-btn" class="collect-album-fees-btn">Collect Feees</button>
        `;
    } catch (error) {
        console.error("Error fetching accumulated fees:", error);
        document.getElementById("total-fees").innerText = "Error loading fees.";
    }

    document.querySelectorAll(".collect-album-fees-btn").forEach((button) => {
        const balanceElement = button.closest("span").querySelector("span");
        button.addEventListener("mouseover", () => {
            if (balanceElement) {
                balanceElement.classList.add("highlight");
            }
        });
    
        button.addEventListener("mouseout", () => {
            if (balanceElement) {
                balanceElement.classList.remove("highlight");
            }
        });
    });

     // Collect Fees button
     const collectFeesButton = document.getElementById("collect-album-fees-btn");
     collectFeesButton.addEventListener("click", async () => {
         try {
             console.log("Collecting fees...");
            
             const tx = await jukeboxContract.withdrawFees({
                 gasLimit: 300000, // Optional: Adjust gas limit as needed
             });
             console.log("Transaction sent:", tx.hash);
             await tx.wait();
             alert("Fees collected successfully!");
         } catch (error) {
             console.error("Error collecting fees:", error);
             alert("Failed to collect fees. Check the console for details.");
         }
     });
 
    

};

