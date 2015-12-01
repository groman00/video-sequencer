/*this.route('showVideo',
{
    path: '/video/:_id',
    template: 'showVideo',
    data: function () {

        var id = this.params._id;

        console.log("route-showVideo: " + id);
        
        var user = Meteor.users.findOne({ _id: id });
        
        if (!user) {
            console.log("! no user found for route");
            return null;
        }
 
        console.log("Finding audio/video for user: " + id);
        
        var vid = UserVideos.findOne({ userId: id },
            { sort: { save_date: -1 }});
        
        var aud = UserAudios.findOne({ userId: id },
            { sort: { save_date: -1 }});
 
        return {
            audio: aud,
            video: vid,
            userId: id
        }
    }
});*/