import { loadIcons } from "./icons.js";
import { showTrackAndTokenSelectionModal, ShowTokenSelectionModal } from "./modals.js";
import { approveToken } from "./contract.js";
import { hideLoader, showLoader } from "./utils.js";



export const setupPlaySongButton = async (jukeboxContract, albumName, paymentTokens, playFee, albumCID) => {
    const playSongButton = document.getElementById("play-song");
    const controlsView = document.getElementById("controls");
    const recordView = document.getElementById("record");
    const backToControlsButton = document.getElementById("back-to-controls");
    let mediaPlayer = null; // This will handle both audio and video players

    // Fetch icons for tokens
    const fetchedIcons = await loadIcons(paymentTokens);
    console.log("Right LCD Payment Tokens:", paymentTokens);
    console.log("Fetched Icons:", fetchedIcons);

    playSongButton.addEventListener("click", async () => {
        
        try {
            // Extract the track list from the right LCD screen
            const trackRows = Array.from(document.querySelectorAll("#lcd-screen-right table tr"))
                .slice(1) // Skip the header row
                .filter((row) => {
                    const trackNameCell = row.querySelector("td:nth-child(2)");
                    return (
                        trackNameCell &&
                        trackNameCell.innerText.trim() !== "" &&
                        isNaN(trackNameCell.innerText.trim()) &&
                        !trackNameCell.innerText.toLowerCase().includes("album play price")
                    ); // Exclude invalid or unwanted rows
                });

            const trackList = trackRows.map((row) =>
                row.querySelector("td:nth-child(2)").innerText.trim()
            );

            if (trackList.length === 0) {
                alert("No tracks available to play.");
                return;
            }

            // Show the combined modal for track and token selection
            const { trackNumber, token } = await showTrackAndTokenSelectionModal(trackList, fetchedIcons);

            console.log(`Selected track: ${trackNumber}, Selected token: ${token}`);

            showLoader(); // Show loader while processing
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

            hideLoader(); // Hide loader after processing

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
                    const fileExtension = trackFilename.split('.').pop().toLowerCase(); // Get file extension
                    const blobUrl = URL.createObjectURL(blob);

                    // Check the file type and play in appropriate player
                    if (fileExtension === "mp4") {
                        // Play in video player
                        const videoPlayer = document.getElementById("video-player");
                        videoPlayer.src = blobUrl;
                        videoPlayer.classList.remove("hidden");
                        videoPlayer.play()
                            .then(() => {
                                console.log("Video is playing.");
                                controlsView.classList.add("hidden");
                                recordView.classList.remove("hidden");
                            })
                            .catch((error) => {
                                console.error("Error playing video:", error);
                            });

                        // Set the mediaPlayer to videoPlayer for consistent stop behavior
                        mediaPlayer = videoPlayer;

                        videoPlayer.onended = () => {
                            URL.revokeObjectURL(blobUrl); // Clean up blob URL
                        };
                    } else {
                        // Play in audio player
                        const audioPlayer = document.getElementById("audio-player");
                        audioPlayer.src = blobUrl;
                        audioPlayer.classList.remove("hidden");
                        audioPlayer.play()
                            .then(() => {
                                console.log("Audio is playing.");
                                controlsView.classList.add("hidden");
                                recordView.classList.remove("hidden");
                            })
                            .catch((error) => {
                                console.error("Error playing audio:", error);
                            });

                        // Set the mediaPlayer to audioPlayer for consistent stop behavior
                        mediaPlayer = audioPlayer;

                        audioPlayer.onended = () => {
                            URL.revokeObjectURL(blobUrl); // Clean up blob URL
                        };
                    }
                })
                .catch((error) => {
                    console.error("Fetch error:", error);
                    alert("Failed to play the media file. Please contact support.");
                });
        } catch (error) {
            console.error("Error playing track:", error);
        }
    });

    // Handle exiting the record spin view
    backToControlsButton.addEventListener("click", () => {
        recordView.classList.add("hidden");
        controlsView.classList.remove("hidden");
        if (mediaPlayer) {
            mediaPlayer.pause(); // Pause the media when exiting
            mediaPlayer.classList.add("hidden");
        }
    });
};



export const setupPlayAlbumButton = (jukeboxContract, albumName, acceptedTokens, wholeAlbumFee, cid) => {
    const playAlbumButton = document.getElementById("play-album");
    const controlsView = document.getElementById("controls");
    const recordView = document.getElementById("record");
    const backToControlsButton = document.getElementById("back-to-controls");
    let audioPlayer = null;
    let currentTrackIndex = 0;
    let isPlayingAlbum = false;

    playAlbumButton.addEventListener("click", async () => {
        try {
            console.log("Initiating Play Album...");
            console.log("Accepted tokens for album:", acceptedTokens);

            // Show the modal for token selection
            const { token } = await ShowTokenSelectionModal(acceptedTokens);

            console.log(`Selected token for album playback: ${token}`);


            // Fetch track list
            const trackRows = Array.from(document.querySelectorAll("#lcd-screen-right table tr"))
                .slice(1) // Skip the header row
                .filter((row) => {
                    const trackNameCell = row.querySelector("td:nth-child(2)");
                    return (
                        trackNameCell &&
                        trackNameCell.innerText.trim() !== "" &&
                        isNaN(trackNameCell.innerText.trim()) &&
                        !trackNameCell.innerText.toLowerCase().includes("album play price")
                    ); // Exclude invalid or unwanted rows
            });

            const trackList = trackRows.map((row) => row.querySelector("td:nth-child(2)").innerText.trim());
            
            console.log("Track list for album playback:", trackList);

            if (trackList.length === 0) {
                alert("No tracks available to play.");
                return;
            }

            showLoader(); // Show loader while processing  

            // Approve the token
            console.log(`Approving token ${token} for album playback...`);
            await approveToken(token, jukeboxContract.address, wholeAlbumFee);

            // Call contract to play album
            console.log(`Playing entire album: "${albumName}"`);
            const tx = await jukeboxContract.playAlbum(albumName, token, {
                gasLimit: ethers.utils.hexlify(300000),
            });

            console.log("Transaction Hash:", tx.hash);
            await tx.wait();

            alert(`Album "${albumName}" is now playing. Payment successful!`);

            hideLoader(); // Hide loader after processing

            controlsView.classList.add("hidden");
            recordView.classList.remove("hidden");

            // Start playing album tracks
            isPlayingAlbum = true;
            currentTrackIndex = 0;


            playNextTrack(trackList, cid);
        } catch (error) {
            console.error("Error playing album:", error);
        }
    });

    const playNextTrack = async (trackList, cid) => {
        if (!isPlayingAlbum || currentTrackIndex >= trackList.length) {
            console.log("Album playback completed.");
            isPlayingAlbum = false;
            currentTrackIndex = 0;
            return;
        }

        const trackFilename = trackList[currentTrackIndex];
        const trackUrl = `https://${cid}.ipfs.w3s.link/${trackFilename}`;

        try {
            const response = await fetch(trackUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch track: ${response.statusText}`);
            }

            const blob = await response.blob();
            const correctedBlob = new Blob([blob], { type: "audio/mp4" });
            const blobUrl = URL.createObjectURL(correctedBlob);

            if (audioPlayer) {
                audioPlayer.pause();
                URL.revokeObjectURL(audioPlayer.src);
            }

            audioPlayer = new Audio(blobUrl);

            audioPlayer.play();
            audioPlayer.onended = () => {
                currentTrackIndex++;
                playNextTrack(trackList, cid);
            };
            audioPlayer.onerror = () => {
                console.error(`Error playing track ${currentTrackIndex + 1}. Skipping...`);
                currentTrackIndex++;
                playNextTrack(trackList, cid);
            };
        } catch (error) {
            console.error(`Error playing track ${currentTrackIndex + 1}:`, error);
            currentTrackIndex++;
            playNextTrack(trackList, cid);
        }
    };

    // Handle exiting the record spin view
    backToControlsButton.addEventListener("click", () => {
        recordView.classList.add("hidden");
        controlsView.classList.remove("hidden");

    });

};