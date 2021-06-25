
import './App.css';
import React from 'react';
import axios from 'axios';

import Schedule from './Schedule';

class App extends React.Component {

  constructor(props) {

    super(props);
    this.state = {
      sched: [],
      id: '',
      alert: {
        type: '',
        text: '',
        show: false
      }
    };

  }
  // stuff = () => { let a = this.state.counter; a.push(1); this.setState({ counter: a }); }
  stuff = () => { this.state.counter.push(1); }

  getSchedule = async () => {
    console.debug("making request", this.state.id);
    let a;
    try {
      a = await axios.get("https://europe-west1-gucschedule.cloudfunctions.net/get_student_schedule",
        { params: { id: this.state.id } });


    } catch (e) {
      this.onShowAlert('error while making request');

      return;
    }

    if (a.data.status !== 'ok') {
      this.onShowAlert('Fatal Error while getting data', a.data.error);

      return;
    }


    if (a.data.error) {
      this.onShowAlert('Error but i gotcha', a.data.error);
    }

    this.setState({ sched: a.data.data });
    console.log("sched set");
    console.debug(a.data.data);
  }


  updateID = (a) => {
    console.debug('updateid called');
    this.setState({ id: a.target.value });
  }


  setAlert = (a) => { this.setState({ alert: a }) }

  onCloseAlert = () => {
    this.setAlert({
      type: '',
      text: '',
      show: false
    })
  }

  onShowAlert = (type, info = '') => {
    this.setAlert({
      type: type,
      text: info,
      show: true
    })
  }


  render() {
    return (
      <div className="App">
        <input type="text" onChange={this.updateID} ></input>
        <button onClick={this.getSchedule}> b</button>
        <Schedule schedule={this.state.sched} key={this.state.sched} />
        <div style={{ display: this.state.alert.show ? "" : "none" }}>
          {this.state.alert.text}
          {this.state.alert.type}
          <button onClick={this.onCloseAlert}> close</button>
        </div>
      </div>
    );
  }
}

export default App;
