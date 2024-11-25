const { ethers } = window;

let provider, signer;

export const connectWallet = async (contractAddress) => {
    const connectWalletButton = document.getElementById("connect-wallet");
    const enterControlsButton = document.getElementById("enter-controls");
    const walletDisplay = document.getElementById("wallet-display");
    const contractDisplay = document.getElementById("contract-display");
    const contractLink = document.getElementById("contract-link");

    if (window.ethereum) {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            const walletAddress = await signer.getAddress();

            console.log("Wallet connected successfully:", walletAddress);

            // Update wallet display
            const favicons = Array(4)
                .fill('<img src="https://bafybeifej4defs5s5wryxylmps42c7xkbzle3fxjgnsbb5hcfnd5b77zwa.ipfs.w3s.link/Ens_Eth_Breathe.gif" alt="icon">')
                .join("");
            walletDisplay.innerHTML = `${walletAddress.slice(0, 4)}...${favicons}...${walletAddress.slice(-4)}`;
            walletDisplay.classList.remove("hidden");

            // Update contract display
            contractLink.href = `https://polygonscan.com/address/${contractAddress}`;
            contractLink.innerText = `Jukebox: ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`;
            contractDisplay.classList.remove("hidden");

            connectWalletButton.style.display = "none"; // Hide Connect Wallet button
            enterControlsButton.classList.remove("hidden");
            enterControlsButton.style.display = "block";

        } catch (error) {
            console.error("Failed to connect wallet:", error);
            alert("Failed to connect wallet. Please try again.");
        }
    } else {
        alert("MetaMask is not installed! Please install it to use this app.");
    }
};