// JavaScript Document

//manually store session user info with cookie

function func_checkCookieExists(cookie1, cookie2) {
	
	if(document.cookie.indexOf(cookie1) == -1){
		console.log('couldnt find' + cookie1);
		return false;
	}
	
	if(document.cookie.indexOf(cookie2) == -1){
		console.log('couldnt find' + cookie2);
		return false;
	}
	
	return true;
}

function func_createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

function func_readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function func_eraseCookie(name) {
    func_createCookie(name,"",-1);
	 console.log('Cookie ' + name + ' was deleted');
}

function func_destroyAllDomainCookies() {
	var cookiesARR = document.cookie.split(";");
	for (var i = 0; i < cookiesARR.length; i++){
		console.log(cookiesARR[i].split("=")[0] + ' is gonna get destroyed');
		func_eraseCookie(cookiesARR[i].split("=")[0]);
	}
}

/*
// Create a Cookie for one week
func_createCookie('myCookie', 'The value of my cookie...', 7)

// Read the cookie (note this will only work on the page loads after the cookie is created)
var myCookie = func_readCookie('myCookie');
console.log(myCookie); // Outputs: "The value of my cookie..."

// Erase the cookie (only works on page loads after the cookie was created)
func_eraseCookie('myCookie')
*/