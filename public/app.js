document.addEventListener("DOMContentLoaded", () => {
    const landing = document.getElementById("landing");
    const controls = document.getElementById("controls");
    const record = document.getElementById("record");

    const enterControlsButton = document.getElementById("enter-controls");
    const playSongButton = document.getElementById("play-song");
    const playAlbumButton = document.getElementById("play-album");
    const toRecordViewButton = document.getElementById("to-record-view");
    const backToControlsButton = document.getElementById("back-to-controls");

    // Enter Jukebox button
    enterControlsButton.addEventListener("click", () => {
        console.log("Enter Jukebox button clicked!");
        landing.classList.add("hidden");
        controls.classList.remove("hidden");
    });

    // Controls buttons
    playSongButton.addEventListener("click", () => {
        console.log("Play Song button clicked!");
        alert("Playing song (placeholder action).");
    });

    playAlbumButton.addEventListener("click", () => {
        console.log("Play Album button clicked!");
        alert("Playing album (placeholder action).");
    });

    toRecordViewButton.addEventListener("click", () => {
        console.log("View Record button clicked!");
        controls.classList.add("hidden");
        record.classList.remove("hidden");
    });

    // Back to Controls button
    backToControlsButton.addEventListener("click", () => {
        console.log("Back to controls button clicked!");
        record.classList.add("hidden");
        controls.classList.remove("hidden");
    });


    const lcdLeft = document.getElementById("lcd-screen-left");
    const lcdRight = document.getElementById("lcd-screen-right");

    // Example data for the LCD screens
    const albumTitle = "JollyJukeBox";
    const trackCount = 12;

    // Populate the LCD screens
    lcdLeft.innerText = `Album: ${albumTitle}`;
    lcdRight.innerText = `Tracks: ${trackCount}`;

    // Simulate a "connecting" animation on the left screen
    let connectingDots = 0;
    setInterval(() => {
        connectingDots = (connectingDots + 1) % 4; // Cycle through 0, 1, 2, 3 dots
        lcdLeft.innerText = `Album: ${albumTitle}\nConnecting${".".repeat(connectingDots)}`;
    }, 500); // Update every 500ms


    
});