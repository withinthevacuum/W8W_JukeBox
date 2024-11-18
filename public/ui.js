export const setupUI = () => {
    const landing = document.getElementById("landing");
    const controls = document.getElementById("controls");
    const enterControlsButton = document.getElementById("enter-controls");

    enterControlsButton.addEventListener("click", () => {
        console.log("Enter Jukebox button clicked!");
        landing.classList.add("hidden");
        controls.classList.remove("hidden");

        setTimeout(() => {
            const lcdLeft = document.getElementById("lcd-screen-left");
            const lcdRight = document.getElementById("lcd-screen-right");
            const controlsOverlay = document.querySelector(".controls-overlay");

            lcdLeft.classList.add("visible");
            lcdRight.classList.add("visible");
            controlsOverlay.classList.add("visible");
            console.log("LCD screens and controls made visible.");
        }, 1300);
    });
};