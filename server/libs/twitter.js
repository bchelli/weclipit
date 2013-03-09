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

      try {
        // IS ACTUALLY TWITTER
        if (req.headers['user-agent'].indexOf('Twitterbot') !== -1) {
  
          res.writeHead(200, {'Content-Type': 'text/html'});
  
          Fiber(function () {
  
            // GENERATE OPEN GRAPH TAGS
            if (Meteor.twitter._options.openGraphTags) {
              res.write('<head>');
              for(var ogt in Meteor.twitter._options.openGraphTags){
                var head = Meteor.twitter._options.openGraphTags[ogt](req);
                if (head) {
                  for(var i in head){
                    res.write('<meta property="'+_.escape(head[i].property)+'" content="'+_.escape(head[i].content)+'" />');
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
      } catch(e) {
        next();
      }
    });
  })();
}