/*jslint white: false, onevar: trupree, browser: true, devel: true, undef: false, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: false, newcap: true, immed: true */
/* See http://www.jslint.com/ */

var jQT = new $.jQTouch({
  icon: 'apple-touch-icon.png',
  //addGlossToIcon: false,
  startupScreen: "apple-touch-startup.png",
  statusBar: 'black-translucent',
  formSelector: '.form',
  preloadImages: [
    '/jqtouch/themes/ideiame/img/back_button.png',
    '/jqtouch/themes/ideiame/img/back_button_clicked.png',
    '/jqtouch/themes/ideiame/img/button_clicked.png'
  ]
});


jQuery(function () {
  // Add custom handler code here.

  $("#sobremim").bind("pageAnimationEnd", function (e, info) {
    if (info.direction === "out") {
      return;
    }
    var $page = $(this);
    if ($page.data("loaded")) {
      return;
    }

    $.getJSON('http://twitter.com/users/jonatasdp.json?callback=?', 
       function(eu) { 

         $('#foto_twitter').attr('src',eu.profile_image_url); 
         $('#resume_twitter').text(eu.description); 

         $page.data("loaded", true);
       }
    ); 
  });
      

  // $("#home").bind("pageAnimationEnd", function(e, info) {
  //   alert("Animating #home " + info.direction);
  // });

  $("#login a.login").tap(function (e) {
    var $form = $(this).closest("form");
    return app.login($form);
  });
  
  $("#login").submit(function (e) {
    var $form = $(this);
    return app.login($form);
  });

  prettyPrint(); 

});
