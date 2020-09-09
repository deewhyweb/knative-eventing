const { CloudEvent, Emitter } = require("cloudevents");
const emitter = new Emitter({
  url: process.env.K_SINK, // we get the url for the emitter from the K_SINK environment variable which is injected by the knative container source
});
const cron = require("node-cron");

const emitEvent = () => {
  console.log("About to emit event");
  const event = new CloudEvent({
    type: "dev.knative.container.event",
    source:
      "/apis/v1/namespaces/knative-test/cronjobsources/eventinghello-container-source",
    data: {
      name: "Hans Zarkov",
    },
  });
  emitter
    .send(event)
    .then((response) => {
      // handle the response
      console.log("Response:", response);
    })
    .catch(console.error);
};

cron.schedule("*/2 * * * *", () => {
  emitEvent();
});
