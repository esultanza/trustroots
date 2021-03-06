FROM node:4.2

# Install prerequisites
# https://docs.docker.com/engine/articles/dockerfile_best-practices/#apt-get
# Base image should also have these already installed: gcc, git, make, python
# - `build-essential` and `make` are required by some Node modules
# - `unzip` & `wget` are required by API docs generator
RUN apt-get -qq update && apt-get -q install -y \
    build-essential \
    unzip \
    wget \
    graphicsmagick \
    imagemagick \
    openssl \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install Dump-init
# https://github.com/Yelp/dumb-init
RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.0.0/dumb-init_1.0.0_amd64.deb
RUN dpkg -i dumb-init_*.deb

# Install global node modules
RUN npm install -g -y gulp --quiet
RUN npm install -g -y bower --quiet
RUN npm install -g -y faker --quiet
RUN npm install -g -y migrate --quiet

# Create working directory
RUN mkdir -p /trustroots
RUN mkdir -p /trustroots/public/lib
WORKDIR /trustroots

# Copies the local package.json file to the container
# and utilities docker container cache to not needing to rebuild
# and install node_modules/ everytime we build the docker, but only
# when the local package.json file changes.
# Install npm packages
ADD package.json /trustroots/package.json
RUN npm install --quiet

# Install bower packages
ADD bower.json /trustroots/bower.json
ADD .bowerrc /trustroots/.bowerrc
RUN bower install --quiet --config.interactive=false --allow-root

# Set environment variables
ENV NODE_ENV development
ENV DB_1_PORT_27017_TCP_ADDR mongodb
ENV PORT 3000
ENV DOMAIN trustroots.dev

# Share local directory on the docker container
# ...therefore the previous docker "layer" thats been cached will be used if possible
ADD . /trustroots

# Expose ports
# - Nginx proxy     80
# - Nodemon server  3000
# - Node debug      5858
# - LiveReload      35729
EXPOSE 80
EXPOSE 3000
EXPOSE 5858
EXPOSE 35729
CMD ["dumb-init", "npm", "start"]
