npx webpack
rm -f dist/bundle.js
latest_file=$(ls -t dist/ | head -n 1)
cp "dist/$latest_file" dist/bundle.js
