FROM ubuntu

RUN apt-get update
RUN apt-get install openjdk-7-jdk

RUN wget http://apache.mirrors.tds.net/hadoop/common/hadoop-2.7.1/hadoop-2.7.1.tar.gz -P ~/Downloads
RUN tar zxvf ~/Downloads/hadoop-* -C /usr/local
RUN mv /usr/local/hadoop-* /usr/local/hadoop

RUN export JAVA_HOME=/usr
RUN export PATH=$PATH:$JAVA_HOME/bin
RUN export HADOOP_HOME=/usr/local/hadoop
RUN export PATH=$PATH:$HADOOP_HOME/bin
RUN export HADOOP_CONF_DIR=/usr/local/hadoop/etc/hadoop
