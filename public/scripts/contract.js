const { ethers } = window;
import { updateRightLCD } from "./setupUI.js";
import { resetTrackAndTokenSelectionModal } from "./utils.js";

let erc20ABI;

export const loadERC20ABI = async () => {
    if (!erc20ABI) {
        const response = await fetch("./assets/abi_erc20.json");
        if (!response.ok) {
            throw new Error("Failed to load ERC20 ABI.");
        }
        erc20ABI = await response.json();
    }
};
export let jukeboxContract;

export const displayContractAddress = (contractAddress) => {
    const contractDisplay = document.getElementById("contract-display");
    const contractLink = document.getElementById("contract-link");

    // Format the contract address
    const favicons = Array(4)
        .fill('<img src="./assets/PolygonLogo.png" alt="icon">')
        .join('');
    const formattedAddress = `${contractAddress.slice(0, 4)}...${favicons}...${contractAddress.slice(-4)}`;

    // Update the link
    contractLink.innerHTML = formattedAddress;
    contractLink.href = `https://polygonscan.com/address/${contractAddress}`;

    // Make the contract display visible
    contractDisplay.classList.remove("hidden");
    contractDisplay.classList.add("visible");

    console.log("Contract address displayed:", formattedAddress);
};


export const initializeContract = async (contractAddress, contractABI) => {
    try {
        const { ethers } = window;
        const provider = await new ethers.providers.Web3Provider(window.ethereum);
        const signer = await provider.getSigner();
        jukeboxContract = await new ethers.Contract(contractAddress, contractABI, signer);
        
        return jukeboxContract;
    } catch (error) {
        console.error("Error initializing contract:", error);
        throw error;
    }
};


export const loadAlbums = async (jukeboxContract) => {
    const lcdLeft = document.getElementById("lcd-screen-left");
    resetTrackAndTokenSelectionModal(); // Reset modal state when a new album is loaded
    try {
        // Fetch the total number of albums
        const albumCount = await jukeboxContract.getAlbumCount();
        console.log("Total albums available:", albumCount.toNumber());
        if (albumCount.toNumber() === 0) {
            lcdLeft.innerText = "No albums available.";
            return;
        }

        const albums = [];
        for (let i = 0; i < albumCount; i++) {
            const albumName = await jukeboxContract.getAlbumNameByIndex(i);
            albums.push(albumName);
        }

        // Display albums on the left LCD screen
        lcdLeft.innerHTML = albums
            .map(
                (albumName) =>
                    `<div class="album-item" data-album="${albumName}">${albumName}</div>`
            )
            .join("");

        // Add the `.visible` class to display the LCD
        lcdLeft.classList.add("visible");

        // Add click event to load album details
        const albumItems = document.querySelectorAll(".album-item");
        albumItems.forEach((item) => {
            item.addEventListener("click", async () => {
                const albumName = item.getAttribute("data-album");
                await updateRightLCD(jukeboxContract, albumName); // Enhanced display
            });
        });
    } catch (error) {
        console.error("Error loading albums:", error);
        lcdLeft.innerText = "Failed to load albums.";
    }
};   


export const displaySongsForAlbum = async (albumName) => {
    const lcdRight = document.getElementById("lcd-screen-right");
    try {
        lcdRight.innerText = "Fetching songs...";
        const albumDetails = await jukeboxContract.getAlbumDetails(albumName);
        const cid = albumDetails[0];
        const ipfsUrl = `https://ipfs.io/ipfs/${cid}/`;

        const response = await fetch(ipfsUrl);        
        const text = await response.text();

        console.log("IPFS Response:", text);

        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");
        const songLinks = [...doc.querySelectorAll("a[href$='.mp3'], a[href$='.wav'], a[href$='.ogg'], a[href$='.aac'], a[href$='.m4a']")];
        if (songLinks.length === 0) {
            lcdRight.innerText = "No songs found in this album.";
            return;
        }

        let songListHTML = "";
        songLinks.forEach((link, index) => {
            const fileName = decodeURIComponent(link.getAttribute("href"));
            songListHTML += `<div class="song-item">${index + 1}. ${fileName}</div>`;
            console.log("Song found:", fileName);
        });

        lcdRight.innerHTML = `
            <div class="song-list">${songListHTML}</div>
        `;
    } catch (error) {
        console.error("Error fetching songs:", error);
        lcdRight.innerText = "Failed to fetch songs.";
    }
};

// Function to validate an IPFS CID
export const validateIPFSCID = async (cid) => {
    const validAudioExtensions = [".mp3", ".wav", ".ogg", ".flac", ".m4a"];
    const ipfsGatewayURL = `https://ipfs.io/ipfs/${cid}/`; // Gateway URL to fetch the directory contents

    try {
        const response = await fetch(ipfsGatewayURL);
        if (!response.ok) {
            throw new Error(`Failed to fetch CID contents: ${response.statusText}`);
        }

        const htmlContent = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");

        // Extract file links from the directory listing
        const fileLinks = Array.from(doc.querySelectorAll("a[href]"))
            .map((link) => link.getAttribute("href"))
            .filter((href) => validAudioExtensions.some((ext) => href.endsWith(ext)));

        if (fileLinks.length === 0) {
            throw new Error("No valid audio files found in the IPFS directory.");
        }

        return true; // CID is valid and contains audio files
    } catch (error) {
        console.error("IPFS CID validation failed:", error);
        alert(error.message);
        return false;
    }
};

export const addAlbumToContract = async (
    jukeboxContract,
    albumName,
    cid,
    albumOwner,
    paymentTokens,
    playFee,
    wholeAlbumFee
) => {
    try {
        const decimals = 18; // Standard token decimal
        const formattedPlayFee = ethers.utils.parseUnits(playFee.toString(), decimals);
        const formattedWholeAlbumFee = ethers.utils.parseUnits(wholeAlbumFee.toString(), decimals);

        console.log("Formatted Play Fee:", formattedPlayFee.toString());
        console.log("Formatted Whole Album Fee:", formattedWholeAlbumFee.toString());

        const tx = await jukeboxContract.addAlbum(
            albumName,
            cid,
            albumOwner,
            paymentTokens,
            formattedPlayFee,
            formattedWholeAlbumFee
        );

        console.log("Transaction Hash:", tx.hash);
        await tx.wait();
        console.log("Transaction Mined:", tx.hash);
        // Reload albums on the left LCD screen
        await loadAlbums(jukeboxContract);
        console.log("Albums reloaded successfully.");
    } catch (error) {
        console.error("Error adding album to contract:", error);
        throw error;
    }
};

// Function to play a song from the album
export const playSong = async (jukeboxContract, albumName, songIndex) => {
    try {
        const tx = await jukeboxContract.playSong(albumName, songIndex);
        console.log("Transaction Hash:", tx.hash);
        await tx.wait();
        console.log("Transaction Mined:", tx.hash);
    } catch (error) {
        console.error("Error playing song:", error);
        throw error;
    }
};


export const approveToken = async (tokenAddress, spender, amount) => {
    try {
        // Ensure ERC20 ABI is loaded
        await loadERC20ABI();

        const { ethers } = window;
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);

        // Convert amount to plain value (string or number) if it is a BigNumber
        const formattedAmount = ethers.BigNumber.isBigNumber(amount)
            ? amount.toString() // Convert BigNumber to string
            : amount;

        // Ensure spender is a valid address
        if (!ethers.utils.isAddress(spender)) {
            throw new Error("Invalid spender address.");
        }
        
        // Send approval transaction
        const tx = await tokenContract.approve(spender, formattedAmount);
        console.log("Approval transaction sent:", tx.hash);
        await tx.wait();
        console.log("Approval successful!");
    } catch (error) {
        console.error("Error during token approval:", error);
        throw error;
    }
};

export const getAlbumCreationFee = async (jukeboxContract) => {
    try {
        console.log("Fetching album creation fee...", jukeboxContract.functions);
        const feeRaw = await jukeboxContract.albumCreationFee();
        console.log("Album Creation Fee (in wei):", feeRaw.toString());

        // Ensure it is a valid BigNumber
        const feeBigNumber = ethers.BigNumber.from(feeRaw);
        console.log("BigNumber Fee:", feeBigNumber.toString());

        // Format the value (assuming it's in Wei and you want Ether)
        const fee = ethers.utils.formatUnits(feeBigNumber, "ether");
        console.log("Album Creation Fee (Ether):", fee);

        return fee; // return album creation fee in proper units
    } catch (error) {
        console.error("Error fetching album creation fee:", error);
        throw error;
    }
};