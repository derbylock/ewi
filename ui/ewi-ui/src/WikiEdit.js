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
} from "@blueprintjs/core";

import 'codemirror/lib/codemirror.css';
import 'tui-editor/dist/tui-editor.min.css';
import 'tui-editor/dist/tui-editor-contents.min.css';
import { Editor } from '@toast-ui/react-editor'


class WikiEdit extends Component {
    editorRef = React.createRef();
    constructor(props) {
        super()
        this.state = {path: props.path};
    }

    componentDidMount() {
        axios
        .get(process.env.REACT_APP_EWI_SERVER_PATH + "repo/files" + this.state.path)
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
            this.setState({data: mdData});
        })
        .catch(error => {console.log(error); this.setState({data: " "});});
    }

    componentWillUnmount() {
    }

    render() {
        const parseHtml = htmlParser({
            isValidNode: node => node.type !== 'script',
            processingInstructions: []
          });

        return (<div style={{width: "70%", position: "relative", marginLeft: "auto", marginRight: "auto"}} >
            {this.state.data && true &&
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
        }
            <Navbar>
              <NavbarGroup align={Alignment.RIGHT}>
                <Button className={Classes.MINIMAL} icon="tick" text="Save" onClick={() => {
                    var markdown = this.editorRef.current.getInstance().getMarkdown();
                    const imageExtensions = [".jpg", ".png", ".bmp", ".tiff", ".svg"]
                    imageExtensions.forEach(imageExtension => {
                        markdown = markdown.replace("]("+process.env.REACT_APP_EWI_SERVER_PATH + "repo/files/", "](");
                    });
                    console.info(markdown);
                    axios
                    .put(process.env.REACT_APP_EWI_SERVER_PATH + "repo/files" + this.state.path, markdown)
                    .then(r => {
                        this.setState({redirect: true});
                        this.props.history.push(this.state.path);
                    })
                    .catch(error => {console.log(error); alert(error);});
                }} />
              </NavbarGroup>
            </Navbar>
                {this.state.redirect && <Redirect to={this.state.path} />}
        </div>)
    }
}

export default withRouter(WikiEdit);