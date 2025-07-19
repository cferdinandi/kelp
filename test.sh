BRANCH=`git branch --show-current`
git add . && git commit -a -m "test commit" && git push origin ${BRANCH}