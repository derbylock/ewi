package main

import (
	"crypto/sha256"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gabriel-vasile/mimetype"
	"github.com/julienschmidt/httprouter"
)

const maxUploadSizeRepo = 1024 * 1024 * 1024 // 1024 MB
var repoPath *string
var staticPath *string

func uploadFile(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	filename := ps.ByName("filename")
	filelocation := filepath.Join(*repoPath, filename)

	// validate file size
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSizeRepo)

	// parse and validate file and post parameters
	defer r.Body.Close()

	fmt.Printf("File: %s\n", filelocation)

	// write file
	newFile, err := os.Create(filelocation)
	if err != nil {
		log.Println(err)
		renderError(w, "CANT_WRITE_FILE_1", http.StatusInternalServerError)
		return
	}
	defer newFile.Close() // idempotent, okay to call twice
	if _, err := io.Copy(newFile, r.Body); err != nil || newFile.Close() != nil {
		log.Println(err)
		if err2 := os.Remove(filelocation); err2 != nil && !os.IsNotExist(err2) {
			log.Println("Can' remove file after failed upload " + filelocation + err2.Error())
		}
		renderError(w, "CANT_WRITE_FILE_2", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(204)
}

func removeFile(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	filename := ps.ByName("filename")
	filelocation := filepath.Join(*repoPath, filename)
	// remove file from disk
	if err := os.Remove(filelocation); err != nil && !os.IsNotExist(err) {
		sendInternalError(w, err)
		return
	}

	w.WriteHeader(204)
}

func downloadFile(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	filename := ps.ByName("filename")
	filelocation := filepath.Join(*repoPath, filename)
	etag, err := calculateEtag(filelocation)
	if err != nil {
		sendInternalError(w, err)
		return
	}

	if r.Header.Get("If-None-Match") == etag {
		w.WriteHeader(304)
		return
	}

	w.Header().Set("ETag", etag)

	// Get the content
	contentType, _, err := mimetype.DetectFile(filelocation)
	if err != nil {
		sendInternalError(w, err)
		return
	}
	w.Header().Set("Content-type", contentType)
	log.Println(filelocation + ":" + contentType)
	http.ServeFile(w, r, filelocation)
}

func serveStatic(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	filename := ps.ByName("static")
	filelocation := filepath.Join(*staticPath, filename)
	etag, err := calculateEtag(filelocation)
	if err != nil {
		sendInternalError(w, err)
		return
	}

	if r.Header.Get("If-None-Match") == etag {
		w.WriteHeader(304)
		return
	}

	w.Header().Set("ETag", etag)

	// Get the content
	contentType, _, err := mimetype.DetectFile(filelocation)
	// getFileContentType(filelocation)
	if err != nil {
		sendInternalError(w, err)
		return
	}
	w.Header().Set("Content-type", contentType)
	log.Println(contentType)
	http.ServeFile(w, r, filelocation)
}

func calculateEtag(filename string) (string, error) {
	f, err := os.Open(filename)
	if err != nil {
		return "", err
	}
	defer f.Close()

	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}

	return fmt.Sprintf("%x", h.Sum(nil)), nil
}

func getFileContentType(filename string) (string, error) {
	out, err := os.Open(filename)
	if err != nil {
		return "", err
	}
	defer out.Close()

	// Only the first 512 bytes are used to sniff the content type.
	buffer := make([]byte, 512)

	_, err = out.Read(buffer)
	if err != nil {
		return "", err
	}

	// Use the net/http package's handy DectectContentType function. Always returns a valid
	// content-type by returning "application/octet-stream" if no others seemed to match.
	contentType := http.DetectContentType(buffer)

	return contentType, nil
}
