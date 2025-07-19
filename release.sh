BRANCH=`git branch --show-current`
npm run version $1 && npm run build && git add . && git commit -a -m "New article" && git push origin ${BRANCH}