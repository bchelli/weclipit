var playlists = new Meteor.Collection('playlists');

var videos = new Meteor.Collection('videos');

var configDb = new Meteor.Collection('configDb');



videos.isOwner = function(video, user){
  if(!user) user = Meteor.user();
  return video
      && user
      && video.owner
      && user._id
      && video.owner === user._id;
}

playlists.isOwner = function(playlist, user){
  if(!user) user = Meteor.user();
  return playlist
      && user
      && playlist.owner
      && user._id
      && playlist.owner === user._id;
}

playlists.canAccess = function(playlist, user){
  if(!user) user = Meteor.user();
  var pos = _.find(playlist.canAccess, function(u){
    return u._id === user._id;
  });
  return !_.isUndefined(pos);
}

playlists.canAddVideo = function(playlist, user){
  if(!user) user = Meteor.user();
  return playlists.isOwner(playlist, user) || playlist && playlist.privacy && playlist.privacy === 'public';
}

playlists.canRemoveVideo = function(playlist, video, user){
  if(!user) user = Meteor.user();
  return playlists.isOwner(playlist, user) || videos.isOwner(video, user);
}



if(Meteor.isServer){
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

  function initConfig(key){
    var config = configDb.findOne({key:key});
    if(!config){
      configDb.insert({
        key:key
      });
    }
  }

  function getConfig(key){
    var config = configDb.findOne({key:key});
    return config ? config.value : null;
  }

  function setConfig(key, value){
    initConfig(key);
    configDb.update({key:key},{key:key,value:value});
  }
}

if(Meteor.isClient){
  // manage subscriptions
  Deps.autorun(function () {
    var pl = Session.get('playlist');
    var playing = Session.get('playing');
    var pls = [];
    if(pl) pls.push(pl);
    if(playing && playing.playlist) pls.push(playing.playlist);
    Meteor.subscribe('videos', pls);
  });
  Deps.autorun(function () {
    var pl = Session.get('playlist');
    Meteor.subscribe('playlists', pl);
  });
  Deps.autorun(function () {
    Meteor.subscribe('userData');
  });
  Accounts.ui.config({
    passwordSignupFields: 'EMAIL_ONLY'
  });
}

if(Meteor.isServer){

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
  // PLAYLISTS
  , setPrivacy : function(playlist, privacy){
      if(['public','private'].indexOf(privacy)!==-1){
        var pl = playlists.findOne({owner:Meteor.userId(),_id:playlist});
        if(pl){
          playlists.update({_id:playlist}, {$set:{privacy:privacy}});
        }
      }
    }
  , updatePlaylistName : function(playlist, name){
      var pl = playlists.findOne({owner:Meteor.userId(),_id:playlist});
      if(pl){
        playlists.update({_id:playlist}, {$set:{name:name}});
      }
    }
  , sharePlaylist : function(playlist, users){
      var pl = playlists.findOne({owner:Meteor.userId(),_id:playlist});
      if(pl){
        var u = Meteor.user();
        for(var i in users){
          Meteor.facebook.api(
            '/'+u.services.facebook.id+'/twentysixplays:share'
          , 'POST'
          , {'profile':users[i]}
          );
        }
      }
    }
  , followPlaylist : function(playlist){
      var pl = playlists.findOne({_id:playlist});
      if(pl){
        var user = Meteor.user();
        if(user){
          playlists.update({_id:playlist}, {$addToSet: {canAccess:publicUserInfo(user)}});
        }
      }
    }
  , removePlaylist : function(playlist){
      var pl = playlists.findOne({_id:playlist});
      if(pl){
        if(pl.owner===Meteor.userId()){
          videos.remove({playlist:pl._id})
          playlists.remove({_id:pl._id})
        } else {
          playlists.update({_id:playlist}, {
            $pull: {canAccess:{_id:Meteor.userId()}}
          });
        }
      }
    }
  , createPlaylist : function(name){
      var userId = Meteor.userId()
        , user = publicUserInfo(Meteor.user())
        , result
        ;
      if(userId){
        result = playlists.insert({
          name:           name
        , owner:          userId
        , canAccess:      []
        , ownerData:      user
        , privacy:        'private'
        });
      }
      return result;
    }
  
  // VIDEOS
  , importYoutubePlaylist: function(playlist, youtubePlaylistId){
      var fiber = Fiber.current;
      Meteor.http.get('http://www.youtube.com/playlist?list='+encodeURIComponent(youtubePlaylistId), function(err, res){
        if(!err){
          var regExp = new RegExp('href="/watch?[^"]+list='+encodeURIComponent(youtubePlaylistId)+'[^"]+"', 'g')
            , extractVideo = new RegExp('v=([^&]+)')
            , list = res.content.match(regExp)
            ;
          for(var i=0,l=list.length;i<l;i++){
            var vid = list[i].match(extractVideo);
            if(vid && vid[1]) {
              Meteor.call('addVideo', playlist, 'http://www.youtube.com/watch?'+vid[0]);
            }
          }
        }
        fiber.run();
      });
      Fiber.yield();
    }
  , searchDailymotionVideos: function(query){
      var fiber = Fiber.current
        , videosDailymotion = []
        ;
      Meteor.http.get('https://api.dailymotion.com/videos?search='+encodeURIComponent(query)+'&fields=duration,id,title,thumbnail_url,owner_fullname,url&sort=relevance&limit=25', function(err, res){
        if(!err){
          videosDailymotion = res && res.data && res.data.list ? res.data.list : [];
        }
        fiber.run();
      });
      Fiber.yield();
      return videosDailymotion;
    }
  , searchVimeoVideos: function(query){
      var fiber = Fiber.current
        , videosVimeo = []
        ;
      var r = new Meteor.OAuthRequest({
        options:{
          clientId:       '72d14f2545ea06a976c21c5cbbadbf5e2846742b'
        , clientSecret:   '6a31f40a6fe6db9dbbd0ac31f2111f4d4e3a5604'
        , token:          'e95de822abd7785017852ec9985e700e'
        , tokenSecret:    '08a9b7db4c0503468481750cda7324c1bf056321'
        }
      , method:       'GET'
      , url:          'http://vimeo.com/api/rest/v2'
      , query:{
          format:           'json'
        , method:           'vimeo.videos.search'
        , per_page:         25
        , query:            query
        , embed_privacy:    'anywhere'
        , full_response:    true
        }
      });
      
      r.call(function(err, result){
        if(!err){
          videosVimeo = result && result.videos && result.videos.video ? result.videos.video : [];
        }
        fiber.run();
      });
      Fiber.yield();
      return videosVimeo;
    }
  , searchYoutubeVideos: function(query){
      var fiber = Fiber.current
        , videosYoutube = []
        ;
      Meteor.http.get('http://gdata.youtube.com/feeds/api/videos?q='+encodeURIComponent(query)+'&alt=json', function(err, res){
        if(!err){
          videosYoutube = res && res.data && res.data.feed && res.data.feed.entry ? res.data.feed.entry : [];
        }
        fiber.run();
      });
      Fiber.yield();
      return videosYoutube;
    }
  , addVideo : function(playlist, url){
      var pl = playlists.findOne({_id:playlist})
        , regExpVimeo = /http(s)?:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/
        , regExpYoutube = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
        , regExpYoutubePlaylist = /youtu.+list=([^&]+)/
        , regExpDailymotion = /dailymotion[^\/]+\/video\/([^_]+)/
        , provider = ''
        , providerId = ''
        , oEmbedUrl = ''
        , match
        ;

      if(!playlists.canAddVideo(pl)) return;

      if(match = url.match(regExpVimeo)){
        // is vimeo
        provider = 'vimeo';
        oEmbedUrl = 'http://vimeo.com/api/oembed.json?url='+encodeURIComponent(url)
        providerId = match[3];
      } else if(match = url.match(regExpDailymotion)){
        // is dailymotion
        provider = 'dailymotion';
        oEmbedUrl = 'http://www.dailymotion.com/services/oembed?format=json&url='+encodeURIComponent(url)
        providerId = match[1];
      } else if(match = url.match(regExpYoutubePlaylist)) {
        // is youtube
        oEmbedUrl = 'http://www.youtube.com/oembed?url='+encodeURIComponent(url)+'&format=json'
        Meteor.call('importYoutubePlaylist', playlist, match[1]);
        return;
      } else if(match = url.match(regExpYoutube)) {
        // is youtube
        provider = 'youtube';
        oEmbedUrl = 'http://www.youtube.com/oembed?url='+encodeURIComponent(url)+'&format=json'
        providerId = match[1];
      } else {
        // unknown
        return;
      }

      var fiber = Fiber.current;

      Meteor.http.get(
        oEmbedUrl
      , function(err, res){
          if(!err){
            var acceptedFields = ['author_name','author_url','height','html','provider_name','provider_url','thumbnail_height','thumbnail_url','thumbnail_width','title','type','version','width'];
            var resultData = {};
            for(var i=0,l=acceptedFields.length;i<l;i++){
              if(res.data[acceptedFields[i]]) resultData[acceptedFields[i]] = res.data[acceptedFields[i]];
            }
  
            videos.insert({
              url:        url
            , owner:      Meteor.userId()
            , playlist:   playlist
            , provider:   provider
            , providerId: providerId
            , likes:      []
            , nbLikes:    0
            , data:       resultData
            , createdAt:  (new Date()).getTime()
            , ownerData:  publicUserInfo(Meteor.user())
            });
          }
          fiber.run();
        }
      );
      Fiber.yield();
    }
  , likeVideo : function(video, status){
      var userId = Meteor.userId();
      function updateNbLikes(){
        videos.update({_id:video}, {
          $set: {
            nbLikes: videos.findOne({_id:video}).likes.length
          }
        });
      }
      if(status){
        videos.update({_id:video}, {
          $addToSet: {
            likes: userId
          }
        }, updateNbLikes);
      } else {
        videos.update({_id:video}, {
          $pull: {
            likes: userId
          }
        }, updateNbLikes);
      }
    }
  , removeVideo : function(video){
      var vid = videos.findOne({_id:video});
      if(vid){
        var pl = playlists.findOne({_id:vid.playlist});
        if(!playlists.canRemoveVideo(pl, vid)) return;
        videos.remove({_id:video});
      }
    }
  , getUsers : function(){
      /// SECURITY WHOLE
      var u = Meteor.users.find({}).fetch(), res = [];
      for(var i in u){
        res.push(u[i].profile.name)
      }
      return res;
    }
  });




  var reorg = {};
  
  reorg.num1 = function(){
    var users = Meteor.users.find().fetch();
    for(var i in users){
      playlists.update({owner:users[i]._id}, {
        $set: {
          ownerData:publicUserInfo(users[i])
        }
      }, {multi: true});
      videos.update({owner:users[i]._id}, {
        $set: {
          ownerData:publicUserInfo(users[i])
        }
      }, {multi: true});
    }
    return true;
  };

  reorg.num2 = function(){
    var v = videos.find().fetch()
      , refTime = 1362137187358
      ;

    for(var i in v){
      if(!v[i].createdAt){
        videos.update({_id:v[i]._id}, {
          $set: {
            createdAt:refTime-i*60*1000
          }
        });
      }
    }

    return true;
  };

  reorg.num3 = function(){
    playlists.update({}, {
      $set: {privacy:'private'}
    }, {multi: true});
    return true;
  };

  reorg.num4 = function(){
    playlists.update({}, {
      $unset: {canAddVideo:'',canRemoveVideo:''}
    }, {multi: true});
    return true;
  };

  reorg.num5 = function(){
    var pls = playlists.find().fetch()
      , users = {}
      ;
    _.each(pls, function(pl){
      var canAccess = [];
      _.each(pl.canAccess, function(fbId){
        if(_.isString(fbId)){
          // facebook account
          if(!users[fbId]) {
            var u = Meteor.users.findOne({"services.facebook.id":fbId});
            if(!_.isUndefined(u)){
              users[fbId] = publicUserInfo(u);
            }
          }
          if(!_.isUndefined(u)){
            canAccess.push(users[fbId]);
          }
        } else {
          // user account
          canAccess.push(fbId);
        }
      });
      if(canAccess.length >= 0) playlists.update({_id:pl._id}, {$set:{canAccess:canAccess}});
    });
    return true;
  };

  // RUN Reoganisation on startup
  Meteor.startup(function(){
    var db = getConfig('db') || {version:0};
    while(reorg['num'+(db.version+1)]){
      console.log('START REORG '+(db.version+1));
      if(reorg['num'+(db.version+1)]()){
        console.log('DONE REORG '+(db.version+1));
        db.version++;
        setConfig('db', db);
      } else {
        console.log('ERROR IN REORG '+(db.version+1));
        return;
      }
    }
  });

}
