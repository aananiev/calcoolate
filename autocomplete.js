
//
// www.calcoolate.com javaScript calculator
//
// Copyright (c) 2006. All rights reserved
//

// Auto complete edit box

// Styles used
//  .ac_normal   { background-color:#e0ecff}
//  .ac_border   { border-color:black; background-color:#e0ecff; border-collapse:collapse }
//  .ac_selected { background-color:#c3d9ff}

var AC_popupId = 'AC_popup'
var AC_current = null

var AC_currectOptions = -1
var AC_currectSelectedIndex = -1

function AutoComplete(fieldId, options)
{
    if (!document.getElementById(AC_popupId))
        document.write("<div id='"+AC_popupId+"' style='display:none;position:absolute;width:400px;height:400px;z-index:100'></div>")

    var o = new Object()
    o.fieldId = fieldId
    o.options = options

    // User controlled options
    o.openOnEmptyText = false
    o.errorIfNotMatching = false
    o.maxRows = 10
    o.onlyPrefixMatch = false
    o.markMatchedSubStrings = true
    o.highliteFirstMatch = false

    o.open = function()
    {
        AC_current = this
        AC_open(this)
    }

    o.close = function()
    {
        setTimeout("AC_close('"+this.fieldId+"')", 500) // Allow selection to complete first
    }

    o.onkeydown = function(event)
    {
        AC_onkeydown(event)
    }

    o.onkeyup = function(event)
    {
        AC_onkeyup(event, this)
    }

    o.setOptions = function(options)
    {
        o.options = options
    }

    return o
}

function AC_position(fld)
{
    var pos = new Object()
    pos.left = 0
    pos.top  = 0
    var item = fld
    while (item)
    {
        if (item.style.position == 'absolute')
            break

        pos.left += item.offsetLeft
        pos.top  += item.offsetTop
        item= item.offsetParent
    }

    return pos
}
function AC_open(autoComplete)
{
    var v = ""
    v += "<table border='1' cellspacing='0' cellpadding='0' class='ac_border' id='AC_area'><tr><td><table border='0'>"
    v += "<tr><td id='AC_options'></td></tr>"
    v += "</table>"
    v += "</td></tr></table>"

    var fld = document.getElementById(autoComplete.fieldId)
    var pos = AC_position(fld)
    var p  = document.getElementById(AC_popupId)
    p.style.left = pos.left+"px"
    p.style.top  = pos.top+fld.offsetHeight+"px"
    p.style.display = "block"

    var p  = document.getElementById(AC_popupId)
    p.innerHTML = v

    AC_populate(autoComplete)
}

function AC_show(show)
{
    if (show)
        document.getElementById(AC_popupId).style.display="block"
    else
        document.getElementById(AC_popupId).style.display="none"
}


// Populate all the matching rows
function AC_populate(autoComplete)
{
    var text = document.getElementById(autoComplete.fieldId).value
    AC_currectOptions = AC_match(autoComplete)
    AC_currectSelectedIndex = -1
    AC_show(AC_currectOptions.length > 0)
    var v = "<table border='0' cellpadding='0' cellspacing='0' class='ac_normal'>"
    for (i in AC_currectOptions)
    {
        var textObj = AC_currectOptions[i]
        var showText = textObj.displayText
        var setText = textObj.selectText
        v += "<tr><td nowrap='true' id='AC_option"+i+"' onmouseover='AC_high("+i+",true)' onmouseout='AC_high("+i+",false)' onclick='AC_set(&quot;"+setText+"&quot;)'>"+showText+"</td></tr>"
    }
    v += "</table>"

    var p  = document.getElementById(AC_popupId)
    p.style.width = "1000px" // Allow table to grow to needed size without wrapping
    p.style.height = "1000px"
    document.getElementById("AC_options").innerHTML = v
    var area  = document.getElementById('AC_area')
    p.style.width=area.style.width // Reset to minimal required size (so that it does not hide clicks on lower layers)
    p.style.height=area.style.height

    if (AC_currectOptions.length > 0 && autoComplete.highliteFirstMatch)
        AC_high(0, true)
}

// Find all matching entries
function AC_match(autoComplete)
{
    var matches = new Array()
    var text = document.getElementById(autoComplete.fieldId).value
    if (text == '' && !autoComplete.openOnEmptyText)
        return matches
    textLower = text.toLowerCase()

    for (iv in autoComplete.options)
    {
        var option = autoComplete.options[iv]
        var optionLower = option.toLowerCase()
        var isMatch = false
        if (autoComplete.onlyPrefixMatch)
        {
            if (text.length <= option.length && optionLower.substring(0,textLower.length) == textLower)
                isMatch = true
        }
        else
        {
            if (optionLower.indexOf(textLower) >= 0)
                isMatch = true
        }
        if (isMatch)
        {
            var textObj = new Object()
            textObj.selectText = option
            if (autoComplete.markMatchedSubStrings && text.length > 0)
            {
                // Mark the matching substrings
                var rem = option
                var remLower = optionLower
                var displayText = ''
                var i = remLower.indexOf(textLower)
                while (i >= 0)
                {
                    if (i > 0)
                        displayText += rem.substring(0, i)
                    displayText += "<b>"
                    displayText += rem.substring(i, i+text.length)
                    displayText += "</b>"
                    rem = rem.substring(i+text.length)
                    remLower = remLower.substring(i+text.length)
                    i = remLower.indexOf(textLower)
                }
                displayText += rem
                textObj.displayText = displayText
            }
            else textObj.displayText = option
            matches[matches.length] = textObj
            if (matches.length >= autoComplete.maxRows && autoComplete.maxRows > 0)
                break
        }
    }
    return matches
}

function AC_set(text)
{
    document.getElementById(AC_current.fieldId).value = text
    document.getElementById(AC_current.fieldId).focus()
    document.getElementById(AC_current.fieldId).onchange() // Note: FF Does this automatically
    AC_close(AC_current.fieldId)
}
function AC_close(fieldId)
{
    if (AC_current != null && AC_current.fieldId == fieldId)
    {
        AC_show(false)
        AC_current = null
    }
}
function AC_high(row, on)
{
    if (AC_currectSelectedIndex != -1)
        document.getElementById('AC_option'+AC_currectSelectedIndex).className = ''
    if (on)
    {
        document.getElementById('AC_option'+row).className = 'ac_selected'
        AC_currectSelectedIndex = row
    }
    else
    {
        AC_currectSelectedIndex = -1
    }
}
// Handle scroll on hints by keys
function AC_onkeydown(event)
{
    if (AC_current == null) // No open box, ignore
        return

    var k = event.keyCode
    if (k == 13) // Enter
    {
        if (AC_currectSelectedIndex >= 0)
        {
            AC_set(AC_currectOptions[AC_currectSelectedIndex].selectText)
            event.returnValue = false  // Stop processing this event
        }
    }
    if (k == 38) // Up
    {
        var newIndex = -1
        if (AC_currectSelectedIndex > 0)
            newIndex = AC_currectSelectedIndex-1
        else
        if (AC_currectSelectedIndex < 0)
            newIndex = AC_currectOptions.length-1
        if (newIndex >= 0)
            AC_high(newIndex, true)
    }
    if (k == 40) // Down
    {
        var newIndex = -1
        if (AC_currectSelectedIndex < AC_currectOptions.length-1)
            newIndex = AC_currectSelectedIndex+1
        if (newIndex >= 0)
            AC_high(newIndex, true)
    }
    if (k == 27) // Esc
    {
        AC_close(AC_current.fieldId)
    }
}
// Handle key of characters in field
function AC_onkeyup(event, autoComplete)
{
    if (AC_current == null) // No open box, ignore
        return

    var k = event.keyCode
    if (k != 13 && k != 38 && k != 40 && k != 27)
        AC_populate(autoComplete)
    else
        event.returnValue = false  // Stop processing this event
}

