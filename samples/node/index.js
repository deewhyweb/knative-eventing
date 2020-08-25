const express = require('express');
const app = express();
const {
  CloudEvent,
  HTTPReceiver
} = require("cloudevents-sdk");

// Create a receiver to accept events over HTTP
const receiver = new HTTPReceiver();
app.use((req, res, next) => {
  let data = "";

  //req.setEncoding("utf8");
  req.on("data", function(chunk) {
      data += chunk;
  });
  req.on("end", function() {
      req.body = data;
      next();
  });
});
app.post('/', (req, res) => {
  
  try {
    // delete req.headers['ce-time']
    let myevent = receiver.accept(req.headers,req.body);
    console.log(myevent);
    res.status(201).send("Event Accepted");

  } catch(err) {
    // TODO deal with errors
    console.error(err);
    res.status(415)
          .header("Content-Type", "application/json")
          .send(JSON.stringify(err));
  }
});
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('App Version 1.0 listening on: ', port);
});