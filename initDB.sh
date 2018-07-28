#!/bin/bash

mkdir /tmp/test
mkdir /tmp/test2
mkdir /tmp/test3
mongod --dbpath=/tmp/test > /dev/null 2>&1 &
mongod --dbpath=/tmp/test2 --port=27018 > /dev/null 2>&1 &
mongod --dbpath=/tmp/test3 --port=27019 > /dev/null 2>&1 &

