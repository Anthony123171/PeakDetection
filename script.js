(function () {
  const audioFileInput = document.getElementById("audioFile");
  const thresholdInput = document.getElementById("threshold");
  const thresholdValue = document.getElementById("thresholdValue");
  const peakCountInput = document.getElementById("peakCount");
  const startAnalysisBtn = document.getElementById("startAnalysis");
  const peakList = document.getElementById("peakList");
  const waveformCanvas = document.getElementById("waveformCanvas");
  let audioContext;
  let waveform;

  startAnalysisBtn.addEventListener("click", () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const audioFile = audioFileInput.files[0];
    const threshold = calculateThreshold(parseFloat(thresholdInput.value));
    const peakCount = parseInt(peakCountInput.value);

    if (!audioFile) {
      alert("Please select an audio file.");
      return;
    }

    analyzeAudio(audioFile, threshold, peakCount);
  });

  function calculateThreshold(linearValue) {
    const dBFS = linearAmplitudeTodBFS(linearValue);
    return dBFS;
  }

  function analyzeAudio(audioFile, threshold, peakCount) {
    const fileReader = new FileReader();
    fileReader.onload = function () {
      audioContext.decodeAudioData(
        this.result,
        function (decodedData) {
          renderWaveform(decodedData);
          const peaks = findPeaks(decodedData, threshold, peakCount);
          displayPeaks(peaks);
          // Create and play audio element
          playAudio(decodedData);
        },
        function (error) {
          console.error("Error decoding audio data:", error);
          alert(
            "Error decoding audio data. Please try again with a different file."
          );
        }
      );
    };
    fileReader.onerror = function () {
      console.error("Error reading file:", fileReader.error);
      alert("Error reading file. Please try again with a different file.");
    };
    fileReader.readAsArrayBuffer(audioFile);
  }

  function playAudio(decodedData) {
    const audioElement = new Audio();
    const audioBlob = new Blob([decodedData], { type: "audio/*" });
    const audioURL = URL.createObjectURL(audioBlob);
    audioElement.src = audioURL;
    audioElement.controls = true;
    document.body.appendChild(audioElement); // Append audio element to body or any other desired element
    audioElement.play();
  }

  function renderWaveform(decodedData) {
    waveform = WaveformData.create(decodedData, { scale: 128 });
    const context = waveformCanvas.getContext("2d");
    const width = waveformCanvas.offsetWidth;
    const height = waveformCanvas.offsetHeight;
    const bufferLength = waveform.channel(0).length;

    // Clear canvas
    context.clearRect(0, 0, width, height);

    // Set up line style
    context.beginPath();
    context.strokeStyle = "blue";
    context.lineWidth = 2;

    // Calculate step size for drawing the waveform
    const step = Math.ceil(bufferLength / width);

    // Draw the waveform
    for (let i = 0; i < width; i++) {
      const min = waveform.channel(0).min(i * step, (i + 1) * step);
      const max = waveform.channel(0).max(i * step, (i + 1) * step);
      const x = i;
      const yMin = ((1 + min) * height) / 2;
      const yMax = ((1 + max) * height) / 2;
      context.moveTo(x, yMin);
      context.lineTo(x, yMax);
    }

    // Stroke the lines
    context.stroke();
  }

  function findPeaks(audioBuffer, threshold, peakCount) {
    const channelData = audioBuffer.getChannelData(0); // Assuming mono audio
    const sampleRate = audioBuffer.sampleRate;
    const peaks = [];

    const bufferLength = channelData.length;
    let inPeak = false;
    let peakStart = 0;

    for (let i = 0; i < bufferLength; i++) {
      const amplitude = Math.abs(channelData[i]);

      if (!inPeak && amplitude >= threshold) {
        inPeak = true;
        peakStart = i;
      } else if (inPeak && amplitude < threshold) {
        inPeak = false;
        const peakTime = peakStart / sampleRate;
        const peakAmplitude = findPeakAmplitude(channelData, peakStart, i);
        peaks.push({
          time: peakTime.toFixed(2),
          amplitude: peakAmplitude.toFixed(2),
        });
        if (peaks.length === peakCount) break; // Stop when desired number of peaks is found
      }
    }

    return peaks;
  }

  function findPeakAmplitude(channelData, start, end) {
    let peakAmplitude = 0;
    for (let i = start; i < end; i++) {
      const amplitude = Math.abs(channelData[i]);
      if (amplitude > peakAmplitude) {
        peakAmplitude = amplitude;
      }
    }
    return peakAmplitude;
  }

  function displayPeaks(peaks) {
    peakList.innerHTML = "";
    peaks.forEach((peak, index) => {
      const listItem = document.createElement("li");
      listItem.textContent = `Peak ${index + 1}: Time ${
        peak.time
      } s, Amplitude ${peak.amplitude}`;
      peakList.appendChild(listItem);
    });
  }

  function linearAmplitudeTodBFS(linear) {
    return 20 * Math.log10(linear);
  }

  thresholdInput.addEventListener("input", () => {
    const linearValue = parseFloat(thresholdInput.value);
    const dBFS = calculateThreshold(linearValue);
    thresholdValue.textContent = `${dBFS.toFixed(2)} dBFS`;
  });
})();
