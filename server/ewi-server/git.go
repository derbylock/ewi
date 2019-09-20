package main

import (
	"errors"
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

// ErrUserNotSpecified User not specified error
var ErrUserNotSpecified = errors.New("User not specified")

// ErrPasswordNotSpecified Password not specified error
var ErrPasswordNotSpecified = errors.New("Password not specified")

// ErrNameNotSpecified Name not specified error
var ErrNameNotSpecified = errors.New("Name not specified")

// ErrEmailNotSpecified Email not specified error
var ErrEmailNotSpecified = errors.New("Email not specified")

// ErrCommentNotSpecified Comment not specified error
var ErrCommentNotSpecified = errors.New("Comment not specified")

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
	err := gitCommitNoLock(w, r, ps)
	if err != nil && (errors.Is(err, ErrUserNotSpecified) ||
		errors.Is(err, ErrPasswordNotSpecified) ||
		errors.Is(err, ErrNameNotSpecified) ||
		errors.Is(err, ErrEmailNotSpecified) ||
		errors.Is(err, ErrCommentNotSpecified)) {
		w.WriteHeader(400)
		return
	}

	if err != nil {
		sendInternalError(w, err)
		return
	}
	w.WriteHeader(204)
}

func gitCommitNoLock(w http.ResponseWriter, r *http.Request, ps httprouter.Params) error {
	gitRepo, err := git.PlainOpen(*repoPath)
	if err != nil {
		return err
	}
	workTree, err := gitRepo.Worktree()
	if err != nil {
		return err
	}
	_, err = workTree.Add(".")
	if err != nil {
		return err
	}

	name, ok := r.URL.Query()["name"]
	if !ok {
		return ErrNameNotSpecified
	}
	email, ok := r.URL.Query()["email"]
	if !ok {
		return ErrEmailNotSpecified
	}
	comment, ok := r.URL.Query()["comment"]
	if !ok {
		return ErrCommentNotSpecified
	}
	_, err = workTree.Commit(comment[0], &git.CommitOptions{
		Author: &object.Signature{
			Name:  name[0],
			Email: email[0],
			When:  time.Now(),
		},
	})
	if err != nil {
		return err
	}
	return nil
}

func gitPush(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	repoMutex.Lock()
	defer repoMutex.Unlock()
	err := gitPushNoLock(w, r, ps)
	if err != nil && (errors.Is(err, ErrUserNotSpecified) ||
		errors.Is(err, ErrPasswordNotSpecified) ||
		errors.Is(err, ErrNameNotSpecified) ||
		errors.Is(err, ErrEmailNotSpecified) ||
		errors.Is(err, ErrCommentNotSpecified)) {
		w.WriteHeader(400)
		return
	}

	if err != nil {
		sendInternalError(w, err)
		return
	}
	w.WriteHeader(204)
}

func gitPushNoLock(w http.ResponseWriter, r *http.Request, ps httprouter.Params) error {
	username, ok := r.URL.Query()["user"]
	if !ok {
		return ErrUserNotSpecified
	}
	password, ok := r.URL.Query()["pass"]
	if !ok {
		return ErrPasswordNotSpecified
	}
	gitRepo, err := git.PlainOpen(*repoPath)
	if err != nil {
		return err
	}
	err = gitRepo.Push(&git.PushOptions{Auth: &githttp.BasicAuth{
		Username: username[0],
		Password: password[0],
	}})
	if err != nil && err.Error() != "already up-to-date" {
		return err
	}
	return nil
}

func gitPull(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	repoMutex.Lock()
	defer repoMutex.Unlock()
	err := gitPullNoLock(w, r, ps)
	if err != nil && (errors.Is(err, ErrUserNotSpecified) ||
		errors.Is(err, ErrPasswordNotSpecified) ||
		errors.Is(err, ErrNameNotSpecified) ||
		errors.Is(err, ErrEmailNotSpecified) ||
		errors.Is(err, ErrCommentNotSpecified)) {
		w.WriteHeader(400)
		return
	}

	if err != nil {
		sendInternalError(w, err)
		return
	}
	w.WriteHeader(204)
}

func gitPullNoLock(w http.ResponseWriter, r *http.Request, ps httprouter.Params) error {
	username, ok := r.URL.Query()["user"]
	if !ok {
		gitRepo, err := git.PlainOpen(*repoPath)
		if err != nil {
			return err
		}
		workTree, err := gitRepo.Worktree()
		if err != nil {
			return err
		}
		err = workTree.Pull(&git.PullOptions{RemoteName: "origin", Force: true})
		if err != nil && err.Error() != "already up-to-date" {
			return err
		}
		return nil
	}
	password, ok := r.URL.Query()["pass"]
	if !ok {
		return ErrPasswordNotSpecified
	}
	gitRepo, err := git.PlainOpen(*repoPath)
	if err != nil {
		return err
	}
	workTree, err := gitRepo.Worktree()
	if err != nil {
		return err
	}
	err = workTree.Pull(&git.PullOptions{RemoteName: "origin", Force: true, Auth: &githttp.BasicAuth{
		Username: username[0],
		Password: password[0],
	}})
	if err != nil && err.Error() != "already up-to-date" {
		return err
	}
	w.WriteHeader(204)
	return nil
}
