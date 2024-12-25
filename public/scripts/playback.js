import { loadIcons } from "./icons.js";
import { showTrackAndTokenSelectionModal, ShowTokenSelectionModal } from "./modals.js";
import { approveToken } from "./contract.js";
import { hideLoader, showLoader, resetTrackAndTokenSelectionModal } from "./utils.js";



export const setupPlaySongButton = async (jukeboxContract, albumName, paymentTokens, playFee, albumCID) => {
    const playSongButton = document.getElementById("play-song");
    const controlsView = document.getElementById("controls");
    const recordView = document.getElementById("record");
    const backToControlsButton = document.getElementById("back-to-controls");
    let mediaPlayer = null; // This will handle both audio and video players
    // console.log("PlaySong button is rendered.")
    // Fetch icons for tokens
    // console.log("Payment Tokens:", paymentTokens);
    // const fetchedIcons = await loadIcons(paymentTokens);
    // console.log("Right LCD Payment Tokens:", paymentTokens);
    // console.log("Fetched Icons:", fetchedIcons);

    playSongButton.addEventListener("click", async () => {
        // console.log("playSong button clicked");

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
            const { trackNumber, token } = await showTrackAndTokenSelectionModal(trackList, paymentTokens);

            // console.log(`Selected track: ${trackNumber}, Selected token: ${token}`);

            showLoader(); // Show loader while processing

            // Approve the token for spending
            // console.log(`Approving token ${token} for spending...`);

            try {

                await approveToken(token, jukeboxContract.address, playFee);

            } catch (error) {
                console.error("Error approving token:", error);
                alert("Failed to approve token for spending. Please try again.");
                hideLoader(); // Hide loader after processing
                resetTrackAndTokenSelectionModal(); // Reset modal on failure
                return;
            }

            try {
                // Call the contract function to play the song
                console.log(`Playing track ${trackNumber + 1} from album "${albumName}"...`);
                // console.log(`Sending payment ${token}...`);
                const tx = await jukeboxContract.playSong(albumName, trackNumber, token, {
                    gasLimit: ethers.utils.hexlify(500000),
                });

                console.log("Transaction Hash:", tx.hash);
                await tx.wait();
            } catch (error) {
                console.error("Error playing track:", error);
                // alert("Failed to play the track. Please try again.");
                hideLoader(); // Hide loader after processing
                resetTrackAndTokenSelectionModal(); // Reset modal on failure
                return;
            }

            console.log(`Track ${trackNumber + 1} is now playing! Payment successful.`);

            // hideLoader(); // Hide loader after processing

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
                    if (fileExtension === "mp4" || fileExtension === "mov" || fileExtension === "wma" || fileExtension === "mkv") {
                        // log the file
                        console.log("Playing video file: ", trackUrl);
                        // Play in video player
                        const videoPlayer = document.getElementById("video-player");
                        videoPlayer.src = blobUrl;
                        videoPlayer.classList.remove("hidden");
                        videoPlayer.play()
                            .then(() => {
                                console.log("Video is playing.");
                                controlsView.classList.add("hidden");
                                recordView.classList.remove("hidden");
                                resetTrackAndTokenSelectionModal(); // Reset modal state
                            })
                            .catch((error) => {
                                console.error("Error playing video:", error);
                            });
                        hideLoader(); 

                        // Set the mediaPlayer to videoPlayer for consistent stop behavior
                        mediaPlayer = videoPlayer;

                        videoPlayer.onended = () => {
                            URL.revokeObjectURL(blobUrl); // Clean up blob URL
                            videoPlayer.classList.add("hidden");
                            controlsView.classList.remove("hidden");
                            recordView.classList.add("hidden");
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
                        hideLoader(); // Hide loader after processing

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
        } finally {
            resetTrackAndTokenSelectionModal(); // Ensure modal is reset
            hideLoader(); // Always hide the loader
        }
    });

    // Handle exiting the record spin view
    backToControlsButton.addEventListener("click", () => {
        recordView.classList.add("hidden");
        controlsView.classList.remove("hidden");
        if (mediaPlayer) {
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
    let videoPlayer = null;
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
                resetTrackAndTokenSelectionModal(); // Reset modal state
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

            console.log(`Album "${albumName}" is now playing. Payment successful!`);


            controlsView.classList.add("hidden");
            recordView.classList.remove("hidden");

            // Start playing album tracks
            isPlayingAlbum = true;
            currentTrackIndex = 0;

            playNextTrack(trackList, cid);
        } catch (error) {
            console.error("Error playing album:", error);
            // alert("An error occurred while playing the album. Please try again.");
        } finally {
            resetTrackAndTokenSelectionModal(); // Always reset the modal state
            hideLoader(); // Ensure the loader is hidden
        }
    });

    const playNextTrack = async (trackList, cid) => {
        showLoader(); // Show loader while processing

        // Stop playback if album playback is completed
        if (!isPlayingAlbum || currentTrackIndex >= trackList.length) {
            console.log("Album playback completed.");
            isPlayingAlbum = false;
            currentTrackIndex = 0;

            // Hide players and views, show controls view
            if (audioPlayer) {
                audioPlayer.pause();
                URL.revokeObjectURL(audioPlayer.src);
                audioPlayer = null;
            }
            if (videoPlayer) {
                videoPlayer.pause();
                URL.revokeObjectURL(videoPlayer.src);
                videoPlayer.classList.add("hidden");
                videoPlayer = null;
            }
            document.getElementById("record").classList.add("hidden");
            document.getElementById("controls").classList.remove("hidden");
            document.getElementById("video-player").classList.add("hidden");

            hideLoader(); // Ensure loader is hidden after cleanup
            return;
        }
        const trackFilename = trackList[currentTrackIndex];
        const trackUrl = `https://${cid}.ipfs.w3s.link/${trackFilename}`;
        const fileExtension = trackFilename.split('.').pop().toLowerCase(); // Get the file extension

        try {
            showLoader(); // Show loader while processing
            const response = await fetch(trackUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch track: ${response.statusText}`);
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            // Clean up previous player instance
            if (audioPlayer) {
                audioPlayer.pause();
                URL.revokeObjectURL(audioPlayer.src);
                audioPlayer = null;
            }
            if (videoPlayer) {
                videoPlayer.pause();
                URL.revokeObjectURL(videoPlayer.src);
                videoPlayer.classList.add("hidden");
                videoPlayer = null;
            }

            // Check file type and play in the appropriate player
            if (["mp4", "mkv", "mov", "wma"].includes(fileExtension)) {
                // Video playback
                const videoPlayer = document.getElementById("video-player");
                videoPlayer.src = blobUrl;
                videoPlayer.classList.remove("hidden");
                videoPlayer.play()
                    .then(() => {
                        console.log(`Playing video track: ${trackFilename}`);
                        hideLoader(); // Hide loader after video starts
                    })
                    .catch((error) => {
                        console.error("Error playing video:", error);
                        hideLoader(); // Ensure loader is hidden on error
                    });

                videoPlayer.onended = () => {
                    console.log("Video ended. Moving to next track.");
                    URL.revokeObjectURL(blobUrl); // Clean up blob URL
                    currentTrackIndex++;
                    playNextTrack(trackList, cid); // Play the next track
                };
            } else {
                // Audio playback
                audioPlayer = new Audio(blobUrl);
                audioPlayer.play()
                    .then(() => {
                        console.log(`Playing audio track: ${trackFilename}`);
                        hideLoader(); // Hide loader after audio starts
                    })
                    .catch((error) => {
                        console.error("Error playing audio:", error);
                        hideLoader(); // Ensure loader is hidden on error
                    });

                audioPlayer.onended = () => {
                    console.log("Audio ended. Moving to next track.");
                    URL.revokeObjectURL(blobUrl); // Clean up blob URL
                    currentTrackIndex++;
                    playNextTrack(trackList, cid); // Play the next track
                };
            }
        } catch (error) {
            console.error("Error playing track:", error);
            alert("Failed to play the track. Skipping to the next track...");
            currentTrackIndex++;
            playNextTrack(trackList, cid); // Skip to the next track
        }
    };

    // Handle exiting the record spin view
    backToControlsButton.addEventListener("click", () => {
        recordView.classList.add("hidden");
        controlsView.classList.remove("hidden");
        if (mediaPlayer) {
            mediaPlayer.classList.add("hidden");
        }
    });
};