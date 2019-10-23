import React, { Component } from 'react';
import './App.css';
import axios from 'axios';

import { withRouter } from "react-router-dom";
import { Redirect } from 'react-router-dom'


import './github.css';

import 'tui-editor/dist/tui-editor-extChart';
import 'tui-editor/dist/tui-editor-extTable';
import 'tui-editor/dist/tui-editor-extUML';
import 'tui-editor/dist/tui-editor-extColorSyntax';
import 'tui-editor/dist/tui-editor-extScrollSync';

import store from "store"

import plantumlEncoder from 'plantuml-encoder'

import {
  Alignment,
  Button,
  Classes,
  Navbar,
  NavbarGroup,
  Spinner,
} from "@blueprintjs/core";

import 'codemirror/lib/codemirror.css';
import 'tui-editor/dist/tui-editor.min.css';
import 'tui-editor/dist/tui-editor-contents.min.css';
import { Editor } from '@toast-ui/react-editor'


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
            .then(() => {

                axios
                .get(process.env.REACT_APP_EWI_SERVER_PATH + "repo/files" + path, {headers: {'Cache-Control': 'no-cache'}})
                .then(response => {
                    var mdData = response.data;
                    mdData = mdData.replace(/\[([^\]]*)\]\(([^\)]+)\)/g, (all, text, link) => {
                        return "[" + text + "](" + link.replace(/\s/, "-") + ")";
                    });
                    const imageExtensions = [".jpg", ".png", ".bmp", ".tiff", ".svg", ".gif"]
                    imageExtensions.forEach(imageExtension => {
                        mdData = mdData.replace(new RegExp("!\\[([^\\]]*)\\]\\(([^\\)]+)" +imageExtension +"\\)", "g"), (all, text, link) => {
                            return "![" + text + "]("+process.env.REACT_APP_EWI_SERVER_PATH + "repo/files/" + link.replace(/\s/, "-") + imageExtension + ")";
                        });
                    });
                    console.info(mdData);                    
                    mdData = mdData.replace(/!\[uml diagramm\]\(http:\/\/www.plantuml.com\/plantuml\/img\/([^\\)]+)?\)/gm, (all, code) => {
                        return "``` uml\n" + plantumlEncoder.decode(code) + "\n```";
                    });                    
                    this.setState({data: mdData, initialData: mdData, path: path});
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
        var settings = store.get("ewi-settings")
        settings= settings || {};
        if (! (settings.author && settings.email && settings.login && settings.pass) ){
            return <Redirect to='/ewi-settings' />
        }

        return (<div style={{width: "70%", position: "relative", marginLeft: "auto", marginRight: "auto"}} >
            {this.state.data && true &&
            <div>
        <Editor
            initialValue={this.state.initialData}
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
              /* 'scrollSync', */
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
                    imageExtensions.forEach(() => {
                        markdown = markdown.replace("]("+process.env.REACT_APP_EWI_SERVER_PATH + "repo/files/", "](");
                    });
                    markdown = markdown.replace(/\\,/g, ","); // fixing tui-editor bug

                    markdown = markdown.replace(/\`\`\`\s*uml(\s+)((.|\r|\n)+?)\`\`\`/gm, (all, text, code) => {
                        return "![uml diagramm](http://www.plantuml.com/plantuml/img/" + plantumlEncoder.encode(code) + ")";
                    });
    
                    console.info(markdown);
                    var s = store.get("ewi-settings")
                    s= s || {};

                    this.setState({spinner: true});
                    axios
                    .put(process.env.REACT_APP_EWI_SERVER_PATH + "repo/files" + this.state.path + (s.author && "?pcp=true&name="+encodeURIComponent(s.author)+"&email="+encodeURIComponent(s.email)+"&comment="+ encodeURIComponent("Updated docs") + "&user="+encodeURIComponent(s.login)+"&pass=" + encodeURIComponent(s.pass) || ""), markdown)
                    .then(() => {
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