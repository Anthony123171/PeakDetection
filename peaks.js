(function (Peaks) {
  const options = {
    zoomview: {
      container: document.getElementById("zoomview-container"),
    },
    overview: {
      container: document.getElementById("overview-container"),
    },
    mediaElement: document.getElementById("audio"),
    webAudio: {
      audioContext: new AudioContext(),
    },
  };

  Peaks.init(options, function (err, peaks) {
    if (err) {
      console.error(`Failed to initialize Peaks instance: ${err.message}`);
      return;
    }

    // Do something when the waveform is displayed and ready
  });
})(peaks);
