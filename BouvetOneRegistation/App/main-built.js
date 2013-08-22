(function () {
/**
 * almond 0.2.0 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        aps = [].slice;

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!defined.hasOwnProperty(name) && !defining.hasOwnProperty(name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    function onResourceLoad(name, defined, deps){
        if(requirejs.onResourceLoad && name){
            requirejs.onResourceLoad({defined:defined}, {id:name}, deps);
        }
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (defined.hasOwnProperty(depName) ||
                           waiting.hasOwnProperty(depName) ||
                           defining.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }

        onResourceLoad(name, defined, args);
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        waiting[name] = [name, deps, callback];
    };

    define.amd = {
        jQuery: true
    };
}());

define("../Scripts/almond-custom", function(){});

define('durandal/system',["require","jquery"],function(e,t){function n(e){var t="[object "+e+"]";r["is"+e]=function(e){return s.call(e)==t}}var r,i=!1,o=Object.keys,a=Object.prototype.hasOwnProperty,s=Object.prototype.toString,u=!1,c=Array.isArray,l=Array.prototype.slice;if(Function.prototype.bind&&("object"==typeof console||"function"==typeof console)&&"object"==typeof console.log)try{["log","info","warn","error","assert","dir","clear","profile","profileEnd"].forEach(function(e){console[e]=this.call(console[e],console)},Function.prototype.bind)}catch(d){u=!0}e.on&&e.on("moduleLoaded",function(e,t){r.setModuleId(e,t)}),"undefined"!=typeof requirejs&&(requirejs.onResourceLoad=function(e,t){r.setModuleId(e.defined[t.id],t.id)});var f=function(){},v=function(){try{if("undefined"!=typeof console&&"function"==typeof console.log)if(window.opera)for(var e=0;e<arguments.length;)console.log("Item "+(e+1)+": "+arguments[e]),e++;else 1==l.call(arguments).length&&"string"==typeof l.call(arguments)[0]?console.log(l.call(arguments).toString()):console.log.apply(console,l.call(arguments));else Function.prototype.bind&&!u||"undefined"==typeof console||"object"!=typeof console.log||Function.prototype.call.call(console.log,console,l.call(arguments))}catch(t){}},g=function(e){if(e instanceof Error)throw e;throw new Error(e)};r={version:"2.0.0",noop:f,getModuleId:function(e){return e?"function"==typeof e?e.prototype.__moduleId__:"string"==typeof e?null:e.__moduleId__:null},setModuleId:function(e,t){return e?"function"==typeof e?(e.prototype.__moduleId__=t,void 0):("string"!=typeof e&&(e.__moduleId__=t),void 0):void 0},resolveObject:function(e){return r.isFunction(e)?new e:e},debug:function(e){return 1==arguments.length&&(i=e,i?(this.log=v,this.error=g,this.log("Debug:Enabled")):(this.log("Debug:Disabled"),this.log=f,this.error=f)),i},log:f,error:f,assert:function(e,t){e||r.error(new Error(t||"Assert:Failed"))},defer:function(e){return t.Deferred(e)},guid:function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var t=0|16*Math.random(),n="x"==e?t:8|3&t;return n.toString(16)})},acquire:function(){var t,n=arguments[0],i=!1;return r.isArray(n)?(t=n,i=!0):t=l.call(arguments,0),this.defer(function(n){e(t,function(){var e=arguments;setTimeout(function(){e.length>1||i?n.resolve(l.call(e,0)):n.resolve(e[0])},1)},function(e){n.reject(e)})}).promise()},extend:function(e){for(var t=l.call(arguments,1),n=0;n<t.length;n++){var r=t[n];if(r)for(var i in r)e[i]=r[i]}return e},wait:function(e){return r.defer(function(t){setTimeout(t.resolve,e)}).promise()}},r.keys=o||function(e){if(e!==Object(e))throw new TypeError("Invalid object");var t=[];for(var n in e)a.call(e,n)&&(t[t.length]=n);return t},r.isElement=function(e){return!(!e||1!==e.nodeType)},r.isArray=c||function(e){return"[object Array]"==s.call(e)},r.isObject=function(e){return e===Object(e)},r.isBoolean=function(e){return"boolean"==typeof e},r.isPromise=function(e){return e&&r.isFunction(e.then)};for(var p=["Arguments","Function","String","Number","Date","RegExp"],h=0;h<p.length;h++)n(p[h]);return r});
define('durandal/viewEngine',["durandal/system","jquery"],function(e,t){var n;return n=t.parseHTML?function(e){return t.parseHTML(e)}:function(e){return t(e).get()},{viewExtension:".html",viewPlugin:"text",isViewUrl:function(e){return-1!==e.indexOf(this.viewExtension,e.length-this.viewExtension.length)},convertViewUrlToViewId:function(e){return e.substring(0,e.length-this.viewExtension.length)},convertViewIdToRequirePath:function(e){return this.viewPlugin+"!"+e+this.viewExtension},parseMarkup:n,processMarkup:function(e){var t=this.parseMarkup(e);return this.ensureSingleElement(t)},ensureSingleElement:function(e){if(1==e.length)return e[0];for(var n=[],r=0;r<e.length;r++){var i=e[r];if(8!=i.nodeType){if(3==i.nodeType){var o=/\S/.test(i.nodeValue);if(!o)continue}n.push(i)}}return n.length>1?t(n).wrapAll('<div class="durandal-wrapper"></div>').parent().get(0):n[0]},createView:function(t){var n=this,r=this.convertViewIdToRequirePath(t);return e.defer(function(i){e.acquire(r).then(function(e){var r=n.processMarkup(e);r.setAttribute("data-view",t),i.resolve(r)}).fail(function(e){n.createFallbackView(t,r,e).then(function(e){e.setAttribute("data-view",t),i.resolve(e)})})}).promise()},createFallbackView:function(t,n){var r=this,i='View Not Found. Searched for "'+t+'" via path "'+n+'".';return e.defer(function(e){e.resolve(r.processMarkup('<div class="durandal-view-404">'+i+"</div>"))}).promise()}}});
define('durandal/viewLocator',["durandal/system","durandal/viewEngine"],function(e,t){function n(e,t){for(var n=0;n<e.length;n++){var r=e[n],i=r.getAttribute("data-view");if(i==t)return r}}function r(e){return(e+"").replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g,"\\$1")}return{useConvention:function(e,t,n){e=e||"viewmodels",t=t||"views",n=n||t;var i=new RegExp(r(e),"gi");this.convertModuleIdToViewId=function(e){return e.replace(i,t)},this.translateViewIdToArea=function(e,t){return t&&"partial"!=t?n+"/"+t+"/"+e:n+"/"+e}},locateViewForObject:function(t,n,r){var i;if(t.getView&&(i=t.getView()))return this.locateView(i,n,r);if(t.viewUrl)return this.locateView(t.viewUrl,n,r);var o=e.getModuleId(t);return o?this.locateView(this.convertModuleIdToViewId(o),n,r):this.locateView(this.determineFallbackViewId(t),n,r)},convertModuleIdToViewId:function(e){return e},determineFallbackViewId:function(e){var t=/function (.{1,})\(/,n=t.exec(e.constructor.toString()),r=n&&n.length>1?n[1]:"";return"views/"+r},translateViewIdToArea:function(e){return e},locateView:function(r,i,o){if("string"==typeof r){var a;if(a=t.isViewUrl(r)?t.convertViewUrlToViewId(r):r,i&&(a=this.translateViewIdToArea(a,i)),o){var s=n(o,a);if(s)return e.defer(function(e){e.resolve(s)}).promise()}return t.createView(a)}return e.defer(function(e){e.resolve(r)}).promise()}}});
define('durandal/binder',["durandal/system","knockout"],function(e,t){function n(t){return void 0===t?{applyBindings:!0}:e.isBoolean(t)?{applyBindings:t}:(void 0===t.applyBindings&&(t.applyBindings=!0),t)}function r(r,u,l,f){if(!u||!l)return i.throwOnErrors?e.error(a):e.log(a,u,f),void 0;if(!u.getAttribute)return i.throwOnErrors?e.error(o):e.log(o,u,f),void 0;var v=u.getAttribute("data-view");try{var d;return r&&r.binding&&(d=r.binding(u)),d=n(d),i.binding(f,u,d),d.applyBindings?(e.log("Binding",v,f),t.applyBindings(l,u)):r&&t.utils.domData.set(u,c,{$data:r}),i.bindingComplete(f,u,d),r&&r.bindingComplete&&r.bindingComplete(u),t.utils.domData.set(u,s,d),d}catch(p){p.message=p.message+";\nView: "+v+";\nModuleId: "+e.getModuleId(f),i.throwOnErrors?e.error(p):e.log(p.message)}}var i,a="Insufficient Information to Bind",o="Unexpected View Type",s="durandal-binding-instruction",c="__ko_bindingContext__";return i={binding:e.noop,bindingComplete:e.noop,throwOnErrors:!1,getBindingInstruction:function(e){return t.utils.domData.get(e,s)},bindContext:function(e,t,n){return n&&e&&(e=e.createChildContext(n)),r(n,t,e,n||(e?e.$data:null))},bind:function(e,t){return r(e,t,e,e)}}});
define('durandal/activator',["durandal/system","knockout"],function(e,t){function r(e){return void 0==e&&(e={}),e.closeOnDeactivate||(e.closeOnDeactivate=u.defaults.closeOnDeactivate),e.beforeActivate||(e.beforeActivate=u.defaults.beforeActivate),e.afterDeactivate||(e.afterDeactivate=u.defaults.afterDeactivate),e.affirmations||(e.affirmations=u.defaults.affirmations),e.interpretResponse||(e.interpretResponse=u.defaults.interpretResponse),e.areSameItem||(e.areSameItem=u.defaults.areSameItem),e}function n(t,r,n){return e.isArray(n)?t[r].apply(t,n):t[r](n)}function i(t,r,n,i,a){if(t&&t.deactivate){e.log("Deactivating",t);var o;try{o=t.deactivate(r)}catch(s){return e.error(s),i.resolve(!1),void 0}o&&o.then?o.then(function(){n.afterDeactivate(t,r,a),i.resolve(!0)},function(t){e.log(t),i.resolve(!1)}):(n.afterDeactivate(t,r,a),i.resolve(!0))}else t&&n.afterDeactivate(t,r,a),i.resolve(!0)}function a(t,r,i,a){if(t)if(t.activate){e.log("Activating",t);var o;try{o=n(t,"activate",a)}catch(s){return e.error(s),i(!1),void 0}o&&o.then?o.then(function(){r(t),i(!0)},function(t){e.log(t),i(!1)}):(r(t),i(!0))}else r(t),i(!0);else i(!0)}function o(t,r,n){return n.lifecycleData=null,e.defer(function(i){if(t&&t.canDeactivate){var a;try{a=t.canDeactivate(r)}catch(o){return e.error(o),i.resolve(!1),void 0}a.then?a.then(function(e){n.lifecycleData=e,i.resolve(n.interpretResponse(e))},function(t){e.error(t),i.resolve(!1)}):(n.lifecycleData=a,i.resolve(n.interpretResponse(a)))}else i.resolve(!0)}).promise()}function s(t,r,i,a){return i.lifecycleData=null,e.defer(function(o){if(t==r())return o.resolve(!0),void 0;if(t&&t.canActivate){var s;try{s=n(t,"canActivate",a)}catch(c){return e.error(c),o.resolve(!1),void 0}s.then?s.then(function(e){i.lifecycleData=e,o.resolve(i.interpretResponse(e))},function(t){e.error(t),o.resolve(!1)}):(i.lifecycleData=s,o.resolve(i.interpretResponse(s)))}else o.resolve(!0)}).promise()}function c(n,c){var u,l=t.observable(null);c=r(c);var v=t.computed({read:function(){return l()},write:function(e){v.viaSetter=!0,v.activateItem(e)}});return v.__activator__=!0,v.settings=c,c.activator=v,v.isActivating=t.observable(!1),v.canDeactivateItem=function(e,t){return o(e,t,c)},v.deactivateItem=function(t,r){return e.defer(function(e){v.canDeactivateItem(t,r).then(function(n){n?i(t,r,c,e,l):(v.notifySubscribers(),e.resolve(!1))})}).promise()},v.canActivateItem=function(e,t){return s(e,l,c,t)},v.activateItem=function(t,r){var n=v.viaSetter;return v.viaSetter=!1,e.defer(function(o){if(v.isActivating())return o.resolve(!1),void 0;v.isActivating(!0);var s=l();return c.areSameItem(s,t,u,r)?(v.isActivating(!1),o.resolve(!0),void 0):(v.canDeactivateItem(s,c.closeOnDeactivate).then(function(f){f?v.canActivateItem(t,r).then(function(f){f?e.defer(function(e){i(s,c.closeOnDeactivate,c,e)}).promise().then(function(){t=c.beforeActivate(t,r),a(t,l,function(e){u=r,v.isActivating(!1),o.resolve(e)},r)}):(n&&v.notifySubscribers(),v.isActivating(!1),o.resolve(!1))}):(n&&v.notifySubscribers(),v.isActivating(!1),o.resolve(!1))}),void 0)}).promise()},v.canActivate=function(){var e;return n?(e=n,n=!1):e=v(),v.canActivateItem(e)},v.activate=function(){var e;return n?(e=n,n=!1):e=v(),v.activateItem(e)},v.canDeactivate=function(e){return v.canDeactivateItem(v(),e)},v.deactivate=function(e){return v.deactivateItem(v(),e)},v.includeIn=function(e){e.canActivate=function(){return v.canActivate()},e.activate=function(){return v.activate()},e.canDeactivate=function(e){return v.canDeactivate(e)},e.deactivate=function(e){return v.deactivate(e)}},c.includeIn?v.includeIn(c.includeIn):n&&v.activate(),v.forItems=function(t){c.closeOnDeactivate=!1,c.determineNextItemToActivate=function(e,t){var r=t-1;return-1==r&&e.length>1?e[1]:r>-1&&r<e.length-1?e[r]:null},c.beforeActivate=function(e){var r=v();if(e){var n=t.indexOf(e);-1==n?t.push(e):e=t()[n]}else e=c.determineNextItemToActivate(t,r?t.indexOf(r):0);return e},c.afterDeactivate=function(e,r){r&&t.remove(e)};var r=v.canDeactivate;v.canDeactivate=function(n){return n?e.defer(function(e){function r(){for(var t=0;t<a.length;t++)if(!a[t])return e.resolve(!1),void 0;e.resolve(!0)}for(var i=t(),a=[],o=0;o<i.length;o++)v.canDeactivateItem(i[o],n).then(function(e){a.push(e),a.length==i.length&&r()})}).promise():r()};var n=v.deactivate;return v.deactivate=function(r){return r?e.defer(function(e){function n(n){v.deactivateItem(n,r).then(function(){a++,t.remove(n),a==o&&e.resolve()})}for(var i=t(),a=0,o=i.length,s=0;o>s;s++)n(i[s])}).promise():n()},v},v}var u,l={closeOnDeactivate:!0,affirmations:["yes","ok","true"],interpretResponse:function(r){return e.isObject(r)&&(r=r.can||!1),e.isString(r)?-1!==t.utils.arrayIndexOf(this.affirmations,r.toLowerCase()):r},areSameItem:function(e,t){return e==t},beforeActivate:function(e){return e},afterDeactivate:function(e,t,r){t&&r&&r(null)}};return u={defaults:l,create:c,isActivator:function(e){return e&&e.__activator__}}});
define('durandal/composition',["durandal/system","durandal/viewLocator","durandal/binder","durandal/viewEngine","durandal/activator","jquery","knockout"],function(e,t,i,n,r,a,o){function s(e){for(var t=[],i={childElements:t,activeView:null},n=o.virtualElements.firstChild(e);n;)1==n.nodeType&&(t.push(n),n.getAttribute(h)&&(i.activeView=n)),n=o.virtualElements.nextSibling(n);return i.activeView||(i.activeView=t[0]),i}function c(){b--,0===b&&setTimeout(function(){for(var e=w.length;e--;)w[e]();w=[]},1)}function l(t,i,n){if(n)i();else if(t.activate&&t.model&&t.model.activate){var r;r=e.isArray(t.activationData)?t.model.activate.apply(t.model,t.activationData):t.model.activate(t.activationData),r&&r.then?r.then(i):r||void 0===r?i():c()}else i()}function u(){var t=this;t.activeView&&t.activeView.removeAttribute(h),t.child&&(t.model&&t.model.attached&&(t.composingNewView||t.alwaysTriggerAttach)&&t.model.attached(t.child,t.parent,t),t.attached&&t.attached(t.child,t.parent,t),t.child.setAttribute(h,!0),t.composingNewView&&t.model&&(t.model.compositionComplete&&g.current.complete(function(){t.model.compositionComplete(t.child,t.parent,t)}),t.model.detached&&o.utils.domNodeDisposal.addDisposeCallback(t.child,function(){t.model.detached(t.child,t.parent,t)})),t.compositionComplete&&g.current.complete(function(){t.compositionComplete(t.child,t.parent,t)})),c(),t.triggerAttach=e.noop}function d(t){if(e.isString(t.transition)){if(t.activeView){if(t.activeView==t.child)return!1;if(!t.child)return!0;if(t.skipTransitionOnSameViewId){var i=t.activeView.getAttribute("data-view"),n=t.child.getAttribute("data-view");return i!=n}}return!0}return!1}function v(e){for(var t=0,i=e.length,n=[];i>t;t++){var r=e[t].cloneNode(!0);n.push(r)}return n}function f(e){var t=v(e.parts),i=g.getParts(t),n=g.getParts(e.child);for(var r in i)a(n[r]).replaceWith(i[r])}function p(t){var i,n,r=o.virtualElements.childNodes(t);if(!e.isArray(r)){var a=[];for(i=0,n=r.length;n>i;i++)a[i]=r[i];r=a}for(i=1,n=r.length;n>i;i++)o.removeNode(r[i])}var g,m={},h="data-active-view",w=[],b=0,y="durandal-composition-data",A="data-part",I="["+A+"]",S=["model","view","transition","area","strategy","activationData"],k={complete:function(e){w.push(e)}};return g={convertTransitionToModuleId:function(e){return"transitions/"+e},defaultTransitionName:null,current:k,addBindingHandler:function(e,t,i){var n,r,a="composition-handler-"+e;t=t||o.bindingHandlers[e],i=i||function(){return void 0},r=o.bindingHandlers[e]={init:function(e,n,r,s,c){var l={trigger:o.observable(null)};return g.current.complete(function(){t.init&&t.init(e,n,r,s,c),t.update&&(o.utils.domData.set(e,a,t),l.trigger("trigger"))}),o.utils.domData.set(e,a,l),i(e,n,r,s,c)},update:function(e,t,i,n,r){var s=o.utils.domData.get(e,a);return s.update?s.update(e,t,i,n,r):(s.trigger(),void 0)}};for(n in t)"init"!==n&&"update"!==n&&(r[n]=t[n])},getParts:function(t){var i={};e.isArray(t)||(t=[t]);for(var n=0;n<t.length;n++){var r=t[n];if(r.getAttribute){var o=r.getAttribute(A);o&&(i[o]=r);for(var s=a(I,r).not(a("[data-bind] "+I,r)),c=0;c<s.length;c++){var l=s.get(c);i[l.getAttribute(A)]=l}}}return i},cloneNodes:v,finalize:function(t){if(t.transition=t.transition||this.defaultTransitionName,t.child||t.activeView)if(d(t)){var n=this.convertTransitionToModuleId(t.transition);e.acquire(n).then(function(e){t.transition=e,e(t).then(function(){if(t.cacheViews){if(t.activeView){var e=i.getBindingInstruction(t.activeView);void 0==e.cacheViews||e.cacheViews||o.removeNode(t.activeView)}}else t.child?p(t.parent):o.virtualElements.emptyNode(t.parent);t.triggerAttach()})}).fail(function(t){e.error("Failed to load transition ("+n+"). Details: "+t.message)})}else{if(t.child!=t.activeView){if(t.cacheViews&&t.activeView){var r=i.getBindingInstruction(t.activeView);void 0==r.cacheViews||r.cacheViews?a(t.activeView).hide():o.removeNode(t.activeView)}t.child?(t.cacheViews||p(t.parent),a(t.child).show()):t.cacheViews||o.virtualElements.emptyNode(t.parent)}t.triggerAttach()}else t.cacheViews||o.virtualElements.emptyNode(t.parent),t.triggerAttach()},bindAndShow:function(e,t,r){t.child=e,t.composingNewView=t.cacheViews?-1==o.utils.arrayIndexOf(t.viewElements,e):!0,l(t,function(){if(t.binding&&t.binding(t.child,t.parent,t),t.preserveContext&&t.bindingContext)t.composingNewView&&(t.parts&&f(t),a(e).hide(),o.virtualElements.prepend(t.parent,e),i.bindContext(t.bindingContext,e,t.model));else if(e){var r=t.model||m,s=o.dataFor(e);if(s!=r){if(!t.composingNewView)return a(e).remove(),n.createView(e.getAttribute("data-view")).then(function(e){g.bindAndShow(e,t,!0)}),void 0;t.parts&&f(t),a(e).hide(),o.virtualElements.prepend(t.parent,e),i.bind(r,e)}}g.finalize(t)},r)},defaultStrategy:function(e){return t.locateViewForObject(e.model,e.area,e.viewElements)},getSettings:function(t){var i,a=t(),s=o.utils.unwrapObservable(a)||{},c=r.isActivator(a);if(e.isString(s))return s=n.isViewUrl(s)?{view:s}:{model:s,activate:!0};if(i=e.getModuleId(s))return s={model:s,activate:!0};!c&&s.model&&(c=r.isActivator(s.model));for(var l in s)s[l]=-1!=o.utils.arrayIndexOf(S,l)?o.utils.unwrapObservable(s[l]):s[l];return c?s.activate=!1:void 0===s.activate&&(s.activate=!0),s},executeStrategy:function(e){e.strategy(e).then(function(t){g.bindAndShow(t,e)})},inject:function(i){return i.model?i.view?(t.locateView(i.view,i.area,i.viewElements).then(function(e){g.bindAndShow(e,i)}),void 0):(i.strategy||(i.strategy=this.defaultStrategy),e.isString(i.strategy)?e.acquire(i.strategy).then(function(e){i.strategy=e,g.executeStrategy(i)}).fail(function(t){e.error("Failed to load view strategy ("+i.strategy+"). Details: "+t.message)}):this.executeStrategy(i),void 0):(this.bindAndShow(null,i),void 0)},compose:function(i,n,r,a){b++,a||(n=g.getSettings(function(){return n},i));var o=s(i);n.activeView=o.activeView,n.parent=i,n.triggerAttach=u,n.bindingContext=r,n.cacheViews&&!n.viewElements&&(n.viewElements=o.childElements),n.model?e.isString(n.model)?e.acquire(n.model).then(function(t){n.model=e.resolveObject(t),g.inject(n)}).fail(function(t){e.error("Failed to load composed module ("+n.model+"). Details: "+t.message)}):g.inject(n):n.view?(n.area=n.area||"partial",n.preserveContext=!0,t.locateView(n.view,n.area,n.viewElements).then(function(e){g.bindAndShow(e,n)})):this.bindAndShow(null,n)}},o.bindingHandlers.compose={init:function(){return{controlsDescendantBindings:!0}},update:function(e,t,i,r,a){var s=g.getSettings(t,e);if(s.mode){var c=o.utils.domData.get(e,y);if(!c){var l=o.virtualElements.childNodes(e);c={},"inline"===s.mode?c.view=n.ensureSingleElement(l):"templated"===s.mode&&(c.parts=v(l)),o.virtualElements.emptyNode(e),o.utils.domData.set(e,y,c)}"inline"===s.mode?s.view=c.view.cloneNode(!0):"templated"===s.mode&&(s.parts=c.parts),s.preserveContext=!0}g.compose(e,s,a,!0)}},o.virtualElements.allowedBindings.compose=!0,g});
define('durandal/events',["durandal/system"],function(e){var t=/\s+/,i=function(){},n=function(e,t){this.owner=e,this.events=t};return n.prototype.then=function(e,t){return this.callback=e||this.callback,this.context=t||this.context,this.callback?(this.owner.on(this.events,this.callback,this.context),this):this},n.prototype.on=n.prototype.then,n.prototype.off=function(){return this.owner.off(this.events,this.callback,this.context),this},i.prototype.on=function(e,i,r){var a,o,s;if(i){for(a=this.callbacks||(this.callbacks={}),e=e.split(t);o=e.shift();)s=a[o]||(a[o]=[]),s.push(i,r);return this}return new n(this,e)},i.prototype.off=function(i,n,r){var a,o,s,c;if(!(o=this.callbacks))return this;if(!(i||n||r))return delete this.callbacks,this;for(i=i?i.split(t):e.keys(o);a=i.shift();)if((s=o[a])&&(n||r))for(c=s.length-2;c>=0;c-=2)n&&s[c]!==n||r&&s[c+1]!==r||s.splice(c,2);else delete o[a];return this},i.prototype.trigger=function(e){var i,n,r,a,o,s,c,l;if(!(n=this.callbacks))return this;for(l=[],e=e.split(t),a=1,o=arguments.length;o>a;a++)l[a-1]=arguments[a];for(;i=e.shift();){if((c=n.all)&&(c=c.slice()),(r=n[i])&&(r=r.slice()),r)for(a=0,o=r.length;o>a;a+=2)r[a].apply(r[a+1]||this,l);if(c)for(s=[i].concat(l),a=0,o=c.length;o>a;a+=2)c[a].apply(c[a+1]||this,s)}return this},i.prototype.proxy=function(e){var t=this;return function(i){t.trigger(e,i)}},i.includeIn=function(e){e.on=i.prototype.on,e.off=i.prototype.off,e.trigger=i.prototype.trigger,e.proxy=i.prototype.proxy},i});
define('durandal/app',["durandal/system","durandal/viewEngine","durandal/composition","durandal/events","jquery"],function(e,t,n,r,i){function a(){return e.defer(function(t){return 0==s.length?(t.resolve(),void 0):(e.acquire(s).then(function(n){for(var r=0;r<n.length;r++){var i=n[r];if(i.install){var a=c[r];e.isObject(a)||(a={}),i.install(a),e.log("Plugin:Installed "+s[r])}else e.log("Plugin:Loaded "+s[r])}t.resolve()}).fail(function(t){e.error("Failed to load plugin(s). Details: "+t.message)}),void 0)}).promise()}var o,s=[],c=[];return o={title:"Application",configurePlugins:function(t,n){var r=e.keys(t);n=n||"plugins/",-1===n.indexOf("/",n.length-1)&&(n+="/");for(var i=0;i<r.length;i++){var a=r[i];s.push(n+a),c.push(t[a])}},start:function(){return e.log("Application:Starting"),this.title&&(document.title=this.title),e.defer(function(t){i(function(){a().then(function(){t.resolve(),e.log("Application:Started")})})}).promise()},setRoot:function(r,i,a){var o,s={activate:!0,transition:i};o=!a||e.isString(a)?document.getElementById(a||"applicationHost"):a,e.isString(r)?t.isViewUrl(r)?s.view=r:s.model=r:s.model=r,n.compose(o,s)}},r.includeIn(o),o});
requirejs.config({paths:{text:"../Scripts/text",durandal:"../Scripts/durandal",plugins:"../Scripts/durandal/plugins",transitions:"../Scripts/durandal/transitions",knockout:"../Scripts/knockout-2.3.0"}}),define("jquery",[],function(){return jQuery}),define("knockout",ko),define('main',["durandal/system","durandal/app","durandal/viewLocator"],function(n,t,e){n.debug(!0),t.title="BouvetOne",t.configurePlugins({router:!0,dialog:!0,widget:!0}),t.start().then(function(){e.useConvention(),t.setRoot("viewmodels/shell","entrance")})});
define('plugins/http',["jquery","knockout"],function(e,t){return{callbackParam:"callback",get:function(t,n){return e.ajax(t,{data:n})},jsonp:function(t,n,i){return-1==t.indexOf("=?")&&(i=i||this.callbackParam,t+=-1==t.indexOf("?")?"?":"&",t+=i+"=?"),e.ajax({url:t,dataType:"jsonp",data:n})},post:function(n,i){return e.ajax({url:n,data:t.toJSON(i),type:"POST",contentType:"application/json",dataType:"json"})}}});
define('services/registrationService',["plugins/http"],function(t){return{registerSpeaker:function(e){return t.post("registration/speaker",e).then(function(t){return toastr.success("Bruker "+e+" ble lagt til"),t}).fail(function(t){toastr.error("Registration failed with error "+t.message)})},registerSession:function(e,r){var n={id:e,title:r.title,description:r.description,level:r.level};return t.post("registration/session",n).then(function(t){return toastr.success("Foredrag "+r.title+" ble lagt til"),t}).fail(function(t,e){console.log(t),toastr.error("Registration failed with error "+e)})},getAllSpeakers:function(){return t.get("api/registration").then(function(t){return t}).fail(function(t,e){console.log(t),toastr.error("Speaker retrieval failed with error "+e)})}}});
define('viewmodels/registration',["services/registrationService","knockout"],function(e,r){var t=this;return t.displayName="Registrering",t.speaker=r.observable(),t.speakerId=r.observable(""),t.speakerRegistered=r.computed(function(){return""!=t.speakerId()}),t.speakers=r.observableArray([]),t.sessions=r.computed(function(){return _.flatten(_.map(t.speakers(),function(e){return _.map(e.sessions(),function(r){return{speaker:e.name,title:r.title,description:r.description,level:r.level}})}))}),t.intializeSessionInput=function(){return{title:"",description:"",level:""}},t.registrationInput=r.observable(t.intializeSessionInput()),t.registerSpeaker=function(){var s=_.find(t.speakers(),function(e){return e.name===t.speaker()});return void 0!==s?(toastr.success("Du kan legge til flere foredrag","Du er allerede registrert"),t.speakerId(s.id),void 0):(e.registerSpeaker(t.speaker()).then(function(e){t.speakerId(e),t.speakers.push({id:e,name:speaker(),sessions:r.observableArray([])})}),void 0)},t.registerSession=function(){return t.speakerId()?(e.registerSession(t.speakerId(),t.registrationInput()).then(function(){var e=_.find(t.speakers(),function(e){return e.id===t.speakerId()});void 0!==e&&e.sessions.push({speaker:e.name,title:registrationInput().title,description:t.registrationInput().description,level:t.registrationInput().level})}),void 0):(toastr.error("Du må legge til en foredragsholder"),void 0)},t.activate=function(){return e.getAllSpeakers().then(function(e){t.speakers(_.map(e,function(e){return{id:e.id,name:e.name,sessions:r.observableArray(e.sessions)}}))})},{displayName:t.displayName,speakerId:t.speakerId,speaker:t.speaker,sessions:t.sessions,speakerRegistered:t.speakerRegistered,registerSession:t.registerSession,registerSpeaker:t.registerSpeaker,activate:t.activate}});
define('plugins/history',["durandal/system","jquery"],function(e,t){function i(e,t,i){if(i){var n=e.href.replace(/(javascript:|#).*$/,"");e.replace(n+"#"+t)}else e.hash="#"+t}var n=/^[#\/]|\s+$/g,r=/^\/+|\/+$/g,a=/msie [\w.]+/,o=/\/$/,s={interval:50,active:!1};return"undefined"!=typeof window&&(s.location=window.location,s.history=window.history),s.getHash=function(e){var t=(e||s).location.href.match(/#(.*)$/);return t?t[1]:""},s.getFragment=function(e,t){if(null==e)if(s._hasPushState||!s._wantsHashChange||t){e=s.location.pathname;var i=s.root.replace(o,"");e.indexOf(i)||(e=e.substr(i.length))}else e=s.getHash();return e.replace(n,"")},s.activate=function(i){s.active&&e.error("History has already been activated."),s.active=!0,s.options=e.extend({},{root:"/"},s.options,i),s.root=s.options.root,s._wantsHashChange=s.options.hashChange!==!1,s._wantsPushState=!!s.options.pushState,s._hasPushState=!!(s.options.pushState&&s.history&&s.history.pushState);var o=s.getFragment(),c=document.documentMode,l=a.exec(navigator.userAgent.toLowerCase())&&(!c||7>=c);s.root=("/"+s.root+"/").replace(r,"/"),l&&s._wantsHashChange&&(s.iframe=t('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo("body")[0].contentWindow,s.navigate(o,!1)),s._hasPushState?t(window).on("popstate",s.checkUrl):s._wantsHashChange&&"onhashchange"in window&&!l?t(window).on("hashchange",s.checkUrl):s._wantsHashChange&&(s._checkUrlInterval=setInterval(s.checkUrl,s.interval)),s.fragment=o;var u=s.location,d=u.pathname.replace(/[^\/]$/,"$&/")===s.root;if(s._wantsHashChange&&s._wantsPushState){if(!s._hasPushState&&!d)return s.fragment=s.getFragment(null,!0),s.location.replace(s.root+s.location.search+"#"+s.fragment),!0;s._hasPushState&&d&&u.hash&&(this.fragment=s.getHash().replace(n,""),this.history.replaceState({},document.title,s.root+s.fragment+u.search))}return s.options.silent?void 0:s.loadUrl()},s.deactivate=function(){t(window).off("popstate",s.checkUrl).off("hashchange",s.checkUrl),clearInterval(s._checkUrlInterval),s.active=!1},s.checkUrl=function(){var e=s.getFragment();return e===s.fragment&&s.iframe&&(e=s.getFragment(s.getHash(s.iframe))),e===s.fragment?!1:(s.iframe&&s.navigate(e,!1),s.loadUrl(),void 0)},s.loadUrl=function(e){var t=s.fragment=s.getFragment(e);return s.options.routeHandler?s.options.routeHandler(t):!1},s.navigate=function(t,n){if(!s.active)return!1;if(void 0===n?n={trigger:!0}:e.isBoolean(n)&&(n={trigger:n}),t=s.getFragment(t||""),s.fragment!==t){s.fragment=t;var r=s.root+t;if(s._hasPushState)s.history[n.replace?"replaceState":"pushState"]({},document.title,r);else{if(!s._wantsHashChange)return s.location.assign(r);i(s.location,t,n.replace),s.iframe&&t!==s.getFragment(s.getHash(s.iframe))&&(n.replace||s.iframe.document.open().close(),i(s.iframe.location,t,n.replace))}return n.trigger?s.loadUrl(t):void 0}},s.navigateBack=function(){s.history.back()},s});
define('plugins/router',["durandal/system","durandal/app","durandal/activator","durandal/events","durandal/composition","plugins/history","knockout","jquery"],function(e,t,n,i,r,a,o,s){function c(e){return e=e.replace(b,"\\$&").replace(p,"(?:$1)?").replace(h,function(e,t){return t?e:"([^/]+)"}).replace(m,"(.*?)"),new RegExp("^"+e+"$")}function u(e){var t=e.indexOf(":"),n=t>0?t-1:e.length;return e.substring(0,n)}function l(e){return e.router&&e.router.loadUrl}function d(e,t){return-1!==e.indexOf(t,e.length-t.length)}function f(e,t){if(!e||!t)return!1;if(e.length!=t.length)return!1;for(var n=0,i=e.length;i>n;n++)if(e[n]!=t[n])return!1;return!0}var v,g,p=/\((.*?)\)/g,h=/(\(\?)?:\w+/g,m=/\*\w+/g,b=/[\-{}\[\]+?.,\\\^$|#\s]/g,y=/\/$/,w=function(){function r(t,n){e.log("Navigation Complete",t,n);var i=e.getModuleId(C);i&&B.trigger("router:navigation:from:"+i),C=t,O=n;var r=e.getModuleId(C);r&&B.trigger("router:navigation:to:"+r),l(t)||B.updateDocumentTitle(t,n),g.explicitNavigation=!1,g.navigatingBack=!1,B.trigger("router:navigation:complete",t,n,B)}function s(t,n){e.log("Navigation Cancelled"),B.activeInstruction(O),O&&B.navigate(O.fragment,!1),N(!1),g.explicitNavigation=!1,g.navigatingBack=!1,B.trigger("router:navigation:cancelled",t,n,B)}function p(t){e.log("Navigation Redirecting"),N(!1),g.explicitNavigation=!1,g.navigatingBack=!1,B.navigate(t,{trigger:!0,replace:!0})}function h(e,t,n){g.navigatingBack=!g.explicitNavigation&&C!=n.fragment,B.trigger("router:route:activating",t,n,B),e.activateItem(t,n.params).then(function(i){if(i){var a=C;r(t,n),l(t)&&_({router:t.router,fragment:n.fragment,queryString:n.queryString}),a==t&&B.attached()}else e.settings.lifecycleData&&e.settings.lifecycleData.redirect?p(e.settings.lifecycleData.redirect):s(t,n);v&&(v.resolve(),v=null)})}function m(t,n,i){var r=B.guardRoute(n,i);r?r.then?r.then(function(r){r?e.isString(r)?p(r):h(t,n,i):s(n,i)}):e.isString(r)?p(r):h(t,n,i):s(n,i)}function b(e,t,n){B.guardRoute?m(e,t,n):h(e,t,n)}function k(e){return O&&O.config.moduleId==e.config.moduleId&&C&&(C.canReuseForRoute&&C.canReuseForRoute.apply(C,e.params)||C.router&&C.router.loadUrl)}function I(){if(!N()){var t=V.shift();if(V=[],t){if(t.router){var i=t.fragment;return t.queryString&&(i+="?"+t.queryString),t.router.loadUrl(i),void 0}N(!0),B.activeInstruction(t),k(t)?b(n.create(),C,t):e.acquire(t.config.moduleId).then(function(n){var i=e.resolveObject(n);b(R,i,t)}).fail(function(n){e.error("Failed to load routed module ("+t.config.moduleId+"). Details: "+n.message)})}}}function _(e){V.unshift(e),I()}function S(e,t,n){for(var i=e.exec(t).slice(1),r=0;r<i.length;r++){var a=i[r];i[r]=a?decodeURIComponent(a):null}var o=B.parseQueryString(n);return o&&i.push(o),{params:i,queryParams:o}}function x(t){B.trigger("router:route:before-config",t,B),e.isRegExp(t)?t.routePattern=t.route:(t.title=t.title||B.convertRouteToTitle(t.route),t.moduleId=t.moduleId||B.convertRouteToModuleId(t.route),t.hash=t.hash||B.convertRouteToHash(t.route),t.routePattern=c(t.route)),B.trigger("router:route:after-config",t,B),B.routes.push(t),B.route(t.routePattern,function(e,n){var i=S(t.routePattern,e,n);_({fragment:e,queryString:n,config:t,params:i.params,queryParams:i.queryParams})})}function A(t){if(e.isArray(t.route))for(var n=0,i=t.route.length;i>n;n++){var r=e.extend({},t);r.route=t.route[n],n>0&&delete r.nav,x(r)}else x(t);return B}function D(e){e.isActive||(e.isActive=o.computed(function(){var t=R();return t&&t.__moduleId__==e.moduleId}))}var C,O,V=[],N=o.observable(!1),R=n.create(),B={handlers:[],routes:[],navigationModel:o.observableArray([]),activeItem:R,isNavigating:o.computed(function(){var e=R(),t=N(),n=e&&e.router&&e.router!=B&&e.router.isNavigating()?!0:!1;return t||n}),activeInstruction:o.observable(null),__router__:!0};return i.includeIn(B),R.settings.areSameItem=function(e,t,n,i){return e==t?f(n,i):!1},B.parseQueryString=function(e){var t,n;if(!e)return null;if(n=e.split("&"),0==n.length)return null;t={};for(var i=0;i<n.length;i++){var r=n[i];if(""!==r){var a=r.split("=");t[a[0]]=a[1]&&decodeURIComponent(a[1].replace(/\+/g," "))}}return t},B.route=function(e,t){B.handlers.push({routePattern:e,callback:t})},B.loadUrl=function(t){var n=B.handlers,i=null,r=t,o=t.indexOf("?");if(-1!=o&&(r=t.substring(0,o),i=t.substr(o+1)),B.relativeToParentRouter){var s=this.parent.activeInstruction();r=s.params.join("/"),r&&"/"==r[0]&&(r=r.substr(1)),r||(r=""),r=r.replace("//","/").replace("//","/")}r=r.replace(y,"");for(var c=0;c<n.length;c++){var u=n[c];if(u.routePattern.test(r))return u.callback(r,i),!0}return e.log("Route Not Found"),B.trigger("router:route:not-found",t,B),O&&a.navigate(O.fragment,{trigger:!1,replace:!0}),g.explicitNavigation=!1,g.navigatingBack=!1,!1},B.updateDocumentTitle=function(e,n){n.config.title?document.title=t.title?n.config.title+" | "+t.title:n.config.title:t.title&&(document.title=t.title)},B.navigate=function(e,t){return e&&-1!=e.indexOf("://")?(window.location.href=e,!0):(g.explicitNavigation=!0,a.navigate(e,t))},B.navigateBack=function(){a.navigateBack()},B.attached=function(){setTimeout(function(){N(!1),B.trigger("router:navigation:attached",C,O,B),I()},10)},B.compositionComplete=function(){B.trigger("router:navigation:composition-complete",C,O,B)},B.convertRouteToHash=function(e){if(B.relativeToParentRouter){var t=B.parent.activeInstruction(),n=t.config.hash+"/"+e;return a._hasPushState&&(n="/"+n),n=n.replace("//","/").replace("//","/")}return a._hasPushState?e:"#"+e},B.convertRouteToModuleId=function(e){return u(e)},B.convertRouteToTitle=function(e){var t=u(e);return t.substring(0,1).toUpperCase()+t.substring(1)},B.map=function(t,n){if(e.isArray(t)){for(var i=0;i<t.length;i++)B.map(t[i]);return B}return e.isString(t)||e.isRegExp(t)?(n?e.isString(n)&&(n={moduleId:n}):n={},n.route=t):n=t,A(n)},B.buildNavigationModel=function(t){var n=[],i=B.routes;t=t||100;for(var r=0;r<i.length;r++){var a=i[r];a.nav&&(e.isNumber(a.nav)||(a.nav=t),D(a),n.push(a))}return n.sort(function(e,t){return e.nav-t.nav}),B.navigationModel(n),B},B.mapUnknownRoutes=function(t,n){var i="*catchall",r=c(i);return B.route(r,function(o,s){var c=S(r,o,s),u={fragment:o,queryString:s,config:{route:i,routePattern:r},params:c.params,queryParams:c.queryParams};if(t)if(e.isString(t))u.config.moduleId=t,n&&a.navigate(n,{trigger:!1,replace:!0});else if(e.isFunction(t)){var l=t(u);if(l&&l.then)return l.then(function(){B.trigger("router:route:before-config",u.config,B),B.trigger("router:route:after-config",u.config,B),_(u)}),void 0}else u.config=t,u.config.route=i,u.config.routePattern=r;else u.config.moduleId=o;B.trigger("router:route:before-config",u.config,B),B.trigger("router:route:after-config",u.config,B),_(u)}),B},B.reset=function(){return O=C=void 0,B.handlers=[],B.routes=[],B.off(),delete B.options,B},B.makeRelative=function(t){return e.isString(t)&&(t={moduleId:t,route:t}),t.moduleId&&!d(t.moduleId,"/")&&(t.moduleId+="/"),t.route&&!d(t.route,"/")&&(t.route+="/"),t.fromParent&&(B.relativeToParentRouter=!0),B.on("router:route:before-config").then(function(e){t.moduleId&&(e.moduleId=t.moduleId+e.moduleId),t.route&&(e.route=""===e.route?t.route.substring(0,t.route.length-1):t.route+e.route)}),B},B.createChildRouter=function(){var e=w();return e.parent=B,e},B};return g=w(),g.explicitNavigation=!1,g.navigatingBack=!1,g.activate=function(t){return e.defer(function(n){if(v=n,g.options=e.extend({routeHandler:g.loadUrl},g.options,t),a.activate(g.options),a._hasPushState)for(var i=g.routes,r=i.length;r--;){var o=i[r];o.hash=o.hash.replace("#","")}s(document).delegate("a","click",function(e){if(g.explicitNavigation=!0,a._hasPushState&&!(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)){var t=s(this).attr("href"),n=this.protocol+"//";(!t||"#"!==t.charAt(0)&&t.slice(n.length)!==n)&&(e.preventDefault(),a.navigate(t))}})}).promise()},g.deactivate=function(){a.deactivate()},g.install=function(){o.bindingHandlers.router={init:function(){return{controlsDescendantBindings:!0}},update:function(e,t,n,i,a){var s=o.utils.unwrapObservable(t())||{};if(s.__router__)s={model:s.activeItem(),attached:s.attached,compositionComplete:s.compositionComplete,activate:!1};else{var c=o.utils.unwrapObservable(s.router||i.router)||g;s.model=c.activeItem(),s.attached=c.attached,s.compositionComplete=c.compositionComplete,s.activate=!1}r.compose(e,s,a)}},o.virtualElements.allowedBindings.router=!0},g});
define('viewmodels/shell',["plugins/router","durandal/app"],function(e,r){return{router:e,search:function(){r.showMessage("Search not yet implemented...")},activate:function(){return e.map([{route:"",title:"Registrering",moduleId:"viewmodels/registration",nav:!0}]).buildNavigationModel(),e.activate()}}});
define('text',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});
define('text!views/registration.html',[],function () { return '<section>\r\n    <!-- Main jumbotron for a primary marketing message or call to action -->\r\n    <div class="jumbotron">\r\n        <div class="container">\r\n            <h1>SmallOne registrering</h1>\r\n            <form role="form" class="form-inline">\r\n                <div class="form-group">\r\n                    <label for="speakerInput" class="sr-only">Speaker Name</label>\r\n                    <input type="text" placeholder="Skriv navnet ditt her" id="speakerInput" class="form-control" data-bind="value: speaker" />\r\n                    <button class="btn btn-primary" type="submit" data-bind="click: registerSpeaker">Start registrering</button>\r\n                </div>\r\n            </form>\r\n        </div>\r\n    </div>\r\n    <div class="container" data-bind="visible: speakerRegistered()">\r\n        <!--ko with: registrationInput-->\r\n       <form role="form" class="form-horizontal">\r\n           <div class="form-group"><strong data-bind="text: \'Register foredrag for \' + speaker()"></strong></div>\r\n           <div class="form-group">\r\n                <label class="sr-only">Tile</label>\r\n                <input type="Text" placeholder="Tittel" data-bind="value: title" class="form-control" />\r\n            </div>\r\n            <div class="form-group">\r\n                <label class="sr-only">Description</label>\r\n                <textarea class="form-control" placeholder="beskrivelse" data-bind="value: description" />\r\n            </div>\r\n            <div class="form-group">\r\n                <label class="sr-only">Level</label>\r\n                <input type="Text" placeholder="nivå" data-bind="value: level" class="form-control" />\r\n            </div>\r\n            <div class="form-group">\r\n                <button class="btn btn-primary" type="submit" data-bind="click: $parent.registerSession">Legg til foredrag</button>\r\n            </div>\r\n        </form>\r\n        <!--/ko-->\r\n    </div>\r\n    <div class="container">\r\n        <table class="table table-condensed table-hover">\r\n            <thead>\r\n                <tr>\r\n                <th>Foredragsholder</th><th>Tittel</th><th>Beskrivelse</th><th>Nivå</th>\r\n                </tr>\r\n            </thead>\r\n            <tbody data-bind="foreach:sessions">\r\n                <tr>\r\n                    <td data-bind="text:speaker"></td>\r\n                    <td data-bind="text:title"></td>\r\n                    <td data-bind="text:description"></td>\r\n                    <td data-bind="text:level"></td>\r\n                </tr>\r\n            </tbody>\r\n        </table>\r\n    </div>\r\n</section>\r\n';});

define('text!views/shell.html',[],function () { return '<div>\r\n    <div class="navbar navbar-inverse navbar-fixed-top">\r\n      <div class="container">\r\n        <div class="navbar-header">\r\n          <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">\r\n            <span class="icon-bar"></span>\r\n            <span class="icon-bar"></span>\r\n            <span class="icon-bar"></span>\r\n          </button>\r\n          <a class="navbar-brand" href="#">Microsoft SmallOne</a>\r\n        </div>\r\n        <div class="navbar-collapse collapse">\r\n             <ul class="nav navbar-nav" data-bind="foreach: router.navigationModel">\r\n                <li data-bind="css: { active: isActive }">\r\n                    <a data-bind="attr: { href: hash }, html: title"></a>\r\n                </li>\r\n            </ul>\r\n           <div class="loader pull-right" data-bind="css: { active: router.isNavigating }">\r\n                <i class="icon-spinner icon-2x icon-spin icon-white"></i>\r\n            </div>\r\n        </div><!--/.navbar-collapse -->\r\n      </div>\r\n    </div>\r\n    <div class="page-host" data-bind="router: { transition:\'entrance\', cacheViews:true }"></div>\r\n</div>';});

define('plugins/dialog',["durandal/system","durandal/app","durandal/composition","durandal/activator","durandal/viewEngine","jquery","knockout"],function(e,t,i,n,r,a,o){function s(t){return e.defer(function(i){e.isString(t)?e.acquire(t).then(function(t){i.resolve(e.resolveObject(t))}).fail(function(i){e.error("Failed to load dialog module ("+t+"). Details: "+i.message)}):i.resolve(t)}).promise()}var c,l={},u=0,d=function(e,t,i){this.message=e,this.title=t||d.defaultTitle,this.options=i||d.defaultOptions};return d.prototype.selectOption=function(e){c.close(this,e)},d.prototype.getView=function(){return r.processMarkup(d.defaultViewMarkup)},d.setViewUrl=function(e){delete d.prototype.getView,d.prototype.viewUrl=e},d.defaultTitle=t.title||"Application",d.defaultOptions=["Ok"],d.defaultViewMarkup=['<div data-view="plugins/messageBox" class="messageBox">','<div class="modal-header">','<h3 data-bind="text: title"></h3>',"</div>",'<div class="modal-body">','<p class="message" data-bind="text: message"></p>',"</div>",'<div class="modal-footer" data-bind="foreach: options">','<button class="btn" data-bind="click: function () { $parent.selectOption($data); }, text: $data, css: { \'btn-primary\': $index() == 0, autofocus: $index() == 0 }"></button>',"</div>","</div>"].join("\n"),c={MessageBox:d,currentZIndex:1050,getNextZIndex:function(){return++this.currentZIndex},isOpen:function(){return u>0},getContext:function(e){return l[e||"default"]},addContext:function(e,t){t.name=e,l[e]=t;var i="show"+e.substr(0,1).toUpperCase()+e.substr(1);this[i]=function(t,i){return this.show(t,i,e)}},createCompositionSettings:function(e,t){var i={model:e,activate:!1};return t.attached&&(i.attached=t.attached),t.compositionComplete&&(i.compositionComplete=t.compositionComplete),i},getDialog:function(e){return e?e.__dialog__:void 0},close:function(e){var t=this.getDialog(e);if(t){var i=Array.prototype.slice.call(arguments,1);t.close.apply(t,i)}},show:function(t,r,a){var o=this,c=l[a||"default"];return e.defer(function(e){s(t).then(function(t){var a=n.create();a.activateItem(t,r).then(function(n){if(n){var r=t.__dialog__={owner:t,context:c,activator:a,close:function(){var i=arguments;a.deactivateItem(t,!0).then(function(n){n&&(u--,c.removeHost(r),delete t.__dialog__,0==i.length?e.resolve():1==i.length?e.resolve(i[0]):e.resolve.apply(e,i))})}};r.settings=o.createCompositionSettings(t,c),c.addHost(r),u++,i.compose(r.host,r.settings)}else e.resolve(!1)})})}).promise()},showMessage:function(t,i,n){return e.isString(this.MessageBox)?c.show(this.MessageBox,[t,i||d.defaultTitle,n||d.defaultOptions]):c.show(new this.MessageBox(t,i,n))},install:function(e){t.showDialog=function(e,t,i){return c.show(e,t,i)},t.showMessage=function(e,t,i){return c.showMessage(e,t,i)},e.messageBox&&(c.MessageBox=e.messageBox),e.messageBoxView&&(c.MessageBox.prototype.getView=function(){return e.messageBoxView})}},c.addContext("default",{blockoutOpacity:.2,removeDelay:200,addHost:function(e){var t=a("body"),i=a('<div class="modalBlockout"></div>').css({"z-index":c.getNextZIndex(),opacity:this.blockoutOpacity}).appendTo(t),n=a('<div class="modalHost"></div>').css({"z-index":c.getNextZIndex()}).appendTo(t);if(e.host=n.get(0),e.blockout=i.get(0),!c.isOpen()){e.oldBodyMarginRight=t.css("margin-right"),e.oldInlineMarginRight=t.get(0).style.marginRight;var r=a("html"),o=t.outerWidth(!0),s=r.scrollTop();a("html").css("overflow-y","hidden");var l=a("body").outerWidth(!0);t.css("margin-right",l-o+parseInt(e.oldBodyMarginRight)+"px"),r.scrollTop(s)}},removeHost:function(e){if(a(e.host).css("opacity",0),a(e.blockout).css("opacity",0),setTimeout(function(){o.removeNode(e.host),o.removeNode(e.blockout)},this.removeDelay),!c.isOpen()){var t=a("html"),i=t.scrollTop();t.css("overflow-y","").scrollTop(i),e.oldInlineMarginRight?a("body").css("margin-right",e.oldBodyMarginRight):a("body").css("margin-right","")}},compositionComplete:function(e,t,i){var n=a(e),r=n.width(),o=n.height(),s=c.getDialog(i.model);n.css({"margin-top":(-o/2).toString()+"px","margin-left":(-r/2).toString()+"px"}),a(s.host).css("opacity",1),a(e).hasClass("autoclose")&&a(s.blockout).click(function(){s.close()}),a(".autofocus",e).each(function(){a(this).focus()})}}),c});
define('plugins/observable',["durandal/system","durandal/binder","knockout"],function(e,t,n){function i(e){var t=e[0];return"_"===t||"$"===t}function r(t){if(!t||e.isElement(t)||t.ko===n||t.jquery)return!1;var i=d.call(t);return-1==f.indexOf(i)&&!(t===!0||t===!1)}function a(e,t){var n=e.__observable__,i=!0;if(!n||!n.__full__){n=n||(e.__observable__={}),n.__full__=!0,v.forEach(function(n){e[n]=function(){i=!1;var e=m[n].apply(t,arguments);return i=!0,e}}),p.forEach(function(n){e[n]=function(){i&&t.valueWillMutate();var r=h[n].apply(e,arguments);return i&&t.valueHasMutated(),r}}),g.forEach(function(n){e[n]=function(){for(var r=0,a=arguments.length;a>r;r++)o(arguments[r]);i&&t.valueWillMutate();var s=h[n].apply(e,arguments);return i&&t.valueHasMutated(),s}}),e.splice=function(){for(var n=2,r=arguments.length;r>n;n++)o(arguments[n]);i&&t.valueWillMutate();var a=h.splice.apply(e,arguments);return i&&t.valueHasMutated(),a};for(var r=0,a=e.length;a>r;r++)o(e[r])}}function o(t){var o,s;if(r(t)&&(o=t.__observable__,!o||!o.__full__)){if(o=o||(t.__observable__={}),o.__full__=!0,e.isArray(t)){var l=n.observableArray(t);a(t,l)}else for(var u in t)i(u)||o[u]||(s=t[u],e.isFunction(s)||c(t,u,s));b&&e.log("Converted",t)}}function s(e,t,n){var i;e(t),i=e.peek(),n?i.destroyAll||(i||(i=[],e(i)),a(i,e)):o(i)}function c(t,i,r){var c,l,u=t.__observable__||(t.__observable__={});if(void 0===r&&(r=t[i]),e.isArray(r))c=n.observableArray(r),a(r,c),l=!0;else if("function"==typeof r){if(!n.isObservable(r))return null;c=r}else e.isPromise(r)?(c=n.observable(),r.then(function(t){if(e.isArray(t)){var i=n.observableArray(t);a(t,i),t=i}c(t)})):(c=n.observable(r),o(r));return Object.defineProperty(t,i,{configurable:!0,enumerable:!0,get:c,set:n.isWriteableObservable(c)?function(t){t&&e.isPromise(t)?t.then(function(t){s(c,t,e.isArray(t))}):s(c,t,l)}:void 0}),u[i]=c,c}function l(t,n,i){var r,a=this,o={owner:t,deferEvaluation:!0};return"function"==typeof i?o.read=i:("value"in i&&e.error('For ko.defineProperty, you must not specify a "value" for the property. You must provide a "get" function.'),"function"!=typeof i.get&&e.error('For ko.defineProperty, the third parameter must be either an evaluator function, or an options object containing a function called "get".'),o.read=i.get,o.write=i.set),r=a.computed(o),t[n]=r,c(t,n,r)}var u,d=Object.prototype.toString,f=["[object Function]","[object String]","[object Boolean]","[object Number]","[object Date]","[object RegExp]"],v=["remove","removeAll","destroy","destroyAll","replace"],p=["pop","reverse","sort","shift","splice"],g=["push","unshift"],h=Array.prototype,m=n.observableArray.fn,b=!1;return u=function(e,t){var i,r,a;return e?(i=e.__observable__,i&&(r=i[t])?r:(a=e[t],n.isObservable(a)?a:c(e,t,a))):null},u.defineProperty=l,u.convertProperty=c,u.convertObject=o,u.install=function(e){var n=t.binding;t.binding=function(e,t,i){i.applyBindings&&!i.skipConversion&&o(e),n(e,t)},b=e.logConversion},u});
define('plugins/serializer',["durandal/system"],function(e){return{typeAttribute:"type",space:void 0,replacer:function(e,t){if(e){var n=e[0];if("_"===n||"$"===n)return void 0}return t},serialize:function(t,n){return n=void 0===n?{}:n,(e.isString(n)||e.isNumber(n))&&(n={space:n}),JSON.stringify(t,n.replacer||this.replacer,n.space||this.space)},getTypeId:function(e){return e?e[this.typeAttribute]:void 0},typeMap:{},registerType:function(){var t=arguments[0];if(1==arguments.length){var n=t[this.typeAttribute]||e.getModuleId(t);this.typeMap[n]=t}else this.typeMap[t]=arguments[1]},reviver:function(e,t,n,r){var i=n(t);if(i){var a=r(i);if(a)return a.fromJSON?a.fromJSON(t):new a(t)}return t},deserialize:function(e,t){var n=this;t=t||{};var r=t.getTypeId||function(e){return n.getTypeId(e)},i=t.getConstructor||function(e){return n.typeMap[e]},a=t.reviver||function(e,t){return n.reviver(e,t,r,i)};return JSON.parse(e,a)}}});
define('plugins/widget',["durandal/system","durandal/composition","jquery","knockout"],function(e,t,n,i){function r(e,n){var r=i.utils.domData.get(e,u);r||(r={parts:t.cloneNodes(i.virtualElements.childNodes(e))},i.virtualElements.emptyNode(e),i.utils.domData.set(e,u,r)),n.parts=r.parts}var a={},o={},s=["model","view","kind"],u="durandal-widget-data",c={getSettings:function(t){var n=i.utils.unwrapObservable(t())||{};if(e.isString(n))return{kind:n};for(var r in n)n[r]=-1!=i.utils.arrayIndexOf(s,r)?i.utils.unwrapObservable(n[r]):n[r];return n},registerKind:function(e){i.bindingHandlers[e]={init:function(){return{controlsDescendantBindings:!0}},update:function(t,n,i,a,o){var s=c.getSettings(n);s.kind=e,r(t,s),c.create(t,s,o,!0)}},i.virtualElements.allowedBindings[e]=!0},mapKind:function(e,t,n){t&&(o[e]=t),n&&(a[e]=n)},mapKindToModuleId:function(e){return a[e]||c.convertKindToModulePath(e)},convertKindToModulePath:function(e){return"widgets/"+e+"/viewmodel"},mapKindToViewId:function(e){return o[e]||c.convertKindToViewPath(e)},convertKindToViewPath:function(e){return"widgets/"+e+"/view"},createCompositionSettings:function(e,t){return t.model||(t.model=this.mapKindToModuleId(t.kind)),t.view||(t.view=this.mapKindToViewId(t.kind)),t.preserveContext=!0,t.activate=!0,t.activationData=t,t.mode="templated",t},create:function(e,n,i,r){r||(n=c.getSettings(function(){return n},e));var a=c.createCompositionSettings(e,n);t.compose(e,a,i)},install:function(e){if(e.bindingName=e.bindingName||"widget",e.kinds)for(var t=e.kinds,n=0;n<t.length;n++)c.registerKind(t[n]);i.bindingHandlers[e.bindingName]={init:function(){return{controlsDescendantBindings:!0}},update:function(e,t,n,i,a){var o=c.getSettings(t);r(e,o),c.create(e,o,a,!0)}},i.virtualElements.allowedBindings[e.bindingName]=!0}};return c});
define('transitions/entrance',["durandal/system","durandal/composition","jquery"],function(e,t,n){var r=100,i={marginRight:0,marginLeft:0,opacity:1},o={marginLeft:"",marginRight:"",opacity:"",display:""},a=function(t){return e.defer(function(e){function a(){e.resolve()}function s(){t.keepScrollPosition||n(document).scrollTop(0)}function u(){s(),t.triggerAttach();var e={marginLeft:l?"0":"20px",marginRight:l?"0":"-20px",opacity:0,display:"block"},r=n(t.child);r.css(e),r.animate(i,c,"swing",function(){r.css(o),a()})}if(t.child){var c=t.duration||500,l=!!t.fadeOnly;t.activeView?n(t.activeView).fadeOut(r,u):u()}else n(t.activeView).fadeOut(r,a)}).promise()};return a});
require(["main"]);
}());