package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/julienschmidt/httprouter"
	git "gopkg.in/src-d/go-git.v4"
	"gopkg.in/src-d/go-git.v4/plumbing/object"
	githttp "gopkg.in/src-d/go-git.v4/plumbing/transport/http"
)

func gitExists(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	repoMutex.Lock()
	defer repoMutex.Unlock()
	gitFolderLocation := filepath.Join(*repoPath, ".git")
	if _, err := os.Stat(gitFolderLocation); os.IsNotExist(err) {
		w.WriteHeader(404)
	}
	w.WriteHeader(204)
}

func gitClone(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	repoMutex.Lock()
	defer repoMutex.Unlock()
	url, ok := r.URL.Query()["url"]
	if !ok {
		log.Println("Unknown url")
		w.WriteHeader(400)
		return
	}
	username, ok := r.URL.Query()["user"]
	if !ok {
		_, err := git.PlainClone(*repoPath, false, &git.CloneOptions{
			URL:      url[0],
			Progress: os.Stdout,
		})
		if err != nil {
			sendInternalError(w, err)
			return
		}
		w.WriteHeader(204)
		return
	}
	password, ok := r.URL.Query()["pass"]
	if !ok {
		log.Println("Unknown pass")
		w.WriteHeader(400)
		return
	}
	_, err := git.PlainClone(*repoPath, false, &git.CloneOptions{
		Auth: &githttp.BasicAuth{
			Username: username[0],
			Password: password[0],
		},
		URL:      url[0],
		Progress: os.Stdout,
	})
	if err != nil {
		sendInternalError(w, err)
		return
	}
	w.WriteHeader(204)
}

func gitCommit(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	repoMutex.Lock()
	defer repoMutex.Unlock()
	gitRepo, err := git.PlainOpen(*repoPath)
	if err != nil {
		sendInternalError(w, err)
		return
	}
	workTree, err := gitRepo.Worktree()
	if err != nil {
		sendInternalError(w, err)
		return
	}
	_, err = workTree.Add(".")
	if err != nil {
		sendInternalError(w, err)
		return
	}

	name, ok := r.URL.Query()["name"]
	if !ok {
		w.WriteHeader(400)
		return
	}
	email, ok := r.URL.Query()["email"]
	if !ok {
		w.WriteHeader(400)
		return
	}
	comment, ok := r.URL.Query()["comment"]
	if !ok {
		w.WriteHeader(400)
		return
	}
	_, err = workTree.Commit(comment[0], &git.CommitOptions{
		Author: &object.Signature{
			Name:  name[0],
			Email: email[0],
			When:  time.Now(),
		},
	})
	if err != nil {
		sendInternalError(w, err)
		return
	}
	w.WriteHeader(204)
}

func gitPush(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	repoMutex.Lock()
	defer repoMutex.Unlock()
	username, ok := r.URL.Query()["user"]
	if !ok {
		w.WriteHeader(400)
		return
	}
	password, ok := r.URL.Query()["pass"]
	if !ok {
		w.WriteHeader(400)
		return
	}
	gitRepo, err := git.PlainOpen(*repoPath)
	if err != nil {
		sendInternalError(w, err)
		return
	}
	err = gitRepo.Push(&git.PushOptions{Auth: &githttp.BasicAuth{
		Username: username[0],
		Password: password[0],
	}})
	if err != nil {
		sendInternalError(w, err)
		return
	}
	w.WriteHeader(204)
}

func gitPull(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	repoMutex.Lock()
	defer repoMutex.Unlock()
	username, ok := r.URL.Query()["user"]
	if !ok {
		w.WriteHeader(400)
		return
	}
	password, ok := r.URL.Query()["pass"]
	if !ok {
		w.WriteHeader(400)
		return
	}
	gitRepo, err := git.PlainOpen(*repoPath)
	if err != nil {
		sendInternalError(w, err)
		return
	}
	workTree, err := gitRepo.Worktree()
	if err != nil {
		sendInternalError(w, err)
		return
	}
	err = workTree.Pull(&git.PullOptions{RemoteName: "origin", Force: true, Auth: &githttp.BasicAuth{
		Username: username[0],
		Password: password[0],
	}})
	if err != nil {
		sendInternalError(w, err)
		return
	}
	w.WriteHeader(204)
}
