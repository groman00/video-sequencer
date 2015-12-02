(function(){

    /*
     * ideas for syncing:  
     * - http://stackoverflow.com/questions/21016656/html5-javascript-audio-play-multiple-tracks-at-the-same-time
     * - https://bocoup.com/weblog/html5-video-synchronizing-playback-of-two-videos
     */

    function Sequencer(){

        this.id = '#sequencer';
        this.cellClass = '.cell';
        //this.cells = this.$el.find(this.cellClass);
        this.recordingClass = 'isRecording';
        this.isMediaSetup = false;

        //hardcoded user
        this.user = {_id: 'abc123'};

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

        this.BinaryFileReader = {
            read: function (file, callback) {
                var reader = new FileReader;

                var fileInfo = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    file: null
                }

                reader.onload = function () {
                    fileInfo.file = new Uint8Array(reader.result);
                    callback(null, fileInfo);
                }
                reader.onerror = function () {
                    callback(reader.error);
                }

                reader.readAsArrayBuffer(file);
            }
        }

        Template.newCell.events = {
            'click .add': this.startNewVideo.bind(this),
            'click #startRecording': this.startRecording.bind(this),
            'click #stopRecording': this.stopRecording.bind(this)                    
        };

        Template.videoSequencer.helpers({
            videos: function(){
                
                var id = this.user._id;
                var videos = UserVideos.find({ userId: id }, { sort: { save_date: -1 }}).fetch();
                var audios = UserAudios.find({ userId: id }, { sort: { save_date: -1 }}).fetch();
                var data = [];

                for(var i = 0, max = videos.length; i < max; i++){
                    data.push({
                        audio: audios[i],
                        video: videos[i]
                    });
                }

                console.log(data);

                return data;

            }.bind(this)
        });

        Template.videoSequencer.events = {
            'click .play': this.playAll.bind(this),
            'click .stop': this.stopAll.bind(this)           
        };

        Template.video.helpers({
            userVideo: function () {
                if (!this.video) {
                    return "";
                }
                var blob = new Blob([this.video.video.file], {type: this.video.video.type});
                return window.URL.createObjectURL(blob);
            },

            userAudio: function () {
                if (!this.audio) {
                    return "";
                }
                var blob = new Blob([this.audio.audio.file], {type: this.audio.audio.type});
                return window.URL.createObjectURL(blob);
            }
        });        
     
    };

    /**/
    Sequencer.prototype.playAll = function() {
        $(this.id).find('.video').each(function(i, item){
            $(item).children('video')[0].play();
            $(item).children('audio')[0].play();
        });
    };

    /**/
    Sequencer.prototype.stopAll = function() {
        $(this.id).find('.video').each(function(i, item){
            var video = $(item).children('video')[0]
            var audio = $(item).children('audio')[0]
            video.pause();
            audio.pause();
            audio.currentTime = 0;
            video.currentTime = 0;
        });
    };

    /**/
    Sequencer.prototype.resetCamera = function() {
        this.$videoElement[0].src = "";
        $(this.id).find('.isRecording').removeClass('isRecording');
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
                            maxWidth: dimension,
                            minHeight: dimension,
                            minWidth: dimension 
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
        
        this.stopAll();     

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

        this.playAll();

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
        this.stopAll();
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


        this.audioRecorder.exportWAV(function (audioBlob) {
            // save to the db
            this.BinaryFileReader.read(audioBlob, function (err, fileInfo) {
                UserAudios.insert({
                    userId: this.user._id,
                    audio: fileInfo,
                    save_date: Date.now()
                });
            }.bind(this));
            console.log("Audio uploaded");
        }.bind(this));

        // do the video encoding
        // note: tried doing this in real-time as the frames were requested but
        // the result didn't handle durations correctly.
        var whammyEncoder = new Whammy.Video();
        for (i in this.imageArray) {
            this.videoContext.putImageData(this.imageArray[i].image, 0, 0);
            whammyEncoder.add(this.videoContext, this.imageArray[i].duration);
            delete this.imageArray[i];
        }
        var videoBlob = whammyEncoder.compile();

        this.BinaryFileReader.read(videoBlob, function (err, fileInfo) {
            UserVideos.insert({
                userId: this.user._id,
                video: fileInfo,
                save_date: Date.now()
            });
        }.bind(this));

        console.log("Video uploaded");

        // stop the stream & redirect to show the video
        //todo: use mediaStreamTrack
        this.mediaStream.stop();

        this.resetCamera();
    }

    var sequencer = new Sequencer();

})();