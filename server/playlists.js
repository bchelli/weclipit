
Meteor.publish('playlists', function(playlist){
  var query = {$or:[{owner:this.userId}]}
    , user = Meteor.users.findOne({_id:this.userId})
    ;
  if(playlist){
    query.$or.push({_id:playlist});
  }
  if(user && user.services && user.services.facebook && user.services.facebook.id){
    query.$or.push({canAccess : user.services.facebook.id});
  }
  return playlists.find(query, {sort:[['name', 'asc']]});
});
