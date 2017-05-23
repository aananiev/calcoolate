var types = []
var units = []
var allFromUnits = []
var toUnits = []

var ct = [
    'distance,angstrom,1e13',
    'distance,centimeter,100000',
    'distance,feet,3280.8399',
    'distance,foot,3280.8399',
    'distance,inch,39370.0787',
    'distance,kilometer,1',
    'distance,meter,1000',
    'distance,metre,1000',
    'distance,micron,1e10',
    'distance,mile,0.621371192',
    'distance,millimeter,1e6',
    'distance,nanometer,1e12',
    'distance,yard,1093.6133',

    'weight,grain,15432.3583529',
    'weight,gram,1000',
    'weight,kilogram (kg),1',
    'weight,microgram,1000000000',
    'weight,milligram,1000000',
    'weight,ounce,35.2739619',
    'weight,pound,2.2046226',
    'weight,lb,2.2046226',
    'weight,ton,0.001',
    'weight,tonne,0.001',
    'weight,stone,0.157473044',

    'area,acre,0.0002471',
    'area,dunam,0.001',
    'area,hectare,0.0001',
    'area,square centimeter,10000',
    'area,square foot,10.7639104',
    'area,square furlong,0.0000247',
    'area,square inch,1550.0031',
    'area,square kilometer (km),0.000001',
    'area,square meter,1',
    'area,square mile,3.86102159e-7',
    'area,square yard,1.19599',

    'temperature,degree celcius,1',
    'temperature,farenheit,:(v-32)*5/9:v*9/5+32',
    'temperature,kelvin,:v-273.15:v+273.15',

    'speed,centimeter/second,100',
    'speed,foot/second,3.2808399',
    'speed,inch/second,39.3700787',
    'speed,kilometer/hour,3.6',
    'speed,kilometer/second,0.001',
    'speed,knot,1.9438445',
    'speed,meter/second,1',
    'speed,mile/hour (mph),2.2369363',
    'speed,mile/second,0.0006214',
    'speed,millimeter/second,1000',
    'speed,speed of light,3.3356409519815204e-9',
    'speed,speed of sound/mach,0.0029387',

    'volume,barrel (oil),0.0062898',
    'volume,bushel (UK),0.0274962',
    'volume,bushel (US),0.0283776',
    'volume,cubic centimeter (cc),1000',
    'volume,milliliter (ml),1000',
    'volume,cubic foot,0.035314666',
    'volume,cubic inch,61.023744',
    'volume,cubic meter,0.001',
    'volume,cubic millimeter,1000000',
    'volume,cubic yard,0.00130795',
    'volume,fluid ounce (UK),35.19507972',
    'volume,fluid ounce (US),33.8140227',
    'volume,gallon (UK),0.2199692',
    'volume,gallon (US),0.2641721',
    'volume,liter,1',
    'volume,litre,1',
    'volume,pint (UK),1.759754',
    'volume,pint (US),2.1133764',
    'volume,quart (UK),0.879877',
    'volume,quart (US),1.0566882',
    'volume,cup,4.22244',

    '' // Last
]

if (currencyTab)
    ct = ct.concat(currencyTab)

for (var i in ct)
{
    var s = ct[i]
    if (s != '')
    {
        var st = s.substring(0, s.indexOf(','))
        var sr = s.substring(s.indexOf(',')+1)
        var su = sr.substring(0, sr.indexOf(','))
        var sv = sr.substring(sr.indexOf(',')+1)
        var at = types[st]
        if (!at)
        {
            at = []
            types[st] = at
        }
        units[su] = at[at.length] = { category: st, unit:su, value:sv }
        allFromUnits[allFromUnits.length] = su
    }
}

function setCategory(cat)
{
    tabfocus('all', cat=='all')
    for (var category in types)
        tabfocus(category, category==cat)

    var fromOptions
    if (cat == 'all')
        fromOptions = allFromUnits
    else
    {
        fromOptions = new Array()
        var category = types[cat]
        if (category)
        {
            for (var i in category)
            {
                fromOptions[fromOptions.length]=category[i].unit
            }
        }
    }
    acFrom.setOptions(fromOptions)

    document.getElementById('fromUnits').value=''
    document.getElementById('toUnits').value=''

}
function tabfocus(name, on)
{
    var t = document.getElementById('cat_'+name)
    if (t)
        t.className = on ? 'catb_active': 'catb';
}

function fromset()
{
    var from = document.getElementById('fromUnits').value

    var toOptions = []

    var u = units[from]
    if (u)
    {
        var category = types[u.category]
        if (category)
        {
            for (var i in category)
            {
                toOptions[toOptions.length]=category[i].unit
            }
        }
        var to = document.getElementById('toUnits').value
        var tu = units[to]
        if (tu && u.category != tu.category)
            document.getElementById('toUnits').value = ''
    }


    acTo.setOptions(toOptions)
    compute()
}

function compute()
{
    var from = document.getElementById('fromUnits').value
    var to = document.getElementById('toUnits').value
    var samount = document.getElementById('amount').value
    if (samount=='')
        samount='1'
    var amount
    if (samount.indexOf('.') < 0)
        amount = parseInt(samount, 10)
    else
        amount = parseFloat(samount)

    if (isNaN(amount))
        amount=1

    var fu = units[from]
    var tu = units[to]
    var res = ""
    if (fu && tu && fu.category == tu.category)
    {
        var v
        if (fu.value.charAt(0) != ':' && tu.value.charAt(0) != ':')
        {
            v = amount * parseFloat(tu.value) / parseFloat(fu.value)
        }
        else
        {
            var v = amount
            if (fu.value.charAt(0) != ':')
                v = v  / parseFloat(fu.value)
            else
            {
                var f = fu.value.substring(1)
                f = f.substring(0, f.indexOf(':'))
                v = eval(f)
            }

            if (tu.value.charAt(0) != ':')
                v = v  * parseFloat(tu.value)
            else
            {
                var f = tu.value.substring(1)
                f = f.substring(f.indexOf(':')+1)
                v = eval(f)
            }
        }
        if (fu.category == 'currency')
            v = Math.round(v*10000) / 10000
        v = fixRoundingError(v)
        res = "<table border='1' cellpadding='2' cellspacing='0'><tr><td class='result'>"+amount+" "+fu.unit+" = "+v+" "+tu.unit+"</td></tr></table>"
        logAdd(amount, fu, tu, v)
    }
    document.getElementById('result').innerHTML = res
}
function amountFocus()
{
    document.getElementById('amount').focus()
}
function fixRoundingError(value)
{
    var sv = ""+value
    if (sv.indexOf('.') < 0)
        return value
    // TODO Handle "e" notation, leave only 12 digits after point
    var s = sv.substring(sv.indexOf('.'))
    var l = s.length
    if (l < 5)
        return value
    var i9 = s.indexOf('99')
    var i0 = s.indexOf('00')
    if (i9 >= 0)
    {
        while (s.charAt(i9-1) == '9')
            i9--
        s = s.substring(0,i9+1)
        var d = '.000000000000000000000000000000000'.substring(0,s.length-1)+'1'
        var w = sv.substring(0, sv.indexOf('.'))
        if (w == '')
            w = '0'
        var op = '+'
        if (value < 0)
            op = '-'
        value = eval(w+op+'('+s+'+'+d+')')
    }
    else
    if (i0 >= 0)
    {
        var w = sv.substring(0, sv.indexOf('.'))
        value = eval(w+'+'+s.substring(0, i0)+'0')
    }
    return value
}



//
// Log (history) functions
//
var log = new Array()
function logAdd(amount, fromu, tou, value)
{
    if (log.length == 0 || log[log.length-1].amount != amount || log[log.length-1].fromUnit.unit != fromu.unit || log[log.length-1].toUnit.unit != tou.unit)
    {
        if (fromu.unit != tou.unit)
        {
            var entry = new Object()
            entry.amount = amount
            entry.fromUnit = fromu
            entry.toUnit = tou
            entry.value = value
            log[log.length] = entry
            logShow()
        }
    }
}
function logShow()
{
    var str = ""
    var opts = ""
    if (log.length > 0)
    {
        str += "<span class='logtitle'>History</span><br />"
        opts += "<a href='javascript:logRemove()'>Remove checked lines</a>&nbsp&nbsp;"
        opts += "<a href='javascript:logCheckAll()'>Check all</a>&nbsp;&nbsp;"
        opts += "<a href='javascript:logClear()'>Clear history</a>&nbsp;&nbsp;"
        //opts += "<a href='javascript:copyLogToClipoard()' title='Copy all history into the clipboard in a spreadsheet format'>Copy all history</a>&nbsp;&nbsp;"
        opts += "<br /><br />"
        str += opts

        str += "<table border='0' cellpadding='2' cellspacing='1' bgcolor='#c0c0c0'>"

        str += "<tr class='loghdr'><td>&nbsp;</td><td>Conversion</td></tr>"
        for (var i=log.length-1; i>=0; i--)
        {
            var entry = log[i]
            if (entry != null)
            {
                str += "<tr bgcolor='#ffffff'>"
                str += "<td><input type='checkbox' id='log"+i+"' /></td>"
                str += "<td><a class='logval' title='Set units' href='javascript:logSet(&quot;"+entry.fromUnit.category+"&quot;,&quot;"+entry.fromUnit.unit+"&quot;,&quot;"+entry.toUnit.unit+"&quot;)'>"+entry.amount+" "+entry.fromUnit.unit+" = "+entry.value+" "+entry.toUnit.unit+"</a></td>"
                str += "</tr>"
            }
        }
        str += "</table>"
        str += opts
    }
    document.getElementById('log').innerHTML = str

    if (prefs.saveConvertHistory)
        saveConvertHistory();
}

function logSet(category, fromUnit, toUnit)
{
    setCategory(category)
    document.getElementById('fromUnits').value = fromUnit
    document.getElementById('toUnits').value = toUnit
}
function logClear()
{
    log = new Array()
    logShow()
}
function logRemove()
{
    var newLog = new Array()
    for (var i=0; i<log.length; i++)
    {
        var chkbox = document.getElementById('log'+i)
        if (chkbox && !chkbox.checked)
            newLog[newLog.length] = log[i]
    }
    log = newLog
    logShow()
}
function logCheckAll()
{
    for (var i=0; i<log.length; i++)
    {
        var chkbox = document.getElementById('log'+i)
        if (chkbox)
            chkbox.checked = true
    }
}

// History management in cookie
var convertHistoryCookieName = "convertHistory"
function saveConvertHistory()
{
    var value = "";
    var passedMaxSize = false

    for (var i=log.length-1; i >=0 && !passedMaxSize;i--)
    {
        var entry = log[i]
        if (entry != null)
        {
            var newValue= "//"+entry.amount+":"+entry.fromUnit.unit+":"+entry.toUnit.unit+":"+entry.value
            if (value.length+newValue.length<4096)
                value=newValue+value
            else
                passedMaxSize=true
        }
    }

    createCookie(convertHistoryCookieName, value, 365*10)
}
function readConvertHistory()
{
    if (prefs.saveConvertHistory == false)
        eraseCookie(convertHistoryCookieName);
    else
    {
        var value = readCookie(convertHistoryCookieName)
        log = new Array()

        while (value != null && value.indexOf("//")>=0) {
            var nextExpIndex = value.indexOf("//", 2)
            if (nextExpIndex != -1) {
                var conversion = value.substring(2, nextExpIndex)
                value = value.substring(nextExpIndex)
            } else {
                var conversion = value.substring(2)
                value = ""
            }

            var amount = conversion.substring(0,conversion.indexOf(":"))
            conversion=conversion.substring(conversion.indexOf(":")+1)

            var fromu = units[conversion.substring(0,conversion.indexOf(":"))]
            conversion=conversion.substring(conversion.indexOf(":")+1)

            var tou = units[conversion.substring(0,conversion.indexOf(":"))]
            conversion=conversion.substring(conversion.indexOf(":")+1)

            var val = conversion

            logAdd(amount, fromu, tou, val);
        }
    }
}

var acFrom = new AutoComplete('fromUnits', allFromUnits)
acFrom.maxRows=40
acFrom.highliteFirstMatch=true
acFrom.openOnEmptyText=true
var acTo = new AutoComplete('toUnits', toUnits)
acTo.openOnEmptyText=true
acTo.maxRows=20
acTo.highliteFirstMatch=true

function swapFromTo()
{
    var f = document.getElementById("fromUnits")
    var t = document.getElementById("toUnits")
    var tmp = f.value
    f.value = t.value
    t.value = tmp
    compute()
}