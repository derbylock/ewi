import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import SwitchR from 'react-router-dom/Switch';
import BrowserRouter from 'react-router-dom/BrowserRouter';
import Route from 'react-router-dom/Route';
import { Redirect } from 'react-router-dom'
import { withRouter } from "react-router-dom";

import {
  Alignment,
  Button,
  Classes,
  H5,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
  Switch
} from "@blueprintjs/core";
import WikiPage from './WikiPage';
import WikiEdit from './WikiEdit';

class MainView extends Component {
    constructor(props) {
        super()
    }

    render() {
        var path = this.props.location.pathname;
        if (path == "/") {
            path = "/home.md";
        }
        return (
            <div>
            <Navbar>
            <NavbarGroup align={Alignment.LEFT}>
              <NavbarHeading>{path}</NavbarHeading>
            </NavbarGroup>
            <NavbarGroup align={Alignment.RIGHT}>
              <NavbarHeading><span style={{color: "green"}}>E</span>asy<span style={{color: "green"}}>WI</span>ki</NavbarHeading>
              <NavbarDivider />
              <a href="/"><Button className={Classes.MINIMAL} icon="home" text="Home" /></a>
              <a href={"/edit" + path}><Button className={Classes.MINIMAL} icon="edit" text="Edit" /></a>
            </NavbarGroup>
          </Navbar>
          <table width="100%" class="mainparts" >
              <tr class="mainparts">
                  <td class="mainparts-left" width="20%" style={{verticalAlign: "top"}}>
            <WikiPage path="/ewi-leftrail.md"/>
            </td>
            <td class="mainparts-right" width="80%">
            <WikiPage path={path}/>
            </td>
            </tr>
          </table>
          </div>
        );
    }

}

export default withRouter(MainView);