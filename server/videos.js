
Meteor.publish('videos', function(playlist){
  return videos.find({playlist:playlist}, {sort:[['nbLikes','desc'],['data.title','asc']]});
});
