# Knative Eventing

Knative consists of two components: Serving and Eventing. 

With Serving you have dynamic autoscaling based on HTTP traffic load, including scaling down to zero pods. 
Eventing introduces the ability to scale up Knative services from sources other than HTTP. For example, messages arriving in an Apache Kafka topic can cause autoscaling of your Knative service to handle those messages. 

There are two terms we will use when we discuss Knative Eventing:

* Sinks
* Eventing Sources

Sinks:  A sink is an event receiving service.  So once we have a Knative service deployed we can use this as a sink.

Eventing sources: Knative eventing sources are responsible for connecting to and retrieving events from a system.  

For the purposes of this enablement we will demonstrate the following event sources:
	
* Ping source - The PingSource fires events based on a given Cron schedule.
* Container source - The ContainerSource will instantiate container image(s) that can generate events.  The ContainerSource will inject environment variables $K_SINK and $K_CE_OVERRIDES into the pod.  The application running in the container will use the $K_SINK environment variable as the destination to send the cloud event.
* API server source - fires a new event each time a Kubernetes resource is created, updated or deleted.
* SinkBinding - SinkBinding is similar to container source, they can both achieve the same end result, a container running and emitting events to a destination defined by $K_SINK.  The difference is SinkBinding is based on the object creating the pod, e.g. deployment, cronJob, statefulSet etc. any kubernetes object which defines a PodTemplateSpec
* Kafka - allows you to emit events from a particular Kafka topic
* TODO - Camel-K - allows to generate events from any of the 300+ components provided by Apache camel


## Usage patterns

There are 3 usage patterns for Knative Eventing:

* Source to Sink
* Channels and subscriptions
* Brokers and triggers

### Source to Sink

Source to Sink is the simplest way to get started with Knative eventing.  There is no queuing of channels, and the sink is a single Knative service.

### Channels and Subscriptions

With Channels and Subscriptions, channels provide the ability to support multiple sinks (knative services) and persistence of messages e.g. to kafka.  

### Brokers and triggers

Brokers and Triggers add filtering of events to channels.  Subscribers register an interest in a particular type of message (based on attributes of the cloudEvent object.  A trigger is applied to the broker to filter out these events and forward to the registered subscribers.

# Step by step demonstration

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

## Build and deploy simple knative service

This service is a simple node.js app using 

Build node.js app image

`oc new-build nodejs:12~https://github.com/deewhyweb/knative-eventing.git --context-dir=/samples/knative-service`

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

## Create simple cron source knative eventing example

`oc apply -f ./deploy/eventinghello-source.yaml`

Every two minutes the cron source will create an event which will invoke the knative service.  You can monitor this by running 

`oc get pods -w`

When then event-display-nodejs-xxxx pod is created, montitor the logs with:

`oc logs -f -c user-container -n knative-test  $(oc get pods -o name -n knative-test | grep event-display)` 

Do remove the cron source eventing example, run:

`oc delete -f ./deploy/eventinghello-source.yaml`

## Container Source example

oc new-build nodejs:12~https://github.com/deewhyweb/knative-eventing.git --context-dir=/samples/container-source --to="container-source" --name="container-source"

oc apply -f ./deploy/eventing-container-source.yaml

oc get sources

## Sink Binding example

oc apply -f ./deploy/eventing-sinkBinding.yaml

oc get sources
NAME                READY     REASON    SINK                                                         AGE
test-sink-binding   True                http://event-display-nodejs.knative-test.svc.cluster.local   7s

oc apply -f ./deploy/test-sinkBinding-deployment.yaml

## Kafka Event source example

Create a kafka namespace

`oc new-project kafka`

Deploy kafka

`oc apply -f ./deploy/kafka.yaml`

Wait until the kafka cluster is ready, you should see something like:

```
my-cluster-entity-operator-59db855bfd-gnsfq   3/3       Running   0          36s
my-cluster-kafka-0                            2/2       Running   0          70s
my-cluster-kafka-1                            2/2       Running   0          70s
my-cluster-kafka-2                            2/2       Running   0          70s
my-cluster-zookeeper-0                        1/1       Running   0          102s
my-cluster-zookeeper-1                        1/1       Running   0          102s
my-cluster-zookeeper-2                        1/1       Running   0          102s
```

Deploy the Kafka knative eventing component

`oc apply -f ./deploy/knativeEventingKafka.yaml`

Create a kafka topic

`oc apply -f ./deploy/kafka-topic.yaml`

`oc  -n kafka exec my-cluster-kafka-0 -c kafka -i -t -- bin/kafka-topics.sh --bootstrap-server localhost:9092 --list`

Deploy the kafka event source

`oc apply -f ./deploy/event-source-kafka.yaml`

Test creating some messages in the my-topic topic

`oc  -n kafka exec my-cluster-kafka-0 -c kafka -i -t -- bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic my-topic` 

Enter some json e.g.

`{"msg":"hi"}`

<!-- # Camel-k Event source example

install the camel event source

`oc apply -f ./deploy/camel.yaml`

Deploy the camel time source

`oc applt -f ./deploy/source_timer.yaml` -->

## API server source example

Create a service account in knative-test namespace with permissions to get, list, and watch api events.

`oc apply -f ./deploy/apiserversource-sa.yaml`

Deploy the apiserversource knative source

`oc apply -f ./deploy/apiserversource.yaml`

Create some kubernetes events

`oc -n knative-test run busybox --image=busybox --restart=Never -- ls`

`oc -n knative-test delete pod busybox`

Monitor the event display logs

`oc logs -f -c user-container -n knative-test  $(oc get pods -o name -n knative-test | grep event-display)`

Expect to see something like:

```
CloudEvent Object received. 

Version:  1.0  

Type:  dev.knative.apiserver.resource.add  

Data:  {
  apiVersion: 'v1',
  count: 1,
  eventTime: null,
  firstTimestamp: '2020-08-26T15:07:40Z',
  involvedObject: {
    apiVersion: 'v1',
    fieldPath: 'spec.containers{busybox}',
    kind: 'Pod',
    name: 'busybox',
    namespace: 'knative-test',
    resourceVersion: '2200402',
    uid: '0ec22f40-310b-4443-abb6-907d39e99bd6'
  },
  kind: 'Event',
  lastTimestamp: '2020-08-26T15:07:40Z',
  message: 'Started container busybox',
  metadata: {
    creationTimestamp: '2020-08-26T15:07:40Z',
    name: 'busybox.162ed9dcc744020d',
    namespace: 'knative-test',
    resourceVersion: '2200427',
    selfLink: '/api/v1/namespaces/knative-test/events/busybox.162ed9dcc744020d',
    uid: '553e232e-a317-4fed-91fa-ab32deb2fc9c'
  },
  reason: 'Started',
  reportingComponent: '',
  reportingInstance: '',
  source: { component: 'kubelet', host: 'ip-10-0-141-82.ec2.internal' },
  type: 'Normal'
}  
```