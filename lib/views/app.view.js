//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Application view
// -----------------

(function() {
    // Save a reference to the global object.
    var root = this;
  
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Views = root.Views;
    if (typeof Views === 'undefined') Views = root.Views = {};
    if (typeof exports !== 'undefined') module.exports = Views;
    
    // Extend the Backbone 'view' object and add it to the 
    // namespaced view container
    Views.ApplicationView = Backbone.View.extend({
    
        el : $('#application'),
    
        //###Templates
        // Predefined markdown templates for dynamic rendering
        template             : _.template($('#application-template').html()),
        statsTemplate        : _.template($('#application-stats-template').html()),
        loginTemplate        : _.template($('#login-template').html()),
        signupTemplate       : _.template($('#signup-template').html()),
        settingsTemplate     : _.template($('#settings-template').html()),
        createRoomTemplate   : _.template($('#create-room-template').html()),
        notificationTemplate : _.template($('#notification-template').html()),
        
        //##Interaction events
        // These are all interaction events between the 
        // user and this view's DOM interface
        events : {
            'keyup'              : 'hideOnEscape',
            'click #show-rooms'  : 'showRooms',
            'click #show-users'  : 'showUsers',
            'click .cancel'      : 'hideDialogs',
            'click #overlay'     : 'hideDialogs',
            'click #logout'      : 'logout',
            
            // Create new room form
            'click #create-room'               : 'showCreateRoom',
            'click #create-room-form .submit'  : 'createRoom',
            'keypress #create-room-form input' : 'createRoomOnEnter',
            
            // Login form
            'click #login'               : 'showLogin',
            'click #login-form .submit'  : 'authenticate',
            'keypress #login-form input' : 'authenticateOnEnter',
            
            // Settings form
            'click #settings'               : 'showSettings',
            'click #settings-form .submit'  : 'saveSettings',
            'keypress #settings-form input' : 'saveSettingsOnEnter',
            
            // Registration form
            'click #signup'               : 'showSignup',
            'click #signup-form .submit'  : 'register',
            'keypress #signup-form input' : 'registerOnEnter',
            
            // Search form
            'keypress #search'  : 'searchOnEnter',
            'click #search-now' : 'searchOnEnter',
            
            // Friends
            'click #friend-list .icon'   : 'toggleFriendList',
            'click #favorite-list .icon' : 'toggleFavoriteList',
            'click #start-menu .icon'    : 'toggleSidebar'
        },
        
        //##initialize
        // Setup the model and view interactions, unlike the 'events' 
        // property, the event bindings below are programmatic listeners
        // to model and collection changes
        initialize : function(options) {
            _.bindAll(this, 
                'render', 'toggleNav', 'loading', 'loaded', 'toggleSidebar', 'statistics', 'subscribed',
                'addRoom', 'showCreateRoom', 'createRoom', 'allRooms', 'roomSubscribe', 'roomUnsubscribe', 
                'addUser', 'allUsers', 'userSubscribe', 'userUnsubscribe', 
                'authenticate', 'register', 'logout', 'checkSession',
                'toggleFriendList', 'allFriends', 'addFriend',
                'toggleFavoriteList', 'allFavorites', 'addFavorite',
                'conversationsReady', 'allConversations', 'addConversation'
            );

            // Create and bind the application model to this view,
            // then create a circular reference for traversing
            this.model = new Models.ApplicationModel();
            this.model.view = this;
            
            // Application model event bindings
            this.model.bind('change',    this.statistics);
            this.model.bind('subscribe', this.ready);
            
            // User collection event bindings
            this.model.users.bind('subscribe',   this.userSubscribe);
            this.model.users.bind('unsubscribe', this.userUnsubscribe);
            this.model.users.bind('add',         this.addUser);
            this.model.users.bind('change',      this.statistics);
            this.model.users.bind('reset',       this.allUsers);
            
            // Room collection event bindings
            this.model.rooms.bind('subscribe',   this.roomSubscribe);
            this.model.rooms.bind('unsubscribe', this.roomUnsubscribe);
            this.model.rooms.bind('add',         this.addRoom);
            this.model.rooms.bind('change',      this.statistics);
            this.model.rooms.bind('reset',       this.allRooms);
            
            // Current user event bindings
            root.user.bind('session',                 this.checkSession);
            root.user.conversations.bind('subscribe', this.coversationsReady);
            root.user.conversations.bind('add',       this.addConversation);
            root.user.conversations.bind('reset',     this.allConversation);
            root.user.friends.bind('add',             this.addFriend);
            root.user.friends.bind('reset',           this.allFriends);
            root.user.favorites.bind('add',           this.addFavorite);
            root.user.favorites.bind('reset',         this.allFavorites);
            
            this.render();
            
            // Set shortcuts to collection DOM
            this.searchInput      = this.$('#search');
            this.userList         = this.$('#users');
            this.roomList         = this.$('#rooms');
            this.sidebar          = this.$('#sidebar');
            this.mainContent      = this.$('#main-content');
            this.loginDialog      = this.$('#login-dialog');
            this.signupDialog     = this.$('#signup-dialog');
            this.createRoomDialog = this.$('#create-room-dialog');
            this.settingsDialog   = this.$('#settings-dialog');
            this.overlay          = this.$('#overlay');
            this.roomName         = this.$('input[name="room"]');
            this.friends          = this.$('#friend-list');
            this.friendList       = this.$('.friends');
            this.favorites        = this.$('#favorite-list');
            this.favoriteList     = this.$('.favorites');
            this.conversationList = this.$('#conversations');
            this.welcomeText      = this.$('#welcome-text');
            this.outerSpinner     = this.$('#spinner');
            this.innerSpinner     = this.$('#inner-spinner');

            // Create the loading spinner
            this.spinnerOpts = {
                lines  : 12,
                length : 17,
                width  : 7,
                radius : 18,
                color  : '#fff',
                speed  : 0.8,
                trail  : 60,
                shadow : true
            };
            this.spinner = new Spinner(this.spinnerOpts);
            this.isLoading = false;
            this.loading();

            // Navigation items for authentication toggling
            this.nav = {
                signup     : this.$('#signup'),
                login      : this.$('#login'),
                logout     : this.$('#logout'),
                settings   : this.$('#settings'),
                createRoom : this.$('#create-room')
            };
            
            // Internal sidebar settings, pull settings
            // from the cookie and bootstrap if required
            this.menuOpen      = $.cookie('menuOpen')      || 'false';
            this.friendsOpen   = $.cookie('friendsOpen')   || 'false';
            this.favoritesOpen = $.cookie('favoritesOpen') || 'false';
            
            this.nav.settings.hide();
            this.nav.logout.hide();
            
            if (this.menuOpen === 'true') $(this.el).addClass('menuOpen');
            if (this.friendsOpen === 'true') this.friends.addClass('open');
            if (this.favoritesOpen === 'true') this.favorites.addClass('open');
        },
        
        //###render
        // Render template contents onto the DOM, adding
        // any effects afterwards, such as icons
        render : function() {
            var content = this.model.toJSON(),
                view    = Mustache.to_html(this.template(), content),
                options = {
                    width  : 20,
                    height : 20
                };
            
            this.el.html(view);
            
            // Enable access keys
            // Set the control key and menu key to
            // 'SHIFT', so that it does not conflict
            // with native accesskeys. Setting both
            // keys to the same code will also enable 
            // an instant toggle effect on the tooltips
            KeyCandy.init('#application', {
                controlKey : 16,
                removeKey  : 16
            });
            
            // Create the icons for this view
            _.icon('home',       'home', options);
            _.icon('run',        'settings', options);
            _.icon('power',      'start-menu-icon');
            _.icon('slideshare', 'friends-icon');
            _.icon('bookmark',   'favorites-icon');
            _.icon('i',          'stats-icon');
            _.icon('github',     'github-icon');
            _.icon('chat',       'show-rooms');
            _.icon('users',      'show-users');

            return this;
        },
        
        //###statistics
        // Update the DOM view with the current application
        // statistics, this method is seperated and short for use
        // whenever child collections are updated
        statistics : function() {
            var totalOnline = this.model.online       || 0,
                totalUsers  = this.model.users.length || 0,
                totalRooms  = this.model.rooms.length || 0;
            
            this.$('#app-stats').html(Mustache.to_html(this.statsTemplate(), {
                totalOnline : totalOnline,
                totalUsers  : totalUsers,
                totalRooms  : totalRooms,
                version     : this.version
            }));
            return this;
        },

        //###checkSession
        // Toggle navigation based on session
        checkSession : function(session, options) {
            session._id && this.toggleNav();  
        },
        
        //###home
        // Homepage view settings
        home : function() {
            this.isHome = true;
            this.deactivateRoom();
            this.deactivateUser();
            this.el.addClass('home');
            this.welcomeText.show();
        },

        //###notHome
        // Since we aren't at the homepage anymore, adjust 
        // the view, pretty much reversing `home()`
        notHome : function() {
            if (this.isHome) {
                this.el.removeClass('home');
                this.welcomeText.hide();
                this.isHome = false;
            }
        },

        //###ready
        // The model has been subscribed to
        subscribed : function(resp) {
        },
        
        //###hideOnEscape
        // Close modal keystroke listener
        hideOnEscape : function(e) {
            if (e.keyCode == 27) {
                this.hideDialogs();
                this.loaded();
            }
        },
        
        //###hideDialogs
        // Remove all defined dialoges from the view
        hideDialogs : function() {
            this.$('.dialog').fadeOut(300);
            this.overlay.hide(300);
        },
        
        //###toggleNav
        // Alternate navigation based on user authentication
        toggleNav : function() {
            this.nav.signup.fadeOut(150);
            this.nav.login.fadeOut(150);
            this.nav.settings.fadeIn(150);
            this.nav.logout.fadeIn(150);
            this.nav.createRoom.fadeIn(150);
        },

        //###loading
        // Show the loading overlay and spinner 
        loading : function() {
            var self = this;
            if (!this.isLoading) {
                this.outerSpinner.fadeIn(50);
                this.spinner.spin(self.innerSpinner.get(0));
                this.isLoading = true;
            }
            return this;
        },

        //###loaded
        // Hide the loading overlay and spinner
        loaded : function() {
            var self = this;
            if (this.isLoading) {
                _.defer(function() {
                    self.spinner.stop();
                    self.outerSpinner.fadeOut(200);
                    self.isLoading = false;
                })
            }
            return this;
        },

        //###success
        // Default success message
        success : function(msg) {
            msg || (msg = 'Success');
            
        },

        //###error
        // Default error message
        error : function(msg) {
            msg || (msg = 'Error');
            
        },
        
        //###toggleSidebar
        // Open or close the sidebar menu, setting a cookie
        // to remember the setting
        toggleSidebar : function() {
            if (this.menuOpen == 'true') {
                this.menuOpen = 'false';
                $(this.el).removeClass('menuOpen');
            }
            else {
                this.menuOpen = 'true';
                $(this.el).addClass('menuOpen');
            }
            $.cookie('menuOpen', this.menuOpen);
        },
        
        //###toggleFriendList
        // Open or close the friend list, setting a cookie
        // to remember the setting
        toggleFriendList : function() {
            if (this.friendsOpen == 'true') {
                this.friendsOpen = 'false';
                this.friends.removeClass('open');
            }
            else {
                this.friendsOpen = 'true';
                this.friends.addClass('open');
                
                if (this.favoritesOpen == 'true') {
                    this.favoritesOpen = 'false';
                    this.favorites.removeClass('open');
                }
            }
            $.cookie('favoritesOpen', this.favoritesOpen);
            $.cookie('friendsOpen', this.friendsOpen);
        },
        
        //###allFriends
        // All rooms have been loaded into collection
        allFriends : function(friends) {
            this.friendList.html('');
            user.friends.each(this.addFriend);
        },
        
        //###addFriend
        // Add a single friend o the current veiw
        addFriend : function(friend) {
            var view = new Views.FriendView({
                model : friend
            }).render();
            
            this.friendList
                .append(view.el);
        },
        
        //###toggleFavoriteList
        // See: toggleFriendList for explanation
        toggleFavoriteList : function() {
            if (this.favoritesOpen == 'true') {
                this.favoritesOpen = 'false';
                this.favorites.removeClass('open');
            }
            else {
                this.favoritesOpen = 'true';
                this.favorites.addClass('open');
                
                if (this.friendsOpen == 'true') {
                    this.friendsOpen = 'false';
                    this.friends.removeClass('open');
                }
            }
            $.cookie('favoritesOpen', this.favoritesOpen);
            $.cookie('friendsOpen', this.friendsOpen);
        },
        
        //###allFavorites
        // All rooms have been loaded into collection
        allFavorites : function(favorites) {
            this.favoriteList.html('');
            user.favorites.each(this.addFavorite);
        },
        
        //###addFavorite
        // Add a single room room to the current veiw
        addFavorite : function(favorite) {
            var view = new Views.RoomView({
                model : favorite
            }).render();
            
            this.favoriteList
                .append(view.el);
        },
        
        //###conversationsReady
        // Conversations have been subscribed to
        conversationsReady : function(resp) {
            // Placeholder
        },
        
        //###allConversations
        // All rooms have been loaded into collection
        allConversations : function(friends) {
            this.conversationList.html('');
            root.user.conversations.each(this.addConversation);
        },
        
        //###addConversation
        // Add a single friend o the current veiw
        addConversation : function(convo) {
            var view = new Views.ConversationView({
                model : convo
            }).render();
            
            this.conversationList
                .append(view.el);
        },
        
        //###searchOnEnter
        // Create room keystroke listener, throttled function
        // returned to reduce load on the 'Server'
        searchOnEnter : _.debounce(function() {
            var self  = this,
                input = this.searchInput.val(),
                query = (input.length < 1) ? {} : {
                    keywords : { $in : [ input ] }
                };
            
            this.model.rooms.fetch({
                query : query
            });
            
        }, 1000),
        
        //###roomSubscribe
        // Room collection has been subscribed to
        roomSubscribe : function(data) {
            // Placeholder
        },
        
        //###roomUnsubscribe
        // Room collection has been subscribed to
        roomUnsubscribe : function(data) {
            // Placeholder
        },
        
        //###allRooms
        // All rooms have been loaded into collection
        allRooms : function(rooms) {
            this.roomList.html('');
            this.model.rooms.each(this.addRoom);
        },
        
        //###showRooms
        // Show the sidebar user list
        showRooms : function() {
            this.userList.fadeOut(150);
            this.roomList.fadeIn(150);
        },
        
        //###addRoom
        // Add a single room room to the current veiw
        addRoom : function(room) {
            var view = new Views.RoomView({
                model : room
            }).render();
            
            this.roomList
                .append(view.el);
        },
        
        //###deactivateRoom
        // Remove the current active room from the view,
        // as well as the DOM
        deactivateRoom : function() {
            if (this.activeRoom) {
                this.mainContent
                    .hide()
                    .html('');
                
                this.activeRoom.remove();
            }
        },
        
        //###activateRoom
        // Set the target room to this view's active 
        // room, setting it to the main DOM view
        activateRoom : function(params) {
            // Should probably hide room instead, maybe 
            // minimize it to the bottom toolbar
            this.deactivateRoom();
            
            // Get model by slug
            var model = this.model.rooms.filter(function(room) {
                return room.get('slug') === params;
            });

            if (!model || !model[0]) {
                this.router.navigate('/', true);
                return;
            }
            
            // Create a new main room view
            this.activeRoom = new Views.RoomMainView({
                model : model[0]
            });
            
            // Provide a way for the room to access this
            // view so that it may close itself, ect..
            this.activeRoom.view = this;
            this.loading();
            
            var self = this;
            this.mainContent
                .html(self.activeRoom.el)
                .fadeIn(50, function(){
                    // Placeholder
                })
                .show();
            
            // Create the icons for this view, should be done 
            // on the room view, but the app needs to load it 
            // into view first before icons can be loaded.
            _.icon('view',   'add-favorite')
            _.icon('noview', 'remove-favorite')
            _.icon('cross',  'leave-room')
            _.icon('quote',  'message-submit');
            
            // This will set the list view as active
            model[0].view && model[0].view.activate();
        },
        
        //###createRoom
        // Create new room
        createRoom : function() {
            this.loading();
            var name        = this.$('input[name="room"]'),
                restricted  = this.$('input[name="restricted"]'),
                description = this.$('textarea[name="description"]');

            var self = this;
            this.model.rooms.create({
                name        : name.val(),
                user_id     : user.get('id') || user.id,
                restricted  : restricted.val(),
                description : description.val()
            }, {
                finished : function(resp) {
                    _.defer(function() {
                        self.loaded();
                        self.router.navigate('/rooms/' + resp.slug, true);
                    });
                }
            });
            
            // Should probably pass this in a success function
            this.createRoomDialog.fadeOut(150);
            this.overlay.hide();
            
            // Reset fields
            name.val('');
            restricted.val('');
            description.val('');
        },
        
        //###createRoomOnEnter
        // Create room keystroke listener
        createRoomOnEnter : function(e) {
            if (e.keyCode == 13) this.createRoom();
        },
        
        //###showCreateRoom
        // Show the login form
        showCreateRoom : function() {
            var self = this;
            this.hideDialogs();
            this.overlay.fadeIn(150);
            this.createRoomDialog
                .html(Mustache.to_html(this.createRoomTemplate()))
                .fadeIn(150, function(){
                
                    // Apply happy validation schema, this might be 
                    // better placed and only accessed here, as the 
                    // DOM elements must exist before they can be happy
                    self.$('#create-room-form').isHappy({
                        fields : {
                            '#create-room-name' : {
                                required : true,
                                message  : 'Please name this room'
                            },
                            '#create-room-description' : {
                                required : true,
                                message  : 'Give some info about this room'
                            }
                        },
                        submitButton : '#create-room-submit',
                        unHappy : function() {
                            alert('Create room is unhappy. :(');
                        }
                    });
                })
                .draggable()
                .find('input[name="room"]').focus();
        },
        
        //###userSubscribe
        // Users collection has been subscribed to
        userSubscribe : function(data) {
            // Placeholder
        },
        
        //###userUnsubscribe
        // Users collection has been unsubscribed from
        userUnsubscribe : function(data) {
            // Placeholder
        },
        
        //###deactivateRoom
        // Remove user profile from DOM and view
        deactivateUser : function() {
            if (this.activeUser) {
                this.mainContent.html('');
                this.activeUser.remove();
            }
        },
        
        //###activateUser
        // Show the user profile / main view
        activateUser : function(params) {
            this.deactivateUser();
            
            // Get model by ID
            var model = this.model.users.filter(function(user) {
                return user.get('username') === params
                    || user.get('_id') === params;
            });
            if (!model || !model[0]) {
                this.router.navigate('/', true);
                return;
            }
            this.loading();
            this.activeUser = new Views.UserMainView({
                model : model[0]
            });
            
            // Make view accessable to inner-view
            this.activeUser.view = this;

            var self = this;
            this.mainContent
                .stop()
                .html(self.activeUser.el)
                .fadeIn(50, function() {
                    $(this)
                        .find('.avatar')
                        .fadeIn(1500);
                });
                
            // Create the icons for this view, should be done 
            // on the room view, but the app needs to load it 
            // into view first before icons can be loaded.
            _.icon('star',  'add-friend')
            _.icon('star2', 'remove-friend')
            _.icon('mail',  'send-message')
            _.icon('cross', 'leave-profile')
            _.icon('quote', 'post-submit');
        },
        
        //###showSettings
        // Show the login form
        showSettings : function() {
            var self = this;
            this.hideDialogs();
            this.overlay.fadeIn(150);
            this.settingsDialog
                .html(Mustache.to_html(this.settingsTemplate(), user.toJSON()))
                .fadeIn(150, function() {
                
                    // Apply happy validation schema, this might be 
                    // better placed and only accessed here, as the 
                    // DOM elements must exist before they can be happy
                    self.$('#settings-form').isHappy({
                        fields : {
                            '#settings-username' : {
                                required : true,
                                message  : 'What should we call you?'
                            },
                            '#settings-email' : {
                                required : true,
                                message  : 'Email is required',
                                test     : happy.email
                            }
                        },
                        submitButton : '#settings-submit',
                        unHappy : function() {
                            alert('Settings are unhappy. :(');
                        }
                    });
                })
                .draggable()
                .find('input[name="displayname"]').focus();
        },
        
        //###saveSettings
        // Save updated user settings
        saveSettings : function() {
            var self = this;
                data = {
                    bio         : this.$('textarea[name="bio"]').val(),
                    email       : this.$('input[name="email"]').val(),
                    password    : this.$('input[name="password"]').val(),
                    displayName : this.$('input[name="displayname"]').val()
                };
            
            user.save(data, {channel : 'app:users'});
            this.settingsDialog.fadeOut(150);
            this.overlay.hide();
        },
        
        //###saveSettingsOnEnter
        // Create room keystroke listener
        saveSettingsOnEnter: function(e) {
            if (e.keyCode == 13) this.saveSettings();
        },
        
        //###showUsers
        // Show the sidebar user list
        showUsers : function() {
            this.roomList.fadeOut(150);
            this.userList.fadeIn(150);
        },
        
        //###allUsers
        // All rooms have been loaded into collection
        allUsers : function(users) {
            this.userList.html('');
            this.model.users.each(this.addUser);
        },
        
        //###addUser
        // Add a single room room to the current veiw
        addUser : function(user) {
            var view = new Views.UserView({
                model : user
            }).render();
            
            this.userList
                .append(view.el);
        },
        
        //###showLogin
        // Show the login form
        showLogin : function() {
            this.hideDialogs();
            this.overlay.fadeIn(150);
            this.loginDialog
                .html(Mustache.to_html(this.loginTemplate()))
                .fadeIn(150, function() {
                
                    // Apply happy validation schema, this might be 
                    // better placed and only accessed here, as the 
                    // DOM elements must exist before they can be happy
                    self.$('#login-form').isHappy({
                        fields : {
                            '#login-username' : {
                                required : true,
                                message  : 'Who are you again?'
                            },
                            '#login-password' : {
                                required : true,
                                message  : 'Password please'
                            }
                        },
                        submitButton : '#login-submit',
                        unHappy : function() {
                            alert('Login is unhappy. :(');
                        }
                    });
                })
                .draggable()
                .find('input[name="username"]').focus();
        },
        
        //###authenticate
        // Authenticate the current user, check the credentials
        // sent on the Server side, which will return the client 
        // data to update the default model with
        authenticate : function() {
            var self = this,
                data = {
                    username : this.$('input[name="username"]').val(),
                    password : this.$('input[name="password"]').val()
                },
                options = {
                    token : token,
                    error : function(code, data, options) {
                    },
                };
            
            user.authenticate(data, options, function(resp) {
                self.toggleNav();
            });
            this.loginDialog.hide();
            this.overlay.hide();
        },
        
        //###authenticateOnEnter
        // Authentication keystroke listener
        authenticateOnEnter: function(e) {
            if (e.keyCode == 13) this.authenticate();
        },
        
        //###showSignup
        // Show the login form
        showSignup : function() {
            var self = this;
            this.hideDialogs();
            this.overlay.fadeIn(150);
            this.signupDialog
                .html(Mustache.to_html(this.signupTemplate()))
                .fadeIn(150, function(){
                
                    // Apply happy validation schema, this might be 
                    // better placed and only accessed here, as the 
                    // DOM elements must exist before they can be happy
                    self.$('#signup-form').isHappy({
                        fields : {
                            '#signup-username' : {
                                required : true,
                                message  : 'What should we call you?'
                            },
                            '#signup-email' : {
                                required : true,
                                message  : 'We need a way to reach you',
                                test     : happy.email
                            },
                            '#signup-password' : {
                                required : true,
                                message  : 'Password required',
                                test     : happy.minLength(7)
                            }
                        },
                        submitButton : '#signup-submit',
                        unHappy : function() {
                            alert('Signup is unhappy. :(');
                        }
                    });
                })
                .draggable()
                .find('input[name="username"]').focus();
        },
        
        //###register
        // Authenticate the current user, check the credentials
        // sent on the Server side, which will return the client 
        // data to update the default model with
        register : function() {
            var self = this,
                data = {
                    username    : this.$('input[name="username"]').val(),
                    displayName : this.$('input[name="displayname"]').val(),
                    email       : this.$('input[name="email"]').val(),
                    password    : this.$('input[name="password"]').val(),
                },
                options = {
                    token : token,
                    error : function(code, data, options) {
                    }
                };
            
            user.register(data, options, function(resp) {
                self.toggleNav();
            });
            this.signupDialog.hide();
            this.overlay.hide();
        },
        
        //###registerOnEnter
        // Registration keystroke listener
        registerOnEnter: function(e) {
            if (e.keyCode == 13) this.register();
        },
        
        //###logout
        // Destroy the current user object and restore original
        // navigation display
        logout : function() {
            user.logout({
                token : this.sid
            });
            
            this.friendList.html('');
            this.favoriteList.html('');
            user = new Models.UserModel();
            
            this.conversationList.html('');
            root.user.conversations = new Models.ConversationCollection();
            
            this.nav.signup.fadeIn(150);
            this.nav.login.fadeIn(150);
            this.nav.settings.fadeOut(150);
            this.nav.logout.fadeOut(150);
        }
    });

}).call(this)