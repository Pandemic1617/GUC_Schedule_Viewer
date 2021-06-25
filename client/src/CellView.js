// import logo from './logo.svg';
import './CellView.css';
import React from 'react';
import SessionView from './SessionView';

class CellView extends React.Component {

  constructor(props) {

    super(props);
    this.state = { ini: props.ini };
  }



  render() {
    return (
      <div className="CellView">
        {/* <table id="cell"> */}
        <div id="cell">

          {this.state.ini.map((e, i) => {
            return (<div> <SessionView data={e} /></div>) // make subcomponent for each session
          }
          )
          }

          {/* </table> */}
        </div>
      </div>
    );
  }
}

export default CellView;
