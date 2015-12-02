Router.route('/', function () {
    this.render('videoSequencer');
});

Router.route('/showVideo/:_id', 
    function () {

        var id = this.params._id;

        //var id="abc123";

        var vid = UserVideos.findOne({ userId: id }, { sort: { save_date: -1 }});
        var aud = UserAudios.findOne({ userId: id }, { sort: { save_date: -1 }});

        console.log(aud);

        this.render('showVideo', {
            data: {
                audio: aud,
                video: vid,
                userId: id
            }
        });
    }, {
        name: 'showVideo'
    }
);