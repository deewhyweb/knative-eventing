const app = require('express')();
const {Receiver} = require("cloudevents");

app.post('/', (req, res) => {
  console.log('Received body');
  console.log(req.body);
  try {
    // delete req.headers['ce-time']

    let myevent = Receiver.accept(req.headers, req.body);
    console.log(myevent.toString());
    console.log('CloudEvent Object received. \n');
    console.log('Version: ', myevent.specversion, ' \n');
    console.log('Type: ', myevent.type, ' \n');
    console.log('Data: ', myevent.data, ' \n');
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