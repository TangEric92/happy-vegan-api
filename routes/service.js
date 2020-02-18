const express = require("express");
const router = express.Router();
const Service = require("../models/Service");

router.post("/publish", async (req, res) => {
  try {
    const title = req.body.title;
    const description = req.body.description;
    const photos = req.body.photos;
    const price = req.body.price;
    const review = req.body.review;
    if (title && description && price) {
      const service = new Service({
        title: title,
        description: description,
        photos: photos,
        price: price
        //rating.: review  add reviews
      });
      await service.save();
      res.json(service);
    } else {
      res.status(400).json({ error: "Wrong parameters" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.query.id;
  try {
    const service = await Service.find();
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const createFilters = req => {
  const filters = {};

  // if (req.query.city) {
  // 	filters.city = req.query.city;
  // }
  return filters;
};

router.get("/", async (req, res) => {
  try {
    const filters = createFilters(req);
    const search = Service.find(filters);
    if (req.query.page) {
      const page = req.query.page;
      const limit = 2;
      search.limit(limit).skip(limit * page);
    }
    const services = await search;
    res.json(services);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
