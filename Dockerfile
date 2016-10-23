FROM ubuntu:trusty

RUN 	apt-get update && \
 		apt-get install -y openjdk-7-jdk && \
		apt-get install -y wget && \
		apt-get install -y python-setuptools && \
      apt-get install -y ssh

RUN 	easy_install supervisor

# Download and unzip hadoop
#
RUN wget http://apache.mirrors.tds.net/hadoop/common/hadoop-2.7.1/hadoop-2.7.1.tar.gz -P ~/Downloads
RUN tar zxvf ~/Downloads/hadoop-* -C /usr/local
RUN mv /usr/local/hadoop-* /usr/local/hadoop

# Set the required environment variables
#
ENV JAVA_HOME /usr
ENV HADOOP_HOME /usr/local/hadoop
ENV PATH $PATH:$JAVA_HOME/bin:$HADOOP_HOME/bin
ENV HADOOP_CONF_DIR /usr/local/hadoop/etc/hadoop

# Create the directory where hdfs will be rooted
#
RUN 	mkdir -p $HADOOP_HOME/hadoop_data/hdfs/datanode

# Create the working directory
#
RUN   mkdir -p /instanthadoop /var/run/sshd
WORKDIR /instanthadoop

#hdfs namenode -format

# Copy all the config files
#
COPY hadoop_configs/core-site.xml $HADOOP_CONF_DIR/core-site.xml
COPY hadoop_configs/yarn-site.xml $HADOOP_CONF_DIR/yarn-site.xml
COPY hadoop_configs/mapred-site.xml $HADOOP_CONF_DIR/mapred-site.xml
COPY hadoop_configs/hdfs-site.xml $HADOOP_CONF_DIR/hdfs-site.xml
COPY hadoop_configs/masters $HADOOP_CONF_DIR/masters
COPY hadoop_configs/slaves $HADOOP_CONF_DIR/slaves

COPY supervisord.conf /instanthadoop/supervisord.conf

EXPOSE 22
CMD ["supervisord", "-c", "/instanthadoop/supervisord.conf"]
