
Meteor.publish('videos', function(pls){
  pls = ''+pls;
  return videos.find({playlist:{'$in':pls.split(',')}});
});
