var bg = chrome.extension.getBackgroundPage();
var settings = bg.settings;
require.scopes.load = ( () => {

    function JSONfromLocalFile(path){
        return JSON.parse(loadExtensionFile(path, 'json'));
    }

    function loadExtensionFile(url, returnType, source){
        var xhr = new XMLHttpRequest();

        if(source === 'external'){
            xhr.open("GET", url, false);
        }
        else {
            xhr.open("GET", chrome.extension.getURL(url), false);
        }

        xhr.send(null);

        if (xhr.readyState != 4) {
            return;
        }

        if (returnType === 'xml') {
            return xhr.responseXML;
        }
        
        if (returnType === 'json') {
            return xhr.responseText;
        }
    }

    function processMozillaBlockList(blockList){
        /* format Mozilla block list for our use
         * https://raw.githubusercontent.com/mozilla-services/shavar-prod-lists/master/disconnect-blacklist.json
         * "<tracker host>" : { "c": <company name>, "u": "company url" }
         */
        var trackers = {};
        var trackerTypes = ['Advertising', 'Analytics', 'Disconnect'];
        
        if (settings.getSetting('socialBlockingIsEnabled')) {
            trackerTypes.push('Social');
        }

        trackerTypes.forEach((type) => {
            blockList.categories[type].forEach((entry) => {
                for(var name in entry){
                    for( var domain in entry[name]){
                        entry[name][domain].forEach((trackerURL) => {
                        trackers[trackerURL] = {'c': name, 'u': domain};
                        });
                    }
                    
                    // Facebook and Twitter are listed as Disconnect type
                    // Remap them to Social
                    if ((type === 'Disconnect') && (name.match(/(facebook|twitter)/i))) {
                        blockList.categories.Social.push(entry);
                        var id = blockList.categories.Disconnect.indexOf(entry);
                        blockList.categories.Disconnect.splice(id, 1);
                    }
                }
            });
        });

        return trackers;
    }

    var exports = {
        loadExtensionFile: loadExtensionFile,
        processMozillaBlockList: processMozillaBlockList,
        JSONfromLocalFile: JSONfromLocalFile
    }
    return exports;
})();
