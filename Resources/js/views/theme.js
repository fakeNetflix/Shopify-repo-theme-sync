YUI().use('view','event-custom','event-focus','array-extras', function(Y) { 
///start

//Global handler for when a theme is being watched/unwatched.
Y.Global.on('watch:start', function(e) {
    var el = Y.one('.themes li#theme-'+e.themeId+'.nowatch');
    if(el) {
        el.replaceClass('nowatch', 'watch');
    }
});

Y.Global.on('watch:stop', function(e) {
    var el = Y.one('.themes li#theme-'+e.themeId+'.watch');
    el.replaceClass('watch', 'nowatch');
});

Themer.ThemeView = Y.Base.create('themeView', Y.View, [], {
    
    template: Y.one('#theme-li-template').getContent(),

    initializer: function(e) {
        this.container = Y.Node.create('<li id="theme-' + e.model.get('id') + '" class="nowatch"></li>');
        //Attach here instead, because container isn't available during create
        this.container.delegate('click', function() {
            Titanium.Platform.openURL('file://'+e.model.get('path'));
        }, '.path');
        this.container.delegate('click', this.remove, 'button.remove-theme', this);
    },
    
    render: function() {
        var container = this.container, 
            model = this.model;
        
        var viewButton = function(themeModel) {
            var args = {text: 'Preview', src: 'http://'+themeModel.get('parent_id')+'.myshopify.com/?preview_theme_id='+themeModel.get('id') };
            if('main' == themeModel.get('role')) {
                 args = {text: 'View Shop', src: 'http://'+themeModel.get('parent_id')+'.myshopify.com'};
            }

            return Y.Lang.sub("<a href='{src}' class='btn external'>{text}</a>", args);
        };

        var data = model.toJSON();
        data.viewButton = viewButton(model);
        container.setContent(Y.Lang.sub(this.template, data));
        
        return this;
    },
    
    remove: function(e) {
        console.log('ThemeView:remove');
        this.constructor.superclass.remove.call(this);
        this.model.destroy({'delete': true});
    }    
});


///end
});
