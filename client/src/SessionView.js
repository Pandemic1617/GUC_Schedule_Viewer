// import logo from './logo.svg';
import './SessionView.css';
import React from 'react';

class SessionView extends React.Component {

  constructor(props) {

    super(props);
    this.state = { data: props.data };
  }



  render() {
    return (
      <div className="SessionView">

        <div className={"sessioncontainer " + this.state.data.type}>
          <div id="location"> {this.state.data.location}</div>
          <div id="course"> {this.state.data.course_code}</div>
          <div id="group"> {this.state.data.tut_group}</div>
          <div id="staff"> {this.state.data.staff}</div>
        </div>

      </div>
    );
  }

}
export default SessionView;
