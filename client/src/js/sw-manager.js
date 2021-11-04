const installer = () => {
    if ("serviceWorker" in navigator) {
        console.log("serviceWorker found in navigator");
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("/sw.js");
        });
    }
};

const { captureInstall, promptInstall, listenToInstall } = (() => {
    let deferredPrompt,
        isInstallAvailable = false,
        installListener;

    const listenToInstall = (func) => {
        installListener = func;
        return isInstallAvailable;
    };
    const handleBeforeInstall = (e) => {
        e.preventDefault();
        deferredPrompt = e;
        isInstallAvailable = true;
        if (installListener) installListener();
        console.log("captured");
    };

    const captureInstall = () => {
        window.addEventListener("beforeinstallprompt", handleBeforeInstall);
        console.log("capture began");
    };

    const promptInstall = (e) => {
        if (!isInstallAvailable) throw "prompt not available";
        isInstallAvailable = false;
        deferredPrompt.prompt();
        return deferredPrompt.userChoice;
    };
    return { captureInstall, promptInstall, listenToInstall };
})();

export { installer, captureInstall, promptInstall, listenToInstall };
