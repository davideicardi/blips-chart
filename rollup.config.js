import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: 'src/main.js',
    output: {
        name: "blips_chart",
        file: 'dist/blips-chart.js',
        format: 'es'
    },
    plugins: [nodeResolve()]
};