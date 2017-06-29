#!/bin/bash

# start the container in the background
CONTAINER=$(docker run -i \
	-d \
	-v $(pwd)/models:/home/elphel/x3domlet/models \
	-v $(pwd)/kml:/home/elphel/x3domlet/kml \
	-p 8080:8080 \
	-p 35729:35729 \
	x3domlet \
	gulp connect) || exit

echo $CONTAINER

# temporize
sleep 5

# open in browser
xdg-open http://127.0.0.1:8080/index.html

# display container startup log
docker logs --since 0 $CONTAINER &

# attach to container
docker attach $CONTAINER

# on exit remove the container and its associated volumes
docker rm -f -v $CONTAINER
