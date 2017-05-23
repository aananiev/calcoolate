//
// www.calcoolate.com javaScript calculator
//
// Copyright (c) 2006. All rights reserved
//

var setExpression = ""
var letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_"

var variables = []

function addError(errors, message, start, length)
{
    var error = new Object()
    error.message = message
    error.start = start
    error.length = length
    errors[errors.length] = error
}
function cloneToken(token)
{
    var clone = new Object()
    clone.type  = token.type
    clone.start = token.start
    clone.text  = token.text
    return clone
}
function tokenize(exp)
{
    var res = new Object()
    var tokens = new Array()
    var errors = new Array()
    res.tokens = tokens
    res.errors = errors

    var currToken
    for (var i = 0; i<exp.length; i++)
    {
        var c = exp.charAt(i)
        if (" \t".indexOf(c) >= 0)
        {
            if (currToken)
            {
                tokens[tokens.length] = currToken
                currToken = null
            }
        }
        else
        if ("*/!%^()[]{}".indexOf(c) >= 0)
        {
            if (currToken)
                tokens[tokens.length] = currToken
            currToken = new Object()
            if ("*/".indexOf(c) >= 0)
                currToken.type = 'op2'
            else
            if ("!%".indexOf(c) >= 0)
                currToken.type = c
            else
            if ("^".indexOf(c) >= 0)
                currToken.type = 'op1'
            else
            if ("([{".indexOf(c) >= 0)
                currToken.type = '('
            else
            if (")]}".indexOf(c) >= 0)
                currToken.type = ')'
            currToken.start=i
            currToken.text = c
            tokens[tokens.length] = currToken
            currToken = null
        }
        else
        if (currToken && currToken.type == 'number')
        {
            if ("0123456789".indexOf(c) >= 0)
                currToken.text += c
            else
            if (c == '.' || c == ',')
            {
                if (currToken.text.indexOf('.') >= 0)
                {
                    addError(errors, 'More than one decimal point in a number', i, 1)
                    c = '0' // Prevent more errors
                }
                else
                if (currToken.text.indexOf('e') >= 0 || currToken.text.indexOf('x') >= 0 || currToken.text.indexOf('b') >= 0)
                {
                    addError(errors, 'Invalid position of decimal point', i, 1)
                    c = '0'
                }
                if (c == '.')
                    prefs.dot = "dot"
                else
                    prefs.dot = "comma"
                currToken.text += '.'
            }
            else
            if (c == 'x' || c == 'X')
            {
                if (currToken.text != '0')
                {
                    addError(errors, 'Invalid number. For hexadecimal constants use 0x1f', i, 1)
                    c = '0'
                }
                else c = 'x'
                currToken.text += c
            }
            else
            if ((c == 'b' || c == 'B') && !(currToken.text.length >=2 && currToken.text.charAt(0)=='0' && currToken.text.charAt(1)=='x'))
            {
                if (currToken.text != '0')
                {
                    addError(errors, 'Invalid number. For binary constants use 0b0010', i, 1)
                    c = '0'
                }
                else c = 'b'
                currToken.text += c
            }
            else
            if ("abcdefABCDEF".indexOf(c) >= 0 && currToken.text.length>=2 && currToken.text.charAt(0) == '0' && currToken.text.charAt(1) == 'x')
            {
                currToken.text += c.toLowerCase();
            }
            else
            if (c == 'e' || c == 'E')
            {
                if (currToken.text.indexOf('x') >= 0 || currToken.text.indexOf('e') >= 0)
                {
                    addError(errors, 'Invalid number. For exponents use 12e4, 12e+4 or 12e-4', i, 1)
                    c = '0'
                }
                else c = 'e'
                currToken.text += c
            }
            else
            if ("+-".indexOf(c) >= 0)
            {
                if (currToken.text.charAt(currToken.text.length-1) != 'e')
                {
                    tokens[tokens.length] = currToken
                    currToken = new Object()
                    currToken.type = 'op3'
                    currToken.start=i
                    currToken.text = c
                    tokens[tokens.length] = currToken
                    currToken = null
                }
                else currToken.text += c;
            }
            else
            {
                tokens[tokens.length] = currToken
                currToken = null
                addError(errors, 'Invalid character within a number. valid numbers are in the form 123, 123.45, 12e3, 0x1f, 0b1101', i, 1)
            }
        }
        else
        if (currToken && currToken.type == 'name')
        {
            if ("0123456789.".indexOf(c) >= 0 || letters.indexOf(c) >= 0)
                currToken.text += c;
            else
            if ("+-".indexOf(c) >= 0) // Special case as these can be in a number
            {
                tokens[tokens.length] = currToken
                currToken = new Object()
                currToken.type = 'op3'
                currToken.start=i
                currToken.text = c
                tokens[tokens.length] = currToken
                currToken = null
            }
            else
            {
                tokens[tokens.length] = currToken
                currToken = null
                addError(errors, 'Invalid character. Function names can have only English letters or underscoresr', i, 1)
            }
        }
        else
        if ("+-".indexOf(c) >= 0) // Special case as these can be in a number
        {
            if (currToken)
                tokens[tokens.length] = currToken
            currToken = new Object()
            currToken.type = 'op3'
            currToken.start=i
            currToken.text = c
            tokens[tokens.length] = currToken
            currToken = null
        }
        else
        if (!currToken)
        {
            currToken = new Object()
            currToken.text = c
            currToken.start = i
            if ("0123456789.,".indexOf(c) >= 0)
                currToken.type = 'number'
            else
            if (letters.indexOf(c) >= 0)
                currToken.type = 'name'
            else
            {
                addError(errors, 'This character is not supported', i, 1)
                currToken = null
            }
        }
    }
    // Handle last pending token
    if (currToken)
        tokens[tokens.length] = currToken

    return res
}

function parseAndEvaluate(tokens, errors)
{
    var root = applyAllRules(tokens, errors)
    if (errors.length == 0)
    {
        root.value = fixRoundingError(root.value)
        if (root.displayHex)
            root.value=hex(root.value)
        if (root.displayBin)
            root.value=bin(root.value)
    }
    return root
}

function onkey(e)
{
    var k = e.keyCode
    var passEvent = true
    var evaluate = false
    if (k == 27) {
        document.getElementById('exp').value = '';
        expFocus();
        return true;
    }
    if (((k == 187 || k == 107 || k == 61) && !e.shiftKey) || k == 13)
    {
        e.returnValue = false
        e.cancelBubble = true
        passEvent = false
        evaluate = true
        if (k != 13)
        {
            // Ignore mixup of = and +
            var v = document.getElementById('exp').value
            if (v.length > 1 && (v.charAt(v.length-1) == '+' || (v.charAt(v.length-2) == '+' && v.charAt(v.length-1) == '=')))
                evaluate = false
        }
    }
    expset(evaluate)
    return passEvent
}
function expFocus()
{
    document.getElementById('exp').focus()
}
function setexp(expression, evaluate)
{
    document.getElementById('exp').value = expression
    expset(evaluate)
}
function expset(evaluate)
{
    var expField = document.getElementById('exp')
    var expression = expField.value
    while (expression.length > 0 && expression.indexOf('=') >= 0)
    {
        var ie = expression.indexOf('=')
        expression = expression.substring(0, ie) + expression.substring(ie+1)
        expField.value = expression
    }
    if (expression != setExpression || evaluate)
    {
        var currWidth = parseInt(expField.style.width, 10)
        var reqWidth = (expression.length+2) * charWidth()
        if (reqWidth > currWidth)
            expField.style.width = reqWidth+"px"

        var te = tokenize(expression)
        var errors = te.errors
        if (evaluate && errors.length == 0)
        {
            var result = parseAndEvaluate(te.tokens, errors)
            if (errors.length == 0)
            {
                var v = result.value
                if (prefs.dot == "comma")
                {
                    v = ""+v
                    var idp = v.indexOf('.')
                    if (idp >= 0)
                        v = v.substring(0,idp)+','+v.substring(idp+1)
                }
                expField.value = v
                expField.style.width = "296px" // Restore
                logAdd(expression, v, null)
                return expset(false)
            }
        }
        showErrors(expression, errors, evaluate)
        showNesting(expression)
        setExpression = expression
    }
}


var rules = new Array(
    new Array('NumberToExp', new Array('number') ),

    new Array('CallNoParm', new Array( 'name', '(' , ')' ) ),
    new Array('CallStart', new Array( 'name', '(' ) ),
    new Array('CallParm', new Array( 'call', 'exp', ',' ) ),
    new Array('CallLast', new Array( 'call', 'exp', ')' ) ),
    new Array('NameToExp', new Array( 'name' ) ),

    new Array('Op', new Array( 'exp', 'op1', 'exp') ),

    new Array('Unari1', new Array( 'start', 'op3', 'exp' ) ),
    new Array('Unari1', new Array( '(', 'op3', 'exp' ) ),
    new Array('Unari1', new Array( 'call', 'op3', 'exp' ) ),
    new Array('Unari1', new Array( 'op1' , 'op3', 'exp' ) ),
    new Array('Unari1', new Array( 'op2' , 'op3', 'exp' ) ),
    new Array('Unari1', new Array( 'op3' , 'op3', 'exp' ) ),

    new Array('BrExpBr', new Array( '(', 'exp', ')' ) ),
    new Array('BrExpOpExpBr', new Array( '(', 'exp', 'op1', 'exp', ')' ) ),
    new Array('BrExpOpExpBr', new Array( '(', 'exp', 'op2', 'exp', ')' ) ),
    new Array('BrExpOpExpBr', new Array( '(', 'exp', 'op3', 'exp', ')' ) ),
    new Array('Pct', new Array( 'exp', '%') ),
    new Array('Fact', new Array( 'exp', '!') ),
    new Array('Op', new Array( 'exp', 'op2', 'exp') ),
    new Array('Op', new Array( 'exp', 'op3', 'exp') ),

    new Array('last', new Array('?') )
)
function applyAllRules(tokens, errors)
{
    // Add start token
    var startToken = new Object()
    startToken.type='start'
    var t = new Array()
    t[0] = startToken
    append(tokens, t, 0, tokens.length-1)
    tokens=t

    var hasMatchingRule = true
    while (hasMatchingRule && errors.length == 0)
    {
        var foundMatchingRule = false
        for (var r in rules)
        {
            var rule = rules[r]
            var handler = rule[0]
            var types = rule[1]
            var matchedPos = -1
            for (var i=0; matchedPos < 0 && i<=tokens.length - types.length; i++)
            {
                var matched = true
                for (var j = 0; matched && j < types.length; j++)
                    matched = (types[j] == tokens[i+j].type)
                if (matched)
                {
                    matchedPos = i
                    tokens = eval("rule"+handler+"(tokens, i, errors)")
                }
            }
            if (matchedPos >= 0)
            {
                foundMatchingRule = true
                break
            }
        }
        hasMatchingRule = foundMatchingRule
    }
    if (errors.length == 0 && tokens.length != 2)
        analyzeFinalSyntaxErrors(tokens, errors)
    return tokens[1]
}



// Find best matching error message
function analyzeFinalSyntaxErrors(tokens, errors)
{
    var token
    var message
    for (var i=0; i<tokens.length-1; i++)
    {
        if (tokens[i].type == 'exp' && tokens[i+1].type == 'exp')
        {
            token = tokens[i+1]
            message = "Expecting an operation before value"
            break
        }
        if (tokens[i].type.indexOf('op')==0 && tokens[i+1].type.indexOf('op') == 0)
        {
            token = tokens[i+1]
            message = "Wrong position of operator"
            if (tokens[i].text=='*' && tokens[i+1].text=='*')
                message +=". To computer power, use 2^3"
            break
        }
    }

    // Check parenthesis nesting
    if (!token)
    {
        var brstack = new Array()
        var brpos = -1
        for (var i=0; !token && i<tokens.length; i++)
        {
            if (tokens[i].type == '(' || tokens[i].type == 'call')
                brstack[++brpos] = i
            else
            if (tokens[i].type == ')')
            {
                if (--brpos)
                {
                    token = tokens[i]
                    message = "Close parenthesis does not have a matching open"
                }
            }
        }
        if (!token && brpos >= 0)
        {
            token = tokens[brstack[brpos]]
            if (token.type == '(')
                message = "Missing close of parenthesis"
            else
                message = "Missing close of function call"
        }
    }

    // Check if ends with an op
    if (!token && tokens[tokens.length-1].type.indexOf('op')==0)
    {
        token = tokens[tokens.length-1]
        message = "Operator is not match with operands"
    }

    if (!token)
    {
        token = tokens[1] // Default error position
        message = "Invalid syntax of expression"
    }
    var start
    while (true)
    {
        if (token.start)
            start = token.start
        if (token.left)
            token = token.left
        else
            break
    }
    var pos = token.start ? token.start : 0
    addError(errors, message, pos, 1)
}
function append(source, target, sourceFromIndex, sourceToIndex)
{
    for (var i=sourceFromIndex; i<=sourceToIndex; i++)
        target[target.length] = source[i]
}
function ruleNumberToExp(tokens, pos, errors)
{
    var oldToken = tokens[pos]
    var newToken = new Object()
    newToken.type='exp'
    if (oldToken.text.substring(0,2).toLowerCase() == '0x')
        newToken.value = parseInt(oldToken.text)
    else
    if (oldToken.text.indexOf('.') >= 0 || oldToken.text.indexOf('e') > 0)
        newToken.value = parseFloat(oldToken.text)
    else
    if (oldToken.text.substring(0,2).toLowerCase() == '0b')
        newToken.value = parseBinary(oldToken, errors)
    else
        newToken.value = parseInt(oldToken.text, 10) // Ignore octal
    newToken.left = oldToken
    tokens[pos] = newToken
    return tokens
}
function ruleNameToExp(tokens, pos, errors)
{
    var oldToken = tokens[pos]
    var newToken = new Object()
    newToken.type='exp'
    var name = oldToken.text.toLowerCase()
    var value = 0
    if (name == 'pi')
        value = Math.PI
    else
    if (name == 'e')
        value = Math.E
    else
    if (variables[name])
    {
        var varval = variables[name]
        var idp = varval.indexOf(',')
        if (idp >= 0)
            varval = varval.substring(0,idp)+'.'+varval.substring(idp+1)
        if (varval.substring(0,2).toLowerCase() == '0x')
            value  = parseInt(varval)
        else
        if (varval.indexOf('.') >= 0 || varval.indexOf('e') > 0)
            value = parseFloat(varval)
        else
        if (varval.substring(0,2).toLowerCase() == '0b')
            value = parseBinary(varval, errors)
        else
            value = parseInt(varval, 10)
    }
    else
    {
        addError(errors, "Un-supported variable name ["+name+"]", oldToken.start, oldToken.text.length)
    }

    newToken.value=value
    newToken.left = oldToken
    tokens[pos] = newToken
    return tokens
}
function ruleBrExpBr(tokens, pos, errors)
{
    var newTokens = new Array()
    append(tokens, newTokens, 0, pos-1)

    var newToken = new Object()
    newToken.type='exp'
    newToken.value=tokens[pos+1].value
    newToken.left = tokens[pos+1]
    newTokens[newTokens.length] = newToken

    append(tokens, newTokens, pos+3, tokens.length-1)
    return newTokens
}
function ruleBrExpOpExpBr(tokens, pos, errors)
{
    var newTokens = new Array()
    append(tokens, newTokens, 0, pos-1)
    append(tokens, newTokens, pos+1, pos+3)
    append(tokens, newTokens, pos+5, tokens.length-1)
    return ruleOp(newTokens, pos, errors)
}
function ruleOp(tokens, pos, errors)
{
    var newTokens = new Array()
    append(tokens, newTokens, 0, pos-1)

    var result = tokens[pos].value
    var opToken = tokens[pos+1]
    if (opToken.text == '+')
        result += tokens[pos+2].value
    if (opToken.text == '-')
        result -= tokens[pos+2].value
    if (opToken.text == '*')
        result *= tokens[pos+2].value
    if (opToken.text == '/')
    {
        result /= tokens[pos+2].value
        if (result=="Infinity")
            addError(errors, "Divide by zero is not allowed", opToken.start, 1)
    }
    if (opToken.text == '^')
        result = Math.pow(result, tokens[pos+2].value)
    var newToken = new Object()
    newToken.type='exp'
    newToken.value=result
    newTokens[newTokens.length] = newToken
    newToken.left = opToken
    opToken.left = tokens[pos]
    opToken.right = tokens[pos+2]

    append(tokens, newTokens, pos+3, tokens.length-1)
    return newTokens
}
function rulePct(tokens, pos, errors)
{
    var newTokens = new Array()
    append(tokens, newTokens, 0, pos-1)

    var result = tokens[pos].value / 100
    var opToken = tokens[pos+1]
    var newToken = new Object()
    newToken.type='exp'
    newToken.value=result
    newTokens[newTokens.length] = newToken
    newToken.left = opToken
    opToken.left = tokens[pos]

    append(tokens, newTokens, pos+2, tokens.length-1)
    return newTokens
}
function ruleFact(tokens, pos, errors)
{
    var newTokens = new Array()
    append(tokens, newTokens, 0, pos-1)

    fact = tokens[pos].value
    if (fact <= 0 || fact != Math.floor(fact))
        addError(errors, "Factorial is allowed only on positive integers", tokens[pos].start, 1)
    var result =  1;
    for (var i=2; i<=fact; i++)
        result *= i
    var opToken = tokens[pos+1]
    var newToken = new Object()
    newToken.type='exp'
    newToken.value=result
    newTokens[newTokens.length] = newToken
    newToken.left = opToken
    opToken.left = tokens[pos]

    append(tokens, newTokens, pos+2, tokens.length-1)
    return newTokens
}
function ruleUnari1(tokens, pos, errors)
{
    var newTokens = new Array()
    append(tokens, newTokens, 0, pos)

    var result = tokens[pos+2].value
    var opToken = tokens[pos+1]
    if (opToken.text == '-')
        result = -result
    var newToken = new Object()
    newToken.type='exp'
    newToken.value=result
    newTokens[newTokens.length] = newToken
    newToken.left = opToken
    opToken.left = tokens[pos]
    opToken.right = tokens[pos+2]

    append(tokens, newTokens, pos+3, tokens.length-1)
    return newTokens
}
function ruleCallNoParm(tokens, pos, errors)
{
    var newTokens = new Array()
    append(tokens, newTokens, 0, pos-1)
    var nameToken = tokens[pos]
    var callToken = new Object()
    callToken.type='call'
    callToken.name = nameToken.text.toLowerCase()
    callToken.start = nameToken.start
    callToken.left = nameToken
    callToken.parms=new Array()
    var callResult = processCall(callToken, errors)
    newTokens[newTokens.length] = callResult
    append(tokens, newTokens, pos+3, tokens.length-1)
    return newTokens
}
function ruleCallStart(tokens, pos, errors)
{
    var newTokens = new Array()
    append(tokens, newTokens, 0, pos-1)
    var nameToken = tokens[pos]
    var newToken = new Object()
    newToken.type = 'call'
    newToken.name = nameToken.text.toLowerCase()
    newToken.start = nameToken.start
    newToken.left = nameToken
    newToken.parms = new Array()
    newTokens[newTokens.length] = newToken
    append(tokens, newTokens, pos+2, tokens.length-1)
    return newTokens
}
function ruleCallParm(tokens, pos, errors)
{
    var newTokens = new Array()
    append(tokens, newTokens, 0, pos)
    var callToken = tokens[pos]
    callToken.parms[callToken.parms.length]=tokens[pos+1]
    append(tokens, newTokens, pos+3, tokens.length-1)
    return newTokens
}
function ruleCallLast(tokens, pos, errors)
{
    var newTokens = new Array()
    append(tokens, newTokens, 0, pos-1)
    var callToken = tokens[pos]
    callToken.parms[callToken.parms.length]=tokens[pos+1]
    var callResult = processCall(callToken, errors)
    newTokens[newTokens.length] = callResult
    append(tokens, newTokens, pos+3, tokens.length-1)
    return newTokens
}

function validateFunctionParms(func, parms, errors, minParms, maxParms)
{
    var ok = true
    if (parms.length < minParms || parms.length > maxParms)
    {
        ok = false
        if (minParms == maxParms)
            addError(errors, "Function "+func.name+" expects "+minParms+(minParms == 1 ? " Parameter" : " Parameters"), func.start, func.name.length)
        else
            addError(errors, "Function "+func.name+" expects "+minParms+" to "+maxParms+" Parameters", func.start, func.name.length)
    }
    return ok
}
function processCall(token, errors)
{
    var result = new Object()
    result.type = 'exp'
    result.left = token
    var func = token.name
    var parms = token.parms
    if (func == 'ln')
        func = 'log'

    if (func == 'sqrt' || func=='abs' || func=='ceil' || func=='floor' || func=='log' || func=='round')
    {
        if (validateFunctionParms(token, parms, errors, 1, 1))
            result.value = eval('Math.'+func+'('+parms[0].value+')')
    }
    else
    if (func == 'sin' || func == 'cos'|| func == 'tan')
    {
        if (validateFunctionParms(token, parms, errors, 1, 1))
        {
            var v = parms[0].value
            if (prefs.angle == 'deg')
                v = v * Math.PI / 180
            v = eval('Math.'+func+'('+v+')')
            result.value = v
        }
    }
    else
    if (func == 'asin' || func == 'acos'|| func == 'atan')
    {
        if (validateFunctionParms(token, parms, errors, 1, 1))
        {
            var v = parms[0].value
            v = eval('Math.'+func+'('+v+')')
            if (prefs.angle == 'deg')
                v = v * 180 / Math.PI
            result.value = v
        }
    }
    else
    if (func == 'log10')
    {
        if (validateFunctionParms(token, parms, errors, 1, 1))
        {
            result.value = eval('Math.log('+parms[0].value+')/Math.log(10)')
        }
    }
    else
    if (func == 'hex')
    {
        if (validateFunctionParms(token, parms, errors, 1, 1))
        {
            result.value = parms[0].value
            result.displayHex = true
        }
    }
    else
    if (func == 'bin')
    {
        if (validateFunctionParms(token, parms, errors, 1, 1))
        {
            result.value = parms[0].value
            result.displayBin = true
        }
    }
    else
        addError(errors, "Un-supported function ["+func+"]", token.start, func.length)

    if (isNaN(result.value) || result.value == "Infinity")
        addError(errors, "Function result for given parameters is undefined", token.start, func.length)

    return result
}
function fixRoundingError(value)
{
    var sv = ""+value
    if (sv.indexOf('.') < 0)
        return value
    // TODO Handle "e" notation, leave only 12 digits after point
    var s = sv.substring(sv.indexOf('.'))
    var l = s.length
    if (l < 10)
        return value
    var l5 = s.substring(l - 5)
    var l5m1 = l5.substring(0, 4)
    if (l5m1 == '9999')
    {
        var i9 = s.length-3
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
    if (l5m1 == '0000')
    {
        value = eval(sv.substring(0, sv.length-4))
    }
    return value
}
function hex(value)
{
    var s = ""
    var v = Math.round(value)
    if (v < 0)
        v = Math.abs(0x01000000000000 + v)
    while (v != 0)
    {
        var p = v % 16
        if (p < 0)
            p = 16 + p
        s = "0123456789abcdef".charAt(p) + s
        v = Math.floor(v / 16)
    }
    if (s == "")
        s = "0"
    s = "0x"+s
    return s
}
function bin(value)
{
    var s = hex(value)
    var bindig = ['0000','0001','0010','0011','0100','0101','0110','0111','1000','1001','1010','1011','1100','1101','1110','1111']
    var hexdig = '0123456789abcdef'
    var res = '0b'
    for (var i = 2; i<s.length; i++)
        res += bindig[hexdig.indexOf(s.charAt(i))]
    return res
}
function parseBinary(token, errors)
{
    var r = 0
    var v = token.text // 0b0100
    for (var i = 2; i<v.length; i++)
    {
        r *= 2
        if (v.charAt(i) == '1')
            r++
        else
        if (v.charAt(i) != '0')
        {
            addError(errors, "Binary values can have only digits 0 or 1", token.start+i, 1)
            return 0
        }
    }
    return r
}


//
// Log (history) functions
//
var log = new Array()
function logAdd(exp, value, name)
{
    if (exp != value)
    {
        if (log.length == 0 || log[log.length-1].expression != exp)
        {
            var entry = new Object()
            entry.expression = exp
            entry.result = value
            if (name != null)
                entry.name = name
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
        opts += "<a href='javascript:copyLogToClipoard()' title='Copy all history into the clipboard in a spreadsheet format'>Copy all history</a>"
        opts += "<br /><br />"
        str += opts

        str += "<table border='0' cellpadding='2' cellspacing='1' bgcolor='#c0c0c0'>"

        str += "<tr class='loghdr'><td>&nbsp;</td><td>Expression</td><td>Result</td><td>Name</td></tr>"
        for (var i=log.length-1; i>=0; i--)
        {
            var entry = log[i]
            if (entry != null)
            {
                str += "<tr bgcolor='#ffffff'>"
                str += "<td><input type='checkbox' id='log"+i+"' /></td>"
                str += "<td><a class='logval' title='Copy to calculator' href='javascript:logSet(&quot;"+entry.expression+"&quot;)'>"+entry.expression+"</a></td>"
                str += "<td><a class='logval' title='Copy to calculator' href='javascript:logSet(&quot;"+entry.result+"&quot;)'>"+entry.result+"</a></td>"
                if (!entry.name)
                    str += "<td id='nameit"+i+"'><a href='javascript:nameit("+i+")' title='Define a name for this value'>name it</a></td>"
                else
                    str += "<td>"+entry.name+"</td>"
                str += "</tr>"
            }
        }
        str += "</table>"
        str += opts
    }
    document.getElementById('log').innerHTML = str

    if (prefs.saveHistory)
        saveHistory();
}
function logSet(exp)
{
    var v = document.getElementById('exp').value
    var tv = v
    while (tv.length > 0 && tv.charAt(tv.length-1) == ' ')
        tv = tv.substring(0, tv.length-1)
    if (tv.length > 0 && "+-*/^,(".indexOf(tv.charAt(tv.length-1)) >= 0)
        exp = v+exp // Concat when ends with op
    setexp(exp, false)
    expFocus()
}
function logClear()
{
    log = new Array()
    logShow()
    expFocus()
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
    expFocus()
}
function logCheckAll()
{
    for (var i=0; i<log.length; i++)
    {
        var chkbox = document.getElementById('log'+i)
        if (chkbox)
            chkbox.checked = true
    }
    expFocus()
}

var nameitInd
function nameit(i)
{
    document.getElementById('nameit').value = ""
    var pos = position('nameit'+i)
    setTimeout("document.getElementById('nameit').focus()", 200)
    nameitInd = i
    var form = document.getElementById('nameitf')
    form.style.top = pos.top+"px"
    form.style.left = (pos.left+40)+"px"
    form.style.display='block'
}
function nameitset()
{
    var name = document.getElementById('nameit').value
    if (name.length > 0)
    {
        log[nameitInd].name=name
        variables[name] =''+log[nameitInd].result
        logShow()
    }
}

//
// Button handlers
//
function btn(b)
{
    var e = document.getElementById('exp').value
    if (b == 'clear')
        setexp('', false)
    else
        setexp(b+'('+e+')', true)

    expFocus()
}

//
// Display functions
//
var expCharWidth
function charWidth()
{
    if (expCharWidth)
        return expCharWidth
    var s = "8888888888"
    document.getElementById('charws').innerHTML=s
    expCharWidth = (document.getElementById('charwe').offsetLeft-document.getElementById('charws').offsetLeft) / s.length
    document.getElementById('charws').innerHTML=''
    return expCharWidth
}

function showErrors(expression, errors, showMessageText)
{
    var errind = ""
    errind += "<table border='0' cellpadding='0' cellspacing='0'><tr>"
    errind += "<td><img src='img/s.png' width='2' height='3' /></td>"
    if (errors.length > 0)
    {
        var colErrors = new Array()
        for (var i=0; i<errors.length; i++)
        {
            var error = errors[i]
            for (var c=0; c<error.length; c++)
            {
                var pos = error.start+c
                if (!colErrors[pos])
                    colErrors[pos] = error.message
            }
        }
        var cw = charWidth()
        for (var i=0; i<expression.length; i++)
        {
            errind += "<td width='"+cw+"'>"
            if (colErrors[i])
                errind += "<img src='img/errdec.png' width='"+cw+"' height='3' title='"+colErrors[i]+"' />"
            else
                errind += "<img src='img/s.png' width='"+cw+"' height='3' />"
            errind += "</td>"
        }
    }
    errind += "</tr></table>"
    if (showMessageText && errors.length > 0)
    {
        var error = errors[0]
        var cw = charWidth()

        var pw = error.start*cw
        errind += "<table border='0' cellpadding='0' cellspacing='0'><tr>"
        errind += "<td><img src='img/s.png' width='"+pw+"' height='6' /></td>"
        errind += "<td><img src='img/errind.png' width='10' height='6' /></td>"
        errind += "</tr></table>"

        errind += "<table border='0' cellpadding='2' cellspacing='0'><tr>"
        var w = Math.max(400, pw+2*cw)
        errind += "<td nowrap='true' width='"+w+"' class='errmsg'>"
        errind += error.message
        errind += "</td></tr></table>"
    }
    document.getElementById('errors').innerHTML = errind
}
function showNesting(expression)
{
    var bkrind = ""
    var cw = charWidth()
    var maxLevel = 0
    var level = 0
    var levels = new Array()
    for (var i=0; i<expression.length; i++)
    {
        var c = expression.charAt(i)
        if ("([{".indexOf(c) >= 0)
        {
            if (++level > maxLevel)
                maxLevel = level
            levels[i] = level
        }
        else
        if (")]}".indexOf(c) >= 0 && level > 0)
        {
            levels[i] = level
            level--
        }
        else
            levels[i] = level
    }


    if (maxLevel > 0)
    {
        bkrind += "<table border='0' cellpadding='0' cellspacing='0'>"
        for (var level = maxLevel; level > 0; level--)
        {
            bkrind += "<tr><td><img src='img/s.png' width='2' height='3' /></td>"
            for (var i=0; i<expression.length; i++)
            {
                bkrind += "<td width='"+cw+"'>"
                var img = "s"
                if (levels[i] == level)
                {
                    if (i == 0 || levels[i-1] < level)
                        img = "ns"
                    else
                    if (")]}".indexOf(expression.charAt(i)) >= 0)
                        img = "ne"
                    else
                        img = "nh"
                }
                else
                if (levels[i] > level)
                {
                    img = "nh"
                }
                else
                if (levels[i] > 0 && "()[]{}".indexOf(expression.charAt(i)) >= 0)
                {
                    img = "nv"
                }

                bkrind += "<img src='"+img+".png' width='"+cw+"' height='3' />"

                bkrind += "</td>"
            }
            bkrind += "</tr>"
        }
        bkrind += "</table>"
    }

    document.getElementById('nesting').innerHTML = bkrind
}

function copyLogToClipoard()
{
    var text = "Expression\tValue\n"

    for (var i=log.length-1; i>=0; i--)
    {
        var entry = log[i]
        if (entry != null)
        {
            text += entry.expression+"\t"+entry.result+"\n"
        }
    }


    if (window.clipboardData)
    {
        window.clipboardData.setData("Text", text)
    }
    else
    {
        alert('This feature is currently supported only for Internet Explorer')
    }
}

// History management in cookie
var historyCookieName = "calcHistory"

function saveHistory()
{
    var value = "";
    var passedMaxSize = false

    for (var i=log.length-1; i >=0 && !passedMaxSize;i--)
    {
        var entry = log[i]
        if (entry != null)
        {
            var newValue = "//"+entry.expression+"=="+entry.result
            if (entry.name)
                newValue+="::"+entry.name
            if (value.length+newValue.length<4096)
                value=newValue+value
            else
                passedMaxSize=true
        }
    }
    createCookie(historyCookieName, value, 365*10)
}

function readHistory()
{
    if (prefs.saveHistory == false)
        eraseCookie(historyCookieName)
    else
    {
        var value = readCookie(historyCookieName)
        log = new Array()

        while (value != null && value.indexOf("//")>=0) {
            var resultIndex = value.indexOf("==")
            var nextExpIndex = value.indexOf("//", 2)
            var exp = value.substring(2,resultIndex)
            if (nextExpIndex != -1) {
                var result = value.substring(resultIndex+2, nextExpIndex)
                value = value.substring(nextExpIndex)
            } else {
                var result = value.substring(resultIndex+2)
                value = ""
            }
            var nameIndex = result.indexOf("::")
            var name = null
            if (nameIndex>-1) {
                name = result.substring(nameIndex+2)
                result = result.substring(0, nameIndex)
                variables[name] =''+result
            }
            logAdd(exp, result, name)
        }
    }
}

function position(id)
{
    var pos = {left:0,top:0}
    var item = document.getElementById(id)
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