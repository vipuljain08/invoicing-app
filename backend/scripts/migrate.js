const { basename } = require("path");
const path = require("path");
const { Umzug } = require("umzug");

let umzug = new Umzug({
  logging: function () {
    console.log.apply(null, arguments);
  },
  migrations: { glob: "./database/migrations/*.js" },
  upName: 'up'
});

function logUmzugEvent(eventName) {
  return function (name, migration) {
    console.log("inside logumzugevent");
    console.log(`${name} ${eventName}`);
  };
}

// using event listeners to log events
umzug.on("migrating", logUmzugEvent("migrating"));
umzug.on("migrated", logUmzugEvent("migrated"));
umzug.on("reverting", logUmzugEvent("reverting"));
umzug.on("reverted", logUmzugEvent("reverted"));

// this will run your migrations
umzug.up().then(console.log("all migrations done."));
