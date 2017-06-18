FROM debian:jessie-slim
RUN apt-get update \
 && apt-get install -y \
      git \
      wget \
      php5-cgi \
			vim
RUN useradd --create-home --shell /bin/bash elphel
COPY install-nodejs.sh /tmp
USER elphel
RUN /tmp/install-nodejs.sh
WORKDIR /home/elphel
RUN cd /home/elphel \
 && git clone --single-branch -b gulp https://git.elphel.com/Elphel/x3domlet \
 && export NVM_DIR="/home/elphel/.nvm" \          
 && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" \
 && npm install -g bower gulpjs/gulp-cli \
 && cd x3domlet \
 && npm install \
 && bower install \
 && gulp build
WORKDIR /home/elphel/x3domlet
COPY docker-entrypoint.sh /home/elphel/
ENTRYPOINT ["/home/elphel/docker-entrypoint.sh"]
