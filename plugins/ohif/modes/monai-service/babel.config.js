/*
Copyright (c) 2021-2022, NVIDIA CORPORATION.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

module.exports = {
  plugins: ['inline-react-svg', '@babel/plugin-proposal-class-properties'],
  env: {
    test: {
      presets: [
        [
          // TODO: https://babeljs.io/blog/2019/03/19/7.4.0#migration-from-core-js-2
          '@babel/preset-env',
          {
            modules: 'commonjs',
            debug: false,
          },
          "@babel/preset-typescript",
        ],
        '@babel/preset-react',
      ],
      plugins: [
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-transform-regenerator',
        '@babel/plugin-transform-runtime',
      ],
    },
    production: {
      presets: [
        // WebPack handles ES6 --> Target Syntax
        ['@babel/preset-env', { modules: false }],
        '@babel/preset-react',
        "@babel/preset-typescript",
      ],
      ignore: ['**/*.test.jsx', '**/*.test.js', '__snapshots__', '__tests__'],
    },
    development: {
      presets: [
        // WebPack handles ES6 --> Target Syntax
        ['@babel/preset-env', { modules: false }],
        '@babel/preset-react',
        "@babel/preset-typescript",
      ],
      plugins: ['react-hot-loader/babel'],
      ignore: ['**/*.test.jsx', '**/*.test.js', '__snapshots__', '__tests__'],
    },
  },
};
