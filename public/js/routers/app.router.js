//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

//(function() {
    // Application
    // ----------
    
    // Save a reference to the global object.
    var root = this;
  
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Routers = root.Routers;
    if (typeof Routers === 'undefined') Routers = root.Routers = {};
    if (typeof exports !== 'undefined') module.exports = Routers;
    
    // Main controller and router
    Routers.Application = Backbone.Router.extend({
    
        // Definitions
        routes : {
            '/rooms/:id' : 'joinRoom',
            '/users/:id' : 'viewProfile',
            '/signup'    : 'signup',
            '/login'     : 'login',
            '/'          : 'home',
            //'*uri'       : 'invalid',
        },
        
        initialize : function(options) {
            // Attach the application
            this.view = new Views.ApplicationView({
                el     : $('#application'),
                server : options.server || false
            });
            
            // Circular reference
            this.view.router = this;
        },
        
        home : function() {
            this.view.deactivateRoom();
        },
        
        // Default action
        invalid : function(uri) {
            console.log('invalid route: ', uri);
            this.navigate('/', true);
        },
        
        // Join a room room
        joinRoom : function(id) {
        
            // Make sure that the room has been 
            // loaded by the application first
            this.view.activateRoom(id);
        },
        
        // View a user profile
        viewProfile : function(id) {
        
            // Make sure that the room has been 
            // loaded by the application first
            this.view.activateUser(id);
        },
        
        // Show the login form
        login : function() {
            this.view.showLogin();
        },
        
        // Show the login form
        signup : function() {
            this.view.showSignup();
        },
    });
//})()