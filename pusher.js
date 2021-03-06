/*!
 * Pusher JavaScript Library v2.1.0
 * http://pusherapp.com/
 *
 * Copyright 2013, Pusher
 * Released under the MIT licence.
 */

(function () {
  function b(a, h) {
    var h = h || {}, e = this;
    this.key = a;
    this.config = b.Util.extend(b.getGlobalConfig(), h.cluster ? b.getClusterConfig(h.cluster) : {}, h);
    this.channels = new b.Channels;
    this.global_emitter = new b.EventsDispatcher;
    this.sessionID = Math.floor(Math.random() * 1E9);
    c(this.key);
    this.connection = new b.ConnectionManager(this.key, b.Util.extend({
      getStrategy: function (a) {
        return b.StrategyBuilder.build(b.getDefaultStrategy(e.config), b.Util.extend({}, e.config, a))
      },
      getTimeline: function () {
        return new b.Timeline(e.key,
          e.sessionID, {
            features: b.Util.getClientFeatures(),
            params: e.config.timelineParams || {},
            limit: 50,
            level: b.Timeline.INFO,
            version: b.VERSION
          })
      },
      getTimelineSender: function (a, d) {
        return e.config.disableStats ? null : new b.TimelineSender(a, {
          encrypted: e.isEncrypted() || !! d.encrypted,
          host: e.config.statsHost,
          path: "/timeline"
        })
      },
      activityTimeout: this.config.activity_timeout,
      pongTimeout: this.config.pong_timeout,
      unavailableTimeout: this.config.unavailable_timeout
    }, this.config, {
      encrypted: this.isEncrypted()
    }));
    this.connection.bind("connected",
      function () {
        e.subscribeAll()
      });
    this.connection.bind("message", function (a) {
      var d = a.event.indexOf("pusher_internal:") === 0;
      if (a.channel) {
        var b = e.channel(a.channel);
        b && b.handleEvent(a.event, a.data)
      }
      d || e.global_emitter.emit(a.event, a.data)
    });
    this.connection.bind("disconnected", function () {
      e.channels.disconnect()
    });
    this.connection.bind("error", function (a) {
      b.warn("Error", a)
    });
    b.instances.push(this);
    b.isReady && e.connect()
  }

  function c(a) {
    (a === null || a === void 0) && b.warn("Warning", "You must pass your app key when you instantiate Pusher.")
  }
  var a = b.prototype;
  b.instances = [];
  b.isReady = !1;
  b.debug = function () {
    b.log && b.log(b.Util.stringify.apply(this, arguments))
  };
  b.warn = function () {
    var a = b.Util.stringify.apply(this, arguments);
    window.console && (window.console.warn ? window.console.warn(a) : window.console.log && window.console.log(a));
    b.log && b.log(a)
  };
  b.ready = function () {
    b.isReady = !0;
    for (var a = 0, c = b.instances.length; a < c; a++) b.instances[a].connect()
  };
  a.channel = function (a) {
    return this.channels.find(a)
  };
  a.connect = function () {
    this.connection.connect()
  };
  a.disconnect = function () {
    this.connection.disconnect()
  };
  a.bind = function (a, b) {
    this.global_emitter.bind(a, b);
    return this
  };
  a.bind_all = function (a) {
    this.global_emitter.bind_all(a);
    return this
  };
  a.subscribeAll = function () {
    for (var a in this.channels.channels) this.channels.channels.hasOwnProperty(a) && this.subscribe(a)
  };
  a.subscribe = function (a) {
    var b = this,
      c = this.channels.add(a, this);
    this.connection.state === "connected" && c.authorize(this.connection.socket_id, function (f, g) {
      f ? c.handleEvent("pusher:subscription_error",
        g) : b.send_event("pusher:subscribe", {
        channel: a,
        auth: g.auth,
        channel_data: g.channel_data
      })
    });
    return c
  };
  a.unsubscribe = function (a) {
    this.channels.remove(a);
    this.connection.state === "connected" && this.send_event("pusher:unsubscribe", {
      channel: a
    })
  };
  a.send_event = function (a, b, c) {
    return this.connection.send_event(a, b, c)
  };
  a.isEncrypted = function () {
    return b.Util.getDocumentLocation().protocol === "https:" ? !0 : !! this.config.encrypted
  };
  this.Pusher = b
}).call(this);
(function () {
  Pusher.Util = {
    now: function () {
      return Date.now ? Date.now() : (new Date).valueOf()
    },
    extend: function (b) {
      for (var c = 1; c < arguments.length; c++) {
        var a = arguments[c],
          d;
        for (d in a) b[d] = a[d] && a[d].constructor && a[d].constructor === Object ? Pusher.Util.extend(b[d] || {}, a[d]) : a[d]
      }
      return b
    },
    stringify: function () {
      for (var b = ["Pusher"], c = 0; c < arguments.length; c++) typeof arguments[c] === "string" ? b.push(arguments[c]) : window.JSON === void 0 ? b.push(arguments[c].toString()) : b.push(JSON.stringify(arguments[c]));
      return b.join(" : ")
    },
    arrayIndexOf: function (b, c) {
      var a = Array.prototype.indexOf;
      if (b === null) return -1;
      if (a && b.indexOf === a) return b.indexOf(c);
      for (var a = 0, d = b.length; a < d; a++)
        if (b[a] === c) return a;
      return -1
    },
    keys: function (b) {
      var c = [],
        a;
      for (a in b) Object.prototype.hasOwnProperty.call(b, a) && c.push(a);
      return c
    },
    apply: function (b, c) {
      for (var a = 0; a < b.length; a++) c(b[a], a, b)
    },
    objectApply: function (b, c) {
      for (var a in b) Object.prototype.hasOwnProperty.call(b, a) && c(b[a], a, b)
    },
    map: function (b, c) {
      for (var a = [], d = 0; d < b.length; d++) a.push(c(b[d],
        d, b, a));
      return a
    },
    mapObject: function (b, c) {
      var a = {}, d;
      for (d in b) Object.prototype.hasOwnProperty.call(b, d) && (a[d] = c(b[d]));
      return a
    },
    filter: function (b, c) {
      for (var c = c || function (a) {
          return !!a
        }, a = [], d = 0; d < b.length; d++) c(b[d], d, b, a) && a.push(b[d]);
      return a
    },
    filterObject: function (b, c) {
      var c = c || function (a) {
          return !!a
        }, a = {}, d;
      for (d in b) Object.prototype.hasOwnProperty.call(b, d) && c(b[d], d, b, a) && (a[d] = b[d]);
      return a
    },
    flatten: function (b) {
      var c = [],
        a;
      for (a in b) Object.prototype.hasOwnProperty.call(b, a) && c.push([a,
        b[a]
      ]);
      return c
    },
    any: function (b, c) {
      for (var a = 0; a < b.length; a++)
        if (c(b[a], a, b)) return !0;
      return !1
    },
    all: function (b, c) {
      for (var a = 0; a < b.length; a++)
        if (!c(b[a], a, b)) return !1;
      return !0
    },
    method: function (b) {
      var c = Array.prototype.slice.call(arguments, 1);
      return function (a) {
        return a[b].apply(a, c.concat(arguments))
      }
    },
    getDocument: function () {
      return document
    },
    getDocumentLocation: function () {
      return Pusher.Util.getDocument().location
    },
    getLocalStorage: function () {
      return window.localStorage
    },
    getClientFeatures: function () {
      return Pusher.Util.keys(Pusher.Util.filterObject({
        ws: Pusher.WSTransport,
        flash: Pusher.FlashTransport
      }, function (b) {
        return b.isSupported()
      }))
    }
  }
}).call(this);
(function () {
  Pusher.VERSION = "2.1.0";
  Pusher.PROTOCOL = 6;
  Pusher.host = "ws.pusherapp.com";
  Pusher.ws_port = 80;
  Pusher.wss_port = 443;
  Pusher.sockjs_host = "sockjs.pusher.com";
  Pusher.sockjs_http_port = 80;
  Pusher.sockjs_https_port = 443;
  Pusher.sockjs_path = "/pusher";
  Pusher.stats_host = "stats.pusher.com";
  Pusher.channel_auth_endpoint = "/pusher/auth";
  Pusher.channel_auth_transport = "ajax";
  Pusher.activity_timeout = 12E4;
  Pusher.pong_timeout = 3E4;
  Pusher.unavailable_timeout = 1E4;
  Pusher.cdn_http = "http://js.pusher.com/";
  Pusher.cdn_https =
    "https://d3dy5gmtp8yhk7.cloudfront.net/";
  Pusher.dependency_suffix = ".min";
  Pusher.getDefaultStrategy = function (b) {
    return [[":def", "ws_options", {
      hostUnencrypted: b.wsHost + ":" + b.wsPort,
      hostEncrypted: b.wsHost + ":" + b.wssPort
    }], [":def", "sockjs_options", {
      hostUnencrypted: b.httpHost + ":" + b.httpPort,
      hostEncrypted: b.httpHost + ":" + b.httpsPort
    }], [":def", "timeouts", {
      loop: !0,
      timeout: 15E3,
      timeoutLimit: 6E4
    }], [":def", "ws_manager", [":transport_manager", {
      lives: 2,
      minPingDelay: 1E4,
      maxPingDelay: b.activity_timeout
    }]], [":def_transport",
      "ws", "ws", 3, ":ws_options", ":ws_manager"
    ], [":def_transport", "flash", "flash", 2, ":ws_options", ":ws_manager"], [":def_transport", "sockjs", "sockjs", 1, ":sockjs_options"], [":def", "ws_loop", [":sequential", ":timeouts", ":ws"]], [":def", "flash_loop", [":sequential", ":timeouts", ":flash"]], [":def", "sockjs_loop", [":sequential", ":timeouts", ":sockjs"]], [":def", "strategy", [":cached", 18E5, [":first_connected", [":if", [":is_supported", ":ws"],
      [":best_connected_ever", ":ws_loop", [":delayed", 2E3, [":sockjs_loop"]]],
      [":if", [":is_supported",
          ":flash"
        ],
        [":best_connected_ever", ":flash_loop", [":delayed", 2E3, [":sockjs_loop"]]],
        [":sockjs_loop"]
      ]
    ]]]]]
  }
}).call(this);
(function () {
  Pusher.getGlobalConfig = function () {
    return {
      wsHost: Pusher.host,
      wsPort: Pusher.ws_port,
      wssPort: Pusher.wss_port,
      httpHost: Pusher.sockjs_host,
      httpPort: Pusher.sockjs_http_port,
      httpsPort: Pusher.sockjs_https_port,
      httpPath: Pusher.sockjs_path,
      statsHost: Pusher.stats_host,
      authEndpoint: Pusher.channel_auth_endpoint,
      authTransport: Pusher.channel_auth_transport,
      activity_timeout: Pusher.activity_timeout,
      pong_timeout: Pusher.pong_timeout,
      unavailable_timeout: Pusher.unavailable_timeout
    }
  };
  Pusher.getClusterConfig =
    function (b) {
      return {
        wsHost: "ws-" + b + ".pusher.com",
        httpHost: "sockjs-" + b + ".pusher.com"
      }
  }
}).call(this);
(function () {
  function b(b) {
    var a = function (a) {
      Error.call(this, a);
      this.name = b
    };
    Pusher.Util.extend(a.prototype, Error.prototype);
    return a
  }
  Pusher.Errors = {
    UnsupportedTransport: b("UnsupportedTransport"),
    UnsupportedStrategy: b("UnsupportedStrategy"),
    TransportPriorityTooLow: b("TransportPriorityTooLow"),
    TransportClosed: b("TransportClosed")
  }
}).call(this);
(function () {
  function b(a) {
    this.callbacks = new c;
    this.global_callbacks = [];
    this.failThrough = a
  }

  function c() {
    this._callbacks = {}
  }
  var a = b.prototype;
  a.bind = function (a, b) {
    this.callbacks.add(a, b);
    return this
  };
  a.bind_all = function (a) {
    this.global_callbacks.push(a);
    return this
  };
  a.unbind = function (a, b) {
    this.callbacks.remove(a, b);
    return this
  };
  a.emit = function (a, b) {
    var c;
    for (c = 0; c < this.global_callbacks.length; c++) this.global_callbacks[c](a, b);
    var f = this.callbacks.get(a);
    if (f && f.length > 0)
      for (c = 0; c < f.length; c++) f[c](b);
    else this.failThrough && this.failThrough(a, b);
    return this
  };
  c.prototype.get = function (a) {
    return this._callbacks[this._prefix(a)]
  };
  c.prototype.add = function (a, b) {
    var c = this._prefix(a);
    this._callbacks[c] = this._callbacks[c] || [];
    this._callbacks[c].push(b)
  };
  c.prototype.remove = function (a, b) {
    if (this.get(a)) {
      var c = Pusher.Util.arrayIndexOf(this.get(a), b);
      if (c !== -1) {
        var f = this._callbacks[this._prefix(a)].slice(0);
        f.splice(c, 1);
        this._callbacks[this._prefix(a)] = f
      }
    }
  };
  c.prototype._prefix = function (a) {
    return "_" + a
  };
  Pusher.EventsDispatcher =
    b
}).call(this);
(function () {
  function b(a) {
    this.options = a;
    this.loading = {};
    this.loaded = {}
  }

  function c(a, b) {
    Pusher.Util.getDocument().addEventListener ? a.addEventListener("load", b, !1) : a.attachEvent("onreadystatechange", function () {
      (a.readyState === "loaded" || a.readyState === "complete") && b()
    })
  }

  function a(a, b) {
    var d = Pusher.Util.getDocument(),
      g = d.getElementsByTagName("head")[0],
      d = d.createElement("script");
    d.setAttribute("src", a);
    d.setAttribute("type", "text/javascript");
    d.setAttribute("async", !0);
    c(d, function () {
      setTimeout(b, 0)
    });
    g.appendChild(d)
  }
  var d = b.prototype;
  d.load = function (d, b) {
    var c = this;
    this.loaded[d] ? b() : (this.loading[d] || (this.loading[d] = []), this.loading[d].push(b), this.loading[d].length > 1 || a(this.getPath(d), function () {
      for (var a = 0; a < c.loading[d].length; a++) c.loading[d][a]();
      delete c.loading[d];
      c.loaded[d] = !0
    }))
  };
  d.getRoot = function (a) {
    var d = Pusher.Util.getDocumentLocation().protocol;
    return (a && a.encrypted || d === "https:" ? this.options.cdn_https : this.options.cdn_http).replace(/\/*$/, "") + "/" + this.options.version
  };
  d.getPath =
    function (a, d) {
      return this.getRoot(d) + "/" + a + this.options.suffix + ".js"
  };
  Pusher.DependencyLoader = b
}).call(this);
(function () {
  function b() {
    Pusher.ready()
  }

  function c(a) {
    document.body ? a() : setTimeout(function () {
      c(a)
    }, 0)
  }

  function a() {
    c(b)
  }
  Pusher.Dependencies = new Pusher.DependencyLoader({
    cdn_http: Pusher.cdn_http,
    cdn_https: Pusher.cdn_https,
    version: Pusher.VERSION,
    suffix: Pusher.dependency_suffix
  });
  if (!window.WebSocket && window.MozWebSocket) window.WebSocket = window.MozWebSocket;
  window.JSON ? a() : Pusher.Dependencies.load("json2", a)
})();
(function () {
  function b(a, d) {
    var b = this;
    this.timeout = setTimeout(function () {
      if (b.timeout !== null) d(), b.timeout = null
    }, a)
  }
  var c = b.prototype;
  c.isRunning = function () {
    return this.timeout !== null
  };
  c.ensureAborted = function () {
    if (this.timeout) clearTimeout(this.timeout), this.timeout = null
  };
  Pusher.Timer = b
}).call(this);
(function () {
  for (var b = String.fromCharCode, c = 0; c < 64; c++) "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(c);
  var a = function (a) {
    var d = a.charCodeAt(0);
    return d < 128 ? a : d < 2048 ? b(192 | d >>> 6) + b(128 | d & 63) : b(224 | d >>> 12 & 15) + b(128 | d >>> 6 & 63) + b(128 | d & 63)
  }, d = function (a) {
      var d = [0, 2, 1][a.length % 3],
        a = a.charCodeAt(0) << 16 | (a.length > 1 ? a.charCodeAt(1) : 0) << 8 | (a.length > 2 ? a.charCodeAt(2) : 0);
      return ["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(a >>> 18), "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(a >>>
        12 & 63), d >= 2 ? "=" : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(a >>> 6 & 63), d >= 1 ? "=" : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(a & 63)].join("")
    }, h = window.btoa || function (a) {
      return a.replace(/[\s\S]{1,3}/g, d)
    };
  Pusher.Base64 = {
    encode: function (d) {
      return h(d.replace(/[^\x00-\x7F]/g, a))
    }
  }
}).call(this);
(function () {
  function b(a) {
    this.options = a
  }

  function c(a) {
    return Pusher.Util.mapObject(a, function (a) {
      typeof a === "object" && (a = JSON.stringify(a));
      return encodeURIComponent(Pusher.Base64.encode(a.toString()))
    })
  }
  b.send = function (a, b) {
    var c = new Pusher.JSONPRequest({
      url: a.url,
      receiver: a.receiverName,
      tagPrefix: a.tagPrefix
    }),
      f = a.receiver.register(function (a, d) {
        c.cleanup();
        b(a, d)
      });
    return c.send(f, a.data, function (b) {
      var c = a.receiver.unregister(f);
      c && c(b)
    })
  };
  var a = b.prototype;
  a.send = function (a, b, e) {
    if (this.script) return !1;
    var f = this.options.tagPrefix || "_pusher_jsonp_",
      b = Pusher.Util.extend({}, b, {
        receiver: this.options.receiver
      }),
      b = Pusher.Util.map(Pusher.Util.flatten(c(Pusher.Util.filterObject(b, function (a) {
        return a !== void 0
      }))), Pusher.Util.method("join", "=")).join("&");
    this.script = document.createElement("script");
    this.script.id = f + a;
    this.script.src = this.options.url + "/" + a + "?" + b;
    this.script.type = "text/javascript";
    this.script.charset = "UTF-8";
    this.script.onerror = this.script.onload = e;
    if (this.script.async === void 0 && document.attachEvent &&
      /opera/i.test(navigator.userAgent)) f = this.options.receiver || "Pusher.JSONP.receive", this.errorScript = document.createElement("script"), this.errorScript.text = f + "(" + a + ", true);", this.script.async = this.errorScript.async = !1;
    var g = this;
    this.script.onreadystatechange = function () {
      g.script && /loaded|complete/.test(g.script.readyState) && e(!0)
    };
    a = document.getElementsByTagName("head")[0];
    a.insertBefore(this.script, a.firstChild);
    this.errorScript && a.insertBefore(this.errorScript, this.script.nextSibling);
    return !0
  };
  a.cleanup = function () {
    if (this.script && this.script.parentNode) this.script.parentNode.removeChild(this.script), this.script = null;
    if (this.errorScript && this.errorScript.parentNode) this.errorScript.parentNode.removeChild(this.errorScript), this.errorScript = null
  };
  Pusher.JSONPRequest = b
}).call(this);
(function () {
  function b() {
    this.lastId = 0;
    this.callbacks = {}
  }
  var c = b.prototype;
  c.register = function (a) {
    this.lastId++;
    var b = this.lastId;
    this.callbacks[b] = a;
    return b
  };
  c.unregister = function (a) {
    if (this.callbacks[a]) {
      var b = this.callbacks[a];
      delete this.callbacks[a];
      return b
    } else return null
  };
  c.receive = function (a, b, c) {
    (a = this.unregister(a)) && a(b, c)
  };
  Pusher.JSONPReceiver = b;
  Pusher.JSONP = new b
}).call(this);
(function () {
  function b(a, b, c) {
    this.key = a;
    this.session = b;
    this.events = [];
    this.options = c || {};
    this.uniqueID = this.sent = 0
  }
  var c = b.prototype;
  b.ERROR = 3;
  b.INFO = 6;
  b.DEBUG = 7;
  c.log = function (a, b) {
    if (this.options.level === void 0 || a <= this.options.level) this.events.push(Pusher.Util.extend({}, b, {
      timestamp: Pusher.Util.now(),
      level: a
    })), this.options.limit && this.events.length > this.options.limit && this.events.shift()
  };
  c.error = function (a) {
    this.log(b.ERROR, a)
  };
  c.info = function (a) {
    this.log(b.INFO, a)
  };
  c.debug = function (a) {
    this.log(b.DEBUG,
      a)
  };
  c.isEmpty = function () {
    return this.events.length === 0
  };
  c.send = function (a, b) {
    var c = this,
      e = {};
    this.sent === 0 && (e = Pusher.Util.extend({
      key: this.key,
      features: this.options.features,
      version: this.options.version
    }, this.options.params || {}));
    e.session = this.session;
    e.timeline = this.events;
    e = Pusher.Util.filterObject(e, function (a) {
      return a !== void 0
    });
    this.events = [];
    a(e, function (a, e) {
      a || c.sent++;
      b(a, e)
    });
    return !0
  };
  c.generateUniqueID = function () {
    this.uniqueID++;
    return this.uniqueID
  };
  Pusher.Timeline = b
}).call(this);
(function () {
  function b(a, b) {
    this.timeline = a;
    this.options = b || {}
  }
  var c = b.prototype;
  c.send = function (a) {
    if (!this.timeline.isEmpty()) {
      var b = this.options,
        c = "http" + (this.isEncrypted() ? "s" : "") + "://";
      this.timeline.send(function (a, f) {
        return Pusher.JSONPRequest.send({
          data: a,
          url: c + b.host + b.path,
          receiver: Pusher.JSONP
        }, f)
      }, a)
    }
  };
  c.isEncrypted = function () {
    return !!this.options.encrypted
  };
  Pusher.TimelineSender = b
}).call(this);
(function () {
  function b(a) {
    this.strategies = a
  }

  function c(a, b, c) {
    var h = Pusher.Util.map(a, function (a, d, h, e) {
      return a.connect(b, c(d, e))
    });
    return {
      abort: function () {
        Pusher.Util.apply(h, d)
      },
      forceMinPriority: function (a) {
        Pusher.Util.apply(h, function (b) {
          b.forceMinPriority(a)
        })
      }
    }
  }

  function a(a) {
    return Pusher.Util.all(a, function (a) {
      return Boolean(a.error)
    })
  }

  function d(a) {
    if (!a.error && !a.aborted) a.abort(), a.aborted = !0
  }
  var h = b.prototype;
  h.isSupported = function () {
    return Pusher.Util.any(this.strategies, Pusher.Util.method("isSupported"))
  };
  h.connect = function (b, d) {
    return c(this.strategies, b, function (b, c) {
      return function (h, e) {
        (c[b].error = h) ? a(c) && d(!0) : (Pusher.Util.apply(c, function (a) {
          a.forceMinPriority(e.transport.priority)
        }), d(null, e))
      }
    })
  };
  Pusher.BestConnectedEverStrategy = b
}).call(this);
(function () {
  function b(a, b, c) {
    this.strategy = a;
    this.transports = b;
    this.ttl = c.ttl || 18E5;
    this.timeline = c.timeline
  }

  function c() {
    var a = Pusher.Util.getLocalStorage();
    return a && a.pusherTransport ? JSON.parse(a.pusherTransport) : null
  }
  var a = b.prototype;
  a.isSupported = function () {
    return this.strategy.isSupported()
  };
  a.connect = function (a, b) {
    var e = c(),
      f = [this.strategy];
    if (e && e.timestamp + this.ttl >= Pusher.Util.now()) {
      var g = this.transports[e.transport];
      g && (this.timeline.info({
        cached: !0,
        transport: e.transport
      }), f.push(new Pusher.SequentialStrategy([g], {
        timeout: e.latency * 2,
        failFast: !0
      })))
    }
    var i = Pusher.Util.now(),
      j = f.pop().connect(a, function k(c, e) {
        if (c) {
          var g = Pusher.Util.getLocalStorage();
          if (g && g.pusherTransport) try {
            delete g.pusherTransport
          } catch (q) {
            g.pusherTransport = void 0
          }
          f.length > 0 ? (i = Pusher.Util.now(), j = f.pop().connect(a, k)) : b(c)
        } else {
          var g = Pusher.Util.now() - i,
            p = e.transport.name,
            o = Pusher.Util.getLocalStorage();
          if (o) try {
            o.pusherTransport = JSON.stringify({
              timestamp: Pusher.Util.now(),
              transport: p,
              latency: g
            })
          } catch (r) {}
          b(null, e)
        }
      });
    return {
      abort: function () {
        j.abort()
      },
      forceMinPriority: function (b) {
        a = b;
        j && j.forceMinPriority(b)
      }
    }
  };
  Pusher.CachedStrategy = b
}).call(this);
(function () {
  function b(a, b) {
    this.strategy = a;
    this.options = {
      delay: b.delay
    }
  }
  var c = b.prototype;
  c.isSupported = function () {
    return this.strategy.isSupported()
  };
  c.connect = function (a, b) {
    var c = this.strategy,
      e, f = new Pusher.Timer(this.options.delay, function () {
        e = c.connect(a, b)
      });
    return {
      abort: function () {
        f.ensureAborted();
        e && e.abort()
      },
      forceMinPriority: function (b) {
        a = b;
        e && e.forceMinPriority(b)
      }
    }
  };
  Pusher.DelayedStrategy = b
}).call(this);
(function () {
  function b(a) {
    this.strategy = a
  }
  var c = b.prototype;
  c.isSupported = function () {
    return this.strategy.isSupported()
  };
  c.connect = function (a, b) {
    var c = this.strategy.connect(a, function (a, f) {
      f && c.abort();
      b(a, f)
    });
    return c
  };
  Pusher.FirstConnectedStrategy = b
}).call(this);
(function () {
  function b(a, b, c) {
    this.test = a;
    this.trueBranch = b;
    this.falseBranch = c
  }
  var c = b.prototype;
  c.isSupported = function () {
    return (this.test() ? this.trueBranch : this.falseBranch).isSupported()
  };
  c.connect = function (a, b) {
    return (this.test() ? this.trueBranch : this.falseBranch).connect(a, b)
  };
  Pusher.IfStrategy = b
}).call(this);
(function () {
  function b(a, b) {
    this.strategies = a;
    this.loop = Boolean(b.loop);
    this.failFast = Boolean(b.failFast);
    this.timeout = b.timeout;
    this.timeoutLimit = b.timeoutLimit
  }
  var c = b.prototype;
  c.isSupported = function () {
    return Pusher.Util.any(this.strategies, Pusher.Util.method("isSupported"))
  };
  c.connect = function (a, b) {
    var c = this,
      e = this.strategies,
      f = 0,
      g = this.timeout,
      i = null,
      j = function (m, k) {
        k ? b(null, k) : (f += 1, c.loop && (f %= e.length), f < e.length ? (g && (g *= 2, c.timeoutLimit && (g = Math.min(g, c.timeoutLimit))), i = c.tryStrategy(e[f],
          a, {
            timeout: g,
            failFast: c.failFast
          }, j)) : b(!0))
      }, i = this.tryStrategy(e[f], a, {
        timeout: g,
        failFast: this.failFast
      }, j);
    return {
      abort: function () {
        i.abort()
      },
      forceMinPriority: function (b) {
        a = b;
        i && i.forceMinPriority(b)
      }
    }
  };
  c.tryStrategy = function (a, b, c, e) {
    var f = null,
      g = null,
      g = a.connect(b, function (a, b) {
        if (!a || !f || !f.isRunning() || c.failFast) f && f.ensureAborted(), e(a, b)
      });
    c.timeout > 0 && (f = new Pusher.Timer(c.timeout, function () {
      g.abort();
      e(!0)
    }));
    return {
      abort: function () {
        f && f.ensureAborted();
        g.abort()
      },
      forceMinPriority: function (a) {
        g.forceMinPriority(a)
      }
    }
  };
  Pusher.SequentialStrategy = b
}).call(this);
(function () {
  function b(a, b, c, f) {
    this.name = a;
    this.priority = b;
    this.transport = c;
    this.options = f || {}
  }

  function c(a, b) {
    new Pusher.Timer(0, function () {
      b(a)
    });
    return {
      abort: function () {},
      forceMinPriority: function () {}
    }
  }
  var a = b.prototype;
  a.isSupported = function () {
    return this.transport.isSupported({
      disableFlash: !! this.options.disableFlash
    })
  };
  a.connect = function (a, b) {
    if (this.transport.isSupported()) {
      if (this.priority < a) return c(new Pusher.Errors.TransportPriorityTooLow, b)
    } else return c(new Pusher.Errors.UnsupportedStrategy, b);
    var e = this,
      f = !1,
      g = this.transport.createConnection(this.name, this.priority, this.options.key, this.options),
      i = null,
      j = function () {
        g.unbind("initialized", j);
        g.connect()
      }, m = function () {
        i = new Pusher.Handshake(g, function (a) {
          f = !0;
          n();
          b(null, a)
        })
      }, k = function (a) {
        n();
        b(a)
      }, l = function () {
        n();
        b(new Pusher.Errors.TransportClosed(g))
      }, n = function () {
        g.unbind("initialized", j);
        g.unbind("open", m);
        g.unbind("error", k);
        g.unbind("closed", l)
      };
    g.bind("initialized", j);
    g.bind("open", m);
    g.bind("error", k);
    g.bind("closed", l);
    g.initialize();
    return {
      abort: function () {
        f || (n(), i ? i.close() : g.close())
      },
      forceMinPriority: function (a) {
        f || e.priority < a && (i ? i.close() : g.close())
      }
    }
  };
  Pusher.TransportStrategy = b
}).call(this);
(function () {
  function b(a, b, c, f) {
    Pusher.EventsDispatcher.call(this);
    this.name = a;
    this.priority = b;
    this.key = c;
    this.state = "new";
    this.timeline = f.timeline;
    this.id = this.timeline.generateUniqueID();
    this.options = {
      encrypted: Boolean(f.encrypted),
      hostUnencrypted: f.hostUnencrypted,
      hostEncrypted: f.hostEncrypted
    }
  }

  function c(a) {
    return typeof a === "string" ? a : typeof a === "object" ? Pusher.Util.mapObject(a, function (a) {
      var b = typeof a;
      return b === "object" || b == "function" ? b : a
    }) : typeof a
  }
  var a = b.prototype;
  Pusher.Util.extend(a,
    Pusher.EventsDispatcher.prototype);
  b.isSupported = function () {
    return !1
  };
  a.supportsPing = function () {
    return !1
  };
  a.initialize = function () {
    this.timeline.info(this.buildTimelineMessage({
      transport: this.name + (this.options.encrypted ? "s" : "")
    }));
    this.timeline.debug(this.buildTimelineMessage({
      method: "initialize"
    }));
    this.changeState("initialized")
  };
  a.connect = function () {
    var a = this.getURL(this.key, this.options);
    this.timeline.debug(this.buildTimelineMessage({
      method: "connect",
      url: a
    }));
    if (this.socket || this.state !== "initialized") return !1;
    try {
      this.socket = this.createSocket(a)
    } catch (b) {
      var c = this;
      new Pusher.Timer(0, function () {
        c.onError(b);
        c.changeState("closed")
      });
      return !1
    }
    this.bindListeners();
    Pusher.debug("Connecting", {
      transport: this.name,
      url: a
    });
    this.changeState("connecting");
    return !0
  };
  a.close = function () {
    this.timeline.debug(this.buildTimelineMessage({
      method: "close"
    }));
    return this.socket ? (this.socket.close(), !0) : !1
  };
  a.send = function (a) {
    this.timeline.debug(this.buildTimelineMessage({
      method: "send",
      data: a
    }));
    if (this.state === "open") {
      var b =
        this;
      setTimeout(function () {
        b.socket.send(a)
      }, 0);
      return !0
    } else return !1
  };
  a.requestPing = function () {
    this.emit("ping_request")
  };
  a.onOpen = function () {
    this.changeState("open");
    this.socket.onopen = void 0
  };
  a.onError = function (a) {
    this.emit("error", {
      type: "WebSocketError",
      error: a
    });
    this.timeline.error(this.buildTimelineMessage({
      error: c(a)
    }))
  };
  a.onClose = function (a) {
    this.changeState("closed", a);
    this.socket = void 0
  };
  a.onMessage = function (a) {
    this.timeline.debug(this.buildTimelineMessage({
      message: a.data
    }));
    this.emit("message",
      a)
  };
  a.bindListeners = function () {
    var a = this;
    this.socket.onopen = function () {
      a.onOpen()
    };
    this.socket.onerror = function (b) {
      a.onError(b)
    };
    this.socket.onclose = function (b) {
      a.onClose(b)
    };
    this.socket.onmessage = function (b) {
      a.onMessage(b)
    }
  };
  a.createSocket = function () {
    return null
  };
  a.getScheme = function () {
    return this.options.encrypted ? "wss" : "ws"
  };
  a.getBaseURL = function () {
    var a;
    a = this.options.encrypted ? this.options.hostEncrypted : this.options.hostUnencrypted;
    return this.getScheme() + "://" + a
  };
  a.getPath = function () {
    return "/app/" +
      this.key
  };
  a.getQueryString = function () {
    return "?protocol=" + Pusher.PROTOCOL + "&client=js&version=" + Pusher.VERSION
  };
  a.getURL = function () {
    return this.getBaseURL() + this.getPath() + this.getQueryString()
  };
  a.changeState = function (a, b) {
    this.state = a;
    this.timeline.info(this.buildTimelineMessage({
      state: a,
      params: b
    }));
    this.emit(a, b)
  };
  a.buildTimelineMessage = function (a) {
    return Pusher.Util.extend({
      cid: this.id
    }, a)
  };
  Pusher.AbstractTransport = b
}).call(this);
(function () {
  function b(a, b, c, e) {
    Pusher.AbstractTransport.call(this, a, b, c, e)
  }
  var c = b.prototype;
  Pusher.Util.extend(c, Pusher.AbstractTransport.prototype);
  b.createConnection = function (a, c, h, e) {
    return new b(a, c, h, e)
  };
  b.isSupported = function (a) {
    if (a && a.disableFlash) return !1;
    try {
      return Boolean(new ActiveXObject("ShockwaveFlash.ShockwaveFlash"))
    } catch (b) {
      return Boolean(navigator && navigator.mimeTypes && navigator.mimeTypes["application/x-shockwave-flash"] !== void 0)
    }
  };
  c.initialize = function () {
    var a = this;
    this.timeline.info(this.buildTimelineMessage({
      transport: this.name + (this.options.encrypted ? "s" : "")
    }));
    this.timeline.debug(this.buildTimelineMessage({
      method: "initialize"
    }));
    this.changeState("initializing");
    if (window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR === void 0) window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = !0;
    window.WEB_SOCKET_SWF_LOCATION = Pusher.Dependencies.getRoot() + "/WebSocketMain.swf";
    Pusher.Dependencies.load("flashfallback", function () {
      a.changeState("initialized")
    })
  };
  c.createSocket = function (a) {
    return new FlashWebSocket(a)
  };
  c.getQueryString = function () {
    return Pusher.AbstractTransport.prototype.getQueryString.call(this) +
      "&flash=true"
  };
  Pusher.FlashTransport = b
}).call(this);
(function () {
  function b(a, b, c, e) {
    Pusher.AbstractTransport.call(this, a, b, c, e);
    this.options.ignoreNullOrigin = e.ignoreNullOrigin
  }
  var c = b.prototype;
  Pusher.Util.extend(c, Pusher.AbstractTransport.prototype);
  b.createConnection = function (a, c, h, e) {
    return new b(a, c, h, e)
  };
  b.isSupported = function () {
    return !0
  };
  c.initialize = function () {
    var a = this;
    this.timeline.info(this.buildTimelineMessage({
      transport: this.name + (this.options.encrypted ? "s" : "")
    }));
    this.timeline.debug(this.buildTimelineMessage({
      method: "initialize"
    }));
    this.changeState("initializing");
    Pusher.Dependencies.load("sockjs", function () {
      a.changeState("initialized")
    })
  };
  c.supportsPing = function () {
    return !0
  };
  c.createSocket = function (a) {
    return new SockJS(a, null, {
      js_path: Pusher.Dependencies.getPath("sockjs", {
        encrypted: this.options.encrypted
      }),
      ignore_null_origin: this.options.ignoreNullOrigin
    })
  };
  c.getScheme = function () {
    return this.options.encrypted ? "https" : "http"
  };
  c.getPath = function () {
    return this.options.httpPath || "/pusher"
  };
  c.getQueryString = function () {
    return ""
  };
  c.onOpen = function () {
    this.socket.send(JSON.stringify({
      path: Pusher.AbstractTransport.prototype.getPath.call(this) + Pusher.AbstractTransport.prototype.getQueryString.call(this)
    }));
    this.changeState("open");
    this.socket.onopen = void 0
  };
  Pusher.SockJSTransport = b
}).call(this);
(function () {
  function b(a, b, c, e) {
    Pusher.AbstractTransport.call(this, a, b, c, e)
  }
  var c = b.prototype;
  Pusher.Util.extend(c, Pusher.AbstractTransport.prototype);
  b.createConnection = function (a, c, h, e) {
    return new b(a, c, h, e)
  };
  b.isSupported = function () {
    return window.WebSocket !== void 0 || window.MozWebSocket !== void 0
  };
  c.createSocket = function (a) {
    return new(window.WebSocket || window.MozWebSocket)(a)
  };
  c.getQueryString = function () {
    return Pusher.AbstractTransport.prototype.getQueryString.call(this) + "&flash=false"
  };
  Pusher.WSTransport =
    b
}).call(this);
(function () {
  function b(a, b, c) {
    this.manager = a;
    this.transport = b;
    this.minPingDelay = c.minPingDelay;
    this.maxPingDelay = c.maxPingDelay;
    this.pingDelay = null
  }
  var c = b.prototype;
  c.createConnection = function (a, b, c, e) {
    var f = this.transport.createConnection(a, b, c, e),
      g = this,
      i = null,
      j = null,
      m = function () {
        f.unbind("open", m);
        i = Pusher.Util.now();
        g.pingDelay && (j = setInterval(function () {
          j && f.requestPing()
        }, g.pingDelay));
        f.bind("closed", k)
      }, k = function (a) {
        f.unbind("closed", k);
        j && (clearInterval(j), j = null);
        if (!a.wasClean && i && (a =
          Pusher.Util.now() - i, a < 2 * g.maxPingDelay)) g.manager.reportDeath(), g.pingDelay = Math.max(a / 2, g.minPingDelay)
      };
    f.bind("open", m);
    return f
  };
  c.isSupported = function (a) {
    return this.manager.isAlive() && this.transport.isSupported(a)
  };
  Pusher.AssistantToTheTransportManager = b
}).call(this);
(function () {
  function b(a) {
    this.options = a || {};
    this.livesLeft = this.options.lives || Infinity
  }
  var c = b.prototype;
  c.getAssistant = function (a) {
    return new Pusher.AssistantToTheTransportManager(this, a, {
      minPingDelay: this.options.minPingDelay,
      maxPingDelay: this.options.maxPingDelay
    })
  };
  c.isAlive = function () {
    return this.livesLeft > 0
  };
  c.reportDeath = function () {
    this.livesLeft -= 1
  };
  Pusher.TransportManager = b
}).call(this);
(function () {
  function b(a) {
    return function (b) {
      return [a.apply(this, arguments), b]
    }
  }

  function c(a, b) {
    if (a.length === 0) return [[], b];
    var e = d(a[0], b),
      h = c(a.slice(1), e[1]);
    return [[e[0]].concat(h[0]), h[1]]
  }

  function a(a, b) {
    if (typeof a[0] === "string" && a[0].charAt(0) === ":") {
      var e = b[a[0].slice(1)];
      if (a.length > 1) {
        if (typeof e !== "function") throw "Calling non-function " + a[0];
        var h = [Pusher.Util.extend({}, b)].concat(Pusher.Util.map(a.slice(1), function (a) {
          return d(a, Pusher.Util.extend({}, b))[0]
        }));
        return e.apply(this, h)
      } else return [e,
        b]
    } else return c(a, b)
  }

  function d(b, c) {
    if (typeof b === "string") {
      var d;
      if (typeof b === "string" && b.charAt(0) === ":") {
        d = c[b.slice(1)];
        if (d === void 0) throw "Undefined symbol " + b;
        d = [d, c]
      } else d = [b, c];
      return d
    } else if (typeof b === "object" && b instanceof Array && b.length > 0) return a(b, c);
    return [b, c]
  }
  var h = {
    ws: Pusher.WSTransport,
    flash: Pusher.FlashTransport,
    sockjs: Pusher.SockJSTransport
  }, e = {
      def: function (a, b, c) {
        if (a[b] !== void 0) throw "Redefining symbol " + b;
        a[b] = c;
        return [void 0, a]
      },
      def_transport: function (a, b, c, d, e, k) {
        var l =
          h[c];
        if (!l) throw new Pusher.Errors.UnsupportedTransport(c);
        c = Pusher.Util.extend({}, {
          key: a.key,
          encrypted: a.encrypted,
          timeline: a.timeline,
          disableFlash: a.disableFlash,
          ignoreNullOrigin: a.ignoreNullOrigin
        }, e);
        k && (l = k.getAssistant(l));
        d = new Pusher.TransportStrategy(b, d, l, c);
        k = a.def(a, b, d)[1];
        k.transports = a.transports || {};
        k.transports[b] = d;
        return [void 0, k]
      },
      transport_manager: b(function (a, b) {
        return new Pusher.TransportManager(b)
      }),
      sequential: b(function (a, b) {
        var c = Array.prototype.slice.call(arguments, 2);
        return new Pusher.SequentialStrategy(c,
          b)
      }),
      cached: b(function (a, b, c) {
        return new Pusher.CachedStrategy(c, a.transports, {
          ttl: b,
          timeline: a.timeline
        })
      }),
      first_connected: b(function (a, b) {
        return new Pusher.FirstConnectedStrategy(b)
      }),
      best_connected_ever: b(function () {
        var a = Array.prototype.slice.call(arguments, 1);
        return new Pusher.BestConnectedEverStrategy(a)
      }),
      delayed: b(function (a, b, c) {
        return new Pusher.DelayedStrategy(c, {
          delay: b
        })
      }),
      "if": b(function (a, b, c, d) {
        return new Pusher.IfStrategy(b, c, d)
      }),
      is_supported: b(function (a, b) {
        return function () {
          return b.isSupported()
        }
      })
    };
  Pusher.StrategyBuilder = {
    build: function (a, b) {
      var c = Pusher.Util.extend({}, e, b);
      return d(a, c)[1].strategy
    }
  }
}).call(this);
(function () {
  Protocol = {
    decodeMessage: function (b) {
      try {
        var c = JSON.parse(b.data);
        if (typeof c.data === "string") try {
          c.data = JSON.parse(c.data)
        } catch (a) {
          if (!(a instanceof SyntaxError)) throw a;
        }
        return c
      } catch (d) {
        throw {
          type: "MessageParseError",
          error: d,
          data: b.data
        };
      }
    },
    encodeMessage: function (b) {
      return JSON.stringify(b)
    },
    processHandshake: function (b) {
      b = this.decodeMessage(b);
      if (b.event === "pusher:connection_established") return {
        action: "connected",
        id: b.data.socket_id
      };
      else if (b.event === "pusher:error") return {
        action: this.getCloseAction(b.data),
        error: this.getCloseError(b.data)
      };
      else throw "Invalid handshake";
    },
    getCloseAction: function (b) {
      return b.code < 4E3 ? b.code >= 1002 && b.code <= 1004 ? "backoff" : null : b.code === 4E3 ? "ssl_only" : b.code < 4100 ? "refused" : b.code < 4200 ? "backoff" : b.code < 4300 ? "retry" : "refused"
    },
    getCloseError: function (b) {
      return b.code !== 1E3 && b.code !== 1001 ? {
        type: "PusherError",
        data: {
          code: b.code,
          message: b.reason || b.message
        }
      } : null
    }
  };
  Pusher.Protocol = Protocol
}).call(this);
(function () {
  function b(a, b) {
    Pusher.EventsDispatcher.call(this);
    this.id = a;
    this.transport = b;
    this.bindListeners()
  }
  var c = b.prototype;
  Pusher.Util.extend(c, Pusher.EventsDispatcher.prototype);
  c.supportsPing = function () {
    return this.transport.supportsPing()
  };
  c.send = function (a) {
    return this.transport.send(a)
  };
  c.send_event = function (a, b, c) {
    a = {
      event: a,
      data: b
    };
    if (c) a.channel = c;
    Pusher.debug("Event sent", a);
    return this.send(Pusher.Protocol.encodeMessage(a))
  };
  c.close = function () {
    this.transport.close()
  };
  c.bindListeners =
    function () {
      var a = this,
        b = function (b) {
          var c;
          try {
            c = Pusher.Protocol.decodeMessage(b)
          } catch (d) {
            a.emit("error", {
              type: "MessageParseError",
              error: d,
              data: b.data
            })
          }
          if (c !== void 0) {
            Pusher.debug("Event recd", c);
            switch (c.event) {
            case "pusher:error":
              a.emit("error", {
                type: "PusherError",
                data: c.data
              });
              break;
            case "pusher:ping":
              a.emit("ping");
              break;
            case "pusher:pong":
              a.emit("pong")
            }
            a.emit("message", c)
          }
        }, c = function () {
          a.emit("ping_request")
        }, e = function (b) {
          a.emit("error", {
            type: "WebSocketError",
            error: b
          })
        }, f = function (g) {
          a.transport.unbind("closed",
            f);
          a.transport.unbind("error", e);
          a.transport.unbind("ping_request", c);
          a.transport.unbind("message", b);
          g && g.code && a.handleCloseEvent(g);
          a.transport = null;
          a.emit("closed")
        };
      a.transport.bind("message", b);
      a.transport.bind("ping_request", c);
      a.transport.bind("error", e);
      a.transport.bind("closed", f)
  };
  c.handleCloseEvent = function (a) {
    var b = Pusher.Protocol.getCloseAction(a);
    (a = Pusher.Protocol.getCloseError(a)) && this.emit("error", a);
    b && this.emit(b)
  };
  Pusher.Connection = b
}).call(this);
(function () {
  function b(a, b) {
    this.transport = a;
    this.callback = b;
    this.bindListeners()
  }
  var c = b.prototype;
  c.close = function () {
    this.unbindListeners();
    this.transport.close()
  };
  c.bindListeners = function () {
    var a = this;
    a.onMessage = function (b) {
      a.unbindListeners();
      try {
        var c = Pusher.Protocol.processHandshake(b);
        c.action === "connected" ? a.finish("connected", {
          connection: new Pusher.Connection(c.id, a.transport)
        }) : (a.finish(c.action, {
          error: c.error
        }), a.transport.close())
      } catch (e) {
        a.finish("error", {
          error: e
        }), a.transport.close()
      }
    };
    a.onClosed = function (b) {
      a.unbindListeners();
      var c = Pusher.Protocol.getCloseAction(b) || "backoff",
        b = Pusher.Protocol.getCloseError(b);
      a.finish(c, {
        error: b
      })
    };
    a.transport.bind("message", a.onMessage);
    a.transport.bind("closed", a.onClosed)
  };
  c.unbindListeners = function () {
    this.transport.unbind("message", this.onMessage);
    this.transport.unbind("closed", this.onClosed)
  };
  c.finish = function (a, b) {
    this.callback(Pusher.Util.extend({
      transport: this.transport,
      action: a
    }, b))
  };
  Pusher.Handshake = b
}).call(this);
(function () {
  function b(a, b) {
    Pusher.EventsDispatcher.call(this);
    this.key = a;
    this.options = b || {};
    this.state = "initialized";
    this.connection = null;
    this.encrypted = !! b.encrypted;
    this.timeline = this.options.getTimeline();
    this.connectionCallbacks = this.buildConnectionCallbacks();
    this.errorCallbacks = this.buildErrorCallbacks();
    this.handshakeCallbacks = this.buildHandshakeCallbacks(this.errorCallbacks);
    var c = this;
    Pusher.Network.bind("online", function () {
      c.timeline.info({
        netinfo: "online"
      });
      c.state === "unavailable" && c.connect()
    });
    Pusher.Network.bind("offline", function () {
      c.timeline.info({
        netinfo: "offline"
      });
      c.shouldRetry() && (c.disconnect(), c.updateState("unavailable"))
    });
    var e = function () {
      c.timelineSender && c.timelineSender.send(function () {})
    };
    this.bind("connected", e);
    setInterval(e, 6E4);
    this.updateStrategy()
  }
  var c = b.prototype;
  Pusher.Util.extend(c, Pusher.EventsDispatcher.prototype);
  c.connect = function () {
    var a = this;
    if (!a.connection && a.state !== "connecting")
      if (a.strategy.isSupported())
        if (Pusher.Network.isOnline() === !1) a.updateState("unavailable");
        else {
          a.updateState("connecting");
          a.timelineSender = a.options.getTimelineSender(a.timeline, {
            encrypted: a.encrypted
          }, a);
          var b = function (c, e) {
            c ? a.runner = a.strategy.connect(0, b) : (a.runner.abort(), a.handshakeCallbacks[e.action](e))
          };
          a.runner = a.strategy.connect(0, b);
          a.setUnavailableTimer()
        } else a.updateState("failed")
  };
  c.send = function (a) {
    return this.connection ? this.connection.send(a) : !1
  };
  c.send_event = function (a, b, c) {
    return this.connection ? this.connection.send_event(a, b, c) : !1
  };
  c.disconnect = function () {
    this.runner &&
      this.runner.abort();
    this.clearRetryTimer();
    this.clearUnavailableTimer();
    this.stopActivityCheck();
    this.updateState("disconnected");
    this.connection && (this.connection.close(), this.abandonConnection())
  };
  c.updateStrategy = function () {
    this.strategy = this.options.getStrategy({
      key: this.key,
      timeline: this.timeline,
      encrypted: this.encrypted
    })
  };
  c.retryIn = function (a) {
    var b = this;
    b.timeline.info({
      action: "retry",
      delay: a
    });
    b.retryTimer = new Pusher.Timer(a || 0, function () {
      b.disconnect();
      b.connect()
    })
  };
  c.clearRetryTimer = function () {
    this.retryTimer &&
      this.retryTimer.ensureAborted()
  };
  c.setUnavailableTimer = function () {
    var a = this;
    a.unavailableTimer = new Pusher.Timer(a.options.unavailableTimeout, function () {
      a.updateState("unavailable")
    })
  };
  c.clearUnavailableTimer = function () {
    this.unavailableTimer && this.unavailableTimer.ensureAborted()
  };
  c.resetActivityCheck = function () {
    this.stopActivityCheck();
    if (!this.connection.supportsPing()) {
      var a = this;
      a.activityTimer = new Pusher.Timer(a.options.activityTimeout, function () {
        a.send_event("pusher:ping", {});
        a.activityTimer =
          new Pusher.Timer(a.options.pongTimeout, function () {
            a.connection.close()
          })
      })
    }
  };
  c.stopActivityCheck = function () {
    this.activityTimer && this.activityTimer.ensureAborted()
  };
  c.buildConnectionCallbacks = function () {
    var a = this;
    return {
      message: function (b) {
        a.resetActivityCheck();
        a.emit("message", b)
      },
      ping: function () {
        a.send_event("pusher:pong", {})
      },
      ping_request: function () {
        a.send_event("pusher:ping", {})
      },
      error: function (b) {
        a.emit("error", {
          type: "WebSocketError",
          error: b
        })
      },
      closed: function () {
        a.abandonConnection();
        a.shouldRetry() &&
          a.retryIn(1E3)
      }
    }
  };
  c.buildHandshakeCallbacks = function (a) {
    var b = this;
    return Pusher.Util.extend({}, a, {
      connected: function (a) {
        b.clearUnavailableTimer();
        b.setConnection(a.connection);
        b.socket_id = b.connection.id;
        b.updateState("connected")
      }
    })
  };
  c.buildErrorCallbacks = function () {
    function a(a) {
      return function (c) {
        c.error && b.emit("error", {
          type: "WebSocketError",
          error: c.error
        });
        a(c)
      }
    }
    var b = this;
    return {
      ssl_only: a(function () {
        b.encrypted = !0;
        b.updateStrategy();
        b.retryIn(0)
      }),
      refused: a(function () {
        b.disconnect()
      }),
      backoff: a(function () {
        b.retryIn(1E3)
      }),
      retry: a(function () {
        b.retryIn(0)
      })
    }
  };
  c.setConnection = function (a) {
    this.connection = a;
    for (var b in this.connectionCallbacks) this.connection.bind(b, this.connectionCallbacks[b]);
    this.resetActivityCheck()
  };
  c.abandonConnection = function () {
    if (this.connection) {
      for (var a in this.connectionCallbacks) this.connection.unbind(a, this.connectionCallbacks[a]);
      this.connection = null
    }
  };
  c.updateState = function (a, b) {
    var c = this.state;
    this.state = a;
    c !== a && (Pusher.debug("State changed", c + " -> " + a), this.timeline.info({
        state: a
      }),
      this.emit("state_change", {
        previous: c,
        current: a
      }), this.emit(a, b))
  };
  c.shouldRetry = function () {
    return this.state === "connecting" || this.state === "connected"
  };
  Pusher.ConnectionManager = b
}).call(this);
(function () {
  function b() {
    Pusher.EventsDispatcher.call(this);
    var b = this;
    window.addEventListener !== void 0 && (window.addEventListener("online", function () {
      b.emit("online")
    }, !1), window.addEventListener("offline", function () {
      b.emit("offline")
    }, !1))
  }
  Pusher.Util.extend(b.prototype, Pusher.EventsDispatcher.prototype);
  b.prototype.isOnline = function () {
    return window.navigator.onLine === void 0 ? !0 : window.navigator.onLine
  };
  Pusher.NetInfo = b;
  Pusher.Network = new b
}).call(this);
(function () {
  function b() {
    this.reset()
  }
  var c = b.prototype;
  c.get = function (a) {
    return Object.prototype.hasOwnProperty.call(this.members, a) ? {
      id: a,
      info: this.members[a]
    } : null
  };
  c.each = function (a) {
    var b = this;
    Pusher.Util.objectApply(b.members, function (c, e) {
      a(b.get(e))
    })
  };
  c.setMyID = function (a) {
    this.myID = a
  };
  c.onSubscription = function (a) {
    this.members = a.presence.hash;
    this.count = a.presence.count;
    this.me = this.get(this.myID)
  };
  c.addMember = function (a) {
    this.get(a.user_id) === null && this.count++;
    this.members[a.user_id] = a.user_info;
    return this.get(a.user_id)
  };
  c.removeMember = function (a) {
    var b = this.get(a.user_id);
    b && (delete this.members[a.user_id], this.count--);
    return b
  };
  c.reset = function () {
    this.members = {};
    this.count = 0;
    this.me = this.myID = null
  };
  Pusher.Members = b
}).call(this);
(function () {
  function b(a, b) {
    Pusher.EventsDispatcher.call(this, function (b) {
      Pusher.debug("No callbacks on " + a + " for " + b)
    });
    this.name = a;
    this.pusher = b;
    this.subscribed = !1
  }
  var c = b.prototype;
  Pusher.Util.extend(c, Pusher.EventsDispatcher.prototype);
  c.authorize = function (a, b) {
    return b(!1, {})
  };
  c.trigger = function (a, b) {
    return this.pusher.send_event(a, b, this.name)
  };
  c.disconnect = function () {
    this.subscribed = !1
  };
  c.handleEvent = function (a, b) {
    if (a.indexOf("pusher_internal:") === 0) {
      if (a === "pusher_internal:subscription_succeeded") this.subscribed = !0, this.emit("pusher:subscription_succeeded", b)
    } else this.emit(a, b)
  };
  Pusher.Channel = b
}).call(this);
(function () {
  function b(a, b) {
    Pusher.Channel.call(this, a, b)
  }
  var c = b.prototype;
  Pusher.Util.extend(c, Pusher.Channel.prototype);
  c.authorize = function (a, b) {
    return (new Pusher.Channel.Authorizer(this, this.pusher.config)).authorize(a, b)
  };
  Pusher.PrivateChannel = b
}).call(this);
(function () {
  function b(a, b) {
    Pusher.PrivateChannel.call(this, a, b);
    this.members = new Pusher.Members
  }
  var c = b.prototype;
  Pusher.Util.extend(c, Pusher.PrivateChannel.prototype);
  c.authorize = function (a, b) {
    var c = this;
    Pusher.PrivateChannel.prototype.authorize.call(c, a, function (a, f) {
      if (!a) {
        if (f.channel_data === void 0) {
          Pusher.warn("Invalid auth response for channel '" + c.name + "', expected 'channel_data' field");
          b("Invalid auth response");
          return
        }
        var g = JSON.parse(f.channel_data);
        c.members.setMyID(g.user_id)
      }
      b(a, f)
    })
  };
  c.handleEvent = function (a, b) {
    switch (a) {
    case "pusher_internal:subscription_succeeded":
      this.members.onSubscription(b);
      this.subscribed = !0;
      this.emit("pusher:subscription_succeeded", this.members);
      break;
    case "pusher_internal:member_added":
      this.emit("pusher:member_added", this.members.addMember(b));
      break;
    case "pusher_internal:member_removed":
      var c = this.members.removeMember(b);
      c && this.emit("pusher:member_removed", c);
      break;
    default:
      Pusher.PrivateChannel.prototype.handleEvent.call(this, a, b)
    }
  };
  c.disconnect = function () {
    this.members.reset();
    Pusher.PrivateChannel.prototype.disconnect.call(this)
  };
  Pusher.PresenceChannel = b
}).call(this);
(function () {
  function b() {
    this.channels = {}
  }
  var c = b.prototype;
  c.add = function (a, b) {
    this.channels[a] || (this.channels[a] = a.indexOf("private-") === 0 ? new Pusher.PrivateChannel(a, b) : a.indexOf("presence-") === 0 ? new Pusher.PresenceChannel(a, b) : new Pusher.Channel(a, b));
    return this.channels[a]
  };
  c.find = function (a) {
    return this.channels[a]
  };
  c.remove = function (a) {
    delete this.channels[a]
  };
  c.disconnect = function () {
    Pusher.Util.objectApply(this.channels, function (a) {
      a.disconnect()
    })
  };
  Pusher.Channels = b
}).call(this);
(function () {
  Pusher.Channel.Authorizer = function (b, a) {
    this.channel = b;
    this.type = a.authTransport;
    this.options = a;
    this.authOptions = (a || {}).auth || {}
  };
  Pusher.Channel.Authorizer.prototype = {
    composeQuery: function (b) {
      var b = "&socket_id=" + encodeURIComponent(b) + "&channel_name=" + encodeURIComponent(this.channel.name),
        a;
      for (a in this.authOptions.params) b += "&" + encodeURIComponent(a) + "=" + encodeURIComponent(this.authOptions.params[a]);
      return b
    },
    authorize: function (b, a) {
      return Pusher.authorizers[this.type].call(this, b, a)
    }
  };
  var b = 1;
  Pusher.auth_callbacks = {};
  Pusher.authorizers = {
    ajax: function (b, a) {
      var d;
      d = Pusher.XHR ? new Pusher.XHR : window.XMLHttpRequest ? new window.XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");
      d.open("POST", this.options.authEndpoint, !0);
      d.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      for (var h in this.authOptions.headers) d.setRequestHeader(h, this.authOptions.headers[h]);
      d.onreadystatechange = function () {
        if (d.readyState == 4)
          if (d.status == 200) {
            var b, c = !1;
            try {
              b = JSON.parse(d.responseText),
              c = !0
            } catch (g) {
              a(!0, "JSON returned from webapp was invalid, yet status code was 200. Data was: " + d.responseText)
            }
            c && a(!1, b)
          } else Pusher.warn("Couldn't get auth info from your webapp", d.status), a(!0, d.status)
      };
      d.send(this.composeQuery(b));
      return d
    },
    jsonp: function (c, a) {
      this.authOptions.headers !== void 0 && Pusher.warn("Warn", "To send headers with the auth request, you must use AJAX, rather than JSONP.");
      var d = b.toString();
      b++;
      var h = document.createElement("script");
      Pusher.auth_callbacks[d] = function (b) {
        a(!1,
          b)
      };
      h.src = this.options.authEndpoint + "?callback=" + encodeURIComponent("Pusher.auth_callbacks['" + d + "']") + this.composeQuery(c);
      d = document.getElementsByTagName("head")[0] || document.documentElement;
      d.insertBefore(h, d.firstChild)
    }
  }
}).call(this);

/**
 * Expose `Pusher`
 */

module.exports = this.Pusher;
