const { generateSW } = require("workbox-build");

const swDest = "build/sw.js";
const globDirectory = "build";
const globPatterns = ["**"];
const navigateFallback = "/index.html";
generateSW({
    swDest,
    globDirectory,
    globPatterns,
    navigateFallback,
}).then(({ count, size }) => {
    console.log(`Generated ${swDest}, which will precache ${count} files, totaling ${size} bytes.`);
});
