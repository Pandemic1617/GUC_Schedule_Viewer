
import './App.css';
import React from 'react';
import axios from 'axios';

import Schedule from './Schedule';

class App extends React.Component {

  constructor(props) {

    super(props);
    this.state = { sched: [], id: '' };
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
      this.showError('error while making request');

      return;
    }

    if (a.data.status !== 'ok') {
      this.showError('Fatal Error while getting data', a.data.error);

      return;
    }


    if (a.data.error) {
      this.showError('Error but i gotcha', a.data.error);
    }

    this.setState({ sched: a.data.data });
    console.log("sched set");
    console.debug(a.data.data);
  }

  showError(a, b) {
    alert(a);
    alert(b);
  }

  updateID = (a) => {
    console.debug('updateid called');
    this.setState({ id: a.target.value });
  }

  render() {
    return (
      <div className="App">
        <h1>hi from app</h1>
        <input type="text" onChange={this.updateID} ></input>
        <button onClick={this.getSchedule}> b</button>
        <Schedule schedule={this.state.sched} key={this.state.sched} />

        {/* {this.state.counter.map((e) => { return (<h1> tag</h1>) })}
          <button onClick={this.stuff}> a</button>
          <button onClick={this.rend}> b</button> */}
      </div>
    );
  }
}

export default App;
