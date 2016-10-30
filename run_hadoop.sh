#!/bin/bash

/usr/local/hadoop/bin/hdfs namenode -format
$HADOOP_HOME/sbin/start-dfs.sh
/bin/sh -c "while true; do sleep 1; done"
