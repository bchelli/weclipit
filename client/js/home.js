
Template.homeTemplate.rendered = function(){
  Meteor.call('getHomeVideos', function(err, res){
    if(!err){
      var $homeVideos = $('#home-videos');
      _.each(res, function(video){
        $homeVideos.append('<div class="preview-video"><img src="'+video.thumbnail_url+'" /><br />'+video.title+'</div>');
//title: "Temple Run 2 - Universal - HD Gameplay Trailer"
//url: "http://www.youtube.com/watch?v=Vu3paDJJLEw"
      });
    }
  });
};