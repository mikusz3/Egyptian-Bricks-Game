document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', () => {
        window.location.href = 'stage-select.html'; // This will navigate to the stage select screen
    });
});
