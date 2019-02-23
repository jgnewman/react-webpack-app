import "./styles/styles.scss"
import React, { Component } from "react"
import ReactDOM from "react-dom"

class MyApp extends Component {
  render() {
    return (
      <div className="my-react-app">
        <h1>My app is running!</h1>
      </div>
    )
  }
}

ReactDOM.render(<MyApp />, document.querySelector("#app"))
