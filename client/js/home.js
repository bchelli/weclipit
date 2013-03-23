
Template.homeTemplate.helpers({
  isHomePage:function(){
    return Session.get('page') === 'home';
  }
});

Template.homeTemplate.rendered = function(){
};