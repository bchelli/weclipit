
Meteor.publish('player', function(playlist, video){
  return videos.findOne({_id:video,playlist:playlist});
});
