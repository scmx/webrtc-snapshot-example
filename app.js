(function() {

  var streaming = false;
  var video        = document.querySelector('#middle video');
  var canvas_left  = document.querySelector('#left canvas');
  var canvas_middle = document.createElement('canvas');
  var canvas_right = document.querySelector('#right canvas');
  var ctx_left     = canvas_left.getContext('2d');
  var ctx_middle   = canvas_middle.getContext('2d');
  var ctx_right    = canvas_right.getContext('2d');
  var snapshots_left   = document.querySelector('#left   .snapshots');
  var snapshots_middle = document.querySelector('#middle .snapshots');
  var snapshots_right  = document.querySelector('#right  .snapshots');
  // var photo        = document.querySelector('#photo');
  // var startbutton  = document.querySelector('#startbutton');
  var width = 320;
  var height = 0;

  navigator.getMedia = ( navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);

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
    },
    function(err) {
      console.log("An error occured! " + err);
    }
  );

  video.addEventListener('canplay', function(ev){
    if (!streaming) {
      height = video.videoHeight / (video.videoWidth/width);
      video.setAttribute('width', width);
      video.setAttribute('height', height);
      canvas_left.setAttribute('width', width);
      canvas_left.setAttribute('height', height);
      canvas_middle.setAttribute('width', width);
      canvas_middle.setAttribute('height', height);
      canvas_right.setAttribute('width', width);
      canvas_right.setAttribute('height', height);
      streaming = true;
    }
  }, false);

  setInterval(function () {
    render();
  }, 30);

  function render() {
    ctx_left.drawImage(video, 0, 0, width, height);
    ctx_middle.drawImage(video, 0, 0, width, height);
    ctx_right.drawImage(video, 0, 0, width, height);

    var flipdata_left  = flip(ctx_left.getImageData(0,0,width,height), 0, width/2);
    var flipdata_right = flip(ctx_right.getImageData(0,0,width,height), width/2, width);

    ctx_left.putImageData(flipdata_left,   0, 0);
    ctx_right.putImageData(flipdata_right, 0, 0);
  }

  function takepicture() {
    var photo_left = document.createElement('img');
    var data_left = canvas_left.toDataURL('image/png');
    photo_left.setAttribute('src', data_left);
    snapshots_left.insertBefore(photo_left, snapshots_left.firstChild);

    var photo_middle = document.createElement('img');
    var data_middle = canvas_middle.toDataURL('image/png');
    photo_middle.setAttribute('src', data_middle);
    snapshots_middle.insertBefore(photo_middle, snapshots_middle.firstChild);

    var photo_right = document.createElement('img');
    var data_right = canvas_right.toDataURL('image/png');
    photo_right.setAttribute('src', data_right);
    snapshots_right.insertBefore(photo_right, snapshots_right.firstChild);
  }

  document.body.addEventListener('keydown', onKeyPress);

  function onKeyPress(event) {
    switch (event.keyCode) {
      case 32: event.preventDefault(); takepicture(); break;
    }
  }

  function flip(imageData, from, to) {
    var data = imageData.data;
    var width = imageData.width;
    var height = imageData.height;
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
