
Meteor.publish('playlists', function(){
  var query = {$or:[{owner:this.userId}]}
    , user = Meteor.users.findOne({_id:this.userId})
    ;
  if(user && user.services && user.services.facebook && user.services.facebook.id){
    query.$or.push({canAccess : user.services.facebook.id});
  }
  return playlists.find(query, {sort:[['name', 'asc']]});
});
