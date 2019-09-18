import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import SwitchR from 'react-router-dom/Switch';
import BrowserRouter from 'react-router-dom/BrowserRouter';
import Route from 'react-router-dom/Route';
import { Redirect } from 'react-router-dom'

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
import MainView from './MainView';

class App extends Component {

  constructor() {
    super();
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {
    var url = new URL(window.location.href);
    if (url == "/") {
      url = new URL(window.location.href+"home.md")
    }
    return (
      <div>
        <BrowserRouter>
        <SwitchR>
          <Route exact path='/'>
            <Redirect to='/home.md' />
          </Route>
          <Route path='/edit/'>
            <Navbar>
              <NavbarGroup align={Alignment.LEFT}>
                <NavbarHeading>{url.pathname}</NavbarHeading>
              </NavbarGroup>
              <NavbarGroup align={Alignment.RIGHT}>
                <NavbarHeading><span style={{color: "green"}}>E</span>asy<span style={{color: "green"}}>WI</span>ki</NavbarHeading>
                <NavbarDivider />
                <a href="/"><Button className={Classes.MINIMAL} icon="home" text="Home" /></a>
                <a href={url.pathname.substring(5)}><Button className={Classes.MINIMAL} icon="undo" text="Cancel" /></a>
              </NavbarGroup>
            </Navbar>
            <WikiEdit path={url.pathname.substring(5)}/>
          </Route>
          <Route path='/'>
            <MainView/>
          </Route>
        </SwitchR>
        </BrowserRouter>
      </div>
    );
  }

}

export default App;
