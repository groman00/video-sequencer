(function(){

    function Sequencer(){

        this.$el = $('#sequencer')
            .on('videoAdded', this.videoAdded.bind(this));
        this.cellClass = '.cell';
        this.cells = this.$el.find(this.cellClass);
        this.recordingClass = 'isRecording';
        this.isMediaSetup = false;

        this.$videoElement;
        this.audioContext;
        this.audioRecorder
        this.mediaStream;
        this.mediaInitialized;
        this.videoCanvas;
        this.videoContext; 
        this.recording;
        this.frameTime;
        this.imageArray;

        Template.newCell.events = {
            'click .add': this.startNewVideo.bind(this),
            'click #startRecording': this.startRecording.bind(this),
            'click #stopRecording': this.stopRecording.bind(this)                    
        };
     
    };


    /**/
    Sequencer.prototype.videoAdded = function(e) {


        

        //reset values

    };


    /**/
    Sequencer.prototype.setupMedia = function() {

        this.audioContext = new AudioContext();
        this.$videoElement = $('#live_video');

        var dimension = this.$videoElement.outerHeight();
        
        navigator.getUserMedia(
            {
                //need different configs for some browsers, using webkit
                video: {
                    //'webkit': {
                        mandatory: {
                            maxHeight: dimension,
                            maxWidth: dimension 
                        }                
                    // },
                    // 'default': {
                    //     width: {ideal: 180},
                    //     height: {ideal: 180}
                    // }
                },
                audio: true
            },
            function (localMediaStream) {
                
                // map the camera
                this.$videoElement[0].src = window.URL.createObjectURL(localMediaStream);

                // create the canvas & get a 2d context
                this.videoCanvas = document.createElement('canvas');
                this.videoContext = this.videoCanvas.getContext('2d');

                // setup audio recorder
                var audioInput =
                    this.audioContext.createMediaStreamSource(localMediaStream);

                var audioGain = this.audioContext.createGain();
                audioGain.gain.value = 0;
                audioInput.connect(audioGain);
                audioGain.connect(this.audioContext.destination);

                this.audioRecorder = new Recorder(audioInput);
                this.mediaStream = localMediaStream;
                this.mediaInitialized = true;

            }.bind(this),
            function (e) {
                alert('Error getting media');
                console.log(e);
            }
        );
    };

    /**/
    Sequencer.prototype.startNewVideo = function(e) {
        $(e.currentTarget)
            .closest(this.cellClass)
            .addClass(this.recordingClass);

        if(!this.mediaInitialized){
            this.setupMedia();
        }
    };

    /**/
    Sequencer.prototype.startRecording = function(e) {
        
        console.log("Begin Recording");
     
        var videoElement = this.$videoElement[0];

        this.videoCanvas.width = videoElement.width;
        this.videoCanvas.height = videoElement.height;
     
        console.log(this.videoCanvas.height, this.videoCanvas.width)

        this.imageArray = [];
     
        // do request frames until the user stops recording
        this.recording = true;
        this.frameTime = new Date().getTime();
        requestAnimationFrame(this.recordFrame.bind(this));
     
        // begin recording audio
        this.audioRecorder.record();        
    };

    Sequencer.prototype.recordFrame = function() {     
        
        if (this.recording) {

            var image;
            var videoElement = this.$videoElement[0];

            // draw the video to the context, then get the image data
            var width = videoElement.width;
            var height = videoElement.height;
            this.videoContext.drawImage(videoElement, 0, 0, width, height);
     
            // optionally get the image, do some filtering on it, then
            // put it back to the context
            this.imageData = this.videoContext.getImageData(0, 0, width, height);

            // - do some optional image manipulations on imageData
            this.videoContext.putImageData(this.imageData, 0, 0);
     
            var frameDuration = new Date().getTime() - this.frameTime;
     
            console.log("duration: " + frameDuration);

            this.imageArray.push(
                {
                    duration: frameDuration,
                    image: this.imageData
                });
            
            this.frameTime = new Date().getTime();
     
            console.log(this.imageArray);

            // request another frame
            requestAnimationFrame(this.recordFrame.bind(this));
        }
        else {
            this.completeRecording();
        }
    }

    Sequencer.prototype.stopRecording = function() {
        console.log("End Recording");
        this.recording = false;
    };


    Sequencer.prototype.completeRecording = function() {
        // stop & export the recorder audio
        this.audioRecorder.stop();

        //var user = Meteor.user();
        // if (!user) {
        //     // must be the logged in user
        //     console.log("completeRecording - NO USER LOGGED IN");
        //     return;
        // }
        // console.log("completeRecording: " + user._id);

        //document.getElementById('uploading').hidden = false;
        
        //using a fake user for now
        /*var user = {
            _id: 'abc123'
        };

        audioRecorder.exportWAV(function (audioBlob) {
            // save to the db
            BinaryFileReader.read(audioBlob, function (err, fileInfo) {
                UserAudios.insert({
                    userId: user._id,
                    audio: fileInfo,
                    save_date: Date.now()
                });
            });
            console.log("Audio uploaded");
        });

        // do the video encoding
        // note: tried doing this in real-time as the frames were requested but
        // the result didn't handle durations correctly.
        var whammyEncoder = new Whammy.Video();
        for (i in imageArray) {
            videoContext.putImageData(imageArray[i].image, 0, 0);
            whammyEncoder.add(videoContext, imageArray[i].duration);
            delete imageArray[i];
        }
        var videoBlob = whammyEncoder.compile();

        BinaryFileReader.read(videoBlob, function (err, fileInfo) {
            UserVideos.insert({
                userId: user._id,
                video: fileInfo,
                save_date: Date.now()
            });
        });*/

        console.log("Video uploaded");

        // stop the stream & redirect to show the video
        //todo: use mediaStreamTrack

        this.mediaStream.stop();

        this.$el.trigger('videoAdded');
        //Router.go('showVideo', { _id: user._id });

    }

    var sequencer = new Sequencer();

})();