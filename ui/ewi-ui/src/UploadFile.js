import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

import htmlParser from 'react-markdown/plugins/html-parser';
import ReactMarkdown from 'react-markdown';
import { withRouter } from "react-router-dom";
import { Redirect } from 'react-router-dom'
import { Link } from 'react-router-dom'

import  * as FileUploader from "react-file-uploader"

import toc from 'remark-toc'

import './github.css';

import MarkdownGithub from 'react-markdown-github'

import store from "store"

import {
  Alignment,
  Button,
  Classes,
  H5,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
  Switch,
  Spinner,
} from "@blueprintjs/core";

import 'codemirror/lib/codemirror.css';
import 'tui-editor/dist/tui-editor.min.css';
import 'tui-editor/dist/tui-editor-contents.min.css';
import { Editor } from '@toast-ui/react-editor'
import ReactDOM from 'react-dom';

class UploadFile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isPanelOpen: false,
      isDragOver: false,
      files: [],
    };

    this.uploadPanel = undefined;
    this.openPanel = this.openPanel.bind(this);
    this.closePanel = this.closePanel.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onFileDrop = this.onFileDrop.bind(this);
    this.onFileProgress = this.onFileProgress.bind(this);
    this.onFileUpdate = this.onFileUpdate.bind(this);
    this.setUploadPanelRef = this.setUploadPanelRef.bind(this);
  }

  openPanel() {
    this.setState({ isPanelOpen: true });
  }

  closePanel() {
    this.setState({ isPanelOpen: false });
  }

  onDragOver(e) {
    // your codes here:
    // if you want to check if the files are dragged over
    // a specific DOM node
    const node = ReactDOM.findDOMNode(this.uploadPanel);

    if (this.state.isDragOver !== (e.target === node)) {
      this.setState({
        isDragOver: e.target === node,
      });
    }
  }

  onFileDrop({ target }, files) {
    const node = ReactDOM.findDOMNode(this.uploadPanel);

    if (target !== node) {
      this.closePanel();
      return false;
    }
    // alert(files);

    const uploads = files.map((item = {}) => {
      if (item.data.size > 100 * 1000 * 1000) {
        return Object.assign({}, item, {
          status: FileUploader.status.FAILED,
          error: 'file size exceeded maximum',
        });
      }

      return item;
    });

    this.setState({
      files: this.state.files.concat(uploads),
    });

    // if you want to close the panel upon file drop
    this.closePanel();
  }

  onFileProgress(fileId, fileData) {
    const { files = [] } = this.state,
      newFiles = files.map(item => item.id === fileId ? Object.assign({}, item, fileData) : item);

    this.setState({
      files: newFiles,
    });
  }

  onFileUpdate(fileId, fileData) {
    const { files = [] } = this.state,
      newFiles = files.map(item => item.id === fileId ? Object.assign({}, item, fileData) : item);

    this.setState({
      files: newFiles,
    });
  }

  setUploadPanelRef(ref) {
    this.uploadPanel = ref;
  }

  getStatusString(status) {
    switch (status) {
      case -2:
        return 'aborted';

      case -1:
        return 'failed';

      case 0:
        return 'pending';

      case 1:
        return 'uploading';

      case 2:
        return 'uploaded';

      default:
        return '';
    }
  }

  render() {
    var s = store.get("ewi-settings")
    s= s || {};

    s= s || {};
    if (! (s.author && s.email && s.login && s.pass) ){
        return <Redirect to='/ewi-settings' />
    }    

    return (
      <div class="UploadDiv">
        <h1>{ this.props.title }</h1>
        <p>You can upload files with size with 1 MB at maximum</p>
        <FileUploader.Receiver
          ref={this.setUploadPanelRef}
          customClass="upload-panel"
          isOpen={this.state.isPanelOpen}
          onDragEnter={this.openPanel}
          onDragOver={this.onDragOver}
          onDragLeave={this.closePanel}
          onFileDrop={this.onFileDrop}
          style={{width: "200px", height: "200px", backgroundcolor: "red"}}
        >
          <p style={{verticalAlign: "middle", alignContent: "center"}}>
            {
              !this.state.isDragOver ? 'Drop here' : 'Files detected'
            }
          </p>
        </FileUploader.Receiver>
        <div>
          <p>Upload List</p>
          <FileUploader.UploadManager
            customClass="upload-list"
            files={this.state.files}
            uploadUrl={process.env.REACT_APP_EWI_SERVER_PATH + "repo/files" + (s.author && "?pcp=true&name="+encodeURIComponent(s.author)+"&email="+encodeURIComponent(s.email)+"&comment="+ encodeURIComponent("Updated docs") + "&user="+encodeURIComponent(s.login)+"&pass=" + encodeURIComponent(s.pass) || "")}
            onUploadAbort={this.onFileUpdate}
            onUploadStart={this.onFileUpdate}
            onUploadProgress={this.onFileProgress}
            onUploadEnd={this.onFileUpdate}
          >
            {
              this.state.files.map((file, index) => (
                <FileUploader.UploadHandler key={index} file={file} autoStart={index % 2 === 0}>
                  {
                    ({ upload, abort }) => (
                      <dl>
                        <dt>{file.data.name}</dt>
                        <dd>
                          <span className="file__id">{file.id} </span>
                          <span className="file__type">{file.data.type} </span>
                          <span className="file__size">{file.data.size / 1000 / 1000} MB</span>
                          <span className="file__progress">{file.progress}%</span>
                          <span className="file__status">
                            {this.getStatusString(file.status)}
                          </span>
                          <span className="file__error">{file.error}</span>
                          {
                            ((index % 2 === 1 && file.status === 0) || file.status === -2) && (
                              <button onClick={upload}>Upload</button>
                            )
                          }
                          {
                            file.status === 1 && (
                              <button onClick={abort}>Abort</button>
                            )
                          }
                        </dd>
                      </dl>
                    )
                  }
                </FileUploader.UploadHandler>
              ))
            }
          </FileUploader.UploadManager>
          <Link to="/"><Button className={Classes.MINIMAL} icon="home" text="Home" style={{float: "right"}} /></Link>
        </div>
      </div>
    );
  }
}

export default withRouter(UploadFile);