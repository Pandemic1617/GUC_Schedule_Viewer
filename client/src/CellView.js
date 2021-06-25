// import logo from './logo.svg';
// import './App.css';
import React from 'react';

class CellView extends React.Component {

  constructor(props) {

    super(props);
    this.state = { ini: props.ini };
  }



  render() {
    return (
      <div className="CellView">
        <table id="cell">
           
          {this.state.ini.map((e, i) => {
            return (e.course_code) // make subcomponent for each session
          }
          )
          }

        </table>
      </div>
    );
  }
}

export default CellView;
