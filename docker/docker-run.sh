#!/bin/bash
docker run -i \
	-v $(pwd)/models:/home/elphel/x3domlet/models \
	-v $(pwd)/kml:/home/elphel/x3domlet/kml \
	-p 8080:8080 \
	-p 35729:35729 \
	x3domlet \
	gulp connect &

sleep 5
xdg-open http://localhost:8080/index.html

