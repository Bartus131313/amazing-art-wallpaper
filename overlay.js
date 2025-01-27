var btn = document.querySelector(".overlay-btn")
var overlayFrame = document.querySelector(".overlay-frame")

var fpsLabel = document.querySelector(".fps-label")

btn.addEventListener('click', () => {
    btn.classList.toggle("active")
    overlayFrame.classList.toggle("active")

    // Retrieve the transition duration from computed styles
    const transitionDuration = window.getComputedStyle(overlayFrame).transitionDuration;

    // Convert the duration to seconds or milliseconds (it can be in 's' or 'ms')
    const durationInMilliseconds = parseFloat(transitionDuration) * 1000 + 500; // Convert to ms if in seconds

    // Example: Wait for the transition time and execute an action after
    setTimeout(() => {
        btn.classList.toggle("active")
        overlayFrame.classList.toggle("active")
    }, durationInMilliseconds);
})

function livelyPropertyListener(name, val)
{
    switch(name) {
    case "showFPS":
        if (val && !fpsLabel.classList.contains("active")) {
            fpsLabel.classList.add("active")
        } else if (!val && fpsLabel.classList.contains("active")) {
            fpsLabel.classList.remove("active")
        }
        break;     
    }
}