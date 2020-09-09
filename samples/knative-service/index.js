const app = require('express')();
const {Receiver} = require("cloudevents");
const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.post('/', (req, res) => {
  try {
    let myevent = Receiver.accept(req.headers, req.body);
    console.log('CloudEvent Object received. \n');
    console.log('Version: ', myevent.specversion, ' \n');
    console.log('Type: ', myevent.type, ' \n');
    console.log('Data: ', myevent.data, ' \n');
    res.status(201).send("Event Accepted");

  } catch(err) {
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