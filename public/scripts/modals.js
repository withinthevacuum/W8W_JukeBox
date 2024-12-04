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
        const networkTokens = window.chainId === 24734 ? paymentTokensDict.MintMe : paymentTokensDict.POL;

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

        console.log('network tokens:', networkTokens);

        // Load and populate token icons
        const fetchedIcons = await Promise.all(
            Object.entries(networkTokens).map(async ([token, url]) => {
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
            //  Restrict token to MTCG eco tokens for testing
            const allowedTokens = [
                "0x81ccef6414d4cdbed9fd6ea98c2d00105800cd78", // SHT
                "0x969d65ee0823f9c892bdfe3c462d91ab1d278b4e", // DSH
                "0x25396c06fEf8b79109da2a8e237c716e202489EC", // MTCG
                "0xCbc63Dcc51679aDf0394AB2be1318034193003B6", // Eclipse
                "0x2f9C7A6ff391d0b6D5105F8e37F2050649482c75", // Bobdubbloon
                "0x3C20f6fC8adCb39769E307a8B3a5109a3Ff97933", // WithinTheVacuum
                "0x72E39206C19634d43f699846Ec1db2ACd69513e4", // SatoriD
                "0x149D5555387cb7d26cB07622cC8898c852895421"  // DWMW
            ].map((addr) => addr.toLowerCase()); // Normalize to lowercase
        
            if (!allowedTokens.includes(token.toLowerCase())) {
                console.log(`Token ${token} is not in the allowed list, skipping.`);
                return; // Skip tokens not in the allowed list
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
        });

        // Handle cancel button
        cancelButton.addEventListener("click", () => {
            modal.classList.add("hidden");
            overlay.classList.remove("active");
            resetTrackAndTokenSelectionModal();
            reject("Selection canceled");
        });

        // Handle outside click
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                modal.classList.add("hidden");
                overlay.classList.remove("active");
                resetTrackAndTokenSelectionModal();
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
        const networkTokens = window.chainId === 24734 ? paymentTokensDict.MintMe : paymentTokensDict.POL;

        console.log("Initializing token selection modal...");

        // Clear existing content
        tokenListContainer.innerHTML = "";

        console.log("Payment tokens provided:", paymentTokens);

        // Load and populate token icons
        const fetchedIcons = await Promise.all(
            Object.entries(networkTokens).map(async ([token, url]) => {
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
            // Restrict payments to MTCG ecosystem token while testing
            const allowedTokens = [
                "0x81ccef6414d4cdbed9fd6ea98c2d00105800cd78", // SHT
                "0x25396c06fEf8b79109da2a8e237c716e202489EC", // MTCG
                "0xCbc63Dcc51679aDf0394AB2be1318034193003B6", // Eclipse
                "0x2f9C7A6ff391d0b6D5105F8e37F2050649482c75", // Bobdubbloon
                "0x3C20f6fC8adCb39769E307a8B3a5109a3Ff97933", // WithinTheVacuum
                "0x72E39206C19634d43f699846Ec1db2ACd69513e4", // SatoriD
                "0x149D5555387cb7d26cB07622cC8898c852895421"  // DWMW
            ].map((addr) => addr.toLowerCase()); // Normalize to lowercase
        
            if (!allowedTokens.includes(token.toLowerCase())) {
                console.log(`Token ${token} is not in the allowed list, skipping.`);
                return; // Skip tokens not in the allowed list
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


export const updateTokensChart = async (jukeboxContract, tokenAddresses) => {
    const tableBody = document.getElementById("tokens-table").querySelector("tbody");
    tableBody.innerHTML = ""; // Clear existing rows

    const tokenData = await loadIcons(tokenAddresses);

    for (const token of tokenData) {
        try {
            console.log("Fetching balance for token:", token.token);
            const { ethers } = window;
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            console.log("Signer initialized:", signer);

            const tokenContract = new ethers.Contract(token.token, window.erc20ABI, signer);
            const balance = await tokenContract.balanceOf(window.jukeboxContract.address);
            const decimals = await tokenContract.decimals();
            const formattedBalance = ethers.utils.formatUnits(balance, decimals);

            // Retrieve name and symbol from tokenWhiteList
            const tokenInfo = tokenWhiteList.Polygon[token.token] || tokenWhiteList.MintMe[token.token];
            const tokenName = tokenInfo?.name || "Unknown Token";
            const tokenSymbol = tokenInfo?.symbol || "UNKNOWN";

            // Skip tokens with zero balance
            if (balance.isZero()) {
                console.log(`Skipping token ${token.token} with balance 0.`);
                continue;
            }

            // Create and append the row for tokens with balance > 0
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="token-details">
                    <img class="token-icon" src="${token.url}" alt="${token.symbol}">
                    <span class="token-name"> ${tokenName} </span>
                    <span class="token-symbol">(${tokenSymbol})</span>
                </td>
                <td class="token-balance">${formattedBalance}</td>
                <td class="actions">
                    <button id="collect-fees-btn" class="collect-fees-btn" data-token="${token.token}" data-amount="${balance}">
                        Collect Fees
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        } catch (error) {
            console.error(`Error fetching balance for token ${token.address}:`, error);
        }
    }
    document.querySelectorAll(".collect-fees-btn").forEach((button) => {
        const balanceElement = button.closest("tr").querySelector(".token-balance");
        const tokenSymbol = button.closest("tr").querySelector(".token-symbol");
        const tokenName = button.closest("tr").querySelector(".token-name");
        button.addEventListener("mouseover", () => {
            if (balanceElement) {
                balanceElement.classList.add("highlight");
            }
            if (tokenSymbol) {
                tokenSymbol.classList.add("highlight");
            }
            if (tokenName) {
                tokenName.classList.add("highlight");
            }

        });
    
        button.addEventListener("mouseout", () => {
            if (balanceElement) {
                balanceElement.classList.remove("highlight");
            }
            if (tokenSymbol) {
                tokenSymbol.classList.remove("highlight");
            }
            if (tokenName) {
                tokenName.classList.remove("highlight");
            }
        });
    });

    // Withdraw Token button
    const withdrawTokenButton = document.getElementById("collect-fees-btn");
    withdrawTokenButton.addEventListener("click", async () => {
        const tokenAddress = withdrawTokenButton.dataset.token;
        let amount = withdrawTokenButton.dataset.amount;

        if (!tokenAddress || !amount) {
            alert("Token address and amount are required.");
            return;
        }

        try {

            // if(window.chainId === 24734) {
            //     amount = ethers.utils.parseUnits(amount, 18); // Adjust decimals if needed
            // }
            console.log(`Withdrawing ${amount} tokens from ${tokenAddress}...`);

            const tx = await jukeboxContract.withdrawToken(tokenAddress, amount, {
                gasLimit: 300000, // Optional: Adjust gas limit as needed
            });
            
            console.log("Transaction sent:", tx.hash);
            await tx.wait();
            alert("Tokens withdrawn successfully!");
        } catch (error) {
            console.error("Error withdrawing tokens:", error);
            alert("Failed to withdraw tokens. Check the console for details.");
        }
    });

};


export const updateFeesTicker = async (jukeboxContract) => {
    try {
        let tokenIcon;
        let decimal;

        // Select appropriate icon and decimal based on network
        if (window.chainId === 24734) { // MintMe network
            tokenIcon = "<img src='/assets/MintMeLogo.png' alt='MintMe' style='width: 20px; height: 20px; vertical-align: middle; margin-left: 5px;'>";
            decimal = 12;
        } else if (window.chainId === 137) { // Polygon network
            tokenIcon = "<img src='/assets/Polygon_Logo.png' alt='Polygon' style='width: 20px; height: 20px; vertical-align: middle; margin-left: 5px;'>";
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
