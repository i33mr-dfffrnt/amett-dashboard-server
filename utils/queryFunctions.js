class QueryFunctions {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // nearMe() {

  // }

  filter() {
    // 1A) Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Dealing with the $in operator
    // category[in]=Parks,Malls,Mountains => category: { in: [ 'Parks', 'Malls', 'Mountains' ]
    Object.keys(queryObj).forEach((key) => {
      if (queryObj[key].in) {
        queryObj[key].in = queryObj[key].in.split(",");
      }
    });
    console.log(queryObj);
    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in)\b/g, (match) => `$${match}`);
    console.log(queryStr);

    this.query.find(JSON.parse(queryStr));
    console.log(queryStr);

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      // console.log(this.queryString.sort);
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-date _id");
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  paginate() {
    // const page = this.queryString.page * 1 || 1;
    // const limit = this.queryString.limit * 1 || 100;
    // const skip = (page - 1) * limit;
    // this.query.skip(skip).limit(limit)

    this.queryString.limit ? (this.query = this.query.limit(this.queryString.limit)) : null;
    // handling if the page number exceeds what should be
    // NOT NEEDED
    return this;
  }

  async populateModelsWithTypes(modelTypesCollection, modelsCollection) {
    const pipeline = [
      {
        $limit: 6, // Limit to 6 model types
      },
      {
        $lookup: {
          from: modelsCollection.collectionName,
          let: { typeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$type", "$$typeId"] },
              },
            },
            { $project: { name: 1, _id: 1 } },
            { $limit: 3 },
          ],
          as: "models",
        },
      },
      {
        $project: {
          Head: "$name",
          headLink: { $concat: ["/products?categoryId=", { $toString: "$_id" }] },
          sublink: {
            $map: {
              input: "$models",
              as: "model",
              in: {
                name: "$$model.name",
                link: { $concat: ["/product/", { $toString: "$$model._id" }] },
              },
            },
          },
        },
      },
    ];

    return await modelTypesCollection.aggregate(pipeline).toArray();
  }

  async populateServicesWithTypes(modelTypesCollection, modelsCollection) {
    const pipeline = [
      {
        $limit: 6, // Limit to 6 model types
      },
      {
        $lookup: {
          from: modelsCollection.collectionName,
          let: { typeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$type", "$$typeId"] },
              },
            },
            { $project: { name: 1, _id: 1 } },
            { $limit: 3 },
          ],
          as: "models",
        },
      },
      {
        $project: {
          Head: "$name",
          headLink: { $concat: ["/services?categoryId=", { $toString: "$_id" }] },
          sublink: {
            $map: {
              input: "$models",
              as: "model",
              in: {
                name: "$$model.name",
                link: { $concat: ["/service/", { $toString: "$$model._id" }] },
              },
            },
          },
        },
      },
    ];

    return await modelTypesCollection.aggregate(pipeline).toArray();
  }
}

module.exports = QueryFunctions;
