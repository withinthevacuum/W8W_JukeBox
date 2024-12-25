import { initializeContract } from "./contract.js";

let dynamicRewardsContract;

// Event Listener for Contract Button (📜)
document.getElementById("contract-button").addEventListener("click", async () => {
    document.getElementById("dynamic-rewards-modal-overlay").classList.remove("hidden");

    // Initialize Contract (Replace with your deployed contract address and ABI)
    const contractAddress = "YOUR_CONTRACT_ADDRESS";
    const contractABI = [ /* ABI array */ ]; // Add your contract ABI here

    if (!dynamicRewardsContract) {
        try {
            dynamicRewardsContract = await initializeContract(contractAddress, contractABI);
            console.log("Dynamic Rewards Contract Initialized:", dynamicRewardsContract.address);
        } catch (error) {
            console.error("Error initializing contract:", error);
            alert("Failed to connect to the contract. Please check your wallet connection.");
        }
    }
});

// Add Whitelist Functionality
document.getElementById("add-whitelist-button").addEventListener("click", async () => {
    const addresses = document.getElementById("whitelist-input").value.split(",").map(addr => addr.trim());

    try {
        const tx = await dynamicRewardsContract.addWhitelist(addresses);
        await tx.wait();
        alert("Whitelist updated successfully!");
    } catch (error) {
        console.error("Error adding whitelist:", error);
        alert("Failed to update whitelist.");
    }
});

// Buy Entries Functionality
document.getElementById("buy-entries-button").addEventListener("click", async () => {
    const entries = document.getElementById("buy-entries-input").value;

    try {
        const tx = await dynamicRewardsContract.buyEntryWithCount(entries);
        await tx.wait();
        alert(`Successfully bought ${entries} entries!`);
    } catch (error) {
        console.error("Error buying entries:", error);
        alert("Failed to buy entries.");
    }
});

// Select Winner Functionality
document.getElementById("select-winner-button").addEventListener("click", async () => {
    try {
        const tx = await dynamicRewardsContract.selectWinner();
        await tx.wait();
        alert("Winner selected successfully!");
    } catch (error) {
        console.error("Error selecting winner:", error);
        alert("Failed to select a winner.");
    }
});

// Claim Prize Functionality
document.getElementById("claim-prize-button").addEventListener("click", async () => {
    try {
        const tx = await dynamicRewardsContract.claimPrize();
        await tx.wait();
        alert("Prize claimed successfully!");
    } catch (error) {
        console.error("Error claiming prize:", error);
        alert("Failed to claim prize.");
    }
});

// Close Dynamic Rewards Modal
document.getElementById("close-dynamic-rewards-modal").addEventListener("click", () => {
    document.getElementById("dynamic-rewards-modal-overlay").classList.add("hidden");
});