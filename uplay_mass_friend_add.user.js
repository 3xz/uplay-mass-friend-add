// ==UserScript==
// @name           Mass Friend Adding
// @namespace      https://github.com/3xz
// @description    Add a list of friends into uplay
// @version        1.0
// @include        https://club.ubi.com/#!/*/friends
// @require        https://gist.github.com/raw/2625891/waitForKeyElements.js
// ==/UserScript==

waitForKeyElements (".friend-requests-title", embed);

function embedElement(element, toEmbed, exec)
{
	var tag = document.createElement(element);
	tag.setAttribute('for', 'massFriendAdding');
	tag.textContent = toEmbed.toString();
	if (exec) tag.textContent = "(" + tag.textContent + ")();";
	document.body.appendChild(tag);
}

function mfa_setupUI() {
    var usernameListTextarea = document.createElement("textarea");
    var usernameListDiv = document.createElement("div");
    
    var anchorElement = document.getElementsByClassName("friend-requests-title")[0];
    var parentDiv = anchorElement.parentNode;

    usernameListTextarea.setAttribute("id", "mfa_usernameListTextarea");
    usernameListTextarea.setAttribute("class", "no-search-results ng-scope");    
    parentDiv.insertBefore(usernameListTextarea, anchorElement);
    
    usernameListDiv.setAttribute("id", "mfa_usernameListDiv");
    usernameListDiv.setAttribute("class", "pull-right");
    usernameListDiv.innerHTML = '<button onclick="javascript:mfa_main()" id="mfa_usernameListButton" class="btn">Add friends</button><br />';
    
    parentDiv.insertBefore(usernameListDiv, anchorElement);
}


function mfa_getUsernames() {
    var usernames = document.getElementById("mfa_usernameListTextarea").value; 
    usernames = usernames.split("\n").map(function(n) { return n.trim() });
    
    return usernames;
}

function mfa_getUserId(username) {
    $.ajax({
        method: "GET",
        url: "https://api-ubiservices.ubi.com/v2/profiles",
        data: { nameOnPlatform: username, platformType: "uplay" },
        beforeSend: function(xhr){
            xhr.setRequestHeader('Authorization', 'Ubi_v1 t=' + ticketService.configSvc.getCookie("ticket"));
            xhr.setRequestHeader('Ubi-AppId', ticketService.configSvc.getAppId());
        },
    })
    .done(function(msg) {
        if (!msg.profiles[0].userId || msg.profiles[0].userId == "") {
            mfa_addMsg("Couldn't find " + username);
            return;
        } else {
            mfa_postUserIds(msg.profiles[0].userId);
        }
    })
    .fail(function() {
        mfa_addMsg("There was an error with " + username);
    });
}

function mfa_postUserIds(userId) {
    $.ajax({
        method: "POST",
        url: "https://api-ubiservices.ubi.com/v1/profiles/me/friends",
        contentType :   'application/json',
        data: JSON.stringify( { friends: [userId] } ),
        beforeSend: function(xhr){
            xhr.setRequestHeader('Authorization', 'Ubi_v1 t=' + ticketService.configSvc.getCookie("ticket"));
            xhr.setRequestHeader('Ubi-AppId', ticketService.configSvc.getAppId());
            xhr.setRequestHeader('Ubi-SessionId', ticketService.configSvc.getCookie("sessionId"));
        },
    })
    .done(function(msg) {
        mfa_addMsg("Pushed this uuid: " + userId);
    })
    .fail(function() {
        mfa_addMsg("There was an error with " + userId);
    });
}

function mfa_addMsg(msg) {
    var msgDiv = document.getElementById("mfa_usernameListDiv");
    
    msgDiv.innerHTML = msgDiv.innerHTML + msg + "<br />";
}

function mfa_main() {
    var usernames = mfa_getUsernames();
    var userIds = [];
    
    
    for (var i = 0; i < usernames.length; i++) {
        mfa_getUserId(usernames[i]);
    }
}

function embed() {
    embedElement('script', mfa_getUsernames, false);
    embedElement('script', mfa_getUserId, false);
    embedElement('script', mfa_addMsg, false);
    embedElement('script', mfa_postUserIds, false);
    embedElement('script', mfa_main, false);
    embedElement('script', mfa_setupUI, true);
}