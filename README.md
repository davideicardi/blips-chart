# blips-chart

Tech Radar Chart using D3.js

![screenshot](https://github.com/davideicardi/blips-chart/blob/main/docs/blibs-chart.png?raw=true)

## Usage

```html
<style>
/* minimal style */
#radar .grid {
    stroke: black;
}
#radar .grid text {
    stroke: none;
}
</style>

<svg id="radar" version="1.1" viewBox="0 0 850 850"></svg>

<script type="module">
    // omit the version completely to get the latest one
    // you should NOT use this in production
    // instead use: https://cdn.jsdelivr.net/npm/blips-chart@YOUR_VERSION/dist/blips-chart.js
    import { create_chart } from 'https://cdn.jsdelivr.net/npm/blips-chart/dist/blips-chart.js';
    const quadrants = [
        { name: "DATA" },
        { name: "PLATFORMS" },
        { name: "PATTERNS" },
        { name: "LANGUAGES" },
    ];
    const rings = [
        { name: "ADOPT" },
        { name: "TRIAL" },
        { name: "ASSESS" },
        { name: "HOLD" }
    ];
    const blips = [
        {
            name: "azuredevops",
            title: "Azure DevOps",
            quadrant: "PLATFORMS",
            ring: "HOLD",
            moved: 0
        },
        {
            name: "dotnetcore",
            title: ".NET Core",
            quadrant: "LANGUAGES",
            ring: "ADOPT",
            moved: 0,
            url: "https://dotnet.microsoft.com/"
        },
        {
            name: "eventsourcing",
            title: "EventSourcing",
            quadrant: "PATTERNS",
            ring: "TRIAL",
            moved: -1
        },
        {
            name: "cqrs",
            title: "CQRS",
            quadrant: "PATTERNS",
            ring: "ADOPT",
            moved: 0
        },
        {
            name: "kafka",
            title: "Kafka",
            quadrant: "DATA",
            ring: "TRIAL",
            moved: 1,
            url: "https://kafka.apache.org/"
        },
        {
            name: "strapi",
            title: "Strapi",
            quadrant: "DATA",
            ring: "ASSESS",
            moved: -1
        },
        {
            name: "deno",
            title: "Deno",
            quadrant: "LANGUAGES",
            ring: "ASSESS",
            moved: 0
        },
        {
            name: "docker",
            title: "Docker",
            quadrant: "PLATFORMS",
            ring: "ADOPT",
            moved: 0
        },
    ];

    create_chart({
        svg_id: "radar",
        quadrants: quadrants,
        rings: rings,
        entries: blips,
    });
</script>
```

Styles can be configured via CSS, here an example:

```css
#radar {
    background-color: #1d1d1d;
    font-family: Arial, Helvetica, sans-serif;
}

#radar .grid {
    stroke: #ddd;
}
#radar .grid text {
    stroke: none;
}
#radar .grid .quadrants text {
    fill: #ddd;
}
#radar .ring-HOLD {
    fill: #f75258;
}
#radar .ring-ASSESS {
    fill: #6f58c4;
}
#radar .ring-TRIAL {
    fill: #5371f7;
}
#radar .ring-ADOPT {
    fill: #54f6d1;
}
#radar .moved .shape {
    stroke: #f8f566;
    stroke-width: 2px;
}
```


### Examples

- [jsfiddle](https://jsfiddle.net/z1mg0L5n/)
- `./examples` folder
    - minimal radar: `./examples/simple-radar.html`
    - standard radar with style and legend: `./examples/standard-radar.html`
    - many random blips: `./examples/random-blips.html`
