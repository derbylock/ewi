import React, { Component } from 'react';
import './App.css';
import axios from 'axios';

import SwitchR from 'react-router-dom/Switch';
import Route from 'react-router-dom/Route';
import { withRouter, Redirect } from 'react-router-dom'
import { FormGroup, InputGroup} from "@blueprintjs/core";

import {
  Alignment,
  Button,
  Classes,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
  Intent,
  Tooltip
} from "@blueprintjs/core";
import WikiEdit from './WikiEdit';
import EwiSettings from './EwiSettings';
import MainView from './MainView';
import UploadFile from './UploadFile';

class App extends Component {

  constructor() {
    super();
    this.state = {initialized: false, repoCloned: false, repoUrl: "", showPassword: false, disabled: false}
    this.handleLockClick = this.handleLockClick.bind(this);
  }

  componentDidMount() {
    axios
    .get(process.env.REACT_APP_EWI_SERVER_PATH + "git/exists", {headers: {'Cache-Control': 'no-cache'}})
    .then(response => {
        const repoCloned = response.status == 204;
        this.setState({initialized: true, repoCloned: repoCloned});
    })
    .catch(error => {
      const repoCloned = error.response.status == 204;
      this.setState({initialized: true, repoCloned: repoCloned});
    });
  }

  componentWillUnmount() {
  }


  lockButton() {
    return (
    <Tooltip content={`${this.state.showPassword ? "Hide" : "Show"} Password`} disabled={this.state.disabled}>
        <Button
            disabled={this.state.disabled}
            icon={this.state.showPassword ? "unlock" : "lock"}
            intent={Intent.WARNING}
            minimal={true}
            onClick={this.handleLockClick}
        />
    </Tooltip>)
  };

  handleLockClick = () => this.setState({ showPassword: !this.state.showPassword });

  repoURLRef = React.createRef();
  repoURLLogin = React.createRef();
  repoURLPass = React.createRef();

  render() {
    var url = this.props.location;
    if (url == "/") {
      url = "/home.md"
    }
    return (<div>
      {this.state.initialized && !this.state.repoCloned &&
          (
            <div class="LoginDiv">
              <h5>Enter git wiki repository URL:</h5>
            <FormGroup
              helperText="Repository url (http[s] supported), e.g. https://..."
              label="Repository"
              labelFor="text-input"
              labelInfo="(required)"
            >
              <InputGroup leftIcon="git-repo" id="repoInput" placeholder="https://..." inputRef={this.repoURLRef} />
            </FormGroup>
            <FormGroup
              helperText="Repository login if required for cloning"
              label="Login"
              labelFor="text-input"
              labelInfo="(optional)"
            >
              <InputGroup leftIcon="user" id="loginInput" placeholder="" inputRef={this.repoURLLogin} />
            </FormGroup>
            <FormGroup
              helperText="Repository password if required for cloning"
              label="Password"
              labelFor="text-input"
              labelInfo="(optional)"
            >
              <InputGroup id="passwordInput" placeholder="*****" inputRef={this.repoURLPass} rightElement={this.lockButton()} type={this.state.showPassword ? "text" : "password"} />
            </FormGroup>
            <Button className={Classes.MINIMAL} style={{float: "right"}} icon="git-repo" text="Clone" onClick={() => {
                  axios
                  .post(process.env.REACT_APP_EWI_SERVER_PATH + "git/clone?url="+this.repoURLRef.current.value
                    + (this.repoURLLogin.current.value && ("&user="+encodeURIComponent(this.repoURLLogin.current.value)+"&pass="+encodeURIComponent(this.repoURLPass.current.value)) || "")
                  )
                  .then(response => {
                      const repoCloned = response.status == 204;
                      this.setState({initialized: true, repoCloned: repoCloned});
                  })
                  .catch(error => {
                    const repoCloned = error.response.status == 204;
                    this.setState({initialized: true, repoCloned: repoCloned});
                  });
            }
            } />
            </div>
          )
          || this.state.initialized &&
          <SwitchR>
            <Route exact path='/ewi-settings'>
              <EwiSettings />
            </Route>
            <Route exact path='/ewi-uploadfile'>
              <UploadFile />
            </Route>            
            <Route exact path='/'>
              <Redirect to='/home.md' />
            </Route>
            <Route path='/edit/'>
              <Navbar>
                <NavbarGroup align={Alignment.LEFT}>
                  <a href="/ewi-settings"><Button className={Classes.MINIMAL} icon="settings" tooltip="Settings" /></a>
                  <NavbarHeading><h6>{url.pathname}</h6></NavbarHeading>
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
          || null
      }
      </div>
    );
  }

}

export default withRouter(App);
