//
// www.calcoolate.com javaScript calculator
//
// Copyright (c) 2006. All rights reserved
//

//
// preferences management
//
var preferencesCookie = "calcPref";
var prefs = {saveHistory:true,saveConvertHistory:true,angle:'rad',dot:'dot' }

function loadPreferences()
{
    var pairs = new Array();

    var cookie = readCookie(preferencesCookie);
    while (cookie != null && cookie.indexOf("=")>=0) {
        var valueIndex = cookie.indexOf("=");
        var nextSettingIndex = cookie.indexOf("//");
        var setting = cookie.substring(0, valueIndex);
        if (nextSettingIndex != -1) {
            var value = cookie.substring(valueIndex+1, nextSettingIndex);
            cookie = cookie.substring(nextSettingIndex+2);
        } else {
            var value = cookie.substring(valueIndex+1);
            cookie = "";
        }
        var pair = new Object();
        pair.setting = setting;
        pair.value = value;
        pairs[pairs.length] = pair;
    }

    for (var i=0; i < pairs.length; i++)
    {
        var pair = pairs[i]
        if (pair.setting == "saveHistory")
        {
            if (pair.value == "true")
                prefs.saveHistory = true;
            else
                prefs.saveHistory = false;
        } else if (pair.setting == "saveConvertHistory")
        {
            if (pair.value == "true")
                prefs.saveConvertHistory = true;
            else
                prefs.saveConvertHistory = false;
        } else if (pair.setting=="angle") {
            prefs.angle=pair.value;
        } else if (pair.setting=="dot") {
            prefs.dot=pair.value;
        }
    }
}

function savePreferencesCookie()
{
    var cookieVal = "";

    if (prefs.saveHistory == true)
        cookieVal += "saveHistory=true//";
    else
        cookieVal += "saveHistory=false//";

    if (prefs.saveConvertHistory == true)
        cookieVal += "saveConvertHistory=true//";
    else
        cookieVal += "saveConvertHistory=false//";

    cookieVal += "angle="+prefs.angle+"//";
    cookieVal += "dot="+prefs.dot+"//";

    // save it

    createCookie(preferencesCookie, cookieVal, 365*10)
}