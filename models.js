var playlists = new Meteor.Collection('playlists');

var videos = new Meteor.Collection('videos');



if(Meteor.isServer){
  var homeVideos = [];

  function refreshHomeVideos(){
    var urls = [];
    Meteor.http.get('https://gdata.youtube.com/feeds/api/standardfeeds/on_the_web?alt=json', function(err, res){
      if(!err){
        var entries = res.data.feed.entry
          , count = 0
          ;
        _.each(entries, function(entry){
          Meteor.http.get(
            "http://api.embed.ly/1/oembed?key=41f79dded6d843f68d00896d0fc1500d&url="+encodeURIComponent(entry.content.src)
          , function(err, res){
              if(!err){
                urls.push(res.data);
              }
              count++;
              if(count === entries.length){
                homeVideos = urls;
              }
            }
          );
        });
      }
    });
  }
  
  Meteor.startup(function(){
    refreshHomeVideos();
    Meteor.setInterval(refreshHomeVideos, 5*60*1000);
  });

  Meteor.methods({
  // PLAYER
    playNext : function(playing){
      var v = videos.find({playlist:playing.playlist}).fetch()
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
      var v = videos.find({playlist:playing.playlist}).fetch()
        , lastVideoId = v[v.length-1]._id
        ;
  
      for(var i in v){
        if(v[i]._id === playing.video) return {playlist:playing.playlist,video:lastVideoId};  // video found => the next is the good one
        lastVideoId = v[i]._id;
      }
  
      return {playlist:playing.playlist,video:firstVideoId};
    }
  
  // PLAYLISTS
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
              , canRemoveVideo: userId
              }
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
  , removePlaylist : function(playlist){
      var pl = playlists.findOne({owner:Meteor.userId(),_id:playlist});
      if(pl){
        videos.remove({playlist:pl._id})
        playlists.remove({_id:pl._id})
      }
    }
  , createPlaylist : function(name){
      console.log(Accounts.facebook);
      var userId = Meteor.userId();
      if(userId){
        playlists.insert({
          name:           name
        , owner:          userId
        , canAccess:      []
        , canAddVideo:    []
        , canRemoveVideo: []
        });
      }
    }
  
  // VIDEOS
  , addVideo : function(playlist, url){
      var fiber = Fiber.current;
      Meteor.http.get(
        "http://api.embed.ly/1/oembed?key=41f79dded6d843f68d00896d0fc1500d&url="+encodeURIComponent(url)
      , function(err, res){
          if(!err){
            
            var provider = res.data.provider_name.toLowerCase()
              , providerId = ''
              , name = res.data.title
              ;
            switch(provider){
              case 'vimeo':
                var regExp = /http:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/;
                var match = url.match(regExp);
                if (match) {
                  providerId = match[2];
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
              , name:       name
              });
            }
          }
          fiber.run();
        }
      );
      Fiber.yield();
    }
  , removeVideo : function(video){
      videos.remove({_id:video});
    }
  , getHomeVideos : function(){
      return homeVideos;
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
}
