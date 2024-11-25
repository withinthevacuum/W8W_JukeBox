import { loadAlbums } from "./contract.js";
import { setupPlaySongButton, setupPlayAlbumButton } from "./playback.js";
import { icons, loadIcons } from "./icons.js";


export const setupUI = (jukeboxContract) => {
    const enterControlsButton = document.getElementById("enter-controls");
    enterControlsButton.addEventListener("click", async () => {
        document.getElementById("landing").classList.add("hidden");
        document.getElementById("controls").classList.remove("hidden");
        
        await loadAlbums(jukeboxContract);
        
        document.getElementById("controls-overlay").classList.remove("hidden");
        document.getElementById("controls-overlay").classList.add("visible");

        // bring up load Album Modal when Add album is clicked
        setupAlbumModal(jukeboxContract);


    });
};



// updateRightLCD reveals the right lcd screen with play fees, album name, album owner, accepted tokens, and track list
// It also sets up the Play Song and Play Album buttons
// called from contract.js from inside the loadAlbums function on album click() event
export const updateRightLCD = async (jukeboxContract, albumName) => {
    const lcdRight = document.getElementById("lcd-screen-right");
    
    document.getElementById("right-lcd-buttons").classList.remove("hidden");
    document.getElementById("right-lcd-buttons").classList.add("visible");

    try {
        // Fetch album details
        const details = await jukeboxContract.getAlbumDetails(albumName);
        const { cid, albumOwner, paymentTokens, playFee, wholeAlbumFee } = details;
    
        // Fetch all icon URLs to ensure they're available
        const fetchedIcons = await Promise.all(
            Object.entries(icons).map(async ([token, url]) => {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch icon for ${token}: ${response.statusText}`);
                    }
                    return { token, url };
                } catch (error) {
                    console.error(`Error fetching icon for ${token}:`, error);
                    return { token, url: "" }; // Return an empty string if fetching fails
                }
            })
        );
    
        const tokenIcons = fetchedIcons
            .map(
                ({ token, url }) =>
                    `<img src="${url}" class="spin-icon" alt="${token}" style="width: 20px; height: 20px; margin-right: 10px;">`
            )
            .join("");
    

        const ipfsGatewayURL = `https://${cid}.ipfs.w3s.link/`;

        // Fetch the directory contents
        const response = await fetch(ipfsGatewayURL);
        const htmlContent = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");

        // Extract all links from the directory
        const validAudioExtensions = [".mp3", ".wav", ".ogg", ".flac", ".m4a", ".mp4"];
        const allLinks = Array.from(doc.querySelectorAll("a[href]"))
            .map((link) => link.getAttribute("href"));

            
        // Filter out every other entry to only include playable tracks
        const trackLinks = allLinks
            .filter((href, index) => validAudioExtensions.some((ext) => href.endsWith(ext)) && index % 2 === 1) // Ensure only playable tracks
            

        const trackNames = trackLinks.map((link, index) => {
            const decodedName = decodeURIComponent(link); // Decode URL-encoded names
            const trackNumber = index + 1; // Assign track numbers starting from 1
            return {
                name: decodedName.split("/").pop().split("?")[0], // Extract the actual file name
                number: trackNumber,
            };
        });

        const trackListHTML = trackNames
            .map((track) => `<tr><td>${track.number}</td><td>${track.name}</td></tr>`)
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
                <table style="width: 100%; font-size: 12px; font-family: Comic Sans MS; color: #96f7e5; text-align: left;">
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
        lcdRight.classList.add("visible");

        // Set up Play Song and Play Album buttons
        setupPlaySongButton(jukeboxContract, albumName, paymentTokens, playFee, cid);
        setupPlayAlbumButton(jukeboxContract, albumName, paymentTokens, wholeAlbumFee, cid);

    } catch (error) {
        console.error("Error loading album details or tracks:", error);
        lcdRight.innerText = "Failed to load album details.";
    }
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
            tx.wait()
            console.log("Transaction Hash:", tx.hash);
            alert(`Album "${albumName}" added successfully! Check the transaction on Polygonscan: ${tx} .`);
            clearModalFields();
            addAlbumModal.classList.remove("visible");
            addAlbumModal.classList.add("hidden");
            
            await delay(2000);
            // Refresh the album list
            try {
                await loadAlbums(jukeboxContract);
            }
            catch (error) {
                console.error("Error loading albums after addNewAlbum call:", error);
                // alert("Failed to load albums. Please check console for details.");
            }
        } catch (error) {
            console.error("Error adding album:", error);
            // alert("Failed to add album. Please check console for details.");
        }
    });
};