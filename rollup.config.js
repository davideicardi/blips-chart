import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: 'src/main.js',
    output: {
        name: "tech_radar_chart",
        file: 'dist/bundle.js',
        format: 'es'
    },
    plugins: [nodeResolve()]
};