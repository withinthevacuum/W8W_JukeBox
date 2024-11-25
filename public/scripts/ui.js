import { loadAlbums, addAlbumToContract, playSong, approveToken } from "./contract.js";

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
                alert("Failed to load albums. Please check console for details.");
            }
        } catch (error) {
            console.error("Error adding album:", error);
            alert("Failed to add album. Please check console for details.");
        }
    });
};

const icons = {
    "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359": "https://bafybeiag2css4im6d7fdtcafwabw2qau46yrzhn4z23hwhsft2e3faa2fy.ipfs.w3s.link/USDC_of_the_future.png", // USDC
    "0x81ccef6414d4cdbed9fd6ea98c2d00105800cd78": "https://bafybeigr6ri2ythjbciusgjdvimjt74caymflc5ut4rmtrkhcoi2cr53ua.ipfs.w3s.link/DecentSmartHome.png", // SHT
    "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270": "https://bafybeic5bvnkjejuxbogn2n7lyzfyf5l6glgzrxkidjwj4yvhyci5haoca.ipfs.w3s.link/PolygonLogo.png" // MATIC
};



const resetAudioContext = () => {
    if (window.audioContext) {
        window.audioContext.close();
        console.log("Audio context closed.");
    }
    console.log("Creating new AudioContext...");
    window.audioContext = new (window.AudioContext || window.webkitAudioContext )();
};

// token selection modal used in play song and play album to select token to pay with
const showTrackAndTokenSelectionModal = async (trackList, paymentTokens, icons) => {
    return new Promise(async (resolve, reject) => {
        const modal = document.getElementById("track-token-selection-modal");
        const overlay = document.getElementById("modal-overlay"); // Reference to the overlay
        const trackListContainer = document.getElementById("track-list");
        const tokenListContainer = document.getElementById("token-list");
        const confirmButton = document.getElementById("confirm-selection");
        const cancelButton = document.getElementById("cancel-selection");
        modal.classList.remove("hidden"); // Show the modal

        // Clear existing content
        trackListContainer.innerHTML = "";
        tokenListContainer.innerHTML = "";

        // Populate the track list
        trackList.forEach((track, index) => {
            const trackItem = document.createElement("div");
            trackItem.className = "track-item";
            trackItem.dataset.trackNumber = index;
            trackItem.innerText = `Track ${index + 1}: ${track}`;
            trackItem.addEventListener("click", () => {
                document.querySelectorAll(".track-item").forEach((item) => item.classList.remove("selected"));
                trackItem.classList.add("selected");
            });
            trackListContainer.appendChild(trackItem);
        });

        // Fetch and populate token icons
        const fetchedIcons = await Promise.all(
            paymentTokens.map(async (token) => {
                try {
                    const url = icons[token];
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch icon for ${token}: ${response.statusText}`);
                    }
                    return { token, url };
                } catch (error) {
                    console.error(`Error fetching icon for ${token}:`, error);
                    return { token, url: "" };
                }
            })
        );

        fetchedIcons.forEach(({ token, url }) => {
            const tokenItem = document.createElement("div");
            tokenItem.className = "token-item";
            tokenItem.dataset.tokenAddress = token;
            tokenItem.innerHTML = `
                <img src="${url || 'https://bafybeifej4defs5s5wryxylmps42c7xkbzle3fxjgnsbb5hcfnd5b77zwa.ipfs.w3s.link/Ens_Eth_Breathe.gif'}" alt="${token}" style="width: 30px; height: 30px; margin-right: 10px;">
                <span>${token}</span>
            `;
            tokenItem.addEventListener("click", () => {
                document.querySelectorAll(".token-item").forEach((item) => item.classList.remove("selected"));
                tokenItem.classList.add("selected");
            });
            tokenListContainer.appendChild(tokenItem);
        });

        // Show the modal and overlay
        modal.classList.remove("hidden");
        overlay.classList.add("active");

        // Handle confirm button
        confirmButton.addEventListener("click", () => {
            const selectedTrack = document.querySelector(".track-item.selected");
            const selectedToken = document.querySelector(".token-item.selected");
            if (!selectedTrack || !selectedToken) {
                alert("Please select both a track and a payment token.");
                return;
            }
            modal.classList.add("hidden");
            overlay.classList.remove("active"); // Hide overlay
            resolve({
                trackNumber: parseInt(selectedTrack.dataset.trackNumber, 10),
                token: selectedToken.dataset.tokenAddress
            });
        });

        // Handle cancel button
        cancelButton.addEventListener("click", () => {
            modal.classList.add("hidden");
            overlay.classList.remove("active"); // Hide overlay
            reject("Selection canceled");
        });

        // Handle outside click
        overlay.addEventListener("click", () => {
            modal.classList.add("hidden");
            overlay.classList.remove("active"); // Hide overlay
            reject("Selection canceled");
        });
    });
};


export const setupPlaySongButton = async (jukeboxContract, albumName, paymentTokens, playFee, albumCID) => {
    const playSongButton = document.getElementById("play-song");
    const controlsView = document.getElementById("controls");
    const recordView = document.getElementById("record");
    const backToControlsButton = document.getElementById("back-to-controls");
    let audioPlayer = null;

    const icons = {
        "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359": "https://bafybeiag2css4im6d7fdtcafwabw2qau46yrzhn4z23hwhsft2e3faa2fy.ipfs.w3s.link/USDC_of_the_future.png", // USDC
        "0x81ccef6414d4cdbed9fd6ea98c2d00105800cd78": "https://bafybeigr6ri2ythjbciusgjdvimjt74caymflc5ut4rmtrkhcoi2cr53ua.ipfs.w3s.link/DecentSmartHome.png", // SHT
        "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270": "https://bafybeic5bvnkjejuxbogn2n7lyzfyf5l6glgzrxkidjwj4yvhyci5haoca.ipfs.w3s.link/PolygonLogo.png" // MATIC
    };

    const showTrackAndTokenSelectionModal = async (trackList, paymentTokens, icons) => {
        return new Promise(async (resolve, reject) => {
            const modal = document.getElementById("track-token-selection-modal");
            const trackListContainer = document.getElementById("track-list");
            const tokenListContainer = document.getElementById("token-list");
            const confirmButton = document.getElementById("confirm-selection");
            const cancelButton = document.getElementById("cancel-selection");

            // Clear existing content
            trackListContainer.innerHTML = "";
            tokenListContainer.innerHTML = "";

            // Populate the track list
            trackList.forEach((track, index) => {
                const trackItem = document.createElement("div");
                trackItem.className = "track-item";
                trackItem.dataset.trackNumber = index;
                trackItem.innerText = `Track ${index + 1}: ${track}`;
                trackItem.addEventListener("click", () => {
                    document.querySelectorAll(".track-item").forEach((item) => item.classList.remove("selected"));
                    trackItem.classList.add("selected");
                });
                trackListContainer.appendChild(trackItem);
            });

            // Fetch and populate token icons
            const fetchedIcons = await Promise.all(
                paymentTokens.map(async (token) => {
                    try {
                        const url = icons[token];
                        const response = await fetch(url);
                        if (!response.ok) {
                            throw new Error(`Failed to fetch icon for ${token}: ${response.statusText}`);
                        }
                        return { token, url };
                    } catch (error) {
                        console.error(`Error fetching icon for ${token}:`, error);
                        return { token, url: "" };
                    }
                })
            );

            fetchedIcons.forEach(({ token, url }) => {
                const tokenItem = document.createElement("div");
                tokenItem.className = "token-item";
                tokenItem.dataset.tokenAddress = token;
                tokenItem.innerHTML = `
                    <img src="${url || 'https://bafybeifej4defs5s5wryxylmps42c7xkbzle3fxjgnsbb5hcfnd5b77zwa.ipfs.w3s.link/Ens_Eth_Breathe.gif'}" alt="${token}" style="width: 30px; height: 30px; margin-right: 10px;">
                    <span>${token}</span>
                `;
                tokenItem.addEventListener("click", () => {
                    document.querySelectorAll(".token-item").forEach((item) => item.classList.remove("selected"));
                    tokenItem.classList.add("selected");
                });
                tokenListContainer.appendChild(tokenItem);
            });

            // Show the modal
            modal.classList.remove("hidden");

            // Handle confirm button
            confirmButton.addEventListener("click", () => {
                const selectedTrack = document.querySelector(".track-item.selected");
                const selectedToken = document.querySelector(".token-item.selected");
                if (!selectedTrack || !selectedToken) {
                    alert("Please select both a track and a payment token.");
                    return;
                }
                modal.classList.add("hidden");
                resolve({
                    trackNumber: parseInt(selectedTrack.dataset.trackNumber, 10),
                    token: selectedToken.dataset.tokenAddress
                });
            });

            // Handle cancel button
            cancelButton.addEventListener("click", () => {
                modal.classList.add("hidden");
                reject("Selection canceled");
            });

            // Handle outside click
            window.addEventListener("click", (event) => {
                if (event.target === modal) {
                    modal.classList.add("hidden");
                    reject("Selection canceled");
                }
            });
        });
    };

    playSongButton.addEventListener("click", async () => {
        try {
            // Extract the track list from the right LCD screen
            const trackRows = Array.from(document.querySelectorAll("#lcd-screen-right table tr"))
                .filter((row) => {
                    // Filter out any rows that don't contain valid track data
                    const trackNameCell = row.querySelector("td:nth-child(2)");
                    return trackNameCell && trackNameCell.innerText.trim() !== "" && isNaN(trackNameCell.innerText.trim());
                });

            const trackList = trackRows.map((row) => row.querySelector("td:nth-child(2)").innerText.trim());

            if (trackList.length === 0) {
                alert("No tracks available to play.");
                return;
            }

            // Show the combined modal for track and token selection
            const { trackNumber, token } = await showTrackAndTokenSelectionModal(trackList, paymentTokens, icons);

            console.log(`Selected track: ${trackNumber}, Selected token: ${token}`);

            // Approve the token for spending
            console.log(`Approving token ${token} for spending...`);
            await approveToken(token, jukeboxContract.address, playFee);

            // Call the contract function to play the song
            console.log(`Playing track ${trackNumber + 1} from album "${albumName}"...`);
            const tx = await jukeboxContract.playSong(albumName, trackNumber, token, {
                gasLimit: ethers.utils.hexlify(300000),
            });

            console.log("Transaction Hash:", tx.hash);
            await tx.wait();

            alert(`Track ${trackNumber + 1} is now playing! Payment successful.`);

            // Extract the track filename
            const trackFilename = trackList[trackNumber];
            const trackUrl = `https://${albumCID}.ipfs.w3s.link/${trackFilename}`;

            // Fetch the file and play it
            fetch(trackUrl)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Network response was not ok: ${response.statusText}`);
                    }
                    return response.blob();
                })
                .then((blob) => {
                    const correctedBlob = new Blob([blob], { type: "audio/mp4" });
                    const blobUrl = URL.createObjectURL(correctedBlob);

                    const audioPlayer = document.getElementById("audio-player");
                    audioPlayer.src = blobUrl;

                    audioPlayer.play()
                        .then(() => {
                            console.log("Audio is playing.");
                            controlsView.classList.add("hidden");
                            recordView.classList.remove("hidden");
                        })
                        .catch((error) => {
                            console.error("Error playing audio:", error);
                        });

                    audioPlayer.onended = () => {
                        URL.revokeObjectURL(blobUrl); // Clean up blob URL
                    };
                })
                .catch((error) => {
                    console.error("Fetch error:", error);
                    alert("Failed to play the audio blob.");
                });
        } catch (error) {
            console.error("Error playing track:", error);
            alert("Failed to play track. Please check console for details.");
        }
    });

    // Handle exiting the record spin view
    backToControlsButton.addEventListener("click", () => {
        recordView.classList.add("hidden");
        controlsView.classList.remove("hidden");
        if (audioPlayer) {
            audioPlayer.pause(); // Pause the audio when exiting
        }
    });
};

export const setupPlayAlbumButton = (jukeboxContract, albumName, acceptedTokens, wholeAlbumFee, cid) => {
    const playAlbumButton = document.getElementById("play-album");
    const controlsView = document.getElementById("controls");
    const recordView = document.getElementById("record");
    const backToControlsButton = document.getElementById("back-to-controls");
    let audioPlayer = null; // Persist audio player across views
    let currentTrackIndex = 0; // Track the current track being played
    let isPlayingAlbum = false; // Flag to indicate album playback

    playAlbumButton.addEventListener("click", async () => {
        const trackRows = document.querySelectorAll("#lcd-screen-right table tr:not(:first-child)");
        const trackList = Array.from(trackRows).slice(1);

        if (trackList.length === 0) {
            alert("No tracks available to play.");
            return;
        }

        const tokenOptions = acceptedTokens.map((token, index) => `${index + 1}. ${token}`).join("\n");
        const tokenIndex = parseInt(prompt(`Select a token to pay with:\n${tokenOptions}`)) - 1;

        if (isNaN(tokenIndex) || tokenIndex < 0 || tokenIndex >= acceptedTokens.length) {
            alert("Invalid token selection. Please try again.");
            return;
        }

        const selectedToken = acceptedTokens[tokenIndex];

        try {
            console.log(`Approving token ${selectedToken} for spending...`);
            await approveToken(selectedToken, jukeboxContract.address, wholeAlbumFee);

            console.log(`Playing entire album "${albumName}"...`);
            const tx = await jukeboxContract.playAlbum(albumName, selectedToken, {
                gasLimit: ethers.utils.hexlify(300000),
            });

            console.log("Transaction Hash:", tx.hash);
            await tx.wait();

            alert(`Playing entire album "${albumName}". Payment successful.`);

            controlsView.classList.add("hidden");
            recordView.classList.remove("hidden");

            // Start playing the album
            isPlayingAlbum = true;
            playNextTrack(trackList, cid);
        } catch (error) {
            console.error("Error playing album:", error);
            alert("Failed to play album. Please check console for details.");
        }
    });

    const playNextTrack = async (trackList, cid) => {
        if (!isPlayingAlbum || currentTrackIndex >= trackList.length) {
            console.log("Album playback completed.");
            isPlayingAlbum = false;
            currentTrackIndex = 0;
            return;
        }

        const trackFilename = trackList[currentTrackIndex].querySelector("td:nth-child(2)").innerText.trim();
        const trackUrl = `https://${cid}.ipfs.w3s.link/${trackFilename}`;

        try {
            const response = await fetch(trackUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch track: ${response.statusText}`);
            }

            const blob = await response.blob();
            const correctedBlob = new Blob([blob], { type: 'audio/mp4' });
            const blobUrl = URL.createObjectURL(correctedBlob);

            if (audioPlayer) {
                audioPlayer.pause();
                audioPlayer = null;
            }

            audioPlayer = new Audio(blobUrl);

            audioPlayer.play();
            audioPlayer.onended = () => {
                URL.revokeObjectURL(blobUrl);
                currentTrackIndex++;
                playNextTrack(trackList, cid); // Play the next track
            };
            audioPlayer.onerror = () => {
                console.error(`Error playing track ${currentTrackIndex + 1}. Skipping...`);
                currentTrackIndex++;
                playNextTrack(trackList, cid); // Skip to the next track
            };
        } catch (error) {
            console.error(`Error playing track ${currentTrackIndex + 1}:`, error);
            currentTrackIndex++;
            playNextTrack(trackList, cid); // Skip to the next track
        }
    };

    backToControlsButton.addEventListener("click", () => {
        recordView.classList.add("hidden");
        controlsView.classList.remove("hidden");
        // Do not pause audio player when navigating back to controls view
    });
};