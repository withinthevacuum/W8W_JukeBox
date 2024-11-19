import { addAlbumToContract } from "./contract.js";

export const setupUI = (jukeboxContract) => {
    const landing = document.getElementById("landing");
    const controls = document.getElementById("controls");
    const enterControlsButton = document.getElementById("enter-controls");

    enterControlsButton.addEventListener("click", async () => {
        console.log("Enter Jukebox button clicked!");
        landing.classList.add("hidden");
        controls.classList.remove("hidden");

        setTimeout(() => {
            const lcdLeft = document.getElementById("lcd-screen-left");
            const lcdRight = document.getElementById("lcd-screen-right");
            const controlsOverlay = document.querySelector(".controls-overlay");
            const rightLcdButtons = document.querySelector(".right-lcd-buttons");

            if (!rightLcdButtons) {
                console.error("Error: Element with class 'right-lcd-buttons' not found in the DOM!");
                return;
            }

            lcdLeft.classList.add("visible");
            lcdRight.classList.add("visible");
            controlsOverlay.classList.add("visible");
            rightLcdButtons.classList.add("visible");
            console.log("LCD screens and controls made visible.");
        }, 1300);

        // Load albums on the left LCD
        await loadAlbums(jukeboxContract);
    });

    // Set up the Add Album modal
    setupAlbumModal(jukeboxContract);

};

export const setupAlbumModal = (jukeboxContract) => {
    const addAlbumModal = document.getElementById("add-album-modal");
    const modalCloseButton = document.getElementById("modal-close");
    const submitAlbumButton = document.getElementById("submit-album");

    // Default token addresses
    const DEFAULT_PAYMENT_TOKENS = [
        "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC
        "0x81ccef6414d4cdbed9fd6ea98c2d00105800cd78", // SHT
        "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // MATIC
    ];

    // Show the Add Album modal and prefill payment tokens
    document.getElementById("add-album").addEventListener("click", () => {
        addAlbumModal.classList.remove("hidden");
        addAlbumModal.classList.add("visible");

        // Prefill payment tokens with default values
        document.getElementById("payment-tokens").value = DEFAULT_PAYMENT_TOKENS.join(",");
    });

    // Close the modal
    modalCloseButton.addEventListener("click", () => {
        addAlbumModal.classList.remove("visible");
        addAlbumModal.classList.add("hidden");
        clearModalFields();
    });

    // Clear modal fields
    const clearModalFields = () => {
        document.getElementById("album-name").value = "";
        document.getElementById("album-cid").value = "";
        document.getElementById("album-owner").value = "";
        document.getElementById("payment-tokens").value = "";
        document.getElementById("play-fee").value = "";
        document.getElementById("whole-album-fee").value = "";
        document.getElementById("error-message").innerText = "";
    };

    // Validation and submission remain the same as before
    const validateFields = () => {
        const albumName = document.getElementById("album-name").value.trim();
        const cid = document.getElementById("album-cid").value.trim();
        const albumOwner = document.getElementById("album-owner").value.trim();
        const paymentTokens = document.getElementById("payment-tokens").value.trim().split(",");
        const playFee = parseFloat(document.getElementById("play-fee").value.trim());
        const wholeAlbumFee = parseFloat(document.getElementById("whole-album-fee").value.trim());

        let errorMessage = "";

        if (!albumName) errorMessage = "Album name cannot be empty.";
        else if (!/^[b][a-z2-7]{58}$/.test(cid)) errorMessage = "Invalid IPFS CID.";
        else if (!ethers.utils.isAddress(albumOwner)) errorMessage = "Invalid album owner address.";
        else if (
            !paymentTokens
                .map((token) => token.trim()) // Trim each token
                .filter((token) => token !== "") // Remove empty strings
                .every((token) => ethers.utils.isAddress(token)) // Validate remaining addresses
        ) {errorMessage = "One or more payment tokens are invalid.";}
        else if (!(playFee > 0)) errorMessage = "Play fee must be a positive number.";
        else if (!(wholeAlbumFee > 0)) errorMessage = "Whole album fee must be a positive number.";

        document.getElementById("error-message").innerText = errorMessage;
        return !errorMessage;
    };

    submitAlbumButton.addEventListener("click", async () => {
        if (!validateFields()) return;
    
        const albumName = document.getElementById("album-name").value.trim();
        const cid = document.getElementById("album-cid").value.trim();
        const albumOwner = document.getElementById("album-owner").value.trim();
        const paymentTokens = document.getElementById("payment-tokens").value
            .trim()
            .split(",")
            .map((token) => token.trim());
        const playFee = document.getElementById("play-fee").value.trim();
        const wholeAlbumFee = document.getElementById("whole-album-fee").value.trim();
    
        try {
            // Convert fees to BigNumber format
            const formattedPlayFee = ethers.utils.parseUnits(playFee, 18);
            const formattedWholeAlbumFee = ethers.utils.parseUnits(wholeAlbumFee, 18);
    
            console.log("Adding album to contract...");
            console.log("albumName:", albumName);
            console.log("cid:", cid);
            console.log("albumOwner:", albumOwner);
            console.log("paymentTokens:", paymentTokens);
            console.log("formattedPlayFee:", formattedPlayFee.toString());
            console.log("formattedWholeAlbumFee:", formattedWholeAlbumFee.toString());
    
            const tx = await jukeboxContract.addAlbum(
                albumName,
                cid,
                albumOwner,
                paymentTokens,
                formattedPlayFee,
                formattedWholeAlbumFee
            );
            console.log("Transaction Hash:", tx.hash);
            alert(`Album "${albumName}" added successfully! Check the transaction on Polygonscan: ${tx} .`);
            clearModalFields();
            addAlbumModal.classList.remove("visible");
            addAlbumModal.classList.add("hidden");
            // Refresh the album list
            try {
                await loadAlbums(jukeboxContract);
            }
            catch (error) {
                console.error("Error loading albums after addNewAlbum call:", error);
                alert("Failed to load albums. Please check console for details.");
            }
        } catch (error) {
            console.error("Error adding album:", error);
            alert("Failed to add album. Please check console for details.");
        }
    });
};


export const updateRightLCD = async (jukeboxContract, albumName) => {
    const lcdRight = document.getElementById("lcd-screen-right");

    try {
        const details = await jukeboxContract.getAlbumDetails(albumName);
        const { cid, albumOwner, paymentTokens, playFee, wholeAlbumFee } = details;

        const icons = {
            "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359": "https://bafybeiag2css4im6d7fdtcafwabw2qau46yrzhn4z23hwhsft2e3faa2fy.ipfs.w3s.link/USDC_of_the_future.png", // USDC
            "0x81ccef6414d4cdbed9fd6ea98c2d00105800cd78": "https://bafybeigr6ri2ythjbciusgjdvimjt74caymflc5ut4rmtrkhcoi2cr53ua.ipfs.w3s.link/DecentSmartHome.png", // SHT
            "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270": "https://bafybeic5bvnkjejuxbogn2n7lyzfyf5l6glgzrxkidjwj4yvhyci5haoca.ipfs.w3s.link/PolygonLogo.png" // MATIC
        };

        const tokenIcons = paymentTokens
            .map(
                (token) =>
                    `<img src="${icons[token] || ""}" alt="${token}" style="width: 20px; height: 20px; margin-right: 10px;">`
            )
            .join("");

        const ipfsGatewayURL = `https://${cid}.ipfs.w3s.link/`;

        // Fetch the directory contents
        const response = await fetch(ipfsGatewayURL);
        const htmlContent = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");

        // Extract all links from the directory
        const validAudioExtensions = [".mp3", ".wav", ".ogg", ".flac", ".m4a"];
        const allLinks = Array.from(doc.querySelectorAll("a[href]"))
            .map((link) => link.getAttribute("href"));

        // Filter out every other entry to only include playable tracks
        const trackLinks = allLinks
            .filter((href, index) => validAudioExtensions.some((ext) => href.endsWith(ext)) && index % 2 === 1) // Ensure only playable tracks
            .slice(0, 11); // Limit to the first 11 tracks

        const trackNames = trackLinks.map((link) => {
            const decodedName = decodeURIComponent(link); // Decode URL-encoded names
            return decodedName.split("/").pop().split("?")[0]; // Extract the actual file name
        });

        const trackListHTML = trackNames
            .map((track, index) => `<tr><td>${index + 1}</td><td>${track}</td></tr>`)
            .join("");

        // Format the owner address with icons
        const favicons = Array(4)
            .fill('<img src="https://bafybeifej4defs5s5wryxylmps42c7xkbzle3fxjgnsbb5hcfnd5b77zwa.ipfs.w3s.link/Ens_Eth_Breathe.gif" alt="icon" style="width: 12px; height: 12px;">')
            .join("");
        const formattedOwner = `${albumOwner.slice(0, 4)}...${favicons}...${albumOwner.slice(-4)}`;

        // Update the right LCD screen
        lcdRight.innerHTML = `
            <div style="text-align: center; margin-bottom: 10px;">
                <!-- Header Section -->
                <table style="width: 100%; font-size: 12px; font-family: Comic Sans MS; color: #96f7e5; text-align: left; margin-bottom: 15px;">
                    <tr>
                        <th style="padding: 5px;">Single Play Fee</th>
                        <th style="padding: 5px;">Album Fee</th>
                        <th style="padding: 5px;">Accepted Tokens</th>
                    </tr>
                    <tr>
                        <td style="padding: 5px;">${ethers.utils.formatUnits(playFee, 18)}</td>
                        <td style="padding: 5px;">${ethers.utils.formatUnits(wholeAlbumFee, 18)}</td>
                        <td style="padding: 5px;">${tokenIcons}</td>
                    </tr>
                </table>
                <!-- Album Details Section -->
                <div style="margin-top: 3px; text-align: left; font-size: 12px;">
                    ${albumName}<br>
                    ${formattedOwner}
                </div>
                <!-- Track List Section -->
                <div style="margin-top: 5px; text-align: left;">
                    <div style="max-height: 150px; overflow-y: auto; padding: 10px; background-color: rgba(0, 0, 0, 0.1); border: 1px solid #9afef7;">
                        <table style="width: 100%; font-size: 12px; font-family: Comic Sans MS; color: #96f7e5; text-align: left;">
                            <tr>
                                <th>#</th>
                                <th>Track Name</th>
                            </tr>
                            ${trackListHTML}
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Error loading album details or tracks:", error);
        lcdRight.innerText = "Failed to load album details.";
    }
};

// event listener for the play song button
export const setupPlaySongButton = async (jukeboxContract, albumName) => {
    const playSongButton = document.getElementById("play-song");
    const lcdRight = document.getElementById("lcd-screen-right");


    playSongButton.addEventListener("click", async () => {
        // Get the selected song index
        const songIndex = parseInt(prompt("Enter the song index to play: "));
        try {
            const tx = await jukeboxContract.playSong(albumName, songIndex);
            console.log("Transaction Hash:", tx.hash);
            alert(`Song played successfully! Check the transaction on Polygonscan: ${tx.hash}`);
            await updateRightLCD(jukeboxContract, albumName);
        } catch (error) {
            console.error("Error playing song:", error);
            alert("Failed to play song. Please check console for details.");
        }
    });
};