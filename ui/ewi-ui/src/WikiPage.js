import React, { Component } from 'react'
import './App.css'
import axios from 'axios'

import htmlParser from 'react-markdown/plugins/html-parser'
import ReactMarkdown from 'react-markdown'
import { withRouter, Link } from 'react-router-dom'
import HtmlToReact from 'html-to-react'
import toc from 'remark-toc'
import plantumlEncoder from 'plantuml-encoder'

import './github.css';

import 'tui-editor/dist/tui-editor-extChart'
import 'tui-editor/dist/tui-editor-extTable'
import 'tui-editor/dist/tui-editor-extUML'
import 'tui-editor/dist/tui-editor-extColorSyntax'
import 'tui-editor/dist/tui-editor-extScrollSync'

function RouterLink(props) {
    return (
      props.href.match(/^(https?:)?\/\//)
        ? <a href={props.href} target="_blank">{props.children}</a>
        : (props.href.startsWith("#")?<a href={props.href}>{props.children}</a>:<Link to={props.href}>{props.children}</Link>)
    );
  }

  function flatten(text, child) {
    return typeof child === 'string'
      ? text + child
      : React.Children.toArray(child.props.children).reduce(flatten, text)
  }
  
  function HeadingRenderer(props) {
    var children = React.Children.toArray(props.children)
    var text = children.reduce(flatten, '')
    var slug = text.toLowerCase().replace(/\W/g, '-')
    console.info(text);
    return React.createElement('h' + props.level, {id: slug}, props.children)
  }  

class WikiPage extends Component {
    constructor(props) {
        super()
        this.state = { path: props.path };
    }

    componentDidMount() {
        this.updatePage();
    }


    updatePage() {
        const path = this.props.path;
        this.setState({data: null, path: path});
        axios
            .get(process.env.REACT_APP_EWI_SERVER_PATH + "repo/files" + path, {headers: {'Cache-Control': 'no-cache'}})
            .then(response => {
                var mdData = response.data;
                console.info(mdData);
                mdData = mdData.replace(/\<br\s*\/?\>/g, "<br/>\n");
                mdData = mdData.replace(/\[([^\]]*)\]\(([^\)]+)\)/g, (all, text, link) => {
                    return "[" + text + "](" + link.replace(/\s/, "-") + ")";
                });
                const imageExtensions = [".jpg", ".png", ".bmp", ".tiff", ".svg", ".gif"]
                imageExtensions.forEach(imageExtension => {
                    mdData = mdData.replace(new RegExp("!\\[([^\\]]*)\\]\\(([^\\)]+)" + imageExtension + "\\)", "g"), (all, text, link) => {
                        return "![" + text + "](" + process.env.REACT_APP_EWI_SERVER_PATH + "repo/files/" + link.replace(/\s/, "-") + imageExtension + ")";
                    });
                });
                /*
                mdData = mdData.replace(/\`\`\`\s*uml(\s+)((.|\r|\n)+?)\`\`\`/gm, (all, text, code) => {
                    return "![uml diagramm](http://www.plantuml.com/plantuml/img/" + plantumlEncoder.encode(code) + ")";
                });
                */

                this.setState({ data: mdData, path: path });
            })
            .catch(error => { console.log(error); this.setState({ data: "# Page not created" }); });
    }

    componentWillUnmount() {
    }

    render() {
        if (this.state.path != this.props.path) {
            this.updatePage();
        }
        const processNodeDefinitions = new HtmlToReact.ProcessNodeDefinitions(React);
        const parseHtml = htmlParser({
            isValidNode: node => node.type !== 'script',
            processingInstructions: [
                {
                    // Anything else
                    shouldProcessNode: function (node) {
                      return true;
                    },
                    processNode: processNodeDefinitions.processDefaultNode
                }
            ]
        });

        return (
            <div style={{ width: "100%", position: "relative", marginLeft: "auto", marginRight: "auto" }} >
                {
                    /*
                <Viewer
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
                    'colorSyntax',
                    'uml',
                    'mark',
                    'table'
                    ]} />
                    */
                    }
                {
                <ReactMarkdown
                    className="wikipage"
                    source={this.state.data}
                    escapeHtml={false}
                    // astPlugins={[parseHtml]}
                    transformLinkUri={(uri) => { return uri + ((uri && uri.startsWith("http://") || uri && uri.startsWith("https://") || uri && uri.startsWith("#"))?"":".md"); }}
                    plugins={[toc]}
                    renderers={{link: RouterLink, heading: HeadingRenderer}}
                />
                }
            </div>)
    }
}

export default withRouter(WikiPage);