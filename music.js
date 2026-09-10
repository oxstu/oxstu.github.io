// Controls a hidden Spotify embed (official iFrame API) from the
// custom "Music" toggle button. Swap TRACK_URI below for a different track.

const TRACK_URI = 'spotify:track:2MZSXhq4XDJWu6coGoXX1V'; // Avril 14th — Aphex Twin (Drukqs, 2001)

let spotifyController = null;
let controllerReady = false;
let pendingAction = null; // 'play' | 'pause' queued if clicked before API is ready

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  const element = document.getElementById('spotify-embed');
  const options = {
    uri: TRACK_URI,
    width: '100%',
    height: '80',
  };
  IFrameAPI.createController(element, options, (EmbedController) => {
    spotifyController = EmbedController;
    controllerReady = true;
    if (pendingAction === 'play') spotifyController.play();
    if (pendingAction === 'pause') spotifyController.pause();
    pendingAction = null;
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const musicBtn = document.getElementById('musicToggle');
  if (!musicBtn) return;

  musicBtn.addEventListener('click', () => {
    const nowActive = musicBtn.classList.toggle('active');

    if (nowActive) {
      if (controllerReady) {
        spotifyController.play();
      } else {
        pendingAction = 'play';
      }
    } else {
      if (controllerReady) {
        spotifyController.pause();
      } else {
        pendingAction = 'pause';
      }
    }
  });
});
