const express = require("express");
const app = express();
const { CloudEvent, Emitter, Protocol, Version } = require("cloudevents");
const emitter = new Emitter({
  url: process.env.K_SINK,
});

// app.get("/", (req, res) => {
  console.log('About to emit event');
  const event = new CloudEvent({
    type: "dev.knative.container.event",
    source:
      "/apis/v1/namespaces/knative-test/cronjobsources/eventinghello-container-source",
    data: {
      msg: "helloworld",
    },
  });

  emitter
    .send(event)
    .then((response) => {
      // handle the response
      console.log("Response:", response);
    })
    .catch(console.error);
  // res.status(201).send("Event Emitted");
// });
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("App Version 1.0 listening on: ", port);
});
