import React, { Component } from 'react';
import './App.css';

import { FormGroup, InputGroup} from "@blueprintjs/core";
import { withRouter, Link } from "react-router-dom";

import {
  Button,
  Classes,
  Intent,
  Tooltip
} from "@blueprintjs/core";
import store from "store"

class EwiSettings extends Component {

  constructor() {
    super();
    var s = store.get("ewi-settings")
    s= s || {};
    this.state = {repoUrl: "", showPassword: false, disabled: false, login: s.login, pass: s.pass, author: s.author, email: s.email}
    this.changedSettings = this.changedSettings.bind(this);
    this.handleLockClick = this.handleLockClick.bind(this);
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  repoURLLogin = React.createRef();
  repoURLPass = React.createRef();
  repoAuthor = React.createRef();
  repoEmail = React.createRef();
  
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

  handleLockClick(){
     this.setState({ showPassword: !this.state.showPassword });
  }

  changedSettings() {
    if (this.repoURLLogin && this.repoURLPass && this.repoAuthor && this.repoEmail) {
      var s = {
        login: this.repoURLLogin.current.value,
        pass: this.repoURLPass.current.value,
        author: this.repoAuthor.current.value,
        email: this.repoEmail.current.value
      }
      store.set("ewi-settings", s);
      this.setState({login: s.login, pass: s.pass, author: s.author, email: s.email})
    }
  }

  render() {
    return (
    <div class="LoginDiv">
    <h5>Commit settings for editing:</h5>
    <FormGroup
      helperText="Repository login"
      label="Login"
      labelFor="text-input"
      labelInfo="(required)"
    >
      <InputGroup leftIcon="user" id="loginInput" placeholder="admin" value={this.state.login} inputRef={this.repoURLLogin} onChange={this.changedSettings} />
    </FormGroup>
    <FormGroup
      helperText="Repository password"
      label="Password"
      labelFor="text-input"
      labelInfo="(required)"
    >
      <InputGroup id="passwordInput" placeholder="*****" inputRef={this.repoURLPass} value={this.state.pass} rightElement={this.lockButton()} onChange={this.changedSettings} type={this.state.showPassword ? "text" : "password"} />
    </FormGroup>
    <FormGroup
      helperText="Author"
      label="Author"
      labelFor="text-input"
      labelInfo="(required)"
    >
      <InputGroup leftIcon="person" id="passwordAuthor" placeholder="Gordon Freeman" value={this.state.author} inputRef={this.repoAuthor} onChange={this.changedSettings} />
    </FormGroup>
    <FormGroup
      helperText="Email"
      label="Email"
      labelFor="text-input"
      labelInfo="(required)"
    >
      <InputGroup leftIcon="link" id="passwordEmail" placeholder="someemail@somedomain" value={this.state.email} inputRef={this.repoEmail} onChange={this.changedSettings} />
    </FormGroup>
    <Link to="/"><Button className={Classes.MINIMAL} icon="home" text="Home" style={{float: "right"}} /></Link>
  </div>
    );
  }

}

export default withRouter(EwiSettings);