
Template.mainContentTemplate.helpers({
  isPage:function(page){
    return Session.get('page') === page;
  }
});

