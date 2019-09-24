# EWI

Easy markdown-based wiki written in Go language and React with the usage of TOAST UI Editor for the great markdown WYSIWIG editing

## Build and run on localhost

```bash
docker build -t ewi .
docker run  --memory="500m" --restart=always --name ewi -v ewi-repo:/var/lib/ewi-server/repo -d -p 8088:80 -p 8888:8888 ewi -build=`git rev-parse HEAD` 
```

## Run on localhost without build

```bash
docker run  --memory="500m" --restart=always --name ewi -v ewi-repo:/var/lib/ewi-server/repo -d -p 8088:80 -p 8888:8888 derbylock/ewi:latest -build=`git rev-parse HEAD`
```

## Build and run for a specific hostname

```bash
docker build --build-arg EWI_SERVER_PATH="http://hostname:8888/" -t ewi .
docker run  --memory="500m" --restart=always --name ewi -v ewi-repo:/var/lib/ewi-server/repo -d -p 8088:80 -p 8888:8888 ewi -build=`git rev-parse HEAD` 
```

## Usage

Open in browser http://localhost:8088/
