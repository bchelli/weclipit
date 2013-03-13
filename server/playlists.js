
Meteor.publish('playlists', function(playlist){
  var query = {$or:[{owner:this.userId}]}
    , user = Meteor.users.findOne({_id:this.userId})
    ;
  if(playlist) query.$or.push({_id:playlist});
  if(user) query.$or.push({"canAccess._id" : user._id});
  return playlists.find(query);
});
