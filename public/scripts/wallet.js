
import { contractVersions } from "./utils.js";

export const connectWallet = async () => {
    const connectWalletButton = document.getElementById("connect-wallet");
    const walletDisplay = document.getElementById("wallet-display");
    const contractDisplay = document.getElementById("contract-display");

    if (!window.ethereum || !window.ethereum.isMetaMask) {
        alert("MetaMask is not detected! Please install MetaMask.");
        return;
    }

    try {
        console.log("MetaMask detected, initializing provider...");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        window.provider = provider; // Store provider globally
        await provider.send("eth_requestAccounts", []);

        const signer = provider.getSigner();
        const walletAddress = await signer.getAddress();

        // Update wallet display
        const favicons = Array(4)
            .fill('<img src="./assets/Ens_Eth_Breathe.gif" alt="icon">')
            .join("");
        walletDisplay.innerHTML = `${walletAddress.slice(0, 4)}...${favicons}...${walletAddress.slice(-4)}`;
        walletDisplay.classList.remove("hidden");

        const network = await provider.getNetwork();
        const chainId = network.chainId;
        window.chainId = chainId; // Store chain ID globally

        let contractAddress, abiPath;

        // Handle MintMe hardcoded support
        if (chainId === 24734) {
            console.log("Detected MintMe network - Loading MintMe contract...");
            contractAddress = "0x95F35Eb32fEaa8dd025BBf1aaeC157091cCA6dd2";
            abiPath = "./assets/jukebox_v1.2_MM_abi.json";
        } else {
            // Fetch contract version details dynamically
            const currentVersion = document.getElementById("version-switcher").value;
            const selectedVersion = contractVersions[currentVersion];

            if (!selectedVersion) {
                throw new Error(`Contract version ${currentVersion} not found.`);
            }

            contractAddress = selectedVersion.address;
            abiPath = selectedVersion.abiPath;
        }

        // Fetch the ABI and initialize the contract
        const response = await fetch(abiPath);
        if (!response.ok) throw new Error("Failed to load contract ABI.");
        const contractABI = await response.json();

        const jukeboxContract = new ethers.Contract(contractAddress, contractABI, signer);
        console.log("Contract initialized:", jukeboxContract.address);

        return { jukeboxContract, contractAddress, chainId };
    } catch (error) {
        console.error("Error during wallet connection:", error.message || error);
        alert("Failed to connect wallet. Please try again.");
    }
};

