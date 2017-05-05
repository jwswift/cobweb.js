// cobweb.js

function HtmlTheme(background, text){
    this.background=background; // HTML background color
    this.text=text; // HTML text color
}

// This defines how the graph should look.
function GraphTheme(fill,border,draw){
    this.fill=fill; // canvas fill color
    this.border=border; // canvas border color
    if(typeof draw=='array'){ // array of colors to draw with
        this.draw=draw;
    }else{
        this.draw=[draw];
    }
    this.style='source-over'; // for use with ctx.globalCompositeOperation
}

var brightGraph=new GraphTheme('rgb(255,255,255)','rgb(0,128,0)','rgb(0,0,0)');
var darkGraph=new GraphTheme('rgb(0,0,0)','rgb(0,128,0)','rgb(128,128,128)');

// A graph for drawing mathy things.
function Graph(canvas,theme,xmin,ymin,xmax,ymax){
    var vars=['canvas','theme','xmin','ymin','xmax','ymax'];
    for(var i in vars){
        eval("var "+vars[i]+"="+vars[i]);
    }
    var ctx=canvas.getContext('2d');
    var h=canvas.height;
    var w=canvas.width;
    var borderSize=2; // a differently-colored area at the outermost part of the canvas to visually indicate the graph's border
    if(2*borderSize>h || 2*borderSize>w){ // disable border if it's going to be too big
        borderSize=0;
    }
    var edgeSize=borderSize+0.5; // This small buffer zone close to the border keeps the graph from going half a pixel too far, at least in Firefox.

    // Change the theme for future actions.
    this.changeTheme=function(newTheme){
        theme=newTheme;
    }

    // Blank out the canvas to a pristine state.
    this.resetCanvas=function(){
        ctx.fillStyle=theme.border;
        ctx.fillRect(0,0,w,h);
        ctx.fillStyle=theme.fill;
        ctx.fillRect(borderSize,borderSize,w-2*borderSize,h-2*borderSize);
        ctx.strokeStyle=theme.draw
    }

    // convert a mathematical x coordinate to a canvas x coordinate
    function mathToCanvasX(x){
        max=w-edgeSize*2;
        portion=(x-xmin)/(xmax-xmin);
        return portion*max+edgeSize;
    }
    // convert a mathematical y coordinate to a canvas y coordinate
    function mathToCanvasY(y){
        max=w-edgeSize*2;
        portion=(y-ymin)/(ymax-ymin);
        return h-(portion*max+edgeSize);
    }

    // Plot a line segment, using math function x and y coordinates (not canvas coordinates).
    this.plotLine=function(x1,y1,x2,y2){
        // convert coordinates
        var cx1=mathToCanvasX(x1);
        var cy1=mathToCanvasY(y1);
        var cx2=mathToCanvasX(x2);
        var cy2=mathToCanvasY(y2);

        // plot the line segment
        ctx.beginPath();
        ctx.moveTo(cx1,cy1);
        ctx.lineTo(cx2,cy2);
        ctx.stroke();
        ctx.closePath();
    }

    // Plot a function.
    this.plotFunction=function(f){
        // get initial point and distance between points
        x1=xmin;
        y1=f(x1);
        delta=(xmax-xmin)/(w-2*borderSize);
        // Go thru all point values, with 'delta/2' to avoid rounding error preventing the last point from being drawn.
        // Note: Altho "<" vs "<=" is irrelevant with probability 1, only "<" avoids an infinite loop when xmin==xmax, like when their both zero from nothing being entered.
        for(var x2=xmin+delta;x2<xmax+delta/2;x2+=delta){
            y2=f(x2);
            this.plotLine(x1,y1,x2,y2);
            x1=x2;
            y1=y2;
        }
    }
}

// helper function for debugging
function log(message) {
    // Note: Getting the line number like this is very browser-specific. This is only tested in Firefox 53 on Linux.
    line=new Error().stack.split('\n')[1].split(':').reverse().splice(0,2).reverse().join(':');
    console.log(line+": "+message);
}

// Convenience function for getting elements by ID.
function get(name) {
    return document.getElementById(name);
}

// Convenience function for getting text from a text box
function getValue(name){
    return get(name).value;
}

// Parse a mathematical function into a JavaScript function
function parseFunction(func){
    // It's tempting to use "return function(x){return eval(func);};", but that takes about 30% longer.
    eval("var f=function(x){return "+func+";};");
    return f;
}

// Generate the requested cobweb diagram.
function generate() {
    startTime=Date.now();
    
    // get parameters by ID
    var vars=['xmin','xmax','ymin','ymax','x1','iters']
    for(var i in vars){
        var v=vars[i];
        var cmd='var '+v+'=Number(getValue("'+v+'"));'
        eval(cmd);
    }

    // parse function
    var func=parseFunction(getValue('func'));

    // get convas and make graph
    var canvas=get('canvas');
    graphTheme=darkGraph;
    //graphTheme=brightGraph;
    var graph=new Graph(canvas,graphTheme,xmin,ymin,xmax,ymax);
    graph.resetCanvas();
    
    // plot function
    graph.plotFunction(func);
    
    // plot y=x to 'reflect' the cobweb lines off of
    graph.plotFunction(function(x){return x});

    // plot cobweb
    var y1=func(x1);
    graph.plotLine(x1,ymin,x1,y1);
    for (var i=0;i<iters;i++){
        var x2=y1;
        var y2=func(x2);
        graph.plotLine(x1,y1,x2,x2);
        graph.plotLine(x2,x2,x2,y2);
        x1=x2;
        y1=y2;
    }
    
    endTime=Date.now();
    log("Diagram generated in "+(endTime-startTime)+" milliseconds.");
}
