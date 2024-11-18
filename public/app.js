const { ethers } = window;

document.addEventListener("DOMContentLoaded", async () => {
    const landing = document.getElementById("landing");
    const controls = document.getElementById("controls");
    const connectWalletButton = document.getElementById("connect-wallet");
    const enterControlsButton = document.getElementById("enter-controls");

    const lcdLeft = document.getElementById("lcd-screen-left");
    const lcdRight = document.getElementById("lcd-screen-right");
    const controlsOverlay = document.querySelector(".controls-overlay");

    // Contract setup
    const contractAddress = "0xdD8E5956B0d3162cb673F70E217b7F5F3d3c6F6f";
    let contractABI;

    try {
        const response = await fetch("/abi.json");
        contractABI = await response.json();
    } catch (error) {
        console.error("Failed to load ABI:", error);
        alert("Failed to load ABI file.");
        return;
    }

    let provider, signer, jukeboxContract;

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                signer = provider.getSigner();
                const walletAddress = await signer.getAddress();
                console.log("Wallet connected successfully:", walletAddress);
    
                // Update UI
                connectWalletButton.style.display = "none"; // Hide Connect Wallet button
                enterControlsButton.classList.remove("hidden");
                enterControlsButton.style.display = "block"; // Ensure visibility
    
                // Display wallet address
                const walletDisplay = document.getElementById("wallet-display");
                const favicons = Array(4).fill('<img src="https://bafybeifej4defs5s5wryxylmps42c7xkbzle3fxjgnsbb5hcfnd5b77zwa.ipfs.w3s.link/Ens_Eth_Breathe.gif" alt="icon">').join('');

                walletDisplay.innerHTML = `${walletAddress.slice(0, 4)} ...${favicons}... ${walletAddress.slice(-4)}`;
                
                walletDisplay.classList.remove("hidden");
    
                console.log("UI updated: Connect Wallet hidden, Enter Jukebox visible.");
            } catch (error) {
                console.error("Failed to connect wallet:", error);
                alert("Failed to connect wallet. Please try again.");
            }
        } else {
            alert("MetaMask is not installed! Please install it to use this app.");
        }
    };
    connectWalletButton.addEventListener("click", connectWallet);

    enterControlsButton.addEventListener("click", () => {
        console.log("Enter Jukebox button clicked!");
        landing.classList.add("hidden");
        controls.classList.remove("hidden");

        // Ensure LCD screens and controls fade in
        setTimeout(() => {
            lcdLeft.classList.add("visible");
            lcdRight.classList.add("visible");
            controlsOverlay.classList.add("visible");
            console.log("LCD screens and controls made visible.");
        }, 1300); // Adjust the delay as necessary
    });

    // Add Album button functionality
    document.getElementById("add-album").addEventListener("click", async () => {
        const albumName = prompt("Enter album name:");
        const cid = prompt("Enter CID (IPFS link):");
        const albumOwner = prompt("Enter album owner address:");
        const paymentTokens = prompt("Enter payment tokens (comma-separated):")
            .split(",")
            .map((token) => token.trim());
        const playFee = parseInt(prompt("Enter play fee:"), 10);
        const wholeAlbumFee = parseInt(prompt("Enter whole album fee:"), 10);

        try {
            const tx = await jukeboxContract.addAlbum(
                albumName,
                cid,
                albumOwner,
                paymentTokens,
                playFee,
                wholeAlbumFee
            );
            await tx.wait();
            alert(`Album ${albumName} added successfully!`);
        } catch (error) {
            console.error("Error adding album:", error);
            alert("Failed to add album.");
        }
    });

    // View Album button functionality
    document.getElementById("view-album").addEventListener("click", async () => {
        const albumName = prompt("Enter album name:");
        try {
            const album = await jukeboxContract.albums(albumName);
            alert(`
                CID: ${album.cid}
                Owner: ${album.albumOwner}
                Play Fee: ${album.playFee}
                Whole Album Fee: ${album.wholeAlbumFee}
            `);
        } catch (error) {
            console.error("Error fetching album details:", error);
            alert("Failed to fetch album details.");
        }
    });

    // Play Song button functionality
    document.getElementById("play-song").addEventListener("click", async () => {
        const albumName = prompt("Enter album name:");
        const trackNumber = parseInt(prompt("Enter track number:"), 10);
        const token = prompt("Enter token address:");
        try {
            const tx = await jukeboxContract.playSong(albumName, trackNumber, token);
            await tx.wait();
            alert(`Playing song ${trackNumber} from album ${albumName}`);
        } catch (error) {
            console.error("Error playing song:", error);
            alert("Failed to play song.");
        }
    });

    // Play Album button functionality
    document.getElementById("play-album").addEventListener("click", async () => {
        const albumName = prompt("Enter album name:");
        const token = prompt("Enter token address:");
        try {
            const tx = await jukeboxContract.playAlbum(albumName, token);
            await tx.wait();
            alert(`The album ${albumName} is playing!`);
        } catch (error) {
            console.error("Error playing album:", error);
            alert("Failed to play album.");
        }
    });

    // Add Token button functionality
    document.getElementById("add-token").addEventListener("click", async () => {
        const albumName = prompt("Enter album name:");
        const token = prompt("Enter token address:");
        try {
            const tx = await jukeboxContract.addToken(albumName, token);
            await tx.wait();
            alert(`Token ${token} added to album ${albumName}`);
        } catch (error) {
            console.error("Error adding token:", error);
            alert("Failed to add token.");
        }
    });

    // Remove Token button functionality
    document.getElementById("remove-token").addEventListener("click", async () => {
        const albumName = prompt("Enter album name:");
        const token = prompt("Enter token address:");
        try {
            const tx = await jukeboxContract.removeToken(albumName, token);
            await tx.wait();
            alert(`Token ${token} removed from album ${albumName}`);
        } catch (error) {
            console.error("Error removing token:", error);
            alert("Failed to remove token.");
        }
    });
});