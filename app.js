let streaming = false;
const video = document.createElement('video');
const width = 320;
const height = 240;

class StreamContainer {
  constructor() {
    this.el = document.createElement('div');
    this.streams = [];
  }
  append(stream) {
    this.streams.push(stream);
    this.el.appendChild(stream.el);
  };
}

class Stream {
  constructor(id, video) {
    this.el = document.createElement('div');
    this.el.classList.add('Stream');
    this.el.id = id;

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('width', width);
    this.canvas.setAttribute('height', height);
    this.el.appendChild(this.canvas);

    this.context = this.canvas.getContext('2d');

    if (video) {
      this.video = video;
      this.video.setAttribute('width', width);

      const line = document.createElement('div');
      line.classList.add('Line');
      this.el.appendChild(line);
    }

    this.snapshots = document.createElement('div');
    this.snapshots.classList.add('SnapshotContainer');
    this.el.appendChild(this.snapshots);
  }
  prependSnapshot(snapshot) {
    this.snapshots.insertBefore(snapshot, this.snapshots.firstChild);
  }
  takeSnapshot() {
    const data = this.canvas.toDataURL('image/png');
    const snapshot = new Snapshot(data);
    this.prependSnapshot(snapshot.el);
  }
}

class Snapshot {
  constructor(data) {
    this.el = document.createElement('div');
    this.el.classList.add('Snapshot');

    const onClose = () => {
      this.el.parentNode.removeChild(this.el);
    }

    this.closeButton = new CloseButton(onClose);
    this.saveButton = new SaveButton(data);
    this.photo = new Photo(data);
    this.el.appendChild(this.closeButton.el);
    this.el.appendChild(this.saveButton.el);
    this.el.appendChild(this.photo.el);
  }
}

class CloseButton {
  constructor(onClose) {
    this.el = document.createElement('div');
    this.el.classList.add('Button');
    this.el.classList.add('CloseButton');
    this.el.setAttribute('title', 'Click to remove');
    this.el.innerHTML = "&times;";
    this.el.addEventListener('click', onClose);
  }
}

class SaveButton {
  constructor(href) {
    this.el = document.createElement('a');
    this.el.classList.add('Button');
    this.el.classList.add('SaveButton');
    this.el.setAttribute('href', href);
    this.el.setAttribute('target', '_blank');
    this.el.setAttribute('download', 'snapshot.png');
    this.el.setAttribute('title', 'Click to download');
    this.el.innerHTML = '&starf;';
  }
}

class PlayButton {
  constructor() {
    this.el = document.createElement('button');
    this.el.classList.add('PlayButton')
    this.el.innerHTML = `&#9654;`
    this.el.onclick = () => {
      try {
        video.play();
        this.hide();
      } catch (err) {
        console.warn(err);
      }
    }
    // this.hide();
  }

  hide() {
    this.el.style.display = 'none';
  }

  show() {
    this.el.style.display = 'initial';
  }
}

class Photo {
  constructor(src) {
    this.el = document.createElement('img');
    this.el.setAttribute('src', src);
  }
}

const explanation = document.createElement('div');
const streamContainer = new StreamContainer();
const playButton = new PlayButton();

document.body.appendChild(explanation);
document.body.appendChild(streamContainer.el);
document.body.appendChild(playButton.el)
document.body.appendChild(video);

function init() {
  explanation.classList.add('Explanation');

  if (navigator.mediaDevices.getUserMedia) {
    explanation.innerHTML = 'You need to allow this page to use your camera';
  } else {
    explanation.innerHTML = 'Sorry, your browser does not support ' +
      '<code>window.navigator.getUserMedia</code>';
    return;
  }

  streamContainer.append(new Stream('left'));
  streamContainer.append(new Stream('right'));
  streamContainer.append(new Stream('middle', video));

  navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(
    (stream) => {
      video.srcObject = stream
      // video.onloadedmetadata = () => {
      //   try {
      //     video.play();
      //   } catch (err) {
      //     playButton.show();
      //     console.warn(err);
      //   }
      // };

      explanation.innerHTML = 'Position your face so that the red line ' +
        'divides it in half. ' +
        'Then press <code>&lt;SPACE&gt;</code> to take a snapshot';

      addEventListener('keydown', onKeydown);
    },
    function(err) {
      console.log("An error occured! " + err);
    }
  );

  video.addEventListener('canplay', function(ev) {
    if (!streaming) {
      video.setAttribute('width', video.videoWidth * 2);
      video.setAttribute('height', video.videoHeight * 2);

      streamContainer.streams.forEach(function(stream) {
        stream.canvas.setAttribute('width', width);
        stream.canvas.setAttribute('height', height);
      });

      streaming = true;
    }
  }, false);

  setInterval(function() {
    render();
  }, 30);
}

function render() {
  const left = streamContainer.streams[0].context;
  left.drawImage(video, 0, 0, width, height);

  const middle = streamContainer.streams[2].context;
  middle.drawImage(video, 0, 0, width, height);

  const right = streamContainer.streams[1].context;
  right.drawImage(video, 0, 0, width, height);

  const flipdata_left = flip(left.getImageData(0, 0, width, height), 0, width / 2);
  const flipdata_right = flip(right.getImageData(0, 0, width, height), width / 2, width);

  left.putImageData(flipdata_left, 0, 0);
  right.putImageData(flipdata_right, 0, 0);
}

function takepicture() {
  streamContainer.streams.forEach(function(stream) {
    stream.takeSnapshot();
  });
}

function onKeydown(event) {
  switch (event.keyCode) {
    case 32: event.preventDefault(); takepicture(); break;
  }
}

function flip(imageData, from, to) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  // http://stackoverflow.com/a/13933017
  for (let y = 0; y < height; y++) {
    for (let x = from; x < to; x++) { // divide by 2 to only loop through the left half of the image.
      const offset = ((width * y) + x) * 4; // Pixel origin

      // Get pixel
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const a = data[offset + 3];

      // Calculate how far to the right the mirrored pixel is
      const mirrorOffset = (width - (x * 2)) * 4;

      // Get set mirrored pixel's colours 
      data[offset + mirrorOffset] = r;
      data[offset + 1 + mirrorOffset] = g;
      data[offset + 2 + mirrorOffset] = b;
      data[offset + 3 + mirrorOffset] = a;
    }
  }
  return imageData;
}

init()
