
(function(){

  Meteor.setInterval(function(){
    Session.set('tick-min', (new Date()).getTime());
  }, 60*1000);

})();
