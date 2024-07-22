document.addEventListener('DOMContentLoaded', () => {
    const stageButtons = document.querySelectorAll('.stage-button');
    stageButtons.forEach(button => {
        button.addEventListener('click', () => {
            const stage = button.textContent.split(' ')[1]; // Get the stage number
            window.location.href = `game.html?stage=${stage}`; // Navigate to game screen with stage query
        });
    });
});
