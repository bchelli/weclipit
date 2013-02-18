
Meteor.publish('playlists', function(userId){
  var query = {$or:[{owner:this.userId}]}
    , user = Meteor.users.findOne({_id:this.userId})
    ;
  if(user && user.services && user.services.facebook && user.services.facebook.id){
    query.$or.push({canRead : user.services.facebook.id});
  }
  return playlists.find(query);
});
