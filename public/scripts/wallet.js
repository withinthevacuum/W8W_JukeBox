export const connectWallet = async (contractAddress) => {
    const connectWalletButton = document.getElementById("connect-wallet");
    const enterControlsButton = document.getElementById("enter-controls");
    const walletDisplay = document.getElementById("wallet-display");
    const contractDisplay = document.getElementById("contract-display");
    const contractLink = document.getElementById("contract-link");
    if (!window.ethereum || !window.ethereum.isMetaMask) {
        alert("MetaMask is not detected! Please install MetaMask.");
        return;
    }
    if (window.ethereum) {
        try {
            console.log("MetaMask detected, initializing provider...");
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            console.log("Provider initialized:", provider);
        
            console.log("Requesting accounts...");
            await provider.send("eth_requestAccounts", []);
            console.log("Accounts successfully requested.");
        
            const signer = provider.getSigner();
            console.log("Signer initialized:", signer);
        
            const walletAddress = await signer.getAddress();
            console.log("Wallet connected successfully:", walletAddress);

            // Update wallet display
            const favicons = Array(4)
                .fill('<img src="./assets/Ens_Eth_Breathe.gif" alt="icon">')
                .join("");
            walletDisplay.innerHTML = `${walletAddress.slice(0, 4)}...${favicons}...${walletAddress.slice(-4)}`;
            walletDisplay.classList.remove("hidden");

        } catch (error) {
            console.error("Error during wallet connection:", error.message || error);
            console.error("Full Error Object:", error);
            alert("Failed to connect wallet. Please try again.");
        }
    } else {
        console.warn("MetaMask not detected.");
        alert("MetaMask is not installed! Please install it to use this app.");
    }
};

