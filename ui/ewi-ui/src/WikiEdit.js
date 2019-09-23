import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

import htmlParser from 'react-markdown/plugins/html-parser';
import ReactMarkdown from 'react-markdown';
import { withRouter } from "react-router-dom";
import { Redirect } from 'react-router-dom'

import toc from 'remark-toc'

import './github.css';

import MarkdownGithub from 'react-markdown-github'
import 'tui-editor/dist/tui-editor-extChart';
import 'tui-editor/dist/tui-editor-extTable';
import 'tui-editor/dist/tui-editor-extUML';
import 'tui-editor/dist/tui-editor-extColorSyntax';
import 'tui-editor/dist/tui-editor-extScrollSync';

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
import { Editor, Viewer } from '@toast-ui/react-editor'


class WikiEdit extends Component {
    editorRef = React.createRef();
    constructor(props) {
        super()
        this.state = {path: props.path, spinner: false};
    }

    componentDidMount() {
        this.updatePage();
    }

    updatePage() {
        const path = this.props.path;
        this.setState({data: null, path: path});
        var settings = store.get("ewi-settings")
        settings= settings || {};
        if (settings.author && settings.email && settings.login && settings.pass){
            axios
            .post(process.env.REACT_APP_EWI_SERVER_PATH + "git/pull" + "?user=" + encodeURIComponent(settings.login) + "&pass=" + encodeURIComponent(settings.pass), null)
            .then(response => {

                axios
                .get(process.env.REACT_APP_EWI_SERVER_PATH + "repo/files" + path, {headers: {'Cache-Control': 'no-cache'}})
                .then(response => {
                    var mdData = response.data;
                    console.info(mdData);
                    mdData = mdData.replace(/\[([^\]]*)\]\(([^\)]+)\)/g, (all, text, link) => {
                        return "[" + text + "](" + link.replace(/\s/, "-") + ")";
                    });
                    const imageExtensions = [".jpg", ".png", ".bmp", ".tiff", ".svg", ".gif"]
                    imageExtensions.forEach(imageExtension => {
                        mdData = mdData.replace(new RegExp("!\\[([^\\]]*)\\]\\(([^\\)]+)" +imageExtension +"\\)", "g"), (all, text, link) => {
                            return "![" + text + "]("+process.env.REACT_APP_EWI_SERVER_PATH + "repo/files/" + link.replace(/\s/, "-") + imageExtension + ")";
                        });
                    });
                    this.setState({data: mdData, path: path});
                })
                .catch(error => {console.log(error); this.setState({data: " ", path: path});});
            })
            .catch(error => {console.log(error); alert(error); this.setState({data: " ", path: path});});
        }
    }

    componentWillUnmount() {
    }

    render() {
        if (this.state.path != this.props.path) {
            this.updatePage();
        }
        const parseHtml = htmlParser({
            isValidNode: node => node.type !== 'script',
            processingInstructions: []
          });
        var settings = store.get("ewi-settings")
        settings= settings || {};
        if (! (settings.author && settings.email && settings.login && settings.pass) ){
            return <Redirect to='/ewi-settings' />
        }

        return (<div style={{width: "70%", position: "relative", marginLeft: "auto", marginRight: "auto"}} >
            {this.state.data && true &&
            <div>
        <Editor
            data={this.state.data}
            initialValue={this.state.data}
            initialEditType="wysiwyg"
            useCommandShortcut={true}
            height="800px"
            previewStyle="tab"
            exts={[
              {
                name: 'chart',
                minWidth: 100,
                maxWidth: 600,
                minHeight: 100,
                maxHeight: 300
              },
              /*'scrollSync',*/
              'colorSyntax',
              'uml',
              'mark',
              'table'
            ]}
            ref={this.editorRef}/>
            <Navbar>
              <NavbarGroup align={Alignment.RIGHT}>
                  {!this.state.spinner &&
                <Button className={Classes.MINIMAL} icon="tick" text="Save" onClick={() => {
                    var markdown = this.editorRef.current.getInstance().getMarkdown();
                    const imageExtensions = [".jpg", ".png", ".bmp", ".tiff", ".svg"]
                    imageExtensions.forEach(imageExtension => {
                        markdown = markdown.replace("]("+process.env.REACT_APP_EWI_SERVER_PATH + "repo/files/", "](");
                    });
                    console.info(markdown);
                    var s = store.get("ewi-settings")
                    s= s || {};

                    this.setState({spinner: true});
                    axios
                    .put(process.env.REACT_APP_EWI_SERVER_PATH + "repo/files" + this.state.path + (s.author && "?pcp=true&name="+encodeURIComponent(s.author)+"&email="+encodeURIComponent(s.email)+"&comment="+ encodeURIComponent("Updated docs") + "&user="+encodeURIComponent(s.login)+"&pass=" + encodeURIComponent(s.pass) || ""), markdown)
                    .then(r => {
                        this.setState({redirect: true, spinner: false});
                        this.props.history.push(this.state.path);
                    })
                    .catch(error => {console.log(error); alert(error); this.setState({spinner: false});});
                }} />
                || <Spinner size={Spinner.SIZE_SMALL}/>
            }
              </NavbarGroup>
            </Navbar>
            </div>
        || <Spinner size={Spinner.SIZE_LARGE}/>}
        {this.state.redirect && <Redirect to={this.state.path} />}
        </div>)
    }
}

export default withRouter(WikiEdit);