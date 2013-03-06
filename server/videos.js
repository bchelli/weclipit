
Meteor.publish('videos', function(playlist){
  return videos.find({playlist:playlist});
});
