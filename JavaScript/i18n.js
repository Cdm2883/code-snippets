const language = (function language() {
    const template = (strings, ...keys) => (...values) => {
        const dict = values[values.length - 1] || {};
        const result = [strings[0]];
        keys.forEach((key, i) => {
            const value = Number.isInteger(key) ? values[key] : dict[key];
            result.push(value, strings[i + 1]);
        });
        return result.join('');
    };

    template.__proto__.chain = (proxy) => (function chain(target, arg) {
        target = arg == null ? target : proxy.apply(target, [arg]);
        return new Proxy(target,
            {
                get: (_target, p, receiver) => {
                    let chains = template.chains[p]?.bind(target);
                    if (chains) return template.chain(chains);

                    return chain(receiver, p);
                }
            });
    })(template);

    for (let { method, func } of template.__proto__.chains = {
            prefix: function (arg) { return (strings, ...keys) =>
                this([arg, ...strings], ...[-1, ...keys]) },
            suffix: function (arg) { return (strings, ...keys) =>
                this([...strings, arg], ...[...keys, -1]) },
            // define more chains here

            [Symbol.iterator]: function* ()
                { for (let method in this) yield {method, func: this[method]}; }
        }) template.__proto__[method] = template.chain(func);

    template.__proto__.warp = (prefix, suffix) => (strings, ...keys) =>
        template([prefix, ...strings, suffix], ...[-1, ...keys, -1]);

    // defind more template here
    template.__proto__.title = template.prefix['[Hello i18n]'][' '];
    template.__proto__.highlight = template.warp('\x1B[31m', '\x1B[0m');

    return {
        $template: template,
        // your trans here
        greet: template`Hello World!`,
        welcome: template`Welcome to ${0}, ${1}!`,
        print: template.title`${0}`,
        highlight: template.highlight`${0}`,
    }
})();


// usage
console.log( language.greet()                                              );  // 'Hello World!'
console.log( language.welcome('JavaScript', 'Cdm2883')                     );  // 'Welcome to JavaScript, Cdm2883!'
console.log( language.print('hi')                                          );  // '[Hello i18n] hi'
console.log( language.highlight('error!')                                  );  // '[31merror![0m'

console.log( language.$template.highlight`awa`()                           );  // '[31mawa[0m'
console.log( language.$template.highlight`a: ${0}, b: ${1}`(1, 2)          );  // '[31ma: 1, b: 2[0m'
console.log( language.$template.prefix.q.w.q.suffix.awa`|`()               );  // 'qwq|awa'
console.log( language.$template.prefix['hi'][','][' ']`guys`()             );  // 'hi, guys'
console.log( language.$template.prefix['hi'][','][' '].suffix['!']`guys`() );  // 'hi, guys!'
console.log( language.$template.prefix['hi, '].suffix['!!!']`guys`()       );  // 'hi, guys!!!'