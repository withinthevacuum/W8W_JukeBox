export const showLoader = () => {
    console.log("Showing loader...");
    const loader = document.getElementById("loader");
    if (loader) loader.classList.add("visible");
};

export const hideLoader = () => {
    console.log("Hiding loader...");
    const loader = document.getElementById("loader");
    if (loader) loader.classList.remove("visible");
};