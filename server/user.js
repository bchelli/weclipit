
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

var userFields = {
      'services.facebook.id': 1
    , 'services.twitter.id': 1
    , 'services.twitter.screenName': 1
    , 'services.google.id': 1
    , 'profile': 1
    }
  ;

Meteor.publish("userData", function () {
  return Meteor.users.find(
    {
      _id:this.userId
    }
  , {
      fields: userFields
    }
  );
});
function addUserToCollection(collection, userId){
  collection.users = collection.users || {};
  collection.ids = collection.ids || [];
  if(!collection.users['u'+userId]){
    collection.users['u'+userId] = true;
    collection.ids.push(userId);
  }
}

Meteor.publish('playlist-users', function(plId){
  if(plId){
    var users = {};
    var pl = playlists.findOne({_id:plId});
    if(pl) {
      addUserToCollection(users, pl.owner);
      for(var i=0,l=pl.followers.length;i<l;i++){
        addUserToCollection(users, pl.followers[i]);
      }
      var vids = videos.find({playlist:plId}, {fields:{owner:1}}).fetch();
      for(var i=0,l=vids.length;i<l;i++){
        addUserToCollection(users, vids[i].owner);
      }
      return Meteor.users.find(
        {
          _id:{$in:users.ids}
        }
      , {
          fields: userFields
        }
      );
    }
  }
  return [];
});

Meteor.publish('feed-users', function(){
  if(this.userId){
    var vids = videos.getLastVideosAdded(this.userId).fetch();
    var users = {};
    for(var i=0,l=vids.length;i<l;i++){
      addUserToCollection(users, vids[i].owner);
    }
    return Meteor.users.find(
      {
        _id:{$in:users.ids}
      }
    , {
        fields: userFields
      }
    );
  }
  return [];
});

Meteor.publish('user-info', function(userId){
  var users = {};
  var pls = playlists.find({owner:userId,public:true}).fetch();
  addUserToCollection(users, userId);
  for(var i=0,l=pls.length;i<l;i++){
    for(var j=0,m=pls[i].followers.length;j<m;j++){
      addUserToCollection(users, pls[i].followers[j]);
    }
  }
  return Meteor.users.find({_id:{$in:users.ids}});
});

Meteor.publish('user-info-playlists', function(userId){
  return playlists.find({owner:userId,public:true});
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
    u.playlists = playlists.find({owner:userId,public:true}, {sort:{name:1}}).fetch();
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
, getGoogleFriends: function(){
    var fiber = Fiber.current
      , u = Meteor.user()
      , config = Accounts.loginServiceConfiguration.findOne({service: 'twitter'})
      , friends = []
      , accessKeys = {
          '560846051748.apps.googleusercontent.com':'AIzaSyDOL_mmUT1RJth9R2Siv1CZz3PE7zBqFf8'
        , '1063882553386.apps.googleusercontent.com':'AIzaSyC4hGYZrze47kzcvzVNa6RFYHQfKmdzkqw'
        }
      ;
    function getNextFriends(cursor){
      var query = {key:accessKeys[config.clientId]};
      if(cursor) query.pageToken = cursor;
      var r = new Meteor.OAuthRequest({
        options:{bearer: u.services.google.accessToken}
      , method:       'GET'
      , url:          'https://www.googleapis.com/plus/v1/people/'+u.services.google.id+'/people/visible'
      , query:query
      });
      
      r.call(function(err, result){
        if(!err){
          if(result && result.items){
            Array.prototype.push.apply(friends, result.items);
            if(result.nextPageToken){
              getNextFriends(result.nextPageToken);
            } else fiber.run();
          } else fiber.run();
        } else fiber.run();
      });
    }
    getNextFriends();

    Fiber.yield();

    return _.map(Meteor.users.find({
      'services.google.id':{
        $in:_.map(friends, function(friend){
          return friend.id;
        })
      }
    }).fetch(), function(friend){
      return publicUserInfo(friend);
    });
  }
, getFacebookFriends: function(){
    var friends = []
      , u = Meteor.user()
      , fiber = Fiber.current
      ;

    function getNextFriends(cursor){
      Meteor.http.get(cursor, function(err, res){
        if(!err){
          if(res && res.data && res.data.data){
            Array.prototype.push.apply(friends, res.data.data);
            if(res.data.paging && res.data.paging.next && res.data.data.length>0){
              getNextFriends(res.data.paging.next)
            } else fiber.run();
          } else fiber.run();
        } else fiber.run();
      });
    }
    getNextFriends('https://graph.facebook.com/'+u.services.facebook.id+'/friends?method=GET&format=json&access_token='+u.services.facebook.accessToken);

    Fiber.yield();

    return _.map(Meteor.users.find({
      'services.facebook.id':{
        $in:_.map(friends, function(friend){
          return friend.id;
        })
      }
    }).fetch(), function(friend){
      return publicUserInfo(friend);
    });
  }
, getTwitterFriends: function(){
    var friends = []
      , config = Accounts.loginServiceConfiguration.findOne({service: 'twitter'})
      , u = Meteor.user()
      , fiber = Fiber.current
      ;
    function getNextFriends(cursor){
      var r = new Meteor.OAuthRequest({
        options:{
          clientId:             config.consumerKey
        , clientSecret:         config.secret
        , token:                u.services.twitter.accessToken
        , tokenSecret:          u.services.twitter.accessTokenSecret
        }
      , method:                 'GET'
      , url:                    'https://api.twitter.com/1.1/friends/ids.json'
      , query:{
          cursor:               cursor
        , user_id:              u.services.twitter.id
        , skip_status:          true
        , include_user_entities:false
        }
      });
      
      r.call(function(err, result){
        if(!err && result && result.ids){
          Array.prototype.push.apply(friends, result.ids);
          if(result.next_cursor){
            getNextFriends(result.next_cursor);
          } else fiber.run();
        } else fiber.run();
      });
    }
    getNextFriends(-1);
    Fiber.yield();

    return _.map(Meteor.users.find({
      'services.twitter.id':{
        $in:_.map(friends, function(id){
          return ''+id;
        })
      }
    }).fetch(), function(friend){
      return publicUserInfo(friend);
    });
  }
});