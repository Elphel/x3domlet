# x3dom + leaflet

You can either run the demo:
- On a web server with PHP support
- Using the "Standalone installation" instructions below (could taint your system)
- Using the "Docker image" instructions below (without tainting your system)

## 1. Standalone installation
### 1.1. Install dependencies

You need php-cgi installed.

Change to the x3domlet directory
```
cd x3domlet
```

If you don't have nodejs installed you may install it as a standard user through nvm with the following command:
```
docker/install-nodejs.sh
```

When nodejs is installed you can run:
```
npm install && bower install
```

### 1.2. Copy the test data
You need to copy the data to be displayed in directories models/ and kml/

### 1.3. Run the test server and open a browser window
File modifications will trigger the page reload
```
gulp
```

## 2. Docker image

The docker image allow you to run the demo in a virtual container
without tainting your system.

The current user should be allowed to run docker. Otherwise use 'sudo'.

### 2.1. Build the docker image
- Change to the ./docker directory.
- Run "make" to build the docker image.

### 2.2. Test
From the directory containing the "/models" and "/kml" folders you want to use, run:
```
x3domlet/docker/run.sh
```
It will start the x3domlet docker image and open a browser window.
On exit the script should stop and (WARNING) will remove the container and associated volumes.

