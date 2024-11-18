import { displayContractAddress, initializeContract, loadAlbums } from "./contract.js";

import { connectWallet } from "./wallet.js";
import { setupUI } from "./ui.js";

const contractAddress = "0x180Cf8CB681a083A73c997809FF60Df857010bF9";


document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("/abi.json");
    const contractABI = await response.json();
    await initializeContract(contractAddress, contractABI);
    setupUI();
    document.getElementById("connect-wallet").addEventListener("click", async () => {
        try {
            await connectWallet(contractAddress); // Handles wallet connection
            displayContractAddress(); // Displays contract details after wallet is connected
        } catch (error) {
            console.error("Error during wallet connection:", error);
            alert("Failed to connect wallet. Please try again.");
        }
    });


});