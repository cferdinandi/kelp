BRANCH=`git branch --show-current`
npm run version $1 && npm run build && git add . && git commit -a -m "bundle for release" && git push origin ${BRANCH}