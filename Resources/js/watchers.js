YUI().use('event-custom', function(Y) {
//BEGIN Y closure
//@note potential issue: Right now, works fine for spinning up a minimal amount of watchers. 
//      Will have to see what the limits are, and maybe refactor how we initialize them

var Watcher = YUI.namespace('Themer.Watcher');

//Keep track of all initialized watchers
// { process: , socket: , theme: , shop:  }
Watcher.watchers = {};

Watcher.processes = [];
// Watcher.sockets = [];

//Initialize all watchers on startup
Watcher.init = function(app) {

    app.shops.each(function(shop) {
        var themes = new Themer.themeList();
        themes.parent_id = shop.get('id');
        themes.load();

        themes.each(function(theme) {
            Watcher.start(shop, theme);
        });

    });
};

//Will find an open port to spin up server on
//Looks between 40000 - 50000 range
//If you know a better way to do this, please, let me know!
Watcher.start = function(shop, theme) {
    var port = random(40000, 50000);
    
    var portProc = Titanium.Process.createProcess({
        args: ["lsof", "-i", ":"+port],
        env: {'PATH': '/usr/sbin:/usr/bin:/bin'}
    });

    portProc.setOnExit(function(e) {
        //code 0 == port not avail
        // code 1 == port available
        // console.log("Exit Code:" + e.getTarget().getExitCode());
        if(e.getTarget().getExitCode() == 1) {
            //Port avail, start
            console.log('Port Available. Starting Watcher...');
            Watcher.watch(shop, theme, port);
        } 
        else {
            console.log("Exit Code:" + e.getTarget().getExitCode());
            Watcher.start(shop, theme);
        }
    });
    
    portProc.launch();
    
};

Watcher.watch = function(shop, theme, port) {
    console.log('Watch Theme: '+theme.get('id') + ' on port: '+port);

    //Need to send in port as a string, else 'd' appended to it: ie: 40000 becomes 40000d
    var process = Titanium.Process.createProcess({
        args: ["/Users/mitch/src/shopify-theme2/Resources/lib/watch_server.rb",theme.get('path'), port.toString()],
        env: {'PATH': '/usr/bin:/bin'}
    });

    process.launch();
    Watcher.processes.push(process);
    
    //@todo check if we get a race condition where process isn't running, but we try to establish socket
    console.log('Watch process launched: '+ process.getPID());
    console.log('Watch process running: '+ process.isRunning());
    //Give server a second to spinup
    setTimeout(function() {
        Watcher.connect(shop, theme, port);
    }, 1000);

};

Watcher.connect = function(shop, theme, port, attempt) {
    console.log('Connecting socket theme: '+theme.get('id') +  ' on port '+ port);
        
    var maxAttempts = 3;

    attempt = attempt || 1;

    //port needs to be an int
    var socket = Titanium.Network.createTCPSocket('127.0.0.1', parseInt(port, 10));

    socket.onError(function(e) {
        console.log('Error with socket');
        console.log(e);
        if(attempt <= maxAttempts) {
            console.log('Next try: '+ (1 * attempt)+'s');
            setTimeout(function() {
                Watcher.connect(shop, theme, port, (attempt+1));
            }, 1000 * attempt);
        } else {
            console.log('Too many attempts');
        }
    });
    socket.onTimeout(function(e) {
        console.log('Timeout with socket');
        // console.log(e);
    });
    
    //@todo send a CONNECTED message, so we can fire the watch:start event here.
    socket.onRead(function(e) {
        console.log('Read');
        console.log(e.toString());
    });
    // socket.onReadComplete(function(e) {
    //     console.log('ReadComplete');
    // });
    socket.connect();
    Y.Global.fire('watch:start', {
        themeId: theme.get('id')
    });
    // Watcher.sockets.push(socket);
    console.log('Socket is closed? '+ socket.isClosed());
};

//Clean up watchers on exit.
Ti.API.addEventListener(Titanium.APP_EXIT, function() {
    Titanium.API.warn('Exiting...');
    Watcher.processes.forEach(function(p) {

        Titanium.API.warn('Killing '+ p.getPID());
        if(p.isRunning()) {
            p.kill();
        }
    });
});


//end closure
});