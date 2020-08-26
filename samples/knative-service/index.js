const app = require('express')();
const {Receiver} = require("cloudevents");

app.post('/', (req, res) => {
  console.log('Received body');
  console.log(req.body);
  try {
    // delete req.headers['ce-time']

    let myevent = Receiver.accept(req.headers, req.body);
    console.log(myevent);
    console.log('CloudEvent Object received. \n');
    console.log('Version: ', myevent.spec.payload.specversion, ' \n');
    console.log('Type: ', myevent.spec.payload.type, ' \n');
    console.log('Data: ', myevent.spec.payload.data, ' \n');
    res.status(201).send("Event Accepted");

  } catch(err) {
    // TODO deal with errors
    console.error('Error', err);
    res.status(415)
          .header("Content-Type", "application/json")
          .send(JSON.stringify(err));
  }
});
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('App Version 1.0 listening on: ', port);
});