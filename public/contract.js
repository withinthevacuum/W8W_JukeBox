const { ethers } = window;
export let jukeboxContract;

export const displayContractAddress = () => {
    const contractAddress = "0x180Cf8CB681a083A73c997809FF60Df857010bF9";
    const contractDisplay = document.getElementById("contract-display");
    const contractLink = document.getElementById("contract-link");

    // Format the contract address
    const favicons = Array(4)
        .fill('<img src="https://bafybeic5bvnkjejuxbogn2n7lyzfyf5l6glgzrxkidjwj4yvhyci5haoca.ipfs.w3s.link/PolygonLogo.png" alt="icon">')
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


export const initializeContract = async (contractAddress, abi) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    jukeboxContract = new ethers.Contract(contractAddress, abi, signer);
    console.log("Jukebox contract initialized:", jukeboxContract.address);
};

export const loadAlbums = async () => {
    const lcdLeft = document.getElementById("lcd-screen-left");
    try {
        lcdLeft.innerText = "Loading albums...";
        const albumCount = await jukeboxContract.getAlbumCount();
        console.log("Album count:", albumCount.toNumber());

        if (albumCount.toNumber() === 0) {
            lcdLeft.innerText = "No albums available.";
            return;
        }

        let albumListHTML = "";
        for (let i = 0; i < albumCount; i++) {
            const albumName = await jukeboxContract.getAlbumNameByIndex(i);
            console.log(`Album ${i}:`, albumName);
            albumListHTML += `<div class="album-item" data-album="${albumName}">${albumName}</div>`;
        }

        lcdLeft.innerHTML = `
            <div class="album-list">${albumListHTML}</div>
            <small>Click an album to view songs</small>
        `;

        // Add click event listeners for album selection
        const albumItems = document.querySelectorAll(".album-item");
        albumItems.forEach((item) => {
            item.addEventListener("click", async () => {
                const albumName = item.getAttribute("data-album");
                console.log("Selected album:", albumName);
                await displaySongsForAlbum(albumName);
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

        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");
        const songLinks = [...doc.querySelectorAll("a[href$='.mp3'], a[href$='.wav'], a[href$='.ogg']")];

        if (songLinks.length === 0) {
            lcdRight.innerText = "No songs found in this album.";
            return;
        }

        let songListHTML = "";
        songLinks.forEach((link, index) => {
            const fileName = decodeURIComponent(link.getAttribute("href"));
            songListHTML += `<div class="song-item">${index + 1}. ${fileName}</div>`;
        });

        lcdRight.innerHTML = `
            <div class="song-list">${songListHTML}</div>
        `;
    } catch (error) {
        console.error("Error fetching songs:", error);
        lcdRight.innerText = "Failed to fetch songs.";
    }
};