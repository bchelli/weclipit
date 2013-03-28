
Template.homeTemplate.helpers({
  isHomePage:function(){
    return Session.get('page') === 'home';
  }
});

Template.homeTemplate.rendered = function(){
  // SET NICE SCROLL
  setNicescroll("#video-right-container");
};