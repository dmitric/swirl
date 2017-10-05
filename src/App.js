import React, { Component } from 'react';
import './App.css';
import Hammer from 'hammerjs'

import { SketchPicker } from 'react-color'
import reactCSS from 'reactcss'
import tinycolor from 'tinycolor2'

import {interpolateWarm, interpolateViridis, interpolateCubehelixDefault, interpolateRainbow, interpolatePlasma} from 'd3-scale'

import {interpolateSpectral, interpolateBlues, interpolatePiYG, interpolateRdGy, interpolateOranges} from 'd3-scale-chromatic'

class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      backgroundColor: '#F7F7F7',
      displayColorPickers: true,
      circles: 6,
      padding: 20,
      radiusScale: 0.72,
      width: 500,
      height: 500,
      paper: 0,
      underCircles: 1,
      running: false,
      colorFunctionIndex: 0,
      radiusShrink: 1.9,
      circleOffset: 1.5,
      rotation: 0,
      colorFunctions: [
        interpolateRdGy, interpolateRainbow, interpolatePlasma,
        interpolatePiYG, interpolateSpectral, interpolateBlues,
        interpolateWarm, interpolateCubehelixDefault, interpolateViridis,
        interpolateOranges
      ],
      currentOverride: null,
      overrides : { }
    }
  }

  currentColorFunction () {
    return this.state.colorFunctions[this.state.colorFunctionIndex]
  }

  generatePaper (opacity) {
    const rects = []
    
    if (opacity === 0) {
      return rects
    }

    console.log('start papering')

    const actualHeight = this.actualHeight()
    const actualWidth = this.actualWidth()

    for (let w=0; w < actualWidth -1 ; w += 2) {
      for (let h=0; h < actualHeight -1; h += 2) {
        let g = this.between(75, 95)
        rects.push(<rect key={`${w}-${h}`} x={w} y={h} height={2} width={2}
          fill={tinycolor({r: 255 * g/100, g: 255 * g/100, b: 255 * g/100 }).toHexString() }
          fillOpacity={opacity} />)
      }
    }

    for (let i = 0; i < 30; i++) {
      let g2 = this.between(40, 60)
      rects.push(<rect key={`${i}-dot`} width={this.between(1,2)} height={this.between(1,2)}
        x={this.between(0, actualWidth-2)}
        y={this.between(0, actualHeight-2)}
        fill={ tinycolor({r: 255 * g2/100, g: 255 * g2/100, b: 255 * g2/100 }).toHexString()}
        fillOpacity={this.between(opacity*250, opacity*300)/100} />)
    }

    console.log('finished papering')

    return rects
  }

  between (min, max) {
    return Math.random()*(max-min+1.) + min;
  }

  bound (value, min, max) {
    return Math.min(max, Math.max(min, value))
  }

  actualHeight () {
    return this.state.height-2*this.state.padding
  }

  actualWidth () {
    return this.state.width-2*this.state.padding
  }

  toggleRun() {
    this.setState({running: !this.state.running})
  }

  generateSwirl (circles, startingColorIndex) {
    const swirls = []

    const actualHeight = this.actualHeight()
    const actualWidth = this.actualWidth()

    let cx = actualWidth/2
    let cy = actualHeight/2


    let r = actualWidth/2

    for (let i = 0; i < circles; i ++) {
      swirls.push(
        <circle key={i} cx={cx} cy={cy} 
          r={r} fill={ this.currentColorFunction()((startingColorIndex + i)/(circles + startingColorIndex))} />
          )
      r /= this.state.radiusShrink
      cy += r/this.state.circleOffset
    }

    return swirls
  }

  render() {
    const actualHeight = this.actualHeight()
    const actualWidth = this.actualWidth()

    return (
      <div className="App">
        { this.state.displayColorPickers ? <div className="color-pickers">
          <ColorPicker color={tinycolor(this.state.backgroundColor).toRgb()} disableAlpha={true}
            handleChange={ (color) => this.setState({backgroundColor: color.hex}) } />
            { this.state.currentOverride ?
              <ColorPicker
                color={ this.state.overrides[this.state.currentOverride] || 'white'}
                displayColorPicker={true}
                disableAlpha={false}
                handleClose={ () => this.setState({currentOverride: null})}
                handleChange={ (color) => {
                  const clone = Object.assign({}, this.state.overrides)
                  clone[this.state.currentOverride] = color
                  this.setState({overrides: clone})
                } } /> : null}
            </div> : null
        }
        <div style={{ padding: this.state.padding }}> 
          <svg width={actualWidth} height={actualHeight} style={{ overflow: 'none' }}>
            <rect width={"100%"} height={"100%"} fill={this.currentColorFunction()(1)} />
            <g transform={`rotate(${this.state.rotation} ${actualWidth/2} ${actualHeight/2})`}>
              <g transform={`rotate(-8 ${0} ${actualHeight})`}>
                {this.generateSwirl(this.state.underCircles, 0)}
              </g>
              <g transform={`rotate(20 ${actualWidth} ${actualHeight})`}>
                {this.generateSwirl(this.state.circles, this.state.underCircles)}
              </g>
            </g>
            <circle
              cx={actualWidth/2} cy={actualHeight/2}
              r={actualWidth/(2*this.state.radiusScale)}
              fill="none" strokeWidth={actualWidth/2}
              stroke={this.state.backgroundColor} />
            <g>
              {this.generatePaper(this.state.paper)}
            </g>
          </svg>
        </div> 
      </div>
    );
  }

  componentWillMount () {
    this.updateDimensions()
  }

  tick () {
    if (this.state.running) {
      
    }
  }

  updateDimensions () {
    const w = window,
        d = document,
        documentElement = d.documentElement,
        body = d.getElementsByTagName('body')[0]
    
    const width = w.innerWidth || documentElement.clientWidth || body.clientWidth,
        height = w.innerHeight|| documentElement.clientHeight|| body.clientHeight

    const dim = Math.min(width, height)
    const settings = { width: dim , height: dim }

    if (settings.width >= 500) {
      settings.padding = 20
    } else {
      settings.padding = 0
    }

    this.setState(settings)
  }

  componentWillUnmount () {
    window.removeEventListener("resize", this.updateDimensions.bind(this), true)
    window.removeEventListener('keydown', this.handleKeydown.bind(this), true)
    window.clearInterval(this.interval)
  }

  componentDidMount () {
    window.addEventListener("resize", this.updateDimensions.bind(this), true)
    window.addEventListener('keydown', this.handleKeydown.bind(this), true)

    this.interval = window.setInterval(this.tick.bind(this), 400)

    const mc = new Hammer(document, { preventDefault: true })

    mc.get('swipe').set({ direction: Hammer.DIRECTION_ALL })
    mc.get('pinch').set({ enable: true })

    mc.on("swipedown", ev => this.addCircle())
      .on("swipeup", ev => this.removeCircle())
      .on("swipeleft", ev => this.incrementColorFunctionIndex())
      .on("swiperight", ev => this.decrementColorFunctionIndex())
      .on("pinchin", ev => { this.addCircle() } )
      .on("pinchout", ev => { this.removeCircle() })
  }

  handleKeydown (ev) {
    if (ev.which === 67 && !(ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault()
      this.setState({displayColorPickers: !this.state.displayColorPickers})
    } else if (ev.which === 83) {
      ev.preventDefault()
      if ((ev.metaKey || ev.ctrlKey)) {
        this.handleSave()
      } else {
        this.setState({rotation: this.state.rotation + 10})
      }
      
    } else if (ev.which === 82 && !(ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault()
      this.forceUpdate()
    } else if (ev.which === 80 && !(ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault()
      this.togglePaper()
    } else if (ev.which === 84) {
      ev.preventDefault()
      this.toggleRun()
    } else if (ev.which === 40) {
      ev.preventDefault()
      if (ev.metaKey || ev.ctrlKey){
        this.decrementCircleOffset()
      } else {
        this.removeCircle()
      }
    } else if (ev.which === 38) {
      ev.preventDefault()
      if (ev.metaKey || ev.ctrlKey) {
        this.incrementCircleOffset()
      } else {
        this.addCircle()
      }
      
    } else if (ev.which === 37) {
      ev.preventDefault()
      if (ev.metaKey || ev.ctrlKey){
        this.incrementRadiusShrink()
      }else{
        this.decrementColorFunctionIndex()
      }
      
    } else if (ev.which === 39) {
      ev.preventDefault()
      if (ev.metaKey || ev.ctrlKey) {
        this.decrementRadiusShrink()
      } else {
        this.incrementColorFunctionIndex()
      }
      
    }
  }

  incrementCircleOffset () {
    this.setState({
      circleOffset: Math.min(this.state.circleOffset + 0.1, 10)
    })
  }

  incrementRadiusShrink () {
    this.setState ({
      radiusShrink: Math.min(this.state.radiusShrink + 0.1, 5)
    })
  }

  decrementRadiusShrink () {
    this.setState ({
      radiusShrink: Math.max(this.state.radiusShrink - 0.1, 1)
    })
  }

  decrementCircleOffset () {
    this.setState({
      circleOffset: Math.max(1.15, this.state.circleOffset - 0.1)
    })
  }

  incrementColorFunctionIndex () {
    let nextIndex = this.state.colorFunctionIndex + 1
    if (nextIndex >= this.state.colorFunctions.length) {
      nextIndex = 0
    }
    this.setState({colorFunctionIndex: nextIndex })
  }

  decrementColorFunctionIndex () {
    let prevIndex = this.state.colorFunctionIndex - 1
    if (prevIndex < 0) {
      prevIndex = this.state.colorFunctions.length - 1
    }
    this.setState({colorFunctionIndex: prevIndex})
  }

  addCircle () {
    this.setState({circles: Math.min(this.state.circles + 1, 10) })
  }

  removeCircle () {
    this.setState({circles: Math.max(this.state.circles -1, 2) })
  }

  togglePaper() {
    this.setState({paper: this.state.paper ? 0 : 0.1})
  }

  handleSave () {
    const svgData = document.getElementsByTagName('svg')[0].outerHTML   
    const link = document.createElement('a')
    
    var svgBlob = new Blob([svgData], { type:"image/svg+xml;charset=utf-8" })
    var svgURL = URL.createObjectURL(svgBlob)
    link.href = svgURL 

    link.setAttribute('download', `swirl.svg`)
    link.click()
  }

}

class ColorPicker extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      color: props.color,
      displayColorPicker: props.displayColorPicker,
      disableAlpha: props.disableAlpha
    }
  }

  handleClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  };

  handleClose = () => {
    this.setState({ displayColorPicker: false })
    if (this.props.handleClose) {
      this.props.handleClose()
    }
  };

  handleChange = (color) => {
    this.setState({ color: color.rgb })
    this.props.handleChange(color)
  };

  render () {

    const styles = reactCSS({
      'default': {
        color: {
          background: this.state.disableAlpha ?
                `rgb(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b })` :
                `rgba(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b },  ${ this.state.color.a })`,
        },
        popover: {
          position: 'absolute',
          zIndex: '10',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    })

    return (
      <div className='color-picker'>
        <div className='swatch' onClick={ this.handleClick }>
          <div className='color' style={ styles.color } />
        </div>
        { this.state.displayColorPicker ? <div style={ styles.popover }>
          <div style={ styles.cover } onClick={ this.handleClose }/>
          <SketchPicker color={ this.state.color } onChange={ this.handleChange } disableAlpha={this.state.disableAlpha} />
        </div> : null }
      </div>
    )
  }
}

export default App;
