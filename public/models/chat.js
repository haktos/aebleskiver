(function(Models) {
    // Chat model
    // ------------------
    
    // Chat room
    Models.ChatModel = Backbone.Model.extend({
        defaults : {
            'created' : true,
            'name' : 'Unknown',
            'tags' : [
                'general'
            ],
            'messages' : [],
        },
        
        // Populate room with messages
        populate : function() {
                    console.log('chat populate: ', this);
            this.messages = new Models.MessageCollection();
            this.messages.url = this.url() + ':messages';
            
            var self = this;
            var add = (this.messages.length === 0) ? false : true;
            var params = {
            };
            this.messages.subscribe(params, function() {
                self.attributes.messages = _.uniq(self.attributes.messages);
                
                // Models that contain collections hold an array of 
                // id's, backbone will build the complete url/key
                _.each(self.attributes.messages, function(id) {
                    console.log('chat message each: ', id);
                
                    // Create a backbone object
                    var model = new Models.MessageModel();
                    
                    // Set the lookup id
                    model.set({id : id});
                    
                    // Tell backbone that incomming model belongs 
                    // to this model's message collection
                    model.collection = self.messages;
                    
                    var params = {
                        // This will be called from the server through 
                        // DNode once the async processing is done
                        finished : function(data) {
                            console.log('chat message fetch finished: ', data);
                            //if (!self.model.messages.get(data.id)) self.model.messages.add(data);
                            if (add) self.messages.add(data);
                        },
                    };
                    // Fetch the data from the server
                    model.fetch(params);
                });
            });
        },
        
        // Remove this view from the DOM, and unsubscribe from 
        // all future updates to the message collection
        remove : function() {
            var self = this;
            var params = {
                error    : function(data) {},
                finished : function(data) {},
            };
            this.messages.unsubscribe(params, function(resp) {
                self.messages.each(function(message) {
                    //message.clear();
                });
            });
        },
        
        // Create and send a new message
        createMessage : function(attr) {
            var self = this;
            var params = {
                finished : function(resp) {
                    
                    console.log('createMessage: ', resp);
                    
                    // Add the newly created ID to this model's
                    // key collection for future lookups
                    var keys = _.without(self.get('messages'), resp.id);
                    keys.push(resp.id);
                    
                    // Only keep the last 200 messages that were sent, the rest will 
                    // become archived by virtue of not being used any further
                    if (keys.length > 200) keys = _.rest(keys, (keys.length - 200));
                    self.save({messages : keys});
                    delete keys;
                },
            };
            this.messages.create(attr, params);
        },
    });
    
    // Chat Collection
    Models.ChatCollection = Backbone.Collection.extend({
        
        model : Models.ChatModel,
        url   : 'chats',
        name  : 'chats',
        
        // Initialize
        initialize : function(options) {
        }
    });
    
})(Models)