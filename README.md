## Install operators

Install Serverless Operator, strimzi operator and Knative Apache Kafka operator

`oc apply -f ./deploy/operators.yaml`

Deploy operator subscriptions

`oc apply -f ./deploy/operator-subscriptions.yaml`

## Install knative eventing and serving

Create knative-serving project

`oc new-project knative-serving`

Install knative-serving

`oc apply -f ./deploy/knative-serving.yaml`

Wait for the pods to be created:

```
activator-55785f7d8d-cdtss          1/1       Running   0          37s
activator-55785f7d8d-hvmg8          1/1       Running   0          52s
autoscaler-cd7dbf4cd-bftr8          1/1       Running   1          51s
autoscaler-hpa-85558f5fcd-hpndr     1/1       Running   0          41s
autoscaler-hpa-85558f5fcd-ktrpq     1/1       Running   0          41s
controller-d9d95cb5b-jphzb          1/1       Running   0          46s
controller-d9d95cb5b-nmhf4          1/1       Running   0          38s
kn-cli-downloads-66fb7cd989-g7qhd   1/1       Running   0          57s
webhook-7c466c66d5-tnpnt            1/1       Running   0          49s
```

Create knative-eventing project

`oc new-project knative-eventing`

Install  knative eventing

`oc apply -f ./deploy/knative-eventing.yaml`

Wait for pods to be created:

```
broker-controller-77c5f87cfc-45tml     1/1       Running   0          14s
eventing-controller-59f677db96-q542m   1/1       Running   0          23s
eventing-webhook-6ccdcd59d5-hmpvf      1/1       Running   0          23s
imc-controller-9dcc65bd-xrstj          1/1       Running   0          11s
imc-dispatcher-6bdddfc8bf-2fwfd        1/1       Running   0          11s
```

Create knative-test project

`oc new-project knative-test`

# Build and deploy simple knative service

Build node.js app image

`oc new-build nodejs:12~https://github.com/deewhyweb/knative-eventing.git --context-dir=/samples/node`

Watch the build logs:

`oc logs -f  -n knative-test  $(oc get pods -o name -n knative-test | grep build)`

Once the image is pushed successfully, and the build is complete we can delete the build pod:

`oc delete pod --field-selector=status.phase==Succeeded -n knative-test`

Deploy the Knative service

`oc apply -f ./deploy/event-display-nodejs.yaml`

Monitor the logs of the node.js Knative service:

`oc logs -f -c user-container -n knative-test  $(oc get pods -o name -n knative-test | grep event-display)` 

Test the Knative service

`curl -X POST $(oc get ksvc event-display-nodejs -o custom-columns=url:status.url --no-headers)  -w  "%{time_starttransfer}\n"`

# Create simple cron source knative eventing example

`oc apply -f ./deploy/eventinghello-source.yaml`

Every two minutes the cron source will create an event which will invoke the knative service.  You can monitor this by running 

`oc get pods -w`

When then event-display-nodejs-xxxx pod is created, montitor the logs with:

`oc logs -f -c user-container -n knative-test  $(oc get pods -o name -n knative-test | grep event-display)` 

Do remove the cron source eventing example, run:

`oc delete -f ./deploy/eventinghello-source.yaml`

# Container Source example

oc new-build nodejs:12~https://github.com/deewhyweb/knative-eventing.git --context-dir=/samples/container-source --to="container-source" --name="container-source"