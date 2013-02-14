
Meteor.publish('videos', function(playlist){
  return videos.find({playlist:playlist});
});

Meteor.methods({
  addVideo : function(playlist, url){
    // http://vimeo.com/59162570
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
            , playlist:   playlist
            , provider:   provider
            , providerId: providerId
            , name:       name
            });
          }
        }
      }
    );
  }
, removeVideo : function(video){
    videos.remove({_id:video});
  }
});
