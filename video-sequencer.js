if (Meteor.isClient) {

    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!navigator.cancelAnimationFrame)
        navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
    if (!navigator.requestAnimationFrame)
        navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;


    var videoElement,
        audioContext, 
        audioRecorder, 
        mediaStream, 
        mediaInitialized, 
        videoCanvas, 
        videoContext, 
        recording,
        frameTime,
        imageArray;

    function setupMedia() {

        audioContext = new AudioContext();
        videoElement = document.getElementById('live_video');

        navigator.getUserMedia(
            {
                video: true,
                audio: true
            },
            function (localMediaStream) {
                // map the camera
                var video = document.getElementById('live_video');
                video.src = window.URL.createObjectURL(localMediaStream);

                // create the canvas & get a 2d context
                videoCanvas = document.createElement('canvas');
                videoContext = videoCanvas.getContext('2d');

                // setup audio recorder
                var audioInput =
                    audioContext.createMediaStreamSource(localMediaStream);

                var audioGain = audioContext.createGain();
                audioGain.gain.value = 0;
                audioInput.connect(audioGain);
                audioGain.connect(audioContext.destination);

                audioRecorder = new Recorder(audioInput);
                mediaStream = localMediaStream;
                mediaInitialized = true;

                // document.getElementById('uploading').hidden = true;
                // document.getElementById('media-error').hidden = true;
                // document.getElementById('record').hidden = false;
            },
            function (e) {
                alert('Error getting media');
                console.log(e);
            }
        );

    };

    function startRecording() {
        console.log("Begin Recording");
     
        videoCanvas.width = videoElement.width;
        videoCanvas.height = videoElement.height;
     
        console.log(videoCanvas.height,videoCanvas.width)
        imageArray = [];
     
        // do request frames until the user stops recording
        recording = true;
        frameTime = new Date().getTime();
        requestAnimationFrame(recordFrame);
     
        // begin recording audio
        audioRecorder.record();
    }

    function stopRecording() {
        console.log("End Recording");
        recording = false;
    }

    function recordFrame() {     
        if (recording) {

            var image;
            
            // draw the video to the context, then get the image data
            var width = videoElement.width;
            var height = videoElement.height;
            videoContext.drawImage(videoElement, 0, 0, width, height);
     
            // optionally get the image, do some filtering on it, then
            // put it back to the context
            imageData = videoContext.getImageData(0, 0, width, height);
            // - do some optional image manipulations on imageData
            videoContext.putImageData(imageData, 0, 0);
     
            var frameDuration = new Date().getTime() - frameTime;
     
            console.log("duration: " + frameDuration);
            // NOTE: the following attempted to add the frames to the
            // encoder as it was recording but ended up getting saving
            // the frame duration incorrectly.
            //whammyEncoder.add(videoContext, frameDuration);
            imageArray.push(
                {
                    duration: frameDuration,
                    image: imageData
                });
            frameTime = new Date().getTime();
     
            console.log(imageArray);

            // request another frame
            requestAnimationFrame(recordFrame);
        }
        else {
            completeRecording();
        }
    }

    function completeRecording() {
        // stop & export the recorder audio
        audioRecorder.stop();
        mediaStream.stop();
    }

    Template.videoSequencer.events({
        'click #startRecording': function(){
            startRecording();
        },
        'click #stopRecording': function(){
            stopRecording();
        }        
    });

    //console.log(Template.record)
    Template.videoSequencer.onRendered(function() {
        //console.log('foooo')
        setupMedia(); 
    });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
