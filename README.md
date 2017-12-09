regex-replace-loader
====================
[![Build Status](https://travis-ci.org/jabney/regex-replace-loader.svg?branch=master)](https://travis-ci.org/jabney/regex-replace-loader)

Use regex to replace values in files, or transform source from one form into another.

## Example usage
Replace a specific string in a file with another.

### Input
```
All must depart the auditorium.
All must exit through the side door.
```

### webpack.config.js
```javascript
module.exports = {
  ...,
  module: {
    rules: [{
      test: /\.source.txt$/,
      use: {
        loader: 'regex-replace-loader',
        options: {
          regex: 'All',     // can also be a RegExp object (required)
          flags: 'g'        // ignored if a RegExp is used (optional)
          value: 'y\'all',  // the replace value (required, can also be a function)
        }
      }
    }]
  }
}
```

### Output
```
y'all must depart the auditorium.
y'all must exit through the side door.
```

## Multiple replace stages
The `regex-replace-loader` supports running multiple replace operations in stages, where the output of each stage is the input source for the next.

### Input
```
Today's date is THE_DATE
The time is THE_TIME
```

### webpack.config.js
```javascript
module.exports = {
  ...,
  module: {
    rules: [{
      test: /\.source.txt$/,
      use: {
        loader: 'regex-replace-loader',
        options: {
          stages: [{
            regex: 'THE_DATE',
            flags: '',
            value: new Date().toDateString(),
          },
          {
            regex: 'THE_TIME',
            flags: '',
            value: new Date().toTimeString(),
          }]
        }
      }
    }]
  }
}
```

### Output
```
Today's date is Sat Dec 09 2017
The time is 10:14:52 GMT-0800 (PST)
```

## Typescript
Using `import` instead of `require` may cause issues when using Typescript to import text files. In this case, include a `declaratins.d.ts` file in your project:

### declarations.d.ts
```typescript
declare module '*.txt' {
  const txt: any
  export default txt
}

declare module '*.json' {
  const json: any
  export default json
}

declare module '*.whatever' {
  const value: any
  export default value
}
```

Then you should be able to import the file:
```typescript
import text from './somefile.txt'
import json from './someinfo.json'
```

## Options object

```javascript
options: {
  regex: '<search expression>' | /search expression/<flags>,
  flags: 'g', // Ignored if regex is a RegExp object
  value: '<replace value>' | function (match) { return 'some value' },
  stages: [ {options}, {options}, ... ]
}
```

`regex (string|RegExp)` **(required)** can be a string or RegExp object. For strings make sure escape characters use a double backslash, e.g., `\\w+`.

`flags (string)` **(optional)** used if `regex` is a string, otherwise ignored. If `g` (global) is specified either in the `flags` property or in the supplied `regex`, a replace operations will be performed for each match in the source.

`value (string|function)` **(required)** the replace value.

`stages (object)` **(optional)** a list of `regex`, `flags` and `value` objects for performing multiple match/replace operations on the same source:

```javascript
stages: [
  { regex: 'a', flags: 'gi', value: '1' },
  { regex: 'b', flags: 'gi', value: '2' },
  { regex: 'c', flags: 'gi', value: '3' }
]
```

## Using the `value` option
The `options.value` parameter can be a `string` or `function`. While using a function is more flexible and powerful, there are some special uses when `options.value` is a string.

### `value` as a string
When `options.value` is a string, certain [special replacement patterns](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter) are available.

Pattern | Inserts
------- | -------
$$ | Inserts a "$".
$& | Inserts the matched substring.
$` | Inserts the portion of the string that precedes the matched substring.
$' | Inserts the portion of the string that follows the matched substring.
$n | Where n is a positive integer less than 100, inserts the nth parenthesized submatch string, provided the first argument was a RegExp object. Note that this is 1-indexed.

[Specifying a string as a parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter)

For example, `$&` inserts the matched substring, so setting `options.value` to `$&` would result in an "identity" operation.

It may be handy in some cases to use the matched substring as part of the replace value:

Input
```
All must depart the auditorium.
```

Options
```javascript
options: {
  regex: 'All',
  flags: ''
  value: "y'$&",  // output the matched substring as part of the value
}
```

Outupt
```
y'All must depart the auditorium.
```

The `$n` pattern inserts a match group:

Input
```
y = 2x + 3
```

Options
```javascript
options: {
  regex: /(\w) = (\d+)(\w) \+ (\d+)/,
  // Replace the match with a summary of contents.
  value: 'variables: $1, $3\nconstants: $2, $4',
}
```

Outupt
```
variables: y, x
constants: 2, 3
```


### `value` as a function
When `options.value` is a function, the replace capabilities become more powerful.

The `value` function receives a [match object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec#Description) with the following elements:

Property/Index | Description
-------------- | -----------
[0]	           | The full string of characters matched
[1], ...[n ]   | The parenthesized substring matches, if any. The number of possible parenthesized substrings is unlimited.
index	         | The 0-based index of the match in the string.
input	         | The original string.

[The RegExp match object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec#Description)

```javascript
value: function (match) {
  match[0]        // the full match
  match[1]        // the first capture group
  match[2]        // the second capture group, etc.
  match['index']  // the position of the match in the input string
  match['input']  // the original source input string

  return match[0] // This would result in an "identity" operation, where
                  // the replaced value is the same as the original
}
```

Input
```
Today's date is #{date}
The time is #{time}
```

Options
```javascript
options: {
  regex: /#\{(.+?)\}/g,
  // Render variables to a template
  value: function (match) {
    const context = {
      date: new Date().toDateString(),
      time: new Date().toTimeString()
    }
    // If there is no variable, return the original template match.
    return context[match[1]] || match[0]
  }
}
```

Outupt
```
  Today's date is Sat Dec 09 2017
  The time is 11:51:25 GMT-0800 (PST)
```
