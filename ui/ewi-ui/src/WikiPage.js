import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

import htmlParser from 'react-markdown/plugins/html-parser';
import ReactMarkdown from 'react-markdown';
import { withRouter, Link } from 'react-router-dom'

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

function RouterLink(props) {
    return (
      props.href.match(/^(https?:)?\/\//)
        ? <a href={props.href}>{props.children}</a>
        : <Link to={props.href}>{props.children}</Link>
    );
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
                mdData = mdData.replace(/\[([^\]]*)\]\(([^\)]+)\)/g, (all, text, link) => {
                    return "[" + text + "](" + link.replace(/\s/, "-") + ")";
                });
                const imageExtensions = [".jpg", ".png", ".bmp", ".tiff", ".svg", ".gif"]
                imageExtensions.forEach(imageExtension => {
                    mdData = mdData.replace(new RegExp("!\\[([^\\]]*)\\]\\(([^\\)]+)" + imageExtension + "\\)", "g"), (all, text, link) => {
                        return "![" + text + "](" + process.env.REACT_APP_EWI_SERVER_PATH + "repo/files/" + link.replace(/\s/, "-") + imageExtension + ")";
                    });
                });

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
        const parseHtml = htmlParser({
            isValidNode: node => node.type !== 'script',
            processingInstructions: []
        });

        return (
            <div style={{ width: "100%", position: "relative", marginLeft: "auto", marginRight: "auto" }} >
                <ReactMarkdown
                    className="wikipage"
                    source={this.state.data}
                    escapeHtml={false}
                    astPlugins={[parseHtml]}
                    transformLinkUri={(uri) => { return uri + ".md"; }}
                    plugins={[toc]}
                    renderers={{link: RouterLink}}
                />
            </div>)
    }
}

export default withRouter(WikiPage);