// Tech radar chart
// Forked version of https://opensource.zalando.com/tech-radar/

import * as d3 from "d3";

const WIDTH = 850;
const HEIGHT = 850;
const LEGEND_FONTSIZE = 18;
const BLIPS_FONTSITE = 12;

// custom random number generator, to make random sequence reproducible
let seed = 42;
function random() {
  let x = Math.sin(seed++) * 10000;
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
  let x = cartesian.x;
  let y = cartesian.y;
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
  let low = Math.min(min, max);
  let high = Math.max(min, max);
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
  let polar_min = {
    t: quadrants[quadrant].radial_min * Math.PI,
    r: ring == 0 ? 30 : rings[ring - 1].radius
  };
  let polar_max = {
    t: quadrants[quadrant].radial_max * Math.PI,
    r: rings[ring].radius
  };
  let cartesian_min = {
    x: 10 * quadrants[quadrant].factor_x,
    y: 10 * quadrants[quadrant].factor_y
  };
  let cartesian_max = {
    x: rings[3].radius * quadrants[quadrant].factor_x,
    y: rings[3].radius * quadrants[quadrant].factor_y
  };
  return {
    clipx: function (d) {
      let c = bounded_box(d, cartesian_min, cartesian_max);
      let p = bounded_ring(polar(c), polar_min.r + 10, polar_max.r - 10);
      d.x = cartesian(p).x; // adjust data too!
      return d.x;
    },
    clipy: function (d) {
      let c = bounded_box(d, cartesian_min, cartesian_max);
      let p = bounded_ring(polar(c), polar_min.r + 10, polar_max.r - 10);
      d.y = cartesian(p).y; // adjust data too!
      return d.y;
    },
    random: function () {
      return cartesian({
        t: random_between(polar_min.t, polar_max.t),
        r: normal_between(polar_min.r, polar_max.r)
      });
    }
  }
}

function onBlipClick(blip) {
  location.href = blip.url;
}

export function create_chart(config) {
  if (config.rings.length != 4) {
    throw Error("Expected 4 rings")
  }
  if (config.quadrants.length != 4) {
    throw Error("Expected 4 quadrants")
  }
  config.onBlipClick = config.onBlipClick || onBlipClick;

  const quadrant_by_name = {};
  for (let i = 0; i < 4; i++) {
    quadrant_by_name[config.quadrants[i].name] = i;
  }
  const ring_by_name = {};
  for (let i = 0; i < 4; i++) {
    ring_by_name[config.rings[i].name] = i;
  }

  // position each entry randomly in its segment
  for (let i = 0; i < config.entries.length; i++) {
    let entry = config.entries[i];
    entry.ring_index = ring_by_name[entry.ring];
    if (entry.ring_index === undefined) {
      console.log("Entry ring not valid", entry);
    }
    entry.quadrant_index = quadrant_by_name[entry.quadrant];
    if (entry.quadrant_index === undefined) {
      console.log("Entry quadrant not valid", entry);
    }
    entry.segment = segment(entry.quadrant_index, entry.ring_index);
    let point = entry.segment.random();
    entry.x = point.x;
    entry.y = point.y;
    entry.color = config.rings[entry.ring_index].color;
    entry.text_color = config.rings[entry.ring_index].text_color
  }

  // partition entries according to segments
  let segmented = new Array(4);
  for (let quadrant = 0; quadrant < 4; quadrant++) {
    segmented[quadrant] = new Array(4);
    for (let ring = 0; ring < 4; ring++) {
      segmented[quadrant][ring] = [];
    }
  }
  for (let i = 0; i < config.entries.length; i++) {
    let entry = config.entries[i];
    segmented[entry.quadrant_index][entry.ring_index].push(entry);
  }

  function translate(x, y) {
    return "translate(" + x + "," + y + ")";
  }

  function rotate(angle) {
    return "rotate(" + angle + ")";
  }

  let svg = d3.select("svg#" + config.svg_id);

  let radar = svg.append("g");
  radar.attr("transform", translate(WIDTH / 2, HEIGHT / 2));

  let grid = radar.append("g");

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
  const ringsLabels = [];
  for (let i = 0; i < rings.length; i++) {
    grid.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", rings[i].radius)
      .style("fill", "none")
      .style("stroke", config.colors.grid)
      .style("stroke-width", 1);
    const ringLabelX = 0;
    const ringLabelY = -rings[i].radius + LEGEND_FONTSIZE;
    const ringLabel = grid.append("text")
      .text(config.rings[i].title || config.rings[i].name)
      .attr("y", ringLabelY)
      .attr("text-anchor", "middle")
      .style("fill", config.rings[i].text_color)
      .style("font-family", "Arial, Helvetica")
      .style("font-size", `${LEGEND_FONTSIZE}px`)
      .style("font-weight", "bold")
      .style("pointer-events", "none")
      .style("user-select", "none");
    // calculate label size for collision detection
    const boundingBox = ringLabel.node().getBBox();    

    ringsLabels.push({
      x: ringLabelX,
      y: ringLabelY,
      fx: ringLabelX,
      fy: ringLabelY,
      boundingBox: boundingBox
    })
  }

  // draw quadrants
  let legend = radar.append("g");
  for (let quadrant = 0; quadrant < 4; quadrant++) {
    legend.append("text")
      .attr("transform", translate(
        legend_offset[quadrant].x,
        legend_offset[quadrant].y
      ) + rotate(legend_offset[quadrant].rotate))
      .attr("text-anchor", "middle")
      .text(config.quadrants[quadrant].title || config.quadrants[quadrant].name)
      .style("fill", config.quadrants[quadrant].text_color)
      .style("font-family", "Arial, Helvetica")
      .style("font-size", `${LEGEND_FONTSIZE}px`);
  }

  // layer for entries
  let rink = radar.append("g")
    .attr("id", "rink");

  // draw blips on radar
  let blips = rink.selectAll(".blip")
    .data(config.entries)
    .enter()
    .append("g")
    .attr("class", "blip");

  // configure each blip
  blips.each(function (d) {
    let blip = d3.select(this);

    // blip shape
    let blipShape;
    if (d.moved > 0) {
      blipShape = blip.append("path")
        .attr("d", "M -8,8 8,8 0,-8 z"); // triangle pointing up
    } else if (d.moved < 0) {
      blipShape = blip.append("path")
        .attr("d", "M -8,-8 8,-8 0,8 z"); // triangle pointing down
    } else {
      blipShape = blip.append("circle")
        .attr("r", 8);
    }
    blipShape
      .attr("transform", translate(0, -BLIPS_FONTSITE)) // put the shape above the text
      .style("fill", d.color);


    // blip text
    blip.append("text")
      .text(d.title)
      .attr("y", BLIPS_FONTSITE / 2) // put the text on the center
      .attr("text-anchor", "middle")
      .style("fill", d.text_color)
      .style("font-family", "Arial, Helvetica")
      .style("font-size", `${BLIPS_FONTSITE}px`)
      .style("font-weight", "bold");

    // tooltip
    blip.append("title")
      .text(d.longTitle || d.title);

    if (d.url && config.onBlipClick) {
      blip
        .style("cursor", "pointer")
        .on("click", function (e) {
          config.onBlipClick(d);
        });
    }

    // calculate blip total size
    d.boundingBox = blip.node().getBBox();

    // // draw bounding box circle (for debugging collision)
    // blip.append("circle")
    //   .attr("r", d.boundingBox.width / 2 + 2)
    //   .style("fill", "none")
    //   .style("stroke", "yellow")
    //   .style("stroke-width", 1);    
  });

  // make sure that blips stay inside their segment
  function ticked() {
    blips.attr("transform", function (d) {
      return translate(d.segment.clipx(d), d.segment.clipy(d));
    })
  }

  // distribute blips, while avoiding collisions
  d3.forceSimulation()
    .nodes([...config.entries, ...ringsLabels])
    .velocityDecay(0.19) // magic number (found by experimentation)
    .force("collision", d3.forceCollide().radius(d => Math.max(20, d.boundingBox.width / 2 + 2)).strength(0.85))
    .on("tick", ticked);
}
