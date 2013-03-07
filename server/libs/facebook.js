if(Meteor.isServer) {
  (function () {
    if (!Meteor.facebook) {	 
      Meteor.facebook = {};
    }

    if (!Meteor.facebook._options) {
      Meteor.facebook._options = {};
    }

    Meteor.facebook.use = function(options) {
      Meteor.facebook._options = Meteor.facebook._options || {};
      for(var i in options){
        Meteor.facebook._options[i] = Meteor.facebook._options[i] || [];
        Meteor.facebook._options[i].push(options[i]);
      }
    };

    __meteor_bootstrap__.app.use(function(req, res, next) {

      // IS ACTUALLY FACEBOOK
      if (req.headers['user-agent'].indexOf('facebookexternalhit') !== -1) {

        res.writeHead(200, {'Content-Type': 'text/html'});

        Fiber(function () {

          // GENERATE OPEN GRAPH TAGS
          if (Meteor.facebook._options.openGraphTags) {
            res.write('<head>');
            for(var ogt in Meteor.facebook._options.openGraphTags){
              var head = Meteor.facebook._options.openGraphTags[ogt](req);
              if (head) {
                for(var i in head){
                  res.write('<meta property="'+i+'" content="'+head[i]+'" />');
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