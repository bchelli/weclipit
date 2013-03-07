var playlists = new Meteor.Collection('playlists');

var videos = new Meteor.Collection('videos');

var configDb = new Meteor.Collection('configDb');

if(Meteor.isServer){
  function publicUserInfo(user){
    var result = {};
    result._id = user._id;
    result.profile = user.profile;
    result.services = {};
    result.services.facebook = {};
    result.services.facebook.id = user.services.facebook.id;
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
  Meteor.autorun(function () {
    var pl = Session.get('playlist');

    Meteor.subscribe('userData');
    Meteor.subscribe('playlists', pl);
    Meteor.subscribe('videos', pl);
  });
}

if(Meteor.isServer){

  Meteor.methods({
  // PLAYER
    playNext : function(playing){
      var v = videos.find({playlist:playing.playlist}, {sort:[['nbLikes','desc'],['createdAt','asc'], ['data.title', 'asc']]}).fetch()
        , videoFound = false
        , firstVideoId = ""
        ;
  
      for(var i in v){
        if(firstVideoId === "") firstVideoId = v[i]._id;                  // Save first ID in case of no next
        if(videoFound) return {playlist:playing.playlist,video:v[i]._id}; // is the next video
        if(v[i]._id === playing.video) videoFound = true;                 // video found => the next is the good one
      }
  
      return {playlist:playing.playlist,video:firstVideoId};
    }
  
  , playPrevious : function(playing){
      var v = videos.find({playlist:playing.playlist}, {sort:[['nbLikes','desc'],['createdAt','asc'], ['data.title', 'asc']]}).fetch()
        , lastVideoId = v[v.length-1]._id
        ;
  
      for(var i in v){
        if(v[i]._id === playing.video) return {playlist:playing.playlist,video:lastVideoId};  // video found => the next is the good one
        lastVideoId = v[i]._id;
      }
  
      return {playlist:playing.playlist,video:firstVideoId};
    }
  
  // PLAYLISTS
  , updatePlaylistName : function(playlist, name){
      var pl = playlists.findOne({owner:Meteor.userId(),_id:playlist});
      if(pl){
        playlists.update({_id:playlist}, {$set:{name:name}});
      }
    }
  , sharePlaylist : function(playlist, users){
      var pl = playlists.findOne({owner:Meteor.userId(),_id:playlist});
      if(pl){
        for(var i in users){
          var userId = users[i].id;
          if(users[i].status){
            playlists.update({_id:playlist}, {
              $addToSet: {
                canAccess:      userId
              , canAddVideo:    userId
              }
            });
            Meteor.http.get('https://graph.facebook.com/'+u.services.facebook.id+'/friends?method=GET&format=json&access_token='+u.services.facebook.accessToken, function(err, res){
              if(!err){
                if(res && res.data && res.data.data){
                  friends = res.data.data;
                }
              }
              fiber.run();
            });
          } else {
            playlists.update({_id:playlist}, {
              $pull: {
                canAccess:      userId
              , canAddVideo:    userId
              , canRemoveVideo: userId
              }
            });
          }
        }
      }
    }
  , followPlaylist : function(playlist){
      var pl = playlists.findOne({_id:playlist});
      if(pl){
        var userId = Meteor.user().services.facebook.id;
        playlists.update({_id:playlist}, {$addToSet: {canAccess:userId}});
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
            $pull: {
              canAccess:      Meteor.user().services.facebook.id
            , canAddVideo:    Meteor.user().services.facebook.id
            , canRemoveVideo: Meteor.user().services.facebook.id
            }
          });
        }
      }
    }
  , createPlaylist : function(name){
      var userId = Meteor.userId()
        , user = publicUserInfo(Meteor.user())
        ;
      if(userId){
        playlists.insert({
          name:           name
        , owner:          userId
        , canAccess:      []
        , canAddVideo:    []
        , canRemoveVideo: []
        , ownerData:      user
        });
      }
    }
  
  // VIDEOS
  , searchYoutubeVideos: function(query){
      var fiber = Fiber.current
        , videosYoutube = []
        ;
      Meteor.http.get('https://gdata.youtube.com/feeds/api/videos?q='+encodeURIComponent(query)+'&alt=json', function(err, res){
        if(!err){
          videosYoutube = res && res.data && res.data.feed && res.data.feed.entry ? res.data.feed.entry : [];
        }
        fiber.run();
      });
      Fiber.yield();
      return videosYoutube;
    }
  , addVideo : function(playlist, url){
      var userId = Meteor.userId()
        , user = publicUserInfo(Meteor.user())
        , fbId = user.services.facebook.id
        , grantRight = false
        , pl = playlists.findOne({_id:playlist})
        ;

      if(pl.owner === userId) grantRight = true;

      if(!grantRight && _.contains(pl.canAddVideo, fbId)) grantRight = true;

      if(!grantRight) return;

      var fiber = Fiber.current;
      Meteor.http.get(
        "http://api.embed.ly/1/oembed?key=41f79dded6d843f68d00896d0fc1500d&url="+encodeURIComponent(url)
      , function(err, res){
          if(!err){
            
            var provider = res.data.provider_name.toLowerCase()
              , providerId = ''
              ;
            switch(provider){
              case 'vimeo':
                var regExp = /http(s)?:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/;
                var match = url.match(regExp);
                if (match) {
                  providerId = match[3];
                }
                break;
              case 'youtube':
                var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
                var match = url.match(regExp);
                if (match && match[7].length===11){
                  providerId = match[7];
                }
                break;
            }
  
            if(providerId !== ''){
              videos.insert({
                url:        url
              , owner:      Meteor.userId()
              , playlist:   playlist
              , provider:   provider
              , providerId: providerId
              , likes:      []
              , nbLikes:    0
              , data:       res.data
              , createdAt:  (new Date()).getTime()
              , ownerData:      user
              });
            }
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
        var userId = Meteor.userId()
          , fbId = Meteor.user().services.facebook.id
          , grantRight = false
          ;

        if(vid.owner === userId) grantRight = true;

        if(!grantRight){
          var pl = playlists.findOne({_id:vid.playlist});
          if(_.contains(pl.canRemoveVideo, fbId)) grantRight = true;
        }

        if(grantRight) videos.remove({_id:video});
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
  , getPlaylistFriendsSharing : function(playlist){
      var pl = playlists.findOne({owner:Meteor.userId(),_id:playlist})
        , friends
        ;
      if(pl){
        var u = Meteor.user()
          , fiber = Fiber.current
          ;
  
        Meteor.http.get('https://graph.facebook.com/'+u.services.facebook.id+'/friends?method=GET&format=json&access_token='+u.services.facebook.accessToken, function(err, res){
          if(!err){
            if(res && res.data && res.data.data){
              friends = res.data.data;
            }
          }
          fiber.run();
        });
        Fiber.yield();
        
        var rights = ['canAccess', 'canAddVideo', 'canRemoveVideo'];
        for(var i in friends){
          for(var r in rights){
            friends[i][rights[r]] = !!pl[rights[r]] && pl[rights[r]].indexOf(friends[i].id)!==-1;
          }
        }
      }
      return friends;
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

  Meteor.autorun(function(){
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
