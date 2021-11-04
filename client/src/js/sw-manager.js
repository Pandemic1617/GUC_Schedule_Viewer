const installer = () => {
    if ("serviceWorker" in navigator) {
        console.log("serviceWorker found in navigator");
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("/sw.js");
        });
    }
};

export { installer };
