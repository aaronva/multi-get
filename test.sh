curl $1 > expected
node multi-get.js $1 actual $2 $3

if `cmp expected actual`
then
  echo "Files same"
else
  echo "Actual differs from expected"
fi
