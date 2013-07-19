
/**
 * Dependencies
 */

var Pusher = require('./pusher')
  , XHR = require('xhr');

/**
 * Connect to Pusher
 */

var pusher = new Pusher(window.PUSHER_KEY);

/**
 * Save the socket id
 */

saveSocketId(pusher);

/**
 * Expose `pusher`
 */

module.exports = pusher;

/**
 * Listen to PhoneGap events
 */

document.addEventListener('resume', reconnect, false);
document.addEventListener('online', reconnect, false);

/**
 * Reconnect
 */

function reconnect() {
  setTimeout(function() {
    if (pusher.connection.state !== 'connecting' && pusher.connection.state !== 'connected') {
      pusher = new Pusher(window.PUSHER_KEY);
      saveSocketId(pusher);
    }
  }, 0);
}

/**
 * Save the socket id
 */

function saveSocketId(pusher) {
  pusher.connection.bind('connected', function() {
    XHR.setHeader('X-Pusher-Socket-ID', pusher.connection['socket_id']);
  });
}
