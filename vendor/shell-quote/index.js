'use strict';

function quote(xs) {
  return xs.map(function (s) {
    if (s && typeof s === 'object') {
      return s.op.replace(/(.)/g, '\\$1');
    } else if (/["\s]/.test(s) && !/'/.test(s)) {
      return "'" + s.replace(/(['\\])/g, '\\$1') + "'";
    } else if (/["'\s]/.test(s)) {
      return '"' + s.replace(/(["\\$`!])/g, '\\$1') + '"';
    } else {
      return String(s).replace(/([A-Za-z]:)?([#!"$&'()*,:;<=>?@[\\\]^`{|}])/g, '$1\\$2');
    }
  }).join(' ');
}

function parse(s, env, opts) {
  const chunker = new RegExp(
    '(' +
      ['\\\\\\s', '"((\\\\"|[^"])*)"', "'((\\\\'|[^'])*)'", '\\$\\((?:\\([^)]*\\)|[^()])*\\)', '\\$\\{[^}]*\\}', '(\\\\[\\s\\S]|[^\\s\'"])+', "'((\\\\'|[^'])*)'", '"((\\\\"|[^"])*)"'].join('|') +
    ')',
    'g'
  );
  const match = s.match(chunker) || [];
  if (!env) env = {};
  return match.map(function (rawToken) {
    if (rawToken === undefined) return '';
    let token = rawToken;

    function unquote(t) {
      if (/^"(.*)"$/.test(t)) {
        return t.replace(/^"|"$/g, '').replace(/\\(["\\$`])/g, '$1');
      }
      if (/^'(.*)'$/.test(t)) {
        return t.replace(/^'|'$/g, '').replace(/\\'/g, "'");
      }
      return t.replace(/\\(.)/g, '$1');
    }

    token = unquote(token);

    if (opts && opts.escape) {
      return token;
    }

    return token.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*|\{[a-zA-Z_][a-zA-Z0-9_]*\})/g, function (_, name) {
      const key = name.replace(/^\{|\}$/g, '');
      return env[key] !== undefined ? env[key] : '';
    });
  });
}

exports.quote = quote;
exports.parse = parse;
