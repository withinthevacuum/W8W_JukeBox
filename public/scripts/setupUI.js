import { loadAlbums, getAlbumCreationFee } from "./contract.js";
import { setupPlaySongButton, setupPlayAlbumButton } from "./playback.js";
import { icons, loadIcons } from "./icons.js";
import { showLoader, hideLoader, resetTrackAndTokenSelectionModal } from "./utils.js";


export const setupUI = (jukeboxContract) => {
    const enterControlsButton = document.getElementById("enter-controls");

    // print contract address to console log
    console.log("Connected to Jukebox Contract Address:", jukeboxContract.address);

    enterControlsButton.addEventListener("click", async () => {
        document.getElementById("landing").classList.add("hidden");
        document.getElementById("controls").classList.remove("hidden");
        
        showLoader(); // Show loader before loading albums
        
        try {
            console.log("Loading albums...");
            
            // Load albums
            await loadAlbums(jukeboxContract);
            resetTrackAndTokenSelectionModal(); // Reset modal state when a new album is loaded

            // Wait for albums to render
            const lcdLeft = document.getElementById("lcd-screen-left");
            if (!lcdLeft) {
                throw new Error("Left LCD element not found.");
            }

            // Poll the LCD screen to check if albums are rendered
            await waitForRenderedAlbums(lcdLeft);

            console.log("Albums have been fully rendered.");
        } catch (error) {
            console.error("Error loading or rendering albums:", error);
        } finally {
            hideLoader(); // Always hide the loader
        }

        document.getElementById("controls-overlay").classList.remove("hidden");
        document.getElementById("controls-overlay").classList.add("visible");

        setupAlbumModal(jukeboxContract); // Set up album modal
    });
};

/**
 * Waits for albums to render in the specified container.
 * Polls the container for child elements to ensure content is loaded.
 */
async function waitForRenderedAlbums(container, timeout = 5000, interval = 200) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const intervalId = setInterval(() => {
            if (container.children.length > 0) {
                clearInterval(intervalId);
                resolve();
            } else if (Date.now() - startTime > timeout) {
                clearInterval(intervalId);
                reject(new Error("Timeout waiting for albums to render."));
            }
        }, interval);
    });
}



// updateRightLCD reveals the right lcd screen with play fees, album name, album owner, accepted tokens, and track list
// It also sets up the Play Song and Play Album buttons
// called from contract.js from inside the loadAlbums function on album click() event
export const updateRightLCD = async (jukeboxContract, albumName) => {
    const lcdRight = document.getElementById("lcd-screen-right");
    
    document.getElementById("right-lcd-buttons").classList.remove("hidden");
    document.getElementById("right-lcd-buttons").classList.add("visible");

    showLoader();

    try {
        // Fetch album details
        const details = await jukeboxContract.getAlbumDetails(albumName);
        const { cid, albumOwners, paymentTokens, playFee, wholeAlbumFee } = details;
        // console.log("Album Details:", details);
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
        // console.log("All Links:", allLinks);
            
        // Filter out every other entry to only include playable tracks
        const trackLinks = allLinks
            .filter((href, index) => validAudioExtensions.some((ext) => href.endsWith(ext)) && index % 2 === 1) // Ensure only playable tracks
        // console.log("Track Links:", trackLinks);   

        const trackNames = trackLinks.map((link, index) => {
            const decodedName = decodeURIComponent(link); // Decode URL-encoded names
            const trackNumber = index + 1; // Assign track numbers starting from 1
            return {
                name: decodedName.split("/").pop().split("?")[0], // Extract the actual file name
                number: trackNumber,
            };
        });
        // console.log("Track Names:", trackNames);
        const trackListHTML = trackNames
            .map((track) => `<tr><td>${track.number}</td><td>${track.name}</td></tr>`)
            .join("");

        // Format the owner address with icons
        const favicons = Array(4)
            .fill('<img src="https://bafybeifej4defs5s5wryxylmps42c7xkbzle3fxjgnsbb5hcfnd5b77zwa.ipfs.w3s.link/Ens_Eth_Breathe.gif" alt="icon" style="width: 12px; height: 12px;">')
            .join("");
        
        const formattedOwners = albumOwners
            .map(owner => `${owner.slice(0, 4)}...${favicons}...${owner.slice(-4)}`)
            .join("<br>");

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
                    <div>Album Name:</div>
                    ${albumName}<br>
                    Owners:<br>
                    ${formattedOwners}
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
    } finally {
        hideLoader();
    }   
};


export const setupAlbumModal = (jukeboxContract) => {
    const addAlbumModal = document.getElementById("add-album-modal");
    const modalCloseButton = document.getElementById("modal-close");
    const submitAlbumButton = document.getElementById("submit-album");

    const albumCreationFeeDisplay = document.createElement("p"); // New element to display the fee
    albumCreationFeeDisplay.id = "album-creation-fee";
    albumCreationFeeDisplay.style.color = "#96f7e5";
    albumCreationFeeDisplay.style.marginTop = "10px";
    
    // Append to modal
    document.querySelector(".modal-content").appendChild(albumCreationFeeDisplay);

    // Default token addresses
    const DEFAULT_PAYMENT_TOKENS = [
        "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC
        "0x81ccef6414d4cdbed9fd6ea98c2d00105800cd78", // SHT
        "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // MATIC
    ];

    // Show the Add Album modal and prefill payment tokens and owner address
    document.getElementById("add-album").addEventListener("click", async () => {
        try {
            const walletAddress = await window.ethereum.request({
                method: "eth_requestAccounts",
            }).then((accounts) => accounts[0]);

             // Fetch album creation fee
            const fee = await getAlbumCreationFee(jukeboxContract);
            albumCreationFeeDisplay.innerText = `Album Creation Fee: ${fee} Polygon coin`; // Update the display


            addAlbumModal.classList.remove("hidden");
            addAlbumModal.classList.add("visible");

            // Prefill fields
            document.getElementById("payment-tokens").value = DEFAULT_PAYMENT_TOKENS.join(",");
            document.getElementById("album-owner").value = walletAddress; // Prepopulate with connected wallet
        } catch (error) {
            console.error("Error fetching wallet address:", error);
            alert("Unable to fetch wallet address. Please connect your wallet.");
        }
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
        albumCreationFeeDisplay.innerText = ""; // Clear the fee display

    };

    // Validation logic
    const validateFields = () => {
        const albumName = document.getElementById("album-name").value.trim();
        const cid = document.getElementById("album-cid").value.trim();
        const ownerAddresses = document
            .getElementById("album-owner")
            .value.split(",")
            .map((address) => address.trim());
        const paymentTokens = document.getElementById("payment-tokens").value
            .trim()
            .split(",");
        const playFee = parseFloat(document.getElementById("play-fee").value.trim());
        const wholeAlbumFee = parseFloat(document.getElementById("whole-album-fee").value.trim());

        let errorMessage = "";

        if (!albumName) errorMessage = "Album name cannot be empty.";
        else if (!/^[b][a-z2-7]{58}$/.test(cid)) errorMessage = "Invalid IPFS CID.";
        else if (!ownerAddresses.every((address) => ethers.utils.isAddress(address))) {
            errorMessage = "One or more owner addresses are invalid.";
        } else if (
            !paymentTokens
                .map((token) => token.trim())
                .filter((token) => token !== "")
                .every((token) => ethers.utils.isAddress(token))
        ) {
            errorMessage = "One or more payment tokens are invalid.";
        } else if (!(playFee > 0)) errorMessage = "Play fee must be a positive number.";
        else if (!(wholeAlbumFee > 0)) errorMessage = "Whole album fee must be a positive number.";

        document.getElementById("error-message").innerText = errorMessage;
        return !errorMessage;
    };

    // Submit album logic
    submitAlbumButton.addEventListener("click", async () => {
        if (!validateFields()) return;

        const albumName = document.getElementById("album-name").value.trim();
        const cid = document.getElementById("album-cid").value.trim();
        const ownerAddresses = document
            .getElementById("album-owner")
            .value.split(",")
            .map((address) => address.trim());
        const paymentTokens = document.getElementById("payment-tokens").value
            .trim()
            .split(",")
            .map((token) => token.trim());
        const playFee = document.getElementById("play-fee").value.trim();
        const wholeAlbumFee = document.getElementById("whole-album-fee").value.trim();

        try {
            const formattedPlayFee = ethers.utils.parseUnits(playFee, 18);
            const formattedWholeAlbumFee = ethers.utils.parseUnits(wholeAlbumFee, 18);
            // Fetch the album creation fee dynamically
            const albumCreationFee = ethers.utils.parseUnits(await getAlbumCreationFee(jukeboxContract), 18);

            console.log("Adding album to contract...");
            console.log("albumName:", albumName);
            console.log("cid:", cid);
            console.log("ownerAddresses:", ownerAddresses);
            console.log("paymentTokens:", paymentTokens);
            console.log("formattedPlayFee:", formattedPlayFee.toString());
            console.log("formattedWholeAlbumFee:", formattedWholeAlbumFee.toString());
            console.log("albumCreationFee:", albumCreationFee.toString());

            const tx = await jukeboxContract.addAlbum(
                albumName,
                cid,
                ownerAddresses, // Pass multiple owners
                paymentTokens,
                formattedPlayFee,
                formattedWholeAlbumFee,
                { value: albumCreationFee } // Send album creation fee with the transaction
            );

            console.log("Transaction Hash:", tx.hash);
            alert(`Album "${albumName}" added successfully!`);

            clearModalFields();
            addAlbumModal.classList.remove("visible");
            addAlbumModal.classList.add("hidden");

            await loadAlbums(jukeboxContract); // Refresh the album list
        } catch (error) {
            console.error("Error adding album:", error);
            alert("Failed to add album. Please check console for details.");
        }
    });
};