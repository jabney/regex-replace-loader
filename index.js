'use strict'

var loaderUtils = require('loader-utils')

var NAME = 'Regex Replace Loader'

/**
 * The Regex Replace Loader.
 *
 * Replace values from the source via a regular expression.
 *
 * @param {string} source
 * @returns {string}
 */
function regexReplaceLoader(source) {
  var options = loaderUtils.getOptions(this)

  var stages = Array.isArray(options.stages)
    ? options.stages
    : [options]

  var result = source

  stages.forEach(function (stage) {
    var regex = getRegex(stage.regex, stage.flags)
    result = exec(regex, result, stage)
  })

  return 'module.exports = ' + JSON.stringify(result)
}

/**
 * Return the type of an object as a string.
 *
 * @param {any} object
 * @returns {string}
 */
function typeOf(object) {
  return Object.prototype.toString.call(object).slice(8, -1)
}

/**
 * Transform regex into a RegExp if it isn't one already.
 *
 * @param {any} regex
 * @param {string} flags
 * @returns {RegExp}
 */
function getRegex(regex, flags) {
  var result = typeOf(regex) === 'String'
    ? new RegExp(regex, flags || '')
    : regex

  if (typeOf(result) !== 'RegExp') {
    throw new Error(
      NAME + ': option "regex" must be a string or a RegExp object')
  }

  return result
}

/**
 * If 'value' is a function, return a match function;
 * otherwise return the original value.
 *
 * @param {any} value
 * @returns {any}
 */
function getValueOrMatchFn(value) {
  if (typeof value === 'function') {
    return getMatchFn(value)
  }

  if (typeof value !== 'string') {
    throw new Error(
      NAME + ': option "value" must be a string or a function')
  }

  return value
}

/**
 * Return a function for use with string.replace that converts that
 * function's arguments into a RegExpMatchArray and calls the
 * value function.
 *
 * @param {(match: RegExpMatchArray) => string} valueFn
 * @returns {(m: string, ...args: string[], i: number, s: string) => string}
 */
function getMatchFn(valueFn) {
  return function () {
    var len = arguments.length
    // Create a RegExp match object.
    var match = Array.prototype.slice.call(arguments, 0, -2)
      .reduce(function (map, g, i) {
        map[i] = g
        return map
      }, {index: arguments[len - 2], input: arguments[len - 1]})
    // Call the original function.
    return valueFn(match)
  }
}

/**
 * Execute a replace operation and return the modified source.
 *
 * @param {RegExp} regex
 * @param {string} source
 * @param {any} options
 * @returns {string}
 */
function exec(regex, source, options) {
  var valueOrFn = getValueOrMatchFn(options.value)
  source.replace(regex, function () { return '' })
  return source.replace(regex, valueOrFn)
}

module.exports = regexReplaceLoader
