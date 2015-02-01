(function() {

  var streaming = false,
      video        = document.querySelector('#video'),
      canvas_left  = document.querySelector('#canvas_left'),
      canvas_right = document.querySelector('#canvas_right'),
      ctx_left     = canvas_left.getContext('2d'),
      ctx_right    = canvas_right.getContext('2d'),
      // photo        = document.querySelector('#photo'),
      // startbutton  = document.querySelector('#startbutton'),
      width = 320,
      height = 0;

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
      streaming = true;
    }
  }, false);

  function takepicture() {
    canvas_left.width = width;
    canvas_left.height = height;
    ctx_left.drawImage(video, 0, 0, width, height);
    canvas_right.width = width;
    canvas_right.height = height;
    ctx_right.drawImage(video, 0, 0, width, height);

    var flipdata_left  = flipLeft(ctx_left.getImageData(0,0,width,height));
    var flipdata_right = flipRight(ctx_right.getImageData(0,0,width,height));

    ctx_left.putImageData(flipdata_left,   0, 0);
    ctx_right.putImageData(flipdata_right, 0, 0);

    var data_left = canvas_left.toDataURL('image/png');
    photo_left.setAttribute('src', data_left);
    var data_right = canvas_right.toDataURL('image/png');
    photo_right.setAttribute('src', data_right);
  }

  // startbutton.addEventListener('click', function(ev){
  //     takepicture();
  //   ev.preventDefault();
  // }, false);

  document.body.addEventListener('keydown', onKeyPress);

  function onKeyPress(event) {
    switch (event.keyCode) {
      case 32: takepicture(); break;
    }
  }

  function flipLeft(imageData) {
    var data = imageData.data;
    var width = imageData.width;
    var height = imageData.height;
    for(var y = 0; y < height; y++) {
        for(var x = 0; x < width / 2; x++) { // divide by 2 to only loop through the left half of the image.
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

  function flipRight(imageData) {
    var data = imageData.data;
    var width = imageData.width;
    var height = imageData.height;
    for(var y = 0; y < height; y++) {
        for(var x = width/2; x < width; x++) { // divide by 2 to only loop through the left half of the image.
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
