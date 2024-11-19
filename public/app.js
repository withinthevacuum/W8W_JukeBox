import { displayContractAddress, initializeContract, loadAlbums } from "./contract.js";
import { connectWallet } from "./wallet.js";
import { setupUI } from "./ui.js";

const contractAddress = "0x180Cf8CB681a083A73c997809FF60Df857010bF9";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Fetch the ABI
        const response = await fetch("./abi.json"); // Ensure correct path
        if (!response.ok) throw new Error("Failed to fetch ABI.");
        const contractABI = await response.json();

        // Initialize the contract
        const jukeboxContract = await initializeContract(contractAddress, contractABI);

        // Handle wallet connection
        document.getElementById("connect-wallet").addEventListener("click", async () => {
            try {
                await connectWallet(contractAddress);
                displayContractAddress(contractAddress); // Show the contract address
                await loadAlbums(jukeboxContract); // Populate albums
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