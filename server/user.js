
Accounts.emailTemplates.siteName = "26plays";
Accounts.emailTemplates.from = "26 Plays <contact@26plays.com>";

Accounts.onCreateUser(function(options, user) {
  if (options.profile) user.profile = options.profile;
  if(user.emails && user.emails.length>0){
    var crypto = __meteor_bootstrap__.require('crypto');
    var md5 = crypto.createHash('md5');
    md5.update(user.emails[0].address.trim().toLowerCase());
    if(!user.profile) user.profile = {};
    user.profile.gravatarHash = md5.digest('hex');
  }
  return user;
});

Meteor.publish("userData", function () {
  return Meteor.users.find(
    {
      _id:this.userId
    }
  , {
      fields: {
        'services.facebook.id': 1
      , 'services.twitter.id': 1
      , 'services.twitter.screenName': 1
      , 'services.google.id': 1
      }
    }
  );
});


function publicUserInfo(user){
  var result = {};
  result._id = user._id;
  result.profile = user.profile;
  result.services = {};
  // Add Facebook if available
  if(user && user.services && user.services.facebook && user.services.facebook.id){
    result.services.facebook = {};
    result.services.facebook.id = user.services.facebook.id;
  }
  // Add Twitter if available
  if(user && user.services && user.services.twitter && user.services.twitter.id){
    result.services.twitter = {};
    result.services.twitter.id = user.services.twitter.id;
    result.services.twitter.screenName = user.services.twitter.screenName;
  }
  // Add Google if available
  if(user && user.services && user.services.google && user.services.google.id){
    result.services.google = {};
    result.services.google.id = user.services.google.id;
  }
  return result;
}


Meteor.methods({
// USER
  setName : function(name){
    var uid = Meteor.userId();

    if(!uid) throw new Meteor.Error(401, 'Not logged in user');

    if(!name || name.length<3) throw new Meteor.Error(406, 'Name must be 3 characters or longer');

    Meteor.users.update({_id:uid}, {$set:{'profile.name':name}});
    videos.update({owner:uid}, {$set:{'ownerData.profile.name':name}}, {multi: true});
    playlists.update({owner:uid}, {$set:{'ownerData.profile.name':name}}, {multi: true});
  }
, getUserProfile : function(userId){
    var u = publicUserInfo(Meteor.users.findOne({_id:userId}));
    u.playlists = playlists.find({owner:userId}, {sort:{name:1}}).fetch();
    return u;
  }
, cleanMeUp : function(){
    var uid = Meteor.userId()
      , u = Meteor.user()
      ;

    if(uid && u && u.profile && u.profile.name && u.profile.name === 'Benjamin Chelli') {
      Meteor.users.remove({_id:uid});
      videos.remove({owner:uid}, {multi: true});
      playlists.remove({owner:uid}, {multi: true});
    }

  }
, getUsers : function(){
    /// SECURITY WHOLE
    var u = Meteor.users.find({}, {sort:{createdAt:1}}).fetch(), res = [];
    for(var i in u){
      res.push(u[i].profile.name)
    }
    return res;
  }
});