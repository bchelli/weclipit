if(Meteor.isServer) {
  (function () {
    if (!Meteor.twitter) {	 
      Meteor.twitter = {};
    }

    if (!Meteor.twitter._options) {
      Meteor.twitter._options = {};
    }

    Meteor.twitter.use = function(options) {
      Meteor.twitter._options = Meteor.twitter._options || {};
      for(var i in options){
        Meteor.twitter._options[i] = Meteor.twitter._options[i] || [];
        Meteor.twitter._options[i].push(options[i]);
      }
    };

    __meteor_bootstrap__.app.use(function(req, res, next) {

      // IS ACTUALLY FACEBOOK
      if (req.headers['user-agent'] === 'Twitterbot') {

        res.writeHead(200, {'Content-Type': 'text/html'});

        Fiber(function () {

          // GENERATE OPEN GRAPH TAGS
          if (Meteor.twitter._options.openGraphTags) {
            res.write('<head>');
            for(var ogt in Meteor.twitter._options.openGraphTags){
              var head = Meteor.twitter._options.openGraphTags[ogt](req);
              if (head) {
                for(var i in head){
                  res.write('<meta property="'+head[i].property+'" content="'+head[i].content+'" />');
                }
              }
            }
            res.write('</head>');
          }

          res.end();

        }).run();

      } else {
        next();   
      }
    });
  })();
}