// Forked version of https://opensource.zalando.com/tech-radar/
import * as d3 from "d3";

export function setup_tech_radar_chart(config) {

    // custom random number generator, to make random sequence reproducible
    // source: https://stackoverflow.com/questions/521295
    var seed = 42;
    function random() {
      var x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    }
  
    function random_between(min, max) {
      return min + random() * (max - min);
    }
  
    function normal_between(min, max) {
      return min + (random() + random()) * 0.5 * (max - min);
    }
  
    // radial_min / radial_max are multiples of PI
    const quadrants = [
      { radial_min: 0, radial_max: 0.5, factor_x: 1, factor_y: 1 },
      { radial_min: 0.5, radial_max: 1, factor_x: -1, factor_y: 1 },
      { radial_min: -1, radial_max: -0.5, factor_x: -1, factor_y: -1 },
      { radial_min: -0.5, radial_max: 0, factor_x: 1, factor_y: -1 }
    ];
  
    const rings = [
      { radius: 170 },
      { radius: 260 },
      { radius: 340 },
      { radius: 400 }
    ];
  
    const legend_offset = [
      { x: 300, y: 300, rotate: -45 },
      { x: -300, y: 300, rotate: 45 },
      { x: -300, y: -300, rotate: -45 },
      { x: 300, y: -300, rotate: 45 }
    ];
  
    function polar(cartesian) {
      var x = cartesian.x;
      var y = cartesian.y;
      return {
        t: Math.atan2(y, x),
        r: Math.sqrt(x * x + y * y)
      }
    }
  
    function cartesian(polar) {
      return {
        x: polar.r * Math.cos(polar.t),
        y: polar.r * Math.sin(polar.t)
      }
    }
  
    function bounded_interval(value, min, max) {
      var low = Math.min(min, max);
      var high = Math.max(min, max);
      return Math.min(Math.max(value, low), high);
    }
  
  
    function bounded_ring(polar, r_min, r_max) {
      return {
        t: polar.t,
        r: bounded_interval(polar.r, r_min, r_max)
      }
    }
  
    function bounded_box(point, min, max) {
      return {
        x: bounded_interval(point.x, min.x, max.x),
        y: bounded_interval(point.y, min.y, max.y)
      }
    }
  
    function segment(quadrant, ring) {
      var polar_min = {
        t: quadrants[quadrant].radial_min * Math.PI,
        r: ring == 0 ? 30 : rings[ring - 1].radius
      };
      var polar_max = {
        t: quadrants[quadrant].radial_max * Math.PI,
        r: rings[ring].radius
      };
      var cartesian_min = {
        x: 30 * quadrants[quadrant].factor_x,
        y: 30 * quadrants[quadrant].factor_y
      };
      var cartesian_max = {
        x: rings[3].radius * quadrants[quadrant].factor_x,
        y: rings[3].radius * quadrants[quadrant].factor_y
      };
      return {
        clipx: function(d) {
          var c = bounded_box(d, cartesian_min, cartesian_max);
          var p = bounded_ring(polar(c), polar_min.r + 30, polar_max.r - 30);
          d.x = cartesian(p).x; // adjust data too!
          return d.x;
        },
        clipy: function(d) {
          var c = bounded_box(d, cartesian_min, cartesian_max);
          var p = bounded_ring(polar(c), polar_min.r + 30, polar_max.r - 30);
          d.y = cartesian(p).y; // adjust data too!
          return d.y;
        },
        random: function() {
          return cartesian({
            t: random_between(polar_min.t, polar_max.t),
            r: normal_between(polar_min.r, polar_max.r)
          });
        }
      }
    }
  
    // position each entry randomly in its segment
    for (var i = 0; i < config.entries.length; i++) {
      var entry = config.entries[i];
      entry.segment = segment(entry.quadrant, entry.ring);
      var point = entry.segment.random();
      entry.x = point.x;
      entry.y = point.y;
      entry.color = config.rings[entry.ring].color;
      entry.text_color = config.rings[entry.ring].text_color
    }
  
    // partition entries according to segments
    var segmented = new Array(4);
    for (var quadrant = 0; quadrant < 4; quadrant++) {
      segmented[quadrant] = new Array(4);
      for (var ring = 0; ring < 4; ring++) {
        segmented[quadrant][ring] = [];
      }
    }
    for (var i=0; i<config.entries.length; i++) {
      var entry = config.entries[i];
      segmented[entry.quadrant][entry.ring].push(entry);
    }
  
    // assign unique sequential id to each entry
    var id = 1;
    for (var quadrant of [2,3,1,0]) {
      for (var ring = 0; ring < 4; ring++) {
        var entries = segmented[quadrant][ring];
        entries.sort(function(a,b) { return a.label.localeCompare(b.label); })
        for (var i=0; i<entries.length; i++) {
          entries[i].id = "" + id++;
        }
      }
    }
  
    function translate(x, y) {
      return "translate(" + x + "," + y + ")";
    }

    function rotate(angle) {
      return "rotate(" + angle + ")";
    }

    const WIDTH = 850;
    const HEIGHT = 850;
    var svg = d3.select("svg#" + config.svg_id)
      .style("background-color", config.colors.background)
      .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);
  
    var radar = svg.append("g");
    radar.attr("transform", translate(WIDTH / 2, HEIGHT / 2));
  
    var grid = radar.append("g");
  
    // draw grid lines
    grid.append("line")
      .attr("x1", 0).attr("y1", -400)
      .attr("x2", 0).attr("y2", 400)
      .style("stroke", config.colors.grid)
      .style("stroke-width", 1);
    grid.append("line")
      .attr("x1", -400).attr("y1", 0)
      .attr("x2", 400).attr("y2", 0)
      .style("stroke", config.colors.grid)
      .style("stroke-width", 1);
  
    // draw rings
    for (var i = 0; i < rings.length; i++) {
      grid.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", rings[i].radius)
        .style("fill", "none")
        .style("stroke", config.colors.grid)
        .style("stroke-width", 1);
      grid.append("text")
        .text(config.rings[i].name)
        .attr("y", -rings[i].radius + 30)
        .attr("text-anchor", "middle")
        .style("fill", config.rings[i].text_color)
        .style("font-family", "Arial, Helvetica")
        .style("font-size", 22)
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .style("user-select", "none");
    }

    // legend
    var legend = radar.append("g");
    for (var quadrant = 0; quadrant < 4; quadrant++) {
      legend.append("text")
        .attr("transform", translate(
          legend_offset[quadrant].x,
          legend_offset[quadrant].y
        ) + rotate(legend_offset[quadrant].rotate))
        .attr("text-anchor", "middle")
        .text(config.quadrants[quadrant].name)
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "22");
    }
  
    // layer for entries
    var rink = radar.append("g")
      .attr("id", "rink");
  
    // draw blips on radar
    var blips = rink.selectAll(".blip")
      .data(config.entries)
      .enter()
        .append("g")
          .attr("class", "blip");
  
    // configure each blip
    blips.each(function(d) {
      var blip = d3.select(this);
  
      // blip shape
      if (d.moved > 0) {
        blip.append("path")
          .attr("d", "M -14,10 14,10 0,-14 z") // triangle pointing up
          .style("fill", d.color);
      } else if (d.moved < 0) {
        blip.append("path")
          .attr("d", "M -14,-14 14,-14 0,10 z") // triangle pointing down
          .style("fill", d.color);
      } else {
        blip.append("circle")
          .attr("r", 12)
          .attr("fill", d.color);
      }
  
      // blip text
      blip.append("text")
        .text(d.label)
        .attr("y", 23)
        .attr("text-anchor", "middle")
        .style("fill", d.text_color)
        .style("font-family", "Arial, Helvetica")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .style("user-select", "none");
    });
  
    // make sure that blips stay inside their segment
    function ticked() {
      blips.attr("transform", function(d) {
        return translate(d.segment.clipx(d), d.segment.clipy(d));
      })
    }
  
    // distribute blips, while avoiding collisions
    d3.forceSimulation()
      .nodes(config.entries)
      .velocityDecay(0.19) // magic number (found by experimentation)
      .force("collision", d3.forceCollide().radius(12).strength(0.85))
      .on("tick", ticked);
  }
