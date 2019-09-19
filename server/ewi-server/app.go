package main

import (
	_ "expvar"
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/http/pprof"
	"runtime"
	"strconv"
	"time"

	"github.com/NYTimes/gziphandler"
	"github.com/julienschmidt/httprouter"
)

var buildID []byte
var httpPort *int
var buildNumber *string

var emptyState map[string]interface{}

var gitRepoURI *string
var gitRepoUsername *string
var gitRepoPassword *string

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}

func setupResponse(w *http.ResponseWriter, req *http.Request) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}

type corsRouter struct {
	router *httprouter.Router
}

func (cr *corsRouter) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	log.Println("Method ", ((*req).Method))
	if (*req).Method == "OPTIONS" {
		setupResponse(&w, req)
		w.WriteHeader(http.StatusOK)
		return
	}
	enableCors(&w)
	cr.router.ServeHTTP(w, req)
}

func runServer() {
	log.Println("Starting HTTP server")

	router := httprouter.New()
	router.GET("/health", getHealth)

	router.PUT("/repo/files/*filename", uploadFile)
	router.DELETE("/repo/files/*filename", removeFile)
	router.GET("/repo/files/*filename", downloadFile)

	router.GET("/git/exists", gitExists)
	router.POST("/git/clone", gitClone)
	router.POST("/git/commit", gitCommit)
	router.POST("/git/push", gitPush)
	router.POST("/git/pull", gitPull)

	router.HandlerFunc(http.MethodGet, "/debug/pprof/", pprof.Index)
	router.HandlerFunc(http.MethodGet, "/debug/pprof/cmdline", pprof.Cmdline)
	router.HandlerFunc(http.MethodGet, "/debug/pprof/profile", pprof.Profile)
	router.HandlerFunc(http.MethodGet, "/debug/pprof/symbol", pprof.Symbol)
	router.HandlerFunc(http.MethodGet, "/debug/pprof/trace", pprof.Trace)
	router.Handler(http.MethodGet, "/debug/pprof/goroutine", pprof.Handler("goroutine"))
	router.Handler(http.MethodGet, "/debug/pprof/heap", pprof.Handler("heap"))
	router.Handler(http.MethodGet, "/debug/pprof/threadcreate", pprof.Handler("threadcreate"))
	router.Handler(http.MethodGet, "/debug/pprof/block", pprof.Handler("block"))

	log.Printf("Listening on port %d \r\n", *httpPort)
	handler := corsRouter{router: router}
	hgz := gziphandler.GzipHandler(&handler)
	s := &http.Server{
		Addr:           ":" + strconv.Itoa(*httpPort),
		Handler:        hgz,
		ReadTimeout:    300 * time.Second,
		WriteTimeout:   300 * time.Second,
		IdleTimeout:    300 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}
	s.SetKeepAlivesEnabled(true)
	log.Fatal(s.ListenAndServe())
}

func bToMb(b uint64) uint64 {
	return b / 1024 / 1024
}

// PrintMemUsage outputs the current, total and OS memory being used. As well as the number
// of garage collection cycles completed.
func PrintMemUsage() {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	// For info on each, see: https://golang.org/pkg/runtime/#MemStats
	fmt.Printf("Alloc = %v MiB", bToMb(m.Alloc))
	fmt.Printf("\tTotalAlloc = %v MiB", bToMb(m.TotalAlloc))
	fmt.Printf("\tSys = %v MiB", bToMb(m.Sys))
	fmt.Printf("\tNumGC = %v\n", m.NumGC)
}

func main() {
	PrintMemUsage()
	emptyState = make(map[string]interface{})
	httpPort = flag.Int("port", 8888, "server's HTTP port")
	strBuildID := string(buildID)
	buildNumber = flag.String("build", strBuildID, "build number for the health endpoint")
	gitRepoURI = flag.String("gitRepoURI", "https://github.com/derbylock/ewi.git", "Git repository URI")
	gitRepoUsername = flag.String("gitRepoUsername", "", "Git repository user")
	gitRepoPassword = flag.String("gitRepoPassword", "", "Git repository password")
	repoPath = flag.String("repoPath", "/var/lib/ewi-server/repo", "The path of the repository")
	staticPath = flag.String("staticPath", "/var/lib/ewi-server/static", "the path of the static content (for UI served by Go app)")
	flag.Parse()
	runServer()
}
