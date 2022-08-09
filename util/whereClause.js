// base - Product.find()
// base - Product.find(email: {"n@lco.dev"})

//bigQ - //search=coder&page=2&category=shortsleeves&rating[gte]=4
// &price[lte]=999&price[gte]=199&limit=5

//whereClause is a function that takes in a query object and returns a where clause
class WhereClause {
  constructor(base, bigQ) {
    this.base = base;
    this.bigQ = bigQ;
  }

  //search is used to search the data based on the name
  search() {
    const searchWord = this.bigQ.search
      ? {
          name: {
            //regex is used to search for the word in the name
            $regex: this.bigQ.search,
            //option is used to search for the word in the name
            $options: 'i',
          },
        }
      : {};
    this.base = this.base.find({ ...searchWord });
    return this;
  }

  //filter is used to filter the data based on the category and rating and price range and limit is used to limit the data
  filter() {
    //spread operator is used to spread the object into multiple objects and then merge them into one object
    const copyQ = { ...this.bigQ };
    delete copyQ.search;
    delete copyQ.limit;
    delete copyQ.page;
    //convert bigq to string=>copyQ
    let stringOfCopyQ = JSON.stringify(copyQ);
    //replace is used to replace the string with the object
    stringOfCopyQ = stringOfCopyQ.replace(
      //regex is used to search for the word in the name
      /\b(gte|lte|gt|lt)\b/g,
      //match is used to replace the word with the object
      (match) => `$${match}`
    );
    //convert string to object
    const jsonOfCopyQ = JSON.parse(stringOfCopyQ);
    this.base = this.base.find(jsonOfCopyQ);
    return this;
  }

  //pager is used to paginate the data
  pager(resultperPage) {
    let currentPage = 1;
    if (this.bigQ.page) {
      currentPage = this.bigQ.page;
    }
    const skipVal = resultperPage * (currentPage - 1);
    this.base = this.base.limit(resultperPage).skip(skipVal);
    return this;
  }
}

module.exports = WhereClause;
