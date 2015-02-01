(function() {

  var streaming = false;
  var video        = document.createElement('video');
  var width = 320;
  var height = 240;

  function StreamContainer() {
    this.el = document.body;
    this.streams = [];
  }
  StreamContainer.prototype.append = function (stream) {
    this.streams.push(stream);
    this.el.appendChild(stream.el);
  };

  function Stream(id, video) {
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

      var line = document.createElement('div');
      line.classList.add('Line');
      this.el.appendChild(line);

      // this.el.appendChild(this.video);
    }

    this.snapshots = document.createElement('div');
    this.snapshots.classList.add('SnapshotContainer');
    this.el.appendChild(this.snapshots);
  }
  Stream.prototype.prependSnapshot = function (snapshot) {
    this.snapshots.insertBefore(snapshot, this.snapshots.firstChild);
  };
  Stream.prototype.takeSnapshot = function () {
    var data = this.canvas.toDataURL('image/png');
    var snapshot = new Snapshot(data);
    this.prependSnapshot(snapshot.el);
  };

  function Snapshot(data) {
    this.el = document.createElement('div');
    this.el.classList.add('Snapshot');

    this.closeButton = new CloseButton(onClose.bind(this));
    this.saveButton = new SaveButton(data);
    this.photo = new Photo(data);

    function onClose() {
      this.el.parentNode.removeChild(this.el);
    }
    function onSave() {
    }
    this.el.appendChild(this.closeButton.el);
    this.el.appendChild(this.saveButton.el);
    this.el.appendChild(this.photo.el);
  }

  function CloseButton(onClose) {
    this.el = document.createElement('div');
    this.el.classList.add('Button');
    this.el.classList.add('CloseButton');
    this.el.setAttribute('title', 'Click to remove');
    this.el.innerHTML = "&times;";
    this.el.addEventListener('click', onClose);
  }

  function SaveButton(href) {
    this.el = document.createElement('a');
    this.el.classList.add('Button');
    this.el.classList.add('SaveButton');
    this.el.setAttribute('href', href);
    this.el.setAttribute('target', '_blank');
    this.el.setAttribute('download', 'snapshot.png');
    this.el.setAttribute('title', 'Click to download');
    this.el.innerHTML = '&starf;';
    // this.el.addEventListener('click', onSave);
  }

  function Photo(src) {
    this.el = document.createElement('img');
    this.el.setAttribute('src', src);
  }

  navigator.getMedia = ( navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);

  var explanation = document.createElement('div');
  explanation.classList.add('Explanation');

  if (navigator.getMedia) {
    explanation.innerHTML = 'You need to allow this page to use your camera';
    document.body.appendChild(explanation);
  } else {
    explanation.innerHTML = 'Sorry, your browser does not support ' +
      '<code>window.navigator.getUserMedia</code>';
    document.body.appendChild(explanation);
    return;
  }

  var streamContainer = new StreamContainer();

  streamContainer.append(new Stream('left'));
  streamContainer.append(new Stream('right'));
  streamContainer.append(new Stream('middle', video));

  navigator.getMedia(
    {
      video: true,
      audio: false
    },
    function(stream) {
      if (navigator.mozGetUserMedia) {
        video.mozSrcObject = stream;
      } else {
        var vendorURL = window.URL || window.webkitURL;
        video.src = vendorURL.createObjectURL(stream);
      }
      video.play();
      explanation.innerHTML = 'Position your face so that the red line ' +
        'divides it in half. ' +
        'Then press <code>&lt;SPACE&gt;</code> to take a snapshot';

      document.body.addEventListener('keydown', onKeydown);
    },
    function(err) {
      console.log("An error occured! " + err);
    }
  );

  video.addEventListener('canplay', function(ev){
    if (!streaming) {
      video.setAttribute('width', video.videoWidth * 2);
      video.setAttribute('height', video.videoHeight * 2);

      streamContainer.streams.forEach(function (stream) {
        stream.canvas.setAttribute('width', width);
        stream.canvas.setAttribute('height', height);
      });

      streaming = true;
    }
  }, false);

  setInterval(function () {
    render();
  }, 30);

  function render() {
    var left = streamContainer.streams[0].context;
    left.drawImage(video, 0, 0, width, height);

    var middle = streamContainer.streams[2].context;
    middle.drawImage(video, 0, 0, width, height);

    var right  = streamContainer.streams[1].context;
    right.drawImage(video, 0, 0, width, height);

    var flipdata_left  = flip(left.getImageData(0,0,width,height), 0, width/2);
    var flipdata_right = flip(right.getImageData(0,0,width,height), width/2, width);

    left.putImageData(flipdata_left,   0, 0);
    right.putImageData(flipdata_right, 0, 0);
  }

  function takepicture() {
    streamContainer.streams.forEach(function (stream) {
      stream.takeSnapshot();
    });
  }

  function onKeydown(event) {
    switch (event.keyCode) {
      case 32: event.preventDefault(); takepicture(); break;
    }
  }

  function flip(imageData, from, to) {
    var data = imageData.data;
    var width = imageData.width;
    var height = imageData.height;
    // http://stackoverflow.com/a/13933017
    for(var y = 0; y < height; y++) {
      for(var x = from; x < to; x++) { // divide by 2 to only loop through the left half of the image.
        var offset = ((width* y) + x) * 4; // Pixel origin

      // Get pixel
      var r = data[offset];
      var g = data[offset + 1];
      var b = data[offset + 2];
      var a = data[offset + 3];

      // Calculate how far to the right the mirrored pixel is
      var mirrorOffset = (width - (x * 2)) * 4;

      // Get set mirrored pixel's colours 
      data[offset + mirrorOffset] = r;
      data[offset + 1 + mirrorOffset] = g;
      data[offset + 2 + mirrorOffset] = b;
      data[offset + 3 + mirrorOffset] = a;
      }
    }
    return imageData;
  }

})();
