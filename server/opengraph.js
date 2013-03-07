if(Meteor.isServer){

  // Set Facebook APP ID
  Meteor.facebook.use({
    openGraphTags:function(req){
      return {"fb:app_id":"157608577727216"};
    }
  });

  // Website
  Meteor.facebook.use({
    openGraphTags:function(req){
      var url = __meteor_bootstrap__.require('url'); 
      var parts = url.parse(req.url).pathname.split('/');
      var absoluteUrl = Meteor.absoluteUrl(req.url.substr(0,1)=='/' ? req.url.substr(1) : req.url);
      if(parts.length == 2 && parts[1] === ''){
        return {
          'og:type':'website'
        , 'og:url':Meteor.absoluteUrl()
        , 'og:title':'26 Plays'
        , 'og:image':Meteor.absoluteUrl('img/logo.png')
        , 'og:description':'Keep, play and share your videos with your friends'
        };
      }
    }
  });

  // playlist
  Meteor.facebook.use({
    openGraphTags:function(req){
      var url = __meteor_bootstrap__.require('url'); 
      var parts = url.parse(req.url).pathname.split('/');
      var absoluteUrl = Meteor.absoluteUrl(req.url.substr(0,1)=='/' ? req.url.substr(1) : req.url);
      if(parts.length == 3 && parts[1] === 'playlist'){
        var playlistId = parts[2]
          , playlist = playlists.findOne({_id:playlistId})
          ;
        return {
          'og:type':'twentysixplays:video_playlist'
        , 'og:url':absoluteUrl
        , 'og:title':playlist.name
        , 'og:image':Meteor.absoluteUrl('img/logo.png')
        , 'og:description':playlist.name+' by '+playlist.ownerData.profile.name
        };
      }
    }
  });
}