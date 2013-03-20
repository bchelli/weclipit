
Meteor.publish('videos', function(playlists){
  return videos.find({playlist:{'$in':playlists}});
});
