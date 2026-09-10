// Controls a local audio file from the custom "Music" toggle button.
// Put music.mp3 in the same folder as index.html.

document.addEventListener('DOMContentLoaded', () => {
  const musicBtn = document.getElementById('musicToggle');
  const audio = document.getElementById('bgAudio');
  if (!musicBtn || !audio) return;

  musicBtn.addEventListener('click', () => {
    const nowActive = musicBtn.classList.toggle('active');
    if (nowActive) {
      audio.currentTime = 0;
      audio.play();
    } else {
      audio.pause();
    }
  });

  // if the track ends on its own, drop the button back to its "off" state
  audio.addEventListener('ended', () => {
    musicBtn.classList.remove('active');
  });
});
