import { loadAlbums, getAlbumCreationFee } from "./contract.js";
import { setupPlaySongButton, setupPlayAlbumButton } from "./playback.js";
import { tokenWhiteList } from "./icons.js";
import { showLoader, hideLoader, resetTrackAndTokenSelectionModal } from "./utils.js";


export const setupUI = (jukeboxContract) => {
    const enterControlsButton = document.getElementById("enter-controls");

    console.log("Connected to Jukebox Contract Address:", jukeboxContract.address);

    enterControlsButton.addEventListener("click", async () => {
        document.getElementById("landing").classList.add("hidden");
        document.getElementById("controls").classList.remove("hidden");
        
        showLoader(); // Show loader before loading albums
        
        try {
            
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
export const waitForRenderedAlbums = (container, timeout = 20000, interval = 200) => {
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
        let { cid, albumOwner, albumOwners, paymentTokens, playFee, wholeAlbumFee } = details;
        let _playFee = playFee;
        let _wholeAlbumFee = wholeAlbumFee;
        let playFeeDisplay;
        let wholeAlbumFeeDisplay;
        // if on MintMe network fetch MintMe icons, else fetch Polygon icons
        try {
            // playFee = ethers.BigNumber.from(playFee);
            // console.log("Play Fee BigN conversion:", playFee);
            if(window.chainId === 137) {
                playFee = ethers.utils.formatUnits(_playFee, 18);
                wholeAlbumFee = ethers.utils.formatUnits(_wholeAlbumFee, 18);
                playFeeDisplay = ethers.utils.formatUnits(_playFee, 18);
                wholeAlbumFeeDisplay = ethers.utils.formatUnits(_wholeAlbumFee, 18);
            } else if(window.chainId === 24734) {
                playFee = ethers.utils.formatUnits(_playFee, 18);
                wholeAlbumFee = ethers.utils.formatUnits(_wholeAlbumFee, 18);
                playFeeDisplay = ethers.utils.formatUnits(_playFee, 12);
                wholeAlbumFeeDisplay = ethers.utils.formatUnits(_wholeAlbumFee, 12);
            }

            // console.log("Play Fee:", _playFee);
            // console.log("Whole Album Fee:", _wholeAlbumFee);
            
        } catch (error) {
            console.error("Error converting playFee to BigNumber:", error);
        }

        // Match tokens listed on the album with those in the tokenWhiteList
        const selectedPaymentTokens = {};
        const networkTokens = window.chainId === 24734 ? tokenWhiteList.MintMe : tokenWhiteList.Polygon;

        console.log("Album Payment Tokens:", paymentTokens);
        console.log("Network Tokens:", networkTokens);

        // Normalize all keys in networkTokens to lowercase for lookup
        const normalizedNetworkTokens = Object.keys(networkTokens).reduce((acc, key) => {
            acc[key.toLowerCase()] = networkTokens[key];
            return acc;
        }, {});

        paymentTokens.forEach((token) => {
            const normalizedToken = token.toLowerCase(); // Normalize the token address
            if (normalizedNetworkTokens[normalizedToken]) {
                selectedPaymentTokens[token] = normalizedNetworkTokens[normalizedToken].icon; // Add icon from whitelist
            } else {
                console.warn(`Token ${token} is listed for the album but not found in tokenWhiteList.`);
            }
        });

        console.log("Filtered Selected Payment Tokens:", selectedPaymentTokens);
                    
        // Fetch all icon URLs to ensure they're available
        const fetchedIcons = await Promise.all(
            Object.entries(selectedPaymentTokens).map(async ([token, url]) => {
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

        // // Extract all links from the directory
        // const validAudioExtensions = [".mp3", ".wav", ".ogg", ".flac", ".m4a", ".mp4"];
        const allLinks = Array.from(doc.querySelectorAll("a[href]"))
            .map((link) => link.getAttribute("href"));
        // console.log("All Links:", allLinks);
            
  
        // Valid extensions
        const validAudioExtensions = [".mp3", ".wav", ".m4a", ".mp4", ".aac", ".mov"];

        // Filter track links with improved handling
        const trackLinks = allLinks.filter((href, index) => {
            // Decode the href and remove query parameters for extension checking
            const decodedHref = decodeURIComponent(href.split('?')[0]);
            // console.log("Decoded Href:", decodedHref);
            // Check if decodedHref ends with any valid extension
            const isAudio = validAudioExtensions.some(ext => decodedHref.toLowerCase().endsWith(ext));
            return isAudio && index % 2 === 1; // Your existing logic for selecting every other link
        });

        // Extract track names
        const trackNames = trackLinks.map((link, index) => {
            const decodedName = decodeURIComponent(link);
            // console.log("Decoded Name:", decodedName);
            const fileName = decodedName.split("/").pop().split("?")[0]; // Extracts the actual file name
            const trackNumber = index + 1;
            return {
                name: fileName,  // Now contains spaces properly
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
        
        // Format the owner addresses
        const formattedOwners = Array.isArray(albumOwners)
            ? albumOwners
                .map(owner => `${owner.slice(0, 4)}...${favicons}...${owner.slice(-4)}`)
                .join("<br>") // Process as an array
            : `${albumOwner.slice(0, 4)}...${favicons}...${albumOwner.slice(-4)}`; // Process as a single address

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
                        <td style="padding: 5px;">${playFeeDisplay}</td>
                        <td style="padding: 5px;">${wholeAlbumFeeDisplay}</td>
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
        
        // if on mintme net
        if (window.chainId === 24734) {
            // make playFee and albumFee BigNumbers for the contract
            playFee = ethers.utils.parseUnits(playFee, 18).toString();
            wholeAlbumFee = ethers.utils.parseUnits(wholeAlbumFee, 18).toString();
            // console.log("Play Fee on MintMe:", playFee);
            // console.log("Whole Album Fee on MintMe:", wholeAlbumFee);
        }else if (window.chainId === 137) {
            // make playFee and albumFee BigNumbers for the contract
            playFee = ethers.utils.parseUnits(playFee, 18).toString();
            wholeAlbumFee = ethers.utils.parseUnits(wholeAlbumFee, 18).toString();
            // console.log("Play Fee on Polygon:", playFee);
            // console.log("Whole Album Fee on Polygon:", wholeAlbumFee);
        }
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

    // Check if the fee display element already exists
    let albumCreationFeeDisplay = document.getElementById("album-creation-fee");
    if (!albumCreationFeeDisplay) {
        albumCreationFeeDisplay = document.createElement("p"); // New element to display the fee
        albumCreationFeeDisplay.id = "album-creation-fee";
        albumCreationFeeDisplay.style.color = "#96f7e5";
        albumCreationFeeDisplay.style.marginTop = "10px";

        // Append to modal
        document.querySelector(".modal-content").appendChild(albumCreationFeeDisplay);
    }
    // Append to modal
    document.querySelector(".modal-content").appendChild(albumCreationFeeDisplay);

    // Default tokens for Polygon and MintMe
    const DEFAULT_TOKENS_POLYGON = [
        "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC
        "0x81ccef6414d4cdbed9fd6ea98c2d00105800cd78", // SHT
        "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // MATIC
    ];

    const DEFAULT_TOKENS_MINTME = [
        "0x969d65ee0823f9c892bdfe3c462d91ab1d278b4e", // DecentSmartHomes
        "0x25396c06fEf8b79109da2a8e237c716e202489EC", // MTCG
        "0x2f9C7A6ff391d0b6D5105F8e37F2050649482c75", // Bobdubbloon
        "0x3C20f6fC8adCb39769E307a8B3a5109a3Ff97933", // withinthevacuum
        "0xCbc63Dcc51679aDf0394AB2be1318034193003B6", // eclipsingbinary
        "0x72E39206C19634d43f699846Ec1db2ACd69513e4", // satorid
        "0x149D5555387cb7d26cB07622cC8898c852895421"  // dwmw
    ];

    // Show the Add Album modal and prefill payment tokens and owner address
    document.getElementById("add-album").addEventListener("click", async () => {

        albumCreationFeeDisplay.innerText = ""; // Clear the fee display

        try {
            
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();

            let feeLabel;
            let defaultTokens;

            // Check network and update labels/tokens
            if (network.chainId === 24734) { // MintMe Network
                feeLabel = "1 MintMe Coin";
                defaultTokens = DEFAULT_TOKENS_MINTME;
            } else if (network.chainId === 137) { // Polygon Network
                feeLabel = "1 Polygon Coin";
                defaultTokens = DEFAULT_TOKENS_POLYGON;
            } else {
                alert("Unsupported network! Please switch to MintMe or Polygon.");
                return;
            }

            const walletAddress = await window.ethereum.request({
                method: "eth_requestAccounts",
            }).then((accounts) => accounts[0]);

            // Fetch album creation fee
            const fee = await jukeboxContract.albumCreationFee();
            albumCreationFeeDisplay.innerText = `Album Creation Fee: ${feeLabel}`;

            addAlbumModal.classList.remove("hidden");
            addAlbumModal.classList.add("visible");

            // Prefill fields
            document.getElementById("payment-tokens").value = defaultTokens.join(",");
            document.getElementById("album-owner").value = walletAddress;
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
            let formattedPlayFee;
            let formattedWholeAlbumFee;
            if(window.chainId === 137) {
                formattedPlayFee = ethers.utils.parseUnits(playFee, 18);
                formattedWholeAlbumFee = ethers.utils.parseUnits(wholeAlbumFee, 18);
            } else if(window.chainId === 24734) {
                formattedPlayFee = ethers.utils.parseUnits(playFee, 12);
                formattedWholeAlbumFee = ethers.utils.parseUnits(wholeAlbumFee, 12);
            }
            console.log("Adding album to contract...");
            console.log("albumName:", albumName);
            console.log("cid:", cid);
            console.log("ownerAddresses:", ownerAddresses);
            console.log("paymentTokens:", paymentTokens);
            console.log("formattedPlayFee:", formattedPlayFee.toString());
            console.log("formattedWholeAlbumFee:", formattedWholeAlbumFee.toString());

            const tx = await jukeboxContract.addAlbum(
                albumName,
                cid,
                ownerAddresses, // Pass multiple owners
                paymentTokens,
                formattedPlayFee,
                formattedWholeAlbumFee,
                { value: ethers.utils.parseUnits("1", 18) } // Send album creation fee
            );

            console.log("Transaction Hash:", tx.hash);
            
            // Wait for 3 seconds before loading albums
            showLoader();
            setTimeout(async () => {
                console.log("Refreshing album list after 3 seconds...");
            
                await loadAlbums(jukeboxContract); // Reload albums on the left LCD screen
                alert(`Album "${albumName}" added successfully!`);

            }, 3000); // 3000 milliseconds = 3 seconds
            hideLoader();
            clearModalFields();
            addAlbumModal.classList.remove("visible");
            addAlbumModal.classList.add("hidden");

        } catch (error) {
            console.error("Error adding album:", error);
            // alert("Failed to add album. Please check console for details.");
        }
    });
};
